import { storage } from "./storage.js";
import { executeMCPTool } from "./mcp.js";
import { createOllamaClient } from "./ollama.js";
import { OllamaRequest } from "./mcp/types.js";

interface RoutingInput {
  userMessage: string;
  userId: number;
  conversationContext: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

interface RoutingDecision {
  tools: string[];
  reasoning: string;
  confidence: number;
}

/**
 * MCP Routing Service for determining which MCP tools to use based on user messages
 */
class MCPRoutingService {
  /**
   * Route a user request to appropriate MCP tools
   */
  async routeRequest(input: RoutingInput): Promise<RoutingDecision> {
    const { userMessage, userId, conversationContext } = input;
    
    try {
      // Get user settings to determine which tools are enabled
      const settings = await storage.getSettings(userId);
      if (!settings) {
        throw new Error('User settings not found');
      }
      
      const enabledTools: string[] = Array.isArray(settings.enabledMcpTools) ? settings.enabledMcpTools : [];
      if (enabledTools.length === 0) {
        // No tools enabled, return empty decision
        return {
          tools: [],
          reasoning: "No MCP tools are enabled in user settings",
          confidence: 1.0
        };
      }
      
      // Use Ollama to make routing decisions
      // This provides intelligent tool selection based on the message content
      const ollamaClient = createOllamaClient(settings.ollamaUrl);
      
      // Create prompt for tool selection
      const toolNames = enabledTools.join(", ");
      const prompt = `
Given the user message: "${userMessage}"

Please determine which of the following tools would be most relevant for answering this query:
${toolNames}

Consider the user's intent, the information required to answer, and any specialized knowledge needed.
Respond with a JSON object that has these fields:
- tools: An array of tool names that should be used (empty if none are relevant)
- reasoning: A brief explanation of your decision
- confidence: A number between 0 and 1 indicating your confidence level
`;
      
      // Call Ollama for decision making
      try {
        const completion = await ollamaClient.chat({
          model: settings.ollamaModel || 'qwen3:14b',
          messages: [
            { role: 'system', content: 'You are a tool dispatcher that determines which tools to use for a given query.' },
            { role: 'user', content: prompt }
          ]
          // Note: format: 'json' removed as it's not in OllamaRequest type
        });
        
        // Parse the response
        let result;
        try {
          // Extract JSON from completion
          const content = completion.message?.content || '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse JSON from Ollama response');
          }
        } catch (parseError) {
          console.error('Failed to parse Ollama response:', parseError);
          // Fallback to simple heuristic routing
          return this.heuristicRouting(userMessage, enabledTools);
        }
        
        // Validate the response
        if (!result || !Array.isArray(result.tools)) {
          return this.heuristicRouting(userMessage, enabledTools);
        }
        
        // Filter to ensure only enabled tools are included
        const filteredTools = result.tools.filter((tool: string) => enabledTools.includes(tool));
        
        return {
          tools: filteredTools,
          reasoning: result.reasoning || 'Based on semantic analysis of the query',
          confidence: typeof result.confidence === 'number' ? result.confidence : 0.7
        };
      } catch (ollamaError) {
        console.error('Ollama routing error:', ollamaError);
        // Fallback to heuristic routing if Ollama call fails
        return this.heuristicRouting(userMessage, enabledTools);
      }
    } catch (error) {
      console.error('MCP routing error:', error);
      // Return an empty decision in case of errors
      return {
        tools: [],
        reasoning: "Error occurred during routing",
        confidence: 0
      };
    }
  }
  
  /**
   * Simple heuristic-based routing when LLM-based routing fails
   */
  private heuristicRouting(message: string, enabledTools: string[]): RoutingDecision {
    const lowerMessage = message.toLowerCase();
    const selectedTools: string[] = [];
    
    // Simple keyword matching
    if (enabledTools.includes('web-search') && 
        (lowerMessage.includes('search') || lowerMessage.includes('find') || 
         lowerMessage.includes('look up') || lowerMessage.includes('internet'))) {
      selectedTools.push('web-search');
    }
    
    if (enabledTools.includes('memory-retrieve') && 
        (lowerMessage.includes('remember') || lowerMessage.includes('recall') || 
         lowerMessage.includes('past') || lowerMessage.includes('previous'))) {
      selectedTools.push('memory-retrieve');
    }
    
    if (enabledTools.includes('health-analysis') && 
        (lowerMessage.includes('health') || lowerMessage.includes('sleep') || 
         lowerMessage.includes('heart') || lowerMessage.includes('exercise'))) {
      selectedTools.push('health-analysis');
    }
    
    return {
      tools: selectedTools,
      reasoning: "Based on keyword matching",
      confidence: 0.5
    };
  }
}

// Export a singleton instance
export const mcpRoutingService = new MCPRoutingService();

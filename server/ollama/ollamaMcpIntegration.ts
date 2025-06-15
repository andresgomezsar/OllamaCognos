/**
 * Ollama MCP Integration
 * 
 * This module provides the integration between Ollama's function calling capabilities
 * and the MCP servers. It enables Ollama to retrieve data from MCP tools and use that
 * information in chat responses.
 */
import { v4 as uuidv4 } from 'uuid';
import { mcpServers } from '../mcp/mcpRouter';
import { ouraTools } from '../mcp/oura/ouraTools';
import { executeMCPTool } from '../mcp/mcpUtils';
import { OllamaClient } from '../ollama';
import { Tool } from '../mcp/types';

/**
 * Type definitions for Ollama function calling
 */

// Extended Ollama message type to support function calling
interface OllamaMessage {
  role: string;
  content: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}
export interface OllamaFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface OllamaFunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface OllamaFunctionResponse {
  content: any;
  toolCallId?: string;
}

/**
 * Create function definitions for Ollama based on available MCP tools
 */
export function createMcpFunctionDefinitions(): OllamaFunctionDefinition[] {
  const definitions: OllamaFunctionDefinition[] = [];
  
  // Add Oura functions
  for (const tool of ouraTools) {
    // Transform the MCP tool schema to Ollama function definition
    const definition: OllamaFunctionDefinition = {
      name: `mcp_${tool.name}`,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    };
    
    // Convert input schema to Ollama parameters
    if (tool.inputSchema && tool.inputSchema.properties) {
      for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
        // Cast unknown property to expected shape and use default values if missing
        const typedProp = prop as { type?: string; description?: string; enum?: string[] };
        definition.parameters.properties[key] = {
          type: typedProp.type || 'string',
          description: typedProp.description || ''
        };
        
        // Add enum if available
        if (typedProp.enum) {
          definition.parameters.properties[key].enum = typedProp.enum;
        }
      }
      
      // Add required parameters
      if (tool.inputSchema.required) {
        definition.parameters.required = tool.inputSchema.required;
      }
    }
    
    definitions.push(definition);
  }
  
  // Add more MCP tool definitions here (e.g., Perplexity)
  
  return definitions;
}

/**
 * Process Ollama function calls and route them to MCP servers
 */
export async function processMcpFunctionCall(
  functionCall: OllamaFunctionCall
): Promise<OllamaFunctionResponse> {
  // Parse function name to get MCP server and tool
  const functionNameParts = functionCall.name.split('_');
  
  if (functionNameParts[0] !== 'mcp') {
    throw new Error(`Not an MCP function call: ${functionCall.name}`);
  }
  
  let serverName: string;
  let toolName: string;
  
  if (functionNameParts.length === 3) {
    // Format: mcp_server_tool
    serverName = functionNameParts[1];
    toolName = functionNameParts[2];
  } else {
    // Format: mcp_tool (assume server name is same as tool prefix)
    const toolParts = functionNameParts[1].split('-');
    serverName = toolParts[0];
    toolName = functionNameParts[1];
  }
  
  try {
    // Call the MCP tool
    const result = await executeMCPTool(
      serverName,
      toolName,
      functionCall.arguments
    );
    
    // Format the result for Ollama
    let content = '';
    
    if (result.content) {
      for (const item of result.content) {
        if (item.type === 'text') {
          content += item.text + '\n';
        } else if (item.type === 'json') {
          content += JSON.stringify(item.json, null, 2) + '\n';
        }
      }
    }
    
    return {
      content,
      toolCallId: uuidv4()
    };
  } catch (error: any) {
    return {
      content: `Error: ${error.message || 'Unknown error'}`,
      toolCallId: uuidv4()
    };
  }
}

/**
 * Enhance an Ollama client with MCP function calling capabilities
 */
export function enhanceOllamaWithMcp(ollama: OllamaClient): OllamaClient {
  // Get MCP function definitions
  const mcpFunctions = createMcpFunctionDefinitions();
  
  // Store original chat method
  const originalChat = ollama.chat.bind(ollama);
  
  // Override chat method to include MCP functions
  ollama.chat = async (options: any) => {
    // Add tools to options if not disabled
    if (!options.disableMcpTools) {
      options.tools = [
        ...(options.tools || []),
        ...mcpFunctions
      ];
    }
    
    // Call original method
    const response = await originalChat(options);
    
    // If the response includes a tool call, process it
    const message = response.message as OllamaMessage;
    const toolCalls = message?.tool_calls || [];
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.name.startsWith('mcp_')) {
          try {
            // Process MCP function call
            const functionCallResult = await processMcpFunctionCall({
              name: toolCall.name,
              arguments: JSON.parse(toolCall.arguments)
            });
            
            // Add tool results to messages
            if (!options.messages) options.messages = [];
            
            options.messages.push(response.message);
            options.messages.push({
              role: 'tool',
              name: toolCall.name,
              content: functionCallResult.content,
              tool_call_id: toolCall.id
            });
            
            // Call chat again with updated messages
            return await originalChat({
              ...options,
              disableMcpTools: true // Prevent infinite loop
            });
          } catch (error) {
            console.error('Error processing MCP function call:', error);
          }
        }
      }
    }
    
    return response;
  };
  
  return ollama;
}

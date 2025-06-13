import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OuraMcpServer, createOuraMcpServer } from './oura/ouraMcpServer';
import { InMemoryTokenStore } from './auth/authProvider';
import { SecurityMiddleware } from './auth/securityMiddleware';

// Create an in-memory token store (for development)
const tokenStore = new InMemoryTokenStore();

// Create security middleware
const securityMiddleware = new SecurityMiddleware(tokenStore);

// Create the MCP Router - this will be exported and used in routes.ts
const router = Router();

// Map of MCP servers
export const mcpServers: Record<string, any> = {};

/**
 * Initialize MCP servers with environment variables
 */
export function initMcpServers() {
  // Initialize Oura MCP server with token from environment
  const ouraToken = process.env.OURA_TOKEN;
  if (ouraToken) {
    mcpServers['oura'] = createOuraMcpServer(ouraToken);
    console.log('Oura MCP server initialized');
  } else {
    console.warn('OURA_TOKEN environment variable not found, Oura MCP server not initialized');
  }

  // Initialize other MCP servers here...
}

/**
 * Handle requests to list available MCP servers
 */
router.get('/servers', (req: Request, res: Response) => {
  const servers = Object.keys(mcpServers).map(name => ({
    name,
    status: 'available',
    description: `${name.charAt(0).toUpperCase() + name.slice(1)} MCP server`,
  }));
  
  res.json({ servers });
});

/**
 * Handle requests to list tools for a specific MCP server
 */
router.get('/:server/tools', async (req: Request, res: Response) => {
  const { server } = req.params;
  
  if (!mcpServers[server]) {
    return res.status(404).json({ error: `MCP server '${server}' not found` });
  }
  
  try {
    const response = await mcpServers[server].handleRequest({
      type: 'list_tools',
    });
    
    res.json(response);
  } catch (error) {
    console.error(`Error listing tools for ${server}:`, error);
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

/**
 * Handle requests to list prompts for a specific MCP server
 */
router.get('/:server/prompts', async (req: Request, res: Response) => {
  const { server } = req.params;
  
  if (!mcpServers[server]) {
    return res.status(404).json({ error: `MCP server '${server}' not found` });
  }
  
  try {
    const response = await mcpServers[server].handleRequest({
      type: 'list_prompts',
    });
    
    res.json(response);
  } catch (error) {
    console.error(`Error listing prompts for ${server}:`, error);
    res.status(500).json({ error: 'Failed to list prompts' });
  }
});

/**
 * Handle requests to get a specific prompt
 */
router.get('/:server/prompts/:id', async (req: Request, res: Response) => {
  const { server, id } = req.params;
  
  if (!mcpServers[server]) {
    return res.status(404).json({ error: `MCP server '${server}' not found` });
  }
  
  try {
    const response = await mcpServers[server].handleRequest({
      type: 'get_prompt',
      params: { id },
    });
    
    res.json(response);
  } catch (error) {
    console.error(`Error getting prompt ${id} for ${server}:`, error);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

/**
 * Handle tool calls for a specific MCP server
 */
router.post('/:server/call-tool', 
  securityMiddleware.rateLimit(100, 60000), // Limit to 100 requests per minute
  async (req: Request, res: Response) => {
    const { server } = req.params;
    const { name, arguments: args } = req.body;
    
    if (!mcpServers[server]) {
      return res.status(404).json({ error: `MCP server '${server}' not found` });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }
    
    try {
      const response = await mcpServers[server].handleRequest({
        type: 'call_tool',
        params: {
          name,
          arguments: args || {},
        },
      });
      
      res.json(response);
    } catch (error: unknown) {
      console.error(`Error calling tool ${name} on ${server}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Tool call failed',
        message: errorMessage
      });
    }
});

/**
 * Handle streaming tool calls for a specific MCP server
 */
router.post('/:server/call-tool-stream', 
  securityMiddleware.rateLimit(60, 60000), // Limit to 60 requests per minute for streaming
  async (req: Request, res: Response) => {
    const { server } = req.params;
    const { name, arguments: args } = req.body;
    
    if (!mcpServers[server]) {
      return res.status(404).json({ error: `MCP server '${server}' not found` });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }
    
    try {
      // Set headers for SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Create unique request ID
      const requestId = uuidv4();
      
      // Get streaming handler for this request
      const streamEmitter = mcpServers[server].createStreamingHandler(requestId);
      
      // Set up event listeners
      streamEmitter.on('tool-result', (result: any) => {
        res.write(`data: ${JSON.stringify({ type: 'result', result })}\n\n`);
      });
      
      streamEmitter.on('tool-error', (error: Error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      });
      
      // Handle client disconnect
      req.on('close', () => {
        streamEmitter.emit('end');
        res.end();
      });
      
      // Initiate the tool call
      mcpServers[server].handleRequest({
        type: 'call_tool',
        params: {
          name,
          arguments: args || {},
        },
      }).then((finalResult: any) => {
        // Send final result
        res.write(`data: ${JSON.stringify({ type: 'complete', result: finalResult })}\n\n`);
        res.end();
      }).catch((error: unknown) => {
        // Send error and close connection
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
        res.end();
      });
    } catch (error: unknown) {
      console.error(`Error in streaming tool call ${name} on ${server}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Streaming tool call failed', message: errorMessage }));
    }
});

/**
 * MCP routing service - this resolves the original TypeScript error
 * by providing the routeRequest method that was previously being called
 * on the Express router
 */
export class McpRoutingService {
  /**
   * Route a user request to the appropriate MCP tools
   */
  async routeRequest({ 
    userMessage, 
    userId, 
    conversationContext 
  }: {
    userMessage: string;
    userId: string;
    conversationContext: any[];
  }) {
    console.log(`Routing MCP request for user ${userId}`);
    
    // Determine which tools are appropriate for this message
    const enabledTools = await this.determineEnabledTools(userMessage, userId, conversationContext);
    
    return {
      enabledTools,
      routingDecision: {
        recommendedServer: enabledTools.length > 0 ? enabledTools[0].split('/')[0] : null,
        confidence: enabledTools.length > 0 ? 0.85 : 0,
        reasoning: `Enabled ${enabledTools.length} tools based on message content`
      }
    };
  }
  
  /**
   * Determine which tools should be enabled for a given user message
   * Enhanced with more sophisticated pattern matching and context awareness
   */
  private async determineEnabledTools(
    userMessage: string,
    userId: string,
    conversationContext: any[]
  ): Promise<string[]> {
    const message = userMessage.toLowerCase();
    const enabledTools: string[] = [];
    
    // Define tool detection patterns for different domains
    const toolPatterns = {
      health: {
        patterns: [
          // Health metrics keywords
          /health|wellness|fitness|medical|activity|workout/,
          /sleep|rest|fatigue|tired|insomnia|wake up|bedtime/,
          /steps|walked|walking|run|running|exercise|active/,
          /heart rate|pulse|bpm|heartbeat|cardiovascular/,
          /readiness|recovery|stress level|hrv|body battery/,
          /calories|weight|burned|nutrition|diet|water/,
          
          // Oura specific keywords
          /oura|ring|wearable|tracker|device/,
          
          // Time-related health queries
          /yesterday.*sleep|last night.*sleep|today.*activity/,
          /week.*activity|month.*exercise|year.*fitness/,
        ],
        tools: ['oura/oura-fetch', 'oura/health-analysis']
      },
      search: {
        patterns: [
          // Direct search requests
          /search|find|look up|google|information about|tell me about/,
          /what is|who is|where is|when was|why does|how do/,
          
          // Knowledge-based questions
          /explain|describe|details on|facts about|history of/,
          /latest|news|current|recent|update on/,
          
          // Research indicators
          /research|study|paper|article|publication|journal/,
        ],
        tools: ['search/web-search']
      },
      memory: {
        patterns: [
          // Memory and recall
          /remember|recall|previously|earlier|before|last time/,
          /you said|you told|you mentioned|you suggested/,
          /we discussed|we talked about|I asked|I told you/,
          
          // Session continuity
          /continue|follow up|back to|as we were/,
        ],
        tools: ['memory/retrieve']
      },
      integration: {
        patterns: [
          // Connected services
          /connect|integration|service|account|sync|api/,
          /perplexity|oura|openai|google|spotify|weather/,
        ],
        tools: ['system/service-status']
      }
    };
    
    // Track match confidence for different tool categories
    const categoryConfidence: Record<string, number> = {};
    
    // Process the current message for tool patterns
    for (const [category, config] of Object.entries(toolPatterns)) {
      // Initialize confidence for this category
      categoryConfidence[category] = 0;
      
      // Check each pattern against the message
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          categoryConfidence[category] += 0.2; // Increase confidence with each match
        }
      }
      
      // If confidence exceeds threshold, add the tools
      if (categoryConfidence[category] > 0.15) {
        enabledTools.push(...config.tools);
      }
    }
    
    // Consider conversation context for additional signals
    // Look at the last 3 messages for context
    const recentContext = conversationContext.slice(-3);
    
    for (const contextMsg of recentContext) {
      const contextContent = typeof contextMsg.content === 'string' ? 
        contextMsg.content.toLowerCase() : '';
      
      // Don't reprocess if it's the current message
      if (contextContent === message) continue;
      
      // Check context for additional patterns with reduced confidence
      for (const [category, config] of Object.entries(toolPatterns)) {
        for (const pattern of config.patterns) {
          if (pattern.test(contextContent)) {
            // Add lower weight for context matches
            categoryConfidence[category] += 0.1; 
            
            // If threshold now exceeded, add tools
            if (categoryConfidence[category] > 0.15 && 
                !config.tools.some(tool => enabledTools.includes(tool))) {
              enabledTools.push(...config.tools);
            }
          }
        }
      }
    }
    
    // User-specific customization (in a real app, fetch from user settings)
    // This is where you'd add code to get user preferences and adjust tools
    try {
      // Example only - in real code, fetch user settings from DB
      const userPreferredTools: string[] = [];
      
      // Add any user-preferred tools that aren't already enabled
      for (const tool of userPreferredTools) {
        if (!enabledTools.includes(tool)) {
          enabledTools.push(tool);
        }
      }
    } catch (error) {
      console.error('Error loading user tool preferences:', error);
    }
    
    // Fallback: If no tools matched and the message isn't a simple greeting,
    // enable web search as a last resort
    if (enabledTools.length === 0 && 
        !/^(hi|hello|hey|greetings|howdy|good (morning|afternoon|evening)|hola)\b/.test(message)) {
      enabledTools.push('search/web-search');
      console.log('No specific tools matched; falling back to web search');
    }
    
    // Log the tool selection decision
    console.log(`Enabled tools for message: ${enabledTools.join(', ')}`);
    console.log(`Category confidence: ${JSON.stringify(categoryConfidence)}`);
    
    return enabledTools;
  }
}

// Create and export the MCP routing service
export const mcpRoutingService = new McpRoutingService();

/**
 * Backward compatibility endpoints - these provide the same simplified API
 * as the legacy mcpRouter to ensure smooth migration
 */

// Schema for validating MCP tool execution requests
import { z } from 'zod';
import { executeMCPTool } from './mcpUtils';
import { isAuthenticated } from '../auth';

// Function to list all available MCP tools across all servers
function listMCPTools(): string[] {
  const tools: string[] = [];
  
  // Iterate through all MCP servers
  Object.entries(mcpServers).forEach(([serverName, server]) => {
    try {
      // Get tools from this server and add them to the list
      const serverTools = server.getTools?.() || [];
      serverTools.forEach((tool: any) => {
        tools.push(`${serverName}/${tool.name}`);
      });
    } catch (error) {
      console.error(`Error getting tools from server ${serverName}:`, error);
    }
  });
  
  return tools;
}

// Schema for validating MCP tool execution requests
const mcpExecuteSchema = z.object({
  tool: z.string(),
  input: z.record(z.any())
});

// Schema for validating web search requests (common operation)
const webSearchSchema = z.object({
  query: z.string().min(1)
});

// List available MCP tools (shortcut endpoint)
router.get('/tools', isAuthenticated, (req: Request, res: Response) => {
  try {
    const tools = listMCPTools();
    res.json({ success: true, tools });
  } catch (error) {
    console.error('Error listing MCP tools:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to list MCP tools',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute an MCP tool (shortcut endpoint)
router.post('/execute', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = mcpExecuteSchema.parse(req.body);
    
    // Add user ID to input if not provided
    const input = {
      userId: (req.user as any).id,
      ...validatedData.input
    };
    
    // Parse the tool name to get server and tool components
    // Format is expected to be 'serverName/toolName'
    const [serverName, toolName] = validatedData.tool.split('/');
    
    if (!serverName || !toolName) {
      throw new Error(`Invalid tool format: ${validatedData.tool}. Expected format: 'serverName/toolName'`);
    }
    
    // Execute the requested tool
    const result = await executeMCPTool(serverName, toolName, input);
    
    res.json({ 
      success: true, 
      tool: validatedData.tool,
      result 
    });
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid request format',
        errors: error.errors 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to execute MCP tool',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Shortcut for web search (common operation)
router.post('/web-search', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = webSearchSchema.parse(req.body);
    
    // Execute web search
    // Web search is typically provided by a specific MCP server (e.g., 'search')
    const serverName = 'search'; // Change this to match your actual server name for search
    const toolName = 'web-search';
    
    const result = await executeMCPTool(serverName, toolName, {
      query: validatedData.query
    });
    
    res.json({ 
      success: true, 
      tool: 'web-search',
      result 
    });
  } catch (error) {
    console.error('Error performing web search:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid search query',
        errors: error.errors 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to perform web search',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Shortcut for memory retrieval (common operation)
router.post('/memory', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = (req.user as any).id;
    
    // Get query from request
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid memory query'
      });
    }
    
    // Execute memory retrieval
    // Memory service is typically provided by a specific MCP server (e.g., 'memory')
    const serverName = 'memory'; // Change this to match your actual server name for memory
    const toolName = 'retrieve';
    
    const result = await executeMCPTool(serverName, toolName, {
      userId,
      query
    });
    
    res.json({ 
      success: true, 
      tool: 'memory-retrieve',
      result 
    });
  } catch (error) {
    console.error('Error retrieving memory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve memory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Shortcut for health data analysis (common operation)
router.get('/health/:dataType?', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = (req.user as any).id;
    
    // Get data type from path parameter
    const dataType = req.params.dataType;
    
    // Execute health analysis
    // Health data is typically provided by the Oura MCP server
    const serverName = 'oura'; // Assuming health data comes from Oura Ring
    const toolName = 'health-analysis';
    
    const result = await executeMCPTool(serverName, toolName, {
      userId,
      dataType
    });
    
    res.json({ 
      success: true, 
      tool: 'health-analysis',
      result 
    });
  } catch (error) {
    console.error('Error analyzing health data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze health data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export the router
export const mcpRouter = router;

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { isAuthenticated } from "../auth";
import { LimitlessMcpServer, createLimitlessMcpServer } from "./limitless/limitlessMcpServer";
import { OuraMcpServer, createOuraMcpServer } from "./oura/ouraMcpServer";
import { BeeMcpServer, createBeeMcpServer } from "./bee/beeMcpServer";
import { InMemoryTokenStore } from './auth/authProvider';
import { SecurityMiddleware } from './auth/securityMiddleware';

// Create an in-memory token store (for development)
const tokenStore = new InMemoryTokenStore();

// Create security middleware
const securityMiddleware = new SecurityMiddleware(tokenStore);

// Create the MCP Router - this will be exported and used in routes.ts
const router = Router();

// Type definition for routing request parameters
interface RoutingRequest {
  userMessage: string;
  userId: string;
  conversationContext?: any[];
  enabledTools?: string[];
}

// Type definition for routing decision response
interface RoutingResponse {
  routingDecision?: {
    reasoning: string;
    confidence: number;
  };
  enabledTools: string[];
}

// Create the MCP Routing Service that will be used by routes.ts
export const mcpRoutingService = {
  // Route a user request to appropriate tools
  routeRequest: async (request: RoutingRequest): Promise<RoutingResponse> => {
    const { userMessage, userId, conversationContext = [] } = request;
    
    console.log(`Routing request for user ${userId}: "${userMessage.substring(0, 50)}..."`);
    
    // Default tools to enable - in production this would use NLP to determine appropriate tools
    const enabledTools = determineEnabledTools(userMessage, conversationContext);
    
    return {
      routingDecision: {
        reasoning: `Selected tools based on message content: "${userMessage.substring(0, 30)}..."`,
        confidence: 0.85, // Placeholder confidence score
      },
      enabledTools
    };
  },

  // Execute a tool by server and tool name
  executeTool: async (serverName: string, toolName: string, args: Record<string, any>) => {
    return executeMCPTool(serverName, toolName, args);
  },
  
  // List all available tools
  listTools: () => {
    return listMCPTools();
  },
  
  // Get a specific MCP server
  getServer: (serverName: string) => {
    return mcpServers[serverName] || null;
  },
  
  // Check if an MCP server exists
  hasServer: (serverName: string) => {
    return !!mcpServers[serverName];
  }
};

/**
 * Determine which tools to enable based on the user message
 * In production, this would use NLP/LLM to analyze the message and select appropriate tools
 */
function determineEnabledTools(userMessage: string, conversationContext: any[] = []): string[] {
  const message = userMessage.toLowerCase();
  const enabledTools: string[] = [];
  
  // Simple keyword-based routing
  if (message.includes('search') || message.includes('find') || message.includes('look up')) {
    enabledTools.push('search/web-search');
  }
  
  if (message.includes('memory') || message.includes('remember') || message.includes('recall')) {
    enabledTools.push('memory/retrieve');
  }
  
  if (message.includes('health') || message.includes('sleep') || message.includes('activity')) {
    enabledTools.push('oura/health-analysis');
  }
  
  if (message.includes('transcribe') || message.includes('audio') || message.includes('recording')) {
    enabledTools.push('bee/transcribe');
  }
  
  if (message.includes('limitless') || message.includes('notes') || message.includes('journal')) {
    enabledTools.push('limitless/get-recent-entries');
  }
  
  // Default to search if no specific tools matched
  if (enabledTools.length === 0) {
    enabledTools.push('search/web-search');
  }
  
  return enabledTools;
}

// Common interface for all MCP servers
interface McpServer {
  executeToolCall(toolCall: any): Promise<any>;
  listTools(): Promise<any[]>;
  isHealthy(): Promise<boolean>;
}

// Extended interface with required methods for router functionality
// Event type for streaming handler callbacks
type StreamEvent = 'data' | 'error' | 'end';

// Handler options with EventEmitter-like interface
interface StreamHandlerOptions {
  emit: (event: StreamEvent, data: any) => void;
}

// Handler function returned by createStreamingHandler
type StreamHandler = (data: any) => Promise<any>;

interface McpServerWithRouter extends McpServer {
  handleRequest(request: any): Promise<any>;
  createStreamingHandler?(options: StreamHandlerOptions): StreamHandler;
  getTools?(): any[];
}

// Map of MCP servers
interface McpServerMap {
  [key: string]: McpServerWithRouter;
}

export const mcpServers: McpServerMap = {};

/**
 * Initialize MCP servers with environment variables or configuration
 */
export async function initMcpServers() {
  // Get configuration from storage if available
  let ouraToken = process.env.OURA_TOKEN;
  let limitlessToken = process.env.LIMITLESS_API_TOKEN;
  let beeToken = process.env.BEE_API_TOKEN;
  
  // Initialize Oura MCP server
  if (ouraToken) {
    try {
      mcpServers['oura'] = createOuraMcpServer(ouraToken);
      console.log('Oura MCP server initialized');
    } catch (error) {
      console.error('Failed to initialize Oura MCP server:', error);
      // Continue without crashing
    }
  } else {
    console.warn('OURA_TOKEN not found, Oura MCP server not initialized');
  }

  // Initialize Limitless MCP server
  if (limitlessToken) {
    try {
      mcpServers['limitless'] = createLimitlessMcpServer(limitlessToken);
      console.log('Limitless MCP server initialized');
    } catch (error) {
      console.error('Failed to initialize Limitless MCP server:', error);
      // Continue without crashing
    }
  } else {
    console.warn('LIMITLESS_API_TOKEN not found, Limitless MCP server not initialized');
  }

  // Initialize Bee MCP server
  if (beeToken) {
    try {
      mcpServers['bee'] = createBeeMcpServer(beeToken);
      console.log('Bee MCP server initialized');
    } catch (error) {
      console.error('Failed to initialize Bee MCP server:', error);
      // Continue without crashing
    }
  } else {
    console.warn('BEE_API_TOKEN not found, Bee MCP server not initialized');
  }

  // Add diagnostic logging for WebSocket debugging
  console.log('Available NodeJS modules for WebSocket connections:');
  try {
    // List modules that might be related to WebSocket connections
    console.log('- ws module available:', !!require.resolve('ws'));
  } catch (e) {
    console.log('- ws module not available');
  }
  try {
    console.log('- socket.io module available:', !!require.resolve('socket.io'));
  } catch (e) {
    console.log('- socket.io module not available');
  }
  console.log('MCP initialization complete. Active servers:', Object.keys(mcpServers));
  
  // Check for critical WebSocket dependencies
  try {
    const packageJson = require('../package.json');
    const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};
    const wsRelatedDeps = Object.keys(dependencies).filter(dep => 
      dep.includes('socket') || dep.includes('ws') || dep.includes('stream')
    );
    if (wsRelatedDeps.length > 0) {
      console.log('WebSocket-related dependencies:', wsRelatedDeps);
    }
  } catch (error) {
    console.warn('Could not analyze WebSocket dependencies:', error);
  }
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
      
      // Create event emitter-like handlers for streaming
      const emitter = {
        emit: (event: StreamEvent, data: any) => {
          if (event === 'data') {
            res.write(`data: ${JSON.stringify({ type: 'chunk', chunk: data })}\n\n`);
          } else if (event === 'error') {
            res.write(`data: ${JSON.stringify({ type: 'error', error: data })}\n\n`);
            res.end();
          }
        },
      };

      // Check if server implements streaming handler
      if (!mcpServers[server].createStreamingHandler) {
        // Fallback to non-streaming execution for servers without streaming support
        try {
          const result = await mcpServers[server].handleRequest({
            type: 'execute_tool',
            name,
            arguments: args || {}
          });
          
          // Return result as if it was streamed
          res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
          res.end();
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
          res.end();
        }
        return;
      }
      
      // Create a streaming handler with event emitter wrapper
      const streamingHandler = mcpServers[server].createStreamingHandler(emitter);
      
      // Call the streaming handler with the tool call params
      try {
        const finalResult = await streamingHandler({
          name,
          arguments: args || {},
        });
        
        // Send final result
        res.write(`data: ${JSON.stringify({ type: 'complete', result: finalResult })}\n\n`);
        res.end();
      } catch (error: unknown) {
        // Send error and close connection
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
        res.end();
      }
    } catch (error: unknown) {
      console.error(`Error in streaming tool call ${name} on ${server}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Streaming tool call failed', message: errorMessage }));
    }
});

// ... rest of the code remains the same ...

// Function to list all available MCP tools across all servers
function listMCPTools(): string[] {
  const allTools: string[] = [];
  
  for (const serverName in mcpServers) {
    const server = mcpServers[serverName];
    try {
      // Try to get tools from getTools method if available
      if (server.getTools && typeof server.getTools === 'function') {
        const tools = server.getTools();
        allTools.push(...tools.map(tool => `${serverName}:${tool.name}`));
      } 
      // Alternative: request tools via handleRequest if getTools not available
      else if (server.handleRequest) {
        server.handleRequest({ type: 'list_tools' })
          .then(response => {
            if (response && response.tools) {
              allTools.push(...response.tools.map((tool: any) => `${serverName}:${tool.name}`));
            }
          })
          .catch(err => console.error(`Error getting tools for ${serverName}:`, err));
      }
    } catch (error) {
      console.error(`Error listing tools for ${serverName}:`, error);
    }
  }
  
  return allTools;
}

/**
 * Utility function to execute an MCP tool call
 * @param serverName The MCP server name
 * @param toolName The name of the tool to execute
 * @param args Arguments for the tool call
 */
async function executeMCPTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
  if (!serverName || !toolName || !mcpServers[serverName]) {
    throw new Error(`Invalid server or tool: ${serverName}/${toolName}`);
  }
  
  // Execute the tool call
  return mcpServers[serverName].handleRequest({
    type: 'execute_tool',
    name: toolName,
    arguments: args
  });
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

// Re-export key utility functions
export { listMCPTools, executeMCPTool };

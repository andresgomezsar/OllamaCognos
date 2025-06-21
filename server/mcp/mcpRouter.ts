import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { isAuthenticated } from "../auth.js";
import { LimitlessMcpServer, createLimitlessMcpServer } from "./limitless/limitlessMcpServer.js";
import { OuraMcpServer, createOuraMcpServer } from "./oura/ouraMcpServer.js";
import { BeeMcpServer, createBeeMcpServer } from "./bee/beeMcpServer.js";
import { CognosMcpServer, createCognosMcpServer } from "./cognos/cognosMcpServer.js";
import { InMemoryTokenStore } from './auth/authProvider.js';
import { SecurityMiddleware } from './auth/securityMiddleware.js';
import path from 'path';

// Import the MockOmiMemoryClient for testing - only in development environments
let MockOmiMemoryClient: any = null;

// Only attempt to load the mock client in development mode to avoid production issues
if (process.env.NODE_ENV === 'development' || process.env.USE_MOCK_CLIENTS === 'true') {
  try {
    // Use ESM-compatible import approach
    import('node:fs/promises').then(async (fs) => {
      const mockClientPath = path.join(process.cwd(), 'cognos_pipeline', 'mockOmiMemoryClient.js');
      
      // Check if the file exists before attempting to import it
      try {
        if (await fs.access(mockClientPath).then(() => true).catch(() => false)) {
          import(mockClientPath).then((mockModule) => {
            MockOmiMemoryClient = mockModule.MockOmiMemoryClient;
            console.log('✅ MockOmiMemoryClient loaded for testing');
          }).catch(err => {
            console.log('⚠️ Error importing MockOmiMemoryClient:', err instanceof Error ? err.message : String(err));
          });
        } else {
          console.log('⚠️ MockOmiMemoryClient file not found at:', mockClientPath);
        }
      } catch (fsError) {
        console.log('⚠️ Error checking MockOmiMemoryClient file:', fsError instanceof Error ? fsError.message : String(fsError));
      }
    }).catch(error => {
      console.log('⚠️ Failed to load fs module:', error instanceof Error ? error.message : String(error));
    });
  } catch (error) {
    console.log('⚠️ Failed to setup MockOmiMemoryClient import:', error instanceof Error ? error.message : String(error));
  }
} else {
  console.log('Production mode - not loading mock clients');
}

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
  executeTool: async (serverName: string, toolName: string, args: Record<string, any>): Promise<any> => {
    return executeMCPTool(serverName, toolName, args);
  },
  
  // List all available tools
  listTools: (): string[] => {
    return listMCPTools();
  },
  
  // Get a specific MCP server
  getServer: (serverName: string): McpServerWithRouter | null => {
    return mcpServers[serverName] || null;
  },
  
  // Check if an MCP server exists
  hasServer: (serverName: string): boolean => {
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

// Base interface for MCP servers
interface McpServer {
  executeToolCall(toolCall: { name: string; parameters: any }): Promise<any>;
  listTools(): Promise<any[]>;
  isHealthy?(): Promise<boolean>;
  healthCheck?(): Promise<boolean>;
  getTools?(): any[];
  listPrompts?(): Promise<any[]>;
  getPrompt?(id: string): Promise<any>;
}

// Interface for streaming-capable servers
interface StreamHandler {
  (data: any): Promise<any>;
}

interface StreamHandlerOptions {
  emit: (event: string, data: any) => void;
}

// Extended interface for MCP servers with router capabilities
interface McpServerWithRouter extends McpServer {
  handleRequest?(request: any): Promise<any>;
  createStreamingHandler?(options: StreamHandlerOptions): StreamHandler;
}

// Map of MCP servers
interface McpServerMap {
  [key: string]: McpServerWithRouter;
}

export const mcpServers: McpServerMap = {};

/**
 * Execute a tool from an MCP server
 */
async function executeMCPTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
  if (!mcpServers[serverName]) {
    throw new Error(`Server ${serverName} not found`);
  }
  
  const server = mcpServers[serverName];
  
  // Choose the appropriate method to call the tool
  if (server.handleRequest && typeof server.handleRequest === 'function') {
    return server.handleRequest({
      type: 'execute_tool',
      name: toolName,
      arguments: args,
    });
  } else if (server.executeToolCall && typeof server.executeToolCall === 'function') {
    return server.executeToolCall({
      name: toolName,
      parameters: args
    });
  } else {
    throw new Error(`Server ${serverName} does not support tool execution`);
  }
}

/**
 * List all available tools across MCP servers
 */
function listMCPTools(): string[] {
  const allTools: string[] = [];
  
  for (const [serverName, server] of Object.entries(mcpServers)) {
    try {
      // Get tools synchronously if possible
      const serverTools = server.getTools ? server.getTools() : [];
      
      serverTools.forEach((tool: any) => {
        allTools.push(`${serverName}/${tool.name}`);
      });
    } catch (err) {
      console.error(`Error listing tools for server ${serverName}:`, err);
    }
  }
  
  return allTools;
}

/**
 * Initialize MCP servers with environment variables or configuration
 */
export async function initMcpServers() {
  console.log('Initializing MCP servers...');
  
  try {
    // Initialize Oura MCP server if configured
    const ouraToken = process.env.OURA_TOKEN;
    if (ouraToken) {
      console.log('Initializing Oura MCP Server...');
      mcpServers.oura = createOuraMcpServer(ouraToken);
      console.log('Oura MCP Server initialized!');
    } else {
      console.log('Skipping Oura MCP Server initialization (OURA_TOKEN not found)');
    }
    
    // Initialize Limitless MCP server (no specific config needed)
    console.log('Initializing Limitless MCP Server...');
    mcpServers.limitless = createLimitlessMcpServer("");
    console.log('Limitless MCP Server initialized!');
    
    // Initialize Bee MCP server if configured
    const beeApiKey = process.env.BEE_API_KEY;
    if (beeApiKey) {
      console.log('Initializing Bee MCP Server...');
      mcpServers.bee = createBeeMcpServer(beeApiKey);
      console.log('Bee MCP Server initialized!');
    } else {
      console.log('Skipping Bee MCP Server initialization (BEE_API_KEY not found)');
    }
    
    // Initialize Cognos Audio Processing MCP server
    console.log('Initializing Cognos MCP Server...');
    const pythonPath = process.env.COGNOS_PYTHON_PATH || 'python';
    const cognosPipelinePath = process.env.COGNOS_PIPELINE_PATH || process.cwd();
    
    // Use MockOmiMemoryClient if available (for testing)
    let mockClient = null;
    if (MockOmiMemoryClient) {
      mockClient = new MockOmiMemoryClient();
      console.log('Using MockOmiMemoryClient for Cognos MCP Server');
    }
    
    mcpServers.cognos = createCognosMcpServer(pythonPath, cognosPipelinePath, mockClient);
    console.log('Cognos MCP Server initialized!');
    
    console.log(`MCP servers initialized: ${Object.keys(mcpServers).join(', ')}`);
  } catch (error) {
    console.error('Error initializing MCP servers:', error);
  }
  
  // In ESM modules, we can't directly import JSON files using static imports
  // So we'll skip the WebSocket dependency check for now
  console.log('WebSocket dependency check skipped in ESM mode');
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

  res.json({ success: true, servers });
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
    // Call list tools method on the server
    const mcpServer = mcpServers[server];
    let tools = [];
    
    if (mcpServer.listTools && typeof mcpServer.listTools === 'function') {
      tools = await mcpServer.listTools();
    } else if (mcpServer.getTools && typeof mcpServer.getTools === 'function') {
      tools = mcpServer.getTools();
    } else {
      tools = [];
    }
    
    res.json({ success: true, tools });
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
    // Call list prompts method on the server
    const mcpServer = mcpServers[server];
    let prompts = [];
    
    if (mcpServer.listPrompts && typeof mcpServer.listPrompts === 'function') {
      prompts = await mcpServer.listPrompts();
    } else {
      prompts = [];
    }
    
    res.json({ success: true, prompts });
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
    // Call get prompt method on the server
    const mcpServer = mcpServers[server];
    let prompt = null;
    
    if (mcpServer.getPrompt && typeof mcpServer.getPrompt === 'function') {
      prompt = await mcpServer.getPrompt(id);
    } else {
      prompt = null;
    }
    
    res.json({ success: true, prompt });
  } catch (error) {
    console.error(`Error getting prompt ${id} for ${server}:`, error);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

/**
 * Handle requests to check the health of an MCP server
 */
router.get('/:server/health', async (req: Request, res: Response) => {
  const { server } = req.params;
  
  if (!mcpServers[server]) {
    return res.status(404).json({ success: false, message: `MCP server '${server}' not found` });
  }
  
  try {
    // Call health check method on the server
    const mcpServer = mcpServers[server];
    let isHealthy = true; // Default to healthy if no health check method is available
    
    if (mcpServer.isHealthy && typeof mcpServer.isHealthy === 'function') {
      isHealthy = await mcpServer.isHealthy();
    } else if (mcpServer.healthCheck && typeof mcpServer.healthCheck === 'function') {
      isHealthy = await mcpServer.healthCheck();
    }
    
    res.json({ success: true, isHealthy });
  } catch (error) {
    console.error(`Error checking health of ${server}:`, error);
    res.status(500).json({ success: false, message: 'Failed to check health' });
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
      // Call tool execution method on the server
      const mcpServer = mcpServers[server];
      
      if (mcpServer.handleRequest && typeof mcpServer.handleRequest === 'function') {
        const response = await mcpServer.handleRequest({
          type: 'execute_tool',
          name,
          arguments: args || {},
        });
        
        res.json(response);
      } else if (mcpServer.executeToolCall && typeof mcpServer.executeToolCall === 'function') {
        const response = await mcpServer.executeToolCall({
          name,
          parameters: args || {},
        });
        
        res.json(response);
      } else {
        throw new Error(`Server ${server} does not support tool execution`);
      }
    } catch (error) {
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
        emit: (event: string, data: any) => {
          if (event === 'data') {
            res.write(`data: ${JSON.stringify({ type: 'chunk', chunk: data })}\n\n`);
          } else if (event === 'error') {
            res.write(`data: ${JSON.stringify({ type: 'error', error: data })}\n\n`);
            res.end();
          } else if (event === 'end') {
            res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
            res.end();
          }
        }
      };
      
      // Get streaming handler
      if (!mcpServers[server].createStreamingHandler || typeof mcpServers[server].createStreamingHandler !== 'function') {
        throw new Error(`Server ${server} does not support streaming`);
      }
      
      const streamingHandler = mcpServers[server].createStreamingHandler(emitter);
      
      // Use the handler to process the request
      if (streamingHandler) {
        const result = await streamingHandler({
          name,
          arguments: args || {},
        });
        
        // Send final result
        res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
        res.end();
      } else {
        throw new Error(`Failed to create streaming handler for ${server}`);
      }
    } catch (error) {
      console.error(`Error in streaming tool call ${name} on ${server}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Streaming tool call failed', message: errorMessage }));
    }
});

// ... rest of the code remains the same ...

// List available MCP tools (shortcut endpoint)
// TODO: Re-enable authentication after testing
// router.get('/tools', isAuthenticated, async (req: Request, res: Response) => {
router.get('/tools', async (req: Request, res: Response) => {
  try {
    const tools = [];
    
    for (const serverName in mcpServers) {
      const server = mcpServers[serverName];
      
      // Get tools via listTools method (preferred)
      if (server.listTools && typeof server.listTools === 'function') {
        const serverTools = await server.listTools();
        tools.push(...serverTools.map(tool => `${serverName}/${tool.name}`));
      } else if (server.getTools && typeof server.getTools === 'function') {
        const serverTools = server.getTools();
        tools.push(...serverTools.map(tool => `${serverName}/${tool.name}`));
      }
    }
    
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
    const mcpExecuteSchema = z.object({
      tool: z.string(),
      input: z.record(z.any())
    });
    
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

// ... rest of the code remains the same ...

/**
 * Test endpoint for memory tools (DEVELOPMENT ONLY)
 * This endpoint runs the memory tools tests and returns the results
 */
router.get('/test-memory-tools', async (req: Request, res: Response) => {
  console.log('Running memory tools test...');
  
  try {
    if (!mcpServers.cognos) {
      return res.status(500).json({ 
        success: false, 
        message: 'Cognos MCP server not initialized'
      });
    }

    // Get memory tools
    const allTools = await mcpServers.cognos.listTools();
    const memoryTools = allTools.filter(tool => [
      'get_memories',
      'create_memory',
      'create_memory_from_audio',
      'delete_memory',
      'edit_memory',
      'get_conversations'
    ].includes(tool.name));
    
    console.log('Found memory tools:', memoryTools.map(t => t.name));
    
    // Test memory creation
    const createResult = await mcpServers.cognos.executeToolCall({
      name: 'create_memory',
      parameters: {
        title: 'Test Memory',
        content: 'This is a test memory created at ' + new Date().toISOString(),
        category: 'TEST',
        uid: 'test-user-id'
      }
    });
    
    // Extract memory ID
    const createdMemoryId = createResult?.memoryId || 'unknown';
    console.log('Memory created with ID:', createdMemoryId);
    
    // Test getting memories
    const getResult = await mcpServers.cognos.executeToolCall({
      name: 'get_memories',
      parameters: {
        uid: 'test-user-id',
        limit: 5,
        categories: ['TEST']
      }
    });
    
    console.log('Retrieved memories count:', getResult?.memories?.length || 0);
    
    // Test memory editing
    const editResult = await mcpServers.cognos.executeToolCall({
      name: 'edit_memory',
      parameters: {
        memory_id: createdMemoryId,
        content: 'This memory was edited at ' + new Date().toISOString(),
        uid: 'test-user-id'
      }
    });
    
    console.log('Memory edit result:', editResult?.success ? 'Success' : 'Failed');
    
    // Test memory deletion
    const deleteResult = await mcpServers.cognos.executeToolCall({
      name: 'delete_memory',
      parameters: {
        memory_id: createdMemoryId,
        uid: 'test-user-id'
      }
    });
    
    console.log('Memory deletion result:', deleteResult?.success ? 'Success' : 'Failed');
    
    // Return test results
    res.json({
      success: true,
      results: {
        memoryCreated: !!createResult?.memoryId,
        memoriesRetrieved: !!getResult?.memories,
        memoryEdited: !!editResult?.success,
        memoryDeleted: !!deleteResult?.success,
        details: {
          createResult,
          getResult,
          editResult,
          deleteResult
        }
      }
    });
  } catch (error) {
    console.error('Memory tools test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Memory tools test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export the MCP router
export { router as mcpRouter };

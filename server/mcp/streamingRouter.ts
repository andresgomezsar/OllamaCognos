/**
 * MCP Streaming Router
 * Provides Express routes for streaming MCP tool executions
 */
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { handleStreamRequest } from './enhancedStreaming';
import { mcpServerRegistry } from './mcpServerRegistry';
import { mcpLogger } from './mcpLogging';
import { asyncHandler } from '../utils/errorHandler';

// Create router
export const streamingRouter = express.Router();

// Schema for listing available streaming tools
const listStreamingToolsSchema = z.object({
  server: z.string().optional()
});

/**
 * GET /api/mcp/streaming/tools - List available streaming tools
 */
streamingRouter.get('/tools', asyncHandler(async (req: Request, res: Response) => {
  const params = listStreamingToolsSchema.parse(req.query);
  const { server } = params;
  
  // Get all streaming tools from registry
  const streamingTools = await getAvailableStreamingTools(server);
  
  res.json({
    success: true,
    data: streamingTools,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || uuidv4()
  });
}));

/**
 * GET /api/mcp/streaming - Stream MCP tool execution
 * Parameters:
 *   server - MCP server name
 *   tool - Tool name to execute
 *   Request body contains tool parameters
 */
streamingRouter.get('/', (req: Request, res: Response) => {
  // Delegate to the enhanced stream handler
  handleStreamRequest(req, res);
});

/**
 * GET /api/mcp/streaming/health - Check streaming health
 */
streamingRouter.get('/health', (req: Request, res: Response) => {
  const streamingHealth = {
    healthy: true,
    servers: getStreamingServerHealth(),
    timestamp: new Date().toISOString()
  };
  
  res.json(streamingHealth);
});

/**
 * POST /api/mcp/streaming - Stream MCP tool execution (POST version)
 * This version allows for larger parameter payloads
 */
streamingRouter.post('/', (req: Request, res: Response) => {
  // Delegate to the enhanced stream handler
  handleStreamRequest(req, res);
});

/**
 * Get health status of streaming-capable servers
 */
function getStreamingServerHealth() {
  const servers = mcpServerRegistry.listServers();
  const serverHealth = {};
  
  for (const server of servers) {
    if (server.createStreamingHandler) {
      serverHealth[server.name] = {
        healthy: server.healthy,
        status: server.status,
        lastHealthCheck: server.lastHealthCheck
      };
    }
  }
  
  return serverHealth;
}

/**
 * Get list of available streaming tools
 */
async function getAvailableStreamingTools(serverName?: string) {
  const streamingTools = [];
  const servers = serverName 
    ? [mcpServerRegistry.getServer(serverName)].filter(Boolean)
    : mcpServerRegistry.listServers();
  
  for (const server of servers) {
    if (!server.createStreamingHandler) {
      continue;
    }
    
    try {
      // Get all tools for this server
      const tools = await mcpServerRegistry.listServerTools(server.name);
      
      // Filter tools that support streaming
      for (const tool of tools) {
        if (tool.streaming) {
          streamingTools.push({
            server: server.name,
            tool: tool.name,
            description: tool.description,
            parameters: tool.parameters
          });
        }
      }
    } catch (error) {
      mcpLogger.error({
        message: `Failed to list streaming tools for server ${server.name}`,
        error
      });
    }
  }
  
  return streamingTools;
}

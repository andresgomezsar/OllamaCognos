import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { MCPToolResponse, ErrorCategory } from '../../shared/errors/apiErrorTypes';
import { createMcpErrorResponse } from '../utils/errorHandler';
import { mcpServers } from './mcpRouter';
import { validateMCPToolRequest, validateServerSpecificRequest } from './mcpSchemaValidator';
import { mcpLogger } from './mcpLogging';

interface ExecutionMetrics {
  startTime: string;
  endTime?: string;
  attempts: number;
  duration?: number;
}

interface ToolRequest {
  serverName: string;
  toolName: string;
  args: Record<string, any>;
  requestId?: string;
  timeout?: number;
}

/**
 * Validate and normalize the MCP tool string format (serverName/toolName)
 * 
 * @param toolString - Tool string in format "serverName/toolName"
 * @returns Object with serverName and toolName properties
 * @throws Error if the tool string format is invalid
 */
export function parseToolString(toolString: string): { serverName: string; toolName: string } {
  const parts = toolString.split('/');
  
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid tool format: ${toolString}. Expected format: 'serverName/toolName'`);
  }
  
  return {
    serverName: parts[0],
    toolName: parts[1]
  };
}

/**
 * Executes an MCP tool with comprehensive validation, retries, and error handling
 * 
 * @param request - Tool execution request
 * @returns Promise resolving to tool execution result or rejection with error
 */
export async function executeMCPTool<T = any>(
  request: ToolRequest
): Promise<MCPToolResponse<T>> {
  // Generate or use provided request ID
  const requestId = request.requestId || uuidv4();
  
  // Initialize execution metrics
  const metrics: ExecutionMetrics = {
    startTime: new Date().toISOString(),
    attempts: 1
  };
  
  // Log execution start
  mcpLogger.info({
    message: `Starting MCP tool execution: ${request.serverName}/${request.toolName}`,
    requestId,
    server: request.serverName,
    tool: request.toolName,
    args: request.args
  });
  
  try {
    // Step 1: Validate the request format
    const validationResult = validateMCPToolRequest(request);
    if (!validationResult.success) {
      throw new Error(validationResult.error);
    }
    
    // Step 2: Validate server-specific schema (if available)
    const serverSpecificValidation = validateServerSpecificRequest(validationResult.data);
    if (!serverSpecificValidation.success) {
      throw new Error(serverSpecificValidation.error);
    }
    
    // Step 3: Check if the server exists
    const { serverName, toolName } = validationResult.data;
    
    if (!mcpServers[serverName]) {
      throw new Error(`MCP server '${serverName}' not found`);
    }
    
    // Step 4: Execute the tool with timeout
    const timeoutMs = request.timeout || 30000; // Default 30 seconds
    
    const toolResult = await Promise.race([
      mcpServers[serverName].executeToolCall({
        name: toolName,
        parameters: request.args
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]) as T;
    
    // Update metrics
    metrics.endTime = new Date().toISOString();
    metrics.duration = new Date(metrics.endTime).getTime() - new Date(metrics.startTime).getTime();
    
    // Log successful execution
    mcpLogger.info({
      message: `MCP tool execution completed: ${serverName}/${toolName}`,
      requestId,
      server: serverName,
      tool: toolName,
      duration: metrics.duration
    });
    
    // Return successful response
    return {
      success: true,
      data: toolResult,
      metadata: {
        executionTime: metrics.duration,
        server: serverName,
        tool: toolName
      }
    };
  } catch (error) {
    // Update metrics for error case
    metrics.endTime = new Date().toISOString();
    metrics.duration = new Date(metrics.endTime).getTime() - new Date(metrics.startTime).getTime();
    
    // Determine error category
    let category = ErrorCategory.MCP_EXECUTION;
    
    if (error instanceof z.ZodError) {
      category = ErrorCategory.MCP_SCHEMA;
    } else if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        category = ErrorCategory.NOT_FOUND;
      } else if (errorMsg.includes('timeout')) {
        category = ErrorCategory.NETWORK;
      } else if (errorMsg.includes('validation')) {
        category = ErrorCategory.VALIDATION;
      } else if (errorMsg.includes('server')) {
        category = ErrorCategory.SERVER;
      }
    }
    
    // Create standardized error response
    const mcpError = createMcpErrorResponse(
      error,
      request.serverName,
      request.toolName,
      category,
      category === ErrorCategory.NOT_FOUND ? 404 : 500,
      metrics
    );
    
    // Log error
    mcpLogger.error({
      message: `MCP tool execution failed: ${request.serverName}/${request.toolName}`,
      error: mcpError,
      requestId,
      server: request.serverName,
      tool: request.toolName,
      duration: metrics.duration,
      attempts: metrics.attempts
    });
    
    // Return error response
    return {
      success: false,
      error: mcpError,
      metadata: {
        executionTime: metrics.duration,
        server: request.serverName,
        tool: request.toolName
      }
    };
  }
}

/**
 * Executes multiple MCP tools in parallel
 * 
 * @param requests - Array of tool requests
 * @returns Promise resolving to array of tool execution results
 */
export async function batchExecuteMCPTools<T = any>(
  requests: ToolRequest[]
): Promise<MCPToolResponse<T>[]> {
  return Promise.all(requests.map(request => executeMCPTool<T>(request)));
}

/**
 * Checks if an MCP server is healthy and available
 * 
 * @param serverName - Name of the MCP server
 * @returns Promise resolving to boolean indicating server health
 */
export async function checkServerHealth(serverName: string): Promise<boolean> {
  try {
    if (!mcpServers[serverName]) {
      return false;
    }
    
    return await mcpServers[serverName].healthCheck();
  } catch (error) {
    mcpLogger.error({
      message: `Health check failed for MCP server: ${serverName}`,
      error,
      server: serverName
    });
    return false;
  }
}

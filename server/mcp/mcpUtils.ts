/**
 * MCP Utilities - Helper functions for MCP integration
 */
import { v4 as uuidv4 } from 'uuid';
import { mcpServers } from './mcpRouter.js';
import {
  MCPToolRequest,
  MCPToolResponse,
  validateMCPToolRequest,
  validateMCPToolResponse,
  validateServerSpecificRequest,
} from './mcpSchemaValidator.js';
import {
  MCPStreamingService,
  StreamEventType,
  MCPToolStream
} from './mcpStreaming.js';

// Import structured logging utilities
import { logMcpTools, logToolExecution, logError, timeOperation, LogLevel } from './mcpLogging.js';
import debug from 'debug';

/**
 * MCP Tool Result Content Item
 */
export interface MCPToolResultContentItem {
  type: 'text' | 'json' | 'image';
  text?: string;
  json?: any;
  image_url?: string;
}

/**
 * MCP Tool Result
 */
export interface MCPToolResult {
  content?: MCPToolResultContentItem[];
  error?: string;
  status?: 'success' | 'error';
  streamId?: string; // ID of the stream if this is a streaming result
}

/**
 * Options for executing MCP tool calls
 */
export interface MCPToolExecutionOptions {
  // Enable streaming for this tool call (if supported by the tool)
  streaming?: boolean;
  
  // Timeout in milliseconds
  timeoutMs?: number;
  
  // Request ID (will be generated if not provided)
  requestId?: string;
}

/**
 * MCP Tool Error Types
 */
export enum MCPErrorType {
  VALIDATION_ERROR = 'validation_error',
  SERVER_NOT_FOUND = 'server_not_found',
  TOOL_NOT_FOUND = 'tool_not_found',
  EXECUTION_ERROR = 'execution_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * MCP Error class
 */
export class MCPError extends Error {
  type: MCPErrorType;
  details?: Record<string, any>;

  constructor(message: string, type: MCPErrorType, details?: Record<string, any>) {
    super(message);
    this.name = 'MCPError';
    this.type = type;
    this.details = details;
  }

  toResponse(): MCPToolResult {
    return {
      error: this.message,
      status: 'error',
      content: [
        { 
          type: 'json', 
          json: {
            error_type: this.type,
            details: this.details
          }
        }
      ]
    };
  }
}

/**
 * Execute an MCP tool call with schema validation and error handling
 * 
 * @param serverName Name of the MCP server (e.g., 'oura')
 * @param toolName Name of the tool to call
 * @param args Arguments for the tool call
 * @param options Additional options for execution (streaming, timeout, etc.)
 * @returns Result of the tool call
 */
export async function executeMCPTool(
  serverName: string, 
  toolName: string, 
  args: Record<string, any>,
  options: MCPToolExecutionOptions = {}
): Promise<MCPToolResult> {
  // Use provided requestId or generate a new one
  const requestId = options.requestId || uuidv4();
  logToolExecution(logMcpTools, LogLevel.INFO, requestId, serverName, toolName, 'Execute MCP tool');
  
  // Initialize streaming if requested
  let stream: MCPToolStream | undefined;
  if (options.streaming) {
    stream = MCPStreamingService.getInstance().createStream(serverName, toolName);
    logToolExecution(logMcpTools, LogLevel.INFO, requestId, serverName, toolName, 
      'Streaming enabled', { streamId: stream.getRequestId() });
  }
  
  try {
    // Create and validate the request
    const request: MCPToolRequest = {
      serverName,
      toolName,
      args: args || {}
    };

    // Perform basic validation
    const validationResult = validateMCPToolRequest(request);
    if (!validationResult.success) {
      const error = new MCPError(
        validationResult.error,
        MCPErrorType.VALIDATION_ERROR,
        { request }
      );
      
      // Send error to stream if streaming enabled
      if (stream) {
        stream.sendError(error.message);
      }
      
      throw error;
    }
    
    // Perform server-specific validation
    const serverSpecificValidation = validateServerSpecificRequest(validationResult.data);
    if (!serverSpecificValidation.success) {
      const error = new MCPError(
        serverSpecificValidation.error,
        MCPErrorType.VALIDATION_ERROR,
        { request }
      );
      
      // Send error to stream if streaming enabled
      if (stream) {
        stream.sendError(error.message);
      }
      
      throw error;
    }
  
    // Check if server exists
    const server = (mcpServers as Record<string, any>)[serverName];
    if (!server) {
      const error = new MCPError(
        `MCP server '${serverName}' not found`,
        MCPErrorType.SERVER_NOT_FOUND
      );
      
      // Send error to stream if streaming enabled
      if (stream) {
        stream.sendError(error.message);
      }
      
      throw error;
    }
    
    // Log the request
    logToolExecution(logMcpTools, LogLevel.INFO, requestId, serverName, toolName, 
      'Request', { args });

    // Call the tool
    const startTime = Date.now();
    const response = await server.handleRequest({
      type: 'call_tool',
      params: {
        name: toolName,
        arguments: args || {},
      },
      requestId
    });
    const duration = Date.now() - startTime;
    
    // Validate the response
    const validatedResponse = validateMCPToolResponse(response);
    if (!validatedResponse.success) {
      logToolExecution(logMcpTools, LogLevel.ERROR, requestId, serverName, toolName, 
        'Invalid response from server', { error: validatedResponse.error });
      const error = new MCPError(
        `Invalid response from ${serverName}.${toolName}: ${validatedResponse.error}`,
        MCPErrorType.EXECUTION_ERROR
      );
      
      // Send error to stream if streaming enabled
      if (stream) {
        stream.sendError(error.message);
      }
      
      throw error;
    }
    
    // Log success
    logToolExecution(logMcpTools, LogLevel.INFO, requestId, serverName, toolName, 
      'Success', { durationMs: duration });
    
    // If streaming was enabled, complete the stream
    if (stream) {
      // For streaming results, if the response has content, add each item to the stream
      if (validatedResponse.data.content) {
        for (const item of validatedResponse.data.content) {
          // Ensure the item type is one of the expected types
          if (item.type === 'text' || item.type === 'json' || item.type === 'image') {
            stream.sendDelta(item as MCPToolResultContentItem);
          } else {
            // Convert unknown types to text
            const textContent: MCPToolResultContentItem = {
              type: 'text',
              text: `Unrecognized content type: ${String(item.type)}`
            };
            stream.sendDelta(textContent);
          }
        }
      }
      
      // Mark stream as complete
      stream.complete();
      
      // Return result with stream ID
      return {
        ...validatedResponse.data,
        status: 'success',
        streamId: stream.getRequestId()
      } as MCPToolResult;
    } else {
      // Non-streaming response
      return {
        ...validatedResponse.data,
        status: 'success'
      } as MCPToolResult;
    }
  } catch (error: unknown) {
    // Already an MCPError - just pass it through
    if (error instanceof MCPError) {
      logToolExecution(logMcpTools, LogLevel.ERROR, requestId, serverName, toolName, 
        'MCPError', { error: error.message });
      
      // Send error to stream if streaming enabled and not already sent
      if (stream && !stream.isCompleted()) {
        stream.sendError(error.message);
      }
      
      return error.toResponse();
    }
    
    // Convert other errors to MCPError
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logToolExecution(logMcpTools, LogLevel.ERROR, requestId, serverName, toolName, 
      'Error calling tool', { error: errorMessage });
    
    // Create error response
    const mcpError = new MCPError(
      `Tool call failed: ${errorMessage}`,
      MCPErrorType.EXECUTION_ERROR
    );
    
    // Send error to stream if streaming enabled
    if (stream && !stream.isCompleted()) {
      stream.sendError(mcpError.message);
    }
    
    return mcpError.toResponse();
  }
}

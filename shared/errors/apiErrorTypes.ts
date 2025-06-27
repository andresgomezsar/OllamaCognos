/**
 * Standardized API Error Response
 * This provides a consistent error response format across all API endpoints
 */
export interface ApiErrorResponse {
  error: string;       // Error identifier (e.g., 'VALIDATION_ERROR', 'SERVER_ERROR')
  message: string;     // Human-readable error message
  code: string;        // Error code (HTTP status or custom error code)
  details?: any;       // Optional additional error details
  timestamp: string;   // ISO timestamp when the error occurred
  requestId: string;   // Unique identifier for the request for tracing
}

/**
 * Error categories for better error handling and reporting
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  DATABASE = 'database',
  NETWORK = 'network',
  NOT_FOUND = 'not_found',
  MCP_EXECUTION = 'mcp_execution',
  MCP_ROUTING = 'mcp_routing',
  MCP_SCHEMA = 'mcp_schema',
  UNKNOWN = 'unknown'
}

/**
 * Standardized API Success Response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId: string;
    [key: string]: any;
  };
}

/**
 * Type for unified API response - either success or error
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * MCP specific error response with additional tool execution information
 */
export interface McpErrorResponse extends ApiErrorResponse {
  server?: string;     // MCP server name
  tool?: string;       // Tool name that was being executed
  execution?: {        // Execution metadata
    startTime: string;
    endTime: string;
    duration: number;  // milliseconds
    attempts: number;
  };
}

/**
 * MCP Tool Response extending standard API response
 */
export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: McpErrorResponse;
  metadata: {
    executionTime: number;
    server: string;
    tool: string;
  };
}

/**
 * WebSocket connection states
 */
export enum WebSocketConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

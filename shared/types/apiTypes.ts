/**
 * Shared API types for consistent type safety between frontend and backend
 */

import { ApiErrorResponse, ApiSuccessResponse, MCPToolResponse } from "../errors/apiErrorTypes";

/**
 * Base pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  nextCursor?: string;
}

/**
 * MCP Tool request parameters
 */
export interface MCPToolRequestParams {
  tool: string;
  input: Record<string, any>;
  timeout?: number;
  async?: boolean;
}

/**
 * MCP Tool response data
 */
export interface MCPToolResponseData<T = any> {
  success: boolean;
  tool: string;
  result: T;
  executionTime?: number;
}

/**
 * MCP Tool execution API response
 */
export type MCPToolExecutionResponse<T = any> = ApiSuccessResponse<MCPToolResponseData<T>> | ApiErrorResponse;

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MCP_TOOL_REQUEST = 'mcp_tool_request',
  MCP_TOOL_RESPONSE = 'mcp_tool_response',
  MCP_TOOL_ERROR = 'mcp_tool_error',
  STREAM_START = 'stream_start',
  STREAM_DATA = 'stream_data',
  STREAM_END = 'stream_end',
  STREAM_ERROR = 'stream_error',
  PING = 'ping',
  PONG = 'pong',
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  requestId?: string;
  timestamp: string;
}

/**
 * Memory data structure
 */
export interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  source?: string;
  importance?: number;
  context?: Record<string, any>;
}

/**
 * Memory creation parameters
 */
export interface CreateMemoryParams {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  userId: string;
  source?: string;
  importance?: number;
  context?: Record<string, any>;
}

/**
 * Memory update parameters
 */
export interface UpdateMemoryParams {
  memory_id: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  importance?: number;
  context?: Record<string, any>;
}

/**
 * Memory retrieval parameters
 */
export interface GetMemoriesParams extends PaginationParams {
  userId: string;
  categories?: string[];
  tags?: string[];
  query?: string;
  startDate?: string;
  endDate?: string;
  includeContent?: boolean;
}

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

/**
 * Authentication response data
 */
export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * MCP Server configuration interface
 */
export interface MCPServerConfig {
  name: string;
  url?: string;
  apiKey?: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

/**
 * MCP Server registry status information
 */
export interface MCPServerStatus {
  name: string;
  healthy: boolean;
  toolCount: number;
  lastChecked: string;
  version?: string;
  features?: string[];
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  server: string;
  inputSchema: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: {
    [serviceName: string]: {
      status: 'ok' | 'degraded' | 'error';
      message?: string;
      details?: any;
    }
  };
}

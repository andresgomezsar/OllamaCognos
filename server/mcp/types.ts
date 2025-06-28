// MCP Type Definitions
// Based on Model Context Protocol specification

// Provider type enum
export type ProviderType = "ollama" | "lmstudio";

// Tool definition
export interface Tool {
  name: string;
  description: string;
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

// Prompt definition
export interface Prompt {
  id: string;
  name: string;
  description: string;
  text: string;
}

// Resource definition
export interface Resource {
  uri: string;
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

// MCP Request/Response types
export interface ListToolsRequest {
  type: 'list_tools';
}

export interface ListToolsResponse {
  tools: Tool[];
}

export interface CallToolRequest {
  type: 'call_tool';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface ContentItem {
  type: string;
  text: string;
}

export interface CallToolResponse {
  content: ContentItem[];
  isError: boolean;
}

export interface ListPromptsRequest {
  type: 'list_prompts';
}

export interface ListPromptsResponse {
  prompts: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export interface GetPromptRequest {
  type: 'get_prompt';
  params: {
    id: string;
  };
}

export interface GetPromptResponse {
  prompt: Prompt;
}

export interface ListResourcesRequest {
  type: 'list_resources';
}

export interface ListResourcesResponse {
  resources: Resource[];
}

export interface GetResourceRequest {
  type: 'get_resource';
  params: {
    uri: string;
  };
}

export interface GetResourceResponse {
  resource: any;
}

// Request handler types
export type RequestHandler<T, R> = (request: T) => Promise<R>;

// Define schema constants
export const ListToolsRequestSchema = 'list_tools';
export const CallToolRequestSchema = 'call_tool';
export const ListPromptsRequestSchema = 'list_prompts';
export const GetPromptRequestSchema = 'get_prompt';
export const ListResourcesRequestSchema = 'list_resources';
export const GetResourceRequestSchema = 'get_resource';

// Ollama API Types

/**
 * Ollama chat request interface
 */
export interface OllamaRequest {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    seed?: number;
  };
}

/**
 * Ollama chat response interface
 */
export interface OllamaResponse {
  model: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
}

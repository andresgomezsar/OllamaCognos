/**
 * Type declarations for @modelcontextprotocol/sdk
 */

declare module '@modelcontextprotocol/sdk' {
  // Resource types
  export interface Resource {
    uri: string;
    contents: ContentItem[];
    metadata?: Record<string, any>;
  }

  export interface ContentItem {
    text: string;
    mediaType?: string;
  }

  export interface ToolResponse {
    content: ContentItem[];
    metadata?: Record<string, any>;
  }

  // Define McpTool interface
  export interface McpTool {
    name: string;
    description: string;
    parameters?: Record<string, any>;
  }

  // StdioClientTransport options
  export interface StdioClientTransportOptions {
    command: string;
    args: string[];
    cwd?: string;
  }

  // StdioClientTransport class
  export class StdioClientTransport {
    constructor(options: StdioClientTransportOptions);
  }

  // Define McpClient interface
  export interface McpClientInstance {
    connect(): Promise<void>;
    disconnect(): void;
    getServerInfo(): Promise<any>;
    listTools(): Promise<McpTool[]>;
    listResources(cursor?: string): Promise<{resources: Resource[], nextCursor?: string}>;
    readResource(params: {uri: string}): Promise<Resource>;
    // Legacy method
    call(toolName: string, params: any): Promise<any>;
    // New method
    callTool(params: {name: string, params: Record<string, any>}): Promise<ToolResponse>;
  }

  // Define McpClient constructor
  export class McpClient {
    constructor(transport: StdioClientTransport);
    connect(): Promise<void>;
    disconnect(): void;
    getServerInfo(): Promise<any>;
    listTools(): Promise<McpTool[]>;
    listResources(cursor?: string): Promise<{resources: Resource[], nextCursor?: string}>;
    readResource(params: {uri: string}): Promise<Resource>;
    // Legacy method
    call(toolName: string, params: any): Promise<any>;
    // New method
    callTool(params: {name: string, params: Record<string, any>}): Promise<ToolResponse>;
  }
}

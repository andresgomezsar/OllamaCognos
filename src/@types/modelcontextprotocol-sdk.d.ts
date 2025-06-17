/**
 * Type declarations for @modelcontextprotocol/sdk
 */

declare module '@modelcontextprotocol/sdk' {
  // Define McpTool interface
  export interface McpTool {
    name: string;
    description: string;
    // Add other tool properties as needed
  }

  // Define McpClient interface
  export interface McpClientInstance {
    connect(): Promise<void>;
    disconnect(): void;
    getServerInfo(): Promise<any>;
    listTools(): Promise<McpTool[]>;
    call(toolName: string, params: any): Promise<any>;
    // Add more methods as needed
  }

  // Define McpClient constructor
  export class McpClient {
    constructor(options: any);
    connect(): Promise<void>;
    disconnect(): void;
    getServerInfo(): Promise<any>;
    listTools(): Promise<McpTool[]>;
    call(toolName: string, params: any): Promise<any>;
    // Add more methods as needed
  }
}

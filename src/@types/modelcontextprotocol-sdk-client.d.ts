// Top-level SDK declaration
declare module '@modelcontextprotocol/sdk' {
  export interface McpClientOptions {
    // Add options as needed
  }

  export interface StdioServerParameters {
    command: string;
    args: string[];
    // Add other parameters as needed
  }

  export class StdioClientTransport {
    constructor(server: StdioServerParameters);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  }

  export class McpClient {
    constructor(transport: StdioClientTransport, options?: McpClientOptions);
    
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getServerInfo(): Promise<any>;
    
    // Methods for resources
    readResource(params: { uri: string }): Promise<{
      contents: Array<{ text: string }>;
    }>;
    listResources(params?: { cursor?: string }): Promise<{
      resources: Array<{ uri: string }>
      nextCursor?: string
    }>;
    
    // Methods for tools
    callTool(params: {
      name: string;
      params: Record<string, any>;
    }): Promise<{
      content: Array<{ text: string }>;
      structuredContent?: any;
      isError?: boolean;
    }>;
    
    listTools(params?: Record<string, any>): Promise<{
      tools: Array<{
        name: string;
        description: string;
        parameters: Record<string, any>;
      }>
    }>;
  }
}

/**
 * Limitless AI MCP Server Implementation
 * 
 * This module provides a Model Context Protocol server implementation
 * for the Limitless AI Pendant API.
 */

import { LimitlessClient } from "../../limitless";

// Define interfaces for MCP tools and parameters
interface McpTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

interface McpToolCall {
  name: string;
  parameters: Record<string, any>;
}

export class LimitlessMcpServer {
  private client: LimitlessClient;
  private tools: McpTool[] = [];

  constructor(apiKey: string) {
    this.client = new LimitlessClient(apiKey);
    // Initialize tools cache
    this.initTools();
  }
  
  /**
   * Initialize the tools cache
   */
  private async initTools() {
    try {
      this.tools = await this.listTools();
    } catch (error) {
      console.error('Error initializing Limitless tools cache:', error);
      this.tools = [];
    }
  }

  /**
   * List available tools for the Limitless MCP server
   */
  /**
   * Get cached tools array
   */
  getTools(): McpTool[] {
    return this.tools;
  }
  
  /**
   * List available tools for the Limitless MCP server
   */
  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: "limitless_get_recent_entries",
        description: "Get recent journal entries from Limitless Pendant",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of entries to return (default: 20)",
            },
          },
        },
      },
      {
        name: "limitless_search_entries",
        description: "Search journal entries from Limitless Pendant by date range or content",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Optional search query to filter entries",
            },
            start_date: {
              type: "string",
              description: "Optional start date (ISO format) to filter entries",
            },
            end_date: {
              type: "string",
              description: "Optional end date (ISO format) to filter entries",
            },
            limit: {
              type: "integer",
              description: "Maximum number of entries to return (default: 50)",
            },
          },
        },
      },
      {
        name: "limitless_get_entry_by_id",
        description: "Get a specific journal entry from Limitless Pendant by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the journal entry",
            },
          },
          required: ["id"],
        },
      },
    ];
  }

  /**
   * Execute a tool call against the Limitless API
   */
  async executeToolCall(toolCall: McpToolCall): Promise<any> {
    const { name, parameters } = toolCall;

    switch (name) {
      case "limitless_get_recent_entries": {
        const { limit = 20 } = parameters;
        const entries = await this.client.getRecentEntries(limit);
        
        return {
          entries: entries.map(entry => ({
            id: entry.id,
            title: entry.title,
            created_at: entry.created_at,
            content: this.client.extractTextContent(entry),
            tags: entry.tags || [],
            headings: entry.headings || [],
          })),
        };
      }

      case "limitless_search_entries": {
        const { start_date, end_date, limit = 50 } = parameters;
        
        let entries = [];
        
        if (start_date) {
          const startTime = new Date(start_date);
          entries = await this.client.getEntriesSince(startTime, limit);
        } else {
          entries = await this.client.getRecentEntries(limit);
        }
        
        // Filter by date range if end_date is specified
        if (end_date) {
          const endTime = new Date(end_date);
          entries = entries.filter(entry => {
            const entryTime = new Date(entry.created_at);
            return entryTime <= endTime;
          });
        }
        
        return {
          entries: entries.map(entry => ({
            id: entry.id,
            title: entry.title,
            created_at: entry.created_at,
            content: this.client.extractTextContent(entry),
            tags: entry.tags || [],
            headings: entry.headings || [],
          })),
        };
      }

      case "limitless_get_entry_by_id": {
        const { id } = parameters;
        const entry = await this.client.getEntryById(id);
        
        if (!entry) {
          throw new Error(`Entry with ID ${id} not found`);
        }
        
        return {
          entry: {
            id: entry.id,
            title: entry.title,
            created_at: entry.created_at,
            content: this.client.extractTextContent(entry),
            tags: entry.tags || [],
            headings: entry.headings || [],
          },
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  
  /**
   * Handle a request to the MCP server
   * This provides compatibility with the MCP router
   */
  async handleRequest(request: any): Promise<any> {
    const { type } = request;
    
    switch (type) {
      case 'list_tools':
        return {
          tools: await this.listTools()
        };
      
      case 'execute_tool':
        if (!request.name) {
          throw new Error('Tool name is required');
        }
        return this.executeToolCall({
          name: request.name,
          parameters: request.arguments || {}
        });
      
      default:
        throw new Error(`Unsupported request type: ${type}`);
    }
  }

  /**
   * Create a streaming handler for the MCP server
   * This provides compatibility with the MCP router's streaming API
   */
  createStreamingHandler(options: { emit: (event: string, data: any) => void }): (data: any) => Promise<any> {
    return async (data: any) => {
      try {
        // Execute the tool call
        const result = await this.executeToolCall({
          name: data.name,
          parameters: data.arguments || {}
        });
        
        // Return the result
        return result;
      } catch (error) {
        console.error(`Error in Limitless MCP streaming handler:`, error);
        throw error;
      }
    };
  }

  /**
   * Check if the service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Try to get recent entries as a health check
      await this.client.getRecentEntries(1);
      return true;
    } catch (error) {
      console.error('Limitless health check failed:', error);
      return false;
    }
  }
}

/**
 * Create a new Limitless MCP server instance
 */

export function createLimitlessMcpServer(apiKey: string): LimitlessMcpServer {
  return new LimitlessMcpServer(apiKey);
}

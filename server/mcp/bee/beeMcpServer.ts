/**
 * Bee AI MCP Server Implementation
 * 
 * This module provides a Model Context Protocol server implementation
 * for the Bee AI transcription memory API.
 */

import { BeeClient, BeeSearchQuery } from "../../bee.js";

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

export class BeeMcpServer {
  private client: BeeClient;
  private tools: McpTool[] = [];

  constructor(apiKey: string, deviceId?: string) {
    this.client = new BeeClient(apiKey, deviceId);
    // Initialize tools on construction
    this.initTools();
  }

  /**
   * Initialize the tools array
   */
  private initTools() {
    this.tools = [
      {
        name: "bee_get_recent_memories",
        description: "Get recent transcription memories from Bee device",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 20)",
            },
            include_insights: {
              type: "boolean",
              description: "Whether to include AI-generated insights (default: true)",
            },
          },
        },
      },
      {
        name: "bee_search_memories",
        description: "Search transcription memories from Bee device by query and filters",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query to filter memories",
            },
            date_from: {
              type: "string",
              description: "Optional start date (ISO format) to filter memories",
            },
            date_to: {
              type: "string",
              description: "Optional end date (ISO format) to filter memories",
            },
            speakers: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Optional list of speaker IDs to filter by",
            },
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 50)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "bee_get_memory_by_id",
        description: "Get a specific transcription memory from Bee device by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the memory",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "bee_get_daily_summaries",
        description: "Get daily conversation summaries from Bee device",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Optional date in YYYY-MM-DD format (default: today)",
            },
            include_previous: {
              type: "integer",
              description: "Number of previous days to include (default: 0)",
            },
          },
        },
      },
      {
        name: "bee_get_knowledge_graph",
        description: "Get the personal knowledge graph built from Bee conversations",
        parameters: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Optional filter by entity type (person, organization, etc.)",
            },
            min_mentions: {
              type: "integer",
              description: "Minimum number of mentions for entities (default: 1)",
            },
          },
        },
      },
      {
        name: "bee_get_insights",
        description: "Get insights and analytics about conversation patterns from Bee",
        parameters: {
          type: "object",
          properties: {
            time_range: {
              type: "string",
              enum: ["day", "week", "month"],
              description: "Time range for analytics (default: week)",
            },
          },
        },
      },
    ];
  }

  /**
   * Get the cached tools array
   */
  getTools(): McpTool[] {
    return this.tools;
  }

  /**
   * List available tools for the Bee MCP server
   */
  async listTools(): Promise<McpTool[]> {
    return [
      {
        name: "bee_get_recent_memories",
        description: "Get recent transcription memories from Bee device",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 20)",
            },
            include_insights: {
              type: "boolean",
              description: "Whether to include AI-generated insights (default: true)",
            },
          },
        },
      },
      {
        name: "bee_search_memories",
        description: "Search transcription memories from Bee device by query and filters",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query to filter memories",
            },
            date_from: {
              type: "string",
              description: "Optional start date (ISO format) to filter memories",
            },
            date_to: {
              type: "string",
              description: "Optional end date (ISO format) to filter memories",
            },
            speakers: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Optional list of speaker IDs to filter by",
            },
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 50)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "bee_get_memory_by_id",
        description: "Get a specific transcription memory from Bee device by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the memory",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "bee_get_daily_summaries",
        description: "Get daily conversation summaries from Bee device",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Optional date in YYYY-MM-DD format (default: today)",
            },
            include_previous: {
              type: "integer",
              description: "Number of previous days to include (default: 0)",
            },
          },
        },
      },
      {
        name: "bee_get_knowledge_graph",
        description: "Get the personal knowledge graph built from Bee conversations",
        parameters: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Optional filter by entity type (person, organization, etc.)",
            },
            min_mentions: {
              type: "integer",
              description: "Minimum number of mentions for entities (default: 1)",
            },
          },
        },
      },
      {
        name: "bee_get_insights",
        description: "Get insights and analytics about conversation patterns from Bee",
        parameters: {
          type: "object",
          properties: {
            time_range: {
              type: "string",
              enum: ["day", "week", "month"],
              description: "Time range for analytics (default: week)",
            },
          },
        },
      },
    ];
  }

  /**
   * Execute a tool call against the Bee API
   */
  async executeToolCall(toolCall: McpToolCall): Promise<any> {
    const { name, parameters } = toolCall;

    switch (name) {
      case "bee_get_recent_memories": {
        const { limit = 20, include_insights = true } = parameters;
        const memories = await this.client.getRecentMemories(limit, include_insights);
        
        return {
          memories: memories.map(memory => ({
            id: memory.id,
            title: memory.title,
            created_at: memory.created_at,
            transcript: this.client.extractTextContent(memory),
            language: memory.language,
            confidence_score: memory.confidence_score,
            metadata: memory.metadata || {},
            insights: memory.insights || {},
          })),
        };
      }

      case "bee_search_memories": {
        const { 
          query, 
          date_from, 
          date_to,
          speakers,
          limit = 50 
        } = parameters;
        
        const searchQuery: BeeSearchQuery = {
          query,
          filters: {},
          limit
        };
        
        if (date_from) searchQuery.filters!.date_from = date_from;
        if (date_to) searchQuery.filters!.date_to = date_to;
        if (speakers) searchQuery.filters!.speakers = speakers;
        
        const memories = await this.client.searchMemories(searchQuery);
        
        return {
          memories: memories.map(memory => ({
            id: memory.id,
            title: memory.title,
            created_at: memory.created_at,
            transcript: this.client.extractTextContent(memory),
            language: memory.language,
            confidence_score: memory.confidence_score,
            metadata: memory.metadata || {},
            insights: memory.insights || {},
          })),
          query: searchQuery
        };
      }

      case "bee_get_memory_by_id": {
        const { id } = parameters;
        const memory = await this.client.getMemoryById(id);
        
        if (!memory) {
          throw new Error(`Memory with ID ${id} not found`);
        }
        
        return {
          memory: {
            id: memory.id,
            title: memory.title,
            created_at: memory.created_at,
            transcript: this.client.extractTextContent(memory),
            language: memory.language,
            confidence_score: memory.confidence_score,
            metadata: memory.metadata || {},
            insights: memory.insights || {},
          },
        };
      }

      case "bee_get_daily_summaries": {
        const { date, include_previous = 0 } = parameters;
        const summaries = await this.client.getDailySummaries(date, include_previous);
        
        return {
          summaries: summaries.map(summary => ({
            id: summary.id,
            date: summary.date,
            title: summary.title,
            summary: summary.summary,
            key_points: summary.key_points,
            participants: summary.participants,
            duration_minutes: summary.duration_minutes,
            memory_ids: summary.memory_ids,
            insights: summary.insights || {},
          })),
        };
      }

      case "bee_get_knowledge_graph": {
        const { entity_type, min_mentions = 1 } = parameters;
        const graph = await this.client.getKnowledgeGraph(entity_type, min_mentions);
        
        if (!graph) {
          return {
            knowledge_graph: {
              entities: [],
              relationships: []
            },
            message: "No knowledge graph data available"
          };
        }
        
        return {
          knowledge_graph: graph
        };
      }

      case "bee_get_insights": {
        const { time_range = 'week' } = parameters;
        const insights = await this.client.getInsights(time_range);
        
        return {
          insights,
          time_range
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Check if the service is healthy by testing the connection to the Bee API
   */
  async isHealthy(): Promise<boolean> {
    return this.client.isHealthy();
  }

  /**
   * Handle a generic request to the MCP server
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
  createStreamingHandler(options: any): (data: any) => Promise<any> {
    const { emit } = options;

    return async (data: any) => {
      try {
        const result = await this.executeToolCall({
          name: data.name,
          parameters: data.arguments || {}
        });

        // Return the result
        return result;
      } catch (error) {
        console.error(`Error in Bee MCP streaming handler:`, error);
        throw error;
      }
    };
  }
}

/**
 * Create a new Bee MCP server instance
 */
export function createBeeMcpServer(apiKey: string, deviceId?: string): BeeMcpServer {
  return new BeeMcpServer(apiKey, deviceId);
}

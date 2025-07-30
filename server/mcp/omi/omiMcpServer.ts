import { EventEmitter } from "events";
import { 
  OmiService,
  createOmiService 
} from "./omiService.js";
import { 
  omiTools 
} from "./omiTools.js";
import { 
  omiPrompts 
} from "./omiPrompts.js";
import {
  MemoryCategory,
  ConversationCategory,
  GetMemoriesParams,
  GetConversationsParams,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  BatchGetConversationsRequest,
  IncrementalSyncParams,
  SearchConversationsRequest,
  ToolResponse
} from "./interfaces.js";
import { 
  ContentItem,
  ListToolsRequest, 
  ListToolsResponse,
  CallToolRequest, 
  CallToolResponse,
  ListPromptsRequest, 
  ListPromptsResponse,
  GetPromptRequest, 
  GetPromptResponse,
  RequestHandler
} from "../types.js";

// Create an event emitter for real-time data streaming
export const omiEventEmitter = new EventEmitter();

/**
 * MCP Server for Omi Integration
 * Handles MCP requests and provides tools, prompts, and streaming capabilities
 * Optimized for Cognos memory aggregation with batch operations and incremental sync
 */
export class OmiMcpServer {
  private omiService: OmiService;

  constructor(apiKey: string, baseUrl?: string) {
    // Create Omi service with API key
    this.omiService = createOmiService(apiKey, baseUrl);
    
    // Set up event listeners
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for real-time data processing
   */
  private setupEventHandlers() {
    // Handle tool call events
    omiEventEmitter.on("tool-call", async (toolName, args) => {
      console.log(`Omi tool call received: ${toolName}`, args);
      
      // Process the tool call asynchronously
      try {
        const result = await this.handleToolCall(toolName, args);
        omiEventEmitter.emit("tool-result", toolName, result);
      } catch (error) {
        console.error(`Error in Omi tool call ${toolName}:`, error);
        omiEventEmitter.emit("tool-error", toolName, error);
      }
    });

    // Handle Cognos aggregation events
    omiEventEmitter.on("cognos-aggregation-request", async (userId, timeRange) => {
      try {
        console.log(`Processing Cognos aggregation request for user ${userId}`);
        const result = await this.handleCognosAggregation(userId, timeRange);
        omiEventEmitter.emit("cognos-aggregation-complete", userId, result);
      } catch (error) {
        console.error(`Error in Cognos aggregation for user ${userId}:`, error);
        omiEventEmitter.emit("cognos-aggregation-error", userId, error);
      }
    });
  }

  /**
   * Get list of available tools
   */
  handleListTools: RequestHandler<ListToolsRequest, ListToolsResponse> = 
    async () => {
      return {
        tools: omiTools,
      };
    };
    
  /**
   * List available tools (compatibility with McpServerWithRouter interface)
   */
  async listTools(): Promise<any[]> {
    return omiTools;
  }
  
  /**
   * Get cached tools array
   */
  getTools(): any[] {
    return omiTools;
  }
  
  /**
   * Execute a tool call directly (compatibility with McpServerWithRouter interface)
   */
  async executeToolCall(toolCall: { name: string; parameters: any }): Promise<any> {
    return this.handleToolCall(toolCall.name, toolCall.parameters);
  }

  /**
   * Get list of available prompts
   */
  handleListPrompts: RequestHandler<ListPromptsRequest, ListPromptsResponse> = 
    async () => {
      return {
        prompts: omiPrompts.map(p => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments || []
        }))
      };
    };

  /**
   * Get a specific prompt by name
   */
  handleGetPrompt: RequestHandler<GetPromptRequest, GetPromptResponse> = 
    async (request) => {
      const prompt = omiPrompts.find(p => p.name === request.name);
      if (!prompt) {
        throw new Error(`Prompt '${request.name}' not found`);
      }

      // Generate prompt content based on the prompt type and arguments
      const content = await this.generatePromptContent(prompt.name, request.arguments || {});

      return {
        description: prompt.description,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: content
            }
          }
        ]
      };
    };

  /**
   * Handle tool execution
   */
  private async handleToolCall(name: string, args: any): Promise<any> {
    try {
      // Get API key from args or environment
      const apiKey = args.api_key || process.env.OMI_API_KEY;
      if (!apiKey) {
        throw new Error("API key not provided and OMI_API_KEY environment variable not set");
      }

      // Update service if different API key provided
      if (args.api_key && args.api_key !== process.env.OMI_API_KEY) {
        this.omiService = createOmiService(args.api_key, args.base_url);
      }

      switch (name) {
        case "get_memories":
          return this.handleGetMemories(args);

        case "create_memory":
          return this.handleCreateMemory(args);

        case "edit_memory":
          return this.handleUpdateMemory(args);

        case "delete_memory":
          return this.handleDeleteMemory(args);

        case "get_conversations":
          return this.handleGetConversations(args);

        case "get_conversation_by_id":
          return this.handleGetConversationById(args);

        case "batch_get_conversations":
          return this.handleBatchGetConversations(args);

        case "get_changes_since":
          return this.handleGetChangesSince(args);

        case "search_conversations":
          return this.handleSearchConversations(args);

        case "omi_health_check":
          return this.handleHealthCheck();

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing Omi tool ${name}:`, error);
      throw error;
    }
  }

  // ========== Tool Handlers ==========

  private async handleGetMemories(args: any): Promise<ToolResponse> {
    const params: GetMemoriesParams = {
      userId: args.userId,
      limit: args.limit || 100,
      offset: args.offset || 0,
      categories: args.categories ? args.categories.map((c: string) => c as MemoryCategory) : undefined,
      start_date: args.start_date,
      end_date: args.end_date,
      search: args.search
    };

    const result = await this.omiService.getMemories(params);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "get_memories",
        timestamp: new Date().toISOString(),
        userId: args.userId
      }
    };
  }

  private async handleCreateMemory(args: any): Promise<ToolResponse> {
    const memoryData: CreateMemoryRequest = {
      content: args.content,
      category: args.category as MemoryCategory,
      metadata: args.metadata
    };

    const result = await this.omiService.createMemory(memoryData);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "create_memory",
        timestamp: new Date().toISOString()
      }
    };
  }

  private async handleUpdateMemory(args: any): Promise<ToolResponse> {
    const updateData: UpdateMemoryRequest = {
      content: args.content,
      category: args.category ? args.category as MemoryCategory : undefined,
      metadata: args.metadata
    };

    const result = await this.omiService.updateMemory(args.memory_id, updateData);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "edit_memory",
        timestamp: new Date().toISOString()
      }
    };
  }

  private async handleDeleteMemory(args: any): Promise<ToolResponse> {
    const result = await this.omiService.deleteMemory(args.memory_id);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "delete_memory",
        timestamp: new Date().toISOString()
      }
    };
  }

  private async handleGetConversations(args: any): Promise<ToolResponse> {
    const params: GetConversationsParams = {
      userId: args.userId,
      limit: args.limit || 20,
      offset: args.offset || 0,
      start_date: args.start_date,
      end_date: args.end_date,
      categories: args.categories ? args.categories.map((c: string) => c as ConversationCategory) : undefined,
      include_segments: args.include_segments,
      search: args.search
    };

    const result = await this.omiService.getConversations(params);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "get_conversations",
        timestamp: new Date().toISOString(),
        userId: args.userId
      }
    };
  }

  private async handleGetConversationById(args: any): Promise<ToolResponse> {
    const result = await this.omiService.getConversationById(
      args.conversation_id,
      args.include_segments !== false,
      args.userId
    );
    return {
      success: true,
      data: result,
      metadata: {
        tool: "get_conversation_by_id",
        timestamp: new Date().toISOString(),
        userId: args.userId
      }
    };
  }

  private async handleBatchGetConversations(args: any): Promise<ToolResponse> {
    const request: BatchGetConversationsRequest = {
      conversation_ids: args.conversation_ids,
      include_segments: args.include_segments !== false
    };

    const result = await this.omiService.batchGetConversations(request);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "batch_get_conversations",
        timestamp: new Date().toISOString(),
        batch_size: args.conversation_ids.length
      }
    };
  }

  private async handleGetChangesSince(args: any): Promise<ToolResponse> {
    const params: IncrementalSyncParams = {
      since_timestamp: args.since_timestamp,
      entity_type: args.entity_type,
      limit: args.limit || 1000
    };

    const result = await this.omiService.getEntityChangesSince(params);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "get_changes_since",
        timestamp: new Date().toISOString(),
        sync_type: "incremental"
      }
    };
  }

  private async handleSearchConversations(args: any): Promise<ToolResponse> {
    const request: SearchConversationsRequest = {
      query: args.query,
      limit: args.limit || 20,
      categories: args.categories ? args.categories.map((c: string) => c as ConversationCategory) : undefined,
      start_date: args.start_date,
      end_date: args.end_date,
      embedding_model: args.embedding_model
    };

    const result = await this.omiService.searchConversations(request);
    return {
      success: true,
      data: result,
      metadata: {
        tool: "search_conversations",
        timestamp: new Date().toISOString(),
        search_type: "semantic"
      }
    };
  }

  private async handleHealthCheck(): Promise<ToolResponse> {
    const isHealthy = await this.omiService.healthCheck();
    return {
      success: isHealthy,
      data: {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString()
      },
      metadata: {
        tool: "omi_health_check",
        timestamp: new Date().toISOString()
      }
    };
  }

  // ========== Cognos Integration Helpers ==========

  /**
   * Handle Cognos memory aggregation request
   */
  private async handleCognosAggregation(userId: string, timeRange: { start: string; end: string }) {
    console.log(`Processing Cognos aggregation for user ${userId} from ${timeRange.start} to ${timeRange.end}`);

    // Get conversations from the time range
    const conversations = await this.omiService.getConversations({
      start_date: timeRange.start,
      end_date: timeRange.end,
      limit: 1000,
      include_segments: true
    });

    // Get memories from the time range
    const memories = await this.omiService.getMemories({
      start_date: timeRange.start,
      end_date: timeRange.end,
      limit: 1000
    });

    return {
      userId,
      timeRange,
      conversations: conversations.data || [],
      memories: memories.data || [],
      aggregated_at: new Date().toISOString()
    };
  }

  /**
   * Generate prompt content based on prompt name and arguments
   */
  private async generatePromptContent(promptName: string, args: Record<string, any>): Promise<string> {
    switch (promptName) {
      case "omi-memory-context":
        return this.generateMemoryContextPrompt(args);
      case "omi-conversation-summary":
        return this.generateConversationSummaryPrompt(args);
      case "omi-health-insights":
        return this.generateHealthInsightsPrompt(args);
      case "omi-cognos-aggregation":
        return this.generateCognosAggregationPrompt(args);
      case "omi-personalization":
        return this.generatePersonalizationPrompt(args);
      default:
        throw new Error(`Unknown prompt: ${promptName}`);
    }
  }

  private async generateMemoryContextPrompt(args: Record<string, any>): Promise<string> {
    const limit = args.limit || 50;
    const recentDays = args.recent_days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - recentDays);

    const memories = await this.omiService.getMemories({
      limit,
      start_date: startDate.toISOString().split('T')[0],
      categories: args.categories
    });

    return `Recent user memories (last ${recentDays} days):\n\n${
      memories.data?.map(m => `- ${m.category}: ${m.content}`).join('\n') || 'No recent memories found.'
    }`;
  }

  private async generateConversationSummaryPrompt(args: Record<string, any>): Promise<string> {
    if (args.conversation_id) {
      const conversation = await this.omiService.getConversationById(args.conversation_id);
      return `Conversation Summary:\n${conversation.data?.summary || conversation.data?.transcript || 'No conversation data available.'}`;
    }

    const daysBack = args.days_back || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const conversations = await this.omiService.getConversations({
      start_date: startDate.toISOString().split('T')[0],
      categories: args.categories,
      limit: 10
    });

    return `Recent conversations (last ${daysBack} days):\n\n${
      conversations.data?.map(c => `- ${c.category || 'general'}: ${c.summary || c.title || 'No summary available'}`).join('\n') || 'No recent conversations found.'
    }`;
  }

  private async generateHealthInsightsPrompt(args: Record<string, any>): Promise<string> {
    const timeframeDays = args.timeframe_days || 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    // Search for health-related conversations
    const healthConversations = await this.omiService.searchConversations({
      query: "health sleep exercise mental wellness nutrition symptoms doctor",
      start_date: startDate.toISOString().split('T')[0],
      limit: 20
    });

    return `Health insights from conversations (last ${timeframeDays} days):\n\n${
      healthConversations.data?.map(c => `- ${c.summary || c.title || 'Health-related conversation'}`).join('\n') || 'No health-related conversations found.'
    }\n\nFocus areas: ${args.focus_areas || 'general health topics'}`;
  }

  private async generateCognosAggregationPrompt(args: Record<string, any>): Promise<string> {
    if (!args.user_id || !args.start_date || !args.end_date) {
      throw new Error("user_id, start_date, and end_date are required for Cognos aggregation prompt");
    }

    const aggregationData = await this.handleCognosAggregation(args.user_id, {
      start: args.start_date,
      end: args.end_date
    });

    return `Cognos Memory Aggregation Data for User ${args.user_id}:

Time Range: ${args.start_date} to ${args.end_date}
Conversations: ${aggregationData.conversations.length}
Memories: ${aggregationData.memories.length}
Health Correlation: ${args.include_health_correlation ? 'Enabled' : 'Disabled'}

Ready for Cognos processing and health data correlation.`;
  }

  private async generatePersonalizationPrompt(args: Record<string, any>): Promise<string> {
    const interactionType = args.interaction_type || 'general';
    const focusCategories = args.focus_categories || [];

    const recentMemories = await this.omiService.getMemories({
      limit: 20,
      categories: focusCategories
    });

    return `Personalization context for ${interactionType} interaction:

User preferences and patterns:
${recentMemories.data?.map(m => `- ${m.category}: ${m.content}`).join('\n') || 'No user preferences available.'}

Focus areas: ${focusCategories.join(', ') || 'general'}`;
  }

  /**
   * Health check for the server
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.omiService.healthCheck();
    } catch (error) {
      console.error('Omi MCP Server health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create an OmiMcpServer instance
 */
export function createOmiMcpServer(apiKey: string, baseUrl?: string): OmiMcpServer {
  return new OmiMcpServer(apiKey, baseUrl);
}
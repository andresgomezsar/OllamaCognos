import {
  OmiApiResponse,
  OmiMemory,
  OmiConversation,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  MemoryListResponse,
  ConversationListResponse,
  GetMemoriesParams,
  GetConversationsParams,
  BatchGetConversationsRequest,
  BatchGetConversationsResponse,
  IncrementalSyncParams,
  SearchConversationsRequest,
  MemoryCategory,
  ConversationCategory,
  OmiApiError,
  ToolResponse
} from "./interfaces.js";

/**
 * Service class for interacting with the Omi API
 * Handles all API communication and provides methods for memory and conversation management
 */
export class OmiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || process.env.OMI_API_BASE_URL || "https://api.omi.me/v1/mcp/";
    
    if (!this.baseUrl || this.baseUrl === "") {
      throw new Error("Omi API base URL not configured");
    }
  }

  /**
   * Makes a request to the Omi API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      params?: Record<string, any>;
      body?: any;
      userId?: string;
    } = {}
  ): Promise<T> {
    const { method = 'GET', params = {}, body, userId } = options;
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    // Add user ID to headers if provided (common pattern for user-scoped APIs)
    if (userId) {
      headers['X-User-ID'] = userId;
    }

    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add userId to query params as well (some APIs expect it here)
    if (userId) {
      url.searchParams.append('user_id', userId);
    }
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });

    const requestOptions: RequestInit = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Omi API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Omi API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ========== Memory Operations ==========

  /**
   * Get list of memories with filtering
   */
  async getMemories(params: GetMemoriesParams = {}): Promise<MemoryListResponse> {
    const queryParams: Record<string, any> = {
      limit: params.limit || 100,
      offset: params.offset || 0
    };

    if (params.categories && params.categories.length > 0) {
      queryParams.categories = params.categories.map(c => c.toString());
    }

    if (params.start_date) {
      queryParams.start_date = params.start_date;
    }

    if (params.end_date) {
      queryParams.end_date = params.end_date;
    }

    if (params.search) {
      queryParams.search = params.search;
    }

    return this.makeRequest<MemoryListResponse>('memories', { 
      params: queryParams,
      userId: params.userId 
    });
  }

  /**
   * Create a new memory
   */
  async createMemory(memoryData: CreateMemoryRequest): Promise<OmiApiResponse<OmiMemory>> {
    return this.makeRequest<OmiApiResponse<OmiMemory>>('memories', {
      method: 'POST',
      body: memoryData
    });
  }

  /**
   * Update an existing memory
   */
  async updateMemory(memoryId: string, updateData: UpdateMemoryRequest): Promise<OmiApiResponse<OmiMemory>> {
    return this.makeRequest<OmiApiResponse<OmiMemory>>(`memories/${memoryId}`, {
      method: 'PATCH',
      body: updateData
    });
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string): Promise<OmiApiResponse<{ success: boolean }>> {
    return this.makeRequest<OmiApiResponse<{ success: boolean }>>(`memories/${memoryId}`, {
      method: 'DELETE'
    });
  }

  // ========== Conversation Operations ==========

  /**
   * Get list of conversations with filtering
   */
  async getConversations(params: GetConversationsParams = {}): Promise<ConversationListResponse> {
    const queryParams: Record<string, any> = {
      limit: params.limit || 20,
      offset: params.offset || 0
    };

    if (params.start_date) {
      queryParams.start_date = params.start_date;
    }

    if (params.end_date) {
      queryParams.end_date = params.end_date;
    }

    if (params.categories && params.categories.length > 0) {
      queryParams.categories = params.categories.map(c => c.toString());
    }

    if (params.include_segments) {
      queryParams.include_segments = params.include_segments;
    }

    if (params.search) {
      queryParams.search = params.search;
    }

    return this.makeRequest<ConversationListResponse>('conversations', { 
      params: queryParams,
      userId: params.userId 
    });
  }

  /**
   * Get a specific conversation by ID with full transcript
   */
  async getConversationById(conversationId: string, includeSegments = true, userId?: string): Promise<OmiApiResponse<OmiConversation>> {
    const params: Record<string, any> = {};
    if (includeSegments) {
      params.include_segments = true;
    }

    return this.makeRequest<OmiApiResponse<OmiConversation>>(`conversations/${conversationId}`, { 
      params,
      userId 
    });
  }

  // ========== Batch Operations (Cognos Optimizations) ==========

  /**
   * Get multiple conversations by ID in a single request
   * Optimization for Cognos memory aggregation
   */
  async batchGetConversations(request: BatchGetConversationsRequest): Promise<BatchGetConversationsResponse> {
    const { conversation_ids, include_segments = true } = request;
    
    // For now, we'll implement this as parallel requests
    // TODO: Replace with actual batch API when available
    const results: OmiConversation[] = [];
    const failed_ids: string[] = [];
    const errors: Record<string, string> = {};

    const promises = conversation_ids.map(async (id) => {
      try {
        const response = await this.getConversationById(id, include_segments);
        if (response.data) {
          results.push(response.data);
        }
      } catch (error) {
        failed_ids.push(id);
        errors[id] = error instanceof Error ? error.message : 'Unknown error';
      }
    });

    await Promise.allSettled(promises);

    return {
      success: true,
      data: results,
      failed_ids: failed_ids.length > 0 ? failed_ids : undefined,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Get entities modified since a specific timestamp
   * Optimization for incremental sync in Cognos
   */
  async getEntityChangesSince(params: IncrementalSyncParams): Promise<OmiApiResponse<any[]>> {
    const queryParams: Record<string, any> = {
      since_timestamp: params.since_timestamp,
      limit: params.limit || 1000
    };

    const endpoint = params.entity_type === 'memories' ? 'memories/incremental' : 'conversations/incremental';
    
    // Note: This endpoint may not exist yet in Omi API
    // This is a proposed optimization for Cognos integration
    try {
      return this.makeRequest<OmiApiResponse<any[]>>(endpoint, { params: queryParams });
    } catch (error) {
      // Fallback to regular API with date filtering
      console.warn(`Incremental sync endpoint not available, falling back to date filtering`);
      
      if (params.entity_type === 'memories') {
        return this.getMemories({
          limit: params.limit,
          start_date: params.since_timestamp.split('T')[0] // Extract date part
        });
      } else {
        return this.getConversations({
          limit: params.limit,
          start_date: params.since_timestamp.split('T')[0] // Extract date part
        });
      }
    }
  }

  /**
   * Semantic search for conversations
   * Optimization for Cognos intelligent memory aggregation
   */
  async searchConversations(request: SearchConversationsRequest): Promise<ConversationListResponse> {
    const queryParams: Record<string, any> = {
      query: request.query,
      limit: request.limit || 20
    };

    if (request.categories && request.categories.length > 0) {
      queryParams.categories = request.categories.map(c => c.toString());
    }

    if (request.start_date) {
      queryParams.start_date = request.start_date;
    }

    if (request.end_date) {
      queryParams.end_date = request.end_date;
    }

    if (request.embedding_model) {
      queryParams.embedding_model = request.embedding_model;
    }

    // Note: This endpoint may not exist yet in Omi API
    // This is a proposed optimization for Cognos integration
    try {
      return this.makeRequest<ConversationListResponse>('conversations/search', { params: queryParams });
    } catch (error) {
      // Fallback to regular search parameter
      console.warn(`Semantic search endpoint not available, falling back to text search`);
      return this.getConversations({
        search: request.query,
        limit: request.limit,
        categories: request.categories,
        start_date: request.start_date,
        end_date: request.end_date
      });
    }
  }

  // ========== Health Check ==========

  /**
   * Health check to verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch a small number of memories to test connectivity
      await this.getMemories({ limit: 1 });
      return true;
    } catch (error) {
      console.error('Omi API health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create an OmiService instance
 */
export function createOmiService(apiKey: string, baseUrl?: string): OmiService {
  return new OmiService(apiKey, baseUrl);
}
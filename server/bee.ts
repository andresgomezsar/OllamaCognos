/**
 * Bee AI Client
 * 
 * This module provides a TypeScript client for accessing the Bee AI transcription memory API.
 * It allows retrieving transcription memories, conversation summaries, and insights from the Bee device.
 */

import axios from 'axios';

export interface BeeTranscriptionMemory {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  transcript: string;
  language: string;
  confidence_score: number;
  speakers?: {
    speaker_id: string;
    name?: string;
    segments: {
      start_time: number;
      end_time: number;
      text: string;
    }[];
  }[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata?: {
    duration: number;
    word_count: number;
    context_tags: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
  insights?: {
    key_topics: string[];
    action_items: string[];
    summary: string;
    entities: {
      type: 'person' | 'organization' | 'location' | 'event';
      name: string;
      confidence: number;
    }[];
  };
}

export interface BeeConversationSummary {
  id: string;
  date: string;
  title: string;
  summary: string;
  key_points: string[];
  participants: string[];
  duration_minutes: number;
  memory_ids: string[];
  insights?: {
    mood: string;
    productivity_score: number;
    follow_ups: string[];
  };
}

export interface BeeKnowledgeGraph {
  entities: {
    id: string;
    name: string;
    type: 'person' | 'organization' | 'concept' | 'event';
    connections: {
      entity_id: string;
      relationship: string;
      strength: number;
    }[];
    mentions: {
      memory_id: string;
      context: string;
      timestamp: string;
    }[];
  }[];
  relationships: {
    from_entity: string;
    to_entity: string;
    type: string;
    confidence: number;
  }[];
}

export interface BeeResponse<T> {
  data: T;
  meta: {
    total?: number;
    page?: number;
    per_page?: number;
    next_cursor?: string;
    has_more?: boolean;
  };
}

export interface BeeSearchQuery {
  query: string;
  filters?: {
    date_from?: string;
    date_to?: string;
    speakers?: string[];
    languages?: string[];
    min_confidence?: number;
    has_insights?: boolean;
    location_radius?: {
      lat: number;
      lng: number;
      radius_km: number;
    };
  };
  sort?: 'relevance' | 'date' | 'confidence';
  limit?: number;
}

export class BeeClient {
  private apiKey: string;
  private baseUrl: string;
  private deviceId?: string;

  constructor(apiKey: string, deviceId?: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.bee.computer/v1";
    this.deviceId = deviceId;
  }

  /**
   * Make an authenticated request to the Bee API
   * 
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @param method - HTTP method
   * @returns JSON response
   */
  private async makeRequest<T>(
    endpoint: string, 
    params?: Record<string, any>, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Bee API key not configured');
    }

    const options: any = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    };

    if (this.deviceId) {
      options.headers['X-Device-ID'] = this.deviceId;
    }

    if (params) {
      if (method === 'GET') {
        options.params = params;
      } else {
        options.data = params;
      }
    }

    try {
      const response = await axios(options);
      return response.data;
    } catch (error: any) {
      console.error(`Bee API request failed (${endpoint}):`, 
        error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get recent transcription memories from the Bee device
   * 
   * @param limit - Maximum number of memories to return
   * @param includeInsights - Whether to include AI-generated insights
   * @returns List of transcription memories
   */
  async getRecentMemories(limit: number = 20, includeInsights: boolean = true): Promise<BeeTranscriptionMemory[]> {
    const params: Record<string, any> = {
      limit,
      include_insights: includeInsights,
    };

    try {
      const response = await this.makeRequest<BeeResponse<BeeTranscriptionMemory[]>>('/memories', params);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch recent memories:', error);
      return [];
    }
  }

  /**
   * Get transcription memories created since a specific time
   * 
   * @param sinceTime - Only get memories created after this time
   * @param limit - Maximum number of memories to return
   * @returns List of transcription memories
   */
  async getMemoriesSince(sinceTime: Date, limit: number = 50): Promise<BeeTranscriptionMemory[]> {
    const params: Record<string, any> = {
      start_date: sinceTime.toISOString(),
      limit,
    };

    try {
      const response = await this.makeRequest<BeeResponse<BeeTranscriptionMemory[]>>('/memories', params);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch memories since:', error);
      return [];
    }
  }

  /**
   * Get a specific transcription memory by ID
   * 
   * @param id - The unique ID of the memory
   * @returns The transcription memory or null if not found
   */
  async getMemoryById(id: string): Promise<BeeTranscriptionMemory | null> {
    try {
      const response = await this.makeRequest<BeeResponse<BeeTranscriptionMemory>>(`/memories/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch memory ${id}:`, error);
      return null;
    }
  }

  /**
   * Search transcription memories using natural language or keywords
   * 
   * @param searchQuery - Search parameters and filters
   * @returns Matching transcription memories
   */
  async searchMemories(searchQuery: BeeSearchQuery): Promise<BeeTranscriptionMemory[]> {
    try {
      const response = await this.makeRequest<BeeResponse<BeeTranscriptionMemory[]>>('/memories/search', searchQuery, 'POST');
      return response.data || [];
    } catch (error) {
      console.error('Search memories failed:', error);
      return [];
    }
  }

  /**
   * Get daily conversation summaries
   * 
   * @param date - Specific date (YYYY-MM-DD) or leave empty for today
   * @param includePrevious - Number of previous days to include
   * @returns Daily conversation summaries
   */
  async getDailySummaries(date?: string, includePrevious: number = 0): Promise<BeeConversationSummary[]> {
    const params: Record<string, any> = {};
    
    if (date) {
      params.date = date;
    }
    
    if (includePrevious > 0) {
      params.previous_days = includePrevious;
    }

    try {
      const response = await this.makeRequest<BeeResponse<BeeConversationSummary[]>>('/summaries/daily', params);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch daily summaries:', error);
      return [];
    }
  }

  /**
   * Get the personal knowledge graph built from conversations
   * 
   * @param entityType - Filter by entity type
   * @param minMentions - Minimum number of mentions for entities
   * @returns Knowledge graph with entities and relationships
   */
  async getKnowledgeGraph(entityType?: string, minMentions: number = 1): Promise<BeeKnowledgeGraph | null> {
    const params: Record<string, any> = {
      min_mentions: minMentions,
    };
    
    if (entityType) {
      params.entity_type = entityType;
    }

    try {
      const response = await this.makeRequest<BeeResponse<BeeKnowledgeGraph>>('/knowledge-graph', params);
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch knowledge graph:', error);
      return null;
    }
  }

  /**
   * Get insights and analytics about conversation patterns
   * 
   * @param timeRange - Time range for analytics ('day', 'week', 'month')
   * @returns Conversation insights and analytics
   */
  async getInsights(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const params: Record<string, any> = {
      time_range: timeRange,
    };

    try {
      const response = await this.makeRequest<BeeResponse<any>>('/insights', params);
      return response.data || {};
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      return {};
    }
  }

  /**
   * Extract readable text content from a transcription memory
   * 
   * @param memory - A transcription memory from Bee
   * @returns Plain text content with speaker labels
   */
  extractTextContent(memory: BeeTranscriptionMemory): string {
    if (memory.speakers && memory.speakers.length > 0) {
      let formattedText = "";
      
      // Sort all segments by start time across all speakers
      const allSegments = memory.speakers.flatMap(speaker => 
        speaker.segments.map(segment => ({
          ...segment,
          speaker_name: speaker.name || `Speaker ${speaker.speaker_id}`
        }))
      ).sort((a, b) => a.start_time - b.start_time);

      // Build conversation with speaker labels
      let currentSpeaker = "";
      for (const segment of allSegments) {
        if (segment.speaker_name !== currentSpeaker) {
          if (formattedText) formattedText += "\n\n";
          formattedText += `${segment.speaker_name}: `;
          currentSpeaker = segment.speaker_name;
        } else {
          formattedText += " ";
        }
        formattedText += segment.text;
      }
      
      return formattedText;
    }
    
    // Fallback to raw transcript
    return memory.transcript;
  }

  /**
   * Test the connection to the Bee API using the provided API key
   * @returns Connection status and device info if successful
   */
  async testConnection(): Promise<{ status: string, device?: any, meta?: any }> {
    try {
      const response = await this.makeRequest<BeeResponse<any>>('/device/status');
      
      return { 
        status: 'connected', 
        device: response.data,
        meta: response.meta 
      };
    } catch (error) {
      console.error('Failed to connect to Bee API:', error);
      return { 
        status: 'error',
        meta: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Update device settings
   * 
   * @param settings - Device configuration settings
   * @returns Updated settings
   */
  async updateDeviceSettings(settings: {
    language?: string;
    auto_transcribe?: boolean;
    privacy_mode?: boolean;
    insight_generation?: boolean;
    location_tracking?: boolean;
  }): Promise<any> {
    try {
      const response = await this.makeRequest<BeeResponse<any>>('/device/settings', settings, 'PUT');
      return response.data || {};
    } catch (error) {
      console.error('Failed to update device settings:', error);
      throw error;
    }
  }

  /**
   * Delete a specific memory
   * 
   * @param id - Memory ID to delete
   * @returns Success status
   */
  async deleteMemory(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/memories/${id}`, undefined, 'DELETE');
      return true;
    } catch (error) {
      console.error(`Failed to delete memory ${id}:`, error);
      return false;
    }
  }

  /**
   * Check if the client is healthy and can connect to the Bee API
   * @returns true if API is reachable, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      const status = await this.testConnection();
      return status.status === 'connected';
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create a new Bee client instance
 */
export function createBeeClient(apiKey: string, deviceId?: string): BeeClient {
  if (!apiKey) {
    throw new Error('Bee API key is required');
  }
  return new BeeClient(apiKey, deviceId);
}

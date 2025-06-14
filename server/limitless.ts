/**
 * Limitless AI API Client
 * 
 * This module provides a TypeScript client for accessing the Limitless AI Pendant API.
 * It allows retrieving journal entries ("lifelogs") from the Limitless Pendant device.
 */

interface LimitlessLifelog {
  id: string;
  title: string;
  created_at: string;
  markdown?: string;
  contents?: {
    content: string;
    children?: {
      content: string;
    }[];
  }[];
  tags?: string[];
  headings?: string[];
}

interface LimitlessResponse {
  data: {
    lifelogs: LimitlessLifelog[];
  };
  meta: {
    total?: number;
    next_cursor?: string;
  };
}

export class LimitlessClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.limitless.ai/v1";
  }

  /**
   * Make an authenticated request to the Limitless API
   * 
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @returns JSON response
   */
  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Limitless API key not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Limitless API key');
        }
        throw new Error(`Limitless API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch data from Limitless API');
    }
  }

  /**
   * Get recent journal entries from Limitless
   * 
   * @param limit - Maximum number of entries to return
   * @returns List of journal entries
   */
  async getRecentEntries(limit: number = 20): Promise<LimitlessLifelog[]> {
    const params: Record<string, string> = {
      limit: limit.toString(),
      direction: 'desc',
      includeMarkdown: 'true',
      includeHeadings: 'true',
      timezone: 'America/Los_Angeles' // Use PST timezone for consistency
    };

    try {
      const response = await this.makeRequest<LimitlessResponse>('/lifelogs', params);
      
      if (response.data && response.data.lifelogs) {
        return response.data.lifelogs;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Limitless entries:', error);
      return [];
    }
  }

  /**
   * Get Limitless entries created since a specific time
   * 
   * @param sinceTime - Only get entries created after this time
   * @param limit - Maximum number of entries to return
   * @returns List of journal entries
   */
  async getEntriesSince(sinceTime: Date, limit: number = 50): Promise<LimitlessLifelog[]> {
    const sinceStr = sinceTime.toISOString();
    
    const params: Record<string, string> = {
      start_time: sinceStr,
      limit: limit.toString(),
      sort: 'desc',
      includeMarkdown: 'true',
      includeHeadings: 'true',
      timezone: 'America/Los_Angeles'
    };

    try {
      const response = await this.makeRequest<LimitlessResponse>('/lifelogs', params);
      
      if (response.data && response.data.lifelogs) {
        return response.data.lifelogs;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Limitless entries since:', error);
      return [];
    }
  }

  /**
   * Get a specific Limitless entry by ID
   * 
   * @param id - The unique ID of the lifelog entry
   * @returns The journal entry or null if not found
   */
  async getEntryById(id: string): Promise<LimitlessLifelog | null> {
    try {
      const response = await this.makeRequest<{ data: LimitlessLifelog }>(`/lifelogs/${id}`);
      
      if (response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching Limitless entry ${id}:`, error);
      return null;
    }
  }

  /**
   * Extract plain text content from a Limitless entry
   * 
   * @param entry - A journal entry from Limitless
   * @returns Plain text content
   */
  extractTextContent(entry: LimitlessLifelog): string {
    // First check if markdown content is available
    if (entry.markdown) {
      return entry.markdown;
    }
    
    // Otherwise extract content from the structured format
    let text = "";
    if (entry.contents) {
      for (const item of entry.contents) {
        if (item.content) {
          text += item.content + "\n";
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.content) {
              text += "  " + child.content + "\n";
            }
          }
        }
      }
    }
    return text;
  }

  /**
   * Test the connection to the Limitless API using the provided API key
   * @returns Connection status and user info if successful
   */
  async testConnection(): Promise<{ status: string, meta?: any }> {
    try {
      // Get a single lifelog to test authentication
      const params = {
        limit: "1",
      };
      const response = await this.makeRequest<LimitlessResponse>('/lifelogs', params);
      
      return { 
        status: 'connected', 
        meta: response.meta 
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Limitless API');
    }
  }
}

export const createLimitlessClient = (apiKey?: string) => {
  if (!apiKey) {
    throw new Error('Limitless API key is required');
  }
  return new LimitlessClient(apiKey);
};

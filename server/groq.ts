import axios from 'axios';

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface GroqChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
  usage: GroqUsage;
}

/**
 * Client for the Groq API
 */
export class GroqClient {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Send a chat completion request to the Groq API
   * @param request Chat request parameters
   * @returns Chat completion response
   */
  async chat(request: GroqRequest): Promise<GroqResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`, 
        {
          ...request,
          stream: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Groq API error:', error.response?.data || error.message);
      throw new Error(`Failed to connect to Groq: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * List available models from Groq
   * @returns Array of available models
   */
  async listModels(): Promise<{ data: Array<{ id: string; name?: string; created?: number }> }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch Groq models:', error.response?.data || error.message);
      return { data: [] };
    }
  }

  /**
   * Test the connection to the Groq API
   * @returns True if the connection is healthy, false otherwise
   */
  async testConnection(): Promise<{success: boolean, message?: string, models?: string[]}> {
    try {
      const models = await this.listModels();
      if (models.data && models.data.length > 0) {
        return { 
          success: true, 
          message: `Successfully connected to Groq API. Found ${models.data.length} models.`,
          models: models.data.map(m => m.id)
        };
      }
      return { success: false, message: 'No models found in Groq API response.' };
    } catch (error: any) {
      console.error('Groq connection test failed:', error.message);
      return { 
        success: false, 
        message: `Failed to connect to Groq API: ${error.message}` 
      };
    }
  }

  /**
   * Check if the API connection is healthy
   * @returns True if the connection is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.testConnection();
      return result.success;
    } catch {
      return false;
    }
  }
}

/**
 * Create a Groq client with the provided API key
 * @param apiKey Groq API key
 * @returns Groq client instance
 */
export const createGroqClient = (apiKey: string): GroqClient => {
  return new GroqClient(apiKey);
};

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      console.log('OpenRouter request:', JSON.stringify(request, null, 2));
      
      const requestBody = JSON.stringify({
        ...request,
        stream: false,
      });
      
      console.log(`Sending request to ${this.baseUrl}/chat/completions with body length: ${requestBody.length}`);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cognos-ai.replit.app',
          'X-Title': 'Cognos AI Health Assistant',
        },
        body: requestBody,
      });

      console.log(`OpenRouter response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch((e) => {
          console.error('Failed to parse error response:', e);
          return {};
        });
        console.error('OpenRouter API error details:', JSON.stringify(errorData, null, 2));
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log('OpenRouter response:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error('OpenRouter chat error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to connect to OpenRouter: ${error.message}`);
      }
      throw new Error('Failed to connect to OpenRouter: Unknown error');
    }
  }

  async listModels(): Promise<{ data: Array<{ id: string; name: string; context_length: number }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return { data: [] };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
}

export const createOpenRouterClient = (apiKey: string) => {
  return new OpenRouterClient(apiKey);
};
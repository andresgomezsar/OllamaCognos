interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async chat(request: OllamaRequest): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          stream: false, // Always use non-streaming for simplicity
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Ollama: ${error.message}`);
      }
      throw new Error('Failed to connect to Ollama: Unknown error');
    }
  }

  async listModels(): Promise<{ models: Array<{ name: string; size: number; modified_at: string }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list models: ${error.message}`);
      }
      throw new Error('Failed to list models: Unknown error');
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Test connection to Ollama API and return model information if successful
   * @returns Object with connection details and available models
   */
  async testConnection(): Promise<{ status: string, models?: Array<{name: string, size: number}> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { 
        status: 'connected', 
        models: data.models?.map((model: any) => ({
          name: model.name,
          size: model.size,
        })) || [] 
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Ollama: ${error.message}`);
      }
      throw new Error('Failed to connect to Ollama: Unknown error');
    }
  }
}

export const createOllamaClient = (baseUrl?: string) => {
  return new OllamaClient(baseUrl);
};

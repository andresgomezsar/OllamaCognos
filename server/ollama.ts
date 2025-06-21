export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  disableMcpTools?: boolean;
  enabledMcpTools?: string[];
}

export interface OllamaResponse {
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

  constructor(baseUrl?: string) {
    // Determine which URL to use based on USE_NGROK flag
    const useNgrok = process.env.USE_NGROK === 'true';
    let ollamaUrl;
    
    if (useNgrok && process.env.OLLAMA_NGROK_URL) {
      // Use ngrok URL if explicitly enabled and available
      ollamaUrl = process.env.OLLAMA_NGROK_URL;
      console.log('Using ngrok URL for Ollama connection');
    } else {
      // Otherwise use standard URL (zrok or local)
      ollamaUrl = process.env.OLLAMA_URL || baseUrl || "http://localhost:11434";
      console.log('Using standard URL for Ollama connection (zrok or local)');
    }
    
    this.baseUrl = ollamaUrl.replace(/\/$/, ''); // Remove trailing slash
    
    // Log the Ollama URL being used (helpful for debugging)
    console.log(`Initializing Ollama client with URL: ${this.baseUrl}`);
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
  
  /**
   * Stream chat responses from Ollama
   * @param request The chat request
   * @yields Streaming response chunks
   */
  async *streamingChat(request: OllamaRequest): AsyncGenerator<OllamaResponse> {
    try {
      // Ensure stream is set to true
      request.stream = true;
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Use the streaming API to get the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON objects
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const chunk = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 1);
          
          if (chunk.trim()) {
            try {
              const parsed = JSON.parse(chunk);
              yield parsed;
            } catch (e) {
              console.error('Error parsing JSON chunk:', e);
            }
          }
          
          boundary = buffer.indexOf('\n');
        }
      }
      
      // Handle any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          yield parsed;
        } catch (e) {
          console.error('Error parsing JSON from remaining buffer:', e);
        }
      }
      
      // Signal completion with a final done message
      yield { 
        message: { role: 'assistant', content: '' },
        done: true
      };
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to stream from Ollama: ${error.message}`);
      }
      throw new Error('Failed to stream from Ollama: Unknown error');
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

// Export a singleton instance that uses environment configuration
export const ollamaClient = createOllamaClient();

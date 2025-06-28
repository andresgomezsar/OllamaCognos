import { McpServerWithRegistry } from './mcp/mcpServerRegistry';
import { StreamHandler, StreamHandlerOptions } from './mcp/mcpStreaming';

// LM Studio request/response interfaces
export interface LMStudioMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LMStudioRequest {
  model: string;
  messages: LMStudioMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  disableMcpTools?: boolean;
  enabledMcpTools?: string[];
}

export interface LMStudioResponse {
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

export class LMStudioClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.LMSTUDIO_URL || "http://localhost:1234";
    this.baseUrl = this.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    // Log the LM Studio URL being used (helpful for debugging)
    console.log(`Initializing LM Studio client with URL: ${this.baseUrl}`);
  }

  async chat(request: LMStudioRequest): Promise<LMStudioResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
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
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to LM Studio: ${error.message}`);
      }
      throw new Error('Failed to connect to LM Studio: Unknown error');
    }
  }
  
  /**
   * Stream chat responses from LM Studio
   * @param request The chat request
   * @yields Streaming response chunks
   */
  async *streamingChat(request: LMStudioRequest): AsyncGenerator<LMStudioResponse> {
    try {
      // Ensure stream is set to true
      request.stream = true;
      
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
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
              const data = chunk.replace(/^data: /, '').trim();
              if (data === '[DONE]') {
                // End of stream signal
                continue;
              }
              
              const parsed = JSON.parse(data);
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
          const data = buffer.replace(/^data: /, '').trim();
          if (data !== '[DONE]') {
            const parsed = JSON.parse(data);
            yield parsed;
          }
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
        throw new Error(`Failed to stream from LM Studio: ${error.message}`);
      }
      throw new Error('Failed to stream from LM Studio: Unknown error');
    }
  }

  async listModels(): Promise<{ models: Array<{ id: string; name?: string }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`);
      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return { models: data.data || [] };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list models: ${error.message}`);
      }
      throw new Error('Failed to list models: Unknown error');
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Test connection to LM Studio API and return model information if successful
   * @returns Object with connection details and available models
   */
  async testConnection(): Promise<{ status: string, models?: Array<{id: string; name?: string}> }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { 
        status: 'connected', 
        models: data.data || [] 
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to LM Studio: ${error.message}`);
      }
      throw new Error('Failed to connect to LM Studio: Unknown error');
    }
  }
}

export const createLMStudioClient = (baseUrl?: string) => {
  return new LMStudioClient(baseUrl);
};

// Export a singleton instance that uses environment configuration
export const lmStudioClient = createLMStudioClient();

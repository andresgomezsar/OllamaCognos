/**
 * Client Utilities - Factory functions for creating API clients
 */
import { OllamaClient } from '../ollama.js';

/**
 * Interface for OpenRouter API client
 */
export interface OpenRouterClient {
  chat(options: any): Promise<any>;
}

/**
 * Create an Ollama client instance
 * 
 * @param baseUrl Base URL for the Ollama API
 * @returns Configured OllamaClient instance
 */
export function createOllamaClient(baseUrl: string): OllamaClient {
  return new OllamaClient(baseUrl);
}

/**
 * Create an OpenRouter client instance
 * 
 * @param apiKey OpenRouter API key
 * @returns Configured OpenRouterClient instance
 */
export function createOpenRouterClient(apiKey: string): OpenRouterClient {
  // Simple implementation - in production, you'd want a more robust client
  return {
    chat: async (options: any) => {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://cognos.ai', // Replace with your actual domain
          'X-Title': 'Cognos AI'
        },
        body: JSON.stringify({
          model: options.model || 'anthropic/claude-3.5-sonnet',
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2048,
          stream: options.stream || false
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    }
  };
}

/**
 * List available MCP tools
 * 
 * @returns Array of available MCP tools
 */
export async function listMCPTools(): Promise<string[]> {
  try {
    // Fetch from MCP router endpoint - you might want to cache this
    const response = await fetch('/api/mcp/servers');
    const { servers } = await response.json();
    
    const tools: string[] = [];
    
    // Get tools for each server
    for (const server of servers) {
      const toolsResponse = await fetch(`/api/mcp/${server.name}/tools`);
      const { tools: serverTools } = await toolsResponse.json();
      
      // Add tools with server prefix
      for (const tool of serverTools) {
        tools.push(`${server.name}/${tool.name}`);
      }
    }
    
    return tools;
  } catch (error) {
    console.error('Error listing MCP tools:', error);
    return [];
  }
}

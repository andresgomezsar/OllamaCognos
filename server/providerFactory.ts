import { ProviderType } from './mcp/types.js';
import { OllamaClient, ollamaClient } from './ollama.js';
import { LMStudioClient, lmStudioClient } from './lmstudio.js';

/**
 * Provider factory for managing different AI providers (Ollama, LM Studio)
 * Handles selection, initialization and access to the appropriate client
 */
export class ProviderFactory {
  private static instance: ProviderFactory;
  private defaultProvider: ProviderType;
  private providers: Record<ProviderType, any> = {
    ollama: ollamaClient,
    lmstudio: lmStudioClient
  };

  constructor() {
    // Get the default provider from environment or fallback to ollama
    this.defaultProvider = (process.env.DEFAULT_PROVIDER as ProviderType) || 'ollama';
    console.log(`Initialized provider factory with default provider: ${this.defaultProvider}`);
  }

  /**
   * Get the singleton instance of the ProviderFactory
   */
  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  /**
   * Get the client for the specified provider
   * @param providerType Provider type to get client for (defaults to the configured default provider)
   * @returns Client for the specified provider
   */
  public getClient(providerType?: ProviderType): OllamaClient | LMStudioClient {
    const provider = providerType || this.defaultProvider;
    return this.providers[provider];
  }

  /**
   * Get the default provider type
   * @returns Current default provider type
   */
  public getDefaultProvider(): ProviderType {
    return this.defaultProvider;
  }

  /**
   * Set the default provider type
   * @param providerType Provider type to set as default
   */
  public setDefaultProvider(providerType: ProviderType): void {
    this.defaultProvider = providerType;
    console.log(`Updated default provider to: ${providerType}`);
  }

  /**
   * Check if a specific provider is available/healthy
   * @param providerType Provider type to check
   * @returns Promise resolving to boolean indicating if provider is healthy
   */
  public async isProviderHealthy(providerType: ProviderType): Promise<boolean> {
    try {
      const client = this.getClient(providerType);
      return await client.isHealthy();
    } catch (error) {
      console.error(`Error checking health for provider ${providerType}:`, error);
      return false;
    }
  }

  /**
   * Get all available providers with their health status
   * @returns Promise resolving to map of provider types to health status
   */
  public async getAvailableProviders(): Promise<Record<ProviderType, boolean>> {
    const results: Record<ProviderType, boolean> = {
      ollama: false,
      lmstudio: false
    };
    
    // Check each provider in parallel
    const providerTypes = Object.keys(this.providers) as ProviderType[];
    const healthPromises = providerTypes.map(async (type) => {
      results[type] = await this.isProviderHealthy(type);
    });
    
    await Promise.all(healthPromises);
    return results;
  }
}

// Export singleton instance
export const providerFactory = ProviderFactory.getInstance();

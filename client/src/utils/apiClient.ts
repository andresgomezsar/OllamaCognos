import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiErrorResponse, ApiSuccessResponse } from '../../../shared/errors/apiErrorTypes';

// Default configuration for API client
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export interface ApiClientConfig extends AxiosRequestConfig {
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

/**
 * Enhanced Axios-based API client with:
 * - Request/response interceptors
 * - Standardized error handling
 * - Automatic retries for certain error types
 * - Logging capabilities
 * - Authentication token management
 */
class ApiClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;
  private enableLogging: boolean;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    // Set up configuration with defaults
    this.maxRetries = config.maxRetries || DEFAULT_RETRY_ATTEMPTS;
    this.retryDelay = config.retryDelay || DEFAULT_RETRY_DELAY;
    this.enableLogging = config.enableLogging || false;

    // Create axios instance
    this.client = axios.create({
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      ...config
    });

    // Set up interceptors
    this.setupInterceptors();
  }

  /**
   * Configure request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        if (this.authToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request ID for tracing
        const requestId = crypto.randomUUID();
        config.headers['X-Request-ID'] = requestId;

        // Log request if logging is enabled
        if (this.enableLogging) {
          console.log(`[ApiClient] Request (${requestId}):`, {
            method: config.method,
            url: config.url,
            data: config.data,
            params: config.params
          });
        }

        return config;
      },
      (error) => {
        if (this.enableLogging) {
          console.error('[ApiClient] Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.enableLogging) {
          console.log(`[ApiClient] Response (${response.config.headers?.['X-Request-ID']}):`, {
            status: response.status,
            data: response.data
          });
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const requestConfig = error.config;

        if (!requestConfig) {
          return Promise.reject(this.normalizeError(error));
        }

        // Extract retry attempt counter or initialize it
        const retryCount = (requestConfig as any)._retryCount || 0;
        const requestId = requestConfig.headers?.['X-Request-ID'] || 'unknown';

        // Log error if logging is enabled
        if (this.enableLogging) {
          console.error(`[ApiClient] Response error (${requestId}) - Attempt ${retryCount + 1}/${this.maxRetries + 1}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }

        // Check if we should retry the request
        if (this.shouldRetryRequest(error) && retryCount < this.maxRetries) {
          // Increase retry counter
          (requestConfig as any)._retryCount = retryCount + 1;

          // Calculate delay with exponential backoff
          const delay = this.retryDelay * Math.pow(1.5, retryCount);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the request
          return this.client(requestConfig);
        }

        // If we shouldn't retry or we've exceeded max retries, normalize and reject the error
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Determine if a request should be retried based on the error
   */
  private shouldRetryRequest(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on specific status codes
    const status = error.response.status;
    return status === 408 || // Request Timeout
           status === 429 || // Too Many Requests
           status === 500 || // Internal Server Error
           status === 502 || // Bad Gateway
           status === 503 || // Service Unavailable
           status === 504;   // Gateway Timeout
  }

  /**
   * Transform any error into a standardized ApiErrorResponse
   */
  private normalizeError(error: AxiosError): ApiErrorResponse {
    if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
      // The error response is already in our expected format
      return error.response.data as ApiErrorResponse;
    }

    // Create a standardized error response
    const status = error.response?.status || 500;
    const timestamp = new Date().toISOString();
    const requestId = error.config?.headers?.['X-Request-ID'] as string || 'client-error';

    return {
      error: error.name || 'API_ERROR',
      message: error.message || 'An unknown error occurred',
      code: `${status}_ERROR`,
      details: error.response?.data || error.cause || undefined,
      timestamp,
      requestId
    };
  }

  /**
   * Set authentication token for future requests
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Enable or disable logging
   */
  public setLogging(enabled: boolean): void {
    this.enableLogging = enabled;
  }

  /**
   * Make a GET request with proper typing
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    try {
      const response = await this.client.get<ApiSuccessResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a POST request with proper typing
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    try {
      const response = await this.client.post<ApiSuccessResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PUT request with proper typing
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    try {
      const response = await this.client.put<ApiSuccessResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PATCH request with proper typing
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    try {
      const response = await this.client.patch<ApiSuccessResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a DELETE request with proper typing
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    try {
      const response = await this.client.delete<ApiSuccessResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Special method for MCP tool execution
   */
  public async executeMcpTool<T = any>(serverName: string, toolName: string, args: Record<string, any>): Promise<ApiSuccessResponse<T>> {
    try {
      const response = await this.client.post<ApiSuccessResponse<T>>('/mcp/execute', {
        tool: `${serverName}/${toolName}`,
        input: args
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper method to execute streaming MCP tools
   */
  public getStreamingUrl(serverName: string, toolName: string): string {
    const baseUrl = this.client.defaults.baseURL || '';
    return `${baseUrl}/mcp/stream?server=${serverName}&tool=${toolName}`;
  }
}

// Create and export a singleton instance with default config
export const apiClient = new ApiClient();

// Export the class for cases where a custom instance is needed
export default ApiClient;

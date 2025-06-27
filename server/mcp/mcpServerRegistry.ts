import { v4 as uuidv4 } from 'uuid';
import { McpServer } from './mcpRouter';
import { StreamHandler, StreamHandlerOptions } from './mcpStreaming';
import { mcpLogger } from './mcpLogging';
import { MCPServerConfig, MCPServerStatus } from '../../shared/types/apiTypes';
import { ErrorCategory } from '../../shared/errors/apiErrorTypes';
import { createMcpErrorResponse } from '../utils/errorHandler';

/**
 * Extended interface for an MCP server with router capabilities and health checks
 */
export interface McpServerWithRegistry extends McpServer {
  handleRequest(request: any): Promise<any>;
  createStreamingHandler?(options: StreamHandlerOptions): StreamHandler;
  healthCheck(): Promise<boolean>;
}

/**
 * Centralized MCP server registry that manages server instances
 * Provides consistent initialization, health monitoring, and access control
 */
export class MCPServerRegistry {
  private servers: Map<string, McpServerWithRegistry> = new Map();
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private serverStatus: Map<string, MCPServerStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthCheckIntervalMs = 60000; // 1 minute by default
  
  constructor() {
    // Start periodic health checks if in production
    if (process.env.NODE_ENV === 'production') {
      this.startHealthChecks();
    }
  }
  
  /**
   * Register a new MCP server with the registry
   * 
   * @param name - Unique server name
   * @param server - Server implementation
   * @param config - Server configuration
   * @returns boolean indicating success
   */
  public registerServer(
    name: string, 
    server: McpServerWithRegistry, 
    config: MCPServerConfig
  ): boolean {
    if (this.servers.has(name)) {
      mcpLogger.warn({
        message: `Server ${name} already registered, replacing existing instance`,
        server: name
      });
    }
    
    this.servers.set(name, server);
    this.serverConfigs.set(name, config);
    
    // Initialize status
    this.serverStatus.set(name, {
      name,
      healthy: false,
      toolCount: 0,
      lastChecked: new Date().toISOString(),
      version: config.settings?.version,
      features: config.settings?.features
    });
    
    mcpLogger.info({
      message: `Registered MCP server: ${name}`,
      server: name,
      config: { ...config, apiKey: config.apiKey ? '[REDACTED]' : undefined }
    });
    
    // Perform initial health check
    this.checkServerHealth(name).catch(error => {
      mcpLogger.error({
        message: `Initial health check failed for server ${name}`,
        error,
        server: name
      });
    });
    
    return true;
  }
  
  /**
   * Unregister a server from the registry
   * 
   * @param name - Server name to unregister
   * @returns boolean indicating success
   */
  public unregisterServer(name: string): boolean {
    const result = this.servers.delete(name);
    this.serverConfigs.delete(name);
    this.serverStatus.delete(name);
    
    if (result) {
      mcpLogger.info({
        message: `Unregistered MCP server: ${name}`,
        server: name
      });
    }
    
    return result;
  }
  
  /**
   * Check if a server is registered
   * 
   * @param name - Server name to check
   * @returns boolean indicating if server exists
   */
  public hasServer(name: string): boolean {
    return this.servers.has(name);
  }
  
  /**
   * Get a server by name
   * 
   * @param name - Server name
   * @returns Server instance or null if not found
   */
  public getServer(name: string): McpServerWithRegistry | null {
    return this.servers.get(name) || null;
  }
  
  /**
   * Get server configuration
   * 
   * @param name - Server name
   * @returns Server configuration or null if not found
   */
  public getServerConfig(name: string): MCPServerConfig | null {
    return this.serverConfigs.get(name) || null;
  }
  
  /**
   * Get current status of a server
   * 
   * @param name - Server name
   * @returns Server status or null if not found
   */
  public getServerStatus(name: string): MCPServerStatus | null {
    return this.serverStatus.get(name) || null;
  }
  
  /**
   * Get all server names
   * 
   * @returns Array of server names
   */
  public getServerNames(): string[] {
    return Array.from(this.servers.keys());
  }
  
  /**
   * Get status of all servers
   * 
   * @returns Array of server status objects
   */
  public getAllServerStatus(): MCPServerStatus[] {
    return Array.from(this.serverStatus.values());
  }
  
  /**
   * Execute a tool on a specific server
   * 
   * @param serverName - Server name
   * @param toolName - Tool name
   * @param parameters - Tool parameters
   * @returns Promise resolving to tool result
   * @throws Error if server or tool not found
   */
  public async executeToolCall(
    serverName: string, 
    toolName: string, 
    parameters: Record<string, any>
  ): Promise<any> {
    const requestId = uuidv4();
    const startTime = new Date().toISOString();
    
    try {
      // Check if server exists
      const server = this.getServer(serverName);
      if (!server) {
        throw new Error(`MCP server '${serverName}' not found`);
      }
      
      // Log tool call
      mcpLogger.info({
        message: `Executing tool: ${serverName}/${toolName}`,
        requestId,
        server: serverName,
        tool: toolName,
        parameters
      });
      
      // Execute the tool call
      const result = await server.executeToolCall({
        name: toolName,
        parameters
      });
      
      // Log success
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
      
      mcpLogger.info({
        message: `Tool execution completed: ${serverName}/${toolName}`,
        requestId,
        server: serverName,
        tool: toolName,
        duration
      });
      
      return result;
    } catch (error) {
      // Log error
      const endTime = new Date().toISOString();
      
      // Create a standardized error response
      const mcpError = createMcpErrorResponse(
        error,
        serverName,
        toolName,
        ErrorCategory.MCP_EXECUTION,
        500,
        {
          startTime,
          endTime,
          attempts: 1
        }
      );
      
      mcpLogger.error({
        message: `Tool execution failed: ${serverName}/${toolName}`,
        error: mcpError,
        requestId,
        server: serverName,
        tool: toolName
      });
      
      throw mcpError;
    }
  }
  
  /**
   * Create a streaming handler for a server
   * 
   * @param serverName - Server name
   * @param options - Stream handler options
   * @returns StreamHandler or null if server doesn't support streaming
   * @throws Error if server not found
   */
  public createStreamingHandler(
    serverName: string, 
    options: StreamHandlerOptions
  ): StreamHandler | null {
    const server = this.getServer(serverName);
    
    if (!server) {
      throw new Error(`MCP server '${serverName}' not found`);
    }
    
    if (!server.createStreamingHandler) {
      return null;
    }
    
    return server.createStreamingHandler(options);
  }
  
  /**
   * List all tools available across all registered servers
   * 
   * @returns Array of server/tool name strings (format: "serverName/toolName")
   */
  public async listAllTools(): Promise<string[]> {
    const allTools: string[] = [];
    
    for (const [serverName, server] of this.servers.entries()) {
      try {
        const tools = await server.listTools();
        
        // Update tool count in server status
        const status = this.serverStatus.get(serverName);
        if (status) {
          status.toolCount = tools.length;
          this.serverStatus.set(serverName, status);
        }
        
        // Add tools to list with server name prefix
        tools.forEach(tool => {
          allTools.push(`${serverName}/${tool.name}`);
        });
      } catch (error) {
        mcpLogger.error({
          message: `Failed to list tools for server ${serverName}`,
          error,
          server: serverName
        });
      }
    }
    
    return allTools;
  }
  
  /**
   * Check health of a specific server
   * 
   * @param serverName - Server name
   * @returns Promise resolving to boolean indicating health
   */
  public async checkServerHealth(serverName: string): Promise<boolean> {
    const server = this.getServer(serverName);
    
    if (!server) {
      return false;
    }
    
    try {
      // Perform health check
      const isHealthy = await server.healthCheck();
      
      // Update status
      const status = this.serverStatus.get(serverName);
      if (status) {
        status.healthy = isHealthy;
        status.lastChecked = new Date().toISOString();
        this.serverStatus.set(serverName, status);
      }
      
      return isHealthy;
    } catch (error) {
      // Update status to unhealthy
      const status = this.serverStatus.get(serverName);
      if (status) {
        status.healthy = false;
        status.lastChecked = new Date().toISOString();
        this.serverStatus.set(serverName, status);
      }
      
      mcpLogger.error({
        message: `Health check failed for server ${serverName}`,
        error,
        server: serverName
      });
      
      return false;
    }
  }
  
  /**
   * Check health of all registered servers
   * 
   * @returns Promise resolving to Map of server names to health status
   */
  public async checkAllServerHealth(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const serverName of this.servers.keys()) {
      results.set(serverName, await this.checkServerHealth(serverName));
    }
    
    return results;
  }
  
  /**
   * Start periodic health checks for all servers
   * 
   * @param intervalMs - Interval in milliseconds (default: 60000)
   */
  public startHealthChecks(intervalMs?: number): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckIntervalMs = intervalMs || this.healthCheckIntervalMs;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllServerHealth();
      } catch (error) {
        mcpLogger.error({
          message: 'Error during periodic health check',
          error
        });
      }
    }, this.healthCheckIntervalMs);
    
    mcpLogger.info({
      message: `Started periodic health checks every ${this.healthCheckIntervalMs}ms`
    });
  }
  
  /**
   * Stop periodic health checks
   */
  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      
      mcpLogger.info({
        message: 'Stopped periodic health checks'
      });
    }
  }
}

// Create and export singleton instance
export const mcpServerRegistry = new MCPServerRegistry();

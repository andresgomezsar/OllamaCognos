/**
 * Enhanced MCP Streaming functionality with improved error recovery and validation
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { z } from 'zod';
import { MCPStreamingService, StreamEventType, MCPToolStream } from './mcpStreaming';
import { mcpServerRegistry } from './mcpServerRegistry';
import { mcpLogger } from './mcpLogging';
import { ErrorCategory } from '../../shared/errors/apiErrorTypes';
import { createMcpErrorResponse } from '../utils/errorHandler';

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const PING_INTERVAL_MS = 30000; // 30 seconds
const STREAM_TIMEOUT_MS = 300000; // 5 minutes
const RATE_LIMIT_REQUESTS = 10; // Maximum streams per minute per client
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Rate limiting store
interface RateLimitEntry {
  count: number;
  timestamp: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

// Validation schema for stream request parameters
export const streamRequestSchema = z.object({
  server: z.string().min(1, "Server name is required"),
  tool: z.string().min(1, "Tool name is required"),
  input: z.record(z.any()).optional().default({}),
  timeout: z.number().optional().default(STREAM_TIMEOUT_MS),
  retryCount: z.number().optional().default(0)
});

export type StreamRequest = z.infer<typeof streamRequestSchema>;

/**
 * Stream options interface for enhanced control
 */
export interface EnhancedStreamOptions {
  requestId?: string;
  timeout?: number;
  retryCount?: number;
  pingInterval?: number;
  onError?: (error: Error) => void;
}

/**
 * Enhanced Stream Handler with automatic retries and error recovery
 */
export class EnhancedStreamHandler {
  private stream: MCPToolStream | null = null;
  private requestId: string;
  private serverName: string;
  private toolName: string;
  private input: Record<string, any>;
  private response: Response;
  private timeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private retryCount: number;
  private maxRetries: number;
  private streamTimeout: number;
  private pingIntervalMs: number;
  private streamStarted = false;
  private streamEnded = false;
  private streamService: MCPStreamingService;
  
  /**
   * Create a new enhanced stream handler
   */
  constructor(
    serverName: string,
    toolName: string,
    input: Record<string, any>,
    response: Response,
    options: EnhancedStreamOptions = {}
  ) {
    this.serverName = serverName;
    this.toolName = toolName;
    this.input = input;
    this.response = response;
    this.requestId = options.requestId || uuidv4();
    this.retryCount = 0;
    this.maxRetries = MAX_RETRY_ATTEMPTS;
    this.streamTimeout = options.timeout || STREAM_TIMEOUT_MS;
    this.pingIntervalMs = options.pingInterval || PING_INTERVAL_MS;
    this.streamService = MCPStreamingService.getInstance();
  }
  
  /**
   * Start the streaming process
   */
  public async start(): Promise<void> {
    if (this.streamStarted) {
      return;
    }
    
    this.streamStarted = true;
    
    try {
      // Setup SSE headers
      this.setupSSEHeaders();
      
      // Create the stream
      this.stream = this.streamService.createStream(this.serverName, this.toolName);
      
      // Setup stream event listener
      const unsubscribe = this.streamService.subscribe(
        this.stream.getRequestId(),
        this.handleStreamEvent.bind(this)
      );
      
      // Setup timeouts and pings
      this.setupTimeouts();
      
      // Execute the streaming tool
      await this.executeStreamingTool();
      
      // Cleanup on response close
      this.response.on('close', () => {
        this.cleanup();
        unsubscribe();
      });
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Setup SSE response headers
   */
  private setupSSEHeaders(): void {
    this.response.setHeader('Content-Type', 'text/event-stream');
    this.response.setHeader('Cache-Control', 'no-cache');
    this.response.setHeader('Connection', 'keep-alive');
    this.response.setHeader('X-Accel-Buffering', 'no'); // For Nginx
  }
  
  /**
   * Setup stream timeouts and ping intervals
   */
  private setupTimeouts(): void {
    // Stream timeout
    this.timeout = setTimeout(() => {
      if (!this.streamEnded) {
        this.handleError(new Error(`Stream timeout after ${this.streamTimeout}ms`));
      }
    }, this.streamTimeout);
    
    // Keep-alive pings
    this.pingInterval = setInterval(() => {
      if (!this.streamEnded) {
        this.sendSSEMessage('ping', { timestamp: Date.now() });
      }
    }, this.pingIntervalMs);
  }
  
  /**
   * Execute the streaming tool on the MCP server
   */
  private async executeStreamingTool(): Promise<void> {
    try {
      // Get MCP server
      const server = mcpServerRegistry.getServer(this.serverName);
      
      if (!server) {
        throw new Error(`MCP server '${this.serverName}' not found`);
      }
      
      // Check if server supports streaming
      if (!server.createStreamingHandler) {
        throw new Error(`MCP server '${this.serverName}' does not support streaming`);
      }
      
      // Create a stream handler for the server
      const streamHandler = server.createStreamingHandler({
        emit: (event: string, data: any) => {
          if (event === 'data') {
            // Send data to stream
            this.stream?.sendDelta(data);
          } else if (event === 'error') {
            // Handle error
            this.handleError(data);
          } else if (event === 'end') {
            // Complete the stream
            if (this.stream && !this.stream.isCompleted()) {
              this.stream.complete();
            }
          }
        }
      });
      
      if (!streamHandler) {
        throw new Error(`Failed to create stream handler for ${this.serverName}`);
      }
      
      // Log stream start
      mcpLogger.info({
        message: `Starting streaming tool: ${this.serverName}/${this.toolName}`,
        requestId: this.requestId,
        server: this.serverName,
        tool: this.toolName,
        input: this.input
      });
      
      // Execute the streaming tool with the stream handler
      await server.executeToolCall({
        name: this.toolName,
        parameters: {
          ...this.input,
          streamHandler
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handle stream events and send to client
   */
  private handleStreamEvent(event: any): void {
    if (this.streamEnded) {
      return;
    }
    
    switch (event.type) {
      case StreamEventType.START:
        this.sendSSEMessage('start', { 
          requestId: this.requestId,
          server: this.serverName,
          tool: this.toolName 
        });
        break;
        
      case StreamEventType.DELTA:
        if (event.data && event.data.delta) {
          this.sendSSEMessage('data', event.data.delta);
        }
        break;
        
      case StreamEventType.ERROR:
        if (event.error) {
          this.handleError(new Error(event.error));
        }
        break;
        
      case StreamEventType.COMPLETE:
        this.complete(event.data?.content);
        break;
    }
  }
  
  /**
   * Send an SSE message to the client
   */
  private sendSSEMessage(event: string, data: any): void {
    if (this.streamEnded) {
      return;
    }
    
    try {
      this.response.write(`event: ${event}\n`);
      this.response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      mcpLogger.error({
        message: 'Failed to send SSE message',
        error,
        requestId: this.requestId
      });
    }
  }
  
  /**
   * Handle stream errors with potential retry logic
   */
  private handleError(error: any): void {
    if (this.streamEnded) {
      return;
    }
    
    // Log error
    mcpLogger.error({
      message: `Stream error: ${this.serverName}/${this.toolName}`,
      error,
      requestId: this.requestId,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    });
    
    // Check if we should retry
    if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      mcpLogger.info({
        message: `Retrying stream (${this.retryCount}/${this.maxRetries}): ${this.serverName}/${this.toolName}`,
        requestId: this.requestId
      });
      
      // Notify client about retry
      this.sendSSEMessage('retry', { 
        retryCount: this.retryCount, 
        maxRetries: this.maxRetries,
        message: `Retrying connection (${this.retryCount}/${this.maxRetries})...`
      });
      
      // Clear current stream
      if (this.stream) {
        this.streamService.removeStream(this.stream.getRequestId());
        this.stream = null;
      }
      
      // Retry after short delay
      setTimeout(() => {
        this.stream = this.streamService.createStream(this.serverName, this.toolName);
        this.executeStreamingTool().catch(e => this.handleError(e));
      }, 1000);
      
      return;
    }
    
    // Format error for client
    const mcpError = createMcpErrorResponse(
      error,
      this.serverName,
      this.toolName,
      ErrorCategory.MCP_EXECUTION,
      500
    );
    
    // Send error to client
    this.sendSSEMessage('error', mcpError);
    
    // End the stream
    this.endStream();
  }
  
  /**
   * Determine if we should retry based on error type
   */
  private shouldRetry(error: any): boolean {
    if (!error) {
      return false;
    }
    
    // Don't retry validation errors
    if (error instanceof z.ZodError) {
      return false;
    }
    
    // Check error message for network or timeout indicators
    const errorMessage = error.message?.toLowerCase() || '';
    return errorMessage.includes('timeout') || 
           errorMessage.includes('network') ||
           errorMessage.includes('connection') ||
           errorMessage.includes('econnrefused') ||
           errorMessage.includes('econnreset');
  }
  
  /**
   * Complete the stream successfully
   */
  private complete(content?: any): void {
    if (this.streamEnded) {
      return;
    }
    
    // Send completion event
    this.sendSSEMessage('complete', { 
      content,
      requestId: this.requestId
    });
    
    // End the stream
    this.endStream();
  }
  
  /**
   * End the stream and clean up resources
   */
  private endStream(): void {
    if (this.streamEnded) {
      return;
    }
    
    this.streamEnded = true;
    this.cleanup();
    
    // End the response
    this.response.end();
  }
  
  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Clear timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Remove stream from service
    if (this.stream && !this.streamEnded) {
      this.streamService.removeStream(this.stream.getRequestId());
    }
  }
}

/**
 * Express middleware for SSE stream request handling with rate limiting
 */
export function handleStreamRequest(req: Request, res: Response): void {
  try {
    // Validate request parameters
    const result = streamRequestSchema.safeParse({
      server: req.query.server,
      tool: req.query.tool,
      input: req.body || {},
      timeout: req.query.timeout ? parseInt(req.query.timeout as string, 10) : undefined,
      retryCount: req.query.retryCount ? parseInt(req.query.retryCount as string, 10) : undefined
    });
    
    if (!result.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid stream request parameters',
        details: result.error.errors,
        code: '400_VALIDATION',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || uuidv4()
      });
      return;
    }
    
    // Apply rate limiting
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many stream requests. Maximum ${RATE_LIMIT_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000} seconds.`,
        code: '429_RATE_LIMIT',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || uuidv4()
      });
      return;
    }
    
    // Get validated parameters
    const { server, tool, input, timeout, retryCount } = result.data;
    
    // Create and start the enhanced stream handler
    const streamHandler = new EnhancedStreamHandler(
      server,
      tool,
      input,
      res,
      {
        requestId: req.headers['x-request-id'] as string || undefined,
        timeout,
        retryCount
      }
    );
    
    // Start streaming
    streamHandler.start().catch(error => {
      mcpLogger.error({
        message: 'Failed to start stream handler',
        error
      });
    });
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to process stream request',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: '500_SERVER',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || uuidv4()
    });
  }
}

/**
 * Check if client has exceeded rate limit
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  
  // Clean up old entries
  for (const [id, entry] of rateLimitStore.entries()) {
    if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(id);
    }
  }
  
  // Get or create client entry
  let entry = rateLimitStore.get(clientId);
  
  if (!entry) {
    entry = { count: 0, timestamp: now };
    rateLimitStore.set(clientId, entry);
  }
  
  // Reset if window has passed
  if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.timestamp = now;
  }
  
  // Check limit
  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  // Increment count
  entry.count++;
  return true;
}

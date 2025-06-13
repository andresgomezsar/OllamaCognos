/**
 * MCP Streaming utilities
 * Enables real-time streaming of MCP tool results
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import debug from 'debug';
import { MCPToolResultContentItem } from './mcpUtils';

const log = debug('cognos:mcp:streaming');

// Stream events
export enum StreamEventType {
  START = 'start',
  DELTA = 'delta',
  ERROR = 'error',
  COMPLETE = 'complete'
}

// Stream event interface
export interface StreamEvent {
  type: StreamEventType;
  requestId: string;
  toolName: string;
  serverName: string;
  timestamp: number;
  data?: any;
  error?: string;
}

// Interface for stream delta events
export interface StreamDelta {
  delta: MCPToolResultContentItem;
}

// Interface for stream completion events
export interface StreamCompletion {
  content: MCPToolResultContentItem[];
}

/**
 * MCP Streaming service - manages active streams
 */
export class MCPStreamingService {
  private static instance: MCPStreamingService;
  private emitter: EventEmitter;
  private activeStreams: Map<string, StreamInfo>;
  
  private constructor() {
    this.emitter = new EventEmitter();
    this.activeStreams = new Map();
    
    // Increase max listeners to avoid warnings
    this.emitter.setMaxListeners(100);
    
    log('MCP Streaming service initialized');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MCPStreamingService {
    if (!MCPStreamingService.instance) {
      MCPStreamingService.instance = new MCPStreamingService();
    }
    return MCPStreamingService.instance;
  }
  
  /**
   * Create a new stream for a tool call
   */
  public createStream(serverName: string, toolName: string): MCPToolStream {
    const requestId = uuidv4();
    const stream = new MCPToolStream(requestId, serverName, toolName, this.emitter);
    
    this.activeStreams.set(requestId, {
      serverName,
      toolName,
      createdAt: Date.now(),
      requestId,
      stream
    });
    
    log(`Stream created: ${requestId} for ${serverName}.${toolName}`);
    return stream;
  }
  
  /**
   * Get a stream by request ID
   */
  public getStream(requestId: string): MCPToolStream | undefined {
    const streamInfo = this.activeStreams.get(requestId);
    return streamInfo?.stream;
  }
  
  /**
   * Remove a stream when it's complete
   */
  public removeStream(requestId: string): boolean {
    const result = this.activeStreams.delete(requestId);
    if (result) {
      log(`Stream removed: ${requestId}`);
    }
    return result;
  }
  
  /**
   * Subscribe to all events for a specific requestId
   */
  public subscribe(requestId: string, callback: (event: StreamEvent) => void): () => void {
    const handler = (event: StreamEvent) => {
      if (event.requestId === requestId) {
        callback(event);
      }
    };
    
    this.emitter.on('stream', handler);
    return () => this.emitter.off('stream', handler);
  }
  
  /**
   * Clean up old streams
   */
  public cleanup(maxAgeMs = 3600000): number {
    const now = Date.now();
    let count = 0;
    
    for (const [requestId, info] of this.activeStreams.entries()) {
      if (now - info.createdAt > maxAgeMs) {
        this.activeStreams.delete(requestId);
        count++;
      }
    }
    
    if (count > 0) {
      log(`Cleaned up ${count} stale streams`);
    }
    
    return count;
  }
}

/**
 * Interface for stream info stored in the service
 */
interface StreamInfo {
  serverName: string;
  toolName: string;
  createdAt: number;
  requestId: string;
  stream: MCPToolStream;
}

/**
 * MCP Tool Stream - represents an active streaming tool call
 */
export class MCPToolStream {
  private requestId: string;
  private serverName: string;
  private toolName: string;
  private emitter: EventEmitter;
  private isComplete = false;
  private contentItems: MCPToolResultContentItem[] = [];
  
  constructor(
    requestId: string,
    serverName: string,
    toolName: string,
    emitter: EventEmitter
  ) {
    this.requestId = requestId;
    this.serverName = serverName;
    this.toolName = toolName;
    this.emitter = emitter;
    
    // Start the stream
    this.emit(StreamEventType.START);
  }
  
  /**
   * Send a delta update
   */
  public sendDelta(delta: MCPToolResultContentItem): void {
    if (this.isComplete) {
      log(`Warning: Delta sent to completed stream ${this.requestId}`);
      return;
    }
    
    this.contentItems.push(delta);
    this.emit(StreamEventType.DELTA, { delta });
  }
  
  /**
   * Send an error and close the stream
   */
  public sendError(error: string): void {
    if (this.isComplete) {
      log(`Warning: Error sent to completed stream ${this.requestId}`);
      return;
    }
    
    this.emit(StreamEventType.ERROR, { error });
    this.isComplete = true;
    
    // Remove from the service
    MCPStreamingService.getInstance().removeStream(this.requestId);
  }
  
  /**
   * Complete the stream
   */
  public complete(): void {
    if (this.isComplete) {
      log(`Warning: Already completed stream ${this.requestId}`);
      return;
    }
    
    this.emit(StreamEventType.COMPLETE, { content: this.contentItems });
    this.isComplete = true;
    
    // Remove from the service
    MCPStreamingService.getInstance().removeStream(this.requestId);
  }
  
  /**
   * Get current content
   */
  public getContent(): MCPToolResultContentItem[] {
    return [...this.contentItems];
  }
  
  /**
   * Check if stream is complete
   */
  public isCompleted(): boolean {
    return this.isComplete;
  }
  
  /**
   * Get request ID
   */
  public getRequestId(): string {
    return this.requestId;
  }
  
  /**
   * Emit a stream event
   */
  private emit(type: StreamEventType, data?: any): void {
    const event: StreamEvent = {
      type,
      requestId: this.requestId,
      toolName: this.toolName,
      serverName: this.serverName,
      timestamp: Date.now(),
      ...data
    };
    
    this.emitter.emit('stream', event);
  }
}

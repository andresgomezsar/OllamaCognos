import { WebSocketConnectionState } from '../../../shared/errors/apiErrorTypes';

export interface WebSocketMessage {
  type: string;
  payload: any;
  requestId?: string;
  timestamp?: string;
}

export interface WebSocketManagerOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  pingInterval?: number;
  authToken?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onStateChange?: (state: WebSocketConnectionState) => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocketManager handles WebSocket connections with automatic reconnection,
 * authentication, message queuing, and connection state management
 */
class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private pingInterval: number;
  private messageQueue: WebSocketMessage[] = [];
  private url: string;
  private authToken?: string;
  private onMessageCallback?: (message: WebSocketMessage) => void;
  private onStateChangeCallback?: (state: WebSocketConnectionState) => void;
  private onErrorCallback?: (error: Error) => void;
  private _connectionState: WebSocketConnectionState = WebSocketConnectionState.DISCONNECTED;
  
  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.maxReconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.pingInterval = options.pingInterval || 30000;
    this.authToken = options.authToken;
    this.onMessageCallback = options.onMessage;
    this.onStateChangeCallback = options.onStateChange;
    this.onErrorCallback = options.onError;
  }
  
  /**
   * Get the current connection state
   */
  get connectionState(): WebSocketConnectionState {
    return this._connectionState;
  }
  
  /**
   * Set connection state and trigger callback if provided
   */
  private set connectionState(state: WebSocketConnectionState) {
    this._connectionState = state;
    
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }
  
  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    this.connectionState = WebSocketConnectionState.CONNECTING;
    
    try {
      // Append auth token as query parameter if available
      const wsUrl = this.authToken ? 
        `${this.url}${this.url.includes('?') ? '&' : '?'}token=${this.authToken}` : 
        this.url;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      this.handleError(error as Event);
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) {
      return;
    }
    
    this.clearTimers();
    
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
    
    this.socket = null;
    this.connectionState = WebSocketConnectionState.DISCONNECTED;
  }
  
  /**
   * Send a message through the WebSocket connection
   * If the connection is not open, queue the message for later sending
   */
  public send(type: string, payload: any, requestId?: string): boolean {
    const message: WebSocketMessage = {
      type,
      payload,
      requestId: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('Connection not open, queueing message');
      this.messageQueue.push(message);
      
      // Try to connect if disconnected
      if (this.connectionState === WebSocketConnectionState.DISCONNECTED) {
        this.connect();
      }
      
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageQueue.push(message);
      return false;
    }
  }
  
  /**
   * Update authentication token
   */
  public updateAuthToken(token: string): void {
    this.authToken = token;
    
    // Reconnect with new token if already connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.reconnect();
    }
  }
  
  /**
   * Force reconnection
   */
  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connection established');
    this.connectionState = WebSocketConnectionState.CONNECTED;
    this.reconnectAttempts = 0;
    
    // Send any queued messages
    this.flushMessageQueue();
    
    // Start ping interval to keep connection alive
    this.startPingInterval();
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Handle ping/pong messages internally
      if (message.type === 'ping' || message.type === 'pong') {
        return;
      }
      
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
    this.clearTimers();
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      console.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.connectionState = WebSocketConnectionState.DISCONNECTED;
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    const error = new Error(`WebSocket error: ${(event as ErrorEvent)?.message || 'Unknown error'}`);
    console.error(error);
    
    this.connectionState = WebSocketConnectionState.ERROR;
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    this.reconnectAttempts += 1;
    this.connectionState = WebSocketConnectionState.RECONNECTING;
    
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Send all queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }
    
    console.log(`Sending ${this.messageQueue.length} queued messages`);
    
    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];
    
    queueCopy.forEach(message => {
      this.send(message.type, message.payload, message.requestId);
    });
  }
  
  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.clearPingTimer();
    
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.pingInterval);
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearReconnectTimer();
    this.clearPingTimer();
  }
  
  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Clear ping timer
   */
  private clearPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export default WebSocketManager;

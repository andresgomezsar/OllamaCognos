import React, { Component, ErrorInfo, ReactNode } from 'react';
import { McpErrorResponse } from '../../../shared/errors/apiErrorTypes';

interface McpErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: McpErrorResponse, reset: () => void) => ReactNode);
  onError?: (error: McpErrorResponse, errorInfo: ErrorInfo) => void;
  retryCount?: number;
}

interface McpErrorBoundaryState {
  hasError: boolean;
  error: McpErrorResponse | null;
  retryAttempts: number;
}

/**
 * Error Boundary component specifically designed for handling MCP-related errors
 * Provides fallback UI, retry capabilities, and error reporting
 */
class McpErrorBoundary extends Component<McpErrorBoundaryProps, McpErrorBoundaryState> {
  constructor(props: McpErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryAttempts: 0
    };
  }

  static getDerivedStateFromError(error: any): McpErrorBoundaryState {
    // Convert any thrown error to a standardized McpErrorResponse
    let mcpError: McpErrorResponse;
    
    if (error.response?.data?.error) {
      // Error from axios response with our standardized format
      mcpError = error.response.data;
    } else {
      // Create a standardized error for other types of errors
      mcpError = {
        error: error.name || 'ERROR',
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        requestId: 'client-side-error',
        server: error.server || 'unknown',
        tool: error.tool || 'unknown'
      };
    }
    
    return {
      hasError: true,
      error: mcpError,
      retryAttempts: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error, errorInfo);
    }
    
    // Log error details to console in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.error('MCP Error Boundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  resetErrorBoundary = (): void => {
    const maxRetries = this.props.retryCount || 3;
    
    if (this.state.retryAttempts < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        retryAttempts: prevState.retryAttempts + 1
      }));
    } else {
      console.warn(`Maximum retry attempts (${maxRetries}) reached, giving up.`);
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.resetErrorBoundary);
        }
        return this.props.fallback;
      }

      // Default fallback UI if none provided
      return (
        <div className="mcp-error-container">
          <h3>Something went wrong with a tool execution</h3>
          <p>Server: {this.state.error.server || 'Unknown'}</p>
          <p>Tool: {this.state.error.tool || 'Unknown'}</p>
          <p>Error: {this.state.error.message}</p>
          <button onClick={this.resetErrorBoundary}>
            {this.state.retryAttempts === 0 ? 'Retry' : `Retry (${this.state.retryAttempts}/${this.props.retryCount || 3})`}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default McpErrorBoundary;

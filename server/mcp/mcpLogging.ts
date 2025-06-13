/**
 * MCP Logging - Centralized logging utilities for MCP operations
 */
import debug from 'debug';

// Create namespaced loggers
export const logMcpCore = debug('cognos:mcp:core');
export const logMcpRouter = debug('cognos:mcp:router');
export const logMcpTools = debug('cognos:mcp:tools');
export const logMcpAdapter = debug('cognos:mcp:adapter');
export const logMcpStreaming = debug('cognos:mcp:streaming');
export const logMcpSecurity = debug('cognos:mcp:security');

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

/**
 * Format a log message with request ID and other contextual information
 * 
 * @param requestId The request ID
 * @param message The log message
 * @param context Additional context (optional)
 * @returns Formatted log message
 */
export function formatLogMessage(requestId: string, message: string, context?: Record<string, any>): string {
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${requestId}] ${message}${contextStr}`;
}

/**
 * Log MCP tool execution
 * 
 * @param logger The logger to use
 * @param level Log level
 * @param requestId Request ID
 * @param serverName MCP server name
 * @param toolName Tool name
 * @param message Log message
 * @param context Additional context
 */
export function logToolExecution(
  logger: debug.Debugger,
  level: LogLevel,
  requestId: string,
  serverName: string,
  toolName: string,
  message: string,
  context?: Record<string, any>
): void {
  const toolInfo = `${serverName}.${toolName}`;
  const formattedMsg = formatLogMessage(requestId, `[${toolInfo}] ${message}`, context);
  logger(formattedMsg);
}

/**
 * Log MCP error
 * 
 * @param logger The logger to use
 * @param requestId Request ID
 * @param errorType Error type
 * @param message Error message
 * @param error The actual error object
 */
export function logError(
  logger: debug.Debugger,
  requestId: string,
  errorType: string,
  message: string,
  error?: any
): void {
  let errorDetails = '';
  
  if (error) {
    if (error instanceof Error) {
      errorDetails = ` - ${error.name}: ${error.message}`;
      if (error.stack) {
        errorDetails += `\n${error.stack}`;
      }
    } else {
      try {
        errorDetails = ` - ${JSON.stringify(error)}`;
      } catch {
        errorDetails = ' - [Unstringifiable error]';
      }
    }
  }
  
  logger(formatLogMessage(requestId, `ERROR [${errorType}] ${message}${errorDetails}`));
}

/**
 * Time an async operation and log its duration
 * 
 * @param logger The logger to use
 * @param requestId Request ID
 * @param operation Name of operation
 * @param fn The function to time
 * @returns The result of the function
 */
export async function timeOperation<T>(
  logger: debug.Debugger,
  requestId: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger(formatLogMessage(requestId, `${operation} completed in ${duration}ms`));
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger(formatLogMessage(requestId, `${operation} failed after ${duration}ms`));
    throw error;
  }
}

/**
 * Create a request-scoped logger
 * 
 * @param baseLogger The base logger to use
 * @param requestId The request ID
 * @returns A function that logs with the request ID included
 */
export function createRequestLogger(baseLogger: debug.Debugger, requestId: string) {
  return (message: string, context?: Record<string, any>) => {
    baseLogger(formatLogMessage(requestId, message, context));
  };
}

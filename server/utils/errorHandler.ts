import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { ZodError } from 'zod';
import { ApiErrorResponse, ErrorCategory, McpErrorResponse } from '../../shared/errors/apiErrorTypes';

/**
 * Creates a standardized API error response object
 * 
 * @param error - Error object or string message
 * @param category - Error category for better classification
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 * @returns ApiErrorResponse object
 */
export function createErrorResponse(
  error: unknown, 
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  statusCode: number = 500,
  details?: any
): ApiErrorResponse {
  const timestamp = new Date().toISOString();
  const requestId = uuidv4();
  
  // Default error message
  let message = 'An unexpected error occurred';
  let errorType = 'SERVER_ERROR';
  
  // Extract appropriate error information based on error type
  if (error instanceof Error) {
    message = error.message;
    errorType = error.name || 'ERROR';
  } else if (typeof error === 'string') {
    message = error;
    errorType = 'ERROR';
  }
  
  // Handle specific error types
  if (error instanceof ZodError) {
    errorType = 'VALIDATION_ERROR';
    message = 'Validation error';
    details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
  
  const code = `${statusCode}_${category.toUpperCase()}`;
  
  return {
    error: errorType,
    message,
    code,
    details,
    timestamp,
    requestId
  };
}

/**
 * Creates an MCP-specific error response
 * 
 * @param error - Error object or string message
 * @param server - MCP server name
 * @param tool - Tool name that was being executed
 * @param category - Error category for classification
 * @param statusCode - HTTP status code
 * @param executionDetails - Additional execution metadata
 * @returns McpErrorResponse object
 */
export function createMcpErrorResponse(
  error: unknown,
  server?: string,
  tool?: string,
  category: ErrorCategory = ErrorCategory.MCP_EXECUTION,
  statusCode: number = 500,
  executionDetails?: {
    startTime: string;
    endTime: string;
    attempts: number;
  }
): McpErrorResponse {
  const baseError = createErrorResponse(error, category, statusCode);
  const now = new Date().toISOString();
  
  return {
    ...baseError,
    server,
    tool,
    execution: executionDetails ? {
      ...executionDetails,
      duration: executionDetails.startTime && executionDetails.endTime ? 
        new Date(executionDetails.endTime).getTime() - new Date(executionDetails.startTime).getTime() : 0,
    } : {
      startTime: now,
      endTime: now,
      duration: 0,
      attempts: 1
    }
  };
}

/**
 * Sends a standardized error response via Express Response object
 * 
 * @param res - Express Response object
 * @param error - Error object or string message
 * @param category - Error category
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 */
export function sendErrorResponse(
  res: Response,
  error: unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  statusCode: number = 500,
  details?: any
): void {
  const errorResponse = createErrorResponse(error, category, statusCode, details);
  res.status(statusCode).json(errorResponse);
}

/**
 * Wraps an async request handler with consistent error handling
 * 
 * @param handler - Async request handler function
 * @returns Express request handler with error handling
 */
export function asyncHandler(handler: Function) {
  return async (req: any, res: Response, next: Function) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error('Error in request handler:', error);
      
      let category = ErrorCategory.UNKNOWN;
      let statusCode = 500;
      
      // Categorize common errors
      if (error instanceof ZodError) {
        category = ErrorCategory.VALIDATION;
        statusCode = 400;
      } else if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          category = ErrorCategory.NOT_FOUND;
          statusCode = 404;
        } else if (error.message.includes('unauthorized') || error.message.includes('not authorized')) {
          category = ErrorCategory.AUTHORIZATION;
          statusCode = 403;
        } else if (error.message.includes('authentication') || error.message.includes('not authenticated')) {
          category = ErrorCategory.AUTHENTICATION;
          statusCode = 401;
        }
      }
      
      sendErrorResponse(res, error, category, statusCode);
    }
  };
}

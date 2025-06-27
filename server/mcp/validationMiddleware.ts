/**
 * MCP Validation Middleware
 * Provides Express middleware for validating MCP requests and responses
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mcpLogger } from './mcpLogging';
import { mcpServerRegistry } from './mcpServerRegistry';
import { 
  validateToolRequest, 
  validateToolResponse,
  createValidationErrorResponse 
} from './schemaValidator';

/**
 * Middleware to validate incoming MCP tool requests
 */
export function validateMcpRequest(req: Request, res: Response, next: NextFunction): void {
  const { server: serverName, tool: toolName } = req.params;
  const parameters = req.body || {};
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Check if server and tool exist
  const server = mcpServerRegistry.getServer(serverName);
  if (!server) {
    res.status(404).json({
      error: 'SERVER_NOT_FOUND',
      message: `MCP server '${serverName}' not found`,
      code: '404_SERVER_NOT_FOUND',
      timestamp: new Date().toISOString(),
      requestId
    });
    return;
  }
  
  // Get tool schema asynchronously
  mcpServerRegistry.getToolSchema(serverName, toolName)
    .then(schema => {
      if (!schema) {
        res.status(404).json({
          error: 'TOOL_NOT_FOUND',
          message: `Tool '${toolName}' not found on server '${serverName}'`,
          code: '404_TOOL_NOT_FOUND',
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }
      
      // Validate request parameters against schema
      const result = validateToolRequest(
        serverName,
        toolName,
        parameters,
        schema,
        { requestId }
      );
      
      if (!result.valid) {
        // Send validation error response
        const errorResponse = createValidationErrorResponse(
          serverName,
          toolName,
          result.errors || [],
          requestId
        );
        
        res.status(400).json(errorResponse);
        return;
      }
      
      // Validation passed - attach validated data to request
      req.body = result.data;
      
      // Log validation success
      mcpLogger.debug({
        message: 'Request validation successful',
        serverName,
        toolName,
        requestId
      });
      
      next();
    })
    .catch(error => {
      mcpLogger.error({
        message: 'Error during request validation',
        error,
        serverName,
        toolName,
        requestId
      });
      
      res.status(500).json({
        error: 'VALIDATION_ERROR',
        message: `Error validating request: ${error.message}`,
        code: '500_VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId
      });
    });
}

/**
 * Middleware to validate outgoing MCP tool responses
 */
export function validateMcpResponse(req: Request, res: Response, next: NextFunction): void {
  const { server: serverName, tool: toolName } = req.params;
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Store the original response methods
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override res.json to validate the response body before sending
  res.json = function(body): Response {
    validateAndSendResponse(this, body, 'json');
    return this;
  };
  
  // Override res.send to validate the response body before sending
  res.send = function(body): Response {
    validateAndSendResponse(this, body, 'send');
    return this;
  };
  
  /**
   * Validate and send response
   */
  async function validateAndSendResponse(res: Response, body: any, method: 'json' | 'send'): Promise<void> {
    try {
      // Skip validation for error responses
      if (res.statusCode >= 400) {
        // Restore original method and call it
        if (method === 'json') {
          originalJson.call(res, body);
        } else {
          originalSend.call(res, body);
        }
        return;
      }
      
      // Get response schema asynchronously
      const responseSchema = await mcpServerRegistry.getToolResponseSchema(serverName, toolName);
      
      // If no schema is available, send the response without validation
      if (!responseSchema) {
        mcpLogger.debug({
          message: 'No response schema available, skipping validation',
          serverName,
          toolName,
          requestId
        });
        
        // Restore original method and call it
        if (method === 'json') {
          originalJson.call(res, body);
        } else {
          originalSend.call(res, body);
        }
        return;
      }
      
      // Validate response against schema
      const result = validateToolResponse(
        serverName,
        toolName,
        body,
        responseSchema,
        { requestId }
      );
      
      if (!result.valid) {
        mcpLogger.error({
          message: 'Response validation failed',
          errors: result.errors,
          serverName,
          toolName,
          requestId,
          responseData: body
        });
        
        // Create error response
        const errorResponse = createValidationErrorResponse(
          serverName,
          toolName,
          result.errors || [],
          requestId
        );
        
        // Send error response
        res.status(500);
        if (method === 'json') {
          originalJson.call(res, errorResponse);
        } else {
          originalSend.call(res, errorResponse);
        }
        return;
      }
      
      // Validation passed
      mcpLogger.debug({
        message: 'Response validation successful',
        serverName,
        toolName,
        requestId
      });
      
      // Send the validated data
      if (method === 'json') {
        originalJson.call(res, result.data || body);
      } else {
        originalSend.call(res, result.data || body);
      }
    } catch (error) {
      mcpLogger.error({
        message: 'Error during response validation',
        error,
        serverName,
        toolName,
        requestId
      });
      
      // Send error response
      res.status(500);
      const errorBody = {
        error: 'RESPONSE_VALIDATION_ERROR',
        message: `Error validating response: ${error.message}`,
        code: '500_VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId
      };
      
      if (method === 'json') {
        originalJson.call(res, errorBody);
      } else {
        originalSend.call(res, errorBody);
      }
    }
  }
  
  next();
}

/**
 * Helper middleware to add validation headers to responses
 */
export function addValidationHeaders(req: Request, res: Response, next: NextFunction): void {
  // Add validation headers
  res.setHeader('X-Validation-Status', 'enabled');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || uuidv4());
  
  next();
}

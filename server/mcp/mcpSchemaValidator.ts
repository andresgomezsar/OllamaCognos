import * as z from 'zod';

// Basic MCP schema types
export const mcpToolRequestSchema = z.object({
  serverName: z.string(),
  toolName: z.string(),
  args: z.record(z.any()).optional().default({})
});

export type MCPToolRequest = z.infer<typeof mcpToolRequestSchema>;

export const mcpToolResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  content: z.array(
    z.object({
      type: z.string(),
      value: z.any()
    })
  ).optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional()
  }).optional()
});

export type MCPToolResponse = z.infer<typeof mcpToolResponseSchema>;

// Server-specific schemas for common MCP servers
export const ouraMCPToolSchema = z.object({
  serverName: z.literal('oura'),
  toolName: z.enum([
    'get-sleep-data', 
    'get-activity-data', 
    'get-readiness-data',
    'sync-health-data'
  ]),
  args: z.object({
    userId: z.string().or(z.number()),
    date: z.string().optional() // ISO date string
  })
});

export const perplexityMCPToolSchema = z.object({
  serverName: z.literal('perplexity'),
  toolName: z.enum([
    'ask',
    'search'
  ]),
  args: z.object({
    query: z.string(),
    model: z.string().optional(),
    stream: z.boolean().optional()
  })
});

// Function to validate MCP tool requests
export function validateMCPToolRequest(
  request: unknown
): { success: true; data: MCPToolRequest } | { success: false; error: string } {
  try {
    const validatedRequest = mcpToolRequestSchema.parse(request);
    return { success: true, data: validatedRequest };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid MCP tool request: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// Function to validate MCP tool responses
export function validateMCPToolResponse(
  response: unknown
): { success: true; data: MCPToolResponse } | { success: false; error: string } {
  try {
    const validatedResponse = mcpToolResponseSchema.parse(response);
    return { success: true, data: validatedResponse };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid MCP tool response: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// Function to validate server-specific schemas based on server name
export function validateServerSpecificRequest(
  request: MCPToolRequest
): { success: true; data: MCPToolRequest } | { success: false; error: string } {
  try {
    // Select appropriate schema based on serverName
    switch (request.serverName) {
      case 'oura':
        return { success: true, data: ouraMCPToolSchema.parse(request) as MCPToolRequest };
      case 'perplexity':
        return { success: true, data: perplexityMCPToolSchema.parse(request) as MCPToolRequest };
      default:
        // If no server-specific schema, just use the basic validation
        return { success: true, data: request };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid ${request.serverName} tool request: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

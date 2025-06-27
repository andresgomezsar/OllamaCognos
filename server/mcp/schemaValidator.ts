/**
 * MCP Schema Validator
 * Provides comprehensive schema validation for MCP requests and responses
 * with detailed error reporting and runtime validation
 */
import { z } from 'zod';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { v4 as uuidv4 } from 'uuid';
import { mcpLogger } from './mcpLogging';
import { createMcpErrorResponse } from '../utils/errorHandler';
import { ErrorCategory } from '../../shared/errors/apiErrorTypes';

// Configure Ajv for JSON Schema validation
const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strictTypes: false,
  strictTuples: false,
  coerceTypes: 'array' 
});
addFormats(ajv);

// Cache compiled schema validators
const schemaCache = new Map<string, any>();

// Interface for validation result
export interface ValidationResult {
  valid: boolean;
  errors?: any[];
  data?: any;
}

// Schema validation options
export interface SchemaValidationOptions {
  requestId?: string;
  contextPath?: string;
  serverName?: string;
  toolName?: string;
}

/**
 * Schema registry to store and retrieve schemas
 */
export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private schemas: Map<string, any>;
  
  private constructor() {
    this.schemas = new Map();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }
  
  /**
   * Register a schema by ID
   */
  public registerSchema(schemaId: string, schema: any): void {
    this.schemas.set(schemaId, schema);
    // Also register with AJV
    ajv.addSchema(schema, schemaId);
  }
  
  /**
   * Get a schema by ID
   */
  public getSchema(schemaId: string): any {
    return this.schemas.get(schemaId);
  }
  
  /**
   * Check if schema exists
   */
  public hasSchema(schemaId: string): boolean {
    return this.schemas.has(schemaId);
  }
  
  /**
   * List all schema IDs
   */
  public listSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }
}

/**
 * Validate data against a Zod schema
 */
export function validateWithZod<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: SchemaValidationOptions = {}
): ValidationResult {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        valid: true,
        data: result.data
      };
    } else {
      const formattedErrors = formatZodErrors(result.error);
      
      mcpLogger.warn({
        message: 'Zod schema validation failed',
        errors: formattedErrors,
        requestId: options.requestId || uuidv4(),
        contextPath: options.contextPath,
        serverName: options.serverName,
        toolName: options.toolName
      });
      
      return {
        valid: false,
        errors: formattedErrors
      };
    }
  } catch (error) {
    mcpLogger.error({
      message: 'Zod validation error',
      error,
      requestId: options.requestId || uuidv4(),
      contextPath: options.contextPath
    });
    
    return {
      valid: false,
      errors: [{ message: error instanceof Error ? error.message : 'Unknown validation error' }]
    };
  }
}

/**
 * Format Zod errors into a more readable structure
 */
function formatZodErrors(error: z.ZodError): any[] {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
}

/**
 * Validate data against a JSON Schema using AJV
 */
export function validateWithJsonSchema(
  schema: any, 
  data: unknown,
  options: SchemaValidationOptions = {}
): ValidationResult {
  try {
    const schemaId = schema.$id || `schema-${uuidv4()}`;
    let validate;
    
    // Check cache first
    if (schemaCache.has(schemaId)) {
      validate = schemaCache.get(schemaId);
    } else {
      // Compile and cache the schema
      validate = ajv.compile(schema);
      schemaCache.set(schemaId, validate);
    }
    
    const valid = validate(data);
    
    if (valid) {
      return {
        valid: true,
        data
      };
    } else {
      const formattedErrors = formatAjvErrors(validate.errors || []);
      
      mcpLogger.warn({
        message: 'JSON Schema validation failed',
        errors: formattedErrors,
        schemaId,
        requestId: options.requestId || uuidv4(),
        contextPath: options.contextPath,
        serverName: options.serverName,
        toolName: options.toolName
      });
      
      return {
        valid: false,
        errors: formattedErrors
      };
    }
  } catch (error) {
    mcpLogger.error({
      message: 'JSON Schema validation error',
      error,
      requestId: options.requestId || uuidv4(),
      contextPath: options.contextPath
    });
    
    return {
      valid: false,
      errors: [{ message: error instanceof Error ? error.message : 'Unknown validation error' }]
    };
  }
}

/**
 * Format AJV errors into a more readable structure
 */
function formatAjvErrors(errors: any[]): any[] {
  return errors.map(err => ({
    path: err.instancePath,
    message: err.message,
    keyword: err.keyword,
    params: err.params
  }));
}

/**
 * Validate MCP tool request parameters
 */
export function validateToolRequest(
  serverName: string,
  toolName: string,
  parameters: any,
  schema: any,
  options: SchemaValidationOptions = {}
): ValidationResult {
  const result = validateWithJsonSchema(
    schema,
    parameters,
    {
      ...options,
      serverName,
      toolName,
      contextPath: `request.${serverName}.${toolName}`
    }
  );
  
  return result;
}

/**
 * Validate MCP tool response
 */
export function validateToolResponse(
  serverName: string,
  toolName: string,
  response: any,
  schema: any,
  options: SchemaValidationOptions = {}
): ValidationResult {
  const result = validateWithJsonSchema(
    schema,
    response,
    {
      ...options,
      serverName,
      toolName,
      contextPath: `response.${serverName}.${toolName}`
    }
  );
  
  return result;
}

/**
 * Generate a standardized error response from validation errors
 */
export function createValidationErrorResponse(
  serverName: string,
  toolName: string,
  errors: any[],
  requestId?: string
): any {
  return createMcpErrorResponse(
    new Error('Schema validation failed'),
    serverName,
    toolName,
    ErrorCategory.VALIDATION,
    400,
    {
      requestId: requestId || uuidv4(),
      validationErrors: errors
    }
  );
}

// Register common schemas
const registry = SchemaRegistry.getInstance();

// Common JSON schema for tool parameters
const commonParametersSchema = {
  $id: 'commonParameters',
  type: 'object',
  additionalProperties: true
};

// Register common schemas
registry.registerSchema('commonParameters', commonParametersSchema);

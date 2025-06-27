/**
 * MCP Schema Registry Helper
 * Utilities for registering and managing MCP tool schemas
 */
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { SchemaRegistry } from './schemaValidator';
import { mcpLogger } from './mcpLogging';

/**
 * Helper class to manage MCP tool schemas
 */
export class SchemaHelper {
  private registry: SchemaRegistry;
  private serverName: string;
  
  /**
   * Create a new schema helper for a specific MCP server
   */
  constructor(serverName: string) {
    this.registry = SchemaRegistry.getInstance();
    this.serverName = serverName;
  }
  
  /**
   * Register a tool schema
   */
  public registerToolSchema(toolName: string, schema: any): void {
    const schemaId = this.getSchemaId(toolName);
    
    try {
      this.registry.registerSchema(schemaId, schema);
      
      mcpLogger.debug({
        message: 'Registered tool schema',
        serverName: this.serverName,
        toolName,
        schemaId
      });
    } catch (error) {
      mcpLogger.error({
        message: 'Failed to register tool schema',
        serverName: this.serverName,
        toolName,
        error
      });
    }
  }
  
  /**
   * Register a tool response schema
   */
  public registerToolResponseSchema(toolName: string, schema: any): void {
    const schemaId = this.getResponseSchemaId(toolName);
    
    try {
      this.registry.registerSchema(schemaId, schema);
      
      mcpLogger.debug({
        message: 'Registered tool response schema',
        serverName: this.serverName,
        toolName,
        schemaId
      });
    } catch (error) {
      mcpLogger.error({
        message: 'Failed to register tool response schema',
        serverName: this.serverName,
        toolName,
        error
      });
    }
  }
  
  /**
   * Get a tool schema
   */
  public getToolSchema(toolName: string): any {
    return this.registry.getSchema(this.getSchemaId(toolName));
  }
  
  /**
   * Get a tool response schema
   */
  public getToolResponseSchema(toolName: string): any {
    return this.registry.getSchema(this.getResponseSchemaId(toolName));
  }
  
  /**
   * Check if tool has registered schema
   */
  public hasToolSchema(toolName: string): boolean {
    return this.registry.hasSchema(this.getSchemaId(toolName));
  }
  
  /**
   * Check if tool has registered response schema
   */
  public hasToolResponseSchema(toolName: string): boolean {
    return this.registry.hasSchema(this.getResponseSchemaId(toolName));
  }
  
  /**
   * Convert JSONSchema to Zod schema for runtime validation
   * This is useful for server implementations that prefer working with Zod
   */
  public jsonSchemaToZod(jsonSchema: any): z.ZodType<any> {
    // Start with a basic implementation that can be expanded
    // This is a simplified approach and doesn't handle all JSONSchema features
    try {
      if (jsonSchema.type === 'object') {
        let schema = z.object({});
        
        // Process properties
        if (jsonSchema.properties) {
          const shapeObject = {};
          
          for (const [key, propSchema] of Object.entries<any>(jsonSchema.properties)) {
            let propZodSchema = this.convertPropertyToZod(propSchema);
            
            // Handle required properties
            if (
              jsonSchema.required && 
              Array.isArray(jsonSchema.required) && 
              jsonSchema.required.includes(key)
            ) {
              // Keep it required
            } else {
              // Make it optional
              propZodSchema = propZodSchema.optional();
            }
            
            shapeObject[key] = propZodSchema;
          }
          
          schema = z.object(shapeObject);
          
          // Handle additional properties
          if (jsonSchema.additionalProperties === false) {
            schema = schema.strict();
          }
        }
        
        return schema;
      } else if (jsonSchema.type === 'array') {
        if (jsonSchema.items) {
          const itemSchema = this.convertPropertyToZod(jsonSchema.items);
          return z.array(itemSchema);
        }
        return z.array(z.any());
      } else {
        // Default case
        return z.any();
      }
    } catch (error) {
      mcpLogger.error({
        message: 'Failed to convert JSONSchema to Zod',
        error,
        schema: jsonSchema
      });
      
      // Return any type as fallback
      return z.any();
    }
  }
  
  /**
   * Helper method to convert a JSON Schema property to Zod
   */
  private convertPropertyToZod(propSchema: any): z.ZodType<any> {
    if (!propSchema || !propSchema.type) {
      return z.any();
    }
    
    // Handle different types
    switch (propSchema.type) {
      case 'string':
        let stringSchema = z.string();
        
        if (propSchema.minLength !== undefined) {
          stringSchema = stringSchema.min(propSchema.minLength);
        }
        
        if (propSchema.maxLength !== undefined) {
          stringSchema = stringSchema.max(propSchema.maxLength);
        }
        
        if (propSchema.pattern) {
          stringSchema = stringSchema.regex(new RegExp(propSchema.pattern));
        }
        
        if (propSchema.format === 'email') {
          stringSchema = z.string().email();
        } else if (propSchema.format === 'uuid') {
          stringSchema = z.string().uuid();
        } else if (propSchema.format === 'uri') {
          stringSchema = z.string().url();
        }
        
        return stringSchema;
        
      case 'number':
      case 'integer':
        let numberSchema = propSchema.type === 'integer' ? z.number().int() : z.number();
        
        if (propSchema.minimum !== undefined) {
          numberSchema = numberSchema.min(propSchema.minimum);
        }
        
        if (propSchema.maximum !== undefined) {
          numberSchema = numberSchema.max(propSchema.maximum);
        }
        
        return numberSchema;
        
      case 'boolean':
        return z.boolean();
        
      case 'object':
        return this.jsonSchemaToZod(propSchema);
        
      case 'array':
        if (propSchema.items) {
          const itemSchema = this.convertPropertyToZod(propSchema.items);
          let arraySchema = z.array(itemSchema);
          
          if (propSchema.minItems !== undefined) {
            arraySchema = arraySchema.min(propSchema.minItems);
          }
          
          if (propSchema.maxItems !== undefined) {
            arraySchema = arraySchema.max(propSchema.maxItems);
          }
          
          return arraySchema;
        }
        return z.array(z.any());
        
      case 'null':
        return z.null();
        
      default:
        return z.any();
    }
  }
  
  /**
   * Get schema ID for tool
   */
  private getSchemaId(toolName: string): string {
    return `${this.serverName}.${toolName}.schema`;
  }
  
  /**
   * Get schema ID for tool response
   */
  private getResponseSchemaId(toolName: string): string {
    return `${this.serverName}.${toolName}.response.schema`;
  }
}

/**
 * Helper function to convert zod schema to JSON Schema
 * (Simplified version, doesn't support all Zod features)
 */
export function zodToJsonSchema(zodSchema: z.ZodType<any>): any {
  try {
    // This is a simplified approach - in production you might want to use
    // a dedicated library like zod-to-json-schema for complete coverage
    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema._def.shape();
      const properties = {};
      const required = [];
      
      for (const [key, schemaDef] of Object.entries(shape)) {
        properties[key] = extractJsonSchema(schemaDef);
        
        // Check if property is required
        if (!(schemaDef instanceof z.ZodOptional)) {
          required.push(key);
        }
      }
      
      const schema = {
        type: 'object',
        properties
      };
      
      if (required.length > 0) {
        schema['required'] = required;
      }
      
      return schema;
    } else {
      return { type: 'object' };
    }
  } catch (error) {
    mcpLogger.error({
      message: 'Failed to convert Zod schema to JSON Schema',
      error
    });
    
    return { type: 'object' };
  }
}

/**
 * Extract JSON Schema from a Zod schema definition
 */
function extractJsonSchema(schema: z.ZodTypeAny): any {
  if (schema instanceof z.ZodString) {
    return { type: 'string' };
  } else if (schema instanceof z.ZodNumber) {
    return { type: 'number' };
  } else if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  } else if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: extractJsonSchema(schema._def.type)
    };
  } else if (schema instanceof z.ZodObject) {
    return zodToJsonSchema(schema);
  } else if (schema instanceof z.ZodOptional) {
    return extractJsonSchema(schema._def.innerType);
  } else if (schema instanceof z.ZodNullable) {
    const innerSchema = extractJsonSchema(schema._def.innerType);
    return {
      ...innerSchema,
      nullable: true
    };
  } else if (schema instanceof z.ZodUnion) {
    // Simplified oneOf handling
    return {
      oneOf: schema._def.options.map(option => extractJsonSchema(option))
    };
  } else if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema._def.values
    };
  } else {
    // Default case
    return { type: 'object' };
  }
}

import { z } from "zod";

/**
 * LM Studio MCP tools definition for chat completions and model operations
 */
export const lmstudioTools = [
  {
    name: "chat_completion",
    description: "Generate chat completions using LM Studio",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description: "Model to use for completion"
        },
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: {
                type: "string",
                enum: ["user", "assistant", "system"]
              },
              content: {
                type: "string"
              }
            },
            required: ["role", "content"]
          }
        },
        temperature: {
          type: "number",
          description: "Temperature for sampling (0.0-1.0, lower is more deterministic)",
          default: 0.7
        },
        top_p: {
          type: "number",
          description: "Nucleus sampling parameter (0.0-1.0)",
          default: 1.0
        },
        max_tokens: {
          type: "integer",
          description: "Maximum number of tokens to generate",
          default: 1024
        },
        stream: {
          type: "boolean",
          description: "Whether to stream the results",
          default: false
        }
      },
      required: ["messages"]
    }
  },
  {
    name: "list_models",
    description: "List available models in LM Studio",
    parameters: {
      type: "object",
      properties: {}
    }
  }
];

// Validation schemas for tool calls
export const chatCompletionSchema = z.object({
  model: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string()
    })
  ),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  top_p: z.number().min(0).max(1).optional().default(1.0),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional().default(false)
});

export const listModelsSchema = z.object({});

import { EventEmitter } from "events";
import { lmstudioTools, chatCompletionSchema, listModelsSchema } from "./lmstudioTools.js";
import { LMStudioClient } from "../../lmstudio.js";
import {
  ListToolsRequest,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
  RequestHandler,
  Tool
} from "../types.js";

// Create an event emitter for real-time data streaming
export const lmstudioEventEmitter = new EventEmitter();

/**
 * MCP Server for LM Studio Integration
 * Handles MCP requests for LM Studio's chat API
 */
export class LMStudioMcpServer {
  private lmStudioClient: LMStudioClient;
  
  constructor(lmStudioUrl: string) {
    this.lmStudioClient = new LMStudioClient(lmStudioUrl);
    
    // Set up event listeners
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for real-time data processing
   */
  private setupEventHandlers() {
    // Handle tool call events
    lmstudioEventEmitter.on("tool-call", async (toolName, args) => {
      console.log(`LM Studio tool call received: ${toolName}`, args);
      
      // Process the tool call asynchronously
      try {
        const result = await this.handleToolCall(toolName, args);
        lmstudioEventEmitter.emit("tool-result", toolName, result);
      } catch (error) {
        console.error(`Error in LM Studio tool call ${toolName}:`, error);
        lmstudioEventEmitter.emit("tool-error", toolName, error);
      }
    });
  }

  /**
   * List available tools
   */
  async listTools(): Promise<Tool[]> {
    // Convert lmstudioTools format to Tool interface format
    return lmstudioTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: tool.parameters.type,
        properties: Object.entries(tool.parameters.properties).reduce((acc, [key, val]) => {
          acc[key] = {
            type: val.type,
            description: val.description,
            ...(val.enum && { enum: val.enum }),
          };
          return acc;
        }, {} as Record<string, {type: string, description: string, enum?: string[]}>),
        required: tool.parameters.required || []
      }
    }));
  }
  
  /**
   * Get cached tools array
   */
  getTools(): any[] {
    return lmstudioTools;
  }

  /**
   * Get list of available tools
   */
  handleListTools: RequestHandler<ListToolsRequest, ListToolsResponse> = 
    async () => {
      const formattedTools = await this.listTools();
      return {
        tools: formattedTools,
      };
    };
  
  /**
   * Execute a tool call directly (compatibility with McpServerWithRouter interface)
   */
  async executeToolCall(toolCall: { name: string; parameters: any }): Promise<any> {
    return this.handleToolCall(toolCall.name, toolCall.parameters);
  };

  /**
   * Handle a tool call
   */
  handleCallTool: RequestHandler<CallToolRequest, CallToolResponse> = 
    async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Emit event for tool call
        lmstudioEventEmitter.emit("tool-call", name, args);
        
        // Process the tool call
        return await this.handleToolCall(name, args);
      } catch (error: any) {
        console.error("Error handling LM Studio tool call:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    };

  /**
   * Private method to handle tool call
   */
  private async handleToolCall(toolName: string, args: any): Promise<CallToolResponse> {
    try {
      switch (toolName) {
        case "chat_completion":
          return await this.handleChatCompletion(args);
        case "list_models":
          return await this.handleListModels(args);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      console.error(`Error in handleToolCall (${toolName}):`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle chat_completion tool calls
   */
  private async handleChatCompletion(args: any): Promise<CallToolResponse> {
    try {
      // Validate args with zod schema
      const validatedArgs = chatCompletionSchema.parse(args);
      
      // Call the LM Studio client
      const response = await this.lmStudioClient.chat({
        model: validatedArgs.model || "default",
        messages: validatedArgs.messages,
        temperature: validatedArgs.temperature,
        stream: false
      });
      
      // Safely extract the response content
      let responseContent = "";
      if (response && response.message && typeof response.message.content === 'string') {
        responseContent = response.message.content;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseContent,
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error generating chat completion: ${error.message}`);
    }
  }

  /**
   * Handle list_models tool calls
   */
  private async handleListModels(args: any): Promise<CallToolResponse> {
    try {
      // Validate args with zod schema
      listModelsSchema.parse(args);
      
      // Call the LM Studio client
      const models = await this.lmStudioClient.listModels();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(models, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error listing models: ${error.message}`);
    }
  }

  /**
   * Process an MCP request of any supported type
   */
  async handleRequest(request: any): Promise<any> {
    const { type } = request;
    
    switch (type) {
      case "list-tools":
        return this.handleListTools(request);
      case "call-tool":
        return this.handleCallTool(request);
      default:
        throw new Error(`Unsupported request type: ${type}`);
    }
  }

  /**
   * Check if the service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const healthy = await this.lmStudioClient.isHealthy();
      return healthy;
    } catch (error) {
      console.error("LM Studio health check failed:", error);
      return false;
    }
  }

  /**
   * Perform a health check - same as isHealthy but standard interface
   */
  async healthCheck(): Promise<boolean> {
    return this.isHealthy();
  }

  /**
   * Create a streaming response handler that emits events as data is processed
   * @param options Options with emit function for handling events
   */
  createStreamingHandler(options: { emit: (event: string, data: any) => void }): any {
    const { emit } = options;
    
    // Handle tool results
    const handleToolResult = (toolName: string, result: any) => {
      emit("data", { type: "tool-result", toolName, result });
    };
    
    // Handle tool errors
    const handleToolError = (toolName: string, error: any) => {
      emit("data", { type: "error", toolName, error });
    };
    
    // Set up listeners
    lmstudioEventEmitter.on("tool-result", handleToolResult);
    lmstudioEventEmitter.on("tool-error", handleToolError);
    
    // Clean up function to remove listeners
    const cleanup = () => {
      lmstudioEventEmitter.off("tool-result", handleToolResult);
      lmstudioEventEmitter.off("tool-error", handleToolError);
    };
    
    // Create stream handler
    return {
      // Clean up when stream ends
      emit(eventName: string, data?: any) {
        if (eventName === "end") {
          cleanup();
        }
        emit(eventName, data);
      },
      cleanup
    };
  }

  /**
   * Prompt listing support - not implemented for LM Studio
   */
  async listPrompts(): Promise<any[]> {
    return [];
  }

  /**
   * Get a prompt by ID - not implemented for LM Studio
   */
  async getPrompt(_id: string): Promise<any> {
    throw new Error("Get prompt not supported for LM Studio MCP Server");
  }
}

/**
 * Create an instance of the LM Studio MCP server
 */
export function createLMStudioMcpServer(lmStudioUrl: string): LMStudioMcpServer {
  return new LMStudioMcpServer(lmStudioUrl);
}

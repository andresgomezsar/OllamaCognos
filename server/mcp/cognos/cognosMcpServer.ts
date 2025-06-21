import { EventEmitter } from "events";
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { cognosTools, getMemoriesSchema, createMemorySchema, createMemoryFromAudioSchema, deleteMemorySchema, editMemorySchema, getConversationsSchema } from "./cognosTools.js";
import OmiMemoryClient, { MemoryFilterOptions } from "./omiMemoryClient.js";
import {
  ContentItem,
  ListToolsRequest,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
  RequestHandler
} from "../types.js";

// Convert exec to promise-based version
const execAsync = promisify(exec);

// Create an event emitter for real-time data streaming
export const cognosEventEmitter = new EventEmitter();

/**
 * MCP Server for Cognos Audio Processing Integration
 * Handles MCP requests for processing audio through Cognos pipeline
 */
export class CognosMcpServer {
  private pythonPath: string;
  private cognosPipelinePath: string;
  private omiMemoryClient: OmiMemoryClient | null = null;

  constructor(
    pythonPath: string, 
    cognosPipelinePath: string, 
    omiMemoryClient?: OmiMemoryClient | any
  ) {
    this.pythonPath = pythonPath;
    this.cognosPipelinePath = cognosPipelinePath;
    
    if (omiMemoryClient) {
      // Use provided memory client (useful for testing)
      this.omiMemoryClient = omiMemoryClient;
      console.log('Using provided Omi Memory client');
    } else {
      // Initialize the Omi Memory client if API key is available
      try {
        this.omiMemoryClient = new OmiMemoryClient();
        console.log('Omi Memory API client initialized');
      } catch (error) {
        console.warn('Failed to initialize Omi Memory client (missing API key):', error);
        this.omiMemoryClient = null;
      }
    }
    
    // Set up event listeners
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for real-time data processing
   */
  private setupEventHandlers() {
    // Handle tool call events
    cognosEventEmitter.on("tool-call", async (toolName, args) => {
      console.log(`Tool call received: ${toolName}`, args);
      
      // Process the tool call asynchronously
      try {
        const result = await this.handleToolCall(toolName, args);
        cognosEventEmitter.emit("tool-result", toolName, result);
      } catch (error) {
        console.error(`Error in tool call ${toolName}:`, error);
        cognosEventEmitter.emit("tool-error", toolName, error);
      }
    });
  }

  /**
   * Get list of available tools
   */
  handleListTools: RequestHandler<ListToolsRequest, ListToolsResponse> = 
    async () => {
      return {
        tools: cognosTools,
      };
    };
    
  /**
   * List available tools (compatibility with McpServerWithRouter interface)
   */
  async listTools(): Promise<any[]> {
    return cognosTools;
  }
  
  /**
   * Get cached tools array
   */
  getTools(): any[] {
    return cognosTools;
  }
  
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
        cognosEventEmitter.emit("tool-call", name, args);
        
        // Process the tool call
        return await this.handleToolCall(name, args);
      } catch (error: any) {
        console.error("Error handling tool call:", error);
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
      // Process the tool call based on name
      switch (toolName) {
        case "process_cognos_audio":
          return await this.handleProcessCognosAudio(args);
          
        case "stream_omi_audio":
          return await this.handleStreamOmiAudio(args);
          
        // Memory API tools
        case "get_memories":
          return await this.handleGetMemories(args);
          
        case "create_memory":
          return await this.handleCreateMemory(args);
          
        case "create_memory_from_audio":
          return await this.handleCreateMemoryFromAudio(args);
          
        case "delete_memory":
          return await this.handleDeleteMemory(args);
          
        case "edit_memory":
          return await this.handleEditMemory(args);
          
        case "get_conversations":
          return await this.handleGetConversations(args);
          
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      console.error(`Error in ${toolName}:`, error);
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
  }

  /**
   * Handle process_cognos_audio tool calls
   */
  private async handleProcessCognosAudio(args: any): Promise<CallToolResponse> {
    const { audio_file_path, enable_vad = true, enable_diarization = true, enable_transcription = true } = args;
    
    if (!audio_file_path) {
      throw new Error("audio_file_path is required");
    }

    try {
      // Construct Python command to call the process_audio function
      const pythonCommand = `${this.pythonPath} -c "
import json
import sys
sys.path.append('${this.cognosPipelinePath}')
try:
    from src.main_pipeline import process_audio
    import asyncio
    result = asyncio.run(process_audio(
        '${audio_file_path}',
        enable_vad=${enable_vad ? 'True' : 'False'},
        enable_diarization=${enable_diarization ? 'True' : 'False'},
        enable_transcription=${enable_transcription ? 'True' : 'False'}
    ))
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`;

      // Execute the Python command
      console.log(`Executing Python command: ${pythonCommand}`);
      const { stdout, stderr } = await execAsync(pythonCommand, { 
        timeout: 120000 // 2-minute timeout for audio processing
      });

      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
      }

      // Parse the JSON output from the Python script
      let parsedResult;
      try {
        parsedResult = JSON.parse(stdout);
        
        // Check if the result contains an error
        if (parsedResult.error) {
          throw new Error(parsedResult.error);
        }
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        throw new Error(`Failed to parse Python output: ${stdout}`);
      }

      // Format the response for the MCP protocol
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              vad_segments: parsedResult.vad_segments || [],
              transcription: parsedResult.transcription || "",
              speakers: parsedResult.speakers || [],
              processing_metadata: parsedResult.manifest_summary || {}
            }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  /**
   * Handle stream_omi_audio tool calls - connects to Omi device and processes audio
   */
  private async handleStreamOmiAudio(args: any): Promise<CallToolResponse> {
    const { 
      device_id, 
      duration_seconds = 10,
      enable_vad = true,
      enable_diarization = true,
      enable_transcription = true
    } = args;

    try {
      // Construct Python command to call the Omi SDK and process audio
      const pythonCommand = `${this.pythonPath} -c "
import json
import sys
sys.path.append('${this.cognosPipelinePath}')
try:
    from src.omi_cognos_bridge import stream_and_process_audio
    import asyncio
    result = asyncio.run(stream_and_process_audio(
        device_id='${device_id || ""}',
        duration_seconds=${duration_seconds},
        enable_vad=${enable_vad ? 'True' : 'False'},
        enable_diarization=${enable_diarization ? 'True' : 'False'},
        enable_transcription=${enable_transcription ? 'True' : 'False'}
    ))
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`;

      // Execute the Python command
      console.log(`Executing Python command for Omi streaming: ${pythonCommand}`);
      const { stdout, stderr } = await execAsync(pythonCommand, { 
        timeout: (duration_seconds + 30) * 1000 // Add 30 seconds to the requested duration for processing
      });

      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
      }

      // Parse the JSON output from the Python script
      let parsedResult;
      try {
        parsedResult = JSON.parse(stdout);
        
        // Check if the result contains an error
        if (parsedResult.error) {
          throw new Error(parsedResult.error);
        }
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        throw new Error(`Failed to parse Python output: ${stdout}`);
      }

      // Format the response for the MCP protocol
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              device_id: parsedResult.device_id || device_id,
              duration_seconds: parsedResult.actual_duration || duration_seconds,
              vad_segments: parsedResult.vad_segments || [],
              transcription: parsedResult.transcription || "",
              speakers: parsedResult.speakers || [],
              processing_metadata: parsedResult.manifest_summary || {}
            }, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      console.error('Error streaming from Omi device:', error);
      throw error;
    }
  }

  /**
   * Process an MCP request of any supported type
   */
  async handleRequest(request: any): Promise<any> {
    switch (request.type) {
      case "list_tools":
        return this.handleListTools(request);
      case "call_tool":
        return this.handleCallTool(request);
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  /**
   * Check if the service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check - try to import the main Python module
      const checkCommand = `${this.pythonPath} -c "
import sys
sys.path.append('${this.cognosPipelinePath}')
try:
    from src.main_pipeline import process_audio
    print('healthy')
except Exception as e:
    print(f'unhealthy: {str(e)}')
exit(0)
"`;
      
      const { stdout } = await execAsync(checkCommand, { timeout: 5000 });
      return stdout.trim() === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Create a streaming response handler that emits events as data is processed
   * @param options Options with emit function for handling events
   */
  createStreamingHandler(options: { emit: (event: string, data: any) => void }): any {
    // Forward events to the provided emit function
    const handleToolResult = (toolName: string, result: any) => {
      options.emit("data", result);
    };
    
    const handleToolError = (toolName: string, error: any) => {
      options.emit("error", error instanceof Error ? error.message : 'Unknown error');
    };
    
    // Set up listeners
    cognosEventEmitter.on("tool-result", handleToolResult);
    cognosEventEmitter.on("tool-error", handleToolError);
    
    // Clean up when stream ends
    options.emit = (...args: any[]) => {
      if (args[0] === "end") {
        cognosEventEmitter.off("tool-result", handleToolResult);
        cognosEventEmitter.off("tool-error", handleToolError);
      }
    };
    
    // Return a function that accepts the tool call and connects it to our event system
    return async (data: any) => {
      try {
        const result = await this.handleToolCall(data.name, data.arguments || {});
        return result;
      } catch (error: any) {
        console.error(`Error in Cognos streaming handler:`, error);
        throw error;
      }
    };
  }
  
  /**
   * Check if Omi Memory Client is available
   */
  private checkMemoryClient(): void {
    if (!this.omiMemoryClient) {
      throw new Error('Omi Memory client not available. Please set OMI_API_KEY and OMI_UID environment variables.');
    }
  }

  /**
   * Handle get_memories tool calls
   */
  private async handleGetMemories(args: any): Promise<CallToolResponse> {
    this.checkMemoryClient();
    
    try {
      // Validate args with zod schema
      const validatedArgs = getMemoriesSchema.parse(args);
      
      // Call the client
      const memories = await this.omiMemoryClient!.getMemories(
        validatedArgs.uid,
        validatedArgs.limit,
        validatedArgs.categories
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memories, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error getting memories: ${error.message}`);
    }
  }

  /**
   * Handle create_memory tool calls
   */
  private async handleCreateMemory(args: any): Promise<CallToolResponse> {
    this.checkMemoryClient();
    
    try {
      // Validate args with zod schema
      const validatedArgs = createMemorySchema.parse(args);
      
      // Call the client
      const memory = await this.omiMemoryClient!.createMemory(
        validatedArgs.content,
        validatedArgs.category,
        validatedArgs.uid
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memory, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error creating memory: ${error.message}`);
    }
  }

  /**
   * Handle create_memory_from_audio tool calls
   */
  private async handleCreateMemoryFromAudio(args: any): Promise<CallToolResponse> {
    this.checkMemoryClient();
    
    try {
      // Validate args with zod schema
      const validatedArgs = createMemoryFromAudioSchema.parse(args);
      
      // Check if audio file exists
      if (!fs.existsSync(validatedArgs.audio_file_path)) {
        throw new Error(`Audio file not found: ${validatedArgs.audio_file_path}`);
      }
      
      // Call the client
      const memory = await this.omiMemoryClient!.createMemoryFromAudio(
        validatedArgs.audio_file_path,
        validatedArgs.category,
        validatedArgs.uid
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memory, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error creating memory from audio: ${error.message}`);
    }
  }

  /**
   * Handle delete_memory tool calls
   */
  private async handleDeleteMemory(args: any): Promise<CallToolResponse> {
    this.checkMemoryClient();
    
    try {
      // Validate args with zod schema
      const validatedArgs = deleteMemorySchema.parse(args);
      
      // Call the client
      const result = await this.omiMemoryClient!.deleteMemory(
        validatedArgs.memory_id,
        validatedArgs.uid
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error deleting memory: ${error.message}`);
    }
  }

  /**
   * Handle edit_memory tool calls
   */
  private async handleEditMemory(args: any): Promise<CallToolResponse> {
    this.checkMemoryClient();
    
    try {
      // Validate args with zod schema
      const validatedArgs = editMemorySchema.parse(args);
      
      // Call the client
      const result = await this.omiMemoryClient!.editMemory(
        validatedArgs.memory_id,
        validatedArgs.content,
        validatedArgs.uid
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error editing memory: ${error.message}`);
    }
  }
  /**
   * Handle get_conversations tool calls
   */
  private async handleGetConversations(args: any): Promise<CallToolResponse> {
    this.checkMemoryClient();
    
    try {
      // Validate args with zod schema
      const validatedArgs = getConversationsSchema.parse(args);
      
      // Call the client
      const conversations = await this.omiMemoryClient!.getConversations(
        validatedArgs.uid,
        validatedArgs.include_discarded,
        validatedArgs.limit
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(conversations, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      throw new Error(`Error getting conversations: ${error.message}`);
    }
  }
}


/**
 * Create an instance of the Cognos MCP server
 */
export function createCognosMcpServer(
  pythonPath: string = 'python', 
  cognosPipelinePath: string = path.resolve(process.cwd()),
  omiMemoryClient?: OmiMemoryClient | any
): CognosMcpServer {
  return new CognosMcpServer(pythonPath, cognosPipelinePath, omiMemoryClient);
}

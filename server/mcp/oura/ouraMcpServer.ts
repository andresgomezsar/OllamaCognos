import { EventEmitter } from "events";
import { 
  OuraService,
  createOuraService 
} from "./ouraService";
import { 
  ouraTools 
} from "./ouraTools";
import { 
  ouraPrompts 
} from "./ouraPrompts";
import { 
  ContentItem,
  ListToolsRequest, 
  ListToolsResponse,
  CallToolRequest, 
  CallToolResponse,
  ListPromptsRequest, 
  ListPromptsResponse,
  GetPromptRequest, 
  GetPromptResponse,
  RequestHandler
} from "../types";

// Create an event emitter for real-time data streaming
export const ouraEventEmitter = new EventEmitter();

/**
 * MCP Server for Oura Integration
 * Handles MCP requests and provides tools, prompts, and streaming capabilities
 */
export class OuraMcpServer {
  private ouraService: OuraService;

  constructor(ouraToken: string) {
    // Create Oura service with access token
    this.ouraService = createOuraService(ouraToken);
    
    // Set up event listeners
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for real-time data processing
   */
  private setupEventHandlers() {
    // Handle tool call events
    ouraEventEmitter.on("tool-call", async (toolName, args) => {
      console.log(`Tool call received: ${toolName}`, args);
      
      // Process the tool call asynchronously
      try {
        const result = await this.handleToolCall(toolName, args);
        ouraEventEmitter.emit("tool-result", toolName, result);
      } catch (error) {
        console.error(`Error in tool call ${toolName}:`, error);
        ouraEventEmitter.emit("tool-error", toolName, error);
      }
    });
  }

  /**
   * Get list of available tools
   */
  handleListTools: RequestHandler<ListToolsRequest, ListToolsResponse> = 
    async () => {
      return {
        tools: ouraTools,
      };
    };

  /**
   * Get list of available prompts
   */
  handleListPrompts: RequestHandler<ListPromptsRequest, ListPromptsResponse> = 
    async () => {
      return {
        prompts: ouraPrompts.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })),
      };
    };

  /**
   * Get a specific prompt by ID
   */
  handleGetPrompt: RequestHandler<GetPromptRequest, GetPromptResponse> = 
    async (request) => {
      const prompt = ouraPrompts.find(p => p.id === request.params.id);
      
      if (!prompt) {
        throw new Error(`Prompt with ID ${request.params.id} not found`);
      }
      
      return { prompt };
    };

  /**
   * Handle a tool call
   */
  handleCallTool: RequestHandler<CallToolRequest, CallToolResponse> = 
    async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Emit event for tool call
        ouraEventEmitter.emit("tool-call", name, args);
        
        // Process the tool call
        if (name === "oura-fetch") {
          return await this.handleOuraFetch(args);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
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
      // Process the tool call
      if (toolName === "oura-fetch") {
        return await this.handleOuraFetch(args);
      } else {
        throw new Error(`Unknown tool: ${toolName}`);
      }
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
  }

  /**
   * Private method to handle oura-fetch tool
   */
  private async handleOuraFetch(args: any): Promise<CallToolResponse> {
    const {
      endpoint,
      startDate,
      endDate,
      startDateTime,
      endDateTime,
      sleepPeriod,
      tagName,
    } = args;

    let response: any;

    // Input validation
    if (!endpoint) {
      throw new Error("Endpoint parameter is required");
    }

    // Handle date-based endpoints
    if (["activity", "readiness", "sleep", "stress", "tags", "sleep_sessions"].includes(endpoint)) {
      if (!startDate || !endDate) {
        throw new Error("startDate and endDate are required for this endpoint");
      }
      
      // Get appropriate data based on endpoint
      switch (endpoint) {
        case "activity":
          response = await this.ouraService.getDailyActivity(startDate, endDate);
          break;
        case "readiness":
          response = await this.ouraService.getDailyReadiness(startDate, endDate);
          break;
        case "sleep":
        case "sleep_sessions":
          response = await this.ouraService.getSleep(startDate, endDate);
          break;
        case "stress":
          response = await this.ouraService.getDailyStress(startDate, endDate);
          break;
        case "tags":
          const tagsResult = await this.ouraService.getTags(startDate, endDate);
          response = this.ouraService.processTagData(tagsResult, tagName);
          break;
      }
    }
    // Handle datetime-based endpoints (heartrate)
    else if (endpoint === "heartrate") {
      // For heartrate data, handle sleep period filtering if requested
      if (sleepPeriod) {
        // First, get sleep data to find sleep periods
        if (!startDate || !endDate) {
          throw new Error("startDate and endDate are required for sleep period filtering");
        }
        
        const sleepData = await this.ouraService.getSleep(startDate, endDate);
        
        if (!sleepData.data || sleepData.data.length === 0) {
          throw new Error("No sleep data found for the specified period");
        }
        
        // Create a collection of heart rate data during sleep periods
        const sleepHeartrateData: any[] = [];
        
        // For each sleep session, get heart rate data
        for (const session of sleepData.data) {
          const sessionStart = session.bedtime_start;
          const sessionEnd = session.bedtime_end;
          
          const heartrateData = await this.ouraService.getHeartRate(
            sessionStart,
            sessionEnd
          );
          
          if (heartrateData.data && heartrateData.data.length > 0) {
            sleepHeartrateData.push(...heartrateData.data);
          }
        }
        
        response = { data: sleepHeartrateData };
      } else {
        // Normal heart rate lookup by date range
        if (!startDateTime || !endDateTime) {
          throw new Error("startDateTime and endDateTime are required for heartrate endpoint");
        }
        
        response = await this.ouraService.getHeartRate(startDateTime, endDateTime);
      }
    } else {
      throw new Error(`Unsupported endpoint: ${endpoint}`);
    }

    // Format the response for the MCP protocol
    const content: ContentItem[] = [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      },
    ];

    return {
      content,
      isError: false,
    };
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
      case "list_prompts":
        return this.handleListPrompts(request);
      case "get_prompt":
        return this.handleGetPrompt(request);
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  /**
   * Check if the service is healthy
   */
  async isHealthy(): Promise<boolean> {
    return this.ouraService.isHealthy();
  }

  /**
   * Create a streaming response handler that emits events as data is processed
   * @param requestId Unique identifier for the request
   */
  createStreamingHandler(requestId: string): EventEmitter {
    const streamEmitter = new EventEmitter();
    
    // Set up event forwarding for this request
    const forwardEvent = (event: string, result: any) => {
      streamEmitter.emit(event, result);
    };
    
    // Set up listeners for tool events
    ouraEventEmitter.on("tool-result", forwardEvent);
    ouraEventEmitter.on("tool-error", forwardEvent);
    
    // Clean up when the stream ends
    streamEmitter.on("end", () => {
      ouraEventEmitter.off("tool-result", forwardEvent);
      ouraEventEmitter.off("tool-error", forwardEvent);
    });
    
    return streamEmitter;
  }
}

/**
 * Create an instance of the Oura MCP server
 */
export function createOuraMcpServer(ouraToken: string): OuraMcpServer {
  return new OuraMcpServer(ouraToken);
}

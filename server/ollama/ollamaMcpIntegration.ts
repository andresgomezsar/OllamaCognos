/**
 * Ollama MCP Integration
 * 
 * This module provides the integration between Ollama's function calling capabilities
 * and the MCP servers. It enables Ollama to retrieve data from MCP tools and use that
 * information in chat responses.
 */
import { v4 as uuidv4 } from 'uuid';
import { mcpServers } from '../mcp/mcpRouter';
import { ouraTools } from '../mcp/oura/ouraTools';
import { executeMCPTool } from '../mcp/mcpUtils';
import { OllamaClient } from '../ollama';
import { Tool } from '../mcp/types';

/**
 * Type definitions for Ollama function calling
 */

// Extended Ollama message type to support function calling
interface OllamaMessage {
  role: string;
  content: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}

// Interface for streaming response chunks
interface OllamaStreamingResponse {
  done: boolean;
  message: {
    role: string;
    content: string;
    tool_calls?: Array<{
      id: string;
      name: string;
      arguments: string;
    }>;
  };
}
export interface OllamaFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface OllamaFunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface OllamaFunctionResponse {
  content: any;
  toolCallId?: string;
}

/**
 * Create function definitions for Ollama based on available MCP tools
 */
export function createMcpFunctionDefinitions(): OllamaFunctionDefinition[] {
  const definitions: OllamaFunctionDefinition[] = [];
  
  // Loop through all available MCP servers
  for (const [serverName, server] of Object.entries(mcpServers)) {
    if (!server) continue; // Skip if server not available

    try {
      // Get tools from this MCP server
      const serverTools = server.getTools?.() || [];

      // Process each tool from this server
      for (const tool of serverTools) {
        // Transform the MCP tool schema to Ollama function definition
        const definition: OllamaFunctionDefinition = {
          name: `mcp_${serverName}_${tool.name}`, // Use consistent naming: mcp_server_tool
          description: `${tool.description} (via ${serverName} MCP server)`,
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        };
        
        // Convert input schema to Ollama parameters
        if (tool.inputSchema && tool.inputSchema.properties) {
          for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
            // Cast unknown property to expected shape and use default values if missing
            const typedProp = prop as { type?: string; description?: string; enum?: string[]; items?: any };
            
            definition.parameters.properties[key] = {
              type: typedProp.type || 'string',
              description: typedProp.description || ''
            };
            
            // Add enum if available
            if (typedProp.enum) {
              definition.parameters.properties[key].enum = typedProp.enum;
            }
            
            // Handle array types with items
            if (typedProp.type === 'array' && typedProp.items) {
              // Add items property if it's an array
              (definition.parameters.properties[key] as any).items = typedProp.items;
            }
          }
          
          // Add required parameters
          if (tool.inputSchema.required) {
            definition.parameters.required = tool.inputSchema.required;
          }
        }
        
        definitions.push(definition);
      }
    } catch (error) {
      console.error(`Error getting tools from ${serverName} MCP server:`, error);
    }
  }
  
  // Also add Oura tools directly (if not already added through mcpServers)
  if (!mcpServers.oura) {
    for (const tool of ouraTools) {
      // Add only if not already added
      if (!definitions.some(def => def.name === `mcp_oura_${tool.name}`)) {
        // Transform the MCP tool schema to Ollama function definition
        const definition: OllamaFunctionDefinition = {
          name: `mcp_oura_${tool.name}`,
          description: `${tool.description} (via Oura MCP server)`,
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        };
        
        // Convert input schema to Ollama parameters
        if (tool.inputSchema && tool.inputSchema.properties) {
          for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
            // Cast unknown property to expected shape and use default values if missing
            const typedProp = prop as { type?: string; description?: string; enum?: string[] };
            definition.parameters.properties[key] = {
              type: typedProp.type || 'string',
              description: typedProp.description || ''
            };
            
            // Add enum if available
            if (typedProp.enum) {
              definition.parameters.properties[key].enum = typedProp.enum;
            }
          }
          
          // Add required parameters
          if (tool.inputSchema.required) {
            definition.parameters.required = tool.inputSchema.required;
          }
        }
        
        definitions.push(definition);
      }
    }
  }
  
  return definitions;
}

/**
 * Process Ollama function calls and route them to MCP servers
 */
export async function processMcpFunctionCall(
  functionCall: OllamaFunctionCall
): Promise<OllamaFunctionResponse> {
  console.log(`Processing MCP function call: ${functionCall.name}`);
  
  // Parse function name to get MCP server and tool
  const functionNameParts = functionCall.name.split('_');
  
  if (functionNameParts[0] !== 'mcp') {
    throw new Error(`Not an MCP function call: ${functionCall.name}`);
  }
  
  let serverName: string;
  let toolName: string;
  
  if (functionNameParts.length === 3) {
    // Format: mcp_server_tool (our standard format)
    serverName = functionNameParts[1];
    toolName = functionNameParts[2];
    console.log(`Parsed standard format: server=${serverName}, tool=${toolName}`);
  } else if (functionNameParts.length === 2) {
    // Legacy format: mcp_tool (assume server based on tool name prefix)
    const toolFullName = functionNameParts[1];
    
    // Try to determine server based on our known servers
    const knownServers = Object.keys(mcpServers);
    const matchingServer = knownServers.find(server => toolFullName.startsWith(server));
    
    if (matchingServer) {
      serverName = matchingServer;
      toolName = toolFullName.substring(matchingServer.length + 1); // +1 for the hyphen
    } else {
      // Use oura as default server if no match found
      serverName = 'oura';
      toolName = toolFullName;
    }
    
    console.log(`Parsed legacy format: server=${serverName}, tool=${toolName} (from ${toolFullName})`);
  } else {
    throw new Error(`Invalid MCP function name format: ${functionCall.name}`);
  }
  
  // Validate server exists
  if (!mcpServers[serverName]) {
    const availableServers = Object.keys(mcpServers).filter(key => !!mcpServers[key]);
    console.error(`Server '${serverName}' not found. Available servers: ${availableServers.join(', ')}`);
    return {
      content: `Error: MCP server '${serverName}' not found. Available servers: ${availableServers.join(', ')}`,
      toolCallId: uuidv4()
    };
  }
  
  try {
    console.log(`Executing MCP tool: ${serverName}/${toolName} with args:`, functionCall.arguments);
    
    // Call the MCP tool
    const result = await executeMCPTool(
      serverName,
      toolName,
      functionCall.arguments
    );
    
    console.log(`MCP tool execution result:`, typeof result, result ? Object.keys(result).join(', ') : 'null');
    
    // Format the result for Ollama
    let content = '';
    
    if (result) {
      if (typeof result === 'string') {
        // Direct string result
        content = result;
      } else if (result.content) {
        // Content array with types
        for (const item of result.content) {
          if (item.type === 'text') {
            content += item.text + '\n';
          } else if (item.type === 'json') {
            content += JSON.stringify(item.json, null, 2) + '\n';
          }
        }
      } else if (typeof result === 'object') {
        // Plain object result
        content = JSON.stringify(result, null, 2);
      }
    }
    
    console.log(`Formatted MCP result (first 100 chars): ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
    
    return {
      content,
      toolCallId: uuidv4()
    };
  } catch (error: any) {
    console.error(`Error executing MCP tool ${serverName}/${toolName}:`, error);
    return {
      content: `Error: ${error.message || 'Unknown error'} when executing ${serverName}/${toolName}`,
      toolCallId: uuidv4()
    };
  }
}

/**
 * Enhance an Ollama client with MCP function calling capabilities
 */
export function enhanceOllamaWithMcp(ollama: OllamaClient): OllamaClient {
  // Get MCP function definitions
  const mcpFunctions = createMcpFunctionDefinitions();
  console.log(`Loaded ${mcpFunctions.length} MCP function definitions`);

  // For debugging: log tools available
  if (process.env.DEBUG_MCP_TOOLS === 'true') {
    console.log('Available MCP tools:');
    for (const fn of mcpFunctions) {
      console.log(` - ${fn.name}: ${fn.description.substring(0, 50)}...`);
    }
  }
  
  // Store original chat method
  const originalChat = ollama.chat.bind(ollama);
  
  // Override chat method to include MCP functions
  ollama.chat = async (options: any) => {
    // Add tools to options if not disabled
    if (!options.disableMcpTools) {
      // Determine which MCP functions to include based on enabledMcpTools if provided
      let mcpToolsToInclude = mcpFunctions;
      
      if (options.enabledMcpTools && Array.isArray(options.enabledMcpTools) && options.enabledMcpTools.length > 0) {
        // Filter to only include specified tools
        mcpToolsToInclude = mcpFunctions.filter(fn => {
          // Check if tool name is in the enabled list (allowing for both mcp_server_tool and just tool formats)
          return options.enabledMcpTools.some((enabledTool: string) => {
            const fullToolName = fn.name;
            const shortToolName = fn.name.split('_').slice(2).join('_'); // Get just the tool part
            return fullToolName === enabledTool || shortToolName === enabledTool;
          });
        });
        console.log(`Using ${mcpToolsToInclude.length} enabled MCP tools out of ${mcpFunctions.length} available`);
      }
      
      options.tools = [
        ...(options.tools || []),
        ...mcpToolsToInclude
      ];
      
      // If debug is enabled, log the tools we're using
      if (process.env.DEBUG_MCP_TOOLS === 'true') {
        console.log('MCP Tools provided to Ollama:');
        for (const tool of options.tools) {
          console.log(` - ${tool.name}`);
        }
      }
    }
    
    // Call original method
    const response = await originalChat(options);
    
    // If the response includes a tool call, process it
    const message = response.message as OllamaMessage;
    const toolCalls = message?.tool_calls || [];
    if (toolCalls.length > 0) {
      console.log(`Response contains ${toolCalls.length} tool calls`);
      
      for (const toolCall of toolCalls) {
        if (toolCall.name.startsWith('mcp_')) {
          console.log(`Processing MCP tool call: ${toolCall.name} with ID ${toolCall.id}`);
          let toolArguments: Record<string, any>;
          
          try {
            // Parse the tool arguments
            toolArguments = JSON.parse(toolCall.arguments);
            console.log('Parsed tool arguments:', toolArguments);
            
            // Process MCP function call
            console.log(`Executing MCP function: ${toolCall.name}`);
            const functionCallResult = await processMcpFunctionCall({
              name: toolCall.name,
              arguments: toolArguments
            });
            
            // Add tool results to messages
            if (!options.messages) options.messages = [];
            
            console.log(`Adding tool response to messages: ${functionCallResult.content.substring(0, 50)}...`);
            
            options.messages.push(response.message);
            options.messages.push({
              role: 'tool',
              name: toolCall.name,
              content: functionCallResult.content,
              tool_call_id: toolCall.id
            });
            
            // Call chat again with updated messages
            console.log('Calling Ollama again with tool results');
            return await originalChat({
              ...options,
              disableMcpTools: true // Prevent infinite loop
            });
          } catch (error) {
            console.error(`Error processing MCP function call ${toolCall.name}:`, error);
            
            // Add error response as tool message
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (!options.messages) options.messages = [];
            options.messages.push(response.message);
            options.messages.push({
              role: 'tool',
              name: toolCall.name,
              content: `Error: ${errorMessage}`,
              tool_call_id: toolCall.id
            });
            
            // Call chat again with error message
            console.log('Calling Ollama again with error response');
            return await originalChat({
              ...options,
              disableMcpTools: true // Prevent infinite loop
            });
          }
        } else {
          console.log(`Skipping non-MCP tool call: ${toolCall.name}`);
        }
      }
    }
    
    return response;
  };
  
  // Handle streaming version by adding a wrapper for streaming chat
  const originalStreamingChat = ollama.streamingChat?.bind(ollama);
  if (originalStreamingChat) {
    ollama.streamingChat = async function* (options: any) {
      // Add MCP functions to options (same logic as in chat)
      if (!options.disableMcpTools) {
        // Determine which MCP functions to include based on enabledMcpTools if provided
        let mcpToolsToInclude = mcpFunctions;
        
        if (options.enabledMcpTools && Array.isArray(options.enabledMcpTools) && options.enabledMcpTools.length > 0) {
          mcpToolsToInclude = mcpFunctions.filter(fn => {
            return options.enabledMcpTools.some((enabledTool: string) => {
              const fullToolName = fn.name;
              const shortToolName = fn.name.split('_').slice(2).join('_');
              return fullToolName === enabledTool || shortToolName === enabledTool;
            });
          });
        }
        
        options.tools = [
          ...(options.tools || []),
          ...mcpToolsToInclude
        ];
      }
      
      // Process streaming response
      for await (const chunk of originalStreamingChat!(options)) {
        yield chunk as OllamaStreamingResponse;
        
        // Handle tool calls at the end of streaming
        if ((chunk as OllamaStreamingResponse).done && 
            (chunk as OllamaStreamingResponse).message && 
            (chunk as OllamaStreamingResponse).message.tool_calls?.length > 0) {
          // We'll need to handle tool calls separately after streaming completes
          console.log('Streaming completed with tool calls, will handle them after yield');
        }
      }
    };
  }
  
  return ollama;
}

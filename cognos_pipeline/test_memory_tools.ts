/**
 * Test script for the Omi Memory API MCP tools
 * 
 * This script connects to the MCP server and tests the memory-related tools
 * to verify memory creation, retrieval, editing, and deletion.
 */

import fetch from 'node-fetch';
import { Blob } from 'buffer';
import path from 'path';
import fs from 'fs';
import { MockOmiMemoryClient } from './mockOmiMemoryClient';
import { ContentItem } from '../server/mcp/types';

// Configure settings
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000/api/mcp';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

// Create a mock client instance for tests
const mockMemoryClient = new MockOmiMemoryClient();

// Define a minimal McpClient type for our test
class McpClient {
  private baseUrl: string;
  
  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl;
  }
  
  async listTools(): Promise<string[]> {
    console.log(`Fetching tools from: ${this.baseUrl}/tools`);
    try {
      const response = await fetch(`${this.baseUrl}/tools`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      // Handle both formats: { success: true, tools: [...] } or just an array
      const toolsList = Array.isArray(data) ? data : (data.tools || []);
      console.log('Raw tools data:', toolsList);
      return toolsList;
    } catch (error) {
      console.error('Error listing tools:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  async callTool({ name, parameters }: { name: string; parameters: Record<string, any> }): Promise<{ content: ContentItem[] }> {
    // Parse server and tool name (e.g., 'cognos/create_memory' -> server='cognos', toolName='create_memory')
    let server = 'cognos'; // Default server
    let toolName = name;
    
    if (name.includes('/')) {
      const parts = name.split('/');
      server = parts[0];
      toolName = parts[1];
    }
    
    const endpoint = `${this.baseUrl}/${server}/call-tool`;
    console.log(`Calling tool ${toolName} on server ${server} at: ${endpoint}`);
    console.log('With parameters:', JSON.stringify(parameters));
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: toolName, // Use the extracted tool name (without server prefix)
          arguments: parameters
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.isError) {
        throw new Error(data.content?.[0]?.text || 'Unknown error');
      }
      
      return data;
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
// Nothing needed here - imports are now at the top

/**
 * Main test function
 */
async function runTest() {
  console.log('Starting Omi Memory API test...');
  
  try {
    // Create MCP client
    const client = new McpClient({
      baseUrl: MCP_BASE_URL,
    });
    
    console.log(`Connecting to MCP server at: ${MCP_BASE_URL}...`);

    console.log('Connecting to MCP server...');
    
    // List available tools to verify connection
    const tools = await client.listTools();
    console.log(`Found ${tools.length} tools:`);
    
    // Find the memory tools - handle both prefixed (cognos/get_memories) and unprefixed (get_memories) formats
    const memoryToolNames = [
      'get_memories',
      'create_memory',
      'create_memory_from_audio',
      'delete_memory',
      'edit_memory',
      'get_conversations'
    ];
    
    // Filter for tools that match either exactly or with any prefix (like cognos/)
    const memoryTools = tools.filter((toolName: string) => 
      memoryToolNames.some(name => 
        toolName === name || (typeof toolName === 'string' && toolName.endsWith('/' + name))
      )
    );
      
    console.log('Memory tools available:', memoryTools);
    
    if (memoryTools.length === 0) {
      console.error('No memory tools found! Make sure OMI_API_KEY and OMI_UID are set.');
      process.exit(1);
    }
    
    // Test memory creation
    console.log('\n1. Testing create_memory tool...');
    const createMemoryTool = memoryTools.find(toolName => 
      typeof toolName === 'string' && toolName.endsWith('create_memory')
    );
    if (!createMemoryTool) throw new Error('create_memory tool not found!');
    
    const createResult = await client.callTool({
      name: createMemoryTool, // Tool is now a string
      parameters: {
        content: 'This is a test memory created via MCP at ' + new Date().toISOString(),
        category: 'TEST',
        uid: TEST_USER_ID
      }
    });
    
    console.log('Memory created:', createResult);
    
    // Extract memory ID from the result
    const memoryData = JSON.parse(createResult.content[0].text);
    const createdMemoryId = memoryData.id;
    
    if (!createdMemoryId) {
      throw new Error('Failed to get memory ID from create result');
    }
    
    console.log(`Created memory with ID: ${createdMemoryId}`);
    
    // Test memory retrieval
    console.log('\n2. Testing get_memories tool...');
    const getMemoriesTool = memoryTools.find(toolName => 
      typeof toolName === 'string' && toolName.endsWith('get_memories')
    );
    if (!getMemoriesTool) throw new Error('get_memories tool not found!');
    
    const getResult = await client.callTool({
      name: getMemoriesTool, // Tool is now a string
      parameters: {
        uid: TEST_USER_ID,
        limit: 5,
        categories: ['TEST']
      }
    });
    
    console.log('Retrieved memories:', getResult);
    
    // Test memory editing
    console.log('\n3. Testing edit_memory tool...');
    const editMemoryTool = memoryTools.find(toolName => 
      typeof toolName === 'string' && toolName.endsWith('edit_memory')
    );
    if (!editMemoryTool) throw new Error('edit_memory tool not found!');
    
    const editResult = await client.callTool({
      name: editMemoryTool, // Tool is now a string
      parameters: {
        memory_id: createdMemoryId,
        content: 'This memory was edited at ' + new Date().toISOString(),
        uid: TEST_USER_ID
      }
    });
    
    console.log('Memory edited:', editResult);
    
    // Test audio memory creation (optional, if a test audio file exists)
    const testAudioPath = path.join(__dirname, 'test_audio.wav');
    if (fs.existsSync(testAudioPath)) {
      console.log('\n4. Testing create_memory_from_audio tool...');
      const audioMemoryTool = memoryTools.find(toolName => 
        typeof toolName === 'string' && toolName.endsWith('create_memory_from_audio')
      );
      if (!audioMemoryTool) throw new Error('create_memory_from_audio tool not found!');
      
      const audioMemoryResult = await client.callTool({
        name: audioMemoryTool, // Tool is now a string
        parameters: {
          audio_file_path: testAudioPath,
          category: 'AUDIO_TEST',
          uid: TEST_USER_ID
        }
      });
      
      console.log('Audio memory created:', audioMemoryResult);
    } else {
      console.log(`\nSkipping audio memory test (test file not found: ${testAudioPath})`);
    }
    
    // Test conversations (if supported by API)
    console.log('\n5. Testing get_conversations tool...');
    try {
      const conversationsTool = memoryTools.find(toolName => 
        typeof toolName === 'string' && toolName.endsWith('get_conversations')
      );
      if (!conversationsTool) throw new Error('get_conversations tool not found!');
      
      const conversationsResult = await client.callTool({
        name: conversationsTool, // Tool is now a string
        parameters: {
          uid: TEST_USER_ID,
          include_discarded: false,
          limit: 5
        }
      });
      
      console.log('Conversations retrieved:', conversationsResult);
    } catch (convError: unknown) {
      const errorMessage = convError instanceof Error ? convError.message : 'Unknown error';
      console.log('Note: get_conversations may not be supported by the API:', errorMessage);
    }
    
    // Finally, test memory deletion
    console.log('\n6. Testing delete_memory tool...');
    const deleteMemoryTool = memoryTools.find(toolName => 
      typeof toolName === 'string' && toolName.endsWith('delete_memory')
    );
    if (!deleteMemoryTool) throw new Error('delete_memory tool not found!');
    
    const deleteResult = await client.callTool({
      name: deleteMemoryTool, // Tool is now a string
      parameters: {
        memory_id: createdMemoryId,
        uid: TEST_USER_ID
      }
    });
    
    console.log('Memory deleted:', deleteResult);
    
    // Write test results summary to a file
    const resultSummary = {
      memoryCreated: !!createResult,
      memoriesRetrieved: !!getResult,
      memoryEdited: !!editResult,
      memoryDeleted: !!deleteResult,
      testTimestamp: new Date().toISOString()
    };
    
    const outputFile = path.join(__dirname, 'memory_test_result.json');
    fs.writeFileSync(
      outputFile, 
      JSON.stringify(resultSummary, null, 2)
    );
    
    console.log(`\nTest completed. Summary saved to ${outputFile}`);
    console.log('All memory tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest().catch((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error('Unhandled error:', errorMessage);
  process.exit(1);
});

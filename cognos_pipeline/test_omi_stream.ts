/**
 * Test script for the stream_omi_audio MCP tool
 * 
 * This script connects to the MCP server and tests the stream_omi_audio
 * tool to verify real-time audio streaming from Omi necklace devices.
 */

import { McpClient } from '@modelcontextprotocol/sdk';
import path from 'path';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables from .env file
config();

// Get the base URL from environment or use default
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000';

/**
 * Main test function
 */
async function runTest() {
  console.log('Starting Omi streaming test...');
  
  try {
    // Create MCP client
    const client = new McpClient({
      baseUrl: `${MCP_BASE_URL}/mcp`,
    });

    console.log('Connecting to MCP server...');
    
    // List available tools to verify connection
    const tools = await client.listTools();
    console.log(`Found ${tools.length} tools:`);
    
    // Find the Cognos tools
    const cognosTools = tools.filter(tool => 
      tool.name === 'process_cognos_audio' || 
      tool.name === 'stream_omi_audio');
      
    console.log('Cognos tools:', cognosTools.map(t => t.name));
    
    if (!cognosTools.includes(tool => tool.name === 'stream_omi_audio')) {
      console.error('stream_omi_audio tool not found!');
      process.exit(1);
    }
    
    // Call the stream_omi_audio tool
    console.log('Testing stream_omi_audio tool...');
    const streamResult = await client.callTool({
      name: 'stream_omi_audio',
      parameters: {
        // Use mock device since this is just a test
        device_id: 'mock', 
        duration_seconds: 5,
        enable_vad: true,
        enable_diarization: true,
        enable_transcription: true
      }
    });
    
    // Write results to a file
    const outputFile = path.join(__dirname, 'stream_test_result.json');
    fs.writeFileSync(
      outputFile, 
      JSON.stringify(streamResult, null, 2)
    );
    
    console.log(`Test completed. Results saved to ${outputFile}`);
    console.log('Summary:', streamResult);
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

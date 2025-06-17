/**
 * Integration Test for Cognos MCP Server
 * 
 * This script tests the full integration between:
 * - The Cognos MCP Server TypeScript implementation
 * - The Python audio processing pipeline
 * 
 * It verifies that:
 * 1. The MCP server can list tools correctly
 * 2. The process_cognos_audio tool executes successfully
 * 3. The Python pipeline returns valid JSON output
 */

import { execSync } from 'child_process';
import * as path from 'path';
import { createCognosMcpServer } from '../server/mcp/cognos/cognosMcpServer';
import { processCognosAudioSchema } from '../server/mcp/cognos/cognosTools';

// Configure test paths
const TEST_DIR = __dirname;
const PYTHON_PATH = process.env.COGNOS_PYTHON_PATH || 'python';
const PIPELINE_PATH = process.env.COGNOS_PIPELINE_PATH || path.resolve(__dirname);
const TEST_AUDIO_DIR = path.join(__dirname, 'test_audio');
const TEST_AUDIO_FILE = path.join(TEST_AUDIO_DIR, 'test_tone.wav');

/**
 * Run the integration test
 */
async function runIntegrationTest() {
  console.log('=== Cognos MCP Server Integration Test ===');
  console.log(`Testing with Python path: ${PYTHON_PATH}`);
  console.log(`Testing with pipeline path: ${PIPELINE_PATH}`);
  
  // Check if the test audio file exists, if not create it
  try {
    console.log('Checking for test audio file...');
    const statResult = execSync(`ls -la ${TEST_AUDIO_FILE}`).toString();
    console.log(`Found existing test file: ${statResult.trim()}`);
  } catch (err) {
    console.log('Test audio file not found, creating it...');
    execSync(`cd ${TEST_DIR} && ${PYTHON_PATH} create_test_audio.py`, { stdio: 'inherit' });
  }
  
  // Create MCP server instance
  console.log('\nInitializing Cognos MCP server...');
  const cognosMcpServer = createCognosMcpServer(PYTHON_PATH, PIPELINE_PATH);
  
  try {
    // Test 1: Check that server can list tools
    console.log('\nTEST 1: Listing available tools...');
    const tools = await cognosMcpServer.listTools();
    console.log(`Found ${tools.length} tools:`);
    tools.forEach(tool => console.log(`- ${tool.name}: ${tool.description}`));
    
    // Verify process_cognos_audio tool is present
    const processTool = tools.find(tool => tool.name === 'process_cognos_audio');
    if (!processTool) {
      throw new Error('process_cognos_audio tool not found in server tools list');
    }
    console.log('✓ process_cognos_audio tool found in server');
    
    // Test 2: Check server health
    console.log('\nTEST 2: Checking server health...');
    const isHealthy = await cognosMcpServer.isHealthy();
    console.log(`Server health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    if (!isHealthy) {
      throw new Error('Server health check failed');
    }
    console.log('✓ Server is healthy');
    
    // Test 3: Execute process_cognos_audio tool
    console.log('\nTEST 3: Executing process_cognos_audio tool...');
    console.log(`Using test audio file: ${TEST_AUDIO_FILE}`);
    
    const toolParams = {
      audio_file_path: TEST_AUDIO_FILE,
      enable_vad: true,
      enable_diarization: true,
      enable_transcription: true
    };
    
    // Validate parameters with zod schema
    try {
      console.log('Validating tool parameters...');
      const validatedParams = processCognosAudioSchema.parse(toolParams);
      console.log('✓ Parameter validation passed');
    } catch (validationError) {
      console.error('Parameter validation failed:', validationError);
      throw validationError;
    }
    
    // Execute the tool call
    console.log('Executing tool call...');
    const startTime = Date.now();
    const result = await cognosMcpServer.executeToolCall({
      name: 'process_cognos_audio',
      parameters: toolParams
    });
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`Tool execution completed in ${duration.toFixed(2)}s`);
    
    // Verify result format
    if (!result || !result.content || !result.content[0]) {
      throw new Error('Invalid result format, missing content');
    }
    
    // Parse the result content
    let parsedContent;
    try {
      parsedContent = JSON.parse(result.content[0].text);
      console.log('✓ Result parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse result content:', result.content[0].text);
      throw new Error('Invalid JSON in result content');
    }
    
    // Verify all expected fields are present
    const requiredFields = ['vad_segments', 'transcription', 'speakers', 'processing_metadata'];
    for (const field of requiredFields) {
      if (!(field in parsedContent)) {
        throw new Error(`Missing required field in result: ${field}`);
      }
    }
    
    console.log('Result summary:');
    console.log('- VAD segments:', parsedContent.vad_segments.length);
    console.log('- Transcription length:', parsedContent.transcription.length);
    console.log('- Speakers detected:', parsedContent.speakers.length);
    console.log('- Processing status:', parsedContent.processing_metadata.status);
    
    console.log('\n✓ All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the integration test
runIntegrationTest().catch(err => {
  console.error('Unhandled error in integration test:', err);
  process.exit(1);
});

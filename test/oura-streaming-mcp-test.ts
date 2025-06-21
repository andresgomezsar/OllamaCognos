/**
 * Oura MCP Streaming Integration Tests
 * 
 * This file contains tests for the Oura MCP tools integration with Ollama using streaming responses.
 * It demonstrates how to use Oura health data to answer health-related questions with streaming output.
 */

import { OllamaClient, OllamaResponse } from '../server/ollama'; 
import { enhanceOllamaWithMcp } from '../server/ollama/ollamaMcpIntegration';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// The model that has good function calling support
const MODEL = process.env.FUNCTION_CALLING_MODEL || 'hf.co/yard/Llama-xLAM-2-8b-fc-r-Q4_K_M-GGUF:Q4_K_M';

// Extended type for message that includes tool_calls
interface ExtendedMessage {
  role: string;
  content: string;
  tool_calls?: Array<any>;
  [key: string]: any; // Allow for additional properties
}

/**
 * Test streaming response with sleep data tool
 */
async function testStreamingSleepQuestion() {
  console.log('\n=== Testing Oura Sleep Data Tool with Streaming ===');
  
  try {
    // Create Ollama client and enhance with MCP
    const baseUrl = process.env.USE_NGROK === 'false' 
      ? process.env.OLLAMA_NGROK_URL 
      : process.env.OLLAMA_URL || 'http://localhost:11434';
      
    console.log(`Connecting to Ollama at ${baseUrl}`);
    
    // Create base client
    const ollama = new OllamaClient(baseUrl);
    
    // Enhance with MCP tools
    const mcpOllama = enhanceOllamaWithMcp(ollama);
    
    if (!mcpOllama.streamingChat) {
      throw new Error('streamingChat is not available on the enhanced client');
    }
    
    console.log(`Using model: ${MODEL}`);
    console.log('Sending sleep quality question with streaming...');
    
    // Process streaming response
    const streamingResponse = mcpOllama.streamingChat({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a health assistant that helps users understand their Oura health data.' },
        { role: 'user', content: 'How was my sleep quality last night? Give me a detailed breakdown of my sleep stages.' }
      ],
      enabledMcpTools: ['mcp_oura_get_sleep_data'], // Use the specific sleep data tool
      stream: true
    });
    
    // Collect all chunks for analysis
    const chunks: any[] = [];
    let toolCallDetected = false;
    
    // Process each chunk as it arrives
    console.log('\nStreaming Response:');
    for await (const chunk of streamingResponse) {
      chunks.push(chunk);
      
      // For demonstration, print out content as it arrives
      if (chunk.message && chunk.message.content) {
        process.stdout.write(chunk.message.content);
      }
      
      // Check if this chunk contains a tool call
      // Cast to extended message type to handle tool_calls
      const extendedMessage = chunk.message as ExtendedMessage;
      if (extendedMessage && extendedMessage.tool_calls && extendedMessage.tool_calls.length > 0) {
        toolCallDetected = true;
        console.log('\n\nTool Call Detected:');
        console.log(JSON.stringify(extendedMessage.tool_calls, null, 2));
      }
    }
    
    console.log('\n\nStreaming completed');
    console.log(`Received ${chunks.length} chunks`);
    console.log(`Tool calls detected: ${toolCallDetected}`);
    
    return chunks;
  } catch (error) {
    console.error('Error testing streaming sleep question:', error);
    throw error;
  }
}

/**
 * Test streaming response with activity data tool
 */
async function testStreamingActivityQuestion() {
  console.log('\n=== Testing Oura Activity Data Tool with Streaming ===');
  
  try {
    // Create Ollama client and enhance with MCP
    const baseUrl = process.env.USE_NGROK === 'true' 
      ? process.env.OLLAMA_NGROK_URL 
      : process.env.OLLAMA_URL || 'http://localhost:11434';
      
    console.log(`Connecting to Ollama at ${baseUrl}`);
    
    // Create base client
    const ollama = new OllamaClient(baseUrl);
    
    // Enhance with MCP tools
    const mcpOllama = enhanceOllamaWithMcp(ollama);
    
    if (!mcpOllama.streamingChat) {
      throw new Error('streamingChat is not available on the enhanced client');
    }
    
    console.log(`Using model: ${MODEL}`);
    console.log('Sending activity question with streaming...');
    
    // Process streaming response
    const streamingResponse = mcpOllama.streamingChat({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a health assistant that helps users understand their Oura health data.' },
        { role: 'user', content: 'How active have I been today compared to my target?' }
      ],
      enabledMcpTools: ['mcp_oura_get_activity_data'], // Use the specific activity data tool
      stream: true
    });
    
    // Collect all chunks for analysis
    const chunks: any[] = [];
    let toolCallDetected = false;
    
    // Process each chunk as it arrives
    console.log('\nStreaming Response:');
    for await (const chunk of streamingResponse) {
        chunks.push(chunk);
      
      // For demonstration, print out content as it arrives
      if (chunk.message && chunk.message.content) {
        process.stdout.write(chunk.message.content);
      }
      
      // Check if this chunk contains a tool call
      // Cast to extended message type to handle tool_calls
      const extendedMessage = chunk.message as ExtendedMessage;
      if (extendedMessage && extendedMessage.tool_calls && extendedMessage.tool_calls.length > 0) {
        toolCallDetected = true;
        console.log('\n\nTool Call Detected:');
        console.log(JSON.stringify(extendedMessage.tool_calls, null, 2));
      }
    }
    
    console.log('\n\nStreaming completed');
    console.log(`Received ${chunks.length} chunks`);
    console.log(`Tool calls detected: ${toolCallDetected}`);
    
    return chunks;
  } catch (error) {
    console.error('Error testing streaming activity question:', error);
    throw error;
  }
}

/**
 * Run all tests sequentially
 */
async function runAllStreamingTests() {
  try {
    console.log('Starting Oura MCP streaming integration tests...');
    
    // Run sleep test with streaming
    await testStreamingSleepQuestion();
    
    // Run activity test with streaming
    await testStreamingActivityQuestion();
    
    console.log('\nAll streaming tests completed successfully');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Execute tests if run directly
if (require.main === module) {
  runAllStreamingTests();
}

export { testStreamingSleepQuestion, testStreamingActivityQuestion, runAllStreamingTests };

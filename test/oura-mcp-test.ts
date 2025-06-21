/**
 * Oura MCP Integration Tests
 * 
 * This file contains tests for the Oura MCP tools integration with Ollama.
 * It demonstrates how to use Oura health data to answer health-related questions.
 */

import { OllamaClient } from '../server/ollama'; 
import { enhanceOllamaWithMcp } from '../server/ollama/ollamaMcpIntegration';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// The model that has good function calling support
const MODEL = process.env.FUNCTION_CALLING_MODEL || 'hf.co/yard/Llama-xLAM-2-8b-fc-r-Q4_K_M-GGUF:Q4_K_M';

/**
 * Test that asks about sleep quality and should trigger the get_sleep_data tool
 */
async function testSleepQuestion() {
  console.log('\n=== Testing Oura Sleep Data Tool ===');
  
  try {
    // Create Ollama client and enhance with MCP
    const baseUrl = process.env.USE_NGROK === 'true' 
      ? process.env.OLLAMA_NGROK_URL 
      : process.env.OLLAMA_URL || 'http://localhost:11434';
      
    console.log(`Connecting to Ollama at ${baseUrl}`);
    
    // Create base client
    const ollama = new OllamaClient({
      baseUrl
    });
    
    // Enhance with MCP tools
    const mcpOllama = enhanceOllamaWithMcp(ollama);
    
    console.log(`Using model: ${MODEL}`);
    console.log('Sending sleep quality question...');
    
    // Ask about sleep quality which should trigger Oura sleep data
    const response = await mcpOllama.chat({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a health assistant that helps users understand their Oura health data.' },
        { role: 'user', content: 'How was my sleep quality last night?' }
      ],
      enabledMcpTools: ['get_sleep_data'], // Only enable this specific tool
      format: 'json',
      stream: false
    });
    
    console.log('\nResponse:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error testing sleep question:', error);
    throw error;
  }
}

/**
 * Test that asks about readiness and should trigger the get_readiness_data tool
 */
async function testReadinessQuestion() {
  console.log('\n=== Testing Oura Readiness Tool ===');
  
  try {
    // Create Ollama client and enhance with MCP
    const baseUrl = process.env.USE_NGROK === 'true' 
      ? process.env.OLLAMA_NGROK_URL 
      : process.env.OLLAMA_URL || 'http://localhost:11434';
      
    console.log(`Connecting to Ollama at ${baseUrl}`);
    
    // Create base client
    const ollama = new OllamaClient({
      baseUrl
    });
    
    // Enhance with MCP tools
    const mcpOllama = enhanceOllamaWithMcp(ollama);
    
    console.log(`Using model: ${MODEL}`);
    console.log('Sending readiness question...');
    
    // Ask about readiness which should trigger Oura readiness data
    const response = await mcpOllama.chat({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a health assistant that helps users understand their Oura health data.' },
        { role: 'user', content: 'Am I ready for a workout today?' }
      ],
      enabledMcpTools: ['get_readiness_data'], // Only enable this specific tool
      format: 'json',
      stream: false
    });
    
    console.log('\nResponse:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error testing readiness question:', error);
    throw error;
  }
}

/**
 * Run all tests sequentially
 */
async function runAllTests() {
  try {
    console.log('Starting Oura MCP integration tests...');
    
    // Run sleep test
    await testSleepQuestion();
    
    // Run readiness test
    await testReadinessQuestion();
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Execute tests if run directly
if (require.main === module) {
  runAllTests();
}

export { testSleepQuestion, testReadinessQuestion, runAllTests };

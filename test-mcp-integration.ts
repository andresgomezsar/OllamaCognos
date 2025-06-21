/**
 * Test script for MCP integration with Ollama
 */
import { OllamaClient } from './server/ollama';
import { enhanceOllamaWithMcp } from './server/ollama/ollamaMcpIntegration';

// Set debug environment variable
process.env.DEBUG_MCP_TOOLS = 'true';
process.env.NODE_ENV = 'development';

async function testMcpIntegration() {
  try {
    // Initialize the Ollama client
    console.log('Initializing Ollama client...');
    const baseClient = new OllamaClient('http://localhost:11434');
    
    // Enhance with MCP capabilities
    console.log('Enhancing client with MCP capabilities...');
    const client = enhanceOllamaWithMcp(baseClient);
    
    // Test with an existing model from the list
    const model = 'qwen3:14b'; // Using a model we know exists
    
    console.log(`Testing chat with ${model} and MCP tools...`);
    
    // Make a chat request with Oura MCP tool enabled
    const response = await client.chat({
      model,
      messages: [
        { role: 'system', content: 'You are an assistant with access to health data. Use tools when appropriate.' },
        { role: 'user', content: 'How was my sleep last night? Use the MCP tool to check my sleep data.' }
      ],
      enabledMcpTools: ['mcp_oura_get_sleep_data'],
      temperature: 0.3, // Lower temperature to encourage tool use
      timeout: 60000 // 60 seconds timeout
    });
    
    console.log('\n\n===== RESPONSE =====');
    console.log(JSON.stringify(response, null, 2));
    
    // Check if tool was called
    if (response.message && response.message.tool_calls && response.message.tool_calls.length > 0) {
      console.log('\n✅ MCP tool call was successfully made!');
      console.log(`Tool: ${response.message.tool_calls[0].name}`);
    } else {
      console.log('\n❌ No MCP tool calls were made in the response.');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testMcpIntegration();

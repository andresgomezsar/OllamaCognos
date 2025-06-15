// Test script to verify Ollama connection through ngrok
require('dotenv').config(); // Load environment variables from .env file

async function testOllamaConnection() {
  console.log("Testing connection to Ollama...");
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  console.log(`Using Ollama URL: ${ollamaUrl}\n`);
  
  try {
    // Test the connection directly
    console.log("Testing basic connectivity...");
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Connection successful!\n");
    
    if (data.models && data.models.length > 0) {
      console.log("Available models:");
      data.models.forEach(model => {
        console.log(`- ${model.name} (${formatSize(model.size)})`); 
      });
      
      // Test a simple chat message with the first available model
      const modelName = data.models[0].name;
      console.log(`\nTesting chat with model: ${modelName}...`);
      
      const chatResponse = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say hello and tell me what model you are.' }
          ],
          stream: false
        }),
      });
      
      if (!chatResponse.ok) {
        throw new Error(`Ollama chat API error: ${chatResponse.status} ${chatResponse.statusText}`);
      }
      
      const chatData = await chatResponse.json();
      console.log("\nChat response:");
      console.log(chatData.message?.content || 'No content in response');
    } else {
      console.log("\nNo models found. You may need to pull a model first.");
    }
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    process.exit(1);
  }
}

// Helper function to format file sizes
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Run the test
testOllamaConnection();

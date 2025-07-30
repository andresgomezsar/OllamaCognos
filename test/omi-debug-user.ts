/**
 * Omi User ID Debug Tool
 * 
 * This tool helps identify the correct user ID and debug API responses
 */

import { createOmiMcpServer } from '../server/mcp/omi/omiMcpServer.js';

async function debugOmiUser() {
  console.log('🔍 Omi User ID Debug Tool');
  
  // Check for API key
  const apiKey = process.env.OMI_API_KEY;
  if (!apiKey) {
    console.error('❌ OMI_API_KEY environment variable not set');
    return;
  }

  try {
    const omiServer = createOmiMcpServer(apiKey);
    
    console.log('\n🧪 Testing different user ID approaches...\n');

    // Test 1: No user ID (see what the API returns)
    console.log('1️⃣ Testing without userId parameter:');
    try {
      const memories = await omiServer.executeToolCall({
        name: 'get_memories',
        parameters: {
          limit: 1
        }
      });
      console.log('   Response:', JSON.stringify(memories, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.log('   Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 2: Empty string user ID
    console.log('\n2️⃣ Testing with empty userId:');
    try {
      const memories = await omiServer.executeToolCall({
        name: 'get_memories',
        parameters: {
          userId: '',
          limit: 1
        }
      });
      console.log('   Response:', JSON.stringify(memories, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.log('   Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 3: "me" as user ID (common pattern)
    console.log('\n3️⃣ Testing with userId "me":');
    try {
      const memories = await omiServer.executeToolCall({
        name: 'get_memories',
        parameters: {
          userId: 'me',
          limit: 1
        }
      });
      console.log('   Response:', JSON.stringify(memories, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.log('   Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 4: "default" as user ID
    console.log('\n4️⃣ Testing with userId "default":');
    try {
      const memories = await omiServer.executeToolCall({
        name: 'get_memories',
        parameters: {
          userId: 'default',
          limit: 1
        }
      });
      console.log('   Response:', JSON.stringify(memories, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.log('   Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 5: Test conversations to see if they have different behavior
    console.log('\n5️⃣ Testing conversations without userId:');
    try {
      const conversations = await omiServer.executeToolCall({
        name: 'get_conversations',
        parameters: {
          limit: 1
        }
      });
      console.log('   Response:', JSON.stringify(conversations, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.log('   Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 6: Test conversations with "me" userId
    console.log('\n6️⃣ Testing conversations with userId "me":');
    try {
      const conversations = await omiServer.executeToolCall({
        name: 'get_conversations',
        parameters: {
          userId: 'me',
          limit: 1
        }
      });
      console.log('   Response:', JSON.stringify(conversations, null, 2).substring(0, 200) + '...');
    } catch (error) {
      console.log('   Error:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n💡 Tips:');
    console.log('   - Check if any of the above returned actual data');
    console.log('   - Look for error messages that might indicate the correct user format');
    console.log('   - If you have access to Omi web interface, check your user profile for user ID');
    console.log('   - The API key might be scoped to a specific user already');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run debug if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugOmiUser().catch(console.error);
}

export { debugOmiUser };
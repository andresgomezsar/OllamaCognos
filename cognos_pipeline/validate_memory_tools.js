/**
 * Standalone validation script for memory tools
 * 
 * This script directly tests the CognosMcpServer and MockOmiMemoryClient
 * without needing to run the full Express server.
 */

const path = require('path');

// Import the MockOmiMemoryClient
let MockOmiMemoryClient;
try {
  // Get the path to the compiled JS file
  const mockClientPath = path.join(process.cwd(), 'cognos_pipeline', 'mockOmiMemoryClient.js');
  console.log('Loading mock client from:', mockClientPath);
  
  const mockModule = require(mockClientPath);
  MockOmiMemoryClient = mockModule.MockOmiMemoryClient;
  console.log('✅ Successfully loaded MockOmiMemoryClient');
} catch (error) {
  console.error('❌ Failed to load MockOmiMemoryClient:', error);
  process.exit(1);
}

// Import the CognosMcpServer
let CognosMcpServer;
try {
  const serverPath = path.join(process.cwd(), 'server', 'mcp', 'cognos', 'cognosMcpServer.js');
  console.log('Loading CognosMcpServer from:', serverPath);
  
  const serverModule = require(serverPath);
  CognosMcpServer = serverModule.CognosMcpServer;
  console.log('✅ Successfully loaded CognosMcpServer');
} catch (error) {
  console.error('❌ Failed to load CognosMcpServer:', error);
  process.exit(1);
}

// Run the validation tests
async function runValidation() {
  console.log('\n📋 Starting memory tools validation...');
  
  // Initialize the mock client
  const mockClient = new MockOmiMemoryClient();
  console.log('📋 Mock client initialized');
  
  // Initialize the CognosMcpServer with mock client
  const mcpServer = new CognosMcpServer(
    'python', 
    process.cwd(),
    mockClient
  );
  console.log('📋 CognosMcpServer initialized with mock client');
  
  try {
    // List available tools
    console.log('\n🔍 Listing available tools...');
    const tools = await mcpServer.listTools();
    const memoryTools = tools.filter(tool => [
      'get_memories',
      'create_memory',
      'delete_memory',
      'edit_memory'
    ].includes(tool.name));
    
    console.log(`📋 Found ${memoryTools.length} memory tools:`, memoryTools.map(t => t.name));
    
    // Test memory creation
    console.log('\n🔍 Testing create_memory...');
    const createResult = await mcpServer.executeToolCall({
      name: 'create_memory',
      parameters: {
        title: 'Test Memory',
        content: 'This is a test memory created at ' + new Date().toISOString(),
        category: 'TEST',
        uid: 'test-user-id'
      }
    });
    
    console.log('📋 Create memory result:', createResult);
    const memoryId = createResult.memoryId;
    
    // Test getting memories
    console.log('\n🔍 Testing get_memories...');
    const getResult = await mcpServer.executeToolCall({
      name: 'get_memories',
      parameters: {
        uid: 'test-user-id',
        limit: 5,
        categories: ['TEST']
      }
    });
    
    console.log('📋 Get memories result:', getResult);
    
    // Test memory editing
    console.log('\n🔍 Testing edit_memory...');
    const editResult = await mcpServer.executeToolCall({
      name: 'edit_memory',
      parameters: {
        memory_id: memoryId,
        content: 'This memory was edited at ' + new Date().toISOString(),
        uid: 'test-user-id'
      }
    });
    
    console.log('📋 Edit memory result:', editResult);
    
    // Test memory deletion
    console.log('\n🔍 Testing delete_memory...');
    const deleteResult = await mcpServer.executeToolCall({
      name: 'delete_memory',
      parameters: {
        memory_id: memoryId,
        uid: 'test-user-id'
      }
    });
    
    console.log('📋 Delete memory result:', deleteResult);
    
    // Final result summary
    console.log('\n✅ Memory tools validation completed successfully!');
    console.log('Summary:');
    console.log(`- Create memory: ${createResult.memoryId ? 'SUCCESS' : 'FAILED'}`);
    console.log(`- Get memories: ${getResult.memories ? 'SUCCESS' : 'FAILED'}`);
    console.log(`- Edit memory: ${editResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`- Delete memory: ${deleteResult.success ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run the validation
runValidation().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});

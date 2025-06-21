/**
 * Manual MCP Integration Test
 * Simple script to test the enhanced tool selection logic
 */

import { mcpRoutingService } from '../mcp/mcpRouter.js';

// Test scenarios for different tool categories
const testScenarios = [
  {
    name: 'Health query',
    message: 'How was my sleep quality last night?',
    expectedCategory: 'health'
  },
  {
    name: 'Web search query',
    message: 'What is the capital of France?',
    expectedCategory: 'search'
  },
  {
    name: 'Memory query',
    message: 'Remember what I told you earlier about my workout routine',
    expectedCategory: 'memory'
  },
  {
    name: 'Basic greeting (no tools)',
    message: 'Hello there!',
    expectedCategory: 'none'
  }
];

// Run all scenarios
async function runTests() {
  console.log('===== MCP ENHANCED TOOL SELECTION TEST =====\n');
  
  for (const scenario of testScenarios) {
    console.log(`\nTesting: ${scenario.name}`);
    console.log(`User message: "${scenario.message}"`);
    
    try {
      // Call the routing service
      const result = await mcpRoutingService.routeRequest({
        userMessage: scenario.message,
        userId: 'test123',
        conversationContext: []
      });
      
      // Display results
      console.log('Enabled tools:', result.enabledTools);
      console.log('Routing decision:', result.routingDecision);
      
      // Determine if the test passed based on enabled tools
      let detectedCategory = 'none';
      if (result.enabledTools.some(tool => tool.startsWith('oura/'))) {
        detectedCategory = 'health';
      } else if (result.enabledTools.some(tool => tool.startsWith('search/'))) {
        detectedCategory = 'search';
      } else if (result.enabledTools.some(tool => tool.startsWith('memory/'))) {
        detectedCategory = 'memory';
      }
      
      const passed = detectedCategory === scenario.expectedCategory;
      console.log(`Test ${passed ? 'PASSED ✅' : 'FAILED ❌'} - Expected: ${scenario.expectedCategory}, Got: ${detectedCategory}`);
    } catch (error) {
      console.error(`Error testing scenario "${scenario.name}":`, error);
    }
  }
  
  console.log('\n===== TEST SUMMARY =====');
  console.log(`Total scenarios: ${testScenarios.length}`);
}

// Execute the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});

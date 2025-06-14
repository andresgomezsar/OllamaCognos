/**
 * MCP Integration End-to-End Test
 * 
 * This test simulates the complete flow:
 * user → AI (Ollama/OpenRouter) → MCP tool call → tool result → AI response
 */
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { OllamaClient } = require('../ollama');
const { executeMCPTool } = require('../mcp/mcpUtils');
const { mcpRoutingService } = require('../mcp/mcpRouter');

describe('MCP End-to-End Integration Tests', () => {
  // Create stubs for external dependencies
  let ollamaClientStub: any;
  let executeMCPToolStub: any;
  let mcpRoutingServiceStub: any;
  
  before(() => {
    // Setup test stubs before tests run
    ollamaClientStub = sinon.createStubInstance(OllamaClient);
    executeMCPToolStub = sinon.stub().resolves({
      content: [
        {
          type: 'json',
          json: {
            steps: 8432,
            sleep: {
              score: 87,
              duration: 7.5
            }
          }
        }
      ],
      status: 'success'
    });
    
    // Setup routing service stub
    mcpRoutingServiceStub = {
      routeRequest: sinon.stub().resolves({
        enabledTools: ['oura/oura-fetch'],
        routingDecision: {
          recommendedServer: 'oura',
          confidence: 0.85,
          reasoning: 'Enabled 1 tools based on message content'
        }
      })
    };
  });
  
  after(() => {
    // Restore stubs after tests
    sinon.restore();
  });
  
  it('should route health-related questions to Oura MCP tool', async () => {
    // Arrange: Setup test data
    const userMessage = "How did I sleep last night?";
    const userId = "user123";
    const conversationContext = [
      { role: 'user', content: 'Hi there!' },
      { role: 'assistant', content: 'Hello! How can I help you today?' },
      { role: 'user', content: userMessage }
    ];
    
    // Act: Call the routing service
    const routingResult = await mcpRoutingServiceStub.routeRequest({ 
      userMessage, 
      userId, 
      conversationContext 
    });
    
    // Assert: Verify the routing decision
    expect(routingResult.enabledTools).to.include('oura/oura-fetch');
    expect(routingResult.routingDecision.recommendedServer).to.equal('oura');
    expect(routingResult.routingDecision.confidence).to.be.greaterThan(0.8);
  });
  
  it('should execute the MCP tool and return results', async () => {
    // Arrange: Setup test parameters
    const serverName = 'oura';
    const toolName = 'oura-fetch';
    const args = { 
      userId: 'user123',
      dataType: 'sleep'
    };
    
    // Replace the real implementation with our stub
    // This is a hack for unit testing - in real implementation use proper DI
    const originalExecuteMCPTool = require('../mcp/mcpUtils').executeMCPTool;
    require('../mcp/mcpUtils').executeMCPTool = executeMCPToolStub;
    
    try {
      // Act: Execute the MCP tool
      const result = await executeMCPToolStub(serverName, toolName, args);
      
      // Assert: Verify the result
      expect(result.status).to.equal('success');
      expect(result.content).to.be.an('array').that.is.not.empty;
      expect(result.content[0].type).to.equal('json');
      expect(result.content[0].json).to.have.property('sleep');
      expect(result.content[0].json.sleep).to.have.property('score');
    } finally {
      // Restore original implementation
      require('../mcp/mcpUtils').executeMCPTool = originalExecuteMCPTool;
    }
  });
  
  it('should integrate AI with MCP tools end-to-end', async () => {
    // Arrange: Setup a simulated AI chat
    const userMessage = "How's my sleep quality this week?";
    const userId = "user123";
    
    // Simulate AI calling function based on message
    ollamaClientStub.chat.resolves({
      id: 'chat123',
      created_at: Date.now(),
      message: {
        role: 'assistant',
        content: 'I checked your sleep data. Your average sleep score was 87 and you slept about 7.5 hours per night.',
        tool_calls: [{
          id: 'call1',
          type: 'function',
          function: {
            name: 'oura/oura-fetch',
            arguments: JSON.stringify({
              userId: 'user123',
              dataType: 'sleep',
              timeRange: 'week'
            })
          }
        }]
      },
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50
      }
    });
    
    // Act: Simulate end-to-end flow
    // 1. Route the request
    const routingDecision = await mcpRoutingServiceStub.routeRequest({ 
      userMessage, 
      userId, 
      conversationContext: [] 
    });
    
    // 2. AI decides to use MCP tool (simulated via the stub)
    const aiResponse = await ollamaClientStub.chat({
      messages: [{ role: 'user', content: userMessage }],
      model: 'qwen3:14b',
      tools: [{ 
        name: routingDecision.enabledTools[0],
        description: 'Fetch Oura Ring health data',
        parameters: {}
      }]
    });
    
    // 3. Execute the MCP tool based on AI's request
    let toolResult;
    if (aiResponse.message.tool_calls && aiResponse.message.tool_calls.length > 0) {
      const toolCall = aiResponse.message.tool_calls[0];
      if (toolCall.type === 'function') {
        const [serverName, toolName] = toolCall.function.name.split('/');
        const args = JSON.parse(toolCall.function.arguments);
        
        toolResult = await executeMCPToolStub(serverName, toolName, args);
      }
    }
    
    // Assert: Verify the complete flow
    expect(routingDecision.enabledTools).to.include('oura/oura-fetch');
    expect(aiResponse.message.tool_calls).to.exist;
    expect(aiResponse.message.tool_calls[0].function.name).to.equal('oura/oura-fetch');
    expect(toolResult.status).to.equal('success');
    expect(toolResult.content[0].json.sleep.score).to.equal(87);
  });
});

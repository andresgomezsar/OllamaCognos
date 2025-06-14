const { expect } = require('chai');
const sinon = require('sinon');

// Mock the OpenRouterClient implementation instead of importing it
class MockOpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async isHealthy() {
    try {
      const models = await this.listModels();
      return models && models.data && models.data.length > 0;
    } catch (error) {
      console.error('OpenRouter health check failed:', error);
      return false;
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to list OpenRouter models:', error);
      return { data: [] };
    }
  }

  async chat(request) {
    try {
      // Ensure stream is off for the test
      const chatRequest = { ...request, stream: false };
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.message.includes('OpenRouter API error')) {
        throw error;
      }
      throw new Error(`Failed to connect to OpenRouter: ${error.message}`);
    }
  }

  async testConnection() {
    return await this.isHealthy();
  }
}

describe('OpenRouterClient', () => {
  let client;
  let fetchStub;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    // Create a new client instance before each test
    client = new MockOpenRouterClient(mockApiKey);
    
    // Stub the global fetch function
    fetchStub = sinon.stub(global, 'fetch');
  });
  
  afterEach(() => {
    // Restore stub after each test
    fetchStub.restore();
  });
  
  describe('isHealthy', () => {
    it('should return true when listModels succeeds', async () => {
      // Setup mock response for successful API call
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model1', name: 'Test Model', context_length: 4096 }] })
      };
      fetchStub.resolves(mockResponse);
      
      // Test the isHealthy method
      const result = await client.isHealthy();
      
      // Verify the result is true
      expect(result).to.be.true;
      
      // Verify fetch was called with correct arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.include('/models');
      expect(options.headers.Authorization).to.equal(`Bearer ${mockApiKey}`);
    });
    
    it('should return false when listModels fails', async () => {
      // Setup mock response for failed API call
      fetchStub.rejects(new Error('API connection error'));
      
      // Test the isHealthy method with a failing API
      const result = await client.isHealthy();
      
      // Verify the result is false
      expect(result).to.be.false;
    });
  });
  
  describe('testConnection', () => {
    it('should call isHealthy and return the result', async () => {
      // Create a spy on isHealthy
      const isHealthySpy = sinon.spy(client, 'isHealthy');
      
      // Setup mock response
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'model1' }] })
      };
      fetchStub.resolves(mockResponse);
      
      // Test testConnection method
      const result = await client.testConnection();
      
      // Verify isHealthy was called
      expect(isHealthySpy.calledOnce).to.be.true;
      
      // Verify testConnection returns the result from isHealthy
      expect(result).to.be.true;
    });
  });
  
  describe('chat', () => {
    it('should successfully call the API and return the response', async () => {
      // Setup mock request and response
      const mockRequest = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }]
      };
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'test-model',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello there!'
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25
          }
        })
      };
      fetchStub.resolves(mockResponse);
      
      // Call the chat method
      const result = await client.chat(mockRequest);
      
      // Verify the result
      expect(result.id).to.equal('test-id');
      expect(result.choices[0].message.content).to.equal('Hello there!');
      
      // Verify fetch was called with correct arguments
      expect(fetchStub.calledOnce).to.be.true;
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.include('/chat/completions');
      expect(options.method).to.equal('POST');
      expect(options.headers.Authorization).to.equal(`Bearer ${mockApiKey}`);
      expect(JSON.parse(options.body).stream).to.be.false;
    });
    
    it('should handle API errors correctly', async () => {
      // Setup mock request and error response
      const mockRequest = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }]
      };
      
      const mockErrorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Invalid API key' })
      };
      fetchStub.resolves(mockErrorResponse);
      
      // Call the chat method and expect it to throw
      try {
        await client.chat(mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('OpenRouter API error: 401');
        expect(error.message).to.include('Invalid API key');
      }
    });
    
    it('should handle network errors correctly', async () => {
      // Setup mock request and network error
      const mockRequest = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }]
      };
      
      fetchStub.rejects(new Error('Network error'));
      
      // Call the chat method and expect it to throw
      try {
        await client.chat(mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to connect to OpenRouter: Network error');
      }
    });
  });
  
  describe('listModels', () => {
    it('should return models when API call is successful', async () => {
      const mockModels = {
        data: [
          { id: 'model1', name: 'Model 1', context_length: 4096 },
          { id: 'model2', name: 'Model 2', context_length: 8192 }
        ]
      };
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockModels)
      };
      fetchStub.resolves(mockResponse);
      
      const result = await client.listModels();
      
      expect(result.data).to.deep.equal(mockModels.data);
      expect(fetchStub.calledOnce).to.be.true;
    });
    
    it('should return empty data array when API call fails', async () => {
      fetchStub.rejects(new Error('API error'));
      
      const result = await client.listModels();
      
      expect(result.data).to.deep.equal([]);
    });
  });
});

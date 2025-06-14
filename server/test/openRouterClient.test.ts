const { expect } = require('chai');
const sinon = require('sinon');
const { OpenRouterClient } = require('../openrouter');

describe('OpenRouterClient', () => {
  let client: any;
  let fetchStub: any;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    // Create a new client instance before each test
    client = new OpenRouterClient(mockApiKey);
    
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
      fetchStub.resolves(mockResponse as Response);
      
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
      fetchStub.resolves(mockResponse as Response);
      
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
      expect(JSON.parse(options.body as string).stream).to.be.false;
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
      fetchStub.resolves(mockErrorResponse as Response);
      
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
      fetchStub.resolves(mockResponse as Response);
      
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

import { WebSocketServer, WebSocket } from "ws";
import express, { Request, Response } from 'express';
import http from 'http';
import axios from 'axios';

import { OllamaClient } from './ollama.js';
import { OuraClient } from './oura.js';
import { PerplexityClient } from './perplexity.js';
import { OpenRouterClient } from './openrouter.js';
import { GroqClient } from './groq.js';

// Import MCP system directly from mcpRouter.ts to avoid any reexport issues
import { mcpRouter, mcpRoutingService, initMcpServers } from './mcp/mcpRouter.js';

// Define the initialization function locally to avoid import issues
function initializeMcpSystem() {
  console.log('Initializing MCP system...');
  initMcpServers();
}

// Schema imports
import { 
  chatCompletionSchema, 
  healthQuerySchema,
  insertConversationSchema,
  configurationSchema,
  configurationUpdateSchema,
  configurationBulkUpdateSchema
} from "../shared/schema.js";

// Storage, auth, and utilities
import { storage } from "./storage.js";
import { isAuthenticated } from "./auth.js";
import { ngrokService } from "./ngrok.js";
// Use direct import with relative path
import { executeMCPTool } from "./mcp/mcpUtils.js";
import { createOllamaClient, createOpenRouterClient, listMCPTools } from "./clients/clientUtils.js";
import { LimitlessClient } from "./limitless.js";
import { omiWebhookRouter } from "./routes/omi-webhooks.js";
import { omiImportRouter } from "./routes/omi-import.js";

export function registerRoutes(app: express.Application) {
  const server = http.createServer(app);
  // Create HTTP server instead of Socket.IO (we're using WebSockets)
  
  // Initialize the MCP system
  initializeMcpSystem();
  
  // Register MCP routes
  app.use('/api/mcp', mcpRouter);
  
  // Register Omi webhook routes
  app.use('/api/omi/webhook', omiWebhookRouter);
  
  // Register Omi import routes
  app.use('/api/omi/import', omiImportRouter);
  
  // Configuration Management Endpoints
  app.get('/api/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const configs = await storage.getAllConfiguration(category);
      
      // Remove sensitive data if not admin
      // For now, assume everyone is admin as we have just a single user
      // In a production environment, implement proper role-based checks here
      
      // Mask encrypted values in the response
      const safeConfigs = configs.map(config => ({
        ...config,
        value: config.encrypted ? '••••••••' : config.value
      }));
      
      res.json(safeConfigs);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  app.get('/api/config/:key', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const config = await storage.getConfiguration(key);
      
      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      // Mask encrypted values 
      const safeConfig = {
        ...config,
        value: config.encrypted ? '••••••••' : config.value
      };
      
      res.json(safeConfig);
    } catch (error) {
      console.error(`Error fetching configuration ${req.params.key}:`, error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  });

  app.put('/api/config/:key', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      // Debug logging
      console.log(`Processing update for config key: ${key}`);
      if (value && value.length > 0) {
        console.log(`Token length: ${value.length} characters`);
      }
      
      // Validate update request
      try {
        configurationUpdateSchema.parse({ key, value });
      } catch (validationError) {
        console.error(`Validation error for ${key}:`, validationError);
        return res.status(400).json({ error: 'Invalid configuration data', details: validationError });
      }
      
      // Check if config exists
      const existingConfig = await storage.getConfiguration(key);
      if (!existingConfig) {
        console.log(`Configuration ${key} not found, cannot update`);
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      // Update the config with detailed error handling
      try {
        const updated = await storage.updateConfiguration(key, value);
        console.log(`Successfully updated configuration for ${key}`);
        
        // Mask encrypted values in the response
        const safeConfig = {
          ...updated,
          value: updated?.encrypted ? '••••••••' : updated?.value
        };
        
        res.json(safeConfig);
      } catch (updateError) {
        console.error(`Database error updating configuration ${key}:`, updateError);
        
        // Provide more specific error information
        let errorMessage = 'Failed to update configuration';
        let statusCode = 500;
        
        // Check for common database errors
        if (updateError instanceof Error) {
          if (updateError.message.includes('value too long')) {
            errorMessage = 'Token value exceeds maximum allowed length';
            statusCode = 400;
          } else if (updateError.message.includes('constraint')) {
            errorMessage = 'Configuration update violated a database constraint';
            statusCode = 400;
          }
          
          res.status(statusCode).json({ 
            error: errorMessage,
            details: updateError.message
          });
        } else {
          res.status(500).json({ error: 'Unknown error updating configuration' });
        }
      }
    } catch (error) {
      console.error(`Error updating configuration ${req.params.key}:`, error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  app.post('/api/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const configData = req.body;
      
      // Validate new config
      try {
        configurationSchema.parse(configData);
      } catch (validationError) {
        return res.status(400).json({ error: 'Invalid configuration data', details: validationError });
      }
      
      // Check if config already exists
      const existingConfig = await storage.getConfiguration(configData.key);
      if (existingConfig) {
        return res.status(409).json({ error: 'Configuration already exists' });
      }
      
      // Create new config
      const created = await storage.setConfiguration(configData);
      
      // Mask encrypted values in the response
      const safeConfig = {
        ...created,
        value: created.encrypted ? '••••••••' : created.value
      };
      
      res.status(201).json(safeConfig);
    } catch (error) {
      console.error('Error creating configuration:', error);
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  });

  app.post('/api/config/bulk', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      // Validate bulk update request
      try {
        configurationBulkUpdateSchema.parse(updates);
      } catch (validationError) {
        return res.status(400).json({ error: 'Invalid bulk update data', details: validationError });
      }
      
      const results = [];
      
      // Process each update
      for (const update of updates) {
        const { key, value } = update;
        
        // Check if config exists
        const existingConfig = await storage.getConfiguration(key);
        if (!existingConfig) {
          results.push({ key, success: false, error: 'Configuration not found' });
          continue;
        }
        
        // Update the config
        try {
          await storage.updateConfiguration(key, value);
          results.push({ key, success: true });
        } catch (error) {
          results.push({ key, success: false, error: 'Update failed' });
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error('Error in bulk configuration update:', error);
      res.status(500).json({ error: 'Failed to process bulk update' });
    }
  });
  
  app.delete('/api/config/:key', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      // Check if config exists
      const existingConfig = await storage.getConfiguration(key);
      if (!existingConfig) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      // Delete the config
      const success = await storage.deleteConfiguration(key);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: 'Failed to delete configuration' });
      }
    } catch (error) {
      console.error(`Error deleting configuration ${req.params.key}:`, error);
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  });
  
  // Test endpoint for configuration
  app.post('/api/config/test/:key', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const config = await storage.getConfiguration(key);
      
      if (!config || !config.value) {
        return res.status(404).json({ error: 'Configuration not found or empty' });
      }
      
      // Perform test based on configuration type
      switch (config.key) {
        case 'OURA_TOKEN':
          try {
            const ouraClient = new OuraClient(config.value);
            const testResult = await ouraClient.testConnection();
            res.json({ success: true, message: 'Oura connection successful', details: testResult });
          } catch (error) {
            console.error('Oura connection test failed:', error);
            res.status(400).json({ success: false, message: 'Oura connection failed', error: String(error) });
          }
          break;
        
        case 'OLLAMA_ENDPOINT':
          try {
            const ollamaClient = new OllamaClient(config.value);
            const testResult = await ollamaClient.testConnection();
            res.json({ success: true, message: 'Ollama connection successful', details: testResult });
          } catch (error) {
            console.error('Ollama connection test failed:', error);
            res.status(400).json({ success: false, message: 'Ollama connection failed', error: String(error) });
          }
          break;
          
        case 'LIMITLESS_API_TOKEN':
          try {
            const limitlessClient = new LimitlessClient(config.value);
            const testResult = await limitlessClient.testConnection();
            res.json({ success: true, message: 'Limitless API connection successful', details: testResult });
          } catch (error) {
            console.error('Limitless API connection test failed:', error);
            res.status(400).json({ success: false, message: 'Limitless API connection failed', error: String(error) });
          }
          break;
        
        case 'PERPLEXITY_API_TOKEN':
          try {
            const perplexityClient = new PerplexityClient(config.value);
            // Since PerplexityClient might not have a testConnection method, we'll add a simple test
            const testResult = await axios.get('https://api.perplexity.ai/models', {
              headers: {
                'Authorization': `Bearer ${config.value}`,
                'Content-Type': 'application/json'
              }
            });
            res.json({ 
              success: true, 
              message: 'Perplexity API connection successful', 
              details: { models: testResult.data?.data || [] } 
            });
          } catch (error) {
            console.error('Perplexity API connection test failed:', error);
            res.status(400).json({ 
              success: false, 
              message: 'Perplexity API connection failed', 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
          break;
        
        case 'OPENROUTER_API_TOKEN':
          try {
            const openRouterClient = new OpenRouterClient(config.value);
            const testResult = await openRouterClient.isHealthy();
            if (testResult) {
              const models = await openRouterClient.listModels();
              res.json({ 
                success: true, 
                message: 'OpenRouter API connection successful', 
                details: { models: models.data || [] } 
              });
            } else {
              throw new Error('OpenRouter API health check failed');
            }
          } catch (error) {
            console.error('OpenRouter API connection test failed:', error);
            res.status(400).json({ 
              success: false, 
              message: 'OpenRouter API connection failed', 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
          break;
        
        case 'GROQ_API_TOKEN':
          try {
            const groqClient = new GroqClient(config.value);
            const testResult = await groqClient.testConnection();
            res.json({ 
              success: testResult.success, 
              message: testResult.message, 
              details: { models: testResult.models || [] } 
            });
          } catch (error) {
            console.error('Groq API connection test failed:', error);
            res.status(400).json({ 
              success: false, 
              message: 'Groq API connection failed', 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
          break;

        // Add test cases for other API tokens and endpoints as needed
        default:
          res.status(400).json({ success: false, message: `No test implemented for ${config.key}` });
      }
    } catch (error) {
      console.error(`Error testing configuration ${req.params.key}:`, error);
      res.status(500).json({ error: 'Failed to test configuration' });
    }
  });

  // WebSocket server for real-time chat
  console.log('Setting up WebSocket server at path /ws');
  
  // Add pre-upgrade handler for debugging
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    console.log(`[Debug] WebSocket upgrade request: ${request.url}`);
    console.log(`[Debug] WebSocket pathname: ${pathname}`);
    console.log(`[Debug] WebSocket query params: ${new URL(request.url || '', `http://${request.headers.host}`).search}`);
    
    // Let normal handling continue
  });
  
  // Create WebSocket server with more detailed error handling
  const wss = new WebSocketServer({ 
    server: server, 
    path: '/ws',
    verifyClient: (info, cb) => {
      const token = new URL(info.req.url || '', `http://${info.req.headers.host}`).searchParams.get('token');
      console.log(`[Debug] WebSocket verifyClient called, token: ${token ? 'present' : 'missing'}`);
      
      // DEVELOPMENT MODE: Accept any connection in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Debug] Development mode - accepting WebSocket connection regardless of token');
        cb(true);
        return;
      }
      
      // In production, validate token here
      if (!token) {
        console.log('[Debug] WebSocket connection rejected: no token');
        cb(false, 401, 'Unauthorized: Missing authentication token');
        return;
      }
      
      // Accept the connection
      cb(true);
    }
  });

  // Store active WebSocket connections with their user ID
  const connections = new Map<string, { ws: WebSocket, userId: number }>();
  
  // Parse token from query params for WebSocket
  function parseToken(req: http.IncomingMessage): string | null {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    console.log(`[Debug] parseToken called, token: ${token ? 'present' : 'missing'}`);
    return token;
  }
  
  // Verify token and get user ID (simplified for development)
  async function getUserIdFromToken(token: string | null): Promise<number | null> {
    console.log(`[Debug] getUserIdFromToken called, token: ${token ? 'present' : 'missing'}`);
    
    if (!token) {
      console.log('[Debug] No token provided, returning null');
      return null;
    }
    
    try {
      // In a real production app, verify JWT or session token here
      // For now, we'll use a simplified approach for development
      
      // TODO: Replace with actual token verification
      // This is just a placeholder that assumes token is valid
      console.log('[Debug] Development mode - returning default user ID 1');
      return 1; // Default to user ID 1 for development
    } catch (error) {
      console.error('[Debug] Error verifying token:', error);
      return null;
    }
  }

  wss.on('connection', async (ws, req) => {
    // Extract token and get user ID
    const token = parseToken(req);
    const userId = await getUserIdFromToken(token) || 1; // Fall back to user ID 1 for development
    
    const connectionId = Math.random().toString(36).substring(7);
    connections.set(connectionId, { ws, userId });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          // Handle real-time chat messages
          await handleChatMessage(message, ws);
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      connections.delete(connectionId);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      connectionId
    }));
  });

  async function handleChatMessage(message: any, ws: WebSocket) {
    try {
      const { conversationId, content } = message;
      
      // Find the connection info to get the authenticated user ID
      const connectionEntry = Array.from(connections.entries())
        .find(([_, connInfo]) => connInfo.ws === ws);
      
      // Get the user ID from the connection, or default to user 1 for development
      const userId = connectionEntry ? connectionEntry[1].userId : 1;
      
      // Get user settings
      const settings = await storage.getSettings(userId);
      if (!settings) {
        throw new Error('User settings not found');
      }

      // Create or get conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
      } else {
        conversation = await storage.createConversation({
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          userId
        });
      }

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Store user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: 'user',
        content,
        metadata: null
      });

      // Send typing indicator
      ws.send(JSON.stringify({
        type: 'typing',
        conversationId: conversation.id
      }));

      // Get conversation history
      const messages = await storage.getMessagesByConversation(conversation.id);
      
      // Prepare messages for Ollama
      const ollamaMessages = messages.slice(-10).map(msg => {
        // Explicitly convert any content type to string to satisfy TypeScript
        const contentStr: string = 
          msg.content === null || msg.content === undefined ? '' :
          typeof msg.content === 'string' ? msg.content : 
          String(msg.content);
          
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: contentStr
        };
      });

      // Use intelligent MCP router to determine which tools to use
      const routingDecision = await mcpRoutingService.routeRequest({
        userMessage: content,
        userId: String(userId), // Convert number userId to string to match expected type
        conversationContext: ollamaMessages
        // Note: enabledTools is handled internally by determineEnabledTools method
      });

      console.log(`MCP Routing: ${routingDecision.routingDecision?.reasoning || 'No reasoning'} (confidence: ${routingDecision.routingDecision?.confidence || 0})`);
      
      let toolResults: any = {};
      let contextData = '';

      // Execute selected tools
      for (const toolName of routingDecision.enabledTools) {
        try {
          // Split toolName into serverName and actual toolName (format: server/tool-name)
          const [serverName, actualToolName] = toolName.split('/');
          if (!serverName || !actualToolName) {
            throw new Error(`Invalid tool format: ${toolName}. Expected format: server/tool-name`);
          }
          
          const result = await executeMCPTool(serverName, actualToolName, {
            userId,
            date: new Date().toISOString()
          });
          
          toolResults[toolName] = result;
          
          // Prepare context data from tool results
          if (result.content) {
            for (const item of result.content) {
              if (item.type === 'text') {
                contextData += item.text + '\n';
              } else if (item.type === 'json') {
                contextData += JSON.stringify(item.json, null, 2) + '\n';
              }
            }
          }
        } catch (error) {
          console.error(`Error executing MCP tool ${toolName}:`, error);
          toolResults[toolName] = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }

      // Add system prompt with context data
      const systemMessage = {
        role: 'system' as const,
        content: `You are Cognos, a personal AI assistant with access to health data and web search. You provide helpful, accurate responses with a focus on health insights when relevant. Be conversational and supportive.${contextData}`
      };

      // Get AI response from OpenRouter or Ollama
      let response;
      if (process.env.OPENROUTER_API_KEY) {
        // Simplified check since we don't have OpenRouterClient class yet
        const openRouterHealthy = !!process.env.OPENROUTER_API_KEY;
        if (openRouterHealthy) {
          const openRouterClient = createOpenRouterClient(process.env.OPENROUTER_API_KEY);
          const openRouterResponse = await openRouterClient.chat({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [systemMessage, ...ollamaMessages],
            temperature: 0.7
          });
          response = {
            message: openRouterResponse.choices[0].message
          };
        } else {
          // Fallback to Ollama
          const ollamaClient = createOllamaClient(settings.ollamaUrl);
          response = await ollamaClient.chat({
            model: settings.ollamaModel,
            messages: [systemMessage, ...ollamaMessages],
            temperature: 0.7
          });
        }
      } else {
        // Fallback to Ollama
        const ollamaClient = createOllamaClient(settings.ollamaUrl);
        response = await ollamaClient.chat({
          model: settings.ollamaModel,
          messages: [systemMessage, ...ollamaMessages],
          temperature: 0.7
        });
      }

      // Store AI response
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: response.message.content,
        metadata: Object.keys(toolResults).length > 0 ? { toolResults, tools: routingDecision.enabledTools } : null
      });

      // Send response back to client
      ws.send(JSON.stringify({
        type: 'message',
        conversationId: conversation.id,
        message: {
          id: aiMessage.id,
          role: 'assistant',
          content: response.message.content,
          metadata: aiMessage.metadata,
          createdAt: aiMessage.createdAt
        }
      }));

    } catch (error) {
      console.error('Chat error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to process message'
      }));
    }
  }

  // Health data endpoints
  app.get('/api/health', isAuthenticated, async (req, res) => {
    try {
      // Parse query parameters with proper type conversion
      const queryParams = {
        ...req.query,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };
      const query = healthQuerySchema.parse(queryParams);
      const userId = (req.user as any)?.id || 1;
      
      const filters: any = {
        limit: query.limit
      };
      
      if (query.dataType) filters.dataType = query.dataType;
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);

      const healthData = await storage.getHealthData(userId, filters);
      res.json(healthData);
    } catch (error) {
      res.status(400).json({ 
        error: 'Invalid query parameters',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Sync health data from Oura
  app.post('/api/health/sync', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      const result = await executeMCPTool('oura', 'sync-health-data', { userId });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Conversation management
  app.get('/api/conversations', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req, res) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation({
        ...data,
        userId: (req.user as any)?.id || 1
      });
      res.json(conversation);
    } catch (error) {
      res.status(400).json({
        error: 'Invalid conversation data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OpenAI-compatible chat completions endpoint
  app.post('/api/chat/completions', isAuthenticated, async (req, res) => {
    try {
      const data = chatCompletionSchema.parse(req.body);
      const userId = (req.user as any)?.id || 1;
      
      const settings = await storage.getSettings(userId);
      if (!settings) {
        return res.status(500).json({ error: 'User settings not found' });
      }

      // Check if request specifically wants Ollama or if it's an Ollama model
      const useOllama = req.headers['x-use-ollama'] === 'true' || 
                       data.model?.includes(':') || // Ollama models often have format "model:tag"
                       !process.env.OPENROUTER_API_KEY;

      if (useOllama && settings.ollamaUrl) {
        // Use Ollama
        const ollamaClient = createOllamaClient(settings.ollamaUrl);
        const response = await ollamaClient.chat({
          model: data.model || settings.ollamaModel,
          messages: data.messages,
          temperature: data.temperature,
          max_tokens: data.max_tokens
        });

        // Return in OpenAI-compatible format
        res.json({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: data.model || settings.ollamaModel,
          choices: [{
            index: 0,
            message: response.message,
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: response.prompt_eval_count || 0,
            completion_tokens: response.eval_count || 0,
            total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
          }
        });
      } else if (process.env.OPENROUTER_API_KEY) {
        // Use OpenRouter
        const openRouterClient = createOpenRouterClient(process.env.OPENROUTER_API_KEY);
        const response = await openRouterClient.chat({
          model: data.model || 'anthropic/claude-3.5-sonnet',
          messages: data.messages,
          temperature: data.temperature,
          max_tokens: data.max_tokens
        });

        res.json(response);
      } else {
        res.status(500).json({ error: 'No AI provider configured' });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Chat completion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MCP tools
  app.get('/api/mcp/tools', isAuthenticated, (req, res) => {
    res.json(listMCPTools());
  });

  app.post('/api/mcp/execute', isAuthenticated, async (req, res) => {
    try {
      const { tool, input } = req.body;
      const userId = (req.user as any)?.id || 1;
      
      // Parse tool string to get server and tool name (format: server/tool-name)
      const [serverName, toolName] = tool.split('/');
      if (!serverName || !toolName) {
        throw new Error('Invalid tool format. Expected format: server/tool-name');
      }
      
      const result = await executeMCPTool(serverName, toolName, { userId, ...input });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Tool execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update conversation title
  app.post('/api/conversations/:id', isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = (req.user as any)?.id || 1;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Update conversation title
      await storage.updateConversation(conversationId, { title });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test Ollama connection (proxy endpoint)
  app.post('/api/ollama/test-connection', isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }
      
      const ollamaClient = createOllamaClient(url);
      const isHealthy = await ollamaClient.isHealthy();
      
      if (!isHealthy) {
        return res.status(200).json({ 
          success: false, 
          message: `Cannot connect to Ollama at ${url}`
        });
      }
      
      // Get version info if possible
      try {
        const response = await fetch(`${url}/api/version`);
        if (!response.ok) {
          throw new Error(`Failed to get version, status: ${response.status}`);
        }
        const versionInfo = await response.json();
        return res.json({
          success: true,
          message: `Connected to Ollama ${versionInfo.version || 'server'}!`,
          version: versionInfo.version
        });
      } catch (e) {
        // If version check fails but health check passed, still return success
        return res.json({
          success: true,
          message: `Connected to Ollama server!`
        });
      }
    } catch (error) {
      console.error('Error testing Ollama connection:', error);
      return res.status(200).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to Ollama server'
      });
    }
  });

  // Get Ollama models
  app.get('/api/models', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      const settings = await storage.getSettings(userId);
      
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      const ollamaClient = createOllamaClient(settings.ollamaUrl);
      
      // Check if Ollama is accessible
      const isHealthy = await ollamaClient.isHealthy();
      
      if (!isHealthy) {
        return res.status(503).json({ 
          error: 'Ollama service unavailable', 
          message: 'Could not connect to Ollama. Make sure Ollama is running.', 
          currentModel: settings.ollamaModel 
        });
      }
      
      // Get models from Ollama
      const models = await ollamaClient.listModels();
      
      res.json({
        models: models.models,
        currentModel: settings.ollamaModel
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      const userSettings = await storage.getSettings(userId);
      
      if (!userSettings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      // Don't send sensitive data like tokens to the client
      const safeSettings = {
        ...userSettings,
        ouraToken: userSettings.ouraToken ? '********' : null
      };
      
      res.json(safeSettings);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      const updates = req.body;
      
      const settings = await storage.updateSettings(userId, updates);
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      // Don't return sensitive tokens
      const { ouraToken, ...safeSettings } = settings;
      res.json({
        ...safeSettings,
        hasOuraToken: !!ouraToken
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // System status
  app.get('/api/status', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      
      // Try to get settings from storage, or use default settings if not found
      let settings;
      try {
        settings = await storage.getSettings(userId);
      } catch (error) {
        console.log('Error getting settings, using defaults:', error);
        // Default settings as fallback
        settings = {
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'mistral:latest',
          enabledMcpTools: [],
        };
      }
      
      if (!settings) {
        // Still use default settings if not found
        settings = {
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'mistral:latest',
          enabledMcpTools: [],
        };
      }

      // Check OpenRouter status
      let openRouterHealthy = false;
      if (process.env.OPENROUTER_API_KEY) {
        try {
          // Simplified check since we don't have OpenRouterClient class yet
          openRouterHealthy = !!process.env.OPENROUTER_API_KEY;
        } catch {
          openRouterHealthy = false;
        }
      }

      // Check Ollama status (fallback)
      const ollamaClient = new OllamaClient(settings.ollamaUrl);
      const ollamaHealthy = await ollamaClient.isHealthy();

      // Check Oura status
      let ouraHealthy = false;
      if (process.env.OURA_TOKEN) {
        try {
          const ouraClient = new OuraClient(process.env.OURA_TOKEN);
          ouraHealthy = await ouraClient.isHealthy();
        } catch {
          ouraHealthy = false;
        }
      }

      // Check Perplexity API status
      let perplexityHealthy = false;
      if (process.env.PERPLEXITY_API_KEY) {
        try {
          // Simplified check since we don't have a PerplexityClient class yet
          perplexityHealthy = !!process.env.PERPLEXITY_API_KEY;
        } catch {
          perplexityHealthy = false;
        }
      }

      res.json({
        ai: {
          provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : 'ollama',
          status: process.env.OPENROUTER_API_KEY ? 
            (openRouterHealthy ? 'connected' : 'disconnected') :
            (ollamaHealthy ? 'connected' : 'disconnected'),
          model: process.env.OPENROUTER_API_KEY ? 'anthropic/claude-3.5-sonnet' : settings.ollamaModel
        },
        ollama: {
          status: ollamaHealthy ? 'connected' : 'disconnected',
          url: settings.ollamaUrl,
          model: settings.ollamaModel
        },
        oura: {
          status: ouraHealthy ? 'connected' : 'disconnected',
          configured: !!process.env.OURA_TOKEN
        },
        perplexity: {
          status: perplexityHealthy ? 'connected' : 'disconnected',
          configured: !!process.env.PERPLEXITY_API_KEY
        },
        mcpTools: settings.enabledMcpTools || [],
        ngrok: {
          isActive: ngrokService.isActive(),
          tunnelUrl: ngrokService.getTunnelUrl(),
          endpoints: ngrokService.getApiEndpoints()
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to check status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Ngrok tunnel management
  app.post('/api/ngrok/start', isAuthenticated, async (req, res) => {
    try {
      const { authtoken, region, subdomain } = req.body;
      const url = await ngrokService.startTunnel({
        port: 5000,
        authtoken,
        region,
        subdomain
      });
      res.json({
        success: true,
        tunnelUrl: url,
        endpoints: ngrokService.getApiEndpoints()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to start tunnel',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/ngrok/stop', isAuthenticated, async (req, res) => {
    try {
      await ngrokService.stopTunnel();
      res.json({ success: true, message: 'Tunnel stopped' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to stop tunnel',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/ngrok/status', isAuthenticated, async (req, res) => {
    try {
      const info = await ngrokService.getConnectionInfo();
      res.json({
        isActive: ngrokService.isActive(),
        tunnelUrl: ngrokService.getTunnelUrl(),
        endpoints: ngrokService.getApiEndpoints(),
        ...info
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get tunnel status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return server;
}

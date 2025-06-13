import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { createOllamaClient } from "./ollama";
import { createOpenRouterClient } from "./openrouter";
import { createOuraClient } from "./oura";
import { createPerplexityClient } from "./perplexity";
import { executeMCPTool, listMCPTools } from "./mcp";
import { mcpRouter } from "./mcpRouter";
import { ngrokService } from "./ngrok";
import { isAuthenticated } from "./auth";
import { 
  chatCompletionSchema, 
  healthQuerySchema,
  insertConversationSchema,
  insertMessageSchema,
  insertSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active WebSocket connections
  const connections = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(7);
    connections.set(connectionId, ws);

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
      // Since WebSocket doesn't have authentication context yet, use default user
      // In the future, this could be improved with a token-based system
      const userId = 1; // Default user ID
      
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
      const ollamaMessages = messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Use intelligent MCP router to determine which tools to use
      const routingDecision = await mcpRouter.routeRequest({
        userMessage: content,
        userId,
        conversationContext: ollamaMessages
      });

      console.log(`MCP Routing: ${routingDecision.reasoning} (confidence: ${routingDecision.confidence})`);
      
      let toolResults: any = {};
      let contextData = '';

      // Execute selected tools
      for (const toolName of routingDecision.tools) {
        try {
          const result = await executeMCPTool(toolName, { userId, query: content });
          toolResults[toolName] = result;
          
          if (!result.error && result.data) {
            contextData += `\n\n${toolName}: ${JSON.stringify(result.data)}`;
          }
        } catch (error) {
          console.error(`Tool ${toolName} failed:`, error);
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

      // Store AI response
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: response.message.content,
        metadata: Object.keys(toolResults).length > 0 ? { toolResults, tools: routingDecision.tools } : null
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
      const result = await executeMCPTool('oura-sync', { userId });
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
      const result = await executeMCPTool(tool, { userId, ...input });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Tool execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Settings management
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || 1;
      const settings = await storage.getSettings(userId);
      
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
          const openRouterClient = createOpenRouterClient(process.env.OPENROUTER_API_KEY);
          openRouterHealthy = await openRouterClient.isHealthy();
        } catch {
          openRouterHealthy = false;
        }
      }

      // Check Ollama status (fallback)
      const ollamaClient = createOllamaClient(settings.ollamaUrl);
      const ollamaHealthy = await ollamaClient.isHealthy();

      // Check Oura status
      let ouraHealthy = false;
      if (process.env.OURA_TOKEN) {
        try {
          const ouraClient = createOuraClient(process.env.OURA_TOKEN);
          ouraHealthy = await ouraClient.isHealthy();
        } catch {
          ouraHealthy = false;
        }
      }

      // Check Perplexity API status
      let perplexityHealthy = false;
      if (process.env.PERPLEXITY_API_KEY) {
        try {
          const perplexityClient = createPerplexityClient(process.env.PERPLEXITY_API_KEY);
          // Simple test to check if the API key works
          const testQuery = "hello";
          const searchTest = await perplexityClient.search(testQuery);
          perplexityHealthy = !searchTest.error;
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

  return httpServer;
}

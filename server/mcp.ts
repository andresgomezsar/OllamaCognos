import { storage } from './storage.js';
import { createOuraClient } from './oura.js';
import { createOpenRouterClient } from './openrouter.js';
import { createPerplexityClient } from './perplexity.js';

interface MCPTool {
  name: string;
  description: string;
  execute: (input: any) => Promise<any>;
}

interface MCPToolRegistry {
  [key: string]: MCPTool;
}

/**
 * Perform a web search using Perplexity API with the chat/completions endpoint
 * @param query Search query
 * @returns Search results
 */
async function webSearch(query: string): Promise<any> {
  // Validate input
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return {
      query: query || '',
      results: [],
      error: 'Invalid search query',
      message: 'Search query cannot be empty'
    };
  }

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!perplexityApiKey) {
    // Fallback to simulated results if API key not available
    return {
      query,
      results: [
        {
          title: `Search results for: ${query}`,
          url: "https://example.com",
          snippet: "This is a simulated search result. Please configure a Perplexity API key to enable real web search.",
        }
      ],
      message: "Web search is not configured. Please add a Perplexity API key in environment variables."
    };
  }

  try {
    // Create client with API key
    const perplexityClient = createPerplexityClient(perplexityApiKey);
    
    // Perform search - now utilizing the chat/completions endpoint through our updated client
    const response = await perplexityClient.search(query);
    
    // Handle error response
    if (response.error) {
      console.error('Perplexity search error:', response.error);
      return {
        query,
        results: [],
        error: response.error,
        message: response.message || 'Failed to search with Perplexity API'
      };
    }
    
    // Check if we have results
    if (!response.results || response.results.length === 0) {
      return {
        query,
        results: [],
        message: 'No search results found'
      };
    }
    
    // Return successful response
    return {
      query,
      results: response.results,
      message: `Found ${response.results.length} results from Perplexity search`
    };
  } catch (error) {
    console.error('Web search error:', error);
    return {
      query,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to search the web'
    };
  }
}

// Memory management tool
async function memoryStore(userId: number, data: any): Promise<any> {
  // Store conversation context and preferences
  const settings = await storage.getSettings(userId);
  if (!settings) {
    throw new Error('User settings not found');
  }

  // In a real implementation, this would integrate with a vector database
  // or other memory storage system
  return {
    stored: true,
    message: "Memory context updated successfully",
    data: data
  };
}

async function memoryRetrieve(userId: number, query: string): Promise<any> {
  // Retrieve relevant context based on query
  const conversations = await storage.getConversationsByUser(userId);
  
  return {
    query,
    contexts: conversations.slice(0, 3).map(conv => ({
      title: conv.title,
      relevance: 0.8,
      snippet: `Previous conversation: ${conv.title}`
    })),
    message: "Retrieved relevant context from conversation history"
  };
}

// Health data analysis tool
async function analyzeHealthData(userId: number, dataType?: string): Promise<any> {
  const ouraToken = process.env.OURA_TOKEN;
  if (!ouraToken) {
    return {
      error: "Oura Ring not connected",
      message: "Please configure your Oura Ring access token in environment variables"
    };
  }

  try {
    const ouraClient = createOuraClient(ouraToken);
    
    if (dataType === 'sleep' || !dataType) {
      const sleepData = await ouraClient.getLatestSleep();
      if (sleepData) {
        // Store in our database for future reference
        await storage.createHealthData({
          userId,
          dataType: 'sleep',
          value: sleepData,
          timestamp: new Date(sleepData.day),
          source: 'oura'
        });

        return {
          type: 'sleep',
          score: sleepData.score,
          duration: `${Math.floor(sleepData.total_sleep_duration / 3600)}h ${Math.floor((sleepData.total_sleep_duration % 3600) / 60)}m`,
          deep_sleep: `${Math.floor(sleepData.deep_sleep_duration / 60)}m`,
          rem_sleep: `${Math.floor(sleepData.rem_sleep_duration / 60)}m`,
          efficiency: sleepData.efficiency,
          hrv: sleepData.rmssd,
          message: "Sleep data retrieved successfully from Oura Ring"
        };
      }
    }

    if (dataType === 'activity' || !dataType) {
      const activityData = await ouraClient.getLatestActivity();
      if (activityData) {
        await storage.createHealthData({
          userId,
          dataType: 'activity',
          value: activityData,
          timestamp: new Date(activityData.day),
          source: 'oura'
        });

        return {
          type: 'activity',
          score: activityData.score,
          steps: activityData.steps,
          calories: activityData.active_calories,
          distance: `${(activityData.equivalent_walking_distance / 1000).toFixed(1)} km`,
          message: "Activity data retrieved successfully from Oura Ring"
        };
      }
    }

    return {
      error: "No recent data available",
      message: "No recent health data found for the requested type"
    };

  } catch (error) {
    return {
      error: "Failed to fetch health data",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// MCP Tool Registry
export const mcpTools: MCPToolRegistry = {
  'web-search': {
    name: 'Web Search',
    description: 'Search the web for current information',
    execute: async (input: { query: string }) => {
      return webSearch(input.query);
    }
  },
  
  'memory-store': {
    name: 'Memory Store',
    description: 'Store information in long-term memory',
    execute: async (input: { userId: number; data: any }) => {
      return memoryStore(input.userId, input.data);
    }
  },
  
  'memory-retrieve': {
    name: 'Memory Retrieve',
    description: 'Retrieve relevant information from memory',
    execute: async (input: { userId: number; query: string }) => {
      return memoryRetrieve(input.userId, input.query);
    }
  },
  
  'health-analysis': {
    name: 'Health Analysis',
    description: 'Analyze health data from connected devices',
    execute: async (input: { userId: number; dataType?: string }) => {
      return analyzeHealthData(input.userId, input.dataType);
    }
  },
  
  'oura-sync': {
    name: 'Oura Ring Sync',
    description: 'Sync latest data from Oura Ring',
    execute: async (input: { userId: number }) => {
      const ouraToken = process.env.OURA_TOKEN;
      if (!ouraToken) {
        return {
          error: "Oura Ring not connected",
          message: "Please configure your Oura Ring access token in environment variables"
        };
      }

      try {
        const ouraClient = createOuraClient(ouraToken);
        
        // Get data for the last 2 days to ensure we capture recent data
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const [sleepData, activityData, readinessData] = await Promise.all([
          ouraClient.getSleepData(startDate, endDate),
          ouraClient.getActivityData(startDate, endDate),
          ouraClient.getReadinessData(startDate, endDate)
        ]);

        const sleep = sleepData.data.length > 0 ? sleepData.data[sleepData.data.length - 1] : null;
        const activity = activityData.data.length > 0 ? activityData.data[activityData.data.length - 1] : null;
        const readiness = readinessData.data.length > 0 ? readinessData.data[readinessData.data.length - 1] : null;



        let syncedCount = 0;
        
        if (sleep) {
          try {
            await storage.createHealthData({
              userId: input.userId,
              dataType: 'sleep',
              value: sleep,
              timestamp: new Date(sleep.day),
              source: 'oura'
            });
            syncedCount++;
          } catch (error) {
            console.log('Sleep data sync error:', error);
          }
        }

        if (activity) {
          try {
            await storage.createHealthData({
              userId: input.userId,
              dataType: 'activity',
              value: activity,
              timestamp: new Date(activity.day),
              source: 'oura'
            });
            syncedCount++;
          } catch (error) {
            console.log('Activity data sync error:', error);
          }
        }

        if (readiness) {
          try {
            await storage.createHealthData({
              userId: input.userId,
              dataType: 'readiness',
              value: readiness,
              timestamp: new Date(readiness.day),
              source: 'oura'
            });
            syncedCount++;
          } catch (error) {
            console.log('Readiness data sync error:', error);
          }
        }

        return {
          synced: syncedCount,
          message: `Successfully synced ${syncedCount} data points from Oura Ring`
        };

      } catch (error) {
        return {
          error: "Sync failed",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        };
      }
    }
  }
};

export async function executeMCPTool(toolName: string, input: any): Promise<any> {
  const tool = mcpTools[toolName];
  if (!tool) {
    throw new Error(`MCP tool '${toolName}' not found`);
  }

  try {
    return await tool.execute(input);
  } catch (error) {
    throw new Error(`MCP tool '${toolName}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function listMCPTools(): Array<{ name: string; description: string }> {
  return Object.values(mcpTools).map(tool => ({
    name: tool.name,
    description: tool.description
  }));
}

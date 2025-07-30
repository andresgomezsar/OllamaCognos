#!/usr/bin/env node
/**
 * Standalone Omi MCP Server for Claude Integration
 * 
 * This script creates a standalone MCP server that Claude can connect to
 * via stdio following the MCP protocol specification.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Environment variables
const OMI_API_KEY = process.env.OMI_API_KEY;
const OMI_API_BASE_URL = process.env.OMI_API_BASE_URL || 'https://api.omi.me/v1/mcp/';

if (!OMI_API_KEY) {
  console.error('Error: OMI_API_KEY environment variable is required');
  process.exit(1);
}

// Omi API client functions
async function makeOmiRequest(endpoint, options = {}) {
  const { method = 'GET', params = {}, body, userId } = options;
  
  const headers = {
    'Authorization': `Bearer ${OMI_API_KEY}`,
    'Content-Type': 'application/json'
  };

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  const url = new URL(`${OMI_API_BASE_URL}${endpoint}`);
  
  if (userId) {
    url.searchParams.append('user_id', userId);
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });

  const requestOptions = {
    method,
    headers
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Omi API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Omi API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Tool definitions
const TOOLS = [
  {
    name: 'get_memories',
    description: 'Retrieve a list of memories from Omi. A memory is a known fact about the user across multiple domains.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID for fetching user-specific memories (optional)'
        },
        categories: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['core', 'hobbies', 'lifestyle', 'interests', 'habits', 'work', 'skills', 'learnings', 'other']
          },
          description: 'The categories of memories to filter by',
          default: []
        },
        limit: {
          type: 'integer',
          description: 'The number of memories to retrieve',
          default: 100,
          minimum: 1,
          maximum: 1000
        },
        offset: {
          type: 'integer',
          description: 'The offset of the memories to retrieve',
          default: 0,
          minimum: 0
        },
        start_date: {
          type: 'string',
          description: 'Filter memories after this date (YYYY-MM-DD format)'
        },
        end_date: {
          type: 'string',
          description: 'Filter memories before this date (YYYY-MM-DD format)'
        },
        search: {
          type: 'string',
          description: 'Search query to filter memories by content'
        }
      },
      required: []
    }
  },
  {
    name: 'create_memory',
    description: 'Create a new memory in Omi. A memory is a known fact about the user across multiple domains.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID for creating user-specific memory (optional)'
        },
        content: {
          type: 'string',
          description: 'The content of the memory'
        },
        category: {
          type: 'string',
          enum: ['core', 'hobbies', 'lifestyle', 'interests', 'habits', 'work', 'skills', 'learnings', 'other'],
          description: 'The category of the memory to create'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata for the memory',
          additionalProperties: true
        }
      },
      required: ['content', 'category']
    }
  },
  {
    name: 'get_conversations',
    description: 'Retrieve a list of conversation metadata from Omi. To get full transcripts, use get_conversation_by_id.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID for fetching user-specific conversations (optional)'
        },
        start_date: {
          type: 'string',
          description: 'Filter conversations after this date (YYYY-MM-DD format)'
        },
        end_date: {
          type: 'string',
          description: 'Filter conversations before this date (YYYY-MM-DD format)'
        },
        categories: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'personal', 'education', 'health', 'finance', 'legal', 'philosophy', 'spiritual',
              'science', 'entrepreneurship', 'parenting', 'romantic', 'travel', 'inspiration',
              'technology', 'business', 'social', 'work', 'sports', 'politics', 'literature',
              'history', 'architecture', 'music', 'weather', 'news', 'entertainment',
              'psychology', 'real', 'design', 'family', 'economics', 'environment', 'other'
            ]
          },
          description: 'Filter by conversation categories',
          default: []
        },
        limit: {
          type: 'integer',
          description: 'The number of conversations to retrieve',
          default: 20,
          minimum: 1,
          maximum: 1000
        },
        offset: {
          type: 'integer',
          description: 'The offset of the conversations to retrieve',
          default: 0,
          minimum: 0
        },
        include_segments: {
          type: 'boolean',
          description: 'Whether to include conversation segments/transcript data',
          default: false
        },
        search: {
          type: 'string',
          description: 'Search query to filter conversations by content'
        }
      },
      required: []
    }
  },
  {
    name: 'get_conversation_by_id',
    description: 'Retrieve a conversation by ID including each segment of the transcript from Omi.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID for fetching user-specific conversation (optional)'
        },
        conversation_id: {
          type: 'string',
          description: 'The ID of the conversation to retrieve'
        },
        include_segments: {
          type: 'boolean',
          description: 'Whether to include detailed conversation segments',
          default: true
        }
      },
      required: ['conversation_id']
    }
  }
];

// Tool handlers
async function handleGetMemories(args) {
  const params = {
    limit: args.limit || 100,
    offset: args.offset || 0
  };

  if (args.categories && args.categories.length > 0) {
    params.categories = args.categories;
  }
  if (args.start_date) params.start_date = args.start_date;
  if (args.end_date) params.end_date = args.end_date;
  if (args.search) params.search = args.search;

  const result = await makeOmiRequest('memories', { 
    params,
    userId: args.userId 
  });
  
  return [{
    type: 'text',
    text: JSON.stringify(result, null, 2)
  }];
}

async function handleCreateMemory(args) {
  const memoryData = {
    content: args.content,
    category: args.category,
    metadata: args.metadata
  };

  const result = await makeOmiRequest('memories', {
    method: 'POST',
    body: memoryData,
    userId: args.userId
  });
  
  return [{
    type: 'text',
    text: JSON.stringify(result, null, 2)
  }];
}

async function handleGetConversations(args) {
  const params = {
    limit: args.limit || 20,
    offset: args.offset || 0
  };

  if (args.start_date) params.start_date = args.start_date;
  if (args.end_date) params.end_date = args.end_date;
  if (args.categories && args.categories.length > 0) params.categories = args.categories;
  if (args.include_segments) params.include_segments = args.include_segments;
  if (args.search) params.search = args.search;

  const result = await makeOmiRequest('conversations', { 
    params,
    userId: args.userId 
  });
  
  return [{
    type: 'text',
    text: JSON.stringify(result, null, 2)
  }];
}

async function handleGetConversationById(args) {
  const params = {};
  if (args.include_segments !== false) {
    params.include_segments = true;
  }

  const result = await makeOmiRequest(`conversations/${args.conversation_id}`, { 
    params,
    userId: args.userId 
  });
  
  return [{
    type: 'text',
    text: JSON.stringify(result, null, 2)
  }];
}

// Create and configure the MCP server
const server = new Server(
  {
    name: 'omi-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_memories':
        return { content: await handleGetMemories(args || {}) };
      
      case 'create_memory':
        return { content: await handleCreateMemory(args || {}) };
      
      case 'get_conversations':
        return { content: await handleGetConversations(args || {}) };
      
      case 'get_conversation_by_id':
        return { content: await handleGetConversationById(args || {}) };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Omi MCP Server started and connected via stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
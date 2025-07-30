import { Tool } from "../types.js";

/**
 * Omi MCP Tools
 * 
 * This module defines specific tools for interacting with Omi memories and conversations.
 * Includes both core CRUD operations and optimized batch operations for Cognos integration.
 */

// ========== Core Memory Tools ==========

export const getMemoriesTool: Tool = {
  name: "get_memories",
  description: "Retrieve a list of memories from Omi. A memory is a known fact about the user across multiple domains.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      userId: {
        type: "string",
        description: "User ID for fetching user-specific memories. Automatically provided by the system."
      },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: ["core", "hobbies", "lifestyle", "interests", "habits", "work", "skills", "learnings", "other"]
        },
        description: "The categories of memories to filter by.",
        default: []
      },
      limit: {
        type: "integer",
        description: "The number of memories to retrieve.",
        default: 100,
        minimum: 1,
        maximum: 1000
      },
      offset: {
        type: "integer", 
        description: "The offset of the memories to retrieve.",
        default: 0,
        minimum: 0
      },
      start_date: {
        type: "string",
        description: "Filter memories after this date (YYYY-MM-DD format)"
      },
      end_date: {
        type: "string", 
        description: "Filter memories before this date (YYYY-MM-DD format)"
      },
      search: {
        type: "string",
        description: "Search query to filter memories by content"
      }
    },
    required: []
  }
};

export const createMemoryTool: Tool = {
  name: "create_memory",
  description: "Create a new memory in Omi. A memory is a known fact about the user across multiple domains.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      content: {
        type: "string",
        description: "The content of the memory."
      },
      category: {
        type: "string",
        enum: ["core", "hobbies", "lifestyle", "interests", "habits", "work", "skills", "learnings", "other"],
        description: "The category of the memory to create."
      },
      metadata: {
        type: "object",
        description: "Additional metadata for the memory",
        additionalProperties: true
      }
    },
    required: ["content", "category"]
  }
};

export const updateMemoryTool: Tool = {
  name: "edit_memory",
  description: "Edit a memory's content in Omi. A memory is a known fact about the user across multiple domains.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      memory_id: {
        type: "string",
        description: "The ID of the memory to edit."
      },
      content: {
        type: "string",
        description: "The new content for the memory."
      },
      category: {
        type: "string",
        enum: ["core", "hobbies", "lifestyle", "interests", "habits", "work", "skills", "learnings", "other"],
        description: "The new category for the memory."
      },
      metadata: {
        type: "object",
        description: "Updated metadata for the memory",
        additionalProperties: true
      }
    },
    required: ["memory_id"]
  }
};

export const deleteMemoryTool: Tool = {
  name: "delete_memory",
  description: "Delete a memory by ID from Omi. A memory is a known fact about the user across multiple domains.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      memory_id: {
        type: "string",
        description: "The ID of the memory to delete."
      }
    },
    required: ["memory_id"]
  }
};

// ========== Core Conversation Tools ==========

export const getConversationsTool: Tool = {
  name: "get_conversations",
  description: "Retrieve a list of conversation metadata from Omi. To get full transcripts, use get_conversation_by_id.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      userId: {
        type: "string",
        description: "User ID for fetching user-specific conversations. Automatically provided by the system."
      },
      start_date: {
        type: "string",
        description: "Filter conversations after this date (YYYY-MM-DD format)"
      },
      end_date: {
        type: "string",
        description: "Filter conversations before this date (YYYY-MM-DD format)"
      },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "personal", "education", "health", "finance", "legal", "philosophy", "spiritual",
            "science", "entrepreneurship", "parenting", "romantic", "travel", "inspiration",
            "technology", "business", "social", "work", "sports", "politics", "literature",
            "history", "architecture", "music", "weather", "news", "entertainment",
            "psychology", "real", "design", "family", "economics", "environment", "other"
          ]
        },
        description: "Filter by conversation categories.",
        default: []
      },
      limit: {
        type: "integer",
        description: "The number of conversations to retrieve.",
        default: 20,
        minimum: 1,
        maximum: 1000
      },
      offset: {
        type: "integer",
        description: "The offset of the conversations to retrieve.",
        default: 0,
        minimum: 0
      },
      include_segments: {
        type: "boolean",
        description: "Whether to include conversation segments/transcript data",
        default: false
      },
      search: {
        type: "string",
        description: "Search query to filter conversations by content"
      }
    },
    required: []
  }
};

export const getConversationByIdTool: Tool = {
  name: "get_conversation_by_id", 
  description: "Retrieve a conversation by ID including each segment of the transcript from Omi.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      userId: {
        type: "string",
        description: "User ID for fetching user-specific conversation. Automatically provided by the system."
      },
      conversation_id: {
        type: "string",
        description: "The ID of the conversation to retrieve."
      },
      include_segments: {
        type: "boolean",
        description: "Whether to include detailed conversation segments",
        default: true
      }
    },
    required: ["conversation_id"]
  }
};

// ========== Batch Operations (Cognos Optimizations) ==========

export const batchGetConversationsTool: Tool = {
  name: "batch_get_conversations",
  description: "Retrieve multiple conversations by ID in a single request. Optimized for efficient batch processing in Cognos memory aggregation.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      conversation_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "List of conversation IDs to retrieve",
        maxItems: 50,
        minItems: 1
      },
      include_segments: {
        type: "boolean",
        description: "Whether to include detailed conversation segments for all conversations",
        default: true
      }
    },
    required: ["conversation_ids"]
  }
};

export const getChangesSinceTool: Tool = {
  name: "get_changes_since",
  description: "Get memories or conversations modified since a specific timestamp. Optimized for incremental sync in Cognos memory aggregation.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      since_timestamp: {
        type: "string",
        description: "ISO timestamp for incremental sync (e.g., '2024-01-15T10:30:00Z')"
      },
      entity_type: {
        type: "string",
        enum: ["memories", "conversations"],
        description: "Type of entities to sync"
      },
      limit: {
        type: "integer",
        description: "Maximum number of items to return",
        default: 1000,
        minimum: 1,
        maximum: 5000
      }
    },
    required: ["since_timestamp", "entity_type"]
  }
};

export const searchConversationsTool: Tool = {
  name: "search_conversations",
  description: "Perform semantic search on conversations with optional reranking. Optimized for intelligent memory discovery in Cognos.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      },
      query: {
        type: "string",
        description: "Semantic search query for finding relevant conversations"
      },
      limit: {
        type: "integer",
        description: "Maximum number of conversations to return",
        default: 20,
        minimum: 1,
        maximum: 100
      },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "personal", "education", "health", "finance", "legal", "philosophy", "spiritual",
            "science", "entrepreneurship", "parenting", "romantic", "travel", "inspiration",
            "technology", "business", "social", "work", "sports", "politics", "literature",
            "history", "architecture", "music", "weather", "news", "entertainment",
            "psychology", "real", "design", "family", "economics", "environment", "other"
          ]
        },
        description: "Filter results by conversation categories",
        default: []
      },
      start_date: {
        type: "string",
        description: "Filter conversations after this date (YYYY-MM-DD format)"
      },
      end_date: {
        type: "string",
        description: "Filter conversations before this date (YYYY-MM-DD format)"
      },
      embedding_model: {
        type: "string",
        description: "Embedding model to use for semantic search",
        default: "text-embedding-ada-002"
      }
    },
    required: ["query"]
  }
};

// ========== Health Check Tool ==========

export const healthCheckTool: Tool = {
  name: "omi_health_check",
  description: "Check the health and connectivity of the Omi API connection.",
  inputSchema: {
    type: "object",
    properties: {
      api_key: {
        type: "string",
        description: "The user's Omi API key. If not provided, it will be read from the OMI_API_KEY environment variable."
      }
    },
    required: []
  }
};

// Export all tools as an array
export const omiTools: Tool[] = [
  // Core Memory Operations
  getMemoriesTool,
  createMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  
  // Core Conversation Operations  
  getConversationsTool,
  getConversationByIdTool,
  
  // Batch Operations (Cognos Optimizations)
  batchGetConversationsTool,
  getChangesSinceTool,
  searchConversationsTool,
  
  // Health Check
  healthCheckTool
];
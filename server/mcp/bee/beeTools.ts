/**
 * Bee AI MCP Tools
 * 
 * This module defines the available tools for the Bee MCP server.
 */

export const beeTools = [
  {
    "name": "bee_get_recent_memories",
    "description": "Get recent transcription memories from Bee device",
    "parameters": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "integer",
          "description": "Maximum number of memories to return (default: 20)"
        },
        "include_insights": {
          "type": "boolean",
          "description": "Whether to include AI-generated insights (default: true)"
        }
      }
    }
  },
  {
    "name": "bee_search_memories",
    "description": "Search transcription memories from Bee device by query and filters",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query to filter memories"
        },
        "date_from": {
          "type": "string",
          "description": "Optional start date (ISO format) to filter memories"
        },
        "date_to": {
          "type": "string",
          "description": "Optional end date (ISO format) to filter memories"
        },
        "speakers": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Optional list of speaker IDs to filter by"
        },
        "limit": {
          "type": "integer",
          "description": "Maximum number of memories to return (default: 50)"
        }
      },
      "required": ["query"]
    }
  },
  {
    "name": "bee_get_memory_by_id",
    "description": "Get a specific transcription memory from Bee device by ID",
    "parameters": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The unique ID of the memory"
        }
      },
      "required": ["id"]
    }
  },
  {
    "name": "bee_get_daily_summaries",
    "description": "Get daily conversation summaries from Bee device",
    "parameters": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "description": "Optional date in YYYY-MM-DD format (default: today)"
        },
        "include_previous": {
          "type": "integer",
          "description": "Number of previous days to include (default: 0)"
        }
      }
    }
  },
  {
    "name": "bee_get_knowledge_graph",
    "description": "Get the personal knowledge graph built from Bee conversations",
    "parameters": {
      "type": "object",
      "properties": {
        "entity_type": {
          "type": "string",
          "description": "Optional filter by entity type (person, organization, etc.)"
        },
        "min_mentions": {
          "type": "integer",
          "description": "Minimum number of mentions for entities (default: 1)"
        }
      }
    }
  },
  {
    "name": "bee_get_insights",
    "description": "Get insights and analytics about conversation patterns from Bee",
    "parameters": {
      "type": "object",
      "properties": {
        "time_range": {
          "type": "string",
          "enum": ["day", "week", "month"],
          "description": "Time range for analytics (default: week)"
        }
      }
    }
  }
];

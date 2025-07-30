# Omi MCP Server

A Model Context Protocol (MCP) server for integrating with Omi memory and conversation APIs. This server provides comprehensive access to Omi's memory management and conversation systems, with optimizations specifically designed for Cognos memory aggregation.

## Features

### Core Memory Operations
- **get_memories** - Retrieve user memories with filtering by categories, dates, and search terms
- **create_memory** - Create new memories with categorization and metadata
- **edit_memory** - Update existing memory content and categories  
- **delete_memory** - Remove memories by ID

### Core Conversation Operations
- **get_conversations** - List conversations with metadata and optional transcript segments
- **get_conversation_by_id** - Retrieve full conversation details including transcript segments

### Batch Operations (Cognos Optimizations)
- **batch_get_conversations** - Efficiently retrieve multiple conversations in a single request
- **get_changes_since** - Incremental sync for memories or conversations since a timestamp
- **search_conversations** - Semantic search across conversations with optional reranking

### Health & Monitoring
- **omi_health_check** - Verify API connectivity and server health

## Configuration

### Environment Variables
- `OMI_API_KEY` - Your Omi API key (required)
- `OMI_API_BASE_URL` - Omi API base URL (optional, defaults to https://api.omi.me/v1/mcp/)

### Setup
The server is automatically registered in the MCP router when the `OMI_API_KEY` environment variable is set.

```bash
export OMI_API_KEY="your-omi-api-key"
export OMI_API_BASE_URL="https://api.omi.me/v1/mcp/"  # optional
```

## API Categories

### Memory Categories
- core, hobbies, lifestyle, interests, habits, work, skills, learnings, other

### Conversation Categories  
- personal, education, health, finance, legal, philosophy, spiritual, science
- entrepreneurship, parenting, romantic, travel, inspiration, technology
- business, social, work, sports, politics, literature, history, architecture
- music, weather, news, entertainment, psychology, real, design, family
- economics, environment, other

## Usage Examples

### Basic Memory Retrieval
```json
{
  "tool": "get_memories",
  "parameters": {
    "limit": 50,
    "categories": ["health", "work"],
    "start_date": "2024-01-01"
  }
}
```

### Batch Conversation Processing (Cognos Optimization)
```json
{
  "tool": "batch_get_conversations", 
  "parameters": {
    "conversation_ids": ["conv-1", "conv-2", "conv-3"],
    "include_segments": true
  }
}
```

### Incremental Sync (Cognos Optimization)
```json
{
  "tool": "get_changes_since",
  "parameters": {
    "since_timestamp": "2024-01-15T10:30:00Z",
    "entity_type": "conversations",
    "limit": 1000
  }
}
```

### Semantic Search (Cognos Optimization)
```json
{
  "tool": "search_conversations",
  "parameters": {
    "query": "health and wellness discussions",
    "limit": 20,
    "categories": ["health", "personal"]
  }
}
```

## Cognos Integration

This MCP server is specifically optimized for Cognos memory aggregation with several key features:

1. **Batch Operations** - Efficiently process multiple conversations simultaneously
2. **Incremental Sync** - Only fetch data that has changed since last sync
3. **Semantic Search** - Find relevant conversations using natural language queries
4. **Health Context** - Specialized prompts for health data correlation
5. **Event-Driven Architecture** - Real-time processing capabilities for live aggregation

### Cognos Aggregation Flow
```typescript
// Example Cognos integration pattern
const omiClient = mcpServers['omi'];

// 1. Get conversation list  
const conversations = await omiClient.executeToolCall({
  name: 'get_conversations',
  parameters: { 
    start_date: timeRange.start,
    end_date: timeRange.end,
    limit: 100 
  }
});

// 2. Batch fetch full conversation details
const fullConversations = await omiClient.executeToolCall({
  name: 'batch_get_conversations', 
  parameters: {
    conversation_ids: conversations.data.map(c => c.id),
    include_segments: true
  }
});

// 3. Process into unified Cognos format with health correlation
```

## Prompts

The server includes several prompts for contextual LLM interactions:

- **omi-memory-context** - User memory context for personalization
- **omi-conversation-summary** - Recent conversation summaries  
- **omi-health-insights** - Health-related conversation analysis
- **omi-cognos-aggregation** - Cognos aggregation data preparation
- **omi-personalization** - Personalization context generation

## Error Handling

The server implements comprehensive error handling with:
- API connectivity validation
- Request parameter validation  
- Graceful fallbacks for unsupported endpoints
- Detailed error logging and reporting

## Development

### File Structure
```
server/mcp/omi/
├── README.md              # This documentation
├── interfaces.ts          # TypeScript type definitions
├── omiService.ts         # API client service
├── omiTools.ts           # MCP tool definitions  
├── omiPrompts.ts         # MCP prompt definitions
└── omiMcpServer.ts       # Main server implementation
```

### Adding New Tools
1. Define the tool schema in `omiTools.ts`
2. Add the handler method in `omiMcpServer.ts`  
3. Update the service layer in `omiService.ts` if needed
4. Add corresponding types to `interfaces.ts`

## License

This Omi MCP server is part of the OllamaCognos project.
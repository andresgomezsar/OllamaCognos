# Cognos - Personal AI Health Assistant

An advanced Ollama-compatible personal AI assistant that integrates health data from Oura Ring, Bee transcriptions, and Limitless notes with local LLMs and cloud AI providers for comprehensive AI-powered health insights and analysis.

## Features

### 🤖 Dual AI Architecture
- **Primary**: OpenRouter with Claude 3.5 Sonnet for advanced reasoning
- **Local**: Ollama server integration with DeepSeek-R1 32B for privacy-focused processing
- **Smart Routing**: Automatic model detection and provider selection
- **Fallback Support**: Seamless switching between cloud and local AI

### 🏥 Health Data & Knowledge Integration
- **Oura Ring Sync**: Real-time sleep, activity, and readiness data
- **Bee Transcription**: Audio-to-text transcription for note-taking
- **Limitless Notes**: Access to personal knowledge base and journal entries
- **Health Analytics**: AI-powered insights from biometric data
- **Trend Analysis**: Historical health pattern recognition
- **Privacy First**: Local processing option for sensitive health data

### 🔧 MCP Tool System
- **Web Search**: Real-time information retrieval
- **Memory Store**: Persistent conversation context
- **Health Analysis**: Specialized health data processing tools
- **Transcription**: Audio file processing via Bee API
- **Notes Integration**: Access personal knowledge via Limitless API
- **Smart Routing**: Advanced context-aware tool selection
- **Modular Architecture**: Server-based MCP implementation with unified interface
- **Extensible**: Plugin architecture for custom tools
- **Streaming Support**: Real-time tool execution with streaming responses

### 🔒 Privacy & Security
- **Local Processing**: Ollama integration for sensitive conversations
- **Data Encryption**: Secure storage of health information
- **Audit Logging**: Complete action tracking
- **User Consent**: Granular permission controls

## Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Providers**: OpenRouter API + Ollama
- **Health & Knowledge APIs**:
  - Oura Ring v2 API
  - Bee Transcription API
  - Limitless AI Pendant API
- **Real-time**: WebSocket connections + Event-based streaming

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API client
├── server/                 # Express backend
│   ├── routes.ts           # API routes and WebSocket handlers
│   ├── storage.ts          # Database layer
│   ├── mcp/                # Modern MCP implementation
│   │   ├── mcpRouter.ts    # Modern MCP router and routing service
│   │   ├── mcpSchemaValidator.ts # Request/response schema validation
│   │   ├── types.ts        # MCP type definitions
│   │   ├── auth/           # Authentication for MCP servers
│   │   ├── oura/           # Oura MCP server implementation
│   │   │   ├── ouraService.ts  # Oura API client
│   │   │   ├── interfaces.ts   # Oura data interfaces
│   │   │   ├── ouraPrompts.ts  # Prompt templates
│   │   │   ├── ouraMcpServer.ts # MCP server adapter
│   │   │   └── ouraTools.ts    # Oura MCP tools
│   │   ├── bee/            # Bee MCP server implementation
│   │   │   ├── beeClient.ts    # Bee API client
│   │   │   ├── beePrompts.ts   # Prompt templates 
│   │   │   ├── beeMcpServer.ts # MCP server adapter
│   │   │   └── beeTools.ts     # Bee MCP tools
│   │   ├── limitless/      # Limitless MCP server implementation
│   │   │   ├── limitlessClient.ts  # Limitless API client
│   │   │   ├── limitlessPrompts.ts # Prompt templates
│   │   │   ├── limitlessMcpServer.ts # MCP server adapter
│   │   │   └── limitlessTools.ts    # Limitless MCP tools
│   │   └── search/         # Search MCP server implementation
│   ├── ollama.ts           # Ollama client
│   ├── openrouter.ts       # OpenRouter client
│   ├── groq.ts             # Groq client
│   ├── perplexity.ts       # Perplexity client
│   └── test/               # Test files
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and validation
└── components.json         # shadcn/ui configuration
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Oura Ring API access token
- OpenRouter API key (optional)
- Ollama server (optional, for local AI)

### Environment Variables
Create a `.env` file with:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/cognos
OURA_TOKEN=your_oura_ring_token
OPENROUTER_API_KEY=your_openrouter_key  # Optional
LIMITLESS_API_TOKEN=your_limitless_token  # Optional
BEE_API_TOKEN=your_bee_token  # Optional
GROQ_API_KEY=your_groq_api_key  # Optional
PERPLEXITY_API_KEY=your_perplexity_api_key  # Optional
```

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database: `npm run db:push`
4. Start development server: `npm run dev`

### Ollama Integration
1. Install Ollama locally or use ngrok for remote access
2. Configure Ollama URL in settings
3. Download models: `ollama pull deepseek-r1:32b`
4. Models automatically route based on naming convention

## API Endpoints

### Chat & Conversations
- `POST /api/chat/completions` - OpenAI-compatible chat endpoint
- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get conversation messages

### Health Data
- `GET /api/health` - Retrieve health data with filters
- `POST /api/health/sync` - Sync latest Oura Ring data
- `GET /api/status` - System status including AI providers

### MCP Tools
- `GET /api/mcp/tools` - List available MCP tools
- `POST /api/mcp/execute` - Execute MCP tool with parameters

### Settings
- `GET /api/settings` - Get user preferences
- `PUT /api/settings` - Update AI and privacy settings

## Usage Examples

### Chat with Health Context
```javascript
// WebSocket message to chat with health data context
{
  "type": "chat",
  "conversationId": 1,
  "content": "Analyze my sleep patterns from last week",
  "userId": 1
}
```

### Direct API Chat
```bash
curl -X POST /api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-r1:32b",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.7
  }'
```

### Health Data Query
```bash
curl "/api/health?dataType=sleep&limit=7"
```

## AI Provider Routing

### Automatic Model Detection
- Models with colons (e.g., `deepseek-r1:32b`) → Ollama
- Standard model names (e.g., `claude-3.5-sonnet`) → OpenRouter
- Manual override with `X-Use-Ollama: true` header

### Fallback Logic
1. Check model name format
2. Verify provider availability
3. Route to appropriate AI service
4. Handle errors gracefully

## Health Data Processing

### Oura Ring Integration
- **Sleep Data**: Duration, efficiency, stages, heart rate
- **Activity Data**: Steps, calories, active time
- **Readiness Data**: Recovery scores, HRV, temperature

### AI Health Analysis
- Pattern recognition in biometric trends
- Personalized health recommendations
- Correlation analysis between metrics
- Anomaly detection for health alerts

## Development

### Database Migrations
```bash
npm run db:push        # Apply schema changes
npm run db:studio      # Open Drizzle Studio
```

### Adding MCP Tools
1. Create a new tool class in the appropriate server directory (e.g., `server/mcp/[service]/tools.ts`)
2. Implement the tool following the MCP Tool interface
3. Register the tool in `server/mcp/index.ts`
4. Update contextual pattern matching in `determineEnabledTools` if needed

### MCP Architecture
- **Server-Based**: Modular MCP servers for different services (Oura, Search, Memory)
- **Contextual Tool Selection**: Smart pattern matching for relevant tool activation
- **Streaming Support**: Real-time tool execution results
- **Error Handling**: Robust error handling and user feedback
- **Schema Validation**: Automatic validation of tool inputs and outputs

### Frontend Development
- Uses shadcn/ui components
- TanStack Query for data fetching
- Wouter for client-side routing
- WebSocket hooks for real-time updates

## Deployment

### Replit Deployment
1. Configure environment variables
2. Set up PostgreSQL database
3. Deploy using Replit's deployment feature

### Docker Deployment
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## Security Considerations

- Health data is encrypted at rest
- API keys stored as environment variables
- Local processing option for sensitive data
- Audit logging for all data access
- User consent tracking for data usage

## License

MIT License - see LICENSE file for details

## MCP and AI Model Integration

### Function Calling Architecture
- **Adapter Pattern**: Translates MCP server tools to Ollama/OpenRouter function calls
- **Smart Routing**: Context-aware tool selection based on message content
- **Function Schema**: OpenAI-compatible function calling format

### Workflow
1. **User Query**: Sent to Ollama/OpenRouter models
2. **Tool Selection**: Relevant MCP tools activated based on query context
3. **Function Calling**: AI model invokes appropriate function
4. **Data Retrieval**: MCP servers retrieve and process data (Oura, Web Search, etc.)
5. **Response Generation**: AI incorporates tool results into final response

### Supported AI Providers
- **Ollama**: Local AI with function calling support
- **OpenRouter**: Cloud-based models with advanced reasoning

## Support

For issues and questions:
- Create GitHub issue for bugs
- Check documentation for setup help
- Review API examples for integration

---

**Built with privacy-first principles for personal health insights**
# Cognos - Personal AI Health Assistant

An advanced Ollama-compatible personal AI assistant that integrates health data from Oura Ring with local LLMs and cloud AI providers for comprehensive AI-powered health insights and analysis.

## Features

### 🤖 Dual AI Architecture
- **Primary**: OpenRouter with Claude 3.5 Sonnet for advanced reasoning
- **Local**: Ollama server integration with DeepSeek-R1 32B for privacy-focused processing
- **Smart Routing**: Automatic model detection and provider selection
- **Fallback Support**: Seamless switching between cloud and local AI

### 🏥 Health Data Integration
- **Oura Ring Sync**: Real-time sleep, activity, and readiness data
- **Health Analytics**: AI-powered insights from biometric data
- **Trend Analysis**: Historical health pattern recognition
- **Privacy First**: Local processing option for sensitive health data

### 🔧 MCP Tool System
- **Web Search**: Real-time information retrieval
- **Memory Store**: Persistent conversation context
- **Health Analysis**: Specialized health data processing tools
- **Extensible**: Plugin architecture for custom tools

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
- **Health APIs**: Oura Ring v2 API
- **Real-time**: WebSocket connections

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
│   ├── mcp.ts              # MCP tool implementations
│   ├── ollama.ts           # Ollama client
│   ├── openrouter.ts       # OpenRouter client
│   └── oura.ts             # Oura Ring API client
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
1. Implement tool in `server/mcp.ts`
2. Add to tool registry
3. Update routing logic in `server/mcpRouter.ts`

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

## Support

For issues and questions:
- Create GitHub issue for bugs
- Check documentation for setup help
- Review API examples for integration

---

**Built with privacy-first principles for personal health insights**
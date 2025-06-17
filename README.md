# Cognos - Personal AI Health Assistant

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green)](https://expressjs.com/)
[![Ollama](https://img.shields.io/badge/Ollama-0.1.22-orange)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An advanced Ollama-compatible personal AI assistant that integrates health data from Oura Ring, Bee transcriptions, and Limitless notes with local LLMs and cloud AI providers for comprehensive AI-powered health insights and analysis.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [API Endpoints](#api-endpoints)
- [AI Provider Routing](#ai-provider-routing)
- [Health Data Processing](#health-data-processing)
- [Deployment](#deployment)
- [MCP and AI Model Integration](#mcp-and-ai-model-integration)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

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

## Quick Start

### Using the Startup Script
A convenient shell script is included to start the OllamaCognos server and open it in your browser automatically:

```bash
# Make sure the script is executable
chmod +x start-cognos.sh

# Start the server with one command
./start-cognos.sh
```

The script will:
1. Start the Node.js server with `npm run dev`
2. Show a notification when the server is starting
3. Automatically open your default browser to http://localhost:3000

### Creating a macOS App (Automator)
To create a clickable macOS application for starting OllamaCognos:

1. Open Automator from Applications
2. Select "Application" as the document type
3. Add a "Run Shell Script" action
4. Enter the following script:
   ```bash
   cd /Users/andresgomezsarmiento/Documents/GitHub/OllamaCognos
   npm run dev &
   sleep 5
   open http://localhost:3000
   ```
5. Save as "OllamaCognos.app" to your Applications folder
6. Now you can start the server by clicking the app icon

## Environment Setup

### Required Environment Variables
Copy `.env.example` to `.env` and configure the following variables:

```bash
# Server Configuration
PORT=3000                       # Server port (default: 3000)

# Cognos Audio Pipeline
COGNOS_PYTHON_PATH=python       # Path to Python executable (default: python)
COGNOS_PIPELINE_PATH=/path/to/cognos_pipeline  # Path to cognos_pipeline directory
SESSION_SECRET=your-secret      # Secret for session encryption

# AI Providers
OLLAMA_URL=http://localhost:11434  # Ollama API URL (or ngrok URL for remote access)
OPENROUTER_API_KEY=your-key     # OpenRouter API key for cloud models

# MCP Services
OURA_ACCESS_TOKEN=your-token    # Oura Ring API access token
BEE_API_TOKEN=your-token        # Bee Transcription API token
LIMITLESS_TOKEN=your-token      # Limitless API token for notes access
```

### Setting Up Ollama

#### Local Installation
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Start the Ollama service
3. Pull recommended models:
   ```bash
   ollama pull deepseek-r1:32b
   ollama pull qwen3:30b
   ```

#### Remote Access via Ngrok
To access Ollama from outside your local network or from mobile devices:
1. Install ngrok
2. Run: `ngrok http 11434`
3. Set `OLLAMA_URL` in `.env` to your ngrok URL

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

### Cognos Audio Processing
- **Universal Audio Pipeline**: Process any audio file through VAD, diarization, and transcription
- **Omi Necklace Integration**: Stream audio directly from Omi wearable devices via BLE
- **Real-time Processing**: Live audio processing for ambient computing
- **JSON Output**: Structured data format for AI analysis

#### Setup Requirements
```bash
# Install Python dependencies
pip install numpy librosa pyannote.audio torch transformers

# For Omi device streaming (optional)
pip install bleak asyncio

# Configure Omi BLE UUIDs in your .env file
OMI_SERVICE_UUID=0000180d-0000-1000-8000-00805f9b34fb  # Heart Rate service example
OMI_AUDIO_CHAR_UUID=00002a37-0000-1000-8000-00805f9b34fb  # Audio characteristic example
OMI_CONTROL_CHAR_UUID=00002a39-0000-1000-8000-00805f9b34fb  # Control characteristic example
```

#### Usage Examples
```typescript
// Process an audio file
await mcpRouter.executeMCPTool('cognos', 'process_cognos_audio', {
  audio_file_path: '/path/to/recording.wav',
  enable_vad: true,
  enable_diarization: true,
  enable_transcription: true
});

// Stream from Omi device (if available)
await mcpRouter.executeMCPTool('cognos', 'stream_omi_audio', {
  device_id: 'optional-device-id',
  duration_seconds: 30,
  enable_vad: true,
  enable_diarization: true,
  enable_transcription: true
});
```

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

### What is MCP?
MCP (Model Context Protocol) provides a standardized interface for AI models to access external tools and data sources. In OllamaCognos, the MCP implementation allows both local and cloud AI models to interact with services like Oura Ring, Bee Transcription, and Limitless Notes using consistent patterns.

```
+----------------+         +-------------------+         +------------------+
|                |         |                   |         |                  |
|  User Request  |-------->|  LLM Processing   |-------->|  MCP Interface   |
|                |         |  (Ollama/OpenAI)  |<--------|  (Tool Router)   |
+----------------+         +-------------------+         +------------------+
                                                              |
                                                              v
                           +--------------------------------------------------+
                           |                                                  |
                           |  +-------------+  +------------+  +------------+ |
                           |  |             |  |            |  |            | |
                           |  | Oura MCP    |  | Bee MCP    |  | Limitless  | |
                           |  | Server      |  | Server     |  | MCP Server | |
                           |  |             |  |            |  |            | |
                           |  +-------------+  +------------+  +------------+ |
                           |                                                  |
                           |  +-------------+                                 |
                           |  |             |                                 |
                           |  | Cognos MCP  |                                 |
                           |  | Server      |                                 |
                           |  |             |                                 |
                           |  +-------------+                                 |
                           |                                                  |
                           +--------------------------------------------------+
```

### Function Calling Architecture
- **Unified Interface**: Common `McpServerWithRouter` interface ensures all services implement required methods
- **Adapter Pattern**: Translates MCP server tools to Ollama/OpenRouter function calls
- **Smart Routing**: Context-aware tool selection based on message content
- **Function Schema**: OpenAI-compatible function calling format
- **Streaming Support**: Real-time responses during tool execution

### MCP Workflow
1. **User Query**: Sent to Ollama/OpenRouter models
2. **Tool Selection**: Relevant MCP tools activated based on query context
3. **Function Calling**: AI model invokes appropriate function through the MCP Router
4. **Data Retrieval**: Specific MCP server (Oura, Bee, Limitless) handles the request
5. **Response Generation**: AI incorporates tool results into final response

### Key MCP Components

- **mcpRouter**: Central routing service that directs requests to appropriate MCP servers
- **mcpSchemaValidator**: Ensures requests and responses follow schema standards
- **MCP Servers**: Individual servers for each integrated service (Oura, Bee, Limitless)
- **Tool Definitions**: Structured descriptions of available functions for each service

### Supported AI Providers
- **Ollama**: Local AI with function calling support
- **OpenRouter**: Cloud-based models with advanced reasoning

## Troubleshooting

### Common Issues

#### Connection to Ollama fails
- Verify Ollama service is running (`ps aux | grep ollama`)
- Check `OLLAMA_URL` in `.env` matches your Ollama endpoint
- If using ngrok, ensure the URL is current (ngrok URLs expire)
- Run the test script: `node test-ollama-connection.js`

#### TypeScript Compilation Errors
- Run `npx tsc --noEmit` to identify specific errors
- Check for ESM/CommonJS mismatches in import statements
- Ensure type definitions are properly loaded

#### WebSocket Connection Issues
- Verify the client is correctly connecting to `/ws` endpoint
- Check authentication token is properly configured
- In development, the server defaults to `userId: 1`

#### MCP Tool Errors
- Examine server logs for detailed error messages
- Verify all required environment variables for the specific MCP service
- Check that the MCP server implements the `McpServerWithRouter` interface

## Support

For issues and questions:
- Create GitHub issue for bugs
- Check documentation for setup help
- Review API examples for integration

---

**Built with privacy-first principles for personal health insights**
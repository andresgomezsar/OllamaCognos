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

### Starting the Server
You can start the OllamaCognos server with the following commands:

```bash
# Start the development server
npm run dev

# Access the application in your browser
open http://localhost:3000
```

Alternatively, you can use the included startup script that handles both steps:

```bash
# Make sure the script is executable
chmod +x start-cognos.sh

# Start the server with one command
./start-cognos.sh
```

## Environment Setup

### Configuration
Create a `.env` file in the root directory by copying the example:

```bash
# Copy the example environment file
cp .env.example .env
```

Then edit the `.env` file to configure:

```bash
# Server Configuration
PORT=3000
SESSION_SECRET=your-secret

# AI Providers
OLLAMA_URL=http://localhost:11434
OPENROUTER_API_KEY=your-key

# Health Services
OURA_ACCESS_TOKEN=your-token
BEE_API_TOKEN=your-token
LIMITLESS_TOKEN=your-token
```

### Setting Up Ollama

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Start the Ollama service
3. Pull recommended models:
   ```bash
   ollama pull deepseek-r1:32b
   ollama pull qwen3:30b
   ```

#### Remote Access Options

**Option 1 (Recommended)**: For remote access with zrok reserved private share:
```bash
# Install zrok (macOS)
brew tap openziti/tap
brew install zrok

# OR download directly
# curl -L https://github.com/openziti/zrok/releases/latest/download/zrok_darwin_amd64 -o zrok
# chmod +x zrok
# sudo mv zrok /usr/local/bin/

# Set up zrok account (one-time setup)
# Visit https://myzrok.io to create an account and get your token
zrok enable <your_token>

# Create a reserved private share with a custom name (one-time setup)
# This makes your share persistent with the same name/token each time
zrok reserve private localhost:11434 --backend-mode tcpTunnel --unique-name ollamacognos

# Start the backend for your reserved share on the host machine
zrok share reserved ollamacognos --headless
```

Then, on the remote machine where you want to access your Ollama server:
```bash
# Install zrok on the remote machine
# [installation commands as shown above]

# Use the same zrok account (enable with same token)
zrok enable <your_token>

# Access the reserved share using its name
# This creates a local port forward, typically at http://127.0.0.1:9191
zrok access private ollamacognos --headless
```

After setting up the access on the remote machine, update your remote machine's `.env` file to use the local forwarded port:
```
OLLAMA_URL=http://localhost:9191
USE_NGROK=false
```

This approach offers several advantages:
- **Persistent share name**: No need to copy a new share ID each time
- **TLS passthrough**: Avoids certificate/TLS version issues
- **Simple reconnection**: Both server and client can reconnect using the same name
- **Stable configuration**: Your `.env` settings stay consistent

**Option 2 (Alternative)**: For remote access with ngrok:
```bash
# Install ngrok (macOS)
brew install ngrok

# OR download directly
# Go to https://ngrok.com/download and follow instructions

# Set up ngrok account (one-time setup)
# Visit https://dashboard.ngrok.com and get your auth token
ngrok config add-authtoken <your_token>

# Create a tunnel to your Ollama server
ngrok http 11434
```

After setting up either option, update your `.env` file with the appropriate URL:

## Known Issues

- **Ngrok 403 Error**: If you encounter a 403 error when using ngrok, try updating your ngrok configuration or switching to zrok's private tcpTunnel mode.

## Universal Memory Platform

Cognos Universal Memory Platform is a device-agnostic AI software layer for physical and mental augmentation. It creates a standardized protocol for AI tools to interact with audio processing, biomarker data, and wearable device integrations.

### Omi Necklace Integration

The platform supports Omi devices for audio capture and real-time transcription:

- **Device Discovery**: Scan and connect to available Omi necklaces
- **Audio Streaming**: Capture audio from Omi devices in real-time
- **Webhook Integration**: Process real-time transcripts, conversation events, and more via webhooks
- **Conversation Import**: Import existing conversations from Omi exports
- **Simulation Mode**: Develop and test without physical devices

#### Webhook Endpoints

Configure your Omi necklace app to send data to the following webhook endpoints:

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Real-time Transcript | `/api/omi/webhook/realtime-transcript` | Receives transcript chunks as they're generated |
| Conversation Events | `/api/omi/webhook/conversation-events` | Notifies of conversation start/end events |
| Audio Bytes | `/api/omi/webhook/audio-bytes` | Streams raw audio data for processing |
| Day Summary | `/api/omi/webhook/day-summary` | Provides daily conversation summaries |
| Webhook Status | `/api/omi/webhook/status` | Checks webhook configuration status |

#### Importing Omi Conversations

You can import existing conversations from the Omi necklace app:

1. Export conversations from the Omi app to a `conversations.json` file
2. Navigate to the Omi Integration page at `/omi-integration`
3. Use the drag-and-drop importer to upload your export file
4. The system will process and integrate your conversations

### Biomarker Integration

Integrate health data from multiple sources:

- **Oura Ring**: Sleep quality, readiness, and activity metrics
- **Limitless Pendant**: Voice features, conversation metrics, and cognitive load
- **Apple Health**: Heart rate, steps, workouts, and energy expenditure
- **Cognitive Insights**: AI-generated analysis combining audio and health data

### MCP Tool Commands

- `process_cognos_memory`: Process audio from various sources with optional biomarker integration
- `connect_omi_device`: Scan for and connect to Omi devices
- `get_cognos_biomarkers`: Retrieve health data from connected devices

#### Example Usage

```javascript
// Connect to an Omi device and start streaming
const response = await mcpClient.executeRemoteTool({
  server: "cognos-universal-memory",
  tool: "connect_omi_device",
  params: {
    scan_mode: true,  // Set to false to connect to a specific device
    device_id: null,   // Provide device_id when scan_mode is false
    webhook_url: "https://your-server.com/api/omi/webhook/realtime-transcript"
  }
});

// Process memory from an Omi device
const result = await mcpClient.executeRemoteTool({
  server: "cognos-universal-memory",
  tool: "process_cognos_memory",
  params: {
    source: "omi_device",
    device_id: "your-device-id",
    include_biomarkers: true,
    generate_insights: true
  }
});
```

See the [API Reference](#api-reference) for detailed documentation.

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
1. Install Ollama locally or use zrok/ngrok for remote access (see Remote Access Options above)
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

## Known Issues

### MCP Tool-Calling with Ollama

This project implements Model Context Protocol (MCP) tool-calling with Ollama, allowing language models to interact with external tools and APIs. Here's how to use this feature:

### Basic Usage

```typescript
import { ollamaClient } from './server/ollama';
import { enhanceOllamaWithMcp } from './server/ollama/ollamaMcpIntegration';

// Enhance the Ollama client with MCP capabilities
const mcpEnabledOllamaClient = enhanceOllamaWithMcp(ollamaClient);

// Use the enhanced client for chat
const response = await mcpEnabledOllamaClient.chat({
  model: 'llama3.2-vision:latest', // Or any function-calling compatible model
  messages: [
    { role: 'user', content: 'What is the current weather in San Francisco?' }
  ]
});
```

### Controlling Tool Access

You can specify which MCP tools should be enabled for a specific request:

```typescript
const response = await mcpEnabledOllamaClient.chat({
  model: 'llama3.2-vision:latest',
  messages: [{ role: 'user', content: 'Show me my latest Oura ring data' }],
  enabledMcpTools: ['get_sleep_data', 'get_activity_data'] // Only enable specific tools
});
```

### Streaming Support

MCP tool calling also works with streaming responses:

```typescript
const chatStream = mcpEnabledOllamaClient.streamingChat({
  model: 'llama3.2-vision:latest',
  messages: [{ role: 'user', content: 'What were my sleep patterns last week?' }]
});

for await (const chunk of chatStream) {
  // Process streaming chunks
  console.log(chunk.message?.content || '');
  
  // Tool calls will be processed after streaming completes
}
```

### Debugging

To enable detailed MCP tool-calling logs, set the environment variable:

```
DEBUG_MCP_TOOLS=true
```

This will log available tools, tool calls, and execution results to help with troubleshooting.

## Known Issues

- **ngrok 403 Forbidden Error**: When accessing the Ollama server through ngrok, you might encounter HTTP 403 Forbidden errors. This can happen due to ngrok's authorization policies or rate limiting. Try reconnecting ngrok or upgrading to a paid plan if you encounter this issue consistently.

- **zrok Public Share TLS Errors**: When using zrok's public share mode (not tcpTunnel), various TLS protocol errors may occur (e.g., `tlsv1 alert protocol version` or `packet length too long`). These issues are related to TLS version incompatibilities between clients and zrok's TLS termination. The tcpTunnel mode bypasses these issues by using raw TCP tunneling.

- **Connection Limit Errors**: Free tier zrok accounts may have connection limits that result in `ignoring connection, already have max connections` errors. Consider upgrading to a paid tier if you need more concurrent connections.

## Support

For issues and questions:
- Create GitHub issue for bugs
- Check documentation for setup help
- Review API examples for integration

---

**Built with privacy-first principles for personal health insights**
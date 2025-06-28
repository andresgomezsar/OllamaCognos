# LM Studio Integration Guide

This guide explains how to use LM Studio as your AI provider through its native MCP support in OllamaCognos.

## Prerequisites

- LM Studio version 0.3.17 or higher (required for MCP support)
- A compatible local model loaded in LM Studio
- OllamaCognos properly configured and running

## Setup

### Step 1: Configure LM Studio

1. Download and install the latest version of [LM Studio](https://lmstudio.ai/) (v0.3.17+)
2. Open LM Studio and load a compatible local model
3. Go to Settings > API Server
4. Enable the API Server and note the server URL (default: `http://localhost:1234`)
5. Ensure "Enable MCP hosting" is checked (this enables Model Context Protocol support)

### Step 2: Configure OllamaCognos

You can configure OllamaCognos to use LM Studio as your AI provider in two ways:

#### Option 1: Environment Variables (System-wide)

Add the following environment variables to your system:

```bash
# Set LM Studio as the default provider
DEFAULT_PROVIDER=lmstudio

# Set LM Studio API URL
LMSTUDIO_URL=http://localhost:1234
```

#### Option 2: User Settings (User-specific)

You can update your user settings in the application to use LM Studio:

1. Navigate to Settings in the OllamaCognos UI
2. Enable the "Use LM Studio" option
3. Enter the LM Studio URL (default: `http://localhost:1234`)
4. Optionally, select your preferred model from the dropdown

## Using LM Studio

Once configured, OllamaCognos will automatically:

- Connect to your LM Studio instance
- Retrieve available models
- Run AI completions through LM Studio
- Access MCP server tools provided by LM Studio

### Switching Between Providers

You can switch between LM Studio and Ollama providers:

1. Navigate to Settings in OllamaCognos
2. Toggle the "Use LM Studio" option to switch between providers
3. The application will automatically use your selected provider for all AI operations

### Verifying Connection

To verify your LM Studio connection:

1. Check the status indicator in the OllamaCognos UI
2. The indicator will show "Connected" when successfully linked to LM Studio
3. You can view detailed connection information in the system status page

## Troubleshooting

### Common Issues

- **Connection Failed**: Ensure LM Studio is running and the API server is enabled
- **Model Not Found**: Make sure you've loaded a model in LM Studio before connecting
- **Compatibility Issues**: Verify you're using LM Studio v0.3.17 or higher
- **Performance Problems**: Try using a smaller model if responses are slow

### Advanced Configuration

For advanced users, you can modify additional settings in the `.env` file:

```
# Override default provider
DEFAULT_PROVIDER=lmstudio

# Configure LM Studio API URL
LMSTUDIO_URL=http://localhost:1234

# Set specific model to use
LMSTUDIO_MODEL=your-model-name
```

## Support

If you encounter any issues with the LM Studio integration:

- Check that both LM Studio and OllamaCognos are updated to the latest versions
- Verify that your model is properly loaded in LM Studio
- Ensure the API server is running in LM Studio
- Check the application logs for detailed error information

For additional assistance, please submit an issue on the project's GitHub repository.

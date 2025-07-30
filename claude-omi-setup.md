# 🤖 Claude + Omi MCP Server Setup

This guide shows you how to connect Claude Desktop to your Omi data using the MCP (Model Context Protocol) server we built.

## ✅ What You Have Ready

- ✅ **Standalone Omi MCP Server**: `standalone-omi-mcp-server.js`
- ✅ **Working API Connection**: Your API key `omi_mcp_b8fa06d24743d3689eb28cd232d70c71` is validated
- ✅ **Real Data Access**: Andy's memories and conversations are being retrieved successfully

## 🔧 Claude Desktop Configuration

### Option 1: Quick Setup (Recommended)

1. **Find your Claude config file location**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Edit the config file** and add this configuration:

```json
{
  "mcpServers": {
    "omi": {
      "command": "node",
      "args": ["/Users/andresgomezsarmiento/Documents/GitHub/OllamaCognos/standalone-omi-mcp-server.js"],
      "env": {
        "OMI_API_KEY": "omi_mcp_b8fa06d24743d3689eb28cd232d70c71"
      }
    }
  }
}
```

### Option 2: Portable Setup

For easier distribution, create a wrapper script:

**Create `run-omi-mcp.sh`:**
```bash
#!/bin/bash
export OMI_API_KEY="omi_mcp_b8fa06d24743d3689eb28cd232d70c71"
cd "/Users/andresgomezsarmiento/Documents/GitHub/OllamaCognos"
node standalone-omi-mcp-server.js
```

**Then use this Claude config:**
```json
{
  "mcpServers": {
    "omi": {
      "command": "/Users/andresgomezsarmiento/Documents/GitHub/OllamaCognos/run-omi-mcp.sh"
    }
  }
}
```

## 🧪 Testing the Connection

1. **Restart Claude Desktop** after updating the config
2. **Start a new conversation** in Claude
3. **Test with these prompts**:

```
What memories do I have in Omi?
```

```
Show me my recent conversations from Omi
```

```
What did Andy discuss with his dad about AI?
```

## 🔍 Verification

Claude should now have access to these Omi tools:

1. **`get_memories`** - Retrieve your Omi memories
2. **`create_memory`** - Create new memories in Omi  
3. **`get_conversations`** - List your conversation metadata
4. **`get_conversation_by_id`** - Get full conversation transcripts

## 🎯 Available Data

Claude will be able to access Andy's real data including:

**📝 Memories:**
- "Andy had a conversation with his dad about AI and the company"
- "Andy is looking for investment opportunities for his startup" 
- "Andy is deciding whether to transfer money from Rover or leave it in his Discover savings"

**💬 Conversations:**
- Recent conversations from July 29-30, 2025
- Full transcripts and metadata
- Conversation categorization and timing

## 🚨 Important Notes

1. **Security**: Your API key is embedded in the config. Keep this file secure.
2. **Path**: Update the absolute path if you move the project directory
3. **Restart Required**: Claude Desktop needs to be restarted after config changes
4. **Node.js Required**: Ensure Node.js is in your system PATH

## 🔧 Troubleshooting

**If Claude can't connect:**
1. Check that the file path is correct
2. Ensure Node.js is installed and in PATH
3. Verify the API key is valid
4. Check Claude Desktop logs for error messages

**Test standalone server manually:**
```bash
export OMI_API_KEY="omi_mcp_b8fa06d24743d3689eb28cd232d70c71"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node standalone-omi-mcp-server.js
```

## 🎉 Success!

Once configured, Claude will be able to:
- Read Andy's memories and provide personalized responses
- Access conversation history for context
- Create new memories based on conversations
- Provide insights based on Omi data patterns

**Your Omi data is now available to Claude for intelligent, personalized interactions!**
#!/bin/bash
# Omi MCP Server Configuration Script
# Run: source omi-config.sh && npm run dev

echo "🔧 Setting up Omi MCP Server configuration..."

# Omi API Configuration
export OMI_API_KEY="omi_mcp_b8fa06d24743d3689eb28cd232d70c71"
export OMI_API_BASE_URL="https://api.omi.me/v1/mcp/"

echo "✅ OMI_API_KEY configured"
echo "✅ OMI_API_BASE_URL configured" 
echo ""
echo "🚀 Environment ready! You can now run:"
echo "   npm run dev"
echo ""
echo "💡 To make this permanent, add these to your .env file:"
echo "   OMI_API_KEY=omi_mcp_b8fa06d24743d3689eb28cd232d70c71"
echo "   OMI_API_BASE_URL=https://api.omi.me/v1/mcp/"
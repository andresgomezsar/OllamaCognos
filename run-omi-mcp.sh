#!/bin/bash
# Omi MCP Server Wrapper Script for Claude Desktop
# This script sets up the environment and runs the standalone Omi MCP server

export OMI_API_KEY="omi_mcp_b8fa06d24743d3689eb28cd232d70c71"
export OMI_API_BASE_URL="https://api.omi.me/v1/mcp/"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project directory
cd "$SCRIPT_DIR"

# Run the standalone MCP server
node standalone-omi-mcp-server.js
/**
 * MCP Index - Main entry point for MCP integration
 */
import { mcpRouter, mcpRoutingService, initMcpServers } from './mcpRouter.js';
import { ouraTools } from './oura/ouraTools.js';
import { ouraPrompts } from './oura/ouraPrompts.js';

// Initialize all MCP servers on startup
export function initializeMcpSystem() {
  console.log('Initializing MCP system...');
  initMcpServers();
}

// Re-export components from mcpRouter for use in the application
export { mcpRouter, mcpRoutingService };

// Export tool and prompt libraries
export { ouraTools, ouraPrompts, initMcpServers };

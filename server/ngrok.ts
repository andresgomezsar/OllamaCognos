import ngrok from 'ngrok';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { URL } from 'url';

interface NgrokConfig {
  port: number;
  authtoken?: string;
  region?: string;
  subdomain?: string;
  basicAuth?: string; // username:password format
  hostHeader?: string;
}

export class NgrokService {
  private tunnel: string | null = null;
  private isConnected = false;

  async startTunnel(config: NgrokConfig): Promise<string> {
    try {
      // Configure ngrok if authtoken is provided
      if (config.authtoken) {
        await ngrok.authtoken(config.authtoken);
      }

      // Start the tunnel
      const url = await ngrok.connect({
        port: config.port,
        region: (config.region as any) || 'us',
        subdomain: config.subdomain,
        proto: 'http',
        basicAuth: config.basicAuth,
        hostHeader: config.hostHeader
      });

      this.tunnel = url;
      this.isConnected = true;

      console.log(`Ngrok tunnel started: ${url}`);
      console.log(`Ollama-compatible endpoint available at: ${url}/api/chat/completions`);
      
      return url;
    } catch (error) {
      console.error('Failed to start ngrok tunnel:', error);
      throw new Error(`Ngrok tunnel failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopTunnel(): Promise<void> {
    try {
      if (this.isConnected) {
        await ngrok.disconnect();
        await ngrok.kill();
        this.tunnel = null;
        this.isConnected = false;
        console.log('Ngrok tunnel stopped');
      }
    } catch (error) {
      console.error('Error stopping ngrok tunnel:', error);
    }
  }

  getTunnelUrl(): string | null {
    return this.tunnel;
  }

  isActive(): boolean {
    return this.isConnected;
  }

  getApiEndpoints(): { [key: string]: string } | null {
    if (!this.tunnel) return null;

    return {
      chatCompletions: `${this.tunnel}/api/chat/completions`,
      healthData: `${this.tunnel}/api/health`,
      mcpTools: `${this.tunnel}/api/mcp/tools`,
      status: `${this.tunnel}/api/status`,
      websocket: `${this.tunnel.replace('https://', 'wss://').replace('http://', 'ws:')}/ws`
    };
  }

  async getConnectionInfo(): Promise<any> {
    try {
      const api = await ngrok.getApi();
      if (api) {
        const tunnels = await api.listTunnels();
        return {
          tunnels,
          isActive: this.isConnected,
          currentUrl: this.tunnel
        };
      }
      return {
        tunnels: [],
        isActive: this.isConnected,
        currentUrl: this.tunnel
      };
    } catch (error) {
      return {
        tunnels: [],
        isActive: this.isConnected,
        currentUrl: this.tunnel,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const ngrokService = new NgrokService();

// Function to test if a URL endpoint is accessible
async function testEndpoint(url: string): Promise<boolean> {
  try {
    // Try to make a request to the URL
    await axios.get(url, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to ask user for input
async function askUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to update the .env file with the new ngrok endpoint
async function updateEnvFile(endpoint: string): Promise<void> {
  try {
    // Find the .env file path
    const envPath = path.resolve(process.cwd(), '.env');
    
    // Read the current .env content
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      // File might not exist yet
      console.log('Creating new .env file');
    }

    // Check if NGROK_ENDPOINT already exists
    const regex = /^NGROK_ENDPOINT=.*/m;
    if (regex.test(envContent)) {
      // Replace existing value
      envContent = envContent.replace(regex, `NGROK_ENDPOINT=${endpoint}`);
    } else {
      // Add new entry
      envContent += `\nNGROK_ENDPOINT=${endpoint}`;
    }

    // Write back to the .env file
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env file with new ngrok endpoint');
    
    // Reload environment variables
    dotenv.config();
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Auto-start tunnel if environment variables are set
export async function initializeNgrok(): Promise<void> {
  const enableNgrok = process.env.ENABLE_NGROK === 'true';
  const ngrokAuthToken = process.env.NGROK_AUTH_TOKEN;
  const port = parseInt(process.env.PORT || '5000');
  
  // Get cached ngrok endpoint if available
  let cachedNgrokEndpoint = process.env.NGROK_ENDPOINT;
  
  // Check for Ollama tunnel configuration
  const enableOllamaTunnel = process.env.ENABLE_OLLAMA_TUNNEL === 'true';
  const ollamaPort = parseInt(process.env.OLLAMA_PORT || '11434');
  const ollamaAuth = process.env.OLLAMA_TUNNEL_AUTH;

  // First check if we have a cached ngrok endpoint and test it
  if (cachedNgrokEndpoint) {
    console.log(`Testing cached ngrok endpoint: ${cachedNgrokEndpoint}`);
    
    try {
      // Construct a valid URL for testing
      let testUrl = cachedNgrokEndpoint;
      
      // Make sure the URL has a protocol
      if (!testUrl.startsWith('http')) {
        testUrl = `https://${testUrl}`;
      }
      
      // If the URL doesn't end with a specific endpoint, add /api/health for testing
      if (new URL(testUrl).pathname === '/' || !new URL(testUrl).pathname) {
        testUrl = `${testUrl.replace(/\/$/, '')}/api/health`;
      }
      
      const isEndpointWorking = await testEndpoint(testUrl);
      
      if (isEndpointWorking) {
        console.log('✅ Cached ngrok endpoint is working!');
        
        // Log available endpoints using the cached URL
        const baseUrl = cachedNgrokEndpoint.replace(/\/$/, '');
        console.log('\n🌐 External API Endpoints:');
        console.log(`   Chat Completions: ${baseUrl}/api/chat/completions`);
        console.log(`   Health Data: ${baseUrl}/api/health`);
        console.log(`   MCP Tools: ${baseUrl}/api/mcp/tools`);
        console.log(`   WebSocket: ${baseUrl.replace('https://', 'wss://').replace('http://', 'ws:')}/ws`);
        console.log('\n   Use these URLs to connect external applications to your AI assistant\n');
        
        // Set the tunnel URL in the ngrok service
        ngrokService.startTunnel = async () => baseUrl; // Override startTunnel to return cached URL
        (ngrokService as any).tunnel = baseUrl; // Use type casting to set private property
        (ngrokService as any).isConnected = true; // Use type casting to set private property
        
        return; // Skip creating a new tunnel since cached one works
      } else {
        console.log('❌ Cached ngrok endpoint is not working. Need to create a new tunnel or get endpoint from user.');
      }
    } catch (error) {
      console.error('Error testing cached ngrok endpoint:', error);
    }
  }
  
  // If we get here, either there was no cached endpoint or it wasn't working
  if (enableNgrok) {
    try {
      await ngrokService.startTunnel({
        port,
        authtoken: ngrokAuthToken,
        region: process.env.NGROK_REGION || 'us',
        subdomain: process.env.NGROK_SUBDOMAIN
      });

      // Log available endpoints
      const endpoints = ngrokService.getApiEndpoints();
      if (endpoints) {
        console.log('\n🌐 External API Endpoints:');
        console.log(`   Chat Completions: ${endpoints.chatCompletions}`);
        console.log(`   Health Data: ${endpoints.healthData}`);
        console.log(`   MCP Tools: ${endpoints.mcpTools}`);
        console.log(`   WebSocket: ${endpoints.websocket}`);
        console.log('\n   Use these URLs to connect external applications to your AI assistant\n');
      }
      
      // Cache the successful ngrok URL in the .env file
      await updateEnvFile(ngrokService.getTunnelUrl() || '');
    } catch (error) {
      console.error('Failed to initialize ngrok:', error);
      
      // If automatic tunnel creation fails, ask the user for a manual endpoint
      try {
        console.log('\nAutomatic ngrok tunnel creation failed. You can provide a manual ngrok endpoint.');
        const manualEndpoint = await askUser('Enter your ngrok endpoint (or leave empty to skip): ');
        
        if (manualEndpoint) {
          // Test the manual endpoint
          let testUrl = manualEndpoint;
          if (!testUrl.startsWith('http')) {
            testUrl = `https://${testUrl}`;
          }
          
          const isWorking = await testEndpoint(testUrl);
          if (isWorking) {
            console.log('✅ Manual endpoint is working!');
            await updateEnvFile(manualEndpoint);
            
            // Set the tunnel URL in the service (using type assertion to access private properties)
            (ngrokService as any).tunnel = manualEndpoint;
            (ngrokService as any).isConnected = true;
          } else {
            console.log('❌ Manual endpoint test failed. Continuing without ngrok.');
          }
        }
      } catch (inputError) {
        console.error('Error processing manual endpoint:', inputError);
      }
    }
  }
  
  // Start a separate tunnel for Ollama if enabled
  if (enableOllamaTunnel && ngrokAuthToken) {
    try {
      console.log('\n🚀 Starting secure tunnel for Ollama server...');
      await ngrok.authtoken(ngrokAuthToken);
      
      const ollamaUrl = await ngrok.connect({
        addr: ollamaPort,
        region: (process.env.NGROK_REGION as any) || 'us',
        subdomain: process.env.OLLAMA_SUBDOMAIN,
        proto: 'http',
        basicAuth: ollamaAuth, // Apply basic auth if provided as username:password
        hostHeader: `localhost:${ollamaPort}` // Important for Ollama to work correctly
      });
      
      console.log(`\n🔒 Secure Ollama tunnel established at: ${ollamaUrl}`);
      console.log('   This endpoint requires authentication and can be used as a remote Ollama server');
      console.log('   Use this URL in client applications as your Ollama server URL');
    } catch (error) {
      console.error('Failed to initialize Ollama tunnel:', error);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down ngrok tunnel...');
    await ngrokService.stopTunnel();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await ngrokService.stopTunnel();
    process.exit(0);
  });
}
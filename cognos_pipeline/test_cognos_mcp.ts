// Import from top-level package with our type declarations
import { McpClient, StdioClientTransport } from "@modelcontextprotocol/sdk";
import { spawnSync } from "child_process";
import * as path from "path";

async function main() {
  console.log("Starting Cognos MCP client test...");

  try {
    // Start the server in a child process
    console.log("Starting Cognos MCP server...");
    const serverProcess = spawnSync("node", [
      "-e",
      `import("./cognos-mcp-server.js").then(mod => mod.startCognosServer())`
    ], { 
      cwd: path.resolve(process.cwd(), "cognos_pipeline"),
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8"
    });

    if (serverProcess.error) {
      console.error("Failed to start server:", serverProcess.error);
      return;
    }

    // Create MCP client
    const transport = new StdioClientTransport({
      command: "node",
      args: ["-e", "import('./cognos-mcp-server.js').then(mod => mod.startCognosServer())"]
    });
    const client = new McpClient(transport);

    console.log("Connecting to Cognos MCP server...");
    await client.connect();

    // Get server info
    console.log("Server information:", await client.getServerInfo());

    // Test 1: Platform status resource
    try {
      console.log("\nTesting platform status resource...");
      const statusResource = await client.readResource({ uri: "cognos://platform/status" });
      console.log("Platform status:", JSON.parse(statusResource.contents[0].text));
    } catch (error) {
      console.error("Error reading platform status:", error);
    }

    // Test 2: Get biomarkers tool
    try {
      console.log("\nTesting get_cognos_biomarkers tool...");
      const biomarkerResult = await client.callTool({
        name: "get_cognos_biomarkers",
        params: {
          time_range: {
            start_date: "2025-06-16T00:00:00Z",
            end_date: "2025-06-17T23:59:59Z"
          },
          data_sources: {
            limitless_pendant: true,
            oura_ring: true,
            apple_health: false
          },
          analysis_type: "summary"
        }
      });
      console.log("Biomarker result:", JSON.parse(biomarkerResult.content[0].text));
    } catch (error) {
      console.error("Error getting biomarkers:", error);
    }

    // Test 3: Connect Omi device tool
    try {
      console.log("\nTesting connect_omi_device tool...");
      const omiResult = await client.callTool({
        name: "connect_omi_device",
        params: {
          device_id: "test-device-001",
          scan_timeout: 5,
          enable_live_transcription: true
        }
      });
      console.log("Omi connection result:", JSON.parse(omiResult.content[0].text));
    } catch (error) {
      console.error("Error connecting to Omi device:", error);
    }

    console.log("\nCognos MCP client test completed");
    await client.disconnect();
  } catch (error) {
    console.error("Error in MCP client test:", error);
  }
}

main().catch(console.error);

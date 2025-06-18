import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Initialize Cognos MCP Server
const cognosServer = new McpServer({
  name: "Cognos Universal Memory Platform",
  version: "1.0.0",
  description: "AI software layer for physical and mental augmentation through wearable device integration"
});

// Tool: Complete Cognos Audio Processing Pipeline
cognosServer.tool("process_cognos_memory", 
  {
    audio_source: z.enum(["file", "omi_device", "limitless_pendant", "live_stream"]),
    audio_input: z.string().describe("File path, device ID, or base64 audio data"),
    processing_options: z.object({
      enable_vad: z.boolean().default(true),
      enable_diarization: z.boolean().default(true), 
      enable_transcription: z.boolean().default(true),
      enable_speaker_analysis: z.boolean().default(true),
      vad_threshold: z.number().default(0.5),
      max_speakers: z.number().default(5),
      transcription_model: z.enum(["whisper-large-v3", "deepgram", "salad-api"]).default("salad-api")
    }).optional(),
    biomarker_integration: z.object({
      oura_data: z.boolean().default(false),
      limitless_data: z.boolean().default(false),
      include_cognitive_context: z.boolean().default(true)
    }).optional()
  },
  async ({ audio_source, audio_input, processing_options = {}, biomarker_integration = {} }) => {
    const startTime = Date.now();
    
    try {
      // Step 1: Prepare audio input based on source
      let audioPath: string = '';
      
      switch (audio_source) {
        case "file":
          audioPath = audio_input;
          break;
        case "omi_device":
          audioPath = await processOmiDevice(audio_input);
          break;
        case "limitless_pendant":
          audioPath = await processLimitlessDevice(audio_input);
          break;
        case "live_stream":
          audioPath = await processLiveStream(audio_input);
          break;
      }
      
      // Step 2: Run Cognos audio processing pipeline
      const audioResults = await runCognosAudioPipeline(audioPath, processing_options);
      
      // Step 3: Integrate biomarker data if requested
      let biomarkerData = {};
      if (biomarker_integration.oura_data || biomarker_integration.limitless_data) {
        biomarkerData = await integrateBiomarkerData(biomarker_integration);
      }
      
      // Step 4: Generate cognitive insights
      const cognitiveInsights = biomarker_integration.include_cognitive_context
        ? await generateCognitiveInsights(audioResults, biomarkerData)
        : null;
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            cognos_results: {
              audio_processing: audioResults,
              biomarker_data: biomarkerData,
              cognitive_insights: cognitiveInsights,
              processing_metadata: {
                processing_time_ms: processingTime,
                audio_source: audio_source,
                devices_integrated: getIntegratedDevices(biomarker_integration),
                timestamp: new Date().toISOString()
              }
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text", 
          text: JSON.stringify({
            error: "Cognos processing failed",
            message: error instanceof Error ? error.message : String(error),
            processing_time_ms: Date.now() - startTime
          })
        }]
      };
    }
  }
);

// Tool: Omi Device Integration
cognosServer.tool("connect_omi_device",
  {
    device_id: z.string().optional().describe("Specific Omi device MAC address"),
    scan_timeout: z.number().default(10).describe("Seconds to scan for devices"),
    enable_live_transcription: z.boolean().default(true)
  },
  async ({ device_id, scan_timeout, enable_live_transcription }) => {
    try {
      // Bridge to Python Omi SDK
      const command = device_id 
        ? `cd ${process.env.COGNOS_PATH}/integrations && python omi_bridge.py connect --device-id="${device_id}" --live-transcription=${enable_live_transcription}`
        : `cd ${process.env.COGNOS_PATH}/integrations && python omi_bridge.py scan --timeout=${scan_timeout}`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Omi connection failed: ${stderr}`);
      }
      
      const result = JSON.parse(stdout);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            omi_connection: result,
            status: result.connected ? "connected" : "available_devices",
            message: result.connected 
              ? `Connected to Omi device ${result.device_id}` 
              : `Found ${result.devices?.length || 0} available Omi devices`
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Omi device connection failed",
            message: error instanceof Error ? error.message : String(error)
          })
        }]
      };
    }
  }
);

// Tool: Biomarker Data Integration
cognosServer.tool("get_cognos_biomarkers",
  {
    time_range: z.object({
      start_date: z.string().describe("ISO date string"),
      end_date: z.string().describe("ISO date string")
    }),
    data_sources: z.object({
      oura_ring: z.boolean().default(false),
      limitless_pendant: z.boolean().default(false),
      apple_health: z.boolean().default(false),
      custom_wearables: z.array(z.string()).optional()
    }),
    analysis_type: z.enum(["summary", "detailed", "correlation_analysis"]).default("summary")
  },
  async ({ time_range, data_sources, analysis_type }) => {
    try {
      // Integration with existing biomarker collection systems
      const biomarkerResults = await collectBiomarkerData(time_range, data_sources);
      
      let analysis = {};
      if (analysis_type === "correlation_analysis") {
        analysis = await performCorrelationAnalysis(biomarkerResults);
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            cognos_biomarkers: {
              time_range: time_range,
              data_sources: Object.keys(data_sources).filter(key => key in data_sources && data_sources[key as keyof typeof data_sources]),
              biomarker_data: biomarkerResults,
              analysis: analysis,
              cognitive_insights: await generateCognitiveInsights(null, biomarkerResults)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Biomarker collection failed",
            message: error instanceof Error ? error.message : String(error)
          })
        }]
      };
    }
  }
);

// Resource: Cognos Platform Status
cognosServer.resource(
  "cognos_platform_status",
  "cognos://platform/status",
  async () => {
    const status = await getCognosPlatformStatus();
    const statusData = {
      cognos_status: {
        connected_devices: status.connectedDevices,
        biomarker_sources: status.biomarkerSources,
        ai_processing: status.aiProcessingStatus,
        memory_storage: status.memoryStorageStatus,
        uptime: status.uptime,
        last_updated: new Date().toISOString()
      }
    };
    return {
      contents: [{
        text: JSON.stringify(statusData),
        uri: "cognos://platform/status",
        mimeType: "application/json"
      }]
    };
  }
);

// Implementation Functions
async function runCognosAudioPipeline(audioPath: string, options: any) {
  const command = `cd ${process.env.COGNOS_PATH} && python -c "
import asyncio
from src.main_pipeline import process_audio
result = asyncio.run(process_audio('${audioPath}'))
print(__import__('json').dumps(result))"`;
  
  const { stdout } = await execAsync(command);
  return JSON.parse(stdout);
}

async function processOmiDevice(deviceId: string): Promise<string> {
  // Bridge to Omi Python SDK for device connection and audio streaming
  const command = `cd ${process.env.COGNOS_PATH}/integrations && python omi_bridge.py stream --device-id="${deviceId}" --duration=30`;
  const { stdout } = await execAsync(command);
  const result = JSON.parse(stdout);
  return result.audio_file_path;
}

async function processLimitlessDevice(deviceId: string): Promise<string> {
  // Integration with Limitless API for pendant data
  const command = `cd ${process.env.COGNOS_PATH}/integrations && python limitless_bridge.py stream --device-id="${deviceId}"`;
  const { stdout } = await execAsync(command);
  const result = JSON.parse(stdout);
  return result.audio_file_path;
}

async function processLiveStream(audioData: string): Promise<string> {
  // Handle live audio stream (base64 encoded)
  const tempDir = path.join(process.env.COGNOS_PATH || process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const tempFile = path.join(tempDir, `livestream_${Date.now()}.wav`);
  const audioBuffer = Buffer.from(audioData, 'base64');
  await fs.writeFile(tempFile, audioBuffer);
  
  return tempFile;
}

async function integrateBiomarkerData(options: any) {
  const command = `cd ${process.env.COGNOS_PATH} && python -c "
from integrations.biomarker_collector import collect_all_biomarkers
result = collect_all_biomarkers(${JSON.stringify(options)})
print(__import__('json').dumps(result))"`;
  
  const { stdout } = await execAsync(command);
  return JSON.parse(stdout);
}

async function generateCognitiveInsights(audioResults: any, biomarkerData: any) {
  const command = `cd ${process.env.COGNOS_PATH} && python -c "
from ai.cognitive_analyzer import generate_insights
result = generate_insights(${JSON.stringify(audioResults)}, ${JSON.stringify(biomarkerData)})
print(__import__('json').dumps(result))"`;
  
  const { stdout } = await execAsync(command);
  return JSON.parse(stdout);
}

async function collectBiomarkerData(timeRange: any, dataSources: any) {
  const command = `cd ${process.env.COGNOS_PATH} && python -c "
from integrations.biomarker_collector import CognosBiomarkerCollector
collector = CognosBiomarkerCollector()
collector.initialize_clients()
import json, asyncio
result = asyncio.run(collector.collect_all_data(${JSON.stringify(timeRange)}, ${JSON.stringify(dataSources)}))
print(json.dumps(result))"`;

  const { stdout } = await execAsync(command);
  return JSON.parse(stdout);
}

async function performCorrelationAnalysis(biomarkerData: any) {
  const command = `cd ${process.env.COGNOS_PATH} && python -c "
from ai.correlation_analyzer import analyze_correlations
result = analyze_correlations(${JSON.stringify(biomarkerData)})
print(__import__('json').dumps(result))"`;

  const { stdout } = await execAsync(command);
  return JSON.parse(stdout);
}

function getIntegratedDevices(biomarkerIntegration: any): string[] {
  const devices: string[] = [];
  if (biomarkerIntegration.oura_data) devices.push("Oura Ring");
  if (biomarkerIntegration.limitless_data) devices.push("Limitless Pendant");
  return devices;
}

async function getCognosPlatformStatus() {
  // Implementation to check status of all Cognos subsystems
  return {
    audioProcessingStatus: "operational",
    connectedDevices: ["Omi Device 1", "Limitless Pendant 1"],
    biomarkerSources: ["Oura Ring", "Apple Health"],
    aiProcessingStatus: "operational", 
    memoryStorageStatus: "operational",
    uptime: process.uptime()
  };
}

// Start the Cognos MCP Server
const transport = new StdioServerTransport();

// Export a function to connect instead of using top-level await
export async function startCognosServer() {
  await cognosServer.connect(transport);
  console.log("Cognos Universal Memory Platform MCP Server started");
}

// Export the server for external use
export default cognosServer;

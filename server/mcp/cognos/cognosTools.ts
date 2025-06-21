import { z } from 'zod';
import { Tool } from '../types.js';
import { MemoryFilterOptions } from './omiMemoryClient.js';

/**
 * MCP tools for Cognos audio processing system
 * Provides access to audio processing features including VAD, diarization, and transcription
 */

// Tool definition for processing audio via the Cognos audio pipeline
export const processCognosAudioTool: Tool = {
  name: "process_cognos_audio",
  description: "Process audio through the Cognos pipeline with VAD, diarization, and transcription capabilities",
  inputSchema: {
    type: "object",
    properties: {
      audio_file_path: {
        type: "string",
        description: "Path to the audio file to process"
      },
      enable_vad: {
        type: "boolean",
        description: "Enable Voice Activity Detection"
      },
      enable_diarization: {
        type: "boolean",
        description: "Enable speaker diarization"
      },
      enable_transcription: {
        type: "boolean",
        description: "Enable audio transcription"
      }
    },
    required: ["audio_file_path"]
  }
};

// Tool definition for streaming audio from Omi necklace (if connecting directly to Omi hardware)
export const streamOmiAudioTool: Tool = {
  name: "stream_omi_audio",
  description: "Stream audio directly from an Omi necklace device and process it through the Cognos pipeline",
  inputSchema: {
    type: "object",
    properties: {
      device_id: {
        type: "string",
        description: "Optional Omi device ID to connect to"
      },
      duration_seconds: {
        type: "number",
        description: "Duration to stream audio in seconds"
      },
      enable_vad: {
        type: "boolean",
        description: "Enable Voice Activity Detection"
      },
      enable_diarization: {
        type: "boolean",
        description: "Enable speaker diarization"
      },
      enable_transcription: {
        type: "boolean",
        description: "Enable audio transcription"
      }
    },
    required: []
  }
};

// Define Zod schemas for validation in the server code
export const processCognosAudioSchema = z.object({
  audio_file_path: z.string().describe("Path to the audio file to process"),
  enable_vad: z.boolean().default(true).describe("Enable Voice Activity Detection"),
  enable_diarization: z.boolean().default(true).describe("Enable speaker diarization"),
  enable_transcription: z.boolean().default(true).describe("Enable audio transcription")
});

export const streamOmiAudioSchema = z.object({
  device_id: z.string().optional().describe("Optional Omi device ID to connect to"),
  duration_seconds: z.number().min(1).max(60).default(10).describe("Duration to stream audio in seconds"),
  enable_vad: z.boolean().default(true).describe("Enable Voice Activity Detection"),
  enable_diarization: z.boolean().default(true).describe("Enable speaker diarization"),
  enable_transcription: z.boolean().default(true).describe("Enable audio transcription")
});

// Omi Memory Tools
export const getMemoriesTool: Tool = {
  name: "get_memories",
  description: "Retrieve a list of user memories from Omi",
  inputSchema: {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "The user's unique identifier"
      },
      limit: {
        type: "number",
        description: "Maximum number of memories to retrieve (default: 100)"
      },
      categories: {
        type: "array",
        description: "Categories of memories to retrieve"
        // TypeScript lint error: 'items' property not supported in the Tool interface
        // Removed: items: { type: "string", enum: Object.values(MemoryFilterOptions) }
      }
    },
    required: ["uid"]
  }
};

export const createMemoryTool: Tool = {
  name: "create_memory",
  description: "Create a new memory in Omi",
  inputSchema: {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "The user's unique identifier"
      },
      content: {
        type: "string",
        description: "Content of the memory"
      },
      category: {
        type: "string",
        enum: Object.values(MemoryFilterOptions),
        description: "Category of the memory"
      }
    },
    required: ["uid", "content", "category"]
  }
};

export const createMemoryFromAudioTool: Tool = {
  name: "create_memory_from_audio",
  description: "Create a new memory in Omi from an audio file",
  inputSchema: {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "The user's unique identifier"
      },
      audio_file_path: {
        type: "string",
        description: "Path to the audio file"
      },
      category: {
        type: "string",
        enum: Object.values(MemoryFilterOptions),
        description: "Category of the memory"
      }
    },
    required: ["uid", "audio_file_path"]
  }
};

export const deleteMemoryTool: Tool = {
  name: "delete_memory",
  description: "Delete a memory by ID",
  inputSchema: {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "The user's unique identifier"
      },
      memory_id: {
        type: "string",
        description: "ID of the memory to delete"
      }
    },
    required: ["uid", "memory_id"]
  }
};

export const editMemoryTool: Tool = {
  name: "edit_memory",
  description: "Edit a memory's content",
  inputSchema: {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "The user's unique identifier"
      },
      memory_id: {
        type: "string",
        description: "ID of the memory to edit"
      },
      content: {
        type: "string",
        description: "New content for the memory"
      }
    },
    required: ["uid", "memory_id", "content"]
  }
};

export const getConversationsTool: Tool = {
  name: "get_conversations",
  description: "Retrieve a list of user conversations from Omi",
  inputSchema: {
    type: "object",
    properties: {
      uid: {
        type: "string",
        description: "The user's unique identifier"
      },
      include_discarded: {
        type: "boolean",
        description: "Whether to include discarded conversations (default: false)"
      },
      limit: {
        type: "number",
        description: "Maximum number of conversations to retrieve (default: 25)"
      }
    },
    required: ["uid"]
  }
};

// Zod Schemas for Omi Memory Tools
export const getMemoriesSchema = z.object({
  uid: z.string().describe("The user's unique identifier"),
  limit: z.number().positive().max(1000).default(100).describe("Maximum number of memories to retrieve"),
  categories: z.array(z.nativeEnum(MemoryFilterOptions)).optional().describe("Categories of memories to retrieve")
});

export const createMemorySchema = z.object({
  uid: z.string().describe("The user's unique identifier"),
  content: z.string().describe("Content of the memory"),
  category: z.nativeEnum(MemoryFilterOptions).describe("Category of the memory")
});

export const createMemoryFromAudioSchema = z.object({
  uid: z.string().describe("The user's unique identifier"),
  audio_file_path: z.string().describe("Path to the audio file"),
  category: z.nativeEnum(MemoryFilterOptions).default(MemoryFilterOptions.CONVERSATION).describe("Category of the memory")
});

export const deleteMemorySchema = z.object({
  uid: z.string().describe("The user's unique identifier"),
  memory_id: z.string().describe("ID of the memory to delete")
});

export const editMemorySchema = z.object({
  uid: z.string().describe("The user's unique identifier"),
  memory_id: z.string().describe("ID of the memory to edit"),
  content: z.string().describe("New content for the memory")
});

export const getConversationsSchema = z.object({
  uid: z.string().describe("The user's unique identifier"),
  include_discarded: z.boolean().default(false).describe("Whether to include discarded conversations"),
  limit: z.number().positive().max(100).default(25).describe("Maximum number of conversations to retrieve")
});

// Export all tools for the Cognos MCP server
export const cognosTools = [
  processCognosAudioTool,
  streamOmiAudioTool,
  getMemoriesTool,
  createMemoryTool,
  createMemoryFromAudioTool,
  deleteMemoryTool,
  editMemoryTool,
  getConversationsTool
];

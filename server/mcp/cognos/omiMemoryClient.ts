/**
 * Omi Memory API Client
 * 
 * Handles interactions with the Omi Memory API for retrieving and creating memories.
 */

import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Memory filter options based on documentation
export enum MemoryFilterOptions {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  MEETING = 'meeting',
  CONVERSATION = 'conversation',
  LECTURE = 'lecture',
  NOTE = 'note'
}

export interface MemoryTranscriptSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
  is_user: boolean;
  person_id?: string;
}

export interface StructuredMemoryData {
  title: string;
  overview: string;
  emoji: string;
  category: string;
  action_items: string[];
  events: any[]; // Calendar events
}

export interface Memory {
  id: string;
  created_at: string;
  started_at: string;
  finished_at: string;
  source: string;
  language: string;
  structured: StructuredMemoryData;
  transcript_segments: MemoryTranscriptSegment[];
  geolocation?: any;
  plugins_results?: any;
  external_data?: any;
  postprocessing: {
    status: string;
    model?: string;
    fail_reason?: string;
  };
  discarded: boolean;
  deleted: boolean;
  visibility: string;
}

/**
 * Client for interacting with Omi Memory API
 */
export class OmiMemoryClient {
  private client: AxiosInstance;
  private uid: string;
  
  constructor() {
    // Get API key and UID from environment
    const apiKey = process.env.OMI_API_KEY;
    this.uid = process.env.OMI_UID || '';
    
    if (!apiKey) {
      throw new Error('OMI_API_KEY environment variable is required');
    }
    
    if (!this.uid) {
      console.warn('OMI_UID not set in environment variables. You will need to provide UID for each request.');
    }
    
    // Setup axios client with base configuration
    this.client = axios.create({
      baseURL: process.env.OMI_API_ENDPOINT || 'https://api.omi.me/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Get memories for a user
   * 
   * @param uid User ID (optional, will use from environment if not provided)
   * @param limit Maximum number of memories to retrieve (default: 100)
   * @param categories Optional categories to filter by
   * @returns List of memories
   */
  async getMemories(
    uid?: string, 
    limit = 100, 
    categories: MemoryFilterOptions[] = []
  ): Promise<Memory[]> {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const params: any = { 
        limit 
      };
      
      if (categories && categories.length > 0) {
        params.categories = categories;
      }
      
      const response = await this.client.get(`/users/${userId}/memories`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get memories:', error.message);
      throw new Error(`Failed to get memories: ${error.message}`);
    }
  }
  
  /**
   * Create a new memory
   * 
   * @param content Content of the memory
   * @param category Category of the memory
   * @param uid User ID (optional, will use from environment if not provided)
   * @returns Created memory
   */
  async createMemory(
    content: string,
    category: MemoryFilterOptions,
    uid?: string
  ): Promise<Memory> {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const response = await this.client.post(`/users/${userId}/memories`, {
        content,
        category
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to create memory:', error.message);
      throw new Error(`Failed to create memory: ${error.message}`);
    }
  }
  
  /**
   * Create memory from audio file
   * 
   * @param audioFilePath Path to the audio file
   * @param category Category of the memory
   * @param uid User ID (optional, will use from environment if not provided)
   * @returns Created memory
   */
  async createMemoryFromAudio(
    audioFilePath: string,
    category: MemoryFilterOptions = MemoryFilterOptions.CONVERSATION,
    uid?: string
  ): Promise<Memory> {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const formData = new FormData();
      formData.append('audio', await this.fileToBlob(audioFilePath));
      formData.append('category', category);
      
      const response = await this.client.post(
        `/users/${userId}/memories/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create memory from audio:', error.message);
      throw new Error(`Failed to create memory from audio: ${error.message}`);
    }
  }
  
  /**
   * Delete a memory
   * 
   * @param memoryId ID of the memory to delete
   * @param uid User ID (optional, will use from environment if not provided)
   * @returns Status of the operation
   */
  async deleteMemory(memoryId: string, uid?: string): Promise<any> {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const response = await this.client.delete(`/users/${userId}/memories/${memoryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete memory:', error.message);
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }
  
  /**
   * Edit a memory
   * 
   * @param memoryId ID of the memory to edit
   * @param content New content for the memory
   * @param uid User ID (optional, will use from environment if not provided)
   * @returns Status of the operation
   */
  async editMemory(memoryId: string, content: string, uid?: string): Promise<any> {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const response = await this.client.put(`/users/${userId}/memories/${memoryId}`, {
        content
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to edit memory:', error.message);
      throw new Error(`Failed to edit memory: ${error.message}`);
    }
  }
  
  /**
   * Get conversations
   * 
   * @param uid User ID (optional, will use from environment if not provided)
   * @param includeDiscarded Whether to include discarded conversations (default: false)
   * @param limit Maximum number of conversations to retrieve (default: 25)
   * @returns List of conversations
   */
  async getConversations(
    uid?: string,
    includeDiscarded = false,
    limit = 25
  ): Promise<any[]> {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    try {
      const response = await this.client.get(`/users/${userId}/conversations`, {
        params: {
          include_discarded: includeDiscarded,
          limit
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get conversations:', error.message);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }
  
  /**
   * Helper method to convert a file to a Blob
   * 
   * @param filePath Path to the file
   * @returns Blob of the file
   */
  private async fileToBlob(filePath: string): Promise<Blob> {
    const fs = require('fs').promises;
    const buffer = await fs.readFile(filePath);
    return new Blob([buffer]);
  }
}

export default OmiMemoryClient;

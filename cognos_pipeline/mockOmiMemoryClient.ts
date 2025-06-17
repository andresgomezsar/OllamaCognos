/**
 * Mock Omi Memory API Client for testing
 * 
 * Mocks the interactions with the Omi Memory API for testing without real credentials.
 */

import { Memory, MemoryFilterOptions, MemoryTranscriptSegment, StructuredMemoryData } from '../server/mcp/cognos/omiMemoryClient';

// In-memory store for mock data
const memories: Record<string, Memory> = {};
let nextId = 1;

/**
 * Mock client for testing Omi Memory API interactions
 */
class MockOmiMemoryClient {
  private uid: string = 'test-user-id';
  
  constructor() {
    console.log('Mock Omi Memory API client initialized');
  }
  
  /**
   * Get memories for a user
   */
  async getMemories(
    uid?: string, 
    limit = 100, 
    categories: MemoryFilterOptions[] = []
  ): Promise<Memory[]> {
    const userId = uid || this.uid;
    const userMemories = Object.values(memories)
      .filter(memory => !memory.deleted)
      .slice(0, limit);
      
    return userMemories;
  }
  
  /**
   * Create a new memory
   */
  async createMemory(
    content: string,
    category: MemoryFilterOptions,
    uid?: string
  ): Promise<Memory> {
    const userId = uid || this.uid;
    const memoryId = `mem-${nextId++}`;
    
    const now = new Date().toISOString();
    
    const memory: Memory = {
      id: memoryId,
      created_at: now,
      started_at: now,
      finished_at: now,
      source: 'api',
      language: 'en',
      structured: {
        title: `Memory ${memoryId}`,
        overview: content.substring(0, 100),
        emoji: '📝',
        category: category,
        action_items: [],
        events: []
      },
      transcript_segments: [{
        speaker: 'user',
        start: 0,
        end: 0,
        text: content,
        is_user: true
      }],
      postprocessing: {
        status: 'completed'
      },
      discarded: false,
      deleted: false,
      visibility: 'private'
    };
    
    memories[memoryId] = memory;
    return memory;
  }
  
  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string, uid?: string): Promise<any> {
    const userId = uid || this.uid;
    
    if (!memories[memoryId]) {
      throw new Error(`Memory ${memoryId} not found`);
    }
    
    memories[memoryId].deleted = true;
    return { success: true, message: `Memory ${memoryId} deleted` };
  }
  
  /**
   * Edit a memory
   */
  async editMemory(memoryId: string, content: string, uid?: string): Promise<any> {
    const userId = uid || this.uid;
    
    if (!memories[memoryId]) {
      throw new Error(`Memory ${memoryId} not found`);
    }
    
    memories[memoryId].transcript_segments[0].text = content;
    memories[memoryId].structured.overview = content.substring(0, 100);
    
    return { success: true, message: `Memory ${memoryId} updated` };
  }
  
  /**
   * Create memory from audio file
   */
  async createMemoryFromAudio(
    audioFilePath: string,
    category: MemoryFilterOptions = MemoryFilterOptions.CONVERSATION,
    uid?: string
  ): Promise<Memory> {
    const userId = uid || this.uid;
    const memoryId = `mem-audio-${nextId++}`;
    
    const now = new Date().toISOString();
    
    const memory: Memory = {
      id: memoryId,
      created_at: now,
      started_at: now,
      finished_at: now,
      source: 'audio',
      language: 'en',
      structured: {
        title: `Audio Memory ${memoryId}`,
        overview: `Transcription of audio file: ${audioFilePath}`,
        emoji: '🎤',
        category: category,
        action_items: [],
        events: []
      },
      transcript_segments: [{
        speaker: 'unknown',
        start: 0,
        end: 60,
        text: `Mock transcription for audio file: ${audioFilePath}`,
        is_user: false
      }],
      postprocessing: {
        status: 'completed'
      },
      discarded: false,
      deleted: false,
      visibility: 'private'
    };
    
    memories[memoryId] = memory;
    return memory;
  }
  
  /**
   * Get conversations
   */
  async getConversations(
    uid?: string,
    includeDiscarded = false,
    limit = 25
  ): Promise<any[]> {
    // Just return a mock conversation
    return [{
      id: 'conv-1',
      title: 'Mock Conversation',
      created_at: new Date().toISOString(),
      memories: Object.keys(memories).slice(0, 3),
      discarded: false
    }];
  }
}

// Export the class for both ESM and CommonJS compatibility
export { MockOmiMemoryClient };
export default MockOmiMemoryClient;

/**
 * Mock OMI Memory Client for development/testing
 * 
 * This is a placeholder implementation that provides mock functionality
 * for OMI memory operations when an actual OMI device is not available.
 */

class MockOmiMemoryClient {
  constructor() {
    console.log('Initialized MockOmiMemoryClient');
    this.memories = new Map();
  }

  /**
   * Store a memory in the mock storage
   */
  async storeMemory(key, value) {
    console.log(`[MockOmiMemory] Storing memory with key: ${key}`);
    this.memories.set(key, value);
    return { success: true, key };
  }

  /**
   * Retrieve a memory from mock storage
   */
  async retrieveMemory(key) {
    console.log(`[MockOmiMemory] Retrieving memory with key: ${key}`);
    const value = this.memories.get(key);
    return value ? { success: true, value } : { success: false, error: 'Memory not found' };
  }

  /**
   * Delete a memory from mock storage
   */
  async deleteMemory(key) {
    console.log(`[MockOmiMemory] Deleting memory with key: ${key}`);
    const existed = this.memories.has(key);
    this.memories.delete(key);
    return { success: existed };
  }

  /**
   * List all stored memories
   */
  async listMemories() {
    console.log('[MockOmiMemory] Listing all memories');
    return {
      success: true,
      memories: Array.from(this.memories.keys()).map(key => ({
        key,
        preview: String(this.memories.get(key)).substring(0, 50) + '...'
      }))
    };
  }
}

// Export the mock client
module.exports = MockOmiMemoryClient;

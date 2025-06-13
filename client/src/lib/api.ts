import { apiRequest } from './queryClient';

export interface HealthDataFilters {
  dataType?: 'sleep' | 'activity' | 'hrv' | 'heart_rate' | 'readiness';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// Health Data API
export const healthApi = {
  async getHealthData(filters?: HealthDataFilters) {
    const params = new URLSearchParams();
    if (filters?.dataType) params.append('dataType', filters.dataType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiRequest('GET', `/api/health?${params.toString()}`);
    return response.json();
  },

  async syncHealthData() {
    const response = await apiRequest('POST', '/api/health/sync');
    return response.json();
  },
};

// Conversations API
export const conversationsApi = {
  async getConversations() {
    const response = await apiRequest('GET', '/api/conversations');
    return response.json();
  },

  async getConversation(id: number) {
    const response = await apiRequest('GET', `/api/conversations/${id}`);
    return response.json();
  },

  async getMessages(conversationId: number) {
    const response = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
    return response.json();
  },

  async createConversation(title: string) {
    const response = await apiRequest('POST', '/api/conversations', { title });
    return response.json();
  },
};

// Chat Completions API (Ollama-compatible)
export const chatApi = {
  async createCompletion(request: ChatCompletionRequest) {
    const response = await apiRequest('POST', '/api/chat/completions', request);
    return response.json();
  },
};

// MCP Tools API
export const mcpApi = {
  async listTools() {
    const response = await apiRequest('GET', '/api/mcp/tools');
    return response.json();
  },

  async executeTool(tool: string, input: any) {
    const response = await apiRequest('POST', '/api/mcp/execute', { tool, input });
    return response.json();
  },
};

// Settings API
export const settingsApi = {
  async getSettings() {
    const response = await apiRequest('GET', '/api/settings');
    return response.json();
  },

  async updateSettings(updates: any) {
    const response = await apiRequest('PUT', '/api/settings', updates);
    return response.json();
  },
};

// System Status API
export const statusApi = {
  async getStatus() {
    const response = await apiRequest('GET', '/api/status');
    return response.json();
  },
};

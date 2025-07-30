/**
 * Omi API Type Definitions
 * Based on the Omi API documentation and MCP server requirements
 */

// Memory Categories based on Omi API
export enum MemoryCategory {
  CORE = "core",
  HOBBIES = "hobbies", 
  LIFESTYLE = "lifestyle",
  INTERESTS = "interests",
  HABITS = "habits",
  WORK = "work",
  SKILLS = "skills",
  LEARNINGS = "learnings",
  OTHER = "other"
}

// Conversation Categories based on Omi API
export enum ConversationCategory {
  PERSONAL = "personal",
  EDUCATION = "education",
  HEALTH = "health",
  FINANCE = "finance",
  LEGAL = "legal",
  PHILOSOPHY = "philosophy",
  SPIRITUAL = "spiritual",
  SCIENCE = "science",
  ENTREPRENEURSHIP = "entrepreneurship",
  PARENTING = "parenting",
  ROMANCE = "romantic",
  TRAVEL = "travel",
  INSPIRATION = "inspiration",
  TECHNOLOGY = "technology",
  BUSINESS = "business",
  SOCIAL = "social",
  WORK = "work",
  SPORTS = "sports",
  POLITICS = "politics",
  LITERATURE = "literature",
  HISTORY = "history",
  ARCHITECTURE = "architecture",
  MUSIC = "music",
  WEATHER = "weather",
  NEWS = "news",
  ENTERTAINMENT = "entertainment",
  PSYCHOLOGY = "psychology",
  REAL = "real",
  DESIGN = "design",
  FAMILY = "family",
  ECONOMICS = "economics",
  ENVIRONMENT = "environment",
  OTHER = "other"
}

// Base API Response Structure
export interface OmiApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

// Memory Interfaces
export interface OmiMemory {
  id: string;
  content: string;
  category: MemoryCategory;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface CreateMemoryRequest {
  content: string;
  category: MemoryCategory;
  metadata?: Record<string, any>;
}

export interface UpdateMemoryRequest {
  content?: string;
  category?: MemoryCategory;
  metadata?: Record<string, any>;
}

export interface MemoryListResponse extends OmiApiResponse<OmiMemory[]> {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Conversation Interfaces
export interface ConversationSegment {
  id: string;
  text: string;
  speaker?: string;
  start_time?: number;
  end_time?: number;
  confidence?: number;
  is_user?: boolean;
}

export interface OmiConversation {
  id: string;
  title?: string;
  summary?: string;
  category?: ConversationCategory;
  start_time: string;
  end_time?: string;
  duration?: number;
  word_count?: number;
  language?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
  // For full conversation details
  segments?: ConversationSegment[];
  transcript?: string;
}

export interface ConversationListResponse extends OmiApiResponse<OmiConversation[]> {
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Query Parameters
export interface GetMemoriesParams {
  userId?: string;
  limit?: number;
  offset?: number;
  categories?: MemoryCategory[];
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface GetConversationsParams {
  userId?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  categories?: ConversationCategory[];
  include_segments?: boolean;
  search?: string;
}

// Batch Operations (Cognos Optimizations)
export interface BatchGetConversationsRequest {
  conversation_ids: string[];
  include_segments?: boolean;
}

export interface BatchGetConversationsResponse extends OmiApiResponse<OmiConversation[]> {
  failed_ids?: string[];
  errors?: Record<string, string>;
}

export interface IncrementalSyncParams {
  since_timestamp: string;
  entity_type: 'memories' | 'conversations';
  limit?: number;
}

export interface SearchConversationsRequest {
  query: string;
  limit?: number;
  categories?: ConversationCategory[];
  start_date?: string;
  end_date?: string;
  embedding_model?: string;
}

// Error Types
export interface OmiApiError {
  error: string;
  message: string;
  status_code?: number;
  details?: Record<string, any>;
}

// Tool Response Types
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}
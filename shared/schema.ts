import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core User Management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  profileData: jsonb("profile_data").default({}),
  privacySettings: jsonb("privacy_settings").default({}),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  usernameIdx: index("users_username_idx").on(table.username),
  emailIdx: index("users_email_idx").on(table.email),
  uuidIdx: index("users_uuid_idx").on(table.uuid),
}));

// Data Consent & Privacy
export const userConsent = pgTable("user_consent", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  consentType: text("consent_type").notNull(), // 'health_data', 'ai_processing', 'data_sharing'
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  userConsentIdx: index("user_consent_user_id_idx").on(table.userId),
  consentTypeIdx: index("user_consent_type_idx").on(table.consentType),
}));

// Enhanced Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  title: text("title").notNull(),
  userId: integer("user_id").notNull(),
  summary: text("summary"),
  tags: jsonb("tags").default([]),
  contextData: jsonb("context_data").default({}),
  isArchived: boolean("is_archived").default(false),
  messageCount: integer("message_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userConversationsIdx: index("conversations_user_id_idx").on(table.userId),
  updatedAtIdx: index("conversations_updated_at_idx").on(table.updatedAt),
  tagsIdx: index("conversations_tags_idx").on(table.tags),
}));

// Enhanced Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  toolsUsed: jsonb("tools_used").default([]),
  processingTime: integer("processing_time"), // milliseconds
  tokenCount: integer("token_count"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  conversationMessagesIdx: index("messages_conversation_id_idx").on(table.conversationId),
  roleIdx: index("messages_role_idx").on(table.role),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

// Comprehensive Health Data (Time-Series Optimized)
export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id").notNull(),
  dataType: text("data_type").notNull(), // 'sleep', 'activity', 'hrv', 'heart_rate', 'readiness'
  source: text("source").notNull(), // 'oura', 'apple_health', 'fitbit', 'manual'
  sourceId: text("source_id"), // External ID from source system
  value: jsonb("value").notNull(),
  quality: text("quality"), // 'high', 'medium', 'low'
  tags: jsonb("tags").default([]),
  timestamp: timestamp("timestamp").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  userHealthIdx: index("health_data_user_id_idx").on(table.userId),
  dataTypeIdx: index("health_data_type_idx").on(table.dataType),
  timestampIdx: index("health_data_timestamp_idx").on(table.timestamp),
  sourceIdx: index("health_data_source_idx").on(table.source),
  userTypeTimeIdx: index("health_data_user_type_time_idx").on(table.userId, table.dataType, table.timestamp),
}));

// Memory System for Context Preservation
export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id").notNull(),
  memoryType: text("memory_type").notNull(), // 'conversation', 'preference', 'insight', 'goal'
  content: text("content").notNull(),
  context: jsonb("context").default({}),
  importance: integer("importance").default(5), // 1-10 scale
  tags: jsonb("tags").default([]),
  vectorEmbedding: text("vector_embedding"), // For semantic search
  relatedMemories: jsonb("related_memories").default([]),
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  userMemoriesIdx: index("memories_user_id_idx").on(table.userId),
  memoryTypeIdx: index("memories_type_idx").on(table.memoryType),
  importanceIdx: index("memories_importance_idx").on(table.importance),
  tagsIdx: index("memories_tags_idx").on(table.tags),
  accessedIdx: index("memories_last_accessed_idx").on(table.lastAccessed),
}));

// AI Query Processing and Caching
export const aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id").notNull(),
  conversationId: integer("conversation_id"),
  query: text("query").notNull(),
  queryHash: text("query_hash").notNull(), // For deduplication
  response: text("response"),
  model: text("model").notNull(),
  toolsUsed: jsonb("tools_used").default([]),
  processingTime: integer("processing_time"), // milliseconds
  tokenCount: integer("token_count"),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  cached: boolean("cached").default(false),
  quality: decimal("quality", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userQueriesIdx: index("ai_queries_user_id_idx").on(table.userId),
  queryHashIdx: index("ai_queries_hash_idx").on(table.queryHash),
  modelIdx: index("ai_queries_model_idx").on(table.model),
  createdAtIdx: index("ai_queries_created_at_idx").on(table.createdAt),
}));

// External Data Sources and Web Search Results
export const externalData = pgTable("external_data", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id"),
  queryId: integer("query_id"),
  source: text("source").notNull(), // 'web_search', 'api', 'rss'
  sourceUrl: text("source_url"),
  title: text("title"),
  content: text("content"),
  summary: text("summary"),
  metadata: jsonb("metadata").default({}),
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }),
  credibilityScore: decimal("credibility_score", { precision: 3, scale: 2 }),
  tags: jsonb("tags").default([]),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  userExternalIdx: index("external_data_user_id_idx").on(table.userId),
  sourceIdx: index("external_data_source_idx").on(table.source),
  queryIdx: index("external_data_query_id_idx").on(table.queryId),
  fetchedAtIdx: index("external_data_fetched_at_idx").on(table.fetchedAt),
}));

// Enhanced Settings with Encryption Support
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  ollamaUrl: text("ollama_url").notNull().default("http://localhost:11434"),
  ollamaModel: text("ollama_model").notNull().default("llama3.2:3b"),
  ouraToken: text("oura_token"), // Encrypted
  enabledMcpTools: jsonb("enabled_mcp_tools").default(["health-analysis", "memory-store", "web-search"]),
  healthDataSources: jsonb("health_data_sources").default({}),
  aiPreferences: jsonb("ai_preferences").default({}),
  privacyLevel: text("privacy_level").default("standard"), // 'minimal', 'standard', 'enhanced'
  dataRetentionDays: integer("data_retention_days").default(365),
  encryptionKeyId: text("encryption_key_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userSettingsIdx: index("settings_user_id_idx").on(table.userId),
}));

// System Monitoring and Performance
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // 'response_time', 'error_rate', 'usage'
  metricName: text("metric_name").notNull(),
  value: decimal("value", { precision: 15, scale: 6 }).notNull(),
  tags: jsonb("tags").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  metricTypeIdx: index("system_metrics_type_idx").on(table.metricType),
  timestampIdx: index("system_metrics_timestamp_idx").on(table.timestamp),
  metricNameIdx: index("system_metrics_name_idx").on(table.metricName),
}));

// Audit Log for Compliance
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details").default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userAuditIdx: index("audit_log_user_id_idx").on(table.userId),
  actionIdx: index("audit_log_action_idx").on(table.action),
  resourceIdx: index("audit_log_resource_idx").on(table.resource),
  timestampIdx: index("audit_log_timestamp_idx").on(table.timestamp),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
  healthData: many(healthData),
  memories: many(memories),
  aiQueries: many(aiQueries),
  settings: many(settings),
  consent: many(userConsent),
  auditLogs: many(auditLog),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [messages.conversationId], references: [users.id] }),
}));

export const healthDataRelations = relations(healthData, ({ one }) => ({
  user: one(users, { fields: [healthData.userId], references: [users.id] }),
}));

export const memoriesRelations = relations(memories, ({ one }) => ({
  user: one(users, { fields: [memories.userId], references: [users.id] }),
}));

export const aiQueriesRelations = relations(aiQueries, ({ one }) => ({
  user: one(users, { fields: [aiQueries.userId], references: [users.id] }),
  conversation: one(conversations, { fields: [aiQueries.conversationId], references: [conversations.id] }),
}));

export const externalDataRelations = relations(externalData, ({ one }) => ({
  user: one(users, { fields: [externalData.userId], references: [users.id] }),
  query: one(aiQueries, { fields: [externalData.queryId], references: [aiQueries.id] }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.userId], references: [users.id] }),
}));

export const userConsentRelations = relations(userConsent, ({ one }) => ({
  user: one(users, { fields: [userConsent.userId], references: [users.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, { fields: [auditLog.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserConsentSchema = createInsertSchema(userConsent).omit({
  id: true,
  grantedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  uuid: true,
  createdAt: true,
});

export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  uuid: true,
  recordedAt: true,
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  uuid: true,
  createdAt: true,
});

export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  uuid: true,
  createdAt: true,
});

export const insertExternalDataSchema = createInsertSchema(externalData).omit({
  id: true,
  uuid: true,
  fetchedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

// Chat completion schema for Ollama compatibility
export const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  stream: z.boolean().optional().default(false),
  temperature: z.number().optional().default(0.7),
  max_tokens: z.number().optional(),
});

// Health data query schema
export const healthQuerySchema = z.object({
  dataType: z.enum(['sleep', 'activity', 'hrv', 'heart_rate', 'readiness']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().optional().default(50),
});

// Memory query schema
export const memoryQuerySchema = z.object({
  memoryType: z.enum(['conversation', 'preference', 'insight', 'goal']).optional(),
  tags: z.array(z.string()).optional(),
  importance: z.number().min(1).max(10).optional(),
  limit: z.number().optional().default(20),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserConsent = z.infer<typeof insertUserConsentSchema>;
export type UserConsent = typeof userConsent.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type HealthData = typeof healthData.$inferSelect;

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;

export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type AiQuery = typeof aiQueries.$inferSelect;

export type InsertExternalData = z.infer<typeof insertExternalDataSchema>;
export type ExternalData = typeof externalData.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

export type ChatCompletion = z.infer<typeof chatCompletionSchema>;
export type HealthQuery = z.infer<typeof healthQuerySchema>;
export type MemoryQuery = z.infer<typeof memoryQuerySchema>;

import { 
  users, conversations, messages, healthData, settings, memories, aiQueries, userConsent, auditLog,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type HealthData, type InsertHealthData,
  type Settings, type InsertSettings,
  type Memory, type InsertMemory,
  type AiQuery, type InsertAiQuery,
  type UserConsent, type InsertUserConsent,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Consent
  getUserConsent(userId: number, consentType: string): Promise<UserConsent | undefined>;
  createUserConsent(consent: InsertUserConsent): Promise<UserConsent>;
  revokeUserConsent(userId: number, consentType: string): Promise<void>;

  // Conversations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUser(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;

  // Messages
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Health Data
  getHealthData(userId: number, filters?: { dataType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<HealthData[]>;
  createHealthData(data: InsertHealthData): Promise<HealthData>;
  getLatestHealthData(userId: number, dataType: string): Promise<HealthData | undefined>;

  // Memory System
  getMemories(userId: number, filters?: { memoryType?: string; tags?: string[]; importance?: number; limit?: number }): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: number, updates: Partial<Memory>): Promise<Memory | undefined>;
  
  // AI Queries
  getAiQuery(queryHash: string): Promise<AiQuery | undefined>;
  createAiQuery(query: InsertAiQuery): Promise<AiQuery>;
  
  // Settings
  getSettings(userId: number): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: number, updates: Partial<Settings>): Promise<Settings | undefined>;

  // Audit Logging
  logAction(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize defaults on first run
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    try {
      // Check if default user exists
      const existingUser = await this.getUserByUsername("user");
      if (!existingUser) {
        const defaultUser = await this.createUser({
          username: "user",
          password: "password"
        });

        await this.createSettings({
          userId: defaultUser.id,
          ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
          ollamaModel: process.env.OLLAMA_MODEL || "llama3.2:3b",
          ouraToken: process.env.OURA_TOKEN || "",
        });

        // Create default consent records
        await this.createUserConsent({
          userId: defaultUser.id,
          consentType: "health_data",
          granted: true,
        });

        await this.createUserConsent({
          userId: defaultUser.id,
          consentType: "ai_processing",
          granted: true,
        });
      }
    } catch (error) {
      console.error("Failed to initialize defaults:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserConsent(userId: number, consentType: string): Promise<UserConsent | undefined> {
    const [consent] = await db
      .select()
      .from(userConsent)
      .where(and(eq(userConsent.userId, userId), eq(userConsent.consentType, consentType)))
      .orderBy(desc(userConsent.grantedAt));
    return consent || undefined;
  }

  async createUserConsent(consent: InsertUserConsent): Promise<UserConsent> {
    const [newConsent] = await db
      .insert(userConsent)
      .values(consent)
      .returning();
    return newConsent;
  }

  async revokeUserConsent(userId: number, consentType: string): Promise<void> {
    await db
      .update(userConsent)
      .set({ revokedAt: new Date() })
      .where(and(eq(userConsent.userId, userId), eq(userConsent.consentType, consentType)));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getHealthData(userId: number, filters?: { dataType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<HealthData[]> {
    const conditions = [eq(healthData.userId, userId)];

    if (filters?.dataType) {
      conditions.push(eq(healthData.dataType, filters.dataType));
    }

    if (filters?.startDate) {
      conditions.push(gte(healthData.timestamp, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(healthData.timestamp, filters.endDate));
    }

    const baseQuery = db.select().from(healthData).where(and(...conditions)).orderBy(desc(healthData.timestamp));

    if (filters?.limit) {
      return await baseQuery.limit(filters.limit);
    }

    return await baseQuery;
  }

  async createHealthData(insertData: InsertHealthData): Promise<HealthData> {
    const [data] = await db
      .insert(healthData)
      .values(insertData)
      .returning();
    return data;
  }

  async getLatestHealthData(userId: number, dataType: string): Promise<HealthData | undefined> {
    const data = await this.getHealthData(userId, { dataType, limit: 1 });
    return data[0];
  }

  async getMemories(userId: number, filters?: { memoryType?: string; tags?: string[]; importance?: number; limit?: number }): Promise<Memory[]> {
    const conditions = [eq(memories.userId, userId)];

    if (filters?.memoryType) {
      conditions.push(eq(memories.memoryType, filters.memoryType));
    }

    if (filters?.importance) {
      conditions.push(gte(memories.importance, filters.importance));
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Using SQL JSON contains operator for tag filtering
      conditions.push(sql`${memories.tags} ?& ${filters.tags}`);
    }

    const baseQuery = db.select().from(memories).where(and(...conditions)).orderBy(desc(memories.importance), desc(memories.createdAt));

    if (filters?.limit) {
      return await baseQuery.limit(filters.limit);
    }

    return await baseQuery;
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const [newMemory] = await db
      .insert(memories)
      .values(memory)
      .returning();
    return newMemory;
  }

  async updateMemory(id: number, updates: Partial<Memory>): Promise<Memory | undefined> {
    // Remove fields that can't be updated
    const { id: _, uuid: __, createdAt: ___, ...updateFields } = updates as any;
    
    const [memory] = await db
      .update(memories)
      .set(updateFields)
      .where(eq(memories.id, id))
      .returning();
    return memory || undefined;
  }

  async getAiQuery(queryHash: string): Promise<AiQuery | undefined> {
    const [query] = await db.select().from(aiQueries).where(eq(aiQueries.queryHash, queryHash));
    return query || undefined;
  }

  async createAiQuery(query: InsertAiQuery): Promise<AiQuery> {
    const [newQuery] = await db
      .insert(aiQueries)
      .values(query)
      .returning();
    return newQuery;
  }

  async getSettings(userId: number): Promise<Settings | undefined> {
    const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
    return userSettings || undefined;
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const [newSettings] = await db
      .insert(settings)
      .values(insertSettings)
      .returning();
    return newSettings;
  }

  async updateSettings(userId: number, updates: Partial<Settings>): Promise<Settings | undefined> {
    const [updatedSettings] = await db
      .update(settings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(settings.userId, userId))
      .returning();
    return updatedSettings || undefined;
  }

  async logAction(log: InsertAuditLog): Promise<AuditLog> {
    const [auditEntry] = await db
      .insert(auditLog)
      .values(log)
      .returning();
    return auditEntry;
  }
}

export const storage = new DatabaseStorage();

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
var vite_config_exports = {};
__export(vite_config_exports, {
  default: () => vite_config_default
});
import path7 from "path";
import react from "@vitejs/plugin-react";
var projectRoot, config3, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    projectRoot = process.cwd();
    config3 = {
      plugins: [react()],
      resolve: {
        alias: {
          "@": path7.resolve(projectRoot, "client", "src"),
          "@shared": path7.resolve(projectRoot, "shared"),
          "@assets": path7.resolve(projectRoot, "attached_assets")
        }
      },
      root: path7.resolve(projectRoot, "client"),
      build: {
        outDir: path7.resolve(projectRoot, "dist/public"),
        emptyOutDir: true
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        },
        hmr: {
          protocol: "ws",
          host: "localhost",
          port: 3001
        }
      }
    };
    vite_config_default = config3;
  }
});

// server/index.ts
import express5 from "express";

// server/routes.ts
import { WebSocketServer } from "ws";
import http from "http";
import axios6 from "axios";

// server/ollama.ts
var OllamaClient = class {
  constructor(baseUrl) {
    const useNgrok = process.env.USE_NGROK === "true";
    let ollamaUrl;
    if (useNgrok && process.env.OLLAMA_NGROK_URL) {
      ollamaUrl = process.env.OLLAMA_NGROK_URL;
      console.log("Using ngrok URL for Ollama connection");
    } else {
      ollamaUrl = process.env.OLLAMA_URL || baseUrl || "http://localhost:11434";
      console.log("Using standard URL for Ollama connection (zrok or local)");
    }
    this.baseUrl = ollamaUrl.replace(/\/$/, "");
    console.log(`Initializing Ollama client with URL: ${this.baseUrl}`);
  }
  async chat(request) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...request,
          stream: false
          // Always use non-streaming for simplicity
        })
      });
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Ollama: ${error.message}`);
      }
      throw new Error("Failed to connect to Ollama: Unknown error");
    }
  }
  /**
   * Stream chat responses from Ollama
   * @param request The chat request
   * @yields Streaming response chunks
   */
  async *streamingChat(request) {
    try {
      request.stream = true;
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error("Response body is null");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const chunk = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 1);
          if (chunk.trim()) {
            try {
              const parsed = JSON.parse(chunk);
              yield parsed;
            } catch (e) {
              console.error("Error parsing JSON chunk:", e);
            }
          }
          boundary = buffer.indexOf("\n");
        }
      }
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          yield parsed;
        } catch (e) {
          console.error("Error parsing JSON from remaining buffer:", e);
        }
      }
      yield {
        message: { role: "assistant", content: "" },
        done: true
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to stream from Ollama: ${error.message}`);
      }
      throw new Error("Failed to stream from Ollama: Unknown error");
    }
  }
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list models: ${error.message}`);
      }
      throw new Error("Failed to list models: Unknown error");
    }
  }
  async isHealthy() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3)
        // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  /**
   * Test connection to Ollama API and return model information if successful
   * @returns Object with connection details and available models
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3),
        // 5 second timeout
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return {
        status: "connected",
        models: data.models?.map((model) => ({
          name: model.name,
          size: model.size
        })) || []
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to Ollama: ${error.message}`);
      }
      throw new Error("Failed to connect to Ollama: Unknown error");
    }
  }
};
var createOllamaClient = (baseUrl) => {
  return new OllamaClient(baseUrl);
};
var ollamaClient = createOllamaClient();

// server/oura.ts
var OuraClient = class {
  constructor(accessToken) {
    this.baseUrl = "https://api.ouraring.com/v2/usercollection";
    this.accessToken = accessToken;
  }
  async makeRequest(endpoint, params) {
    if (!this.accessToken) {
      throw new Error("Oura access token not configured");
    }
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid Oura Ring access token");
        }
        throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch data from Oura Ring API");
    }
  }
  async getSleepData(startDate, endDate) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.makeRequest("sleep", params);
  }
  async getActivityData(startDate, endDate) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.makeRequest("daily_activity", params);
  }
  async getReadinessData(startDate, endDate) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.makeRequest("readiness", params);
  }
  /**
   * Test the connection to Oura API using the provided access token
   * @returns User info or error if connection fails
   */
  async testConnection() {
    const url = "https://api.ouraring.com/v2/usercollection/personal_info";
    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid Oura Ring access token");
        }
        throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return { userId: data.id || "unknown" };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to connect to Oura Ring API");
    }
  }
  async getLatestSleep() {
    const yesterday = /* @__PURE__ */ new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split("T")[0];
    const data = await this.getSleepData(startDate);
    return data.data.length > 0 ? data.data[data.data.length - 1] : null;
  }
  async getLatestActivity() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const data = await this.getActivityData(today);
    return data.data.length > 0 ? data.data[0] : null;
  }
  async getLatestReadiness() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const data = await this.getReadinessData(today);
    return data.data.length > 0 ? data.data[0] : null;
  }
  async isHealthy() {
    try {
      await this.makeRequest("personal_info");
      return true;
    } catch {
      return false;
    }
  }
};

// server/perplexity.ts
import axios from "axios";
var PerplexityClient = class {
  constructor(apiKey) {
    this.baseUrl = "https://api.perplexity.ai";
    this.apiKey = apiKey;
  }
  /**
   * Search the web using Perplexity's chat/completions API
   * @param query Search query
   * @returns Search results
   */
  async search(query) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "sonar-pro",
          // Using Sonar model which has web search capabilities
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that searches the web to find relevant information. Return your response as a JSON array of search results with each item having title, url, and snippet properties."
            },
            {
              role: "user",
              content: `Search for information about: ${query}`
            }
          ],
          temperature: 0.3
          // Lower temperature for more focused search results
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      const content = response.data.choices[0]?.message?.content || "";
      let results = [];
      try {
        results = this.extractSearchResults(content);
      } catch (parseError) {
        console.error("Failed to parse search results:", parseError);
        results = [{
          title: `Search results for: ${query}`,
          url: "",
          snippet: content
        }];
      }
      return {
        query,
        results
      };
    } catch (error) {
      console.error("Perplexity search error:", error.message);
      return {
        query,
        results: [],
        error: error.response?.data?.error || error.message,
        message: "Failed to search with Perplexity API"
      };
    }
  }
  /**
   * Extract search results from the model's response
   * @param content The model's response content
   * @returns Parsed search results
   */
  extractSearchResults(content) {
    const jsonMatch = content.match(/\[\s*{.*}\s*\]/s);
    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0]);
        if (Array.isArray(results)) {
          return results.map((item) => ({
            title: item.title || "No title",
            url: item.url || "",
            snippet: item.snippet || item.content || ""
          }));
        }
      } catch (e) {
        console.error("JSON parsing error:", e);
      }
    }
    return [{
      title: "Search Result",
      url: "",
      snippet: content
    }];
  }
  /**
   * Ask a question and get an answer using the Perplexity chat/completions API
   * @param query The question to ask
   * @returns Answer with sources
   */
  async ask(query) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "sonar-pro",
          // Using Sonar model which has web search capabilities
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions with accurate information from the web. Include sources for your information when possible."
            },
            {
              role: "user",
              content: query
            }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      const content = response.data.choices[0]?.message?.content || "";
      const sources = this.extractSources(content);
      return {
        query,
        answer: content,
        sources
      };
    } catch (error) {
      console.error("Perplexity ask error:", error.message);
      return {
        query,
        answer: null,
        error: error.response?.data?.error || error.message,
        message: "Failed to get answer from Perplexity API"
      };
    }
  }
  /**
   * Extract sources from the model's response
   * @param content The model's response content
   * @returns Array of sources
   */
  extractSources(content) {
    const sources = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    if (urls) {
      urls.forEach((url) => {
        sources.push({
          title: this.extractDomainFromUrl(url),
          url
        });
      });
    }
    const sourceSection = content.match(/Sources?:([\s\S]*?)(?:(?:\n\n)|$)/i);
    if (sourceSection) {
      const sourceLines = sourceSection[1].split("\n").filter((line) => line.trim());
      sourceLines.forEach((line) => {
        const urlInLine = line.match(/(https?:\/\/[^\s]+)/);
        if (urlInLine) {
          const url = urlInLine[1];
          let title = line.replace(url, "").trim().replace(/^[-\d.\[\]]+\s*/, "").replace(/^"(.*)"$/, "$1");
          if (!title) title = this.extractDomainFromUrl(url);
          sources.push({ title, url });
        }
      });
    }
    return sources.filter(
      (source, index2, self) => index2 === self.findIndex((s) => s.url === source.url)
    );
  }
  /**
   * Extract domain name from URL for display
   * @param url URL string
   * @returns Domain name
   */
  extractDomainFromUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, "");
    } catch (e) {
      return url;
    }
  }
};

// server/openrouter.ts
var OpenRouterClient = class {
  constructor(apiKey) {
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.apiKey = apiKey;
  }
  async chat(request) {
    try {
      console.log("OpenRouter request:", JSON.stringify(request, null, 2));
      const requestBody = JSON.stringify({
        ...request,
        stream: false
      });
      console.log(`Sending request to ${this.baseUrl}/chat/completions with body length: ${requestBody.length}`);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cognos-ai.replit.app",
          "X-Title": "Cognos AI Health Assistant"
        },
        body: requestBody
      });
      console.log(`OpenRouter response status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorData = await response.json().catch((e) => {
          console.error("Failed to parse error response:", e);
          return {};
        });
        console.error("OpenRouter API error details:", JSON.stringify(errorData, null, 2));
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      const responseData = await response.json();
      console.log("OpenRouter response:", JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error) {
      console.error("OpenRouter chat error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to connect to OpenRouter: ${error.message}`);
      }
      throw new Error("Failed to connect to OpenRouter: Unknown error");
    }
  }
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch OpenRouter models:", error);
      return { data: [] };
    }
  }
  async isHealthy() {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }
};

// server/groq.ts
import axios2 from "axios";
var GroqClient = class {
  constructor(apiKey) {
    this.baseUrl = "https://api.groq.com/openai/v1";
    this.apiKey = apiKey;
  }
  /**
   * Send a chat completion request to the Groq API
   * @param request Chat request parameters
   * @returns Chat completion response
   */
  async chat(request) {
    try {
      const response = await axios2.post(
        `${this.baseUrl}/chat/completions`,
        {
          ...request,
          stream: false
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Groq API error:", error.response?.data || error.message);
      throw new Error(`Failed to connect to Groq: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  /**
   * List available models from Groq
   * @returns Array of available models
   */
  async listModels() {
    try {
      const response = await axios2.get(
        `${this.baseUrl}/models`,
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch Groq models:", error.response?.data || error.message);
      return { data: [] };
    }
  }
  /**
   * Test the connection to the Groq API
   * @returns True if the connection is healthy, false otherwise
   */
  async testConnection() {
    try {
      const models = await this.listModels();
      if (models.data && models.data.length > 0) {
        return {
          success: true,
          message: `Successfully connected to Groq API. Found ${models.data.length} models.`,
          models: models.data.map((m) => m.id)
        };
      }
      return { success: false, message: "No models found in Groq API response." };
    } catch (error) {
      console.error("Groq connection test failed:", error.message);
      return {
        success: false,
        message: `Failed to connect to Groq API: ${error.message}`
      };
    }
  }
  /**
   * Check if the API connection is healthy
   * @returns True if the connection is healthy, false otherwise
   */
  async isHealthy() {
    try {
      const result = await this.testConnection();
      return result.success;
    } catch {
      return false;
    }
  }
};

// server/mcp/mcpRouter.ts
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z as z3 } from "zod";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { z } from "zod";
import dotenv from "dotenv";
import MemoryStore from "memorystore";

// server/localAuth.ts
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// shared/utils/nanoid-compat.ts
var nanoidFunc;
var customAlphabetFunc;
try {
  const nanoid4 = __require("nanoid");
  nanoidFunc = (size) => {
    if (size !== void 0) {
      return nanoid4.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", size)();
    }
    return nanoid4.nanoid();
  };
  customAlphabetFunc = nanoid4.customAlphabet;
} catch (err) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  nanoidFunc = (size = 21) => {
    let id = "";
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  };
  customAlphabetFunc = (chars, size) => {
    return () => {
      let id = "";
      for (let i = 0; i < size; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
      }
      return id;
    };
  };
}
function nanoid(size) {
  return nanoidFunc(size);
}
function customAlphabet(alphabet, size) {
  return customAlphabetFunc(alphabet, size);
}

// server/localAuth.ts
var nanoid2 = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);
var USER_FILE = path.join(process.cwd(), ".local-users.json");
var users = [];
function initLocalUsers() {
  try {
    if (fs.existsSync(USER_FILE)) {
      const data = fs.readFileSync(USER_FILE, "utf8");
      users = JSON.parse(data);
      console.log(`Loaded ${users.length} users from local storage`);
    } else {
      console.log("No local users found, will create default admin");
      users = [];
    }
  } catch (error) {
    console.error("Error loading local users:", error);
    users = [];
  }
}
function saveUsers() {
  try {
    fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users to file:", error);
  }
}
function findUserById(id) {
  return users.find((user) => user.id === id);
}
function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}
async function createAdminUser() {
  if (users.length === 0) {
    const adminUsername = "god_mode_1";
    const adminPassword = "Quickness-Candy-Resolved-Explore6-Dice";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = {
      id: 1,
      username: adminUsername,
      email: "admin@example.com",
      password: hashedPassword,
      isActive: true,
      lastLogin: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    users.push(adminUser);
    saveUsers();
    console.log("\n\u{1F510} Admin user created with the following credentials:");
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("\n\u26A0\uFE0F  You can now log in with these credentials.");
  }
}
async function verifyUser(username, password) {
  const user = findUserByUsername(username);
  if (!user) {
    return false;
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return false;
  }
  user.lastLogin = /* @__PURE__ */ new Date();
  saveUsers();
  return user;
}
async function registerUser(username, password, email) {
  if (findUserByUsername(username)) {
    throw new Error("Username already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const nextId = users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    username,
    password: hashedPassword,
    email: email || null,
    isActive: true,
    lastLogin: null,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  users.push(newUser);
  saveUsers();
  return newUser;
}
async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  user.updatedAt = /* @__PURE__ */ new Date();
  saveUsers();
  return true;
}

// server/auth.ts
dotenv.config();
var MemoryStoreSession = MemoryStore(session);
var loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});
var registrationSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  email: z.string().email().optional().nullable()
});
var changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: "Authentication required"
  });
}
async function initializeAuth(app2) {
  initLocalUsers();
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await verifyUser(username, password);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    const user = findUserById(id);
    if (!user) {
      return done(new Error("User not found"));
    }
    done(null, user);
  });
  app2.use(session({
    secret: process.env.SESSION_SECRET || "development_secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 864e5
      // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.use(passport.initialize());
  app2.use(passport.session());
}
async function initializeAdminUser() {
  await createAdminUser();
}
async function registerUser2(username, password, email) {
  return registerUser(username, password, email);
}
async function changePassword(userId, currentPassword, newPassword) {
  return changeUserPassword(userId, currentPassword, newPassword);
}

// server/limitless.ts
var LimitlessClient = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.limitless.ai/v1";
  }
  /**
   * Make an authenticated request to the Limitless API
   * 
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @returns JSON response
   */
  async makeRequest(endpoint, params) {
    if (!this.apiKey) {
      throw new Error("Limitless API key not configured");
    }
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid Limitless API key");
        }
        throw new Error(`Limitless API error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch data from Limitless API");
    }
  }
  /**
   * Get recent journal entries from Limitless
   * 
   * @param limit - Maximum number of entries to return
   * @returns List of journal entries
   */
  async getRecentEntries(limit = 20) {
    const params = {
      limit: limit.toString(),
      direction: "desc",
      includeMarkdown: "true",
      includeHeadings: "true",
      timezone: "America/Los_Angeles"
      // Use PST timezone for consistency
    };
    try {
      const response = await this.makeRequest("/lifelogs", params);
      if (response.data && response.data.lifelogs) {
        return response.data.lifelogs;
      }
      return [];
    } catch (error) {
      console.error("Error fetching Limitless entries:", error);
      return [];
    }
  }
  /**
   * Get Limitless entries created since a specific time
   * 
   * @param sinceTime - Only get entries created after this time
   * @param limit - Maximum number of entries to return
   * @returns List of journal entries
   */
  async getEntriesSince(sinceTime, limit = 50) {
    const sinceStr = sinceTime.toISOString();
    const params = {
      start_time: sinceStr,
      limit: limit.toString(),
      sort: "desc",
      includeMarkdown: "true",
      includeHeadings: "true",
      timezone: "America/Los_Angeles"
    };
    try {
      const response = await this.makeRequest("/lifelogs", params);
      if (response.data && response.data.lifelogs) {
        return response.data.lifelogs;
      }
      return [];
    } catch (error) {
      console.error("Error fetching Limitless entries since:", error);
      return [];
    }
  }
  /**
   * Get a specific Limitless entry by ID
   * 
   * @param id - The unique ID of the lifelog entry
   * @returns The journal entry or null if not found
   */
  async getEntryById(id) {
    try {
      const response = await this.makeRequest(`/lifelogs/${id}`);
      if (response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching Limitless entry ${id}:`, error);
      return null;
    }
  }
  /**
   * Extract plain text content from a Limitless entry
   * 
   * @param entry - A journal entry from Limitless
   * @returns Plain text content
   */
  extractTextContent(entry) {
    if (entry.markdown) {
      return entry.markdown;
    }
    let text2 = "";
    if (entry.contents) {
      for (const item of entry.contents) {
        if (item.content) {
          text2 += item.content + "\n";
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.content) {
              text2 += "  " + child.content + "\n";
            }
          }
        }
      }
    }
    return text2;
  }
  /**
   * Test the connection to the Limitless API using the provided API key
   * @returns Connection status and user info if successful
   */
  async testConnection() {
    try {
      const params = {
        limit: "1"
      };
      const response = await this.makeRequest("/lifelogs", params);
      return {
        status: "connected",
        meta: response.meta
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to connect to Limitless API");
    }
  }
};

// server/mcp/limitless/limitlessMcpServer.ts
var LimitlessMcpServer = class {
  constructor(apiKey) {
    this.tools = [];
    this.client = new LimitlessClient(apiKey);
    this.initTools();
  }
  /**
   * Initialize the tools cache
   */
  async initTools() {
    try {
      this.tools = await this.listTools();
    } catch (error) {
      console.error("Error initializing Limitless tools cache:", error);
      this.tools = [];
    }
  }
  /**
   * List available tools for the Limitless MCP server
   */
  /**
   * Get cached tools array
   */
  getTools() {
    return this.tools;
  }
  /**
   * List available tools for the Limitless MCP server
   */
  async listTools() {
    return [
      {
        name: "limitless_get_recent_entries",
        description: "Get recent journal entries from Limitless Pendant",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of entries to return (default: 20)"
            }
          }
        }
      },
      {
        name: "limitless_search_entries",
        description: "Search journal entries from Limitless Pendant by date range or content",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Optional search query to filter entries"
            },
            start_date: {
              type: "string",
              description: "Optional start date (ISO format) to filter entries"
            },
            end_date: {
              type: "string",
              description: "Optional end date (ISO format) to filter entries"
            },
            limit: {
              type: "integer",
              description: "Maximum number of entries to return (default: 50)"
            }
          }
        }
      },
      {
        name: "limitless_get_entry_by_id",
        description: "Get a specific journal entry from Limitless Pendant by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the journal entry"
            }
          },
          required: ["id"]
        }
      }
    ];
  }
  /**
   * Execute a tool call against the Limitless API
   */
  async executeToolCall(toolCall) {
    const { name, parameters } = toolCall;
    switch (name) {
      case "limitless_get_recent_entries": {
        const { limit = 20 } = parameters;
        const entries = await this.client.getRecentEntries(limit);
        return {
          entries: entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            created_at: entry.created_at,
            content: this.client.extractTextContent(entry),
            tags: entry.tags || [],
            headings: entry.headings || []
          }))
        };
      }
      case "limitless_search_entries": {
        const { start_date, end_date, limit = 50 } = parameters;
        let entries = [];
        if (start_date) {
          const startTime = new Date(start_date);
          entries = await this.client.getEntriesSince(startTime, limit);
        } else {
          entries = await this.client.getRecentEntries(limit);
        }
        if (end_date) {
          const endTime = new Date(end_date);
          entries = entries.filter((entry) => {
            const entryTime = new Date(entry.created_at);
            return entryTime <= endTime;
          });
        }
        return {
          entries: entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            created_at: entry.created_at,
            content: this.client.extractTextContent(entry),
            tags: entry.tags || [],
            headings: entry.headings || []
          }))
        };
      }
      case "limitless_get_entry_by_id": {
        const { id } = parameters;
        const entry = await this.client.getEntryById(id);
        if (!entry) {
          throw new Error(`Entry with ID ${id} not found`);
        }
        return {
          entry: {
            id: entry.id,
            title: entry.title,
            created_at: entry.created_at,
            content: this.client.extractTextContent(entry),
            tags: entry.tags || [],
            headings: entry.headings || []
          }
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  /**
   * Handle a request to the MCP server
   * This provides compatibility with the MCP router
   */
  async handleRequest(request) {
    const { type } = request;
    switch (type) {
      case "list_tools":
        return {
          tools: await this.listTools()
        };
      case "execute_tool":
        if (!request.name) {
          throw new Error("Tool name is required");
        }
        return this.executeToolCall({
          name: request.name,
          parameters: request.arguments || {}
        });
      default:
        throw new Error(`Unsupported request type: ${type}`);
    }
  }
  /**
   * Create a streaming handler for the MCP server
   * This provides compatibility with the MCP router's streaming API
   */
  createStreamingHandler(options) {
    return async (data) => {
      try {
        const result = await this.executeToolCall({
          name: data.name,
          parameters: data.arguments || {}
        });
        return result;
      } catch (error) {
        console.error(`Error in Limitless MCP streaming handler:`, error);
        throw error;
      }
    };
  }
  /**
   * Check if the service is healthy
   */
  async isHealthy() {
    try {
      await this.client.getRecentEntries(1);
      return true;
    } catch (error) {
      console.error("Limitless health check failed:", error);
      return false;
    }
  }
};
function createLimitlessMcpServer(apiKey) {
  return new LimitlessMcpServer(apiKey);
}

// server/mcp/oura/ouraMcpServer.ts
import { EventEmitter } from "events";

// server/mcp/oura/ouraService.ts
function isGuid(str) {
  if (!str) return false;
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidPattern.test(str);
}
var OuraService = class {
  constructor(token) {
    this.baseUrl = "https://api.ouraring.com/v2/usercollection";
    this.token = token;
  }
  /**
   * Makes a request to the Oura API
   * @param endpoint The API endpoint
   * @param params Query parameters
   * @returns Promise with the API response
   */
  async fetchData(endpoint, params = {}) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${this.token}`);
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    const requestOptions = {
      method: "GET",
      headers: myHeaders
    };
    try {
      const response = await fetch(url.toString(), requestOptions);
      if (!response.ok) {
        throw new Error(
          `API request failed with status ${response.status}: ${await response.text()}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching data from Oura API:", error);
      throw error;
    }
  }
  /**
   * Get daily activity data
   */
  async getDailyActivity(startDate, endDate) {
    return this.fetchData("daily_activity", {
      start_date: startDate,
      end_date: endDate
    });
  }
  /**
   * Get daily readiness data
   */
  async getDailyReadiness(startDate, endDate) {
    return this.fetchData("daily_readiness", {
      start_date: startDate,
      end_date: endDate
    });
  }
  /**
   * Get daily sleep data
   */
  async getDailySleep(startDate, endDate) {
    return this.fetchData("daily_sleep", {
      start_date: startDate,
      end_date: endDate
    });
  }
  /**
   * Get daily stress data
   */
  async getDailyStress(startDate, endDate) {
    return this.fetchData("daily_stress", {
      start_date: startDate,
      end_date: endDate
    });
  }
  /**
   * Get heart rate data
   */
  async getHeartRate(startDateTime, endDateTime) {
    return this.fetchData("heartrate", {
      start_datetime: startDateTime,
      end_datetime: endDateTime
    });
  }
  /**
   * Get enhanced tags
   */
  async getTags(startDate, endDate) {
    return this.fetchData("enhanced_tag", {
      start_date: startDate,
      end_date: endDate
    });
  }
  /**
   * Get sleep sessions
   */
  async getSleep(startDate, endDate) {
    return this.fetchData("sleep", {
      start_date: startDate,
      end_date: endDate
    });
  }
  /**
   * Check if the service can connect to the Oura API
   */
  async isHealthy() {
    try {
      await this.fetchData("personal_info");
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Process tag data, filtering and enhancing with metadata
   */
  processTagData(tagsResult, tagName) {
    const result = { ...tagsResult };
    if (result.data) {
      result.data = result.data.filter((tag) => {
        return !isGuid(tag.tag_type_code) || isGuid(tag.tag_type_code) && tag.comment && tag.comment.trim() !== "";
      });
      result.tagMetadata = {
        standardTags: result.data.filter(
          (tag) => !isGuid(tag.tag_type_code)
        ).length,
        customTags: result.data.filter(
          (tag) => isGuid(tag.tag_type_code)
        ).length,
        note: "Custom tags (with GUID tag_type_code) represent user-defined entries, often containing meal information. Standard tags have descriptive tag_type_code values like 'tag_generic_supplements'."
      };
    }
    if (tagName && result.data) {
      result.data = result.data.filter(
        (tag) => tag.custom_name?.toLowerCase().includes(tagName.toLowerCase()) || tag.comment?.toLowerCase().includes(tagName.toLowerCase())
      );
    }
    return result;
  }
};
function createOuraService(token) {
  return new OuraService(token);
}

// server/mcp/oura/ouraTools.ts
var ouraFetchTool = {
  name: "oura-fetch",
  description: "Fetch data from Oura Ring API endpoints",
  inputSchema: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        enum: [
          "activity",
          "readiness",
          "sleep",
          "stress",
          "heartrate",
          "sleep_sessions",
          "tags"
        ],
        description: "The Oura API endpoint to fetch data from"
      },
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format"
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format"
      },
      startDateTime: {
        type: "string",
        description: "Start datetime in ISO format with timezone (for heartrate endpoint)"
      },
      endDateTime: {
        type: "string",
        description: "End datetime in ISO format with timezone (for heartrate endpoint)"
      },
      sleepPeriod: {
        type: "boolean",
        description: "Whether to filter heart rate data to sleep periods only (requires additional sleep data fetch)"
      },
      tagName: {
        type: "string",
        description: "Optional filter for specific tag name or keyword in comment"
      }
    },
    required: ["endpoint"]
  }
};
var getSleepDataTool = {
  name: "get_sleep_data",
  description: "Fetch sleep data from Oura Ring",
  inputSchema: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format"
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format"
      }
    },
    required: []
  }
};
var getActivityDataTool = {
  name: "get_activity_data",
  description: "Fetch activity data from Oura Ring",
  inputSchema: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format"
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format"
      }
    },
    required: []
  }
};
var getReadinessDataTool = {
  name: "get_readiness_data",
  description: "Fetch readiness data from Oura Ring",
  inputSchema: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format"
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format"
      }
    },
    required: []
  }
};
var ouraTools = [
  ouraFetchTool,
  getSleepDataTool,
  getActivityDataTool,
  getReadinessDataTool
];

// server/mcp/oura/ouraPrompts.ts
var getReadinessPrompt = {
  id: "get-readiness",
  name: "Get readiness data",
  description: "Retrieve readiness scores from your Oura ring",
  text: "Show me my readiness scores for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get daily readiness data\n2. Analyze the data to show average scores and trends\n3. Consider fetching tags data for the same period to look for correlations with activities, meals, or other factors that might affect readiness"
};
var getSleepPrompt = {
  id: "get-sleep",
  name: "Get sleep data",
  description: "Retrieve sleep metrics from your Oura ring",
  text: "Show me my sleep data for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get daily sleep data\n2. Analyze the data to show sleep duration, efficiency, and other metrics\n3. IMPORTANT: When calculating sleep stage percentages (deep, REM, light), always use the total_sleep_duration as the denominator, NOT time_in_bed. This ensures calculations match what the Oura app shows.\n4. If visualizing sleep stages, show percentages of actual sleep time, not time in bed.\n5. Consider fetching tags data for the same period to look for correlations with activities, meals, or other factors that might affect sleep"
};
var getActivityPrompt = {
  id: "get-activity",
  name: "Get activity data",
  description: "Retrieve activity metrics from your Oura ring",
  text: "Show me my activity data for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get daily activity data\n2. Analyze the data to show steps, calories, and activity levels\n3. Consider fetching tags data for the same period to look for correlations with meals, recovery practices, or other factors that might affect activity"
};
var getHeartRatePrompt = {
  id: "get-heart-rate",
  name: "Get heart rate data",
  description: "Retrieve heart rate data from your Oura ring",
  text: "Show me my heart rate data for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get heart rate data\n2. Calculate average, minimum, and maximum heart rates over the specified period\n3. Be precise with time-based calculations and always verify the units of measurement (seconds vs. minutes vs. hours)\n4. Consider fetching tags data for the same period to look for correlations with activities, meals, or other factors that might affect heart rate"
};
var getHeartRateDuringSleepPrompt = {
  id: "get-heart-rate-during-sleep",
  name: "Get heart rate during sleep",
  description: "Retrieve heart rate data during sleep periods",
  text: "Show me my heart rate data during sleep for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get sleep data to identify sleep periods\n2. Use the oura-fetch tool to get heart rate data during those periods\n3. Analyze the data to show trends in heart rate during sleep\n4. Consider fetching tags data for the same period to look for correlations with evening activities, meals, or other factors that might affect night-time heart rate"
};
var getStressPrompt = {
  id: "get-stress",
  name: "Get stress data",
  description: "Retrieve stress metrics from your Oura ring",
  text: "Show me my stress data for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool with the stress endpoint\n2. Analyze the data to show stress levels and recovery periods\n3. Consider fetching tags data for the same period to look for correlations with activities, meals, or other factors that might affect stress levels"
};
var getTagsPrompt = {
  id: "get-tags",
  name: "Get Oura tags",
  description: "Retrieve tags from your Oura ring",
  text: "Show me my tags for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool with the tags endpoint\n2. Analyze the data to show tags I've created\n3. Consider fetching health metrics (sleep, readiness, activity, stress) for the same period to identify patterns and correlations"
};
var analyzeHealthFactorsPrompt = {
  id: "analyze-health-factors",
  name: "Analyze health factors",
  description: "Analyze how different factors affect your health metrics",
  text: "Analyze how different factors affect my [METRIC_TYPE] for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get [METRIC_TYPE] data\n2. Use the oura-fetch tool to get tags data for the same period\n3. When processing duration data, always verify the units (the API provides durations in seconds) and convert appropriately to hours/minutes for visualization\n4. For sleep data, always calculate stage percentages based on total_sleep_duration, not time_in_bed\n5. Analyze the data to identify patterns and correlations\n6. Create a visualization showing how different factors (such as meals, activities, etc.) in my tags relate to my [METRIC_TYPE]"
};
var analyzeMealEffectsPrompt = {
  id: "analyze-meal-effects",
  name: "Analyze meal effects on health",
  description: "Analyze how different meals affect your health metrics",
  text: "Analyze how my meals affect my [METRIC_TYPE] for the [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get [METRIC_TYPE] data\n2. Use the oura-fetch tool to get tags data for the same period\n3. Filter the tags to focus on those containing meal descriptions (like 'Dinner', 'Breakfast', etc.)\n4. Analyze the data to identify patterns between meal types and health metrics\n5. Create a visualization showing how different meals relate to my [METRIC_TYPE]"
};
var verifyCalculationsPrompt = {
  id: "verify-calculations",
  name: "Verify calculations",
  description: "Double-check calculations for accuracy",
  text: "Verify my [METRIC_TYPE] calculations for [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool to get raw data\n2. Show your calculation methodology step-by-step, including units and conversion factors\n3. For sleep data, verify that percentages match what would be shown in the Oura app (based on total_sleep_duration, not time_in_bed)\n4. Identify any potential calculation errors or statistical anomalies\n5. Present both raw values and calculated percentages/averages side by side for transparency"
};
var getSleepDetailsPrompt = {
  id: "get-sleep-details",
  name: "Get detailed sleep information",
  description: "Retrieve and explain detailed sleep metrics from your Oura ring",
  text: "Show me detailed analysis of my sleep for [TIME_PERIOD]. To do this, you'll need to:\n1. Use the oura-fetch tool with the sleep_sessions endpoint for detailed sleep metrics\n2. Understand key fields: total_sleep_duration (actual sleep in seconds), time_in_bed (total time in seconds), awake_time (awake time in seconds)\n3. Sleep stage data includes: deep_sleep_duration, rem_sleep_duration, light_sleep_duration (all in seconds)\n4. Calculate sleep efficiency as (total_sleep_duration / time_in_bed * 100)\n5. Calculate sleep stage percentages using total_sleep_duration as the denominator, not time_in_bed\n6. Present all findings with original units AND human-readable formats (convert seconds to hours/minutes)"
};
var dataHandlingGuidelines = {
  id: "data-handling-guidelines",
  name: "Data handling guidelines",
  description: "Guidelines for handling Oura data correctly",
  text: "Important guidelines for analyzing Oura data:\n\n1. TIME UNITS: All duration fields in the API response are in seconds. Always convert to hours/minutes for user-friendly display.\n\n2. SLEEP PERCENTAGES: Always calculate sleep stage percentages (deep, REM, light) using total_sleep_duration as the denominator, not time_in_bed. This matches how percentages are displayed in the Oura app.\n\n3. EFFICIENCY: Sleep efficiency is total_sleep_duration divided by time_in_bed, multiplied by 100 to get a percentage.\n\n4. TAGS: Custom tags (with GUID tag_type_code) usually contain meal information in the comment field.\n\n5. CORRELATIONS: When analyzing correlations, always ensure data points are properly time-aligned and use appropriate time offsets when looking for delayed effects.\n\n6. VISUALIZATION: Always show both raw values and percentages in visualizations, and clearly label which denominator was used for percentage calculations."
};
var ouraPrompts = [
  getReadinessPrompt,
  getSleepPrompt,
  getActivityPrompt,
  getHeartRatePrompt,
  getHeartRateDuringSleepPrompt,
  getStressPrompt,
  getTagsPrompt,
  analyzeHealthFactorsPrompt,
  analyzeMealEffectsPrompt,
  verifyCalculationsPrompt,
  getSleepDetailsPrompt,
  dataHandlingGuidelines
];

// server/mcp/oura/ouraMcpServer.ts
var ouraEventEmitter = new EventEmitter();
var OuraMcpServer = class {
  constructor(ouraToken) {
    /**
     * Get list of available tools
     */
    this.handleListTools = async () => {
      return {
        tools: ouraTools
      };
    };
    /**
     * Get list of available prompts
     */
    this.handleListPrompts = async () => {
      return {
        prompts: ouraPrompts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description
        }))
      };
    };
    /**
     * Get a specific prompt by ID
     */
    this.handleGetPrompt = async (request) => {
      const prompt = ouraPrompts.find((p) => p.id === request.params.id);
      if (!prompt) {
        throw new Error(`Prompt with ID ${request.params.id} not found`);
      }
      return { prompt };
    };
    /**
     * Handle a tool call
     */
    this.handleCallTool = async (request) => {
      const { name, arguments: args } = request.params;
      try {
        ouraEventEmitter.emit("tool-call", name, args);
        if (name === "oura-fetch") {
          return await this.handleOuraFetch(args);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error("Error handling tool call:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message || "Unknown error"}`
            }
          ],
          isError: true
        };
      }
    };
    this.ouraService = createOuraService(ouraToken);
    this.setupEventHandlers();
  }
  /**
   * Set up event handlers for real-time data processing
   */
  setupEventHandlers() {
    ouraEventEmitter.on("tool-call", async (toolName, args) => {
      console.log(`Tool call received: ${toolName}`, args);
      try {
        const result = await this.handleToolCall(toolName, args);
        ouraEventEmitter.emit("tool-result", toolName, result);
      } catch (error) {
        console.error(`Error in tool call ${toolName}:`, error);
        ouraEventEmitter.emit("tool-error", toolName, error);
      }
    });
  }
  /**
   * List available tools (compatibility with McpServerWithRouter interface)
   */
  async listTools() {
    return ouraTools;
  }
  /**
   * Get cached tools array
   */
  getTools() {
    return ouraTools;
  }
  /**
   * Execute a tool call directly (compatibility with McpServerWithRouter interface)
   */
  async executeToolCall(toolCall) {
    return this.handleToolCall(toolCall.name, toolCall.parameters);
  }
  /**
   * Private method to handle tool call
   */
  async handleToolCall(toolName, args) {
    try {
      if (toolName === "oura-fetch") {
        return await this.handleOuraFetch(args);
      } else {
        throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error("Error handling tool call:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  }
  /**
   * Private method to handle oura-fetch tool
   */
  async handleOuraFetch(args) {
    const {
      endpoint,
      startDate,
      endDate,
      startDateTime,
      endDateTime,
      sleepPeriod,
      tagName
    } = args;
    let response;
    if (!endpoint) {
      throw new Error("Endpoint parameter is required");
    }
    if (["activity", "readiness", "sleep", "stress", "tags", "sleep_sessions"].includes(endpoint)) {
      if (!startDate || !endDate) {
        throw new Error("startDate and endDate are required for this endpoint");
      }
      switch (endpoint) {
        case "activity":
          response = await this.ouraService.getDailyActivity(startDate, endDate);
          break;
        case "readiness":
          response = await this.ouraService.getDailyReadiness(startDate, endDate);
          break;
        case "sleep":
        case "sleep_sessions":
          response = await this.ouraService.getSleep(startDate, endDate);
          break;
        case "stress":
          response = await this.ouraService.getDailyStress(startDate, endDate);
          break;
        case "tags":
          const tagsResult = await this.ouraService.getTags(startDate, endDate);
          response = this.ouraService.processTagData(tagsResult, tagName);
          break;
      }
    } else if (endpoint === "heartrate") {
      if (sleepPeriod) {
        if (!startDate || !endDate) {
          throw new Error("startDate and endDate are required for sleep period filtering");
        }
        const sleepData = await this.ouraService.getSleep(startDate, endDate);
        if (!sleepData.data || sleepData.data.length === 0) {
          throw new Error("No sleep data found for the specified period");
        }
        const sleepHeartrateData = [];
        for (const session2 of sleepData.data) {
          const sessionStart = session2.bedtime_start;
          const sessionEnd = session2.bedtime_end;
          const heartrateData = await this.ouraService.getHeartRate(
            sessionStart,
            sessionEnd
          );
          if (heartrateData.data && heartrateData.data.length > 0) {
            sleepHeartrateData.push(...heartrateData.data);
          }
        }
        response = { data: sleepHeartrateData };
      } else {
        if (!startDateTime || !endDateTime) {
          throw new Error("startDateTime and endDateTime are required for heartrate endpoint");
        }
        response = await this.ouraService.getHeartRate(startDateTime, endDateTime);
      }
    } else {
      throw new Error(`Unsupported endpoint: ${endpoint}`);
    }
    const content = [
      {
        type: "text",
        text: JSON.stringify(response, null, 2)
      }
    ];
    return {
      content,
      isError: false
    };
  }
  /**
   * Process an MCP request of any supported type
   */
  async handleRequest(request) {
    switch (request.type) {
      case "list_tools":
        return this.handleListTools(request);
      case "call_tool":
        return this.handleCallTool(request);
      case "list_prompts":
        return this.handleListPrompts(request);
      case "get_prompt":
        return this.handleGetPrompt(request);
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }
  /**
   * Check if the service is healthy
   */
  async isHealthy() {
    return this.ouraService.isHealthy();
  }
  /**
   * Create a streaming response handler that emits events as data is processed
   * @param options Options with emit function for handling events
   */
  createStreamingHandler(options) {
    const streamEmitter = new EventEmitter();
    streamEmitter.on("tool-result", (toolName, result) => {
      options.emit("data", result);
    });
    streamEmitter.on("tool-error", (toolName, error) => {
      options.emit("error", error instanceof Error ? error.message : "Unknown error");
    });
    return async (data) => {
      try {
        const result = await this.handleToolCall(data.name, data.arguments || {});
        return result;
      } catch (error) {
        console.error(`Error in Oura streaming handler:`, error);
        throw error;
      }
    };
  }
  /**
   * Legacy streaming handler for backward compatibility
   * @param requestId Unique identifier for the request
   */
  createLegacyStreamingHandler(requestId) {
    const streamEmitter = new EventEmitter();
    const forwardEvent = (event, result) => {
      streamEmitter.emit(event, result);
    };
    ouraEventEmitter.on("tool-result", forwardEvent);
    ouraEventEmitter.on("tool-error", forwardEvent);
    streamEmitter.on("end", () => {
      ouraEventEmitter.off("tool-result", forwardEvent);
      ouraEventEmitter.off("tool-error", forwardEvent);
    });
    return streamEmitter;
  }
};
function createOuraMcpServer(ouraToken) {
  return new OuraMcpServer(ouraToken);
}

// server/bee.ts
import axios3 from "axios";
var BeeClient = class {
  constructor(apiKey, deviceId) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.bee.computer/v1";
    this.deviceId = deviceId;
  }
  /**
   * Make an authenticated request to the Bee API
   * 
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters
   * @param method - HTTP method
   * @returns JSON response
   */
  async makeRequest(endpoint, params, method = "GET") {
    if (!this.apiKey) {
      throw new Error("Bee API key not configured");
    }
    const options = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      }
    };
    if (this.deviceId) {
      options.headers["X-Device-ID"] = this.deviceId;
    }
    if (params) {
      if (method === "GET") {
        options.params = params;
      } else {
        options.data = params;
      }
    }
    try {
      const response = await axios3(options);
      return response.data;
    } catch (error) {
      console.error(
        `Bee API request failed (${endpoint}):`,
        error.response?.data || error.message
      );
      throw error;
    }
  }
  /**
   * Get recent transcription memories from the Bee device
   * 
   * @param limit - Maximum number of memories to return
   * @param includeInsights - Whether to include AI-generated insights
   * @returns List of transcription memories
   */
  async getRecentMemories(limit = 20, includeInsights = true) {
    const params = {
      limit,
      include_insights: includeInsights
    };
    try {
      const response = await this.makeRequest("/memories", params);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch recent memories:", error);
      return [];
    }
  }
  /**
   * Get transcription memories created since a specific time
   * 
   * @param sinceTime - Only get memories created after this time
   * @param limit - Maximum number of memories to return
   * @returns List of transcription memories
   */
  async getMemoriesSince(sinceTime, limit = 50) {
    const params = {
      start_date: sinceTime.toISOString(),
      limit
    };
    try {
      const response = await this.makeRequest("/memories", params);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch memories since:", error);
      return [];
    }
  }
  /**
   * Get a specific transcription memory by ID
   * 
   * @param id - The unique ID of the memory
   * @returns The transcription memory or null if not found
   */
  async getMemoryById(id) {
    try {
      const response = await this.makeRequest(`/memories/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch memory ${id}:`, error);
      return null;
    }
  }
  /**
   * Search transcription memories using natural language or keywords
   * 
   * @param searchQuery - Search parameters and filters
   * @returns Matching transcription memories
   */
  async searchMemories(searchQuery) {
    try {
      const response = await this.makeRequest("/memories/search", searchQuery, "POST");
      return response.data || [];
    } catch (error) {
      console.error("Search memories failed:", error);
      return [];
    }
  }
  /**
   * Get daily conversation summaries
   * 
   * @param date - Specific date (YYYY-MM-DD) or leave empty for today
   * @param includePrevious - Number of previous days to include
   * @returns Daily conversation summaries
   */
  async getDailySummaries(date, includePrevious = 0) {
    const params = {};
    if (date) {
      params.date = date;
    }
    if (includePrevious > 0) {
      params.previous_days = includePrevious;
    }
    try {
      const response = await this.makeRequest("/summaries/daily", params);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch daily summaries:", error);
      return [];
    }
  }
  /**
   * Get the personal knowledge graph built from conversations
   * 
   * @param entityType - Filter by entity type
   * @param minMentions - Minimum number of mentions for entities
   * @returns Knowledge graph with entities and relationships
   */
  async getKnowledgeGraph(entityType, minMentions = 1) {
    const params = {
      min_mentions: minMentions
    };
    if (entityType) {
      params.entity_type = entityType;
    }
    try {
      const response = await this.makeRequest("/knowledge-graph", params);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch knowledge graph:", error);
      return null;
    }
  }
  /**
   * Get insights and analytics about conversation patterns
   * 
   * @param timeRange - Time range for analytics ('day', 'week', 'month')
   * @returns Conversation insights and analytics
   */
  async getInsights(timeRange = "week") {
    const params = {
      time_range: timeRange
    };
    try {
      const response = await this.makeRequest("/insights", params);
      return response.data || {};
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      return {};
    }
  }
  /**
   * Extract readable text content from a transcription memory
   * 
   * @param memory - A transcription memory from Bee
   * @returns Plain text content with speaker labels
   */
  extractTextContent(memory) {
    if (memory.speakers && memory.speakers.length > 0) {
      let formattedText = "";
      const allSegments = memory.speakers.flatMap(
        (speaker) => speaker.segments.map((segment) => ({
          ...segment,
          speaker_name: speaker.name || `Speaker ${speaker.speaker_id}`
        }))
      ).sort((a, b) => a.start_time - b.start_time);
      let currentSpeaker = "";
      for (const segment of allSegments) {
        if (segment.speaker_name !== currentSpeaker) {
          if (formattedText) formattedText += "\n\n";
          formattedText += `${segment.speaker_name}: `;
          currentSpeaker = segment.speaker_name;
        } else {
          formattedText += " ";
        }
        formattedText += segment.text;
      }
      return formattedText;
    }
    return memory.transcript;
  }
  /**
   * Test the connection to the Bee API using the provided API key
   * @returns Connection status and device info if successful
   */
  async testConnection() {
    try {
      const response = await this.makeRequest("/device/status");
      return {
        status: "connected",
        device: response.data,
        meta: response.meta
      };
    } catch (error) {
      console.error("Failed to connect to Bee API:", error);
      return {
        status: "error",
        meta: { error: error instanceof Error ? error.message : "Unknown error" }
      };
    }
  }
  /**
   * Update device settings
   * 
   * @param settings - Device configuration settings
   * @returns Updated settings
   */
  async updateDeviceSettings(settings2) {
    try {
      const response = await this.makeRequest("/device/settings", settings2, "PUT");
      return response.data || {};
    } catch (error) {
      console.error("Failed to update device settings:", error);
      throw error;
    }
  }
  /**
   * Delete a specific memory
   * 
   * @param id - Memory ID to delete
   * @returns Success status
   */
  async deleteMemory(id) {
    try {
      await this.makeRequest(`/memories/${id}`, void 0, "DELETE");
      return true;
    } catch (error) {
      console.error(`Failed to delete memory ${id}:`, error);
      return false;
    }
  }
  /**
   * Check if the client is healthy and can connect to the Bee API
   * @returns true if API is reachable, false otherwise
   */
  async isHealthy() {
    try {
      const status = await this.testConnection();
      return status.status === "connected";
    } catch (error) {
      return false;
    }
  }
};

// server/mcp/bee/beeMcpServer.ts
var BeeMcpServer = class {
  constructor(apiKey, deviceId) {
    this.tools = [];
    this.client = new BeeClient(apiKey, deviceId);
    this.initTools();
  }
  /**
   * Initialize the tools array
   */
  initTools() {
    this.tools = [
      {
        name: "bee_get_recent_memories",
        description: "Get recent transcription memories from Bee device",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 20)"
            },
            include_insights: {
              type: "boolean",
              description: "Whether to include AI-generated insights (default: true)"
            }
          }
        }
      },
      {
        name: "bee_search_memories",
        description: "Search transcription memories from Bee device by query and filters",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query to filter memories"
            },
            date_from: {
              type: "string",
              description: "Optional start date (ISO format) to filter memories"
            },
            date_to: {
              type: "string",
              description: "Optional end date (ISO format) to filter memories"
            },
            speakers: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Optional list of speaker IDs to filter by"
            },
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 50)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "bee_get_memory_by_id",
        description: "Get a specific transcription memory from Bee device by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the memory"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "bee_get_daily_summaries",
        description: "Get daily conversation summaries from Bee device",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Optional date in YYYY-MM-DD format (default: today)"
            },
            include_previous: {
              type: "integer",
              description: "Number of previous days to include (default: 0)"
            }
          }
        }
      },
      {
        name: "bee_get_knowledge_graph",
        description: "Get the personal knowledge graph built from Bee conversations",
        parameters: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Optional filter by entity type (person, organization, etc.)"
            },
            min_mentions: {
              type: "integer",
              description: "Minimum number of mentions for entities (default: 1)"
            }
          }
        }
      },
      {
        name: "bee_get_insights",
        description: "Get insights and analytics about conversation patterns from Bee",
        parameters: {
          type: "object",
          properties: {
            time_range: {
              type: "string",
              enum: ["day", "week", "month"],
              description: "Time range for analytics (default: week)"
            }
          }
        }
      }
    ];
  }
  /**
   * Get the cached tools array
   */
  getTools() {
    return this.tools;
  }
  /**
   * List available tools for the Bee MCP server
   */
  async listTools() {
    return [
      {
        name: "bee_get_recent_memories",
        description: "Get recent transcription memories from Bee device",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 20)"
            },
            include_insights: {
              type: "boolean",
              description: "Whether to include AI-generated insights (default: true)"
            }
          }
        }
      },
      {
        name: "bee_search_memories",
        description: "Search transcription memories from Bee device by query and filters",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query to filter memories"
            },
            date_from: {
              type: "string",
              description: "Optional start date (ISO format) to filter memories"
            },
            date_to: {
              type: "string",
              description: "Optional end date (ISO format) to filter memories"
            },
            speakers: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Optional list of speaker IDs to filter by"
            },
            limit: {
              type: "integer",
              description: "Maximum number of memories to return (default: 50)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "bee_get_memory_by_id",
        description: "Get a specific transcription memory from Bee device by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the memory"
            }
          },
          required: ["id"]
        }
      },
      {
        name: "bee_get_daily_summaries",
        description: "Get daily conversation summaries from Bee device",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Optional date in YYYY-MM-DD format (default: today)"
            },
            include_previous: {
              type: "integer",
              description: "Number of previous days to include (default: 0)"
            }
          }
        }
      },
      {
        name: "bee_get_knowledge_graph",
        description: "Get the personal knowledge graph built from Bee conversations",
        parameters: {
          type: "object",
          properties: {
            entity_type: {
              type: "string",
              description: "Optional filter by entity type (person, organization, etc.)"
            },
            min_mentions: {
              type: "integer",
              description: "Minimum number of mentions for entities (default: 1)"
            }
          }
        }
      },
      {
        name: "bee_get_insights",
        description: "Get insights and analytics about conversation patterns from Bee",
        parameters: {
          type: "object",
          properties: {
            time_range: {
              type: "string",
              enum: ["day", "week", "month"],
              description: "Time range for analytics (default: week)"
            }
          }
        }
      }
    ];
  }
  /**
   * Execute a tool call against the Bee API
   */
  async executeToolCall(toolCall) {
    const { name, parameters } = toolCall;
    switch (name) {
      case "bee_get_recent_memories": {
        const { limit = 20, include_insights = true } = parameters;
        const memories2 = await this.client.getRecentMemories(limit, include_insights);
        return {
          memories: memories2.map((memory) => ({
            id: memory.id,
            title: memory.title,
            created_at: memory.created_at,
            transcript: this.client.extractTextContent(memory),
            language: memory.language,
            confidence_score: memory.confidence_score,
            metadata: memory.metadata || {},
            insights: memory.insights || {}
          }))
        };
      }
      case "bee_search_memories": {
        const {
          query,
          date_from,
          date_to,
          speakers,
          limit = 50
        } = parameters;
        const searchQuery = {
          query,
          filters: {},
          limit
        };
        if (date_from) searchQuery.filters.date_from = date_from;
        if (date_to) searchQuery.filters.date_to = date_to;
        if (speakers) searchQuery.filters.speakers = speakers;
        const memories2 = await this.client.searchMemories(searchQuery);
        return {
          memories: memories2.map((memory) => ({
            id: memory.id,
            title: memory.title,
            created_at: memory.created_at,
            transcript: this.client.extractTextContent(memory),
            language: memory.language,
            confidence_score: memory.confidence_score,
            metadata: memory.metadata || {},
            insights: memory.insights || {}
          })),
          query: searchQuery
        };
      }
      case "bee_get_memory_by_id": {
        const { id } = parameters;
        const memory = await this.client.getMemoryById(id);
        if (!memory) {
          throw new Error(`Memory with ID ${id} not found`);
        }
        return {
          memory: {
            id: memory.id,
            title: memory.title,
            created_at: memory.created_at,
            transcript: this.client.extractTextContent(memory),
            language: memory.language,
            confidence_score: memory.confidence_score,
            metadata: memory.metadata || {},
            insights: memory.insights || {}
          }
        };
      }
      case "bee_get_daily_summaries": {
        const { date, include_previous = 0 } = parameters;
        const summaries = await this.client.getDailySummaries(date, include_previous);
        return {
          summaries: summaries.map((summary) => ({
            id: summary.id,
            date: summary.date,
            title: summary.title,
            summary: summary.summary,
            key_points: summary.key_points,
            participants: summary.participants,
            duration_minutes: summary.duration_minutes,
            memory_ids: summary.memory_ids,
            insights: summary.insights || {}
          }))
        };
      }
      case "bee_get_knowledge_graph": {
        const { entity_type, min_mentions = 1 } = parameters;
        const graph = await this.client.getKnowledgeGraph(entity_type, min_mentions);
        if (!graph) {
          return {
            knowledge_graph: {
              entities: [],
              relationships: []
            },
            message: "No knowledge graph data available"
          };
        }
        return {
          knowledge_graph: graph
        };
      }
      case "bee_get_insights": {
        const { time_range = "week" } = parameters;
        const insights = await this.client.getInsights(time_range);
        return {
          insights,
          time_range
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
  /**
   * Check if the service is healthy by testing the connection to the Bee API
   */
  async isHealthy() {
    return this.client.isHealthy();
  }
  /**
   * Handle a generic request to the MCP server
   * This provides compatibility with the MCP router
   */
  async handleRequest(request) {
    const { type } = request;
    switch (type) {
      case "list_tools":
        return {
          tools: await this.listTools()
        };
      case "execute_tool":
        if (!request.name) {
          throw new Error("Tool name is required");
        }
        return this.executeToolCall({
          name: request.name,
          parameters: request.arguments || {}
        });
      default:
        throw new Error(`Unsupported request type: ${type}`);
    }
  }
  /**
   * Create a streaming handler for the MCP server
   * This provides compatibility with the MCP router's streaming API
   */
  createStreamingHandler(options) {
    const { emit } = options;
    return async (data) => {
      try {
        const result = await this.executeToolCall({
          name: data.name,
          parameters: data.arguments || {}
        });
        return result;
      } catch (error) {
        console.error(`Error in Bee MCP streaming handler:`, error);
        throw error;
      }
    };
  }
};
function createBeeMcpServer(apiKey, deviceId) {
  return new BeeMcpServer(apiKey, deviceId);
}

// server/mcp/cognos/cognosMcpServer.ts
import { EventEmitter as EventEmitter2 } from "events";
import { exec } from "child_process";
import { promisify } from "util";
import path2 from "path";
import fs2 from "fs";

// server/mcp/cognos/cognosTools.ts
import { z as z2 } from "zod";

// server/mcp/cognos/omiMemoryClient.ts
import axios4 from "axios";
import * as dotenv2 from "dotenv";
dotenv2.config();
var MemoryFilterOptions = /* @__PURE__ */ ((MemoryFilterOptions3) => {
  MemoryFilterOptions3["PERSONAL"] = "personal";
  MemoryFilterOptions3["BUSINESS"] = "business";
  MemoryFilterOptions3["MEETING"] = "meeting";
  MemoryFilterOptions3["CONVERSATION"] = "conversation";
  MemoryFilterOptions3["LECTURE"] = "lecture";
  MemoryFilterOptions3["NOTE"] = "note";
  return MemoryFilterOptions3;
})(MemoryFilterOptions || {});
var OmiMemoryClient = class {
  constructor() {
    const apiKey = process.env.OMI_API_KEY;
    this.uid = process.env.OMI_UID || "";
    if (!apiKey) {
      throw new Error("OMI_API_KEY environment variable is required");
    }
    if (!this.uid) {
      console.warn("OMI_UID not set in environment variables. You will need to provide UID for each request.");
    }
    this.client = axios4.create({
      baseURL: process.env.OMI_API_ENDPOINT || "https://api.omi.me/v1",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
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
  async getMemories(uid, limit = 100, categories = []) {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error("User ID is required");
    }
    try {
      const params = {
        limit
      };
      if (categories && categories.length > 0) {
        params.categories = categories;
      }
      const response = await this.client.get(`/users/${userId}/memories`, { params });
      return response.data;
    } catch (error) {
      console.error("Failed to get memories:", error.message);
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
  async createMemory(content, category, uid) {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error("User ID is required");
    }
    try {
      const response = await this.client.post(`/users/${userId}/memories`, {
        content,
        category
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create memory:", error.message);
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
  async createMemoryFromAudio(audioFilePath, category = "conversation" /* CONVERSATION */, uid) {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error("User ID is required");
    }
    try {
      const formData = new FormData();
      formData.append("audio", await this.fileToBlob(audioFilePath));
      formData.append("category", category);
      const response = await this.client.post(
        `/users/${userId}/memories/audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create memory from audio:", error.message);
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
  async deleteMemory(memoryId, uid) {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error("User ID is required");
    }
    try {
      const response = await this.client.delete(`/users/${userId}/memories/${memoryId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to delete memory:", error.message);
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
  async editMemory(memoryId, content, uid) {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error("User ID is required");
    }
    try {
      const response = await this.client.put(`/users/${userId}/memories/${memoryId}`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error("Failed to edit memory:", error.message);
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
  async getConversations(uid, includeDiscarded = false, limit = 25) {
    const userId = uid || this.uid;
    if (!userId) {
      throw new Error("User ID is required");
    }
    try {
      const response = await this.client.get(`/users/${userId}/conversations`, {
        params: {
          include_discarded: includeDiscarded,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get conversations:", error.message);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }
  /**
   * Helper method to convert a file to a Blob
   * 
   * @param filePath Path to the file
   * @returns Blob of the file
   */
  async fileToBlob(filePath) {
    const fs5 = __require("fs").promises;
    const buffer = await fs5.readFile(filePath);
    return new Blob([buffer]);
  }
};
var omiMemoryClient_default = OmiMemoryClient;

// server/mcp/cognos/cognosTools.ts
var processCognosAudioTool = {
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
var streamOmiAudioTool = {
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
var processCognosAudioSchema = z2.object({
  audio_file_path: z2.string().describe("Path to the audio file to process"),
  enable_vad: z2.boolean().default(true).describe("Enable Voice Activity Detection"),
  enable_diarization: z2.boolean().default(true).describe("Enable speaker diarization"),
  enable_transcription: z2.boolean().default(true).describe("Enable audio transcription")
});
var streamOmiAudioSchema = z2.object({
  device_id: z2.string().optional().describe("Optional Omi device ID to connect to"),
  duration_seconds: z2.number().min(1).max(60).default(10).describe("Duration to stream audio in seconds"),
  enable_vad: z2.boolean().default(true).describe("Enable Voice Activity Detection"),
  enable_diarization: z2.boolean().default(true).describe("Enable speaker diarization"),
  enable_transcription: z2.boolean().default(true).describe("Enable audio transcription")
});
var getMemoriesTool = {
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
var createMemoryTool = {
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
var createMemoryFromAudioTool = {
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
var deleteMemoryTool = {
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
var editMemoryTool = {
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
var getConversationsTool = {
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
var getMemoriesSchema = z2.object({
  uid: z2.string().describe("The user's unique identifier"),
  limit: z2.number().positive().max(1e3).default(100).describe("Maximum number of memories to retrieve"),
  categories: z2.array(z2.nativeEnum(MemoryFilterOptions)).optional().describe("Categories of memories to retrieve")
});
var createMemorySchema = z2.object({
  uid: z2.string().describe("The user's unique identifier"),
  content: z2.string().describe("Content of the memory"),
  category: z2.nativeEnum(MemoryFilterOptions).describe("Category of the memory")
});
var createMemoryFromAudioSchema = z2.object({
  uid: z2.string().describe("The user's unique identifier"),
  audio_file_path: z2.string().describe("Path to the audio file"),
  category: z2.nativeEnum(MemoryFilterOptions).default("conversation" /* CONVERSATION */).describe("Category of the memory")
});
var deleteMemorySchema = z2.object({
  uid: z2.string().describe("The user's unique identifier"),
  memory_id: z2.string().describe("ID of the memory to delete")
});
var editMemorySchema = z2.object({
  uid: z2.string().describe("The user's unique identifier"),
  memory_id: z2.string().describe("ID of the memory to edit"),
  content: z2.string().describe("New content for the memory")
});
var getConversationsSchema = z2.object({
  uid: z2.string().describe("The user's unique identifier"),
  include_discarded: z2.boolean().default(false).describe("Whether to include discarded conversations"),
  limit: z2.number().positive().max(100).default(25).describe("Maximum number of conversations to retrieve")
});
var cognosTools = [
  processCognosAudioTool,
  streamOmiAudioTool,
  getMemoriesTool,
  createMemoryTool,
  createMemoryFromAudioTool,
  deleteMemoryTool,
  editMemoryTool,
  getConversationsTool
];

// server/mcp/cognos/cognosMcpServer.ts
var execAsync = promisify(exec);
var cognosEventEmitter = new EventEmitter2();
var CognosMcpServer = class {
  constructor(pythonPath, cognosPipelinePath, omiMemoryClient) {
    this.omiMemoryClient = null;
    /**
     * Get list of available tools
     */
    this.handleListTools = async () => {
      return {
        tools: cognosTools
      };
    };
    /**
     * Handle a tool call
     */
    this.handleCallTool = async (request) => {
      const { name, arguments: args } = request.params;
      try {
        cognosEventEmitter.emit("tool-call", name, args);
        return await this.handleToolCall(name, args);
      } catch (error) {
        console.error("Error handling tool call:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message || "Unknown error"}`
            }
          ],
          isError: true
        };
      }
    };
    this.pythonPath = pythonPath;
    this.cognosPipelinePath = cognosPipelinePath;
    if (omiMemoryClient) {
      this.omiMemoryClient = omiMemoryClient;
      console.log("Using provided Omi Memory client");
    } else {
      try {
        this.omiMemoryClient = new omiMemoryClient_default();
        console.log("Omi Memory API client initialized");
      } catch (error) {
        console.warn("Failed to initialize Omi Memory client (missing API key):", error);
        this.omiMemoryClient = null;
      }
    }
    this.setupEventHandlers();
  }
  /**
   * Set up event handlers for real-time data processing
   */
  setupEventHandlers() {
    cognosEventEmitter.on("tool-call", async (toolName, args) => {
      console.log(`Tool call received: ${toolName}`, args);
      try {
        const result = await this.handleToolCall(toolName, args);
        cognosEventEmitter.emit("tool-result", toolName, result);
      } catch (error) {
        console.error(`Error in tool call ${toolName}:`, error);
        cognosEventEmitter.emit("tool-error", toolName, error);
      }
    });
  }
  /**
   * List available tools (compatibility with McpServerWithRouter interface)
   */
  async listTools() {
    return cognosTools;
  }
  /**
   * Get cached tools array
   */
  getTools() {
    return cognosTools;
  }
  /**
   * Execute a tool call directly (compatibility with McpServerWithRouter interface)
   */
  async executeToolCall(toolCall) {
    return this.handleToolCall(toolCall.name, toolCall.parameters);
  }
  /**
   * Private method to handle tool call
   */
  async handleToolCall(toolName, args) {
    try {
      switch (toolName) {
        case "process_cognos_audio":
          return await this.handleProcessCognosAudio(args);
        case "stream_omi_audio":
          return await this.handleStreamOmiAudio(args);
        // Memory API tools
        case "get_memories":
          return await this.handleGetMemories(args);
        case "create_memory":
          return await this.handleCreateMemory(args);
        case "create_memory_from_audio":
          return await this.handleCreateMemoryFromAudio(args);
        case "delete_memory":
          return await this.handleDeleteMemory(args);
        case "edit_memory":
          return await this.handleEditMemory(args);
        case "get_conversations":
          return await this.handleGetConversations(args);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error in ${toolName}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message || "Unknown error"}`
          }
        ],
        isError: true
      };
    }
  }
  /**
   * Handle process_cognos_audio tool calls
   */
  async handleProcessCognosAudio(args) {
    const { audio_file_path, enable_vad = true, enable_diarization = true, enable_transcription = true } = args;
    if (!audio_file_path) {
      throw new Error("audio_file_path is required");
    }
    try {
      const pythonCommand = `${this.pythonPath} -c "
import json
import sys
sys.path.append('${this.cognosPipelinePath}')
try:
    from src.main_pipeline import process_audio
    import asyncio
    result = asyncio.run(process_audio(
        '${audio_file_path}',
        enable_vad=${enable_vad ? "True" : "False"},
        enable_diarization=${enable_diarization ? "True" : "False"},
        enable_transcription=${enable_transcription ? "True" : "False"}
    ))
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`;
      console.log(`Executing Python command: ${pythonCommand}`);
      const { stdout, stderr } = await execAsync(pythonCommand, {
        timeout: 12e4
        // 2-minute timeout for audio processing
      });
      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
      }
      let parsedResult;
      try {
        parsedResult = JSON.parse(stdout);
        if (parsedResult.error) {
          throw new Error(parsedResult.error);
        }
      } catch (parseError) {
        console.error("Error parsing Python output:", parseError);
        throw new Error(`Failed to parse Python output: ${stdout}`);
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              vad_segments: parsedResult.vad_segments || [],
              transcription: parsedResult.transcription || "",
              speakers: parsedResult.speakers || [],
              processing_metadata: parsedResult.manifest_summary || {}
            }, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      throw error;
    }
  }
  /**
   * Handle stream_omi_audio tool calls - connects to Omi device and processes audio
   */
  async handleStreamOmiAudio(args) {
    const {
      device_id,
      duration_seconds = 10,
      enable_vad = true,
      enable_diarization = true,
      enable_transcription = true
    } = args;
    try {
      const pythonCommand = `${this.pythonPath} -c "
import json
import sys
sys.path.append('${this.cognosPipelinePath}')
try:
    from src.omi_cognos_bridge import stream_and_process_audio
    import asyncio
    result = asyncio.run(stream_and_process_audio(
        device_id='${device_id || ""}',
        duration_seconds=${duration_seconds},
        enable_vad=${enable_vad ? "True" : "False"},
        enable_diarization=${enable_diarization ? "True" : "False"},
        enable_transcription=${enable_transcription ? "True" : "False"}
    ))
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`;
      console.log(`Executing Python command for Omi streaming: ${pythonCommand}`);
      const { stdout, stderr } = await execAsync(pythonCommand, {
        timeout: (duration_seconds + 30) * 1e3
        // Add 30 seconds to the requested duration for processing
      });
      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
      }
      let parsedResult;
      try {
        parsedResult = JSON.parse(stdout);
        if (parsedResult.error) {
          throw new Error(parsedResult.error);
        }
      } catch (parseError) {
        console.error("Error parsing Python output:", parseError);
        throw new Error(`Failed to parse Python output: ${stdout}`);
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              device_id: parsedResult.device_id || device_id,
              duration_seconds: parsedResult.actual_duration || duration_seconds,
              vad_segments: parsedResult.vad_segments || [],
              transcription: parsedResult.transcription || "",
              speakers: parsedResult.speakers || [],
              processing_metadata: parsedResult.manifest_summary || {}
            }, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      console.error("Error streaming from Omi device:", error);
      throw error;
    }
  }
  /**
   * Process an MCP request of any supported type
   */
  async handleRequest(request) {
    switch (request.type) {
      case "list_tools":
        return this.handleListTools(request);
      case "call_tool":
        return this.handleCallTool(request);
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }
  /**
   * Check if the service is healthy
   */
  async isHealthy() {
    try {
      const checkCommand = `${this.pythonPath} -c "
import sys
sys.path.append('${this.cognosPipelinePath}')
try:
    from src.main_pipeline import process_audio
    print('healthy')
except Exception as e:
    print(f'unhealthy: {str(e)}')
exit(0)
"`;
      const { stdout } = await execAsync(checkCommand, { timeout: 5e3 });
      return stdout.trim() === "healthy";
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
  /**
   * Create a streaming response handler that emits events as data is processed
   * @param options Options with emit function for handling events
   */
  createStreamingHandler(options) {
    const handleToolResult = (toolName, result) => {
      options.emit("data", result);
    };
    const handleToolError = (toolName, error) => {
      options.emit("error", error instanceof Error ? error.message : "Unknown error");
    };
    cognosEventEmitter.on("tool-result", handleToolResult);
    cognosEventEmitter.on("tool-error", handleToolError);
    options.emit = (...args) => {
      if (args[0] === "end") {
        cognosEventEmitter.off("tool-result", handleToolResult);
        cognosEventEmitter.off("tool-error", handleToolError);
      }
    };
    return async (data) => {
      try {
        const result = await this.handleToolCall(data.name, data.arguments || {});
        return result;
      } catch (error) {
        console.error(`Error in Cognos streaming handler:`, error);
        throw error;
      }
    };
  }
  /**
   * Check if Omi Memory Client is available
   */
  checkMemoryClient() {
    if (!this.omiMemoryClient) {
      throw new Error("Omi Memory client not available. Please set OMI_API_KEY and OMI_UID environment variables.");
    }
  }
  /**
   * Handle get_memories tool calls
   */
  async handleGetMemories(args) {
    this.checkMemoryClient();
    try {
      const validatedArgs = getMemoriesSchema.parse(args);
      const memories2 = await this.omiMemoryClient.getMemories(
        validatedArgs.uid,
        validatedArgs.limit,
        validatedArgs.categories
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memories2, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      throw new Error(`Error getting memories: ${error.message}`);
    }
  }
  /**
   * Handle create_memory tool calls
   */
  async handleCreateMemory(args) {
    this.checkMemoryClient();
    try {
      const validatedArgs = createMemorySchema.parse(args);
      const memory = await this.omiMemoryClient.createMemory(
        validatedArgs.content,
        validatedArgs.category,
        validatedArgs.uid
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memory, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      throw new Error(`Error creating memory: ${error.message}`);
    }
  }
  /**
   * Handle create_memory_from_audio tool calls
   */
  async handleCreateMemoryFromAudio(args) {
    this.checkMemoryClient();
    try {
      const validatedArgs = createMemoryFromAudioSchema.parse(args);
      if (!fs2.existsSync(validatedArgs.audio_file_path)) {
        throw new Error(`Audio file not found: ${validatedArgs.audio_file_path}`);
      }
      const memory = await this.omiMemoryClient.createMemoryFromAudio(
        validatedArgs.audio_file_path,
        validatedArgs.category,
        validatedArgs.uid
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memory, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      throw new Error(`Error creating memory from audio: ${error.message}`);
    }
  }
  /**
   * Handle delete_memory tool calls
   */
  async handleDeleteMemory(args) {
    this.checkMemoryClient();
    try {
      const validatedArgs = deleteMemorySchema.parse(args);
      const result = await this.omiMemoryClient.deleteMemory(
        validatedArgs.memory_id,
        validatedArgs.uid
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      throw new Error(`Error deleting memory: ${error.message}`);
    }
  }
  /**
   * Handle edit_memory tool calls
   */
  async handleEditMemory(args) {
    this.checkMemoryClient();
    try {
      const validatedArgs = editMemorySchema.parse(args);
      const result = await this.omiMemoryClient.editMemory(
        validatedArgs.memory_id,
        validatedArgs.content,
        validatedArgs.uid
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      throw new Error(`Error editing memory: ${error.message}`);
    }
  }
  /**
   * Handle get_conversations tool calls
   */
  async handleGetConversations(args) {
    this.checkMemoryClient();
    try {
      const validatedArgs = getConversationsSchema.parse(args);
      const conversations2 = await this.omiMemoryClient.getConversations(
        validatedArgs.uid,
        validatedArgs.include_discarded,
        validatedArgs.limit
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(conversations2, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      throw new Error(`Error getting conversations: ${error.message}`);
    }
  }
};
function createCognosMcpServer(pythonPath = "python", cognosPipelinePath = path2.resolve(process.cwd()), omiMemoryClient) {
  return new CognosMcpServer(pythonPath, cognosPipelinePath, omiMemoryClient);
}

// server/mcp/auth/authProvider.ts
var InMemoryTokenStore = class {
  constructor() {
    this.tokens = {};
  }
  getKey(userId, provider) {
    return `${userId}:${provider}`;
  }
  async getToken(userId, provider) {
    const key = this.getKey(userId, provider);
    const entry = this.tokens[key];
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && entry.expiresAt < /* @__PURE__ */ new Date()) {
      return null;
    }
    return entry.token;
  }
  async saveToken(userId, provider, token, expiresIn) {
    const key = this.getKey(userId, provider);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1e3) : void 0;
    this.tokens[key] = { token, expiresAt };
  }
  async refreshToken(userId, provider) {
    return null;
  }
  async revokeToken(userId, provider) {
    const key = this.getKey(userId, provider);
    delete this.tokens[key];
  }
};

// server/mcp/auth/securityMiddleware.ts
var SecurityMiddleware = class {
  constructor(tokenStore2) {
    /**
     * Middleware to enforce authentication
     */
    this.authenticate = async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: "Authorization header missing" });
        }
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
          return res.status(401).json({ error: "Invalid authorization format" });
        }
        const token = parts[1];
        const userId = req.session?.userId;
        if (!userId) {
          return res.status(401).json({ error: "User not authenticated" });
        }
        req.authToken = token;
        req.userId = userId;
        next();
      } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ error: "Authentication failed" });
      }
    };
    /**
     * Middleware to enforce appropriate authorization
     */
    this.authorize = (requiredScope) => {
      return async (req, res, next) => {
        try {
          const token = req.authToken;
          const userId = req.userId;
          if (!token || !userId) {
            return res.status(401).json({ error: "Not authenticated" });
          }
          next();
        } catch (error) {
          console.error("Authorization error:", error);
          res.status(403).json({ error: "Not authorized for this operation" });
        }
      };
    };
    /**
     * Rate limiting middleware
     */
    this.rateLimit = (maxRequests, windowMs) => {
      const requestCounts = {};
      return (req, res, next) => {
        const userId = req.userId || req.ip;
        const now = Date.now();
        if (!requestCounts[userId] || requestCounts[userId].resetTime < now) {
          requestCounts[userId] = {
            count: 0,
            resetTime: now + windowMs
          };
        }
        requestCounts[userId].count++;
        if (requestCounts[userId].count > maxRequests) {
          return res.status(429).json({
            error: "Too many requests",
            retryAfter: Math.ceil((requestCounts[userId].resetTime - now) / 1e3)
          });
        }
        next();
      };
    };
    /**
     * Content validation middleware
     */
    this.validateContent = (schema) => {
      return (req, res, next) => {
        try {
          const validationResult = { valid: true, errors: [] };
          if (!validationResult.valid) {
            return res.status(400).json({
              error: "Invalid request body",
              details: validationResult.errors
            });
          }
          next();
        } catch (error) {
          console.error("Validation error:", error);
          res.status(400).json({ error: "Invalid request format" });
        }
      };
    };
    this.tokenStore = tokenStore2;
  }
};

// server/mcp/mcpRouter.ts
import path3 from "path";
var MockOmiMemoryClient = null;
if (process.env.NODE_ENV === "development" || process.env.USE_MOCK_CLIENTS === "true") {
  try {
    import("node:fs/promises").then(async (fs5) => {
      const mockClientPath = path3.join(process.cwd(), "cognos_pipeline", "mockOmiMemoryClient.js");
      try {
        if (await fs5.access(mockClientPath).then(() => true).catch(() => false)) {
          import(mockClientPath).then((mockModule) => {
            MockOmiMemoryClient = mockModule.MockOmiMemoryClient;
            console.log("\u2705 MockOmiMemoryClient loaded for testing");
          }).catch((err) => {
            console.log("\u26A0\uFE0F Error importing MockOmiMemoryClient:", err instanceof Error ? err.message : String(err));
          });
        } else {
          console.log("\u26A0\uFE0F MockOmiMemoryClient file not found at:", mockClientPath);
        }
      } catch (fsError) {
        console.log("\u26A0\uFE0F Error checking MockOmiMemoryClient file:", fsError instanceof Error ? fsError.message : String(fsError));
      }
    }).catch((error) => {
      console.log("\u26A0\uFE0F Failed to load fs module:", error instanceof Error ? error.message : String(error));
    });
  } catch (error) {
    console.log("\u26A0\uFE0F Failed to setup MockOmiMemoryClient import:", error instanceof Error ? error.message : String(error));
  }
} else {
  console.log("Production mode - not loading mock clients");
}
var tokenStore = new InMemoryTokenStore();
var securityMiddleware = new SecurityMiddleware(tokenStore);
var router = Router();
var mcpRoutingService = {
  // Route a user request to appropriate tools
  routeRequest: async (request) => {
    const { userMessage, userId, conversationContext = [] } = request;
    console.log(`Routing request for user ${userId}: "${userMessage.substring(0, 50)}..."`);
    const enabledTools = determineEnabledTools(userMessage, conversationContext);
    return {
      routingDecision: {
        reasoning: `Selected tools based on message content: "${userMessage.substring(0, 30)}..."`,
        confidence: 0.85
        // Placeholder confidence score
      },
      enabledTools
    };
  },
  // Execute a tool by server and tool name
  executeTool: async (serverName, toolName, args) => {
    return executeMCPTool(serverName, toolName, args);
  },
  // List all available tools
  listTools: () => {
    return listMCPTools();
  },
  // Get a specific MCP server
  getServer: (serverName) => {
    return mcpServers[serverName] || null;
  },
  // Check if an MCP server exists
  hasServer: (serverName) => {
    return !!mcpServers[serverName];
  }
};
function determineEnabledTools(userMessage, conversationContext = []) {
  const message = userMessage.toLowerCase();
  const enabledTools = [];
  if (message.includes("search") || message.includes("find") || message.includes("look up")) {
    enabledTools.push("search/web-search");
  }
  if (message.includes("memory") || message.includes("remember") || message.includes("recall")) {
    enabledTools.push("memory/retrieve");
  }
  if (message.includes("health") || message.includes("sleep") || message.includes("activity")) {
    enabledTools.push("oura/health-analysis");
  }
  if (message.includes("transcribe") || message.includes("audio") || message.includes("recording")) {
    enabledTools.push("bee/transcribe");
  }
  if (message.includes("limitless") || message.includes("notes") || message.includes("journal")) {
    enabledTools.push("limitless/get-recent-entries");
  }
  if (enabledTools.length === 0) {
    enabledTools.push("search/web-search");
  }
  return enabledTools;
}
var mcpServers = {};
async function executeMCPTool(serverName, toolName, args) {
  if (!mcpServers[serverName]) {
    throw new Error(`Server ${serverName} not found`);
  }
  const server = mcpServers[serverName];
  if (server.handleRequest && typeof server.handleRequest === "function") {
    return server.handleRequest({
      type: "execute_tool",
      name: toolName,
      arguments: args
    });
  } else if (server.executeToolCall && typeof server.executeToolCall === "function") {
    return server.executeToolCall({
      name: toolName,
      parameters: args
    });
  } else {
    throw new Error(`Server ${serverName} does not support tool execution`);
  }
}
function listMCPTools() {
  const allTools = [];
  for (const [serverName, server] of Object.entries(mcpServers)) {
    try {
      const serverTools = server.getTools ? server.getTools() : [];
      serverTools.forEach((tool) => {
        allTools.push(`${serverName}/${tool.name}`);
      });
    } catch (err) {
      console.error(`Error listing tools for server ${serverName}:`, err);
    }
  }
  return allTools;
}
async function initMcpServers() {
  console.log("Initializing MCP servers...");
  try {
    const ouraToken = process.env.OURA_TOKEN;
    if (ouraToken) {
      console.log("Initializing Oura MCP Server...");
      mcpServers.oura = createOuraMcpServer(ouraToken);
      console.log("Oura MCP Server initialized!");
    } else {
      console.log("Skipping Oura MCP Server initialization (OURA_TOKEN not found)");
    }
    console.log("Initializing Limitless MCP Server...");
    mcpServers.limitless = createLimitlessMcpServer("");
    console.log("Limitless MCP Server initialized!");
    const beeApiKey = process.env.BEE_API_KEY;
    if (beeApiKey) {
      console.log("Initializing Bee MCP Server...");
      mcpServers.bee = createBeeMcpServer(beeApiKey);
      console.log("Bee MCP Server initialized!");
    } else {
      console.log("Skipping Bee MCP Server initialization (BEE_API_KEY not found)");
    }
    console.log("Initializing Cognos MCP Server...");
    const pythonPath = process.env.COGNOS_PYTHON_PATH || "python";
    const cognosPipelinePath = process.env.COGNOS_PIPELINE_PATH || process.cwd();
    let mockClient = null;
    if (MockOmiMemoryClient) {
      mockClient = new MockOmiMemoryClient();
      console.log("Using MockOmiMemoryClient for Cognos MCP Server");
    }
    mcpServers.cognos = createCognosMcpServer(pythonPath, cognosPipelinePath, mockClient);
    console.log("Cognos MCP Server initialized!");
    console.log(`MCP servers initialized: ${Object.keys(mcpServers).join(", ")}`);
  } catch (error) {
    console.error("Error initializing MCP servers:", error);
  }
  console.log("WebSocket dependency check skipped in ESM mode");
}
router.get("/servers", (req, res) => {
  const servers = Object.keys(mcpServers).map((name) => ({
    name,
    status: "available",
    description: `${name.charAt(0).toUpperCase() + name.slice(1)} MCP server`
  }));
  res.json({ success: true, servers });
});
router.get("/:server/tools", async (req, res) => {
  const { server } = req.params;
  if (!mcpServers[server]) {
    return res.status(404).json({ error: `MCP server '${server}' not found` });
  }
  try {
    const mcpServer = mcpServers[server];
    let tools = [];
    if (mcpServer.listTools && typeof mcpServer.listTools === "function") {
      tools = await mcpServer.listTools();
    } else if (mcpServer.getTools && typeof mcpServer.getTools === "function") {
      tools = mcpServer.getTools();
    } else {
      tools = [];
    }
    res.json({ success: true, tools });
  } catch (error) {
    console.error(`Error listing tools for ${server}:`, error);
    res.status(500).json({ error: "Failed to list tools" });
  }
});
router.get("/:server/prompts", async (req, res) => {
  const { server } = req.params;
  if (!mcpServers[server]) {
    return res.status(404).json({ error: `MCP server '${server}' not found` });
  }
  try {
    const mcpServer = mcpServers[server];
    let prompts = [];
    if (mcpServer.listPrompts && typeof mcpServer.listPrompts === "function") {
      prompts = await mcpServer.listPrompts();
    } else {
      prompts = [];
    }
    res.json({ success: true, prompts });
  } catch (error) {
    console.error(`Error listing prompts for ${server}:`, error);
    res.status(500).json({ error: "Failed to list prompts" });
  }
});
router.get("/:server/prompts/:id", async (req, res) => {
  const { server, id } = req.params;
  if (!mcpServers[server]) {
    return res.status(404).json({ error: `MCP server '${server}' not found` });
  }
  try {
    const mcpServer = mcpServers[server];
    let prompt = null;
    if (mcpServer.getPrompt && typeof mcpServer.getPrompt === "function") {
      prompt = await mcpServer.getPrompt(id);
    } else {
      prompt = null;
    }
    res.json({ success: true, prompt });
  } catch (error) {
    console.error(`Error getting prompt ${id} for ${server}:`, error);
    res.status(500).json({ error: "Failed to get prompt" });
  }
});
router.get("/:server/health", async (req, res) => {
  const { server } = req.params;
  if (!mcpServers[server]) {
    return res.status(404).json({ success: false, message: `MCP server '${server}' not found` });
  }
  try {
    const mcpServer = mcpServers[server];
    let isHealthy = true;
    if (mcpServer.isHealthy && typeof mcpServer.isHealthy === "function") {
      isHealthy = await mcpServer.isHealthy();
    } else if (mcpServer.healthCheck && typeof mcpServer.healthCheck === "function") {
      isHealthy = await mcpServer.healthCheck();
    }
    res.json({ success: true, isHealthy });
  } catch (error) {
    console.error(`Error checking health of ${server}:`, error);
    res.status(500).json({ success: false, message: "Failed to check health" });
  }
});
router.post(
  "/:server/call-tool",
  securityMiddleware.rateLimit(100, 6e4),
  // Limit to 100 requests per minute
  async (req, res) => {
    const { server } = req.params;
    const { name, arguments: args } = req.body;
    if (!mcpServers[server]) {
      return res.status(404).json({ error: `MCP server '${server}' not found` });
    }
    if (!name) {
      return res.status(400).json({ error: "Tool name is required" });
    }
    try {
      const mcpServer = mcpServers[server];
      if (mcpServer.handleRequest && typeof mcpServer.handleRequest === "function") {
        const response = await mcpServer.handleRequest({
          type: "execute_tool",
          name,
          arguments: args || {}
        });
        res.json(response);
      } else if (mcpServer.executeToolCall && typeof mcpServer.executeToolCall === "function") {
        const response = await mcpServer.executeToolCall({
          name,
          parameters: args || {}
        });
        res.json(response);
      } else {
        throw new Error(`Server ${server} does not support tool execution`);
      }
    } catch (error) {
      console.error(`Error calling tool ${name} on ${server}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Tool call failed",
        message: errorMessage
      });
    }
  }
);
router.post(
  "/:server/call-tool-stream",
  securityMiddleware.rateLimit(60, 6e4),
  // Limit to 60 requests per minute for streaming
  async (req, res) => {
    const { server } = req.params;
    const { name, arguments: args } = req.body;
    if (!mcpServers[server]) {
      return res.status(404).json({ error: `MCP server '${server}' not found` });
    }
    if (!name) {
      return res.status(400).json({ error: "Tool name is required" });
    }
    try {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      const requestId = uuidv4();
      const emitter = {
        emit: (event, data) => {
          if (event === "data") {
            res.write(`data: ${JSON.stringify({ type: "chunk", chunk: data })}

`);
          } else if (event === "error") {
            res.write(`data: ${JSON.stringify({ type: "error", error: data })}

`);
            res.end();
          } else if (event === "end") {
            res.write(`data: ${JSON.stringify({ type: "end" })}

`);
            res.end();
          }
        }
      };
      if (!mcpServers[server].createStreamingHandler || typeof mcpServers[server].createStreamingHandler !== "function") {
        throw new Error(`Server ${server} does not support streaming`);
      }
      const streamingHandler = mcpServers[server].createStreamingHandler(emitter);
      if (streamingHandler) {
        const result = await streamingHandler({
          name,
          arguments: args || {}
        });
        res.write(`data: ${JSON.stringify({ type: "complete", result })}

`);
        res.end();
      } else {
        throw new Error(`Failed to create streaming handler for ${server}`);
      }
    } catch (error) {
      console.error(`Error in streaming tool call ${name} on ${server}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Streaming tool call failed", message: errorMessage }));
    }
  }
);
router.get("/tools", async (req, res) => {
  try {
    const tools = [];
    for (const serverName in mcpServers) {
      const server = mcpServers[serverName];
      if (server.listTools && typeof server.listTools === "function") {
        const serverTools = await server.listTools();
        tools.push(...serverTools.map((tool) => `${serverName}/${tool.name}`));
      } else if (server.getTools && typeof server.getTools === "function") {
        const serverTools = server.getTools();
        tools.push(...serverTools.map((tool) => `${serverName}/${tool.name}`));
      }
    }
    res.json({ success: true, tools });
  } catch (error) {
    console.error("Error listing MCP tools:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list MCP tools",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.post("/execute", isAuthenticated, async (req, res) => {
  try {
    const mcpExecuteSchema = z3.object({
      tool: z3.string(),
      input: z3.record(z3.any())
    });
    const validatedData = mcpExecuteSchema.parse(req.body);
    const input = {
      userId: req.user.id,
      ...validatedData.input
    };
    const [serverName, toolName] = validatedData.tool.split("/");
    if (!serverName || !toolName) {
      throw new Error(`Invalid tool format: ${validatedData.tool}. Expected format: 'serverName/toolName'`);
    }
    const result = await executeMCPTool(serverName, toolName, input);
    res.json({
      success: true,
      tool: validatedData.tool,
      result
    });
  } catch (error) {
    console.error("Error executing MCP tool:", error);
    if (error instanceof z3.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid request format",
        errors: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to execute MCP tool",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
});
router.get("/test-memory-tools", async (req, res) => {
  console.log("Running memory tools test...");
  try {
    if (!mcpServers.cognos) {
      return res.status(500).json({
        success: false,
        message: "Cognos MCP server not initialized"
      });
    }
    const allTools = await mcpServers.cognos.listTools();
    const memoryTools = allTools.filter((tool) => [
      "get_memories",
      "create_memory",
      "create_memory_from_audio",
      "delete_memory",
      "edit_memory",
      "get_conversations"
    ].includes(tool.name));
    console.log("Found memory tools:", memoryTools.map((t) => t.name));
    const createResult = await mcpServers.cognos.executeToolCall({
      name: "create_memory",
      parameters: {
        title: "Test Memory",
        content: "This is a test memory created at " + (/* @__PURE__ */ new Date()).toISOString(),
        category: "TEST",
        uid: "test-user-id"
      }
    });
    const createdMemoryId = createResult?.memoryId || "unknown";
    console.log("Memory created with ID:", createdMemoryId);
    const getResult = await mcpServers.cognos.executeToolCall({
      name: "get_memories",
      parameters: {
        uid: "test-user-id",
        limit: 5,
        categories: ["TEST"]
      }
    });
    console.log("Retrieved memories count:", getResult?.memories?.length || 0);
    const editResult = await mcpServers.cognos.executeToolCall({
      name: "edit_memory",
      parameters: {
        memory_id: createdMemoryId,
        content: "This memory was edited at " + (/* @__PURE__ */ new Date()).toISOString(),
        uid: "test-user-id"
      }
    });
    console.log("Memory edit result:", editResult?.success ? "Success" : "Failed");
    const deleteResult = await mcpServers.cognos.executeToolCall({
      name: "delete_memory",
      parameters: {
        memory_id: createdMemoryId,
        uid: "test-user-id"
      }
    });
    console.log("Memory deletion result:", deleteResult?.success ? "Success" : "Failed");
    res.json({
      success: true,
      results: {
        memoryCreated: !!createResult?.memoryId,
        memoriesRetrieved: !!getResult?.memories,
        memoryEdited: !!editResult?.success,
        memoryDeleted: !!deleteResult?.success,
        details: {
          createResult,
          getResult,
          editResult,
          deleteResult
        }
      }
    });
  } catch (error) {
    console.error("Memory tools test failed:", error);
    res.status(500).json({
      success: false,
      message: "Memory tools test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiQueries: () => aiQueries,
  aiQueriesRelations: () => aiQueriesRelations,
  auditLog: () => auditLog,
  auditLogRelations: () => auditLogRelations,
  chatCompletionSchema: () => chatCompletionSchema,
  configuration: () => configuration,
  configurationBulkUpdateSchema: () => configurationBulkUpdateSchema,
  configurationSchema: () => configurationSchema,
  configurationUpdateSchema: () => configurationUpdateSchema,
  conversations: () => conversations,
  conversationsRelations: () => conversationsRelations,
  defaultConfigurationSchema: () => defaultConfigurationSchema,
  externalData: () => externalData,
  externalDataRelations: () => externalDataRelations,
  healthAnalysisSchema: () => healthAnalysisSchema,
  healthData: () => healthData,
  healthDataRelations: () => healthDataRelations,
  healthQuerySchema: () => healthQuerySchema,
  insertAiQuerySchema: () => insertAiQuerySchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertExternalDataSchema: () => insertExternalDataSchema,
  insertHealthDataSchema: () => insertHealthDataSchema,
  insertMemorySchema: () => insertMemorySchema,
  insertMessageSchema: () => insertMessageSchema,
  insertSettingsSchema: () => insertSettingsSchema,
  insertSystemMetricsSchema: () => insertSystemMetricsSchema,
  insertUserConsentSchema: () => insertUserConsentSchema,
  insertUserSchema: () => insertUserSchema,
  memories: () => memories,
  memoriesRelations: () => memoriesRelations,
  memoryQuerySchema: () => memoryQuerySchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  settings: () => settings,
  settingsRelations: () => settingsRelations,
  systemMetrics: () => systemMetrics,
  userConsent: () => userConsent,
  userConsentRelations: () => userConsentRelations,
  users: () => users2,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z as z4 } from "zod";
var users2 = pgTable("users", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  usernameIdx: index("users_username_idx").on(table.username),
  emailIdx: index("users_email_idx").on(table.email),
  uuidIdx: index("users_uuid_idx").on(table.uuid)
}));
var userConsent = pgTable("user_consent", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  consentType: text("consent_type").notNull(),
  // 'health_data', 'ai_processing', 'data_sharing'
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent")
}, (table) => ({
  userConsentIdx: index("user_consent_user_id_idx").on(table.userId),
  consentTypeIdx: index("user_consent_type_idx").on(table.consentType)
}));
var conversations = pgTable("conversations", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userConversationsIdx: index("conversations_user_id_idx").on(table.userId),
  updatedAtIdx: index("conversations_updated_at_idx").on(table.updatedAt),
  tagsIdx: index("conversations_tags_idx").on(table.tags)
}));
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  toolsUsed: jsonb("tools_used").default([]),
  processingTime: integer("processing_time"),
  // milliseconds
  tokenCount: integer("token_count"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  conversationMessagesIdx: index("messages_conversation_id_idx").on(table.conversationId),
  roleIdx: index("messages_role_idx").on(table.role),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt)
}));
var healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id").notNull(),
  dataType: text("data_type").notNull(),
  // 'sleep', 'activity', 'hrv', 'heart_rate', 'readiness'
  source: text("source").notNull(),
  // 'oura', 'apple_health', 'fitbit', 'manual'
  sourceId: text("source_id"),
  // External ID from source system
  value: jsonb("value").notNull(),
  quality: text("quality"),
  // 'high', 'medium', 'low'
  tags: jsonb("tags").default([]),
  timestamp: timestamp("timestamp").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at")
}, (table) => ({
  userHealthIdx: index("health_data_user_id_idx").on(table.userId),
  dataTypeIdx: index("health_data_type_idx").on(table.dataType),
  timestampIdx: index("health_data_timestamp_idx").on(table.timestamp),
  sourceIdx: index("health_data_source_idx").on(table.source),
  userTypeTimeIdx: index("health_data_user_type_time_idx").on(table.userId, table.dataType, table.timestamp)
}));
var memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id").notNull(),
  memoryType: text("memory_type").notNull(),
  // 'conversation', 'preference', 'insight', 'goal'
  content: text("content").notNull(),
  context: jsonb("context").default({}),
  importance: integer("importance").default(5),
  // 1-10 scale
  tags: jsonb("tags").default([]),
  vectorEmbedding: text("vector_embedding"),
  // For semantic search
  relatedMemories: jsonb("related_memories").default([]),
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at")
}, (table) => ({
  userMemoriesIdx: index("memories_user_id_idx").on(table.userId),
  memoryTypeIdx: index("memories_type_idx").on(table.memoryType),
  importanceIdx: index("memories_importance_idx").on(table.importance),
  tagsIdx: index("memories_tags_idx").on(table.tags),
  accessedIdx: index("memories_last_accessed_idx").on(table.lastAccessed)
}));
var aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id").notNull(),
  conversationId: integer("conversation_id"),
  query: text("query").notNull(),
  queryHash: text("query_hash").notNull(),
  // For deduplication
  response: text("response"),
  model: text("model").notNull(),
  toolsUsed: jsonb("tools_used").default([]),
  processingTime: integer("processing_time"),
  // milliseconds
  tokenCount: integer("token_count"),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  cached: boolean("cached").default(false),
  quality: decimal("quality", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userQueriesIdx: index("ai_queries_user_id_idx").on(table.userId),
  queryHashIdx: index("ai_queries_hash_idx").on(table.queryHash),
  modelIdx: index("ai_queries_model_idx").on(table.model),
  createdAtIdx: index("ai_queries_created_at_idx").on(table.createdAt)
}));
var configuration = pgTable("configuration", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  encrypted: boolean("encrypted").default(true).notNull(),
  category: text("category").notNull(),
  // 'api', 'endpoint', 'integration'
  displayName: text("display_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  keyIdx: index("configuration_key_idx").on(table.key),
  categoryIdx: index("configuration_category_idx").on(table.category)
}));
var externalData = pgTable("external_data", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  userId: integer("user_id"),
  queryId: integer("query_id"),
  source: text("source").notNull(),
  // 'web_search', 'api', 'rss'
  sourceUrl: text("source_url"),
  title: text("title"),
  content: text("content"),
  summary: text("summary"),
  metadata: jsonb("metadata").default({}),
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }),
  credibilityScore: decimal("credibility_score", { precision: 3, scale: 2 }),
  tags: jsonb("tags").default([]),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at")
}, (table) => ({
  userExternalIdx: index("external_data_user_id_idx").on(table.userId),
  sourceIdx: index("external_data_source_idx").on(table.source),
  queryIdx: index("external_data_query_id_idx").on(table.queryId),
  fetchedAtIdx: index("external_data_fetched_at_idx").on(table.fetchedAt)
}));
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  ollamaUrl: text("ollama_url").notNull().default("http://localhost:11434"),
  ollamaModel: text("ollama_model").notNull().default("qwen3:14b"),
  ouraToken: text("oura_token"),
  // Encrypted
  enabledMcpTools: jsonb("enabled_mcp_tools").default(["health-analysis", "memory-store", "web-search"]),
  healthDataSources: jsonb("health_data_sources").default({}),
  aiPreferences: jsonb("ai_preferences").default({}),
  privacyLevel: text("privacy_level").default("standard"),
  // 'minimal', 'standard', 'enhanced'
  dataRetentionDays: integer("data_retention_days").default(365),
  encryptionKeyId: text("encryption_key_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userSettingsIdx: index("settings_user_id_idx").on(table.userId)
}));
var systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(),
  // 'response_time', 'error_rate', 'usage'
  metricName: text("metric_name").notNull(),
  value: decimal("value", { precision: 15, scale: 6 }).notNull(),
  tags: jsonb("tags").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull()
}, (table) => ({
  metricTypeIdx: index("system_metrics_type_idx").on(table.metricType),
  timestampIdx: index("system_metrics_timestamp_idx").on(table.timestamp),
  metricNameIdx: index("system_metrics_name_idx").on(table.metricName)
}));
var auditLog = pgTable("audit_log", {
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
  timestamp: timestamp("timestamp").defaultNow().notNull()
}, (table) => ({
  userAuditIdx: index("audit_log_user_id_idx").on(table.userId),
  actionIdx: index("audit_log_action_idx").on(table.action),
  resourceIdx: index("audit_log_resource_idx").on(table.resource),
  timestampIdx: index("audit_log_timestamp_idx").on(table.timestamp)
}));
var usersRelations = relations(users2, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
  healthData: many(healthData),
  memories: many(memories),
  aiQueries: many(aiQueries),
  settings: many(settings),
  consent: many(userConsent),
  auditLogs: many(auditLog)
}));
var conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users2, { fields: [conversations.userId], references: [users2.id] }),
  messages: many(messages)
}));
var messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  user: one(users2, { fields: [messages.conversationId], references: [users2.id] })
}));
var healthDataRelations = relations(healthData, ({ one }) => ({
  user: one(users2, { fields: [healthData.userId], references: [users2.id] })
}));
var memoriesRelations = relations(memories, ({ one }) => ({
  user: one(users2, { fields: [memories.userId], references: [users2.id] })
}));
var aiQueriesRelations = relations(aiQueries, ({ one }) => ({
  user: one(users2, { fields: [aiQueries.userId], references: [users2.id] }),
  conversation: one(conversations, { fields: [aiQueries.conversationId], references: [conversations.id] })
}));
var externalDataRelations = relations(externalData, ({ one }) => ({
  user: one(users2, { fields: [externalData.userId], references: [users2.id] }),
  query: one(aiQueries, { fields: [externalData.queryId], references: [aiQueries.id] })
}));
var settingsRelations = relations(settings, ({ one }) => ({
  user: one(users2, { fields: [settings.userId], references: [users2.id] })
}));
var userConsentRelations = relations(userConsent, ({ one }) => ({
  user: one(users2, { fields: [userConsent.userId], references: [users2.id] })
}));
var auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users2, { fields: [auditLog.userId], references: [users2.id] })
}));
var insertUserSchema = createInsertSchema(users2).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true
});
var insertUserConsentSchema = createInsertSchema(userConsent).omit({
  id: true,
  grantedAt: true
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  uuid: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  uuid: true,
  createdAt: true
});
var insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  uuid: true,
  recordedAt: true
});
var insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  uuid: true,
  createdAt: true
});
var insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  uuid: true,
  createdAt: true
});
var insertExternalDataSchema = createInsertSchema(externalData).omit({
  id: true,
  uuid: true,
  fetchedAt: true
});
var insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true
});
var insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true
});
var insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true
});
var chatCompletionSchema = z4.object({
  model: z4.string(),
  messages: z4.array(z4.object({
    role: z4.enum(["user", "assistant", "system"]),
    content: z4.string()
  })),
  stream: z4.boolean().optional().default(false),
  temperature: z4.number().optional().default(0.7),
  max_tokens: z4.number().optional()
});
var healthQuerySchema = z4.object({
  dataType: z4.enum(["sleep", "activity", "hrv", "heart_rate", "readiness"]).optional(),
  startDate: z4.string().optional(),
  endDate: z4.string().optional(),
  limit: z4.number().optional().default(50)
});
var healthAnalysisSchema = z4.object({
  date: z4.string().optional(),
  dataType: z4.string().optional(),
  userId: z4.number().optional()
});
var configurationSchema = z4.object({
  key: z4.string().min(1),
  value: z4.string().optional(),
  encrypted: z4.boolean().default(true),
  category: z4.string().min(1),
  displayName: z4.string().min(1),
  description: z4.string().optional()
});
var configurationUpdateSchema = z4.object({
  key: z4.string().min(1),
  value: z4.string().optional()
});
var configurationBulkUpdateSchema = z4.array(configurationUpdateSchema);
var defaultConfigurationSchema = z4.object({
  OURA_TOKEN: z4.string().optional(),
  LIMITLESS_API_TOKEN: z4.string().optional(),
  PERPLEXITY_TOKEN: z4.string().optional(),
  OPENROUTER_TOKEN: z4.string().optional(),
  OLLAMA_ENDPOINT: z4.string().default("http://localhost:11434"),
  NGROK_ENDPOINT: z4.string().optional()
});
var memoryQuerySchema = z4.object({
  memoryType: z4.enum(["conversation", "preference", "insight", "goal"]).optional(),
  tags: z4.array(z4.string()).optional(),
  importance: z4.number().min(1).max(10).optional(),
  limit: z4.number().optional().default(20)
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import dotenv3 from "dotenv";
dotenv3.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.initializeDefaults();
  }
  async initializeDefaults() {
    console.log("DEBUG: Entering initializeDefaults - Stack trace:", new Error().stack);
    try {
      await this.initializeConfiguration();
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
          ouraToken: process.env.OURA_TOKEN || ""
        });
        await this.createUserConsent({
          userId: defaultUser.id,
          consentType: "health_data",
          granted: true
        });
        await this.createUserConsent({
          userId: defaultUser.id,
          consentType: "ai_processing",
          granted: true
        });
      }
    } catch (error) {
      console.error("Failed to initialize defaults:", error);
    } finally {
      console.log("DEBUG: Exiting initializeDefaults");
    }
  }
  async initializeConfiguration() {
    console.log("DEBUG: Entering initializeConfiguration - Stack trace:", new Error().stack);
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("=== WebSocket Connection Info ===");
        console.log("IMPORTANT: If you see wss://localhost/v2 connection errors during startup,");
        console.log("they are expected in development mode and can be safely ignored.");
        console.log("These are coming from a dependency trying to connect to a local LLM service.");
        console.log("==============================");
      }
      const defaultConfigs = [
        {
          key: "OURA_TOKEN",
          value: process.env.OURA_TOKEN || "",
          encrypted: true,
          category: "api",
          displayName: "Oura Ring API Token",
          description: "API token for accessing Oura Ring data"
        },
        {
          key: "LIMITLESS_API_TOKEN",
          value: process.env.LIMITLESS_API_TOKEN || "",
          encrypted: true,
          category: "api",
          displayName: "Limitless API Token",
          description: "API token for accessing Limitless services"
        },
        {
          key: "PERPLEXITY_TOKEN",
          value: process.env.PERPLEXITY_TOKEN || "",
          encrypted: true,
          category: "api",
          displayName: "Perplexity API Token",
          description: "API token for Perplexity AI services"
        },
        {
          key: "OPENROUTER_TOKEN",
          value: process.env.OPENROUTER_TOKEN || "",
          encrypted: true,
          category: "api",
          displayName: "OpenRouter API Token",
          description: "API token for OpenRouter LLM routing services"
        },
        {
          key: "OLLAMA_ENDPOINT",
          value: process.env.OLLAMA_ENDPOINT || "http://localhost:11434",
          encrypted: false,
          category: "endpoint",
          displayName: "Ollama Endpoint",
          description: "URL for local Ollama instance"
        },
        {
          key: "NGROK_ENDPOINT",
          value: process.env.NGROK_ENDPOINT || "",
          encrypted: false,
          category: "endpoint",
          displayName: "Ngrok Endpoint",
          description: "Public URL for accessing the application"
        }
      ];
      for (const config4 of defaultConfigs) {
        const existing = await this.getConfiguration(config4.key);
        if (!existing) {
          await this.setConfiguration(config4);
        }
      }
      console.log("Configuration initialized");
    } catch (error) {
      console.error("Failed to initialize configuration:", error);
    } finally {
      if (process.env.NODE_ENV === "development") {
        console.log("Completed configuration initialization");
      }
      console.log("DEBUG: Exiting initializeConfiguration");
    }
  }
  async getUser(id) {
    const [user] = await db.select().from(users2).where(eq(users2.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users2).where(eq(users2.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users2).values(insertUser).returning();
    return user;
  }
  async getUserConsent(userId, consentType) {
    const [consent] = await db.select().from(userConsent).where(and(eq(userConsent.userId, userId), eq(userConsent.consentType, consentType))).orderBy(desc(userConsent.grantedAt));
    return consent || void 0;
  }
  async createUserConsent(consent) {
    const [newConsent] = await db.insert(userConsent).values(consent).returning();
    return newConsent;
  }
  async revokeUserConsent(userId, consentType) {
    await db.update(userConsent).set({ revokedAt: /* @__PURE__ */ new Date() }).where(and(eq(userConsent.userId, userId), eq(userConsent.consentType, consentType)));
  }
  async getConversation(id) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || void 0;
  }
  async getConversationsByUser(userId) {
    return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
  }
  async createConversation(insertConversation) {
    const [conversation] = await db.insert(conversations).values(insertConversation).returning();
    return conversation;
  }
  async updateConversation(id, updates) {
    const [conversation] = await db.update(conversations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id)).returning();
    return conversation || void 0;
  }
  async getMessagesByConversation(conversationId) {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async getHealthData(userId, filters) {
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
  async createHealthData(insertData) {
    const [data] = await db.insert(healthData).values(insertData).returning();
    return data;
  }
  async getLatestHealthData(userId, dataType) {
    const data = await this.getHealthData(userId, { dataType, limit: 1 });
    return data[0];
  }
  async getMemories(userId, filters) {
    const conditions = [eq(memories.userId, userId)];
    if (filters?.memoryType) {
      conditions.push(eq(memories.memoryType, filters.memoryType));
    }
    if (filters?.importance) {
      conditions.push(gte(memories.importance, filters.importance));
    }
    if (filters?.tags && filters.tags.length > 0) {
      conditions.push(sql`${memories.tags} ?& ${filters.tags}`);
    }
    const baseQuery = db.select().from(memories).where(and(...conditions)).orderBy(desc(memories.importance), desc(memories.createdAt));
    if (filters?.limit) {
      return await baseQuery.limit(filters.limit);
    }
    return await baseQuery;
  }
  async createMemory(memory) {
    const [newMemory] = await db.insert(memories).values(memory).returning();
    return newMemory;
  }
  async updateMemory(id, updates) {
    const { id: _, uuid: __, createdAt: ___, ...updateFields } = updates;
    const [memory] = await db.update(memories).set(updateFields).where(eq(memories.id, id)).returning();
    return memory || void 0;
  }
  async getAiQuery(queryHash) {
    const [query] = await db.select().from(aiQueries).where(eq(aiQueries.queryHash, queryHash));
    return query;
  }
  async createAiQuery(query) {
    const [inserted] = await db.insert(aiQueries).values(query).returning();
    return inserted;
  }
  // Configuration Management
  async getConfiguration(key) {
    return await db.query.configuration.findFirst({
      where: eq(configuration.key, key)
    });
  }
  async getAllConfiguration(category) {
    if (category) {
      return await db.query.configuration.findMany({
        where: eq(configuration.category, category),
        orderBy: [configuration.category, configuration.key]
      });
    }
    return await db.query.configuration.findMany({
      orderBy: [configuration.category, configuration.key]
    });
  }
  async setConfiguration(config4) {
    const existing = await this.getConfiguration(config4.key);
    if (existing) {
      const [updated] = await db.update(configuration).set({
        ...config4,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(configuration.key, config4.key)).returning();
      return updated;
    } else {
      const [created] = await db.insert(configuration).values(config4).returning();
      return created;
    }
  }
  async updateConfiguration(key, value) {
    try {
      const existing = await this.getConfiguration(key);
      if (!existing) {
        console.log(`Configuration not found for key: ${key}`);
        return void 0;
      }
      console.log(`Updating configuration for ${key} (length: ${value?.length || 0})`);
      const [updated] = await db.update(configuration).set({
        value,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(configuration.key, key)).returning();
      if (!updated) {
        console.error(`Failed to update configuration for ${key}. No rows returned.`);
        return void 0;
      }
      console.log(`Successfully updated configuration for ${key}`);
      return updated;
    } catch (error) {
      console.error(`Error updating configuration for key ${key}:`, error);
      throw error;
    }
  }
  async deleteConfiguration(key) {
    const result = await db.delete(configuration).where(eq(configuration.key, key));
    return !!result;
  }
  async getSettings(userId) {
    const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
    return userSettings || void 0;
  }
  async createSettings(insertSettings) {
    const [newSettings] = await db.insert(settings).values(insertSettings).returning();
    return newSettings;
  }
  async updateSettings(userId, updates) {
    const [updatedSettings] = await db.update(settings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(settings.userId, userId)).returning();
    return updatedSettings || void 0;
  }
  async logAction(log3) {
    const [auditEntry] = await db.insert(auditLog).values(log3).returning();
    return auditEntry;
  }
};
var storage = new DatabaseStorage();

// server/ngrok.ts
import ngrok from "ngrok";
import * as fs3 from "fs";
import * as path4 from "path";
import * as readline from "readline";
import * as dotenv4 from "dotenv";
import axios5 from "axios";
import { URL as URL2 } from "url";
var NgrokService = class {
  constructor() {
    this.tunnel = null;
    this.isConnected = false;
  }
  async startTunnel(config4) {
    try {
      if (config4.authtoken) {
        await ngrok.authtoken(config4.authtoken);
      }
      const url = await ngrok.connect({
        port: config4.port,
        region: config4.region || "us",
        subdomain: config4.subdomain,
        proto: "http",
        basicAuth: config4.basicAuth,
        hostHeader: config4.hostHeader
      });
      this.tunnel = url;
      this.isConnected = true;
      console.log(`Ngrok tunnel started: ${url}`);
      console.log(`Ollama-compatible endpoint available at: ${url}/api/chat/completions`);
      return url;
    } catch (error) {
      console.error("Failed to start ngrok tunnel:", error);
      throw new Error(`Ngrok tunnel failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async stopTunnel() {
    try {
      if (this.isConnected) {
        await ngrok.disconnect();
        await ngrok.kill();
        this.tunnel = null;
        this.isConnected = false;
        console.log("Ngrok tunnel stopped");
      }
    } catch (error) {
      console.error("Error stopping ngrok tunnel:", error);
    }
  }
  getTunnelUrl() {
    return this.tunnel;
  }
  isActive() {
    return this.isConnected;
  }
  getApiEndpoints() {
    if (!this.tunnel) return null;
    return {
      chatCompletions: `${this.tunnel}/api/chat/completions`,
      healthData: `${this.tunnel}/api/health`,
      mcpTools: `${this.tunnel}/api/mcp/tools`,
      status: `${this.tunnel}/api/status`,
      websocket: `${this.tunnel.replace("https://", "wss://").replace("http://", "ws:")}/ws`,
      // OMI webhook endpoints
      omiWebhook: `${this.tunnel}/api/omi/webhook`,
      omiImport: `${this.tunnel}/api/omi/import`
    };
  }
  async getConnectionInfo() {
    try {
      const api = await ngrok.getApi();
      if (api) {
        const tunnels = await api.listTunnels();
        return {
          tunnels,
          isActive: this.isConnected,
          currentUrl: this.tunnel
        };
      }
      return {
        tunnels: [],
        isActive: this.isConnected,
        currentUrl: this.tunnel
      };
    } catch (error) {
      return {
        tunnels: [],
        isActive: this.isConnected,
        currentUrl: this.tunnel,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var ngrokService = new NgrokService();
async function testEndpoint(url) {
  try {
    await axios5.get(url, { timeout: 5e3 });
    return true;
  } catch (error) {
    return false;
  }
}
async function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve2) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve2(answer);
    });
  });
}
async function updateEnvFile(endpoint) {
  try {
    const envPath = path4.resolve(process.cwd(), ".env");
    let envContent = "";
    try {
      envContent = fs3.readFileSync(envPath, "utf8");
    } catch (error) {
      console.log("Creating new .env file");
    }
    const regex = /^NGROK_ENDPOINT=.*/m;
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `NGROK_ENDPOINT=${endpoint}`);
    } else {
      envContent += `
NGROK_ENDPOINT=${endpoint}`;
    }
    fs3.writeFileSync(envPath, envContent);
    console.log("Updated .env file with new ngrok endpoint");
    dotenv4.config();
  } catch (error) {
    console.error("Error updating .env file:", error);
  }
}
async function initializeNgrok() {
  const enableNgrok = process.env.ENABLE_NGROK === "true";
  const ngrokAuthToken = process.env.NGROK_AUTH_TOKEN;
  const port = parseInt(process.env.PORT || "5000");
  let cachedNgrokEndpoint = process.env.NGROK_ENDPOINT;
  const enableOllamaTunnel = process.env.ENABLE_OLLAMA_TUNNEL === "true";
  const ollamaPort = parseInt(process.env.OLLAMA_PORT || "11434");
  const ollamaAuth = process.env.OLLAMA_TUNNEL_AUTH;
  if (cachedNgrokEndpoint) {
    console.log(`Testing cached ngrok endpoint: ${cachedNgrokEndpoint}`);
    try {
      let testUrl = cachedNgrokEndpoint;
      if (!testUrl.startsWith("http")) {
        testUrl = `https://${testUrl}`;
      }
      if (new URL2(testUrl).pathname === "/" || !new URL2(testUrl).pathname) {
        testUrl = `${testUrl.replace(/\/$/, "")}/api/health`;
      }
      const isEndpointWorking = await testEndpoint(testUrl);
      if (isEndpointWorking) {
        console.log("\u2705 Cached ngrok endpoint is working!");
        const baseUrl = cachedNgrokEndpoint.replace(/\/$/, "");
        console.log("\n\u{1F310} External API Endpoints:");
        console.log(`   Chat Completions: ${baseUrl}/api/chat/completions`);
        console.log(`   Health Data: ${baseUrl}/api/health`);
        console.log(`   MCP Tools: ${baseUrl}/api/mcp/tools`);
        console.log(`   WebSocket: ${baseUrl.replace("https://", "wss://").replace("http://", "ws:")}/ws`);
        console.log("\n   Use these URLs to connect external applications to your AI assistant\n");
        ngrokService.startTunnel = async () => baseUrl;
        ngrokService.tunnel = baseUrl;
        ngrokService.isConnected = true;
        return;
      } else {
        console.log("\u274C Cached ngrok endpoint is not working. Need to create a new tunnel or get endpoint from user.");
      }
    } catch (error) {
      console.error("Error testing cached ngrok endpoint:", error);
    }
  }
  if (enableNgrok) {
    try {
      await ngrokService.startTunnel({
        port,
        authtoken: ngrokAuthToken,
        region: process.env.NGROK_REGION || "us",
        subdomain: process.env.NGROK_SUBDOMAIN
      });
      const endpoints = ngrokService.getApiEndpoints();
      if (endpoints) {
        console.log("\n\u{1F310} External API Endpoints:");
        console.log("\n\u{1F4E1} OMI Integration Endpoints:");
        console.log(`   OMI Webhook: ${endpoints.omiWebhook}`);
        console.log(`   OMI Import: ${endpoints.omiImport}`);
        console.log("\n\u{1F916} AI Assistant Endpoints:");
        console.log(`   Chat Completions: ${endpoints.chatCompletions}`);
        console.log(`   WebSocket: ${endpoints.websocket}`);
        console.log("\n\u{1F4CA} Other Endpoints:");
        console.log(`   Health Data: ${endpoints.healthData}`);
        console.log(`   MCP Tools: ${endpoints.mcpTools}`);
        console.log(`   Status: ${endpoints.status}`);
        console.log("\n   Use these URLs to connect OMI and other applications to your server\n");
      }
      await updateEnvFile(ngrokService.getTunnelUrl() || "");
    } catch (error) {
      console.error("Failed to initialize ngrok:", error);
      try {
        console.log("\nAutomatic ngrok tunnel creation failed. You can provide a manual ngrok endpoint.");
        const manualEndpoint = await askUser("Enter your ngrok endpoint (or leave empty to skip): ");
        if (manualEndpoint) {
          let testUrl = manualEndpoint;
          if (!testUrl.startsWith("http")) {
            testUrl = `https://${testUrl}`;
          }
          const isWorking = await testEndpoint(testUrl);
          if (isWorking) {
            console.log("\u2705 Manual endpoint is working!");
            await updateEnvFile(manualEndpoint);
            ngrokService.tunnel = manualEndpoint;
            ngrokService.isConnected = true;
          } else {
            console.log("\u274C Manual endpoint test failed. Continuing without ngrok.");
          }
        }
      } catch (inputError) {
        console.error("Error processing manual endpoint:", inputError);
      }
    }
  }
  if (enableOllamaTunnel && ngrokAuthToken) {
    try {
      console.log("\n\u{1F680} Starting secure tunnel for Ollama server...");
      await ngrok.authtoken(ngrokAuthToken);
      const ollamaUrl = await ngrok.connect({
        addr: ollamaPort,
        region: process.env.NGROK_REGION || "us",
        subdomain: process.env.OLLAMA_SUBDOMAIN,
        proto: "http",
        basicAuth: ollamaAuth,
        // Apply basic auth if provided as username:password
        hostHeader: `localhost:${ollamaPort}`
        // Important for Ollama to work correctly
      });
      console.log(`
\u{1F512} Secure Ollama tunnel established at: ${ollamaUrl}`);
      console.log("   This endpoint requires authentication and can be used as a remote Ollama server");
      console.log("   Use this URL in client applications as your Ollama server URL");
    } catch (error) {
      console.error("Failed to initialize Ollama tunnel:", error);
    }
  }
  process.on("SIGINT", async () => {
    console.log("\nShutting down ngrok tunnel...");
    await ngrokService.stopTunnel();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await ngrokService.stopTunnel();
    process.exit(0);
  });
}

// server/mcp/mcpUtils.ts
import { v4 as uuidv43 } from "uuid";

// server/mcp/mcpSchemaValidator.ts
import * as z5 from "zod";
var mcpToolRequestSchema = z5.object({
  serverName: z5.string(),
  toolName: z5.string(),
  args: z5.record(z5.any()).optional().default({})
});
var mcpToolResponseSchema = z5.object({
  status: z5.enum(["success", "error"]),
  content: z5.array(
    z5.object({
      type: z5.string(),
      value: z5.any()
    })
  ).optional(),
  error: z5.object({
    message: z5.string(),
    code: z5.string().optional()
  }).optional()
});
var ouraMCPToolSchema = z5.object({
  serverName: z5.literal("oura"),
  toolName: z5.enum([
    "get-sleep-data",
    "get-activity-data",
    "get-readiness-data",
    "sync-health-data"
  ]),
  args: z5.object({
    userId: z5.string().or(z5.number()),
    date: z5.string().optional()
    // ISO date string
  })
});
var perplexityMCPToolSchema = z5.object({
  serverName: z5.literal("perplexity"),
  toolName: z5.enum([
    "ask",
    "search"
  ]),
  args: z5.object({
    query: z5.string(),
    model: z5.string().optional(),
    stream: z5.boolean().optional()
  })
});
function validateMCPToolRequest(request) {
  try {
    const validatedRequest = mcpToolRequestSchema.parse(request);
    return { success: true, data: validatedRequest };
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return {
        success: false,
        error: `Invalid MCP tool request: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      };
    }
    return { success: false, error: "Unknown validation error" };
  }
}
function validateMCPToolResponse(response) {
  try {
    const validatedResponse = mcpToolResponseSchema.parse(response);
    return { success: true, data: validatedResponse };
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return {
        success: false,
        error: `Invalid MCP tool response: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      };
    }
    return { success: false, error: "Unknown validation error" };
  }
}
function validateServerSpecificRequest(request) {
  try {
    switch (request.serverName) {
      case "oura":
        return { success: true, data: ouraMCPToolSchema.parse(request) };
      case "perplexity":
        return { success: true, data: perplexityMCPToolSchema.parse(request) };
      default:
        return { success: true, data: request };
    }
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return {
        success: false,
        error: `Invalid ${request.serverName} tool request: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      };
    }
    return { success: false, error: "Unknown validation error" };
  }
}

// server/mcp/mcpStreaming.ts
import { EventEmitter as EventEmitter3 } from "events";
import { v4 as uuidv42 } from "uuid";
import debug from "debug";
var log = debug("cognos:mcp:streaming");
var MCPStreamingService = class _MCPStreamingService {
  constructor() {
    this.emitter = new EventEmitter3();
    this.activeStreams = /* @__PURE__ */ new Map();
    this.emitter.setMaxListeners(100);
    log("MCP Streaming service initialized");
  }
  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!_MCPStreamingService.instance) {
      _MCPStreamingService.instance = new _MCPStreamingService();
    }
    return _MCPStreamingService.instance;
  }
  /**
   * Create a new stream for a tool call
   */
  createStream(serverName, toolName) {
    const requestId = uuidv42();
    const stream = new MCPToolStream(requestId, serverName, toolName, this.emitter);
    this.activeStreams.set(requestId, {
      serverName,
      toolName,
      createdAt: Date.now(),
      requestId,
      stream
    });
    log(`Stream created: ${requestId} for ${serverName}.${toolName}`);
    return stream;
  }
  /**
   * Get a stream by request ID
   */
  getStream(requestId) {
    const streamInfo = this.activeStreams.get(requestId);
    return streamInfo?.stream;
  }
  /**
   * Remove a stream when it's complete
   */
  removeStream(requestId) {
    const result = this.activeStreams.delete(requestId);
    if (result) {
      log(`Stream removed: ${requestId}`);
    }
    return result;
  }
  /**
   * Subscribe to all events for a specific requestId
   */
  subscribe(requestId, callback) {
    const handler = (event) => {
      if (event.requestId === requestId) {
        callback(event);
      }
    };
    this.emitter.on("stream", handler);
    return () => this.emitter.off("stream", handler);
  }
  /**
   * Clean up old streams
   */
  cleanup(maxAgeMs = 36e5) {
    const now = Date.now();
    let count = 0;
    for (const [requestId, info] of this.activeStreams.entries()) {
      if (now - info.createdAt > maxAgeMs) {
        this.activeStreams.delete(requestId);
        count++;
      }
    }
    if (count > 0) {
      log(`Cleaned up ${count} stale streams`);
    }
    return count;
  }
};
var MCPToolStream = class {
  constructor(requestId, serverName, toolName, emitter) {
    this.isComplete = false;
    this.contentItems = [];
    this.requestId = requestId;
    this.serverName = serverName;
    this.toolName = toolName;
    this.emitter = emitter;
    this.emit("start" /* START */);
  }
  /**
   * Send a delta update
   */
  sendDelta(delta) {
    if (this.isComplete) {
      log(`Warning: Delta sent to completed stream ${this.requestId}`);
      return;
    }
    this.contentItems.push(delta);
    this.emit("delta" /* DELTA */, { delta });
  }
  /**
   * Send an error and close the stream
   */
  sendError(error) {
    if (this.isComplete) {
      log(`Warning: Error sent to completed stream ${this.requestId}`);
      return;
    }
    this.emit("error" /* ERROR */, { error });
    this.isComplete = true;
    MCPStreamingService.getInstance().removeStream(this.requestId);
  }
  /**
   * Complete the stream
   */
  complete() {
    if (this.isComplete) {
      log(`Warning: Already completed stream ${this.requestId}`);
      return;
    }
    this.emit("complete" /* COMPLETE */, { content: this.contentItems });
    this.isComplete = true;
    MCPStreamingService.getInstance().removeStream(this.requestId);
  }
  /**
   * Get current content
   */
  getContent() {
    return [...this.contentItems];
  }
  /**
   * Check if stream is complete
   */
  isCompleted() {
    return this.isComplete;
  }
  /**
   * Get request ID
   */
  getRequestId() {
    return this.requestId;
  }
  /**
   * Emit a stream event
   */
  emit(type, data) {
    const event = {
      type,
      requestId: this.requestId,
      toolName: this.toolName,
      serverName: this.serverName,
      timestamp: Date.now(),
      ...data
    };
    this.emitter.emit("stream", event);
  }
};

// server/mcp/mcpLogging.ts
import debug2 from "debug";
var logMcpCore = debug2("cognos:mcp:core");
var logMcpRouter = debug2("cognos:mcp:router");
var logMcpTools = debug2("cognos:mcp:tools");
var logMcpAdapter = debug2("cognos:mcp:adapter");
var logMcpStreaming = debug2("cognos:mcp:streaming");
var logMcpSecurity = debug2("cognos:mcp:security");
function formatLogMessage(requestId, message, context) {
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${requestId}] ${message}${contextStr}`;
}
function logToolExecution(logger, level, requestId, serverName, toolName, message, context) {
  const toolInfo = `${serverName}.${toolName}`;
  const formattedMsg = formatLogMessage(requestId, `[${toolInfo}] ${message}`, context);
  logger(formattedMsg);
}

// server/mcp/mcpUtils.ts
var MCPError = class extends Error {
  constructor(message, type, details) {
    super(message);
    this.name = "MCPError";
    this.type = type;
    this.details = details;
  }
  toResponse() {
    return {
      error: this.message,
      status: "error",
      content: [
        {
          type: "json",
          json: {
            error_type: this.type,
            details: this.details
          }
        }
      ]
    };
  }
};
async function executeMCPTool2(serverName, toolName, args, options = {}) {
  const requestId = options.requestId || uuidv43();
  logToolExecution(logMcpTools, "info" /* INFO */, requestId, serverName, toolName, "Execute MCP tool");
  let stream;
  if (options.streaming) {
    stream = MCPStreamingService.getInstance().createStream(serverName, toolName);
    logToolExecution(
      logMcpTools,
      "info" /* INFO */,
      requestId,
      serverName,
      toolName,
      "Streaming enabled",
      { streamId: stream.getRequestId() }
    );
  }
  try {
    const request = {
      serverName,
      toolName,
      args: args || {}
    };
    const validationResult = validateMCPToolRequest(request);
    if (!validationResult.success) {
      const error = new MCPError(
        validationResult.error,
        "validation_error" /* VALIDATION_ERROR */,
        { request }
      );
      if (stream) {
        stream.sendError(error.message);
      }
      throw error;
    }
    const serverSpecificValidation = validateServerSpecificRequest(validationResult.data);
    if (!serverSpecificValidation.success) {
      const error = new MCPError(
        serverSpecificValidation.error,
        "validation_error" /* VALIDATION_ERROR */,
        { request }
      );
      if (stream) {
        stream.sendError(error.message);
      }
      throw error;
    }
    const server = mcpServers[serverName];
    if (!server) {
      const error = new MCPError(
        `MCP server '${serverName}' not found`,
        "server_not_found" /* SERVER_NOT_FOUND */
      );
      if (stream) {
        stream.sendError(error.message);
      }
      throw error;
    }
    logToolExecution(
      logMcpTools,
      "info" /* INFO */,
      requestId,
      serverName,
      toolName,
      "Request",
      { args }
    );
    const startTime = Date.now();
    const response = await server.handleRequest({
      type: "call_tool",
      params: {
        name: toolName,
        arguments: args || {}
      },
      requestId
    });
    const duration = Date.now() - startTime;
    const validatedResponse = validateMCPToolResponse(response);
    if (!validatedResponse.success) {
      logToolExecution(
        logMcpTools,
        "error" /* ERROR */,
        requestId,
        serverName,
        toolName,
        "Invalid response from server",
        { error: validatedResponse.error }
      );
      const error = new MCPError(
        `Invalid response from ${serverName}.${toolName}: ${validatedResponse.error}`,
        "execution_error" /* EXECUTION_ERROR */
      );
      if (stream) {
        stream.sendError(error.message);
      }
      throw error;
    }
    logToolExecution(
      logMcpTools,
      "info" /* INFO */,
      requestId,
      serverName,
      toolName,
      "Success",
      { durationMs: duration }
    );
    if (stream) {
      if (validatedResponse.data.content) {
        for (const item of validatedResponse.data.content) {
          if (item.type === "text" || item.type === "json" || item.type === "image") {
            stream.sendDelta(item);
          } else {
            const textContent = {
              type: "text",
              text: `Unrecognized content type: ${String(item.type)}`
            };
            stream.sendDelta(textContent);
          }
        }
      }
      stream.complete();
      return {
        ...validatedResponse.data,
        status: "success",
        streamId: stream.getRequestId()
      };
    } else {
      return {
        ...validatedResponse.data,
        status: "success"
      };
    }
  } catch (error) {
    if (error instanceof MCPError) {
      logToolExecution(
        logMcpTools,
        "error" /* ERROR */,
        requestId,
        serverName,
        toolName,
        "MCPError",
        { error: error.message }
      );
      if (stream && !stream.isCompleted()) {
        stream.sendError(error.message);
      }
      return error.toResponse();
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logToolExecution(
      logMcpTools,
      "error" /* ERROR */,
      requestId,
      serverName,
      toolName,
      "Error calling tool",
      { error: errorMessage }
    );
    const mcpError = new MCPError(
      `Tool call failed: ${errorMessage}`,
      "execution_error" /* EXECUTION_ERROR */
    );
    if (stream && !stream.isCompleted()) {
      stream.sendError(mcpError.message);
    }
    return mcpError.toResponse();
  }
}

// server/clients/clientUtils.ts
function createOllamaClient2(baseUrl) {
  return new OllamaClient(baseUrl);
}
function createOpenRouterClient(apiKey) {
  return {
    chat: async (options) => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://cognos.ai",
          // Replace with your actual domain
          "X-Title": "Cognos AI"
        },
        body: JSON.stringify({
          model: options.model || "anthropic/claude-3.5-sonnet",
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2048,
          stream: options.stream || false
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API error: ${error.error?.message || "Unknown error"}`);
      }
      return await response.json();
    }
  };
}
async function listMCPTools2() {
  try {
    const response = await fetch("/api/mcp/servers");
    const { servers } = await response.json();
    const tools = [];
    for (const server of servers) {
      const toolsResponse = await fetch(`/api/mcp/${server.name}/tools`);
      const { tools: serverTools } = await toolsResponse.json();
      for (const tool of serverTools) {
        tools.push(`${server.name}/${tool.name}`);
      }
    }
    return tools;
  } catch (error) {
    console.error("Error listing MCP tools:", error);
    return [];
  }
}

// server/routes/omi-webhooks.ts
import * as express from "express";
import * as fsPromises from "fs/promises";
import * as path5 from "path";
import { EventEmitter as EventEmitter4 } from "events";
var webhookEvents = new EventEmitter4();
webhookEvents.setMaxListeners(50);
var transcriptStorage = {
  realtime: [],
  // Real-time transcript chunks
  conversations: [],
  // Completed conversations
  daysSummary: []
  // Daily summary data
};
var audioStorage = {};
setInterval(() => {
  if (transcriptStorage.realtime.length > 100) {
    transcriptStorage.realtime = transcriptStorage.realtime.slice(-100);
  }
  if (transcriptStorage.conversations.length > 50) {
    transcriptStorage.conversations = transcriptStorage.conversations.slice(-50);
  }
  const now = Date.now();
  Object.entries(audioStorage).forEach(([id, _]) => {
    if (now - parseInt(id.split("_")[0]) > 5 * 60 * 1e3) {
      delete audioStorage[id];
    }
  });
}, 5 * 60 * 1e3);
var router2 = express.Router();
router2.post("/realtime-transcript", async (req, res) => {
  const data = req.body;
  try {
    if (!data || !data.transcript) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    const transcriptEvent = {
      ...data,
      timestamp: Date.now(),
      id: nanoid()
    };
    transcriptStorage.realtime.push(transcriptEvent);
    webhookEvents.emit("realtime-transcript", transcriptEvent);
    console.log(`Received real-time transcript: ${data.transcript.substring(0, 30)}...`);
    res.status(200).json({
      success: true,
      message: "Real-time transcript received"
    });
  } catch (error) {
    console.error("Error processing real-time transcript webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router2.post("/conversation-events", async (req, res) => {
  const data = req.body;
  try {
    if (!data || !data.event_type) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    const conversationEvent = {
      ...data,
      timestamp: Date.now(),
      id: nanoid()
    };
    transcriptStorage.conversations.push(conversationEvent);
    webhookEvents.emit("conversation-event", conversationEvent);
    console.log(`Received conversation event: ${data.event_type}`);
    res.status(200).json({
      success: true,
      message: "Conversation event received"
    });
  } catch (error) {
    console.error("Error processing conversation event webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router2.post("/audio-bytes", async (req, res) => {
  try {
    if (!req.body || !req.body.audio || !req.body.format) {
      return res.status(400).json({ error: "Invalid audio payload" });
    }
    const audioId = `${Date.now()}_${nanoid(6)}`;
    const audioBuffer = Buffer.from(req.body.audio, "base64");
    if (!audioStorage[audioId]) {
      audioStorage[audioId] = [];
    }
    audioStorage[audioId].push(audioBuffer);
    if (audioBuffer.length > 1024 * 1024) {
      const tempDir = path5.join(process.cwd(), "temp", "audio");
      await fsPromises.mkdir(tempDir, { recursive: true });
      const filePath = path5.join(tempDir, `${audioId}.${req.body.format || "wav"}`);
      await fsPromises.writeFile(filePath, audioBuffer);
      webhookEvents.emit("audio-bytes", {
        id: audioId,
        filePath,
        format: req.body.format,
        timestamp: Date.now(),
        metadata: req.body.metadata || {}
      });
    } else {
      webhookEvents.emit("audio-bytes", {
        id: audioId,
        audioBuffer,
        format: req.body.format,
        timestamp: Date.now(),
        metadata: req.body.metadata || {}
      });
    }
    console.log(`Received audio bytes: ${audioBuffer.length} bytes, format: ${req.body.format}`);
    res.status(200).json({
      success: true,
      message: "Audio bytes received",
      audioId
    });
  } catch (error) {
    console.error("Error processing audio bytes webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router2.post("/day-summary", async (req, res) => {
  const data = req.body;
  try {
    if (!data || !data.day || !data.summary) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }
    const summaryEvent = {
      ...data,
      received_timestamp: Date.now(),
      id: nanoid()
    };
    transcriptStorage.daysSummary.push(summaryEvent);
    webhookEvents.emit("day-summary", summaryEvent);
    console.log(`Received day summary for: ${data.day}`);
    res.status(200).json({
      success: true,
      message: "Day summary received"
    });
  } catch (error) {
    console.error("Error processing day summary webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router2.get("/status", (req, res) => {
  res.status(200).json({
    status: "operational",
    endpoints: {
      "realtime-transcript": `/api/omi/webhook/realtime-transcript`,
      "conversation-events": `/api/omi/webhook/conversation-events`,
      "audio-bytes": `/api/omi/webhook/audio-bytes`,
      "day-summary": `/api/omi/webhook/day-summary`
    },
    stats: {
      realtime_transcript_count: transcriptStorage.realtime.length,
      conversation_events_count: transcriptStorage.conversations.length,
      days_summary_count: transcriptStorage.daysSummary.length,
      audio_storage_chunks: Object.keys(audioStorage).length
    },
    last_updated: (/* @__PURE__ */ new Date()).toISOString()
  });
});

// server/routes/omi-import.ts
import * as express2 from "express";
import _multer from "multer";
import * as path6 from "path";
import * as fsPromises2 from "fs/promises";
var multer = _multer;
var router3 = express2.Router();
var storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path6.join(process.cwd(), "temp", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${nanoid(6)}`;
    cb(null, `omi-import-${uniqueSuffix}${path6.extname(file.originalname)}`);
  }
});
var upload = multer({
  storage: storage2,
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are accepted"));
    }
  }
});
router3.post("/conversations", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = req.file.path;
    const fileContent = await fsPromises2.readFile(filePath, "utf8");
    let conversations2;
    try {
      conversations2 = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid JSON format" });
    }
    if (!Array.isArray(conversations2) && !conversations2.conversations) {
      return res.status(400).json({ error: "Invalid conversations format" });
    }
    const conversationArray = Array.isArray(conversations2) ? conversations2 : conversations2.conversations;
    const importedCount = conversationArray.length;
    let processedCount = 0;
    for (const conversation of conversationArray) {
      const enrichedConversation = {
        ...conversation,
        imported: true,
        import_date: (/* @__PURE__ */ new Date()).toISOString(),
        import_id: nanoid()
      };
      webhookEvents.emit("conversation-import", enrichedConversation);
      processedCount++;
    }
    res.status(200).json({
      success: true,
      message: `Successfully imported ${processedCount} conversations`,
      total: importedCount,
      processed: processedCount
    });
    fsPromises2.unlink(filePath).catch((err) => {
      console.error("Error cleaning up uploaded file:", err);
    });
  } catch (error) {
    console.error("Error processing Omi conversations import:", error);
    res.status(500).json({
      error: "Failed to import conversations",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router3.get("/conversations", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      imported_conversations: [],
      message: "To import conversations, use the drag-and-drop uploader on the Omi Import page"
    });
  } catch (error) {
    console.error("Error listing imported conversations:", error);
    res.status(500).json({ error: "Failed to list imported conversations" });
  }
});

// server/routes.ts
function initializeMcpSystem() {
  console.log("Initializing MCP system...");
  initMcpServers();
}
function registerRoutes(app2) {
  const server = http.createServer(app2);
  initializeMcpSystem();
  app2.use("/api/mcp", router);
  app2.use("/api/omi/webhook", router2);
  app2.use("/api/omi/import", router3);
  app2.get("/api/config", isAuthenticated, async (req, res) => {
    try {
      const category = req.query.category;
      const configs = await storage.getAllConfiguration(category);
      const safeConfigs = configs.map((config4) => ({
        ...config4,
        value: config4.encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : config4.value
      }));
      res.json(safeConfigs);
    } catch (error) {
      console.error("Error fetching configurations:", error);
      res.status(500).json({ error: "Failed to fetch configurations" });
    }
  });
  app2.get("/api/config/:key", isAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      const config4 = await storage.getConfiguration(key);
      if (!config4) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      const safeConfig = {
        ...config4,
        value: config4.encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : config4.value
      };
      res.json(safeConfig);
    } catch (error) {
      console.error(`Error fetching configuration ${req.params.key}:`, error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });
  app2.put("/api/config/:key", isAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      console.log(`Processing update for config key: ${key}`);
      if (value && value.length > 0) {
        console.log(`Token length: ${value.length} characters`);
      }
      try {
        configurationUpdateSchema.parse({ key, value });
      } catch (validationError) {
        console.error(`Validation error for ${key}:`, validationError);
        return res.status(400).json({ error: "Invalid configuration data", details: validationError });
      }
      const existingConfig = await storage.getConfiguration(key);
      if (!existingConfig) {
        console.log(`Configuration ${key} not found, cannot update`);
        return res.status(404).json({ error: "Configuration not found" });
      }
      try {
        const updated = await storage.updateConfiguration(key, value);
        console.log(`Successfully updated configuration for ${key}`);
        const safeConfig = {
          ...updated,
          value: updated?.encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : updated?.value
        };
        res.json(safeConfig);
      } catch (updateError) {
        console.error(`Database error updating configuration ${key}:`, updateError);
        let errorMessage = "Failed to update configuration";
        let statusCode = 500;
        if (updateError instanceof Error) {
          if (updateError.message.includes("value too long")) {
            errorMessage = "Token value exceeds maximum allowed length";
            statusCode = 400;
          } else if (updateError.message.includes("constraint")) {
            errorMessage = "Configuration update violated a database constraint";
            statusCode = 400;
          }
          res.status(statusCode).json({
            error: errorMessage,
            details: updateError.message
          });
        } else {
          res.status(500).json({ error: "Unknown error updating configuration" });
        }
      }
    } catch (error) {
      console.error(`Error updating configuration ${req.params.key}:`, error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });
  app2.post("/api/config", isAuthenticated, async (req, res) => {
    try {
      const configData = req.body;
      try {
        configurationSchema.parse(configData);
      } catch (validationError) {
        return res.status(400).json({ error: "Invalid configuration data", details: validationError });
      }
      const existingConfig = await storage.getConfiguration(configData.key);
      if (existingConfig) {
        return res.status(409).json({ error: "Configuration already exists" });
      }
      const created = await storage.setConfiguration(configData);
      const safeConfig = {
        ...created,
        value: created.encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : created.value
      };
      res.status(201).json(safeConfig);
    } catch (error) {
      console.error("Error creating configuration:", error);
      res.status(500).json({ error: "Failed to create configuration" });
    }
  });
  app2.post("/api/config/bulk", isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      try {
        configurationBulkUpdateSchema.parse(updates);
      } catch (validationError) {
        return res.status(400).json({ error: "Invalid bulk update data", details: validationError });
      }
      const results = [];
      for (const update of updates) {
        const { key, value } = update;
        const existingConfig = await storage.getConfiguration(key);
        if (!existingConfig) {
          results.push({ key, success: false, error: "Configuration not found" });
          continue;
        }
        try {
          await storage.updateConfiguration(key, value);
          results.push({ key, success: true });
        } catch (error) {
          results.push({ key, success: false, error: "Update failed" });
        }
      }
      res.json(results);
    } catch (error) {
      console.error("Error in bulk configuration update:", error);
      res.status(500).json({ error: "Failed to process bulk update" });
    }
  });
  app2.delete("/api/config/:key", isAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      const existingConfig = await storage.getConfiguration(key);
      if (!existingConfig) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      const success = await storage.deleteConfiguration(key);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete configuration" });
      }
    } catch (error) {
      console.error(`Error deleting configuration ${req.params.key}:`, error);
      res.status(500).json({ error: "Failed to delete configuration" });
    }
  });
  app2.post("/api/config/test/:key", isAuthenticated, async (req, res) => {
    try {
      const { key } = req.params;
      const config4 = await storage.getConfiguration(key);
      if (!config4 || !config4.value) {
        return res.status(404).json({ error: "Configuration not found or empty" });
      }
      switch (config4.key) {
        case "OURA_TOKEN":
          try {
            const ouraClient = new OuraClient(config4.value);
            const testResult = await ouraClient.testConnection();
            res.json({ success: true, message: "Oura connection successful", details: testResult });
          } catch (error) {
            console.error("Oura connection test failed:", error);
            res.status(400).json({ success: false, message: "Oura connection failed", error: String(error) });
          }
          break;
        case "OLLAMA_ENDPOINT":
          try {
            const ollamaClient2 = new OllamaClient(config4.value);
            const testResult = await ollamaClient2.testConnection();
            res.json({ success: true, message: "Ollama connection successful", details: testResult });
          } catch (error) {
            console.error("Ollama connection test failed:", error);
            res.status(400).json({ success: false, message: "Ollama connection failed", error: String(error) });
          }
          break;
        case "LIMITLESS_API_TOKEN":
          try {
            const limitlessClient = new LimitlessClient(config4.value);
            const testResult = await limitlessClient.testConnection();
            res.json({ success: true, message: "Limitless API connection successful", details: testResult });
          } catch (error) {
            console.error("Limitless API connection test failed:", error);
            res.status(400).json({ success: false, message: "Limitless API connection failed", error: String(error) });
          }
          break;
        case "PERPLEXITY_API_TOKEN":
          try {
            const perplexityClient = new PerplexityClient(config4.value);
            const testResult = await axios6.get("https://api.perplexity.ai/models", {
              headers: {
                "Authorization": `Bearer ${config4.value}`,
                "Content-Type": "application/json"
              }
            });
            res.json({
              success: true,
              message: "Perplexity API connection successful",
              details: { models: testResult.data?.data || [] }
            });
          } catch (error) {
            console.error("Perplexity API connection test failed:", error);
            res.status(400).json({
              success: false,
              message: "Perplexity API connection failed",
              error: error instanceof Error ? error.message : String(error)
            });
          }
          break;
        case "OPENROUTER_API_TOKEN":
          try {
            const openRouterClient = new OpenRouterClient(config4.value);
            const testResult = await openRouterClient.isHealthy();
            if (testResult) {
              const models = await openRouterClient.listModels();
              res.json({
                success: true,
                message: "OpenRouter API connection successful",
                details: { models: models.data || [] }
              });
            } else {
              throw new Error("OpenRouter API health check failed");
            }
          } catch (error) {
            console.error("OpenRouter API connection test failed:", error);
            res.status(400).json({
              success: false,
              message: "OpenRouter API connection failed",
              error: error instanceof Error ? error.message : String(error)
            });
          }
          break;
        case "GROQ_API_TOKEN":
          try {
            const groqClient = new GroqClient(config4.value);
            const testResult = await groqClient.testConnection();
            res.json({
              success: testResult.success,
              message: testResult.message,
              details: { models: testResult.models || [] }
            });
          } catch (error) {
            console.error("Groq API connection test failed:", error);
            res.status(400).json({
              success: false,
              message: "Groq API connection failed",
              error: error instanceof Error ? error.message : String(error)
            });
          }
          break;
        // Add test cases for other API tokens and endpoints as needed
        default:
          res.status(400).json({ success: false, message: `No test implemented for ${config4.key}` });
      }
    } catch (error) {
      console.error(`Error testing configuration ${req.params.key}:`, error);
      res.status(500).json({ error: "Failed to test configuration" });
    }
  });
  console.log("Setting up WebSocket server at path /ws");
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    console.log(`[Debug] WebSocket upgrade request: ${request.url}`);
    console.log(`[Debug] WebSocket pathname: ${pathname}`);
    console.log(`[Debug] WebSocket query params: ${new URL(request.url || "", `http://${request.headers.host}`).search}`);
  });
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    verifyClient: (info, cb) => {
      const token = new URL(info.req.url || "", `http://${info.req.headers.host}`).searchParams.get("token");
      console.log(`[Debug] WebSocket verifyClient called, token: ${token ? "present" : "missing"}`);
      if (process.env.NODE_ENV === "development") {
        console.log("[Debug] Development mode - accepting WebSocket connection regardless of token");
        cb(true);
        return;
      }
      if (!token) {
        console.log("[Debug] WebSocket connection rejected: no token");
        cb(false, 401, "Unauthorized: Missing authentication token");
        return;
      }
      cb(true);
    }
  });
  const connections = /* @__PURE__ */ new Map();
  function parseToken(req) {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    console.log(`[Debug] parseToken called, token: ${token ? "present" : "missing"}`);
    return token;
  }
  async function getUserIdFromToken(token) {
    console.log(`[Debug] getUserIdFromToken called, token: ${token ? "present" : "missing"}`);
    if (!token) {
      console.log("[Debug] No token provided, returning null");
      return null;
    }
    try {
      console.log("[Debug] Development mode - returning default user ID 1");
      return 1;
    } catch (error) {
      console.error("[Debug] Error verifying token:", error);
      return null;
    }
  }
  wss.on("connection", async (ws2, req) => {
    const token = parseToken(req);
    const userId = await getUserIdFromToken(token) || 1;
    const connectionId = Math.random().toString(36).substring(7);
    connections.set(connectionId, { ws: ws2, userId });
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "chat") {
          await handleChatMessage(message, ws2);
        }
      } catch (error) {
        ws2.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });
    ws2.on("close", () => {
      connections.delete(connectionId);
    });
    ws2.send(JSON.stringify({
      type: "connected",
      connectionId
    }));
  });
  async function handleChatMessage(message, ws2) {
    try {
      const { conversationId, content } = message;
      const connectionEntry = Array.from(connections.entries()).find(([_, connInfo]) => connInfo.ws === ws2);
      const userId = connectionEntry ? connectionEntry[1].userId : 1;
      const settings2 = await storage.getSettings(userId);
      if (!settings2) {
        throw new Error("User settings not found");
      }
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
      } else {
        conversation = await storage.createConversation({
          title: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
          userId
        });
      }
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content,
        metadata: null
      });
      ws2.send(JSON.stringify({
        type: "typing",
        conversationId: conversation.id
      }));
      const messages2 = await storage.getMessagesByConversation(conversation.id);
      const ollamaMessages = messages2.slice(-10).map((msg) => {
        const contentStr = msg.content === null || msg.content === void 0 ? "" : typeof msg.content === "string" ? msg.content : String(msg.content);
        return {
          role: msg.role,
          content: contentStr
        };
      });
      const routingDecision = await mcpRoutingService.routeRequest({
        userMessage: content,
        userId: String(userId),
        // Convert number userId to string to match expected type
        conversationContext: ollamaMessages
        // Note: enabledTools is handled internally by determineEnabledTools method
      });
      console.log(`MCP Routing: ${routingDecision.routingDecision?.reasoning || "No reasoning"} (confidence: ${routingDecision.routingDecision?.confidence || 0})`);
      let toolResults = {};
      let contextData = "";
      for (const toolName of routingDecision.enabledTools) {
        try {
          const [serverName, actualToolName] = toolName.split("/");
          if (!serverName || !actualToolName) {
            throw new Error(`Invalid tool format: ${toolName}. Expected format: server/tool-name`);
          }
          const result = await executeMCPTool2(serverName, actualToolName, {
            userId,
            date: (/* @__PURE__ */ new Date()).toISOString()
          });
          toolResults[toolName] = result;
          if (result.content) {
            for (const item of result.content) {
              if (item.type === "text") {
                contextData += item.text + "\n";
              } else if (item.type === "json") {
                contextData += JSON.stringify(item.json, null, 2) + "\n";
              }
            }
          }
        } catch (error) {
          console.error(`Error executing MCP tool ${toolName}:`, error);
          toolResults[toolName] = { error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
      const systemMessage = {
        role: "system",
        content: `You are Cognos, a personal AI assistant with access to health data and web search. You provide helpful, accurate responses with a focus on health insights when relevant. Be conversational and supportive.${contextData}`
      };
      let response;
      if (process.env.OPENROUTER_API_KEY) {
        const openRouterHealthy = !!process.env.OPENROUTER_API_KEY;
        if (openRouterHealthy) {
          const openRouterClient = createOpenRouterClient(process.env.OPENROUTER_API_KEY);
          const openRouterResponse = await openRouterClient.chat({
            model: "anthropic/claude-3.5-sonnet",
            messages: [systemMessage, ...ollamaMessages],
            temperature: 0.7
          });
          response = {
            message: openRouterResponse.choices[0].message
          };
        } else {
          const ollamaClient2 = createOllamaClient2(settings2.ollamaUrl);
          response = await ollamaClient2.chat({
            model: settings2.ollamaModel,
            messages: [systemMessage, ...ollamaMessages],
            temperature: 0.7
          });
        }
      } else {
        const ollamaClient2 = createOllamaClient2(settings2.ollamaUrl);
        response = await ollamaClient2.chat({
          model: settings2.ollamaModel,
          messages: [systemMessage, ...ollamaMessages],
          temperature: 0.7
        });
      }
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: response.message.content,
        metadata: Object.keys(toolResults).length > 0 ? { toolResults, tools: routingDecision.enabledTools } : null
      });
      ws2.send(JSON.stringify({
        type: "message",
        conversationId: conversation.id,
        message: {
          id: aiMessage.id,
          role: "assistant",
          content: response.message.content,
          metadata: aiMessage.metadata,
          createdAt: aiMessage.createdAt
        }
      }));
    } catch (error) {
      console.error("Chat error:", error);
      ws2.send(JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to process message"
      }));
    }
  }
  app2.get("/api/health", isAuthenticated, async (req, res) => {
    try {
      const queryParams = {
        ...req.query,
        limit: req.query.limit ? parseInt(req.query.limit) : 50
      };
      const query = healthQuerySchema.parse(queryParams);
      const userId = req.user?.id || 1;
      const filters = {
        limit: query.limit
      };
      if (query.dataType) filters.dataType = query.dataType;
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);
      const healthData2 = await storage.getHealthData(userId, filters);
      res.json(healthData2);
    } catch (error) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/health/sync", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      const result = await executeMCPTool2("oura", "sync-health-data", { userId });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      const conversations2 = await storage.getConversationsByUser(userId);
      res.json(conversations2);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch conversations",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages2 = await storage.getMessagesByConversation(conversationId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch messages",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation({
        ...data,
        userId: req.user?.id || 1
      });
      res.json(conversation);
    } catch (error) {
      res.status(400).json({
        error: "Invalid conversation data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/chat/completions", isAuthenticated, async (req, res) => {
    try {
      const data = chatCompletionSchema.parse(req.body);
      const userId = req.user?.id || 1;
      const settings2 = await storage.getSettings(userId);
      if (!settings2) {
        return res.status(500).json({ error: "User settings not found" });
      }
      const useOllama = req.headers["x-use-ollama"] === "true" || data.model?.includes(":") || // Ollama models often have format "model:tag"
      !process.env.OPENROUTER_API_KEY;
      if (useOllama && settings2.ollamaUrl) {
        const ollamaClient2 = createOllamaClient2(settings2.ollamaUrl);
        const response = await ollamaClient2.chat({
          model: data.model || settings2.ollamaModel,
          messages: data.messages,
          temperature: data.temperature,
          max_tokens: data.max_tokens
        });
        res.json({
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1e3),
          model: data.model || settings2.ollamaModel,
          choices: [{
            index: 0,
            message: response.message,
            finish_reason: "stop"
          }],
          usage: {
            prompt_tokens: response.prompt_eval_count || 0,
            completion_tokens: response.eval_count || 0,
            total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
          }
        });
      } else if (process.env.OPENROUTER_API_KEY) {
        const openRouterClient = createOpenRouterClient(process.env.OPENROUTER_API_KEY);
        const response = await openRouterClient.chat({
          model: data.model || "anthropic/claude-3.5-sonnet",
          messages: data.messages,
          temperature: data.temperature,
          max_tokens: data.max_tokens
        });
        res.json(response);
      } else {
        res.status(500).json({ error: "No AI provider configured" });
      }
    } catch (error) {
      res.status(500).json({
        error: "Chat completion failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/mcp/tools", isAuthenticated, (req, res) => {
    res.json(listMCPTools2());
  });
  app2.post("/api/mcp/execute", isAuthenticated, async (req, res) => {
    try {
      const { tool, input } = req.body;
      const userId = req.user?.id || 1;
      const [serverName, toolName] = tool.split("/");
      if (!serverName || !toolName) {
        throw new Error("Invalid tool format. Expected format: server/tool-name");
      }
      const result = await executeMCPTool2(serverName, toolName, { userId, ...input });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Tool execution failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user?.id || 1;
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      await storage.updateConversation(conversationId, { title });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: "Failed to update conversation",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ollama/test-connection", isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, message: "URL is required" });
      }
      const ollamaClient2 = createOllamaClient2(url);
      const isHealthy = await ollamaClient2.isHealthy();
      if (!isHealthy) {
        return res.status(200).json({
          success: false,
          message: `Cannot connect to Ollama at ${url}`
        });
      }
      try {
        const response = await fetch(`${url}/api/version`);
        if (!response.ok) {
          throw new Error(`Failed to get version, status: ${response.status}`);
        }
        const versionInfo = await response.json();
        return res.json({
          success: true,
          message: `Connected to Ollama ${versionInfo.version || "server"}!`,
          version: versionInfo.version
        });
      } catch (e) {
        return res.json({
          success: true,
          message: `Connected to Ollama server!`
        });
      }
    } catch (error) {
      console.error("Error testing Ollama connection:", error);
      return res.status(200).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect to Ollama server"
      });
    }
  });
  app2.get("/api/models", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      const settings2 = await storage.getSettings(userId);
      if (!settings2) {
        return res.status(404).json({ error: "Settings not found" });
      }
      const ollamaClient2 = createOllamaClient2(settings2.ollamaUrl);
      const isHealthy = await ollamaClient2.isHealthy();
      if (!isHealthy) {
        return res.status(503).json({
          error: "Ollama service unavailable",
          message: "Could not connect to Ollama. Make sure Ollama is running.",
          currentModel: settings2.ollamaModel
        });
      }
      const models = await ollamaClient2.listModels();
      res.json({
        models: models.models,
        currentModel: settings2.ollamaModel
      });
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({
        error: "Failed to fetch models",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      const userSettings = await storage.getSettings(userId);
      if (!userSettings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      const safeSettings = {
        ...userSettings,
        ouraToken: userSettings.ouraToken ? "********" : null
      };
      res.json(safeSettings);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch settings",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      const updates = req.body;
      const settings2 = await storage.updateSettings(userId, updates);
      if (!settings2) {
        return res.status(404).json({ error: "Settings not found" });
      }
      const { ouraToken, ...safeSettings } = settings2;
      res.json({
        ...safeSettings,
        hasOuraToken: !!ouraToken
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to update settings",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id || 1;
      let settings2;
      try {
        settings2 = await storage.getSettings(userId);
      } catch (error) {
        console.log("Error getting settings, using defaults:", error);
        settings2 = {
          ollamaUrl: "http://localhost:11434",
          ollamaModel: "mistral:latest",
          enabledMcpTools: []
        };
      }
      if (!settings2) {
        settings2 = {
          ollamaUrl: "http://localhost:11434",
          ollamaModel: "mistral:latest",
          enabledMcpTools: []
        };
      }
      let openRouterHealthy = false;
      if (process.env.OPENROUTER_API_KEY) {
        try {
          openRouterHealthy = !!process.env.OPENROUTER_API_KEY;
        } catch {
          openRouterHealthy = false;
        }
      }
      const ollamaClient2 = new OllamaClient(settings2.ollamaUrl);
      const ollamaHealthy = await ollamaClient2.isHealthy();
      let ouraHealthy = false;
      if (process.env.OURA_TOKEN) {
        try {
          const ouraClient = new OuraClient(process.env.OURA_TOKEN);
          ouraHealthy = await ouraClient.isHealthy();
        } catch {
          ouraHealthy = false;
        }
      }
      let perplexityHealthy = false;
      if (process.env.PERPLEXITY_API_KEY) {
        try {
          perplexityHealthy = !!process.env.PERPLEXITY_API_KEY;
        } catch {
          perplexityHealthy = false;
        }
      }
      res.json({
        ai: {
          provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "ollama",
          status: process.env.OPENROUTER_API_KEY ? openRouterHealthy ? "connected" : "disconnected" : ollamaHealthy ? "connected" : "disconnected",
          model: process.env.OPENROUTER_API_KEY ? "anthropic/claude-3.5-sonnet" : settings2.ollamaModel
        },
        ollama: {
          status: ollamaHealthy ? "connected" : "disconnected",
          url: settings2.ollamaUrl,
          model: settings2.ollamaModel
        },
        oura: {
          status: ouraHealthy ? "connected" : "disconnected",
          configured: !!process.env.OURA_TOKEN
        },
        perplexity: {
          status: perplexityHealthy ? "connected" : "disconnected",
          configured: !!process.env.PERPLEXITY_API_KEY
        },
        mcpTools: settings2.enabledMcpTools || [],
        ngrok: {
          isActive: ngrokService.isActive(),
          tunnelUrl: ngrokService.getTunnelUrl(),
          endpoints: ngrokService.getApiEndpoints()
        }
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to check status",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ngrok/start", isAuthenticated, async (req, res) => {
    try {
      const { authtoken, region, subdomain } = req.body;
      const url = await ngrokService.startTunnel({
        port: 5e3,
        authtoken,
        region,
        subdomain
      });
      res.json({
        success: true,
        tunnelUrl: url,
        endpoints: ngrokService.getApiEndpoints()
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to start tunnel",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ngrok/stop", isAuthenticated, async (req, res) => {
    try {
      await ngrokService.stopTunnel();
      res.json({ success: true, message: "Tunnel stopped" });
    } catch (error) {
      res.status(500).json({
        error: "Failed to stop tunnel",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/ngrok/status", isAuthenticated, async (req, res) => {
    try {
      const info = await ngrokService.getConnectionInfo();
      res.json({
        isActive: ngrokService.isActive(),
        tunnelUrl: ngrokService.getTunnelUrl(),
        endpoints: ngrokService.getApiEndpoints(),
        ...info
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get tunnel status",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  return server;
}

// server/vite.ts
import express3 from "express";
import fs4 from "fs";
import path8 from "path";
import * as vite from "vite";
var serverDir = path8.join(process.cwd(), "server");
var projectRoot2 = process.cwd();
var viteConfig = {};
var nanoid3 = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);
var viteLogger = {
  info: (msg) => console.log(`\x1B[32m[vite]\x1B[0m ${msg}`),
  warn: (msg) => console.log(`\x1B[33m[vite]\x1B[0m ${msg}`),
  error: (msg) => console.log(`\x1B[31m[vite]\x1B[0m ${msg}`)
};
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  try {
    const viteConfigModule = await Promise.resolve().then(() => (init_vite_config(), vite_config_exports));
    viteConfig = viteConfigModule.default || viteConfigModule;
  } catch (e) {
    console.warn("Could not load vite config, using defaults", e);
  }
  const devServer = await vite.createServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: serverOptions,
    appType: "custom"
  });
  app2.use(devServer.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      return next();
    }
    try {
      const clientTemplate = path8.resolve(
        projectRoot2,
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await devServer.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      devServer.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path8.resolve(serverDir, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express3.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path8.resolve(distPath, "index.html"));
  });
}

// server/authRoutes.ts
import express4 from "express";
import passport2 from "passport";
import { z as z6 } from "zod";
var router4 = express4.Router();
router4.post("/login", async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    passport2.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Authentication failed"
        });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        const { password, ...safeUserData } = user;
        return res.json({
          success: true,
          user: safeUserData
        });
      });
    })(req, res, next);
  } catch (error) {
    if (error instanceof z6.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});
router4.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});
router4.get("/me", isAuthenticated, (req, res) => {
  const { password, ...safeUserData } = req.user;
  res.json({
    success: true,
    user: safeUserData
  });
});
router4.post("/change-password", isAuthenticated, async (req, res, next) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const userId = req.user.id;
    await changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword
    );
    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    if (error instanceof z6.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      next(error);
    }
  }
});
router4.post("/register", async (req, res, next) => {
  try {
    const allowSelfRegistration = process.env.ALLOW_SELF_REGISTRATION === "true";
    if (!allowSelfRegistration) {
      if (!req.isAuthenticated()) {
        return res.status(403).json({
          success: false,
          message: "Self-registration is disabled"
        });
      }
      const isAdmin = req.user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Only administrators can create new users"
        });
      }
    }
    const validatedData = registrationSchema.parse(req.body);
    const newUser = await registerUser2(
      validatedData.username,
      validatedData.password,
      validatedData.email || void 0
    );
    const { password, ...safeUserData } = newUser;
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: safeUserData
    });
  } catch (error) {
    if (error instanceof z6.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});
var authRoutes = router4;

// server/index.ts
var app = express5();
app.use(express5.json());
app.use(express5.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path9 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path9.startsWith("/api")) {
      let logLine = `${req.method} ${path9} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
(async () => {
  console.log("Server starting...");
  console.log("Initializing auth system...");
  await initializeAuth(app);
  app.use("/api/auth", authRoutes);
  console.log("Initializing admin user if needed...");
  await initializeAdminUser();
  console.log("Registering routes...");
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const responseMessage = process.env.NODE_ENV === "production" && status === 500 ? "Internal Server Error" : message;
    res.status(status).json({ message: responseMessage });
    if (process.env.NODE_ENV === "production") {
      console.error(err);
    } else {
      throw err;
    }
  });
  if (app.get("env") === "development") {
    console.log("Setting up Vite development middleware...");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving...");
    serveStatic(app);
  }
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  server.listen({
    port,
    host: "0.0.0.0"
    // Listen on all interfaces to allow tunnel access
  }, async () => {
    console.log(`Server is now running on http://localhost:${port}`);
    log2(`serving on port ${port}`);
    console.log("Initializing ngrok tunnel...");
    await initializeNgrok();
    console.log("Server initialization complete");
  });
})().catch((error) => {
  console.error("Caught error in main IIFE:", error);
});

import { Prompt } from "../types.js";

/**
 * Omi MCP Prompts
 * 
 * This module defines prompts that provide context about Omi memories and conversations
 * for use in LLM interactions and Cognos memory aggregation.
 */

export const memoryContextPrompt: Prompt = {
  name: "omi-memory-context",
  description: "Provides context about the user's Omi memories for personalized interactions",
  arguments: [
    {
      name: "categories",
      description: "Memory categories to include (optional)",
      required: false
    },
    {
      name: "recent_days",
      description: "Number of recent days to include (default: 30)",
      required: false
    },
    {
      name: "limit",
      description: "Maximum number of memories to include (default: 50)",
      required: false
    }
  ]
};

export const conversationSummaryPrompt: Prompt = {
  name: "omi-conversation-summary",
  description: "Provides a summary of recent Omi conversations for context",
  arguments: [
    {
      name: "conversation_id",
      description: "Specific conversation ID to summarize (optional)",
      required: false
    },
    {
      name: "days_back",
      description: "Number of days back to include conversations (default: 7)",
      required: false
    },
    {
      name: "categories",
      description: "Conversation categories to include (optional)",
      required: false
    }
  ]
};

export const healthInsightsPrompt: Prompt = {
  name: "omi-health-insights",
  description: "Extracts health-related insights from Omi conversations for Cognos integration",
  arguments: [
    {
      name: "timeframe_days",
      description: "Number of days to analyze (default: 14)",
      required: false
    },
    {
      name: "focus_areas",
      description: "Specific health areas to focus on (sleep, exercise, mental_health, nutrition, etc.)",
      required: false
    }
  ]
};

export const cognosAggregationPrompt: Prompt = {
  name: "omi-cognos-aggregation",
  description: "Prepares Omi data for Cognos memory aggregation with health context",
  arguments: [
    {
      name: "user_id",
      description: "User ID for the aggregation",
      required: true
    },
    {
      name: "start_date",
      description: "Start date for aggregation (YYYY-MM-DD)",
      required: true
    },
    {
      name: "end_date", 
      description: "End date for aggregation (YYYY-MM-DD)",
      required: true
    },
    {
      name: "include_health_correlation",
      description: "Whether to include health data correlation analysis",
      required: false
    }
  ]
};

export const personalizationPrompt: Prompt = {
  name: "omi-personalization",
  description: "Provides personalization context based on user's Omi memories and conversation patterns",
  arguments: [
    {
      name: "interaction_type",
      description: "Type of interaction being personalized (chat, recommendation, summary, etc.)",
      required: false
    },
    {
      name: "focus_categories",
      description: "Specific categories to emphasize for personalization",
      required: false
    }
  ]
};

// Export all prompts as an array
export const omiPrompts: Prompt[] = [
  memoryContextPrompt,
  conversationSummaryPrompt,
  healthInsightsPrompt,
  cognosAggregationPrompt,
  personalizationPrompt
];
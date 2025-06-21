import { Tool } from "../types.js";

/**
 * Oura MCP Tools
 * 
 * This module defines specific tools for fetching Oura Ring health data.
 * Each tool provides a focused interface for retrieving a specific category of health data.
 */

// Define the generic Oura fetch tool
export const ouraFetchTool: Tool = {
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
          "tags",
        ],
        description: "The Oura API endpoint to fetch data from",
      },
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format",
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format",
      },
      startDateTime: {
        type: "string",
        description:
          "Start datetime in ISO format with timezone (for heartrate endpoint)",
      },
      endDateTime: {
        type: "string",
        description:
          "End datetime in ISO format with timezone (for heartrate endpoint)",
      },
      sleepPeriod: {
        type: "boolean",
        description:
          "Whether to filter heart rate data to sleep periods only (requires additional sleep data fetch)",
      },
      tagName: {
        type: "string",
        description: "Optional filter for specific tag name or keyword in comment",
      },
    },
    required: ["endpoint"],
  },
};

// Define specific tools for each data type
export const getSleepDataTool: Tool = {
  name: "get_sleep_data",
  description: "Fetch sleep data from Oura Ring",
  inputSchema: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format",
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format",
      },
    },
    required: [],
  },
};

export const getActivityDataTool: Tool = {
  name: "get_activity_data",
  description: "Fetch activity data from Oura Ring",
  inputSchema: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format",
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format",
      },
    },
    required: [],
  },
};

export const getReadinessDataTool: Tool = {
  name: "get_readiness_data",
  description: "Fetch readiness data from Oura Ring",
  inputSchema: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format",
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format",
      },
    },
    required: [],
  },
};

// Export all tools
export const ouraTools: Tool[] = [
  ouraFetchTool,
  getSleepDataTool,
  getActivityDataTool,
  getReadinessDataTool
];

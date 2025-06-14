/**
 * Bee AI MCP Prompts
 * 
 * This module defines the available prompts for the Bee MCP server.
 */

export const beePrompts = [
  {
    id: "bee_conversation_analysis",
    name: "Bee Conversation Analysis",
    description: "Analyze a transcribed conversation from Bee device",
    prompt: `You are an AI assistant analyzing a transcribed conversation from a Bee device. 
Given the transcription below, analyze the conversation and provide insights on:
1. Key topics discussed
2. Action items or follow-ups needed
3. Important decisions made
4. Overall sentiment and tone
5. Suggestions for improvement

TRANSCRIPTION:
{{transcript}}

Provide your analysis in a clear, structured format with sections for each of the points above.`,
  },
  {
    id: "bee_daily_summary",
    name: "Bee Daily Summary",
    description: "Create a summary of the day's conversations from Bee device",
    prompt: `You are an AI assistant summarizing a day's worth of conversations from a Bee device.
Based on the conversation summaries below, create a comprehensive daily digest that:
1. Highlights the most important conversations
2. Compiles all action items into a task list
3. Identifies key people mentioned throughout the day
4. Notes any recurring themes or topics
5. Suggests priorities for follow-up

DAILY SUMMARIES:
{{summaries}}

Format your response as a daily digest with clear sections and bullet points where appropriate.`,
  },
  {
    id: "bee_knowledge_extraction",
    name: "Bee Knowledge Extraction",
    description: "Extract structured knowledge from Bee conversations",
    prompt: `You are an AI assistant extracting structured knowledge from Bee device conversations.
Review the transcript below and extract structured information about:
1. People mentioned (names, roles, contact info if available)
2. Organizations discussed (names, relationships, key facts)
3. Locations referenced (places, addresses, context)
4. Events mentioned (what, when, who's involved)
5. Key concepts or terms with their definitions as understood in this context

TRANSCRIPT:
{{transcript}}

Organize your response as a knowledge base entry with clear categories and structured data.`,
  },
  {
    id: "bee_meeting_notes",
    name: "Bee Meeting Notes",
    description: "Generate professional meeting notes from Bee conversation",
    prompt: `You are an AI assistant creating professional meeting notes from a Bee device transcription.
Based on the conversation transcript below, generate detailed meeting notes that include:
1. Meeting title and participants
2. Agenda items discussed
3. Key decisions and action items (with owners if mentioned)
4. Open questions and items for follow-up
5. Next steps and timeline

MEETING TRANSCRIPT:
{{transcript}}

Format your response as professional meeting minutes that could be shared with participants.`,
  },
  {
    id: "bee_insight_analysis",
    name: "Bee Insight Analysis",
    description: "Analyze Bee insights data for patterns and recommendations",
    prompt: `You are an AI assistant analyzing insights data from a Bee device.
Based on the insights data below, provide an analysis that covers:
1. Key communication patterns identified
2. Trends in conversation topics over time
3. Productivity assessment based on conversation metrics
4. Areas for potential communication improvement
5. Actionable recommendations based on the data

INSIGHTS DATA:
{{insights}}

Your analysis should be data-driven, insightful, and include specific recommendations.`,
  }
];

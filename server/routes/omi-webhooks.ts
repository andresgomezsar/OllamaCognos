import express from 'express';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { EventEmitter } from 'events';

// Webhook event emitter for real-time communication
const webhookEvents = new EventEmitter();
// Increase max listeners to avoid warnings
webhookEvents.setMaxListeners(50);

// In-memory storage for recent transcripts and events
// In production, use a proper database
const transcriptStorage: Record<string, any[]> = {
  realtime: [],  // Real-time transcript chunks
  conversations: [], // Completed conversations
  daysSummary: [] // Daily summary data
};

// Audio bytes storage (limited capacity)
const audioStorage: Record<string, Buffer[]> = {};

// Cleanup old data periodically (every 5 minutes)
setInterval(() => {
  // Keep only last 100 real-time transcript chunks
  if (transcriptStorage.realtime.length > 100) {
    transcriptStorage.realtime = transcriptStorage.realtime.slice(-100);
  }
  
  // Keep only last 50 conversations
  if (transcriptStorage.conversations.length > 50) {
    transcriptStorage.conversations = transcriptStorage.conversations.slice(-50);
  }
  
  // Cleanup audio storage older than 5 minutes
  const now = Date.now();
  Object.entries(audioStorage).forEach(([id, _]) => {
    if (now - parseInt(id.split('_')[0]) > 5 * 60 * 1000) {
      delete audioStorage[id];
    }
  });
}, 5 * 60 * 1000);

const router = express.Router();

/**
 * Omi real-time transcript webhook
 * Receives real-time transcript chunks from Omi device
 */
router.post('/realtime-transcript', async (req: Request, res: Response) => {
  const data = req.body;
  
  try {
    // Validate webhook payload
    if (!data || !data.transcript) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Add timestamp and ID
    const transcriptEvent = {
      ...data,
      timestamp: Date.now(),
      id: nanoid(),
    };
    
    // Store transcript chunk
    transcriptStorage.realtime.push(transcriptEvent);
    
    // Emit event for real-time processing
    webhookEvents.emit('realtime-transcript', transcriptEvent);
    
    // Log receipt (development only)
    console.log(`Received real-time transcript: ${data.transcript.substring(0, 30)}...`);
    
    // Send acknowledgement
    res.status(200).json({ 
      success: true,
      message: 'Real-time transcript received'
    });
  } catch (error) {
    console.error('Error processing real-time transcript webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Omi conversation events webhook
 * Receives conversation start/end events from Omi device
 */
router.post('/conversation-events', async (req: Request, res: Response) => {
  const data = req.body;
  
  try {
    // Validate webhook payload
    if (!data || !data.event_type) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Add timestamp and ID
    const conversationEvent = {
      ...data,
      timestamp: Date.now(),
      id: nanoid(),
    };
    
    // Store conversation event
    transcriptStorage.conversations.push(conversationEvent);
    
    // Emit event for real-time processing
    webhookEvents.emit('conversation-event', conversationEvent);
    
    // Log receipt (development only)
    console.log(`Received conversation event: ${data.event_type}`);
    
    // Send acknowledgement
    res.status(200).json({ 
      success: true,
      message: 'Conversation event received'
    });
  } catch (error) {
    console.error('Error processing conversation event webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Omi audio bytes webhook
 * Receives real-time audio bytes from Omi device
 */
router.post('/audio-bytes', async (req: Request, res: Response) => {
  try {
    // Check if request includes audio data
    if (!req.body || !req.body.audio || !req.body.format) {
      return res.status(400).json({ error: 'Invalid audio payload' });
    }
    
    // Generate unique ID for this audio chunk
    const audioId = `${Date.now()}_${nanoid(6)}`;
    
    // Parse base64 encoded audio
    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    
    // Store in memory (for short-term processing)
    if (!audioStorage[audioId]) {
      audioStorage[audioId] = [];
    }
    audioStorage[audioId].push(audioBuffer);
    
    // For larger files, consider saving to disk
    if (audioBuffer.length > 1024 * 1024) { // > 1MB
      const tempDir = path.join(process.cwd(), 'temp', 'audio');
      await fs.mkdir(tempDir, { recursive: true });
      const filePath = path.join(tempDir, `${audioId}.${req.body.format || 'wav'}`);
      await fs.writeFile(filePath, audioBuffer);
      
      // Emit event with file path instead of buffer
      webhookEvents.emit('audio-bytes', {
        id: audioId,
        filePath,
        format: req.body.format,
        timestamp: Date.now(),
        metadata: req.body.metadata || {}
      });
    } else {
      // Emit event for real-time processing
      webhookEvents.emit('audio-bytes', {
        id: audioId,
        audioBuffer,
        format: req.body.format,
        timestamp: Date.now(),
        metadata: req.body.metadata || {}
      });
    }
    
    // Log receipt (development only)
    console.log(`Received audio bytes: ${audioBuffer.length} bytes, format: ${req.body.format}`);
    
    // Send acknowledgement
    res.status(200).json({
      success: true,
      message: 'Audio bytes received',
      audioId
    });
  } catch (error) {
    console.error('Error processing audio bytes webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Omi day summary webhook
 * Receives daily summary data from Omi device
 */
router.post('/day-summary', async (req: Request, res: Response) => {
  const data = req.body;
  
  try {
    // Validate webhook payload
    if (!data || !data.day || !data.summary) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Add timestamp and ID
    const summaryEvent = {
      ...data,
      received_timestamp: Date.now(),
      id: nanoid(),
    };
    
    // Store day summary
    transcriptStorage.daysSummary.push(summaryEvent);
    
    // Emit event for processing
    webhookEvents.emit('day-summary', summaryEvent);
    
    // Log receipt (development only)
    console.log(`Received day summary for: ${data.day}`);
    
    // Send acknowledgement
    res.status(200).json({ 
      success: true,
      message: 'Day summary received'
    });
  } catch (error) {
    console.error('Error processing day summary webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook status endpoint
 * Returns status of webhook configuration
 */
router.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'operational',
    endpoints: {
      'realtime-transcript': `/api/omi/webhook/realtime-transcript`,
      'conversation-events': `/api/omi/webhook/conversation-events`,
      'audio-bytes': `/api/omi/webhook/audio-bytes`,
      'day-summary': `/api/omi/webhook/day-summary`,
    },
    stats: {
      realtime_transcript_count: transcriptStorage.realtime.length,
      conversation_events_count: transcriptStorage.conversations.length,
      days_summary_count: transcriptStorage.daysSummary.length,
      audio_storage_chunks: Object.keys(audioStorage).length
    },
    last_updated: new Date().toISOString()
  });
});

export { router as omiWebhookRouter, webhookEvents };

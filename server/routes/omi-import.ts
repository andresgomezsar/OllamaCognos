import * as express from 'express';
import { Request, Response } from 'express';
// Import multer with type definitions
import multer = require('multer');
import { FileFilterCallback } from 'multer';
import * as path from 'path';
import * as fsPromises from 'fs/promises';
import { nanoid } from '../../shared/utils/nanoid-compat';
import { EventEmitter } from 'events';

// Import event emitter from webhooks to maintain consistency
import { webhookEvents } from './omi-webhooks';

// Create router
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: any, cb: any) => {
    // Store uploads in temp directory
    cb(null, path.join(process.cwd(), 'temp', 'uploads'));
  },
  filename: (req: Express.Request, file: any, cb: any) => {
    // Generate unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${nanoid(6)}`;
    cb(null, `omi-import-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Create upload middleware
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Express.Request, file: any, cb: FileFilterCallback) => {
    // Only accept JSON files
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are accepted'));
    }
  }
});

// Helper function to ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
  await fsPromises.mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

// Endpoint to handle file upload
// Extend Request type to include file from multer
interface MulterRequest extends Request {
  file?: any;
}

router.post('/conversations', upload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and parse the uploaded JSON file
    const filePath = req.file.path;
    const fileContent = await fsPromises.readFile(filePath, 'utf8');
    let conversations;
    
    try {
      conversations = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Validate conversations format
    if (!Array.isArray(conversations) && !conversations.conversations) {
      return res.status(400).json({ error: 'Invalid conversations format' });
    }

    // Extract conversations array if needed
    const conversationArray = Array.isArray(conversations) 
      ? conversations 
      : conversations.conversations;

    // Process each conversation
    const importedCount = conversationArray.length;
    let processedCount = 0;

    // Emit events for each conversation for processing and storage
    for (const conversation of conversationArray) {
      // Add import metadata
      const enrichedConversation = {
        ...conversation,
        imported: true,
        import_date: new Date().toISOString(),
        import_id: nanoid()
      };
      
      // Emit import event for processing
      webhookEvents.emit('conversation-import', enrichedConversation);
      processedCount++;
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully imported ${processedCount} conversations`,
      total: importedCount,
      processed: processedCount
    });

    // Clean up uploaded file asynchronously
    fsPromises.unlink(filePath).catch(err => {
      console.error('Error cleaning up uploaded file:', err);
    });

  } catch (error) {
    console.error('Error processing Omi conversations import:', error);
    res.status(500).json({ 
      error: 'Failed to import conversations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint to list imported conversations (summary)
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    // This would typically fetch from a database
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      imported_conversations: [],
      message: 'To import conversations, use the drag-and-drop uploader on the Omi Import page'
    });
  } catch (error) {
    console.error('Error listing imported conversations:', error);
    res.status(500).json({ error: 'Failed to list imported conversations' });
  }
});

export { router as omiImportRouter };

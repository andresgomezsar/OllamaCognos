import * as fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Store, SessionData } from 'express-session';

// Extend SessionData to include __lastAccess property used internally by the store
declare module 'express-session' {
  interface SessionData {
    __lastAccess?: number;
  }
}

/**
 * A secure, encrypted file-based session store for express-session
 * Implements proper encryption and file permissions for secure local storage
 */
export class EncryptedFileStore extends Store {
  private directory: string;
  private encryptionKey: Buffer;
  private sessionLifetime: number;
  
  /**
   * @param options Configuration options
   * @param options.path Directory to store session files (default: './sessions')
   * @param options.encryptionKey Encryption key for securing session data (required)
   * @param options.ttl Session lifetime in milliseconds (default: 24 hours)
   */
  constructor(options: {
    path?: string;
    encryptionKey: string;
    ttl?: number;
  }) {
    super();
    
    if (!options.encryptionKey) {
      throw new Error('Encryption key is required for EncryptedFileStore');
    }

    this.directory = options.path || path.join(process.cwd(), 'sessions');
    this.sessionLifetime = options.ttl || 24 * 60 * 60 * 1000; // Default: 24 hours
    
    // Derive a proper encryption key from the provided key
    this.encryptionKey = crypto.pbkdf2Sync(
      options.encryptionKey,
      'secure-session-salt',
      10000,
      32,
      'sha256'
    );

    // Ensure the sessions directory exists
    if (!existsSync(this.directory)) {
      try {
        mkdirSync(this.directory, { recursive: true, mode: 0o700 }); // Secure permissions
      } catch (error) {
        console.error('Failed to create session directory:', error);
        throw error;
      }
    }
  }

  /**
   * Encrypt session data
   * @param data Data to encrypt
   * @returns Encrypted data as base64 string
   */
  private encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt session data
   * @param data Encrypted data string
   * @returns Decrypted data
   */
  private decrypt(data: string): string {
    const parts = data.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encrypted = parts.join(':');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get session file path
   * @param sessionId Session ID
   * @returns Path to session file
   */
  private getSessionFilePath(sessionId: string): string {
    // Sanitize session ID to prevent directory traversal
    const sanitizedId = sessionId.replace(/[^a-zA-Z0-9-_]/g, '');
    return path.join(this.directory, `${sanitizedId}.enc`);
  }

  /**
   * Get session data
   * @param sessionId Session ID
   * @param callback Callback function
   */
  get(sessionId: string, callback: (err: any, session?: SessionData | null) => void): void {
    const sessionPath = this.getSessionFilePath(sessionId);

    fs.readFile(sessionPath, 'utf8')
      .then(data => {
        try {
          // Decrypt and parse the session data
          const decrypted = this.decrypt(data);
          const session = JSON.parse(decrypted) as SessionData;
          
          // Check session expiration
          if (session.__lastAccess && 
              Date.now() > session.__lastAccess + this.sessionLifetime) {
            // Session expired, remove it
            this.destroy(sessionId, () => {});
            return callback(null, null);
          }
          
          callback(null, session);
        } catch (error) {
          console.error('Failed to decrypt or parse session:', error);
          callback(null, null);
        }
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          // File not found, not an error
          return callback(null, null);
        }
        console.error('Error reading session file:', err);
        callback(err);
      });
  }

  /**
   * Set session data
   * @param sessionId Session ID
   * @param session Session data
   * @param callback Callback function
   */
  set(sessionId: string, session: SessionData, callback?: (err?: any) => void): void {
    try {
      // Update last access time
      session.__lastAccess = Date.now();
      
      // Encrypt session data
      const data = this.encrypt(JSON.stringify(session));
      const sessionPath = this.getSessionFilePath(sessionId);
      
      fs.writeFile(sessionPath, data, { mode: 0o600 }) // Secure file permissions
        .then(() => callback && callback())
        .catch(err => {
          console.error('Error writing session file:', err);
          callback && callback(err);
        });
    } catch (error) {
      console.error('Error serializing or encrypting session:', error);
      callback && callback(error);
    }
  }

  /**
   * Destroy session
   * @param sessionId Session ID
   * @param callback Callback function
   */
  destroy(sessionId: string, callback?: (err?: any) => void): void {
    const sessionPath = this.getSessionFilePath(sessionId);
    
    fs.unlink(sessionPath)
      .then(() => callback && callback())
      .catch(err => {
        if (err.code === 'ENOENT') {
          // File not found, not an error for destroy operation
          return callback && callback();
        }
        console.error('Error deleting session file:', err);
        callback && callback(err);
      });
  }

  /**
   * Clear all sessions
   * @param callback Callback function
   */
  clear(callback?: (err?: any) => void): void {
    fs.readdir(this.directory)
      .then(files => {
        const sessionFiles = files.filter(file => file.endsWith('.enc'));
        const deletePromises = sessionFiles.map(file => 
          fs.unlink(path.join(this.directory, file))
        );
        
        return Promise.all(deletePromises);
      })
      .then(() => callback && callback())
      .catch(err => {
        console.error('Error clearing session files:', err);
        callback && callback(err);
      });
  }

  /**
   * Get session count
   * @param callback Callback function
   */
  length(callback: (err: any, length?: number) => void): void {
    fs.readdir(this.directory)
      .then(files => {
        const sessionCount = files.filter(file => file.endsWith('.enc')).length;
        callback(null, sessionCount);
      })
      .catch(err => {
        console.error('Error counting session files:', err);
        callback(err);
      });
  }

  /**
   * Get all sessions
   * @param callback Callback function
   */
  all(callback: (err: any, obj?: { [sid: string]: SessionData } | null) => void): void {
    fs.readdir(this.directory)
      .then(async (files) => {
        const sessionFiles = files.filter(file => file.endsWith('.enc'));
        const sessions: { [sid: string]: SessionData } = {};
        
        for (const file of sessionFiles) {
          const sessionId = path.basename(file, '.enc');
          try {
            const data = await fs.readFile(path.join(this.directory, file), 'utf8');
            const decrypted = this.decrypt(data);
            const session = JSON.parse(decrypted) as SessionData;
            
            // Check session expiration
            if (session.__lastAccess && 
                Date.now() > session.__lastAccess + this.sessionLifetime) {
              // Skip expired sessions
              continue;
            }
            
            sessions[sessionId] = session;
          } catch (error) {
            console.error(`Error reading session file ${file}:`, error);
          }
        }
        
        callback(null, sessions);
      })
      .catch(err => {
        console.error('Error reading session directory:', err);
        callback(err, null);
      });
  }

  /**
   * Touch session to update expiration
   * @param sessionId Session ID
   * @param session Session data
   * @param callback Callback function
   */
  touch(sessionId: string, session: SessionData, callback?: () => void): void {
    session.__lastAccess = Date.now();
    this.set(sessionId, session, err => {
      callback && callback();
    });
  }
}

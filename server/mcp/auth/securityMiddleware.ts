import { Request, Response, NextFunction } from 'express';
import { TokenStore } from './authProvider';

/**
 * Security middleware for protecting MCP endpoints
 */
export class SecurityMiddleware {
  private tokenStore: TokenStore;
  
  constructor(tokenStore: TokenStore) {
    this.tokenStore = tokenStore;
  }
  
  /**
   * Middleware to enforce authentication
   */
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract authorization token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
      
      // Check if it's a Bearer token
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid authorization format' });
      }
      
      const token = parts[1];
      
      // Get user ID from session
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Store token in request for downstream use
      (req as any).authToken = token;
      (req as any).userId = userId;
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
  
  /**
   * Middleware to enforce appropriate authorization
   */
  authorize = (requiredScope: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // The authentication middleware should have set these properties
        const token = (req as any).authToken;
        const userId = (req as any).userId;
        
        if (!token || !userId) {
          return res.status(401).json({ error: 'Not authenticated' });
        }
        
        // In a real implementation, this would validate the token's scopes
        // against the required scope. For simplicity, we'll assume the token is valid.
        
        next();
      } catch (error) {
        console.error('Authorization error:', error);
        res.status(403).json({ error: 'Not authorized for this operation' });
      }
    };
  };
  
  /**
   * Rate limiting middleware
   */
  rateLimit = (maxRequests: number, windowMs: number) => {
    // Simple in-memory rate limiter
    const requestCounts: Record<string, { count: number, resetTime: number }> = {};
    
    return (req: Request, res: Response, next: NextFunction) => {
      const userId = (req as any).userId || req.ip;
      const now = Date.now();
      
      // Initialize or reset count if the window has expired
      if (!requestCounts[userId] || requestCounts[userId].resetTime < now) {
        requestCounts[userId] = { 
          count: 0,
          resetTime: now + windowMs
        };
      }
      
      // Increment count and check limit
      requestCounts[userId].count++;
      
      if (requestCounts[userId].count > maxRequests) {
        return res.status(429).json({ 
          error: 'Too many requests', 
          retryAfter: Math.ceil((requestCounts[userId].resetTime - now) / 1000)
        });
      }
      
      next();
    };
  };
  
  /**
   * Content validation middleware
   */
  validateContent = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // In a real implementation, this would use a schema validation library
        // like Joi, Ajv, or Zod to validate the request body
        
        const validationResult = { valid: true, errors: [] };
        
        if (!validationResult.valid) {
          return res.status(400).json({ 
            error: 'Invalid request body', 
            details: validationResult.errors 
          });
        }
        
        next();
      } catch (error) {
        console.error('Validation error:', error);
        res.status(400).json({ error: 'Invalid request format' });
      }
    };
  };
}

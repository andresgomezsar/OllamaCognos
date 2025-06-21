import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import { z } from 'zod';
import dotenv from 'dotenv';
import MemoryStore from 'memorystore';
import {
  initLocalUsers,
  createAdminUser as createLocalAdminUser,
  verifyUser,
  findUserById,
  registerUser as registerLocalUser,
  changeUserPassword,
  User
} from './localAuth.js';

dotenv.config();

// Create memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Validation schemas
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export const registrationSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  email: z.string().email().optional().nullable()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8)
});

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ 
    success: false, 
    message: 'Authentication required' 
  });
}

// Initialize authentication
export async function initializeAuth(app: express.Application) {
  // Initialize local user storage
  initLocalUsers();
  
  // Configure passport
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await verifyUser(username, password);
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser((id: number, done) => {
    const user = findUserById(id);
    if (!user) {
      return done(new Error('User not found'));
    }
    done(null, user);
  });
  
  // Set up session
  app.use(session({
    secret: process.env.SESSION_SECRET || 'development_secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
}

// Initialize admin user if no users exist
export async function initializeAdminUser() {
  await createLocalAdminUser();
}

// Register a new user
export async function registerUser(
  username: string, 
  password: string,
  email?: string
): Promise<User> {
  return registerLocalUser(username, password, email);
}

// Change user password
export async function changePassword(
  userId: number, 
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  return changeUserPassword(userId, currentPassword, newPassword);
}

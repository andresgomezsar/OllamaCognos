import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { loginSchema, registrationSchema, changePasswordSchema, isAuthenticated, registerUser, changePassword } from './auth';

const router = express.Router();

// Login route
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    passport.authenticate('local', (err: Error, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: info?.message || 'Authentication failed'
        });
      }
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Don't send password and other sensitive data to client
        const { password, ...safeUserData } = user;
        
        return res.json({
          success: true,
          user: safeUserData
        });
      });
    })(req, res, next);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});

// Logout route
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get current user info
router.get('/me', isAuthenticated, (req: Request, res: Response) => {
  // Remove sensitive data before sending
  const { password, ...safeUserData } = req.user as any;
  
  res.json({
    success: true,
    user: safeUserData
  });
});

// Change password route
router.post('/change-password', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const userId = (req.user as any).id;

    await changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword
    );
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Validation error', 
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

// Register a new user (optional, for multi-user setups)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if self-registration is enabled
    // This could be a setting in the database or environment variable
    const allowSelfRegistration = process.env.ALLOW_SELF_REGISTRATION === 'true';
    
    if (!allowSelfRegistration) {
      // If not authenticated, reject
      if (!req.isAuthenticated()) {
        return res.status(403).json({
          success: false,
          message: 'Self-registration is disabled'
        });
      }
      
      // Only admin users can create new users when self-registration is disabled
      const isAdmin = (req.user as any)?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can create new users'
        });
      }
    }
    
    const validatedData = registrationSchema.parse(req.body);
    
    const newUser = await registerUser(
      validatedData.username,
      validatedData.password,
      validatedData.email || undefined
    );
    
    // Don't send password back to client
    const { password, ...safeUserData } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: safeUserData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});

export const authRoutes = router;

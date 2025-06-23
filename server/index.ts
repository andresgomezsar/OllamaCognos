import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { initializeTunnels } from "./tunnel.js";
import { initializeAuth, initializeAdminUser } from "./auth.js";
import { authRoutes } from "./authRoutes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Authentication system will be initialized before all other middleware

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

(async () => {
  console.log('Server starting...');
  // Initialize authentication system
  console.log('Initializing auth system...');
  await initializeAuth(app);
  
  // Register authentication routes
  app.use('/api/auth', authRoutes);
  
  // Initialize admin user if none exists
  console.log('Initializing admin user if needed...');
  await initializeAdminUser();
  
  console.log('Registering routes...');
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // In production, don't expose error details for security
    const responseMessage = process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal Server Error'
      : message;
    
    res.status(status).json({ message: responseMessage });
    
    // Log the error but don't crash in production
    if (process.env.NODE_ENV === 'production') {
      console.error(err);
    } else {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log('Setting up Vite development middleware...');
    await setupVite(app, server);
  } else {
    console.log('Setting up static file serving...');
    serveStatic(app);
  }

  // Use port 3000 for local development
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  server.listen({
    port,
    host: "0.0.0.0", // Listen on all interfaces to allow tunnel access
  }, async () => {
    console.log(`Server is now running on http://localhost:${port}`);
    log(`serving on port ${port}`);
    
    // Initialize tunneling service
    console.log('Initializing tunnels...');
    await initializeTunnels(port);
    console.log('Server initialization complete');
  });
})().catch((error: unknown) => {
  console.error('Caught error in main IIFE:', error);
});

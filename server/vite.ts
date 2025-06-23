import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
// NOTE: Do NOT import the "vite" package at module scope because our file name is also "vite.ts"
// which can lead to Node resolution confusion and return this very module instead of the real Vite package.
// We will instead load Vite dynamically inside setupVite().
import { customAlphabet } from '../shared/utils/nanoid-compat.js';

// ESM compatibility: use process.cwd() as base path instead of __dirname
const serverDir = path.join(process.cwd(), 'server');
const projectRoot = process.cwd();
// Handle vite configuration using a dynamic import approach
// No direct import of .ts files to avoid TypeScript errors
let viteConfig = {};
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

// Create simple logging functions for our own use
const viteLogPrefix = (color: string, type: string) => (msg: string) => {
  console.log(`\x1b[${color}m[vite:${type}]\x1b[0m ${msg}`);
};

const viteLog = {
  info: viteLogPrefix('32', 'info'),
  warn: viteLogPrefix('33', 'warn'),
  error: viteLogPrefix('31', 'error')
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Define server options with correct types
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    // Set to true which matches the expected type: true | string[] | undefined
    allowedHosts: true as true,
  };

  // Load vite config dynamically
  try {
    const viteConfigModule = await import("../vite.config.js");
    viteConfig = viteConfigModule.default || viteConfigModule;
  } catch (e) {
    console.warn("Could not load vite config, using defaults", e);
  }

  // Create Vite dev server
    // Dynamically import the real Vite package to avoid self-import issues
  const { createServer } = await import('vite');
  console.log('Vite createServer typeof:', typeof createServer);
  if (typeof createServer !== 'function') {
    throw new Error('Vite package did not provide createServer – check installed version');
  }
  const devServer = await createServer({
    ...viteConfig,
    configFile: false,
    // Removed customLogger to use default Vite logger
    server: serverOptions,
    appType: "custom",
  });

  app.use(devServer.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes to ensure they're handled by their own handlers
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        projectRoot,
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await devServer.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      devServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(serverDir, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

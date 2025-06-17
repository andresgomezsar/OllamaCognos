// Vite config in universal format (works in both ESM and CommonJS)
import path from "path";
import react from "@vitejs/plugin-react";

// Use process.cwd() instead of __dirname for path resolution
// This isn't exactly the same but works in both ESM and CommonJS
const projectRoot = process.cwd();

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
      "@shared": path.resolve(projectRoot, "shared"),
      "@assets": path.resolve(projectRoot, "attached_assets"),
    },
  },
  root: path.resolve(projectRoot, "client"),
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
};

export default config;

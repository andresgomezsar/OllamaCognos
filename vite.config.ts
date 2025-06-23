// Vite config in universal format (works in both ESM and CommonJS)
import path from "path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from 'vite-tsconfig-paths';

// Use process.cwd() instead of __dirname for path resolution
// This isn't exactly the same but works in both ESM and CommonJS
const projectRoot = process.cwd();

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [react(), tsconfigPaths()],
  resolve: {},

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
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
  },
};

export default config;

import { zrokService } from './zrok.js';
import { log } from './vite.js';

const ENABLE_ZROK = process.env.ENABLE_ZROK === 'true';

export async function initializeTunnels(port: number): Promise<void> {
  if (ENABLE_ZROK) {
    log('Attempting to start zrok tunnel...');
    try {
      const tunnelUrl = await zrokService.startTunnel({ port });
      log(`zrok tunnel established at ${tunnelUrl}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`zrok tunnel failed to start: ${errorMessage}. Server will be available locally only.`);
    }
  } else {
    log('zrok is disabled. Server will be available locally only.');
  }
}

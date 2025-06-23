import { spawn, ChildProcess } from 'child_process';

interface ZrokOptions {
  port: number;
  zrok_path?: string;
}

export class ZrokService {
  private process: ChildProcess | null = null;
  private url: string | null = null;

  public async startTunnel(options: ZrokOptions): Promise<string> {
    const zrokPath = options.zrok_path || 'zrok'; // Use 'zrok' from PATH if not specified

    return new Promise((resolve, reject) => {
      console.log('Starting zrok share...');
      this.process = spawn(zrokPath, ['share', 'public', '--backend-mode', 'proxy', `http://localhost:${options.port}`], {
        stdio: ['ignore', 'pipe', 'pipe'], // stdin, stdout, stderr
      });

      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('zrok output:', output);
        const match = output.match(/https:\/\/[a-zA-Z0-9]+\.share\.zrok\.io/);
        if (match) {
          this.url = match[0];
          console.log(`Found zrok URL: ${this.url}`);
          if (this.url) {
            resolve(this.url);
          }
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`zrok stderr: ${data}`);
      });

      this.process.on('error', (err) => {
        console.error('Failed to start zrok process.', err);
        reject(err);
      });

      this.process.on('close', (code) => {
        console.log(`zrok process exited with code ${code}`);
        this.process = null;
        this.url = null;
        // Potentially reject the promise if it hasn't resolved yet and the process closes unexpectedly
        if (code !== 0) {
            reject(new Error(`zrok process exited with code ${code}`));
        }
      });
    });
  }

  public async stopTunnel(): Promise<void> {
    if (this.process) {
      console.log('Stopping zrok process...');
      this.process.kill('SIGINT');
      this.process = null;
      this.url = null;
    }
  }

  public getTunnelUrl(): string | null {
    return this.url;
  }

  public isActive(): boolean {
    return !!this.process && !!this.url;
  }
}

export const zrokService = new ZrokService();

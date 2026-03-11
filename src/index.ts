#!/usr/bin/env node

import * as http from 'http';
import { startServer } from './server';
import open from 'open';
import getPort from 'get-port';

async function main() {
  console.log('🦞 ClawDoctor - 100% Free OpenClaw Diagnostics\n');
  
  try {
    // Use PORT from env (for cloud deployments) or find available port
    const port = process.env.PORT ? parseInt(process.env.PORT) : await getPort({ port: [8888, 8889, 8890, 8891, 8892] });
    const server = await startServer(port);
    
    const url = `http://localhost:${port}`;
    console.log(`✓ Server running at ${url}`);
    
    // Only open browser in local mode
    if (!process.env.PORT) {
      console.log('✓ Opening browser...\n');
      await open(url);
    }
    
    console.log('Press Ctrl+C to stop the server.');
  } catch (error) {
    console.error('Failed to start ClawDoctor:', error);
    process.exit(1);
  }
}

main();

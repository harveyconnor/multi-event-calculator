#!/usr/bin/env node
import { createServer } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

const server = await createServer({
  root: resolve(process.cwd(), 'client'),
  server: {
    host: '0.0.0.0',
    port: 5000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'client', 'src'),
    },
  },
});

await server.listen();
console.log(`Vite server running on http://localhost:5000`);
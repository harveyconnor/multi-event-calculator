import { createServer } from 'vite';

const server = await createServer({
  server: {
    port: 5000,
    host: '0.0.0.0'
  },
  root: './client'
});

await server.listen();
console.log('Vite server running on port 5000');
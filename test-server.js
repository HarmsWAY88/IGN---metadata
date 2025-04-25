import { createServer } from 'http';

const port = 3001;

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is running!\n');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Test server running on port ${port}`);
});

server.on('error', (error) => {
  console.error('Test server failed to start:', error.message);
  process.exit(1);
});

server.on('listening', () => {
  console.log(`Test server is confirmed to be listening on port ${port}`);
});

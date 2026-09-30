import { createServer } from 'node:http';
import { handle } from './src/app.mjs';
const port = Number(process.env.PORT || 4317);
createServer(handle).listen(port, '127.0.0.1', () => console.log(`Agent Audition: http://localhost:${port}`));

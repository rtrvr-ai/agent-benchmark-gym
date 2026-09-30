import { initDb,closeDb } from '../src/store.mjs';
await initDb();
await closeDb();
console.log('audition_runs table ready');

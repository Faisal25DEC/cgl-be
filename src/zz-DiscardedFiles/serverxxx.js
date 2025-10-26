
// ---- 1) Load .env from the backend root, *before anything else* ----
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env is at: backend/.env  (server.js is at: backend/src/server.js)
loadEnv({ path: path.resolve(__dirname, '../.env') });

// Quick sanity print
console.log('[CGL] cwd=', process.cwd(),
            '| server.js=', __filename,
            '| .env loaded=', !!process.env.MONGO_URI);

// ---- 2) Now import the rest ----
import http from 'http';
import app from './app.js';

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[CGL] Server listening on http://localhost:${PORT}`);
});

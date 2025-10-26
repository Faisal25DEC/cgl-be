// src/config/db.js
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root: backend/.env  (db.js is at backend/src/config/db.js)
loadEnv({ path: path.resolve(__dirname, '../../.env') });

// Accept common variable names just in case
const URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

console.log(URI)

export async function connectDB() {
  if (!URI) {
    console.error('[CGL] MONGO_URI missing in .env (checked MONGO_URI, MONGODB_URI, DATABASE_URL)');
    process.exit(1);
  }

  // Prevent duplicate connects: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const state = mongoose.connection.readyState;
  if (state === 1 || state === 2) return;

  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[CGL] Mongo connected:', mongoose.connection.name || mongoose.connection.db?.databaseName);
  } catch (err) {
    console.error('[CGL] Mongo connect error:', err?.message || err);
    process.exit(1);
  }
}

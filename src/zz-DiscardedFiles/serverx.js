// server.js — resilient, auto-loading Express server (Node v24 ESM)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';

// Optional Mongo: only attempts connect if MONGO_URI is present
let mongoose = null;
try {
  // defer require to keep it optional
  // eslint-disable-next-line no-new-func
  mongoose = (await import('mongoose')).default;
} catch (_) {
  // mongoose not installed — that's fine
}

dotenv.config(); // loads .env if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- Core middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());                // allow frontends
app.use(morgan('dev'));         // request logs
app.use(compression());         // smaller responses

// ---------- Health endpoints ----------
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send('Backend is up. Try GET /health');
});

// ---------- Optional: Mongo connection ----------
if (process.env.MONGO_URI && mongoose) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || undefined,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
  }
} else if (process.env.MONGO_URI && !mongoose) {
  console.warn('⚠️  MONGO_URI set but mongoose not installed. Run: npm i mongoose');
}

// ---------- Auto-load routes from ./routes ----------
const routesDir = path.join(__dirname, 'routes');

function mountRouter(maybeRouter, mountPath) {
  // Only mount if it looks like an Express router/function
  const isFn = typeof maybeRouter === 'function';
  if (!isFn) {
    console.warn(`⚠️  Skipped mount at ${mountPath} — not a function/router`);
    return false;
  }
  app.use(mountPath, maybeRouter);
  console.log(`✅ Mounted ${mountPath}`);
  return true;
}

if (fs.existsSync(routesDir)) {
  const files = fs.readdirSync(routesDir)
    .filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs'));

  if (files.length === 0) {
    console.warn('ℹ️  ./routes folder is present but empty.');
  }

  for (const file of files) {
    const full = path.join(routesDir, file);
    const url = new URL(`file://${full.replace(/\\/g, '/')}`);
    let mod;
    try {
      mod = await import(url.href);
    } catch (err) {
      console.warn(`⚠️  Could not import ${file}: ${err.message}`);
      continue;
    }

    // Accept: default export, named "router", or CJS default
    const candidate =
      mod?.default ??
      mod?.router ??
      null;

    // mount path: /api/<basename>
    const baseName = path.basename(file).replace(/\.(mjs|cjs|js)$/i, '');
    const mountPath = `/api/${baseName}`;

    if (!mountRouter(candidate, mountPath)) {
      // Try to find any exported function that looks like a router
      const maybe = Object.values(mod).find(v => typeof v === 'function');
      if (maybe) {
        mountRouter(maybe, mountPath);
      }
    }
  }
} else {
  console.warn('ℹ️  No ./routes directory found. Create one and add route files like users.js, books.js, etc.');
}

// ---------- 404 handler ----------
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ---------- Error handler (last) ----------
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error('💥 Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});
/* eslint-enable no-unused-vars */

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

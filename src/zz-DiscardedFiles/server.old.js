import cors from 'cors';
/*
  CGL Backend - server.js (Refurbished, ESM)
  - dotenv loads first
  - Clear boot sequence with health endpoint
  - Routes mounted after middleware
  - 404 and error handlers last
  - Process guards + graceful shutdown
*/
import dotenv from "dotenv";
dotenv.config();

import express from "express";
// Import routes (ensure these paths exist)
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import tagsRoutes from "./routes/tagsRoutes.js";

import connectDB from "./config/db.js";

const app = express();
app.use(express.json());

// ---------- Middleware ----------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ---------- Health & Root ----------
app.get("/healthz", (_req, res) => res.status(200).send("OK"));

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    service: "CGL Backend",
    health: "/healthz",
    docs: "/api/*",
  });
});

// ---------- Feature Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/tags", tagsRoutes);

// ---------- 404 & Error Handling ----------
app.use((req, res, _next) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[ERR]", err);
  res.status(err.status || 500).json({ error: err.message || "Server Error" });
});

// ---------- Boot ----------
const PORT = process.env.PORT || 4005;
let server;

async function start() {
  console.log("[BOOT] Loading DB...");
  await connectDB(process.env.MONGO_URI);
  server = app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`[BOOT] Server listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error("[BOOT] Fatal:", e);
  process.exit(1);
});

// ---------- Process Guards ----------
process.on("unhandledRejection", (reason) => {
  console.error("[PROC] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[PROC] Uncaught Exception:", err);
  process.exit(1);
});

function gracefulShutdown(signal) {
  console.log(`[PROC] ${signal} received: closing server...`);
  if (server) {
    server.close(() => {
      console.log("[PROC] HTTP server closed.");
      process.exit(0);
    });
    // Force exit if not closed in time
    setTimeout(() => {
      console.warn("[PROC] Force exit after timeout.");
      process.exit(1);
    }, 5000).unref();
  } else {
    process.exit(0);
  }
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));



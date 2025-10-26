// src/server.js
import http from "http";
import { connectDB } from "./config/db.js";
import bookRoutes from "./routes/book.routes.js";
import cors from "cors";
import express from "express";

const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 4000;

app.use((req, res, _next) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    service: "CGL Backend",
    health: "/healthz",
    docs: "/api/*",
  });
});

// ---------- Feature Routes ----------
app.use("/api/books", bookRoutes);

async function start() {
  console.log("\n================= CGL BACKEND =================");
  await connectDB(); // ensure DB ready before starting HTTP
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`[CGL] Server listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error("[CGL] Fatal startup error:", e);
  process.exit(1);
});

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

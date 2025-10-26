// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import bookRoutes from "./routes/book.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

// If you need credentials/cookies, set a specific origin and credentials: true
app.use(
  cors({
    origin: ["http://localhost:5173", "https://cgl-fe.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// (Optional but nice) fast-path OPTIONS for any route
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/user", authRoutes);

// Connect DB once on cold start (serverless safe)
let dbReady;
async function ensureDB() {
  if (!dbReady) dbReady = connectDB();
  await dbReady;
}
app.use(async (_req, _res, next) => {
  try {
    await ensureDB();
    next();
  } catch (e) {
    next(e);
  }
});

// ❗ Do NOT call app.listen() on Vercel.
// Export the app so @vercel/node can invoke it per request.
export default app;

// (Optional) local dev entrypoint
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`[CGL] Server listening on http://localhost:${PORT}`));
}

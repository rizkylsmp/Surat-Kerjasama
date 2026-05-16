import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import morgan from "morgan";
import { ZodError } from "zod";
import { agreementsRouter } from "./agreements.js";
import { authRouter } from "./auth.js";
import { changeRequestsRouter } from "./changeRequests.js";
import { config } from "./config.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = path.resolve(__dirname, "../uploads");

app.use(cors({ origin: config.clientOrigins, credentials: true }));
app.use(express.json({ limit: "12mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "surat-kerjasama-api" });
});

app.use("/api/agreements", agreementsRouter);
app.use("/api/auth", authRouter);
app.use("/api/change-requests", changeRequestsRouter);

app.use((error, _req, res, _next) => {
  console.error(error?.stack || error?.message || String(error));
  if (error instanceof ZodError) {
    res.status(422).json({
      message: "Data belum lengkap atau format tidak valid",
      issues: error.issues
    });
    return;
  }

  if (
    error.code === "ECONNREFUSED" ||
    error.code === "ER_BAD_DB_ERROR" ||
    error.code === "ER_BAD_FIELD_ERROR" ||
    error.code === "ER_NO_SUCH_TABLE"
  ) {
    res.status(503).json({
      message: "Database MySQL belum siap atau schema belum dimigrasi. Periksa .env dan jalankan npm run db:migrate."
    });
    return;
  }

  res.status(500).json({ message: "Terjadi kesalahan server" });
});

app.listen(config.port, () => {
  console.log(`API berjalan di http://localhost:${config.port}`);
});

import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ZodError } from "zod";
import { agreementsRouter } from "./agreements.js";
import { authRouter } from "./auth.js";
import { changeRequestsRouter } from "./changeRequests.js";
import { config } from "./config.js";

const app = express();

app.set("trust proxy", 1);
app.use(cors({ origin: config.clientOrigins, credentials: true }));
app.use(express.json({ limit: "12mb" }));
app.use(morgan("dev"));

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

  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 600) {
    res.status(error.status).json({ message: error.message || "Permintaan gagal diproses" });
    return;
  }

  res.status(500).json({ message: "Terjadi kesalahan server" });
});

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`API berjalan di http://localhost:${config.port}`);
  });
}

export default app;

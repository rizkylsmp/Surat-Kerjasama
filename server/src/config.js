import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "surat_kerjasama"
  },
  esign: {
    provider: process.env.ESIGN_PROVIDER || "mock",
    baseUrl: process.env.ESIGN_BASE_URL || "",
    apiKey: process.env.ESIGN_API_KEY || "",
    webhookSecret: process.env.ESIGN_WEBHOOK_SECRET || "",
    appPublicUrl: process.env.APP_PUBLIC_URL || "http://localhost:5173"
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
    adminUsername: process.env.ADMIN_USERNAME || "",
    adminPassword: process.env.ADMIN_PASSWORD || ""
  }
};

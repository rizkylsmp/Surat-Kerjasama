import express from "express";
import { z } from "zod";
import { config } from "./config.js";
import { pool } from "./db.js";
import { createSessionToken, hashToken, verifyPassword } from "./passwords.js";

export const authRouter = express.Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function sessionCookie(token, maxAgeSeconds) {
  const attributes = [
    `admin_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    `SameSite=${config.auth.cookieSameSite}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`
  ];

  if (config.auth.cookieSecure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export async function requireAdmin(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.admin_session;
    if (!token) {
      res.status(401).json({ message: "Login admin diperlukan" });
      return;
    }

    const [rows] = await pool.query(
      `SELECT s.id AS sessionId, u.id, u.username
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.token_hash = ? AND s.expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)]
    );

    if (!rows.length) {
      res.status(401).json({ message: "Sesi admin tidak valid atau sudah kedaluwarsa" });
      return;
    }

    req.admin = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

authRouter.post("/login", async (req, res, next) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const [rows] = await pool.query("SELECT id, username, password_hash AS passwordHash FROM admin_users WHERE username = ?", [
      credentials.username
    ]);

    if (!rows.length || !verifyPassword(credentials.password, rows[0].passwordHash)) {
      res.status(401).json({ message: "Username atau password salah" });
      return;
    }

    const token = createSessionToken();
    const maxAgeSeconds = 60 * 60 * 8;
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
    await pool.query(
      "INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [rows[0].id, hashToken(token), expiresAt]
    );

    res.setHeader("Set-Cookie", sessionCookie(token, maxAgeSeconds));
    res.json({ admin: { id: rows[0].id, username: rows[0].username } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", requireAdmin, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM admin_sessions WHERE id = ?", [req.admin.sessionId]);
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAdmin, (req, res) => {
  res.json({ admin: { id: req.admin.id, username: req.admin.username } });
});

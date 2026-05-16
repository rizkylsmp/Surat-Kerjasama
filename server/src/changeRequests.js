import express from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { requireAdmin } from "./auth.js";

export const changeRequestsRouter = express.Router();

const createSchema = z.object({
  workerName: z.string().min(1),
  workerKtp: z.string().min(1),
  workerPhone: z.string().min(1),
  requestedChanges: z.string().min(1),
  reason: z.string().optional().nullable()
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().optional().nullable()
});

const columns = `
  id,
  worker_name AS workerName,
  worker_ktp AS workerKtp,
  worker_phone AS workerPhone,
  requested_changes AS requestedChanges,
  reason,
  status,
  admin_note AS adminNote,
  reviewed_by AS reviewedBy,
  reviewed_at AS reviewedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

changeRequestsRouter.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const [result] = await pool.query(
      `INSERT INTO change_requests
        (worker_name, worker_ktp, worker_phone, requested_changes, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [data.workerName, data.workerKtp, data.workerPhone, data.requestedChanges, data.reason || null]
    );
    const [rows] = await pool.query(`SELECT ${columns} FROM change_requests WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

changeRequestsRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT ${columns} FROM change_requests ORDER BY created_at DESC LIMIT 200`);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

changeRequestsRouter.patch("/:id/review", requireAdmin, async (req, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);
    const [result] = await pool.query(
      `UPDATE change_requests SET
        status = ?,
        admin_note = ?,
        reviewed_by = ?,
        reviewed_at = NOW()
       WHERE id = ?`,
      [data.status, data.adminNote || null, req.admin.id, req.params.id]
    );

    if (!result.affectedRows) {
      res.status(404).json({ message: "Pengajuan perubahan tidak ditemukan" });
      return;
    }

    const [rows] = await pool.query(`SELECT ${columns} FROM change_requests WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

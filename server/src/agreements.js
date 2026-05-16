import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import { getEsignProvider } from "./esignProvider.js";
import { agreementSchema, imageUploadSchema } from "./validators.js";
import { requireAdmin } from "./auth.js";

export const agreementsRouter = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../uploads");

const columns = `
  id,
  agreement_day AS agreementDay,
  agreement_date AS agreementDate,
  agreement_place AS agreementPlace,
  company_name AS companyName,
  company_address AS companyAddress,
  company_representative AS companyRepresentative,
  company_position AS companyPosition,
  worker_name AS workerName,
  worker_birth_place AS workerBirthPlace,
  worker_birth_date AS workerBirthDate,
  worker_address AS workerAddress,
  worker_ktp AS workerKtp,
  worker_phone AS workerPhone,
  job_section AS jobSection,
  daily_wage AS dailyWage,
  wage_payment_policy AS wagePaymentPolicy,
  signature_city AS signatureCity,
  signature_date AS signatureDate,
  e_signature_provider AS eSignatureProvider,
  e_signature_status AS eSignatureStatus,
  e_signature_request_id AS eSignatureRequestId,
  e_signature_document_id AS eSignatureDocumentId,
  e_signature_signed_url AS eSignatureSignedUrl,
  e_signature_certificate_serial AS eSignatureCertificateSerial,
  e_signature_verified_at AS eSignatureVerifiedAt,
  signature_image_url AS signatureImageUrl,
  face_verification_status AS faceVerificationStatus,
  face_verification_request_id AS faceVerificationRequestId,
  face_liveness_score AS faceLivenessScore,
  face_image_url AS faceImageUrl,
  face_verified_at AS faceVerifiedAt,
  audit_trail_json AS auditTrail,
  notes,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const weekdayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

function getAgreementDay(dateString) {
  return weekdayFormatter.format(new Date(`${dateString}T00:00:00`));
}

function normalizeAgreement(data) {
  return {
    ...data,
    agreementDay: getAgreementDay(data.agreementDate),
    agreementPlace: "PASURUAN",
    companyName: "CV. KRAINING MULTI ABADI",
    companyAddress: "JL.KH. MANSYUR RT.05/RW.01, TembokRejo - Pasuruan",
    companyRepresentative: "Moch. Syaiful Rizal",
    companyPosition: "Direktur (pemilik badan/CV)",
    signatureCity: "Pasuruan"
  };
}

async function saveDataImage(imageData, folder, filePrefix) {
  const match = imageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!match) {
    const error = new Error("Format gambar tidak valid");
    error.status = 422;
    throw error;
  }

  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const directory = path.join(uploadsRoot, folder);
  await fs.mkdir(directory, { recursive: true });
  const filename = `${filePrefix}-${Date.now()}.${extension}`;
  await fs.writeFile(path.join(directory, filename), Buffer.from(match[2], "base64"));
  return `/uploads/${folder}/${filename}`;
}

const toDbValues = (rawData) => {
  const data = normalizeAgreement(rawData);
  return [
    data.agreementDay,
  data.agreementDate,
  data.agreementPlace,
  data.companyName,
  data.companyAddress,
  data.companyRepresentative,
  data.companyPosition,
  data.workerName,
  data.workerBirthPlace,
  data.workerBirthDate,
  data.workerAddress,
  data.workerKtp,
  data.workerPhone,
  data.jobSection,
  data.dailyWage,
  data.wagePaymentPolicy,
  data.signatureCity,
  data.signatureDate,
    data.notes || null
  ];
};

async function getAgreement(id) {
  const [rows] = await pool.query(`SELECT ${columns} FROM agreements WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function insertEvent(agreementId, provider, eventType, providerReference, payload) {
  await pool.query(
    `INSERT INTO e_signature_events
      (agreement_id, provider, event_type, provider_reference, payload_json)
     VALUES (?, ?, ?, ?, ?)`,
    [agreementId, provider, eventType, providerReference || null, JSON.stringify(payload || {})]
  );
}

agreementsRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const where = search
      ? "WHERE worker_name LIKE ? OR worker_ktp LIKE ? OR job_section LIKE ?"
      : "";

    const [rows] = await pool.query(
      `SELECT ${columns} FROM agreements ${where} ORDER BY updated_at DESC LIMIT 100`,
      params
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

agreementsRouter.get("/admin/stats/summary", requireAdmin, async (_req, res, next) => {
  try {
    const [[agreementStats]] = await pool.query(
      `SELECT
        COUNT(*) AS totalAgreements,
        SUM(e_signature_status = 'signed') AS signedAgreements,
        SUM(face_verification_status = 'captured') AS capturedFaces
       FROM agreements`
    );
    const [[changeStats]] = await pool.query(
      `SELECT
        COUNT(*) AS totalChangeRequests,
        SUM(status = 'pending') AS pendingChangeRequests
       FROM change_requests`
    );
    res.json({ ...agreementStats, ...changeStats });
  } catch (error) {
    next(error);
  }
});

agreementsRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }
    res.json(agreement);
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/", async (req, res, next) => {
  try {
    const data = agreementSchema.parse(req.body);
    const [result] = await pool.query(
      `INSERT INTO agreements (
        agreement_day, agreement_date, agreement_place, company_name, company_address,
        company_representative, company_position, worker_name, worker_birth_place,
        worker_birth_date, worker_address, worker_ktp, worker_phone, job_section,
        daily_wage, wage_payment_policy, signature_city, signature_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      toDbValues(data)
    );

    const [rows] = await pool.query(`SELECT ${columns} FROM agreements WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

agreementsRouter.put("/:id", async (req, res, next) => {
  try {
    const data = agreementSchema.parse(req.body);
    const [result] = await pool.query(
      `UPDATE agreements SET
        agreement_day = ?, agreement_date = ?, agreement_place = ?, company_name = ?,
        company_address = ?, company_representative = ?, company_position = ?,
        worker_name = ?, worker_birth_place = ?, worker_birth_date = ?, worker_address = ?,
        worker_ktp = ?, worker_phone = ?, job_section = ?, daily_wage = ?,
        wage_payment_policy = ?, signature_city = ?, signature_date = ?, notes = ?
      WHERE id = ?`,
      [...toDbValues(data), req.params.id]
    );

    if (!result.affectedRows) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }

    const [rows] = await pool.query(`SELECT ${columns} FROM agreements WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/:id/digital-signature", async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }

    const payload = imageUploadSchema.parse(req.body);
    const imageUrl = await saveDataImage(payload.imageData, "signatures", `agreement-${req.params.id}-signature`);

    await pool.query(
      `UPDATE agreements SET
        e_signature_provider = 'image',
        e_signature_status = 'signed',
        signature_image_url = ?,
        e_signature_verified_at = NOW()
      WHERE id = ?`,
      [imageUrl, req.params.id]
    );
    await insertEvent(req.params.id, "image", "signature_image_saved", null, { imageUrl });

    res.json({ agreement: await getAgreement(req.params.id), imageUrl });
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/:id/face-capture", async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }

    const payload = imageUploadSchema.parse(req.body);
    if (!payload.consent) {
      res.status(422).json({ message: "Persetujuan penyimpanan data wajah wajib dicentang." });
      return;
    }

    const imageUrl = await saveDataImage(payload.imageData, "faces", `agreement-${req.params.id}-face`);
    const reference = `face_capture_${req.params.id}_${Date.now()}`;

    await pool.query(
      `UPDATE agreements SET
        face_verification_status = 'captured',
        face_verification_request_id = ?,
        face_liveness_score = NULL,
        face_image_url = ?,
        face_verified_at = NOW()
      WHERE id = ?`,
      [reference, imageUrl, req.params.id]
    );
    await insertEvent(req.params.id, "local-camera", "face_captured", reference, {
      imageUrl,
      captureNote: payload.captureNote || null
    });

    res.json({ agreement: await getAgreement(req.params.id), imageUrl });
  } catch (error) {
    next(error);
  }
});

agreementsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM agreements WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/:id/official-signature/prepare", async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }
    const provider = getEsignProvider();
    const session = await provider.prepare({ agreement });

    await pool.query(
      `UPDATE agreements SET
        e_signature_provider = ?,
        e_signature_status = 'prepared',
        e_signature_request_id = ?,
        e_signature_document_id = ?,
        face_verification_status = CASE
          WHEN face_verification_status = 'verified' THEN face_verification_status
          ELSE 'pending'
        END
      WHERE id = ?`,
      [session.provider || provider.name, session.requestId, session.documentId || null, req.params.id]
    );
    await insertEvent(req.params.id, session.provider || provider.name, "prepared", session.requestId, session);

    res.json({ agreement: await getAgreement(req.params.id), session });
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/:id/official-signature/verify-face", async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }
    const provider = getEsignProvider();
    const verification = await provider.verifyFace({
      agreement,
      faceCapture: {
        captureRef: req.body?.captureRef,
        consent: Boolean(req.body?.consent)
      }
    });

    await pool.query(
      `UPDATE agreements SET
        face_verification_status = ?,
        face_verification_request_id = ?,
        face_liveness_score = ?,
        face_verified_at = CASE WHEN ? = 'verified' THEN NOW() ELSE face_verified_at END
      WHERE id = ?`,
      [
        verification.status === "verified" ? "verified" : "review_required",
        verification.verificationId || null,
        verification.score || null,
        verification.status === "verified" ? "verified" : "review_required",
        req.params.id
      ]
    );
    await insertEvent(req.params.id, verification.provider || provider.name, "face_verified", verification.verificationId, verification);

    res.json({ agreement: await getAgreement(req.params.id), verification });
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/:id/official-signature/send", async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }
    if (agreement.faceVerificationStatus !== "verified") {
      res.status(409).json({ message: "Verifikasi wajah harus selesai sebelum dokumen dikirim untuk tanda tangan." });
      return;
    }

    const provider = getEsignProvider();
    const signature = await provider.sendForSignature({ agreement });

    await pool.query(
      `UPDATE agreements SET
        e_signature_status = ?,
        e_signature_request_id = COALESCE(?, e_signature_request_id)
      WHERE id = ?`,
      [signature.status || "waiting_signature", signature.requestId || null, req.params.id]
    );
    await insertEvent(req.params.id, signature.provider || provider.name, "sent_for_signature", signature.requestId, signature);

    res.json({ agreement: await getAgreement(req.params.id), signature });
  } catch (error) {
    next(error);
  }
});

agreementsRouter.post("/:id/official-signature/complete", async (req, res, next) => {
  try {
    const agreement = await getAgreement(req.params.id);
    if (!agreement) {
      res.status(404).json({ message: "Perjanjian tidak ditemukan" });
      return;
    }
    if (agreement.faceVerificationStatus !== "verified" || agreement.eSignatureStatus !== "waiting_signature") {
      res.status(409).json({
        message: "Dokumen hanya dapat diselesaikan setelah verifikasi wajah dan status menunggu tanda tangan."
      });
      return;
    }

    const provider = getEsignProvider();
    const signature = await provider.complete({ agreement, payload: req.body || {} });

    await pool.query(
      `UPDATE agreements SET
        e_signature_status = 'signed',
        e_signature_request_id = COALESCE(?, e_signature_request_id),
        e_signature_signed_url = ?,
        e_signature_certificate_serial = ?,
        e_signature_verified_at = NOW()
      WHERE id = ?`,
      [
        signature.requestId || null,
        signature.signedUrl || null,
        signature.certificateSerial || null,
        req.params.id
      ]
    );
    await insertEvent(req.params.id, signature.provider || provider.name, "signed", signature.requestId, signature);

    res.json({ agreement: await getAgreement(req.params.id), signature });
  } catch (error) {
    next(error);
  }
});

import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Gunakan format tanggal YYYY-MM-DD");

export const agreementSchema = z.object({
  agreementDate: dateString,
  agreementDay: z.string().optional(),
  agreementPlace: z.string().min(1).default("PASURUAN"),
  companyName: z.string().min(1).default("CV. KRAINING MULTI ABADI"),
  companyAddress: z.string().min(1).default("JL.KH. MANSYUR RT.05/RW.01, TembokRejo - Pasuruan"),
  companyRepresentative: z.string().min(1).default("Moch. Syaiful Rizal"),
  companyPosition: z.string().min(1).default("Direktur (pemilik badan/CV)"),
  workerName: z.string().min(1),
  workerBirthPlace: z.string().min(1),
  workerBirthDate: dateString,
  workerAddress: z.string().min(1),
  workerKtp: z.string().min(1),
  workerPhone: z.string().min(1),
  jobSection: z.string().min(1),
  dailyWage: z.coerce.number().nonnegative(),
  wagePaymentPolicy: z.string().min(1),
  signatureCity: z.string().min(1).default("Pasuruan"),
  signatureDate: dateString,
  notes: z.string().optional().nullable()
});

export const imageUploadSchema = z.object({
  imageData: z.string().startsWith("data:image/"),
  consent: z.boolean().optional(),
  captureNote: z.string().optional()
});

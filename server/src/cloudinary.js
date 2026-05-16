import crypto from "node:crypto";
import FormData from "form-data";
import { config } from "./config.js";

function assertCloudinaryConfig() {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    const error = new Error("Konfigurasi Cloudinary belum lengkap. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.");
    error.status = 503;
    throw error;
  }
}

function parseDataImage(imageData) {
  const match = imageData.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) {
    const error = new Error("Format gambar tidak valid");
    error.status = 422;
    throw error;
  }
  return {
    mimeType: match[1] === "image/jpg" ? "image/jpeg" : match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function signUpload(params) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${config.cloudinary.apiSecret}`).digest("hex");
}

export async function uploadDataImageToCloudinary(imageData, folder, publicId) {
  assertCloudinaryConfig();
  const { buffer, mimeType } = parseDataImage(imageData);
  const timestamp = Math.floor(Date.now() / 1000);
  const targetFolder = `${config.cloudinary.uploadFolder}/${folder}`;
  const params = {
    folder: targetFolder,
    public_id: publicId,
    timestamp
  };
  const signature = signUpload(params);

  const form = new FormData();
  form.append("file", buffer, { filename: `${publicId}.${mimeType.split("/")[1]}`, contentType: mimeType });
  form.append("api_key", config.cloudinary.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", targetFolder);
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`, {
    method: "POST",
    body: form,
    headers: form.getHeaders()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || "Upload Cloudinary gagal");
    error.status = response.status;
    throw error;
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    bytes: payload.bytes,
    format: payload.format,
    width: payload.width,
    height: payload.height
  };
}

export async function destroyCloudinaryImage(publicId) {
  assertCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    public_id: publicId,
    timestamp
  };
  const signature = signUpload(params);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", config.cloudinary.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/destroy`, {
    method: "POST",
    body: form,
    headers: form.getHeaders()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || "Hapus asset Cloudinary gagal");
    error.status = response.status;
    throw error;
  }
  return {
    publicId,
    result: payload.result || "unknown"
  };
}

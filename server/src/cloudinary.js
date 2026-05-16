import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.js";

function assertCloudinaryConfig() {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    const error = new Error(
      "Konfigurasi Cloudinary belum lengkap. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET."
    );
    error.status = 503;
    throw error;
  }
}

function configureCloudinary() {
  assertCloudinaryConfig();
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

function validateDataImage(imageData) {
  const match = imageData.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/);
  if (!match) {
    const error = new Error("Format gambar tidak valid");
    error.status = 422;
    throw error;
  }
}

function normalizeCloudinaryError(error, fallbackMessage) {
  const normalized = new Error(error?.message || fallbackMessage);
  normalized.status = error?.http_code || error?.status || 502;
  return normalized;
}

export async function uploadDataImageToCloudinary(imageData, folder, publicId) {
  configureCloudinary();
  validateDataImage(imageData);

  try {
    const result = await cloudinary.uploader.upload(imageData, {
      folder: `${config.cloudinary.uploadFolder}/${folder}`,
      public_id: publicId,
      resource_type: "image",
      overwrite: true
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw normalizeCloudinaryError(error, "Upload Cloudinary gagal");
  }
}

export async function destroyCloudinaryImage(publicId) {
  configureCloudinary();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });

    return {
      publicId,
      result: result.result || "unknown"
    };
  } catch (error) {
    throw normalizeCloudinaryError(error, "Hapus asset Cloudinary gagal");
  }
}

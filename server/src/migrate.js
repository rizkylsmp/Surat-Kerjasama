import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { config } from "./config.js";
import { hashPassword } from "./passwords.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "schema.sql");

const connection = await mysql.createConnection({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  multipleStatements: true
});

await connection.query(
  `CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await connection.query(`USE \`${config.mysql.database}\``);
await connection.query(await fs.readFile(schemaPath, "utf8"));

const requiredAgreementColumns = [
  ["e_signature_provider", "VARCHAR(40) NOT NULL DEFAULT 'mock'"],
  ["e_signature_status", "VARCHAR(40) NOT NULL DEFAULT 'not_started'"],
  ["e_signature_request_id", "VARCHAR(120) NULL"],
  ["e_signature_document_id", "VARCHAR(120) NULL"],
  ["e_signature_signed_url", "TEXT NULL"],
  ["e_signature_certificate_serial", "VARCHAR(160) NULL"],
  ["e_signature_verified_at", "DATETIME NULL"],
  ["signature_image_url", "TEXT NULL"],
  ["signature_cloudinary_public_id", "VARCHAR(255) NULL"],
  ["face_verification_status", "VARCHAR(40) NOT NULL DEFAULT 'not_started'"],
  ["face_verification_request_id", "VARCHAR(120) NULL"],
  ["face_liveness_score", "DECIMAL(5,2) NULL"],
  ["face_image_url", "TEXT NULL"],
  ["face_cloudinary_public_id", "VARCHAR(255) NULL"],
  ["face_verified_at", "DATETIME NULL"],
  ["audit_trail_json", "JSON NULL"]
];

for (const [columnName, definition] of requiredAgreementColumns) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agreements' AND COLUMN_NAME = ?`,
    [config.mysql.database, columnName]
  );

  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE agreements ADD COLUMN ${columnName} ${definition}`);
  }
}

const [[adminCount]] = await connection.query("SELECT COUNT(*) AS count FROM admin_users");
if (adminCount.count === 0) {
  if (
    config.auth.adminUsername &&
    config.auth.adminPassword &&
    config.auth.adminPassword !== "change-this-before-running-migrate"
  ) {
    await connection.query("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)", [
      config.auth.adminUsername,
      hashPassword(config.auth.adminPassword)
    ]);
    console.log(`Admin user '${config.auth.adminUsername}' berhasil dibuat.`);
  } else {
    console.warn(
      "Admin user belum dibuat. Isi ADMIN_USERNAME dan ADMIN_PASSWORD di server/.env, lalu jalankan npm run db:migrate lagi."
    );
  }
}

await connection.end();

console.log(`Database '${config.mysql.database}' siap digunakan.`);

CREATE TABLE IF NOT EXISTS agreements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agreement_day VARCHAR(30) NOT NULL,
  agreement_date DATE NOT NULL,
  agreement_place VARCHAR(100) NOT NULL DEFAULT 'PASURUAN',
  company_name VARCHAR(160) NOT NULL,
  company_address TEXT NOT NULL,
  company_representative VARCHAR(120) NOT NULL,
  company_position VARCHAR(120) NOT NULL,
  worker_name VARCHAR(120) NOT NULL,
  worker_birth_place VARCHAR(120) NOT NULL,
  worker_birth_date DATE NOT NULL,
  worker_address TEXT NOT NULL,
  worker_ktp VARCHAR(32) NOT NULL,
  worker_phone VARCHAR(32) NOT NULL,
  job_section VARCHAR(120) NOT NULL,
  daily_wage DECIMAL(14,2) NOT NULL,
  wage_payment_policy VARCHAR(80) NOT NULL DEFAULT 'harian',
  signature_city VARCHAR(80) NOT NULL DEFAULT 'Pasuruan',
  signature_date DATE NOT NULL,
  e_signature_provider VARCHAR(40) NOT NULL DEFAULT 'mock',
  e_signature_status VARCHAR(40) NOT NULL DEFAULT 'not_started',
  e_signature_request_id VARCHAR(120) NULL,
  e_signature_document_id VARCHAR(120) NULL,
  e_signature_signed_url TEXT NULL,
  e_signature_certificate_serial VARCHAR(160) NULL,
  e_signature_verified_at DATETIME NULL,
  signature_image_url TEXT NULL,
  signature_cloudinary_public_id VARCHAR(255) NULL,
  face_verification_status VARCHAR(40) NOT NULL DEFAULT 'not_started',
  face_verification_request_id VARCHAR(120) NULL,
  face_liveness_score DECIMAL(5,2) NULL,
  face_image_url TEXT NULL,
  face_cloudinary_public_id VARCHAR(255) NULL,
  face_verified_at DATETIME NULL,
  audit_trail_json JSON NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_worker_name (worker_name),
  INDEX idx_agreement_date (agreement_date),
  INDEX idx_e_signature_status (e_signature_status),
  INDEX idx_face_verification_status (face_verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS e_signature_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agreement_id INT NOT NULL,
  provider VARCHAR(40) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  provider_reference VARCHAR(160) NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_e_signature_events_agreement
    FOREIGN KEY (agreement_id) REFERENCES agreements(id)
    ON DELETE CASCADE,
  INDEX idx_esign_events_agreement (agreement_id),
  INDEX idx_esign_events_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_sessions_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    ON DELETE CASCADE,
  INDEX idx_admin_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS change_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_name VARCHAR(120) NOT NULL,
  worker_ktp VARCHAR(32) NOT NULL,
  worker_phone VARCHAR(32) NOT NULL,
  requested_changes TEXT NOT NULL,
  reason TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_change_requests_admin
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
    ON DELETE SET NULL,
  INDEX idx_change_requests_status (status),
  INDEX idx_change_requests_ktp (worker_ktp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

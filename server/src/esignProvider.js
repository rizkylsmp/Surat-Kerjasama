import crypto from "node:crypto";
import { config } from "./config.js";

const makeReference = (prefix) =>
  `${prefix}_${crypto.randomBytes(8).toString("hex")}_${Date.now().toString(36)}`;

function createMockProvider() {
  return {
    name: "mock",
    async prepare({ agreement }) {
      const requestId = makeReference("mock_esign");
      return {
        provider: "mock",
        requestId,
        documentId: makeReference("mock_doc"),
        livenessUrl: `${config.esign.appPublicUrl}/mock-liveness/${requestId}`,
        signingUrl: `${config.esign.appPublicUrl}/mock-sign/${requestId}`,
        message: "Mode mock localhost. Ganti ESIGN_PROVIDER ke vendor PSrE resmi untuk produksi."
      };
    },
    async verifyFace({ agreement }) {
      return {
        provider: "mock",
        verificationId: makeReference("mock_face"),
        status: "verified",
        score: 98.4,
        subject: agreement.workerName
      };
    },
    async sendForSignature({ agreement }) {
      return {
        provider: "mock",
        requestId: agreement.eSignatureRequestId || makeReference("mock_esign"),
        status: "waiting_signature",
        signingUrl: `${config.esign.appPublicUrl}/mock-sign/${agreement.id}`
      };
    },
    async complete({ agreement }) {
      return {
        provider: "mock",
        requestId: agreement.eSignatureRequestId || makeReference("mock_esign"),
        status: "signed",
        signedUrl: `${config.esign.appPublicUrl}/mock-signed-documents/${agreement.id}.pdf`,
        certificateSerial: `MOCK-CERT-${agreement.id}-${Date.now()}`
      };
    }
  };
}

function createHttpProvider(name) {
  const baseUrl = config.esign.baseUrl.replace(/\/$/, "");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.esign.apiKey}`
  };

  async function post(path, payload) {
    if (!baseUrl || !config.esign.apiKey) {
      throw new Error(`Konfigurasi ${name.toUpperCase()} belum lengkap. Isi ESIGN_BASE_URL dan ESIGN_API_KEY.`);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || `Request ${name} gagal diproses`);
    }
    return body;
  }

  return {
    name,
    prepare: ({ agreement }) => post("/esign/requests", { agreement }),
    verifyFace: ({ agreement, faceCapture }) => post("/identity/liveness", { agreement, faceCapture }),
    sendForSignature: ({ agreement }) => post("/esign/requests/send", { agreement }),
    complete: ({ agreement, payload }) => post("/esign/requests/complete", { agreement, payload })
  };
}

export function getEsignProvider() {
  if (config.esign.provider === "mock") {
    return createMockProvider();
  }

  if (["vida", "privy", "custom"].includes(config.esign.provider)) {
    return createHttpProvider(config.esign.provider);
  }

  throw new Error(`ESIGN_PROVIDER '${config.esign.provider}' tidak dikenali.`);
}

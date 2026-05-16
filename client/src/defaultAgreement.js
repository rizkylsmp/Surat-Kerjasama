const today = new Date().toISOString().slice(0, 10);

export const defaultAgreement = {
  agreementDay: "Jumat",
  agreementDate: today,
  agreementPlace: "PASURUAN",
  companyName: "CV. KRAINING MULTI ABADI",
  companyAddress: "JL.KH. MANSYUR RT.05/RW.01, TembokRejo - Pasuruan",
  companyRepresentative: "Moch. Syaiful Rizal",
  companyPosition: "Direktur (pemilik badan/CV)",
  workerName: "",
  workerBirthPlace: "",
  workerBirthDate: today,
  workerAddress: "",
  workerKtp: "",
  workerPhone: "",
  jobSection: "",
  dailyWage: "0",
  wagePaymentPolicy: "harian",
  signatureCity: "Pasuruan",
  signatureDate: today,
  eSignatureProvider: "image",
  eSignatureStatus: "not_started",
  eSignatureRequestId: "",
  eSignatureDocumentId: "",
  eSignatureSignedUrl: "",
  eSignatureCertificateSerial: "",
  eSignatureVerifiedAt: "",
  signatureImageUrl: "",
  faceVerificationStatus: "not_started",
  faceVerificationRequestId: "",
  faceLivenessScore: "",
  faceImageUrl: "",
  faceVerifiedAt: "",
  notes: ""
};

export const companyDefaults = {
  companyName: defaultAgreement.companyName,
  companyAddress: defaultAgreement.companyAddress,
  companyRepresentative: defaultAgreement.companyRepresentative,
  companyPosition: defaultAgreement.companyPosition,
  agreementPlace: defaultAgreement.agreementPlace,
  signatureCity: defaultAgreement.signatureCity
};

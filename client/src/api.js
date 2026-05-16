const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Permintaan gagal diproses");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  listAgreements: (search = "") =>
    request(`/agreements${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getAdminStats: () => request("/agreements/admin/stats/summary"),
  createAgreement: (payload) =>
    request("/agreements", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAgreement: (id, payload) =>
    request(`/agreements/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteAgreement: (id) =>
    request(`/agreements/${id}`, {
      method: "DELETE"
    }),
  prepareOfficialSignature: (id) =>
    request(`/agreements/${id}/official-signature/prepare`, {
      method: "POST",
      body: JSON.stringify({})
    }),
  verifyFace: (id, payload) =>
    request(`/agreements/${id}/official-signature/verify-face`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendForSignature: (id) =>
    request(`/agreements/${id}/official-signature/send`, {
      method: "POST",
      body: JSON.stringify({})
    }),
  completeMockSignature: (id) =>
    request(`/agreements/${id}/official-signature/complete`, {
      method: "POST",
      body: JSON.stringify({ source: "localhost_mock" })
    }),
  saveDigitalSignature: (id, imageData) =>
    request(`/agreements/${id}/digital-signature`, {
      method: "POST",
      body: JSON.stringify({ imageData })
    }),
  saveFaceCapture: (id, payload) =>
    request(`/agreements/${id}/face-capture`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  loginAdmin: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logoutAdmin: () =>
    request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    }),
  getAdminMe: () => request("/auth/me"),
  createChangeRequest: (payload) =>
    request("/change-requests", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listChangeRequests: () => request("/change-requests"),
  reviewChangeRequest: (id, payload) =>
    request(`/change-requests/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    })
};

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/generate-wireframe";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("proflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function generateWireframe(prompt) {
  const token = localStorage.getItem("proflow_token");
  const response = await axios.post(
    N8N_WEBHOOK_URL,
    { prompt, token },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
}

export async function listWireframes(page = 1, perPage = 12, search = "") {
  const response = await api.get("/api/wireframes", {
    params: { page, per_page: perPage, search },
  });
  return response.data;
}

export async function getWireframe(id) {
  const response = await api.get(`/api/wireframes/${id}`);
  return response.data;
}

export async function deleteWireframe(id) {
  const response = await api.delete(`/api/wireframes/${id}`);
  return response.data;
}

export function getImageUrl(imagePath) {
  return `${API_URL}/generated/${imagePath}`;
}

export function getExportUrl(id, format = "png") {
  return `${API_URL}/api/wireframes/${id}/export?format=${format}`;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post("/api/auth/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function fetchPromptAnalytics() {
  const response = await api.get("/api/analytics/prompts");
  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await api.put("/api/auth/password", { currentPassword, newPassword });
  return response.data;
}

export async function deleteAccount() {
  const response = await api.delete("/api/auth/account");
  return response.data;
}

export function getAvatarUrl(filename) {
  if (!filename) return null;
  return `${API_URL}/uploads/${filename}`;
}

// ── Contract API ──────────────────────────────────────────────────────────────

export async function sendContract(formData) {
  const response = await api.post('/api/contracts/send', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getContracts() {
  const response = await api.get('/api/contracts');
  return response.data;
}

export async function uploadSignedContract(contractId, file) {
  const fd = new FormData();
  fd.append('pdf', file);
  const response = await api.post(`/api/contracts/${contractId}/upload-signed`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function returnContractToChef(contractId) {
  const response = await api.post(`/api/contracts/${contractId}/return`);
  return response.data;
}

export async function markContractCompleted(contractId) {
  const response = await api.put(`/api/contracts/${contractId}/complete`);
  return response.data;
}

export function getContractUrl(filename) {
  if (!filename) return null;
  return `${API_URL}/uploads/contracts/${filename}`;
}

export default api;

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/generate-wireframe';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('proflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const d = (r: { data: any }) => r.data;

// ── Wireframes ──────────────────────────────────────────────────────────────
export const generateWireframe = (data: { prompt: string; projectName?: string; description?: string }) =>
  api.post('/api/n8n/generate', data).then(d);

export const listWireframes = (): Promise<any[]> =>
  api.get('/api/wireframes').then((r: { data: any }) => r.data.wireframes || []);

export const getWireframe = (id: string): Promise<any> =>
  api.get(`/api/n8n/status/${id}`).then((r: { data: any }) => r.data.wireframe);

export const deleteWireframe = (id: string) =>
  api.delete(`/api/wireframes/${id}`).then(d);

export const listAutomatedWireframes = (): Promise<any[]> =>
  api.get('/api/automation/automated').then((r: { data: any }) => r.data.wireframes || []);

export const listAutomationTemplates = (): Promise<any[]> =>
  api.get('/api/automation/templates').then((r: { data: any }) => r.data.templates || []);

export const saveWireframe = (data: { name: string; description?: string; elements: unknown[]; imageUrl?: string }) =>
  api.post('/api/wireframes', data).then(d);

export const getImageUrl = (filename: string) => `${API_URL}/uploads/wireframes/${filename}`;

// ── Contracts ───────────────────────────────────────────────────────────────
export const getContracts = (): Promise<any[]> =>
  api.get('/api/contracts').then(d);

export const sendContract = (formData: FormData) =>
  api.post('/api/contracts/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const saveContractToDb = (payload: { ref: string; clientEmail: string; formData: unknown }) =>
  api.post('/api/contracts/save', payload).then(d);

export const uploadSignedContract = (id: string, formData: FormData) =>
  api.post(`/api/contracts/${id}/upload-signed`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const returnContractToChef = (id: string) =>
  api.post(`/api/contracts/${id}/return`).then(d);

export const markContractCompleted = (id: string) =>
  api.post(`/api/contracts/${id}/complete`).then(d);

export const getContractUrl = (filename: string) => `${API_URL}/uploads/contracts/${filename}`;

// ── Tasks ────────────────────────────────────────────────────────────────────
export const getTasks = (params?: Record<string, string>): Promise<any[]> =>
  api.get('/api/tasks', { params }).then(d);

export const getTask = (id: string): Promise<any> =>
  api.get(`/api/tasks/${id}`).then(d);

export const createTask = (data: { title: string; description: string; priority: string; deadline?: string; projectType?: string; budget?: string; technologies?: string }) =>
  api.post('/api/tasks', data).then(d);

export const uploadClientFiles = (id: string, formData: FormData) =>
  api.post(`/api/tasks/${id}/upload/client`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const updateTask = (id: string, data: { status?: string; logMsg?: string; designerNote?: string; devNote?: string; chefNote?: string; notifyChef?: boolean }) =>
  api.put(`/api/tasks/${id}`, data).then(d);

export const deleteTask = (id: string) =>
  api.delete(`/api/tasks/${id}`).then(d);

export const uploadDesignerFiles = (id: string, formData: FormData) =>
  api.post(`/api/tasks/${id}/upload/designer`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const uploadDevFiles = (id: string, formData: FormData) =>
  api.post(`/api/tasks/${id}/upload/dev`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const uploadChefFiles = (id: string, formData: FormData) =>
  api.post(`/api/tasks/${id}/upload/chef`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const assignTask = (id: string, data: { designerId?: string; devId?: string; chefNote?: string }) =>
  api.post(`/api/tasks/${id}/assign`, data).then(d);

export const getFileUrl = (path: string) => (path?.startsWith('/') ? `${API_URL}${path}` : path);

// ── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (params?: { role?: string }): Promise<any[]> =>
  api.get('/api/auth/users', { params }).then(d);

export const getUserAnalytics = () =>
  api.get('/api/auth/users/analytics').then(d);

export const uploadAvatar = (formData: FormData) =>
  api.post('/api/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(d);

export const updateProfile = (data: { name: string }) =>
  api.put('/api/auth/me', data).then(d);

export const fetchPromptAnalytics = () =>
  api.get('/api/n8n/analytics').then(d);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put('/api/auth/password', data).then(d);

export const deleteAccount = () =>
  api.delete('/api/auth/me').then(d);

export const getAvatarUrl = (avatar?: string) =>
  avatar ? (avatar.startsWith('/') ? `${API_URL}${avatar}` : avatar) : null;

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (role: string): Promise<any[]> =>
  api.get('/api/notifications', { params: { role } }).then(d);

export const markNotificationsRead = (ids: string[], role?: string) =>
  ids.length
    ? api.patch('/api/notifications/read', { ids }).then(d)
    : api.patch('/api/notifications/read', {}, { params: { role } }).then(d);

export default api;

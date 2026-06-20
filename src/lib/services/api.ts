import axios from 'axios';
import { browser } from '$app/environment';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (browser) {
    const token = localStorage.getItem('sjcu_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && browser) {
      localStorage.removeItem('sjcu_admin_token');
      localStorage.removeItem('sjcu_admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const membersApi = {
  getAll: (params?: Record<string, string>) => api.get('/members', { params }),
  getOne:     (id: string)   => api.get(`/members/${id}`),
  getBySlug:  (slug: string) => api.get(`/members/slug/${slug}`),
  create: (data: FormData) => api.post('/members', data),
  update: (id: string, data: FormData) => api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
  reorder: (order: { id: string; order: number }[]) => api.put('/members/reorder', { order }),
};

export const productionsApi = {
  getAll: (params?: Record<string, string>) => api.get('/productions', { params }),
  getOne: (id: string) => api.get(`/productions/${id}`),
  create: (data: FormData) => api.post('/productions', data),
  update: (id: string, data: FormData) => api.put(`/productions/${id}`, data),
  delete: (id: string) => api.delete(`/productions/${id}`),
  reorder: (order: { id: string; order: number }[]) => api.put('/productions/reorder', { order }),
  fetchYoutubeThumbnail: (youtubeUrl: string) => api.post('/productions/fetch-youtube-thumb', { youtubeUrl }),
  fetchYoutubeDescription: (youtubeUrl: string) => api.post('/productions/fetch-youtube-description', { youtubeUrl }),
  syncThumbnail: (id: string) => api.post(`/productions/${id}/sync-thumbnail`),
  toggleHidden: (id: string) => api.patch(`/productions/${id}/toggle-hidden`),
};

export const eventsApi = {
  getAll: (params?: Record<string, string>) => api.get('/events', { params }),
  getOne: (id: string) => api.get(`/events/${id}`),
  create: (data: FormData) => api.post('/events', data),
  update: (id: string, data: FormData) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  reorder: (order: { id: string; order: number }[]) => api.put('/events/reorder', { order }),
};

export const galleryApi = {
  getAll: (params?: Record<string, string>) => api.get('/gallery', { params }),
  upload: (data: FormData) => api.post('/gallery', data, { timeout: 120_000 }),
  uploadVideo: (data: FormData) => api.post('/gallery/video', data, { timeout: 300_000 }),
  reorder: (order: { id: string; order: number }[]) => api.patch('/gallery/reorder', { order }),
  delete: (id: string) => api.delete(`/gallery/${id}`),
};

export const upcomingApi = {
  getAll: () => api.get('/upcoming'),
  getOne: (id: string) => api.get(`/upcoming/${id}`),
  create: (data: FormData) => api.post('/upcoming', data),
  update: (id: string, data: FormData) => api.put(`/upcoming/${id}`, data),
  updateStage: (id: string, data: FormData) => api.patch(`/upcoming/${id}/stage`, data),
  deleteStageImage: (id: string, stageKey: string, imageUrl: string) => api.delete(`/upcoming/${id}/stage-image`, { data: { stageKey, imageUrl } }),
  delete: (id: string) => api.delete(`/upcoming/${id}`),
  reorder: (order: { id: string; order: number }[]) => api.put('/upcoming/reorder', { order }),
};

export const memorableEventsApi = {
  getAll: () => api.get('/memorable-events'),
  getOne: (id: string) => api.get(`/memorable-events/${id}`),
  create: (data: FormData) => api.post('/memorable-events', data),
  update: (id: string, data: FormData) => api.put(`/memorable-events/${id}`, data),
  addGallery: (id: string, data: FormData) => api.post(`/memorable-events/${id}/gallery`, data, { timeout: 300_000 }),
  deleteGalleryImage: (id: string, imageUrl: string) => api.delete(`/memorable-events/${id}/gallery-image`, { data: { imageUrl } }),
  delete: (id: string) => api.delete(`/memorable-events/${id}`),
  reorder: (order: { id: string; order: number }[]) => api.put('/memorable-events/reorder', { order }),
  fetchYoutubeCover: (youtubeUrl: string) => api.post('/memorable-events/fetch-youtube-cover', { youtubeUrl }),
  fetchYoutubeDescription: (youtubeUrl: string) => api.post('/memorable-events/fetch-youtube-description', { youtubeUrl }),
};

export const partnersApi = {
  getAll: () => api.get('/partners'),
  getOne: (id: string) => api.get(`/partners/${id}`),
  create: (data: FormData) => api.post('/partners', data),
  update: (id: string, data: FormData) => api.put(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
  reorder: (order: { id: string; order: number }[]) => api.put('/partners/reorder', { order }),
};

export const testimonialsApi = {
  getAll: (params?: Record<string, string>) => api.get('/testimonials', { params }),
  getAdmin: (params?: Record<string, string>) => api.get('/testimonials/admin', { params }),
  getPendingCount: () => api.get('/testimonials/pending-count'),
  submit: (data: FormData) => api.post('/testimonials/submit', data),
  create: (data: FormData) => api.post('/testimonials', data),
  update: (id: string, data: FormData) => api.put(`/testimonials/${id}`, data),
  approve: (id: string) => api.patch(`/testimonials/${id}/approve`),
  delete: (id: string) => api.delete(`/testimonials/${id}`),
};

export const enquiriesApi = {
  getAll: (params?: Record<string, string>) => api.get('/enquiries', { params }),
  getOne: (id: string) => api.get(`/enquiries/${id}`),
  create: (data: Record<string, string>) => api.post('/enquiries', data),
  update: (id: string, data: Record<string, string>) => api.put(`/enquiries/${id}`, data),
  delete: (id: string) => api.delete(`/enquiries/${id}`),
};

export const contactsApi = {
  getAll: () => api.get('/contacts'),
  getOne: (id: string) => api.get(`/contacts/${id}`),
  create: (data: Record<string, string>) => api.post('/contacts', data),
  update: (id: string, data: Record<string, string>) => api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

export const auditionsApi = {
  getAll: () => api.get('/auditions'),
  getOne: (id: string) => api.get(`/auditions/${id}`),
  create: (data: FormData) => api.post('/auditions', data),
  update: (id: string, data: FormData) => api.put(`/auditions/${id}`, data),
  extendDeadline: (id: string, applicationEnd: string) => api.patch(`/auditions/${id}/extend-deadline`, { applicationEnd }),
  reorder: (order: { id: string; order: number }[]) => api.put('/auditions/reorder', { order }),
  delete: (id: string) => api.delete(`/auditions/${id}`),
  apply: (id: string, data: FormData) => api.post(`/auditions/${id}/apply`, data),
  getApplications: (id: string, params?: Record<string, string>) => api.get(`/auditions/${id}/applications`, { params }),
};

export const auditionApplicationsApi = {
  getRecent: () => api.get('/audition-applications/recent'),
  getOne: (appId: string) => api.get(`/audition-applications/${appId}`),
  updateStatus: (appId: string, status: string) => api.put(`/audition-applications/${appId}/status`, { status }),
  delete: (appId: string) => api.delete(`/audition-applications/${appId}`),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: FormData) => api.put('/settings', data),
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: FormData) => api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};


export const chatApi = {
  send: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    api.post('/chat', { messages }),
};

export const apiKeysApi = {
  get: () => api.get('/keys'),
  update: (data: Record<string, string>) => api.put('/keys', data),
};

export const adminsApi = {
  list:         ()                                      => api.get('/auth/admins'),
  create:       (data: { name: string; email: string; role: string }) => api.post('/auth/admins', data),
  updateRole:   (id: string, role: string)              => api.put(`/auth/admins/${id}/role`, { role }),
  resendInvite: (id: string)                            => api.post(`/auth/admins/${id}/resend-invite`, {}),
  delete:       (id: string)                            => api.delete(`/auth/admins/${id}`),
  acceptInvite: (data: { token: string; password: string }) => api.post('/auth/accept-invite', data),
};

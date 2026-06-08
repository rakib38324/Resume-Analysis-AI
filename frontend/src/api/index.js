import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Resumes
export const resumeAPI = {
  upload: (formData, onProgress) =>
    api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
    }),
  list: () => api.get('/resumes'),
  get: (id) => api.get(`/resumes/${id}`),
  delete: (id) => api.delete(`/resumes/${id}`),
  updateLabel: (id, label) => api.patch(`/resumes/${id}/label`, { label }),
};

// Analysis
export const analysisAPI = {
  analyze: (resumeId) => api.post('/analysis/analyze', { resumeId }),
  list: (params) => api.get('/analysis', { params }),
  get: (id) => api.get(`/analysis/${id}`),
  stats: () => api.get('/analysis/stats'),
};

// Job matching
export const jobMatchAPI = {
  match: (data) => api.post('/job-match', data),
  list: () => api.get('/job-match'),
  get: (id) => api.get(`/job-match/${id}`),
};

// Subscriptions
export const subscriptionAPI = {
  status: () => api.get('/subscriptions/status'),
  checkout: () => api.post('/subscriptions/checkout'),
  cancel: () => api.post('/subscriptions/cancel'),
  portal: () => api.post('/subscriptions/portal'),
};

// Admin
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;

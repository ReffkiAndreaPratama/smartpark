import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartpark_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role = 'user') =>
    api.post('/api/auth/register', { name, email, password, role }),
}

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard'),
  getHealth: () => api.get('/api/health'),
}

// Parking Slots
export const parkingAPI = {
  list: (params?: Record<string, string>) => api.get('/api/parking-slots', { params }),
  get: (id: number) => api.get(`/api/parking-slots/${id}`),
  create: (data: object) => api.post('/api/parking-slots', data),
  update: (id: number, data: object) => api.put(`/api/parking-slots/${id}`, data),
  delete: (id: number) => api.delete(`/api/parking-slots/${id}`),
  toggleOccupy: (id: number, vehicleType = 'car') =>
    api.post(`/api/parking-slots/${id}/occupy`, null, { params: { vehicle_type: vehicleType } }),
}

// Cameras
export const cameraAPI = {
  list: () => api.get('/api/cameras'),
  create: (data: object) => api.post('/api/cameras', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/api/cameras/${id}/status`, null, { params: { status } }),
  delete: (id: number) => api.delete(`/api/cameras/${id}`),
}

// Sensors
export const sensorAPI = {
  list: () => api.get('/api/sensors'),
  get: (sensorId: string) => api.get(`/api/sensors/${sensorId}`),
  retry: (sensorId: string) => api.post(`/api/sensors/${sensorId}/retry`),
}

// Detection
export const detectionAPI = {
  detectImage: (formData: FormData) =>
    api.post('/api/detection/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (limit = 50) => api.get('/api/detections', { params: { limit } }),
  modelStatus: () => api.get('/api/model/status'),
  demoSnapshot: () => api.get('/api/detection/demo'),
}

// Sessions
export const sessionAPI = {
  list: (params?: Record<string, string>) => api.get('/api/sessions', { params }),
  get: (id: number) => api.get(`/api/sessions/${id}`),
}

// History
export const historyAPI = {
  list: (params?: Record<string, string | number>) => api.get('/api/history', { params }),
  exportCsv: () =>
    api.get('/api/history/export/csv', { responseType: 'blob' }),
}

// Analytics
export const analyticsAPI = {
  get: (period = 'today') => api.get('/api/analytics', { params: { period } }),
  forecast: () => api.get('/api/analytics/forecast'),
}

// Notifications
export const notificationAPI = {
  list: (unreadOnly = false) => api.get('/api/notifications', { params: { unread_only: unreadOnly } }),
  unreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id: number) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
}

// Reservations
export const reservationAPI = {
  list: () => api.get('/api/reservations'),
  create: (data: object) => api.post('/api/reservations', data),
  cancel: (id: number) => api.delete(`/api/reservations/${id}`),
}

// Reports
export const reportAPI = {
  pdf: () => api.get('/api/reports/pdf', { responseType: 'blob' }),
}

// Admin
export const adminAPI = {
  overview: () => api.get('/api/admin/overview'),
  users: () => api.get('/api/admin/users'),
  logs: () => api.get('/api/admin/logs'),
}

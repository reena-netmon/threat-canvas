import axios from 'axios'
import type { Alert, TimelineEvent, Stats, LogEntry, LogsMeta, LogStats } from '../types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

export const api = {
  health: () => http.get('/health'),

  // Auth
  login: (email: string, password: string) =>
    http.post('/auth/login', { email, password }),

  seed: () => http.post('/seed'),

  // Alerts
  listAlerts: (params?: { status?: string; severity?: string; limit?: number }) =>
    http.get<Alert[]>('/alerts', { params }),

  getAlert: (id: string) => http.get<Alert>(`/alerts/${id}`),

  updateStatus: (id: string, status: string) =>
    http.patch<Alert>(`/alerts/${id}/status`, { status }),

  createMockAlert: () => http.post<Alert>('/alerts/mock'),

  // Stats
  getStats: () => http.get<Stats>('/stats'),

  // Timeline
  getTimeline: (alertId?: string) =>
    http.get<TimelineEvent[]>('/timeline', { params: alertId ? { alert_id: alertId } : {} }),

  // Logs
  searchLogs: (params: {
    q?: string; source_type?: string; data_stream?: string; event_type?: string;
    severity?: string; host?: string; source_ip?: string;
    limit?: number; offset?: number;
  }) => http.get<{ total: number; logs: LogEntry[] }>('/logs', { params }),

  getLogsMeta: () => http.get<LogsMeta>('/logs/meta'),

  getLogStats: (params: {
    q?: string; source_type?: string; data_stream?: string; event_type?: string;
    severity?: string; host?: string; source_ip?: string;
  }) => http.get<LogStats>('/logs/stats', { params }),
}

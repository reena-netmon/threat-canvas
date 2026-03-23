export type AlertStatus = 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive'
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface MitreTag {
  tactic: string
  technique: string
  technique_id: string
}

export interface Alert {
  id: string
  title: string
  alert_type: string
  timestamp: string
  risk_score: number
  severity: Severity
  status: AlertStatus
  user?: string
  host?: string
  source_ip?: string
  dest_ip?: string
  country?: string
  city?: string
  description?: string
  mitre?: MitreTag[]
  tags?: string[]
}

export interface TimelineEvent {
  id: string
  alert_id: string
  timestamp: string
  event_type: string
  actor?: string
  target?: string
  action: string
  result?: string
  mitre?: MitreTag
}

export interface LogEntry {
  id: string
  timestamp: string
  source_type: string
  data_stream: string
  event_type: string
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  source_ip: string
  dest_ip?: string
  host: string
  user?: string
  message: string
  raw: Record<string, unknown>
}

export interface LogsMeta {
  source_types: string[]
  event_types: string[]
  severities: string[]
  data_streams: string[]
}

export interface LogStats {
  total: number
  by_severity: { severity: string; count: number }[]
  by_stream: { stream: string; count: number }[]
  by_hour: { hour: string; count: number }[]
  by_event_type: { type: string; count: number }[]
}

export interface Stats {
  total_alerts: number
  open_alerts: number
  critical_alerts: number
  high_alerts: number
  medium_alerts: number
  low_alerts: number
  resolved_today: number
  avg_risk_score: number
  top_alert_types: { type: string; count: number }[]
  alerts_by_hour: { hour: string; count: number }[]
}

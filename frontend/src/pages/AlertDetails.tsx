import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { api } from '../api/client'
import type { Alert, AlertStatus, TimelineEvent } from '../types'
import { usePageTour } from '../hooks/usePageTour'
import {
  severityColor, severityBg, statusColor, statusLabel,
  riskBarColor, fmtDateTime, relativeTime,
} from '../utils/severity'

// ── Icons & colours reused from Timeline ──────────────────────────────────────
const EVENT_ICONS: Record<string, ReactElement> = {
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  auth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  process: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
}
const EVENT_COLORS: Record<string, string> = {
  network: '#4cc9f0', auth: '#ffd166', process: '#ff8c42',
  file: 'var(--c-accent)', alert: '#ff3b5c',
}

// ── Status actions ─────────────────────────────────────────────────────────────
const STATUS_ACTIONS: { status: AlertStatus; label: string; color: string }[] = [
  { status: 'acknowledged',  label: 'Acknowledge',   color: '#ffd166' },
  { status: 'investigating', label: 'Investigate',   color: '#4cc9f0' },
  { status: 'resolved',      label: 'Resolve',       color: '#06d6a0' },
  { status: 'false_positive',label: 'False Positive',color: 'var(--c-text-secondary)' },
]

// ── Reusable small components ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
        <h3 className="text-[11px] font-semibold text-[var(--c-text-primary)] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function MetaRow({ label, value, accent }: { label: string; value?: string; accent?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[var(--c-border)] last:border-0">
      <span className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider w-20 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs font-mono break-all ${accent ? 'text-[#4cc9f0]' : 'text-[var(--c-text-bright)]'}`}>{value}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlertDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<Alert | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [aRes, tRes] = await Promise.all([
        api.getAlert(id),
        api.getTimeline(id),
      ])
      setAlert(aRes.data)
      setEvents(tRes.data)
    } catch {
      navigate('/triage', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])
  usePageTour('alert-details')

  async function handleStatus(status: AlertStatus) {
    if (!alert) return
    setUpdatingStatus(true)
    try {
      await api.updateStatus(alert.id, status)
      setAlert(prev => prev ? { ...prev, status } : prev)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#5e81f4] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!alert) return null

  const sevRaw = { critical: '#ff3b5c', high: '#ff8c42', medium: '#ffd166', low: '#06d6a0' } as const
  const sevHex = sevRaw[alert.severity]
  const riskColor = riskBarColor(alert.risk_score)

  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-full">

      {/* ── Header card ── */}
      <div data-tour="alert-header" className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden">
        {/* Severity accent stripe */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${sevHex}, ${sevHex}40)` }} />

        <div className="p-5">
          {/* Back + badges row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs text-[var(--c-text-secondary)] hover:text-[var(--c-text-primary)] transition-colors cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>
            <span className="text-[var(--c-border)]">·</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${severityBg[alert.severity]} ${severityColor[alert.severity]}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColor[alert.status]}`}>
              {statusLabel[alert.status]}
            </span>
            <span className="text-[10px] text-[var(--c-text-muted)] font-mono ml-auto">{alert.id.slice(0, 16)}…</span>
          </div>

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold text-[var(--c-text-primary)] leading-snug mb-1">{alert.title}</h1>
          <p className="text-xs text-[var(--c-text-muted)] font-mono">
            {alert.alert_type?.replace(/_/g, ' ')} · {fmtDateTime(alert.timestamp)} · {relativeTime(alert.timestamp)}
          </p>

          {/* Risk + actions row */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Risk score */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">Risk</span>
              <div className="w-36 h-2 rounded-full bg-[var(--c-border)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${alert.risk_score}%`, background: riskColor, boxShadow: `0 0 8px ${riskColor}60` }}
                />
              </div>
              <span className="text-sm font-bold font-mono" style={{ color: riskColor }}>{alert.risk_score}</span>
            </div>

            {/* Status actions */}
            <div data-tour="alert-actions" className="flex flex-wrap gap-2 sm:ml-auto">
              {STATUS_ACTIONS.filter(a => a.status !== alert.status).map(a => (
                <button
                  key={a.status}
                  onClick={() => handleStatus(a.status)}
                  disabled={updatingStatus}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer disabled:opacity-40"
                  style={{ color: a.color, borderColor: `${a.color}40`, background: `${a.color}10` }}
                >
                  → {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column: metadata */}
        <div className="space-y-4">

          {/* Network & Identity */}
          <div data-tour="alert-meta"><Section title="Network & Identity">
            <div className="space-y-0">
              <MetaRow label="Source IP"  value={alert.source_ip} accent />
              <MetaRow label="Dest IP"    value={alert.dest_ip} />
              <MetaRow label="Host"       value={alert.host} />
              <MetaRow label="User"       value={alert.user} accent />
              <MetaRow
                label="Location"
                value={[alert.city, alert.country].filter(Boolean).join(', ') || undefined}
              />
            </div>
          </Section></div>

          {/* Description */}
          {alert.description && (
            <Section title="Description">
              <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">{alert.description}</p>
            </Section>
          )}

          {/* MITRE ATT&CK */}
          {alert.mitre && alert.mitre.length > 0 && (
            <div data-tour="alert-mitre"><Section title="MITRE ATT&CK">
              <div className="space-y-2">
                {alert.mitre.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[var(--c-bg-base)] border border-[var(--c-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#5e81f4]/15 text-[var(--c-accent)] border border-[var(--c-accent)]/30">
                        {m.technique_id}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--c-text-bright)]">{m.technique}</p>
                    <p className="text-[10px] text-[var(--c-text-muted)] mt-0.5 uppercase tracking-wider">{m.tactic}</p>
                  </div>
                ))}
              </div>
            </Section></div>
          )}

          {/* Tags */}
          {alert.tags && alert.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {alert.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-full bg-[var(--c-border)] text-[var(--c-text-secondary)] border border-[var(--c-border-bright)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column: timeline */}
        <div data-tour="alert-timeline" className="lg:col-span-2">
          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-[var(--c-border)] bg-[var(--c-bg-elevated)] flex items-center justify-between shrink-0">
              <h3 className="text-[11px] font-semibold text-[var(--c-text-primary)] uppercase tracking-wider">Attack Chain Timeline</h3>
              <span className="text-xs text-[var(--c-text-secondary)] font-mono">{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--c-text-muted)] text-sm">
                No timeline events for this alert
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="relative">
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--c-border)]" />
                  <div className="space-y-0">
                    {events.map((ev, i) => {
                      const color = EVENT_COLORS[ev.event_type] ?? 'var(--c-accent)'
                      const icon = EVENT_ICONS[ev.event_type]
                      const isLast = i === events.length - 1
                      return (
                        <div key={ev.id} className={`relative flex gap-4 group ${isLast ? '' : 'pb-5'}`}>
                          {/* Node */}
                          <div
                            className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-200 group-hover:scale-110"
                            style={{
                              background: `${color}18`,
                              borderColor: `${color}60`,
                              color,
                              boxShadow: `0 0 12px ${color}30`,
                            }}
                          >
                            {icon}
                          </div>

                          {/* Content */}
                          <div
                            className="flex-1 rounded-xl border p-3 mb-1 bg-[var(--c-bg-base)] transition-all duration-150 group-hover:border-[var(--c-border-bright)]"
                            style={{ borderColor: 'var(--c-border)' }}
                          >
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div>
                                <p className="text-xs font-semibold text-[var(--c-text-primary)]">{ev.action}</p>
                                {ev.result && (
                                  <p className="text-[10px] text-[var(--c-text-secondary)] font-mono mt-0.5">{ev.result}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-[var(--c-text-muted)] font-mono shrink-0">
                                {fmtDateTime(ev.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap mt-2">
                              {ev.actor && (
                                <span className="text-[10px] font-mono text-[#4cc9f0]">actor: {ev.actor}</span>
                              )}
                              {ev.target && (
                                <span className="text-[10px] font-mono text-[var(--c-text-secondary)]">target: {ev.target}</span>
                              )}
                              {ev.mitre && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded font-mono border ml-auto"
                                  style={{ color: 'var(--c-accent)', background: 'var(--c-accent-10)', borderColor: 'var(--c-accent-border)' }}
                                >
                                  {ev.mitre.technique_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

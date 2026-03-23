import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import type { TimelineEvent, Alert } from '../types'
import { usePageTour } from '../hooks/usePageTour'
import type { ReactElement } from 'react'
import { severityColor, fmtDateTime, relativeTime } from '../utils/severity'

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
  network: '#4cc9f0',
  auth: '#ffd166',
  process: '#ff8c42',
  file: 'var(--c-accent)',
  alert: '#ff3b5c',
}

export default function Timeline() {
  usePageTour('timeline')
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [eRes, aRes] = await Promise.all([
        api.getTimeline(selectedAlert ?? undefined),
        api.listAlerts({ limit: 20, status: 'open' }),
      ])
      setEvents(eRes.data)
      setAlerts(aRes.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [selectedAlert])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 h-full overflow-hidden">
      {/* Alert selector panel */}
      <div data-tour="timeline-incidents" className="w-full h-44 sm:h-auto sm:w-64 shrink-0 flex flex-col rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
          <h2 className="text-xs font-semibold text-[var(--c-text-primary)] uppercase tracking-wider">Active Incidents</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={() => setSelectedAlert(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
              selectedAlert === null
                ? 'bg-[var(--c-accent)]/20 border border-[var(--c-accent)]/40 text-[var(--c-accent)]'
                : 'text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-hover)] hover:text-[var(--c-text-primary)]'
            }`}
          >
            All Events
          </button>
          {alerts.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAlert(a.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                selectedAlert === a.id
                  ? 'bg-[var(--c-accent)]/20 border border-[var(--c-accent)]/40'
                  : 'hover:bg-[var(--c-bg-hover)] border border-transparent'
              }`}
            >
              <div className={`text-[10px] font-semibold mb-0.5 ${severityColor[a.severity]}`}>
                {a.severity.toUpperCase()} · {a.risk_score}
              </div>
              <p className="text-xs text-[var(--c-text-bright)] leading-snug line-clamp-2">{a.title}</p>
              <p className="text-[10px] text-[var(--c-text-muted)] mt-0.5 font-mono">{relativeTime(a.timestamp)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div data-tour="timeline-main" className="flex-1 flex flex-col rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--c-border)] bg-[var(--c-bg-elevated)] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[var(--c-text-primary)] uppercase tracking-wider">
            Attack Chain Timeline
          </h2>
          <span className="text-xs text-[var(--c-text-secondary)] font-mono">{events.length} events</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#5e81f4] border-t-transparent animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--c-text-muted)] text-sm">
            No events found
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--c-border)]" />

              <div className="space-y-0">
                {events.map((ev, i) => {
                  const color = EVENT_COLORS[ev.event_type] ?? 'var(--c-accent)'
                  const icon = EVENT_ICONS[ev.event_type]
                  const isLast = i === events.length - 1
                  return (
                    <div key={ev.id} data-tour={i === 0 ? 'timeline-event' : undefined} className={`relative flex gap-4 group ${isLast ? '' : 'pb-5'}`}>
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
                            <span className="text-[10px] font-mono text-[#4cc9f0]">
                              actor: {ev.actor}
                            </span>
                          )}
                          {ev.target && (
                            <span className="text-[10px] font-mono text-[var(--c-text-secondary)]">
                              target: {ev.target}
                            </span>
                          )}
                          {ev.mitre && (
                            <span
                              data-tour={i === 0 ? 'timeline-mitre' : undefined}
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
  )
}

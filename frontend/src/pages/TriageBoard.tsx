import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Alert, AlertStatus } from '../types'
import { usePageTour } from '../hooks/usePageTour'
import { severityBg, severityColor, statusLabel, riskBarColor, relativeTime } from '../utils/severity'

const COLUMNS: { status: AlertStatus; label: string; color: string }[] = [
  { status: 'open', label: 'Open', color: '#ff3b5c' },
  { status: 'acknowledged', label: 'Acknowledged', color: '#ffd166' },
  { status: 'investigating', label: 'Investigating', color: '#4cc9f0' },
  { status: 'resolved', label: 'Resolved', color: '#06d6a0' },
]

function AlertCard({ alert, onStatusChange }: { alert: Alert; onStatusChange: (id: string, s: AlertStatus) => void }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      className="rounded-xl border bg-[var(--c-bg-base)] transition-all duration-200 hover:border-[var(--c-border-bright)] cursor-pointer group"
      style={{ borderColor: expanded ? 'var(--c-border-bright)' : 'var(--c-border)' }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${severityBg[alert.severity]} ${severityColor[alert.severity]}`}>
            {alert.severity.toUpperCase()}
          </span>
          <p className="text-xs font-medium text-[var(--c-text-primary)] leading-snug line-clamp-2 flex-1">{alert.title}</p>
        </div>

        {/* Risk bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 rounded-full bg-[var(--c-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${alert.risk_score}%`, background: riskBarColor(alert.risk_score) }}
            />
          </div>
          <span
            className="text-[10px] font-bold font-mono w-6 text-right"
            style={{ color: riskBarColor(alert.risk_score) }}
          >
            {alert.risk_score}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--c-text-muted)] font-mono">
          <span className="truncate">{alert.source_ip}</span>
          {alert.country && alert.country !== 'Internal' && (
            <span className="text-[var(--c-text-secondary)]">{alert.country}</span>
          )}
          <span className="ml-auto shrink-0">{relativeTime(alert.timestamp)}</span>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-[var(--c-border)] space-y-2">
            {alert.description && (
              <p className="text-[11px] text-[var(--c-text-secondary)] leading-relaxed">{alert.description}</p>
            )}
            {alert.user && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-[var(--c-text-muted)]">User:</span>
                <span className="text-[#4cc9f0]">{alert.user}</span>
              </div>
            )}
            {alert.host && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-[var(--c-text-muted)]">Host:</span>
                <span className="text-[var(--c-text-bright)]">{alert.host}</span>
              </div>
            )}
            {alert.mitre && alert.mitre[0] && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono border"
                  style={{ color: 'var(--c-accent)', background: 'var(--c-accent-10)', borderColor: 'var(--c-accent-border)' }}
                >
                  {alert.mitre[0].technique_id}
                </span>
                <span className="text-[10px] text-[var(--c-text-secondary)]">{alert.mitre[0].technique}</span>
              </div>
            )}
            {alert.tags && (
              <div className="flex flex-wrap gap-1">
                {alert.tags.map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--c-border)] text-[var(--c-text-secondary)] border border-[var(--c-border-bright)]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-1.5 pt-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => navigate(`/alerts/${alert.id}`)}
                className="text-[10px] px-2 py-1 rounded-lg border border-[var(--c-accent)]/30 bg-[var(--c-accent)]/10 text-[var(--c-accent)] transition-all hover:border-[var(--c-accent)]/60 cursor-pointer font-medium"
              >
                View Details →
              </button>
              {COLUMNS.filter(c => c.status !== alert.status).map(c => (
                <button
                  key={c.status}
                  onClick={() => onStatusChange(alert.id, c.status)}
                  className="text-[10px] px-2 py-1 rounded-lg border transition-all duration-150 font-medium cursor-pointer"
                  style={{
                    color: c.color,
                    borderColor: `${c.color}40`,
                    background: `${c.color}10`,
                  }}
                >
                  → {statusLabel[c.status]}
                </button>
              ))}
              <button
                onClick={() => onStatusChange(alert.id, 'false_positive')}
                className="text-[10px] px-2 py-1 rounded-lg border border-[var(--c-text-muted)]/40 bg-[var(--c-text-muted)]/10 text-[var(--c-text-secondary)] transition-all hover:border-[var(--c-text-secondary)]/40 cursor-pointer"
              >
                False Positive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TriageBoard({ refreshKey }: { refreshKey: number }) {
  usePageTour('triage')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.listAlerts({ limit: 200 })
      setAlerts(res.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])
  useEffect(() => {
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  async function handleStatusChange(id: string, status: AlertStatus) {
    await api.updateStatus(id, status)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const byStatus = (status: AlertStatus) =>
    alerts.filter(a => a.status === status).sort((a, b) => b.risk_score - a.risk_score)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#5e81f4] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      {/* Header */}
      <div data-tour="triage-header" className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          {COLUMNS.map(col => {
            const count = byStatus(col.status).length
            return (
              <div key={col.status} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                <span className="text-[var(--c-text-secondary)]">{col.label}</span>
                <span className="font-bold font-mono" style={{ color: col.color }}>{count}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-[var(--c-text-muted)]">Click a card to expand & move</p>
      </div>

      {/* Kanban board */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
        {COLUMNS.map((col, colIdx) => {
          const colAlerts = byStatus(col.status)
          const tourAttr = ['triage-open','triage-acknowledged','triage-investigating','triage-resolved'][colIdx]
          return (
            <div key={col.status} data-tour={tourAttr} className="flex flex-col rounded-xl border bg-[var(--c-bg-surface)] overflow-hidden" style={{ borderColor: 'var(--c-border)' }}>
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 border-b"
                style={{ borderColor: 'var(--c-border)', background: `${col.color}08` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                </div>
                <span
                  className="text-xs font-bold font-mono w-5 h-5 rounded flex items-center justify-center"
                  style={{ color: col.color, background: `${col.color}18` }}
                >
                  {colAlerts.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colAlerts.map((a, i) => (
                  <div key={a.id} data-tour={i === 0 && col.status === 'open' ? 'triage-card' : undefined}>
                    <AlertCard alert={a} onStatusChange={handleStatusChange} />
                  </div>
                ))}
                {colAlerts.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[var(--c-text-muted)] text-xs">
                    No alerts
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

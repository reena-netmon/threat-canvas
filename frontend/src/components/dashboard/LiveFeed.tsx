import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Alert } from '../../types'
import { severityDot, relativeTime } from '../../utils/severity'

interface Props {
  alerts: Alert[]
  newAlertIds?: Set<string>
}

export default function LiveFeed({ alerts, newAlertIds }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(alerts.length)
  const navigate = useNavigate()

  useEffect(() => {
    if (alerts.length > prevLen.current && listRef.current) {
      listRef.current.scrollTop = 0
    }
    prevLen.current = alerts.length
  }, [alerts.length])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--c-text-primary)]">Live Alert Feed</h2>
        <span className="text-xs text-[var(--c-text-secondary)] font-mono">{alerts.length} alerts</span>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-1 pr-1">
        {alerts.slice(0, 30).map((a, i) => (
          <div
            key={a.id}
            onClick={() => navigate(`/alerts/${a.id}`)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:border-[var(--c-accent)]/40 hover:bg-[var(--c-bg-surface)] transition-colors duration-150 group cursor-pointer ${newAlertIds?.has(a.id) ? 'alert-flash' : 'bg-[var(--c-bg-base)] border-[var(--c-border)]'}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${severityDot[a.severity]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--c-text-primary)] truncate leading-snug">{a.title}</p>
              <p className="text-[10px] text-[var(--c-text-secondary)] truncate font-mono mt-0.5">
                {a.source_ip} → {a.host ?? '—'}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                style={{
                  color: a.risk_score >= 90 ? '#ff3b5c' : a.risk_score >= 70 ? '#ff8c42' : a.risk_score >= 40 ? '#ffd166' : '#06d6a0',
                  background: a.risk_score >= 90 ? '#ff3b5c18' : a.risk_score >= 70 ? '#ff8c4218' : a.risk_score >= 40 ? '#ffd16618' : '#06d6a018',
                }}
              >
                {a.risk_score}
              </span>
              <span className="text-[10px] text-[var(--c-text-muted)]">{relativeTime(a.timestamp)}</span>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--c-text-muted)]">
            <p className="text-sm">No alerts</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { Alert } from '../../types'
import { severityColor, severityBg, riskBarColor } from '../../utils/severity'

interface Props {
  alert: Alert | null
  onDismiss: () => void
}

export default function ToastNotification({ alert, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!alert) { setVisible(false); setExiting(false); return }
    setExiting(false)
    setVisible(true)
    const timer = setTimeout(() => dismiss(), 6000)
    return () => clearTimeout(timer)
  }, [alert])

  function dismiss() {
    setExiting(true)
    setTimeout(() => { setVisible(false); onDismiss() }, 300)
  }

  if (!alert || !visible) return null

  return (
    <div
      className="fixed bottom-16 sm:bottom-5 left-4 right-4 sm:left-auto sm:right-5 sm:w-80 z-[100] rounded-xl border bg-[var(--c-bg-elevated)] shadow-2xl overflow-hidden"
      style={{
        borderColor: alert.severity === 'critical' ? '#ff3b5c50' : alert.severity === 'high' ? '#ff8c4250' : 'var(--c-border-bright)',
        boxShadow: alert.severity === 'critical'
          ? '0 0 30px rgba(255,59,92,0.2)'
          : alert.severity === 'high'
          ? '0 0 30px rgba(255,140,66,0.15)'
          : '0 0 30px rgba(94,129,244,0.1)',
        transform: exiting ? 'translateX(110%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        animation: !exiting ? 'slideIn 0.3s ease' : undefined,
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Progress bar */}
      <div className="h-0.5 bg-[var(--c-border)] overflow-hidden">
        <div
          className="h-full"
          style={{
            background: alert.severity === 'critical' ? '#ff3b5c' : alert.severity === 'high' ? '#ff8c42' : '#5e81f4',
            animation: 'shrink 6s linear forwards',
          }}
        />
        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      </div>

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0 mt-1">
              {(alert.severity === 'critical' || alert.severity === 'high') && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: alert.severity === 'critical' ? '#ff3b5c' : '#ff8c42' }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: alert.severity === 'critical' ? '#ff3b5c' : alert.severity === 'high' ? '#ff8c42' : alert.severity === 'medium' ? '#ffd166' : '#06d6a0' }}
              />
            </span>
            <span className="text-[10px] font-semibold text-[var(--c-text-secondary)] uppercase tracking-wider">
              New Alert Injected
            </span>
          </div>
          <button
            onClick={dismiss}
            className="w-5 h-5 rounded flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Alert title */}
        <p className="text-sm font-semibold text-[var(--c-text-primary)] leading-snug mb-2">{alert.title}</p>

        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${severityBg[alert.severity]} ${severityColor[alert.severity]}`}>
            {alert.severity.toUpperCase()}
          </span>
          <span
            className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
            style={{ color: riskBarColor(alert.risk_score), background: `${riskBarColor(alert.risk_score)}18` }}
          >
            Risk {alert.risk_score}
          </span>
          {alert.mitre?.[0] && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--c-accent)]/10 text-[var(--c-accent)] border border-[#5e81f4]/20">
              {alert.mitre[0].technique_id}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {alert.source_ip && (
            <span className="text-[#4cc9f0]">{alert.source_ip}</span>
          )}
          {alert.country && alert.country !== 'Internal' && (
            <span className="text-[var(--c-text-secondary)]">{alert.country}</span>
          )}
          {alert.host && (
            <span className="text-[var(--c-text-secondary)]">→ {alert.host}</span>
          )}
        </div>
      </div>
    </div>
  )
}

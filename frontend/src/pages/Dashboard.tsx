import { useEffect, useState, useRef } from 'react'
import type { Alert, Stats } from '../types'
import { usePageTour } from '../hooks/usePageTour'
import StatCard from '../components/dashboard/StatCard'
import LiveFeed from '../components/dashboard/LiveFeed'
import ThreatBarChart from '../components/dashboard/ThreatBarChart'
import SeverityDonut from '../components/dashboard/SeverityDonut'
import TopThreats from '../components/dashboard/TopThreats'

type StreamStatus = 'connecting' | 'live' | 'reconnecting'

const EMPTY_STATS: Stats = {
  total_alerts: 0, open_alerts: 0, critical_alerts: 0, high_alerts: 0,
  medium_alerts: 0, low_alerts: 0, resolved_today: 0, avg_risk_score: 0,
  top_alert_types: [], alerts_by_hour: Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`, count: 0,
  })),
}

const BASE = import.meta.env.VITE_API_URL || '/api'

export default function Dashboard({ refreshKey }: { refreshKey: number }) {
  usePageTour('dashboard')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('connecting')
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set())
  const prevIds = useRef<Set<string>>(new Set())
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setStreamStatus('connecting')
    const es = new EventSource(`${BASE}/stream/dashboard`)

    es.onopen = () => setStreamStatus('live')

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as { stats: Stats; alerts: Alert[] }
      setStats(data.stats)

      const incoming = data.alerts
      const incomingIds = new Set(incoming.map(a => a.id))
      const fresh = new Set([...incomingIds].filter(id => !prevIds.current.has(id)))

      if (fresh.size > 0 && prevIds.current.size > 0) {
        if (flashTimer.current) clearTimeout(flashTimer.current)
        setNewAlertIds(fresh)
        flashTimer.current = setTimeout(() => setNewAlertIds(new Set()), 2500)
      }

      prevIds.current = incomingIds
      setAlerts(incoming)
      setLoading(false)
    }

    es.onerror = () => {
      setStreamStatus('reconnecting')
      // EventSource auto-reconnects — status resets on next onopen
    }

    return () => {
      es.close()
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [refreshKey])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#5e81f4] border-t-transparent animate-spin" />
          <p className="text-xs text-[var(--c-text-secondary)]">Loading threat data…</p>
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'open')

  return (
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 min-h-full">
      {/* Stream status bar */}
      <div className="flex items-center gap-2">
        {streamStatus === 'live' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06d6a0]" />
            </span>
            <span className="text-[10px] font-mono text-[#06d6a0] uppercase tracking-widest">Live stream</span>
          </>
        )}
        {streamStatus === 'connecting' && (
          <>
            <div className="w-2 h-2 rounded-full border border-[var(--c-text-muted)] animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--c-text-muted)] uppercase tracking-widest">Connecting…</span>
          </>
        )}
        {streamStatus === 'reconnecting' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffd166] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffd166]" />
            </span>
            <span className="text-[10px] font-mono text-[#ffd166] uppercase tracking-widest">Reconnecting…</span>
          </>
        )}
        <span className="ml-auto text-[10px] font-mono text-[var(--c-text-muted)]">
          {streamStatus === 'live' ? 'updates every 3s' : ''}
        </span>
      </div>

      {/* Critical banner */}
      {criticalAlerts.length > 0 && (
        <div data-tour="critical-banner" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#ff3b5c]/40 bg-[#ff3b5c]/5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b5c] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff3b5c]" />
          </span>
          <p className="text-sm text-[#ff3b5c] font-medium">
            {criticalAlerts.length} critical {criticalAlerts.length === 1 ? 'threat requires' : 'threats require'} immediate attention
          </p>
          <span className="hidden sm:inline ml-auto text-xs text-[#ff3b5c]/60 font-mono truncate max-w-[200px]">
            {criticalAlerts[0]?.title}
          </span>
        </div>
      )}

      {/* KPI row */}
      <div data-tour="kpi-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Alerts"
          value={stats.total_alerts}
          sub="last 24h"
          color="#5e81f4"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <StatCard
          label="Open"
          value={stats.open_alerts}
          sub="unresolved"
          color="#ff8c42"
          pulse
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></svg>}
        />
        <StatCard
          label="Critical"
          value={stats.critical_alerts}
          sub="severity"
          color="#ff3b5c"
          pulse={stats.critical_alerts > 0}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
        />
        <StatCard
          label="High"
          value={stats.high_alerts}
          color="#ff8c42"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved_today}
          sub="today"
          color="#06d6a0"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Avg Risk"
          value={stats.avg_risk_score}
          sub="score / 100"
          color="#ffd166"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Chart: Alerts by Hour — spans 2 cols */}
        <div data-tour="bar-chart" className="lg:col-span-2 rounded-xl bg-[var(--c-bg-surface)] border border-[var(--c-border)] p-4" style={{ height: 220 }}>
          <ThreatBarChart stats={stats} />
        </div>

        {/* Donut */}
        <div data-tour="donut-chart" className="rounded-xl bg-[var(--c-bg-surface)] border border-[var(--c-border)] p-4" style={{ height: 220 }}>
          <SeverityDonut stats={stats} />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Live Feed — spans 2 cols */}
        <div data-tour="live-feed" className="lg:col-span-2 rounded-xl bg-[var(--c-bg-surface)] border border-[var(--c-border)] p-4" style={{ minHeight: 360 }}>
          <LiveFeed alerts={alerts} newAlertIds={newAlertIds} />
        </div>

        {/* Top Threats */}
        <div data-tour="top-threats" className="rounded-xl bg-[var(--c-bg-surface)] border border-[var(--c-border)] p-4">
          <TopThreats stats={stats} />
        </div>
      </div>
    </div>
  )
}

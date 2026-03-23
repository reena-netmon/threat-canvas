import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import type { Alert } from '../types'
import ReactECharts from 'echarts-for-react'
import { riskBarColor, relativeTime } from '../utils/severity'
import { usePageTour } from '../hooks/usePageTour'
import { useTheme } from '../contexts/ThemeContext'

const GEO_COLORS: Record<string, string> = {
  Russia: '#ff3b5c', China: '#ff8c42', Iran: '#ff3b5c', Romania: '#ffd166',
  Netherlands: '#4cc9f0', Ukraine: '#ffd166', Germany: '#06d6a0',
  'United States': '#5e81f4', Internal: 'var(--c-text-secondary)',
}

function IpCard({ alert }: { alert: Alert }) {
  const color = GEO_COLORS[alert.country ?? ''] ?? 'var(--c-text-secondary)'
  return (
    <div
      className="p-3 rounded-xl border bg-bg-base border-border hover:border-border-bright transition-all duration-150 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-mono font-semibold text-text-primary">{alert.source_ip}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[10px]" style={{ color }}>{alert.country ?? 'Unknown'}</span>
            {alert.city && <span className="text-[10px] text-text-muted">{alert.city}</span>}
          </div>
        </div>
        <span
          className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
          style={{ color: riskBarColor(alert.risk_score), background: `${riskBarColor(alert.risk_score)}18` }}
        >
          {alert.risk_score}
        </span>
      </div>
      <p className="text-[10px] text-text-secondary line-clamp-1">{alert.title}</p>
      <p className="text-[10px] text-text-muted font-mono mt-1">{relativeTime(alert.timestamp)}</p>
    </div>
  )
}

export default function Intel() {
  usePageTour('intel')
  const { theme } = useTheme()
  const dark = theme.startsWith('dark')

  const cc = {
    bgBase:     dark ? '#0a0e1a' : '#eef1fb',
    bgElevated: dark ? '#141d35' : '#f4f6ff',
    border:     dark ? '#1e2d4a' : '#d0d8f0',
    borderBright: dark ? '#2a3f6b' : '#a8b4d8',
    textPrimary:   dark ? '#e8eaf6' : '#111827',
    textSecondary: dark ? '#8892b0' : '#4b5563',
    textMuted:     dark ? '#4a5568' : '#9ca3af',
    accent:      dark ? '#5e81f4' : '#4a70ee',
    accentAlpha: dark ? '#5e81f440' : '#4a70ee40',
  }

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

  useEffect(() => { load() }, [load])

  // Unique IPs with highest risk
  const ipMap = new Map<string, Alert>()
  for (const a of alerts) {
    if (a.source_ip) {
      const existing = ipMap.get(a.source_ip)
      if (!existing || a.risk_score > existing.risk_score) ipMap.set(a.source_ip, a)
    }
  }
  const uniqueIps = Array.from(ipMap.values()).sort((a, b) => b.risk_score - a.risk_score)

  // Country distribution for treemap
  const countryCount: Record<string, number> = {}
  for (const a of alerts) {
    const c = a.country ?? 'Unknown'
    countryCount[c] = (countryCount[c] ?? 0) + 1
  }
  const treeData = Object.entries(countryCount)
    .filter(([c]) => c !== 'Internal')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value, itemStyle: { color: GEO_COLORS[name] ?? '#5e81f4' } }))

  const treeOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: cc.bgElevated,
      borderColor: cc.borderBright,
      textStyle: { color: cc.textPrimary, fontSize: 11 },
      formatter: (p: { name: string; value: number }) => `<b>${p.name}</b>: ${p.value} alerts`,
    },
    series: [{
      type: 'treemap',
      data: treeData,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: { show: true, fontSize: 11, color: cc.textPrimary, fontFamily: 'Inter' },
      itemStyle: { borderColor: cc.bgBase, borderWidth: 2, gapWidth: 2 },
      levels: [{ itemStyle: { borderWidth: 0 } }],
    }],
  }

  // Severity trend over 24h
  const hourSeverity: Record<number, Record<string, number>> = {}
  for (let h = 0; h < 24; h++) hourSeverity[h] = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const a of alerts) {
    try {
      const h = new Date(a.timestamp).getHours()
      if (hourSeverity[h] && a.severity in hourSeverity[h]) hourSeverity[h][a.severity]++
    } catch {}
  }
  const hours24 = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}`)

  const severityTrendOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: cc.bgElevated, borderColor: cc.borderBright, textStyle: { color: cc.textPrimary, fontSize: 11 } },
    legend: { data: ['critical', 'high', 'medium', 'low'], textStyle: { color: cc.textSecondary, fontSize: 10 }, icon: 'circle', itemWidth: 8, itemHeight: 8, top: 0, right: 0 },
    grid: { top: 28, right: 8, bottom: 20, left: 32 },
    xAxis: { type: 'category', data: hours24, axisLabel: { color: cc.textMuted, fontSize: 9, interval: 3 }, axisLine: { lineStyle: { color: cc.border } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: cc.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: cc.border } } },
    series: [
      { name: 'critical', type: 'bar', stack: 'sev', data: Array.from({ length: 24 }, (_, h) => hourSeverity[h].critical), itemStyle: { color: '#ff3b5c' } },
      { name: 'high',     type: 'bar', stack: 'sev', data: Array.from({ length: 24 }, (_, h) => hourSeverity[h].high),     itemStyle: { color: '#ff8c42' } },
      { name: 'medium',   type: 'bar', stack: 'sev', data: Array.from({ length: 24 }, (_, h) => hourSeverity[h].medium),   itemStyle: { color: '#ffd166' } },
      { name: 'low',      type: 'bar', stack: 'sev', data: Array.from({ length: 24 }, (_, h) => hourSeverity[h].low),      itemStyle: { color: '#06d6a0' }, barMaxWidth: 20 },
    ],
  }

  // Alert type distribution (donut)
  const typeCount: Record<string, number> = {}
  for (const a of alerts) {
    const t = a.alert_type.replace(/_/g, ' ')
    typeCount[t] = (typeCount[t] ?? 0) + 1
  }
  const DONUT_COLORS = ['#ff3b5c', '#ff8c42', '#ffd166', cc.accent, '#4cc9f0', '#06d6a0', '#a78bfa', cc.textSecondary]
  const alertTypeData = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, value], i) => ({ name, value, itemStyle: { color: DONUT_COLORS[i] } }))

  const alertTypeOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: cc.bgElevated, borderColor: cc.borderBright, textStyle: { color: cc.textPrimary, fontSize: 11 },
      formatter: (p: { name: string; value: number; percent: number }) => `${p.name}<br/><b>${p.value}</b> (${p.percent}%)`,
    },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '55%'],
      data: alertTypeData,
      label: { color: cc.textSecondary, fontSize: 9, formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: cc.border } },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.25)' } },
    }],
  }

  // Top targeted hosts
  const hostCount: Record<string, number> = {}
  for (const a of alerts) { if (a.host) hostCount[a.host] = (hostCount[a.host] ?? 0) + 1 }
  const topHosts = Object.entries(hostCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const topHostsOption = {
    backgroundColor: 'transparent',
    grid: { top: 4, bottom: 4, left: 8, right: 40, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', data: topHosts.map(([h]) => h).reverse(), axisLabel: { color: cc.textSecondary, fontSize: 10, fontFamily: 'monospace' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{ type: 'bar', data: topHosts.map(([, c]) => c).reverse(), itemStyle: { color: '#ff8c42', borderRadius: [0, 3, 3, 0] }, label: { show: true, position: 'right', color: cc.textMuted, fontSize: 10, fontFamily: 'monospace' }, barMaxWidth: 14 }],
    tooltip: { backgroundColor: cc.bgElevated, borderColor: cc.borderBright, textStyle: { color: cc.textPrimary, fontSize: 11 } },
  }

  // Top targeted users
  const userCount: Record<string, number> = {}
  for (const a of alerts) { if (a.user) userCount[a.user] = (userCount[a.user] ?? 0) + 1 }
  const topUsers = Object.entries(userCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const topUsersOption = {
    backgroundColor: 'transparent',
    grid: { top: 4, bottom: 4, left: 8, right: 40, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', data: topUsers.map(([u]) => u).reverse(), axisLabel: { color: cc.textSecondary, fontSize: 10, fontFamily: 'monospace' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{ type: 'bar', data: topUsers.map(([, c]) => c).reverse(), itemStyle: { color: '#4cc9f0', borderRadius: [0, 3, 3, 0] }, label: { show: true, position: 'right', color: cc.textMuted, fontSize: 10, fontFamily: 'monospace' }, barMaxWidth: 14 }],
    tooltip: { backgroundColor: cc.bgElevated, borderColor: cc.borderBright, textStyle: { color: cc.textPrimary, fontSize: 11 } },
  }

  // MITRE coverage
  const mitreCount: Record<string, number> = {}
  for (const a of alerts) {
    for (const m of a.mitre ?? []) {
      mitreCount[m.tactic] = (mitreCount[m.tactic] ?? 0) + 1
    }
  }
  const mitreTactics = Object.entries(mitreCount).sort((a, b) => b[1] - a[1])

  const mitreOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: cc.bgElevated,
      borderColor: cc.borderBright,
      textStyle: { color: cc.textPrimary, fontSize: 11 },
    },
    grid: { top: 8, right: 16, bottom: 8, left: 16, containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: cc.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: cc.border } } },
    yAxis: {
      type: 'category',
      data: mitreTactics.map(([t]) => t),
      axisLabel: { color: cc.textSecondary, fontSize: 10, fontFamily: 'Inter' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: mitreTactics.map(([, c]) => c),
      barMaxWidth: 14,
      itemStyle: {
        borderRadius: [0, 3, 3, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: cc.accentAlpha }, { offset: 1, color: cc.accent }] },
      },
    }],
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--c-accent)] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      {/* Top row: treemap + MITRE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div data-tour="intel-treemap" className="rounded-xl bg-bg-surface border border-border p-4" style={{ height: 260 }}>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Attack Origin by Country</h2>
          <ReactECharts option={treeOption} style={{ height: 'calc(100% - 28px)' }} />
        </div>
        <div data-tour="intel-mitre" className="rounded-xl bg-bg-surface border border-border p-4" style={{ height: 260 }}>
          <h2 className="text-sm font-semibold text-text-primary mb-3">MITRE ATT&CK Coverage</h2>
          <ReactECharts option={mitreOption} style={{ height: 'calc(100% - 28px)' }} />
        </div>
      </div>

      {/* Severity trend + Alert type donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl bg-bg-surface border border-border p-4" style={{ height: 240 }}>
          <h2 className="text-sm font-semibold text-text-primary mb-0">Severity Trend — 24h</h2>
          <ReactECharts option={severityTrendOption} style={{ height: 'calc(100% - 20px)' }} opts={{ renderer: 'svg' }} />
        </div>
        <div className="rounded-xl bg-bg-surface border border-border p-4" style={{ height: 240 }}>
          <h2 className="text-sm font-semibold text-text-primary mb-0">Alert Types</h2>
          <ReactECharts option={alertTypeOption} style={{ height: 'calc(100% - 20px)' }} opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* Top targeted hosts + users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl bg-bg-surface border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Top Targeted Hosts</h2>
          <ReactECharts option={topHostsOption} style={{ height: Math.max(120, topHosts.length * 26 + 8) }} opts={{ renderer: 'svg' }} />
        </div>
        <div className="rounded-xl bg-bg-surface border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Top Targeted Users</h2>
          <ReactECharts option={topUsersOption} style={{ height: Math.max(120, topUsers.length * 26 + 8) }} opts={{ renderer: 'svg' }} />
        </div>
      </div>

      {/* IoC grid */}
      <div data-tour="intel-ioc" className="rounded-xl bg-bg-surface border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Threat Indicators (IoC)</h2>
          <span className="text-xs text-text-secondary font-mono">{uniqueIps.length} unique IPs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {uniqueIps.slice(0, 20).map(a => (
            <IpCard key={a.source_ip} alert={a} />
          ))}
        </div>
      </div>
    </div>
  )
}

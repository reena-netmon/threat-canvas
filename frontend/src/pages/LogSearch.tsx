import { useEffect, useState, useCallback, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { api } from '../api/client'
import type { LogEntry, LogsMeta, LogStats } from '../types'
import { usePageTour } from '../hooks/usePageTour'

const SEV_COLOR: Record<string, { text: string; bg: string }> = {
  CRITICAL: { text: '#ff3b5c', bg: '#ff3b5c12' },
  ERROR:    { text: '#ff8c42', bg: '#ff8c4212' },
  WARNING:  { text: '#ffd166', bg: '#ffd16612' },
  INFO:     { text: '#4cc9f0', bg: '#4cc9f012' },
  DEBUG:    { text: 'var(--c-text-secondary)', bg: 'rgba(136,146,176,0.07)' },
}

const STREAM_COLORS: Record<string, string> = {
  'palo-alto-fw-01':    '#ff8c42',
  'crowdstrike-falcon': '#ff3b5c',
  'bind-dns-internal':  '#4cc9f0',
  'zscaler-proxy':      '#5e81f4',
  'okta-sso':           '#ffd166',
  'aws-cloudtrail':     '#ff8c42',
  'snort-ids-dmz':      '#ff3b5c',
  'splunk-correlation':  '#5e81f4',
  'cisco-anyconnect':   '#06d6a0',
  'symantec-dlp':       '#ffd166',
  'proofpoint-tap':     '#4cc9f0',
  'cloudflare-waf':     '#f97316',
  'k8s-audit-log':      '#a78bfa',
  'oracle-db-audit':    '#34d399',
  'ms-defender-atp':    '#60a5fa',
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-[#ffd166]/25 text-[#ffd166] rounded px-0.5">{p}</mark>
          : p
      )}
    </span>
  )
}

function StreamBadge({ stream }: { stream: string }) {
  const color = STREAM_COLORS[stream] ?? 'var(--c-text-secondary)'
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
      style={{ color, background: `${color}12`, borderColor: `${color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {stream}
    </span>
  )
}

// ── JSON Viewer ───────────────────────────────────────────────────────────────

type JsonPrimitive = string | number | boolean | null
type JsonVal = JsonPrimitive | JsonVal[] | { [k: string]: JsonVal }

function JsonValue({ value, depth = 0 }: { value: JsonVal; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1)
  const indent = depth * 16

  if (value === null) return <span style={{ color: 'var(--c-text-muted)' }}>null</span>
  if (typeof value === 'boolean') return <span style={{ color: '#a78bfa' }}>{String(value)}</span>
  if (typeof value === 'number') return <span style={{ color: '#ff8c42' }}>{value}</span>
  if (typeof value === 'string') return <span style={{ color: '#06d6a0' }}>"{value}"</span>

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: 'var(--c-text-primary)' }}>[]</span>
    return (
      <span>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: 'var(--c-text-primary)', fontFamily: 'inherit', fontSize: 'inherit', background: 'none', border: 'none', padding: 0 }}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        {' '}
        <span style={{ color: 'var(--c-border-bright)' }}>[</span>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="cursor-pointer hover:opacity-70 transition-opacity text-[10px] px-1.5 py-0 rounded ml-1 mr-1"
            style={{ color: 'var(--c-text-muted)', background: 'var(--c-bg-hover)', border: '1px solid var(--c-border)', fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            {value.length} items
          </button>
        ) : (
          <div style={{ marginLeft: indent + 16 }}>
            {value.map((item, i) => (
              <div key={i} style={{ marginTop: 1 }}>
                <span style={{ color: 'var(--c-text-muted)', userSelect: 'none' }}>{i}{' '}</span>
                <JsonValue value={item} depth={depth + 1} />
                {i < value.length - 1 && <span style={{ color: 'var(--c-border-bright)' }}>,</span>}
              </div>
            ))}
          </div>
        )}
        {!collapsed && <div style={{ marginLeft: indent }}><span style={{ color: 'var(--c-border-bright)' }}>]</span></div>}
        {collapsed && <span style={{ color: 'var(--c-border-bright)' }}>]</span>}
      </span>
    )
  }

  // Object
  const keys = Object.keys(value as Record<string, JsonVal>)
  if (keys.length === 0) return <span style={{ color: 'var(--c-text-primary)' }}>{'{}'}</span>
  return (
    <span>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="cursor-pointer hover:opacity-70 transition-opacity"
        style={{ color: 'var(--c-text-primary)', fontFamily: 'inherit', fontSize: 'inherit', background: 'none', border: 'none', padding: 0 }}
      >
        {collapsed ? '▶' : '▼'}
      </button>
      {' '}
      <span style={{ color: 'var(--c-border-bright)' }}>{'{'}</span>
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="cursor-pointer hover:opacity-70 transition-opacity text-[10px] px-1.5 py-0 rounded ml-1 mr-1"
          style={{ color: 'var(--c-text-muted)', background: 'var(--c-bg-hover)', border: '1px solid var(--c-border)', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          {keys.length} keys
        </button>
      ) : (
        <div style={{ marginLeft: indent + 16 }}>
          {keys.map((k, i) => (
            <div key={k} style={{ marginTop: 1 }}>
              <span style={{ color: 'var(--c-text-secondary)' }}>"{k}"</span>
              <span style={{ color: 'var(--c-border-bright)' }}>: </span>
              <JsonValue value={(value as Record<string, JsonVal>)[k]} depth={depth + 1} />
              {i < keys.length - 1 && <span style={{ color: 'var(--c-border-bright)' }}>,</span>}
            </div>
          ))}
        </div>
      )}
      {!collapsed && <div style={{ marginLeft: indent }}><span style={{ color: 'var(--c-border-bright)' }}>{'}'}</span></div>}
      {collapsed && <span style={{ color: 'var(--c-border-bright)' }}>{'}'}</span>}
    </span>
  )
}

function JsonViewer({ data }: { data: unknown }) {
  const [mode, setMode] = useState<'tree' | 'raw'>('tree')
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border-bright)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--c-bg-hover)', borderBottom: '1px solid var(--c-border-bright)' }}>
        <div className="flex items-center gap-1">
          {(['tree', 'raw'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="text-[10px] font-mono px-2.5 py-0.5 rounded transition-colors cursor-pointer capitalize"
              style={{
                color: mode === m ? 'var(--c-accent)' : 'var(--c-text-muted)',
                background: mode === m ? 'var(--c-accent-15)' : 'transparent',
                border: `1px solid ${mode === m ? 'var(--c-accent-border)' : 'transparent'}`,
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer"
          style={{ color: copied ? '#06d6a0' : 'var(--c-text-muted)', border: '1px solid var(--c-border)' }}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M20 6L9 17l-5-5" /></svg>
              copied
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              copy
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 overflow-x-auto" style={{ background: 'var(--c-bg-elevated)' }}>
        {mode === 'raw' ? (
          <pre className="text-[11px] font-mono leading-relaxed" style={{ color: '#06d6a0' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="text-[11px] font-mono leading-relaxed">
            <JsonValue value={data as JsonVal} depth={0} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function LogRow({ log, query, onClick, isExpanded }: {
  log: LogEntry; query: string; onClick: () => void; isExpanded: boolean
}) {
  const sev = SEV_COLOR[log.severity] ?? SEV_COLOR.DEBUG
  const ts = new Date(log.timestamp)
  const timeStr = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <>
      <tr
        onClick={onClick}
        className={`group border-b border-[var(--c-border)] cursor-pointer transition-colors duration-100
          ${isExpanded ? 'bg-[var(--c-bg-elevated)]' : 'hover:bg-[var(--c-bg-surface)]'}`}
      >
        {/* Timestamp */}
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="text-[10px] font-mono text-[var(--c-text-secondary)]">{dateStr}</div>
          <div className="text-[10px] font-mono text-[var(--c-text-muted)]">{timeStr}</div>
        </td>

        {/* Severity */}
        <td className="px-3 py-2 whitespace-nowrap">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
            style={{ color: sev.text, background: sev.bg }}
          >
            {log.severity}
          </span>
        </td>

        {/* Data stream */}
        <td className="px-3 py-2 whitespace-nowrap">
          <StreamBadge stream={log.data_stream} />
        </td>

        {/* Event type */}
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="text-[11px] font-mono text-[var(--c-text-secondary)]">{log.event_type}</span>
        </td>

        {/* Source IP */}
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="text-[11px] font-mono text-[#4cc9f0]">
            <HighlightText text={log.source_ip} query={query} />
          </span>
        </td>

        {/* Host */}
        <td className="px-3 py-2 whitespace-nowrap">
          <span className="text-[11px] font-mono text-[var(--c-text-bright)]">
            <HighlightText text={log.host} query={query} />
          </span>
        </td>

        {/* User */}
        <td className="px-3 py-2 whitespace-nowrap max-w-[110px]">
          {log.user
            ? <span className="text-[11px] font-mono text-[var(--c-text-secondary)] truncate block">
                <HighlightText text={log.user} query={query} />
              </span>
            : <span className="text-[10px] text-[var(--c-border-bright)]">—</span>
          }
        </td>

        {/* Message */}
        <td className="px-3 py-2 max-w-xs xl:max-w-lg">
          <p className="text-[11px] font-mono text-[var(--c-text-secondary)] truncate">
            <HighlightText text={log.message} query={query} />
          </p>
        </td>

        {/* Expand */}
        <td className="px-2 py-2 text-center">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`w-3 h-3 text-[var(--c-border-bright)] group-hover:text-[var(--c-text-secondary)] transition-transform duration-200 inline-block
              ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Expanded JSON viewer */}
      {isExpanded && (
        <tr className="bg-[var(--c-bg-base)]">
          <td colSpan={9} className="px-6 py-4 border-b border-[var(--c-border)]">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-mono">Event Data</span>
              <StreamBadge stream={log.data_stream} />
              <span className="ml-auto text-[10px] font-mono text-[var(--c-text-muted)]">{log.id}</span>
            </div>
            <JsonViewer data={log.raw} />
          </td>
        </tr>
      )}
    </>
  )
}

const SEV_CHART_COLORS: Record<string, string> = {
  CRITICAL: '#ff3b5c', ERROR: '#ff8c42', WARNING: '#ffd166', INFO: '#4cc9f0', DEBUG: 'var(--c-text-secondary)',
}

function LogVizPanel({ stats }: { stats: LogStats }) {
  const hourOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, bottom: 24, left: 36, right: 8 },
    xAxis: {
      type: 'category',
      data: stats.by_hour.map(h => h.hour.slice(0, 2)),
      axisLabel: { color: 'var(--c-text-muted)', fontSize: 9, interval: 5 },
      axisLine: { lineStyle: { color: 'var(--c-border)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'var(--c-text-muted)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'var(--c-bg-hover)' } },
    },
    series: [{
      type: 'bar',
      data: stats.by_hour.map(h => h.count),
      itemStyle: { color: 'var(--c-accent)', borderRadius: [2, 2, 0, 0] },
      emphasis: { itemStyle: { color: '#7c9bf8' } },
    }],
    tooltip: { trigger: 'axis', backgroundColor: 'var(--c-bg-elevated)', borderColor: 'var(--c-border-bright)', textStyle: { color: 'var(--c-text-primary)', fontSize: 11 } },
  }

  const sevOption = {
    backgroundColor: 'transparent',
    grid: { top: 4, bottom: 4, left: 80, right: 40 },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: stats.by_severity.map(s => s.severity),
      axisLabel: { color: 'var(--c-text-secondary)', fontSize: 10, fontFamily: 'monospace' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: stats.by_severity.map(s => ({
        value: s.count,
        itemStyle: { color: SEV_CHART_COLORS[s.severity] ?? 'var(--c-text-secondary)', borderRadius: [0, 3, 3, 0] },
      })),
      label: { show: true, position: 'right', color: 'var(--c-text-muted)', fontSize: 10, fontFamily: 'monospace' },
      barMaxWidth: 16,
    }],
    tooltip: { trigger: 'axis', backgroundColor: 'var(--c-bg-elevated)', borderColor: 'var(--c-border-bright)', textStyle: { color: 'var(--c-text-primary)', fontSize: 11 } },
  }

  const streamOption = {
    backgroundColor: 'transparent',
    grid: { top: 4, bottom: 4, left: 130, right: 40 },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: stats.by_stream.map(s => s.stream),
      axisLabel: { color: 'var(--c-text-secondary)', fontSize: 9, fontFamily: 'monospace' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: stats.by_stream.map(s => ({
        value: s.count,
        itemStyle: { color: STREAM_COLORS[s.stream] ?? 'var(--c-accent)', borderRadius: [0, 3, 3, 0] },
      })),
      label: { show: true, position: 'right', color: 'var(--c-text-muted)', fontSize: 10, fontFamily: 'monospace' },
      barMaxWidth: 12,
    }],
    tooltip: { trigger: 'axis', backgroundColor: 'var(--c-bg-elevated)', borderColor: 'var(--c-border-bright)', textStyle: { color: 'var(--c-text-primary)', fontSize: 11 } },
  }

  const eventOption = {
    backgroundColor: 'transparent',
    grid: { top: 4, bottom: 4, left: 130, right: 40 },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: stats.by_event_type.map(e => e.type),
      axisLabel: { color: 'var(--c-text-secondary)', fontSize: 9, fontFamily: 'monospace' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: stats.by_event_type.map(e => ({
        value: e.count,
        itemStyle: { color: '#06d6a0', borderRadius: [0, 3, 3, 0] },
      })),
      label: { show: true, position: 'right', color: 'var(--c-text-muted)', fontSize: 10, fontFamily: 'monospace' },
      barMaxWidth: 12,
    }],
    tooltip: { trigger: 'axis', backgroundColor: 'var(--c-bg-elevated)', borderColor: 'var(--c-border-bright)', textStyle: { color: 'var(--c-text-primary)', fontSize: 11 } },
  }

  const streamH = Math.max(120, stats.by_stream.length * 22 + 16)
  const eventH = Math.max(120, stats.by_event_type.length * 22 + 16)
  const sevH = Math.max(80, stats.by_severity.length * 28 + 16)

  function ChartCard({ title, children, colSpan }: { title: string; children: React.ReactNode; colSpan?: string }) {
    const [open, setOpen] = useState(true)
    return (
      <div className={`rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden ${colSpan ?? ''}`}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--c-bg-elevated)] transition-colors cursor-pointer group"
        >
          <span className="text-[10px] text-[var(--c-text-muted)] group-hover:text-[var(--c-text-secondary)] uppercase tracking-wider font-mono transition-colors">{title}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`w-3 h-3 text-[var(--c-border-bright)] group-hover:text-[var(--c-text-muted)] transition-transform duration-200 ${open ? '' : '-rotate-90'}`}>
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && <div className="px-3 pb-3">{children}</div>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <ChartCard title="Activity — 24h" colSpan="lg:col-span-3">
        <ReactECharts option={hourOption} style={{ height: 100 }} opts={{ renderer: 'svg' }} />
      </ChartCard>

      {/* <ChartCard title="By Severity">
        <ReactECharts option={sevOption} style={{ height: sevH }} opts={{ renderer: 'svg' }} />
      </ChartCard>

      <ChartCard title="Top Data Streams">
        <ReactECharts option={streamOption} style={{ height: streamH }} opts={{ renderer: 'svg' }} />
      </ChartCard>

      <ChartCard title="Top Event Types">
        <ReactECharts option={eventOption} style={{ height: eventH }} opts={{ renderer: 'svg' }} />
      </ChartCard> */}
    </div>
  )
}

const PAGE_SIZE = 50

export default function LogSearch() {
  usePageTour('logs')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [meta, setMeta] = useState<LogsMeta | null>(null)
  const [logStats, setLogStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [showViz, setShowViz] = useState(true)

  const [query, setQuery] = useState('')
  const [dataStream, setDataStream] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [eventType, setEventType] = useState('')
  const [severity, setSeverity] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { api.getLogsMeta().then(r => setMeta(r.data)) }, [])

  const doSearch = useCallback(async (p = 0) => {
    setLoading(true)
    const params = {
      q: query || undefined,
      data_stream: dataStream || undefined,
      source_type: sourceType || undefined,
      event_type: eventType || undefined,
      severity: severity || undefined,
    }
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.searchLogs({ ...params, limit: PAGE_SIZE, offset: p * PAGE_SIZE }),
        api.getLogStats(params),
      ])
      setLogs(logsRes.data.logs)
      setTotal(logsRes.data.total)
      setLogStats(statsRes.data)
      setPage(p)
      setExpandedId(null)
    } finally {
      setLoading(false)
    }
  }, [query, dataStream, sourceType, eventType, severity])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(0), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [doSearch])

  function clearFilters() {
    setQuery(''); setDataStream(''); setSourceType(''); setEventType(''); setSeverity('')
  }

  const hasFilters = query || dataStream || sourceType || eventType || severity
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Stream pills (top 15)
  const streamCounts: Record<string, number> = {}
  for (const l of logs) streamCounts[l.data_stream] = (streamCounts[l.data_stream] ?? 0) + 1

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-3 sm:gap-4">
      {/* Search bar */}
      <div className="flex flex-col gap-3">
        <div data-tour="log-search-bar" className="relative flex items-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="absolute left-3.5 w-4 h-4 text-[var(--c-text-muted)] pointer-events-none">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search logs… (IP, host, user, event type, message)"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--c-bg-surface)] border border-[var(--c-border)] focus:border-[var(--c-accent)] focus:outline-none text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-muted)] font-mono transition-colors"
          />
          {loading && (
            <div className="absolute right-3.5 w-4 h-4 rounded-full border-2 border-[#5e81f4] border-t-transparent animate-spin" />
          )}
        </div>

        {/* Filter row */}
        <div data-tour="log-filters" className="flex items-center gap-2 flex-wrap">
          <select
            value={dataStream}
            onChange={e => setDataStream(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--c-bg-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text-secondary)] focus:border-[var(--c-accent)] focus:outline-none cursor-pointer"
          >
            <option value="">All Streams</option>
            {meta?.data_streams.map(s => (
              <option key={s} value={s} style={{ color: STREAM_COLORS[s] ?? 'var(--c-text-secondary)' }}>{s}</option>
            ))}
          </select>

          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--c-bg-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text-secondary)] focus:border-[var(--c-accent)] focus:outline-none cursor-pointer"
          >
            <option value="">All Severities</option>
            {meta?.severities.map(s => (
              <option key={s} value={s} style={{ color: SEV_COLOR[s]?.text }}>{s}</option>
            ))}
          </select>

          <select
            value={sourceType}
            onChange={e => setSourceType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--c-bg-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text-secondary)] focus:border-[var(--c-accent)] focus:outline-none cursor-pointer"
          >
            <option value="">All Sources</option>
            {meta?.source_types.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--c-bg-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text-secondary)] focus:border-[var(--c-accent)] focus:outline-none cursor-pointer"
          >
            <option value="">All Event Types</option>
            {meta?.event_types.map(et => <option key={et} value={et}>{et}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--c-text-secondary)] hover:text-[var(--c-text-primary)] transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}

          <span className="ml-auto text-xs font-mono text-[var(--c-text-muted)]">
            {total.toLocaleString()} results
          </span>
        </div>

        {/* Stream quick-filter pills */}
        {meta && (
          <div data-tour="log-stream-pills" className="flex items-center gap-1.5 flex-wrap">
            {meta.data_streams.map(s => {
              const color = STREAM_COLORS[s] ?? 'var(--c-text-secondary)'
              const active = dataStream === s
              return (
                <button
                  key={s}
                  onClick={() => setDataStream(active ? '' : s)}
                  className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full border transition-all duration-150 cursor-pointer"
                  style={{
                    color: active ? 'var(--c-bg-base)' : color,
                    background: active ? color : `${color}10`,
                    borderColor: `${color}40`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? 'var(--c-bg-base)' : color }} />
                  {s}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Visualization panel */}
      <div data-tour="log-viz-panel">
        <button
          onClick={() => setShowViz(v => !v)}
          className="flex items-center gap-2 text-[11px] text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] transition-colors cursor-pointer mb-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-3.5 h-3.5 transition-transform duration-200 ${showViz ? 'rotate-90' : ''}`}>
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="font-mono uppercase tracking-wider">Log Visualizations</span>
          {logStats && <span className="text-[var(--c-border-bright)]">({logStats.total.toLocaleString()} events)</span>}
        </button>
        {showViz && logStats && <LogVizPanel stats={logStats} />}
      </div>

      {/* Table */}
      <div data-tour="log-table" className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--c-bg-elevated)] border-b border-[var(--c-border)]">
                {['Timestamp', 'Severity', 'Data Stream', 'Event', 'Src IP', 'Host', 'User', 'Message', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <LogRow
                  key={log.id}
                  log={log}
                  query={query}
                  isExpanded={expandedId === log.id}
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                />
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[var(--c-text-muted)] text-sm">
                    No logs match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--c-border)] bg-[var(--c-bg-surface)] shrink-0">
            <span className="text-xs text-[var(--c-text-muted)] font-mono">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => doSearch(page - 1)}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-lg text-xs border border-[var(--c-border)] text-[var(--c-text-secondary)] hover:border-[var(--c-border-bright)] hover:text-[var(--c-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <button
                    key={p}
                    onClick={() => doSearch(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      p === page
                        ? 'bg-[var(--c-accent)]/20 border border-[var(--c-accent)]/50 text-[var(--c-accent)]'
                        : 'border border-[var(--c-border)] text-[var(--c-text-secondary)] hover:border-[var(--c-border-bright)] hover:text-[var(--c-text-primary)]'
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              })}
              <button
                onClick={() => doSearch(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded-lg text-xs border border-[var(--c-border)] text-[var(--c-text-secondary)] hover:border-[var(--c-border-bright)] hover:text-[var(--c-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

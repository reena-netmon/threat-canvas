import type { Stats } from '../../types'

const TYPE_COLORS: Record<string, string> = {
  ransomware: '#ff3b5c',
  malware: '#ff3b5c',
  lateral_movement: '#ff8c42',
  data_exfiltration: '#ff8c42',
  exploit: '#ff8c42',
  cloud_threat: '#ffd166',
  brute_force: '#ffd166',
  privilege_escalation: '#ffd166',
  insider_threat: '#4cc9f0',
  phishing: '#4cc9f0',
  reconnaissance: '#06d6a0',
  suspicious_script: '#06d6a0',
}

function formatType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function TopThreats({ stats }: { stats: Stats }) {
  const max = Math.max(...stats.top_alert_types.map(t => t.count), 1)

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--c-text-primary)] mb-3">Top Threat Types</h2>
      <div className="space-y-3">
        {stats.top_alert_types.map((t) => {
          const color = TYPE_COLORS[t.type] ?? '#5e81f4'
          const pct = (t.count / max) * 100
          return (
            <div key={t.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--c-text-bright)] font-medium">{formatType(t.type)}</span>
                <span className="text-xs font-mono font-bold" style={{ color }}>{t.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--c-border)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

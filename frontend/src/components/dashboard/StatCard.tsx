interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  pulse?: boolean
  icon: React.ReactNode
}

export default function StatCard({ label, value, sub, color = '#5e81f4', pulse, icon }: StatCardProps) {
  return (
    <div
      className="relative rounded-xl p-4 border overflow-hidden group transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, var(--c-bg-surface) 0%, var(--c-bg-elevated) 100%)`,
        borderColor: `${color}22`,
        boxShadow: `0 0 20px ${color}08`,
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: color }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--c-text-secondary)] uppercase tracking-wider mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color }}>{value}</span>
            {pulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
              </span>
            )}
          </div>
          {sub && <p className="text-xs text-[var(--c-text-secondary)] mt-1">{sub}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

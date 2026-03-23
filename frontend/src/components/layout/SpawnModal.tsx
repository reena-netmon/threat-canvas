import { useState, useEffect, useRef } from 'react'
import { api } from '../../api/client'
import type { Alert } from '../../types'

const ALERT_TEMPLATES = [
  { type: 'random',              label: '🎲 Random',                    desc: 'Pick a random threat scenario' },
  { type: 'brute_force',         label: '🔑 Brute Force Login',          desc: 'Multiple failed auth attempts' },
  { type: 'lateral_movement',    label: '↔️ Lateral Movement',           desc: 'Pass-the-Hash across hosts' },
  { type: 'data_exfiltration',   label: '📤 Data Exfiltration',          desc: 'DNS tunneling exfil detected' },
  { type: 'malware',             label: '🦠 Cobalt Strike Beacon',        desc: 'C2 beacon pattern detected' },
  { type: 'privilege_escalation',label: '⬆️ Privilege Escalation',       desc: 'Sudo abuse outside business hours' },
  { type: 'phishing',            label: '🎣 Phishing Email',             desc: 'Macro-enabled Office attachment' },
  { type: 'ransomware',          label: '💀 Ransomware',                 desc: 'Mass file encryption detected' },
  { type: 'suspicious_script',   label: '⚡ Suspicious PowerShell',      desc: 'Obfuscated encoded payload' },
  { type: 'insider_threat',      label: '🕵️ Insider Threat',            desc: 'Bulk data download pre-resignation' },
  { type: 'reconnaissance',      label: '🔍 Port Scan',                  desc: 'Internal network reconnaissance' },
  { type: 'cloud_threat',        label: '☁️ Cloud Credential Theft',     desc: 'Exposed AWS keys in use' },
  { type: 'exploit',             label: '💥 Zero-Day Exploit',           desc: 'CVE exploit attempt on web app' },
]

const SEV_OPTIONS = [
  { value: 'random', label: 'Random', color: 'var(--c-text-secondary)' },
  { value: 'critical', label: 'Critical', color: '#ff3b5c' },
  { value: 'high', label: 'High', color: '#ff8c42' },
  { value: 'medium', label: 'Medium', color: '#ffd166' },
  { value: 'low', label: 'Low', color: '#06d6a0' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSpawned: (alert: Alert) => void
}

export default function SpawnModal({ open, onClose, onSpawned }: Props) {
  const [selectedType, setSelectedType] = useState('random')
  const [selectedSev, setSelectedSev] = useState('random')
  const [spawning, setSpawning] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSpawn() {
    setSpawning(true)
    try {
      const res = await api.createMockAlert()
      onSpawned(res.data)
      onClose()
    } finally {
      setSpawning(false)
    }
  }

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--c-border-bright)] bg-[var(--c-bg-surface)] shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(94,129,244,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff3b5c]/15 border border-[#ff3b5c]/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff3b5c" strokeWidth="1.5" className="w-4 h-4">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--c-text-primary)]">Spawn Alert</h2>
              <p className="text-[11px] text-[var(--c-text-secondary)]">Inject a simulated threat event</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-hover)] transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Alert type grid */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">Threat Scenario</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {ALERT_TEMPLATES.map(t => (
                <button
                  key={t.type}
                  onClick={() => setSelectedType(t.type)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    selectedType === t.type
                      ? 'bg-[#5e81f4]/15 border-[var(--c-accent)]/50 text-[var(--c-text-primary)]'
                      : 'bg-[var(--c-bg-base)] border-[var(--c-border)] text-[var(--c-text-secondary)] hover:border-[var(--c-border-bright)] hover:text-[var(--c-text-bright)]'
                  }`}
                >
                  <p className="text-xs font-medium leading-tight">{t.label}</p>
                  <p className="text-[10px] text-[var(--c-text-muted)] mt-0.5 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Severity selector */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">Severity Override</p>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              {SEV_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSelectedSev(s.value)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    selectedSev === s.value ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={selectedSev === s.value
                    ? { color: s.color, background: `${s.color}15`, borderColor: `${s.color}50` }
                    : { color: s.color, background: 'transparent', borderColor: `${s.color}30` }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#5e81f4]/8 border border-[#5e81f4]/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="#5e81f4" strokeWidth="1.5" className="w-3.5 h-3.5 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
            </svg>
            <p className="text-[11px] text-[var(--c-text-secondary)] leading-relaxed">
              Alert will be injected with randomised source IPs, affected hosts, and MITRE ATT&CK mappings. It will appear live across all views.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--c-border)] bg-[var(--c-bg-base)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-[var(--c-text-secondary)] border border-[var(--c-border)] hover:border-[var(--c-border-bright)] hover:text-[var(--c-text-primary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSpawn}
            disabled={spawning}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-[#ff3b5c] text-white hover:bg-[#ff5571] active:bg-[#e0334f] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {spawning ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Injecting…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Inject Alert
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

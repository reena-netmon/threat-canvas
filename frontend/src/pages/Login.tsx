import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const DEMO_USERS = [
  { email: 'reena.patil@bloo.io',  role: 'SOC Manager',      avatar: 'RP', color: '#5e81f4' },
  { email: 'alice.chen@bloo.io',   role: 'Tier-1 Analyst',   avatar: 'AC', color: '#4cc9f0' },
  { email: 'bob.martinez@bloo.io', role: 'Tier-2 Analyst',   avatar: 'BM', color: '#06d6a0' },
  { email: 'carol.singh@bloo.io',  role: 'Threat Hunter',    avatar: 'CS', color: '#ffd166' },
  { email: 'dave.kim@bloo.io',     role: 'Forensic Analyst', avatar: 'DK', color: '#ff8c42' },
]

export default function Login() {
  const { login, loading, error, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!email || !password) return
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch { /* error shown via context */ }
  }

  function fillUser(u: typeof DEMO_USERS[0]) {
    setEmail(u.email)
    setPassword('Bloo@2025')
    setTouched(false)
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg-base)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#5e81f4 1px, transparent 1px), linear-gradient(90deg, #5e81f4 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#5e81f4] opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#ff3b5c] opacity-[0.04] blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo + branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5e81f4]/15 border border-[var(--c-accent)]/30 mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
              <path
                d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="#5e81f4" fillOpacity="0.25" stroke="#5e81f4" strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="3" fill="#5e81f4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--c-text-primary)] tracking-tight">ThreatCanvas</h1>
          <p className="text-sm text-[var(--c-text-secondary)] mt-1">SOC Command Center · bloo.io</p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(94,129,244,0.08)' }}
        >
          {/* Card header */}
          <div className="px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
            <h2 className="text-sm font-semibold text-[var(--c-text-primary)]">Sign in to your account</h2>
            <p className="text-xs text-[var(--c-text-secondary)] mt-0.5">Authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-secondary)] mb-1.5">Email address</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text-muted)] pointer-events-none">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@bloo.io"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--c-bg-base)] border text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-muted)] font-mono focus:outline-none transition-colors
                    ${touched && !email ? 'border-[#ff3b5c]/50 focus:border-[#ff3b5c]' : 'border-[var(--c-border)] focus:border-[var(--c-accent)]'}`}
                />
              </div>
              {touched && !email && <p className="text-[10px] text-[#ff3b5c] mt-1">Email is required</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text-muted)] pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--c-bg-base)] border text-sm text-[var(--c-text-primary)] placeholder-[var(--c-text-muted)] font-mono focus:outline-none transition-colors
                    ${touched && !password ? 'border-[#ff3b5c]/50 focus:border-[#ff3b5c]' : 'border-[var(--c-border)] focus:border-[var(--c-accent)]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] transition-colors cursor-pointer"
                >
                  {showPassword
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {touched && !password && <p className="text-[10px] text-[#ff3b5c] mt-1">Password is required</p>}
            </div>

            {/* API error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#ff3b5c]/8 border border-[#ff3b5c]/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ff3b5c" strokeWidth="1.5" className="w-4 h-4 shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                <p className="text-xs text-[#ff3b5c]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#5e81f4] hover:bg-[#7b9bf8] active:bg-[#4a6ee0] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo users */}
          <div className="px-6 pb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--c-border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--c-bg-surface)] px-3 text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">Quick access — demo users</span>
              </div>
            </div>

            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => fillUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--c-border)] hover:border-[var(--c-border-bright)] bg-[var(--c-bg-base)] hover:bg-[var(--c-bg-elevated)] transition-all duration-150 group cursor-pointer text-left"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
                    style={{ background: `${u.color}18`, borderColor: `${u.color}40`, color: u.color }}
                  >
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--c-text-bright)] truncate">{u.email}</p>
                    <p className="text-[10px] truncate" style={{ color: u.color }}>{u.role}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="w-3.5 h-3.5 text-[var(--c-border-bright)] group-hover:text-[var(--c-text-secondary)] transition-colors shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--c-border-bright)] mt-5 font-mono">
          ThreatCanvas v2.0 · bloo.io Security Platform · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

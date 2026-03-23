import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Alert } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'
import { useTheme, THEMES, isDarkTheme } from '../../contexts/ThemeContext'
import SpawnModal from './SpawnModal'
import ToastNotification from './ToastNotification'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':          { title: 'Log Search',           subtitle: 'Search ingested telemetry streams' },
  '/dashboard': { title: 'Dashboard',            subtitle: 'Real-time threat overview' },
  '/triage':    { title: 'Triage Board',          subtitle: 'Manage & investigate alerts' },
  '/timeline':  { title: 'Attack Timeline',       subtitle: 'Forensic event chain analysis' },
  '/intel':     { title: 'Threat Intelligence',   subtitle: 'IoC feed & threat indicators' },
}

function getPageInfo(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/alerts/')) return { title: 'Alert Details', subtitle: 'Full incident investigation view' }
  return { title: 'ThreatCanvas', subtitle: '' }
}

const TIER_COLOR: Record<string, string> = {
  admin:    '#5e81f4',
  tier1:    '#4cc9f0',
  tier2:    '#06d6a0',
  hunter:   '#ffd166',
  forensic: '#ff8c42',
}

export default function TopBar({ onRefresh }: { onRefresh?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { expanded } = useSidebar()
  const info = getPageInfo(location.pathname)

  const [modalOpen, setModalOpen] = useState(false)
  const [lastAlert, setLastAlert] = useState<Alert | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const updateLeft = useCallback(() => {
    if (!headerRef.current) return
    const isSm = window.matchMedia('(min-width: 640px)').matches
    headerRef.current.style.left = isSm ? (expanded ? '224px' : '64px') : '0px'
  }, [expanded])

  useEffect(() => {
    updateLeft()
    window.addEventListener('resize', updateLeft)
    return () => window.removeEventListener('resize', updateLeft)
  }, [updateLeft])

  // Close dropdowns on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSpawned(alert: Alert) {
    setLastAlert(alert)
    onRefresh?.()
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const tierColor = TIER_COLOR[user?.tier ?? 'tier1']
  const { theme, setTheme } = useTheme()
  const darkThemes = THEMES.filter(t => isDarkTheme(t.id))
  const lightThemes = THEMES.filter(t => !isDarkTheme(t.id))

  return (
    <>
      <header
        ref={headerRef}
        data-tour="topbar"
        className="fixed top-0 right-0 h-14 bg-[var(--c-bg-surface)]/90 backdrop-blur border-b border-[var(--c-border)] flex items-center justify-between px-4 sm:px-6 z-40 transition-[left] duration-300"
      >
        {/* Page title */}
        <div>
          <h1 className="text-sm font-semibold text-[var(--c-text-primary)] leading-none">{info.title}</h1>
          <p className="text-xs text-[var(--c-text-secondary)] mt-0.5">{info.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Clock */}
          <span className="text-xs text-[var(--c-text-secondary)] font-mono hidden md:block">
            {new Date().toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>

          {/* Theme picker */}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => setThemeOpen(o => !o)}
              title="Change theme"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-hover)] border border-transparent hover:border-[var(--c-border)] transition-all duration-150 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20"/>
                <path d="M2 12h10"/>
                <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </button>

            {themeOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] shadow-2xl overflow-hidden z-50 p-3"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
              >
                <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">Dark</p>
                <div className="grid grid-cols-5 gap-1 mb-3">
                  {darkThemes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setThemeOpen(false) }}
                      title={t.label}
                      className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-[var(--c-bg-hover)] transition-colors cursor-pointer group"
                    >
                      <span
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                          borderColor: theme === t.id ? t.accent : 'transparent',
                          boxShadow: theme === t.id ? `0 0 0 1px ${t.accent}` : 'none',
                        }}
                      />
                      <span className="text-[9px] text-[var(--c-text-muted)] group-hover:text-[var(--c-text-secondary)] leading-none">{t.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-2">Light</p>
                <div className="grid grid-cols-5 gap-1">
                  {lightThemes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setThemeOpen(false) }}
                      title={t.label}
                      className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-[var(--c-bg-hover)] transition-colors cursor-pointer group"
                    >
                      <span
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                          borderColor: theme === t.id ? t.accent : 'transparent',
                          boxShadow: theme === t.id ? `0 0 0 1px ${t.accent}` : 'none',
                        }}
                      />
                      <span className="text-[9px] text-[var(--c-text-muted)] group-hover:text-[var(--c-text-secondary)] leading-none">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Spawn Alert */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 text-[#ff3b5c] hover:bg-[#ff3b5c]/20 active:bg-[#ff3b5c]/30 transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Spawn Alert
          </button>

          {/* User profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-[var(--c-border)] hover:border-[var(--c-border-bright)] bg-[var(--c-bg-base)] hover:bg-[var(--c-bg-elevated)] transition-all duration-150 cursor-pointer group"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0"
                style={{ background: `${tierColor}18`, borderColor: `${tierColor}40`, color: tierColor }}
              >
                {user?.avatar}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-[var(--c-text-bright)] leading-none">{user?.name}</p>
                <p className="text-[10px] mt-0.5 leading-none" style={{ color: tierColor }}>{user?.role}</p>
              </div>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`w-3 h-3 text-[var(--c-text-muted)] group-hover:text-[var(--c-text-secondary)] transition-all duration-150 ${profileOpen ? 'rotate-180' : ''}`}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-surface)] shadow-2xl overflow-hidden z-50"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
              >
                {/* Profile header */}
                <div className="px-4 py-3 bg-[var(--c-bg-elevated)] border-b border-[var(--c-border)]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0"
                      style={{ background: `${tierColor}18`, borderColor: `${tierColor}50`, color: tierColor }}
                    >
                      {user?.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--c-text-primary)] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[var(--c-text-secondary)] truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{ color: tierColor, background: `${tierColor}15`, borderColor: `${tierColor}40` }}
                    >
                      {user?.role}
                    </span>
                    <span className="text-[10px] text-[var(--c-text-secondary)]">{user?.team}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="px-4 py-3 border-b border-[var(--c-border)]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06d6a0]" />
                    </span>
                    <span className="text-xs text-[var(--c-text-secondary)]">Active session</span>
                    <span className="ml-auto text-[10px] font-mono text-[var(--c-text-muted)]">bloo.io</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#ff3b5c] hover:bg-[#ff3b5c]/8 transition-colors cursor-pointer text-left"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <SpawnModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSpawned={handleSpawned}
      />

      <ToastNotification
        alert={lastAlert}
        onDismiss={() => setLastAlert(null)}
      />
    </>
  )
}

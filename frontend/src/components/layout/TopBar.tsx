import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Alert } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useSidebar } from '../../contexts/SidebarContext'
import { useTheme } from '../../contexts/ThemeContext'
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
  const profileRef = useRef<HTMLDivElement>(null)
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

  // Close profile dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
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
  const { theme, toggleTheme } = useTheme()

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

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-hover)] border border-transparent hover:border-[var(--c-border)] transition-all duration-150 cursor-pointer"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

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

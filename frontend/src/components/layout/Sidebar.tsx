import { NavLink, useLocation } from 'react-router-dom'
import { useTour, resetAllTours } from '../tour/TourContext'
import { TOURS } from '../tour/tours'
import { useSidebar } from '../../contexts/SidebarContext'

const nav = [
  {
    to: '/',
    label: 'Log Search',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0">
        <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        <path d="M8 11h6M11 8v6" />
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/triage',
    label: 'Triage Board',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/timeline',
    label: 'Attack Timeline',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    to: '/intel',
    label: 'Threat Intel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
]

const ROUTE_TOUR: Record<string, string> = {
  '/': 'logs', '/dashboard': 'dashboard', '/triage': 'triage',
  '/timeline': 'timeline', '/intel': 'intel',
}

function getTourId(pathname: string): string | undefined {
  if (ROUTE_TOUR[pathname]) return ROUTE_TOUR[pathname]
  if (pathname.startsWith('/alerts/')) return 'alert-details'
  return undefined
}

export default function Sidebar() {
  const { startTour } = useTour()
  const location = useLocation()
  const { expanded, toggle } = useSidebar()

  function restartTour() {
    const tourId = getTourId(location.pathname)
    if (tourId && TOURS[tourId]) {
      resetAllTours()
      startTour(tourId, TOURS[tourId])
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        data-tour="sidebar"
        className={`hidden sm:flex fixed left-0 top-0 h-full flex-col items-center bg-[var(--c-bg-surface)] border-r border-[var(--c-border)] z-50 py-4 gap-1 overflow-hidden transition-[width] duration-300 ${expanded ? 'w-56' : 'w-16'}`}
      >
        {/* Logo + brand */}
        <div className={`flex items-center gap-3 mb-5 shrink-0 px-3.5 w-full ${expanded ? '' : 'justify-center px-0'}`}>
          <div className="w-9 h-9 rounded-lg bg-[var(--c-accent)]/20 border border-[var(--c-accent)]/40 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#5e81f4" fillOpacity="0.3" stroke="#5e81f4" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2.5" fill="#5e81f4" />
            </svg>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'}`}>
            <p className="text-sm font-bold text-[var(--c-text-primary)] whitespace-nowrap leading-none">ThreatCanvas</p>
            <p className="text-[9px] text-[var(--c-accent)] font-mono whitespace-nowrap mt-0.5">bloo.io</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="w-full flex flex-col items-center gap-1 px-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={expanded ? undefined : item.label}
              className={({ isActive }) =>
                `w-full flex items-center rounded-lg transition-all duration-150 group relative overflow-hidden
                ${expanded ? 'px-3 py-2.5 gap-3' : 'justify-center w-10 h-10 mx-auto'}
                ${isActive
                  ? 'bg-[var(--c-accent)]/20 text-[var(--c-accent)] border border-[var(--c-accent)]/40'
                  : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text-primary)] hover:bg-[var(--c-bg-hover)] border border-transparent'
                }`
              }
            >
              {item.icon}
              <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'}`}>
                {item.label}
              </span>
              {/* Tooltip — only when collapsed */}
              {!expanded && (
                <span className="absolute left-14 bg-[var(--c-bg-elevated)] border border-[var(--c-border)] text-[var(--c-text-primary)] text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom controls */}
        <div className="mt-auto flex flex-col items-center gap-2 w-full px-2">
          {/* Tour button */}
          <button
            onClick={restartTour}
            title={expanded ? undefined : 'Restart page tour'}
            className={`flex items-center rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-accent)] hover:bg-[var(--c-accent)]/10 border border-transparent hover:border-[var(--c-accent)]/30 transition-all duration-150 cursor-pointer group relative overflow-hidden
              ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-8 h-8 justify-center mx-auto'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
            </svg>
            <span className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'}`}>
              Restart tour
            </span>
            {!expanded && (
              <span className="absolute left-12 bg-[var(--c-bg-elevated)] border border-[var(--c-border)] text-[var(--c-text-primary)] text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Restart tour
              </span>
            )}
          </button>

          {/* Live indicator */}
          <div className={`flex items-center gap-2 py-1 ${expanded ? 'w-full px-3' : 'flex-col'}`}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06d6a0]" />
            </span>
            <span className={`text-[9px] text-[var(--c-text-secondary)] font-mono leading-none whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 max-w-[80px] text-[11px]' : 'opacity-100 max-w-[30px]'}`}>
              LIVE
            </span>
          </div>

          {/* Expand / collapse toggle */}
          <button
            onClick={toggle}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`flex items-center rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text-primary)] hover:bg-[var(--c-bg-hover)] transition-all duration-150 cursor-pointer border border-transparent hover:border-[var(--c-border)]
              ${expanded ? 'w-full px-3 py-2 gap-3' : 'w-8 h-8 justify-center mx-auto'}`}
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`w-4 h-4 shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0'}`}>
              Collapse
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--c-bg-surface)]/95 backdrop-blur border-t border-[var(--c-border)] z-50 flex items-center justify-around px-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150
              ${isActive ? 'text-[var(--c-accent)]' : 'text-[var(--c-text-muted)]'}`
            }
          >
            {item.icon}
            <span className="text-[9px] font-medium leading-none">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

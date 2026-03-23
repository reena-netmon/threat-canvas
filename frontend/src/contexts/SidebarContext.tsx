import { createContext, useContext, useState, useCallback } from 'react'

interface SidebarContextType {
  expanded: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType>({ expanded: false, toggle: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem('tc_sidebar_expanded') === 'true' } catch { return false }
  })

  const toggle = useCallback(() => {
    setExpanded(e => {
      const next = !e
      try { localStorage.setItem('tc_sidebar_expanded', String(next)) } catch {}
      return next
    })
  }, [])

  return <SidebarContext.Provider value={{ expanded, toggle }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  return useContext(SidebarContext)
}

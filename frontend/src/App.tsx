import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TourProvider } from './components/tour/TourContext'
import TourOverlay from './components/tour/TourOverlay'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import TriageBoard from './pages/TriageBoard'
import Timeline from './pages/Timeline'
import Intel from './pages/Intel'
import LogSearch from './pages/LogSearch'
import AlertDetails from './pages/AlertDetails'
import Login from './pages/Login'

function ProtectedLayout() {
  const { user } = useAuth()
  const { expanded } = useSidebar()
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      if (!contentRef.current) return
      const isSm = window.matchMedia('(min-width: 640px)').matches
      contentRef.current.style.marginLeft = isSm ? (expanded ? '224px' : '64px') : '0px'
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [expanded])

  if (!user) return <Navigate to="/login" replace />

  return (
    <TourProvider>
      <div className="flex h-full bg-bg-base">
        <Sidebar />
        <div ref={contentRef} className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300">
          <TopBar onRefresh={refresh} />
          <main className="flex-1 overflow-auto pt-14 pb-14 sm:pb-0">
            <Routes>
              <Route path="/" element={<LogSearch />} />
              <Route path="/dashboard" element={<Dashboard refreshKey={refreshKey} />} />
              <Route path="/triage" element={<TriageBoard refreshKey={refreshKey} />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/intel" element={<Intel />} />
              <Route path="/alerts/:id" element={<AlertDetails />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <TourOverlay />
      </div>
    </TourProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

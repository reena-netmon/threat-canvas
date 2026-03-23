import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface TourStep {
  target: string          // CSS selector
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  spotlight?: boolean     // default true
}

interface TourState {
  active: boolean
  steps: TourStep[]
  current: number
  tourId: string
}

interface TourContextValue {
  state: TourState
  startTour: (tourId: string, steps: TourStep[]) => void
  next: () => void
  prev: () => void
  skip: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

const SEEN_KEY = 'tc_tours_seen'

function getSeenTours(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') } catch { return [] }
}

function markSeen(tourId: string) {
  const seen = getSeenTours()
  if (!seen.includes(tourId)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, tourId]))
}

export function isTourSeen(tourId: string): boolean {
  return getSeenTours().includes(tourId)
}

export function resetAllTours() {
  localStorage.removeItem(SEEN_KEY)
}

const INIT: TourState = { active: false, steps: [], current: 0, tourId: '' }

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>(INIT)

  const startTour = useCallback((tourId: string, steps: TourStep[]) => {
    setState({ active: true, steps, current: 0, tourId })
  }, [])

  const next = useCallback(() => {
    setState(s => {
      if (s.current >= s.steps.length - 1) {
        markSeen(s.tourId)
        return INIT
      }
      return { ...s, current: s.current + 1 }
    })
  }, [])

  const prev = useCallback(() => {
    setState(s => s.current > 0 ? { ...s, current: s.current - 1 } : s)
  }, [])

  const skip = useCallback(() => {
    setState(s => { markSeen(s.tourId); return INIT })
  }, [])

  return (
    <TourContext.Provider value={{ state, startTour, next, prev, skip }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be inside TourProvider')
  return ctx
}

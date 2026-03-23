import { useEffect } from 'react'
import { useTour, isTourSeen } from '../components/tour/TourContext'
import { TOURS } from '../components/tour/tours'

export function usePageTour(tourId: keyof typeof TOURS) {
  const { startTour } = useTour()

  useEffect(() => {
    if (!isTourSeen(tourId)) {
      const timer = setTimeout(() => startTour(tourId, TOURS[tourId]), 800)
      return () => clearTimeout(timer)
    }
  }, [tourId, startTour])
}

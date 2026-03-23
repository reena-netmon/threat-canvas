import { useEffect, useState, useCallback } from 'react'
import { useTour } from './TourContext'

interface Rect { top: number; left: number; width: number; height: number }
const PADDING = 10
const EMPTY_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 }

function getPopoverStyle(
  rect: Rect,
  position: string,
  popW: number,
  popH: number,
  winW: number,
  winH: number,
): React.CSSProperties {
  const pad = PADDING + 16
  let top = 0, left = 0

  if (position === 'bottom') {
    top = rect.top + rect.height + pad
    left = rect.left + rect.width / 2 - popW / 2
  } else if (position === 'top') {
    top = rect.top - popH - pad
    left = rect.left + rect.width / 2 - popW / 2
  } else if (position === 'right') {
    top = rect.top + rect.height / 2 - popH / 2
    left = rect.left + rect.width + pad
  } else { // left
    top = rect.top + rect.height / 2 - popH / 2
    left = rect.left - popW - pad
  }

  // clamp to viewport
  left = Math.max(12, Math.min(left, winW - popW - 12))
  top  = Math.max(12, Math.min(top,  winH - popH - 12))

  return { position: 'fixed', top, left, width: popW }
}

export default function TourOverlay() {
  const { state, next, prev, skip } = useTour()
  const { active, steps, current } = state
  const [rect, setRect] = useState<Rect>(EMPTY_RECT)
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  const measure = useCallback(() => {
    if (!active || !steps[current]) return
    const el = document.querySelector(steps[current].target)
    if (el) {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    } else {
      setRect(EMPTY_RECT)
    }
    setWinSize({ w: window.innerWidth, h: window.innerHeight })
  }, [active, steps, current])

  useEffect(() => {
    measure()
    const id = setTimeout(measure, 80) // re-measure after any layout shift
    window.addEventListener('resize', measure)
    return () => { clearTimeout(id); window.removeEventListener('resize', measure) }
  }, [measure])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') skip()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
    }
    if (active) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, next, prev, skip])

  if (!active || !steps[current]) return null

  const step = steps[current]
  const hasTarget = rect.width > 0
  const sr = {
    top:    rect.top    - PADDING,
    left:   rect.left   - PADDING,
    width:  rect.width  + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  const popW = Math.min(320, winSize.w - 24)
  const pos  = step.position ?? 'bottom'
  const popoverStyle = hasTarget
    ? getPopoverStyle(sr, pos, popW, 180, winSize.w, winSize.h)
    : { position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: popW }

  const progress = ((current + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Backdrop with spotlight cutout */}
      {hasTarget ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ cursor: 'default' }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={sr.left} y={sr.top} width={sr.width} height={sr.height}
                rx="10" ry="10" fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#tour-mask)"
            onClick={skip}
          />
          {/* Spotlight ring */}
          <rect
            x={sr.left} y={sr.top} width={sr.width} height={sr.height}
            rx="10" ry="10"
            fill="none"
            stroke="#5e81f4"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 8px rgba(94,129,244,0.6))' }}
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={skip}
        />
      )}

      {/* Popover */}
      <div
        className="pointer-events-auto rounded-2xl border border-[var(--c-border-bright)] bg-[var(--c-bg-surface)] overflow-hidden"
        style={{
          ...popoverStyle,
          boxShadow: '0 0 40px rgba(94,129,244,0.2), 0 20px 60px rgba(0,0,0,0.5)',
          animation: 'tourIn 0.2s ease',
        }}
      >
        <style>{`@keyframes tourIn { from { opacity:0; transform: scale(0.96) translateY(6px); } to { opacity:1; transform: scale(1) translateY(0); } }`}</style>

        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[var(--c-accent)]/20 border border-[var(--c-accent)]/40 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5e81f4" strokeWidth="1.5" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
              </svg>
            </div>
            <span className="text-[10px] text-[var(--c-text-secondary)] font-mono uppercase tracking-wider">
              Step {current + 1} of {steps.length}
            </span>
          </div>
          <button onClick={skip} className="text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] transition-colors cursor-pointer p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-bold text-[var(--c-text-primary)] mb-1.5">{step.title}</h3>
          <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">{step.content}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--c-border)] bg-[var(--c-bg-base)]">
          <button
            onClick={skip}
            className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] transition-colors cursor-pointer"
          >
            Skip tour
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width:  i === current ? 16 : 6,
                  height: 6,
                  background: i === current ? 'var(--c-accent)' : i < current ? 'var(--c-accent-border)' : 'var(--c-border)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {current > 0 && (
              <button
                onClick={prev}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--c-border)] text-[var(--c-text-secondary)] hover:border-[var(--c-border-bright)] hover:text-[var(--c-text-primary)] transition-colors cursor-pointer"
              >
                ← Back
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-[#7b9bf8] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {current === steps.length - 1 ? (
                <>Done ✓</>
              ) : (
                <>Next <span className="opacity-60">→</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

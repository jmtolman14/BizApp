import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Animates from 0 to `target` with an ease-out curve. */
export function useCountUp(target: number, durationMs = 800, delayMs = 0): number {
  const [reduced] = useState(prefersReducedMotion)
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (reduced) return
    let frame = 0
    let start: number | null = null
    const tick = (now: number) => {
      start ??= now + delayMs
      const t = Math.min(1, Math.max(0, (now - start) / durationMs))
      setValue(Math.round(target * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, delayMs, reduced])
  return reduced ? target : value
}

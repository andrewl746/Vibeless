"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Reveals `target` one slice per animation frame so streamed text always *types*
 * smoothly, decoupled from the choppy network bursts that grow `target`. Mount a
 * fresh instance per stream (via a React `key`) to reset cleanly.
 */
export function useTypewriter(target: string): string {
  const [displayed, setDisplayed] = useState("")
  const displayedRef = useRef("")
  const targetRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  // Keep the loop's view of the target current without touching refs in render.
  useEffect(() => {
    targetRef.current = target
  }, [target])

  // Drive the reveal; the loop self-schedules until caught up, then parks.
  useEffect(() => {
    if (rafRef.current !== null) return
    if (displayedRef.current.length >= target.length) return

    const tick = () => {
      const t = targetRef.current
      const cur = displayedRef.current
      if (cur.length >= t.length) {
        rafRef.current = null
        return
      }
      const backlog = t.length - cur.length
      const step = Math.max(1, Math.ceil(backlog / 4))
      const next = t.slice(0, cur.length + step)
      displayedRef.current = next
      setDisplayed(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [target])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  return displayed
}

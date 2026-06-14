"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import { useGraphStore } from "@/store/useGraphStore"

// Custom renderers that inherit the tactical / clinical aesthetic.
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-xs text-gray-300 font-mono tracking-wide leading-relaxed mb-4 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold shadow-[0_0_8px_rgba(0,163,255,0.2)]">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="text-accent-blue/90 not-italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-bg-deep border border-border-muted font-mono text-xs text-accent-blue px-1.5 py-0.5 rounded">
      {children}
    </code>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-4 flex flex-col gap-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-4 flex flex-col gap-1.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-xs text-gray-300 font-mono tracking-wide leading-relaxed">{children}</li>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-accent-blue underline underline-offset-2 hover:text-white transition-colors">
      {children}
    </a>
  ),
}

// Reveals the buffered text one slice per animation frame so it always *types*
// smoothly, decoupled from the choppy network bursts the store receives. A fresh
// instance is mounted per fetch (keyed on descFetchId), so local state resets
// without a setState-in-effect.
function DescriptionBody() {
  const isDescLoading = useGraphStore((s) => s.isDescLoading)
  const isDescStreaming = useGraphStore((s) => s.isDescStreaming)
  const activeDescriptionText = useGraphStore((s) => s.activeDescriptionText)
  const descError = useGraphStore((s) => s.descError)

  const target = activeDescriptionText ?? ""
  const [displayed, setDisplayed] = useState("")
  const displayedRef = useRef("")
  const targetRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  // Keep the loop's view of the target current without touching refs in render.
  useEffect(() => {
    targetRef.current = target
  }, [target])

  // Drive the reveal. The loop self-schedules until it has caught up to the
  // buffered target, then parks itself; new text re-kicks it.
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
      // Reveal proportionally to backlog so it keeps pace on big bursts but
      // settles to ~1 char/frame near the end for a smooth finish.
      const backlog = t.length - cur.length
      const step = Math.max(1, Math.ceil(backlog / 4))
      const next = t.slice(0, cur.length + step)
      displayedRef.current = next
      setDisplayed(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [target])

  // Cancel any in-flight frame on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  if (isDescLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <span className="font-mono text-xs text-accent-blue animate-pulse tracking-widest">
          [ ANALYZING COMPONENT STRUCTURE... ]
        </span>
        <span className="font-mono text-xs text-accent-blue animate-pulse">▍</span>
      </div>
    )
  }

  if (descError) {
    return (
      <p className="font-mono text-xs text-red-400/90 leading-relaxed whitespace-pre-wrap">
        {descError}
      </p>
    )
  }

  const stillTyping = isDescStreaming || displayed.length < target.length

  return (
    <div className="overflow-y-auto max-h-64 sidebar-scroll pr-1">
      <ReactMarkdown components={markdownComponents}>{displayed}</ReactMarkdown>
      {stillTyping && (
        <span className="inline-block font-mono text-xs text-accent-blue animate-pulse align-baseline">
          ▍
        </span>
      )}
    </div>
  )
}

export default function DescriptionModal() {
  const descTargetName = useGraphStore((s) => s.descTargetName)
  const descFetchId = useGraphStore((s) => s.descFetchId)
  const clearDescription = useGraphStore((s) => s.clearDescription)

  // The modal is "open" from the moment a fetch is kicked off (descTargetName set)
  // until the user closes it.
  if (!descTargetName) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={clearDescription}
    >
      <div
        className="w-full max-w-xl bg-bg-panel border border-border-muted rounded-lg overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] animate-[descIn_160ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-muted bg-bg-deep">
          <span className="font-mono text-xs text-accent-blue tracking-widest">
            DOCS // [ {descTargetName.toUpperCase()} ]
          </span>
          <button
            onClick={clearDescription}
            className="font-mono text-xs text-text-muted hover:text-white transition-colors"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* Body — keyed per fetch so the typewriter restarts cleanly */}
        <div className="p-4">
          <DescriptionBody key={descFetchId} />
        </div>
      </div>
    </div>
  )
}

"use client"

import ReactMarkdown from "react-markdown"
import { useGraphStore } from "@/store/useGraphStore"
import { createMarkdownComponents, DESCRIPTION_THEME } from "./markdownTheme"
import { useTypewriter } from "./useTypewriter"

// Every markdown element inherits the tactical mono theme (no default fonts).
const markdownComponents = createMarkdownComponents(DESCRIPTION_THEME)

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
  const displayed = useTypewriter(target)

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

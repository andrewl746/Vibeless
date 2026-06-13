"use client"

import { useGraphStore } from "@/store/useGraphStore"

export default function IsolationOverlay() {
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)
  const isolationTargetName = useGraphStore((s) => s.isolationTargetName)
  const isolationTargetKind = useGraphStore((s) => s.isolationTargetKind)
  const exitIsolationMode = useGraphStore((s) => s.exitIsolationMode)

  if (!isIsolationMode) return null

  const kindLabel = isolationTargetKind
    ? isolationTargetKind.charAt(0).toUpperCase() + isolationTargetKind.slice(1)
    : "—"

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-bg-deep border-b border-[#00E676]/40 pointer-events-auto">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-[#00E676] uppercase tracking-widest">
          TRACE ACTIVE
        </span>
        <span className="text-border-muted font-mono text-[10px]">//</span>
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
          ENTITY:
        </span>
        <span className="font-mono text-xs text-white">{isolationTargetName ?? "—"}</span>
        <span className="font-mono text-[9px] text-text-muted px-1.5 py-0.5 border border-border-muted rounded uppercase">
          Type: {kindLabel}
        </span>
      </div>
      <button
        onClick={exitIsolationMode}
        className="font-mono text-[10px] px-3 py-1 bg-red-950/60 border border-red-500/60 text-red-400 hover:bg-red-900/70 hover:text-white hover:border-red-400 transition-colors rounded whitespace-nowrap"
      >
        [ X ] BREAK TRACE
      </button>
    </div>
  )
}

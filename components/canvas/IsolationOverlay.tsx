"use client"

import { useGraphStore } from "@/store/useGraphStore"

export default function IsolationOverlay() {
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)
  const isolationTargetName = useGraphStore((s) => s.isolationTargetName)
  const exitIsolationMode = useGraphStore((s) => s.exitIsolationMode)

  if (!isIsolationMode) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-bg-deep border-b-2 border-[#00E676] pointer-events-auto">
      <span className="font-mono text-xs text-[#00E676] uppercase tracking-widest">
        ISOLATION MODE: Viewing dependencies for{" "}
        <span className="text-white">{isolationTargetName ?? "—"}</span>
      </span>
      <button
        onClick={exitIsolationMode}
        className="font-mono text-xs px-3 py-1 bg-red-900/40 border border-red-500 text-red-400 hover:bg-red-900/70 hover:text-white transition-colors rounded"
      >
        [ X ] Return to Main Graph
      </button>
    </div>
  )
}

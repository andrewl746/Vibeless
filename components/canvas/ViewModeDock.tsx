"use client"

import { useGraphStore } from "@/store/useGraphStore"
import type { ViewMode } from "@/components/nodes/types"

const MODES: { mode: ViewMode; label: string; activeClass: string }[] = [
  {
    mode: "TREE",
    label: "[ 1. FILE SYSTEM TREE ]",
    activeClass: "text-white bg-bg-deep border-accent-blue",
  },
  {
    mode: "BLAST_RADIUS",
    label: "[ 2. BLAST RADIUS SIMULATOR ]",
    activeClass: "text-red-300 bg-[#1F0A0E] border-[#EF4444]",
  },
  {
    mode: "TECH_STACK",
    label: "[ 3. TECH STACK FLOW ]",
    activeClass: "text-emerald-300 bg-[#06201A] border-[#00E676]",
  },
]

export default function ViewModeDock() {
  const currentViewMode = useGraphStore((s) => s.currentViewMode)
  const setViewMode = useGraphStore((s) => s.setViewMode)

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-bg-panel border border-border-muted rounded-md p-1 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-auto">
      {MODES.map(({ mode, label, activeClass }) => {
        const active = currentViewMode === mode
        return (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded border transition-colors ${
              active
                ? activeClass
                : "text-text-muted border-transparent hover:text-white hover:border-border-muted"
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

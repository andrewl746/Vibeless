"use client"

import { useState } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import type { GraphNodeData } from "./types"

interface NodeOverlayProps {
  id: string
  data: GraphNodeData
}

export default function NodeOverlay({ id, data }: NodeOverlayProps) {
  const [modal, setModal] = useState<"desc" | "code" | null>(null)
  const enterIsolationMode = useGraphStore((s) => s.enterIsolationMode)
  const allNodes = useGraphStore((s) => s.nodes)
  const allEdges = useGraphStore((s) => s.edges)

  function handleTraceUsage() {
    const connectedEdges = allEdges.filter(
      (e) => e.source === id || e.target === id
    )
    const connectedIds = new Set(
      connectedEdges.flatMap((e) => [e.source, e.target])
    )
    const depNodes = allNodes.filter((n) => connectedIds.has(n.id))
    enterIsolationMode(id, data.label, depNodes, connectedEdges)
  }

  return (
    <>
      {/* Inline floating menu */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 flex flex-col gap-1 pointer-events-auto">
        <button
          onClick={() => setModal("desc")}
          className="font-mono text-[10px] px-2 py-0.5 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap"
        >
          [ DESC ]
        </button>
        <button
          onClick={() => setModal("code")}
          className="font-mono text-[10px] px-2 py-0.5 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap"
        >
          [ CODE ]
        </button>
        <button
          onClick={handleTraceUsage}
          className="font-mono text-[10px] px-2 py-0.5 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-green-500 transition-colors rounded whitespace-nowrap"
        >
          [ TRACE USAGE ]
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-lg bg-bg-panel border border-border-muted rounded-lg p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
                {modal === "desc" ? "[ DESCRIPTION ]" : "[ CODE ]"} — {data.label}
              </span>
              <button
                onClick={() => setModal(null)}
                className="font-mono text-xs text-text-muted hover:text-white"
              >
                [ X ]
              </button>
            </div>

            <div className="border-t border-border-muted pt-3">
              {modal === "desc" ? (
                <p className="font-mono text-xs text-white/70 leading-relaxed">
                  {data.description ?? "— No description available. Anthropic API hook goes here. —"}
                </p>
              ) : (
                <pre className="font-mono text-xs text-green-400 leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                  {data.code ?? "// No code snippet available."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

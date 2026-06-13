"use client"

import { useState } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import { findUsages } from "@/utils/codeScanner"
import type { GraphNodeData, NodeKind } from "./types"
import type { Node, Edge } from "@xyflow/react"

interface NodeOverlayProps {
  id: string
  data: GraphNodeData
}

export default function NodeOverlay({ id, data }: NodeOverlayProps) {
  const [modal, setModal] = useState<"desc" | "code" | null>(null)
  const enterIsolationMode = useGraphStore((s) => s.enterIsolationMode)
  const allNodes = useGraphStore((s) => s.nodes)
  const allEdges = useGraphStore((s) => s.edges)
  const allScannedEntities = useGraphStore((s) => s.allScannedEntities)

  function handleTrace() {
    // Start with direct graph edges
    const directEdges = allEdges.filter((e) => e.source === id || e.target === id)
    const connectedIds = new Set(directEdges.flatMap((e) => [e.source, e.target]))

    // Relationship mapper: find files that reference this entity by name
    const filePath = data.path ?? ""
    const usagePaths = findUsages(data.label, filePath, allScannedEntities)

    // Add usage-based nodes and edges
    const extraEdges: Edge[] = []
    for (const usagePath of usagePaths) {
      const usageNodeId = `node::${usagePath}`
      const usageNode = allNodes.find((n) => n.id === usageNodeId)
      if (usageNode) {
        connectedIds.add(usageNodeId)
        extraEdges.push({
          id: `e-trace-${id}-${usageNodeId}`,
          source: id,
          target: usageNodeId,
          style: { stroke: "#00E676", strokeWidth: 1.5, strokeDasharray: "4 3" },
          animated: true,
        })
      }
    }

    const depNodes = allNodes.filter((n) => connectedIds.has(n.id)) as Node<GraphNodeData>[]
    const allTraceEdges = [...directEdges, ...extraEdges]
    enterIsolationMode(id, data.label, data.kind as NodeKind, depNodes, allTraceEdges)
  }

  return (
    <>
      {/* Inline floating action menu */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col gap-1 pointer-events-auto">
        <button
          onClick={() => setModal("desc")}
          className="font-mono text-[10px] px-3 py-1 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap"
        >
          [ DESC ]
        </button>
        <button
          onClick={() => setModal("code")}
          className="font-mono text-[10px] px-3 py-1 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap"
        >
          [ CODE ]
        </button>
        <button
          onClick={handleTrace}
          className="font-mono text-[10px] px-3 py-1 bg-bg-deep border border-[#00E67644] text-[#00E676]/60 hover:text-[#00E676] hover:border-[#00E676] transition-colors rounded whitespace-nowrap"
        >
          [ TRACE ]
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-xl bg-bg-panel border border-border-muted rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-muted bg-bg-deep">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
                  {modal === "desc" ? "DESC" : "CODE"}
                </span>
                <span className="font-mono text-[9px] text-border-muted">·</span>
                <span className="font-mono text-xs text-white">{data.label}</span>
                <span className="font-mono text-[9px] text-text-muted uppercase px-1.5 py-0.5 border border-border-muted rounded">
                  {data.kind}
                </span>
              </div>
              <button
                onClick={() => setModal(null)}
                className="font-mono text-xs text-text-muted hover:text-white transition-colors"
              >
                [ X ]
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4">
              {modal === "desc" ? (
                <div className="flex flex-col gap-3">
                  <p className="font-mono text-xs text-text-muted uppercase tracking-widest">
                    Analysis Prompt Template
                  </p>
                  <div className="bg-bg-deep border border-border-muted rounded p-3 flex flex-col gap-1.5">
                    <p className="font-mono text-xs text-white/80 leading-relaxed">
                      Analyze the <span className="text-accent-blue">{data.kind}</span>{" "}
                      <span className="text-white font-bold">{data.label}</span>
                      {data.path && (
                        <> located at <span className="text-text-muted">{data.path}</span></>
                      )}.
                    </p>
                    <p className="font-mono text-xs text-text-muted leading-relaxed">
                      Describe its purpose, inputs/outputs, side effects, and any potential issues.
                      Summarize dependencies and suggest improvements if applicable.
                    </p>
                  </div>
                  <p className="font-mono text-[9px] text-text-muted">
                    — Anthropic API hook goes here —
                  </p>
                </div>
              ) : (
                <pre className="font-mono text-xs text-[#00E676] leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap">
                  {data.code ?? "// No code snippet available for this node."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

"use client"

import { useGraphStore } from "@/store/useGraphStore"
import { findUsages } from "@/utils/codeScanner"
import type { GraphNodeData, NodeKind } from "./types"
import type { Node, Edge } from "@xyflow/react"

interface NodeOverlayProps {
  id: string
  data: GraphNodeData
}

// Map a file extension to a Prism language id.
function langFromPath(path?: string): string {
  if (!path) return "typescript"
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase()
  switch (ext) {
    case "tsx":
      return "tsx"
    case "ts":
      return "typescript"
    case "jsx":
      return "jsx"
    case "js":
    case "mjs":
    case "cjs":
      return "javascript"
    case "json":
      return "json"
    case "css":
      return "css"
    default:
      return "typescript"
  }
}

export default function NodeOverlay({ id, data }: NodeOverlayProps) {
  const enterIsolationMode = useGraphStore((s) => s.enterIsolationMode)
  const fetchNodeDescription = useGraphStore((s) => s.fetchNodeDescription)
  const openCodePane = useGraphStore((s) => s.openCodePane)
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
          onClick={() =>
            fetchNodeDescription(data.label, data.kind, data.path ?? "", data.code ?? "")
          }
          className="font-mono text-[10px] px-3 py-1 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap"
        >
          [ DESC ]
        </button>
        <button
          onClick={() =>
            openCodePane(
              data.code ?? "// No code snippet available for this node.",
              langFromPath(data.path),
              data.label
            )
          }
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
    </>
  )
}

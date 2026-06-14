"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import { useNodeHover } from "./useNodeHover"
import type { GraphNodeData } from "./types"

type FunctionNodeType = Node<GraphNodeData & { zoomLevel?: number }>

export default function FunctionNode({ data, selected, id }: NodeProps<FunctionNodeType>) {
  const { hovered, onMouseEnter, onMouseLeave } = useNodeHover(id, "function")
  const showOverlay = selected || hovered
  const isBlast = data.viewMode === "BLAST_RADIUS"
  const sim = data.simulationStatus ?? "idle"
  const border =
    sim === "running"
      ? "#9CDCFE"
      : sim === "success"
        ? "#4EC9B0"
        : sim === "error"
          ? "#EF4444"
          : selected
            ? "#00E676"
            : "#00E67666"

  return (
    <div
      className="relative flex items-center gap-2 px-4 py-1.5"
      style={{
        minWidth: 120,
        background:
          sim === "running"
            ? "#0B1730"
            : sim === "success"
              ? "#062016"
              : sim === "error"
                ? "#1F0A0E"
                : "#06090E",
        border: `1.5px solid ${border}`,
        borderRadius: 999,
        boxShadow:
          sim === "running"
            ? "0 0 14px rgba(96,165,250,0.45)"
            : sim === "success"
              ? "0 0 12px rgba(16,185,129,0.35)"
              : sim === "error"
                ? "0 0 14px rgba(239,68,68,0.5)"
                : selected
                  ? "0 0 12px rgba(0,230,118,0.2)"
                  : undefined,
        opacity: isBlast ? 0.4 : undefined,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="font-mono text-[9px] uppercase shrink-0 pointer-events-none select-none" style={{ color: border }}>fn</span>
      <span className="font-mono text-xs text-white truncate pointer-events-none select-none">{data.label}</span>

      <Handle type="source" position={Position.Bottom} className="!bg-[#00E67666]" />
      <Handle type="target" position={Position.Top} className="!bg-[#00E67666]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

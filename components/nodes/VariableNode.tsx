"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import { useNodeHover } from "./useNodeHover"
import type { GraphNodeData } from "./types"

type VariableNodeType = Node<GraphNodeData & { zoomLevel?: number }>

export default function VariableNode({ data, selected, id }: NodeProps<VariableNodeType>) {
  const { hovered, onMouseEnter, onMouseLeave } = useNodeHover(id, "variable")
  const showOverlay = selected || hovered
  const isBlast = data.viewMode === "BLAST_RADIUS"
  const sim = data.simulationStatus ?? "idle"
  const accent =
    sim === "running"
      ? "#60A5FA"
      : sim === "success"
        ? "#10B981"
        : sim === "error"
          ? "#EF4444"
          : "#FFB300"

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 64, height: 64, opacity: isBlast ? 0.4 : undefined }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            sim === "running"
              ? "#0B1730"
              : sim === "success"
                ? "#062016"
                : sim === "error"
                  ? "#1F0A0E"
                  : "#06090E",
          border: `1.5px solid ${selected || sim !== "idle" ? accent : "#FFB30066"}`,
          boxShadow:
            sim === "running"
              ? "0 0 14px rgba(96,165,250,0.45)"
              : sim === "success"
                ? "0 0 12px rgba(16,185,129,0.35)"
                : sim === "error"
                  ? "0 0 14px rgba(239,68,68,0.5)"
                  : selected
                    ? "0 0 12px rgba(255,179,0,0.2)"
                    : undefined,
        }}
      />
      <span
        className="relative z-10 font-mono text-[9px] text-center leading-tight px-1 pointer-events-none select-none truncate"
        style={{ color: accent, maxWidth: 52 }}
      >
        {data.label}
      </span>

      <Handle type="source" position={Position.Bottom} className="!bg-[#FFB30066]" />
      <Handle type="target" position={Position.Top} className="!bg-[#FFB30066]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

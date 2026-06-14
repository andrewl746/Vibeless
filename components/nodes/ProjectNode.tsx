"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import { useNodeHover } from "./useNodeHover"
import type { GraphNodeData } from "./types"

type ProjectNodeType = Node<GraphNodeData>

export default function ProjectNode({ data, selected, id }: NodeProps<ProjectNodeType>) {
  const { hovered, onMouseEnter, onMouseLeave } = useNodeHover(id, "project")
  const showOverlay = selected || hovered
  const isBlast = data.viewMode === "BLAST_RADIUS"
  const sim = data.simulationStatus ?? "idle"
  const accent =
    sim === "running"
      ? "#9CDCFE"
      : sim === "success"
        ? "#4EC9B0"
        : sim === "error"
          ? "#EF4444"
          : "#ffffff"

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ width: 120, height: 104, opacity: isBlast ? 0.4 : undefined }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background:
            sim === "running"
              ? "#0B1730"
              : sim === "success"
                ? "#062016"
                : sim === "error"
                  ? "#1F0A0E"
                  : "#0F1620",
          border: `3px solid ${accent}`,
          boxShadow:
            sim === "running"
              ? "0 0 18px rgba(96,165,250,0.45)"
              : sim === "success"
                ? "0 0 16px rgba(16,185,129,0.35)"
                : sim === "error"
                  ? "0 0 18px rgba(239,68,68,0.5)"
                  : selected
                    ? "0 0 20px rgba(255,255,255,0.15)"
                    : undefined,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1 pointer-events-none select-none">
        <span
          className="font-mono text-[10px] text-text-muted uppercase tracking-widest"
          style={{ color: sim === "idle" ? undefined : accent }}
        >
          PROJECT
        </span>
        <span className="font-mono text-xs text-white font-bold text-center leading-tight px-2 truncate max-w-[90px]">
          {data.label}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white/30 !border-white/20" />
      <Handle type="target" position={Position.Top} className="!bg-white/30 !border-white/20" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

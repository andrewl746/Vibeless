"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import { useNodeHover } from "./useNodeHover"
import type { GraphNodeData } from "./types"

type FolderNodeType = Node<GraphNodeData & { zoomLevel?: number }>

export default function FolderNode({ data, selected, id }: NodeProps<FolderNodeType>) {
  const { hovered, onMouseEnter, onMouseLeave } = useNodeHover(id, "folder")
  const showOverlay = selected || hovered
  const showDetails = (data.zoomLevel ?? 1) >= 0.5
  // In Blast Radius mode, structural nodes recede so file risk reads clearly.
  const isBlast = data.viewMode === "BLAST_RADIUS"
  const sim = data.simulationStatus ?? "idle"
  const accent =
    sim === "running"
      ? "#60A5FA"
      : sim === "success"
        ? "#10B981"
        : sim === "error"
          ? "#EF4444"
          : selected
            ? "#00A3FF"
            : "#1E2A38"

  return (
    <div
      className="relative flex flex-col gap-1.5 px-3 py-2.5"
      style={{
        width: 160,
        minHeight: 56,
        background:
          sim === "running"
            ? "#0B1730"
            : sim === "success"
              ? "#062016"
              : sim === "error"
                ? "#1F0A0E"
                : "#090D14",
        border: `1px solid ${accent}`,
        borderRadius: 8,
        boxShadow:
          sim === "running"
            ? "0 0 14px rgba(96,165,250,0.45)"
            : sim === "success"
              ? "0 0 12px rgba(16,185,129,0.35)"
              : sim === "error"
                ? "0 0 14px rgba(239,68,68,0.5)"
                : selected
                  ? "0 0 16px rgba(0,163,255,0.12)"
                  : undefined,
        opacity: isBlast ? 0.4 : undefined,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span
        className="font-mono text-[9px] text-text-muted uppercase tracking-widest pointer-events-none select-none"
        style={{ color: sim === "idle" ? undefined : accent }}
      >
        FOLDER
      </span>
      <span className="font-mono text-xs text-white truncate pointer-events-none select-none">
        {data.label}
      </span>
      {showDetails && data.path && (
        <span className="font-mono text-[9px] text-text-muted truncate pointer-events-none select-none">
          {data.path}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#1E2A38]" />
      <Handle type="target" position={Position.Top} className="!bg-[#1E2A38]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

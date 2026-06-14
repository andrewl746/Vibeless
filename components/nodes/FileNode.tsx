"use client"

import { type CSSProperties } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import { useNodeHover } from "./useNodeHover"
import type { GraphNodeData } from "./types"

type FileNodeType = Node<GraphNodeData>

// Risk → visual treatment for the Blast Radius lens.
const RISK_STYLE: Record<"critical" | "moderate" | "low", CSSProperties> = {
  critical: {
    background: "#1F0A0E",
    border: "1px solid #EF4444",
    boxShadow: "0 0 15px rgba(239,68,68,0.4)",
  },
  moderate: {
    background: "#241804",
    border: "1px solid #F59E0B",
    boxShadow: "0 0 12px rgba(245,158,11,0.25)",
  },
  low: {
    background: "#10161D",
    border: "1px solid #243140",
    boxShadow: "none",
    opacity: 0.4,
  },
}

const RISK_TAG_COLOR: Record<"critical" | "moderate" | "low", string> = {
  critical: "#EF4444",
  moderate: "#F59E0B",
  low: "#4B5E74",
}

export default function FileNode({ data, selected, id }: NodeProps<FileNodeType>) {
  const { hovered, onMouseEnter, onMouseLeave } = useNodeHover(id, "file")
  const showOverlay = selected || hovered
  const showDetails = (data.zoomLevel ?? 1) >= 0.5

  const isBlast = data.viewMode === "BLAST_RADIUS"
  const risk = data.riskLevel ?? "low"
  const sim = data.simulationStatus ?? "idle"

  const style: CSSProperties = {
    width: 140,
    minHeight: 48,
    borderRadius: 4,
    ...(sim === "running"
      ? {
          background: "#0B1730",
          border: "1px solid #60A5FA",
          boxShadow: "0 0 16px rgba(96,165,250,0.45)",
        }
      : sim === "success"
        ? {
            background: "#062016",
            border: "1px solid #10B981",
            boxShadow: "0 0 14px rgba(16,185,129,0.35)",
          }
        : sim === "error"
          ? {
              background: "#1F0A0E",
              border: "1px solid #EF4444",
              boxShadow: "0 0 16px rgba(239,68,68,0.5)",
            }
          : isBlast
      ? RISK_STYLE[risk]
      : {
          background: "#06090E",
          border: `1px solid ${selected ? "#00A3FF" : "#00A3FF44"}`,
          boxShadow: selected
            ? "0 0 14px rgba(0,163,255,0.2)"
            : "0 0 6px rgba(0,163,255,0.06)",
        }),
  }

  const tagColor =
    sim === "running"
      ? "#9CDCFE"
      : sim === "success"
        ? "#4EC9B0"
        : sim === "error"
          ? "#EF4444"
          : isBlast
            ? RISK_TAG_COLOR[risk]
            : "#00A3FF"

  return (
    <div
      className="relative flex flex-col gap-1 px-3 py-2"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* CRITICAL IMPACT badge — only in Blast Radius mode on hub files */}
      {isBlast && risk === "critical" && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 font-mono text-[7px] tracking-widest text-red-200 bg-[#1F0A0E] border border-[#EF4444] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none select-none">
          [ CRITICAL IMPACT ]
        </span>
      )}

      <span
        className="font-mono text-[9px] uppercase tracking-widest pointer-events-none select-none"
        style={{ color: tagColor }}
      >
        FILE
      </span>
      <span className="font-mono text-xs text-white truncate pointer-events-none select-none">
        {data.label}
      </span>
      {isBlast ? (
        <span
          className="font-mono text-[9px] uppercase tracking-wide pointer-events-none select-none"
          style={{ color: tagColor }}
        >
          {risk === "critical"
            ? `${data.inwardCount ?? 0} refs · critical`
            : risk === "moderate"
              ? `${data.inwardCount ?? 0} refs · moderate`
              : "isolated · safe"}
        </span>
      ) : (
        showDetails &&
        data.path && (
          <span className="font-mono text-[9px] text-text-muted truncate pointer-events-none select-none">
            {data.path}
          </span>
        )
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#00A3FF44]" />
      <Handle type="target" position={Position.Top} className="!bg-[#00A3FF44]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import type { GraphNodeData } from "./types"

type FolderNodeType = Node<GraphNodeData & { zoomLevel?: number }>

export default function FolderNode({ data, selected, id }: NodeProps<FolderNodeType>) {
  const [hovered, setHovered] = useState(false)
  const showOverlay = selected || hovered
  const showDetails = (data.zoomLevel ?? 1) >= 0.5

  return (
    <div
      className="relative flex flex-col gap-1.5 px-3 py-2.5"
      style={{
        width: 160,
        minHeight: 56,
        background: "#090D14",
        border: `1px solid ${selected ? "#00A3FF" : "#1E2A38"}`,
        borderRadius: 8,
        boxShadow: selected ? "0 0 16px rgba(0,163,255,0.12)" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest pointer-events-none select-none">
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

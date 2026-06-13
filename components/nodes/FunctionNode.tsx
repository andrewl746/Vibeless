"use client"

import { useState } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import type { GraphNodeData } from "./types"

type FunctionNodeType = Node<GraphNodeData & { zoomLevel?: number }>

export default function FunctionNode({ data, selected, id }: NodeProps<FunctionNodeType>) {
  const [hovered, setHovered] = useState(false)
  const showOverlay = selected || hovered
  const visible = (data.zoomLevel ?? 1) >= 1.0

  if (!visible) return null

  return (
    <div
      className="relative flex items-center gap-2 px-4 py-1.5"
      style={{
        minWidth: 120,
        background: "#06090E",
        border: `1.5px solid ${selected ? "#00E676" : "#00E67666"}`,
        borderRadius: 999,
        boxShadow: selected ? "0 0 12px rgba(0,230,118,0.2)" : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="font-mono text-[9px] text-[#00E676] uppercase shrink-0 pointer-events-none select-none">fn</span>
      <span className="font-mono text-xs text-white truncate pointer-events-none select-none">{data.label}</span>

      <Handle type="source" position={Position.Bottom} className="!bg-[#00E67666]" />
      <Handle type="target" position={Position.Top} className="!bg-[#00E67666]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

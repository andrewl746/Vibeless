"use client"

import { useState } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import type { GraphNodeData } from "./types"

type ProjectNodeType = Node<GraphNodeData>

export default function ProjectNode({ data, selected, id }: NodeProps<ProjectNodeType>) {
  const [hovered, setHovered] = useState(false)
  const showOverlay = selected || hovered

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: 120, height: 104 }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: "#0F1620",
          border: "3px solid #ffffff",
          boxShadow: selected ? "0 0 20px rgba(255,255,255,0.15)" : undefined,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1 pointer-events-none select-none">
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">PROJECT</span>
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

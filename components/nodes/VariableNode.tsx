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
          background: "#06090E",
          border: `1.5px solid ${selected ? "#FFB300" : "#FFB30066"}`,
          boxShadow: selected ? "0 0 12px rgba(255,179,0,0.2)" : undefined,
        }}
      />
      <span
        className="relative z-10 font-mono text-[9px] text-[#FFB300] text-center leading-tight px-1 pointer-events-none select-none truncate"
        style={{ maxWidth: 52 }}
      >
        {data.label}
      </span>

      <Handle type="source" position={Position.Bottom} className="!bg-[#FFB30066]" />
      <Handle type="target" position={Position.Top} className="!bg-[#FFB30066]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import NodeOverlay from "./NodeOverlay"
import { useNodeHover } from "./useNodeHover"
import type { GraphNodeData } from "./types"

type FileNodeType = Node<GraphNodeData & { zoomLevel?: number }>

export default function FileNode({ data, selected, id }: NodeProps<FileNodeType>) {
  const { hovered, onMouseEnter, onMouseLeave } = useNodeHover(id, "file")
  const showOverlay = selected || hovered
  const showDetails = (data.zoomLevel ?? 1) >= 0.5

  return (
    <div
      className="relative flex flex-col gap-1 px-3 py-2"
      style={{
        width: 140,
        minHeight: 48,
        background: "#06090E",
        border: `1px solid ${selected ? "#00A3FF" : "#00A3FF44"}`,
        borderRadius: 4,
        boxShadow: selected ? "0 0 14px rgba(0,163,255,0.2)" : "0 0 6px rgba(0,163,255,0.06)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="font-mono text-[9px] text-[#00A3FF] uppercase tracking-widest pointer-events-none select-none">
        FILE
      </span>
      <span className="font-mono text-xs text-white truncate pointer-events-none select-none">
        {data.label}
      </span>
      {showDetails && data.path && (
        <span className="font-mono text-[9px] text-text-muted truncate pointer-events-none select-none">
          {data.path}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#00A3FF44]" />
      <Handle type="target" position={Position.Top} className="!bg-[#00A3FF44]" />

      {showOverlay && <NodeOverlay id={id} data={data} />}
    </div>
  )
}

"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import {
  Blocks,
  Braces,
  Code2,
  Database,
  Layers3,
  Paintbrush,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { GraphNodeData } from "./types"
import type { TechCategory } from "@/utils/techStack"

type TechNodeType = Node<GraphNodeData>

const CATEGORY_COLOR: Record<TechCategory, string> = {
  language: "#00A3FF",
  framework: "#00E676",
  styling: "#F472B6",
  state: "#FFB300",
  data: "#A78BFA",
  library: "#8FB3CC",
  tooling: "#4B5E74",
}

const CATEGORY_ICON: Record<TechCategory, LucideIcon> = {
  language: Code2,
  framework: Layers3,
  styling: Paintbrush,
  state: Braces,
  data: Database,
  library: Blocks,
  tooling: Wrench,
}

export default function TechNode({ data, selected }: NodeProps<TechNodeType>) {
  const category = data.techCategory ?? "library"
  const color = CATEGORY_COLOR[category]
  const Icon = CATEGORY_ICON[category]

  return (
    <div
      className="relative flex flex-col items-center gap-1 px-4 py-2.5"
      style={{
        minWidth: 124,
        background: "#06090E",
        border: `1.5px solid ${selected ? color : `${color}88`}`,
        borderRadius: 8,
        boxShadow: `0 0 12px ${color}33`,
      }}
    >
      <Icon size={22} color={color} className="pointer-events-none" />
      <span className="font-mono text-xs text-white pointer-events-none select-none whitespace-nowrap">
        {data.label}
      </span>
      {data.techVersion && (
        <span className="font-mono text-[9px] text-text-muted pointer-events-none select-none">
          v{data.techVersion}
        </span>
      )}

      <Handle type="target" position={Position.Top} style={{ background: `${color}88` }} />
      <Handle type="source" position={Position.Bottom} style={{ background: `${color}88` }} />
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import type { GraphNodeData, NodeKind } from "@/components/nodes/types"
import type { Node } from "@xyflow/react"

const KIND_ICON: Record<NodeKind, string> = {
  project: "◆",
  folder: "▣",
  file:   "□",
  function: "○",
  variable: "·",
}

const KIND_COLOR: Record<NodeKind, string> = {
  project:  "#ffffff",
  folder:   "#4B5E74",
  file:     "#00A3FF",
  function: "#00E676",
  variable: "#FFB300",
}

interface SearchBarProps {
  onFocus: (nodeId: string) => void
}

export default function SearchBar({ onFocus }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const nodes = useGraphStore((s) => s.nodes) as Node<GraphNodeData>[]
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim().length === 0
    ? []
    : nodes
        .filter((n) =>
          n.data.label.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10)

  // Derived: show the dropdown when focused and there are matches.
  const open = focused && results.length > 0

  function handleSelect(nodeId: string) {
    onFocus(nodeId)
    setQuery("")
    setFocused(false)
    inputRef.current?.blur()
  }

  return (
    <div className="absolute top-3 left-3 z-40 w-72 pointer-events-auto">
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search nodes…"
          className="w-full bg-bg-deep border border-border-muted rounded px-3 py-1.5 font-mono text-xs text-white placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-bg-panel border border-border-muted rounded shadow-xl overflow-hidden">
          {results.map((node) => {
            const kind = node.data.kind
            return (
              <button
                key={node.id}
                onMouseDown={() => handleSelect(node.id)}
                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-border-muted transition-colors text-left"
              >
                <span style={{ color: KIND_COLOR[kind], fontSize: 12 }}>
                  {KIND_ICON[kind]}
                </span>
                <span className="font-mono text-xs text-white truncate">{node.data.label}</span>
                <span className="ml-auto font-mono text-[9px] text-text-muted uppercase shrink-0">
                  {kind}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

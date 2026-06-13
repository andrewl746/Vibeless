"use client"

import { useState, useCallback } from "react"
import { useReactFlow } from "@xyflow/react"
import type { NodeKind } from "./types"

/**
 * Tracks hover state for a node and lifts it above its siblings (z-index) so
 * its click menu/overlay renders on top. Hover does NOT change the graph
 * layout — nodes never expand or reflow on hover.
 */
export function useNodeHover(id: string, _kind: NodeKind) {
  const [hovered, setHovered] = useState(false)
  const { updateNode } = useReactFlow()

  const onMouseEnter = useCallback(() => {
    setHovered(true)
    updateNode(id, { zIndex: 9999 })
  }, [id, updateNode])

  const onMouseLeave = useCallback(() => {
    setHovered(false)
    updateNode(id, { zIndex: 0 })
  }, [id, updateNode])

  return { hovered, onMouseEnter, onMouseLeave }
}

"use client"

import { useState, useCallback } from "react"
import { useReactFlow } from "@xyflow/react"
import { useGraphStore } from "@/store/useGraphStore"
import type { NodeKind } from "./types"

// Module-level timer shared across all node hook instances so that moving the
// cursor from a parent file onto one of its (newly revealed) child nodes
// cancels the pending collapse instead of flickering.
let clearTimer: ReturnType<typeof setTimeout> | null = null

function cancelClear() {
  if (clearTimer) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
}

function scheduleClear() {
  cancelClear()
  clearTimer = setTimeout(() => {
    useGraphStore.getState().setHoveredFileId(null)
    clearTimer = null
  }, 140)
}

export function useNodeHover(id: string, kind: NodeKind) {
  const [hovered, setHovered] = useState(false)
  const { updateNode } = useReactFlow()

  const onMouseEnter = useCallback(() => {
    setHovered(true)
    updateNode(id, { zIndex: 9999 })
    cancelClear()
    // Only file/folder nodes drive the bloom reveal. Hovering a revealed
    // child just keeps the existing bloom alive (handled by cancelClear).
    if (kind === "file" || kind === "folder") {
      useGraphStore.getState().setHoveredFileId(id)
    }
  }, [id, kind, updateNode])

  const onMouseLeave = useCallback(() => {
    setHovered(false)
    updateNode(id, { zIndex: 0 })
    scheduleClear()
  }, [id, updateNode])

  return { hovered, onMouseEnter, onMouseLeave }
}

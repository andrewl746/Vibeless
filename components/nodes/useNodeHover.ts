"use client"

import { useState, useCallback } from "react"
import { useReactFlow } from "@xyflow/react"

export function useNodeHover(id: string) {
  const [hovered, setHovered] = useState(false)
  const { updateNode } = useReactFlow()

  const onMouseEnter = useCallback(() => {
    setHovered(true)
    updateNode(id, { className: "node-hovered" })
  }, [id, updateNode])

  const onMouseLeave = useCallback(() => {
    setHovered(false)
    updateNode(id, { className: "" })
  }, [id, updateNode])

  return { hovered, onMouseEnter, onMouseLeave }
}

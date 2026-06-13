"use client"

import { useState, useCallback } from "react"
import { useReactFlow } from "@xyflow/react"

export function useNodeHover(id: string) {
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

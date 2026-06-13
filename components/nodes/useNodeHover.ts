"use client"

import { useState, useCallback, useRef } from "react"
import { useReactFlow } from "@xyflow/react"
import type { NodeKind } from "./types"
import type { XYPosition } from "@xyflow/react"

const BLOOM_Y_FN = 190    // how far below parent to place functions when bloomed
const BLOOM_Y_VAR = 360   // how far below parent for variables
const BLOOM_SPREAD_FN = 180  // horizontal spacing between functions
const BLOOM_SPREAD_VAR = 100 // horizontal spacing between variables

export function useNodeHover(id: string, kind: NodeKind) {
  const [hovered, setHovered] = useState(false)
  const { updateNode, getNodes, getEdges } = useReactFlow()
  const savedPositions = useRef<Record<string, XYPosition>>({})

  const onMouseEnter = useCallback(() => {
    setHovered(true)
    updateNode(id, { zIndex: 9999 })

    // Only bloom children for file/folder nodes
    if (kind !== "file" && kind !== "folder") return

    const nodes = getNodes()
    const edges = getEdges()
    const parent = nodes.find((n) => n.id === id)
    if (!parent) return

    const childIds = new Set(edges.filter((e) => e.source === id).map((e) => e.target))
    const children = nodes.filter((n) => childIds.has(n.id))

    const fnKids = children.filter((n) => (n.data as { kind: NodeKind }).kind === "function")
    const varKids = children.filter((n) => (n.data as { kind: NodeKind }).kind === "variable")

    // Save originals
    savedPositions.current = {}
    for (const child of [...fnKids, ...varKids]) {
      savedPositions.current[child.id] = { ...child.position }
    }

    // Bloom functions directly below parent, evenly spread
    fnKids.forEach((child, i) => {
      const total = fnKids.length
      const x = parent.position.x + (i - (total - 1) / 2) * BLOOM_SPREAD_FN
      const y = parent.position.y + BLOOM_Y_FN
      updateNode(child.id, { position: { x, y }, zIndex: 9990 })
    })

    // Bloom variables below functions
    varKids.forEach((child, i) => {
      const total = varKids.length
      const x = parent.position.x + (i - (total - 1) / 2) * BLOOM_SPREAD_VAR
      const y = parent.position.y + BLOOM_Y_VAR
      updateNode(child.id, { position: { x, y }, zIndex: 9990 })
    })
  }, [id, kind, updateNode, getNodes, getEdges])

  const onMouseLeave = useCallback(() => {
    setHovered(false)
    updateNode(id, { zIndex: 0 })

    // Restore all saved child positions
    for (const [childId, pos] of Object.entries(savedPositions.current)) {
      updateNode(childId, { position: pos, zIndex: 0 })
    }
    savedPositions.current = {}
  }, [id, updateNode])

  return { hovered, onMouseEnter, onMouseLeave }
}

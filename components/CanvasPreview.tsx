"use client"

import { useEffect } from "react"
import { useCanvasStore } from "@/store/useCanvasStore"
import { useGraphStore } from "@/store/useGraphStore"
import { buildGraphFromTree } from "@/utils/codeParser"
import CanvasEngine from "./canvas/CanvasEngine"

export default function CanvasPreview() {
  const activeNode = useCanvasStore((s) => s.activeNode)
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)

  useEffect(() => {
    if (!activeNode || isIsolationMode) return

    // Build the graph from the selected node's subtree
    const subtree = activeNode.type === "folder" && activeNode.children
      ? activeNode.children
      : [activeNode]

    const repoName = activeNode.name
    const { nodes, edges } = buildGraphFromTree(subtree, repoName)
    setNodes(nodes)
    setEdges(edges)
  }, [activeNode, isIsolationMode, setNodes, setEdges])

  return (
    <div className="w-full h-full">
      <CanvasEngine engineRef={undefined} />
    </div>
  )
}

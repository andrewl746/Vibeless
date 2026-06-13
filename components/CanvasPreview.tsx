"use client"

import { useEffect, useRef } from "react"
import { useCanvasStore } from "@/store/useCanvasStore"
import { useGraphStore } from "@/store/useGraphStore"
import { buildGraphFromTree } from "@/utils/codeParser"
import type { ScannedEntityMap } from "@/utils/codeScanner"
import type { FileTreeNode } from "@/utils/parseTree"
import CanvasEngine from "./canvas/CanvasEngine"

interface CanvasPreviewProps {
  owner: string
  repo: string
}

function collectFilePaths(nodes: FileTreeNode[]): string[] {
  const paths: string[] = []
  function walk(items: FileTreeNode[]) {
    for (const item of items) {
      if (item.type === "file") paths.push(item.path)
      if (item.children) walk(item.children)
    }
  }
  walk(nodes)
  return paths
}

export default function CanvasPreview({ owner, repo }: CanvasPreviewProps) {
  const activeNode = useCanvasStore((s) => s.activeNode)
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)
  const setScannedEntities = useGraphStore((s) => s.setScannedEntities)
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)
  const scanCache = useRef<Record<string, ScannedEntityMap>>({})

  useEffect(() => {
    if (!activeNode || isIsolationMode) return

    const subtree: FileTreeNode[] = activeNode.type === "folder" && activeNode.children
      ? activeNode.children
      : [activeNode]

    const cacheKey = activeNode.path
    const repoName = activeNode.name

    async function loadGraph() {
      let entityMap: ScannedEntityMap = {}

      if (scanCache.current[cacheKey]) {
        entityMap = scanCache.current[cacheKey]
      } else {
        const paths = collectFilePaths(subtree)
        if (paths.length > 0) {
          try {
            const res = await fetch("/api/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ owner, repo, paths }),
            })
            if (res.ok) {
              const data = await res.json() as { entityMap: ScannedEntityMap }
              entityMap = data.entityMap
              scanCache.current[cacheKey] = entityMap
            }
          } catch {
            // Silently fall back to structure-only graph
          }
        }
      }

      setScannedEntities(entityMap)
      const { nodes, edges } = buildGraphFromTree(subtree, repoName, entityMap)
      setNodes(nodes)
      setEdges(edges)
    }

    loadGraph()
  }, [activeNode, isIsolationMode, owner, repo, setNodes, setEdges, setScannedEntities])

  return (
    <div className="w-full h-full">
      <CanvasEngine engineRef={undefined} />
    </div>
  )
}

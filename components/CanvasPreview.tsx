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
  const setActiveNode = useCanvasStore((s) => s.setActiveNode)
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)
  const setScannedEntities = useGraphStore((s) => s.setScannedEntities)
  const exitIsolationMode = useGraphStore((s) => s.exitIsolationMode)
  const closeCodePane = useGraphStore((s) => s.closeCodePane)
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)
  const scanCache = useRef<Record<string, ScannedEntityMap>>({})

  // `activeNode` lives in a global store that survives client-side navigation
  // between repos, so on a repo change it still points at the OLD repo's node.
  const repoKey = `${owner}/${repo}`

  // On repo change, clear the selection + graph carried over from the old repo.
  useEffect(() => {
    setActiveNode(null)
    setNodes([])
    setEdges([])
    setScannedEntities({})
    exitIsolationMode()
    closeCodePane()
    scanCache.current = {}
  }, [repoKey, setActiveNode, setNodes, setEdges, setScannedEntities, exitIsolationMode, closeCodePane])

  useEffect(() => {
    // Read the *live* selection: the reset effect above runs first on a repo
    // change and clears it, so this avoids rebuilding the previous repo's graph
    // from a stale node captured in this render's closure.
    const node = useCanvasStore.getState().activeNode
    if (!node || isIsolationMode) return

    const subtree: FileTreeNode[] = node.type === "folder" && node.children
      ? node.children
      : [node]

    const cacheKey = node.path
    const repoName = node.name

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

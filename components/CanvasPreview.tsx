"use client"

import { useEffect, useRef } from "react"
import { useCanvasStore } from "@/store/useCanvasStore"
import { useGraphStore } from "@/store/useGraphStore"
import { buildGraphFromTree, computeImportGraph } from "@/utils/codeParser"
import type { ScannedEntityMap } from "@/utils/codeScanner"
import type { FileTreeNode } from "@/utils/parseTree"
import CanvasEngine from "./canvas/CanvasEngine"

interface CanvasPreviewProps {
  owner: string
  repo: string
  sha: string
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

export default function CanvasPreview({ owner, repo, sha }: CanvasPreviewProps) {
  // Only state values that should *trigger* effects are subscribed; the store
  // actions are read via getState() inside effects so the dependency arrays stay
  // small and constant (a changing deps-array size breaks Fast Refresh / React).
  const activeNode = useCanvasStore((s) => s.activeNode)
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)
  const scanCache = useRef<Record<string, ScannedEntityMap>>({})

  // `activeNode` lives in a global store that survives client-side navigation
  // between repos, so on a repo change it still points at the OLD repo's node.
  const repoKey = `${owner}/${repo}`

  // On repo change, clear the selection + graph carried over from the old repo.
  useEffect(() => {
    useCanvasStore.getState().setActiveNode(null)
    const g = useGraphStore.getState()
    g.setNodes([])
    g.setEdges([])
    g.setScannedEntities({})
    g.exitIsolationMode()
    g.closeCodePane()
    g.clearDescription()
    g.clearVulnerability()
    g.setRiskData({}, {})
    scanCache.current = {}
  }, [repoKey])

  // Cache token for AI output: `owner/repo@treeSha`. Changing it prunes stale
  // (modified-repo) entries so cached text persists until the repo changes.
  useEffect(() => {
    useGraphStore.getState().setRepoCacheToken(`${owner}/${repo}@${sha}`)
  }, [owner, repo, sha])

  // Repo-wide risk index: scan the whole repo once per repo and count how many
  // files import each path. Drives the Blast Radius heatmap independent of the
  // currently-displayed subtree.
  useEffect(() => {
    let cancelled = false
    async function loadRiskIndex() {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo, full: true }),
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { entityMap: ScannedEntityMap }
        if (cancelled) return
        const { counts, importers } = computeImportGraph(data.entityMap)
        useGraphStore.getState().setRiskData(counts, importers)
      } catch {
        // Heatmap simply stays neutral if the risk scan fails.
      }
    }
    loadRiskIndex()
    return () => {
      cancelled = true
    }
  }, [owner, repo])

  useEffect(() => {
    // Read the *live* selection: the reset effect above runs first on a repo
    // change and clears it, so this avoids rebuilding the previous repo's graph
    // from a stale node captured in this render's closure. `activeNode` stays in
    // the deps purely to re-trigger this effect when the selection changes.
    void activeNode
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

      const g = useGraphStore.getState()
      g.setScannedEntities(entityMap)
      const { nodes, edges } = buildGraphFromTree(subtree, repoName, entityMap)
      g.setNodes(nodes)
      g.setEdges(edges)
    }

    loadGraph()
  }, [activeNode, isIsolationMode, owner, repo])

  return (
    <div className="w-full h-full">
      <CanvasEngine engineRef={undefined} />
    </div>
  )
}

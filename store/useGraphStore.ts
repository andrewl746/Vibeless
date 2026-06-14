"use client"

import { create } from "zustand"
import type { Node, Edge } from "@xyflow/react"
import type { ScannedEntityMap } from "@/utils/codeScanner"
import type { NodeKind, ViewMode, RiskLevel } from "@/components/nodes/types"

interface GraphSnapshot {
  nodes: Node[]
  edges: Edge[]
}

// Semantic-zoom tier: which kinds of nodes are revealed at the current zoom.
// 0 = files/folders only, 1 = + functions, 2 = + variables.
function tierForZoom(zoom: number): number {
  return zoom >= 1.2 ? 2 : zoom >= 0.6 ? 1 : 0
}

interface GraphStore {
  nodes: Node[]
  edges: Edge[]
  mainGraphSnapshot: GraphSnapshot | null
  isIsolationMode: boolean
  isolationTargetName: string | null
  isolationTargetKind: NodeKind | null
  activeIsolationTarget: string | null
  zoomLevel: number
  // The applied semantic-zoom tier that drives the visible node set. While
  // layoutLocked is true it is frozen so zooming doesn't expand/collapse nodes.
  appliedZoomTier: number
  layoutLocked: boolean
  allScannedEntities: ScannedEntityMap

  // AI description modal
  isDescLoading: boolean
  isDescStreaming: boolean
  activeDescriptionText: string | null
  descTargetName: string | null
  descError: string | null
  descFetchId: number

  // Split-view code preview pane
  isCodePaneOpen: boolean
  activeCodeSnippet: string | null
  activeCodeLanguage: string
  activeCodeFilename: string | null

  // Cache token for AI output: `owner/repo@treeSha`. Invalidates on repo change.
  repoCacheToken: string

  // Global visual lens
  currentViewMode: ViewMode
  // Repo-wide inward import counts + importer lists, keyed by file path.
  riskCounts: Record<string, number>
  riskImporters: Record<string, string[]>

  // AI vulnerability / blast-impact popup
  isVulnLoading: boolean
  isVulnStreaming: boolean
  activeVulnText: string | null
  vulnTargetName: string | null
  vulnError: string | null
  vulnFetchId: number
  vulnRiskLevel: RiskLevel
  vulnUsages: string[]

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setZoomLevel: (zoom: number) => void
  toggleLayoutLocked: () => void
  openCodePane: (code: string, lang: string, filename?: string) => void
  closeCodePane: () => void
  setViewMode: (mode: ViewMode) => void
  setRepoCacheToken: (token: string) => void
  setRiskData: (
    counts: Record<string, number>,
    importers: Record<string, string[]>
  ) => void
  fetchNodeVulnerability: (
    name: string,
    path: string,
    code: string,
    riskLevel: RiskLevel,
    usages: string[]
  ) => Promise<void>
  clearVulnerability: () => void
  fetchNodeDescription: (
    name: string,
    type: string,
    path: string,
    code: string
  ) => Promise<void>
  clearDescription: () => void
  setScannedEntities: (map: ScannedEntityMap) => void
  enterIsolationMode: (
    targetNodeId: string,
    targetName: string,
    targetKind: NodeKind,
    dependencies: Node[],
    dependencyEdges: Edge[]
  ) => void
  exitIsolationMode: () => void
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  mainGraphSnapshot: null,
  isIsolationMode: false,
  isolationTargetName: null,
  isolationTargetKind: null,
  activeIsolationTarget: null,
  zoomLevel: 1,
  appliedZoomTier: tierForZoom(1),
  layoutLocked: false,
  allScannedEntities: {},

  isDescLoading: false,
  isDescStreaming: false,
  activeDescriptionText: null,
  descTargetName: null,
  descError: null,
  descFetchId: 0,

  isCodePaneOpen: false,
  activeCodeSnippet: null,
  activeCodeLanguage: "typescript",
  activeCodeFilename: null,

  repoCacheToken: "",
  currentViewMode: "TREE",
  riskCounts: {},
  riskImporters: {},

  isVulnLoading: false,
  isVulnStreaming: false,
  activeVulnText: null,
  vulnTargetName: null,
  vulnError: null,
  vulnFetchId: 0,
  vulnRiskLevel: "low",
  vulnUsages: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setZoomLevel: (zoom) =>
    set((s) => ({
      zoomLevel: zoom,
      // Freeze the tier while locked; otherwise track the live zoom.
      appliedZoomTier: s.layoutLocked ? s.appliedZoomTier : tierForZoom(zoom),
    })),
  toggleLayoutLocked: () =>
    set((s) => {
      const nowLocked = !s.layoutLocked
      return {
        layoutLocked: nowLocked,
        // On unlock, resync the tier to the current zoom so it resumes live.
        appliedZoomTier: nowLocked ? s.appliedZoomTier : tierForZoom(s.zoomLevel),
      }
    }),

  openCodePane: (code, lang, filename) =>
    set({
      isCodePaneOpen: true,
      activeCodeSnippet: code,
      activeCodeLanguage: lang || "typescript",
      activeCodeFilename: filename ?? null,
    }),

  // The canvas re-centres itself via a layout effect in CanvasEngine that
  // watches isCodePaneOpen, once the slide animation settles.
  closeCodePane: () => set({ isCodePaneOpen: false }),

  setViewMode: (mode) => set({ currentViewMode: mode }),

  setRepoCacheToken: (token) => set({ repoCacheToken: token }),

  setRiskData: (counts, importers) => set({ riskCounts: counts, riskImporters: importers }),

  fetchNodeVulnerability: async (name, path, code, riskLevel, usages) => {
    const cacheToken = get().repoCacheToken

    set((s) => ({
      isVulnLoading: true,
      isVulnStreaming: false,
      activeVulnText: "",
      vulnError: null,
      vulnTargetName: name,
      vulnRiskLevel: riskLevel,
      vulnUsages: usages,
      vulnFetchId: s.vulnFetchId + 1,
    }))

    try {
      const res = await fetch("/api/vulnerability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, path, code, riskLevel, usages, cacheToken }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        set({ vulnError: data.error ?? "Failed to generate impact report.", isVulnLoading: false })
        return
      }
      if (!res.body) {
        set({ vulnError: "No response body from the impact service.", isVulnLoading: false })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let first = true
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const tokenText = decoder.decode(value, { stream: true })
        if (first) {
          set({ isVulnLoading: false, isVulnStreaming: true })
          first = false
        }
        set((s) => ({ activeVulnText: (s.activeVulnText ?? "") + tokenText }))
      }
      set({ isVulnLoading: false, isVulnStreaming: false })
    } catch {
      set({
        vulnError: "Network error — could not reach the impact service.",
        isVulnLoading: false,
        isVulnStreaming: false,
      })
    }
  },

  clearVulnerability: () =>
    set({
      isVulnLoading: false,
      isVulnStreaming: false,
      activeVulnText: null,
      vulnTargetName: null,
      vulnError: null,
      vulnUsages: [],
    }),

  fetchNodeDescription: async (name, type, path, code) => {
    const cacheToken = get().repoCacheToken

    set((s) => ({
      isDescLoading: true,
      isDescStreaming: false,
      activeDescriptionText: "",
      descError: null,
      descTargetName: name,
      descFetchId: s.descFetchId + 1,
    }))

    try {
      // Caching is handled server-side (shared Firestore): the route serves a
      // cache hit as a one-shot stream, or streams Claude + persists on finish.
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, path, codeContext: code, cacheToken }),
      })

      // Errors are returned as JSON before the stream begins.
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        set({ descError: data.error ?? "Failed to generate description.", isDescLoading: false })
        return
      }

      if (!res.body) {
        set({ descError: "No response body from the description service.", isDescLoading: false })
        return
      }

      // Read the text token stream and append chunks as they arrive.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let first = true
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const tokenText = decoder.decode(value, { stream: true })
        if (first) {
          // First byte in — drop the loading state so text renders live.
          set({ isDescLoading: false, isDescStreaming: true })
          first = false
        }
        set((s) => ({ activeDescriptionText: (s.activeDescriptionText ?? "") + tokenText }))
      }
      set({ isDescLoading: false, isDescStreaming: false })
    } catch {
      set({
        descError: "Network error — could not reach the description service.",
        isDescLoading: false,
        isDescStreaming: false,
      })
    }
  },

  clearDescription: () =>
    set({
      isDescLoading: false,
      isDescStreaming: false,
      activeDescriptionText: null,
      descTargetName: null,
      descError: null,
    }),
  setScannedEntities: (map) => set({ allScannedEntities: map }),

  enterIsolationMode: (targetNodeId, targetName, targetKind, dependencies, dependencyEdges) => {
    const { nodes, edges } = get()
    set({
      mainGraphSnapshot: { nodes, edges },
      isIsolationMode: true,
      isolationTargetName: targetName,
      isolationTargetKind: targetKind,
      activeIsolationTarget: targetNodeId,
      nodes: dependencies,
      edges: dependencyEdges,
    })
  },

  exitIsolationMode: () => {
    const { mainGraphSnapshot } = get()
    if (!mainGraphSnapshot) return
    set({
      nodes: mainGraphSnapshot.nodes,
      edges: mainGraphSnapshot.edges,
      mainGraphSnapshot: null,
      isIsolationMode: false,
      isolationTargetName: null,
      isolationTargetKind: null,
      activeIsolationTarget: null,
    })
  },
}))

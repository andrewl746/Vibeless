"use client"

import { create } from "zustand"
import type { Node, Edge } from "@xyflow/react"
import type { ScannedEntityMap } from "@/utils/codeScanner"
import type { NodeKind } from "@/components/nodes/types"

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

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setZoomLevel: (zoom: number) => void
  toggleLayoutLocked: () => void
  openCodePane: (code: string, lang: string, filename?: string) => void
  closeCodePane: () => void
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

  fetchNodeDescription: async (name, type, path, code) => {
    set((s) => ({
      isDescLoading: true,
      isDescStreaming: false,
      activeDescriptionText: "",
      descError: null,
      descTargetName: name,
      descFetchId: s.descFetchId + 1,
    }))
    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, path, codeContext: code }),
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
        const token = decoder.decode(value, { stream: true })
        if (first) {
          // First byte in — drop the loading state so text renders live.
          set({ isDescLoading: false, isDescStreaming: true })
          first = false
        }
        set((s) => ({ activeDescriptionText: (s.activeDescriptionText ?? "") + token }))
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

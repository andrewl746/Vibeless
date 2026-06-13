"use client"

import { create } from "zustand"
import type { Node, Edge } from "@xyflow/react"
import type { ScannedEntityMap } from "@/utils/codeScanner"
import type { NodeKind } from "@/components/nodes/types"

interface GraphSnapshot {
  nodes: Node[]
  edges: Edge[]
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
  hoveredFileId: string | null
  allScannedEntities: ScannedEntityMap

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setZoomLevel: (zoom: number) => void
  setHoveredFileId: (id: string | null) => void
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
  hoveredFileId: null,
  allScannedEntities: {},

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setHoveredFileId: (id) => set({ hoveredFileId: id }),
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

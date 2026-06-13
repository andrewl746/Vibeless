"use client"

import { create } from "zustand"
import type { Node, Edge } from "@xyflow/react"

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
  zoomLevel: number

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setZoomLevel: (zoom: number) => void
  enterIsolationMode: (targetNodeId: string, targetName: string, dependencies: Node[], dependencyEdges: Edge[]) => void
  exitIsolationMode: () => void
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  mainGraphSnapshot: null,
  isIsolationMode: false,
  isolationTargetName: null,
  zoomLevel: 1,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  enterIsolationMode: (targetNodeId, targetName, dependencies, dependencyEdges) => {
    const { nodes, edges } = get()
    set({
      mainGraphSnapshot: { nodes, edges },
      isIsolationMode: true,
      isolationTargetName: targetName,
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
    })
  },
}))

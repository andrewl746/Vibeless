"use client"

import { useCallback, useEffect, useImperativeHandle, forwardRef, useMemo, useRef } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useOnViewportChange,
  type Node,
  type Edge,
  type Viewport,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useGraphStore } from "@/store/useGraphStore"
import { useCanvasStore } from "@/store/useCanvasStore"
import { layoutGraph } from "@/utils/layout"
import IsolationOverlay from "./IsolationOverlay"
import DescriptionModal from "./DescriptionModal"
import VulnerabilityModal from "./VulnerabilityModal"
import ViewModeDock from "./ViewModeDock"
import SearchBar from "./SearchBar"
import SimulationToolbar from "./SimulationToolbar"
import RepoAssistant from "./RepoAssistant"
import AnimatedFlowEdge from "./AnimatedFlowEdge"
import ProjectNode from "@/components/nodes/ProjectNode"
import FolderNode from "@/components/nodes/FolderNode"
import FileNode from "@/components/nodes/FileNode"
import FunctionNode from "@/components/nodes/FunctionNode"
import VariableNode from "@/components/nodes/VariableNode"
import TechNode from "@/components/nodes/TechNode"
import { buildTechStackGraph } from "@/utils/techGraph"
import type { GraphNodeData, RiskLevel } from "@/components/nodes/types"

export interface CanvasEngineHandle {
  focusNode: (nodeId: string) => void
}

const nodeTypes: NodeTypes = {
  projectNode: ProjectNode as NodeTypes[string],
  folderNode: FolderNode as NodeTypes[string],
  fileNode: FileNode as NodeTypes[string],
  functionNode: FunctionNode as NodeTypes[string],
  variableNode: VariableNode as NodeTypes[string],
  techNode: TechNode as NodeTypes[string],
}

const edgeTypes: EdgeTypes = {
  animatedFlowEdge: AnimatedFlowEdge as EdgeTypes[string],
}

const CanvasInner = forwardRef<CanvasEngineHandle>(function CanvasInner(_props, ref) {
  const storeNodes = useGraphStore((s) => s.nodes) as Node<GraphNodeData>[]
  const storeEdges = useGraphStore((s) => s.edges)
  const setZoomLevel = useGraphStore((s) => s.setZoomLevel)
  const zoomLevel = useGraphStore((s) => s.zoomLevel)
  const layoutLocked = useGraphStore((s) => s.layoutLocked)
  const toggleLayoutLocked = useGraphStore((s) => s.toggleLayoutLocked)
  const isCodePaneOpen = useGraphStore((s) => s.isCodePaneOpen)
  const currentViewMode = useGraphStore((s) => s.currentViewMode)
  const techStack = useGraphStore((s) => s.techStack)
  const isTechMode = currentViewMode === "TECH_STACK"
  const riskCounts = useGraphStore((s) => s.riskCounts)
  const isSimulationActive = useGraphStore((s) => s.isSimulationActive)
  const simulationNodeStates = useGraphStore((s) => s.simulationNodeStates)
  const simulationEdgeStates = useGraphStore((s) => s.simulationEdgeStates)
  // The applied semantic-zoom tier (frozen by the store while layout is locked).
  const effectiveTier = useGraphStore((s) => s.appliedZoomTier)
  const setStoreNodes = useGraphStore((s) => s.setNodes)
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)

  const activeNode = useCanvasStore((s) => s.activeNode)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const { setCenter, getNode, fitView, zoomIn, zoomOut } = useReactFlow()

  // When the sidebar selection changes we want to reset the canvas to a fresh
  // fitted view. The actual fitView() runs in the layout effect below, once the
  // new graph has been laid out.
  const fitPendingRef = useRef(false)

  // Compute the visible node set and lay it out with dagre. Re-runs only when
  // the graph, the zoom tier, isolation, or view mode changes — never on hover.
  useEffect(() => {
    if (isTechMode) {
      // Tech Stack lens: show the detected stack as a connected flow graph,
      // independent of the file selection.
      const { nodes: tNodes, edges: tEdges } = buildTechStackGraph(techStack)
      setNodes(layoutGraph(tNodes, tEdges))
      setEdges(tEdges)
    } else {
      const visible = storeNodes.filter((n) => {
        const k = n.data.kind
        if (isIsolationMode) return true
        if (k !== "function" && k !== "variable") return true
        // Functions/variables are revealed purely by zooming in.
        if (k === "function") return effectiveTier >= 1
        return effectiveTier >= 2 // variable
      })

      const visibleIds = new Set(visible.map((n) => n.id))
      const visibleEdges = storeEdges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
      )

      setNodes(layoutGraph(visible, visibleEdges))
      setEdges(visibleEdges)
    }

    // After a sidebar selection or mode switch rebuilds the graph, reset to a
    // fresh fitted view.
    if (fitPendingRef.current) {
      fitPendingRef.current = false
      requestAnimationFrame(() => fitView({ duration: 600, padding: 0.2 }))
    }
  }, [storeNodes, storeEdges, effectiveTier, isIsolationMode, isTechMode, techStack, setNodes, setEdges, fitView])

  // Switching into/out of the Tech Stack lens swaps the entire graph — refit.
  useEffect(() => {
    fitPendingRef.current = true
  }, [isTechMode])

  useOnViewportChange({
    onChange: useCallback(
      (viewport: Viewport) => setZoomLevel(viewport.zoom),
      [setZoomLevel]
    ),
  })

  // Sidebar selection → flag a fresh fit; the layout effect performs it once
  // the rebuilt graph has been laid out.
  useEffect(() => {
    fitPendingRef.current = true
  }, [activeNode])

  // When the split code pane slides open/closed the canvas container resizes.
  // Re-centre once the 300ms width animation settles. Skip the initial mount.
  const codePaneMountedRef = useRef(false)
  useEffect(() => {
    if (!codePaneMountedRef.current) {
      codePaneMountedRef.current = true
      return
    }
    const t = setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 320)
    return () => clearTimeout(t)
  }, [isCodePaneOpen, fitView])

  useImperativeHandle(ref, () => ({
    focusNode: (nodeId: string) => {
      const rfNode = getNode(nodeId)
      if (rfNode) {
        setCenter(rfNode.position.x + 80, rfNode.position.y + 30, { zoom: 1.4, duration: 600 })
      }
    },
  }))

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      setStoreNodes(
        storeNodes.map((n) =>
          n.id === node.id ? { ...n, position: node.position } : n
        )
      )
    },
    [storeNodes, setStoreNodes]
  )

  // Inject the raw zoom (detail text), the active view mode, and the repo-wide
  // risk level (keyed by file path) so nodes can switch into the heatmap lens
  // without re-layout. Counts come from the repo-wide scan, not the displayed
  // subtree, so hub files read as critical from any folder.
  const enrichedNodes = useMemo(
    () =>
      nodes.map((n) => {
        const path = (n.data as GraphNodeData).path
        const inward = path ? riskCounts[path] ?? 0 : 0
        const riskLevel: RiskLevel =
          inward >= 4 ? "critical" : inward >= 1 ? "moderate" : "low"
        return {
          ...n,
          data: {
            ...n.data,
            zoomLevel,
            viewMode: currentViewMode,
            riskLevel,
            inwardCount: inward,
            simulationStatus: simulationNodeStates[n.id] ?? "idle",
          },
        }
      }),
    [
      nodes,
      zoomLevel,
      currentViewMode,
      riskCounts,
      simulationNodeStates,
    ]
  )

  const enrichedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const simulationState = simulationEdgeStates[edge.id]
        const shouldAnimate =
          isSimulationActive || (simulationState && simulationState.status !== "idle")
        return shouldAnimate
          ? {
              ...edge,
              type: "animatedFlowEdge",
            }
          : edge
      }),
    [edges, isSimulationActive, simulationEdgeStates]
  )

  function handleFocusNode(id: string) {
    const rfNode = getNode(id)
    if (rfNode) setCenter(rfNode.position.x + 80, rfNode.position.y + 30, { zoom: 1.4, duration: 600 })
  }

  return (
    <div className="relative w-full h-full">
      <IsolationOverlay />
      <DescriptionModal />
      <VulnerabilityModal />
      <ViewModeDock />
      <SearchBar onFocus={handleFocusNode} />
      {/* Simulation runs on the file graph — irrelevant in the Tech Stack lens */}
      {!isTechMode && <SimulationToolbar />}
      <RepoAssistant />

      <ReactFlow
        nodes={enrichedNodes}
        edges={enrichedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        style={{ background: "#06090E" }}
        defaultEdgeOptions={{
          style: { stroke: "#141B24", strokeWidth: 1.5 },
          animated: false,
        }}
      >
        <Background color="#141B24" gap={24} size={1} />
        <Panel position="bottom-left" style={{ margin: 10 }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            background: "#090D14",
            border: "1px solid #141B24",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            {[
              {
                title: "Zoom in",
                onClick: () => zoomIn({ duration: 200 }),
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                ),
              },
              {
                title: "Zoom out",
                onClick: () => zoomOut({ duration: 200 }),
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13H5v-2h14v2z"/>
                  </svg>
                ),
              },
              {
                title: "Fit view",
                onClick: () => fitView({ duration: 400, padding: 0.2 }),
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6z"/>
                  </svg>
                ),
              },
            ].map(({ title, onClick, icon }, i, arr) => (
              <button
                key={title}
                title={title}
                onClick={onClick}
                style={{
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  borderBottom: i < arr.length - 1 ? "1px solid #141B24" : "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                {icon}
              </button>
            ))}
            {/* Divider before lock */}
            <div style={{ height: 1, background: "#141B24" }} />
            <button
              onClick={toggleLayoutLocked}
              title={layoutLocked ? "Unlock expand/collapse" : "Lock expand/collapse"}
              style={{
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: layoutLocked ? "#1a3a5c" : "transparent",
                border: "none",
                cursor: "pointer",
                color: layoutLocked ? "#00A3FF" : "#6B7280",
              }}
            >
              {layoutLocked ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1C9.24 1 7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                </svg>
              )}
            </button>
          </div>
        </Panel>
        <MiniMap
          position="top-right"
          style={{
            margin: 12,
            background: "rgba(9, 13, 20, 0.94)",
            border: "1px solid #263244",
            borderRadius: 8,
            boxShadow: "0 0 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.03)",
            overflow: "hidden",
          }}
          nodeColor={(n) => {
            const kind = (n.data as GraphNodeData).kind
            if (kind === "project") return "#ffffff"
            if (kind === "folder") return "#1E2A38"
            if (kind === "file") return "#00A3FF44"
            if (kind === "function") return "#00E67644"
            if (kind === "tech") return "#00E67655"
            return "#FFB30044"
          }}
        />
      </ReactFlow>

      {!isTechMode && storeNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
            [ CANVAS ]
          </span>
          <p className="font-mono text-xs text-text-muted text-center leading-relaxed">
            Select a file or folder in the sidebar<br />to load it onto the graph.
          </p>
        </div>
      )}

      {isTechMode && techStack.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
            [ TECH STACK ]
          </span>
          <p className="font-mono text-xs text-text-muted text-center leading-relaxed">
            No tech stack detected for this repository.
          </p>
        </div>
      )}
    </div>
  )
})

export default function CanvasEngine({ engineRef }: { engineRef?: React.Ref<CanvasEngineHandle> }) {
  return (
    <ReactFlowProvider>
      <CanvasInner ref={engineRef} />
    </ReactFlowProvider>
  )
}

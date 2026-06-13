"use client"

import { useCallback, useEffect, useImperativeHandle, forwardRef, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useOnViewportChange,
  type Node,
  type Edge,
  type Viewport,
  type NodeTypes,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useGraphStore } from "@/store/useGraphStore"
import { useCanvasStore } from "@/store/useCanvasStore"
import { layoutGraph } from "@/utils/layout"
import IsolationOverlay from "./IsolationOverlay"
import SearchBar from "./SearchBar"
import ProjectNode from "@/components/nodes/ProjectNode"
import FolderNode from "@/components/nodes/FolderNode"
import FileNode from "@/components/nodes/FileNode"
import FunctionNode from "@/components/nodes/FunctionNode"
import VariableNode from "@/components/nodes/VariableNode"
import type { GraphNodeData } from "@/components/nodes/types"

export interface CanvasEngineHandle {
  focusNode: (nodeId: string) => void
}

const nodeTypes: NodeTypes = {
  projectNode: ProjectNode as NodeTypes[string],
  folderNode: FolderNode as NodeTypes[string],
  fileNode: FileNode as NodeTypes[string],
  functionNode: FunctionNode as NodeTypes[string],
  variableNode: VariableNode as NodeTypes[string],
}

const CanvasInner = forwardRef<CanvasEngineHandle>(function CanvasInner(_props, ref) {
  const storeNodes = useGraphStore((s) => s.nodes) as Node<GraphNodeData>[]
  const storeEdges = useGraphStore((s) => s.edges)
  const setZoomLevel = useGraphStore((s) => s.setZoomLevel)
  const zoomLevel = useGraphStore((s) => s.zoomLevel)
  const setStoreNodes = useGraphStore((s) => s.setNodes)
  const isIsolationMode = useGraphStore((s) => s.isIsolationMode)

  const activeNode = useCanvasStore((s) => s.activeNode)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const { setCenter, getNode } = useReactFlow()

  // Only the zoom *tier* matters for visibility — depend on that, not the raw
  // (continuously changing) zoom value, so dagre doesn't re-run every frame.
  const zoomTier = zoomLevel >= 1.2 ? 2 : zoomLevel >= 0.6 ? 1 : 0

  // Compute the visible node set and lay it out with dagre. Re-runs only when
  // the graph, the zoom tier, or isolation state changes — never on hover.
  useEffect(() => {
    const visible = storeNodes.filter((n) => {
      const k = n.data.kind
      if (isIsolationMode) return true
      if (k !== "function" && k !== "variable") return true
      // Functions/variables are revealed purely by zooming in.
      if (k === "function") return zoomTier >= 1
      return zoomTier >= 2 // variable
    })

    const visibleIds = new Set(visible.map((n) => n.id))
    const visibleEdges = storeEdges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    )

    setNodes(layoutGraph(visible, visibleEdges))
    setEdges(visibleEdges)
  }, [storeNodes, storeEdges, zoomTier, isIsolationMode, setNodes, setEdges])

  useOnViewportChange({
    onChange: useCallback(
      (viewport: Viewport) => setZoomLevel(viewport.zoom),
      [setZoomLevel]
    ),
  })

  // Sidebar selection → camera focus
  useEffect(() => {
    if (!activeNode) return
    const matchId = `node::${activeNode.path}`
    const rfNode = getNode(matchId)
    if (rfNode) {
      setCenter(rfNode.position.x + 80, rfNode.position.y + 30, { zoom: 1.2, duration: 600 })
    }
  }, [activeNode, setCenter, getNode])

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

  // Inject the raw zoom so nodes can show/hide their detail text
  const enrichedNodes = useMemo(
    () => nodes.map((n) => ({ ...n, data: { ...n.data, zoomLevel } })),
    [nodes, zoomLevel]
  )

  function handleFocusNode(id: string) {
    const rfNode = getNode(id)
    if (rfNode) setCenter(rfNode.position.x + 80, rfNode.position.y + 30, { zoom: 1.4, duration: 600 })
  }

  return (
    <div className="relative w-full h-full">
      <IsolationOverlay />
      <SearchBar onFocus={handleFocusNode} />

      <ReactFlow
        nodes={enrichedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
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
        <Controls
          showInteractive={false}
          style={{
            background: "#090D14",
            border: "1px solid #141B24",
            borderRadius: 6,
          }}
        />
        <MiniMap
          style={{
            background: "#090D14",
            border: "1px solid #141B24",
          }}
          nodeColor={(n) => {
            const kind = (n.data as GraphNodeData).kind
            if (kind === "project") return "#ffffff"
            if (kind === "folder") return "#1E2A38"
            if (kind === "file") return "#00A3FF44"
            if (kind === "function") return "#00E67644"
            return "#FFB30044"
          }}
        />
      </ReactFlow>

      {storeNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
            [ CANVAS ]
          </span>
          <p className="font-mono text-xs text-text-muted text-center leading-relaxed">
            Select a file or folder in the sidebar<br />to load it onto the graph.
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

import dagre from "dagre"
import type { Node, Edge } from "@xyflow/react"
import type { GraphNodeData, NodeKind } from "@/components/nodes/types"

// Rough render size per node kind — dagre reserves this much space so nodes
// never overlap, regardless of how many siblings/children are visible.
const SIZE: Record<NodeKind, { w: number; h: number }> = {
  project:  { w: 140, h: 120 },
  folder:   { w: 180, h: 84 },
  file:     { w: 160, h: 76 },
  function: { w: 190, h: 48 },
  variable: { w: 80,  h: 80 },
}

/**
 * Lay out the given nodes/edges top-to-bottom with dagre. Returns new node
 * objects with positions that are guaranteed not to overlap. Positions are
 * converted from dagre's center-anchor to React Flow's top-left anchor.
 */
export function layoutGraph(
  nodes: Node<GraphNodeData>[],
  edges: Edge[]
): Node<GraphNodeData>[] {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 80, marginx: 40, marginy: 40 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const n of nodes) {
    const size = SIZE[n.data.kind] ?? { w: 150, h: 64 }
    g.setNode(n.id, { width: size.w, height: size.h })
  }
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target)
    }
  }

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    if (!pos) return n
    return {
      ...n,
      position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 },
    }
  })
}

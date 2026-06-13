import type { Node, Edge } from "@xyflow/react"
import type { GraphNodeData, NodeKind } from "@/components/nodes/types"
import type { FileTreeNode } from "./parseTree"
import { isGraphNode } from "./parseTree"
import type { ScannedEntityMap } from "./codeScanner"

const IMPORT_RE = /^import\s+.*?from\s+['"](.+)['"]/gm

function layoutX(index: number, total: number, spread = 260): number {
  return (index - (total - 1) / 2) * spread
}

/** Build graph from a FileTreeNode tree, enriched with scan data */
export function buildGraphFromTree(
  tree: FileTreeNode[],
  repoName: string,
  entityMap: ScannedEntityMap = {}
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const nodes: Node<GraphNodeData>[] = []
  const edges: Edge[] = []

  const projectId = `project::${repoName}`
  nodes.push({
    id: projectId,
    type: "projectNode",
    position: { x: 0, y: 0 },
    data: { label: repoName, kind: "project" as NodeKind },
  })

  const graphItems = tree.filter(isGraphNode)
  graphItems.forEach((item, i) => {
    const x = layoutX(i, graphItems.length, 220)
    addNodeRecursive(item, projectId, x, 160, nodes, edges, entityMap)
  })

  // Import-based dependency edges
  const fileNodes = nodes.filter((n) => n.data.kind === "file" && n.data.path)
  for (const node of fileNodes) {
    const src = entityMap[node.data.path!]?.source
    if (!src) continue
    IMPORT_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = IMPORT_RE.exec(src))) {
      const imp = m[1]
      const target = fileNodes.find((fn) => fn.data.path?.includes(imp.replace(/^\.\//, "")))
      if (target && target.id !== node.id) {
        edges.push({
          id: `e-import-${node.id}-${target.id}`,
          source: node.id,
          target: target.id,
          style: { stroke: "#00A3FF33", strokeDasharray: "4 3" },
        })
      }
    }
  }

  return { nodes, edges }
}

function addNodeRecursive(
  item: FileTreeNode,
  parentId: string,
  x: number,
  y: number,
  nodes: Node<GraphNodeData>[],
  edges: Edge[],
  entityMap: ScannedEntityMap
) {
  if (!isGraphNode(item)) return

  const id = `node::${item.path}`
  const kind: NodeKind = item.type === "folder" ? "folder" : "file"
  const nodeType = item.type === "folder" ? "folderNode" : "fileNode"
  const scanned = entityMap[item.path]

  nodes.push({
    id,
    type: nodeType,
    position: { x, y },
    data: {
      label: item.name,
      kind,
      path: item.path,
      code: scanned?.source,
    },
  })
  edges.push({ id: `e-${parentId}-${id}`, source: parentId, target: id })

  if (item.type === "folder" && item.children) {
    const children = item.children.filter(isGraphNode)
    children.forEach((child, ci) => {
      const cx = x + layoutX(ci, children.length, 180)
      addNodeRecursive(child, id, cx, y + 140, nodes, edges, entityMap)
    })
  }

  if (item.type === "file" && scanned) {
    const fnCount = scanned.functions.length
    scanned.functions.forEach((fn, i) => {
      const fnId = `fn::${item.path}::${fn.name}`
      nodes.push({
        id: fnId,
        type: "functionNode",
        position: { x: x + layoutX(i, fnCount, 160), y: y + 130 },
        data: {
          label: fn.name,
          kind: "function" as NodeKind,
          path: item.path,
          code: fn.snippet,
        },
      })
      edges.push({ id: `e-${id}-${fnId}`, source: id, target: fnId })
    })

    const vars = scanned.variables.slice(0, 12)
    vars.forEach((v, i) => {
      const vId = `var::${item.path}::${v.name}`
      nodes.push({
        id: vId,
        type: "variableNode",
        position: { x: x + layoutX(i, vars.length, 80), y: y + 270 },
        data: {
          label: v.name,
          kind: "variable" as NodeKind,
          path: item.path,
          code: v.snippet,
        },
      })
      edges.push({ id: `e-${id}-${vId}`, source: id, target: vId })
    })
  }
}

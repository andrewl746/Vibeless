import type { Node, Edge } from "@xyflow/react"
import type { GraphNodeData, NodeKind } from "@/components/nodes/types"
import type { FileTreeNode } from "./parseTree"
import { isGraphNode } from "./parseTree"

const FN_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g
const ARROW_RE = /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g
const VAR_RE = /(?:const|let|var)\s+(\w+)\s*[=:]/g
const IMPORT_RE = /^import\s+.*?from\s+['"](.+)['"]/gm

function makeId(prefix: string, name: string) {
  return `${prefix}::${name}`
}

function layoutX(index: number, total: number, spread = 260): number {
  return (index - (total - 1) / 2) * spread
}

/** Parse file source string into Function and Variable nodes + edges */
function parseSource(
  source: string,
  fileNodeId: string,
  filePath: string,
  xOffset: number,
  yBase: number
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const nodes: Node<GraphNodeData>[] = []
  const edges: Edge[] = []

  const functions: string[] = []
  let m: RegExpExecArray | null

  FN_RE.lastIndex = 0
  while ((m = FN_RE.exec(source))) functions.push(m[1])

  ARROW_RE.lastIndex = 0
  while ((m = ARROW_RE.exec(source))) {
    if (!functions.includes(m[1])) functions.push(m[1])
  }

  functions.forEach((fnName, i) => {
    const id = makeId(fileNodeId, fnName)
    nodes.push({
      id,
      type: "functionNode",
      position: { x: xOffset + layoutX(i, functions.length, 160), y: yBase + 120 },
      data: { label: fnName, kind: "function" as NodeKind, path: filePath },
    })
    edges.push({ id: `e-${fileNodeId}-${id}`, source: fileNodeId, target: id })
  })

  const varNames: string[] = []
  VAR_RE.lastIndex = 0
  while ((m = VAR_RE.exec(source))) {
    const name = m[1]
    if (!functions.includes(name) && !varNames.includes(name)) varNames.push(name)
  }

  varNames.slice(0, 12).forEach((varName, i) => {
    const id = makeId(fileNodeId, `var_${varName}`)
    nodes.push({
      id,
      type: "variableNode",
      position: { x: xOffset + layoutX(i, Math.min(varNames.length, 12), 80), y: yBase + 260 },
      data: { label: varName, kind: "variable" as NodeKind, path: filePath },
    })
    edges.push({ id: `e-var-${fileNodeId}-${id}`, source: fileNodeId, target: id })
  })

  return { nodes, edges }
}

/** Build graph from a FileTreeNode tree (no source — structure only) */
export function buildGraphFromTree(
  tree: FileTreeNode[],
  repoName: string,
  sourceMap: Record<string, string> = {}
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
    addNodeRecursive(item, projectId, x, 160, nodes, edges, sourceMap)
  })

  return { nodes, edges }
}

function addNodeRecursive(
  item: FileTreeNode,
  parentId: string,
  x: number,
  y: number,
  nodes: Node<GraphNodeData>[],
  edges: Edge[],
  sourceMap: Record<string, string>
) {
  if (!isGraphNode(item)) return

  const id = `node::${item.path}`
  const kind: NodeKind = item.type === "folder" ? "folder" : "file"
  const nodeType = item.type === "folder" ? "folderNode" : "fileNode"

  nodes.push({
    id,
    type: nodeType,
    position: { x, y },
    data: { label: item.name, kind, path: item.path },
  })
  edges.push({ id: `e-${parentId}-${id}`, source: parentId, target: id })

  if (item.type === "folder" && item.children) {
    const children = item.children.filter(isGraphNode)
    children.forEach((child, ci) => {
      const cx = x + layoutX(ci, children.length, 180)
      addNodeRecursive(child, id, cx, y + 140, nodes, edges, sourceMap)
    })
  }

  if (item.type === "file" && sourceMap[item.path]) {
    const { nodes: fn, edges: fe } = parseSource(sourceMap[item.path], id, item.path, x, y)
    nodes.push(...fn)
    edges.push(...fe)
  }
}

/** Extract import-based dependency edges between file nodes */
export function buildImportEdges(
  nodes: Node<GraphNodeData>[],
  sourceMap: Record<string, string>
): Edge[] {
  const extra: Edge[] = []
  const fileNodes = nodes.filter((n) => n.data.kind === "file" && n.data.path)

  for (const node of fileNodes) {
    const src = sourceMap[node.data.path!]
    if (!src) continue
    IMPORT_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = IMPORT_RE.exec(src))) {
      const imp = m[1]
      const target = fileNodes.find((fn) => fn.data.path?.includes(imp.replace(/^\.\//, "")))
      if (target && target.id !== node.id) {
        extra.push({
          id: `e-import-${node.id}-${target.id}`,
          source: node.id,
          target: target.id,
          style: { stroke: "#00A3FF44", strokeDasharray: "4 3" },
        })
      }
    }
  }
  return extra
}

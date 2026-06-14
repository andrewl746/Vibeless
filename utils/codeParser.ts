import type { Node, Edge } from "@xyflow/react"
import type { GraphNodeData, NodeKind } from "@/components/nodes/types"
import type { FileTreeNode } from "./parseTree"
import { isGraphNode } from "./parseTree"
import type { ScannedEntityMap } from "./codeScanner"

// Matches both `import ... from "x"` and `export ... from "x"`, including
// multi-line specifier lists. `[^'"`;]` keeps each match from running past the
// quote/semicolon that ends the statement.
const IMPORT_RE = /(?:import|export)[^'"`;]*?from\s*['"]([^'"]+)['"]/g

const SRC_EXT_RE = /\.(tsx|ts|jsx|js|mjs|cjs)$/i

function layoutX(index: number, total: number, spread = 260): number {
  return (index - (total - 1) / 2) * spread
}

/**
 * Normalize an import specifier to a comparable path tail so loose,
 * IDE-style imports still resolve to a real file node. Handles:
 *  - `@/` path aliases (strip the alias prefix)
 *  - relative jumps (`./`, `../`, repeated)
 *  - missing extensions (drop `.ts(x)` / `.js(x)` etc.)
 *  - barrel imports (`/index`)
 * Returns null for things we can't turn into a path key.
 */
function normalizeImportKey(spec: string): string | null {
  let p = spec.trim()
  if (p.startsWith("@/")) p = p.slice(2)
  p = p.replace(/^(?:\.\.?\/)+/, "") // strip leading ./ and ../ runs
  p = p.replace(SRC_EXT_RE, "")
  p = p.replace(/\/index$/i, "")
  return p.length > 0 ? p : null
}

/** Normalize a real file path the same way (sans extension / barrel). */
function normalizeFileKey(path: string): string {
  return path.replace(SRC_EXT_RE, "").replace(/\/index$/i, "")
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

  // Import-based dependency edges. Resolve each import to a file node by
  // matching the normalized import key against the tail of a normalized file
  // path (so `../hooks/useAuth` and `@/hooks/useAuth` both hit `hooks/useAuth`).
  const fileNodes = nodes.filter((n) => n.data.kind === "file" && n.data.path)
  const fileKeys = fileNodes.map((fn) => ({
    node: fn,
    key: normalizeFileKey(fn.data.path!),
  }))
  const seen = new Set<string>() // dedupe per source→target pair

  for (const node of fileNodes) {
    const src = entityMap[node.data.path!]?.source
    if (!src) continue
    IMPORT_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = IMPORT_RE.exec(src))) {
      const importKey = normalizeImportKey(m[1])
      if (!importKey) continue

      const target = fileKeys.find(
        ({ key }) => key === importKey || key.endsWith(`/${importKey}`)
      )?.node
      if (!target || target.id === node.id) continue

      const pairId = `e-import-${node.id}-${target.id}`
      if (seen.has(pairId)) continue
      seen.add(pairId)
      edges.push({
        id: pairId,
        source: node.id,
        target: target.id,
        style: { stroke: "#00A3FF33", strokeDasharray: "4 3" },
      })
    }
  }

  return { nodes, edges }
}

export interface ImportGraph {
  /** path -> number of other files importing it */
  counts: Record<string, number>
  /** path -> sorted list of file paths that import it */
  importers: Record<string, string[]>
}

/**
 * Repo-wide "Risk Index": for every scanned file, find which *other* scanned
 * files import it. Independent of the displayed subtree, so a hub file
 * (imported everywhere) reads as high-risk from any folder.
 */
export function computeImportGraph(entityMap: ScannedEntityMap): ImportGraph {
  const fileKeys = Object.keys(entityMap).map((p) => ({
    path: p,
    key: normalizeFileKey(p),
  }))
  const importers: Record<string, Set<string>> = {}

  for (const [path, file] of Object.entries(entityMap)) {
    const src = file.source
    if (!src) continue
    IMPORT_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = IMPORT_RE.exec(src))) {
      const importKey = normalizeImportKey(m[1])
      if (!importKey) continue
      const target = fileKeys.find(
        ({ key }) => key === importKey || key.endsWith(`/${importKey}`)
      )
      if (!target || target.path === path) continue
      ;(importers[target.path] ??= new Set()).add(path)
    }
  }

  const counts: Record<string, number> = {}
  const importerLists: Record<string, string[]> = {}
  for (const [target, set] of Object.entries(importers)) {
    counts[target] = set.size
    importerLists[target] = [...set].sort()
  }
  return { counts, importers: importerLists }
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

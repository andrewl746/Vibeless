import type { Edge, Node } from "@xyflow/react"
import type { SimulationStep } from "@/store/useGraphStore"

const TRANSIT_DELAY_MS = 1500

function payloadsForNode(node: Node, index: number): string[] {
  const kind = String(node.data?.kind ?? "node")
  const label = String(node.data?.label ?? node.id)
  if (kind === "file") return [`inspect file: ${label}`, `step ${index}`]
  if (kind === "function") return [`inspect fn: ${label}`, `step ${index}`]
  if (kind === "variable") return [`inspect value: ${label}`]
  return [`inspect: ${label}`]
}

function scoreTarget(edge: Edge, node?: Node): number {
  const kind = String(node?.data?.kind ?? "")
  const label = String(node?.data?.label ?? "").toLowerCase()
  const path = String(node?.data?.path ?? "").toLowerCase()
  let score = 0

  if (kind === "file") score += 40
  if (kind === "function") score += 30
  if (kind === "folder") score += 12
  if (/page|route|layout|index|main|app/.test(label) || /\/(page|route|layout|index)\./.test(path)) {
    score += 18
  }
  if (edge.id.includes("import")) score += 14
  if (kind === "variable") score -= 10

  return score
}

export function generateMockSimulationRoute(
  nodes: Node[],
  edges: Edge[],
  entryNodeId: string
): SimulationStep[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const outgoing = new Map<string, Edge[]>()

  for (const edge of edges) {
    const list = outgoing.get(edge.source) ?? []
    list.push(edge)
    outgoing.set(edge.source, list)
  }

  for (const list of outgoing.values()) {
    list.sort((a, b) => a.target.localeCompare(b.target))
  }

  const steps: SimulationStep[] = []
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: entryNodeId, depth: 0 }]
  const visited = new Set<string>()

  while (queue.length > 0 && steps.length < 32) {
    const current = queue.shift()!
    if (visited.has(current.nodeId)) continue
    visited.add(current.nodeId)

    const candidateEdges = outgoing.get(current.nodeId) ?? []
    const rankedEdges = [...candidateEdges].sort(
      (a, b) => scoreTarget(b, nodeById.get(b.target)) - scoreTarget(a, nodeById.get(a.target))
    )

    for (const edge of rankedEdges.slice(0, current.depth === 0 ? 4 : 3)) {
      if (visited.has(edge.target)) continue

      const target = nodeById.get(edge.target)
      const kind = String(target?.data?.kind ?? "node")

      steps.push({
        nodeId: edge.target,
        edgeId: edge.id,
        status: "success",
        payloads: target
          ? payloadsForNode(target, steps.length + 1)
          : [`event: ${steps.length + 1}`],
        reason:
          edge.id.includes("import")
            ? "import dependency to inspect next"
            : `${kind} connected to the current onboarding path`,
        delay: TRANSIT_DELAY_MS,
      })

      if (current.depth < 4) {
        queue.push({ nodeId: edge.target, depth: current.depth + 1 })
      }
    }
  }

  if (steps.length === 0) {
    steps.push({
      nodeId: entryNodeId,
      status: "success",
      payloads: ["single node: inspect here"],
      reason: "no connected dependencies are visible yet",
      delay: 1200,
    })
  }

  return steps
}

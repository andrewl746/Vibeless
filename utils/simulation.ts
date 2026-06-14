import type { Edge, Node } from "@xyflow/react"
import type { SimulationStep } from "@/store/useGraphStore"

const TRANSIT_DELAY_MS = 1900

function stableHash(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function payloadsForNode(node: Node, index: number): string[] {
  const kind = String(node.data?.kind ?? "node")
  const label = String(node.data?.label ?? node.id)
  if (kind === "file") return [`module: ${label}`, `ctx: ${index}`]
  if (kind === "function") return [`args: ${index}`, "config: {}"]
  if (kind === "variable") return [`value: ${label}`]
  return [`target: ${label}`]
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
  const queue: Array<{ nodeId: string; depth: number; blocked: boolean }> = [
    { nodeId: entryNodeId, depth: 0, blocked: false },
  ]
  const visited = new Set<string>()

  while (queue.length > 0 && steps.length < 48) {
    const current = queue.shift()!
    if (visited.has(current.nodeId)) continue
    visited.add(current.nodeId)

    const candidateEdges = outgoing.get(current.nodeId) ?? []
    for (const edge of candidateEdges.slice(0, 5)) {
      if (visited.has(edge.target)) continue

      const target = nodeById.get(edge.target)
      const kind = String(target?.data?.kind ?? "")
      const shouldFail =
        !current.blocked &&
        current.depth >= 2 &&
        kind === "function" &&
        stableHash(`${edge.id}:${edge.target}`) % 100 < 15
      const status: "success" | "error" =
        current.blocked || shouldFail ? "error" : "success"

      steps.push({
        nodeId: edge.target,
        edgeId: edge.id,
        status,
        payloads: target
          ? payloadsForNode(target, steps.length + 1)
          : [`event: ${steps.length + 1}`],
        delay: TRANSIT_DELAY_MS,
      })

      if (!current.blocked && !shouldFail) {
        queue.push({ nodeId: edge.target, depth: current.depth + 1, blocked: false })
      } else {
        const downstream = outgoing.get(edge.target) ?? []
        for (const childEdge of downstream.slice(0, 3)) {
          const child = nodeById.get(childEdge.target)
          steps.push({
            nodeId: childEdge.target,
            edgeId: childEdge.id,
            status: "error",
            payloads: child
              ? [`halted: ${String(child.data?.label ?? child.id)}`]
              : ["halted"],
            delay: TRANSIT_DELAY_MS,
          })
        }
      }
    }
  }

  if (steps.length === 0) {
    steps.push({
      nodeId: entryNodeId,
      status: "success",
      payloads: ["entry: complete"],
      delay: 1200,
    })
  }

  return steps
}

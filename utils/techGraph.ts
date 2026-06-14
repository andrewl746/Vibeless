import type { Node, Edge } from "@xyflow/react"
import type { GraphNodeData } from "@/components/nodes/types"
import type { TechItem } from "./techStack"

// Frameworks that make the best "core" hub, most preferred first.
const CORE_PRIORITY = [
  "Next.js", "Nuxt", "SvelteKit", "Remix", "Astro", "Gatsby",
  "Angular", "Vue", "Svelte", "React", "NestJS", "Express", "Fastify",
]

// Curated "builds on" links (source → targets). Only drawn when both ends exist.
const RELATED: Record<string, string[]> = {
  "Next.js": ["React"],
  "React Flow": ["React"],
  "react-markdown": ["React"],
  "Redux": ["React"],
  "Redux Toolkit": ["React"],
  "Zustand": ["React"],
  "Jotai": ["React"],
  "React Query": ["React"],
  "MUI": ["React"],
  "Chakra UI": ["React"],
  "Auth.js": ["Next.js"],
  "SvelteKit": ["Svelte"],
  "Nuxt": ["Vue"],
}

function techId(name: string): string {
  return `tech::${name}`
}

/**
 * Turn a detected tech stack into a connected flow graph: a core framework hub
 * sitting on its language(s), with everything else plugged into the core (or a
 * more specific anchor via the curated map). Always connected, no orphans.
 */
export function buildTechStackGraph(stack: TechItem[]): {
  nodes: Node<GraphNodeData>[]
  edges: Edge[]
} {
  if (stack.length === 0) return { nodes: [], edges: [] }

  const present = new Set(stack.map((t) => t.name))
  const nodes: Node<GraphNodeData>[] = stack.map((t) => ({
    id: techId(t.name),
    type: "techNode",
    position: { x: 0, y: 0 },
    data: {
      label: t.name,
      kind: "tech",
      techCategory: t.category,
      techVersion: t.version,
    },
  }))

  // Pick the core hub: highest-priority framework present, else first language,
  // else the first item.
  const core =
    CORE_PRIORITY.find((n) => present.has(n)) ??
    stack.find((t) => t.category === "language")?.name ??
    stack[0].name

  const languages = stack.filter((t) => t.category === "language").map((t) => t.name)

  const edges: Edge[] = []
  const seen = new Set<string>()
  const addEdge = (source: string, target: string) => {
    if (source === target) return
    const id = `tech-edge-${source}-${target}`
    if (seen.has(id)) return
    seen.add(id)
    edges.push({
      id,
      source: techId(source),
      target: techId(target),
      style: { stroke: "#3A4D61", strokeWidth: 1.5 },
    })
  }

  // Core sits on its language(s).
  for (const lang of languages) addEdge(core, lang)

  // Curated specific links.
  for (const t of stack) {
    for (const target of RELATED[t.name] ?? []) {
      if (present.has(target)) addEdge(t.name, target)
    }
  }

  // Anything still unconnected plugs into the core.
  const connected = new Set<string>()
  for (const e of edges) {
    connected.add(e.source)
    connected.add(e.target)
  }
  for (const t of stack) {
    if (t.name === core) continue
    if (t.category === "language") continue
    if (!connected.has(techId(t.name))) addEdge(t.name, core)
  }

  return { nodes, edges }
}

import type { TechCategory } from "@/utils/techStack"

export type NodeKind = "project" | "folder" | "file" | "function" | "variable" | "tech"

export type ViewMode = "TREE" | "BLAST_RADIUS" | "TECH_STACK"

export type RiskLevel = "critical" | "moderate" | "low"

export interface GraphNodeData extends Record<string, unknown> {
  label: string
  kind: NodeKind
  path?: string
  code?: string
  description?: string
  // Injected at render time by CanvasEngine for the Blast Radius lens.
  zoomLevel?: number
  viewMode?: ViewMode
  riskLevel?: RiskLevel
  inwardCount?: number
  simulationStatus?: "idle" | "running" | "success" | "error"
  // Tech Stack flow nodes
  techCategory?: TechCategory
  techVersion?: string
}

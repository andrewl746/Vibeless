export type NodeKind = "project" | "folder" | "file" | "function" | "variable"

export type ViewMode = "TREE" | "BLAST_RADIUS"

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
}

export type NodeKind = "project" | "folder" | "file" | "function" | "variable"

export interface GraphNodeData extends Record<string, unknown> {
  label: string
  kind: NodeKind
  path?: string
  code?: string
  description?: string
}

"use client"

import { useGraphStore } from "@/store/useGraphStore"
import type { GraphNodeData, RiskLevel } from "./types"

interface NodeOverlayProps {
  id: string
  data: GraphNodeData
}

// Stand-out styling for the IMPACT button, tinted by computed risk.
const IMPACT_STYLE: Record<RiskLevel, { bg: string; border: string; text: string; glow: string }> = {
  critical: { bg: "#1F0A0E", border: "#EF4444", text: "#FCA5A5", glow: "0 0 12px rgba(239,68,68,0.45)" },
  moderate: { bg: "#241804", border: "#F59E0B", text: "#FCD34D", glow: "0 0 12px rgba(245,158,11,0.35)" },
  low: { bg: "#0E141B", border: "#33465A", text: "#8FB3CC", glow: "none" },
}

// Map a file extension to a Prism language id.
function langFromPath(path?: string): string {
  if (!path) return "typescript"
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase()
  switch (ext) {
    case "tsx":
      return "tsx"
    case "ts":
      return "typescript"
    case "jsx":
      return "jsx"
    case "js":
    case "mjs":
    case "cjs":
      return "javascript"
    case "json":
      return "json"
    case "css":
      return "css"
    default:
      return "typescript"
  }
}

export default function NodeOverlay({ id, data }: NodeOverlayProps) {
  const fetchNodeDescription = useGraphStore((s) => s.fetchNodeDescription)
  const fetchNodeVulnerability = useGraphStore((s) => s.fetchNodeVulnerability)
  const openCodePane = useGraphStore((s) => s.openCodePane)
  const riskCounts = useGraphStore((s) => s.riskCounts)
  const riskImporters = useGraphStore((s) => s.riskImporters)

  // Blast-impact data for this file node (computed repo-wide).
  const filePath = data.path ?? ""
  const inward = riskCounts[filePath] ?? 0
  const riskLevel: RiskLevel = inward >= 4 ? "critical" : inward >= 1 ? "moderate" : "low"
  const usages = riskImporters[filePath] ?? []
  const impact = IMPACT_STYLE[riskLevel]
  const hasCode = typeof data.code === "string" && data.code.trim().length > 0

  return (
    <>
      {/* Inline floating action menu */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col gap-1 pointer-events-auto">
        {data.kind === "file" && data.viewMode === "BLAST_RADIUS" && (
          <button
            onClick={() =>
              fetchNodeVulnerability(
                data.label,
                filePath,
                data.code ?? "",
                riskLevel,
                usages
              )
            }
            title="Where is this used? AI blast-radius report"
            className="font-mono text-[10px] font-bold px-3 py-1.5 rounded border whitespace-nowrap transition-transform hover:scale-[1.03]"
            style={{
              background: impact.bg,
              borderColor: impact.border,
              color: impact.text,
              boxShadow: impact.glow,
            }}
          >
            ⚠ [ IMPACT · {usages.length} ]
          </button>
        )}
        <button
          onClick={() =>
            fetchNodeDescription(data.label, data.kind, data.path ?? "", data.code ?? "")
          }
          className="font-mono text-[10px] px-3 py-1 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap"
        >
          [ DESC ]
        </button>
        <button
          onClick={() => {
            if (!hasCode) return
            openCodePane(data.code!, langFromPath(data.path), data.label)
          }}
          disabled={!hasCode}
          title={hasCode ? "Open captured code" : "No code was captured for this node"}
          className="font-mono text-[10px] px-3 py-1 bg-bg-deep border border-border-muted text-text-muted hover:text-white hover:border-accent-blue transition-colors rounded whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border-muted disabled:hover:text-text-muted"
        >
          [ CODE ]
        </button>
      </div>
    </>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useGraphStore } from "@/store/useGraphStore"
import type { GraphNodeData } from "@/components/nodes/types"
import type { Node } from "@xyflow/react"

function isLikelyEntry(node: Node<GraphNodeData>): boolean {
  const label = node.data.label.toLowerCase()
  const path = node.data.path?.toLowerCase() ?? ""
  return (
    label === "main" ||
    label === "index.ts" ||
    label === "index.tsx" ||
    label === "index.js" ||
    label === "main.py" ||
    label === "app.tsx" ||
    label === "page.tsx" ||
    path.endsWith("/page.tsx") ||
    path.endsWith("/index.ts") ||
    path.endsWith("/index.tsx") ||
    path.endsWith("/main.py")
  )
}

function labelForNode(node: Node<GraphNodeData>): string {
  const kind = node.data.kind.toUpperCase()
  const path = node.data.path ? ` - ${node.data.path}` : ""
  return `${kind}: ${node.data.label}${path}`
}

export default function SimulationToolbar() {
  const nodes = useGraphStore((s) => s.nodes) as Node<GraphNodeData>[]
  const isSimulationActive = useGraphStore((s) => s.isSimulationActive)
  const simulationSpeed = useGraphStore((s) => s.simulationSpeed)
  const simulationEdgeStates = useGraphStore((s) => s.simulationEdgeStates)
  const startSimulation = useGraphStore((s) => s.startSimulation)
  const stopSimulation = useGraphStore((s) => s.stopSimulation)
  const resetSimulation = useGraphStore((s) => s.resetSimulation)
  const setSimulationSpeed = useGraphStore((s) => s.setSimulationSpeed)

  const entryOptions = useMemo(() => {
    const runnable = nodes.filter((node) =>
      ["project", "file", "function"].includes(node.data.kind)
    )
    return [...runnable].sort((a, b) => {
      const aEntry = isLikelyEntry(a) ? 0 : 1
      const bEntry = isLikelyEntry(b) ? 0 : 1
      if (aEntry !== bEntry) return aEntry - bEntry
      return labelForNode(a).localeCompare(labelForNode(b))
    })
  }, [nodes])

  // The user's explicit pick (may go stale as the graph / filter changes).
  const [picked, setPicked] = useState("")
  const [entryQuery, setEntryQuery] = useState("")
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)

  const normalizedQuery = entryQuery.trim().toLowerCase()
  const filteredEntryOptions = useMemo(
    () =>
      normalizedQuery.length === 0
        ? entryOptions
        : entryOptions.filter((node) =>
            labelForNode(node).toLowerCase().includes(normalizedQuery)
          ),
    [entryOptions, normalizedQuery]
  )

  // Effective selection, derived during render: the pick when it's still a valid
  // option, otherwise the first available. No effect / setState sync needed.
  const effectiveEntryId =
    picked && filteredEntryOptions.some((node) => node.id === picked)
      ? picked
      : filteredEntryOptions[0]?.id ?? ""

  const canRun = Boolean(effectiveEntryId) && entryOptions.length > 0

  const activePathState = useMemo(() => {
    const states = Object.values(simulationEdgeStates)
    return (
      states.find((state) => state.status === "running" && state.reason) ??
      [...states].reverse().find((state) => state.status === "success" && state.reason)
    )
  }, [simulationEdgeStates])

  const activePathDetail =
    activePathState?.reason ??
    "Pick a starting point to reveal the next useful dependency trail."

  const activePayload =
    activePathState?.payloads?.find(Boolean) ??
    "The path follows visible imports and nearby code ownership."

  return (
    <div className="absolute bottom-4 left-1/2 z-40 w-[min(940px,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-[#9CDCFE]/20 bg-[#0b1720]/95 p-3 shadow-[0_0_30px_rgba(0,0,0,0.55)] backdrop-blur pointer-events-auto">
      <div className="mb-3 flex flex-col gap-2 border-b border-[#9CDCFE]/10 pb-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#9CDCFE]">
            Onboarding Path Simulation
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#4EC9B0]/75">
            Dependency trail from an entry point.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExplainerOpen((isOpen) => !isOpen)}
          aria-expanded={isExplainerOpen}
          className="w-fit rounded border border-[#9CDCFE]/20 bg-[#9CDCFE]/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-[#9CDCFE] transition-colors hover:border-[#9CDCFE]/45 hover:bg-[#9CDCFE]/10"
        >
          {isExplainerOpen ? "Hide Why" : "Why?"}
        </button>
      </div>
      {isExplainerOpen ? (
        <div className="mb-3 rounded-md border border-[#9CDCFE]/10 bg-[#9CDCFE]/5 px-3 py-2 font-mono">
          <div className="text-[9px] uppercase tracking-widest text-[#9CDCFE]">
            Why this simulation exists
          </div>
          <div className="mt-1 text-[10px] leading-relaxed text-text-muted">
            {activePathDetail}
          </div>
          <div className="mt-1 truncate text-[10px] text-[#4EC9B0]/80">
            {activePayload}
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block font-mono text-[9px] uppercase tracking-widest text-text-muted">
                Search Starting Point
              </label>
              <span className="font-mono text-[8px] uppercase tracking-widest text-accent-blue">
                {filteredEntryOptions.length}/{entryOptions.length}
              </span>
            </div>
            <div className="relative">
              <input
                value={entryQuery}
                onChange={(event) => setEntryQuery(event.target.value)}
                disabled={entryOptions.length === 0 || isSimulationActive}
                placeholder="Filter files/functions..."
                className="h-9 w-full rounded border border-border-muted bg-bg-deep px-2 pr-7 font-mono text-xs text-white placeholder-text-muted outline-none transition-colors focus:border-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
              />
              {entryQuery && !isSimulationActive ? (
                <button
                  onClick={() => setEntryQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted transition-colors hover:text-white"
                  title="Clear simulation entry search"
                >
                  x
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Starting Point
            </label>
            <select
              value={effectiveEntryId}
              onChange={(event) => setPicked(event.target.value)}
              disabled={filteredEntryOptions.length === 0 || isSimulationActive}
              className="h-9 w-full truncate rounded border border-border-muted bg-bg-deep pl-2 pr-8 font-mono text-xs text-white outline-none transition-colors focus:border-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {entryOptions.length === 0 ? (
                <option value="">Select a file or folder to build the graph</option>
              ) : filteredEntryOptions.length === 0 ? (
                <option value="">No matching nodes</option>
              ) : (
                filteredEntryOptions.map((node) => (
                  <option key={node.id} value={node.id}>
                    {labelForNode(node)}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => startSimulation(effectiveEntryId)}
            disabled={!canRun || isSimulationActive}
            title="Animate a deterministic onboarding path through nearby dependencies."
            className="h-9 rounded border border-[#4EC9B0]/50 bg-[#4EC9B0]/12 px-3 font-mono text-[10px] uppercase tracking-widest text-[#4EC9B0] transition-colors hover:border-[#4EC9B0] hover:bg-[#4EC9B0]/18 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Show Path
          </button>
          <button
            onClick={stopSimulation}
            disabled={!isSimulationActive}
            className="h-9 rounded border border-[#C586C0]/40 bg-[#C586C0]/10 px-3 font-mono text-[10px] uppercase tracking-widest text-[#C586C0] transition-colors hover:border-[#C586C0] hover:bg-[#C586C0]/16 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pause
          </button>
          <button
            onClick={resetSimulation}
            className="h-9 rounded border border-border-muted bg-bg-deep px-3 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:border-[#9CDCFE]/70 hover:text-white"
          >
            Reset
          </button>
        </div>

        <div className="w-full md:w-40">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Pace
            </span>
            <span className="font-mono text-[10px] text-accent-blue">
              {simulationSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.5"
            value={simulationSpeed}
            onChange={(event) => setSimulationSpeed(Number(event.target.value))}
            className="w-full accent-[#9CDCFE]"
          />
          <div className="mt-1 flex justify-between font-mono text-[8px] text-text-muted">
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
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

  const defaultEntry = entryOptions[0]?.id ?? ""
  const [entryNodeId, setEntryNodeId] = useState(defaultEntry)
  const [entryQuery, setEntryQuery] = useState("")

  useEffect(() => {
    if (!entryNodeId || !entryOptions.some((node) => node.id === entryNodeId)) {
      setEntryNodeId(defaultEntry)
    }
  }, [defaultEntry, entryNodeId, entryOptions])

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

  useEffect(() => {
    if (
      normalizedQuery.length > 0 &&
      filteredEntryOptions.length > 0 &&
      !filteredEntryOptions.some((node) => node.id === entryNodeId)
    ) {
      setEntryNodeId(filteredEntryOptions[0].id)
    }
  }, [entryNodeId, filteredEntryOptions, normalizedQuery])

  const selectedEntryVisible = filteredEntryOptions.some((node) => node.id === entryNodeId)
  const selectedEntryValue = selectedEntryVisible ? entryNodeId : ""
  const canRun = Boolean(entryNodeId) && selectedEntryVisible && entryOptions.length > 0

  return (
    <div className="absolute bottom-4 left-1/2 z-40 w-[min(900px,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-border-muted bg-bg-panel/95 p-3 shadow-[0_0_30px_rgba(0,0,0,0.55)] backdrop-blur pointer-events-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block font-mono text-[9px] uppercase tracking-widest text-text-muted">
                Search Entry
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
              Simulation Entry
            </label>
          <select
            value={selectedEntryValue}
            onChange={(event) => setEntryNodeId(event.target.value)}
            disabled={filteredEntryOptions.length === 0 || isSimulationActive}
            className="h-9 w-full rounded border border-border-muted bg-bg-deep px-2 font-mono text-xs text-white outline-none transition-colors focus:border-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
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
            onClick={() => startSimulation(entryNodeId)}
            disabled={!canRun || isSimulationActive}
            className="h-9 rounded border border-emerald-500/50 bg-emerald-950/50 px-3 font-mono text-[10px] uppercase tracking-widest text-emerald-200 transition-colors hover:border-emerald-400 hover:bg-emerald-900/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Run Simulation
          </button>
          <button
            onClick={stopSimulation}
            disabled={!isSimulationActive}
            className="h-9 rounded border border-amber-500/40 bg-amber-950/40 px-3 font-mono text-[10px] uppercase tracking-widest text-amber-200 transition-colors hover:border-amber-400 hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pause
          </button>
          <button
            onClick={resetSimulation}
            className="h-9 rounded border border-border-muted bg-bg-deep px-3 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:border-red-400/70 hover:text-white"
          >
            Reset
          </button>
        </div>

        <div className="w-full md:w-40">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Speed
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
            className="w-full accent-blue-400"
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

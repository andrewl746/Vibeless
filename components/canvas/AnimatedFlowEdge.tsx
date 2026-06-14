"use client"

import type { CSSProperties } from "react"
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react"
import { useGraphStore, type SimulationStatus } from "@/store/useGraphStore"

type AnimatedEdge = Edge<{ payloads?: string[] }>

const EDGE_COLOR: Record<SimulationStatus, string> = {
  idle: "#141B24",
  running: "#9CDCFE",
  success: "#4EC9B0",
  error: "#EF4444",
}

export default function AnimatedFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps<AnimatedEdge>) {
  const edgeState = useGraphStore((s) => s.simulationEdgeStates[id])
  const simulationSpeed = useGraphStore((s) => s.simulationSpeed)
  const status = edgeState?.status ?? "idle"
  const payloads = edgeState?.payloads ?? []
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const stroke = EDGE_COLOR[status]
  const particlePayload = payloads[0] ?? "event"
  const pulseDuration = `${1.9 / simulationSpeed}s`

  return (
    <g
      className={status === "error" ? "flow-edge-error" : undefined}
      style={{ "--flow-duration": pulseDuration } as CSSProperties}
    >
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke,
          strokeWidth: status === "idle" ? 1.5 : 2.5,
          filter:
            status === "running"
              ? "drop-shadow(0 0 6px rgba(156,220,254,0.7))"
              : status === "success"
                ? "drop-shadow(0 0 5px rgba(78,201,176,0.55))"
                : status === "error"
                  ? "drop-shadow(0 0 7px rgba(239,68,68,0.75))"
                  : undefined,
        }}
      />

      {status === "running" && (
        <>
          <path
            className="flow-edge-pulse-halo"
            d={edgePath}
            fill="none"
            pathLength={100}
            stroke="#9CDCFE"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray="10 100"
            strokeDashoffset={112}
            style={{ pointerEvents: "none" }}
          />
          <path
            className="flow-edge-pulse-core"
            d={edgePath}
            fill="none"
            pathLength={100}
            stroke="#DBEAFE"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="16 100"
            strokeDashoffset={116}
            style={{ pointerEvents: "none" }}
          />
          <path
            className="flow-edge-pulse-spark"
            d={edgePath}
            fill="none"
            pathLength={100}
            stroke="#9CDCFE"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="3 113"
            strokeDashoffset={116}
            style={{ pointerEvents: "none" }}
          />
          <path
            className="flow-edge-wake"
            d={edgePath}
            fill="none"
            pathLength={100}
            stroke="#4EC9B0"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="34 100"
            strokeDashoffset={120}
            style={{ pointerEvents: "none" }}
          />
        </>
      )}

      {status === "running" && (
        <g key={`${id}-${particlePayload}`}>
          <circle r="3.5" fill="#DBEAFE" className="flow-edge-particle">
            <animateMotion
              dur={pulseDuration}
              begin="0s"
              repeatCount="1"
              path={edgePath}
              fill="freeze"
            />
          </circle>
          <circle r="8" fill="#9CDCFE" opacity="0.14" className="flow-edge-particle-glow">
            <animateMotion
              dur={pulseDuration}
              begin="0s"
              repeatCount="1"
              path={edgePath}
              fill="freeze"
            />
          </circle>
        </g>
      )}
    </g>
  )
}

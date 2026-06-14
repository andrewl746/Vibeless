"use client"

import { useEffect, useRef, useState } from "react"
import CanvasPreview from "@/components/CanvasPreview"
import CodePreviewPane from "@/components/canvas/CodePreviewPane"
import { useGraphStore } from "@/store/useGraphStore"
import type { TechItem } from "@/utils/techStack"

interface CanvasWorkspaceProps {
  owner: string
  repo: string
  sha: string
  techStack: TechItem[]
}

const MIN_PANE_PCT = 20
const MAX_PANE_PCT = 75

export default function CanvasWorkspace({ owner, repo, sha, techStack }: CanvasWorkspaceProps) {
  const isCodePaneOpen = useGraphStore((s) => s.isCodePaneOpen)
  const closeCodePane = useGraphStore((s) => s.closeCodePane)

  // The pane state is global (survives navigation). Close it when leaving the
  // repo workspace so the next repo doesn't open with a stale pane.
  useEffect(() => {
    return () => closeCodePane()
  }, [closeCodePane])

  // Pane width as a percentage of the workspace, adjustable via the drag handle.
  const [paneWidth, setPaneWidth] = useState(40)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // While dragging, follow the cursor (relative to the right edge) and suspend
  // the open/close width animation so the pane tracks the pointer 1:1.
  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const fromRight = rect.right - e.clientX
      const pct = (fromRight / rect.width) * 100
      setPaneWidth(Math.min(MAX_PANE_PCT, Math.max(MIN_PANE_PCT, pct)))
    }
    const onUp = () => setDragging(false)

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    // Keep the resize cursor + suppress text selection for the whole drag.
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [dragging])

  const transition = dragging ? "" : "transition-[width,left] duration-300 ease-in-out"

  return (
    <div ref={containerRef} className="relative flex w-full h-full overflow-hidden">
      {/* Canvas — shrinks to make room for the pane */}
      <div
        className={`relative h-full ${transition}`}
        style={{ width: isCodePaneOpen ? `${100 - paneWidth}%` : "100%" }}
      >
        <CanvasPreview owner={owner} repo={repo} sha={sha} techStack={techStack} />
      </div>

      {/* Sliding code pane */}
      <div
        className={`h-full overflow-hidden ${transition}`}
        style={{ width: isCodePaneOpen ? `${paneWidth}%` : "0%" }}
      >
        <CodePreviewPane />
      </div>

      {/* Drag handle — sits on the seam, slides with the pane edge */}
      <div
        onMouseDown={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        className={`absolute top-0 h-full w-1.5 -translate-x-1/2 z-10 group ${
          isCodePaneOpen ? "cursor-col-resize" : "pointer-events-none"
        } ${transition}`}
        style={{ left: isCodePaneOpen ? `${100 - paneWidth}%` : "100%" }}
      >
        {/* Hairline that brightens on hover / while dragging */}
        <div
          className={`mx-auto h-full w-px transition-colors ${
            dragging ? "bg-accent-blue" : "bg-border-muted group-hover:bg-accent-blue"
          }`}
        />
      </div>
    </div>
  )
}

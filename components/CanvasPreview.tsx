"use client"

import { useCanvasStore } from "@/store/useCanvasStore"
import { isGraphNode } from "@/utils/parseTree"
import { FileCode, Folder } from "lucide-react"

export default function CanvasPreview() {
  const activeNode = useCanvasStore((s) => s.activeNode)

  if (!activeNode) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center px-8">
        <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
          [ CANVAS ]
        </span>
        <p className="font-mono text-xs text-text-muted leading-relaxed">
          Select a file or folder in the sidebar<br />to preview it here.
        </p>
      </div>
    )
  }

  const onGraph = isGraphNode(activeNode)

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 w-full max-w-lg">
      {/* Preview card */}
      <div className="w-full border border-border-muted rounded-lg bg-bg-panel p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {activeNode.type === "folder" ? (
            <Folder size={16} className="text-text-muted shrink-0" />
          ) : (
            <FileCode size={16} className="text-text-muted shrink-0" />
          )}
          <span className="font-mono text-sm text-white truncate">
            {activeNode.name}
          </span>
          <span className="ml-auto font-mono text-xs text-text-muted uppercase shrink-0">
            {activeNode.type}
          </span>
        </div>

        <div className="border-t border-border-muted pt-3 flex flex-col gap-1.5">
          <div className="flex gap-2">
            <span className="font-mono text-xs text-text-muted w-16 shrink-0">path</span>
            <span className="font-mono text-xs text-white/70 break-all">{activeNode.path}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-mono text-xs text-text-muted w-16 shrink-0">graph</span>
            <span className={`font-mono text-xs ${onGraph ? "text-green-400" : "text-text-muted"}`}>
              {onGraph ? "YES — will render as node" : "NO — config/asset file"}
            </span>
          </div>
          {activeNode.type === "folder" && activeNode.children && (
            <div className="flex gap-2">
              <span className="font-mono text-xs text-text-muted w-16 shrink-0">items</span>
              <span className="font-mono text-xs text-white/70">{activeNode.children.length}</span>
            </div>
          )}
        </div>
      </div>

      <span className="font-mono text-xs text-text-muted">
        — full graph engine coming next —
      </span>
    </div>
  )
}

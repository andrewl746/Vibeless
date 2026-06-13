"use client"

import { useCanvasStore } from "@/store/useCanvasStore"

export default function MascotPanel() {
  const activeNode = useCanvasStore((s) => s.activeNode)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3 py-2 border-b border-border-muted shrink-0">
        <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
          [ INSPECTOR ]
        </span>
      </div>

      {/* Mascot placeholder */}
      <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 border-b border-border-muted">
        <div className="w-12 h-12 rounded-full border border-border-muted bg-bg-deep flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <span className="font-mono text-xs text-text-muted text-center leading-relaxed">
          {activeNode
            ? `Analyzing\n${activeNode.name}…`
            : "Select a file\nto get insights"}
        </span>
      </div>

      {/* Active node details */}
      <div className="flex-1 flex flex-col gap-1 px-3 py-3 overflow-y-auto">
        {activeNode ? (
          <>
            <span className="font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
              Active
            </span>
            <span className="font-mono text-xs text-white truncate">{activeNode.name}</span>
            <span className="font-mono text-xs text-text-muted break-all">{activeNode.path}</span>
            <span className="font-mono text-xs text-text-muted mt-2 uppercase">
              {activeNode.type}
            </span>
          </>
        ) : (
          <span className="font-mono text-xs text-text-muted m-auto">— no selection —</span>
        )}
      </div>

      {/* Audio panel placeholder */}
      <div className="border-t border-border-muted px-3 py-3 flex flex-col gap-1.5">
        <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
          [ AUDIO ]
        </span>
        <div className="flex gap-1.5 items-center">
          <div className="w-2 h-2 rounded-full bg-text-muted/30" />
          <span className="font-mono text-xs text-text-muted">— placeholder —</span>
        </div>
      </div>
    </div>
  )
}

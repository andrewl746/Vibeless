"use client"

import { useEffect, useRef } from "react"
import Prism from "prismjs"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-json"
import "prismjs/plugins/line-numbers/prism-line-numbers"
import "prismjs/plugins/line-numbers/prism-line-numbers.css"
import { useGraphStore } from "@/store/useGraphStore"

export default function CodePreviewPane() {
  const activeCodeSnippet = useGraphStore((s) => s.activeCodeSnippet)
  const activeCodeLanguage = useGraphStore((s) => s.activeCodeLanguage)
  const activeCodeFilename = useGraphStore((s) => s.activeCodeFilename)
  const closeCodePane = useGraphStore((s) => s.closeCodePane)

  const codeRef = useRef<HTMLElement>(null)

  // Re-tokenize whenever the snippet or language changes.
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [activeCodeSnippet, activeCodeLanguage])

  return (
    <div className="code-pane flex h-full w-full flex-col bg-bg-panel border-l border-border-muted">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-muted bg-bg-deep shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest shrink-0">
            CODE
          </span>
          <span className="font-mono text-[9px] text-border-muted shrink-0">·</span>
          <span className="font-mono text-xs text-white truncate">
            {activeCodeFilename ?? "snippet"}
          </span>
          <span className="font-mono text-[9px] text-accent-blue uppercase px-1.5 py-0.5 border border-border-muted rounded shrink-0">
            {activeCodeLanguage}
          </span>
        </div>
        <button
          onClick={closeCodePane}
          className="font-mono text-xs text-text-muted hover:text-white transition-colors shrink-0"
        >
          [ X CLOSE ]
        </button>
      </div>

      {/* Code body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* key forces a fresh element per snippet so Prism never reconciles
            against its own injected token spans */}
        <pre
          key={`${activeCodeFilename}:${activeCodeSnippet?.length ?? 0}`}
          className={`line-numbers language-${activeCodeLanguage} font-mono text-xs leading-relaxed overflow-auto h-full p-4 m-0 bg-bg-deep whitespace-pre sidebar-scroll`}
        >
          <code ref={codeRef} className={`language-${activeCodeLanguage}`}>
            {activeCodeSnippet ?? "// No code snippet available for this node."}
          </code>
        </pre>
      </div>
    </div>
  )
}

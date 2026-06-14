"use client"

import { useCanvasStore } from "@/store/useCanvasStore"
import type { FileTreeNode } from "@/utils/parseTree"

const ROOT_PATH = "::repo-root::"

interface RepoRootButtonProps {
  repoName: string
  tree: FileTreeNode[]
}

export default function RepoRootButton({ repoName, tree }: RepoRootButtonProps) {
  const activeNode = useCanvasStore((s) => s.activeNode)
  const setActiveNode = useCanvasStore((s) => s.setActiveNode)
  const isActive = activeNode?.path === ROOT_PATH

  return (
    <button
      onClick={() =>
        // A synthetic root folder whose children are the whole repo — the canvas
        // builds the entire graph from it.
        setActiveNode({
          name: repoName,
          path: ROOT_PATH,
          type: "folder",
          children: tree,
        })
      }
      title="View the entire repository on the canvas"
      className={`group flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors ${
        isActive ? "bg-bg-deep" : "hover:bg-bg-deep"
      }`}
    >
      <span className="font-mono text-[9px] text-accent-blue shrink-0">◆</span>
      <span
        className={`font-mono text-xs truncate ${
          isActive ? "text-accent-blue" : "text-white/70 group-hover:text-white"
        }`}
      >
        {repoName}
      </span>
      <span className="ml-auto font-mono text-[8px] uppercase tracking-widest text-text-muted group-hover:text-accent-blue shrink-0">
        [ ALL ]
      </span>
    </button>
  )
}

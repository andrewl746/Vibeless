"use client"

import type { FileTreeNode } from "@/utils/parseTree"
import FileTreeItem from "./FileTreeItem"

interface FileTreeRootProps {
  tree: FileTreeNode[]
}

export default function FileTreeRoot({ tree }: FileTreeRootProps) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
          [ EMPTY ]
        </span>
        <p className="font-mono text-xs text-text-muted leading-relaxed">
          This repo is empty.<br />Add some files to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col py-2">
      {tree.map((node) => (
        <FileTreeItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
}

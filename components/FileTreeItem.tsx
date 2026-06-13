"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode } from "lucide-react"
import type { FileTreeNode } from "@/utils/parseTree"

interface FileTreeItemProps {
  node: FileTreeNode
  depth?: number
}

export default function FileTreeItem({ node, depth = 0 }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const indent = depth * 16

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 w-full text-left py-0.5 pr-2 rounded hover:bg-border-muted transition-colors group"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <span className="text-text-muted shrink-0">
            {isOpen ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </span>
          <span className="text-text-muted shrink-0">
            {isOpen ? <FolderOpen size={13} /> : <Folder size={13} />}
          </span>
          <span className="font-mono text-xs text-white/80 group-hover:text-white truncate">
            {node.name}
          </span>
        </button>

        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => console.log("Selected file path:", node.path)}
      className="flex items-center gap-1.5 w-full text-left py-0.5 pr-2 rounded hover:bg-border-muted transition-colors group"
      style={{ paddingLeft: `${8 + indent}px` }}
    >
      <span className="shrink-0 w-3" />
      <span className="text-text-muted shrink-0">
        <FileCode size={13} />
      </span>
      <span className="font-mono text-xs text-text-muted group-hover:text-white truncate">
        {node.name}
      </span>
    </button>
  )
}

import type { GitHubTreeItem } from "@/lib/github"

export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
}

const GRAPH_BLACKLIST = new Set([
  '.gitignore', 'package.json', 'package-lock.json', 'tsconfig.json',
  'favicon.ico', 'next.config.ts', 'postcss.config.mjs', 'eslint.config.mjs',
  '.DS_Store', 'README.md',
])

const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.php',
  '.c', '.cpp', '.h', '.cs', '.swift', '.kt', '.vue', '.svelte', '.mjs', '.cjs',
])

export function isGraphNode(node: FileTreeNode): boolean {
  if (node.type === 'folder') return true
  const name = node.name
  if (GRAPH_BLACKLIST.has(name)) return false
  const dot = name.lastIndexOf('.')
  if (dot === -1) return false
  return SOURCE_EXTENSIONS.has(name.slice(dot))
}

export function parseTree(items: GitHubTreeItem[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  for (const item of items) {
    const parts = item.path.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isLast = i === parts.length - 1
      const pathSoFar = parts.slice(0, i + 1).join("/")

      if (isLast) {
        if (item.type === "blob") {
          current.push({ name, path: item.path, type: "file" })
        }
        // trees (directories) are created implicitly below — skip explicit push
      } else {
        let folder = current.find((n) => n.name === name && n.type === "folder")
        if (!folder) {
          folder = { name, path: pathSoFar, type: "folder", children: [] }
          current.push(folder)
        }
        current = folder.children!
      }
    }
  }

  return root
}

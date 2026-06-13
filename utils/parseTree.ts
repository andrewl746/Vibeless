import type { GitHubTreeItem } from "@/lib/github"

export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
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

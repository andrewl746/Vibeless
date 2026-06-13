"use client"

import { create } from "zustand"
import type { FileTreeNode } from "@/utils/parseTree"

interface CanvasStore {
  activeNode: FileTreeNode | null
  setActiveNode: (node: FileTreeNode | null) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeNode: null,
  setActiveNode: (node) => set({ activeNode: node }),
}))

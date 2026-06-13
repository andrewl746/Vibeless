# ARCHITECTURE: Canvas Preview Layer

## What was built

### 1. Zustand store — `store/useCanvasStore.ts`
- `activeNode: FileTreeNode | null` — the currently selected file or folder
- `setActiveNode(node)` — setter used by sidebar clicks

### 2. Graph blacklist — `utils/parseTree.ts`
- `GRAPH_BLACKLIST` — config/asset filenames never rendered as graph nodes
- `SOURCE_EXTENSIONS` — allowed source extensions for graph nodes
- `isGraphNode(node)` — returns true if a node should appear in the graph canvas

### 3. Sidebar — `components/FileTreeItem.tsx`
- Accepts `onSelect(node)` callback and `activePath` prop
- Active item highlighted with `bg-accent/20`
- Hover highlight on all items
- Folder click both toggles expand AND sets active node

### 4. `components/FileTreeRoot.tsx`
- Reads `activeNode` and `setActiveNode` from `useCanvasStore`
- Passes both down to every `FileTreeItem`

### 5. Center canvas — `components/CanvasPreview.tsx`
- Idle state: prompt to select a file
- Active state: preview card showing name, path, type, graph eligibility, child count (folders)
- Uses `isGraphNode` to show whether node will appear in the graph engine

### 6. Right panel — `components/MascotPanel.tsx`
- Mascot avatar placeholder with context-aware caption
- Active node name + path display
- Audio panel placeholder at the bottom

## Next steps
- Replace CanvasPreview idle state with a zoomable graph canvas (e.g. React Flow)
- Add real mascot sprite + speech bubble driven by activeNode type/extension
- Wire audio panel to ambient sound engine
- Filter graph nodes using isGraphNode when building the React Flow node list

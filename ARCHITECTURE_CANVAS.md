# Vibeless: Center Canvas Interactive Graph Engine

## 1. Graph State Management (src/store/useGraphStore.ts)
We need complex state to handle "Isolation Mode" and Semantic Zoom. Update the Zustand store:
- `nodes` & `edges`: The current active graph.
- `mainGraphSnapshot`: A backup of `nodes` and `edges` used when we enter Isolation Mode.
- `isIsolationMode`: Boolean.
- `setZoomLevel(zoom: number)`: Action to track camera depth.
- `enterIsolationMode(targetNodeId: string, dependencies: Node[], dependencyEdges: Edge[])`: Saves the current graph to the snapshot, clears the board, and loads the new dependency tree.
- `exitIsolationMode()`: Restores `mainGraphSnapshot`.

## 2. Semantic Zoom & Camera Tracking (src/components/canvas/CanvasEngine.tsx)
Initialize `@xyflow/react`. 
- Implement `useOnViewportChange` to continuously update the `zoomLevel` in Zustand.
- **Visibility Logic:** 
  - Zoom < 0.5: Show only Project & Folders.
  - Zoom 0.5 - 1.0: Reveal Files inside Folders.
  - Zoom 1.0 - 1.5: Reveal Functions inside Files.
  - Zoom > 1.5: Reveal Variables.
- **Sidebar Sync:** Expose a function `focusNode(nodeId)` using React Flow's `useReactFlow().setCenter()`. Trigger this when `activePath` changes from the sidebar.

## 3. Custom Node Components (src/components/nodes/)
Build strictly typed, highly styled custom nodes. Do not render internal details if the zoom level is too far out.
- **ProjectNode:** Large Hexagon (dark slate background, thick white border).
- **FolderNode:** Rounded Rectangle (deep navy `#090D14`, subtle gray border). Contains children.
- **FileNode:** Square (`border-accent-blue`). 
- **FunctionNode:** Pill-shaped (green borders `#00E676`).
- **VariableNode:** Small Circle (orange/yellow borders).
- **Node UI Overlay:** When a node is clicked, render a small floating inline menu just below it with two buttons: `[ DESC ]` and `[ CODE ]`. 
  - `[ DESC ]` triggers a modal/panel that will later hook to our Anthropic API.
  - `[ CODE ]` triggers a modal showing the raw code snippet.
  - A third button `[ TRACE USAGE ]` triggers `enterIsolationMode()`.

## 4. Search Tool (src/components/canvas/SearchBar.tsx)
Build a floating autocomplete search bar positioned at the top-center of the canvas.
- When typing, filter the global `nodes` array by name.
- Render a dropdown of results with their respective shape/color icons (e.g., File, Function).
- Clicking a result triggers the `focusNode(nodeId)` camera animation.

## 5. Isolation Mode Overlay (src/components/canvas/IsolationOverlay.tsx)
When `isIsolationMode` is true, render a prominent, sticky UI banner at the top of the canvas:
- Text: `ISOLATION MODE: Viewing dependencies for [Node Name]`.
- Button: A large, red `[ X ] Return to Main Graph` button that fires `exitIsolationMode()`.

## 6. Lightweight AST / Mock Parser Placeholder (src/utils/codeParser.ts)
Create a utility framework for static analysis. Since full LSP is impossible right now, write a robust structural parser that reads file strings and uses regex/lightweight parsing to extract File, Function, and Variable nodes, and rough dependency edges (e.g., "import statements" and "function calls"). Ensure it outputs `Node[]` and `Edge[]` arrays mapped to our custom shapes.
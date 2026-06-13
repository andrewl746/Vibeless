# Vibeless: Collapsible GitHub Repository File Tree Hierarchy

## 1. UI Layout Specification (image_d2c59a.png & Mockup)
The left sidebar layout must implement the structural parameters defined below:
- **Width & Background:** Fixed width `w-72` (or 288px), background `bg-bg-panel` (#090D14), border-r `border-border-muted` (#141B24).
- **Repo Name Header:** Prominent uppercase bold white text at the absolute top of the sidebar. It must look like an official project title header (e.g., `REPO // [REPO_NAME]`).
- **Typography:** Folder and file names should use a clean, tight monospace font layout, with a text color of `#4B5E74` (`text-text-muted`) that changes to a clean white on hover or when a file is actively selected.

## 2. API Data Structure & Recursive Parsing Utility
GitHub's Git Trees API returns a flat array of object items. We must construct a clean utility to recursively parse this into a structural nested system.

- **Target API Endpoint:** Inside the server component dynamic route `src/app/dashboard/[repoName]/page.tsx`, fetch data using the user's `session.accessToken` from the GitHub recursive trees endpoint:
  `https://api.github.com/repos/{owner}/{repoName}/git/trees/main?recursive=1`
- **TypeScript Interface (src/types/github.ts):**
```typescript
  export interface GitHubTreeItem {
    path: string;
    mode: string;
    type: "blob" | "tree"; // blob = file, tree = folder
    sha: string;
    size?: number;
    url: string;
  }

  export interface FileTreeNode {
    name: string;
    path: string;
    type: "file" | "folder";
    children: FileTreeNode[];
  }
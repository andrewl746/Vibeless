# Vibeless: GitHub Repository Fetching & Selection Dashboard

## 1. UI Style Alignment (image_d2c59a.png)
The repository selection screen must strictly adhere to the clinical, low-contrast layout of image_d2c59a.png:
- Background: Full viewport `bg-bg-deep` (#06090E).
- Cards/Panels: Solid `bg-bg-panel` (#090D14) with a razor-thin border `border-border-muted` (#141B24).
- Text: Core headers in muted uppercase blue-gray `text-text-muted` (#4B5E74).
- Interactivity: Hover states on repository cards should use a subtle outer border flash or background tint rather than aggressive colors.

## 2. Protected Dashboard Server Component (src/app/dashboard/page.tsx)
Rewrite the existing dashboard placeholder file into a robust Server Component that handles authentication checks and fetches user repositories directly.

- **Authentication Guard:** Use `await auth()` from `@/auth`. If the session or `session.accessToken` does not exist, immediately invoke `redirect("/")`.
- **GitHub API Fetching Engine:**
  - Execute a server-side `fetch` request to the official GitHub API endpoint: `https://api.github.com/user/repos?per_page=100&sort=updated`.
  - Pass the required headers:
    - `Authorization: Bearer ${session.accessToken}`
    - `Accept: application/vnd.github+json`
    - `User-Agent: Vibeless-Visualizer`
  - Implement a clean `try/catch` block. If the GitHub API fails or returns a non-200 status, gracefully pass an empty array to prevent the page from crashing, and display an error warning card.

## 3. TypeScript Type Strictness (src/types/github.ts)
Create an explicit type definition file to map the incoming repository data structure from GitHub. Do not use `any`.
```typescript
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
}
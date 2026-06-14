export interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree"
  sha: string
  size?: number
  url: string
}

export interface GitHubTree {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

export interface RepoTreeResult {
  tree: GitHubTreeItem[]
  /** Tree SHA — a content fingerprint that changes when any file changes. */
  sha: string
}

export async function fetchRepoTree(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<RepoTreeResult> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 60 },
    },
  )

  // 404 = repo not found, 409 = repo exists but has no commits yet (empty)
  if (res.status === 404 || res.status === 409) return { tree: [], sha: "" }
  if (!res.ok) throw new Error(`GitHub tree API error: ${res.status}`)
  const data = (await res.json()) as GitHubTree
  return { tree: data.tree, sha: data.sha }
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  language: string | null
  html_url: string
}

export async function fetchAuthenticatedUser(accessToken: string): Promise<{ login: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`GitHub user API error: ${res.status}`)
  return res.json() as Promise<{ login: string }>
}

export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json() as Promise<GitHubRepo[]>
}

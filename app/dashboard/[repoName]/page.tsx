import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import DashboardNav from "@/components/DashboardNav"
import FileTreeRoot from "@/components/FileTreeRoot"
import RepoRootButton from "@/components/RepoRootButton"
import CanvasWorkspace from "@/components/canvas/CanvasWorkspace"
import { fetchRepoTree, fetchAuthenticatedUser } from "@/lib/github"
import { parseTree } from "@/utils/parseTree"

export default async function RepoPage({
  params,
}: {
  params: Promise<{ repoName: string }>
}) {
  const session = await auth()
  if (!session) redirect("/")

  const { repoName } = await params
  const decoded = decodeURIComponent(repoName)

  const ownerLogin =
    session.login ?? (await fetchAuthenticatedUser(session.accessToken)).login

  const { tree: rawTree, sha } = await fetchRepoTree(session.accessToken, ownerLogin, decoded)
  const tree = parseTree(rawTree)

  return (
    <div className="flex flex-col h-screen bg-bg-deep overflow-hidden">
      <DashboardNav
        userName={session.user?.name}
        userImage={session.user?.image}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar — file tree (all files visible) */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-border-muted bg-bg-panel overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-muted shrink-0">
            <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
              [ FILES ]
            </span>
            <Link
              href="/dashboard"
              className="font-mono text-xs text-text-muted hover:text-white transition-colors"
            >
              ← back
            </Link>
          </div>
          <div className="flex flex-col gap-0.5 px-1 py-1 border-b border-border-muted shrink-0">
            <RepoRootButton repoName={decoded} tree={tree} />
          </div>
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <FileTreeRoot tree={tree} />
          </div>
        </aside>

        {/* Center Workspace — canvas engine + sliding code pane */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasWorkspace owner={ownerLogin} repo={decoded} sha={sha} />
        </main>

      </div>
    </div>
  )
}

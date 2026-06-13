import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import DashboardNav from "@/components/DashboardNav"
import FileTreeRoot from "@/components/FileTreeRoot"
import CanvasPreview from "@/components/CanvasPreview"
import MascotPanel from "@/components/MascotPanel"
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

  const rawTree = await fetchRepoTree(session.accessToken, ownerLogin, decoded)
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
            <span className="font-mono text-xs text-white/70 px-2 py-1 truncate">
              {decoded}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <FileTreeRoot tree={tree} />
          </div>
        </aside>

        {/* Center Workspace — canvas engine */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasPreview />
        </main>

        {/* Right Sidebar — mascot + inspector */}
        <aside className="w-56 shrink-0 flex flex-col border-l border-border-muted bg-bg-panel overflow-hidden">
          <MascotPanel />
        </aside>

      </div>
    </div>
  )
}

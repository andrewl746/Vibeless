import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import DashboardNav from "@/components/DashboardNav"
import FileTreeRoot from "@/components/FileTreeRoot"
import RepoRootButton from "@/components/RepoRootButton"
import CanvasWorkspace from "@/components/canvas/CanvasWorkspace"
import { fetchRepoTree, fetchFileText, fetchAuthenticatedUser } from "@/lib/github"
import { parseTree } from "@/utils/parseTree"
import { detectTechStack } from "@/utils/techStack"

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

  const packageJson = await fetchFileText(session.accessToken, ownerLogin, decoded, "package.json")
  const techStack = detectTechStack({
    paths: rawTree.map((item) => item.path),
    packageJson,
  })

  return (
    <div className="flex flex-col h-screen bg-[linear-gradient(180deg,#07131a_0%,#06090E_100%)] overflow-hidden">
      <DashboardNav
        userName={session.user?.name}
        userImage={session.user?.image}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar — file tree (all files visible) */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-[#9CDCFE]/20 bg-[#0b1720]/95 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#9CDCFE]/15 shrink-0">
            <span className="font-mono text-xs text-[#9CDCFE] uppercase tracking-widest">
              [ FILES ]
            </span>
            <Link
              href="/dashboard"
              className="font-mono text-xs text-[#4EC9B0]/80 hover:text-[#4EC9B0] transition-colors"
            >
              ← back
            </Link>
          </div>
          <div className="flex flex-col gap-0.5 px-1 py-1 border-b border-[#9CDCFE]/15 shrink-0">
            <RepoRootButton repoName={decoded} tree={tree} />
          </div>
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <FileTreeRoot tree={tree} />
          </div>
        </aside>

        {/* Center Workspace — canvas engine + sliding code pane */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasWorkspace owner={ownerLogin} repo={decoded} sha={sha} techStack={techStack} />
        </main>

      </div>
    </div>
  )
}

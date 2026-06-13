import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { fetchUserRepos } from "@/lib/github"
import DashboardNav from "@/components/DashboardNav"
import RepoCard from "@/components/RepoCard"

export default async function Dashboard() {
  const session = await auth()
  if (!session) redirect("/")

  const repos = await fetchUserRepos(session.accessToken)

  return (
    <div className="flex flex-col min-h-screen bg-bg-deep">
      <DashboardNav
        userName={session.user?.name}
        userImage={session.user?.image}
      />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h2 className="font-mono text-xs text-text-muted uppercase tracking-widest">
            [ REPOSITORIES ] — {repos.length} found
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      </main>
    </div>
  )
}

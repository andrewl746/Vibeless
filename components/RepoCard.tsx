import Link from "next/link"
import type { GitHubRepo } from "@/lib/github"

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "text-blue-400",
  JavaScript: "text-yellow-400",
  Python: "text-green-400",
  Rust: "text-orange-400",
  Go: "text-cyan-400",
  Java: "text-red-400",
  "C++": "text-purple-400",
  C: "text-purple-300",
  Ruby: "text-red-500",
  Swift: "text-orange-500",
  Kotlin: "text-violet-400",
  CSS: "text-pink-400",
  HTML: "text-orange-300",
  Shell: "text-gray-400",
}

export default function RepoCard({ repo }: { repo: GitHubRepo }) {
  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? "text-text-muted") : "text-text-muted"

  return (
    <Link
      href={`/dashboard/${encodeURIComponent(repo.name)}`}
      className="group block border border-border-muted bg-bg-panel rounded-lg p-5 flex flex-col gap-3 transition-all duration-200 hover:border-accent-blue hover:shadow-[0_0_16px_0_rgba(0,163,255,0.15)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono font-bold text-white text-sm leading-snug break-all">
          {repo.name}
        </span>
        <span
          className={`shrink-0 font-mono text-xs border px-1.5 py-0.5 rounded ${
            repo.private
              ? "border-text-muted text-text-muted"
              : "border-accent-blue/40 text-accent-blue/80"
          }`}
        >
          {repo.private ? "Private" : "Public"}
        </span>
      </div>

      {repo.description && (
        <p className="font-mono text-xs text-text-muted line-clamp-2 leading-relaxed">
          {repo.description}
        </p>
      )}

      {repo.language && (
        <div className="mt-auto">
          <span className={`font-mono text-xs ${langColor}`}>
            ● {repo.language}
          </span>
        </div>
      )}
    </Link>
  )
}

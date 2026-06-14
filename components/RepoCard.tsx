import Link from "next/link"
import type { GitHubRepo } from "@/lib/github"

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "text-[#9CDCFE]",
  JavaScript: "text-[#C586C0]",
  Python: "text-[#4EC9B0]",
  Rust: "text-[#C586C0]",
  Go: "text-[#9CDCFE]",
  Java: "text-[#C586C0]",
  "C++": "text-[#9CDCFE]",
  C: "text-[#9CDCFE]",
  Ruby: "text-[#C586C0]",
  Swift: "text-[#C586C0]",
  Kotlin: "text-[#C586C0]",
  CSS: "text-[#4EC9B0]",
  HTML: "text-[#C586C0]",
  Shell: "text-[#4EC9B0]",
}

export default function RepoCard({ repo }: { repo: GitHubRepo }) {
  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? "text-text-muted") : "text-text-muted"

  return (
    <Link
      href={`/dashboard/${encodeURIComponent(repo.name)}`}
      className="group block border border-[#9CDCFE]/18 bg-[#0b1720]/90 rounded-lg p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:border-[#4EC9B0]/55 hover:shadow-[0_0_24px_0_rgba(78,201,176,0.16)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono font-bold text-white text-sm leading-snug break-all">
          {repo.name}
        </span>
        <span
          className={`shrink-0 font-mono text-xs border px-1.5 py-0.5 rounded ${
            repo.private
              ? "border-[#C586C0]/35 text-[#C586C0]/80"
              : "border-[#4EC9B0]/40 text-[#4EC9B0]/80"
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

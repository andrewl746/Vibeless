import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { scanSource, type ScannedEntityMap } from "@/utils/codeScanner"

const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])

function isSourceFile(path: string): boolean {
  const dot = path.lastIndexOf(".")
  return dot !== -1 && SOURCE_EXTS.has(path.slice(dot))
}

async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json() as { content?: string; encoding?: string }
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8")
  }
  return null
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { owner: string; repo: string; paths: string[] }
  const { owner, repo, paths } = body

  if (!owner || !repo || !Array.isArray(paths)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  // Only scan source files, limit to 30 to stay within rate limits
  const sourcePaths = paths.filter(isSourceFile).slice(0, 30)

  const entityMap: ScannedEntityMap = {}

  await Promise.all(
    sourcePaths.map(async (path) => {
      const source = await fetchFileContent(session.accessToken, owner, repo, path)
      if (source) {
        entityMap[path] = scanSource(path, source)
      }
    })
  )

  return NextResponse.json({ entityMap })
}

import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/auth"
import { getCachedAi, setCachedAi, parseRepoToken } from "@/lib/aiCacheServer"

// Stream a fixed string back (used for cache hits) so the client's streaming
// reader works identically whether the text came from Claude or Firestore.
function streamText(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}

const SYSTEM_PROMPT =
  "You are an elite developer onboarding assistant for Vibeless. Analyze the " +
  "following code snippet. Provide a precise, casual, and plain-English " +
  "explanation of exactly what this entity does, why it exists, and how it " +
  "impacts the rest of the file system architecture. Avoid boilerplate " +
  "introductions like 'Sure, here is...' or 'This code is...'. Jump straight " +
  "into the breakdown."

interface DescribeBody {
  name: string
  type: string
  path: string
  codeContext: string
  cacheToken?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, type, path, codeContext, cacheToken } = (await req.json()) as DescribeBody

  if (!name || !type) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  // Shared Firestore cache: one doc per (repo, entity), validated against the
  // current tree SHA. Serve a fresh hit directly; a stale/missing one regenerates
  // and overwrites the doc below.
  const { repoId, sha } = cacheToken ? parseRepoToken(cacheToken) : { repoId: "", sha: "" }
  const cacheKey = cacheToken && sha ? `desc:${repoId}:${type}:${path}:${name}` : null
  if (cacheKey) {
    const cached = await getCachedAi(cacheKey, sha)
    if (cached !== null) return streamText(cached)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    )
  }

  const userPrompt = [
    `Entity: ${name}`,
    `Type: ${type}`,
    path ? `Path: ${path}` : null,
    "",
    "Code:",
    codeContext?.trim() ? codeContext : "// (no code snippet was captured for this entity)",
  ]
    .filter((line) => line !== null)
    .join("\n")

  const client = new Anthropic({ apiKey })

  // Open the stream up front so connection/auth errors surface as a JSON status
  // response before we commit to a streaming body.
  let claudeStream: Awaited<ReturnType<typeof client.messages.create>>
  try {
    claudeStream = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      stream: true,
    })
  } catch (err) {
    const detail = err instanceof Anthropic.APIError ? err.message : "Unexpected error"
    return NextResponse.json(
      { error: `Failed to generate description: ${detail}` },
      { status: 502 }
    )
  }

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ""
      try {
        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            full += chunk.delta.text
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch {
        // Surface mid-stream failures inline so the user sees something went wrong.
        controller.enqueue(encoder.encode("\n\n[ STREAM INTERRUPTED ]"))
      } finally {
        controller.close()
      }
      // Persist the completed result to the shared cache (best-effort).
      if (cacheKey) await setCachedAi(cacheKey, sha, full, { kind: "desc", type, path, name })
    },
  })

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

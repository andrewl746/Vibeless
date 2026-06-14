import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@/auth"

type ChatTone = "casual" | "formal" | "concise"

interface AssistantMessage {
  role: "assistant" | "user"
  text: string
}

interface AssistantContext {
  viewMode: string
  activeSelection?: string | null
  graphSummary: string
  techStack: string[]
  highImpactFiles: Array<{ path: string; refs: number }>
  visibleNodes: Array<{ label: string; kind: string; path?: string }>
  visibleEdges: Array<{ source: string; target: string }>
}

interface AssistantBody {
  question: string
  tone: ChatTone
  messages: AssistantMessage[]
  context: AssistantContext
}

const TONE_INSTRUCTIONS: Record<ChatTone, string> = {
  casual: "Use a friendly, casual voice. Be useful, direct, and lightly conversational.",
  formal: "Use a professional, precise voice. Avoid slang and keep explanations structured.",
  concise: "Be brief. Prefer 2-4 short sentences unless the user asks for detail.",
}

const SYSTEM_PROMPT =
  "You are the Flowboard Flowchart Assistant. You answer questions about the " +
  "currently displayed repository graph, selected file/folder, dependency map, " +
  "Blast Radius mode, Tech Stack mode, and onboarding workflow. Ground your " +
  "answer in the provided graph context. If context is missing, say what is " +
  "missing and suggest the next UI action. Do not pretend to inspect files that " +
  "were not included. Avoid boilerplate like 'Sure'. Format answers for a small " +
  "chat panel: short paragraphs, real markdown bullet lists with blank lines " +
  "before lists, and no giant single-paragraph markdown dumps."

function compactContext(context: AssistantContext) {
  const visibleNodes = context.visibleNodes
    .slice(0, 40)
    .map((node) => `- ${node.kind}: ${node.label}${node.path ? ` (${node.path})` : ""}`)
    .join("\n")

  const visibleEdges = context.visibleEdges
    .slice(0, 30)
    .map((edge) => `- ${edge.source} -> ${edge.target}`)
    .join("\n")

  const highImpact = context.highImpactFiles
    .slice(0, 8)
    .map((file) => `- ${file.path}: ${file.refs} inbound refs`)
    .join("\n")

  return [
    `View mode: ${context.viewMode}`,
    `Active selection: ${context.activeSelection || "none"}`,
    `Graph summary: ${context.graphSummary}`,
    `Detected tech stack: ${context.techStack.length ? context.techStack.join(", ") : "none"}`,
    "",
    "High-impact files:",
    highImpact || "- none available",
    "",
    "Visible nodes:",
    visibleNodes || "- none loaded",
    "",
    "Visible edges:",
    visibleEdges || "- none loaded",
  ].join("\n")
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    )
  }

  let body: AssistantBody
  try {
    body = (await req.json()) as AssistantBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!body.question?.trim()) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 })
  }

  const contextText = compactContext(body.context)
  const recentMessages = body.messages.slice(-8).map((message) => ({
    role: message.role as "assistant" | "user",
    content: message.text,
  }))

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: body.tone === "concise" ? 420 : 900,
      system: `${SYSTEM_PROMPT}\n\nTone: ${TONE_INSTRUCTIONS[body.tone]}`,
      messages: [
        {
          role: "user",
          content: `Current flowchart context:\n${contextText}`,
        },
        ...recentMessages,
        {
          role: "user",
          content: body.question,
        },
      ],
    })

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim()

    return NextResponse.json({ text: text || "I could not generate a useful answer." })
  } catch (err) {
    const detail = err instanceof Anthropic.APIError ? err.message : "Unexpected error"
    return NextResponse.json(
      { error: `Failed to generate assistant answer: ${detail}` },
      { status: 502 }
    )
  }
}

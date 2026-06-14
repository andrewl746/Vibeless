"use client"

import { FormEvent, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { Bot, MessageCircle, Send, X } from "lucide-react"
import { useGraphStore } from "@/store/useGraphStore"
import { useCanvasStore } from "@/store/useCanvasStore"
import type { GraphNodeData } from "@/components/nodes/types"
import type { ScannedEntityMap, ScannedFile } from "@/utils/codeScanner"
import type { Node } from "@xyflow/react"

type ChatTone = "casual" | "formal" | "concise"

interface ChatMessage {
  role: "assistant" | "user"
  text: string
}

const TONE_LABEL: Record<ChatTone, string> = {
  casual: "Casual",
  formal: "Formal",
  concise: "Concise",
}

const assistantMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 text-xs leading-5 tracking-wide text-white/82">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#9CDCFE] drop-shadow-[0_0_10px_rgba(156,220,254,0.24)]">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="not-italic text-[#C586C0]">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 space-y-1.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1.5 pl-5 marker:text-[#4EC9B0] last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="relative list-none pl-4 text-xs leading-5 text-white/78 before:absolute before:left-0 before:top-[0.62em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[#4EC9B0] before:shadow-[0_0_10px_rgba(78,201,176,0.55)]">
      {children}
    </li>
  ),
  code: ({ children }) => (
    <code className="rounded border border-[#9CDCFE]/15 bg-black/40 px-1.5 py-0.5 text-[11px] text-[#4EC9B0]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md border border-[#9CDCFE]/15 bg-black/45 p-2 text-[11px] leading-5 text-[#4EC9B0]">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#9CDCFE]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#9CDCFE]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#C586C0]">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[#C586C0]/60 pl-3 text-white/70">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[#9CDCFE] underline decoration-[#9CDCFE]/40 underline-offset-2 transition hover:text-white"
    >
      {children}
    </a>
  ),
}

function normalizeAssistantMarkdown(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s+-\s+\*\*/g, "$1\n- **")
    .replace(/([^\n])\s+(\d+\.)\s+\*\*/g, "$1\n$2 **")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function summarizeKinds(nodes: Node<GraphNodeData>[]) {
  return nodes.reduce<Record<string, number>>((counts, node) => {
    counts[node.data.kind] = (counts[node.data.kind] ?? 0) + 1
    return counts
  }, {})
}

function truncateCode(source: string, maxChars = 2200) {
  const clean = source.trim()
  if (clean.length <= maxChars) return clean
  return `${clean.slice(0, maxChars).trimEnd()}\n// ...truncated for chat context`
}

function buildFileTree(paths: string[], maxLines = 90) {
  const sortedPaths = [...new Set(paths)].sort((a, b) => a.localeCompare(b))
  const lines = sortedPaths.map((path) => {
    const depth = Math.max(0, path.split("/").length - 1)
    const name = path.split("/").pop() ?? path
    return `${"  ".repeat(Math.min(depth, 6))}- ${name} (${path})`
  })
  const shown = lines.slice(0, maxLines)
  if (lines.length > shown.length) {
    shown.push(`- ...${lines.length - shown.length} more files`)
  }
  return shown
}

function fileSummary(file: ScannedFile) {
  const functions = file.functions.map((fn) => fn.name).slice(0, 16)
  const variables = file.variables.map((variable) => variable.name).slice(0, 12)
  return [
    functions.length ? `functions: ${functions.join(", ")}` : "functions: none detected",
    variables.length ? `variables: ${variables.join(", ")}` : "variables: none detected",
  ].join("; ")
}

function buildCodeReferences(
  entityMap: ScannedEntityMap,
  nodes: Node<GraphNodeData>[],
  highImpactFiles: Array<{ path: string; refs: number }>,
  activePath?: string | null
) {
  const selectedPaths = new Set<string>()

  if (activePath && entityMap[activePath]) selectedPaths.add(activePath)

  for (const { path } of highImpactFiles.slice(0, 4)) {
    if (entityMap[path]) selectedPaths.add(path)
  }

  for (const node of nodes) {
    const path = node.data.path
    if (typeof path === "string" && entityMap[path]) selectedPaths.add(path)
    if (selectedPaths.size >= 8) break
  }

  return [...selectedPaths].slice(0, 8).map((path) => {
    const file = entityMap[path]
    return {
      path,
      summary: fileSummary(file),
      code: truncateCode(file.source),
    }
  })
}

export default function RepoAssistant() {
  const nodes = useGraphStore((s) => s.nodes) as Node<GraphNodeData>[]
  const edges = useGraphStore((s) => s.edges)
  const currentViewMode = useGraphStore((s) => s.currentViewMode)
  const techStack = useGraphStore((s) => s.techStack)
  const riskCounts = useGraphStore((s) => s.riskCounts)
  const allScannedEntities = useGraphStore((s) => s.allScannedEntities)
  const activeNode = useCanvasStore((s) => s.activeNode)
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState<ChatTone>("casual")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask me about this flowchart. I can explain the selected file, graph shape, Blast Radius, Tech Stack, or where to start reading.",
    },
  ])

  const toneOptions = useMemo(() => Object.entries(TONE_LABEL) as Array<[ChatTone, string]>, [])

  function buildAssistantContext() {
    const counts = summarizeKinds(nodes)
    const nodeLabelById = new Map(nodes.map((node) => [node.id, node.data.label]))
    const highImpactFiles = Object.entries(riskCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, refs]) => ({ path, refs }))
    const filePaths = Object.keys(allScannedEntities)
    const activePath =
      activeNode?.path && allScannedEntities[activeNode.path] ? activeNode.path : null

    return {
      viewMode: currentViewMode,
      activeSelection: activeNode
        ? `${activeNode.name} (${activeNode.type}, ${activeNode.path})`
        : null,
      fileTree: buildFileTree(filePaths),
      graphSummary: `${nodes.length} nodes, ${edges.length} edges. Breakdown: ${
        Object.entries(counts)
          .map(([kind, count]) => `${count} ${kind}`)
          .join(", ") || "empty graph"
      }`,
      techStack: techStack.map((item) =>
        item.version ? `${item.name}@${item.version}` : item.name
      ),
      highImpactFiles,
      codeReferences: buildCodeReferences(allScannedEntities, nodes, highImpactFiles, activePath),
      visibleNodes: nodes.slice(0, 80).map((node) => ({
        label: node.data.label,
        kind: node.data.kind,
        path: node.data.path,
        hasCode: Boolean(node.data.code),
      })),
      visibleEdges: edges.slice(0, 80).map((edge) => ({
        source: nodeLabelById.get(edge.source) ?? edge.source,
        target: nodeLabelById.get(edge.target) ?? edge.target,
      })),
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text: question }]
    setMessages(nextMessages)
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          tone,
          messages,
          context: buildAssistantContext(),
        }),
      })

      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? "Assistant request failed.")
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.text ?? "I could not generate a useful answer." },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "The assistant could not reach the AI service.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="absolute bottom-4 right-4 z-40 font-mono pointer-events-auto">
      {open ? (
        <div className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#4EC9B0]/35 bg-black/90 shadow-[0_0_38px_rgba(78,201,176,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#9CDCFE]/15 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md border border-[#4EC9B0]/35 bg-[#4EC9B0]/10 text-[#4EC9B0]">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-widest text-white">Flowchart Assistant</div>
                <div className="text-[9px] uppercase tracking-widest text-[#9CDCFE]">
                  current graph context
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-white/10 p-1 text-[#9CDCFE] transition hover:border-[#C586C0]/50 hover:text-[#C586C0]"
              title="Close flowchart assistant"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="border-b border-[#9CDCFE]/15 px-3 py-2">
            <label className="mb-1 block text-[9px] uppercase tracking-widest text-[#9CDCFE]">
              Personality
            </label>
            <div className="grid grid-cols-3 gap-1">
              {toneOptions.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTone(value)}
                  className={`rounded border px-2 py-1 text-[10px] uppercase tracking-widest transition ${
                    tone === value
                      ? "border-[#4EC9B0] bg-[#4EC9B0]/15 text-[#4EC9B0]"
                      : "border-white/10 text-white/55 hover:border-[#9CDCFE]/40 hover:text-[#9CDCFE]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[min(420px,calc(100vh-17rem))] space-y-3 overflow-y-auto p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg border px-3 py-2.5 text-xs leading-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] ${
                  message.role === "assistant"
                    ? "mr-5 border-[#4EC9B0]/24 bg-[#07131a]/90 text-white"
                    : "ml-8 border-[#C586C0]/28 bg-[#C586C0]/10 text-[#F3D6EF]"
                }`}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown components={assistantMarkdownComponents}>
                    {normalizeAssistantMarkdown(message.text)}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap text-xs leading-5 tracking-wide">
                    {message.text}
                  </p>
                )}
              </div>
            ))}
            {isLoading ? (
              <div className="rounded-md border border-[#4EC9B0]/20 bg-[#4EC9B0]/8 px-3 py-2 text-xs leading-5 text-white/70">
                Thinking with the current graph context...
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[#9CDCFE]/15 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
              placeholder="Ask about this graph..."
              className="min-w-0 flex-1 rounded border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-[#9CDCFE] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="grid h-9 w-9 place-items-center rounded border border-[#4EC9B0]/40 bg-[#4EC9B0]/10 text-[#4EC9B0] transition hover:bg-[#4EC9B0]/18 disabled:cursor-not-allowed disabled:opacity-60"
              title="Send question"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 items-center gap-2 rounded-full border border-[#4EC9B0]/40 bg-black/85 px-4 text-xs uppercase tracking-widest text-[#4EC9B0] shadow-[0_0_28px_rgba(78,201,176,0.2)] backdrop-blur transition hover:border-[#9CDCFE]/60 hover:text-[#9CDCFE]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Ask flow AI
        </button>
      )}
    </div>
  )
}

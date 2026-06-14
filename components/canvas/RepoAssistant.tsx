"use client"

import { FormEvent, useMemo, useState } from "react"
import { Bot, MessageCircle, Send, X } from "lucide-react"
import { useGraphStore } from "@/store/useGraphStore"
import { useCanvasStore } from "@/store/useCanvasStore"
import type { GraphNodeData } from "@/components/nodes/types"
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

function summarizeKinds(nodes: Node<GraphNodeData>[]) {
  return nodes.reduce<Record<string, number>>((counts, node) => {
    counts[node.data.kind] = (counts[node.data.kind] ?? 0) + 1
    return counts
  }, {})
}

export default function RepoAssistant() {
  const nodes = useGraphStore((s) => s.nodes) as Node<GraphNodeData>[]
  const edges = useGraphStore((s) => s.edges)
  const currentViewMode = useGraphStore((s) => s.currentViewMode)
  const techStack = useGraphStore((s) => s.techStack)
  const riskCounts = useGraphStore((s) => s.riskCounts)
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
    return {
      viewMode: currentViewMode,
      activeSelection: activeNode
        ? `${activeNode.name} (${activeNode.type}, ${activeNode.path})`
        : null,
      graphSummary: `${nodes.length} nodes, ${edges.length} edges. Breakdown: ${
        Object.entries(counts)
          .map(([kind, count]) => `${count} ${kind}`)
          .join(", ") || "empty graph"
      }`,
      techStack: techStack.map((item) =>
        item.version ? `${item.name}@${item.version}` : item.name
      ),
      highImpactFiles: Object.entries(riskCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, refs]) => ({ path, refs })),
      visibleNodes: nodes.slice(0, 80).map((node) => ({
        label: node.data.label,
        kind: node.data.kind,
        path: node.data.path,
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

          <div className="max-h-72 space-y-2 overflow-y-auto p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-md border px-3 py-2 text-xs leading-5 ${
                  message.role === "assistant"
                    ? "border-[#4EC9B0]/20 bg-[#4EC9B0]/8 text-white"
                    : "ml-8 border-[#C586C0]/25 bg-[#C586C0]/10 text-[#F3D6EF]"
                }`}
              >
                {message.text}
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

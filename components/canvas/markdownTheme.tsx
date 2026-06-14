import type { CSSProperties } from "react"
import type { Components } from "react-markdown"

export interface MarkdownTheme {
  /** Accent hex used for headings, code, links, emphasis. */
  accent: string
  /** rgba glow used behind bold text. */
  glow: string
  /** Color for bold/strong text (hex). */
  strongColor: string
  /** Tailwind text-color class for body copy — must stay readable. */
  bodyClass: string
}

export const DESCRIPTION_THEME: MarkdownTheme = {
  accent: "#00A3FF",
  glow: "rgba(0,163,255,0.25)",
  strongColor: "#ffffff",
  bodyClass: "text-gray-300",
}

/**
 * Build react-markdown renderers so EVERY element Claude can emit (headings,
 * lists, code, quotes, rules…) inherits the tactical mono theme — nothing falls
 * back to the browser's default serif/sans styling.
 */
export function createMarkdownComponents(theme: MarkdownTheme): Components {
  const { accent, glow, strongColor, bodyClass } = theme
  const accentStyle: CSSProperties = { color: accent }
  const heading = "font-mono font-bold uppercase tracking-widest mt-4 mb-2 first:mt-0"

  return {
    h1: ({ children }) => (
      <h1 className={`text-sm ${heading}`} style={accentStyle}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={`text-xs ${heading}`} style={accentStyle}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={`text-[11px] ${heading}`} style={accentStyle}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className={`text-xs font-mono tracking-wide leading-relaxed mb-3 last:mb-0 ${bodyClass}`}>
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong
        className="font-mono font-semibold"
        style={{ color: strongColor, boxShadow: `0 0 8px ${glow}` }}
      >
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="not-italic" style={accentStyle}>
        {children}
      </em>
    ),
    code: ({ children }) => (
      <code
        className="bg-bg-deep border border-border-muted font-mono text-xs px-1.5 py-0.5 rounded"
        style={accentStyle}
      >
        {children}
      </code>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside pl-5 mb-3 flex flex-col gap-1.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-5 mb-3 flex flex-col gap-1.5">{children}</ol>
    ),
    li: ({ children }) => (
      <li className={`text-xs font-mono tracking-wide leading-relaxed ${bodyClass}`}>
        {children}
      </li>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
        style={accentStyle}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={`border-l-2 pl-3 my-3 font-mono text-xs leading-relaxed ${bodyClass}`}
        style={{ borderColor: accent }}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-3 border-border-muted" />,
  }
}

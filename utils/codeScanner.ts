// Exact regexes from spec
const FN_RE = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g
const ARROW_RE = /(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g
const VAR_RE = /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?![^)]*=>)/g

export interface ScannedEntity {
  name: string
  kind: "function" | "variable"
  snippet: string
}

export interface ScannedFile {
  path: string
  source: string
  functions: ScannedEntity[]
  variables: ScannedEntity[]
}

export type ScannedEntityMap = Record<string, ScannedFile>

function extractSnippet(source: string, index: number, lineCount = 10): string {
  const lineStart = source.lastIndexOf("\n", index)
  const start = lineStart === -1 ? 0 : lineStart + 1
  return source.slice(start).split("\n").slice(0, lineCount).join("\n")
}

export function scanSource(path: string, source: string): ScannedFile {
  const functions: ScannedEntity[] = []
  const variables: ScannedEntity[] = []
  const fnNames = new Set<string>()

  FN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = FN_RE.exec(source))) {
    if (!fnNames.has(m[1])) {
      fnNames.add(m[1])
      functions.push({ name: m[1], kind: "function", snippet: extractSnippet(source, m.index) })
    }
  }

  ARROW_RE.lastIndex = 0
  while ((m = ARROW_RE.exec(source))) {
    if (!fnNames.has(m[1])) {
      fnNames.add(m[1])
      functions.push({ name: m[1], kind: "function", snippet: extractSnippet(source, m.index) })
    }
  }

  VAR_RE.lastIndex = 0
  const varNames = new Set<string>()
  while ((m = VAR_RE.exec(source))) {
    const name = m[1]
    if (!fnNames.has(name) && !varNames.has(name)) {
      varNames.add(name)
      variables.push({ name, kind: "variable", snippet: extractSnippet(source, m.index) })
    }
  }

  return { path, source, functions, variables }
}

/** Get the code snippet for a named entity within a scanned file */
export function getEntitySnippet(
  entityName: string,
  file: ScannedFile
): string | undefined {
  const fn = file.functions.find((f) => f.name === entityName)
  if (fn) return fn.snippet
  const v = file.variables.find((v) => v.name === entityName)
  return v?.snippet
}

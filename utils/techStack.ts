export type TechCategory =
  | "language"
  | "framework"
  | "library"
  | "styling"
  | "state"
  | "data"
  | "tooling"

export interface TechItem {
  name: string
  category: TechCategory
  version?: string
}

// Order categories are displayed in.
export const CATEGORY_ORDER: TechCategory[] = [
  "language",
  "framework",
  "styling",
  "state",
  "data",
  "library",
  "tooling",
]

// Known dependency → display name + category. Anything not listed is ignored,
// which keeps the panel free of @types/*, eslint-config-*, and other noise.
const DEP_MAP: Record<string, { name: string; category: TechCategory }> = {
  // languages / runtimes
  typescript: { name: "TypeScript", category: "language" },
  // frameworks
  next: { name: "Next.js", category: "framework" },
  react: { name: "React", category: "framework" },
  vue: { name: "Vue", category: "framework" },
  nuxt: { name: "Nuxt", category: "framework" },
  svelte: { name: "Svelte", category: "framework" },
  "@sveltejs/kit": { name: "SvelteKit", category: "framework" },
  "@angular/core": { name: "Angular", category: "framework" },
  astro: { name: "Astro", category: "framework" },
  gatsby: { name: "Gatsby", category: "framework" },
  "@remix-run/react": { name: "Remix", category: "framework" },
  "solid-js": { name: "SolidJS", category: "framework" },
  preact: { name: "Preact", category: "framework" },
  express: { name: "Express", category: "framework" },
  fastify: { name: "Fastify", category: "framework" },
  "@nestjs/core": { name: "NestJS", category: "framework" },
  // styling
  tailwindcss: { name: "Tailwind CSS", category: "styling" },
  "styled-components": { name: "styled-components", category: "styling" },
  "@emotion/react": { name: "Emotion", category: "styling" },
  sass: { name: "Sass", category: "styling" },
  bootstrap: { name: "Bootstrap", category: "styling" },
  "@mui/material": { name: "MUI", category: "styling" },
  "@chakra-ui/react": { name: "Chakra UI", category: "styling" },
  // state
  zustand: { name: "Zustand", category: "state" },
  redux: { name: "Redux", category: "state" },
  "@reduxjs/toolkit": { name: "Redux Toolkit", category: "state" },
  jotai: { name: "Jotai", category: "state" },
  recoil: { name: "Recoil", category: "state" },
  mobx: { name: "MobX", category: "state" },
  "@tanstack/react-query": { name: "React Query", category: "state" },
  // data / backend / auth
  firebase: { name: "Firebase", category: "data" },
  "firebase-admin": { name: "Firebase", category: "data" },
  "@supabase/supabase-js": { name: "Supabase", category: "data" },
  mongoose: { name: "Mongoose", category: "data" },
  mongodb: { name: "MongoDB", category: "data" },
  pg: { name: "PostgreSQL", category: "data" },
  mysql2: { name: "MySQL", category: "data" },
  prisma: { name: "Prisma", category: "data" },
  "@prisma/client": { name: "Prisma", category: "data" },
  "drizzle-orm": { name: "Drizzle", category: "data" },
  ioredis: { name: "Redis", category: "data" },
  redis: { name: "Redis", category: "data" },
  "next-auth": { name: "Auth.js", category: "data" },
  // libraries
  "@anthropic-ai/sdk": { name: "Anthropic SDK", category: "library" },
  openai: { name: "OpenAI SDK", category: "library" },
  "@xyflow/react": { name: "React Flow", category: "library" },
  "react-markdown": { name: "react-markdown", category: "library" },
  prismjs: { name: "Prism", category: "library" },
  dagre: { name: "Dagre", category: "library" },
  three: { name: "Three.js", category: "library" },
  d3: { name: "D3", category: "library" },
  "framer-motion": { name: "Framer Motion", category: "library" },
  zod: { name: "Zod", category: "library" },
  axios: { name: "Axios", category: "library" },
  swr: { name: "SWR", category: "library" },
  // tooling
  eslint: { name: "ESLint", category: "tooling" },
  prettier: { name: "Prettier", category: "tooling" },
  vite: { name: "Vite", category: "tooling" },
  webpack: { name: "Webpack", category: "tooling" },
  jest: { name: "Jest", category: "tooling" },
  vitest: { name: "Vitest", category: "tooling" },
  playwright: { name: "Playwright", category: "tooling" },
  cypress: { name: "Cypress", category: "tooling" },
  turbo: { name: "Turborepo", category: "tooling" },
}

// Extension → language (for repos without a package.json, or polyglot repos).
const EXT_LANG: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  go: "Go",
  rs: "Rust",
  rb: "Ruby",
  java: "Java",
  kt: "Kotlin",
  php: "PHP",
  cs: "C#",
  cpp: "C++",
  cc: "C++",
  c: "C",
  swift: "Swift",
  vue: "Vue",
  svelte: "Svelte",
}

// Manifest / config file → tech signal (covers non-JS repos and infra tooling).
const FILE_SIGNALS: { match: (p: string) => boolean; item: { name: string; category: TechCategory } }[] = [
  { match: (p) => p === "requirements.txt" || p === "pyproject.toml" || p === "Pipfile", item: { name: "Python", category: "language" } },
  { match: (p) => p === "go.mod", item: { name: "Go", category: "language" } },
  { match: (p) => p === "Cargo.toml", item: { name: "Rust", category: "language" } },
  { match: (p) => p === "Gemfile", item: { name: "Ruby", category: "language" } },
  { match: (p) => p === "composer.json", item: { name: "PHP", category: "language" } },
  { match: (p) => p === "pom.xml" || p.startsWith("build.gradle"), item: { name: "Java", category: "language" } },
  { match: (p) => p === "Dockerfile" || p === "docker-compose.yml" || p === "compose.yaml", item: { name: "Docker", category: "tooling" } },
  { match: (p) => p.startsWith(".github/workflows/"), item: { name: "GitHub Actions", category: "tooling" } },
  { match: (p) => p.startsWith("vite.config."), item: { name: "Vite", category: "tooling" } },
]

function cleanVersion(v: string): string {
  return v.replace(/^[\^~>=<\s]+/, "").trim()
}

export function detectTechStack(input: {
  paths: string[]
  packageJson?: string | null
}): TechItem[] {
  const { paths, packageJson } = input
  // name (lowercased) → item, so we dedupe and prefer the entry that has a version.
  const found = new Map<string, TechItem>()
  const add = (item: TechItem) => {
    const key = item.name.toLowerCase()
    const existing = found.get(key)
    if (!existing || (!existing.version && item.version)) found.set(key, item)
  }

  // 1. package.json dependencies (richest signal, includes versions).
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const deps = { ...pkg.devDependencies, ...pkg.dependencies }
      for (const [dep, range] of Object.entries(deps)) {
        const mapped = DEP_MAP[dep]
        if (mapped) add({ ...mapped, version: cleanVersion(range) })
      }
    } catch {
      // Malformed package.json — fall back to file heuristics only.
    }
  }

  // 2. Languages from file extensions.
  const seenLang = new Set<string>()
  for (const p of paths) {
    const dot = p.lastIndexOf(".")
    if (dot === -1) continue
    const lang = EXT_LANG[p.slice(dot + 1).toLowerCase()]
    if (lang && !seenLang.has(lang)) {
      seenLang.add(lang)
      add({ name: lang, category: lang === "Vue" || lang === "Svelte" ? "framework" : "language" })
    }
  }

  // 3. Manifest / config file signals.
  for (const p of paths) {
    for (const sig of FILE_SIGNALS) {
      if (sig.match(p)) add(sig.item)
    }
  }

  return [...found.values()].sort((a, b) => {
    const ci = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    return ci !== 0 ? ci : a.name.localeCompare(b.name)
  })
}

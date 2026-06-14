"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import type { IconType } from "react-icons"
import {
  SiTypescript, SiJavascript, SiNextdotjs, SiReact, SiVuedotjs, SiSvelte,
  SiAngular, SiAstro, SiGatsby, SiRemix, SiSolid, SiPreact, SiExpress,
  SiFastify, SiNestjs, SiTailwindcss, SiStyledcomponents, SiSass, SiBootstrap,
  SiMui, SiChakraui, SiRedux, SiReactquery, SiMobx, SiFirebase, SiSupabase,
  SiMongoose, SiMongodb, SiPostgresql, SiMysql, SiPrisma, SiDrizzle, SiRedis,
  SiOpenai, SiAnthropic, SiMarkdown, SiThreedotjs, SiFramer, SiAxios, SiZod,
  SiSwr, SiPython, SiGo, SiRust, SiRuby, SiPhp, SiKotlin, SiEslint, SiPrettier,
  SiVite, SiWebpack, SiJest, SiVitest, SiCypress, SiTurborepo, SiDocker,
  SiGithubactions, SiRecoil,
} from "react-icons/si"
import type { GraphNodeData } from "./types"
import type { TechCategory } from "@/utils/techStack"

type TechNodeType = Node<GraphNodeData>

const CATEGORY_COLOR: Record<TechCategory, string> = {
  language: "#00A3FF",
  framework: "#00E676",
  styling: "#F472B6",
  state: "#FFB300",
  data: "#A78BFA",
  library: "#8FB3CC",
  tooling: "#4B5E74",
}

// Tech display name → brand icon. Anything not listed falls back to a dot.
const TECH_ICON: Record<string, IconType> = {
  TypeScript: SiTypescript,
  JavaScript: SiJavascript,
  "Next.js": SiNextdotjs,
  React: SiReact,
  Vue: SiVuedotjs,
  Svelte: SiSvelte,
  Angular: SiAngular,
  Astro: SiAstro,
  Gatsby: SiGatsby,
  Remix: SiRemix,
  SolidJS: SiSolid,
  Preact: SiPreact,
  Express: SiExpress,
  Fastify: SiFastify,
  NestJS: SiNestjs,
  "Tailwind CSS": SiTailwindcss,
  "styled-components": SiStyledcomponents,
  Sass: SiSass,
  Bootstrap: SiBootstrap,
  MUI: SiMui,
  "Chakra UI": SiChakraui,
  Redux: SiRedux,
  "Redux Toolkit": SiRedux,
  "React Query": SiReactquery,
  MobX: SiMobx,
  Recoil: SiRecoil,
  Firebase: SiFirebase,
  Supabase: SiSupabase,
  Mongoose: SiMongoose,
  MongoDB: SiMongodb,
  PostgreSQL: SiPostgresql,
  MySQL: SiMysql,
  Prisma: SiPrisma,
  Drizzle: SiDrizzle,
  Redis: SiRedis,
  "OpenAI SDK": SiOpenai,
  "Anthropic SDK": SiAnthropic,
  "react-markdown": SiMarkdown,
  "Three.js": SiThreedotjs,
  "Framer Motion": SiFramer,
  Axios: SiAxios,
  Zod: SiZod,
  SWR: SiSwr,
  Python: SiPython,
  Go: SiGo,
  Rust: SiRust,
  Ruby: SiRuby,
  PHP: SiPhp,
  Kotlin: SiKotlin,
  ESLint: SiEslint,
  Prettier: SiPrettier,
  Vite: SiVite,
  Webpack: SiWebpack,
  Jest: SiJest,
  Vitest: SiVitest,
  Cypress: SiCypress,
  Turborepo: SiTurborepo,
  Docker: SiDocker,
  "GitHub Actions": SiGithubactions,
}

export default function TechNode({ data, selected }: NodeProps<TechNodeType>) {
  const category = data.techCategory ?? "library"
  const color = CATEGORY_COLOR[category]
  const Icon = TECH_ICON[data.label]

  return (
    <div
      className="relative flex flex-col items-center gap-1 px-4 py-2.5"
      style={{
        minWidth: 124,
        background: "#06090E",
        border: `1.5px solid ${selected ? color : `${color}88`}`,
        borderRadius: 8,
        boxShadow: `0 0 12px ${color}33`,
      }}
    >
      {Icon ? (
        <Icon size={22} color={color} className="pointer-events-none" />
      ) : (
        <span
          className="inline-block h-4 w-4 rounded-full"
          style={{ background: color }}
        />
      )}
      <span className="font-mono text-xs text-white pointer-events-none select-none whitespace-nowrap">
        {data.label}
      </span>
      {data.techVersion && (
        <span className="font-mono text-[9px] text-text-muted pointer-events-none select-none">
          v{data.techVersion}
        </span>
      )}

      <Handle type="target" position={Position.Top} style={{ background: `${color}88` }} />
      <Handle type="source" position={Position.Bottom} style={{ background: `${color}88` }} />
    </div>
  )
}

import { auth, isGitHubConfigured, signIn } from "@/auth";
import AnimatedTitleWord from "../components/AnimatedTitleWord";
import LandingNetworkBackground from "../components/LandingNetworkBackground";
import { FileCode2, LogIn } from "lucide-react";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";

function GitHubButton({
  label = "Get started with GitHub",
  variant = "light",
  disabled = false,
}: {
  label?: string;
  variant?: "light" | "dark";
  disabled?: boolean;
}) {
  const className =
    variant === "light"
      ? "border-white/20 bg-white text-bg-deep hover:bg-slate-200 focus:ring-accent-blue focus:ring-offset-bg-deep disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      : "border-white/15 bg-white/8 text-white hover:bg-white/12 focus:ring-accent-blue focus:ring-offset-black disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500";

  return (
    <form
      action={async () => {
        "use server";
        if (!isGitHubConfigured) return;
        await signIn("github", { redirectTo: "/dashboard" });
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        className={`inline-flex h-12 items-center justify-center gap-3 rounded-md border px-5 font-mono text-sm font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
      >
        <LogIn className="h-5 w-5" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}

const floatingBinary = [
  ["01001010 01110011", "left-[8%] top-[22%]", "text-[#9CDCFE]/20"],
  ["1011 0010 1101", "right-[12%] top-[18%]", "text-[#4EC9B0]/20"],
  ["011001 /src /app", "left-[15%] top-[58%]", "text-[#C586C0]/18"],
  ["100101 context.map()", "right-[18%] top-[54%]", "text-[#9CDCFE]/18"],
  ["00110110 0101", "left-[42%] top-[12%]", "text-[#C586C0]/16"],
  ["repo.map = true", "right-[7%] top-[76%]", "text-[#4EC9B0]/18"],
];

const bottomBinaryDigits = Array.from({ length: 96 }, (_, index) => {
  const columns = 24;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const left = 2 + column * (96 / (columns - 1));
  const bottom = -16 + row * 26 + (column % 3) * 7;
  const speed = 2.25 + (column % 7) * 0.22 + row * 0.1;
  const delay = (column % 8) * -0.2 + row * -0.5;
  const opacity = 0.24 + (index % 6) * 0.08;
  const size =
    index % 5 === 0 ? "text-base" : index % 3 === 0 ? "text-sm" : "text-xs";

  return {
    digit: index % 3 === 0 ? "1" : "0",
    size,
    style: {
      left: `${left}%`,
      bottom: `${bottom}px`,
      "--digit-speed": `${speed}s`,
      "--digit-opacity": opacity,
      animationDelay: `${delay}s`,
    } as CSSProperties,
  };
});

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#07131a_0%,#070c13_42%,#03060b_78%,#000_100%)]">
        <LandingNetworkBackground />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(156,220,254,0.18),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(78,201,176,0.12),transparent_25%),radial-gradient(circle_at_82%_62%,rgba(197,134,192,0.14),transparent_29%),linear-gradient(180deg,rgba(4,9,18,0.18),rgba(0,0,0,0.64)_82%,#000_100%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(156,220,254,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(78,201,176,0.62)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-xs"
        >
          {floatingBinary.map(([text, position, color], index) => (
            <span
              key={text}
              className={`binary-drift absolute ${position} ${color}`}
              style={{ animationDelay: `${index * -2.4}s` }}
            >
              {text}
            </span>
          ))}
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6">
          <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <span className="relative grid h-12 w-12 place-items-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 64"
                  className="h-12 w-12 overflow-visible"
                >
                  <defs>
                    <linearGradient id="logo-shell" x1="12" y1="8" x2="52" y2="56">
                      <stop stopColor="#06111d" />
                      <stop offset="1" stopColor="#010409" />
                    </linearGradient>
                    <pattern
                      id="logo-honeycomb"
                      width="17"
                      height="14.7"
                      patternUnits="userSpaceOnUse"
                      patternTransform="translate(1 0)"
                    >
                      <path
                        d="M4.25 0.75h8.5l4.25 6.6-4.25 6.6h-8.5L0 7.35z"
                        fill="none"
                        stroke="#4EC9B0"
                        strokeWidth="0.75"
                        opacity="0.16"
                      />
                    </pattern>
                    <filter id="logo-green-glow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2.6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <polygon
                    points="32 4 56 18 56 46 32 60 8 46 8 18"
                    fill="url(#logo-shell)"
                    stroke="#4EC9B0"
                    strokeWidth="2.25"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="32 4 56 18 56 46 32 60 8 46 8 18"
                    fill="url(#logo-honeycomb)"
                    opacity="0.72"
                  />
                  <path
                    d="M15 23 H25 L32 48 L48 20"
                    fill="none"
                    stroke="#4EC9B0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="5.4"
                    filter="url(#logo-green-glow)"
                  />
                  <path
                    d="M15 23 H25 L32 48 L48 20"
                    fill="none"
                    stroke="#9CDCFE"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    opacity="0.82"
                  />
                  {[
                    ["41", "30", "50"],
                    ["39", "37", "48"],
                    ["37", "44", "45"],
                  ].map(([x1, y, x2]) => (
                    <line
                      key={y}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="#4EC9B0"
                      strokeLinecap="round"
                      strokeWidth="3.2"
                      opacity="0.86"
                      filter="url(#logo-green-glow)"
                    />
                  ))}
                </svg>
              </span>
              <span className="relative font-mono text-lg font-black uppercase tracking-[0.18em]">
                <span className="text-[#9CDCFE] drop-shadow-[0_0_14px_rgba(156,220,254,0.28)]">
                  Flow
                </span>
                <span className="text-[#4EC9B0] drop-shadow-[0_0_14px_rgba(78,201,176,0.22)]">
                  board
                </span>
                <span className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-[#4EC9B0] via-[#9CDCFE] to-transparent opacity-70" />
              </span>
            </div>

            <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-slate-400 md:flex">
              <span>Context</span>
              <span>Inspect</span>
              <span>Ship</span>
            </div>

            <GitHubButton label="Start" variant="dark" disabled={!isGitHubConfigured} />
          </nav>

          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <div className="mx-auto max-w-4xl">
              <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#4EC9B0]/25 bg-[#4EC9B0]/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#4EC9B0] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4EC9B0] shadow-[0_0_16px_rgba(78,201,176,0.75)]" />
                Codebase orientation for modern teams
              </div>

              <h1 className="text-balance font-mono text-5xl font-semibold leading-[0.98] tracking-normal text-white sm:text-7xl">
                <AnimatedTitleWord />
                <span className="text-[#C586C0]"> your </span>
                <span className="text-[#9CDCFE]">codebase</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-pretty font-sans text-base leading-7 text-slate-300 sm:text-lg">
                Flowboard maps structure, key flows, and contributor context
                across fast-moving or inherited repositories.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <GitHubButton disabled={!isGitHubConfigured} />
                <a
                  href="#overview"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-[#4EC9B0]/25 bg-[#4EC9B0]/10 px-5 font-mono text-sm font-semibold uppercase tracking-wide text-[#4EC9B0] backdrop-blur-md transition hover:bg-[#4EC9B0]/15"
                >
                  Explore the workflow
                </a>
              </div>
            </div>

            <div className="mt-10 w-full max-w-5xl overflow-hidden rounded-[1.25rem] border border-[#9CDCFE]/18 bg-black/70 text-left shadow-2xl shadow-[#9CDCFE]/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#9CDCFE]/80" />
                  <span className="h-3 w-3 rounded-full bg-[#4EC9B0]/75" />
                  <span className="h-3 w-3 rounded-full bg-[#C586C0]/75" />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#C586C0]/70">
                  product preview
                </span>
              </div>
              <div className="grid min-h-[250px] gap-0 md:grid-cols-[240px_1fr]">
                <aside className="border-b border-white/10 bg-black/20 p-5 md:border-b-0 md:border-r">
                  <div className="mb-5 h-3 w-28 rounded-full bg-[#9CDCFE]/20" />
                  <div className="space-y-3">
                    {["app/", "components/", "lib/", "onboarding.md"].map(
                      (item, index) => (
                        <div
                          key={item}
                          className={`rounded-md border border-white/8 bg-white/[0.035] px-3 py-2 font-mono text-xs ${
                            index === 0
                              ? "text-[#9CDCFE]/80"
                            : index === 1
                                ? "text-[#4EC9B0]/75"
                                : index === 2
                                  ? "text-[#C586C0]/70"
                                  : "text-[#9CDCFE]/70"
                          }`}
                        >
                          {item}
                        </div>
                      ),
                    )}
                  </div>
                </aside>
                <div className="relative flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(156,220,254,0.14),transparent_34%)]" />
                  <div className="relative w-full max-w-xl rounded-lg border border-dashed border-[#9CDCFE]/25 bg-black/25 p-8 text-center">
                    <p className="font-mono text-xs uppercase tracking-widest text-[#9CDCFE]/70">
                      reserved for product imagery
                    </p>
                    <p className="mt-3 font-sans text-sm leading-6 text-slate-400">
                      Reserved space for the Flowboard project screenshot,
                      dashboard capture, or repository map preview.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="overview"
        className="relative overflow-hidden bg-[linear-gradient(180deg,#000_0%,#010307_30%,#03070d_68%,#000_100%)] px-6 py-28"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,rgba(78,201,176,0.1),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(197,134,192,0.08),transparent_24%),radial-gradient(circle_at_52%_72%,rgba(156,220,254,0.08),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_20px)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {[
            ["Repository mapping", "Create a clear view of routes, files, dependencies, and system boundaries when documentation is incomplete.", "map.repository.ts", "from-[#9CDCFE] to-[#9CDCFE]", "text-[#9CDCFE]"],
            ["Structured onboarding", "Help new contributors understand inherited systems without relying on scattered explanations or tribal knowledge.", "onboard.flow.md", "from-[#4EC9B0] to-[#4EC9B0]", "text-[#4EC9B0]"],
            ["Safer iteration", "Turn rapid prototypes and established codebases into systems that can be inspected, extended, and maintained.", "iterate.safely.ts", "from-[#C586C0] to-[#C586C0]", "text-[#C586C0]"],
          ].map(([title, body, filename, gradient, headingColor], index) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,22,0.78),rgba(4,8,13,0.42))] shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-2 hover:border-white/18 hover:shadow-[0_26px_60px_rgba(0,0,0,0.42)]"
            >
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${gradient} opacity-80 shadow-[0_0_22px_currentColor]`} />
              <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileCode2 className={`h-4 w-4 shrink-0 ${headingColor}`} aria-hidden="true" />
                  <span className="truncate font-mono text-xs text-slate-300">
                    {filename}
                  </span>
                </div>
                <span className="font-mono text-xs text-white/25">
                  0{index + 1}
                </span>
              </div>
              <div className="p-6">
                <div className={`mb-7 h-1.5 w-14 rounded-full bg-gradient-to-r ${gradient}`} />
                <h2 className={`font-mono text-xl font-semibold tracking-normal ${headingColor}`}>
                  {title}
                </h2>
                <p className="mt-4 font-sans text-sm leading-7 text-slate-400">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-6 py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-52 overflow-hidden bg-[linear-gradient(180deg,transparent_0%,rgba(78,201,176,0.06)_45%,rgba(0,0,0,0.68)_100%)] font-mono text-[#4EC9B0]"
        >
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_at_50%_100%,rgba(78,201,176,0.28),transparent_64%)]" />
          {bottomBinaryDigits.map(({ digit, size, style }, index) => (
            <span
              key={`${digit}-${index}`}
              className={`binary-drift-green absolute ${size}`}
              style={style}
            >
              {digit}
            </span>
          ))}
        </div>
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[#4EC9B0]">
            Start from the current repository
          </p>
          <h2 className="mt-5 font-mono text-4xl font-semibold tracking-normal text-[#9CDCFE] sm:text-5xl">
            <span className="text-[#C586C0]">Make</span>{" "}
            <span className="text-[#4EC9B0]">complex codebases</span>{" "}
            <span className="text-[#9CDCFE]">easier to enter.</span>
          </h2>
          <p className="mt-5 max-w-2xl font-sans text-base leading-8 text-slate-400">
            Connect GitHub to generate a clearer view of structure, intent,
            entry points, and the context contributors need before making
            changes.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <GitHubButton
              label="Get started with GitHub"
              disabled={!isGitHubConfigured}
            />
            {!isGitHubConfigured ? (
              <p className="max-w-md font-mono text-xs leading-6 text-[#C586C0]/75">
                Add AUTH_GITHUB_ID and AUTH_GITHUB_SECRET to .env.local, then
                restart the dev server.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

import { auth, isGitHubConfigured, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-bg-deep">
      <div className="border border-border-muted bg-bg-panel rounded-lg p-10 flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-semibold tracking-widest text-white uppercase">
              Vibeless
            </span>
            <span className="text-xs font-mono text-text-muted border border-border-muted px-2 py-0.5 rounded">
              PROJECT [UNSAVED]
            </span>
          </div>
          <p className="text-xs font-mono text-text-muted tracking-widest uppercase">
            [ AGENT ] · [ INSPECTOR ] · [ CONTEXT ]
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            if (!isGitHubConfigured) return;
            await signIn("github", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            disabled={!isGitHubConfigured}
            className="border border-border-muted bg-bg-panel hover:bg-border-muted text-white px-4 py-2 rounded transition-colors font-mono text-sm tracking-wide disabled:cursor-not-allowed disabled:text-text-muted"
          >
            Sign in with GitHub
          </button>
        </form>
        {!isGitHubConfigured ? (
          <p className="text-center font-mono text-xs leading-6 text-text-muted">
            Add AUTH_GITHUB_ID and AUTH_GITHUB_SECRET to .env.local, then
            restart the dev server.
          </p>
        ) : null}
      </div>
    </div>
  );
}

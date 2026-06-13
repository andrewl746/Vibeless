import Image from "next/image"
import { signOut } from "@/auth"

interface DashboardNavProps {
  userName: string | null | undefined
  userImage: string | null | undefined
}

export default function DashboardNav({ userName, userImage }: DashboardNavProps) {
  return (
    <header className="flex items-center justify-between border-b border-border-muted bg-bg-panel px-6 py-3 shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-mono font-semibold tracking-widest text-white uppercase text-sm">
          Vibeless
        </span>
        <span className="text-xs font-mono text-text-muted border border-border-muted px-2 py-0.5 rounded">
          PROJECT [UNSAVED]
        </span>
        <span className="text-xs font-mono text-text-muted hidden sm:inline">[ AGENT ]</span>
        <span className="text-xs font-mono text-text-muted hidden sm:inline">[ INSPECTOR ]</span>
      </div>

      <div className="flex items-center gap-3">
        {userImage && (
          <Image
            src={userImage}
            alt={userName ?? "user"}
            width={24}
            height={24}
            className="rounded-full border border-border-muted"
          />
        )}
        <span className="text-xs font-mono text-text-muted hidden sm:inline">
          {userName}
        </span>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="border border-border-muted bg-bg-panel hover:bg-border-muted text-white px-3 py-1 rounded transition-colors font-mono text-xs tracking-wide"
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  )
}

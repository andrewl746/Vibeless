import Image from "next/image"
import { signOut } from "@/auth"

interface DashboardNavProps {
  userName: string | null | undefined
  userImage: string | null | undefined
}

export default function DashboardNav({ userName, userImage }: DashboardNavProps) {
  return (
    <header className="flex items-center justify-between border-b border-[#9CDCFE]/20 bg-[#07131a]/95 px-6 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.28)] shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-mono font-semibold tracking-widest uppercase text-sm">
          <span className="text-[#9CDCFE]">Flow</span>
          <span className="text-[#4EC9B0]">board</span>
        </span>
        <span className="text-xs font-mono text-[#9CDCFE]/80 border border-[#9CDCFE]/25 bg-[#9CDCFE]/8 px-2 py-0.5 rounded">
          PROJECT [UNSAVED]
        </span>
        <span className="text-xs font-mono text-[#4EC9B0]/75 hidden sm:inline">[ AGENT ]</span>
        <span className="text-xs font-mono text-[#C586C0]/75 hidden sm:inline">[ INSPECTOR ]</span>
      </div>

      <div className="flex items-center gap-3">
        {userImage && (
          <Image
            src={userImage}
            alt={userName ?? "user"}
            width={24}
            height={24}
            className="rounded-full border border-[#4EC9B0]/40"
          />
        )}
        <span className="text-xs font-mono text-[#9CDCFE]/80 hidden sm:inline">
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
            className="border border-[#C586C0]/35 bg-[#C586C0]/10 hover:bg-[#C586C0]/18 text-white px-3 py-1 rounded transition-colors font-mono text-xs tracking-wide"
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  )
}

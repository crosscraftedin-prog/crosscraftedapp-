"use client";

import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";

/**
 * Shows the current user's avatar + name + FP balance, or a "Sign In" button.
 * Used in both the desktop and mobile headers.
 */
export default function HeaderUserSection({ mobile = false }: { mobile?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <div className="w-6 h-6 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return (
      <a
        href="/auth/signin"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all ${
          mobile ? "px-2.5" : ""
        }`}
      >
        <LogIn size={14} />
        {!mobile && <span>Sign In</span>}
      </a>
    );
  }

  const user = session.user as any;
  const initials = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F39B9B] to-[#9786E3] flex items-center justify-center text-[10px] font-bold text-slate-950">
        {initials}
      </div>
      {!mobile && (
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-bold text-white truncate max-w-[80px]">
            {user.name || user.email?.split("@")[0]}
          </span>
          <span className="text-[9px] text-[#F59E0B] font-bold">{user.totalPoints || 0} FP</span>
        </div>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="p-1 rounded-lg hover:bg-white/5 transition-colors"
        title="Sign out"
      >
        <LogOut size={12} className="text-[#64748B]" />
      </button>
    </div>
  );
}

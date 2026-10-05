"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, User, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
  );

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Successful sign-in will redirect to /auth/callback, then back to /.
  };

  return (
    <div className="min-h-screen bg-[#12101A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F39B9B] mb-4">
            <span className="text-slate-950 font-black text-2xl">+</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">crosscrafted</h1>
          <p className="text-sm text-[#A09DB1] mt-1">Sign in to track your Faith Points</p>
        </div>

        <div className="bg-[#1C1929] border border-white/[0.08] rounded-3xl p-6 space-y-4">
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-[#EF4444] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#EF4444] leading-relaxed">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="bg-[#38BDF8]/8 border border-[#38BDF8]/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={11} className="text-[#38BDF8]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">Faith Points</p>
            </div>
            <p className="text-[11px] text-[#A09DB1] leading-relaxed">
              Sign in with Google to earn and track Faith Points securely. Your points
              are stored server-side — no more localStorage farming!
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full mt-4 py-2 text-xs text-[#64748B] hover:text-white transition-colors"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#12101A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-white animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

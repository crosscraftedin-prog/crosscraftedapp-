"use client";

/**
 * App providers wrapper.
 *
 * Previously wrapped the app with next-auth's SessionProvider.
 * After the migration to Supabase Auth, no global provider is needed —
 * Supabase auth state is read on-demand via the @supabase/ssr cookies.
 *
 * Kept as a thin pass-through so the layout.tsx wrapping doesn't break.
 * Add any future client-side providers (themes, toasts) here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile info from our Prisma DB:
 *   { id, email, name, image, role, totalPoints }
 *
 * Returns 401 if not authenticated. Used by the `useSupabaseUser` client hook
 * to learn the user's role (admin/user) and Faith Points balance.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    totalPoints: user.totalPoints,
  });
}

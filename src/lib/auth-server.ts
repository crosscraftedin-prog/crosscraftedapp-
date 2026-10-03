import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

// Create PrismaClient directly to avoid Turbopack module issues
const db = new PrismaClient();

/**
 * Get the authenticated user from the server side.
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user as {
    id: string;
    email: string;
    name?: string | null;
    totalPoints: number;
    role: string;
  };
}

/**
 * Get the authenticated user's full DB record.
 * Use this when you need the freshest totalPoints.
 */
export async function getAuthUserFromDB() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      totalPoints: true,
    },
  });
}

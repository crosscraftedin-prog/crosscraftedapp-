import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * GET /api/trivia/gifts
 *
 * Returns all active gifts + whether the authenticated user has claimed each.
 * Merges default gifts from DB with the milestone reward system.
 */
export async function GET() {
  try {
    const user = await getAuthUser();

    const gifts = await db.gift.findMany({
      where: { isActive: true },
      orderBy: { pointsRequired: "asc" },
    });

    // Get user's redemptions if logged in
    let claimedGiftIds: Set<string> = new Set();
    if (user) {
      const redemptions = await db.giftRedemption.findMany({
        where: { userId: user.id },
        select: { giftId: true },
      });
      claimedGiftIds = new Set(redemptions.map((r) => r.giftId));
    }

    return NextResponse.json({
      gifts: gifts.map((g) => ({
        id: g.giftId,
        title: g.title,
        description: g.description,
        imageUrl: g.imageUrl,
        pointsRequired: g.pointsRequired,
        tier: g.tier,
        stock: g.stock,
        claimed: claimedGiftIds.has(g.giftId),
      })),
      userPoints: user?.totalPoints || 0,
      isAuthenticated: !!user,
    });
  } catch (error: any) {
    console.error("[trivia/gifts] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { claimGift } from "@/lib/trivia-server";

/**
 * POST /api/trivia/claim-gift
 *
 * Body: { giftId }
 *
 * Server:
 * 1. Validates user is authenticated
 * 2. Checks totalPoints >= gift.pointsRequired (from DB, not client)
 * 3. Checks no existing redemption (unique constraint)
 * 4. Deducts points atomically (transaction)
 * 5. Creates redemption record (persists in DB)
 *
 * Race-condition safe: @@unique([userId, giftId]) prevents double-claim.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { giftId } = body;

    if (!giftId || typeof giftId !== "string") {
      return NextResponse.json({ error: "Missing giftId" }, { status: 400 });
    }

    const result = await claimGift(user.id, giftId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[trivia/claim-gift] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to claim gift" },
      { status: 400 }
    );
  }
}

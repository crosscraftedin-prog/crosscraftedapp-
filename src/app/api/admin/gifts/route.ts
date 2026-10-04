import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const db = new PrismaClient();

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return null;
  return session.user.id;
}

export async function GET() {
  try {
    const gifts = await db.gift.findMany({
      where: { isActive: true },
      orderBy: { pointsRequired: "asc" },
    });
    return NextResponse.json({
      gifts: gifts.map((g) => ({
        id: g.giftId,
        title: g.title,
        description: g.description,
        imageUrl: g.imageUrl,
        pointsRequired: g.pointsRequired,
        tier: g.tier,
        stock: g.stock,
        isAdmin: !["g1", "g2", "g3", "g4", "g5", "g6"].includes(g.giftId),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const { title, description, imageUrl, pointsRequired, tier, stock } = body;

    if (!title || !pointsRequired || !imageUrl) {
      return NextResponse.json({ error: "Title, pointsRequired, and imageUrl are required" }, { status: 400 });
    }

    const giftId = `g_admin_${Date.now()}`;
    const gift = await db.gift.create({
      data: {
        giftId, title, description: description || "", imageUrl,
        pointsRequired: Number(pointsRequired), tier: tier || "bronze",
        stock: Number(stock) || 0, isActive: true,
      },
    });

    return NextResponse.json({ success: true, gift: { id: gift.giftId, title: gift.title } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const { giftId, ...updates } = body;
    if (!giftId) return NextResponse.json({ error: "giftId required" }, { status: 400 });

    const gift = await db.gift.findFirst({ where: { giftId } });
    if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.imageUrl !== undefined) data.imageUrl = updates.imageUrl;
    if (updates.pointsRequired !== undefined) data.pointsRequired = Number(updates.pointsRequired);
    if (updates.tier !== undefined) data.tier = updates.tier;
    if (updates.stock !== undefined) data.stock = Number(updates.stock);

    await db.gift.update({ where: { id: gift.id }, data });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const { giftId } = body;
    if (!giftId) return NextResponse.json({ error: "giftId required" }, { status: 400 });

    const gift = await db.gift.findFirst({ where: { giftId } });
    if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

    await db.gift.update({ where: { id: gift.id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

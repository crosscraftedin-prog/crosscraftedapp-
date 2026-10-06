import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-server";

const db = new PrismaClient();

/**
 * POST /api/profile/setup
 *
 * Saves the user's onboarding profile (step 1 + step 2 + step 3).
 * Server-authoritative — the userId is read from the auth session, NOT
 * from the request body. All fields are validated server-side.
 *
 * Body (all fields optional except where marked):
 *   step: "profile" | "faith" | "whatsapp" | "complete"
 *   username: string (required for step="profile")
 *   dateOfBirth: string (ISO date, required for step="profile")
 *   gender: "male" | "female" | "prefer_not_to_say" (optional)
 *   state: string (required for step="profile")
 *   city: string (required for step="profile")
 *   mobileNumber: string (optional)
 *   faithStatus: "follows_jesus" | "exploring" | "new_to_christianity" | "prefer_not_to_say"
 *   faithJourney: "growing" | "new_to_jesus" | "exploring_christianity" | "looking_for_church" | "learn_and_connect"
 *   whatsappChannelClicked: boolean (optional — true when user taps the WhatsApp link)
 *
 * Returns: { success: true, profileCompleted: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const step = body.step as "profile" | "faith" | "whatsapp" | "complete";

    // Build update data based on which step is being saved.
    // This allows partial saves (e.g. user completes step 1 then exits —
    // their data is preserved, and they resume from step 2 on next login).
    const data: any = {};

    if (step === "profile" || step === "complete") {
      // Validate required fields
      const username = (body.username || "").trim();
      const dateOfBirth = body.dateOfBirth;
      const state = (body.state || "").trim();
      const city = (body.city || "").trim();

      if (!username || username.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
      }
      if (!dateOfBirth) {
        return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
      }
      if (!state) {
        return NextResponse.json({ error: "State is required" }, { status: 400 });
      }
      if (!city) {
        return NextResponse.json({ error: "City is required" }, { status: 400 });
      }

      // Check username uniqueness (server-side + DB-level)
      const existing = await db.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" }, NOT: { id: user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }

      data.username = username;
      data.dateOfBirth = new Date(dateOfBirth);
      data.state = state;
      data.city = city;

      // Optional fields
      if (body.gender) {
        const validGenders = ["male", "female", "prefer_not_to_say"];
        if (!validGenders.includes(body.gender)) {
          return NextResponse.json({ error: "Invalid gender value" }, { status: 400 });
        }
        data.gender = body.gender;
      }
      if (body.mobileNumber) {
        // Strip non-numeric chars, store digits only
        data.mobileNumber = String(body.mobileNumber).replace(/[^0-9+]/g, "");
      }
    }

    if (step === "faith" || step === "complete") {
      if (body.faithStatus) {
        const validStatuses = ["follows_jesus", "exploring", "new_to_christianity", "prefer_not_to_say"];
        if (!validStatuses.includes(body.faithStatus)) {
          return NextResponse.json({ error: "Invalid faith status" }, { status: 400 });
        }
        data.faithStatus = body.faithStatus;
      }
      if (body.faithJourney) {
        const validJourneys = ["growing", "new_to_jesus", "exploring_christianity", "looking_for_church", "learn_and_connect"];
        if (!validJourneys.includes(body.faithJourney)) {
          return NextResponse.json({ error: "Invalid faith journey" }, { status: 400 });
        }
        data.faithJourney = body.faithJourney;
      }
    }

    if (step === "whatsapp" || step === "complete") {
      // Track that the prompt was shown (user reached this step)
      data.whatsappChannelPromptShown = true;
      // Track click — but do NOT claim the user "joined" the channel
      if (body.whatsappChannelClicked === true) {
        data.whatsappChannelClicked = true;
      }
    }

    // Mark profile as complete when the final step is saved
    if (step === "complete") {
      data.profileCompleted = true;
    }

    // Always update name if provided (from Google display name suggestion)
    if (body.name) {
      data.name = String(body.name).trim().slice(0, 100);
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        username: true,
        profileCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      profileCompleted: updated.profileCompleted,
    });
  } catch (error: any) {
    console.error("[profile/setup] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save profile" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/setup
 *
 * Returns the current user's profile completion status + any partially-saved
 * onboarding data (so the user can resume from where they left off).
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const full = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        username: true,
        dateOfBirth: true,
        gender: true,
        state: true,
        city: true,
        mobileNumber: true,
        mobileVerified: true,
        faithStatus: true,
        faithJourney: true,
        profileCompleted: true,
        whatsappChannelPromptShown: true,
        whatsappChannelClicked: true,
        signupMethod: true,
      },
    });

    if (!full) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: full });
  } catch (error: any) {
    console.error("[profile/setup] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load profile" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { selectQuizQuestions } from "@/lib/trivia-server";

/**
 * POST /api/trivia/start
 *
 * Returns questions for a quiz, prioritizing UNSCORED questions.
 *
 * Body: { difficulty, category, count, mode }
 * mode: "EARN_POINTS" | "PRACTICE"
 *
 * Response: { questions, newCount, totalCount, allNew }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { difficulty, category, count = 10, mode = "EARN_POINTS" } = body;

    // Validate
    if (!difficulty || !category) {
      return NextResponse.json({ error: "Missing difficulty or category" }, { status: 400 });
    }

    if (!["beginners", "intermediate", "skilled", "expert"].includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }

    if (!["full_bible", "new_testament", "old_testament", "apologetics", "life_faith", "jesus"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!["EARN_POINTS", "PRACTICE"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const user = await getAuthUser();

    // EARN_POINTS mode requires authentication
    if (mode === "EARN_POINTS" && !user) {
      return NextResponse.json({ error: "Authentication required for Earn Points mode" }, { status: 401 });
    }

    const result = await selectQuizQuestions(
      user?.id || null,
      difficulty,
      category,
      Math.min(Math.max(1, count), 15),
      mode
    );

    // Return questions WITHOUT correct answers (client doesn't know which is right)
    const questions = result.questions.map((q) => ({
      id: q.questionId,
      question: q.question,
      options: JSON.parse(q.options),
      difficulty: q.difficulty,
      category: q.category,
      basePoints: q.basePoints,
      scriptureReference: q.scriptureReference,
    }));

    return NextResponse.json({
      questions,
      newCount: result.newCount,
      totalCount: result.totalCount,
      allNew: result.allNew,
      mode,
    });
  } catch (error: any) {
    console.error("[trivia/start] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to start quiz" }, { status: 500 });
  }
}

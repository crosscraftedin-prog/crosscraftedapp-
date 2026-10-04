import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { submitQuiz } from "@/lib/trivia-server";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * POST /api/trivia/submit
 *
 * Receives: { difficulty, category, mode, answers: [{ questionId, selectedAnswer }] }
 *
 * Server independently:
 * 1. Validates the user is authenticated
 * 2. Validates all question IDs exist in DB
 * 3. Checks which questions the user has already scored
 * 4. Verifies correct answers from DB (NOT from client)
 * 5. Calculates points: only NEW correct answers earn FP
 * 6. Creates attempt records (unique constraint = race-condition safe)
 * 7. Updates totalPoints atomically
 * 8. Creates transaction history
 *
 * The client NEVER tells the server how many points were earned.
 * The server calculates everything.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { difficulty, category, mode, answers } = body;

    // Validate input
    if (!difficulty || !category || !mode || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["EARN_POINTS", "PRACTICE"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (answers.length === 0 || answers.length > 15) {
      return NextResponse.json({ error: "Invalid number of answers" }, { status: 400 });
    }

    // Verify all questionIds are valid and belong to the right difficulty/category
    const questionIds = answers.map((a: any) => a.questionId);
    const dbQuestions = await db.triviaQuestion.findMany({
      where: { questionId: { in: questionIds } },
    });

    if (dbQuestions.length !== questionIds.length) {
      return NextResponse.json({ error: "Some question IDs are invalid" }, { status: 400 });
    }

    // Verify difficulty/category match the questions
    const mismatch = dbQuestions.some(
      (q) => q.difficulty !== difficulty || q.category !== category
    );
    if (mismatch) {
      return NextResponse.json({ error: "Question difficulty/category mismatch" }, { status: 400 });
    }

    // Submit to server-side scoring logic
    const result = await submitQuiz(user.id, {
      difficulty,
      category,
      mode,
      answers: answers.map((a: any) => ({
        questionId: a.questionId,
        selectedAnswer: Number(a.selectedAnswer),
      })),
    });

    // Include explanations + correct answers for the result screen
    const enrichedResults = result.questionResults.map((qr: any) => {
      const q = dbQuestions.find((q) => q.questionId === qr.questionId)!;
      return {
        ...qr,
        question: q.question,
        options: JSON.parse(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        scriptureReference: q.scriptureReference,
      };
    });

    return NextResponse.json({
      ...result,
      questionResults: enrichedResults,
    });
  } catch (error: any) {
    console.error("[trivia/submit] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit quiz" }, { status: 500 });
  }
}

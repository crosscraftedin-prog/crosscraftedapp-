import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-server";

const db = new PrismaClient();

/**
 * POST /api/trivia/competitions/[id]/submit
 *
 * Submits answers for a competition quiz. SERVER-AUTHORITATIVE scoring:
 * - userId from auth session (not body)
 * - correct answers validated server-side (client never sees them before submitting)
 * - score calculated server-side
 * - attempt limit enforced via DB count
 *
 * Body: { answers: [{ questionId, selectedAnswer }] }
 * Returns: { score, correctCount, totalQuestions, accuracy, rank }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: competitionId } = await params;
    const body = await req.json();
    const answers: { questionId: string; selectedAnswer: number }[] = body.answers || [];

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "No answers provided" }, { status: 400 });
    }

    // ─── 1. Validate competition exists + is live ───
    const competition = await db.triviaCompetition.findUnique({
      where: { id: competitionId },
    });
    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const now = new Date();
    const isLive = competition.status === "live" && now >= competition.startAt && now < competition.endAt;
    if (!isLive) {
      return NextResponse.json({ error: "Competition is not live or has ended" }, { status: 403 });
    }

    // ─── 2. Enforce attempt limit (server-side) ───
    const attemptCount = await db.triviaCompetitionAttempt.count({
      where: { competitionId, userId: user.id },
    });
    if (attemptCount >= competition.attemptLimit) {
      return NextResponse.json(
        { error: `Attempt limit reached (${competition.attemptLimit} attempt${competition.attemptLimit === 1 ? "" : "s"} allowed)` },
        { status: 403 }
      );
    }

    // ─── 3. Fetch the actual questions (server-side) to validate answers ───
    // The answers must match the questions that were served to this user.
    // For simplicity, we validate each answer against the TriviaQuestion record.
    const questionIds = answers.map((a) => a.questionId);
    const questions = await db.triviaQuestion.findMany({
      where: { questionId: { in: questionIds } },
    });

    // ─── 4. Calculate score server-side ───
    let correctCount = 0;
    let totalPoints = 0;
    const startTime = body.startTime ? new Date(body.startTime) : now;
    const durationMs = Math.max(0, now.getTime() - startTime.getTime());

    for (const answer of answers) {
      const question = questions.find((q) => q.questionId === answer.questionId);
      if (!question) continue;
      if (answer.selectedAnswer === question.correctAnswer) {
        correctCount++;
        totalPoints += question.basePoints;
      }
    }

    const accuracy = answers.length > 0 ? correctCount / answers.length : 0;

    // ─── 5. Create the attempt record (transaction-safe) ───
    const attempt = await db.triviaCompetitionAttempt.create({
      data: {
        competitionId,
        userId: user.id,
        questionIds: JSON.stringify(questionIds),
        score: totalPoints,
        correctCount,
        totalQuestions: answers.length,
        accuracy,
        durationMs,
      },
    });

    // ─── 6. Also award Faith Points (lifetime FP) for correct answers ───
    // Anti-farming: check if the user has already earned FP for each question
    // (via TriviaQuestionAttempt @@unique([userId, questionId]))
    let fpAwarded = 0;
    for (const answer of answers) {
      const question = questions.find((q) => q.questionId === answer.questionId);
      if (!question) continue;
      if (answer.selectedAnswer === question.correctAnswer) {
        // Check if already earned FP for this question
        const existing = await db.triviaQuestionAttempt.findUnique({
          where: {
            userId_questionId: { userId: user.id, questionId: question.questionId },
          },
        });
        if (!existing) {
          // Award FP + create attempt record + transaction (transaction-safe)
          await db.$transaction([
            db.triviaQuestionAttempt.create({
              data: {
                userId: user.id,
                questionId: question.questionId,
                quizSessionId: null,
                pointsAwarded: question.basePoints,
                answeredCorrectly: true,
              },
            }),
            db.triviaPointTransaction.create({
              data: {
                userId: user.id,
                questionId: question.questionId,
                points: question.basePoints,
                reason: `COMPETITION_${competition.type.toUpperCase()}_${question.difficulty.toUpperCase()}`,
              },
            }),
            db.user.update({
              where: { id: user.id },
              data: { totalPoints: { increment: question.basePoints } },
            }),
          ]);
          fpAwarded += question.basePoints;
        }
      }
    }

    // ─── 7. Calculate the user's rank ───
    const higherScorers = await db.triviaCompetitionAttempt.findMany({
      where: { competitionId, score: { gt: totalPoints } },
      distinct: ["userId"],
    });
    const rank = higherScorers.length + 1;

    return NextResponse.json({
      attemptId: attempt.id,
      score: totalPoints,
      correctCount,
      totalQuestions: answers.length,
      accuracy,
      durationMs,
      rank,
      fpAwarded,
      competitionScore: totalPoints, // explicitly named — this is NOT lifetime FP
    });
  } catch (error: any) {
    console.error("[trivia/competitions/submit] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to submit" }, { status: 500 });
  }
}

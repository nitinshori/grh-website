import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trainingAttempts } from "@/lib/db/schema";
import { getModuleBySlug } from "@/data/training-modules";
import { scoreAttempt } from "@/data/training-modules/types";

// ── POST /api/training/[slug]/attempt ────────────────────────────
//
// Body:
//   { answers: Record<questionId, optionId[]> }
//
// Authenticated; only pharmacists / pharmacy_admins can submit attempts.
// Inserts a training_attempts row and returns the scored result.

interface AttemptBody {
  answers?: Record<string, string[] | string>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Only pharmacy roles take training; clients and super_admin don't.
  if (session.user.role === "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body.answers !== "object" || body.answers === null) {
    return NextResponse.json(
      { error: "Body must include `answers` object keyed by question id." },
      { status: 400 },
    );
  }

  // Normalise: every answer becomes an array of option ids, even
  // single-choice. This matches the scoring contract.
  const normalised: Record<string, string[]> = {};
  for (const q of module.quiz) {
    const raw = body.answers[q.id];
    if (raw == null) {
      normalised[q.id] = [];
    } else if (typeof raw === "string") {
      normalised[q.id] = [raw];
    } else if (Array.isArray(raw)) {
      normalised[q.id] = raw.filter((v): v is string => typeof v === "string");
    } else {
      normalised[q.id] = [];
    }
  }

  const result = scoreAttempt(module, normalised);

  // Persist. We never block a save on missing pharmacy_id; some users
  // (e.g. fresh super_admins testing) won't have one.
  const [row] = await db
    .insert(trainingAttempts)
    .values({
      userId: session.user.id,
      pharmacyId: session.user.pharmacyId ?? null,
      moduleSlug: module.slug,
      moduleVersion: module.version,
      correctCount: result.correct,
      totalCount: result.total,
      scoreFraction: result.fraction.toFixed(4),
      passed: result.passed,
      failedCriticalQuestionIds: result.failedCriticals.length
        ? result.failedCriticals
        : null,
      answers: normalised,
    })
    .returning({ id: trainingAttempts.id, attemptedAt: trainingAttempts.attemptedAt });

  // For the results screen we send back per-question correctness so the
  // pharmacist sees what they got wrong AND the explanation. This is
  // pedagogically important — the quiz is teaching, not just gatekeeping.
  const review = module.quiz.map((q) => {
    const submitted = (normalised[q.id] ?? []).slice().sort();
    const expected = q.correctOptionIds.slice().sort();
    const isCorrect =
      submitted.length === expected.length &&
      submitted.every((id, i) => id === expected[i]);
    return {
      questionId: q.id,
      question: q.question,
      correct: isCorrect,
      submitted,
      expected,
      explanation: q.explanation,
      critical: !!q.critical,
    };
  });

  return NextResponse.json({
    attemptId: row?.id,
    attemptedAt: row?.attemptedAt,
    correct: result.correct,
    total: result.total,
    fraction: result.fraction,
    passMark: module.passMark,
    passed: result.passed,
    failedCriticals: result.failedCriticals,
    review,
  });
}

// Training module types.
//
// One module = one PGD's CPD-style training. Each module has a stack of
// slides (read-through content) followed by a quiz. Pharmacist must pass
// the quiz (default 80%) to be marked competent on that PGD.
//
// Modules are versioned. When `materialClinicalChange` is true on a new
// version, completions from previous versions are invalidated and the
// pharmacist must re-take. Cosmetic updates (typos, formatting) leave
// completions intact.

export type SlideType =
  | "intro"          // welcome + learning objectives
  | "content"        // prose + headings
  | "callout"        // highlighted critical info (red flag, contraindication, etc.)
  | "comparison"     // side-by-side cards (drug A vs drug B)
  | "checklist"      // bulleted list of items
  | "case"           // clinical scenario with reveal
  | "summary";       // key takeaways before the quiz

export type CalloutTone = "warning" | "danger" | "info" | "success";

export interface BaseSlide {
  id: string;
  type: SlideType;
  title: string;
}

export interface IntroSlide extends BaseSlide {
  type: "intro";
  subtitle?: string;
  objectives: string[];          // "By the end of this module you will…"
  estimatedMinutes: number;
}

export interface ContentSlide extends BaseSlide {
  type: "content";
  body: string[];                // each entry = one paragraph
  highlights?: string[];         // bullets shown alongside the prose
}

export interface CalloutSlide extends BaseSlide {
  type: "callout";
  tone: CalloutTone;
  message: string;
  detail?: string[];
}

export interface ComparisonSlide extends BaseSlide {
  type: "comparison";
  intro?: string;
  columns: {
    label: string;
    rows: { heading: string; body: string }[];
  }[];
}

export interface ChecklistSlide extends BaseSlide {
  type: "checklist";
  intro?: string;
  items: { label: string; detail?: string }[];
}

export interface CaseSlide extends BaseSlide {
  type: "case";
  scenario: string;
  question: string;
  answer: string;
  rationale?: string;
}

export interface SummarySlide extends BaseSlide {
  type: "summary";
  keyPoints: string[];
}

export type Slide =
  | IntroSlide
  | ContentSlide
  | CalloutSlide
  | ComparisonSlide
  | ChecklistSlide
  | CaseSlide
  | SummarySlide;

// ── Quiz ──────────────────────────────────────────────────────────

export type QuestionType =
  | "single-choice"   // exactly one correct answer
  | "multi-choice"    // one or more correct answers
  | "true-false";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: { id: string; label: string }[];
  correctOptionIds: string[];   // for single-choice, length 1
  /**
   * Critical questions — if pass mark is "critical-aware", missing any one
   * of these fails the module regardless of overall score. Use sparingly,
   * for genuine safety questions (drug interactions, red flags).
   */
  critical?: boolean;
  explanation: string;          // shown after the quiz on results screen
}

// ── Module ────────────────────────────────────────────────────────

export interface TrainingModule {
  /**
   * Slug aligning with the PGD slug where possible (e.g. "ed" for the
   * Erectile Dysfunction PGD). Used in URL: /dashboard/training/[slug].
   */
  slug: string;

  /** Display title — keep concise. */
  title: string;

  /** One-line description for the modules-list page. */
  description: string;

  /**
   * PGD slug(s) this module qualifies the pharmacist to deliver. Usually
   * exactly one, but some umbrella modules (e.g. "travel-core") cover
   * multiple specific PGDs.
   */
  pgdSlugs: string[];

  /** Author / reviewer for the on-screen footer credit. */
  authoredBy: string;
  reviewedBy?: string;

  /**
   * Semver-style version. Bump the patch for typos, minor for new slides,
   * major for material clinical changes.
   */
  version: string;

  /**
   * Mark `true` when the new version contains clinical changes that
   * invalidate prior completions. The completion API checks this against
   * the pharmacist's last-passed version.
   */
  materialClinicalChange: boolean;

  /** ISO date — when this version was published. */
  publishedAt: string;

  estimatedMinutes: number;

  slides: Slide[];
  quiz: QuizQuestion[];

  /** Pass mark, expressed as a fraction. 0.8 = 80%. */
  passMark: number;
}

// ── Helpers ───────────────────────────────────────────────────────

/** Total possible quiz score (1 point per question, by default). */
export function totalQuizPoints(module: TrainingModule): number {
  return module.quiz.length;
}

/**
 * Score an attempt. Returns the raw correct count, fraction, and pass/fail.
 *
 * @param answers   keyed by question id → array of selected option ids
 *                  (single-element array for single-choice/true-false)
 */
export function scoreAttempt(
  module: TrainingModule,
  answers: Record<string, string[]>,
): { correct: number; total: number; fraction: number; passed: boolean; failedCriticals: string[] } {
  let correct = 0;
  const failedCriticals: string[] = [];

  for (const q of module.quiz) {
    const submitted = (answers[q.id] ?? []).slice().sort();
    const expected = q.correctOptionIds.slice().sort();
    const isCorrect =
      submitted.length === expected.length &&
      submitted.every((id, i) => id === expected[i]);
    if (isCorrect) correct += 1;
    else if (q.critical) failedCriticals.push(q.id);
  }

  const total = module.quiz.length;
  const fraction = total === 0 ? 0 : correct / total;
  const passed = fraction >= module.passMark && failedCriticals.length === 0;

  return { correct, total, fraction, passed, failedCriticals };
}

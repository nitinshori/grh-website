"use client";

import { useState } from "react";
import type {
  TrainingModule,
  Slide,
  CalloutSlide,
  ComparisonSlide,
  ChecklistSlide,
  CaseSlide,
  ContentSlide,
  IntroSlide,
  SummarySlide,
} from "@/data/training-modules/types";

type Phase = "slides" | "quiz" | "results";

interface AttemptResult {
  correct: number;
  total: number;
  fraction: number;
  passMark: number;
  passed: boolean;
  failedCriticals: string[];
  review: {
    questionId: string;
    question: string;
    correct: boolean;
    submitted: string[];
    expected: string[];
    explanation: string;
    critical: boolean;
  }[];
}

export function ModulePlayer({ module }: { module: TrainingModule }) {
  const [phase, setPhase] = useState<Phase>("slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slide = module.slides[slideIndex];
  const isLastSlide = slideIndex === module.slides.length - 1;
  const progress =
    phase === "slides"
      ? ((slideIndex + 1) / module.slides.length) * 100
      : phase === "quiz"
        ? 100
        : 100;

  const allQuestionsAnswered = module.quiz.every(
    (q) => (answers[q.id]?.length ?? 0) > 0,
  );

  function setAnswer(questionId: string, type: string, optionId: string) {
    setAnswers((prev) => {
      if (type === "multi-choice") {
        const current = prev[questionId] ?? [];
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      }
      // single-choice / true-false
      return { ...prev, [questionId]: [optionId] };
    });
  }

  async function submitQuiz() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/training/${module.slug}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = (await res.json()) as AttemptResult | { error?: string };
      if (!res.ok) throw new Error((body as { error?: string }).error || `${res.status}`);
      setResult(body as AttemptResult);
      setPhase("results");
      // Scroll to top of player when phase changes
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function retakeQuiz() {
    setAnswers({});
    setResult(null);
    setPhase("quiz");
  }

  function restartModule() {
    setAnswers({});
    setResult(null);
    setSlideIndex(0);
    setPhase("slides");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-navy-950 text-white p-5 sm:p-6">
        <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1">
          Training module · v{module.version}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">{module.title}</h1>
        <p className="text-sm text-blue-200 mt-1">{module.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-blue-300">
          <span>{module.estimatedMinutes} min</span>
          <span>·</span>
          <span>{module.quiz.length}-question quiz</span>
          <span>·</span>
          <span>{Math.round(module.passMark * 100)}% to pass</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-100 h-1.5">
        <div
          className="bg-teal-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Body */}
      <div className="p-5 sm:p-8">
        {phase === "slides" && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Slide {slideIndex + 1} of {module.slides.length}
            </p>
            <SlideRenderer slide={slide} />

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                disabled={slideIndex === 0}
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 text-sm font-semibold text-gray-700 disabled:text-gray-300 hover:text-navy-900 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              {!isLastSlide ? (
                <button
                  type="button"
                  onClick={() => setSlideIndex((i) => Math.min(module.slides.length - 1, i + 1))}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPhase("quiz");
                    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Start quiz →
                </button>
              )}
            </div>
          </>
        )}

        {phase === "quiz" && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Quiz · {module.quiz.length} questions · {Math.round(module.passMark * 100)}% to pass
            </p>
            <h2 className="text-xl font-bold text-navy-900 mb-2">
              Answer all {module.quiz.length} questions
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              You can change your answers until you submit. Some questions are flagged{" "}
              <span className="font-semibold text-red-600">critical</span> — missing one
              fails the attempt regardless of overall score.
            </p>

            <div className="space-y-6">
              {module.quiz.map((q, idx) => (
                <fieldset
                  key={q.id}
                  className={`border rounded-xl p-5 ${q.critical ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}
                >
                  <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Question {idx + 1}
                    {q.critical && (
                      <span className="ml-2 text-red-600 normal-case">Critical</span>
                    )}
                  </legend>
                  <p className="text-base font-semibold text-navy-900 mb-4 leading-snug">
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const selected = (answers[q.id] ?? []).includes(opt.id);
                      const isMulti = q.type === "multi-choice";
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "border-teal-500 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <input
                            type={isMulti ? "checkbox" : "radio"}
                            name={q.id}
                            value={opt.id}
                            checked={selected}
                            onChange={() => setAnswer(q.id, q.type, opt.id)}
                            className="mt-0.5 accent-teal-500"
                          />
                          <span className="text-sm text-gray-800 leading-relaxed">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            {error && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setPhase("slides");
                  setSlideIndex(module.slides.length - 1);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-navy-900"
              >
                ← Back to slides
              </button>
              <button
                type="button"
                onClick={submitQuiz}
                disabled={!allQuestionsAnswered || submitting}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {submitting ? "Submitting…" : "Submit quiz"}
              </button>
            </div>
            {!allQuestionsAnswered && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                Answer all {module.quiz.length} questions to submit.
              </p>
            )}
          </>
        )}

        {phase === "results" && result && (
          <ResultsPanel
            module={module}
            result={result}
            onRetake={retakeQuiz}
            onRestart={restartModule}
          />
        )}
      </div>

      {/* Footer credit */}
      <div className="bg-gray-50 border-t border-gray-100 px-5 sm:px-6 py-3 text-xs text-gray-500">
        Authored by {module.authoredBy}
        {module.reviewedBy && ` · Reviewed by ${module.reviewedBy}`}
        {" · "}Version {module.version} · Published {module.publishedAt}
      </div>
    </div>
  );
}

// ── Slide renderers ───────────────────────────────────────────────

function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case "intro":
      return <IntroSlideView slide={slide} />;
    case "content":
      return <ContentSlideView slide={slide} />;
    case "callout":
      return <CalloutSlideView slide={slide} />;
    case "comparison":
      return <ComparisonSlideView slide={slide} />;
    case "checklist":
      return <ChecklistSlideView slide={slide} />;
    case "case":
      return <CaseSlideView slide={slide} />;
    case "summary":
      return <SummarySlideView slide={slide} />;
  }
}

function IntroSlideView({ slide }: { slide: IntroSlide }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">{slide.title}</h2>
      {slide.subtitle && <p className="text-lg text-gray-500 mb-6">{slide.subtitle}</p>}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-teal-800 mb-3">
          By the end of this module you will be able to:
        </p>
        <ul className="space-y-2 list-disc list-outside ml-5 text-sm text-gray-800 leading-relaxed">
          {slide.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
        <p className="text-xs text-teal-700 mt-4">
          Estimated time: {slide.estimatedMinutes} minutes.
        </p>
      </div>
    </div>
  );
}

function ContentSlideView({ slide }: { slide: ContentSlide }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-900 mb-4">{slide.title}</h2>
      <div className="prose prose-sm max-w-none">
        {slide.body.map((p, i) => (
          <p key={i} className="text-gray-700 leading-relaxed mb-4">
            {p}
          </p>
        ))}
      </div>
      {slide.highlights && slide.highlights.length > 0 && (
        <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Key points
          </p>
          <ul className="space-y-1.5 text-sm text-gray-800 list-disc list-outside ml-5">
            {slide.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CalloutSlideView({ slide }: { slide: CalloutSlide }) {
  const tones = {
    warning: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", icon: "⚠️" },
    danger: { bg: "bg-red-50", border: "border-red-300", text: "text-red-900", icon: "⛔" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "ℹ️" },
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", icon: "✓" },
  } as const;
  const t = tones[slide.tone];
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-900 mb-4">{slide.title}</h2>
      <div className={`border-2 rounded-xl p-5 ${t.bg} ${t.border}`}>
        <p className={`text-base font-bold leading-snug ${t.text}`}>
          <span className="mr-2">{t.icon}</span>
          {slide.message}
        </p>
        {slide.detail && slide.detail.length > 0 && (
          <ul className={`mt-4 space-y-2 list-disc list-outside ml-6 text-sm leading-relaxed ${t.text}`}>
            {slide.detail.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ComparisonSlideView({ slide }: { slide: ComparisonSlide }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-900 mb-4">{slide.title}</h2>
      {slide.intro && <p className="text-gray-700 leading-relaxed mb-6">{slide.intro}</p>}
      <div className={`grid gap-4 ${slide.columns.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {slide.columns.map((col, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-navy-900 text-white px-4 py-2.5">
              <h3 className="font-bold text-sm">{col.label}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {col.rows.map((row, j) => (
                <div key={j} className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                    {row.heading}
                  </p>
                  <p className="text-sm text-gray-800 leading-snug">{row.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistSlideView({ slide }: { slide: ChecklistSlide }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-900 mb-4">{slide.title}</h2>
      {slide.intro && <p className="text-gray-700 leading-relaxed mb-5">{slide.intro}</p>}
      <ul className="space-y-3">
        {slide.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">{item.label}</p>
              {item.detail && <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{item.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseSlideView({ slide }: { slide: CaseSlide }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
        Clinical case
      </p>
      <h2 className="text-2xl font-bold text-navy-900 mb-4">{slide.title}</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">{slide.scenario}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-navy-900 mb-3">{slide.question}</p>
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Reveal answer
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
                Answer
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">{slide.answer}</p>
            </div>
            {slide.rationale && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Why
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{slide.rationale}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummarySlideView({ slide }: { slide: SummarySlide }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-900 mb-4">{slide.title}</h2>
      <div className="bg-navy-50 border border-navy-100 rounded-xl p-5">
        <ul className="space-y-2.5 list-disc list-outside ml-5 text-sm text-gray-800 leading-relaxed">
          {slide.keyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-gray-500 mt-5">
        Next: the quiz. Take your time — you can return to the slides if you want to review.
      </p>
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────

function ResultsPanel({
  module,
  result,
  onRetake,
  onRestart,
}: {
  module: TrainingModule;
  result: AttemptResult;
  onRetake: () => void;
  onRestart: () => void;
}) {
  const percent = Math.round(result.fraction * 100);
  const passMarkPercent = Math.round(result.passMark * 100);
  return (
    <div>
      <div
        className={`rounded-xl p-6 mb-6 text-center ${
          result.passed
            ? "bg-green-50 border-2 border-green-300"
            : "bg-red-50 border-2 border-red-300"
        }`}
      >
        <div
          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${
            result.passed ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {result.passed ? "✓" : "✕"}
        </div>
        <h2
          className={`text-2xl font-bold ${result.passed ? "text-green-900" : "text-red-900"}`}
        >
          {result.passed ? "Passed" : "Not passed"}
        </h2>
        <p className={`text-sm mt-1 ${result.passed ? "text-green-700" : "text-red-700"}`}>
          {result.correct} of {result.total} correct ({percent}%) · pass mark{" "}
          {passMarkPercent}%
        </p>
        {result.failedCriticals.length > 0 && (
          <p className="text-xs text-red-700 mt-3">
            {result.failedCriticals.length} critical question
            {result.failedCriticals.length === 1 ? "" : "s"} answered incorrectly.
          </p>
        )}
      </div>

      <h3 className="text-lg font-bold text-navy-900 mb-3">Review</h3>
      <div className="space-y-3">
        {result.review.map((r, i) => (
          <div
            key={r.questionId}
            className={`border rounded-xl p-4 ${
              r.correct ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  r.correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {r.correct ? "✓" : "✕"}
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Question {i + 1}
                  {r.critical && <span className="ml-2 text-red-600 normal-case">Critical</span>}
                </p>
                <p className="text-sm font-semibold text-navy-900 mb-2">{r.question}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{r.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
        {!result.passed ? (
          <>
            <button
              type="button"
              onClick={onRestart}
              className="px-5 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-navy-900 text-sm font-semibold rounded-lg transition-colors"
            >
              Review slides again
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Retake quiz
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Competency recorded as of {new Date().toLocaleDateString("en-GB")}. You're now
            authorised to use the {module.title} ePGD tool.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useConsultationTracking } from "../hooks/useConsultationTracking";

interface StepWrapperProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
  validationError: string | null;
  isBlocked?: boolean;
  children: React.ReactNode;
}

export function StepWrapper({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  canProceed,
  validationError,
  isBlocked = false,
  children,
}: StepWrapperProps) {
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);

  // Reset attempted state when the step changes (user successfully advanced)
  useEffect(() => {
    setHasAttemptedNext(false);
  }, [currentStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Extract pgdSlug from URL: /for-pharmacies/epgd/{slug}
  const pathname = usePathname();
  const pgdSlug = pathname.split("/").pop() || "";
  const { markComplete } = useConsultationTracking(pgdSlug, currentStep);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Back to Dashboard — hidden when printing */}
      {isFirstStep && (
        <div className="px-6 pt-4 print:hidden">
          <Link
            href="/for-pharmacies/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      )}

      {/* Step header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-navy-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Step content */}
      <div className="px-6 py-6">{children}</div>

      {/* Validation error — only shown after user has attempted to proceed */}
      {hasAttemptedNext && validationError && (
        <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={isFirstStep}
          className={`
            px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${
              isFirstStep
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-navy-900"
            }
          `}
        >
          &larr; Previous
        </button>

        <div className="flex items-center gap-3">
          {isBlocked && (
            <span className="text-xs text-red-500 font-medium">
              Cannot proceed — exclusion criteria met
            </span>
          )}
          {!isLastStep ? (
            <button
              onClick={() => {
                if (!canProceed || isBlocked) {
                  setHasAttemptedNext(true);
                } else {
                  onNext();
                }
              }}
              className={`
                px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors
                ${
                  canProceed && !isBlocked
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              Next &rarr;
            </button>
          ) : (
            <button
              onClick={() => {
                markComplete();
                window.print();
              }}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
            >
              Print Consultation Record
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOTAL_STEPS } from "../lib/ed-types";
import {
  useConsultationTracking,
  type ConsultationRecordData,
} from "../../shared/hooks/useConsultationTracking";

interface EDStepWrapperProps {
  title: string;
  description?: string;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
  validationError: string | null;
  isBlocked?: boolean; // hard stop: cannot proceed at all
  children: React.ReactNode;
  /** Return the consultation data to save. If omitted, no record is saved. */
  getConsultationData?: () => ConsultationRecordData | null;
  /** Called after a successful save+print or new-consultation reset */
  onNewConsultation?: () => void;
}

export function EDStepWrapper({
  title,
  description,
  currentStep,
  onNext,
  onPrev,
  canProceed,
  validationError,
  isBlocked = false,
  children,
  getConsultationData,
  onNewConsultation,
}: EDStepWrapperProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const pathname = usePathname();
  const pgdSlug = pathname?.split("/").pop() || "ed";
  const { markComplete, saveRecord, reset } = useConsultationTracking(pgdSlug, currentStep);

  useEffect(() => {
    setHasAttemptedNext(false);
  }, [currentStep]);

  // A saved consultation that goes back to the first step is a new patient.
  useEffect(() => {
    if (currentStep === 0 && saveStatus === "saved") {
      setSaveStatus("idle");
      reset();
    }
  }, [currentStep, saveStatus, reset]);

  const handleCompleteAndSave = useCallback(async () => {
    // Same rules as Next. Save & Print used to ignore validation and stops,
    // so a record could be saved with a nitrate ticked (adversarial review,
    // 11 Sep 2026).
    if (!canProceed || isBlocked || validationError) {
      setHasAttemptedNext(true);
      return;
    }
    markComplete();
    if (getConsultationData) {
      setSaveStatus("saving");
      const data = getConsultationData();
      if (data) {
        const success = await saveRecord(data);
        setSaveStatus(success ? "saved" : "error");
      } else {
        setSaveStatus("error");
      }
    }
    window.print();
  }, [markComplete, getConsultationData, saveRecord, canProceed, isBlocked, validationError]);

  // The document requires the advice given to an excluded patient to be
  // recorded. Any step with a stop can be saved as "not supplied", no print.
  const handleSaveNotSupplied = useCallback(async () => {
    if (!getConsultationData) return;
    setSaveStatus("saving");
    const data = getConsultationData();
    if (!data) {
      setSaveStatus("error");
      return;
    }
    data.outcome = "not_supplied";
    delete data.medicine;
    (data.clinicalData as Record<string, unknown>).stoppedAtStep = currentStep;
    (data.clinicalData as Record<string, unknown>).stopReason = validationError ?? "Exclusion criteria met";
    const success = await saveRecord(data);
    setSaveStatus(success ? "saved" : "error");
  }, [getConsultationData, saveRecord, currentStep, validationError]);

  const handleNewConsultation = useCallback(() => {
    if (window.confirm("Start a new consultation? The current consultation data will be cleared.")) {
      setSaveStatus("idle");
      reset();
      onNewConsultation?.();
    }
  }, [onNewConsultation, reset]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {isFirstStep && (
        <div className="mb-4 print:hidden">
          <Link
            href="/for-pharmacies/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
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

      {/* Validation error, shown once the pharmacist has tried to proceed */}
      {hasAttemptedNext && validationError && (
        <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Save status banner on final step, or after a not-supplied save */}
      {(isLastStep || isBlocked) && saveStatus !== "idle" && (
        <div
          className={`mx-6 mb-4 px-4 py-3 rounded-lg print:hidden ${
            saveStatus === "saving"
              ? "bg-blue-50 border border-blue-200"
              : saveStatus === "saved"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm ${
              saveStatus === "saving"
                ? "text-blue-700"
                : saveStatus === "saved"
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {saveStatus === "saving" && "Saving consultation record..."}
            {saveStatus === "saved" &&
              "Consultation record saved. You can access it from Patient Records on your dashboard."}
            {saveStatus === "error" &&
              "Could not save consultation record. Please print this page as a backup."}
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between print:hidden">
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
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          {isBlocked && (
            <span className="text-xs text-red-500 font-medium">
              Cannot proceed: exclusion criteria met
            </span>
          )}
          {isBlocked && getConsultationData && saveStatus !== "saved" && (
            <button
              onClick={handleSaveNotSupplied}
              disabled={saveStatus === "saving"}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
            >
              {saveStatus === "saving" ? "Saving..." : "Save as not supplied"}
            </button>
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
                    ? "bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              Next →
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {onNewConsultation && saveStatus === "saved" && (
                <button
                  onClick={handleNewConsultation}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-[color:var(--tenant-primary)] border border-[color:var(--tenant-primary)]/30 hover:bg-[color:var(--tenant-primary)]/10 transition-colors"
                >
                  New Consultation
                </button>
              )}
              <button
                onClick={handleCompleteAndSave}
                disabled={saveStatus === "saving"}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  saveStatus === "saving"
                    ? "bg-gray-300 text-gray-500 cursor-wait"
                    : "bg-navy-900 hover:bg-navy-950 text-white"
                }`}
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Print Again"
                  : "Save & Print Record"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hair Loss (Finasteride) Validation ───

import type { HLConsultationState } from "./hair-loss-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: HLConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, {
        minAge: 18,
        maxAge: 65,
        requireGender: true,
        genderConfirmed: state.patient.maleConfirmed,
      });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Assessment
      if (!state.clinicalAssessment.norwoodHamiltonScale) {
        return "Norwood-Hamilton Scale score is required";
      }
      if (!state.clinicalAssessment.hasAndrogeneticAlopecia) {
        return "Please confirm patient has androgenetic alopecia";
      }
      if (!state.clinicalAssessment.alopeciaOnset.trim()) {
        return "Alopecia onset details are required";
      }
      return null;

    case 3: // Medical History
      return null; // Mainly checkboxes, no hard requirement

    case 4: // Contraindications
      return null; // Mainly checkboxes

    case 5: // Medicine Supply
      if (!state.medicineSupply.finasteride1mgOd) {
        return "Please confirm finasteride 1mg OD supply";
      }
      if (!state.medicineSupply.partnerNotified) {
        return "Please confirm partner has been notified of teratogenic risk";
      }
      if (!state.medicineSupply.willMonitorSE) {
        return "Please confirm patient will monitor for side effects";
      }
      if (!state.medicineSupply.understandsPSAEffect) {
        return "Please confirm patient understands PSA effect";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.effectOnsetTime ||
        !state.counselling.hairLossResumesStopped ||
        !state.counselling.sexualSideEffects ||
        !state.counselling.moodChanges ||
        !state.counselling.annualReview ||
        !state.counselling.reportChanges
      ) {
        return "All counselling points must be covered";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

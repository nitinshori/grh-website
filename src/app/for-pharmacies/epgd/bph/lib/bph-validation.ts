// ─── BPH (Tamsulosin) Validation ───

import type { BPHConsultationState } from "./bph-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: BPHConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, {
        minAge: 40,
        requireGender: true,
        genderConfirmed: state.patient.maleConfirmed,
      });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // LUTS Assessment
      if (state.lutsAssessment.ipssScore === null) {
        return "IPSS score is required";
      }
      // At least some LUTS symptoms should be present
      const symptomsCount = [
        state.lutsAssessment.frequency,
        state.lutsAssessment.urgency,
        state.lutsAssessment.nocturia,
        state.lutsAssessment.weakStream,
        state.lutsAssessment.hesitancy,
        state.lutsAssessment.incompletEmptying,
      ].filter(Boolean).length;

      if (symptomsCount === 0) {
        return "At least one LUTS symptom should be documented";
      }
      return null;

    case 3: // Medical History
      return null; // Mainly checkboxes

    case 4: // Red Flags
      return null; // Mainly checkboxes

    case 5: // Medicine Supply
      if (!state.medicineSupply.tamsulosin400mcgMrOd) {
        return "Please confirm tamsulosin supply";
      }
      if (!state.medicineSupply.afterFood30mins) {
        return "Please confirm patient will take medicine after food";
      }
      if (!state.medicineSupply.sameTimeDaily) {
        return "Please confirm patient will take at same time daily";
      }
      if (!state.medicineSupply.firstDoseHypotension) {
        return "Please confirm patient is aware of first-dose hypotension risk";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.take30minsAfterFood ||
        !state.counselling.firstDoseHypotension ||
        !state.counselling.retrogradeEjaculation ||
        !state.counselling.informOphthalmologist ||
        !state.counselling.reviewAt4To6Weeks
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

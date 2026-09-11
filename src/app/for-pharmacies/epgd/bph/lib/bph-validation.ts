// ─── BPH (Tamsulosin) Validation ───

import type { BPHConsultationState } from "./bph-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { MAX_CAPSULES_PER_SUPPLY } from "./bph-clinical-logic";

export function validateStep(state: BPHConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      // PGD v002: inclusion 18 and over, but under 45 is an exclusion.
      return validatePatientStep(state.patient, {
        minAge: 45,
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
      if (state.lutsAssessment.ipssScore < 8) {
        return "Inclusion requires an IPSS of 8 or more (moderate severity or above)";
      }
      return null;

    case 3: // Medical History
      if (!state.medicalHistory.previouslyAssessedByGp && !(state.medicalHistory.gpInformedToday && state.medicalHistory.patientAgreesGpWithin6Weeks)) {
        return "Symptoms not previously assessed by a GP or urologist: the GP must be informed today and the patient must agree to attend within 6 weeks";
      }
      return null;

    case 4: // Red Flags
      return null; // Mainly checkboxes

    case 5: // Medicine Supply
      if (!state.medicineSupply.tamsulosin400mcgMrOd) {
        return "Please confirm tamsulosin supply";
      }
      if (!state.medicineSupply.supplyType) {
        return "Select whether this is the initial 4-week supply or a continuation supply";
      }
      if (state.medicineSupply.supplyType === "continuation") {
        if (state.medicineSupply.previousIpss === null) {
          return "Record the IPSS at the start of treatment so that improvement can be assessed";
        }
        if (state.medicineSupply.monthsOnTreatment === null) {
          return "Record how many months of continuous treatment the patient has had";
        }
      }
      if (state.medicineSupply.quantity === null || state.medicineSupply.quantity < 1 || state.medicineSupply.quantity > MAX_CAPSULES_PER_SUPPLY) {
        return "Quantity must be between 1 and 28 capsules per supply";
      }
      if (!state.medicineSupply.brand.trim()) {
        return "Record the brand supplied";
      }
      if (!state.medicineSupply.afterFood30mins) {
        return "Please confirm patient will take medicine after food, preferably with breakfast";
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
        !state.counselling.swallowWhole ||
        !state.counselling.firstDoseHypotension ||
        !state.counselling.reportDizzinessFainting ||
        !state.counselling.retrogradeEjaculation ||
        !state.counselling.informOphthalmologist ||
        !state.counselling.priapismWarning ||
        !state.counselling.urgentSymptoms ||
        !state.counselling.rashAllergy ||
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

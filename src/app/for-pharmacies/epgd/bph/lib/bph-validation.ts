// ─── BPH (Tamsulosin) Validation ───

import type { BPHConsultationState } from "./bph-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { MAX_CAPSULES_PER_SUPPLY } from "./bph-clinical-logic";

export function validateStep(state: BPHConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: { // Patient Details
      // PGD v002: inclusion 18 and over, but under 45 is an exclusion.
      const base = validatePatientStep(state.patient, {
        minAge: 45,
        requireGender: true,
        genderConfirmed: state.patient.maleConfirmed,
      });
      if (base) return base;
      // Records row: name, address, date of birth and GP. The GP is
      // load-bearing here (informed on the day, examines before continuation).
      if (!state.patient.address.trim()) return "Patient address is required (PGD records row)";
      if (!state.patient.gpName.trim() && !state.patient.gpPractice.trim())
        return "Record the GP or practice with whom the patient is registered";
      return null;
    }

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // LUTS Assessment
      if (!state.medicineSupply.supplyType) {
        return "Select whether this is the initial supply or a continuation after the 4 to 6 week review";
      }
      if (state.lutsAssessment.ipssScore === null) {
        return "IPSS score is required";
      }
      if (state.lutsAssessment.ipssScore < 0 || state.lutsAssessment.ipssScore > 35 || !Number.isInteger(state.lutsAssessment.ipssScore)) {
        return "IPSS must be a whole number from 0 to 35";
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
      if (state.medicineSupply.supplyType === "initial" && state.lutsAssessment.ipssScore < 8) {
        return "Inclusion requires an IPSS of 8 or more (moderate severity or above) to start treatment";
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
        if (state.medicineSupply.previousIpss < 0 || state.medicineSupply.previousIpss > 35 || !Number.isInteger(state.medicineSupply.previousIpss)) {
          return "IPSS at the start of treatment must be a whole number from 0 to 35";
        }
        if (state.medicineSupply.monthsOnTreatment === null || state.medicineSupply.monthsOnTreatment < 0) {
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
        !state.counselling.reviewAt4To6Weeks ||
        !state.counselling.pilSupplied
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

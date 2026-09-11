// ─── BPH (Tamsulosin) Validation ───

import type { BPHConsultationState } from "./bph-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { MAX_CAPSULES_PER_SUPPLY } from "./bph-clinical-logic";

export function validateStep(state: BPHConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: { // Patient Details
      if (state.patient.dateOfBirth && state.patient.dateOfBirth > new Date().toISOString().split("T")[0])
        return "Date of birth cannot be in the future: check the date";
      // PGD v004: inclusion 18 and over, but under 45 is an exclusion.
      const base = validatePatientStep(state.patient, {
        minAge: 45,
      });
      if (base) return base;
      // Unanswered is "not yet answered": a message naming the control. The
      // "No" answer is a stop in the clinical logic (stop audit, 11 Sep 2026).
      if (!state.patient.sexAnswered)
        return "Select Yes or No to 'Is the patient male?' (this PGD is for male patients only)";
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
        return "Select the 'Supply type': initial supply, or continuation after the 4 to 6 week review";
      }
      if (state.lutsAssessment.ipssScore === null) {
        return "Enter the 'IPSS score' (0 to 35)";
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
        return "Tick at least one symptom the patient has (Frequency, Urgency, Nocturia, Weak stream, Hesitancy or Incomplete emptying)";
      }
      if (state.medicineSupply.supplyType === "initial" && state.lutsAssessment.ipssScore < 8) {
        return "Inclusion requires an IPSS of 8 or more (moderate severity or above) to start treatment";
      }
      if (state.medicineSupply.supplyType === "continuation") {
        if (state.medicineSupply.previousIpss === null) {
          return "Enter the 'IPSS at the start of treatment' so that improvement can be assessed";
        }
        if (state.medicineSupply.previousIpss < 0 || state.medicineSupply.previousIpss > 35 || !Number.isInteger(state.medicineSupply.previousIpss)) {
          return "'IPSS at the start of treatment' must be a whole number from 0 to 35";
        }
        if (!state.medicineSupply.gpExaminedSinceStart) {
          return "Select Yes or No to 'Has the patient been examined by the GP since starting treatment?'";
        }
        if (state.medicineSupply.monthsOnTreatment === null || state.medicineSupply.monthsOnTreatment < 0) {
          return "Enter the 'Months of continuous treatment so far'";
        }
      }
      return null;

    case 3: // Medical History
      // Decision 47: blood pressure lying and standing at every supply, both recorded.
      if (
        state.medicalHistory.lyingSystolic === null ||
        state.medicalHistory.lyingDiastolic === null ||
        state.medicalHistory.standingSystolic === null ||
        state.medicalHistory.standingDiastolic === null
      ) {
        return "Enter all four blood pressure figures: 'Lying systolic', 'Lying diastolic', 'Standing systolic' and 'Standing diastolic' (measured at every supply)";
      }
      if (!state.medicalHistory.previouslyAssessedByGp) {
        return "Select Yes or No to 'Have these symptoms been assessed before by a GP or urologist?'";
      }
      if (state.medicalHistory.previouslyAssessedByGp === "no" && !(state.medicalHistory.gpInformedToday && state.medicalHistory.patientAgreesGpWithin6Weeks)) {
        return "Symptoms not previously assessed by a GP or urologist: tick both 'GP informed on the day of supply' and 'Patient agrees to attend the GP within 6 weeks', or the patient is excluded";
      }
      return null;

    case 4: // Red Flags
      return null; // Mainly checkboxes

    case 5: // Medicine Supply
      if (!state.medicineSupply.tamsulosin400mcgMrOd) {
        return "Tick 'Supply tamsulosin 400 micrograms MR capsules, once daily'";
      }
      if (!state.medicineSupply.supplyType) {
        return "The 'Supply type' is chosen on the LUTS Assessment step: go back and select it";
      }
      if (state.medicineSupply.supplyType === "continuation") {
        if (state.medicineSupply.previousIpss === null) {
          return "'IPSS at the start of treatment' is missing: go back to the LUTS Assessment step";
        }
        if (state.medicineSupply.previousIpss < 0 || state.medicineSupply.previousIpss > 35 || !Number.isInteger(state.medicineSupply.previousIpss)) {
          return "'IPSS at the start of treatment' must be a whole number from 0 to 35 (LUTS Assessment step)";
        }
        if (!state.medicineSupply.gpExaminedSinceStart) {
          return "'Has the patient been examined by the GP since starting treatment?' is unanswered: go back to the LUTS Assessment step";
        }
        if (state.medicineSupply.monthsOnTreatment === null || state.medicineSupply.monthsOnTreatment < 0) {
          return "'Months of continuous treatment so far' is missing: go back to the LUTS Assessment step";
        }
      }
      if (state.medicineSupply.quantity === null || state.medicineSupply.quantity < 1 || state.medicineSupply.quantity > MAX_CAPSULES_PER_SUPPLY) {
        return "'Quantity supplied' must be between 1 and 28 capsules per supply";
      }
      if (!state.medicineSupply.brand.trim()) {
        return "Type the 'Brand supplied'";
      }
      if (!state.medicineSupply.afterFood30mins) {
        return "Tick 'Patient will take after food, preferably with breakfast'";
      }
      if (!state.medicineSupply.sameTimeDaily) {
        return "Tick 'Patient will take at same time daily'";
      }
      if (!state.medicineSupply.firstDoseHypotension) {
        return "Tick 'Patient is aware of first-dose hypotension risk'";
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
        return "Tick every counselling point on this page (each one must be covered with the patient)";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

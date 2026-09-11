// ─── Asthma Rescue Validation (PGD v005, 11 September 2026) ───

import type { AsthmaConsultationState } from "./asthma-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import {
  missingObservations,
  salbutamolArmBlockers,
  prednisoloneArmBlockers,
  prednisoloneTabletCount,
  MAX_PREDNISOLONE_TABLETS,
} from "./asthma-clinical-logic";

export function validateStep(state: AsthmaConsultationState, step: number): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 18 }); // adults aged 18 years and over

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: { // Asthma Assessment
      const a = state.assessment;
      if (!a.hasExistingDiagnosis) {
        return "Please confirm patient has a confirmed asthma diagnosis";
      }
      if (!a.diagnosisEvidence) {
        return "Record how the diagnosis is documented (GP record, repeat prescription for an asthma inhaler, or asthma action plan)";
      }
      if (a.diagnosisEvidence === "none") {
        return "Previous inhaler use on its own is not confirmation of diagnosis: refer for assessment";
      }
      if (!a.normallyUsesSABA) {
        return "Please confirm patient normally uses SABA";
      }
      if (a.rescueCoursesLast12Months === null) {
        return "Record the number of rescue courses in the last 12 months";
      }
      if (!a.acuteExacerbation) {
        return "This PGD is for an acute exacerbation with symptoms of bronchospasm (wheezing, breathlessness, chest tightness); record it or do not supply";
      }
      if (!a.reasonForSupply) {
        return "Please specify reason for supply";
      }
      return null;
    }

    case 3: // Medical History
      // Optional step - always valid
      return null;

    case 4: { // Observations and exclusions
      const missing = missingObservations(state);
      if (missing.length > 0) {
        return "Measure and record before any supply: " + missing.join(", ") + ". If any observation is missing, do not supply.";
      }
      return null;
    }

    case 5: { // Medicine Supply
      const ms = state.medicineSupply;
      if (!ms.salbutamol100mcgPMDI && !ms.prednisolone5mg) {
        return "Select at least one medicine to supply (salbutamol and/or prednisolone)";
      }
      if (ms.salbutamol100mcgPMDI) {
        const blockers = salbutamolArmBlockers(state);
        if (blockers.length > 0) return "Salbutamol is excluded for this patient: " + blockers.join("; ");
        if (!ms.twoAsDoseUnit) {
          return "Please confirm the salbutamol dose (2 to 4 puffs, may repeat after 15 to 30 minutes)";
        }
        if (!ms.maxEightPuffsDailyUnderstood) {
          return "Patient understanding of when to seek emergency care must be confirmed";
        }
      }
      if (ms.prednisolone5mg) {
        const blockers = prednisoloneArmBlockers(state);
        if (blockers.length > 0) return "Prednisolone is excluded for this patient: " + blockers.join("; ");
        if (!ms.prednisoloneDoseMg) return "Select the prednisolone daily dose (40mg or 50mg)";
        if (!ms.prednisoloneDays) return "Select the prednisolone course length (5 to 7 days)";
        const expected = prednisoloneTabletCount(ms.prednisoloneDoseMg, ms.prednisoloneDays);
        if (expected === null || ms.prednisoloneTablets !== expected) {
          return `Quantity must be ${expected ?? "?"} tablets of 5mg for ${ms.prednisoloneDoseMg}mg daily for ${ms.prednisoloneDays} days. Check the arithmetic against the dose before supply.`;
        }
        if (expected > MAX_PREDNISOLONE_TABLETS) {
          return `Maximum ${MAX_PREDNISOLONE_TABLETS} tablets (50mg daily for 7 days)`;
        }
      }
      return null;
    }

    case 6: { // Counselling
      const c = state.counselling;
      const ms = state.medicineSupply;
      if (
        !c.relieverNotPreventer ||
        !c.inhalerTechniqueDemonstration ||
        !c.rinseMouthAfterUse
      ) {
        return "Key counselling points must be confirmed";
      }
      if (!c.emergencyIfNoImprovement) {
        return "Confirm the patient was told to seek emergency medical attention if symptoms do not improve within 15 to 30 minutes of salbutamol use";
      }
      if (ms.prednisolone5mg && (!c.prednisoloneFullCourse || !c.prednisoloneWithFood)) {
        return "Confirm the prednisolone counselling: take the full course, do not stop abruptly, take with food if stomach upset";
      }
      if (!c.seekImmediateAttention) {
        return "Confirm the patient was told to seek immediate medical attention for severe breathlessness, chest pain, confusion or exhaustion";
      }
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

// ─── Asthma Rescue Validation (PGD v007, 11 September 2026) ───

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
      if (!a.onPreventer) {
        return "Current preventer therapy must be asked about and recorded: a patient with no preventer is referred to the GP, do not supply";
      }
      if (a.rescueCoursesLast12Months === null) {
        return "Record the number of rescue courses in the last 12 months (any source)";
      }
      if (a.pgdRescueCoursesLast12Months === null) {
        return "Record the number of rescue courses supplied under this PGD in the last 12 months";
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
      if (!state.medicalHistory.exclusionsAskedAndAnswered) {
        return "Confirm that the prednisolone exclusions and every caution on this step were asked and answered by the patient";
      }
      return null;

    case 4: { // Observations and exclusions
      const missing = missingObservations(state);
      if (missing.length > 0) {
        return "Measure and record before any supply: " + missing.join(", ") + ". If any observation is missing, do not supply.";
      }
      if (!state.redFlags.allergyStatusConfirmed) {
        return "Confirm the patient's allergy status (salbutamol and other beta-2 agonists; prednisolone and other corticosteroids) was asked and confirmed";
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
          return "Confirm the salbutamol limits were explained: maximum 8 puffs in 24 hours; more often than every 4 hours or on most days is a same-day GP referral; 10 puffs through a spacer with no relief is 999";
        }
        if (!ms.salbutamolPilSupplied) {
          return "Confirm the patient information leaflet was supplied with the salbutamol inhaler";
        }
      }
      if (ms.prednisolone5mg) {
        const blockers = prednisoloneArmBlockers(state);
        if (blockers.length > 0) return "Prednisolone is excluded for this patient: " + blockers.join("; ");
        if (ms.prednisoloneDoseMg !== "40" || ms.prednisoloneDays !== "5") {
          return "Prednisolone under this PGD is 40mg once daily for 5 days only";
        }
        const expected = prednisoloneTabletCount(ms.prednisoloneDoseMg, ms.prednisoloneDays);
        if (expected === null || ms.prednisoloneTablets !== expected) {
          return `Quantity must be ${expected ?? "?"} tablets of 5mg (40mg daily, eight tablets a day, for 5 days). Check the arithmetic against the dose before supply.`;
        }
        if (expected > MAX_PREDNISOLONE_TABLETS) {
          return `Maximum ${MAX_PREDNISOLONE_TABLETS} tablets (40mg daily for 5 days)`;
        }
        if (!ms.tabletCountChecked) {
          return "Confirm the tablet count was checked against the dose before supply";
        }
        if (!ms.prednisolonePilSupplied) {
          return "Confirm the patient information leaflet was supplied with the prednisolone tablets";
        }
      }
      return null;
    }

    case 6: { // Counselling
      const c = state.counselling;
      const ms = state.medicineSupply;
      // The document's follow-up advice, required for the arm supplied
      // (PGD v007, Follow-up advice to be given to patient or carer).
      if (ms.salbutamol100mcgPMDI) {
        if (!c.relieverNotPreventer) return "Confirm the patient was told salbutamol is a reliever, not a preventer";
        if (!c.inhalerTechniqueDemonstration) return "Confirm inhaler technique was demonstrated and the technique sheet given (coordinate inhalation with actuation if no spacer)";
        if (!c.spacerUse) return "Confirm spacer use was discussed";
        if (!c.emergencyIfNoImprovement) {
          return "Confirm the patient was told to seek emergency medical attention if symptoms do not improve within 15 to 30 minutes of salbutamol use";
        }
        if (!c.salbutamolLimits) {
          return "Confirm the patient was told: no more than 8 puffs in 24 hours; if needed more often than every 4 hours or on most days, see the GP the same day; in an attack up to 10 puffs through a spacer, and if 10 puffs give no relief call 999";
        }
      }
      if (ms.prednisolone5mg) {
        if (!c.prednisoloneFullCourse || !c.prednisoloneWithFood) {
          return "Confirm the prednisolone counselling: take the full 5 day course (eight 5mg tablets each morning), do not stop abruptly, take with food if stomach upset";
        }
        if (!c.prednisoloneDiabetes) return "Confirm the blood glucose advice was given (if diabetic, monitor more frequently and inform the GP)";
        if (!c.prednisoloneOtherMedicines) return "Confirm the patient was told to inform their healthcare providers of steroid use";
      }
      if (!c.seekImmediateAttention) {
        return "Confirm the patient was told to seek immediate medical attention for severe breathlessness, chest pain, confusion or exhaustion";
      }
      if (!c.reviewActionPlan) return "Confirm the patient was advised to review their asthma action plan and triggers with their GP after recovery";
      if (!c.maintenanceOptimised) return "Confirm the patient was advised to have their maintenance therapy optimised to prevent future exacerbations";
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

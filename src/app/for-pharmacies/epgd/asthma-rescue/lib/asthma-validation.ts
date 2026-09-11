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
      if (!a.diagnosisEvidence) {
        return "How the asthma diagnosis is documented: select an option (GP record, repeat prescription, action plan, or none)";
      }
      if (a.diagnosisEvidence === "none") {
        return "Previous inhaler use on its own is not confirmation of diagnosis: refer for assessment";
      }
      if (!a.preventerAnswer) {
        return "Current preventer (inhaled corticosteroid) therapy: select Yes or No";
      }
      if (a.rescueCoursesLast12Months === null) {
        return "Record the number of rescue courses in the last 12 months (any source)";
      }
      if (a.pgdRescueCoursesLast12Months === null) {
        return "Record the number of rescue courses supplied under this PGD in the last 12 months";
      }
      if (!a.exacerbationAnswer) {
        return "Acute exacerbation with symptoms of bronchospasm: select Yes or No";
      }
      if (!a.inhalerAbilityAnswer) {
        return "Capable of using an inhaler device, or willing to use a spacer: select Yes or No";
      }
      if (!a.incompleteResponseAnswer) {
        return "Moderate exacerbation with incomplete response to salbutamol: select Yes or No";
      }
      if (!a.oralAbilityAnswer) {
        return "Able to take oral medication: select Yes or No";
      }
      if (!a.reasonForSupply) {
        return "Reason for supply: select an option";
      }
      return null;
    }

    case 3: // Medical History
      if (!state.medicalHistory.exclusionsAskedAndAnswered) {
        return "Tick 'The prednisolone exclusions and every caution on this step were asked and answered by the patient' (an unticked condition means the patient answered no)";
      }
      return null;

    case 4: { // Observations and exclusions
      const missing = missingObservations(state);
      if (missing.length > 0) {
        return "Measure and record before any supply: " + missing.join(", ") + ". If any observation is missing, do not supply.";
      }
      if (!state.observations.sentencesAnswer) {
        return "Able to complete sentences in one breath: select Yes or No";
      }
      if (!state.redFlags.allergyStatusConfirmed) {
        return "Tick 'Allergy status confirmed with the patient'";
      }
      return null;
    }

    case 5: { // Medicine Supply
      const ms = state.medicineSupply;
      const a = state.assessment;
      if (!ms.salbutamol100mcgPMDI && !ms.prednisolone5mg) {
        return "Tick at least one medicine to supply (Supply Salbutamol and/or Supply Prednisolone)";
      }
      if (ms.salbutamol100mcgPMDI) {
        if (!a.exacerbationAnswer) return "Acute exacerbation with symptoms of bronchospasm: select Yes or No on the Asthma Assessment step";
        if (!a.inhalerAbilityAnswer) return "Capable of using an inhaler device, or willing to use a spacer: select Yes or No on the Asthma Assessment step";
        if (!a.preventerAnswer) return "Current preventer (inhaled corticosteroid) therapy: select Yes or No on the Asthma Assessment step";
        const blockers = salbutamolArmBlockers(state);
        if (blockers.length > 0) return "Salbutamol is excluded for this patient: " + blockers.join("; ");
        if (!ms.twoAsDoseUnit) {
          return "Tick 'Confirm dosing: 2 to 4 puffs inhaled immediately...'";
        }
        if (!ms.maxEightPuffsDailyUnderstood) {
          return "Tick 'Salbutamol limits explained' (maximum 8 puffs in 24 hours; referral and 999 thresholds)";
        }
        if (!ms.salbutamolPilSupplied) {
          return "Tick 'Patient information leaflet supplied with the salbutamol inhaler'";
        }
      }
      if (ms.prednisolone5mg) {
        if (!a.incompleteResponseAnswer) return "Moderate exacerbation with incomplete response to salbutamol: select Yes or No on the Asthma Assessment step";
        if (!a.oralAbilityAnswer) return "Able to take oral medication: select Yes or No on the Asthma Assessment step";
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
          return "Tick 'Tablet count checked against the dose before supply'";
        }
        if (!ms.prednisolonePilSupplied) {
          return "Tick 'Patient information leaflet supplied with the prednisolone tablets'";
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

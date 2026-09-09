import type { HPVConsultationState } from "./hpv-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { selectSchedule } from "./hpv-clinical-logic";

export function validateStep(state: HPVConsultationState, step: number): string | null {
  const age = state.patient.age;

  switch (step) {
    case 0: // Patient Details
      // No sex gate. HPV vaccination is for all sexes, and the signed PGD
      // names the GBMSM cohort up to 45 years of age. Version 001 of this
      // tool would not let a male patient past this step.
      return validatePatientStep(state.patient, { minAge: 9 });

    case 1: // Vaccine Assessment
      if (!state.assessment.pregnancyStatus.trim()) {
        return "Pregnancy status must be specified";
      }
      if (!state.assessment.priorDoses.trim()) {
        return "Prior HPV vaccine history must be recorded: it determines the schedule";
      }
      return null;

    case 2: // Red Flags & Exclusions
      return null;

    case 3: {
      // Schedule & Consent
      const schedule = selectSchedule(state);
      if (schedule?.offLabel && !state.consent16.offLabelConsentGiven) {
        return "Consent to the off-label schedule must be explained and recorded before proceeding";
      }
      if (age !== null && age < 16) {
        if (!state.consent16.basis) {
          return "Record the basis of consent for a patient under 16";
        }
        if (state.consent16.basis === "parental" && !state.consent16.parentName.trim()) {
          return "Record the name of the person with parental responsibility";
        }
        if (state.consent16.basis === "gillick" && !state.consent16.gillickBasis.trim()) {
          return "Record the basis of the Gillick competence assessment";
        }
      }
      return null;
    }

    case 4: // Counselling
      if (
        !state.counselling.explainedDoseSchedule ||
        !state.counselling.explainedProtection ||
        !state.counselling.discussedCommonReactions ||
        !state.counselling.explainedNotTreatment ||
        !state.counselling.explainedScreeningStillNeeded
      ) {
        return "All counselling items must be completed";
      }
      return null;

    case 5: // Administration
      if (!state.administration.adrenalineAvailable) {
        return "Adrenaline 1 in 1,000 must be confirmed immediately available before vaccinating";
      }
      if (!state.administration.batchNumber.trim()) {
        return "Batch number must be recorded (SPC traceability requirement)";
      }
      if (!state.administration.expiryDate.trim()) {
        return "Vaccine expiry date must be recorded";
      }
      if (!state.administration.site.trim()) {
        return "Anatomical site of injection must be recorded";
      }
      if (!state.administration.doseNumber.trim()) {
        return "Dose number in the course must be recorded";
      }
      if (!state.administration.observedFifteenMinutes) {
        return "The 15 minute observation period must be completed and recorded";
      }
      return null;

    case 6: // Summary & Declaration
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);

    default:
      return null;
  }
}

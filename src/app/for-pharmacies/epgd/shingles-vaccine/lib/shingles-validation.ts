// Aligned to the Shingrix PGD version 005, issued 11 September 2026.
import type { ShinglesConsultationState } from "./shingles-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { daysBetween, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS } from "./shingles-clinical-logic";

export function validateStep(state: ShinglesConsultationState, step: number): string | null {
  switch (step) {
    case 0: {
      const base = validatePatientStep(state.patient, { minAge: 50 });
      if (base) return base;
      if (state.patient.age === null) return "Unable to calculate age from the date of birth";
      return null;
    }

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.ageEligible) {
        return "Please confirm the patient is aged 50 or older and eligible under national immunisation guidelines";
      }
      if (!state.assessment.pregnancyStatus) {
        return "Pregnancy or breastfeeding status must be specified";
      }
      if (state.assessment.previousShingrix && !state.assessment.previousShingrixDate) {
        return "Record the date of dose 1 (the PGD requires it where dose 1 was given elsewhere)";
      }
      return null;

    case 3:
      if (!state.assessment.anaphylaxisToComponent) {
        return "Answer whether the patient has any hypersensitivity to a component of Shingrix";
      }
      if (!state.assessment.severeAcuteIllness) {
        return "Answer whether the patient has an acute illness with fever today";
      }
      return null;

    case 4:
      if (
        !state.counselling.explainedDoseSchedule ||
        !state.counselling.explainedLocalReactions ||
        !state.counselling.explainedSystemicReactions ||
        !state.counselling.explainedEffectiveness ||
        !state.counselling.explainedNotLiveVaccine ||
        !state.counselling.offeredWrittenInfo ||
        !state.counselling.followUpAdviceGiven
      ) {
        return "All counselling items, the patient information leaflet and the follow-up advice must be completed";
      }
      return null;

    case 5: {
      if (!state.supply.doseNumber) return "Dose number (1 or 2) is required";
      if (state.supply.doseNumber === "2" && !state.assessment.previousShingrix) {
        return "Dose 2 selected but no previous Shingrix dose recorded on the eligibility step";
      }
      if (state.supply.doseNumber === "1" && state.assessment.previousShingrix) {
        return "A previous Shingrix dose is recorded: this should be dose 2";
      }
      if (!state.supply.vaccinationDate) return "Vaccination date is required";
      if (state.supply.doseNumber === "2") {
        const days = daysBetween(state.assessment.previousShingrixDate, state.supply.vaccinationDate);
        if (days !== null && days < MIN_INTERVAL_DAYS) {
          return "The second dose must be given at least 2 months after the first";
        }
      }
      if (state.supply.doseNumber === "1") {
        if (!state.supply.nextDoseDue) {
          return "Record the date the second dose is due (2 to 6 months after today)";
        }
        const gap = daysBetween(state.supply.vaccinationDate, state.supply.nextDoseDue);
        if (gap === null || gap < MIN_INTERVAL_DAYS || gap > MAX_INTERVAL_DAYS) {
          return "The second dose due date must be 2 to 6 months after the vaccination date";
        }
      }
      if (!state.supply.batchNumber.trim()) return "Batch number is required";
      if (!state.supply.expiryDate) return "Expiry date is required";
      if (state.supply.expiryDate < state.supply.vaccinationDate) return "This vaccine has expired: do not administer";
      if (!state.supply.site) return "Anatomical site is required";
      if (!state.supply.observedFifteenMinutes) {
        return "Confirm the 15 minute observation period has been completed (PGD safety block)";
      }
      if (state.supply.adverseReaction.trim() && !state.supply.adverseReactionAction.trim()) {
        return "Record the action taken for the adverse reaction";
      }
      return null;
    }

    case 6:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

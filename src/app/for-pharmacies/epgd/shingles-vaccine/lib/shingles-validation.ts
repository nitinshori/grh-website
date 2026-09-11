// Aligned to the Shingrix PGD version 005, issued 11 September 2026.
import type { ShinglesConsultationState } from "./shingles-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { daysBetween, MIN_INTERVAL_DAYS } from "./shingles-clinical-logic";

export function validateStep(state: ShinglesConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 50 });

    case 1:
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

    case 2:
      return null;

    case 3:
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

    case 4: {
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
      if (state.supply.doseNumber === "1" && !state.supply.nextDoseDue) {
        return "Record the date the second dose is due (2 to 6 months after today)";
      }
      if (!state.supply.batchNumber.trim()) return "Batch number is required";
      if (!state.supply.expiryDate) return "Expiry date is required";
      if (!state.supply.site) return "Anatomical site is required";
      return null;
    }

    case 5:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);

    case 6:
    case 7:
      return null;

    default:
      return null;
  }
}

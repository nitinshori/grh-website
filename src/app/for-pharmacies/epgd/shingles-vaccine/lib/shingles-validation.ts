// Aligned to the Shingrix PGD version 007, issued 11 September 2026, as amended by
// the signatories' decisions 13, 14 and 15 of 11 September 2026.
import type { ShinglesConsultationState } from "./shingles-types";
import { SEVERE_IMMUNOSUPPRESSION_QUALIFYING } from "./shingles-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { daysBetween, getArm, nhsEligibleGroup, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS } from "./shingles-clinical-logic";

export function validateStep(state: ShinglesConsultationState, step: number): string | null {
  switch (step) {
    case 0: {
      const base = validatePatientStep(state.patient, { minAge: 18 });
      if (base) return base;
      if (state.patient.age === null) return "Unable to calculate age from the date of birth";
      return null;
    }

    case 1:
      return validateConsentStep(state.consent);

    case 2: {
      const age = state.patient.age;
      if (age !== null && age < 50) {
        if (!state.assessment.under50ImmunosuppressionAnswer) {
          return "Answer \"Is the patient severely immunosuppressed as defined in Green Book chapter 28a, Box 1?\" (Arm 2 covers 18 to 49 year olds only where they are)";
        }
        if (state.assessment.under50ImmunosuppressionAnswer === "no") {
          return "Aged 18 to 49 and not severely immunosuppressed: not covered by either arm of this PGD. Refer, and save as not supplied.";
        }
        if (!state.assessment.severeImmunosuppressionCategory) {
          return "Select the Green Book chapter 28a Box 1 category that applies (Arm 2 inclusion)";
        }
        if (!SEVERE_IMMUNOSUPPRESSION_QUALIFYING.has(state.assessment.severeImmunosuppressionCategory)) {
          return "The category selected does not meet the Arm 2 inclusion: refer";
        }
        if (!state.assessment.immunosuppressionDetail.trim()) {
          return "Record the condition or therapy relied on and its dates (Arm 2 records requirement)";
        }
        if (!state.assessment.immunosuppressionDoubt) {
          return "Record whether there was any doubt that the Box 1 definition is met, and if so that the specialist or GP confirmed it";
        }
      }
      if (!getArm(state)) {
        return "The patient does not fall within either arm of this PGD";
      }
      if (!state.assessment.ageEligible) {
        return age !== null && age >= 50
          ? "Please confirm the patient is aged 50 or older, within the licensed indication (Arm 1)"
          : "Please confirm the patient is aged 18 to 49 and severely immunosuppressed as defined in Green Book chapter 28a, Box 1 (Arm 2)";
      }
      if (nhsEligibleGroup(state) && !state.assessment.nhsEntitlementExplained) {
        return "Tick \"Patient is eligible for Shingrix on the NHS and has been told it is free of charge on the NHS before this private supply\"";
      }
      if (!state.assessment.pregnancyStatus) {
        return "Select the pregnancy or breastfeeding status";
      }
      if (state.assessment.previousShingrix && !state.assessment.previousShingrixDate) {
        return "Record the date of dose 1 (the PGD requires it where dose 1 was given elsewhere)";
      }
      return null;
    }

    case 3:
      if (!state.assessment.anaphylaxisToComponent) {
        return "Answer whether the patient has any hypersensitivity to a component of Shingrix";
      }
      if (!state.assessment.severeAcuteIllness) {
        return "Answer whether the patient has an acute illness with fever today";
      }
      return null;

    case 4: {
      const c = state.counselling;
      if (!c.explainedDoseSchedule) return "Tick \"Explained the 2-dose schedule\"";
      if (!c.explainedLocalReactions) return "Tick \"Discussed local injection reactions\"";
      if (!c.explainedSystemicReactions) return "Tick \"Counselled that systemic side effects are common and generally self-limiting\"";
      if (!c.explainedEffectiveness) return "Tick \"Explained effectiveness\"";
      if (!c.explainedNotLiveVaccine) return "Tick \"Clarified NOT a live vaccine\"";
      if (!c.offeredWrittenInfo) return "Tick \"Patient information leaflet (PIL) supplied\"";
      if (!c.followUpAdviceGiven) return "Tick \"Follow-up advice given\"";
      return null;
    }

    case 5: {
      const arm = getArm(state);
      const intervalText = arm === "18-49-immunosuppressed" ? "8 weeks to 6 months" : "2 to 6 months";
      const minText = arm === "18-49-immunosuppressed" ? "8 weeks" : "2 months";
      if (!state.supply.doseNumber) return "Dose number (1 or 2) is required";
      if (state.supply.doseNumber === "2" && !state.assessment.previousShingrix) {
        return "Dose 2 selected but no previous Shingrix dose recorded on the eligibility step";
      }
      if (state.supply.doseNumber === "1" && state.assessment.previousShingrix) {
        return "A previous Shingrix dose is recorded: this should be dose 2";
      }
      if (!state.supply.vaccinationDate) return "Vaccination date is required";
      if (state.supply.vaccinationDate > new Date().toISOString().split("T")[0]) {
        return "Vaccination date cannot be in the future";
      }
      if (state.supply.doseNumber === "2") {
        const days = daysBetween(state.assessment.previousShingrixDate, state.supply.vaccinationDate);
        if (days !== null && days < MIN_INTERVAL_DAYS) {
          return `The second dose must be given at least ${minText} after the first`;
        }
        // Decision 13: a late second dose is given as soon as possible and the
        // course is not restarted. The practitioner confirms the interval is recorded.
        if (days !== null && days > MAX_INTERVAL_DAYS && !state.supply.lateDoseAcknowledged) {
          return "More than 6 months since dose 1: confirm that dose 2 is being given as soon as possible without restarting the course, and that the interval has been recorded";
        }
      }
      if (state.supply.doseNumber === "1") {
        if (!state.supply.nextDoseDue) {
          return `Record the date the second dose is due (${intervalText} after today)`;
        }
        const gap = daysBetween(state.supply.vaccinationDate, state.supply.nextDoseDue);
        if (gap === null || gap < MIN_INTERVAL_DAYS || gap > MAX_INTERVAL_DAYS) {
          return `The second dose due date must be ${intervalText} after the vaccination date`;
        }
      }
      if (!state.supply.batchNumber.trim()) return "Batch number is required";
      if (!state.supply.expiryDate) return "Expiry date is required";
      if (state.supply.expiryDate < state.supply.vaccinationDate) return "This vaccine has expired: do not administer";
      if (!state.supply.site) return "Anatomical site is required";
      if (!state.supply.observedFifteenMinutes) {
        return "Tick \"Patient observed, seated, for 15 minutes after vaccination\" once the observation period has been completed";
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

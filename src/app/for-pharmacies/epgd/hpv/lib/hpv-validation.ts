import type { HPVConsultationState } from "./hpv-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { selectSchedule, daysBetween, minimumIntervalDays, minimumIntervalLabel } from "./hpv-clinical-logic";

export function validateStep(state: HPVConsultationState, step: number): string | null {
  const age = state.patient.age;

  switch (step) {
    case 0: {
      // No sex gate. HPV vaccination is for all sexes, and the signed PGD
      // names the GBMSM cohort up to 45 years of age. Version 001 of this
      // tool would not let a male patient past this step.
      const base = validatePatientStep(state.patient, { minAge: 9 });
      if (base) return base;
      if (age === null) return "Unable to calculate age from the date of birth";
      return null;
    }

    case 1: // Vaccine Assessment
      if (!state.assessment.pregnancyStatus.trim()) {
        return "Pregnancy status must be specified";
      }
      if (!state.assessment.priorDoses.trim()) {
        return "Prior HPV vaccine history must be recorded: it determines the schedule";
      }
      if (!state.assessment.nhsEligibilityDiscussed) {
        return "Tell the patient whether they could have this vaccine free on the NHS, and record that you did (PGD inclusion criterion)";
      }
      return null;

    case 2: // Red Flags & Exclusions
      if (!state.assessment.anaphylaxisToPreviousDose) {
        return "Answer whether there is a confirmed anaphylactic reaction to a previous HPV vaccine dose";
      }
      if (!state.assessment.anaphylaxisToComponent) {
        return "Answer whether there is confirmed anaphylaxis to a component of Gardasil 9, or hypersensitivity after previous Gardasil 9, Gardasil or Silgard";
      }
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
        if (state.consent16.basis === "parental" && !state.consent16.parentRelationship.trim()) {
          return "Record the relationship of the person with parental responsibility to the patient";
        }
        if (state.consent16.basis === "gillick" && !state.consent16.gillickBasis.trim()) {
          return "Record the basis of the Gillick competence assessment";
        }
      }
      // General informed consent, ID and the private-service acknowledgement
      // are taken here, before the vaccine is drawn up.
      return validateConsentStep(state.consent);
    }

    case 4: // Counselling
      if (
        !state.counselling.explainedDoseSchedule ||
        !state.counselling.explainedProtection ||
        !state.counselling.discussedCommonReactions ||
        !state.counselling.explainedNotTreatment ||
        !state.counselling.explainedScreeningStillNeeded ||
        !state.counselling.offeredWrittenInfo
      ) {
        return "All counselling items, including the written information, must be completed";
      }
      return null;

    case 5: {
      // Administration
      const a = state.administration;
      const schedule = selectSchedule(state);
      if (!a.adrenalineAvailable) {
        return "Adrenaline 1 in 1,000 must be confirmed immediately available before vaccinating";
      }
      if (!a.batchNumber.trim()) {
        return "Batch number must be recorded (SPC traceability requirement)";
      }
      if (!a.expiryDate.trim()) {
        return "Vaccine expiry date must be recorded";
      }
      if (a.expiryDate < state.summary.consultationDate) {
        return "This vaccine has passed its labelled expiry date: do not administer";
      }
      if (!a.site.trim()) {
        return "Anatomical site of injection must be recorded";
      }
      if (!a.doseNumber.trim()) {
        return "Dose number in the course could not be determined: record the prior dose history on the assessment step";
      }
      // Minimum intervals (PGD v006): a dose given early must be discounted
      // and repeated, so it is refused here rather than recorded.
      const minDays = minimumIntervalDays(schedule, a.doseNumber);
      if (minDays !== null) {
        if (!a.previousDoseDate) {
          return `Record the date of the previous dose: dose ${a.doseNumber} must be at least ${minimumIntervalLabel(schedule, a.doseNumber)} after it`;
        }
        const gap = daysBetween(a.previousDoseDate, state.summary.consultationDate);
        if (gap === null) return "The previous dose date is not a valid date";
        if (gap < minDays) {
          return `Too early: dose ${a.doseNumber} must be at least ${minimumIntervalLabel(schedule, a.doseNumber)} after the previous dose (given ${a.previousDoseDate}). Do not give today; rebook.`;
        }
      }
      // The record must state the date the next dose is due, or that no
      // further dose is required; book it at this appointment.
      const doseNo = parseInt(a.doseNumber, 10);
      const furtherDose = schedule !== null && schedule.doses > doseNo;
      if (furtherDose) {
        if (!a.nextDoseDue) {
          return "Book the next dose at this appointment and record the date it is due";
        }
        const ahead = daysBetween(state.summary.consultationDate, a.nextDoseDue);
        const nextMin = minimumIntervalDays(schedule, String(doseNo + 1));
        if (ahead === null || ahead <= 0) return "The next dose due date must be after today";
        if (nextMin !== null && ahead < nextMin) {
          return `The next dose is due at least ${minimumIntervalLabel(schedule, String(doseNo + 1))} after today`;
        }
      }
      if (!a.observedFifteenMinutes) {
        return "The 15 minute observation period must be completed and recorded";
      }
      return null;
    }

    case 6: // Summary & Declaration
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

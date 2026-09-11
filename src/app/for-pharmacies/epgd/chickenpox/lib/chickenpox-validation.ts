// ─── Chickenpox Validation ───

import type { ChickenpoxConsultationState } from "./chickenpox-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import { daysBetween } from "./chickenpox-clinical-logic";

export function validateStep(step: number, state: ChickenpoxConsultationState): string | null {
  const underSixteen = state.patient.age !== null && state.patient.age < 16;

  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 1 });

    case 1: { // Consent
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (underSixteen) {
        if (!state.medicalHistory.consentBasis) {
          return "Under 16: record whether consent came from a person with parental responsibility or from a Gillick competent young person";
        }
        if (!state.medicalHistory.consentGiverDetails.trim()) {
          return "Under 16: record the consent giver's name and relationship, or the basis of the Gillick competence assessment";
        }
      }
      return null;
    }

    case 2: // Eligibility
      if (!state.eligibility.noPriorVaricella && !state.eligibility.historyOfChickenpox) {
        return "Answer \"Has the patient had chickenpox before?\"";
      }
      if (state.eligibility.dose1GivenElsewhere) {
        if (!state.eligibility.dose1Where) {
          return "Dose 1 already given: select where dose 1 was given (this pharmacy or elsewhere)";
        }
        if (!state.eligibility.dose1ElsewhereDate) {
          return "Dose 1 already given: record the date of dose 1";
        }
        {
          const ahead = daysBetween(new Date().toISOString().split("T")[0], state.eligibility.dose1ElsewhereDate);
          if (ahead !== null && ahead > 0) {
            return "Date of dose 1 cannot be in the future";
          }
        }
        if (!state.eligibility.dose1ElsewhereBrand.trim()) {
          return "Dose 1 already given: record the brand of dose 1";
        }
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.bloodProductsWithin3Months && !state.medicalHistory.bloodProductsReason.trim()) {
        return "Immunoglobulin or blood products in the previous 3 months: record the reason for vaccinating now";
      }
      return null;

    case 4: // Contraindications Review
      return null; // Review step, no validation needed

    case 5: { // Vaccine Admin
      const a = state.vaccineAdmin;
      if (!a.vaccine.trim()) {
        return "Select the vaccine";
      }
      if (!a.doseNumber) {
        return "Record whether this is dose 1 or dose 2 of the course";
      }
      if (a.doseNumber === "2nd" && !state.eligibility.dose1GivenElsewhere) {
        return "Dose 2: tick \"Dose 1 already given\" and record the date and brand of dose 1 on the Eligibility step";
      }
      if (a.doseNumber === "1st" && state.eligibility.dose1GivenElsewhere) {
        return "Dose 1 has already been given; this administration is dose 2";
      }
      if (!a.route) {
        return "Select the route";
      }
      if (a.vaccine === "Varivax" && a.route === "intramuscular") {
        return "Route: Varivax is given by subcutaneous injection (usually the upper arm); select Subcutaneous";
      }
      if (!a.dose1Date) {
        return "Date of administration is required";
      }
      {
        const today = new Date().toISOString().split("T")[0];
        const ahead = daysBetween(today, a.dose1Date);
        if (ahead !== null && ahead > 0) {
          return "Date of administration cannot be in the future";
        }
      }
      if (a.doseNumber === "2nd") {
        const interval = daysBetween(state.eligibility.dose1ElsewhereDate, a.dose1Date);
        if (interval !== null && interval < 28) {
          return "Second dose must be at least 4 weeks after the first (Varilrix: at least 6 weeks, never less than 4)";
        }
        if (interval !== null && a.vaccine === "Varilrix" && interval < 42 && !a.intervalReason.trim()) {
          return "Varilrix second dose between 4 and 6 weeks after the first: record the reason (PGD caution)";
        }
      }
      if (!a.dose1Site.trim()) {
        return "Anatomical site is required";
      }
      if (!a.dose1Lot.trim()) {
        return "Batch number is required";
      }
      if (!a.expiryDate) {
        return "Expiry date is required";
      }
      {
        const today = new Date().toISOString().split("T")[0];
        const untilExpiry = daysBetween(today, a.expiryDate);
        if (untilExpiry !== null && untilExpiry < 0) {
          return "This batch has expired. Do not use it.";
        }
      }
      if (a.doseNumber === "1st" && !a.dose2Scheduled) {
        return "Record the date dose 2 is due";
      }
      if (a.doseNumber === "1st" && a.dose2Scheduled) {
        const interval = daysBetween(a.dose1Date, a.dose2Scheduled);
        const minimum = a.vaccine === "Varilrix" ? 42 : 28;
        if (interval !== null && interval < minimum) {
          return a.vaccine === "Varilrix"
            ? "Varilrix: second dose at least 6 weeks after the first"
            : "Varivax: second dose at least 4 weeks after the first";
        }
      }
      if (!a.administeredBy.trim()) {
        return "Administered by (name and credentials) is required";
      }
      return null;
    }

    case 6: { // Post-Vaccine
      const p = state.postVaccine;
      const c = state.counselling;
      if (!p.observationCompleted) {
        return "Tick \"Observed for 15 minutes after vaccination\" once the observation period has been completed";
      }
      if (p.reactionsObserved && !p.reactionDetails.trim()) {
        return "Immediate reaction ticked: record the reaction observed and the action taken";
      }
      if (!p.leafletGiven) {
        return "Supply the patient information leaflet provided with the medication";
      }
      if (!c.doseScheduleAdvice) {
        return "Explain the two-dose course and when dose 2 is due";
      }
      if (!c.pregnancyAvoidanceAdvice || !p.pregnancyAdviceGiven) {
        return "Tick \"Advised that pregnancy must be avoided for one month after vaccination\" (tick as not applicable for a child or a male patient)";
      }
      if (!c.immunosuppressedContactAdvice || !p.contactWithImmunosuppressed) {
        return "Advise avoiding contact with high-risk individuals for 4 to 6 weeks if a rash develops";
      }
      if (!c.sideEffectsExplained) {
        return "Explain the expected side effects";
      }
      if (!p.salicylatesAvoided || !c.salicylatesAvoidanceAdvice) {
        return "Advise the patient to avoid salicylates (e.g. aspirin) for 6 weeks after vaccination (Reye's syndrome risk)";
      }
      if (!p.followUpAdviceGiven) {
        return "Give the follow-up advice: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or they become systemically very unwell";
      }
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

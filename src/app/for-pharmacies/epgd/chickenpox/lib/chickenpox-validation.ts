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
        return "Confirm that the patient has no history of chickenpox infection (inclusion criterion), or record a history of chickenpox (exclusion)";
      }
      if (state.eligibility.dose1GivenElsewhere) {
        if (!state.eligibility.dose1ElsewhereDate) {
          return "Dose 1 given elsewhere: record the date of dose 1";
        }
        if (!state.eligibility.dose1ElsewhereBrand.trim()) {
          return "Dose 1 given elsewhere: record the brand of dose 1";
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
        return "Vaccine type must be specified";
      }
      if (!a.doseNumber) {
        return "Record whether this is dose 1 or dose 2 of the course";
      }
      if (a.doseNumber === "2nd" && !state.eligibility.dose1GivenElsewhere) {
        return "Dose 2: record the date and brand of dose 1 on the Eligibility step";
      }
      if (a.doseNumber === "1st" && state.eligibility.dose1GivenElsewhere) {
        return "Dose 1 has already been given elsewhere; this administration is dose 2";
      }
      if (!a.route) {
        return "Route must be selected";
      }
      if (a.vaccine === "Varivax" && a.route === "intramuscular") {
        return "Varivax: subcutaneous injection, usually in the upper arm";
      }
      if (!a.dose1Date) {
        return "Date of administration is required";
      }
      if (a.doseNumber === "2nd") {
        const interval = daysBetween(state.eligibility.dose1ElsewhereDate, a.dose1Date);
        if (interval !== null && interval < 28) {
          return "Second dose must be at least 4 weeks after the first (Varilrix: at least 6 weeks, never less than 4)";
        }
      }
      if (!a.dose1Site.trim()) {
        return "Injection site is required";
      }
      if (!a.dose1Lot.trim()) {
        return "Batch number is required";
      }
      if (!a.expiryDate) {
        return "Expiry date is required";
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
        return "Administered by (name/credentials) is required";
      }
      return null;
    }

    case 6: { // Post-Vaccine
      const p = state.postVaccine;
      const c = state.counselling;
      if (!p.observationCompleted) {
        return "Record that the 15 minute seated observation period was completed";
      }
      if (!p.leafletGiven) {
        return "Supply the patient information leaflet provided with the medication";
      }
      if (!c.doseScheduleAdvice) {
        return "Explain the two-dose course and when dose 2 is due";
      }
      if (!c.pregnancyAvoidanceAdvice || !p.pregnancyAdviceGiven) {
        return "Advise that pregnancy must be avoided for one month post-vaccination";
      }
      if (!c.immunosuppressedContactAdvice || !p.contactWithImmunosuppressed) {
        return "Advise avoiding contact with high-risk individuals for 4 to 6 weeks if a rash develops";
      }
      if (!c.sideEffectsExplained) {
        return "Explain the expected side effects";
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

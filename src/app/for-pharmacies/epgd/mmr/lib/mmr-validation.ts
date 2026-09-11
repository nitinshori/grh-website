// ─── MMR Validation ───
// Aligned to the MMRVaxPRO / Priorix PGD version 004, issued 11 September 2026.

import type { MMRConsultationState } from "./mmr-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import { ageInMonths } from "./mmr-clinical-logic";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: string, to: string): number | null {
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

export function validateStep(step: number, state: MMRConsultationState): string | null {
  const age = state.patient.age;

  switch (step) {
    case 0: {
      // Patient Details
      const base = validatePatientStep(state.patient);
      if (base) return base;
      const months = ageInMonths(state.patient.dateOfBirth);
      if (months !== null && months < 12) {
        return "This PGD is for individuals aged 12 months and over";
      }
      return null;
    }

    case 1: {
      // Consent
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (age !== null && age < 16) {
        if (!state.consentBasis.basis) {
          return "Under 16: record whether consent came from a person with parental responsibility or from the young person as Gillick competent";
        }
        if (state.consentBasis.basis === "parental" && !state.consentBasis.parentName.trim()) {
          return "Record the name of the person with parental responsibility";
        }
        if (state.consentBasis.basis === "parental" && !state.consentBasis.parentRelationship.trim()) {
          return "Record the relationship of the person with parental responsibility to the patient";
        }
        if (state.consentBasis.basis === "gillick" && !state.consentBasis.gillickBasis.trim()) {
          return "Record the basis of the Gillick competence assessment";
        }
      }
      return null;
    }

    case 2: // Eligibility
      if (
        !state.eligibility.bornAfter1970 &&
        !state.eligibility.noPriorTwoDoses &&
        !state.eligibility.healthcareWorker &&
        !state.eligibility.travelToEndemicArea &&
        !state.eligibility.protectionOtherwiseRequired
      ) {
        return "At least one eligibility criterion must be met";
      }
      if (age !== null && age < 18 && !state.eligibility.nhsFreeOfferTold) {
        return "Children eligible for the NHS childhood programme must be told they can be vaccinated free by their GP before any private supply; record that this was done";
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.recentBloodProducts && !state.medicalHistory.bloodProductsAction) {
        return "Blood products or immunoglobulin in the previous 3 months: record whether vaccination was deferred or given now to be repeated after 3 months";
      }
      return null;

    case 4: // Contraindications Review
      return null;

    case 5: {
      // Vaccine Admin
      if (!state.vaccineAdmin.vaccine.trim()) {
        return "Vaccine type must be specified";
      }
      if (!state.vaccineAdmin.doseNumber) {
        return "Dose number (1 or 2) is required";
      }
      if (!state.vaccineAdmin.vaccinationDate) {
        return "Vaccination date is required";
      }
      if (state.vaccineAdmin.doseNumber === "2") {
        if (!state.vaccineAdmin.previousDoseDate) {
          return "Date of the first dose is required to confirm the interval";
        }
        const firstBirthdayMonths = ageInMonths(
          state.patient.dateOfBirth,
          state.vaccineAdmin.previousDoseDate
        );
        if (firstBirthdayMonths !== null && firstBirthdayMonths < 12) {
          return "Doses given before the first birthday do not count towards the course; record this as dose 1";
        }
        const interval = daysBetween(
          state.vaccineAdmin.previousDoseDate,
          state.vaccineAdmin.vaccinationDate
        );
        if (interval !== null) {
          const monthsNow = ageInMonths(
            state.patient.dateOfBirth,
            state.vaccineAdmin.vaccinationDate
          );
          const bothUnder18Months = monthsNow !== null && monthsNow < 18;
          if (bothUnder18Months && interval < 90) {
            return "Where both doses are given under 18 months of age the doses must be at least 3 months apart";
          }
          if (interval < 28) {
            return "Doses must be at least 4 weeks apart";
          }
        }
      }
      if (state.vaccineAdmin.doseNumber === "1" && !state.vaccineAdmin.nextDoseDue) {
        return "Record the date the next dose is due";
      }
      if (!state.vaccineAdmin.injectionSite.trim()) {
        return "Injection site is required";
      }
      if (!state.vaccineAdmin.lotNumber.trim()) {
        return "Batch number is required";
      }
      if (!state.vaccineAdmin.administeredBy.trim()) {
        return "Administered by (name/credentials) is required";
      }
      return null;
    }

    case 6: // Post-Vaccine and counselling
      if (!state.counselling.sideEffectsExplained) {
        return "Confirm information on common side effects and when to seek further medical advice was provided";
      }
      if (!state.counselling.pilSupplied) {
        return "Confirm the patient information leaflet was supplied";
      }
      if (state.vaccineAdmin.doseNumber === "1" && !state.counselling.reviewScheduleAdvice) {
        return "Confirm the patient was told when the second dose is due";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

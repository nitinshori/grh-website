// ─── Meningitis B Validation ───

import type { MeningitiBConsultationState } from "./meningitis-b-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import { calculateAgeInMonths, hasIndication, daysSince, isIncreasedRisk, minimumIntervalDays } from "./meningitis-b-clinical-logic";

export function validateStep(step: number, state: MeningitiBConsultationState): string | null {
  const ageMonths = calculateAgeInMonths(state.patient.dateOfBirth);
  const ageYears = state.patient.age;
  const underSixteen = ageYears !== null && ageYears < 16;

  switch (step) {
    case 0: { // Patient Details
      const base = validatePatientStep(state.patient);
      if (base) return base;
      if (ageMonths !== null && ageMonths < 2) {
        return "Aged under 2 months is an exclusion. Bexsero is licensed from 2 months; direct the family to the NHS routine infant programme.";
      }
      return null;
    }

    case 1: { // Consent
      const base = validateConsentStep(state.consent);
      if (base) return base;
      if (underSixteen) {
        if (!state.medicalHistory.consentBasis) {
          return "Under 16: record whether consent came from a person with parental responsibility or from a Gillick competent young person. Neither available is an exclusion.";
        }
        if (!state.medicalHistory.consentGiverDetails.trim()) {
          return "Under 16: record the consent giver's name and relationship, or the basis of the Gillick competence assessment";
        }
        if (!state.medicalHistory.parentPresent) {
          return "Under 16: a person with parental responsibility, or a suitable adult authorised by them, must be present for the vaccination (inclusion criterion)";
        }
      }
      return null;
    }

    case 2: // Indication
      if (!hasIndication(state)) {
        return "Record the PGD indication: routine doses missed or presenting outside the NHS programme, an adolescent or student seeking protection, or an adult at increased risk";
      }
      return null;

    case 3: // Medical History
      return null;

    case 4: // Contraindications Review
      return null;

    case 5: { // Vaccine Admin
      const a = state.vaccineAdmin;
      if (!a.product) {
        return "Select the product: Bexsero (from 2 months) or Trumenba (from 10 years)";
      }
      if (a.product === "trumenba" && ageYears !== null && ageYears < 10) {
        return "Trumenba has no licence below 10 years. Use Bexsero or refer.";
      }
      if (a.product === "bexsero" && ageMonths !== null && ageMonths < 2) {
        return "Bexsero is licensed from 2 months of age";
      }
      if (a.product === "trumenba" && !a.trumenbaSchedule) {
        return "Trumenba: select the schedule (routine 2 dose, or 3 dose for individuals at increased risk)";
      }
      if (a.product === "trumenba" && a.trumenbaSchedule === "increased-risk" && !isIncreasedRisk(state)) {
        return "Trumenba 3 dose schedule is for individuals at increased risk: asplenia, a complement disorder, complement inhibitor therapy or laboratory staff must be recorded on the indication step. Otherwise use the routine 2 dose schedule.";
      }
      if (!a.doseNumber) {
        return "Record which dose in the course this administration represents";
      }
      if (a.product === "trumenba" && a.doseNumber === "booster-12-months") {
        return "Booster at 12 months applies to the Bexsero infant course only";
      }
      if (a.product === "trumenba" && a.trumenbaSchedule === "routine" && a.doseNumber === "3rd") {
        return "Trumenba routine schedule is 2 doses at 0 and 6 months";
      }
      if (a.product === "bexsero" && a.doseNumber === "3rd") {
        return "Bexsero courses are 2 doses (plus a booster at 12 months for the infant course); select 1st, 2nd or Booster at 12 months";
      }
      if (a.product === "bexsero" && a.doseNumber === "booster-12-months" && ageMonths !== null && ageMonths < 12) {
        return "The Bexsero booster is given at 12 months of age";
      }
      if (a.product === "bexsero" && a.doseNumber === "booster-12-months" && ageMonths !== null && ageMonths >= 24) {
        return "Booster at 12 months is the Bexsero infant course booster (12 months to under 2 years). Aged 2 years and over: 2 doses at least 1 month apart; select 1st or 2nd dose.";
      }
      if (a.product === "bexsero" && ageMonths !== null && ageMonths >= 12 && ageMonths < 24) {
        if (!a.dosesInFirstYear) {
          return "Bexsero, 12 months to under 2 years: record how many doses were given in the first year";
        }
        if (a.dosesInFirstYear === "2" && a.doseNumber !== "booster-12-months") {
          return "Two doses in the first year: this child needs the booster at 12 months only; select Booster at 12 months";
        }
        if (a.dosesInFirstYear !== "2" && a.doseNumber === "booster-12-months") {
          return "Fewer than 2 doses in the first year: 2 further doses at least 4 weeks apart; select 1st or 2nd dose";
        }
      }
      // Interval since the previous dose.
      if (a.doseNumber && a.doseNumber !== "1st") {
        if (!a.previousDoseDate) {
          return "Record the date of the previous dose in this course";
        }
        const since = daysSince(a.previousDoseDate);
        if (since === null) return "Previous dose date is not a valid date";
        if (since < 0) return "Previous dose date cannot be in the future";
        const min = minimumIntervalDays(a.product, a.trumenbaSchedule, a.doseNumber);
        if (min && since < min.days) {
          return `Too soon: this dose is due ${min.label}. The previous dose was ${since} days ago; not before ${min.days} days.`;
        }
      }
      if (!a.vaccinationDate1) {
        return "Date of administration is required";
      }
      if (!a.injectionSite1.trim()) {
        return "Anatomical site is required";
      }
      if (ageMonths !== null && ageMonths <= 12 && !a.injectionSite1.toLowerCase().includes("thigh")) {
        return "Infants aged 1 year and under: use the anterolateral thigh";
      }
      if (ageMonths !== null && ageMonths > 12 && a.injectionSite1.toLowerCase().includes("thigh")) {
        return "Older children and adults: use the deltoid";
      }
      if (!a.lotNumber1.trim()) {
        return "Batch number is required";
      }
      if (!a.expiryDate) {
        return "Expiry date is required";
      }
      {
        const exp = daysSince(a.expiryDate);
        if (exp === null) return "Expiry date is not a valid date";
        if (exp > 0) return "This batch has expired. Do not use it.";
      }
      if (!a.courseComplete && !a.vaccinationDate2) {
        return "Book the next dose in the course at this appointment and record when it is due (or mark the course complete)";
      }
      if (!a.administeredBy.trim()) {
        return "Name of immuniser is required";
      }
      return null;
    }

    case 6: { // Post-Vaccine
      const p = state.postVaccine;
      const c = state.counselling;
      if (!p.observationCompleted) {
        return "Record that the 15 minute seated observation period was completed";
      }
      if (!p.writtenRecordGiven) {
        return "Offer the patient information leaflet and a written record showing the product, the date and when the next dose is due";
      }
      if (state.vaccineAdmin.product === "bexsero" && ageMonths !== null && ageMonths < 12 && !p.paracetamolAdvice) {
        return "Infant under one year given Bexsero: give the paracetamol schedule and written paracetamol advice";
      }
      if (!c.doseScheduleAdvice) {
        return "Explain that the course must be completed for full protection and confirm when the next dose is due";
      }
      if (!c.commonReactionsAdvice || !c.sideEffectsExplained) {
        return "Counsel on expected side effects and their management";
      }
      if (!p.yellowCardAdvice) {
        return "Counsel on Yellow Card reporting";
      }
      if (!c.meningitisWarningSignsAdvice || !p.meningitisSignsAdvice) {
        return "Explain that the vaccine does not protect against all causes of meningitis and septicaemia, and the signs to seek urgent help for";
      }
      return null;
    }

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

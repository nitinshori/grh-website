// ─── Hair Loss (Finasteride) Validation ───

import type { HLConsultationState } from "./hair-loss-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: HLConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      {
        const base = validatePatientStep(state.patient, { minAge: 18, maxAge: 65 });
        if (base) return base;
        if (!state.patient.sexRecorded) return "Record the patient's sex (this PGD is for male patients only)";
        if (state.patient.sexRecorded !== "male") return "This PGD is for male patients only; finasteride 1 mg is not indicated for women";
        // The PGD record must contain name, address, date of birth and GP.
        if (!state.patient.address.trim()) return "Patient address is required for the PGD record";
        if (!state.patient.gpPractice.trim()) return "GP practice is required for the PGD record";
        return null;
      }

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Assessment
      {
        const n = state.clinicalAssessment.norwoodHamiltonScale;
        if (n === null || !Number.isInteger(n) || n < 1 || n > 7) {
          return "Norwood-Hamilton Scale score is required and must be a whole number from 1 to 7";
        }
      }
      if (!state.clinicalAssessment.hasAndrogeneticAlopecia) {
        return "Please confirm patient has androgenetic alopecia";
      }
      if (!state.clinicalAssessment.alopeciaOnset.trim()) {
        return "Alopecia onset details are required";
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.prostateCancer && !state.medicalHistory.prostateCancerDetail.trim()) {
        return "Record the prostate cancer details";
      }
      if (state.medicalHistory.psaAbnormalities && !state.medicalHistory.psaAbnormaltiesDetail.trim()) {
        return "Record the PSA details";
      }
      if (!state.medicalHistory.questionsAsked) {
        return "Confirm that each of the exclusion questions above has been put to the patient";
      }
      return null;

    case 4: // Contraindications
      if (state.contraindications.depressiveMood) {
        if (!state.contraindications.depressiveMoodDetail.trim()) return "Record the details of the mood symptoms";
        if (!state.contraindications.moodProceedReason.trim()) {
          return "Record the clinical reason for proceeding despite current depression or mood symptoms (or refer)";
        }
      }
      if (!state.contraindications.questionsAsked) {
        return "Confirm that the mood and suicidal ideation questions have been put to the patient";
      }
      return null;

    case 5: // Medicine Supply
      if (!state.medicineSupply.finasteride1mgOd) {
        return "Please confirm finasteride 1 mg once daily supply";
      }
      if (!state.medicineSupply.quantityMonths) {
        return "Please record the months of treatment supplied (3 to 12 months between reviews)";
      }
      {
        const months = Number(state.medicineSupply.quantityMonths);
        const tablets = state.medicineSupply.tabletsSupplied;
        if (tablets === null || !Number.isInteger(tablets) || tablets <= 0) {
          return "Record the number of tablets supplied";
        }
        if (tablets < months * 28 || tablets > months * 31) {
          return `${tablets} tablets does not match ${months} months at one tablet daily (expected ${months * 28} to ${months * 31})`;
        }
      }
      if (!state.medicineSupply.brand.trim()) {
        return "Record the brand dispensed (the PGD record requires name and brand)";
      }
      if (!state.medicineSupply.partnerNotified) {
        return "Please confirm the patient has been advised that tablets must not be handled by women who are or may become pregnant";
      }
      if (!state.medicineSupply.condomAdvice) {
        return "Please confirm condom advice has been given (if a female partner is pregnant or likely to become pregnant)";
      }
      if (!state.medicineSupply.willMonitorSE) {
        return "Please confirm patient will monitor for side effects";
      }
      if (!state.medicineSupply.understandsPSAEffect) {
        return "Please confirm patient understands PSA effect";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.effectOnsetTime ||
        !state.counselling.hairLossResumesStopped ||
        !state.counselling.sexualSideEffects ||
        !state.counselling.moodChanges ||
        !state.counselling.annualReview ||
        !state.counselling.reportChanges ||
        !state.counselling.breastChanges ||
        !state.counselling.expectations
      ) {
        return "All counselling points must be covered";
      }
      if (!state.counselling.pilAndCardSupplied) {
        return "Please confirm the patient information leaflet and the patient card from the pack have been supplied";
      }
      return null;

    case 7: // Summary
      {
        const base = validateSummaryStep(state.summary);
        if (base) return base;
        if (!state.summary.consultationDate) return "Consultation date is required";
        return null;
      }

    default:
      return null;
  }
}

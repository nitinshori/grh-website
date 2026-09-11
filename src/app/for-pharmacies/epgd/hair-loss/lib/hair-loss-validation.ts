// ─── Hair Loss (Finasteride) Validation ───

import type { HLConsultationState } from "./hair-loss-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: HLConsultationState, stepIndex: number): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      {
        const base = validatePatientStep(state.patient, { minAge: 18, maxAge: 65 });
        if (base) return base;
        if (!state.patient.sexRecorded) return "Patient sex: select Male, or Female or other (this PGD is for male patients only)";
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
          return "Norwood-Hamilton Scale: select the stage (1 to 7) that best matches the pattern of hair loss";
        }
      }
      if (!state.clinicalAssessment.hasAndrogeneticAlopecia) {
        return "Tick Androgenetic alopecia (male-pattern baldness) confirmed: this PGD is only for male-pattern hair loss";
      }
      if (!state.clinicalAssessment.alopeciaOnset.trim()) {
        return "Onset of alopecia: record the duration and pattern";
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.prostateCancer && !state.medicalHistory.prostateCancerDetail.trim()) {
        return "Prostate cancer details: record the diagnosis date, treatment and current status";
      }
      if (state.medicalHistory.psaAbnormalities && !state.medicalHistory.psaAbnormaltiesDetail.trim()) {
        return "PSA details: record the PSA value, date and GP action";
      }
      if (!state.medicalHistory.questionsAsked) {
        return "Tick the confirmation at the bottom: I have asked the patient every question above (ticked boxes are Yes, unticked boxes are No)";
      }
      return null;

    case 4: // Contraindications
      if (state.contraindications.depressiveMood) {
        if (!state.contraindications.depressiveMoodDetail.trim()) return "Details of mood symptoms: record when, severity and current treatment";
        if (!state.contraindications.moodReferred && !state.contraindications.moodProceedReason.trim()) {
          return "Clinical reason for proceeding: record why supply is appropriate despite the mood symptoms, or tick Not supplying: referring the patient instead";
        }
      }
      if (!state.contraindications.questionsAsked) {
        return "Tick the confirmation at the bottom: I have asked the patient about mood, depression and suicidal ideation";
      }
      return null;

    case 5: // Medicine Supply
      if (!state.medicineSupply.finasteride1mgOd) {
        return "Tick Supply finasteride 1 mg tablets, 1 mg orally once daily";
      }
      if (!state.medicineSupply.quantityMonths) {
        return "Months of treatment supplied between reviews: select 3, 6, 9 or 12 months";
      }
      {
        const months = Number(state.medicineSupply.quantityMonths);
        const tablets = state.medicineSupply.tabletsSupplied;
        if (tablets === null || !Number.isInteger(tablets) || tablets <= 0) {
          return "Tablets supplied: select the number of tablets";
        }
        if (tablets < months * 28 || tablets > months * 31) {
          return `Tablets supplied: ${tablets} tablets does not match ${months} months at one tablet daily (expected ${months * 28} to ${months * 31})`;
        }
      }
      if (!state.medicineSupply.brand.trim()) {
        return "Brand dispensed: record the brand (the PGD record requires name and brand)";
      }
      if (!state.medicineSupply.partnerNotified) {
        return "Tick Tablets must not be handled by women who are or may become pregnant once the patient has been advised";
      }
      if (!state.medicineSupply.condomAdvice) {
        return "Tick Condom recommended if a female partner is pregnant or likely to become pregnant once the patient has been advised";
      }
      if (!state.medicineSupply.willMonitorSE) {
        return "Tick Patient will monitor for sexual side effects once the patient has been advised";
      }
      if (!state.medicineSupply.understandsPSAEffect) {
        return "Tick Patient understands finasteride can affect PSA levels once the patient has been advised";
      }
      return null;

    case 6: // Counselling
      {
        const c = state.counselling;
        const points: [boolean, string][] = [
          [c.effectOnsetTime, "Continuous use for 3 to 6 months before stabilisation"],
          [c.hairLossResumesStopped, "If treatment is stopped, the beneficial effects begin to reverse"],
          [c.sexualSideEffects, "Sexual side effects possible"],
          [c.moodChanges, "Psychological side effects: report any mood changes"],
          [c.breastChanges, "Promptly report any changes in breast tissue"],
          [c.annualReview, "Review: first review after 3 to 6 months"],
          [c.expectations, "Realistic expectations and safe use explained"],
          [c.reportChanges, "Seek medical advice if adverse effects are experienced"],
        ];
        const missing = points.find(([done]) => !done);
        if (missing) return `Counselling point not yet ticked: "${missing[1]}". Tick each point once it has been covered with the patient.`;
      }
      if (!state.counselling.pilAndCardSupplied) {
        return "Tick Patient information leaflet and the patient card included in the pack supplied";
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

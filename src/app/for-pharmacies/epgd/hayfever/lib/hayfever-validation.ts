// ─── Hayfever Validation ───
// Aligned to the Fexofenadine and/or Dymista Allergic Rhinitis PGD,
// version 003, issued 11 September 2026.

import type { HayfeverConsultationState } from "./hayfever-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

const PGD_MIN_AGE = 12;

export function validateStep(state: HayfeverConsultationState, step: number): string | null {
  const medicine = state.medicineSupply.medicineSelected;
  const fexofenadine = medicine === "fexofenadine" || medicine === "combination";
  const dymista = medicine === "dymista" || medicine === "combination";

  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: PGD_MIN_AGE });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.symptomSeverity) {
        return "Please select symptom severity";
      }
      if (!state.assessment.seasonalOrPerennial) {
        return "Please specify seasonal or perennial symptoms";
      }
      return null;

    case 3:
      return null; // Optional

    case 4:
      return null; // Optional

    case 5:
      if (!medicine) {
        return "Please select medicine to supply";
      }
      if (fexofenadine && !state.assessment.previousDiagnosisOrRecurrence) {
        return "Fexofenadine requires a previous diagnosis of allergic rhinitis or recurrence of known symptoms (inclusion criterion). Confirm this on the Symptom Assessment step or choose Dymista.";
      }
      if (fexofenadine && !state.medicineSupply.fexofenadineBrand) {
        return "Please record the fexofenadine brand supplied (Allevia, P, or generic, POM)";
      }
      if (dymista && state.assessment.symptomSeverity === "mild") {
        return "Dymista is for moderate to severe allergic rhinitis requiring dual therapy. Mild symptoms do not meet the inclusion criteria.";
      }
      if (dymista && !state.medicineSupply.dualTherapyRequired) {
        return "Please confirm dual therapy is required (monotherapy with an intranasal antihistamine or corticosteroid is not sufficient)";
      }
      if (!state.medicineSupply.dosageConfirmed) {
        return "Please confirm dosage with patient";
      }
      return null;

    case 6:
      if (!state.counselling.allergenAvoidance) {
        return "Please confirm allergen avoidance counselling";
      }
      if (fexofenadine && !state.counselling.alcoholSedatingAdvice) {
        return "Please confirm the patient has been advised to avoid alcohol and other sedating antihistamines";
      }
      if (fexofenadine && !state.counselling.drowsinessAdvice) {
        return "Please confirm the patient is aware fexofenadine is non-sedating but occasional drowsiness may still occur";
      }
      if (dymista && !state.counselling.nasalSprayTechnique) {
        return "Please confirm correct nasal spray technique has been advised";
      }
      if (dymista && !state.counselling.sideEffectsAdvice) {
        return "Please confirm counselling on possible side effects and the need for ongoing review if Dymista is used long-term";
      }
      if (!state.counselling.followUpAdvice) {
        return "Please confirm follow-up advice has been given (seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or the patient becomes systemically very unwell)";
      }
      if (!state.counselling.pilSupplied) {
        return "Please confirm the patient information leaflet has been supplied";
      }
      return null;

    case 7:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

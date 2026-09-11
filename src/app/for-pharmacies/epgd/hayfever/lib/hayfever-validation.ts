// ─── Hayfever Validation ───
// Aligned to the Fexofenadine and/or Dymista Allergic Rhinitis PGD,
// version 005, issued 11 September 2026.

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
        return "Select the symptom severity";
      }
      if (!state.assessment.seasonalOrPerennial) {
        return "Select the temporal pattern (seasonal, perennial or both)";
      }
      return null;

    case 3:
      return null; // Optional

    case 4:
      return null; // Optional

    case 5:
      if (!medicine) {
        return "Select the medicine to supply";
      }
      if (fexofenadine && !state.assessment.previousDiagnosisOrRecurrence) {
        return "Fexofenadine requires a previous diagnosis of allergic rhinitis or recurrence of known symptoms (inclusion criterion). Go back to the Symptom Assessment step and tick 'Previous diagnosis of allergic rhinitis, or recurrence of known symptoms', or choose Dymista.";
      }
      if (fexofenadine && !state.medicineSupply.fexofenadineBrand) {
        return "Select the fexofenadine 120 mg brand supplied (Allevia or generic)";
      }
      if (dymista && state.assessment.symptomSeverity === "mild") {
        return "Dymista is for moderate to severe allergic rhinitis requiring dual therapy. Mild symptoms do not meet the inclusion criteria.";
      }
      if (dymista && !state.medicineSupply.dualTherapyRequired) {
        return "Tick 'Dual therapy required' (monotherapy with an intranasal antihistamine or corticosteroid is not sufficient). If dual therapy is not needed, Dymista does not meet its inclusion criteria";
      }
      // Quantity supplied is a required record; the tool used to print the
      // document's ceiling as prose instead (adversarial review, 11 Sep 2026).
      if (fexofenadine) {
        const q = state.medicineSupply.fexofenadineQuantity;
        if (q === null || q < 1) return "Enter the number of fexofenadine 120 mg tablets supplied (1 to 30)";
        if (!Number.isInteger(q)) return "Fexofenadine quantity must be a whole number of tablets";
        if (q > 30) return "Maximum 30 fexofenadine 120 mg tablets (1 month supply) under this PGD";
      }
      if (dymista) {
        const b = state.medicineSupply.dymistaBottles;
        if (b === null || b < 1) return "Record the Dymista bottle supplied (one 23 g bottle)";
        if (b > 1) return "This PGD authorises one Dymista bottle (23 g, approx. 120 sprays) per supply";
      }
      if (!state.medicineSupply.dosageConfirmed) {
        return "Tick 'Dosage confirmed with patient'";
      }
      return null;

    case 6:
      if (!state.counselling.allergenAvoidance) {
        return "Tick 'Allergen avoidance measures discussed'";
      }
      if (fexofenadine && !state.counselling.alcoholSedatingAdvice) {
        return "Tick 'Avoid alcohol and other sedating antihistamines (fexofenadine)'";
      }
      if (fexofenadine && !state.counselling.drowsinessAdvice) {
        return "Tick 'Non-sedating antihistamine, but occasional drowsiness may still occur (fexofenadine)'";
      }
      if (dymista && !state.counselling.nasalSprayTechnique) {
        return "Tick 'Correct nasal spray technique advised (Dymista)'";
      }
      if (dymista && !state.counselling.sideEffectsAdvice) {
        return "Tick 'Possible side effects and need for ongoing review if used long-term (Dymista)'";
      }
      if (!state.counselling.followUpAdvice) {
        return "Tick 'Follow-up advice given'";
      }
      if (!state.counselling.pilSupplied) {
        return "Tick 'Patient information leaflet (PIL) supplied with the medication'";
      }
      return null;

    case 7:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

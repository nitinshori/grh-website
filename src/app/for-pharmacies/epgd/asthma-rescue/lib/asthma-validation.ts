// ─── Asthma Rescue (Salbutamol) Validation ───

import type { AsthmaConsultationState } from "./asthma-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(state: AsthmaConsultationState, step: number): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient);

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Asthma Assessment
      if (!state.assessment.hasExistingDiagnosis) {
        return "Please confirm patient has existing asthma diagnosis";
      }
      if (!state.assessment.normallyUsesSABA) {
        return "Please confirm patient normally uses SABA";
      }
      if (!state.assessment.reasonForSupply) {
        return "Please specify reason for supply";
      }
      return null;

    case 3: // Medical History
      // Optional step - always valid
      return null;

    case 4: // Contraindications (Red Flags)
      // If any hard stop is present, validation fails but is caught by canProceed logic
      return null;

    case 5: // Medicine Supply
      if (!state.medicineSupply.salbutamol100mcgPMDI) {
        return "Please confirm salbutamol supply details";
      }
      if (!state.medicineSupply.twoAsDoseUnit) {
        return "Please confirm dosing unit";
      }
      if (!state.medicineSupply.maxEightPuffsDailyUnderstood) {
        return "Patient understanding of maximum daily dose must be confirmed";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.relieverNotPreventer ||
        !state.counselling.inhalerTechniqueDemonstration ||
        !state.counselling.rinseMouthAfterUse
      ) {
        return "Key counselling points must be confirmed";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

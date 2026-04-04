import type { ColdSoresConsultationState } from "./cold-sores-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: ColdSoresConsultationState): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Symptom Assessment
      if (!state.symptomAssessment.isRecurrent && !state.symptomAssessment.isFirstEpisode) {
        return "Please confirm whether this is recurrent or first episode";
      }
      if (!state.symptomAssessment.currentSymptoms.trim()) {
        return "Please describe current symptoms";
      }
      if (state.symptomAssessment.prodromeSigns && state.symptomAssessment.hoursFromProdrome === null) {
        return "Please enter hours since prodrome";
      }
      return null;

    case 3: // Medical History
      if (state.medicalHistory.renalImpairment && !state.medicalHistory.renalFunction.trim()) {
        return "Please describe renal function status";
      }
      return null;

    case 4: // Contraindications
      return null;

    case 5: // Medicine Supply
      if (!state.medicineSupply.doseChoice) return "Please select aciclovir dose";
      if (state.medicineSupply.quantity === null) return "Please enter quantity to supply";
      return null;

    case 6: // Counselling
      if (
        !state.counselling.startASAP ||
        !state.counselling.completeCourse ||
        !state.counselling.contagious ||
        !state.counselling.avoidSharing ||
        !state.counselling.sunExposure
      ) {
        return "Please confirm all counselling points have been covered";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

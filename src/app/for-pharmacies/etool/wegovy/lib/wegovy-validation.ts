// ─── Wegovy Step Validation ───

import type { WegovyConsultationState } from "./wegovy-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateWeightAssessmentStep,
  validateMedicalHistoryStep,
  validateMedicationsStep,
  validateObservationsStep,
  validateContraindicationsStep,
  validateDoseSelectionStep,
  validateCounsellingStep,
  validateSummaryStep,
} from "./wegovy-clinical-logic";

export function validateStep(stepNumber: number, state: WegovyConsultationState): string | null {
  switch (stepNumber) {
    case 0:
      return validatePatientStep(state);
    case 1:
      return validateConsentStep(state);
    case 2:
      return validateWeightAssessmentStep(state);
    case 3:
      return validateMedicalHistoryStep(state);
    case 4:
      return validateMedicationsStep(state);
    case 5:
      return validateObservationsStep(state);
    case 6:
      return validateContraindicationsStep(state);
    case 7:
      return validateDoseSelectionStep(state);
    case 8:
      return validateCounsellingStep(state);
    case 9:
      return validateSummaryStep(state);
    default:
      return null;
  }
}

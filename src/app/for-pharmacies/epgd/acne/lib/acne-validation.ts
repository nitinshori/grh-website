import type { AcneConsultationState } from "./acne-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: AcneConsultationState): string | null {
  switch (stepIndex) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Acne Assessment
      if (!state.assessment.severity) return "Please select acne severity";
      if (
        !state.assessment.comedones &&
        !state.assessment.inflammatoryPapules &&
        !state.assessment.pustules &&
        !state.assessment.nodalCystic
      ) {
        return "Please select at least one acne manifestation";
      }
      if (!state.assessment.affectedArea.trim()) return "Please describe affected area";
      return null;

    case 3: // Medical History
      if (!state.medicalHistory.allergies.trim()) return "Please record allergy status";
      return null;

    case 4: // Contraindications
      return null;

    case 5: // Medicine Selection
      if (!state.medicineSelection.medicineChoice) return "Please select a medicine";
      if (
        state.assessment.severity === "moderate" &&
        state.medicineSelection.inadequateResponse &&
        !state.medicineSelection.addLymecycline
      ) {
        return "Please confirm whether to add Lymecycline";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.improvementTimeline ||
        !state.counselling.photosensitivity ||
        !state.counselling.washingAdvice ||
        !state.counselling.productAdvice ||
        !state.counselling.courseCompletion
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

import type { AcneConsultationState } from "./acne-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { isDuac, isEpiduo } from "./acne-clinical-logic";

export function validateStep(stepIndex: number, state: AcneConsultationState): string | null {
  const choice = state.medicineSelection.medicineChoice;

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
      if (!choice) return "Please select a medicine";
      if (choice === "duac-5" && !state.medicineSelection.strengthRationale) {
        return "Please record the clinical reason for choosing the 10 mg/g + 50 mg/g strength";
      }
      if (state.medicineSelection.repeatCourse && !state.medicineSelection.repeatCourseReviewed) {
        return "A review is required for repeat courses (maximum 12 weeks continuous use). Please confirm the review has been completed.";
      }
      return null;

    case 6: // Counselling
      if (
        !state.counselling.improvementTimeline ||
        !state.counselling.photosensitivity ||
        !state.counselling.washingAdvice ||
        !state.counselling.productAdvice ||
        !state.counselling.courseCompletion ||
        !state.counselling.applicationAdvice ||
        !state.counselling.irritationAdvice ||
        !state.counselling.followUpAdvice ||
        !state.counselling.scarringAdvice
      ) {
        return "Please confirm all counselling points have been covered";
      }
      if (isDuac(choice) && !state.counselling.storageAdvice) {
        return "Please confirm storage advice for benzoyl peroxide / clindamycin gel (store below 25 C once dispensed, use within 2 months)";
      }
      if (isEpiduo(choice) && !state.counselling.bleachingAdvice) {
        return "Please confirm bleaching and cosmetics advice for adapalene / benzoyl peroxide gel";
      }
      if (!state.counselling.pilSupplied) {
        return "Please confirm the patient information leaflet has been supplied";
      }
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

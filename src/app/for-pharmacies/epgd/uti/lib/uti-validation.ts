import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import type {
  UTIPatientDetails,
  UTISymptoms,
  UTIMedicalHistory,
  UTIObservations,
  UTIMedicineSelection,
  UTICounselling,
} from "./uti-types";

// ─── Step-Specific Validation ───

export function validateUTIPatientStep(patient: UTIPatientDetails): string | null {
  const baseError = validatePatientStep(patient, {
    minAge: 16,
    maxAge: 64,
    requireFemale: true,
    femaleConfirmed: patient.femaleConfirmed,
  });
  if (baseError) return baseError;
  return null;
}

export function validateUTIConsentStep(consent: any): string | null {
  return validateConsentStep(consent);
}

export function validateUTISymptomStep(symptoms: UTISymptoms): string | null {
  // At least one symptom must be checked (dysuria OR frequency OR urgency)
  const hasMainSymptom = symptoms.dysuria || symptoms.frequency || symptoms.urgency;

  if (!hasMainSymptom) {
    return "Please select at least one main symptom: dysuria, frequency, or urgency";
  }

  return null;
}

export function validateUTIMedicalHistoryStep(): string | null {
  // Medical history is review/checkbox. No mandatory fields to validate
  // User must review all conditions but can proceed with none checked
  return null;
}

export function validateUTIObservationsStep(): string | null {
  // Observations are optional - user may not have equipment
  // No validation required
  return null;
}

export function validateUTIRedFlagsStep(): string | null {
  // Red flags screen is informational/review. No validation needed
  return null;
}

export function validateUTIMedicineSelectionStep(medicineSelection: UTIMedicineSelection): string | null {
  if (!medicineSelection.medicine) {
    return "Please select a medicine";
  }

  if (!medicineSelection.dose) {
    return "Please select a dose";
  }

  return null;
}

export function validateUTICounsellingStep(counselling: UTICounselling): string | null {
  // All counselling points should be checked before proceeding
  const requiredCounselling = [
    counselling.completeCourse,
    counselling.hydrationAdvice,
    counselling.symptomsToReturn,
  ];

  if (!requiredCounselling.every(Boolean)) {
    return "Please confirm all counselling points have been given";
  }

  return null;
}

export function validateUTISummaryStep(summary: any): string | null {
  return validateSummaryStep(summary);
}

// ─── All-steps validation (for determining if Next button should be active) ───

export function validateUTIStep(
  stepIndex: number,
  state: {
    patient: UTIPatientDetails;
    consent: any;
    symptoms: UTISymptoms;
    medicalHistory: UTIMedicalHistory;
    observations: UTIObservations;
    medicineSelection: UTIMedicineSelection;
    counselling: UTICounselling;
    summary: any;
  }
): string | null {
  switch (stepIndex) {
    case 0:
      return validateUTIPatientStep(state.patient);
    case 1:
      return validateUTIConsentStep(state.consent);
    case 2:
      return validateUTISymptomStep(state.symptoms);
    case 3:
      return validateUTIMedicalHistoryStep();
    case 4:
      return validateUTIObservationsStep();
    case 5:
      return validateUTIRedFlagsStep();
    case 6:
      return validateUTIMedicineSelectionStep(state.medicineSelection);
    case 7:
      return validateUTICounsellingStep(state.counselling);
    case 8:
      return validateUTISummaryStep(state.summary);
    default:
      return null;
  }
}

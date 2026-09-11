import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { isNitrofurantoinContraindicated } from "./uti-clinical-logic";
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
  // PGD v006 inclusion: two or more of dysuria, new nocturia, frequency, urgency
  const coreSymptomCount = [
    symptoms.dysuria,
    symptoms.nocturia,
    symptoms.frequency,
    symptoms.urgency,
  ].filter(Boolean).length;

  if (coreSymptomCount < 2) {
    return "Two or more of dysuria, new nocturia, frequency or urgency must be present. Where only one is present, refer rather than supply";
  }

  if (!symptoms.duration) {
    return "Please record how long the symptoms have been present";
  }

  return null;
}

export function validateUTIMedicalHistoryStep(medicalHistory: UTIMedicalHistory): string | null {
  // PGD v006 renal row: the question is asked in set terms and the answer
  // recorded. No default: an unasked question is not a NO.
  if (!medicalHistory.renalImpairment && !medicalHistory.kidneyDisease) {
    return "Ask the kidney question in the PGD's words and record the answer (No / Does not know / Yes)";
  }
  // PGD v006: ask both recurrent UTI questions and record both answers
  if (!medicalHistory.utiEpisodesLast6Months) {
    return "Please record the number of UTI episodes in the last 6 months";
  }
  if (!medicalHistory.utiEpisodesLast12Months) {
    return "Please record the number of UTI episodes in the last 12 months";
  }
  return null;
}

export function validateUTIObservationsStep(): string | null {
  // Observations are optional - user may not have equipment
  // No validation required
  return null;
}

export function validateUTIRedFlagsStep(symptoms: UTISymptoms): string | null {
  // PGD v006: the record must show the Appendix 1 red flags were asked about
  if (!symptoms.redFlagsAsked) {
    return "Confirm the Appendix 1 red flags have been asked about before supplying anything";
  }
  return null;
}

export function validateUTIMedicineSelectionStep(
  medicineSelection: UTIMedicineSelection,
  medicalHistory?: UTIMedicalHistory
): string | null {
  if (!medicineSelection.medicine) {
    return "Please select a medicine";
  }

  if (!medicineSelection.dose) {
    return "Please select a dose";
  }

  if (medicineSelection.duration !== "3 days") {
    return "The course is 3 days. One course per episode";
  }

  if (medicineSelection.medicine === "trimethoprim" && !medicineSelection.trimethoprimReason) {
    return "Trimethoprim is second line only. Record why nitrofurantoin is unsuitable for this patient";
  }

  // "Contraindicated" must match the history recorded on the medical history
  // step; the record cannot state a contraindication the history denies.
  if (
    medicineSelection.medicine === "trimethoprim" &&
    medicineSelection.trimethoprimReason === "contraindicated" &&
    medicalHistory &&
    !isNitrofurantoinContraindicated(medicalHistory)
  ) {
    return "No nitrofurantoin contraindication is recorded on the medical history step. Go back and record it, or choose a different reason";
  }

  return null;
}

export function validateUTICounsellingStep(
  counselling: UTICounselling,
  medicine: UTIMedicineSelection["medicine"]
): string | null {
  // All counselling points in the PGD must be given and recorded before proceeding
  const requiredCounselling = [
    counselling.completeCourse,
    counselling.howToTake,
    counselling.hydrationAdvice,
    counselling.stopAndSeekAdvice,
    counselling.symptomsToReturn,
    counselling.immediateActionAdvice,
  ];
  if (medicine === "nitrofurantoin") {
    requiredCounselling.push(counselling.darkUrine);
  }

  if (!requiredCounselling.every(Boolean)) {
    return "Please confirm all counselling points and the 48 hour safety netting have been given";
  }
  if (!counselling.pilSupplied) {
    return "Confirm the patient information leaflet was supplied with the product";
  }
  if (!counselling.disposalAdvice) {
    return "Confirm the patient was advised to return any unused medicine to a pharmacy";
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
      return validateUTIMedicalHistoryStep(state.medicalHistory);
    case 4:
      return validateUTIObservationsStep();
    case 5:
      return validateUTIRedFlagsStep(state.symptoms);
    case 6:
      return validateUTIMedicineSelectionStep(state.medicineSelection, state.medicalHistory);
    case 7:
      return validateUTICounsellingStep(state.counselling, state.medicineSelection.medicine);
    case 8:
      return validateUTISummaryStep(state.summary);
    default:
      return null;
  }
}

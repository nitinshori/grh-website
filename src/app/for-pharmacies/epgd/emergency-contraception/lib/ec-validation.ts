import type {
  ECPatientDetails,
  ECClinicalAssessment,
  ECMedicalHistory,
  ECMedications,
  ECMedicineSelection,
  ECCounselling,
  ECConsultationSummary,
} from "./ec-types";
import type { BaseConsent } from "../../shared/types";
import { calculateAge } from "../../shared/types";

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: ECPatientDetails
): string | null {
  if (!patient.firstName.trim()) return "Patient first name is required";
  if (!patient.lastName.trim()) return "Patient last name is required";
  if (!patient.dateOfBirth) return "Date of birth is required";
  if (patient.age === null) return "Unable to calculate age";

  // Emergency contraception is for females aged 13+
  if (patient.age < 13)
    return "This PGD is for patients aged 13 years or older";

  if (!patient.femaleConfirmed)
    return "Please confirm the patient is female";

  // Fraser competence for ages 13-15
  if (patient.age >= 13 && patient.age <= 15 && !patient.fraserCompetent) {
    return "Fraser competence must be confirmed for patients aged 13-15";
  }

  return null;
}

// ─── Consent Validation ───

export function validateConsentStep(consent: BaseConsent): string | null {
  if (!consent.informedConsentGiven)
    return "Informed consent must be obtained before proceeding";
  if (!consent.idVerified)
    return "ID verification is required";
  if (!consent.patientAwarePrivateService)
    return "Patient must be aware this is a private service";
  return null;
}

// ─── Clinical Assessment Validation ───

export function validateClinicalAssessmentStep(
  assessment: ECClinicalAssessment
): string | null {
  if (!assessment.upsiDate)
    return "Date of unprotected sexual intercourse is required";
  if (!assessment.upsiTime)
    return "Time of unprotected sexual intercourse is required";
  if (assessment.hoursSinceUPSI === null)
    return "Unable to calculate hours since UPSI";

  if (!assessment.lastMenstrualPeriod)
    return "Last menstrual period date is required";

  if (assessment.cycleRegular === false && assessment.cycleLength === null)
    return "If cycle is irregular, cycle length is required";

  if (assessment.regularContraception && !assessment.contraceptionType)
    return "Please specify the type of contraception being used";

  if (assessment.regularContraception && !assessment.contraceptionFailureType)
    return "Please specify how the contraception failed";

  if (assessment.previousEC && !assessment.previousECDetails)
    return "Please provide details of previous emergency contraception use";

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  history: ECMedicalHistory
): string | null {
  if (!history.pregnancyTestResult)
    return "Pregnancy test result must be confirmed";

  if (
    history.pregnancyTestResult !== "not-done" &&
    history.pregnancyTestResult !== "negative" &&
    history.pregnancyTestResult !== "positive"
  ) {
    // If test was done, it's fine
  } else if (history.pregnancyTestResult === "not-done") {
    // Not done is acceptable with counselling
  }

  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: ECMedications
): string | null {
  if (medications.takesEnzymeInducers && !medications.enzymeInducerDetails)
    return "Please specify which enzyme-inducing drugs are being taken";

  if (
    medications.currentHormonalContraception &&
    !medications.hormonalContraceptionType
  ) {
    return "Please specify the type of hormonal contraception";
  }

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  selection: ECMedicineSelection
): string | null {
  if (!selection.medicine)
    return "A medicine must be selected or 'cannot supply' decision made";

  if (selection.pharmacistOverride && !selection.overrideReason)
    return "Override reason must be documented";

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(counselling: ECCounselling): string | null {
  // All key counselling points should be covered
  const requiredPoints = [
    counselling.timingAdvice,
    counselling.vomitingAdvice,
    counselling.notGuaranteed,
    counselling.pregnancyTestAdvice,
    counselling.futureContraceptionDiscussed,
    counselling.returnToGPAdvice,
    counselling.sideEffectsExplained,
  ];

  if (!requiredPoints.every((point) => point === true)) {
    return "All counselling points must be confirmed as covered";
  }

  return null;
}

// ─── Summary Validation ───

export function validateSummaryStep(summary: ECConsultationSummary): string | null {
  if (!summary.pharmacistName.trim())
    return "Pharmacist name is required";
  if (!summary.pharmacistGPhC.trim())
    return "GPhC registration number is required";
  return null;
}

// ─── Step Validation Router ───

export function validateStep(currentStep: number, state: any): string | null {
  switch (currentStep) {
    case 0:
      return validatePatientDetailsStep(state.patient);
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      return validateClinicalAssessmentStep(state.clinicalAssessment);
    case 3:
      return validateMedicalHistoryStep(state.medicalHistory);
    case 4:
      return validateMedicationsStep(state.medications);
    case 5:
      // Contraindications review is read-only, no validation
      return null;
    case 6:
      return validateMedicineSelectionStep(state.medicineSelection);
    case 7:
      return validateCounsellingStep(state.counselling);
    case 8:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}

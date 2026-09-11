import type {
  ECPatientDetails,
  ECClinicalAssessment,
  ECMedicalHistory,
  ECMedications,
  ECMedicineSelection,
  ECCounselling,
  ECConsultationSummary,
  ECConsultationState,
} from "./ec-types";
import type { BaseConsent } from "../../shared/types";
import { getMedicineAvailability, isHighWeightOrBmi } from "./ec-clinical-logic";

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: ECPatientDetails
): string | null {
  if (!patient.firstName.trim()) return "Patient first name is required";
  if (!patient.lastName.trim()) return "Patient last name is required";
  if (!patient.dateOfBirth) return "Date of birth is required";
  if (patient.age === null) return "Unable to calculate age";

  if (!patient.femaleConfirmed)
    return "Please confirm the patient is female";

  // Under 13 is not supplied through this tool. PGD v003 says supply "may
  // still be appropriate" with a mandatory safeguarding referral; the tool is
  // deliberately stricter: a child under 13 is a same-day referral to the GP
  // or sexual health service with a safeguarding referral, not a pharmacy
  // supply. Get Real Health service decision, 11 September 2026.
  if (patient.age < 13) {
    return "Aged under 13: not supplied under this ePGD. Refer the same day to the GP or sexual health service and make a safeguarding referral; record both.";
  }

  // Aged 13 to 15: assess and record Fraser competence, ask about coercion,
  // the age of the partner and any safeguarding concern; record the assessment.
  if (patient.age >= 13 && patient.age <= 15) {
    if (!patient.fraserCompetent)
      return "Fraser competence must be assessed and recorded for patients aged 13 to 15";
    if (!patient.coercionAsked)
      return "Ask about coercion and record the answer for patients aged 13 to 15";
    if (!patient.partnerAge.trim())
      return "Record the age of the partner for patients aged 13 to 15";
    if (!patient.safeguardingNotes.trim())
      return "Record the safeguarding assessment for patients aged 13 to 15";
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

  // Weight and BMI are PGD assessment factors (3 mg levonorgestrel rule)
  if (history.weightKg === null)
    return "Weight is required (ulipristal preferred at 70 kg or over, or BMI 26 or over)";

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
  selection: ECMedicineSelection,
  state?: ECConsultationState
): string | null {
  if (!selection.medicine)
    return "A medicine must be selected or 'cannot supply' decision made";

  if (state) {
    const availability = getMedicineAvailability(state);
    if (selection.medicine === "levonorgestrel" && !availability.canUseLNG)
      return `Levonorgestrel cannot be supplied: ${availability.lngReasons.join(", ")}`;
    if (selection.medicine === "ulipristal" && !availability.canUseUPA)
      return `Ulipristal cannot be supplied: ${availability.upaReasons.join(", ")}`;

    if (selection.medicine === "levonorgestrel") {
      if (!selection.dose) return "Select the levonorgestrel dose";
      const enzyme = state.medications.takesEnzymeInducers;
      const highWeight = isHighWeightOrBmi(state);
      if (enzyme && !selection.copperIudOffered)
        return "Enzyme inducers: a copper IUD must be offered first; record that it was offered (and declined) before giving levonorgestrel 3 mg";
      if (enzyme && selection.dose !== "3mg")
        return "Enzyme inducers: levonorgestrel must be given as 3 mg (two tablets, licensed)";
      if (selection.dose === "3mg") {
        if (!selection.doubleDoseReason) return "Record the reason for the 3 mg dose";
        if (selection.doubleDoseReason === "weight-bmi" && !highWeight)
          return "Weight or BMI reason selected but weight is under 70 kg and BMI under 26";
        if (selection.doubleDoseReason === "enzyme-inducers" && !enzyme)
          return "Enzyme inducer reason selected but no enzyme inducer recorded";
        if (selection.doubleDoseReason === "weight-bmi" && !selection.offLabelExplained)
          return "Weight or BMI based 3 mg is off-label per FSRH: confirm this was explained to the patient and recorded";
      }
      if (selection.dose === "1.5mg" && highWeight && !selection.pharmacistOverride)
        return "Weight 70 kg or over, or BMI 26 or over: ulipristal is preferred; if levonorgestrel is used give 3 mg (record an override reason to give 1.5 mg)";
    }
  }

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

export function validateStep(currentStep: number, state: ECConsultationState): string | null {
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
      return validateMedicineSelectionStep(state.medicineSelection, state);
    case 7:
      return validateCounsellingStep(state.counselling);
    case 8:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}

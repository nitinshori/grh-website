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
import { getMedicineAvailability, getRequiredLngDose } from "./ec-clinical-logic";

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
  // supply. Get Real Health service decision, 11 September 2026. The stop
  // alert (UNDER_13) blocks Next; this message tells the pharmacist what to
  // record before saving the consultation as not supplied.
  if (patient.age < 13) {
    if (!patient.safeguardingReferralMade || !patient.safeguardingNotes.trim())
      return "Aged under 13: not supplied under this ePGD. Refer the same day to the GP or sexual health service, make a safeguarding referral, record both below, then save as not supplied.";
    return "Aged under 13: not supplied under this ePGD. Save this consultation as not supplied.";
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
  assessment: ECClinicalAssessment,
  history?: ECMedicalHistory
): string | null {
  if (!assessment.upsiDate)
    return "Date of unprotected sexual intercourse is required";
  if (!assessment.upsiTime)
    return "Time of unprotected sexual intercourse is required";
  if (assessment.hoursSinceUPSI === null)
    return "Unable to calculate hours since UPSI";
  if (assessment.hoursSinceUPSI < 0)
    return "The date and time of UPSI are in the future; check and correct them";

  if (!assessment.lastMenstrualPeriod)
    return "Last menstrual period date is required";

  if (assessment.cycleRegular && assessment.cycleLength === null)
    return "Record the usual cycle length for a regular cycle";

  if (assessment.previousEC && !assessment.previousECType)
    return "Record which emergency contraceptive was used earlier this cycle";

  if (assessment.regularContraception && !assessment.contraceptionType)
    return "Please specify the type of contraception being used";

  if (assessment.regularContraception && !assessment.contraceptionFailureType)
    return "Please specify how the contraception failed";

  if (assessment.previousEC && !assessment.previousECDetails)
    return "Please provide details of previous emergency contraception use";

  // Pregnancy is assessed here, with the symptoms and the last period, so
  // the exclusion can be applied on the step where it is raised.
  if (history && !history.pregnancyTestResult)
    return "Pregnancy test result must be confirmed";

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  history: ECMedicalHistory
): string | null {
  if (!history.pregnancyTestResult)
    return "Pregnancy test result must be confirmed";

  // Weight and BMI are PGD assessment factors (3 mg levonorgestrel rule).
  // Both are required: the rule is weight 70 kg or over OR BMI 26 or over,
  // and BMI cannot be calculated without height.
  if (history.weightKg === null)
    return "Weight is required (ulipristal preferred at 70 kg or over, or BMI 26 or over)";
  if (history.heightCm === null)
    return "Height is required so that BMI can be calculated (BMI 26 or over changes the recommendation)";

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
    return "Select a medicine, or record that no medicine was supplied and why";

  if (selection.medicine === "not-supplied") {
    if (!selection.notSuppliedReason.trim())
      return "Record why no medicine was supplied (patient declined, or referred, for example for a copper IUD) and the advice given";
    return null;
  }

  if (state) {
    const availability = getMedicineAvailability(state);
    if (selection.medicine === "levonorgestrel" && !availability.canUseLNG)
      return `Levonorgestrel cannot be supplied: ${availability.lngReasons.join(", ")}`;
    if (selection.medicine === "ulipristal" && !availability.canUseUPA)
      return `Ulipristal cannot be supplied: ${availability.upaReasons.join(", ")}`;

    if (selection.medicine === "levonorgestrel") {
      // The dose is fixed by the document. There is no override: a woman of
      // 70 kg or over, or BMI 26 or over, or on enzyme inducers, gets 3 mg
      // or ulipristal, never 1.5 mg.
      const required = getRequiredLngDose(state);
      if (selection.dose !== required.dose)
        return required.dose === "3mg"
          ? "Levonorgestrel must be given as 3 mg (two tablets) for this patient; 1.5 mg is not an option under the PGD"
          : "Levonorgestrel 1.5 mg is the dose for this patient; 3 mg is only for enzyme inducers or weight 70 kg or over / BMI 26 or over";
      if (required.reason === "enzyme-inducers" && !selection.copperIudOffered)
        return "Enzyme inducers: a copper IUD must be offered first; record that it was offered (and declined) before giving levonorgestrel 3 mg";
      if (required.dose === "3mg" && selection.doubleDoseReason !== required.reason)
        return "Record the reason for the 3 mg dose";
      if (required.reason === "weight-bmi" && !selection.offLabelExplained)
        return "Weight or BMI based 3 mg is off-label per FSRH: confirm this was explained to the patient and recorded";
    }
  }

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: ECCounselling,
  state?: ECConsultationState
): string | null {
  const notSupplied = state?.medicineSelection.medicine === "not-supplied";
  if (notSupplied) {
    // No tablet was given: the advice that still applies is ongoing
    // contraception, STI testing and when to see the GP.
    if (!counselling.futureContraceptionDiscussed) return "Confirm future contraception options were discussed";
    if (!counselling.stiScreeningAdvice) return "Confirm STI screening advice was given";
    if (!counselling.returnToGPAdvice) return "Confirm the patient was told when to contact the GP";
    return null;
  }
  // Every follow-up item in the document's advice row, plus the PIL.
  if (!counselling.timingAdvice) return "Confirm the patient was told when to take the medicine";
  if (!counselling.vomitingAdvice) return "Confirm the vomiting advice (return within 3 hours) was given";
  if (!counselling.notGuaranteed) return "Confirm the patient was told emergency contraception is not 100% effective";
  if (!counselling.pregnancyTestAdvice) return "Confirm the pregnancy test advice was given";
  if (!counselling.futureContraceptionDiscussed) return "Confirm future contraception options were discussed";
  if (!counselling.hormonalContraceptionRestart) return "Confirm the advice on starting or restarting regular contraception (5 day wait after ulipristal) was given";
  if (!counselling.returnToGPAdvice) return "Confirm the patient was told when to contact the GP";
  if (!counselling.stiScreeningAdvice) return "Confirm STI screening advice was given";
  if (!counselling.sideEffectsExplained) return "Confirm side effects were explained";
  if (state?.medicalHistory.breastfeeding && !counselling.breastfeedingAdvice)
    return "Breastfeeding: confirm the patient was advised to avoid breastfeeding for 8 hours after levonorgestrel or 7 days after ulipristal";
  if (!counselling.pilSupplied) return "Confirm the patient information leaflet was supplied";
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
      return validateClinicalAssessmentStep(state.clinicalAssessment, state.medicalHistory);
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
      return validateCounsellingStep(state.counselling, state);
    case 8:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}

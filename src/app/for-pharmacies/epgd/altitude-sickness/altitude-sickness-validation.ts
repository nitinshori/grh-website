// ─── Altitude Sickness Validation ───

import type {
  ASPatientDetails,
  ASTravelAssessment,
  ASMedicalHistory,
  ASMedications,
  ASMedicineSelection,
  ASCounselling,
} from './altitude-sickness-types';
import type { BaseConsent } from '../shared/types';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: ASPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';

  if (patient.age < 18)
    return 'This PGD applies to patients aged 18 years or older';

  if (!patient.maleConfirmed && !patient.femaleConfirmed)
    return 'Please confirm the patient\'s gender';

  return null;
}

// ─── Consent Validation ───

export function validateConsentStep(consent: BaseConsent): string | null {
  if (!consent.informedConsentGiven)
    return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  return null;
}

// ─── Travel Assessment Validation ───

export function validateTravelAssessmentStep(
  travel: ASTravelAssessment
): string | null {
  if (!travel.destinationCountry.trim())
    return 'Destination country is required';
  if (!travel.destinationAltitude)
    return 'Destination altitude (in meters) is required';
  if (!travel.departureDate) return 'Departure date is required';
  if (!travel.ascentRate)
    return 'Ascent rate (slow/moderate/rapid) is required';

  if (travel.acclimatisationPlan && !travel.acclimatisationDays)
    return 'If acclimatisation plan exists, specify number of days';

  if (travel.previousAltitudeSickness && !travel.previousSicknessDetails)
    return 'If previous altitude sickness, provide details';

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  medical: ASMedicalHistory
): string | null {
  // All checks are optional checkboxes; validation ensures form is reviewed
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: ASMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return 'Please specify other medications being taken';

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  medicine: ASMedicineSelection
): string | null {
  if (!medicine.selectedMedicine)
    return 'Please confirm acetazolamide selection';
  if (!medicine.dose.trim()) return 'Dose is required';
  if (!medicine.startTiming.trim()) return 'Start timing is required';
  if (!medicine.continuationTiming.trim())
    return 'Continuation timing is required';
  if (!medicine.reason.trim())
    return 'Clinical reason for selection is required';

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: ASCounselling
): string | null {
  // All counselling points must be confirmed
  if (
    !counselling.paraesthesiaExplained ||
    !counselling.avoidAlcoholAdvice ||
    !counselling.hydrateWellAdvice ||
    !counselling.ascentAdvice ||
    !counselling.amsSymptomAdvice ||
    !counselling.haceSymptomAdvice ||
    !counselling.hapeSymptomAdvice ||
    !counselling.descentAdvice ||
    !counselling.medicineCardProvided
  ) {
    return 'All counselling points must be addressed and confirmed';
  }

  return null;
}

// ─── Summary Validation ───

export function validateSummaryStep(
  summary: any
): string | null {
  if (!summary.pharmacistName.trim())
    return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC.trim())
    return 'GPhC registration number is required';
  if (!summary.pharmacyName.trim()) return 'Pharmacy name is required';

  return null;
}

// ─── Generic step validation dispatcher ───

export function validateStep(stepIndex: number, data: any): string | null {
  switch (stepIndex) {
    case 0:
      return validatePatientDetailsStep(data.patient);
    case 1:
      return validateConsentStep(data.consent);
    case 2:
      return validateTravelAssessmentStep(data.travelAssessment);
    case 3:
      return validateMedicalHistoryStep(data.medicalHistory);
    case 4:
      // Contraindications review: no input, just review
      return null;
    case 5:
      return validateMedicineSelectionStep(data.medicineSelection);
    case 6:
      return validateCounsellingStep(data.counselling);
    case 7:
      return validateSummaryStep(data.summary);
    default:
      return null;
  }
}

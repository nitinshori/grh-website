// ─── Travellers' Diarrhoea Validation ───

import type {
  TDPatientDetails,
  TDTravelAssessment,
  TDMedicalHistory,
  TDMedications,
  TDMedicineSelection,
  TDCounselling,
} from './travellers-diarrhoea-types';
import type { BaseConsent } from '../shared/types';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: TDPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';

  // Note: This PGD is for adults and children 12+
  // Under 12 requires specialist medical advice, which will be covered in counselling
  if (patient.age < 12) {
    return 'This PGD applies to patients 12 years or older. Younger children require specialist medical assessment.';
  }

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
  travel: TDTravelAssessment
): string | null {
  if (!travel.destinationCountry.trim())
    return 'Destination country is required';
  if (!travel.departureDate) return 'Departure date is required';
  if (!travel.returnDate) return 'Return date is required';
  if (!travel.travelType) return 'Travel type (backpacking, business, etc.) is required';

  if (travel.previousDiarrhoeaEpisodes && !travel.previousEpisodeDetails)
    return 'If previous episode, provide details';

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  medical: TDMedicalHistory
): string | null {
  // All checks are optional checkboxes; validation ensures form is reviewed
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: TDMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return 'Please specify other medications being taken';

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  medicine: TDMedicineSelection
): string | null {
  if (!medicine.selectedApproach)
    return 'Please confirm whether standby treatment will be supplied';
  if (medicine.selectedApproach === 'standby') {
    if (!medicine.loperamideDose.trim()) return 'Loperamide dose is required';
    if (!medicine.azithromycinDose.trim()) return 'Azithromycin dose is required';
  }
  if (!medicine.reason.trim())
    return 'Clinical reason for selection is required';

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: TDCounselling
): string | null {
  // All counselling points must be confirmed
  if (
    !counselling.orCrsAdvice ||
    !counselling.whenToStartTreatment ||
    !counselling.loperamideAdvice ||
    !counselling.azithromycinAdvice ||
    !counselling.pregnancyAdvice ||
    !counselling.foodHygiene ||
    !counselling.waterSafety ||
    !counselling.whenToSeekHelp ||
    !counselling.childrenUnderWarning ||
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

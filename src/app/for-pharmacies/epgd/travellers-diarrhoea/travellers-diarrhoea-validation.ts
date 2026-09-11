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

  // PGD v003 inclusion: adults aged 18 years and over.
  if (patient.age < 18) {
    return 'This PGD applies to adults aged 18 years and over';
  }

  // Gender confirmation removed: no UI exists on the shared patient-details
  // step to set maleConfirmed / femaleConfirmed, so the check trapped every
  // consultation. Pregnancy / breastfeeding are asked on the medical-history step.

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
    if (!medicine.azithromycinDose.trim()) return 'Azithromycin dose is required';
    if (medicine.azithromycinQuantity === null || medicine.azithromycinQuantity < 1)
      return 'Azithromycin quantity (one to three 500 mg tablets) is required';
    if (medicine.azithromycinQuantity > 3)
      return 'The PGD allows a maximum of three 500 mg tablets (maximum course 3 days)';
    if (!medicine.selectedForCriteria)
      return 'Confirm the patient understands azithromycin is for moderate to severe symptoms';
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
      return validateMedicationsStep(data.medications);
    case 5:
      // Contraindications review: no input, just review
      return null;
    case 6:
      return validateMedicineSelectionStep(data.medicineSelection);
    case 7:
      return validateCounsellingStep(data.counselling);
    case 8:
      return validateSummaryStep(data.summary);
    default:
      return null;
  }
}

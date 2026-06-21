// ─── Anti-malarials Validation ───

import type {
  AMPatientDetails,
  AMTravelAssessment,
  AMMedicalHistory,
  AMMedications,
  AMMedicineSelection,
  AMCounselling,
} from './anti-malarials-types';
import type { BaseConsent } from '../shared/types';
import { calculateAge } from '../shared/types';
import { calculateTripDuration } from './anti-malarials-clinical-logic';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: AMPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';

  // Anti-malarials are for all ages (check if >18 for PGD scope)
  if (patient.age < 18)
    return 'This PGD applies to patients aged 18 years or older (under 18 requires specialist guidance)';

  // Gender confirmation removed (Moin bug report, 18 Jun 2026). The previous
  // check required maleConfirmed || femaleConfirmed but no UI existed on the
  // patient-details step to set either field, so pharmacists were trapped
  // with no way to proceed. Pregnancy / breastfeeding considerations
  // (the actual clinical reason gender ever mattered here) are captured
  // explicitly in the travel-assessment step via the dedicated
  // currentlyPregnant / planningPregnancy / breastfeeding flags, which is
  // where the antimalarial product decision actually happens.

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
  travel: AMTravelAssessment
): string | null {
  if (!travel.destinationCountry.trim())
    return 'Destination country is required';
  if (!travel.departureDate) return 'Departure date is required';
  if (!travel.returnDate) return 'Return date is required';

  const tripDays = calculateTripDuration(travel.departureDate, travel.returnDate);
  if (!tripDays || tripDays <= 0)
    return 'Return date must be after departure date';

  if (travel.previousMalariaProphylaxis && !travel.previousProphylaxisType)
    return 'If used prophylaxis before, specify which medicine';

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  medical: AMMedicalHistory
): string | null {
  // All checks are optional checkboxes; validation ensures form is reviewed
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: AMMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return 'Please specify other drugs being taken';

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  medicine: AMMedicineSelection
): string | null {
  if (!medicine.selectedMedicine)
    return 'Please select an antimalarial medicine';
  if (!medicine.dose.trim()) return 'Dose is required';
  if (!medicine.startTiming.trim()) return 'Start timing is required';
  if (!medicine.continuationAfterReturn.trim())
    return 'Continuation period after return is required';
  if (!medicine.reason.trim())
    return 'Clinical reason for selection is required';

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: AMCounselling
): string | null {
  // All counselling points must be confirmed
  if (
    !counselling.takeWithFood ||
    !counselling.sunProtectionAdvice ||
    !counselling.bitePrevention ||
    !counselling.pregnancyAdvice ||
    !counselling.diarrhoeaManagement ||
    !counselling.feverManagement ||
    !counselling.sideEffectsExplained ||
    !counselling.whenToSeekHelp ||
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

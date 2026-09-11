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
import { calculateTripDuration, getMefloquineBand } from './anti-malarials-clinical-logic';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: AMPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';

  // The PGD (v008) covers children by weight band; this tool is deliberately
  // kept adult-only (stricter than the document) until parental consent and
  // paediatric dosing are built in.
  if (patient.age < 18)
    return 'This tool is for patients aged 18 years or older. For a child, work from the weight bands in Appendix 1 of the Malaria Chemoprophylaxis PGD v008 with consent from a person with parental responsibility';

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

  // PGD v008: weight, measured and recorded, determines the dose and the
  // product strength; weight not obtainable is an exclusion.
  if (travel.weightKg === null || travel.weightKg <= 0)
    return 'Body weight in kg is required (measured, not estimated)';

  // PGD v008 inclusion: destination risk assessment from current NaTHNaC /
  // TravelHealthPro guidance, and the source consulted must be recorded.
  if (!travel.riskAssessmentCompleted)
    return 'Confirm the destination risk assessment was carried out using current NaTHNaC / TravelHealthPro guidance and chemoprophylaxis is recommended';
  if (!travel.riskAssessmentSource.trim())
    return 'Record the source consulted for the destination recommendation';

  // PGD v008 inclusion: able and willing to complete the whole course.
  if (!travel.willingToCompleteCourse)
    return 'Patient must be able and willing to complete the full course including the post-travel tail';

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
  medicine: AMMedicineSelection,
  travel?: AMTravelAssessment
): string | null {
  if (!medicine.selectedMedicine)
    return 'Please select an antimalarial medicine';
  if (!medicine.dose.trim()) return 'Dose is required';
  if (!medicine.startTiming.trim()) return 'Start timing is required';
  if (!medicine.continuationAfterReturn.trim())
    return 'Continuation period after return is required';
  if (!medicine.quantity.trim())
    return 'Quantity supplied and calculated course length are required';
  if (medicine.selectedMedicine === 'mefloquine' && travel) {
    const band = getMefloquineBand(travel.weightKg);
    if (band && band.tabletFraction < 1 && !medicine.scoredTabletConfirmed)
      return 'A divided mefloquine dose may only be supplied from a scored tablet: confirm the product held is scored, or refer';
  }
  if (!medicine.batchNumber.trim()) return 'Batch number is required';
  if (!medicine.expiryDate.trim()) return 'Expiry date is required';
  if (!medicine.reason.trim())
    return 'Clinical reason for selection is required (including why any alternative was unsuitable)';

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: AMCounselling,
  medicine?: AMMedicineSelection
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
    !counselling.medicineCardProvided ||
    !counselling.completeCourseAdvised
  ) {
    return 'All counselling points must be addressed and confirmed';
  }

  if (medicine && medicine.selectedMedicine === 'mefloquine' && !counselling.mefloquineStopAdvice)
    return 'Mefloquine: confirm the patient was told to STOP and seek advice at the first neuropsychiatric symptom';

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
      return validateMedicineSelectionStep(data.medicineSelection, data.travelAssessment);
    case 7:
      return validateCounsellingStep(data.counselling, data.medicineSelection);
    case 8:
      return validateSummaryStep(data.summary);
    default:
      return null;
  }
}

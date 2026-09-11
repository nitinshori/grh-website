// ─── Travellers' Diarrhoea Validation ───

import type {
  TDPatientDetails,
  TDTravelAssessment,
  TDMedicalHistory,
  TDMedications,
  TDMedicineSelection,
  TDCounselling,
  TDConsultationState,
  TDConsultationSummary,
} from './travellers-diarrhoea-types';
import type { BaseConsent } from '../shared/types';
import { calculateAge } from '../shared/types';
import { azithromycinDoseText } from './travellers-diarrhoea-clinical-logic';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: TDPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  // Recompute from the DOB so a stale age can never pass the gate.
  const age = calculateAge(patient.dateOfBirth);
  if (age === null) return 'Unable to calculate age from the date of birth';

  // PGD v005 inclusion: adults aged 18 years and over.
  if (age < 18) {
    return 'This PGD applies to adults aged 18 years and over';
  }

  // PGD v005 records: name, address, date of birth and GP.
  if (!patient.address.trim()) return 'Patient address is required (the PGD requires it to be recorded)';
  if (!patient.gpPractice.trim() && !patient.gpName.trim())
    return 'The patient\'s GP is required: search for the practice, or enter "Not registered" as the GP name';

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
  if (!travel.highRiskRegionConfirmed)
    return 'Confirm the destination is a high-risk region for traveller\'s diarrhoea, checked on TravelHealthPro (PGD inclusion criterion)';

  if (travel.previousDiarrhoeaEpisodes && !travel.previousEpisodeDetails)
    return 'If previous episode, provide details';

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  medical: TDMedicalHistory
): string | null {
  // Every exclusion on this page defaults to absent, so the pharmacist must
  // confirm every question was actually asked.
  if (!medical.allQuestionsAsked)
    return 'Confirm that every question on this page was asked and that none applies unless ticked';
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: TDMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return 'Please specify other medications being taken';
  if (!medications.allQuestionsAsked)
    return 'Confirm that every medicine on this page was asked about and that none applies unless ticked';

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  medicine: TDMedicineSelection
): string | null {
  if (!medicine.selectedApproach)
    return 'Please confirm whether standby treatment will be supplied';
  if (medicine.selectedApproach === 'standby') {
    if (medicine.azithromycinDays === null)
      return 'Select the course length (1 to 3 days, depending on clinical severity)';
    if (medicine.azithromycinDose !== azithromycinDoseText(medicine.azithromycinDays))
      return 'The recorded dose does not match the PGD for the chosen course length: re-select the course length';
    if (medicine.azithromycinQuantity === null || medicine.azithromycinQuantity < 1)
      return 'Azithromycin quantity (one to three 500 mg tablets) is required';
    if (medicine.azithromycinQuantity > 3)
      return 'The PGD allows a maximum of three 500 mg tablets (maximum course 3 days)';
    if (medicine.azithromycinQuantity !== medicine.azithromycinDays)
      return 'Quantity must equal the course length: one 500 mg tablet per day';
    if (!medicine.brand.trim())
      return 'Name and brand of the azithromycin product supplied is required (PGD records list)';
    if (!medicine.selectedForCriteria)
      return 'Confirm the patient understands azithromycin is for moderate to severe symptoms';
  }
  if (!medicine.reason.trim())
    return 'Clinical reason for selection is required';

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: TDCounselling,
  medicine?: TDMedicineSelection
): string | null {
  const supplied = medicine?.selectedApproach === 'standby';
  // Items given in every case
  if (
    !counselling.orCrsAdvice ||
    !counselling.foodHygiene ||
    !counselling.waterSafety ||
    !counselling.whenToSeekHelp
  ) {
    return 'All counselling points must be addressed and confirmed';
  }
  // Items that only make sense when azithromycin was supplied
  if (
    supplied &&
    (!counselling.whenToStartTreatment ||
      !counselling.loperamideAdvice ||
      !counselling.azithromycinAdvice ||
      !counselling.childrenUnderWarning ||
      !counselling.medicineCardProvided)
  ) {
    return 'All counselling points for the medicine supplied must be addressed and confirmed';
  }
  // Pregnancy: given, or recorded as not applicable
  if (!counselling.pregnancyAdvice && !counselling.pregnancyAdviceNotApplicable)
    return 'Pregnancy implications: confirm discussed, or tick not applicable';

  return null;
}

// ─── Summary Validation ───

export function validateSummaryStep(
  summary: TDConsultationSummary
): string | null {
  if (!summary.pharmacistName.trim())
    return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC.trim())
    return 'GPhC registration number is required';
  if (!summary.pharmacyName.trim()) return 'Pharmacy name is required';

  return null;
}

// ─── Generic step validation dispatcher ───

export function validateStep(stepIndex: number, data: TDConsultationState): string | null {
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
      return validateCounsellingStep(data.counselling, data.medicineSelection);
    case 8: {
      // Every earlier step must still pass before Save & Print.
      const earlier = validateAllEarlierSteps(data, 8);
      if (earlier) return earlier;
      return validateSummaryStep(data.summary);
    }
    default:
      return null;
  }
}

/** Re-run every step before `upTo`; returns the first failure, prefixed with the step. */
export function validateAllEarlierSteps(data: TDConsultationState, upTo: number): string | null {
  const names = [
    'Patient Details',
    'Consent & ID',
    'Travel Assessment',
    'Medical History',
    'Current Medications',
    'Contraindications Review',
    'Medicine Selection',
    'Counselling & Follow-up',
  ];
  for (let i = 0; i < upTo; i++) {
    const err = validateStep(i, data);
    if (err) return `${names[i] ?? `Step ${i + 1}`}: ${err}`;
  }
  return null;
}

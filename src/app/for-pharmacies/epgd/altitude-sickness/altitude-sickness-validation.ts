// ─── Altitude Sickness Validation ───

import type {
  ASPatientDetails,
  ASTravelAssessment,
  ASMedicalHistory,
  ASMedications,
  ASMedicineSelection,
  ASCounselling,
  ASConsultationState,
  ASConsultationSummary,
} from './altitude-sickness-types';
import type { BaseConsent } from '../shared/types';
import { calculateAge } from '../shared/types';
import {
  maxQuantityTablets,
  calculateASQuantity,
  recommendMedicine,
  AS_MAX_PREVENTION_TABLETS,
} from './altitude-sickness-clinical-logic';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: ASPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  // Recompute from the DOB so a stale age can never pass the gate.
  const age = calculateAge(patient.dateOfBirth);
  if (age === null) return 'Unable to calculate age from the date of birth';

  if (age < 18)
    return 'This PGD applies to patients aged 18 years or older';

  // PGD v004 records: name, address, date of birth and GP.
  if (!patient.address.trim()) return 'Patient address is required (the PGD requires it to be recorded)';
  if (!patient.gpPractice.trim() && !patient.gpName.trim())
    return 'The patient\'s GP is required: search for the practice, or enter "Not registered" as the GP name';

  // Gender confirmation removed: no UI exists on the shared patient-details
  // step to set maleConfirmed / femaleConfirmed, so the check trapped every
  // consultation. Pregnancy / breastfeeding (the only clinical reason) is an
  // explicit exclusion checkbox on the medical-history step.

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
    return 'Destination altitude (in metres) is required';
  if (travel.destinationAltitude <= 2500)
    return 'This PGD covers altitudes above 2,500 metres only';
  if (!travel.purpose)
    return 'Confirm whether the patient is requesting prevention or symptomatic treatment of AMS';
  if (!travel.departureDate) return 'Departure date is required';
  if (!travel.ascentRate)
    return 'Ascent rate (slow/moderate/rapid) is required';

  if (travel.purpose === 'prevention') {
    if (travel.leadInDays === null)
      return 'Lead-in days before ascent (1 or 2) are required to calculate the prevention course';
    if (travel.daysAscending === null || travel.daysAscending <= 0)
      return 'Days ascending are required to calculate the prevention course';
    if (travel.leadInDays + travel.daysAscending + 2 > 14)
      return 'The prevention course would exceed the PGD maximum of 14 days per supply without review. Refer, or supply for the first 14 days only and arrange review';
  }

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
  // Every exclusion on this page defaults to absent, so the pharmacist must
  // confirm every question was actually asked.
  if (!medical.allQuestionsAsked)
    return 'Confirm that every question on this page was asked and that none applies unless ticked';
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: ASMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return 'Please specify other medications being taken';
  if (!medications.allQuestionsAsked)
    return 'Confirm that every medicine on this page was asked about and that none applies unless ticked';

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  medicine: ASMedicineSelection,
  travel: ASTravelAssessment,
  medical: ASMedicalHistory,
  medications: ASMedications
): string | null {
  if (!medicine.selectedMedicine)
    return 'Please confirm acetazolamide selection';
  if (!medicine.brand.trim())
    return 'Name and brand of the product supplied is required (PGD records list)';

  // Dose, start and continuation are the document's for the purpose; they
  // are set when the medicine is chosen and must still match.
  const regimen = recommendMedicine(medical, medications, travel);
  if (!regimen) return 'Acetazolamide cannot be supplied to this patient under the PGD';
  if (
    medicine.dose !== regimen.dose ||
    medicine.startTiming !== regimen.startTiming ||
    medicine.continuationTiming !== regimen.continuationTiming
  )
    return 'The recorded regimen no longer matches the PGD for this purpose (the reason for request changed): re-select the medicine';

  if (medicine.quantityTablets === null || medicine.quantityTablets <= 0)
    return 'Quantity supplied (tablets) is required';
  const purpose = travel.purpose;
  const max = maxQuantityTablets(purpose, medicine.includeTreatmentCourse);
  if (purpose === 'treatment' && medicine.includeTreatmentCourse)
    return 'A treatment request is the 6 tablet treatment course; the additional treatment course applies to prevention only';
  if (medicine.quantityTablets > max)
    return `Quantity exceeds the PGD maximum of ${max} tablets for this regimen`;
  const calc = calculateASQuantity(travel, medicine.includeTreatmentCourse);
  if (calc.total === null) return 'The course cannot be calculated: check the lead-in days and days ascending on the Travel Assessment';
  if (calc.exceedsMaximumPeriod || (calc.preventionTablets !== null && calc.preventionTablets > AS_MAX_PREVENTION_TABLETS))
    return 'The prevention course exceeds the PGD maximum of 14 tablets (14 days) per supply without review';
  if (medicine.quantityTablets < calc.total)
    return `Quantity supplied (${medicine.quantityTablets}) is below the calculated course of ${calc.total} tablets`;
  if (!medicine.offLabelExplained)
    return 'Confirm the patient was told that use for AMS is outside the marketing authorisation (off-label)';
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
  summary: ASConsultationSummary
): string | null {
  if (!summary.pharmacistName.trim())
    return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC.trim())
    return 'GPhC registration number is required';
  if (!summary.pharmacyName.trim()) return 'Pharmacy name is required';

  return null;
}

// ─── Generic step validation dispatcher ───

export function validateStep(stepIndex: number, data: ASConsultationState): string | null {
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
      return validateMedicineSelectionStep(
        data.medicineSelection,
        data.travelAssessment,
        data.medicalHistory,
        data.medications
      );
    case 7:
      return validateCounsellingStep(data.counselling);
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
export function validateAllEarlierSteps(data: ASConsultationState, upTo: number): string | null {
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

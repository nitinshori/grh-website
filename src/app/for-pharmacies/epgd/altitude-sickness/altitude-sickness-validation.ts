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
    return "Type the 'Destination Country'";
  if (!travel.destinationAltitude)
    return "Enter the 'Destination Altitude (metres)'";
  if (travel.destinationAltitude <= 2500)
    return "'Destination Altitude' must be above 2,500 metres: this PGD covers altitudes above 2,500 metres only";
  if (travel.destinationAltitude > 9000)
    return "'Destination Altitude' above 9,000 metres cannot be right: check the figure";
  if (!travel.purpose)
    return "Select the 'Reason for request': prevention, or symptomatic treatment of AMS";
  if (!travel.departureDate) return "Enter the 'Departure Date'";
  {
    const today = new Date().toISOString().split('T')[0];
    if (travel.purpose === 'prevention' && travel.departureDate < today)
      return "'Departure Date' is in the past: prevention starts 1 to 2 days before ascent. Check the date";
  }
  if (!travel.ascentRate)
    return "Select the 'Ascent Rate' (slow, moderate or rapid)";

  if (travel.purpose === 'prevention') {
    if (travel.leadInDays === null)
      return "Select the 'Lead-in days before ascent' (1 or 2) to calculate the prevention course";
    if (travel.daysAscending === null || travel.daysAscending <= 0)
      return "Enter the 'Days ascending' to calculate the prevention course";
    if (travel.leadInDays + travel.daysAscending + 2 > 14)
      return 'The prevention course would exceed the PGD maximum of 14 days per supply without review. Refer, or supply for the first 14 days only and arrange review';
  }

  if (travel.acclimatisationPlan && !travel.acclimatisationDays)
    return "'Acclimatisation Plan' is ticked: enter the 'Days at Intermediate Altitude'";

  if (travel.previousAltitudeSickness && !travel.previousSicknessDetails)
    return "'Previous Altitude Sickness' is ticked: type the 'Details of Previous Illness'";

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  medical: ASMedicalHistory
): string | null {
  // Every exclusion on this page defaults to absent, so the pharmacist must
  // confirm every question was actually asked.
  if (!medical.allQuestionsAsked)
    return "Tick 'I have asked the patient every question on this page' at the bottom of the page";
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: ASMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return "'Other Medications' is ticked: type them in 'Please Specify Other Medications'";
  if (!medications.allQuestionsAsked)
    return "Tick 'I have asked about every medicine on this page' at the bottom of the page";

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
    return "Select 'Medicine Choice': acetazolamide 250 mg tablets";
  if (!medicine.brand.trim())
    return "Type the 'Brand supplied' (name and brand of the product, PGD records list)";

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
    return "Enter the 'Quantity supplied (tablets)'";
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
    return "Tick 'Off-label use explained and consented'";
  if (!medicine.reason.trim())
    return "Type the 'Clinical Reason for Selection'";

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
    return "Tick every counselling point on this page (each one must be discussed with the patient)";
  }

  return null;
}

// ─── Summary Validation ───

export function validateSummaryStep(
  summary: ASConsultationSummary
): string | null {
  if (!summary.pharmacistName.trim())
    return "Type the 'Pharmacist Name'";
  if (!summary.pharmacistGPhC.trim())
    return "Type the 'GPhC Registration Number'";
  if (!summary.pharmacyName.trim()) return "Type the 'Pharmacy Name'";

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

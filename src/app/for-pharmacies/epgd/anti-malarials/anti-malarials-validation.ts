// ─── Anti-malarials Validation ───

import type {
  AMPatientDetails,
  AMTravelAssessment,
  AMMedicalHistory,
  AMMedications,
  AMMedicineSelection,
  AMCounselling,
  AMConsultationState,
  AMConsultationSummary,
} from './anti-malarials-types';
import type { BaseConsent } from '../shared/types';
import { calculateAge } from '../shared/types';
import {
  calculateTripDuration,
  calculateDaysUntilDeparture,
  getMefloquineBand,
  getEligibleMedicineOptions,
  describeArm,
  QUANTITY_PACK_ALLOWANCE,
} from './anti-malarials-clinical-logic';

// ─── Patient Details Validation ───

export function validatePatientDetailsStep(
  patient: AMPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  // Never trust a stale age: recompute from the date of birth here so a
  // blank or changed DOB can never pass the age gate on an old value.
  const age = calculateAge(patient.dateOfBirth);
  if (age === null) return 'Unable to calculate age from the date of birth';

  // The PGD (v010) covers children by weight band; this tool is deliberately
  // kept adult-only (stricter than the document) until parental consent and
  // paediatric dosing are built in.
  if (age < 18)
    return 'This tool is for patients aged 18 years or older. For a child, work from the weight bands in Appendix 1 of the Malaria Chemoprophylaxis PGD v010 with consent from a person with parental responsibility';

  // PGD v010 records to be kept: patient name, address, date of birth and
  // the GP with whom they are registered. Address and GP were optional.
  if (!patient.address.trim()) return 'Patient address is required (the PGD requires it to be recorded)';
  if (!patient.gpPractice.trim() && !patient.gpName.trim())
    return 'The GP with whom the patient is registered is required: search for the practice, or enter "Not registered" as the GP name';

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
    return "Type the 'Destination Country'";
  if (!travel.departureDate) return "Enter the 'Departure Date'";
  if (!travel.returnDate) return "Enter the 'Return Date'";

  const tripDays = calculateTripDuration(travel.departureDate, travel.returnDate);
  if (!tripDays || tripDays <= 0)
    return "'Return Date' must be on or after the 'Departure Date'";

  // A departure in the past went straight through: mefloquine silently
  // dropped out and the other arms were offered with a lead-in that could
  // not happen (adversarial review, 11 Sep 2026).
  const daysUntilDeparture = calculateDaysUntilDeparture(travel.departureDate);
  if (daysUntilDeparture !== null && daysUntilDeparture < 0)
    return "'Departure Date' is in the past. Prophylaxis must start before entering the malarious area; check the dates";
  if (daysUntilDeparture !== null && daysUntilDeparture > 365)
    return "'Departure Date' is more than a year away: check the date";

  if (travel.previousMalariaProphylaxis && !travel.previousProphylaxisType)
    return "'Previous Malaria Prophylaxis' is ticked: type 'Which Prophylaxis Was Used?'";

  // PGD v010: weight, measured and recorded, determines the dose and the
  // product strength; weight not obtainable is an exclusion.
  if (travel.weightKg === null || travel.weightKg <= 0)
    return "Enter the 'Body weight (kg)', measured today, not estimated";
  if (travel.weightKg > 300)
    return "'Body weight (kg)' above 300 cannot be right: check the figure";

  // PGD v010 inclusion: destination risk assessment from current NaTHNaC /
  // TravelHealthPro guidance, and the source consulted must be recorded.
  if (!travel.riskAssessmentCompleted)
    return "Tick 'Destination risk assessment completed' once current NaTHNaC / TravelHealthPro guidance has been checked and chemoprophylaxis is recommended";
  if (!travel.riskAssessmentSource.trim())
    return "Type the 'Source consulted for the destination recommendation'";

  // PGD v010 inclusion: able and willing to complete the whole course.
  if (!travel.willingToCompleteCourse)
    return "Tick 'Able and willing to complete the full course' (inclusion criterion, including the post-travel tail)";

  return null;
}

// ─── Medical History Validation ───

export function validateMedicalHistoryStep(
  medical: AMMedicalHistory
): string | null {
  // Every exclusion on this page is a box whose default is the safe answer,
  // so the pharmacist must confirm every question was actually asked.
  if (!medical.allQuestionsAsked)
    return "Tick 'I have asked the patient every question on this page' at the bottom of the page";
  return null;
}

// ─── Medications Validation ───

export function validateMedicationsStep(
  medications: AMMedications
): string | null {
  if (medications.takesOtherDrugs && !medications.otherDrugsDetails.trim())
    return "'Other Medications' is ticked: type them in 'Please Specify Other Medications'";
  if (!medications.allQuestionsAsked)
    return "Tick 'I have asked about every medicine on this page' at the bottom of the page";

  return null;
}

// ─── Medicine Selection Validation ───

export function validateMedicineSelectionStep(
  medicine: AMMedicineSelection,
  travel: AMTravelAssessment,
  medical: AMMedicalHistory,
  medications: AMMedications
): string | null {
  if (!medicine.selectedMedicine)
    return "Choose the 'Selected Medicine'";

  // The stored arm must still be eligible. Answers on earlier steps can
  // change after the arm was chosen; the selector only hides ineligible
  // arms, it never checked what was already stored (adversarial review,
  // 11 Sep 2026: mefloquine recorded for a patient just flagged as
  // psychiatrically excluded).
  const eligible = getEligibleMedicineOptions(medical, medications, travel);
  if (!eligible.some((o) => o.value === medicine.selectedMedicine))
    return 'The selected medicine is no longer eligible for this patient (an answer changed after it was chosen). Select an eligible arm';

  const arm = describeArm(medicine.selectedMedicine, travel);
  if (!arm) return 'The selected arm cannot be dosed from the recorded weight';
  if (!medicine.dose.trim() || !medicine.startTiming.trim() || !medicine.continuationAfterReturn.trim())
    return 'Dose, start timing and continuation are set by the PGD for the chosen arm: re-select the medicine';
  if (medicine.dose !== arm.dose || medicine.startTiming !== arm.startTiming || medicine.continuationAfterReturn !== arm.continuationAfterReturn)
    return 'The recorded dose or timing no longer matches the PGD for this weight and itinerary: re-select the medicine';

  // Quantity: at least the calculated course, at most one extra pack.
  if (arm.total === null) return 'Departure and return dates are needed to calculate the course';
  if (medicine.quantity === null || medicine.quantity <= 0)
    return 'Quantity supplied is required';
  if (medicine.quantity < arm.total)
    return `Quantity supplied (${medicine.quantity}) is below the calculated course of ${arm.total} ${arm.unit}. Supply the whole course including the tail`;
  if (medicine.quantity > arm.total + QUANTITY_PACK_ALLOWANCE)
    return `Quantity supplied (${medicine.quantity}) is more than one extra pack above the calculated course of ${arm.total} ${arm.unit}`;
  if (medicine.selectedMedicine === 'doxycycline' && medicine.quantity < 30)
    return 'A doxycycline quantity below 30 cannot be correct for any itinerary';

  if (medicine.selectedMedicine === 'mefloquine') {
    const band = getMefloquineBand(travel.weightKg);
    if (band && band.tabletFraction < 1 && !medicine.scoredTabletConfirmed)
      return 'A divided mefloquine dose may only be supplied from a scored tablet: confirm the product held is scored, or refer';
  }
  if (!medicine.batchNumber.trim()) return "Type the 'Batch number' from the pack";
  if (!medicine.expiryDate.trim()) return "Enter the 'Expiry date' from the pack";
  {
    // A pack that expires before the course ends cannot be supplied
    // (walkthrough review, 11 Sep 2026: any date was accepted).
    const today = new Date().toISOString().split('T')[0];
    if (medicine.expiryDate < today)
      return "'Expiry date' is in the past: the pack has expired and cannot be supplied";
    if (travel.returnDate && medicine.expiryDate < travel.returnDate)
      return "'Expiry date' is before the 'Return Date': the pack would expire before the course ends (the tail runs on after return). Use a longer-dated pack";
  }
  if (!medicine.reason.trim())
    return "Type the 'Clinical Reason for Selection' (including why any alternative was unsuitable)";

  return null;
}

// ─── Counselling Validation ───

export function validateCounsellingStep(
  counselling: AMCounselling,
  medicine?: AMMedicineSelection
): string | null {
  // Items common to every arm
  if (
    !counselling.takeWithFood ||
    !counselling.bitePrevention ||
    !counselling.diarrhoeaManagement ||
    !counselling.feverManagement ||
    !counselling.sideEffectsExplained ||
    !counselling.whenToSeekHelp ||
    !counselling.medicineCardProvided ||
    !counselling.completeCourseAdvised
  ) {
    return "Tick every counselling point on this page (each one must be discussed with the patient)";
  }

  // Pregnancy: given, or recorded as not applicable (for example a male patient)
  if (!counselling.pregnancyAdvice && !counselling.pregnancyAdviceNotApplicable)
    return "Pregnancy / breastfeeding: tick 'Pregnancy / breastfeeding implications discussed', or 'Not applicable to this patient'";

  // Arm-specific items
  if (medicine && medicine.selectedMedicine === 'doxycycline' && !counselling.sunProtectionAdvice)
    return "Tick 'Sun protection advice (doxycycline)'";
  if (medicine && medicine.selectedMedicine === 'mefloquine' && !counselling.mefloquineStopAdvice)
    return "Tick 'Mefloquine: STOP at the first neuropsychiatric symptom'";

  return null;
}

// ─── Summary Validation ───

export function validateSummaryStep(
  summary: AMConsultationSummary
): string | null {
  if (!summary.pharmacistName.trim())
    return "Type the 'Pharmacist Name'";
  if (!summary.pharmacistGPhC.trim())
    return "Type the 'GPhC Registration Number'";
  if (!summary.pharmacyName.trim()) return "Type the 'Pharmacy Name'";

  return null;
}

// ─── Generic step validation dispatcher ───

export function validateStep(stepIndex: number, data: AMConsultationState): string | null {
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
      return validateCounsellingStep(data.counselling, data.medicineSelection);
    case 8: {
      // Before Save & Print, every earlier step must still pass. Going back
      // and changing an answer used to leave a stale medicine, weight or
      // itinerary in the record (adversarial review, 11 Sep 2026).
      const earlier = validateAllEarlierSteps(data, 8);
      if (earlier) return earlier;
      return validateSummaryStep(data.summary);
    }
    default:
      return null;
  }
}

/** Re-run every step before `upTo`; returns the first failure, prefixed with the step. */
export function validateAllEarlierSteps(data: AMConsultationState, upTo: number): string | null {
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

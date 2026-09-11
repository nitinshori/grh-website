import {
  DengueScreening,
  DengueContraindications,
  DengueVaccineAdministration,
  DenguePostVaccineObs,
  DengueAdvice,
} from './dengue-types';
import { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { calculateAge } from '../shared/types';
import { secondDoseIntervalMet, todayIso, DOSE_INTERVAL_MONTHS } from './dengue-clinical-logic';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePatientDetails(
  patient: BasePatientDetails
): ValidationResult {
  const errors: string[] = [];

  if (!patient.firstName?.trim()) {
    errors.push('First name is required');
  }
  if (!patient.lastName?.trim()) {
    errors.push('Last name is required');
  }
  if (!patient.dateOfBirth) {
    errors.push('Date of birth is required');
  }

  // Age gate per signed PGD (v005): adults 18+. Recomputed from the DOB so a
  // blank or stale age can never pass.
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
  if (patient.dateOfBirth && age === null) {
    errors.push('Unable to calculate age from the date of birth');
  }
  if (age !== null && age < 18) {
    errors.push('This PGD applies to adults aged 18 years and over');
  }
  if (!patient.nhsNumber?.trim()) {
    errors.push('NHS number is required');
  }
  // PGD v005 records: name, address, date of birth and GP.
  if (!patient.address?.trim()) {
    errors.push('Patient address is required (the PGD requires it to be recorded)');
  }
  if (!patient.gpPractice?.trim() && !patient.gpName?.trim()) {
    errors.push('The patient\'s GP is required: search for the practice, or enter "Not registered" as the GP name');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateConsent(consent: BaseConsent): ValidationResult {
  const errors: string[] = [];

  if (!consent.informedConsentGiven) {
    errors.push('Patient consent is required');
  }
  if (!consent.idVerified) {
    errors.push('Patient ID must be verified');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Step 2 (Travel Assessment). Only the fields on that step: the old single
 * validateScreening demanded the temperature, which is asked on step 3, so
 * no consultation could get past step 2 (adversarial review, 11 Sep 2026).
 */
export function validateTravel(screening: DengueScreening): ValidationResult {
  const errors: string[] = [];

  if (!screening.destinationCountry?.trim()) {
    errors.push('Destination country is required');
  }
  if (!screening.departureDate) {
    errors.push('Departure date is required');
  }
  if (!screening.travelDuration?.trim()) {
    errors.push('Travel duration is required');
  }
  if (!screening.endemicArea) {
    errors.push('This PGD covers travel to or residence in a dengue-endemic area only');
  }
  if (!screening.willingTwoDoses) {
    errors.push('Patient must be willing to receive two doses, 3 months apart');
  }
  if (screening.previousDengueInfection && !screening.dengueInfectionDetails?.trim()) {
    errors.push('Please describe previous dengue infection');
  }

  return { isValid: errors.length === 0, errors };
}

/** Step 3 (Medical History). */
export function validateMedicalHistory(screening: DengueScreening): ValidationResult {
  const errors: string[] = [];

  if (screening.temperature === null || screening.temperature === undefined) {
    errors.push('Temperature must be recorded');
  } else if (screening.temperature < 30 || screening.temperature > 45) {
    errors.push('Temperature must be a body temperature in degrees Celsius (30 to 45)');
  }
  if (screening.currentIllness && !screening.illnessDetails?.trim()) {
    errors.push('Please describe current illness');
  }
  if (screening.immunosuppressed && !screening.immunosuppressedDetails?.trim()) {
    errors.push('Please specify reason for immunosuppression');
  }

  return { isValid: errors.length === 0, errors };
}

/** Both halves together, for the pre-save check. */
export function validateScreening(screening: DengueScreening): ValidationResult {
  const a = validateTravel(screening);
  const b = validateMedicalHistory(screening);
  const errors = [...a.errors, ...b.errors];
  return { isValid: errors.length === 0, errors };
}

export function validateContraindications(
  contraindications: DengueContraindications
): ValidationResult {
  const errors: string[] = [];

  if (!contraindications.ageAppropriate) {
    errors.push('This PGD applies to adults aged 18 years and over');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdministration(
  administration: DengueVaccineAdministration
): ValidationResult {
  const errors: string[] = [];

  // Adrenaline must be in place before the vaccine is given, so it is
  // confirmed on this step, before the batch is recorded.
  if (!administration.adrenalineConfirmed) {
    errors.push('Confirm adrenaline 1 in 1,000 is immediately available, in date, with a telephone, BEFORE vaccinating');
  }
  if (!administration.batchNumber?.trim()) {
    errors.push('Batch number is required');
  }
  if (!administration.expiryDate?.trim()) {
    errors.push('Expiry date is required');
  }

  if (administration.expiryDate?.trim()) {
    // Day granularity: a batch expiring today is still in date today.
    if (administration.expiryDate < todayIso()) {
      errors.push('Vaccine batch has expired');
    }
  }

  if (!administration.injectionSite) {
    errors.push('Injection site must be selected');
  }
  if (!administration.doseNumber) {
    errors.push('Dose number must be selected');
  }
  if (!administration.administeredBy?.trim()) {
    errors.push('Administrator name is required');
  }
  if (!administration.timeAdministered?.trim()) {
    errors.push('Time of administration is required');
  }
  if (administration.doseNumber === '1st' && !administration.nextDueDate?.trim()) {
    errors.push('Next dose due date is required for first dose');
  }
  if (administration.doseNumber === '2nd') {
    // The schedule is a second dose 3 months after the first. A second dose
    // a fortnight after the first used to be accepted without a question.
    if (!administration.firstDoseDate?.trim()) {
      errors.push('Date of the first dose is required for a second dose');
    } else if (administration.firstDoseDate > todayIso()) {
      errors.push('Date of the first dose cannot be in the future');
    } else if (secondDoseIntervalMet(administration.firstDoseDate) === false) {
      errors.push(`The second dose is due ${DOSE_INTERVAL_MONTHS} months after the first: the interval has not yet elapsed. Do not give the second dose today`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePostVaccineObs(
  postVaccineObs: DenguePostVaccineObs
): ValidationResult {
  const errors: string[] = [];

  if (!postVaccineObs.observationPeriod) {
    errors.push('Observation period must be specified');
  }
  if (!postVaccineObs.observationCompleted) {
    errors.push('Record that the seated observation period (15 minutes) was completed');
  }

  if (postVaccineObs.adverseReaction && !postVaccineObs.reactionDetails?.trim()) {
    errors.push('Please describe the adverse reaction');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdvice(advice: DengueAdvice): ValidationResult {
  const errors: string[] = [];

  if (
    !advice.twoDozeSchedule ||
    !advice.commonReactions ||
    !advice.seriousReactions ||
    !advice.mosquitoPrevention ||
    !advice.dengueSymptomsWarning ||
    !advice.noOtherLiveVaccines ||
    !advice.returnIfConcerned ||
    !advice.avoidPregnancy4Weeks ||
    !advice.keepVaccinationRecord
  ) {
    errors.push('All advice points must be acknowledged');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateSummary(summary: BaseSummary): ValidationResult {
  const errors: string[] = [];
  if (!summary.pharmacistName?.trim()) {
    errors.push('Pharmacist name is required');
  }
  if (!summary.pharmacistGPhC?.trim()) {
    errors.push('GPhC registration number is required');
  }
  return { isValid: errors.length === 0, errors };
}

import {
  RabiesScreening,
  RabiesContraindications,
  RabiesVaccineAdministration,
  RabiesPostVaccineObs,
  RabiesAdvice,
} from './rabies-types';
import { BasePatientDetails, BaseConsent } from '../shared/types';

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
  if (!patient.nhsNumber?.trim()) {
    errors.push('NHS number is required');
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

export function validateScreening(screening: RabiesScreening): ValidationResult {
  const errors: string[] = [];

  if (!screening.destinationCountry?.trim()) {
    errors.push('Destination country is required');
  }
  if (!screening.departureDate) {
    errors.push('Departure date is required');
  }
  if (screening.highRiskActivities.length === 0) {
    errors.push('At least one activity category must be selected');
  }
  if (screening.temperature === null || screening.temperature === undefined) {
    errors.push('Temperature must be recorded');
  }
  if (screening.currentIllness && !screening.illnessDetails?.trim()) {
    errors.push('Please describe current illness');
  }
  if (screening.immunosuppressed && !screening.immunosuppressedDetails?.trim()) {
    errors.push('Please specify reason for immunosuppression');
  }
  if (screening.eggAllergy && !screening.eggAllergySeverity?.trim()) {
    errors.push('Please specify egg allergy severity');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateContraindications(
  contraindications: RabiesContraindications
): ValidationResult {
  const errors: string[] = [];

  if (!contraindications.ageAppropriate) {
    errors.push('Patient age is not appropriate for rabies vaccination');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdministration(
  administration: RabiesVaccineAdministration
): ValidationResult {
  const errors: string[] = [];

  if (!administration.batchNumber?.trim()) {
    errors.push('Batch number is required');
  }
  if (!administration.expiryDate?.trim()) {
    errors.push('Expiry date is required');
  }

  if (administration.expiryDate?.trim()) {
    const expiryDate = new Date(administration.expiryDate);
    const today = new Date();
    if (expiryDate < today) {
      errors.push('Vaccine batch has expired');
    }
  }

  if (!administration.injectionSite) {
    errors.push('Injection site must be selected');
  }
  if (!administration.doseNumber) {
    errors.push('Dose number must be selected');
  }
  if (!administration.schedule) {
    errors.push('Schedule (standard or accelerated) must be selected');
  }
  if (!administration.administeredBy?.trim()) {
    errors.push('Administrator name is required');
  }
  if (!administration.timeAdministered?.trim()) {
    errors.push('Time of administration is required');
  }
  if (!administration.nextDueDates?.trim()) {
    errors.push('Next due dates must be specified');
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePostVaccineObs(
  postVaccineObs: RabiesPostVaccineObs
): ValidationResult {
  const errors: string[] = [];

  if (!postVaccineObs.observationPeriod) {
    errors.push('Observation period must be specified');
  }
  if (!postVaccineObs.anaphylaxisKitChecked) {
    errors.push('Anaphylaxis kit must be checked');
  }

  if (postVaccineObs.adverseReaction && !postVaccineObs.reactionDetails?.trim()) {
    errors.push('Please describe the adverse reaction');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdvice(advice: RabiesAdvice): ValidationResult {
  const errors: string[] = [];

  if (
    !advice.threeDozeSchedule ||
    !advice.scheduleExplained ||
    !advice.pEPSimplification ||
    !advice.woundCleaning ||
    !advice.stillNeedPEP ||
    !advice.exposureWarning ||
    !advice.returnIfConcerned ||
    !advice.boosterInformation
  ) {
    errors.push('All advice points must be acknowledged');
  }

  return { isValid: errors.length === 0, errors };
}

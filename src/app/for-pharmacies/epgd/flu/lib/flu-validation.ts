import {
  FluScreening,
  FluContraindications,
  FluVaccineAdministration,
  FluPostVaccineObs,
  FluAdvice,
} from './flu-types';
import { BasePatientDetails, BaseConsent } from '../../shared/types';

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

export function validateScreening(screening: FluScreening): ValidationResult {
  const errors: string[] = [];

  if (screening.temperature === null || screening.temperature === undefined) {
    errors.push('Temperature must be recorded');
  }

  if (screening.previousReaction && !screening.reactionDetails?.trim()) {
    errors.push('Please describe the previous reaction');
  }

  if (screening.eggAllergy && !screening.eggAllergySeverity) {
    errors.push('Please specify egg allergy severity');
  }

  if (screening.currentIllness && !screening.illnessDetails?.trim()) {
    errors.push('Please describe current illness');
  }

  if (screening.immunosuppressed && !screening.immunosuppressedDetails?.trim()) {
    errors.push('Please specify reason for immunosuppression');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateContraindications(
  contraindications: FluContraindications
): ValidationResult {
  const errors: string[] = [];

  if (!contraindications.ageAppropriate) {
    errors.push('Patient age is not appropriate for flu vaccination');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdministration(
  administration: FluVaccineAdministration
): ValidationResult {
  const errors: string[] = [];

  if (!administration.vaccineName?.trim()) {
    errors.push('Vaccine name is required');
  }
  if (!administration.batchNumber?.trim()) {
    errors.push('Batch number is required');
  }
  if (!administration.expiryDate?.trim()) {
    errors.push('Expiry date is required');
  }

  // Validate expiry date format and that it is not expired
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
  if (!administration.route) {
    errors.push('Route of administration must be selected');
  }
  if (!administration.doseVolume?.trim()) {
    errors.push('Dose volume is required');
  }
  if (!administration.administeredBy?.trim()) {
    errors.push('Administrator name is required');
  }
  if (!administration.timeAdministered?.trim()) {
    errors.push('Time of administration is required');
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePostVaccineObs(
  postVaccineObs: FluPostVaccineObs
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

export function validateAdvice(advice: FluAdvice): ValidationResult {
  const errors: string[] = [];

  if (
    !advice.commonReactions ||
    !advice.seriousReactions ||
    !advice.paracetamolAdvice ||
    !advice.returnIfConcerned ||
    !advice.annualRevaccination
  ) {
    errors.push('All advice points must be acknowledged');
  }

  return { isValid: errors.length === 0, errors };
}

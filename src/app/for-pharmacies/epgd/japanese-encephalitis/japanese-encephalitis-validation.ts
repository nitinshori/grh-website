import {
  JapaneseEncephalitisScreening,
  JapaneseEncephalitisContraindications,
  JapaneseEncephalitisVaccineAdministration,
  JapaneseEncephalitisPostVaccineObs,
  JapaneseEncephalitisAdvice,
} from './japanese-encephalitis-types';
import { BasePatientDetails, BaseConsent } from '../shared/types';
import { calculateAgeInMonths, isRapidScheduleOffLabel } from './japanese-encephalitis-clinical-logic';

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

  // Age gate per PGD v005: aged 2 months or over, no upper limit
  const ageInMonths = calculateAgeInMonths(patient.dateOfBirth);
  if (ageInMonths !== null && ageInMonths < 2) {
    errors.push('This PGD applies to individuals aged 2 months or over');
  }
  if (!patient.nhsNumber?.trim()) {
    errors.push('NHS number is required');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateConsent(
  consent: BaseConsent,
  screening: JapaneseEncephalitisScreening,
  ageYears: number | null
): ValidationResult {
  const errors: string[] = [];

  if (!consent.informedConsentGiven) {
    errors.push('Patient consent is required');
  }
  if (!consent.idVerified) {
    errors.push('Patient ID must be verified');
  }
  if (ageYears !== null && ageYears < 16) {
    if (!screening.consentBasis) {
      errors.push('Under 16: record whether consent came from a person with parental responsibility or from a Gillick competent young person');
    }
    if (!screening.consentGiverDetails?.trim()) {
      errors.push('Under 16: record the consent giver\'s name and relationship, or the basis of the Gillick assessment');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateScreening(screening: JapaneseEncephalitisScreening): ValidationResult {
  const errors: string[] = [];

  if (!screening.destinationCountry?.trim()) {
    errors.push('Destination country is required');
  }
  if (!screening.riskArea?.trim()) {
    errors.push('Risk area description is required');
  }
  if (!screening.riskCategory) {
    errors.push('Select the Green Book risk category that applies to this traveller');
  }
  if (!screening.departureDate) {
    errors.push('Departure date is required');
  }
  if (!screening.travelDuration?.trim()) {
    errors.push('Travel duration is required');
  }
  if (!screening.sufficientTimeBeforeTravel) {
    errors.push('Confirm there is sufficient time before travel to complete the primary course (inclusion criterion)');
  }
  if (screening.outdoorActivities && !screening.activitiesDetails?.trim()) {
    errors.push('Please describe outdoor activities');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateMedicalHistory(screening: JapaneseEncephalitisScreening): ValidationResult {
  const errors: string[] = [];

  if (screening.temperature === null || screening.temperature === undefined) {
    errors.push('Temperature must be recorded');
  }
  if (screening.currentIllness && !screening.illnessDetails?.trim()) {
    errors.push('Please describe current illness');
  }
  if (screening.immunosuppressed && !screening.immunosuppressedDetails?.trim()) {
    errors.push('Please specify reason for immunosuppression');
  }
  if (screening.breastfeeding && !screening.breastfeedingRiskAssessment?.trim()) {
    errors.push('Breastfeeding: record the risk assessment (PGD caution)');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateContraindications(
  contraindications: JapaneseEncephalitisContraindications
): ValidationResult {
  const errors: string[] = [];

  if (!contraindications.ageAppropriate) {
    errors.push('Patient age is not appropriate for Japanese encephalitis vaccination (minimum 2 months)');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdministration(
  administration: JapaneseEncephalitisVaccineAdministration,
  screening: JapaneseEncephalitisScreening,
  ageYears: number | null
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
  if (!administration.route) {
    errors.push('Route must be selected');
  }
  if (screening.bleedingDisorder && administration.route === 'intramuscular') {
    errors.push('Bleeding disorder, thrombocytopenia or anticoagulation: give by deep subcutaneous injection, not intramuscularly');
  }
  if (!administration.doseNumber) {
    errors.push('Dose number must be selected');
  }
  if (!administration.schedule) {
    errors.push('Schedule must be selected');
  }
  if (
    administration.schedule === 'accelerated' &&
    isRapidScheduleOffLabel(ageYears) &&
    !administration.offLabelRapidConsent
  ) {
    errors.push('Rapid schedule outside adults aged 18 to 64 is off-label: record that this was explained and explicit consent given');
  }
  if (!administration.administeredBy?.trim()) {
    errors.push('Administrator name is required');
  }
  if (!administration.timeAdministered?.trim()) {
    errors.push('Time of administration is required');
  }
  if (!administration.nextDueDate?.trim()) {
    errors.push('Next due date is required');
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePostVaccineObs(
  postVaccineObs: JapaneseEncephalitisPostVaccineObs
): ValidationResult {
  const errors: string[] = [];

  if (!postVaccineObs.observationPeriod) {
    errors.push('Observation period must be specified');
  }
  if (!postVaccineObs.observationCompleted) {
    errors.push('Record that the observation period was completed (15 minutes minimum, seated)');
  }
  if (!postVaccineObs.anaphylaxisKitChecked) {
    errors.push('Confirm adrenaline 1:1000 and the written anaphylaxis protocol are immediately available');
  }

  if (postVaccineObs.adverseReaction && !postVaccineObs.reactionDetails?.trim()) {
    errors.push('Please describe the adverse reaction');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdvice(advice: JapaneseEncephalitisAdvice): ValidationResult {
  const errors: string[] = [];

  if (
    !advice.leafletGiven ||
    !advice.twoDozeSchedule ||
    !advice.scheduleExplained ||
    !advice.commonReactions ||
    !advice.seriousReactions ||
    !advice.mosquitoBitePrevention ||
    !advice.duskDawnBiting ||
    !advice.boosterInformation ||
    !advice.returnIfConcerned
  ) {
    errors.push('All advice points must be acknowledged');
  }

  return { isValid: errors.length === 0, errors };
}

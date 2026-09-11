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

  // Age gate per PGD v005 cover: from age 2 years onwards. Accelerated course 18 and over (checked at administration).
  if (patient.age !== null && patient.age < 2) {
    errors.push('This PGD covers patients from age 2 years onwards');
  }
  if (!patient.nhsNumber?.trim()) {
    errors.push('NHS number is required');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateConsent(
  consent: BaseConsent,
  screening: RabiesScreening,
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

export function validateScreening(screening: RabiesScreening): ValidationResult {
  const errors: string[] = [];

  if (!screening.indication) {
    errors.push('Select the indication (travel or occupational) for pre-exposure vaccination');
  }
  if (screening.indication !== 'occupational-uk' && !screening.destinationCountry?.trim()) {
    errors.push('Destination country is required');
  }
  if (screening.indication === 'occupational-uk' && !screening.otherActivities?.trim()) {
    errors.push('Record the occupational indication');
  }
  if (screening.indication !== 'occupational-uk' && !screening.departureDate) {
    errors.push('Departure date is required');
  }
  if (!screening.sufficientTimeBeforeTravel) {
    errors.push('Confirm there is sufficient time before travel to complete the chosen course (inclusion criterion)');
  }
  if (screening.highRiskActivities.length === 0 && !screening.otherActivities?.trim()) {
    errors.push('Select at least one activity category or describe the exposure risk');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateMedicalHistory(screening: RabiesScreening): ValidationResult {
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
  if (screening.eggAllergy && !screening.eggAllergySeverity?.trim()) {
    errors.push('Please specify egg allergy severity');
  }
  if (screening.pregnant && !screening.pregnancyRiskAssessment?.trim()) {
    errors.push('Pregnancy: record the risk assessment (PGD caution)');
  }
  if (screening.breastfeeding && !screening.breastfeedingRiskAssessment?.trim()) {
    errors.push('Breastfeeding: record the risk assessment (PGD caution)');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateContraindications(
  contraindications: RabiesContraindications
): ValidationResult {
  const errors: string[] = [];

  if (!contraindications.ageAppropriate) {
    errors.push('Patient age is not appropriate for this PGD (from age 2 years onwards)');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdministration(
  administration: RabiesVaccineAdministration,
  screening: RabiesScreening,
  contraindications: RabiesContraindications,
  ageYears: number | null
): ValidationResult {
  const errors: string[] = [];

  if (!administration.product) {
    errors.push('Select the product in hand: Rabipur (1.0 mL) or Verorab (0.5 mL)');
  }
  if (administration.product === 'rabipur' && contraindications.severeEggAllergy) {
    errors.push('Severe egg allergy: Rabipur is excluded (chick embryo cell residues including ovalbumin). Use Verorab or refer.');
  }
  if (administration.product === 'verorab' && contraindications.antibioticHypersensitivity) {
    errors.push('Hypersensitivity to polymyxin B, streptomycin or neomycin: Verorab is excluded. Use Rabipur where appropriate or refer.');
  }
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
    errors.push('Route must be selected (intramuscular, or deep subcutaneous in bleeding disorders)');
  }
  if (screening.bleedingDisorder && administration.route === 'intramuscular') {
    errors.push('Bleeding disorder, thrombocytopenia or anticoagulation: give by deep subcutaneous injection, not intramuscularly');
  }
  if (!administration.doseNumber) {
    errors.push('Dose number must be selected');
  }
  if (!administration.schedule) {
    errors.push('Schedule (conventional or accelerated) must be selected');
  }
  if (administration.schedule === 'accelerated') {
    if (ageYears !== null && ageYears < 18) {
      errors.push('Under 18: the accelerated course may not be given under this PGD. Give the conventional course, or refer to a travel clinic or the GP where a fast course is needed.');
    }
    if (screening.immunosuppressed) {
      errors.push('Immunosuppressed: the accelerated course is excluded. Use the conventional course and refer for post-course serology.');
    }
    if (!administration.scheduleReason?.trim()) {
      errors.push('Accelerated course: record the reason the conventional course was not possible');
    }
    if (!administration.offLabelConsent) {
      errors.push('Accelerated course is off-label: record that the consent script was given and consent to off-label use obtained, naming the day 0, 3 and 7 schedule');
    }
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
  if (!postVaccineObs.observationCompleted) {
    errors.push('Record that the 15 minute observation period was completed');
  }
  if (!postVaccineObs.anaphylaxisKitChecked) {
    errors.push('Confirm adrenaline 1 in 1,000, the written anaphylaxis protocol and a telephone are immediately available');
  }

  if (postVaccineObs.adverseReaction && !postVaccineObs.reactionDetails?.trim()) {
    errors.push('Please describe the adverse reaction');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdvice(advice: RabiesAdvice): ValidationResult {
  const errors: string[] = [];

  if (
    !advice.writtenRecordGiven ||
    !advice.threeDozeSchedule ||
    !advice.scheduleExplained ||
    !advice.pEPSimplification ||
    !advice.woundCleaning ||
    !advice.stillNeedPEP ||
    !advice.exposureWarning ||
    !advice.avoidAnimals ||
    !advice.returnIfConcerned ||
    !advice.boosterInformation
  ) {
    errors.push('All advice points must be acknowledged');
  }

  return { isValid: errors.length === 0, errors };
}

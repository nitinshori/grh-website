import {
  JapaneseEncephalitisScreening,
  JapaneseEncephalitisContraindications,
  JapaneseEncephalitisVaccineAdministration,
  JapaneseEncephalitisPostVaccineObs,
  JapaneseEncephalitisAdvice,
} from './japanese-encephalitis-types';
import { BasePatientDetails, BaseConsent } from '../shared/types';
import { calculateAgeInMonths, isRapidScheduleOffLabel, daysUntil, parseLocalDate, secondBoosterAllowed } from './japanese-encephalitis-clinical-logic';

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

  // Age gate per PGD v006: aged 2 months or over, no upper limit
  const ageInMonths = calculateAgeInMonths(patient.dateOfBirth);
  if (ageInMonths !== null && ageInMonths < 2) {
    errors.push('This PGD applies to individuals aged 2 months or over');
  }
  // NHS number is optional, as on every other tool: a visitor without one can still be seen.

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
  if (!consent.patientAwarePrivateService) {
    errors.push('Patient must be aware this is a private service');
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
    errors.push('Destination country/region is required');
  }
  if (!screening.riskArea?.trim()) {
    errors.push('Risk area (rural/urban, rice paddies, etc) is required');
  }
  if (!screening.riskCategory) {
    errors.push('Select the Green Book risk category that applies to this traveller');
  }
  if (!screening.departureDate) {
    errors.push('Departure date is required');
  }
  if (!screening.travelDuration?.trim()) {
    errors.push('Duration of travel is required');
  }
  // Under 14 days to departure the course cannot be completed before travel,
  // so the inclusion tick would be a false statement in the record. The late
  // presenter acknowledges the risk assessment instead.
  const days = daysUntil(screening.departureDate);
  if (days !== null && days >= 0 && days < 14) {
    if (!screening.insufficientTimeAcknowledged) {
      errors.push('Under 14 days to departure: tick "Insufficient time to complete the primary course before travel" once the risk has been assessed and the patient told protection will be incomplete');
    }
  } else if (!screening.sufficientTimeBeforeTravel) {
    errors.push(days !== null && days < 35
      ? 'Tick "Sufficient time before travel to complete the primary course using the rapid course": under 35 days only the rapid course (day 0 and day 7) can be completed a week before travel'
      : 'Tick "Sufficient time before travel to complete the primary course" (inclusion criterion)');
  }
  if (screening.outdoorActivities && !screening.activitiesDetails?.trim()) {
    errors.push('Extended outdoor activities is ticked: complete "Describe activities"');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateMedicalHistory(screening: JapaneseEncephalitisScreening): ValidationResult {
  const errors: string[] = [];

  // Temperature is optional: the document's exclusion is the pharmacist's
  // assessment of acute severe febrile illness, with no threshold.
  if (screening.currentIllness && !screening.illnessDetails?.trim()) {
    errors.push('Other current illness is ticked: complete "Describe current illness"');
  }
  if (screening.immunosuppressed && !screening.immunosuppressedDetails?.trim()) {
    errors.push('Immunosuppressed is ticked: complete "Details of immunosuppression"');
  }
  if (screening.breastfeeding && !screening.breastfeedingRiskAssessment?.trim()) {
    errors.push('Breastfeeding is ticked: complete "Breastfeeding risk assessment" (PGD caution)');
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

  // Adrenaline must be confirmed BEFORE the vaccine is given, so it is
  // checked here on the administration step, not retrospectively.
  if (!administration.anaphylaxisKitChecked) {
    errors.push('Tick "Adrenaline 1:1000 injection immediately available" before the vaccine is given (the batch number field is locked until this is ticked)');
  }
  if (!administration.batchNumber?.trim()) {
    errors.push('Batch number is required');
  }
  if (!parseLocalDate(administration.expiryDate)) {
    errors.push('Expiry date is required');
  } else {
    const d = daysUntil(administration.expiryDate);
    if (d !== null && d < 0) {
      errors.push('Vaccine batch has expired');
    }
  }

  if (!administration.injectionSite) {
    errors.push('Select the injection site');
  }
  if (!administration.route) {
    errors.push('Select the route');
  }
  if (screening.bleedingDisorder && administration.route === 'intramuscular') {
    errors.push('Bleeding disorder, thrombocytopenia or anticoagulation: give by deep subcutaneous injection, not intramuscularly');
  }
  if (!screening.bleedingDisorder && administration.route === 'deep-subcutaneous') {
    errors.push('Deep subcutaneous is authorised only for bleeding disorders, thrombocytopenia or anticoagulation; otherwise give intramuscularly');
  }
  if (!administration.doseNumber) {
    errors.push('Select the dose number');
  }
  if (administration.doseNumber === 'second-booster' && !secondBoosterAllowed(ageYears)) {
    errors.push('The second booster is authorised for adults aged 18 to 64 only');
  }
  if (!administration.schedule) {
    errors.push('Select the schedule (for a booster, the schedule used for the primary course)');
  }
  if (
    administration.schedule === 'accelerated' &&
    isRapidScheduleOffLabel(ageYears) &&
    !administration.offLabelRapidConsent
  ) {
    errors.push('Rapid schedule outside adults aged 18 to 64 is off-label: tick "Off-label rapid schedule explained and explicit consent documented"');
  }
  if (!administration.administeredBy?.trim()) {
    errors.push('Administered by (name) is required');
  }
  if (!administration.timeAdministered?.trim()) {
    errors.push('Time of administration is required');
  }
  // nextDueDate is computed from the schedule and dose number; it is blank
  // only where no further dose is scheduled, so it is not validated here.

  return { isValid: errors.length === 0, errors };
}

export function validatePostVaccineObs(
  postVaccineObs: JapaneseEncephalitisPostVaccineObs
): ValidationResult {
  const errors: string[] = [];

  if (!postVaccineObs.observationPeriod) {
    errors.push('Select the observation period');
  }
  if (!postVaccineObs.observationCompleted) {
    errors.push('Tick "Observation period completed, patient seated" (15 minutes minimum)');
  }
  // The record prints "Patient well: No" for an unticked box, so the box
  // cannot be left unanswered: either the patient was well, or a reaction
  // was observed and described.
  if (!postVaccineObs.patientWell && !postVaccineObs.adverseReaction) {
    errors.push('Tick "Patient is well after vaccination", or tick "Adverse reaction observed" and describe it');
  }

  if (postVaccineObs.adverseReaction && !postVaccineObs.reactionDetails?.trim()) {
    errors.push('Adverse reaction observed is ticked: complete "Describe adverse reaction"');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateSummary(summary: { pharmacistName: string; pharmacistGPhC: string }): ValidationResult {
  const errors: string[] = [];
  if (!summary.pharmacistName?.trim()) errors.push('Pharmacist name is required');
  if (!summary.pharmacistGPhC?.trim()) errors.push('GPhC registration number is required');
  return { isValid: errors.length === 0, errors };
}

export function validateAdvice(advice: JapaneseEncephalitisAdvice): ValidationResult {
  const errors: string[] = [];

  const points: [boolean, string][] = [
    [advice.leafletGiven, "Manufacturer's patient information leaflet given"],
    [advice.twoDozeSchedule, 'Two-dose primary course explained'],
    [advice.scheduleExplained, 'Schedule and date of the second dose'],
    [advice.commonReactions, 'Common local and systemic reactions'],
    [advice.seriousReactions, 'Serious reactions and no vaccine is completely protective'],
    [advice.mosquitoBitePrevention, 'Mosquito bite avoidance as the primary protection'],
    [advice.duskDawnBiting, 'Dusk to dawn biting mosquitoes'],
    [advice.boosterInformation, 'Booster information'],
    [advice.returnIfConcerned, 'When to seek help'],
  ];
  const missing = points.filter(([done]) => !done).map(([, label]) => label);
  if (missing.length > 0) {
    errors.push(`Every advice point must be ticked once given. Still unticked: ${missing.map((m) => `"${m}"`).join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

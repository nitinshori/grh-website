import {
  RabiesScreening,
  RabiesContraindications,
  RabiesVaccineAdministration,
  RabiesPostVaccineObs,
  RabiesAdvice,
} from './rabies-types';
import { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';
import { daysFromToday, minimumIntervalDays } from './rabies-clinical-logic';

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

  // Age gate per PGD v006 cover: from age 2 years onwards. Accelerated course 18 and over (checked at administration).
  if (patient.age !== null && patient.age < 2) {
    errors.push('This PGD covers patients from age 2 years onwards');
  }
  // NHS number is optional, as on every other tool and as the shared field is
  // labelled: the validator used to demand it while the label said
  // "(optional)", and a visitor without one could not be seen.

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
    errors.push('Destination country/region is required');
  }
  if (screening.indication === 'occupational-uk' && !screening.otherActivities?.trim()) {
    errors.push('UK occupational indication: record the occupation under "Other activities, exposure risks or occupational indication"');
  }
  if (screening.indication !== 'occupational-uk' && !screening.departureDate) {
    errors.push('Departure date is required');
  }
  if (screening.indication !== 'occupational-uk') {
    if (!screening.sufficientTimeBeforeTravel) {
      errors.push('Tick "Sufficient time before travel to complete the chosen course" (inclusion criterion)');
    }
    const days = daysFromToday(screening.departureDate);
    if (days !== null && days < 0) {
      errors.push('Departure date is in the past');
    }
  }
  if (screening.highRiskActivities.length === 0 && !screening.otherActivities?.trim()) {
    errors.push('Tick at least one high-risk activity, or describe the exposure risk under "Other activities, exposure risks or occupational indication"');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateMedicalHistory(screening: RabiesScreening): ValidationResult {
  const errors: string[] = [];

  if (screening.temperature === null || screening.temperature === undefined) {
    errors.push('Body temperature (°C) must be recorded');
  }
  if (screening.currentIllness && !screening.illnessDetails?.trim()) {
    errors.push('Minor current illness is ticked: complete "Describe current illness"');
  }
  if (screening.immunosuppressed && !screening.immunosuppressedDetails?.trim()) {
    errors.push('Immunosuppressed is ticked: complete "Details of immunosuppression"');
  }
  if (screening.eggAllergy && !screening.eggAllergySeverity?.trim()) {
    errors.push('Egg allergy is ticked: select "Egg allergy severity"');
  }
  if (screening.antibioticHypersensitivity && !screening.hypersensitivityIncludesNeomycin) {
    errors.push('Antibiotic hypersensitivity: record whether it extends to neomycin (Rabipur contains traces of neomycin)');
  }
  if (screening.pregnant && !screening.pregnancyRiskAssessment?.trim()) {
    errors.push('Pregnant is ticked: complete "Pregnancy risk assessment" (PGD caution)');
  }
  if (screening.breastfeeding && !screening.breastfeedingRiskAssessment?.trim()) {
    errors.push('Breastfeeding is ticked: complete "Breastfeeding risk assessment" (PGD caution)');
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
  ageYears: number | null,
  adrenalineConfirmed: boolean = true
): ValidationResult {
  const errors: string[] = [];

  // Adrenaline must be immediately available whenever a vaccine is
  // administered under this PGD: confirmed before the injection is recorded,
  // not on the advice step afterwards.
  if (!adrenalineConfirmed) {
    errors.push('Tick "Adrenaline (epinephrine) 1 in 1,000 injection is immediately available" before administering');
  }

  if (!administration.product) {
    errors.push('Select the product in hand: Rabipur (1.0 mL) or Verorab (0.5 mL)');
  }
  if (administration.product === 'rabipur' && contraindications.severeEggAllergy) {
    errors.push('Severe egg allergy: Rabipur is excluded (chick embryo cell residues including ovalbumin). Use Verorab or refer.');
  }
  if (administration.product === 'verorab' && contraindications.antibioticHypersensitivity) {
    errors.push('Hypersensitivity to polymyxin B, streptomycin or neomycin: Verorab is excluded. Use Rabipur only where the hypersensitivity does not extend to neomycin, otherwise refer.');
  }
  if (administration.product === 'rabipur' && contraindications.neomycinHypersensitivity) {
    errors.push('Neomycin hypersensitivity: Rabipur contains traces of neomycin and is excluded. Neither product can be given; refer.');
  }
  if (!administration.batchNumber?.trim()) {
    errors.push('Batch number is required');
  }
  if (!administration.expiryDate?.trim()) {
    errors.push('Expiry date is required');
  }

  if (administration.expiryDate?.trim()) {
    // Calendar days: a batch expiring today is still in date today.
    const d = daysFromToday(administration.expiryDate);
    if (d !== null && d < 0) {
      errors.push('Vaccine batch has expired: do not administer, quarantine the stock and select an in-date batch');
    }
  }

  if (!administration.injectionSite) {
    errors.push('Select the injection site');
  }
  if (!administration.route) {
    errors.push('Select the route (intramuscular, or deep subcutaneous in bleeding disorders)');
  }
  if (screening.bleedingDisorder && administration.route === 'intramuscular') {
    errors.push('Bleeding disorder, thrombocytopenia or anticoagulation: give by deep subcutaneous injection, not intramuscularly');
  }
  if (!administration.doseNumber) {
    errors.push('Select the dose number');
  }
  if (!administration.schedule) {
    errors.push('Select the schedule (conventional or accelerated)');
  }
  if (administration.schedule === 'accelerated') {
    if (ageYears !== null && ageYears < 18) {
      errors.push('Under 18: the accelerated course may not be given under this PGD. Give the conventional course, or refer to a travel clinic or the GP where a fast course is needed.');
    }
    if (screening.immunosuppressed) {
      errors.push('Immunosuppressed: the accelerated course is excluded. Use the conventional course and refer for post-course serology.');
    }
    if (!administration.scheduleReason?.trim()) {
      errors.push('Accelerated course: complete "Reason the conventional course was not possible"');
    }
    if (!administration.offLabelConsent) {
      errors.push('Accelerated course is off-label: tick "Consent script given and consent to off-label use recorded"');
    }
  }

  // Interval since the previous dose. Dose number used to be a free select
  // with no date behind it, so a second dose could be recorded the day after
  // the first and the next-due dates printed from today rather than the
  // course's own day 0.
  const minInterval = minimumIntervalDays(administration.schedule, administration.doseNumber);
  if (administration.doseNumber && administration.doseNumber !== '1st') {
    if (!administration.previousDoseDate) {
      errors.push('Record the date of the previous dose in this course');
    } else {
      const daysSincePrevious = -(daysFromToday(administration.previousDoseDate) ?? 0);
      if (daysFromToday(administration.previousDoseDate) === null) {
        errors.push('Previous dose date is not a valid date');
      } else if (daysSincePrevious < 0) {
        errors.push('Previous dose date cannot be in the future');
      } else if (minInterval !== null && daysSincePrevious < minInterval) {
        errors.push(`Too soon: this dose is not due until at least ${minInterval} days after the previous dose (${daysSincePrevious} days ago)`);
      }
    }
  }

  // Sufficient time before travel to complete the chosen course (inclusion
  // criterion), and the accelerated course only where the conventional one
  // genuinely cannot be completed.
  if (screening.indication !== 'occupational-uk' && screening.departureDate) {
    const daysToDeparture = daysFromToday(screening.departureDate);
    if (daysToDeparture !== null) {
      if (administration.doseNumber === '1st') {
        if (administration.schedule === 'standard' && daysToDeparture < 21) {
          errors.push(`Departure in ${daysToDeparture} days: the conventional course cannot be completed before travel (third dose not before day 21). Use the accelerated course (18 and over, off-label) or refer.`);
        }
        if (administration.schedule === 'accelerated' && daysToDeparture >= 21) {
          errors.push(`Departure in ${daysToDeparture} days: there is time to complete the conventional course (third dose from day 21), so the off-label accelerated course may not be used.`);
        }
        if (administration.schedule === 'accelerated' && daysToDeparture < 7) {
          errors.push(`Departure in ${daysToDeparture} days: not even the accelerated course can be completed before travel. The inclusion criterion is not met; refer to a travel clinic.`);
        }
      }
      if (administration.doseNumber === '2nd' && administration.previousDoseDate) {
        const sinceDay0 = -(daysFromToday(administration.previousDoseDate) ?? 0);
        const daysNeeded = administration.schedule === 'accelerated' ? 7 : 21;
        if (sinceDay0 + daysToDeparture < daysNeeded) {
          errors.push('The third dose of the chosen course cannot be given before departure. Record the plan for completing the course, or refer.');
        }
      }
    }
  }

  if (!administration.administeredBy?.trim()) {
    errors.push('Administered by (name) is required');
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

  if (!postVaccineObs.observationCompleted) {
    errors.push('Tick "15 minute observation period completed"');
  }
  if (!postVaccineObs.anaphylaxisKitChecked) {
    errors.push('Adrenaline was not confirmed on the Administration step: go back and tick "Adrenaline (epinephrine) 1 in 1,000 injection is immediately available"');
  }
  // The record prints "Patient well: No" for an unticked box, so it cannot be
  // left unanswered: either the patient was well, or a reaction was observed.
  if (!postVaccineObs.patientWell && !postVaccineObs.adverseReaction) {
    errors.push('Tick "Patient is well after vaccination", or tick "Adverse reaction observed" and describe it');
  }

  if (postVaccineObs.adverseReaction && !postVaccineObs.reactionDetails?.trim()) {
    errors.push('Adverse reaction observed is ticked: complete "Describe adverse reaction"');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdvice(advice: RabiesAdvice): ValidationResult {
  const errors: string[] = [];

  const points: [boolean, string][] = [
    [advice.writtenRecordGiven, 'Patient information leaflet and written vaccination record given'],
    [advice.threeDozeSchedule, 'Three-dose course explained: come back for every dose'],
    [advice.scheduleExplained, 'Schedule intervals'],
    [advice.pEPSimplification, 'This does not make you immune to rabies'],
    [advice.woundCleaning, 'Wound cleaning'],
    [advice.stillNeedPEP, 'Post-exposure treatment still needed after any exposure'],
    [advice.exposureWarning, 'Exposure warning'],
    [advice.avoidAnimals, 'Avoid contact with animals while away'],
    [advice.returnIfConcerned, 'Side effects and when to seek help'],
    [advice.boosterInformation, 'Booster information'],
  ];
  const missing = points.filter(([done]) => !done).map(([, label]) => label);
  if (missing.length > 0) {
    errors.push(`Every advice point must be ticked once given. Still unticked: ${missing.map((m) => `"${m}"`).join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

export function validateSummaryStep(summary: BaseSummary): ValidationResult {
  const errors: string[] = [];
  if (!summary.pharmacistName?.trim()) {
    errors.push('Pharmacist name is required');
  }
  if (!summary.pharmacistGPhC?.trim()) {
    errors.push('GPhC registration number is required');
  }
  return { isValid: errors.length === 0, errors };
}

/** Advice given to an excluded patient must be recorded (PGD records row). */
export function validateExclusionRecord(screening: RabiesScreening): ValidationResult {
  const errors: string[] = [];
  if (!screening.exclusionAdviceGiven?.trim()) {
    errors.push('Record the advice given to the patient and the decision reached (referral, postponement or alternative service)');
  }
  return { isValid: errors.length === 0, errors };
}

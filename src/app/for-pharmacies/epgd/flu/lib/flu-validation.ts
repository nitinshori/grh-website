// Aligned to the seasonal influenza vaccines PGD (IIVc, aIIV, IIVr, IIVe), 2026/27 season,
// version 004, issued 11 September 2026.
import {
  FluScreening,
  FluContraindications,
  FluVaccineAdministration,
  FluPostVaccineObs,
  FluAdvice,
  FluChildConsent,
} from './flu-types';
import { BasePatientDetails, BaseConsent } from '../../shared/types';
import { needsTwoDoses, vaccineTypeRefusal } from './flu-clinical-logic';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

export function validatePatientDetails(
  patient: BasePatientDetails,
  patientAge?: number
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
  if (patient.dateOfBirth && patientAge !== undefined && patientAge < 2) {
    errors.push('Aged under 2 years: excluded. Refer to the NHS childhood programme, the GP or a service commissioned to vaccinate this age group');
  }
  if (!patient.nhsNumber?.trim()) {
    errors.push('NHS number is required');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateConsent(
  consent: BaseConsent,
  childConsent?: FluChildConsent,
  patientAge?: number
): ValidationResult {
  const errors: string[] = [];

  if (!consent.informedConsentGiven) {
    errors.push('Patient consent is required');
  }
  if (!consent.idVerified) {
    errors.push('Patient ID must be verified');
  }
  if (childConsent && patientAge !== undefined && patientAge < 16) {
    if (!childConsent.basis) {
      errors.push('Under 16: record whether consent came from a person with parental responsibility or from the young person as Gillick competent');
    }
    if (childConsent.basis === 'parental' && !childConsent.parentName.trim()) {
      errors.push('Record the name of the person with parental responsibility');
    }
    if (childConsent.basis === 'parental' && !childConsent.parentRelationship.trim()) {
      errors.push('Record the relationship of the person with parental responsibility to the child');
    }
    if (childConsent.basis === 'gillick' && !childConsent.gillickBasis.trim()) {
      errors.push('Record the basis of the Gillick competence assessment');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateScreening(screening: FluScreening, patientAge?: number): ValidationResult {
  const errors: string[] = [];

  if (screening.temperature === null || screening.temperature === undefined) {
    errors.push('Temperature must be recorded');
  }

  if (screening.previousReaction && !screening.previousReactionType) {
    errors.push('Record whether the previous reaction was a confirmed anaphylactic reaction or another reaction');
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

  if (!screening.nhsStatus) {
    errors.push('Record whether the patient does not qualify for NHS vaccination, or qualifies but prefers to be vaccinated privately');
  }

  const nhsEligibleGroup =
    screening.pregnant || (patientAge !== undefined && patientAge < 16);
  if (nhsEligibleGroup && screening.nhsStatus === 'not-eligible') {
    errors.push('Pregnant women and children eligible under the NHS childhood programme are eligible for NHS vaccination and must be told they can receive it free of charge before a private supply');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateContraindications(
  contraindications: FluContraindications
): ValidationResult {
  const errors: string[] = [];

  if (!contraindications.ageAppropriate) {
    errors.push('Patient is under 2 years: excluded under this PGD');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAdministration(
  administration: FluVaccineAdministration,
  patientAge?: number,
  screening?: FluScreening
): ValidationResult {
  const errors: string[] = [];

  if (!administration.adrenalineAvailable) {
    errors.push('Confirm adrenaline (epinephrine) 1 in 1,000 injection and a telephone are immediately available');
  }

  if (!administration.vaccineName) {
    errors.push('Vaccine type is required');
  }
  if (administration.vaccineName && patientAge !== undefined && screening) {
    const refusal = vaccineTypeRefusal(administration.vaccineName, patientAge, screening.eggAllergy);
    if (refusal) errors.push(refusal);
  }
  if (!administration.brandName?.trim()) {
    errors.push('Brand name as printed on the pack is required');
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
  const dose = administration.doseVolume?.replace(/\s+/g, '').toLowerCase();
  if (!dose) {
    errors.push('Dose volume is required');
  } else if (dose !== '0.5ml') {
    errors.push('A single 0.5 ml dose applies to every vaccine and age covered by this PGD');
  }
  if (!administration.administeredBy?.trim()) {
    errors.push('Administrator name is required');
  }
  if (!administration.timeAdministered?.trim()) {
    errors.push('Time of administration is required');
  }

  if (screening && patientAge !== undefined && needsTwoDoses(screening, patientAge)) {
    if (!administration.doseNumber) {
      errors.push('Child under 9 receiving influenza vaccine for the first time: record whether this is dose 1 or dose 2 of 2');
    }
    if (administration.doseNumber === '1' && !administration.nextDoseDue) {
      errors.push('Book the second dose at this appointment and record the date it is due (at least 4 weeks after today)');
    }
    if (administration.doseNumber === '2') {
      if (!administration.previousDoseDate) {
        errors.push('Record the date of dose 1');
      } else {
        const today = new Date().toISOString().split('T')[0];
        const days = daysBetween(administration.previousDoseDate, today);
        if (days !== null && days < 28) {
          errors.push('The second dose must be given at least 4 weeks after the first');
        }
      }
    }
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

export function validateAdvice(advice: FluAdvice, secondDoseDue?: boolean): ValidationResult {
  const errors: string[] = [];

  if (
    !advice.commonReactions ||
    !advice.seriousReactions ||
    !advice.paracetamolAdvice ||
    !advice.returnIfConcerned ||
    !advice.annualRevaccination ||
    !advice.cannotCauseFlu ||
    !advice.pilAndRecordGiven
  ) {
    errors.push('All advice points must be acknowledged');
  }
  if (secondDoseDue && !advice.secondDoseDateGiven) {
    errors.push('Give written confirmation of the date the second dose is due');
  }

  return { isValid: errors.length === 0, errors };
}

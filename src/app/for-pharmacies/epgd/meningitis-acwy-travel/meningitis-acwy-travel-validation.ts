import type {
  MeningitisACWYPatientDetails,
  MeningitisACWYConsent,
  MeningitisACWYSummary,
  MeningitisACWYMedicalHistory,
  MeningitisACWYPostVaccineAdvice,
} from './meningitis-acwy-travel-types';
import {
  calculateAgeInDays,
  calculateAgeInMonths,
  daysSince,
  daysFromToday,
  ageInMonthsAt,
  isSaudiTravel,
  isInfantBoosterCandidate,
} from './meningitis-acwy-travel-clinical-logic';

/** Two months, the minimum gap in every Nimenrix infant schedule in the PGD. */
const TWO_MONTHS_DAYS = 61;

export function validateMeningitisACWYPatientStep(
  patient: MeningitisACWYPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  const ageDays = calculateAgeInDays(patient.dateOfBirth);
  if (ageDays !== null && ageDays < 42) {
    return 'Patient must be at least 6 weeks old (Nimenrix minimum age; MenQuadfi from 12 months, Menveo from 2 years)';
  }
  return null;
}

export function validateMeningitisACWYTravelStep(
  patient: MeningitisACWYPatientDetails,
  travelAssessment: {
    travelDestinationConfirmed: boolean;
    travelReasonConfirmed: boolean;
    timingConfirmed: boolean;
  }
): string | null {
  if (!patient.travelDestination.trim()) return 'Travel destination is required';
  if (!patient.travelReason) return 'Select the reason for travel';
  if (!patient.departureDate) return 'Departure date is required';
  if (patient.previousMenACWYDose && !patient.previousDoseDate) {
    return 'Record the date of the previous MenACWY dose';
  }
  if (patient.previousMenACWYDose && patient.previousDoseDate) {
    const since = daysSince(patient.previousDoseDate);
    if (since === null) return 'Previous dose date is not a valid date';
    if (since < 0) return 'Previous dose date cannot be in the future';
    const ageAt = ageInMonthsAt(patient.dateOfBirth, patient.previousDoseDate);
    if (ageAt !== null && ageAt < 0) return 'Previous dose date is before the date of birth';
  }
  if (!travelAssessment.travelDestinationConfirmed) return 'Tick "Travel destination confirmed"';
  if (!travelAssessment.travelReasonConfirmed) return 'Tick "Travel reason confirmed"';
  if (!travelAssessment.timingConfirmed) return 'Tick "Departure timing confirmed"';
  return null;
}

export function validateMeningitisACWYConsentStep(
  consent: MeningitisACWYConsent,
  ageYears: number | null = null
): string | null {
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (ageYears !== null && ageYears < 16) {
    if (!consent.consentBasis)
      return 'Under 16: record whether consent came from a person with parental responsibility or from a Gillick competent young person. Under 16 with neither is an exclusion.';
    if (!consent.consentGiverDetails.trim())
      return 'Under 16: record the consent giver\'s name and relationship, or the basis of the Gillick competence assessment';
  }
  if (!consent.understands5YearValidity)
    return 'Tick "Patient told a conjugate vaccine certificate is accepted for 5 years"';
  if (!consent.understandsTimingRequirement)
    return 'Tick "Patient told the timing requirement (at least 10 days before arrival in Saudi Arabia)"';
  return null;
}

export function validateMeningitisACWYMedicalHistoryStep(data: MeningitisACWYMedicalHistory): string | null {
  // Every answer here feeds the alerts reviewed on the next step; nothing is mandatory to tick.
  void data;
  return null;
}

export function validateMeningitisACWYContraindicationsStep(data: {
  confirmedNoAbsoluteContraindications: boolean;
}): string | null {
  if (!data.confirmedNoAbsoluteContraindications)
    return 'Tick "I confirm no absolute contraindications are present and vaccination can proceed"';
  return null;
}

/**
 * Licensed minimum age per product, in months. PGD v007: Nimenrix from 6
 * weeks, MenQuadfi from 12 months, Menveo from 2 years. Age below the licensed
 * minimum for the product held is an exclusion, so the tool refuses the
 * product rather than letting the pharmacist pick whatever is in the fridge.
 */
export const MENACWY_MIN_AGE_MONTHS: Record<string, { months: number; label: string }> = {
  nimenrix: { months: 0, label: '6 weeks' },
  menquadfi: { months: 12, label: '12 months' },
  menveo: { months: 24, label: '2 years' },
};

const PRODUCT_LABEL: Record<string, string> = {
  nimenrix: 'Nimenrix',
  menquadfi: 'MenQuadfi',
  menveo: 'Menveo',
};

export function validateMeningitisACWYAdministrationStep(
  summary: Partial<MeningitisACWYSummary>,
  patient: MeningitisACWYPatientDetails,
  medicalHistory: MeningitisACWYMedicalHistory
): string | null {
  if (!summary.vaccineType) return 'Select the vaccine type';
  const ageDays = calculateAgeInDays(patient.dateOfBirth);
  const ageMonths = calculateAgeInMonths(patient.dateOfBirth);
  const min = MENACWY_MIN_AGE_MONTHS[summary.vaccineType];
  if (summary.vaccineType === 'nimenrix' && ageDays !== null && ageDays < 42) {
    return 'Nimenrix is licensed from 6 weeks; this patient is younger. Do not vaccinate under this PGD.';
  }
  if (min && ageMonths !== null && ageMonths < min.months) {
    return `${PRODUCT_LABEL[summary.vaccineType]} is licensed from ${min.label}; this patient is younger. Choose a product licensed for this age (Nimenrix from 6 weeks) or do not vaccinate under this PGD.`;
  }
  if (summary.vaccineType === 'menveo' && medicalHistory.diphtheriaToxoidHypersensitivity) {
    return 'Hypersensitivity to diphtheria toxoid or CRM197: Menveo is excluded. Use Nimenrix or MenQuadfi (tetanus toxoid conjugates).';
  }
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Select the administration site';
  const isThigh = summary.administrationSite === 'left-thigh' || summary.administrationSite === 'right-thigh';
  if (ageMonths !== null && ageMonths < 12 && !isThigh) {
    return 'Under 1 year: give into the anterolateral thigh';
  }
  if (ageMonths !== null && ageMonths >= 12 && isThigh) {
    return 'From 1 year of age and in adults: give into the deltoid';
  }
  if (!summary.doseNumber) return 'Select the dose number';
  if (!summary.expiryDate) return 'Expiry date is required';
  {
    const exp = daysFromToday(summary.expiryDate);
    if (exp === null) return 'Expiry date is not a valid date';
    if (exp < 0) return 'This batch has expired. Do not use it.';
  }

  const since = daysSince(patient.previousDoseDate);
  const ageAtPrevious = ageInMonthsAt(patient.dateOfBirth, patient.previousDoseDate);
  const infantBooster = isInfantBoosterCandidate(patient);
  const infantCourseContinuing =
    patient.previousMenACWYDose && ageMonths !== null && ageMonths < 12 && ageAtPrevious !== null && ageAtPrevious < 6;

  // Which dose numbers are open to this patient, by age and history.
  if (ageMonths !== null && ageMonths < 6) {
    if (summary.doseNumber !== '1st' && summary.doseNumber !== '2nd') {
      return '6 weeks to under 6 months (Nimenrix): two doses at least 2 months apart; select 1st or 2nd dose';
    }
    if (summary.doseNumber === '1st' && patient.previousMenACWYDose) {
      return 'A previous MenACWY dose is recorded on the travel step: this is the 2nd dose of the course, not the 1st';
    }
  } else if (ageMonths !== null && ageMonths < 12) {
    if (infantCourseContinuing) {
      if (summary.doseNumber !== '2nd') {
        return 'Course started under 6 months: this is the 2nd dose of two (Nimenrix); select 2nd dose';
      }
    } else if (summary.doseNumber !== 'single') {
      return '6 to 11 months (Nimenrix): a single dose with a booster at 12 months of age';
    }
  } else if (ageMonths !== null) {
    if (infantBooster) {
      if (summary.doseNumber !== 'booster-12-months') {
        return 'Primary dose given under 12 months of age: this is the booster at 12 months of age (Nimenrix); select "Booster at 12 months"';
      }
    } else if (patient.previousMenACWYDose) {
      if (summary.doseNumber !== 'repeat-certificate') {
        return 'A previous MenACWY dose is recorded: the only repeat authorised under this PGD is "Repeat for certificate" (previous dose more than 5 years ago, valid certificate required for travel to Saudi Arabia)';
      }
    } else if (summary.doseNumber !== 'single') {
      return 'From 12 months of age all products are a single dose; select "Single dose"';
    }
  }

  // Intervals. Every infant schedule in the PGD is defined by a gap of at
  // least 2 months; until now the tool checked which label was allowed but
  // never the gap.
  if (summary.doseNumber === '2nd') {
    if (!patient.previousMenACWYDose || !patient.previousDoseDate) {
      return '2nd dose: tick "Previous MenACWY dose received" on the travel step and record the date of the 1st dose';
    }
    if (since !== null && since < TWO_MONTHS_DAYS) {
      return `2nd dose: the two doses must be at least 2 months apart. The 1st dose was ${since} days ago; not due until ${TWO_MONTHS_DAYS} days`;
    }
  }
  if (summary.doseNumber === 'booster-12-months') {
    if (!patient.previousMenACWYDose || !patient.previousDoseDate) {
      return 'Booster at 12 months: tick "Previous MenACWY dose received" on the travel step and record the date of the primary dose';
    }
    if (ageMonths !== null && ageMonths < 12) {
      return 'Booster at 12 months: the patient is not yet 12 months old';
    }
    if (ageMonths !== null && ageMonths >= 24) {
      return 'Booster at 12 months of age is the Nimenrix infant course booster (12 to 23 months); it does not apply at this age';
    }
    if (ageAtPrevious !== null && ageAtPrevious >= 12) {
      return 'Booster at 12 months applies only where the primary dose was given before 12 months of age';
    }
    if (since !== null && since < TWO_MONTHS_DAYS) {
      return `Booster at 12 months: must be at least 2 months after the primary dose. The primary dose was ${since} days ago; not due until ${TWO_MONTHS_DAYS} days`;
    }
  }
  if (summary.doseNumber === 'repeat-certificate') {
    if (!patient.previousMenACWYDose || !patient.previousDoseDate) {
      return 'Repeat for certificate: record the date of the previous dose on the travel step';
    }
    if (since !== null && since < 5 * 365) {
      return 'Repeat for certificate: authorised only where the previous dose was more than 5 years ago. A conjugate vaccine given within the last 5 years is accepted for Hajj and Umrah.';
    }
    if (!isSaudiTravel(patient)) {
      return 'Repeat for certificate: authorised only where a valid certificate is required for travel to Saudi Arabia. Routine boosters are not recommended for other travellers.';
    }
    if (!patient.repeatDoseReason.trim()) {
      return 'Repeat for certificate: complete "Reason for the repeat dose" on the Travel Assessment step';
    }
  }
  const courseContinues =
    summary.doseNumber === '1st' ||
    (summary.doseNumber === 'single' && ageMonths !== null && ageMonths < 12) ||
    (summary.doseNumber === '2nd' && ageMonths !== null && ageMonths < 12);
  if (courseContinues && !summary.nextDueDate) {
    return 'A course is involved: complete "Date the next dose is due" and book it at this appointment';
  }
  if (!summary.administrationTime) return 'Time of administration is required';
  return null;
}

export function validateMeningitisACWYPostVaccineStep(data: MeningitisACWYPostVaccineAdvice, courseInvolved: boolean = false): string | null {
  if (!data.leafletGiven) return 'Tick "Patient information leaflet for the product given supplied"';
  if (!data.counselledReactions) return 'Tick "Patient has been advised of common reactions"';
  if (!data.counselledValidity) return 'Tick "Patient understands a conjugate vaccine certificate is accepted for 5 years"';
  if (!data.counselledConjugateCertificate) return 'Tick "Certificate counselling: given at least 10 days before arrival; certificate states CONJUGATE vaccine"';
  if (!data.counselledNotMenB) return 'Tick "Patient told this vaccine does not protect against group B meningococcal disease"';
  if (!data.counselledMeningitisSigns) return 'Tick "Signs of meningitis and septicaemia counselled"';
  if (courseInvolved && !data.nextDoseBooked) return 'Tick "Next dose of the course booked at this appointment"';
  if (!data.counselledCertificate) return 'Tick "Patient advised to report serious adverse events"';
  if (!data.observationCompleted) return 'Tick "15 minute observation period completed, patient vaccinated seated"';
  if (!data.patientAdvised) return 'Tick "All counselling completed and documented"';
  return null;
}

export function validateMeningitisACWYSummaryStep(
  summary: Partial<MeningitisACWYSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}

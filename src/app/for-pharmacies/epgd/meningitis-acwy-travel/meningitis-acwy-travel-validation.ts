import type {
  MeningitisACWYPatientDetails,
  MeningitisACWYConsent,
  MeningitisACWYSummary,
  MeningitisACWYMedicalHistory,
  MeningitisACWYPostVaccineAdvice,
} from './meningitis-acwy-travel-types';
import { calculateAgeInDays, calculateAgeInMonths } from './meningitis-acwy-travel-clinical-logic';

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
  if (!patient.travelReason) return 'Travel reason must be selected';
  if (!patient.departureDate) return 'Departure date is required';
  if (patient.previousMenACWYDose && !patient.previousDoseDate) {
    return 'Record the date of the previous MenACWY dose';
  }
  if (!travelAssessment.travelDestinationConfirmed) return 'Please confirm travel destination';
  if (!travelAssessment.travelReasonConfirmed) return 'Please confirm travel reason';
  if (!travelAssessment.timingConfirmed) return 'Please confirm departure timing';
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
    return 'Patient must confirm understanding that a conjugate vaccine certificate is accepted for 5 years';
  if (!consent.understandsTimingRequirement)
    return 'Patient must confirm understanding of timing requirement (at least 10 days before arrival in Saudi Arabia)';
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
    return 'Please confirm there are no absolute contraindications';
  return null;
}

/**
 * Licensed minimum age per product, in months. PGD v006: Nimenrix from 6
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
  if (!summary.vaccineType) return 'Vaccine type must be selected';
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
  if (!summary.administrationSite) return 'Administration site must be selected';
  const isThigh = summary.administrationSite === 'left-thigh' || summary.administrationSite === 'right-thigh';
  if (ageMonths !== null && ageMonths < 12 && !isThigh) {
    return 'Under 1 year: give into the anterolateral thigh';
  }
  if (ageMonths !== null && ageMonths >= 12 && isThigh) {
    return 'From 1 year of age and in adults: give into the deltoid';
  }
  if (!summary.doseNumber) return 'Dose number must be selected';
  if (ageMonths !== null && ageMonths >= 12 && (summary.doseNumber === '1st' || summary.doseNumber === '2nd')) {
    return 'From 12 months of age all products are a single dose; select "Single dose", "Booster at 12 months" or "Repeat for certificate"';
  }
  if (ageMonths !== null && ageMonths < 6 && summary.doseNumber !== '1st' && summary.doseNumber !== '2nd') {
    return '6 weeks to under 6 months (Nimenrix): two doses at least 2 months apart; select 1st or 2nd dose';
  }
  if (ageMonths !== null && ageMonths >= 6 && ageMonths < 12 && summary.doseNumber !== 'single') {
    return '6 to 11 months (Nimenrix): a single dose with a booster at 12 months of age';
  }
  if (summary.doseNumber === 'repeat-certificate') {
    if (!patient.previousMenACWYDose || !patient.previousDoseDate) {
      return 'Repeat for certificate: record the date of the previous dose on the travel step';
    }
    if (!patient.repeatDoseReason.trim()) {
      return 'Repeat for certificate: record the reason for the repeat';
    }
  }
  const courseContinues =
    summary.doseNumber === '1st' ||
    (summary.doseNumber === 'single' && ageMonths !== null && ageMonths < 12) ||
    (summary.doseNumber === '2nd' && ageMonths !== null && ageMonths < 12);
  if (courseContinues && !summary.nextDueDate) {
    return 'Where a course is involved, record the date the next dose is due and book it at this appointment';
  }
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validateMeningitisACWYPostVaccineStep(data: MeningitisACWYPostVaccineAdvice): string | null {
  if (!data.leafletGiven) return 'Supply the patient information leaflet for the product given';
  if (!data.counselledReactions) return 'Advise the patient of the common reactions';
  if (!data.counselledNotMenB) return 'Tell the patient this vaccine does not protect against group B meningococcal disease';
  if (!data.counselledMeningitisSigns) return 'Counsel the signs of meningitis and septicaemia';
  if (!data.counselledConjugateCertificate) return 'Counsel the certificate requirements (conjugate vaccine stated; 10 days before arrival)';
  if (!data.observationCompleted) return 'Record that the 15 minute observation period was completed';
  if (!data.patientAdvised)
    return 'Patient must be advised of common reactions and given safety information';
  return null;
}

export function validateMeningitisACWYSummaryStep(
  summary: Partial<MeningitisACWYSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}

import type {
  MeningitisACWYPatientDetails,
  MeningitisACWYConsent,
  MeningitisACWYSummary,
} from './meningitis-acwy-travel-types';

export function validateMeningitisACWYPatientStep(
  patient: MeningitisACWYPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 6 / 52) {
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
  if (!travelAssessment.travelDestinationConfirmed) return 'Please confirm travel destination';
  if (!travelAssessment.travelReasonConfirmed) return 'Please confirm travel reason';
  if (!travelAssessment.timingConfirmed) return 'Please confirm departure timing';
  return null;
}

export function validateMeningitisACWYConsentStep(
  consent: MeningitisACWYConsent
): string | null {
  if (!consent.informedConsentGiven) return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (!consent.understands5YearValidity)
    return 'Patient must confirm understanding that vaccine is valid for 5 years';
  if (!consent.understandsTimingRequirement)
    return 'Patient must confirm understanding of timing requirement (at least 10 days before travel)';
  return null;
}

export function validateMeningitisACWYMedicalHistoryStep(data: {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  severeFebrilleIllness: boolean;
}): string | null {
  // Medical history step should always proceed to next
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
 * Licensed minimum age per product, in years. PGD v004: Nimenrix from 6
 * weeks, MenQuadfi from 12 months, Menveo from 2 years. Age below the licensed
 * minimum for the product held is an exclusion, so the tool refuses the
 * product rather than letting the pharmacist pick whatever is in the fridge.
 */
export const MENACWY_MIN_AGE_YEARS: Record<string, { years: number; label: string }> = {
  nimenrix: { years: 6 / 52, label: '6 weeks' },
  menquadfi: { years: 1, label: '12 months' },
  menveo: { years: 2, label: '2 years' },
};

export function validateMeningitisACWYAdministrationStep(
  summary: Partial<MeningitisACWYSummary>,
  ageYears: number | null = null
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  const min = MENACWY_MIN_AGE_YEARS[summary.vaccineType];
  if (min && ageYears !== null && ageYears < min.years) {
    return `${summary.vaccineType === 'menquadfi' ? 'MenQuadfi' : summary.vaccineType === 'menveo' ? 'Menveo' : 'Nimenrix'} is licensed from ${min.label}; this patient is younger. Choose a product licensed for this age (Nimenrix from 6 weeks) or do not vaccinate under this PGD.`;
  }
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validateMeningitisACWYPostVaccineStep(data: {
  patientAdvised: boolean;
}): string | null {
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

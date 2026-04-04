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
  if (patient.age < 0.25) {
    // Less than 3 months
    return 'Patient must be at least 6 weeks old (Nimenrix minimum age)';
  }
  if (!patient.travelDestination.trim()) return 'Travel destination is required';
  if (!patient.travelReason) return 'Travel reason must be selected';
  if (!patient.departureDate) return 'Departure date is required';
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

export function validateMeningitisACWYAdministrationStep(
  summary: Partial<MeningitisACWYSummary>
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
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

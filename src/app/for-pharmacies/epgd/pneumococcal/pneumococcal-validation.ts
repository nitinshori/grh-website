import type {
  PneumococcalPatientDetails,
  PneumococcalConsent,
  PneumococcalSummary,
} from './pneumococcal-types';

export function validatePneumococcalPatientStep(
  patient: PneumococcalPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (!patient.riskCategory) return 'At-risk category must be selected';
  if (patient.riskCategory === 'chronic-disease' && !patient.chronicDiseaseType?.trim()) {
    return 'Please specify the chronic disease type';
  }
  if (patient.riskCategory === 'immunosuppressed' && !patient.immunosuppressedReason?.trim()) {
    return 'Please specify the reason for immunosuppression';
  }
  return null;
}

export function validatePneumococcalConsentStep(
  consent: PneumococcalConsent
): string | null {
  if (!consent.informedConsentGiven)
    return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (!consent.understandsVaccineNeed)
    return 'Patient must understand why pneumococcal vaccination is needed';
  if (!consent.understandsSchedule)
    return 'Patient must understand the vaccination schedule (may need 2 doses)';
  if (!consent.understandsSideEffects)
    return 'Patient must be aware of possible side effects';
  return null;
}

export function validatePneumococcalRiskAssessmentStep(data: {
  confirmedRiskCategory: boolean;
  reviewedVaccineHistory: boolean;
}): string | null {
  if (!data.confirmedRiskCategory) return 'Risk category must be confirmed';
  if (!data.reviewedVaccineHistory)
    return 'Previous vaccine history must be reviewed';
  return null;
}

export function validatePneumococcalMedicalHistoryStep(data: {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  severeFebrilleIllness: boolean;
}): string | null {
  // Medical history step should always proceed to next
  return null;
}

export function validatePneumococcalContraindicationsStep(data: {
  confirmedNoAbsoluteContraindications: boolean;
}): string | null {
  if (!data.confirmedNoAbsoluteContraindications)
    return 'Please confirm there are no absolute contraindications';
  return null;
}

export function validatePneumococcalAdministrationStep(
  summary: Partial<PneumococcalSummary>
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  if (!summary.doseNumber) return 'Dose number must be specified';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validatePneumococcalPostVaccineStep(data: {
  patientAdvised: boolean;
}): string | null {
  if (!data.patientAdvised)
    return 'Patient must be advised of common reactions and given safety information';
  return null;
}

export function validatePneumococcalSummaryStep(
  summary: Partial<PneumococcalSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}

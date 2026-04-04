import type {
  RSVPatientDetails,
  RSVConsent,
  RSVSummary,
} from './rsv-types';

export function validateRSVPatientStep(
  patient: RSVPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (!patient.patientCategory) return 'Patient category (60+ adult or pregnant) must be selected';

  if (patient.patientCategory === 'adult-60-plus') {
    if (patient.age < 60) {
      return 'Adult RSV vaccination is for patients 60 years or older (or at increased risk)';
    }
  }

  if (patient.patientCategory === 'pregnant-woman') {
    if (patient.pregnancyWeeks === undefined || patient.pregnancyWeeks === null) {
      return 'Pregnancy weeks (gestation) are required';
    }
    if (!patient.femaleConfirmed) {
      return 'Please confirm patient is female for pregnancy assessment';
    }
  }

  return null;
}

export function validateRSVConsentStep(
  consent: RSVConsent
): string | null {
  if (!consent.informedConsentGiven)
    return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (!consent.understandsVaccineProtection)
    return 'Patient must understand vaccine protection against RSV disease';
  if (!consent.understandsNoBooster)
    return 'Patient must understand no booster is currently recommended';
  if (!consent.understandsAdverseEvents)
    return 'Patient must be aware of possible adverse events';
  return null;
}

export function validateRSVEligibilityAssessmentStep(data: {
  confirmEligible: boolean;
  riskFactorsReviewed: boolean;
}): string | null {
  if (!data.confirmEligible) return 'Eligibility must be confirmed to proceed';
  if (!data.riskFactorsReviewed)
    return 'Risk factors must be reviewed';
  return null;
}

export function validateRSVMedicalHistoryStep(data: {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  severeFebrilleIllness: boolean;
}): string | null {
  // Medical history step should always proceed to next
  return null;
}

export function validateRSVContraindicationsStep(data: {
  confirmedNoAbsoluteContraindications: boolean;
}): string | null {
  if (!data.confirmedNoAbsoluteContraindications)
    return 'Please confirm there are no absolute contraindications';
  return null;
}

export function validateRSVAdministrationStep(
  summary: Partial<RSVSummary>
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validateRSVPostVaccineStep(data: {
  patientAdvised: boolean;
}): string | null {
  if (!data.patientAdvised)
    return 'Patient must be advised of common reactions and safety information';
  return null;
}

export function validateRSVSummaryStep(
  summary: Partial<RSVSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}

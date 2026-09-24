import type {
  PneumococcalPatientDetails,
  PneumococcalConsent,
  PneumococcalSummary,
} from './pneumococcal-types';
import {
  getPneumococcalProductAvailability,
  type PneumococcalMedicalHistoryInput,
} from './pneumococcal-clinical-logic';

// Aligned to the Pneumovax 23 / Prevenar 20 PGD version 008, issued 24 September 2026.

export function validatePneumococcalPatientStep(
  patient: PneumococcalPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 2) return 'This PGD is for individuals aged 2 years and over';
  if (!patient.riskCategory) return 'Eligibility group under national guidance must be selected';
  // 'not-eligible' is a complete answer: the stop it raises lets the visit be saved as not supplied.
  if (patient.riskCategory === 'not-eligible') return null;
  if (patient.riskCategory === 'ckd' && !patient.ckdCriterion) {
    return 'CKD stage 3 or milder is not in the group: select the Green Book criterion that applies';
  }
  if (patient.riskCategory === 'chronic-disease' && !patient.chronicDiseaseType?.trim()) {
    return 'Please specify the chronic disease type';
  }
  if (patient.riskCategory === 'immunosuppressed' && !patient.immunosuppressedReason?.trim()) {
    return 'Please specify the reason for immunosuppression';
  }
  if (patient.riskCategory === 'age-65-plus' && patient.age < 65) {
    return 'Patient is under 65: select the clinical risk group that applies';
  }
  if (
    patient.riskCategory === 'other-national-guidance' &&
    patient.otherEligibilityReason !== 'metal-fumes' &&
    patient.otherEligibilityReason !== 'homelessness'
  ) {
    return 'Select the Green Book chapter 25 group under which the patient is eligible (metal fumes or homelessness)';
  }
  return null;
}

export function validatePneumococcalConsentStep(
  consent: PneumococcalConsent,
  age?: number | null
): string | null {
  if (!consent.informedConsentGiven)
    return 'Informed consent must be obtained before proceeding';
  if (!consent.idVerified) return 'ID verification is required';
  if (!consent.patientAwarePrivateService)
    return 'Patient must be aware this is a private service';
  if (age !== undefined && age !== null && age < 16) {
    if (!consent.consentBasis)
      return 'Under 16: record whether consent came from a person with parental responsibility or from the young person as Gillick competent';
    if (consent.consentBasis === 'parental' && !consent.parentName.trim())
      return 'Record the name of the person with parental responsibility';
    if (consent.consentBasis === 'parental' && !consent.parentRelationship.trim())
      return 'Record the relationship of the person with parental responsibility to the patient';
    if (consent.consentBasis === 'gillick' && !consent.gillickBasis.trim())
      return 'Record the basis of the Gillick competence assessment';
  }
  if (!consent.understandsVaccineNeed)
    return 'Tick "Patient understands why pneumococcal vaccination is needed"';
  if (!consent.understandsSchedule)
    return 'Tick "Patient understands the vaccination schedule"';
  if (!consent.understandsSideEffects)
    return 'Tick "Patient is aware of possible side effects"';
  return null;
}

export function validatePneumococcalRiskAssessmentStep(data: {
  confirmedRiskCategory: boolean;
  reviewedVaccineHistory: boolean;
  previousPCV13: boolean;
  previousPCV13Date: string;
  previousPCV20: boolean;
  previousPCV20Date: string;
  previousPPV23: boolean;
  previousPPV23Date: string;
  previousOtherPCV?: boolean;
  previousOtherPCVDate?: string;
}): string | null {
  if (!data.confirmedRiskCategory) return 'Tick "Risk category confirmed as documented"';
  const today = new Date().toISOString().split('T')[0];
  if (data.previousPCV13 && !data.previousPCV13Date) return 'Enter the date of the PCV13 dose';
  if (data.previousPCV13 && data.previousPCV13Date > today) return 'Date of PCV13 dose cannot be in the future';
  if (data.previousPCV20 && !data.previousPCV20Date) return 'Enter the date of the PCV20 dose';
  if (data.previousPCV20 && data.previousPCV20Date > today) return 'Date of PCV20 dose cannot be in the future';
  if (data.previousPPV23 && !data.previousPPV23Date) return 'Enter the date of the PPV23 dose';
  if (data.previousPPV23 && data.previousPPV23Date > today) return 'Date of PPV23 dose cannot be in the future';
  if (data.previousOtherPCV && !data.previousOtherPCVDate) return 'Enter the date of the Vaxneuvance or Capvaxive dose';
  if (data.previousOtherPCV && (data.previousOtherPCVDate ?? '') > today) return 'Date of the Vaxneuvance or Capvaxive dose cannot be in the future';
  if (!data.reviewedVaccineHistory)
    return 'Tick "Vaccine history reviewed"';
  return null;
}

export function validatePneumococcalMedicalHistoryStep(): string | null {
  // Medical history step always proceeds: the exclusions it raises are stops
  // enforced on the Review Contraindications step.
  return null;
}

export function validatePneumococcalContraindicationsStep(data: {
  confirmedNoAbsoluteContraindications: boolean;
}): string | null {
  if (!data.confirmedNoAbsoluteContraindications)
    return 'Tick "I confirm no absolute contraindications are present and vaccination can proceed"';
  return null;
}

/**
 * Administration step. Enforces the product-specific exclusions and dose
 * rules in PGD v008 that depend on which vaccine is chosen:
 * Prevenar 20: single lifetime dose (never after PCV20); not after PPV23
 * except as the 5-yearly revaccination dose of asplenia, splenic dysfunction
 * or CKD (nephrotic syndrome, stage 4 or 5, dialysis or transplant) where it
 * has never been given; at least 8 weeks after any conjugate vaccine; not
 * with CRM197 hypersensitivity; IM only (deltoid).
 * Pneumovax 23: at least 8 weeks after any conjugate vaccine; no
 * revaccination after PPV23 or PCV20 except those groups after 5 years;
 * IM or SC.
 * Both: Vaxneuvance or Capvaxive at 2 years or older excludes whatever the
 * interval (validated through getPneumococcalProductAvailability).
 */
export function validatePneumococcalAdministrationStep(
  summary: Partial<PneumococcalSummary>,
  patient?: PneumococcalPatientDetails,
  history?: PneumococcalMedicalHistoryInput
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  if (patient && history) {
    const availability = getPneumococcalProductAvailability(patient, history);
    if (summary.vaccineType === 'pcv20') {
      if (!availability.pcv20Possible)
        return `Prevenar 20 cannot be given: ${availability.pcv20Reason}`;
    }
    if (summary.vaccineType === 'ppv23') {
      if (!availability.ppv23Possible)
        return `Pneumovax 23 cannot be given: ${availability.ppv23Reason}`;
    }
  }
  if (
    summary.vaccineType === 'pcv20' &&
    (summary.administrationSite === 'left-arm-sc' || summary.administrationSite === 'right-arm-sc')
  ) {
    return 'Prevenar 20 is given by intramuscular injection only, into the deltoid';
  }
  if (!summary.doseNumber) return 'Select the dose number in sequence';
  if (summary.vaccineType === 'pcv20' && summary.doseNumber === '2' && history && history.previousPCV20)
    return 'Prevenar 20 is a single lifetime dose and has already been given: later 5-yearly revaccination cycles are Pneumovax 23';
  if (summary.doseNumber === '2' && history && !history.previousPPV23 && !history.previousPCV20) {
    return 'No previous PPV23 or PCV20 is recorded: this is the first dose, not a 5-yearly revaccination';
  }
  if (summary.doseNumber === '1' && history && (history.previousPPV23 || history.previousPCV20)) {
    return 'A previous PPV23 or PCV20 is recorded: select the 5-yearly revaccination as the dose in sequence';
  }
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  {
    const exp = new Date(summary.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(exp.getTime()) && exp < today) return 'This batch has expired. Do not use it.';
  }
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Time of administration is required';
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

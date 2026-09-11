import type {
  PneumococcalPatientDetails,
  PneumococcalConsent,
  PneumococcalSummary,
} from './pneumococcal-types';
import {
  revaccinationGroup,
  weeksSince,
  yearsSinceLastPolysaccharideOrPCV20,
  type PneumococcalMedicalHistoryInput,
} from './pneumococcal-clinical-logic';

// Aligned to the Pneumovax 23 / Prevenar 13 PGD version 004, issued 11 September 2026.

export function validatePneumococcalPatientStep(
  patient: PneumococcalPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (patient.age < 2) return 'This PGD is for individuals aged 2 years and over';
  if (!patient.riskCategory) return 'Eligibility group under national guidance must be selected';
  if (patient.riskCategory === 'chronic-disease' && !patient.chronicDiseaseType?.trim()) {
    return 'Please specify the chronic disease type';
  }
  if (patient.riskCategory === 'immunosuppressed' && !patient.immunosuppressedReason?.trim()) {
    return 'Please specify the reason for immunosuppression';
  }
  if (patient.riskCategory === 'age-65-plus' && patient.age < 65) {
    return 'Patient is under 65: select the clinical risk group that applies';
  }
  if (patient.riskCategory === 'other-national-guidance' && !patient.otherEligibilityReason?.trim()) {
    return 'State the Green Book chapter 25 group under which the patient is eligible';
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
  previousPCV13: boolean;
  previousPCV13Date: string;
  previousPCV20: boolean;
  previousPCV20Date: string;
  previousPPV23: boolean;
  previousPPV23Date: string;
}): string | null {
  if (!data.confirmedRiskCategory) return 'Risk category must be confirmed';
  if (data.previousPCV13 && !data.previousPCV13Date) return 'Enter the date of the previous PCV13 dose';
  if (data.previousPCV20 && !data.previousPCV20Date) return 'Enter the date of the previous PCV20 dose';
  if (data.previousPPV23 && !data.previousPPV23Date) return 'Enter the date of the previous PPV23 dose';
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

/**
 * Administration step. Enforces the product-specific exclusions and dose
 * rules in PGD v004 that depend on which vaccine is chosen:
 * Prevenar 13: not after any conjugate vaccine, not with CRM197 hypersensitivity, IM only.
 * Pneumovax 23: at least 8 weeks after a conjugate vaccine; no revaccination
 * except asplenia, splenic dysfunction or CKD after 5 years.
 */
export function validatePneumococcalAdministrationStep(
  summary: Partial<PneumococcalSummary>,
  patient?: PneumococcalPatientDetails,
  history?: PneumococcalMedicalHistoryInput
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  if (patient && history) {
    if (summary.vaccineType === 'pcv13') {
      if (history.diphtheriaToxoidHypersensitivity)
        return 'Prevenar 13 is contraindicated: hypersensitivity to diphtheria toxoid (CRM197 carrier protein)';
      if (history.previousPCV13 || history.previousPCV20)
        return 'Prevenar 13 under this PGD is only for individuals who have not previously received a pneumococcal conjugate vaccine';
      if (summary.administrationSite === 'left-arm-sc' || summary.administrationSite === 'right-arm-sc')
        return 'Prevenar 13 is given by intramuscular injection only';
    }
    if (summary.vaccineType === 'ppv23') {
      const w = history.previousPCV13 ? weeksSince(history.previousPCV13Date) : null;
      if (w !== null && w < 8)
        return 'Pneumovax 23 must be given at least 8 weeks after the conjugate vaccine';
      if (history.previousPPV23 || history.previousPCV20) {
        if (!revaccinationGroup(patient))
          return 'PPV23 or PCV20 already received: revaccination is only for asplenia, splenic dysfunction or chronic kidney disease';
        const y = yearsSinceLastPolysaccharideOrPCV20(history);
        if (y !== null && y < 5)
          return 'PPV23 or PCV20 received within the last 5 years: revaccination is not yet due';
      }
    }
  }
  if (!summary.doseNumber) return 'Dose number must be specified';
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  {
    const exp = new Date(summary.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(exp.getTime()) && exp < today) return 'This batch has expired. Do not use it.';
  }
  if (!summary.administrationSite) return 'Administration site must be selected';
  // PCV13 given to a patient in whom PPV23 also follows: the document
  // specifies "at least 8 weeks after", so the next-due date is recorded and
  // booked now rather than left to memory.
  if (patient && history && ppv23FollowsPcv13(summary, patient, history)) {
    if (!summary.counselledNextDue) return 'Pneumovax 23 follows Prevenar 13 in this patient: record the date it is due (at least 8 weeks from today) and book it';
    const due = new Date(summary.counselledNextDue);
    const earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + 56);
    if (isNaN(due.getTime())) return 'Next due date is not a valid date';
    if (due < earliest) return 'Pneumovax 23 must be at least 8 weeks (56 days) after Prevenar 13: choose a later date';
  }
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

/** True where Prevenar 13 is being given and the PGD sequence calls for Pneumovax 23 to follow. */
export function ppv23FollowsPcv13(
  summary: Partial<PneumococcalSummary>,
  patient: PneumococcalPatientDetails,
  history: PneumococcalMedicalHistoryInput
): boolean {
  return (
    summary.vaccineType === 'pcv13' &&
    (patient.riskCategory === 'asplenia' || patient.riskCategory === 'immunosuppressed') &&
    !history.previousPPV23 &&
    !history.previousPCV20
  );
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

// Aligned to the Abrysvo / Arexvy RSV PGD version 005, issued 11 September 2026.
import type {
  RSVPatientDetails,
  RSVConsent,
  RSVSummary,
  RSVMedicalHistory,
  RSVPostVaccineAdvice,
} from './rsv-types';

export function validateRSVPatientStep(
  patient: RSVPatientDetails
): string | null {
  if (!patient.firstName.trim()) return 'Patient first name is required';
  if (!patient.lastName.trim()) return 'Patient last name is required';
  if (!patient.dateOfBirth) return 'Date of birth is required';
  if (patient.age === null) return 'Unable to calculate age';
  if (!patient.patientCategory) return 'Patient category (adult 60 and over, or pregnant 28 to 36 weeks) must be selected';

  if (patient.patientCategory === 'adult-60-plus') {
    if (patient.age < 60) {
      return 'Adult RSV vaccination under this PGD is for patients aged 60 years and over';
    }
  }

  if (patient.patientCategory === 'pregnant-woman') {
    if (patient.pregnancyWeeks === undefined || patient.pregnancyWeeks === null) {
      return 'Pregnancy weeks (gestation) are required';
    }
    if (patient.pregnancyWeeks < 28) {
      return 'Abrysvo should not be used before 28 weeks of gestation; the PGD inclusion is 28 to 36 weeks';
    }
    if (patient.pregnancyWeeks > 36) {
      return 'Beyond 36 weeks of gestation: refer to the maternity service (PGD inclusion is 28 to 36 weeks)';
    }
    if (!patient.femaleConfirmed) {
      return 'Please confirm patient is female for pregnancy assessment';
    }
  }

  return null;
}

export function validateRSVConsentStep(
  consent: RSVConsent,
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
  if (!consent.understandsVaccineProtection)
    return 'Patient must understand vaccine protection against RSV disease';
  if (!consent.understandsNoBooster)
    return 'Patient must understand this is a one-time vaccination per current guidance';
  if (!consent.understandsAdverseEvents)
    return 'Patient must be aware of possible adverse events';
  return null;
}

export function validateRSVEligibilityAssessmentStep(data: {
  confirmEligible: boolean;
  riskFactorsReviewed: boolean;
  nhsStatus: '' | 'not-eligible' | 'eligible-prefers-private';
}): string | null {
  if (!data.nhsStatus)
    return 'Record whether the patient does not qualify for a free NHS RSV vaccination, or qualifies but prefers to have it privately';
  if (!data.confirmEligible) return 'Eligibility must be confirmed to proceed';
  if (!data.riskFactorsReviewed)
    return 'Risk factors must be reviewed';
  return null;
}

export function validateRSVAdministrationStep(
  summary: Partial<RSVSummary>,
  patient?: RSVPatientDetails,
  history?: RSVMedicalHistory
): string | null {
  if (!summary.vaccineType) return 'Vaccine type must be selected';
  if (summary.vaccineType === 'arexvy') {
    if (patient?.patientCategory === 'pregnant-woman')
      return 'Arexvy is only licensed for those aged 60 years and over and must not be given in pregnancy; select Abrysvo';
    if (history?.pregnantOrBreastfeeding)
      return 'Arexvy should not be administered to those who are pregnant or breastfeeding';
  }
  if (!summary.batchNumber?.trim()) return 'Batch number is required';
  if (!summary.expiryDate) return 'Expiry date is required';
  if (!summary.administrationSite) return 'Administration site must be selected';
  if (!summary.administrationTime) return 'Administration time is required';
  return null;
}

export function validateRSVPostVaccineStep(
  advice: RSVPostVaccineAdvice
): string | null {
  if (!advice.counselledReactions)
    return 'Confirm the patient was advised on possible side effects and when to seek medical attention';
  if (!advice.followUpAdviceGiven) return 'Confirm the follow-up advice was given';
  if (!advice.pilSupplied) return 'Confirm the patient information leaflet was supplied';
  if (!advice.observedFifteenMinutes)
    return 'Confirm the 15 minute post-vaccination observation period has been completed (PGD cautions row)';
  if (advice.adverseReaction.trim() && !advice.adverseReactionAction.trim())
    return 'Record the action taken for the adverse reaction (PGD records row)';
  if (!advice.patientAdvised) return 'Confirm all counselling has been completed and documented';
  return null;
}

export function validateRSVSummaryStep(
  summary: Partial<RSVSummary>
): string | null {
  if (!summary.pharmacistName?.trim()) return 'Pharmacist name is required';
  if (!summary.pharmacistGPhC?.trim()) return 'GPhC registration number is required';
  return null;
}

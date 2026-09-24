import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

// Aligned to the Pneumovax 23 / Prevenar 20 PGD version 008, issued 24 September 2026.

export type PneumococcalRiskCategory =
  | 'asplenia'
  | 'ckd'
  | 'chronic-disease'
  | 'immunosuppressed'
  | 'cochlear'
  | 'csf-leak'
  | 'age-65-plus'
  | 'other-national-guidance'
  /** Not in any eligible group: a stop, recorded so the consultation can be saved as not supplied. */
  | 'not-eligible'
  | '';

/**
 * The Green Book Table 2 chronic kidney disease criteria the PGD covers.
 * CKD stage 3 or milder is not in the group.
 */
export type PneumococcalCkdCriterion =
  | 'nephrotic-syndrome'
  | 'ckd-stage-4'
  | 'ckd-stage-5'
  | 'dialysis'
  | 'kidney-transplant'
  | '';

export const CKD_CRITERION_LABELS: Record<Exclude<PneumococcalCkdCriterion, ''>, string> = {
  'nephrotic-syndrome': 'Nephrotic syndrome',
  'ckd-stage-4': 'CKD stage 4',
  'ckd-stage-5': 'CKD stage 5',
  dialysis: 'Dialysis',
  'kidney-transplant': 'Kidney transplant',
};

/** The only "other national guidance" groups the PGD names (Green Book chapter 25, JCVI June 2024). */
export type PneumococcalOtherEligibilityReason = 'metal-fumes' | 'homelessness' | '';

export const OTHER_ELIGIBILITY_LABELS: Record<Exclude<PneumococcalOtherEligibilityReason, ''>, string> = {
  'metal-fumes': 'Occupational exposure to metal fumes, for example welders',
  homelessness: 'Experiencing homelessness: rough sleeping, hostels or night shelters',
};

export interface PneumococcalPatientDetails extends BasePatientDetails {
  riskCategory: PneumococcalRiskCategory;
  chronicDiseaseType?: string;
  immunosuppressedReason?: string;
  /** Used with 'ckd': which Green Book Table 2 criterion applies (stage 3 or milder is not in the group). */
  ckdCriterion?: PneumococcalCkdCriterion;
  /** Used with 'other-national-guidance': the Green Book chapter 25 group that applies. */
  otherEligibilityReason?: PneumococcalOtherEligibilityReason;
  knownAllergies: string;
}

export interface PneumococcalConsent extends BaseConsent {
  understandsVaccineNeed: boolean;
  understandsSchedule: boolean;
  understandsSideEffects: boolean;
  /** PGD v008 consent block, under 16 only: who gave consent. */
  consentBasis: '' | 'parental' | 'gillick';
  parentName: string;
  parentRelationship: string;
  gillickBasis: string;
}

export type PneumococcalAdministrationSite =
  | 'left-deltoid'
  | 'right-deltoid'
  | 'left-arm-sc'
  | 'right-arm-sc'
  | '';

export type PneumococcalVaccineType = 'pcv20' | 'ppv23' | '';

export interface PneumococcalSummary extends BaseSummary {
  /** Prevenar 20 (PCV20) or Pneumovax 23 (PPV23). Prevenar 13 is not given under PGD v008. */
  vaccineType: PneumococcalVaccineType;
  /**
   * '1': first pneumococcal dose under the PGD (Prevenar 20 or Pneumovax 23).
   * '2': 5-yearly revaccination for asplenia, splenic dysfunction or CKD
   * (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant):
   * Prevenar 20 where it has never been given, otherwise Pneumovax 23.
   */
  doseNumber: '1' | '2' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: PneumococcalAdministrationSite;
  administrationTime: string;
  counselledReactions: boolean;
  counselledBothVaccines: boolean;
  clinicalAlertsCodes: string[];
}

export const initialPneumococcalPatientDetails: PneumococcalPatientDetails = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  age: null,
  gpName: '',
  gpPractice: '',
gpAddress: '',
gpPhone: '',
gpEmail: '',
gpOdsCode: '',
  nhsNumber: '',
  address: '',
  phone: '',
  email: '',
  riskCategory: '',
  chronicDiseaseType: '',
  immunosuppressedReason: '',
  ckdCriterion: '',
  otherEligibilityReason: '',
  knownAllergies: '',
};

export const initialPneumococcalConsent: PneumococcalConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understandsVaccineNeed: false,
  understandsSchedule: false,
  understandsSideEffects: false,
  consentBasis: '',
  parentName: '',
  parentRelationship: '',
  gillickBasis: '',
};

export function initialPneumococcalSummary(): PneumococcalSummary {
  return {
    pharmacistName: '',
    pharmacistGPhC: '',
    pharmacyName: '',
    pharmacyAddress: '',
    consultationDate: new Date().toISOString().split('T')[0],
    consultationTime: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    clinicalNotes: '',
    vaccineType: '',
    doseNumber: '',
    batchNumber: '',
    expiryDate: '',
    administrationSite: '',
    administrationTime: '',
    counselledReactions: false,
    counselledBothVaccines: false,
    clinicalAlertsCodes: [],
  };
}

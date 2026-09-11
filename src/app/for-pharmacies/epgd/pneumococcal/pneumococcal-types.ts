import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

// Aligned to the Pneumovax 23 / Prevenar 13 PGD version 004, issued 11 September 2026.

export type PneumococcalRiskCategory =
  | 'asplenia'
  | 'ckd'
  | 'chronic-disease'
  | 'immunosuppressed'
  | 'cochlear'
  | 'csf-leak'
  | 'age-65-plus'
  | 'other-national-guidance'
  | '';

export interface PneumococcalPatientDetails extends BasePatientDetails {
  riskCategory: PneumococcalRiskCategory;
  chronicDiseaseType?: string;
  immunosuppressedReason?: string;
  /** Used with 'other-national-guidance': the Green Book chapter 25 group that applies. */
  otherEligibilityReason?: string;
  knownAllergies: string;
}

export interface PneumococcalConsent extends BaseConsent {
  understandsVaccineNeed: boolean;
  understandsSchedule: boolean;
  understandsSideEffects: boolean;
  /** PGD v004 consent block, under 16 only: who gave consent. */
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

export interface PneumococcalSummary extends BaseSummary {
  vaccineType: 'pcv13' | 'ppv23' | '';
  doseNumber: '1' | '2' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: PneumococcalAdministrationSite;
  administrationTime: string;
  counselledReactions: boolean;
  counselledBothVaccines: boolean;
  counselledNextDue?: string;
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

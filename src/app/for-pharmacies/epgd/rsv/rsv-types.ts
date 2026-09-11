import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

// Aligned to the Abrysvo / Arexvy RSV PGD version 005, issued 11 September 2026.

export interface RSVPatientDetails extends BasePatientDetails {
  patientCategory: 'adult-60-plus' | 'pregnant-woman' | '';
  pregnancyWeeks?: number;
  currentRSVSeason: boolean;
  atIncreasedrisk: boolean;
  riskFactors?: string;
  knownAllergies: string;
  sex?: 'male' | 'female';
  maleConfirmed?: boolean;
  femaleConfirmed?: boolean;
}

export interface RSVConsent extends BaseConsent {
  understandsVaccineProtection: boolean;
  understandsNoBooster: boolean;
  understandsAdverseEvents: boolean;
  understands6MonthsProtection?: boolean;
  /** PGD v005 consent block, under 16 only: who gave consent. */
  consentBasis: '' | 'parental' | 'gillick';
  parentName: string;
  parentRelationship: string;
  gillickBasis: string;
}

/** PGD v005 medical history and exclusion flags. */
export interface RSVMedicalHistory {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  severeFebrilleIllness: boolean;
  /** Exclusion, both arms: already received a complete dose of an RSV vaccine. */
  previousRSVVaccine: boolean;
  immunosuppressed: boolean;
  bleedingDisorder: boolean;
  /** Arexvy exclusion: pregnant or breastfeeding (asked of the adult category; the pregnant category is Abrysvo only). */
  pregnantOrBreastfeeding: boolean;
  /** Caution (Abrysvo, older adults): influenza vaccine at the same appointment or on the same day. */
  fluVaccineSameDay: boolean;
}

export interface RSVSummary extends BaseSummary {
  vaccineType: 'abrysvo' | 'arexvy' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: 'left-deltoid' | 'right-deltoid' | '';
  administrationTime: string;
  clinicalAlertsCodes: string[];
}

/** Post-vaccination counselling, observation and adverse reaction record (PGD v005 cautions and records rows). */
export interface RSVPostVaccineAdvice {
  patientAdvised: boolean;
  counselledReactions: boolean;
  counselledNoBooster: boolean;
  counselledSeason: boolean;
  followUpAdviceGiven: boolean;
  pilSupplied: boolean;
  /** Caution row: observe for 15 minutes post-vaccination. Ticked only once the period has been completed. */
  observedFifteenMinutes: boolean;
  /** Records row: details of any adverse drug reactions and actions taken. */
  adverseReaction: string;
  adverseReactionAction: string;
  yellowCardSubmitted: boolean;
}

export function initialRSVPostVaccineAdvice(): RSVPostVaccineAdvice {
  return {
    patientAdvised: false,
    counselledReactions: false,
    counselledNoBooster: false,
    counselledSeason: false,
    followUpAdviceGiven: false,
    pilSupplied: false,
    observedFifteenMinutes: false,
    adverseReaction: '',
    adverseReactionAction: '',
    yellowCardSubmitted: false,
  };
}

export const initialRSVPatientDetails: RSVPatientDetails = {
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
  patientCategory: '',
  pregnancyWeeks: undefined,
  currentRSVSeason: false,
  atIncreasedrisk: false,
  riskFactors: '',
  knownAllergies: '',
  sex: undefined,
  maleConfirmed: false,
  femaleConfirmed: false,
};

export const initialRSVConsent: RSVConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understandsVaccineProtection: false,
  understandsNoBooster: false,
  understandsAdverseEvents: false,
  understands6MonthsProtection: false,
  consentBasis: '',
  parentName: '',
  parentRelationship: '',
  gillickBasis: '',
};

export const initialRSVMedicalHistory: RSVMedicalHistory = {
  anaphylaxisToVaccine: false,
  anaphylaxisToVaccineComponent: false,
  severeFebrilleIllness: false,
  previousRSVVaccine: false,
  immunosuppressed: false,
  bleedingDisorder: false,
  pregnantOrBreastfeeding: false,
  fluVaccineSameDay: false,
};

export function initialRSVSummary(): RSVSummary {
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
    batchNumber: '',
    expiryDate: '',
    administrationSite: '',
    administrationTime: '',
    clinicalAlertsCodes: [],
  };
}

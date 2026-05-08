import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

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
}

export interface RSVSummary extends BaseSummary {
  vaccineType: 'abrysvo' | 'mresvia' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: 'left-deltoid' | 'right-deltoid' | '';
  administrationTime: string;
  counselledReactions: boolean;
  counselledNoBooster: boolean;
  counselledSeason?: boolean;
  clinicalAlertsCodes: string[];
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
    counselledReactions: false,
    counselledNoBooster: false,
    counselledSeason: false,
    clinicalAlertsCodes: [],
  };
}

import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

export interface PneumococcalPatientDetails extends BasePatientDetails {
  riskCategory: 'asplenia' | 'chronic-disease' | 'immunosuppressed' | 'cochlear' | 'csf-leak' | '';
  chronicDiseaseType?: string;
  immunosuppressedReason?: string;
  knownAllergies: string;
}

export interface PneumococcalConsent extends BaseConsent {
  understandsVaccineNeed: boolean;
  understandsSchedule: boolean;
  understandsSideEffects: boolean;
}

export interface PneumococcalSummary extends BaseSummary {
  vaccineType: 'pcv13' | 'ppv23' | '';
  doseNumber: '1' | '2' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: 'left-deltoid' | 'right-deltoid' | '';
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
  nhsNumber: '',
  address: '',
  phone: '',
  email: '',
  riskCategory: '',
  chronicDiseaseType: '',
  immunosuppressedReason: '',
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

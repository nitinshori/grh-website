import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

// ⚠️ DRAFT ePGD — clinical content requires review and sign-off by the named
// clinician (Dr N. Shori) before use. Schedule reflects TicoVac / TicoVac Junior
// SmPC + Green Book chapter 31 (Tick-borne encephalitis) and must be verified.

export interface TBEPatientDetails extends BasePatientDetails {
  travelDestination: string;
  travelReason: 'endemic-travel' | 'outdoor-occupational' | 'other' | '';
  departureDate: string;
  previousTBEDose: boolean;
  previousDoseDate?: string;
  knownAllergies: string;
}

export interface TBEConsent extends BaseConsent {
  understandsCourseSchedule: boolean;
  understandsInjection: boolean;
  understandsTimingBeforeTravel: boolean;
}

export interface TBEMedicalHistory {
  anaphylaxisPreviousDose: boolean;
  hypersensitivityEggOrComponent: boolean;
  acuteFebrileIllness: boolean;
  immunosuppressed: boolean;
  bleedingDisorder: boolean;
}

export interface TBESummary extends BaseSummary {
  vaccineType: 'ticovac' | 'ticovac-junior' | '';
  doseNumber: '1' | '2' | '3' | '';
  administrationSite: 'left-deltoid' | 'right-deltoid' | '';
  batchNumber: string;
  expiryDate: string;
  administrationTime: string;
  clinicalAlertsCodes: string[];
}

export const initialTBEPatientDetails: TBEPatientDetails = {
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
  travelDestination: '',
  travelReason: '',
  departureDate: '',
  previousTBEDose: false,
  previousDoseDate: '',
  knownAllergies: '',
};

export const initialTBEConsent: TBEConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understandsCourseSchedule: false,
  understandsInjection: false,
  understandsTimingBeforeTravel: false,
};

export const initialTBEMedicalHistory: TBEMedicalHistory = {
  anaphylaxisPreviousDose: false,
  hypersensitivityEggOrComponent: false,
  acuteFebrileIllness: false,
  immunosuppressed: false,
  bleedingDisorder: false,
};

export function initialTBESummary(): TBESummary {
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
    administrationSite: '',
    batchNumber: '',
    expiryDate: '',
    administrationTime: '',
    clinicalAlertsCodes: [],
  };
}

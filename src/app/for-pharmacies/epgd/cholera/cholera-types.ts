import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
} from '../shared/types';

// ⚠️ DRAFT ePGD — clinical content requires review and sign-off by the named
// clinician (Dr N. Shori) before use. Schedules below reflect Dukoral / Vaxchora
// SmPC + Green Book guidance and must be verified.

export interface CholeraPatientDetails extends BasePatientDetails {
  travelDestination: string;
  travelReason: 'endemic-travel' | 'aid-relief' | 'outbreak-response' | 'other' | '';
  departureDate: string;
  previousCholeraDose: boolean;
  previousDoseDate?: string;
  knownAllergies: string;
}

export interface CholeraConsent extends BaseConsent {
  understandsOralAdministration: boolean;
  understandsCourseSchedule: boolean;
  understandsTimingBeforeTravel: boolean;
}

export interface CholeraMedicalHistory {
  anaphylaxisPreviousDose: boolean;
  hypersensitivityComponent: boolean; // formaldehyde / any excipient
  acuteGastroIllness: boolean;
  acuteFebrileIllness: boolean;
  immunosuppressed: boolean;
}

export interface CholeraSummary extends BaseSummary {
  vaccineType: 'dukoral' | 'vaxchora' | '';
  doseNumber: '1' | '2' | '3' | '';
  batchNumber: string;
  expiryDate: string;
  administrationTime: string;
  clinicalAlertsCodes: string[];
}

export const initialCholeraPatientDetails: CholeraPatientDetails = {
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
  previousCholeraDose: false,
  previousDoseDate: '',
  knownAllergies: '',
};

export const initialCholeraConsent: CholeraConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understandsOralAdministration: false,
  understandsCourseSchedule: false,
  understandsTimingBeforeTravel: false,
};

export const initialCholeraMedicalHistory: CholeraMedicalHistory = {
  anaphylaxisPreviousDose: false,
  hypersensitivityComponent: false,
  acuteGastroIllness: false,
  acuteFebrileIllness: false,
  immunosuppressed: false,
};

export function initialCholeraSummary(): CholeraSummary {
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
    administrationTime: '',
    clinicalAlertsCodes: [],
  };
}

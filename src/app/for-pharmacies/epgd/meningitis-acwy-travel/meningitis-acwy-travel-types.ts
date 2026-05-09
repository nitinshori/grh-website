import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
  DoseRecommendation,
} from '../shared/types';

export interface MeningitisACWYPatientDetails extends BasePatientDetails {
  travelDestination: string;
  travelReason: 'hajj-umrah' | 'meningitis-belt' | 'university' | 'other' | '';
  departureDate: string;
  previousMenACWYDose: boolean;
  previousDoseDate?: string;
  knownAllergies: string;
}

export interface MeningitisACWYConsent extends BaseConsent {
  understands5YearValidity: boolean;
  understandsTimingRequirement: boolean;
  certificateRequirement: boolean;
}

export interface MeningitisACWYSummary extends BaseSummary {
  vaccineType: 'nimenrix' | 'menveo' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: 'left-deltoid' | 'right-deltoid' | '';
  administrationTime: string;
  counselledReactions: boolean;
  counselledValidity: boolean;
  counselledCertificate: boolean;
  clinicalAlertsCodes: string[];
}

export const initialMeningitisACWYPatientDetails: MeningitisACWYPatientDetails = {
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
  previousMenACWYDose: false,
  previousDoseDate: '',
  knownAllergies: '',
};

export const initialMeningitisACWYConsent: MeningitisACWYConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understands5YearValidity: false,
  understandsTimingRequirement: false,
  certificateRequirement: false,
};

export function initialMeningitisACWYSummary(): MeningitisACWYSummary {
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
    counselledValidity: false,
    counselledCertificate: false,
    clinicalAlertsCodes: [],
  };
}

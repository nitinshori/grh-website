import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
  DoseRecommendation,
} from '../shared/types';

export type TyphoidConsentBasis = 'parental' | 'gillick' | 'self' | '';

export interface TyphoidPatientDetails extends BasePatientDetails {
  travelDestination: string;
  travelReason: 'south-asia' | 'southeast-asia' | 'africa' | 'central-south-america' | 'other' | '';
  departureDate: string;
  itinerary: string;
  recommendationSource: string;
  /** Inclusion question as answered: '' until asked. A "no" is a stop. */
  recommendedAnswer: '' | 'yes' | 'no';
  previousTyphoidDose: boolean;
  previousDoseDate?: string;
  /** Document exception to the 3-year exclusion: returning to a risk area and
   *  the previous dose is due for renewal. Free text reason, recorded. */
  previousDoseRenewalReason: string;
  /** The document-exception question as answered when the previous dose is within 6 months of
   *  its renewal date: '' until asked. A "no" is the stop; before this the stop fired because the
   *  free-text reason was blank (stop audit, 11 Sep 2026). */
  previousDoseRenewalAnswer: '' | 'yes' | 'no';
  knownAllergies: string;
  consentBasis: TyphoidConsentBasis;
  consentDetail: string;
}

export interface TyphoidConsent extends BaseConsent {
  /** Field name is historical. Records that the patient understands a
   *  booster is needed every 3 YEARS (PGD v006), not 5. Kept for saved
   *  records; do not read it as a 5 year validity. */
  understands5YearValidity: boolean;
  understandsTimingRequirement: boolean;
  /** Field name is historical. Records that the patient understands the
   *  vaccine is about 70 to 80% effective, does not cover paratyphoid, and
   *  that food and water precautions remain the main protection. There is no
   *  certificate. */
  certificateRequirement: boolean;
}

export interface TyphoidSummary extends BaseSummary {
  vaccineType: 'typhim-vi' | 'other-vi' | '';
  vaccineBrand: string;
  batchNumber: string;
  expiryDate: string;
  administrationSite: 'left-deltoid' | 'right-deltoid' | '';
  administrationTime: string;
  adrenalineAvailable: boolean;
  nextBoosterDue: string;
  counselledReactions: boolean;
  counselledValidity: boolean;
  counselledCertificate: boolean;
  clinicalAlertsCodes: string[];
}

export const initialTyphoidPatientDetails: TyphoidPatientDetails = {
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
  itinerary: '',
  recommendationSource: '',
  recommendedAnswer: '',
  previousTyphoidDose: false,
  previousDoseDate: '',
  previousDoseRenewalReason: '',
  previousDoseRenewalAnswer: '',
  knownAllergies: '',
  consentBasis: '',
  consentDetail: '',
};

export const initialTyphoidConsent: TyphoidConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understands5YearValidity: false,
  understandsTimingRequirement: false,
  certificateRequirement: false,
};

export function initialTyphoidSummary(): TyphoidSummary {
  return {
    pharmacistName: '',
    pharmacistGPhC: '',
    pharmacyName: '',
    pharmacyAddress: '',
    consultationDate: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    consultationTime: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    clinicalNotes: '',
    vaccineType: '',
    vaccineBrand: '',
    batchNumber: '',
    expiryDate: '',
    administrationSite: '',
    administrationTime: '',
    adrenalineAvailable: false,
    nextBoosterDue: '',
    counselledReactions: false,
    counselledValidity: false,
    counselledCertificate: false,
    clinicalAlertsCodes: [],
  };
}

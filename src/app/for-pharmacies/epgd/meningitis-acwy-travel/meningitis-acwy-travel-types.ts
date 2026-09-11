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
  /** Where a repeat dose is given for certificate purposes: the reason for the repeat (records row). */
  repeatDoseReason: string;
  knownAllergies: string;
  /**
   * Travel passport number. Captured so we can reissue an ICVP/ACWY
   * vaccination certificate if the patient loses theirs. Particularly
   * useful for Hajj/Umrah where the certificate is mandatory for entry
   * to Saudi Arabia and must match the passport.
   */
  passportNumber: string;
}

export interface MeningitisACWYConsent extends BaseConsent {
  understands5YearValidity: boolean;
  understandsTimingRequirement: boolean;
  certificateRequirement: boolean;
  /** Under 16 only: who gave consent (PGD inclusion criterion). */
  consentBasis: 'parental' | 'gillick' | '';
  consentGiverDetails: string;
}

/** Medical history questions asked on step 3. */
export interface MeningitisACWYMedicalHistory {
  anaphylaxisToVaccine: boolean;
  anaphylaxisToVaccineComponent: boolean;
  /** Menveo only: hypersensitivity to diphtheria toxoid or CRM197. */
  diphtheriaToxoidHypersensitivity: boolean;
  severeFebrilleIllness: boolean;
  /** Outbreak or contact management is directed by the UKHSA Health Protection Team; refer. */
  outbreakOrContact: boolean;
  bleedingDisorder: boolean;
  immunosuppressed: boolean;
  pregnant: boolean;
  /** Asplenia, complement deficiency or due to start a complement inhibitor: may be NHS-funded. */
  nhsEligibleRiskGroup: boolean;
}

export const initialMeningitisACWYMedicalHistory: MeningitisACWYMedicalHistory = {
  anaphylaxisToVaccine: false,
  anaphylaxisToVaccineComponent: false,
  diphtheriaToxoidHypersensitivity: false,
  severeFebrilleIllness: false,
  outbreakOrContact: false,
  bleedingDisorder: false,
  immunosuppressed: false,
  pregnant: false,
  nhsEligibleRiskGroup: false,
};

/** Post-vaccine advice and records captured on step 6. */
export interface MeningitisACWYPostVaccineAdvice {
  patientAdvised: boolean;
  counselledReactions: boolean;
  counselledValidity: boolean;
  counselledCertificate: boolean;
  leafletGiven: boolean;
  counselledConjugateCertificate: boolean;
  counselledNotMenB: boolean;
  counselledMeningitisSigns: boolean;
  nextDoseBooked: boolean;
  observationCompleted: boolean;
}

export const initialMeningitisACWYPostVaccineAdvice: MeningitisACWYPostVaccineAdvice = {
  patientAdvised: false,
  counselledReactions: false,
  counselledValidity: false,
  counselledCertificate: false,
  leafletGiven: false,
  counselledConjugateCertificate: false,
  counselledNotMenB: false,
  counselledMeningitisSigns: false,
  nextDoseBooked: false,
  observationCompleted: false,
};

export interface MeningitisACWYSummary extends BaseSummary {
  vaccineType: 'nimenrix' | 'menquadfi' | 'menveo' | '';
  batchNumber: string;
  expiryDate: string;
  administrationSite: 'left-deltoid' | 'right-deltoid' | 'left-thigh' | 'right-thigh' | '';
  administrationTime: string;
  /** Dose number in the course, per the product schedule in the PGD. */
  doseNumber: 'single' | '1st' | '2nd' | 'booster-12-months' | 'repeat-certificate' | '';
  /** Where a course is involved, the date the next dose is due. */
  nextDueDate: string;
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
  repeatDoseReason: '',
  knownAllergies: '',
  passportNumber: '',
};

export const initialMeningitisACWYConsent: MeningitisACWYConsent = {
  informedConsentGiven: false,
  idVerified: false,
  idType: '',
  patientAwarePrivateService: false,
  understands5YearValidity: false,
  understandsTimingRequirement: false,
  certificateRequirement: false,
  consentBasis: '',
  consentGiverDetails: '',
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
    doseNumber: '',
    nextDueDate: '',
    counselledReactions: false,
    counselledValidity: false,
    counselledCertificate: false,
    clinicalAlertsCodes: [],
  };
}

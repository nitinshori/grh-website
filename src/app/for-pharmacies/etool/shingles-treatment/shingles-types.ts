// Shingles-specific types for PGD consultation
import { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

export type RashStage = 'prodromal' | 'vesicular' | 'pustular' | 'crusting' | '';
export type RashDermatome = 'thoracic' | 'cervical' | 'trigeminal-V1' | 'trigeminal-V2' | 'trigeminal-V3' | 'lumbar' | 'sacral';
export type PainType = 'burning' | 'stabbing' | 'aching' | 'itching' | '';
export type RenalStatus = 'none' | 'moderate' | 'severe';
export type HepaticStatus = 'none' | 'mild-moderate' | 'severe';
export type Medicine = 'valaciclovir' | 'aciclovir' | '';

export interface ShinglesSymptoms {
  rashOnsetDate: string; // ISO date string
  hoursSinceOnset: number | null; // calculated automatically
  rashStage: RashStage;
  dermatome: RashDermatome;
  painLevel: number | null; // 1-10 scale
  painType: PainType;
  unilateral: boolean; // should always be true for shingles
  rashDescription: string;
}

export interface ShinglesMedicalHistory {
  immunosuppressed: boolean;
  immunosuppressedDetails: string;
  pregnant: boolean;
  breastfeeding: boolean;
  renalImpairment: RenalStatus;
  hepaticImpairment: HepaticStatus;
  hivPositive: boolean;
  previousShingles: boolean;
  cancerActive: boolean;
  organTransplant: boolean;
  currentMedications: string;
  allergies: string;
}

export interface ShinglesMedicineSelection {
  medicine: Medicine;
  dose: string;
  frequency: string;
  duration: string;
  quantity: number;
  pharmacistOverride: boolean;
  overrideReason: string;
}

export interface ShinglesCounselling {
  completeCourse: boolean;
  painManagement: boolean;
  rashCare: boolean;
  contagiousPeriod: boolean;
  pregnancyExposure: boolean;
  PHNRisk: boolean;
  returnIfWorsening: boolean;
  vaccinationAdvice: boolean;
}

export interface ShinglesPatientDetails extends BasePatientDetails {
  // Inherits: dateOfBirth, gender (optional), weight, height, notes
}

export interface ShinglesConsent extends BaseConsent {
  // Inherits: agreedToTreatment, confirmIdentity, confirmedInformation
}

export interface ShinglesSummary extends BaseSummary {
  patientDetails: ShinglesPatientDetails;
  consent: ShinglesConsent;
  symptoms: ShinglesSymptoms;
  medicalHistory: ShinglesMedicalHistory;
  medicineSelection: ShinglesMedicineSelection;
  counselling: ShinglesCounselling;
}

// Initial state factories
export const initialShinglesSymptoms = (): ShinglesSymptoms => ({
  rashOnsetDate: '',
  hoursSinceOnset: null,
  rashStage: '',
  dermatome: 'thoracic',
  painLevel: null,
  painType: '',
  unilateral: true,
  rashDescription: '',
});

export const initialShinglesMedicalHistory = (): ShinglesMedicalHistory => ({
  immunosuppressed: false,
  immunosuppressedDetails: '',
  pregnant: false,
  breastfeeding: false,
  renalImpairment: 'none',
  hepaticImpairment: 'none',
  hivPositive: false,
  previousShingles: false,
  cancerActive: false,
  organTransplant: false,
  currentMedications: '',
  allergies: '',
});

export const initialShinglesMedicineSelection = (): ShinglesMedicineSelection => ({
  medicine: '',
  dose: '',
  frequency: '',
  duration: '',
  quantity: 0,
  pharmacistOverride: false,
  overrideReason: '',
});

export const initialShinglesCounselling = (): ShinglesCounselling => ({
  completeCourse: false,
  painManagement: false,
  rashCare: false,
  contagiousPeriod: false,
  pregnancyExposure: false,
  PHNRisk: false,
  returnIfWorsening: false,
  vaccinationAdvice: false,
});

// ─── Travellers' Diarrhoea ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

// ─── Patient Details (extends base) ───

export interface TDPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
  femaleConfirmed: boolean;
}

// ─── Travel Assessment ───

export interface TDTravelAssessment {
  destinationCountry: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  tripDuration: number | null; // calculated days
  travelType: string; // 'backpacking', 'business', 'cruise', 'resort', 'other'
  dietaryHabits: string; // street food, local markets, etc.
  previousDiarrhoeaEpisodes: boolean;
  previousEpisodeDetails: string;
}

// ─── Medical History (Travellers' Diarrhoea specific) ───

export interface TDMedicalHistory {
  currentlyPregnant: boolean;
  breastfeeding: boolean;
  severeHepaticImpairment: boolean;
  severeRenalImpairment: boolean;
  liverDisease: boolean;
  bloodInStool: boolean; // always refer if present
  feverAbove38_5C: boolean; // always refer if present
  diarrhoea12plusDays: boolean; // chronic/persistent
  crohnsDisease: boolean;
  ulcerativeColitis: boolean;
  ibd: boolean;
  immunocompromised: boolean;
  macrolideAllergy: boolean;
}

// ─── Current Medications ───

export interface TDMedications {
  takesQTprolongingDrugs: boolean; // azithromycin caution
  takesWarfarin: boolean;
  takesMethadone: boolean;
  takesDigoxin: boolean;
  takesOtherDrugs: boolean;
  otherDrugsDetails: string;
}

// ─── Medicine Selection ───

export interface TDMedicineSelection {
  selectedApproach: 'standby' | 'not-supplied' | '';
  loperamideDose: string; // e.g. "2mg initial, then 2mg after each loose stool"
  azithromycinDose: string; // e.g. "500mg OD x3 days"
  selectedForCriteria: string; // mild vs moderate-severe
  reason: string;
}

// ─── Counselling & Follow-up ───

export interface TDCounselling {
  orCrsAdvice: boolean; // Oral rehydration solution
  whenToStartTreatment: boolean;
  loperamideAdvice: boolean; // use only if no fever/blood
  azithromycinAdvice: boolean; // for moderate-severe
  pregnancyAdvice: boolean;
  foodHygiene: boolean;
  waterSafety: boolean;
  whenToSeekHelp: boolean; // red flags
  childrenUnderWarning: boolean; // not suitable <12 without medical advice
  medicineCardProvided: boolean;
}

// ─── Full Consultation Summary ───

export interface TDConsultationSummary extends BaseSummary {
  // Additional TD-specific fields if needed
}

// ─── Full Consultation State ───

export interface TDConsultationState {
  currentStep: number;
  patient: TDPatientDetails;
  consent: BaseConsent;
  travelAssessment: TDTravelAssessment;
  medicalHistory: TDMedicalHistory;
  medications: TDMedications;
  medicineSelection: TDMedicineSelection;
  counselling: TDCounselling;
  summary: TDConsultationSummary;
  // Computed
  alerts: any[];
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type TDAction =
  | { type: 'UPDATE_PATIENT'; field: keyof TDPatientDetails; value: TDPatientDetails[keyof TDPatientDetails] }
  | { type: 'UPDATE_CONSENT'; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: 'UPDATE_TRAVEL'; field: keyof TDTravelAssessment; value: TDTravelAssessment[keyof TDTravelAssessment] }
  | { type: 'UPDATE_MEDICAL_HISTORY'; field: keyof TDMedicalHistory; value: TDMedicalHistory[keyof TDMedicalHistory] }
  | { type: 'UPDATE_MEDICATIONS'; field: keyof TDMedications; value: TDMedications[keyof TDMedications] }
  | { type: 'UPDATE_MEDICINE_SELECTION'; field: keyof TDMedicineSelection; value: string }
  | { type: 'UPDATE_COUNSELLING'; field: keyof TDCounselling; value: boolean }
  | { type: 'UPDATE_SUMMARY'; field: keyof TDConsultationSummary; value: string }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

// ─── Step Labels ───

export const STEP_LABELS = [
  'Patient Details',
  'Consent & ID',
  'Travel Assessment',
  'Medical History',
  'Contraindications Review',
  'Medicine Selection',
  'Counselling & Follow-up',
  'Summary & Print',
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialTDState(): TDConsultationState {
  return {
    currentStep: 0,
    patient: {
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
      maleConfirmed: false,
      femaleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: '',
      patientAwarePrivateService: false,
    },
    travelAssessment: {
      destinationCountry: '',
      departureDate: '',
      returnDate: '',
      tripDuration: null,
      travelType: '',
      dietaryHabits: '',
      previousDiarrhoeaEpisodes: false,
      previousEpisodeDetails: '',
    },
    medicalHistory: {
      currentlyPregnant: false,
      breastfeeding: false,
      severeHepaticImpairment: false,
      severeRenalImpairment: false,
      liverDisease: false,
      bloodInStool: false,
      feverAbove38_5C: false,
      diarrhoea12plusDays: false,
      crohnsDisease: false,
      ulcerativeColitis: false,
      ibd: false,
      immunocompromised: false,
      macrolideAllergy: false,
    },
    medications: {
      takesQTprolongingDrugs: false,
      takesWarfarin: false,
      takesMethadone: false,
      takesDigoxin: false,
      takesOtherDrugs: false,
      otherDrugsDetails: '',
    },
    medicineSelection: {
      selectedApproach: '',
      loperamideDose: '',
      azithromycinDose: '',
      selectedForCriteria: '',
      reason: '',
    },
    counselling: {
      orCrsAdvice: false,
      whenToStartTreatment: false,
      loperamideAdvice: false,
      azithromycinAdvice: false,
      pregnancyAdvice: false,
      foodHygiene: false,
      waterSafety: false,
      whenToSeekHelp: false,
      childrenUnderWarning: false,
      medicineCardProvided: false,
    },
    summary: {
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
    },
    alerts: [],
    canProceed: false,
    isComplete: false,
  };
}

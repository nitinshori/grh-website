// ─── Anti-malarials ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

// ─── Patient Details (extends base) ───

export interface AMPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
  femaleConfirmed: boolean;
}

// ─── Travel Assessment ───

export interface AMTravelAssessment {
  destinationCountry: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  tripDuration: number | null; // calculated days
  previousMalariaProphylaxis: boolean;
  previousProphylaxisType: string; // if yes: which medicine?
  currentlyPregnant: boolean;
  planningPregnancy: boolean;
  breastfeeding: boolean;
}

// ─── Medical History (Anti-malarials specific) ───

export interface AMMedicalHistory {
  severeRenalImpairment: boolean; // eGFR <30 for Malarone
  severeHepaticImpairment: boolean;
  epilepsy: boolean; // contraindication for Mefloquine
  psychiatricHistory: boolean; // contraindication for Mefloquine
  sulfonamideAllergy: boolean; // caution re: doxycycline
  penicillinAllergy: boolean;
  photosensitivity: boolean; // caution for Doxy
  g6pdDeficiency: boolean; // caution/alert
  arrhythmia: boolean; // caution for Mefloquine
  qTprolongation: boolean; // caution
}

// ─── Current Medications ───

export interface AMMedications {
  takesWarfarin: boolean;
  takesOralContraception: boolean; // doxy can reduce efficacy
  takesAntacids: boolean; // can reduce Malarone absorption
  takesOtherDrugs: boolean;
  otherDrugsDetails: string;
}

// ─── Medicine Contraindications Check ───

export interface AMContraindications {
  malaioneContraindicated: boolean;
  doxyContraindicated: boolean;
  mefloquineContraindicated: boolean;
}

// ─── Medicine Selection ───

export interface AMMedicineSelection {
  selectedMedicine: 'malarone' | 'doxycycline' | 'mefloquine' | '';
  dose: string;
  startTiming: string;
  continuationAfterReturn: string;
  reason: string;
}

// ─── Counselling & Follow-up ───

export interface AMCounselling {
  takeWithFood: boolean;
  sunProtectionAdvice: boolean; // especially for Doxy
  bitePrevention: boolean;
  pregnancyAdvice: boolean;
  diarrhoeaManagement: boolean;
  feverManagement: boolean;
  sideEffectsExplained: boolean;
  whenToSeekHelp: boolean;
  medicineCardProvided: boolean;
}

// ─── Full Consultation Summary ───

export interface AMConsultationSummary extends BaseSummary {
  // Additional AM-specific fields if needed
}

// ─── Full Consultation State ───

export interface AMConsultationState {
  currentStep: number;
  patient: AMPatientDetails;
  consent: BaseConsent;
  travelAssessment: AMTravelAssessment;
  medicalHistory: AMMedicalHistory;
  medications: AMMedications;
  contraindications: AMContraindications;
  medicineSelection: AMMedicineSelection;
  counselling: AMCounselling;
  summary: AMConsultationSummary;
  // Computed
  alerts: any[];
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type AMAction =
  | { type: 'UPDATE_PATIENT'; field: keyof AMPatientDetails; value: AMPatientDetails[keyof AMPatientDetails] }
  | { type: 'UPDATE_CONSENT'; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: 'UPDATE_TRAVEL'; field: keyof AMTravelAssessment; value: AMTravelAssessment[keyof AMTravelAssessment] }
  | { type: 'UPDATE_MEDICAL_HISTORY'; field: keyof AMMedicalHistory; value: AMMedicalHistory[keyof AMMedicalHistory] }
  | { type: 'UPDATE_MEDICATIONS'; field: keyof AMMedications; value: AMMedications[keyof AMMedications] }
  | { type: 'UPDATE_CONTRAINDICATIONS'; field: keyof AMContraindications; value: boolean }
  | { type: 'UPDATE_MEDICINE_SELECTION'; field: keyof AMMedicineSelection; value: string }
  | { type: 'UPDATE_COUNSELLING'; field: keyof AMCounselling; value: boolean }
  | { type: 'UPDATE_SUMMARY'; field: keyof AMConsultationSummary; value: string }
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
  'Current Medications',
  'Contraindications Review',
  'Medicine Selection',
  'Counselling & Follow-up',
  'Summary & Print',
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialAMState(): AMConsultationState {
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
      previousMalariaProphylaxis: false,
      previousProphylaxisType: '',
      currentlyPregnant: false,
      planningPregnancy: false,
      breastfeeding: false,
    },
    medicalHistory: {
      severeRenalImpairment: false,
      severeHepaticImpairment: false,
      epilepsy: false,
      psychiatricHistory: false,
      sulfonamideAllergy: false,
      penicillinAllergy: false,
      photosensitivity: false,
      g6pdDeficiency: false,
      arrhythmia: false,
      qTprolongation: false,
    },
    medications: {
      takesWarfarin: false,
      takesOralContraception: false,
      takesAntacids: false,
      takesOtherDrugs: false,
      otherDrugsDetails: '',
    },
    contraindications: {
      malaioneContraindicated: false,
      doxyContraindicated: false,
      mefloquineContraindicated: false,
    },
    medicineSelection: {
      selectedMedicine: '',
      dose: '',
      startTiming: '',
      continuationAfterReturn: '',
      reason: '',
    },
    counselling: {
      takeWithFood: false,
      sunProtectionAdvice: false,
      bitePrevention: false,
      pregnancyAdvice: false,
      diarrhoeaManagement: false,
      feverManagement: false,
      sideEffectsExplained: false,
      whenToSeekHelp: false,
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

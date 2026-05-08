// ─── Altitude Sickness ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

// ─── Patient Details (extends base) ───

export interface ASPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
  femaleConfirmed: boolean;
}

// ─── Travel Assessment ───

export interface ASTravelAssessment {
  destinationCountry: string;
  destinationAltitude: number | null; // meters
  currentAltitude: number | null; // current altitude they're at (base)
  departureDate: string; // YYYY-MM-DD
  ascentRate: string; // 'slow' (gradual), 'moderate', 'rapid'
  acclimatisationPlan: boolean;
  acclimatisationDays: number | null; // days at intermediate altitude
  previousAltitudeExperience: boolean;
  previousAltitudeSickness: boolean;
  previousSicknessDetails: string;
}

// ─── Medical History (Altitude Sickness specific) ───

export interface ASMedicalHistory {
  sulfonamideAllergy: boolean; // contraindication for Acetazolamide
  severeHepaticImpairment: boolean;
  severeRenalImpairment: boolean;
  adrenalInsufficiency: boolean; // contraindication
  hypokalaemia: boolean; // contraindication
  hyponatraemia: boolean; // contraindication
  renalStoneHistory: boolean; // caution: increase fluid intake
  pulmonaryOedema: boolean;
  cerebralOedema: boolean;
  highAltitudeArrhythmia: boolean;
  pregnantOrBreastfeeding: boolean;
}

// ─── Current Medications ───

export interface ASMedications {
  takesThiazideDiuretics: boolean;
  takesACEInhibitors: boolean;
  takesTopiramate: boolean; // may interact
  takesOtherDrugs: boolean;
  otherDrugsDetails: string;
}

// ─── Medicine Selection ───

export interface ASMedicineSelection {
  selectedMedicine: 'acetazolamide' | '';
  dose: string; // e.g. "250mg BD"
  startTiming: string;
  continuationTiming: string;
  reason: string;
}

// ─── Counselling & Follow-up ───

export interface ASCounselling {
  paraesthesiaExplained: boolean; // tingling is common and harmless
  avoidAlcoholAdvice: boolean;
  hydrateWellAdvice: boolean;
  ascentAdvice: boolean;
  amsSymptomAdvice: boolean; // Acute mountain sickness symptoms
  haceSymptomAdvice: boolean; // High altitude cerebral edema
  hapeSymptomAdvice: boolean; // High altitude pulmonary edema
  descentAdvice: boolean; // descent immediately if severe
  medicineCardProvided: boolean;
}

// ─── Full Consultation Summary ───

export interface ASConsultationSummary extends BaseSummary {
  // Additional AS-specific fields if needed
}

// ─── Full Consultation State ───

export interface ASConsultationState {
  currentStep: number;
  patient: ASPatientDetails;
  consent: BaseConsent;
  travelAssessment: ASTravelAssessment;
  medicalHistory: ASMedicalHistory;
  medications: ASMedications;
  medicineSelection: ASMedicineSelection;
  counselling: ASCounselling;
  summary: ASConsultationSummary;
  // Computed
  alerts: any[];
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type ASAction =
  | { type: 'UPDATE_PATIENT'; field: keyof ASPatientDetails; value: ASPatientDetails[keyof ASPatientDetails] }
  | { type: 'UPDATE_CONSENT'; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: 'UPDATE_TRAVEL'; field: keyof ASTravelAssessment; value: ASTravelAssessment[keyof ASTravelAssessment] }
  | { type: 'UPDATE_MEDICAL_HISTORY'; field: keyof ASMedicalHistory; value: ASMedicalHistory[keyof ASMedicalHistory] }
  | { type: 'UPDATE_MEDICATIONS'; field: keyof ASMedications; value: ASMedications[keyof ASMedications] }
  | { type: 'UPDATE_MEDICINE_SELECTION'; field: keyof ASMedicineSelection; value: string }
  | { type: 'UPDATE_COUNSELLING'; field: keyof ASCounselling; value: boolean }
  | { type: 'UPDATE_SUMMARY'; field: keyof ASConsultationSummary; value: string }
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

export function createInitialASState(): ASConsultationState {
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
      destinationAltitude: null,
      currentAltitude: null,
      departureDate: '',
      ascentRate: '',
      acclimatisationPlan: false,
      acclimatisationDays: null,
      previousAltitudeExperience: false,
      previousAltitudeSickness: false,
      previousSicknessDetails: '',
    },
    medicalHistory: {
      sulfonamideAllergy: false,
      severeHepaticImpairment: false,
      severeRenalImpairment: false,
      adrenalInsufficiency: false,
      hypokalaemia: false,
      hyponatraemia: false,
      renalStoneHistory: false,
      pulmonaryOedema: false,
      cerebralOedema: false,
      highAltitudeArrhythmia: false,
      pregnantOrBreastfeeding: false,
    },
    medications: {
      takesThiazideDiuretics: false,
      takesACEInhibitors: false,
      takesTopiramate: false,
      takesOtherDrugs: false,
      otherDrugsDetails: '',
    },
    medicineSelection: {
      selectedMedicine: '',
      dose: '',
      startTiming: '',
      continuationTiming: '',
      reason: '',
    },
    counselling: {
      paraesthesiaExplained: false,
      avoidAlcoholAdvice: false,
      hydrateWellAdvice: false,
      ascentAdvice: false,
      amsSymptomAdvice: false,
      haceSymptomAdvice: false,
      hapeSymptomAdvice: false,
      descentAdvice: false,
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

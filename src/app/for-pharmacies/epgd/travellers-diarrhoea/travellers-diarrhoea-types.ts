// ─── Travellers' Diarrhoea ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from '../shared/types';

// ─── Patient Details (extends base) ───

export type TDPatientDetails = BasePatientDetails;

// ─── Travel Assessment ───

export interface TDTravelAssessment {
  destinationCountry: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  tripDuration: number | null; // calculated days
  /** PGD v004 inclusion: recent or planned travel to a high-risk region, confirmed against a risk source (TravelHealthPro), not from memory. */
  highRiskRegionConfirmed: boolean;
  travelType: string; // 'backpacking', 'business', 'cruise', 'resort', 'other'
  dietaryHabits: string; // street food, local markets, etc.
  previousDiarrhoeaEpisodes: boolean;
  previousEpisodeDetails: string;
}

// ─── Medical History (Travellers' Diarrhoea specific) ───

export interface TDMedicalHistory {
  /** The pharmacist confirms every question on the page was asked. Every exclusion defaults to absent. */
  allQuestionsAsked: boolean;
  currentlyPregnant: boolean;
  breastfeeding: boolean;
  severeHepaticImpairment: boolean; // PGD v004 exclusion: severe liver disease
  severeRenalImpairment: boolean;
  liverDisease: boolean; // PGD v004 exclusion: significant hepatic dysfunction
  bloodInStool: boolean; // PGD v004 exclusion: bloody diarrhoea
  feverAbove38_5C: boolean; // PGD v004 exclusion: high fever
  systemicallyUnwell: boolean; // PGD v004 exclusion: signs of systemic illness
  symptomsOver72Hours: boolean; // PGD v004 exclusion: symptoms lasting more than 72 hours without improvement
  crohnsDisease: boolean;
  ulcerativeColitis: boolean;
  ibd: boolean;
  immunocompromised: boolean;
  macrolideAllergy: boolean;
}

// ─── Current Medications ───

export interface TDMedications {
  /** The pharmacist confirms every medicine on the page was asked about. */
  allQuestionsAsked: boolean;
  takesQTprolongingDrugs: boolean; // PGD v004 exclusion: concomitant QT-prolonging medicines
  takesWarfarin: boolean;
  takesMethadone: boolean;
  takesDigoxin: boolean;
  takesOtherDrugs: boolean;
  otherDrugsDetails: string;
}

// ─── Medicine Selection ───

export interface TDMedicineSelection {
  selectedApproach: 'standby' | 'not-supplied' | '';
  /** PGD v004: 500 mg once daily for 1 to 3 days depending on clinical severity. The course length is the only choice; the dose is the document's. */
  azithromycinDays: 1 | 2 | 3 | null;
  /** Set by the reducer from azithromycinDays; not typed. */
  azithromycinDose: string;
  /** PGD v004: one to three 500 mg tablets; equals the course length in days. Set by the reducer. */
  azithromycinQuantity: number | null;
  /** PGD v004 records: name and brand of medication. */
  brand: string;
  selectedForCriteria: string; // 'moderate-severe' (PGD indication)
  reason: string;
}

// ─── Counselling & Follow-up ───

export interface TDCounselling {
  orCrsAdvice: boolean; // Oral rehydration solution
  whenToStartTreatment: boolean;
  loperamideAdvice: boolean; // use only if no fever/blood
  azithromycinAdvice: boolean; // for moderate-severe
  pregnancyAdvice: boolean;
  /** Pregnancy implications do not apply (for example a male patient). One of pregnancyAdvice or this must be ticked. */
  pregnancyAdviceNotApplicable: boolean;
  foodHygiene: boolean;
  waterSafety: boolean;
  whenToSeekHelp: boolean; // red flags
  childrenUnderWarning: boolean; // repurposed (field name kept): stop treatment if hypersensitivity or serious side effects occur
  medicineCardProvided: boolean;
}

// ─── Full Consultation Summary ───

export type TDConsultationSummary = BaseSummary;

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
}

// ─── Reducer Actions ───

export type TDAction =
  | { type: 'UPDATE_PATIENT'; field: keyof TDPatientDetails; value: TDPatientDetails[keyof TDPatientDetails] }
  | { type: 'UPDATE_CONSENT'; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: 'UPDATE_TRAVEL'; field: keyof TDTravelAssessment; value: TDTravelAssessment[keyof TDTravelAssessment] }
  | { type: 'UPDATE_MEDICAL_HISTORY'; field: keyof TDMedicalHistory; value: TDMedicalHistory[keyof TDMedicalHistory] }
  | { type: 'UPDATE_MEDICATIONS'; field: keyof TDMedications; value: TDMedications[keyof TDMedications] }
  | { type: 'UPDATE_MEDICINE_SELECTION'; field: keyof TDMedicineSelection; value: TDMedicineSelection[keyof TDMedicineSelection] }
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
  'Current Medications',
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
gpEmail: '',
gpOdsCode: '',
      nhsNumber: '',
      address: '',
      phone: '',
      email: '',
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
      highRiskRegionConfirmed: false,
      travelType: '',
      dietaryHabits: '',
      previousDiarrhoeaEpisodes: false,
      previousEpisodeDetails: '',
    },
    medicalHistory: {
      allQuestionsAsked: false,
      currentlyPregnant: false,
      breastfeeding: false,
      severeHepaticImpairment: false,
      severeRenalImpairment: false,
      liverDisease: false,
      bloodInStool: false,
      feverAbove38_5C: false,
      systemicallyUnwell: false,
      symptomsOver72Hours: false,
      crohnsDisease: false,
      ulcerativeColitis: false,
      ibd: false,
      immunocompromised: false,
      macrolideAllergy: false,
    },
    medications: {
      allQuestionsAsked: false,
      takesQTprolongingDrugs: false,
      takesWarfarin: false,
      takesMethadone: false,
      takesDigoxin: false,
      takesOtherDrugs: false,
      otherDrugsDetails: '',
    },
    medicineSelection: {
      selectedApproach: '',
      azithromycinDays: null,
      azithromycinDose: '',
      azithromycinQuantity: null,
      brand: '',
      selectedForCriteria: '',
      reason: '',
    },
    counselling: {
      orCrsAdvice: false,
      whenToStartTreatment: false,
      loperamideAdvice: false,
      azithromycinAdvice: false,
      pregnancyAdvice: false,
      pregnancyAdviceNotApplicable: false,
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
  };
}

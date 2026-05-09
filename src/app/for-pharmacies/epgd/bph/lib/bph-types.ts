// ─── BPH (Tamsulosin) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Extended types for BPH PGD ───

export interface BPHPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

export interface BPHLutsAssessment {
  ipssScore: number | null; // 0-35
  frequency: boolean; // >8 times in 24h
  urgency: boolean; // Strong, persistent urge
  nocturia: boolean; // >1 time per night
  weakStream: boolean;
  hesitancy: boolean; // Difficulty starting
  incompletEmptying: boolean;
  lowerAbdominalDiscomfort: boolean;
}

export interface BPHMedicalHistory {
  orthostasisHistory: boolean; // Orthostatic hypotension
  severeHepaticImpairment: boolean;
  plannedCataractSurgery: boolean; // IFIS risk
  otherConditions: string;
}

export interface BPHRedFlags {
  haematuria: boolean;
  acuteRetention: boolean;
  palpableBladder: boolean;
  psa4OrAbove: boolean;
  weightLoss: boolean;
  bonePain: boolean;
}

export interface BPHContraindications {
  takingPde5Inhibitor: boolean;
  pde5Detail: string;
  otherAntihypertensives: string;
}

export interface BPHMedicineSupply {
  tamsulosin400mcgMrOd: boolean;
  afterFood30mins: boolean;
  sameTimeDaily: boolean;
  firstDoseHypotension: boolean;
}

export interface BPHCounselling {
  take30minsAfterFood: boolean;
  firstDoseHypotension: boolean;
  retrogradeEjaculation: boolean;
  informOphthalmologist: boolean;
  reviewAt4To6Weeks: boolean;
}

export interface BPHConsultationState {
  patient: BPHPatientDetails;
  consent: BaseConsent;
  lutsAssessment: BPHLutsAssessment;
  medicalHistory: BPHMedicalHistory;
  redFlags: BPHRedFlags;
  contraindications: BPHContraindications;
  medicineSupply: BPHMedicineSupply;
  counselling: BPHCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type BPHAction =
  | { type: "UPDATE_PATIENT"; field: keyof BPHPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_LUTS_ASSESSMENT"; field: keyof BPHLutsAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof BPHMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof BPHRedFlags; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof BPHContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof BPHMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof BPHCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "LUTS Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): BPHConsultationState {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
      maleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    lutsAssessment: {
      ipssScore: null,
      frequency: false,
      urgency: false,
      nocturia: false,
      weakStream: false,
      hesitancy: false,
      incompletEmptying: false,
      lowerAbdominalDiscomfort: false,
    },
    medicalHistory: {
      orthostasisHistory: false,
      severeHepaticImpairment: false,
      plannedCataractSurgery: false,
      otherConditions: "",
    },
    redFlags: {
      haematuria: false,
      acuteRetention: false,
      palpableBladder: false,
      psa4OrAbove: false,
      weightLoss: false,
      bonePain: false,
    },
    contraindications: {
      takingPde5Inhibitor: false,
      pde5Detail: "",
      otherAntihypertensives: "",
    },
    medicineSupply: {
      tamsulosin400mcgMrOd: false,
      afterFood30mins: false,
      sameTimeDaily: false,
      firstDoseHypotension: false,
    },
    counselling: {
      take30minsAfterFood: false,
      firstDoseHypotension: false,
      retrogradeEjaculation: false,
      informOphthalmologist: false,
      reviewAt4To6Weeks: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
    },
    currentStep: 0,
  };
}

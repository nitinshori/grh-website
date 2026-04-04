// ─── Hair Loss (Finasteride) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary, DoseRecommendation, ClinicalAlert } from "../../shared/types";

// ─── Extended types for Hair Loss PGD ───

export interface HLPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

export interface HLClinicalAssessment {
  norwoodHamiltonScale: number | null; // 1-7
  hasAndrogeneticAlopecia: boolean;
  alopeciaOnset: string;
  familyHistory: boolean;
}

export interface HLMedicalHistory {
  liverDisease: boolean;
  prostateCancer: boolean;
  prostateCancerDetail: string;
  psaAbnormalities: boolean;
  psaAbnormaltiesDetail: string;
  hypersensitivity: boolean;
  otherConditions: string;
}

export interface HLContraindications {
  depressiveMood: boolean;
  depressiveMoodDetail: string;
}

export interface HLMedicineSupply {
  finasteride1mgOd: boolean;
  partnerNotified: boolean; // critical caution: teratogenic
  willMonitorSE: boolean; // sexual side effects
  understandsPSAEffect: boolean;
}

export interface HLCounselling {
  effectOnsetTime: boolean;
  hairLossResumesStopped: boolean;
  sexualSideEffects: boolean;
  moodChanges: boolean;
  annualReview: boolean;
  reportChanges: boolean;
}

export interface HLConsultationState {
  patient: HLPatientDetails;
  consent: BaseConsent;
  clinicalAssessment: HLClinicalAssessment;
  medicalHistory: HLMedicalHistory;
  contraindications: HLContraindications;
  medicineSupply: HLMedicineSupply;
  counselling: HLCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type HLAction =
  | { type: "UPDATE_PATIENT"; field: keyof HLPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof HLClinicalAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof HLMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof HLContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof HLMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof HLCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): HLConsultationState {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
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
    clinicalAssessment: {
      norwoodHamiltonScale: null,
      hasAndrogeneticAlopecia: false,
      alopeciaOnset: "",
      familyHistory: false,
    },
    medicalHistory: {
      liverDisease: false,
      prostateCancer: false,
      prostateCancerDetail: "",
      psaAbnormalities: false,
      psaAbnormaltiesDetail: "",
      hypersensitivity: false,
      otherConditions: "",
    },
    contraindications: {
      depressiveMood: false,
      depressiveMoodDetail: "",
    },
    medicineSupply: {
      finasteride1mgOd: false,
      partnerNotified: false,
      willMonitorSE: false,
      understandsPSAEffect: false,
    },
    counselling: {
      effectOnsetTime: false,
      hairLossResumesStopped: false,
      sexualSideEffects: false,
      moodChanges: false,
      annualReview: false,
      reportChanges: false,
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

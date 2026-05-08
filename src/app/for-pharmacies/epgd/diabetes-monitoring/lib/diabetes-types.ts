// ─── Diabetes Monitoring + Metformin ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface DiabetesPatientDetails extends BasePatientDetails {}

export interface DiabetesAssessment {
  hasExistingT2DM: boolean;
  stableOnMetforminMonths: number | null;
  lastHbA1cMonths: number | null;
  lastHbA1cValue: number | null;
  lastEgfrMonths: number | null;
  lastEgfrValue: number | null;
  currentMetforminDose: string;
  weight: number | null;
  systolicBP: number | null;
}

export interface DiabetesMedicalHistory {
  diabetesDiagnosed: boolean;
  dka: boolean;
  severeHepaticImpairment: boolean;
  dehydration: boolean;
  sepsis: boolean;
  myocardialInfarction: boolean;
  otherConditions: string;
}

export interface DiabetesRedFlags {
  egfrBelow30: boolean;
  hbA1cPoorControl: boolean;
  lacticAcidosisSymptoms: boolean;
  acuteConditions: boolean;
}

export interface DiabetesMedicineSupply {
  metforminFormatSelected: string; // "standard" | "mr"
  doseSelected: string;
  dosageConfirmed: boolean;
  eGFRBasedDoseAdjustment: boolean;
}

export interface DiabetesCounselling {
  takeWithFood: boolean;
  giIntolerance: boolean;
  sickDayRules: boolean;
  alcoholModeration: boolean;
  annualReview: boolean;
}

export interface DiabetesConsultationState {
  patient: DiabetesPatientDetails;
  consent: BaseConsent;
  assessment: DiabetesAssessment;
  medicalHistory: DiabetesMedicalHistory;
  redFlags: DiabetesRedFlags;
  medicineSupply: DiabetesMedicineSupply;
  counselling: DiabetesCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type DiabetesAction =
  | { type: "UPDATE_PATIENT"; field: keyof DiabetesPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof DiabetesAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof DiabetesMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof DiabetesRedFlags; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof DiabetesMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof DiabetesCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Diabetes Assessment",
  "Medical History",
  "Current Medications",
  "Monitoring Review",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): DiabetesConsultationState {
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
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      hasExistingT2DM: false,
      stableOnMetforminMonths: null,
      lastHbA1cMonths: null,
      lastHbA1cValue: null,
      lastEgfrMonths: null,
      lastEgfrValue: null,
      currentMetforminDose: "",
      weight: null,
      systolicBP: null,
    },
    medicalHistory: {
      diabetesDiagnosed: false,
      dka: false,
      severeHepaticImpairment: false,
      dehydration: false,
      sepsis: false,
      myocardialInfarction: false,
      otherConditions: "",
    },
    redFlags: {
      egfrBelow30: false,
      hbA1cPoorControl: false,
      lacticAcidosisSymptoms: false,
      acuteConditions: false,
    },
    medicineSupply: {
      metforminFormatSelected: "",
      doseSelected: "",
      dosageConfirmed: false,
      eGFRBasedDoseAdjustment: false,
    },
    counselling: {
      takeWithFood: false,
      giIntolerance: false,
      sickDayRules: false,
      alcoholModeration: false,
      annualReview: false,
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

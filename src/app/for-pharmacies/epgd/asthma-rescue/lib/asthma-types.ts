// ─── Asthma Rescue (Salbutamol) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Extended types for Asthma Rescue PGD ───

export interface AsthmaPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean;
}

export interface AsthmaAssessment {
  hasExistingDiagnosis: boolean;
  normallyUsesSABA: boolean;
  frequentUse: boolean; // >3 days/week
  nocturnalSymptoms: boolean;
  activityLimitation: boolean;
  currentSABAMedication: string;
  reasonForSupply: string; // "ran out" | "replacement" | "other"
}

export interface AsthmaMedicalHistory {
  hasAsthmaRecord: boolean;
  otherRespiratoryConditions: string;
  allergies: string;
  otherConditions: string;
}

export interface AsthmaRedFlags {
  increasingUse: boolean;
  nocturnalWakenings: boolean;
  activityLimitation: boolean;
  neverUsedSalbutamolBefore: boolean;
  noExistingDiagnosis: boolean;
}

export interface AsthmaMedicineSupply {
  salbutamol100mcgPMDI: boolean;
  twoAsDoseUnit: boolean;
  maxEightPuffsDailyUnderstood: boolean;
  spacerRecommended: boolean;
}

export interface AsthmaCounselling {
  relieverNotPreventer: boolean;
  inhalerTechniqueDemonstration: boolean;
  rinseMouthAfterUse: boolean;
  spacerUse: boolean;
  seekUrgentCareIfNotResolving: boolean;
}

export interface AsthmaConsultationState {
  patient: AsthmaPatientDetails;
  consent: BaseConsent;
  assessment: AsthmaAssessment;
  medicalHistory: AsthmaMedicalHistory;
  redFlags: AsthmaRedFlags;
  medicineSupply: AsthmaMedicineSupply;
  counselling: AsthmaCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type AsthmaAction =
  | { type: "UPDATE_PATIENT"; field: keyof AsthmaPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AsthmaAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AsthmaMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof AsthmaRedFlags; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof AsthmaMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AsthmaCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Asthma Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): AsthmaConsultationState {
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
      femaleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      hasExistingDiagnosis: false,
      normallyUsesSABA: false,
      frequentUse: false,
      nocturnalSymptoms: false,
      activityLimitation: false,
      currentSABAMedication: "",
      reasonForSupply: "",
    },
    medicalHistory: {
      hasAsthmaRecord: false,
      otherRespiratoryConditions: "",
      allergies: "",
      otherConditions: "",
    },
    redFlags: {
      increasingUse: false,
      nocturnalWakenings: false,
      activityLimitation: false,
      neverUsedSalbutamolBefore: false,
      noExistingDiagnosis: false,
    },
    medicineSupply: {
      salbutamol100mcgPMDI: false,
      twoAsDoseUnit: false,
      maxEightPuffsDailyUnderstood: false,
      spacerRecommended: false,
    },
    counselling: {
      relieverNotPreventer: false,
      inhalerTechniqueDemonstration: false,
      rinseMouthAfterUse: false,
      spacerUse: false,
      seekUrgentCareIfNotResolving: false,
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

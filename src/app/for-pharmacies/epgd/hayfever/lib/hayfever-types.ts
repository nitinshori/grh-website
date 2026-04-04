// ─── Hayfever (Prescription Strength) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface HayfeverPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean;
}

export interface HayfeverAssessment {
  symptomSeverity: string; // "mild" | "moderate" | "severe"
  affectedSystems: string[]; // "nasal" | "ocular" | "respiratory"
  seasonalOrPerennial: string; // "seasonal" | "perennial" | "both"
  previousOTCUse: string;
  symptomDuration: string;
}

export interface HayfeverMedicalHistory {
  asthmaOrLrti: boolean;
  severeHepaticImpairment: boolean;
  renalImpairment: boolean;
  recentNasalSurgery: boolean;
  phenylketonuria: boolean;
  otherConditions: string;
}

export interface HayfeverContraindications {
  pregnant: boolean;
  breastfeeding: boolean;
  childUnder12: boolean;
  otherMedicines: string;
}

export interface HayfeverMedicineSupply {
  medicineSelected: string; // "fexofenadine" | "fluticasone" | "montelukast" | "combination"
  fexofenadin180: boolean;
  fluticasonNasalSpray: boolean;
  montelukast10: boolean;
  dosageConfirmed: boolean;
}

export interface HayfeverCounselling {
  allergenAvoidance: boolean;
  nasalSprayTechnique: boolean;
  effectivenessTimeline: boolean;
  combinationRationale: boolean;
  wrapsunglasses: boolean;
  pollenForecastAdvice: boolean;
}

export interface HayfeverConsultationState {
  patient: HayfeverPatientDetails;
  consent: BaseConsent;
  assessment: HayfeverAssessment;
  medicalHistory: HayfeverMedicalHistory;
  contraindications: HayfeverContraindications;
  medicineSupply: HayfeverMedicineSupply;
  counselling: HayfeverCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type HayfeverAction =
  | { type: "UPDATE_PATIENT"; field: keyof HayfeverPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof HayfeverAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof HayfeverMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof HayfeverContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof HayfeverMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof HayfeverCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Symptom Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HayfeverConsultationState {
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
      symptomSeverity: "",
      affectedSystems: [],
      seasonalOrPerennial: "",
      previousOTCUse: "",
      symptomDuration: "",
    },
    medicalHistory: {
      asthmaOrLrti: false,
      severeHepaticImpairment: false,
      renalImpairment: false,
      recentNasalSurgery: false,
      phenylketonuria: false,
      otherConditions: "",
    },
    contraindications: {
      pregnant: false,
      breastfeeding: false,
      childUnder12: false,
      otherMedicines: "",
    },
    medicineSupply: {
      medicineSelected: "",
      fexofenadin180: false,
      fluticasonNasalSpray: false,
      montelukast10: false,
      dosageConfirmed: false,
    },
    counselling: {
      allergenAvoidance: false,
      nasalSprayTechnique: false,
      effectivenessTimeline: false,
      combinationRationale: false,
      wrapsunglasses: false,
      pollenForecastAdvice: false,
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

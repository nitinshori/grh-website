// ─── Postnatal Contraception POP ePGD Types ───

import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
  ClinicalAlert,
  DoseRecommendation,
  initialPatientDetails,
  initialConsent,
  initialSummary,
} from "../../shared/types";

// ─── Postnatal Contraception-Specific Types ───

export interface PostnatalAssessment {
  weeksPostpartum: number;
  deliveryType: string;
  breastfeedingStatus: string;
  vteRiskAssessment: string;
}

export interface PostnatalMedicalHistory {
  currentBreastCancer: boolean;
  severeLiverDisease: boolean;
  unexplainedVaginalBleeding: boolean;
  porphyria: boolean;
  pastBreastCancer: boolean;
  liverTumours: boolean;
  sleWithAntiphospholipidAntibodies: boolean;
}

export interface PostnatalMedicineSupply {
  medicine: string;
  doseStrength: string;
  quantity: number;
  startDate: string;
  administeredBy: string;
}

export interface PostnatalCounselling {
  timingAdvice: boolean;
  dailyTakingAdvice: boolean;
  breakThroughBleedingAdvice: boolean;
  breastfeedingCompatibilityAdvice: boolean;
  stiAdvice: boolean;
  emergencyContactAdvice: boolean;
  sideEffectsExplained: boolean;
  pillfreeIntervalAdvice: boolean;
}

export interface PostnatalContraceptionState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: PostnatalAssessment;
  medicalHistory: PostnatalMedicalHistory;
  medicineSupply: PostnatalMedicineSupply;
  counselling: PostnatalCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type PostnatalContraceptionAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof PostnatalAssessment; value: unknown }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof PostnatalMedicalHistory; value: unknown }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof PostnatalMedicineSupply; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof PostnatalCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Postnatal Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialPostnatalContraceptionState(): PostnatalContraceptionState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    assessment: {
      weeksPostpartum: 0,
      deliveryType: "",
      breastfeedingStatus: "",
      vteRiskAssessment: "",
    },
    medicalHistory: {
      currentBreastCancer: false,
      severeLiverDisease: false,
      unexplainedVaginalBleeding: false,
      porphyria: false,
      pastBreastCancer: false,
      liverTumours: false,
      sleWithAntiphospholipidAntibodies: false,
    },
    medicineSupply: {
      medicine: "Desogestrel 75mcg (Cerazette/generic)",
      doseStrength: "75mcg",
      quantity: 0,
      startDate: "",
      administeredBy: "",
    },
    counselling: {
      timingAdvice: false,
      dailyTakingAdvice: false,
      breakThroughBleedingAdvice: false,
      breastfeedingCompatibilityAdvice: false,
      stiAdvice: false,
      emergencyContactAdvice: false,
      sideEffectsExplained: false,
      pillfreeIntervalAdvice: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

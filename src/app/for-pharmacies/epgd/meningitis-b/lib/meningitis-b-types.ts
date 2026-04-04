// ─── Meningitis B ePGD Types ───

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

// ─── Meningitis B-Specific Types ───

export interface MeningitiBRiskAssessment {
  closeContactOfCase: boolean;
  complementDeficiency: boolean;
  asplenia: boolean;
  universityFresher: boolean;
  hyperendemicArea: boolean;
}

export interface MeningitiBMedicalHistory {
  severeFebrilIllness: boolean;
  recentVaccination: boolean;
  pregnancy: boolean;
  anaphylaxisHistory: boolean;
}

export interface MeningitiBVaccineAdmin {
  vaccinationDate1: string;
  injectionSite1: string;
  lotNumber1: string;
  vaccinationDate2: string;
  injectionSite2: string;
  lotNumber2: string;
  administeredBy: string;
}

export interface MeningitiBPostVaccine {
  injectionSiteReaction: boolean;
  feverObserved: boolean;
  headacheReported: boolean;
  myyalgiaReported: boolean;
  paracetamolAdvice: boolean;
  meningitisSignsAdvice: boolean;
  reviewScheduleAdvice: boolean;
}

export interface MeningitiBCounselling {
  doseScheduleAdvice: boolean;
  commonReactionsAdvice: boolean;
  injectionSiteAdvice: boolean;
  meningitisWarningSignsAdvice: boolean;
  sideEffectsExplained: boolean;
}

export interface MeningitiBConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  riskAssessment: MeningitiBRiskAssessment;
  medicalHistory: MeningitiBMedicalHistory;
  vaccineAdmin: MeningitiBVaccineAdmin;
  postVaccine: MeningitiBPostVaccine;
  counselling: MeningitiBCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type MeningitiBAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_RISK_ASSESSMENT"; field: keyof MeningitiBRiskAssessment; value: unknown }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof MeningitiBMedicalHistory; value: unknown }
  | { type: "UPDATE_VACCINE_ADMIN"; field: keyof MeningitiBVaccineAdmin; value: unknown }
  | { type: "UPDATE_POST_VACCINE"; field: keyof MeningitiBPostVaccine; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof MeningitiBCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Risk Assessment",
  "Medical History",
  "Contraindications",
  "Vaccine Admin",
  "Post-Vaccine",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialMeningitiBState(): MeningitiBConsultationState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    riskAssessment: {
      closeContactOfCase: false,
      complementDeficiency: false,
      asplenia: false,
      universityFresher: false,
      hyperendemicArea: false,
    },
    medicalHistory: {
      severeFebrilIllness: false,
      recentVaccination: false,
      pregnancy: false,
      anaphylaxisHistory: false,
    },
    vaccineAdmin: {
      vaccinationDate1: "",
      injectionSite1: "",
      lotNumber1: "",
      vaccinationDate2: "",
      injectionSite2: "",
      lotNumber2: "",
      administeredBy: "",
    },
    postVaccine: {
      injectionSiteReaction: false,
      feverObserved: false,
      headacheReported: false,
      myyalgiaReported: false,
      paracetamolAdvice: false,
      meningitisSignsAdvice: false,
      reviewScheduleAdvice: false,
    },
    counselling: {
      doseScheduleAdvice: false,
      commonReactionsAdvice: false,
      injectionSiteAdvice: false,
      meningitisWarningSignsAdvice: false,
      sideEffectsExplained: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

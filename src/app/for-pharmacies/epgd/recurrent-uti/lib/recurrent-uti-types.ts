// ─── Recurrent UTI Prevention ePGD Types ───

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

// ─── Recurrent UTI-Specific Types ───

export interface RecurrentUTIHistory {
  utiInPast12Months: number;
  utiInPast6Months: number;
  confirmedByRecords: boolean;
  symptoms: string;
}

export interface RecurrentUTIMedicalHistory {
  pregnancy: boolean;
  breastfeeding: boolean;
  renalImpairment: boolean;
  g6pdDeficiency: boolean;
  hepaticDisease: boolean;
}

export interface RecurrentUTIMedicineSelection {
  prophylaxisType: string;
  medicine: string;
  dose: string;
  frequency: string;
  duration: string;
  postCoitalOption: boolean;
}

export interface RecurrentUTICounselling {
  completeCourseAdvice: boolean;
  urineDipstickAdvice: boolean;
  hydrationAdvice: boolean;
  voidingHabitsAdvice: boolean;
  cranberryAdvice: boolean;
  reviewScheduleAdvice: boolean;
  sideEffectsExplained: boolean;
}

export interface RecurrentUTIConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  utiHistory: RecurrentUTIHistory;
  medicalHistory: RecurrentUTIMedicalHistory;
  medicines: RecurrentUTIMedicineSelection;
  counselling: RecurrentUTICounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type RecurrentUTIAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_UTI_HISTORY"; field: keyof RecurrentUTIHistory; value: unknown }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof RecurrentUTIMedicalHistory; value: unknown }
  | { type: "UPDATE_MEDICINES"; field: keyof RecurrentUTIMedicineSelection; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof RecurrentUTICounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "UTI History",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Selection",
  "Counselling & Supply",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialRecurrentUTIState(): RecurrentUTIConsultationState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    utiHistory: {
      utiInPast12Months: 0,
      utiInPast6Months: 0,
      confirmedByRecords: false,
      symptoms: "",
    },
    medicalHistory: {
      pregnancy: false,
      breastfeeding: false,
      renalImpairment: false,
      g6pdDeficiency: false,
      hepaticDisease: false,
    },
    medicines: {
      prophylaxisType: "",
      medicine: "",
      dose: "",
      frequency: "",
      duration: "",
      postCoitalOption: false,
    },
    counselling: {
      completeCourseAdvice: false,
      urineDipstickAdvice: false,
      hydrationAdvice: false,
      voidingHabitsAdvice: false,
      cranberryAdvice: false,
      reviewScheduleAdvice: false,
      sideEffectsExplained: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

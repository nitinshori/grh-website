// ─── Chickenpox/Varicella ePGD Types ───

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

// ─── Chickenpox-Specific Types ───

export interface ChickenpoxEligibility {
  noPriorVaricella: boolean;
  seronegative: boolean;
  healthcareWorker: boolean;
  closeContactImmunosuppressed: boolean;
}

export interface ChickenpoxMedicalHistory {
  pregnancy: boolean;
  immunosuppressed: boolean;
  severeFebrilIllness: boolean;
  anaphylaxisNeomycin: boolean;
  anaphylaxisGelatin: boolean;
  activeTB: boolean;
}

export interface ChickenpoxVaccineAdmin {
  vaccine: string;
  dose1Date: string;
  dose1Site: string;
  dose1Lot: string;
  dose2Scheduled: string;
  administeredBy: string;
}

export interface ChickenpoxPostVaccine {
  reactionsObserved: boolean;
  rashDeveloped: boolean;
  rashOnset: string;
  contactWithImmunosuppressed: boolean;
  salicylatesAvoided: boolean;
  pregnancyAdviceGiven: boolean;
}

export interface ChickenpoxCounselling {
  doseScheduleAdvice: boolean;
  pregnancyAvoidanceAdvice: boolean;
  mildRashAdvice: boolean;
  immunosuppressedContactAdvice: boolean;
  salicylatesAvoidanceAdvice: boolean;
  sideEffectsExplained: boolean;
  reviewScheduleAdvice: boolean;
}

export interface ChickenpoxConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  eligibility: ChickenpoxEligibility;
  medicalHistory: ChickenpoxMedicalHistory;
  vaccineAdmin: ChickenpoxVaccineAdmin;
  postVaccine: ChickenpoxPostVaccine;
  counselling: ChickenpoxCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type ChickenpoxAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ELIGIBILITY"; field: keyof ChickenpoxEligibility; value: unknown }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof ChickenpoxMedicalHistory; value: unknown }
  | { type: "UPDATE_VACCINE_ADMIN"; field: keyof ChickenpoxVaccineAdmin; value: unknown }
  | { type: "UPDATE_POST_VACCINE"; field: keyof ChickenpoxPostVaccine; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof ChickenpoxCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Eligibility",
  "Medical History",
  "Contraindications",
  "Vaccine Admin",
  "Post-Vaccine",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialChickenpoxState(): ChickenpoxConsultationState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    eligibility: {
      noPriorVaricella: false,
      seronegative: false,
      healthcareWorker: false,
      closeContactImmunosuppressed: false,
    },
    medicalHistory: {
      pregnancy: false,
      immunosuppressed: false,
      severeFebrilIllness: false,
      anaphylaxisNeomycin: false,
      anaphylaxisGelatin: false,
      activeTB: false,
    },
    vaccineAdmin: {
      vaccine: "",
      dose1Date: "",
      dose1Site: "",
      dose1Lot: "",
      dose2Scheduled: "",
      administeredBy: "",
    },
    postVaccine: {
      reactionsObserved: false,
      rashDeveloped: false,
      rashOnset: "",
      contactWithImmunosuppressed: false,
      salicylatesAvoided: false,
      pregnancyAdviceGiven: false,
    },
    counselling: {
      doseScheduleAdvice: false,
      pregnancyAvoidanceAdvice: false,
      mildRashAdvice: false,
      immunosuppressedContactAdvice: false,
      salicylatesAvoidanceAdvice: false,
      sideEffectsExplained: false,
      reviewScheduleAdvice: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

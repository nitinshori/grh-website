// ─── MMR Top-up ePGD Types ───

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

// ─── MMR-Specific Types ───

export interface MMREligibility {
  bornAfter1970: boolean;
  noPriorTwoDoses: boolean;
  healthcareWorker: boolean;
  travelToEndemicArea: boolean;
}

export interface MMRMedicalHistory {
  pregnancy: boolean;
  immunosuppressed: boolean;
  anaphylaxisNeomycin: boolean;
  anaphylaxisGelatin: boolean;
  anaphylaxisEgg: boolean;
  severeFebrilIllness: boolean;
  recentBloodProducts: boolean;
}

export interface MMRVaccineAdmin {
  vaccine: string;
  vaccinationDate: string;
  injectionSite: string;
  lotNumber: string;
  administeredBy: string;
}

export interface MMRPostVaccine {
  reactionsObserved: boolean;
  feverDeveloped: boolean;
  feverOnset: string;
  rashObserved: boolean;
  jointPainReported: boolean;
  pregnancyAdviceGiven: boolean;
}

export interface MMRCounselling {
  commonReactionsAdvice: boolean;
  pregnancyAvoidanceAdvice: boolean;
  jointPainAdvice: boolean;
  autismMythDebunked: boolean;
  sideEffectsExplained: boolean;
  reviewScheduleAdvice: boolean;
}

export interface MMRConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  eligibility: MMREligibility;
  medicalHistory: MMRMedicalHistory;
  vaccineAdmin: MMRVaccineAdmin;
  postVaccine: MMRPostVaccine;
  counselling: MMRCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type MMRAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ELIGIBILITY"; field: keyof MMREligibility; value: unknown }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof MMRMedicalHistory; value: unknown }
  | { type: "UPDATE_VACCINE_ADMIN"; field: keyof MMRVaccineAdmin; value: unknown }
  | { type: "UPDATE_POST_VACCINE"; field: keyof MMRPostVaccine; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof MMRCounselling; value: unknown }
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

export function createInitialMMRState(): MMRConsultationState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    eligibility: {
      bornAfter1970: false,
      noPriorTwoDoses: false,
      healthcareWorker: false,
      travelToEndemicArea: false,
    },
    medicalHistory: {
      pregnancy: false,
      immunosuppressed: false,
      anaphylaxisNeomycin: false,
      anaphylaxisGelatin: false,
      anaphylaxisEgg: false,
      severeFebrilIllness: false,
      recentBloodProducts: false,
    },
    vaccineAdmin: {
      vaccine: "",
      vaccinationDate: "",
      injectionSite: "",
      lotNumber: "",
      administeredBy: "",
    },
    postVaccine: {
      reactionsObserved: false,
      feverDeveloped: false,
      feverOnset: "",
      rashObserved: false,
      jointPainReported: false,
      pregnancyAdviceGiven: false,
    },
    counselling: {
      commonReactionsAdvice: false,
      pregnancyAvoidanceAdvice: false,
      jointPainAdvice: false,
      autismMythDebunked: false,
      sideEffectsExplained: false,
      reviewScheduleAdvice: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

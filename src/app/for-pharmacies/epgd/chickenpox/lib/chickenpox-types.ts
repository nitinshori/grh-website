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
  /** Inclusion: no history of chickenpox infection. */
  noPriorVaricella: boolean;
  seronegative: boolean;
  healthcareWorker: boolean;
  closeContactImmunosuppressed: boolean;
  /** Exclusion: history of chickenpox infection. */
  historyOfChickenpox: boolean;
  /** Exclusion: completed two-dose varicella course. */
  completedTwoDoseCourse: boolean;
  /** Dose 1 already given (here or elsewhere): attending for dose 2. Record the date and brand of dose 1. */
  dose1GivenElsewhere: boolean;
  /** Where dose 1 was given. */
  dose1Where: "this-pharmacy" | "elsewhere" | "";
  dose1ElsewhereDate: string;
  dose1ElsewhereBrand: string;
}

export interface ChickenpoxMedicalHistory {
  pregnancy: boolean;
  immunosuppressed: boolean;
  severeFebrilIllness: boolean;
  /** Hypersensitivity to neomycin, gelatin or any component of the vaccine (exclusion). */
  anaphylaxisNeomycin: boolean;
  anaphylaxisGelatin: boolean;
  hypersensitivityComponent: boolean;
  activeTB: boolean;
  /** MMR or another live vaccine within the previous 4 weeks, unless given on the same day (exclusion). */
  liveVaccineWithin4Weeks: boolean;
  /** Immunoglobulin or blood products in the previous 3 months (caution: vaccinate now, consider a further dose after 3 months, record the reason). */
  bloodProductsWithin3Months: boolean;
  bloodProductsReason: string;
  /** Under 16 only: who gave consent (PGD consent in children block). */
  consentBasis: "parental" | "gillick" | "";
  consentGiverDetails: string;
}

export interface ChickenpoxVaccineAdmin {
  vaccine: string;
  /** Which dose of the two-dose course this administration is. */
  doseNumber: "1st" | "2nd" | "";
  route: "subcutaneous" | "intramuscular" | "";
  dose1Date: string;
  dose1Site: string;
  dose1Lot: string;
  expiryDate: string;
  dose2Scheduled: string;
  /** Varilrix dose 2 given between 4 and 6 weeks after dose 1: the reason (PGD caution). */
  intervalReason: string;
  administeredBy: string;
}

export interface ChickenpoxPostVaccine {
  reactionsObserved: boolean;
  rashDeveloped: boolean;
  rashOnset: string;
  contactWithImmunosuppressed: boolean;
  salicylatesAvoided: boolean;
  pregnancyAdviceGiven: boolean;
  /** Observe every patient for 15 minutes, seated, and record that it was completed. */
  observationCompleted: boolean;
  leafletGiven: boolean;
  followUpAdviceGiven: boolean;
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

/** PGD strapline shown wherever the tool cites its authority. */
export const CHICKENPOX_PGD_VERSION =
  "Varivax and Varilrix Chickenpox Vaccination PGD v004, issued 11 September 2026";

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
      historyOfChickenpox: false,
      completedTwoDoseCourse: false,
      dose1GivenElsewhere: false,
      dose1Where: "",
      dose1ElsewhereDate: "",
      dose1ElsewhereBrand: "",
    },
    medicalHistory: {
      pregnancy: false,
      immunosuppressed: false,
      severeFebrilIllness: false,
      anaphylaxisNeomycin: false,
      anaphylaxisGelatin: false,
      hypersensitivityComponent: false,
      activeTB: false,
      liveVaccineWithin4Weeks: false,
      bloodProductsWithin3Months: false,
      bloodProductsReason: "",
      consentBasis: "",
      consentGiverDetails: "",
    },
    vaccineAdmin: {
      vaccine: "",
      doseNumber: "",
      route: "",
      dose1Date: "",
      dose1Site: "",
      dose1Lot: "",
      expiryDate: "",
      dose2Scheduled: "",
      intervalReason: "",
      administeredBy: "",
    },
    postVaccine: {
      reactionsObserved: false,
      rashDeveloped: false,
      rashOnset: "",
      contactWithImmunosuppressed: false,
      salicylatesAvoided: false,
      pregnancyAdviceGiven: false,
      observationCompleted: false,
      leafletGiven: false,
      followUpAdviceGiven: false,
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

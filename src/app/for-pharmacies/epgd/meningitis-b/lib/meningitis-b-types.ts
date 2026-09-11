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

/**
 * Indication and exclusion questions. PGD v006: the indications are missed
 * routine doses or presenting outside the NHS programme, an adolescent or
 * student seeking protection, or an adult at increased risk. A case, contact
 * or outbreak is managed by the Health Protection Team and is an exclusion;
 * a travel request is an exclusion (MenB is not recommended for travel).
 */
export interface MeningitiBRiskAssessment {
  /** Exclusion: management of a case, contact or outbreak (Health Protection Team). */
  closeContactOfCase: boolean;
  complementDeficiency: boolean;
  asplenia: boolean;
  /** Treatment with a complement inhibitor such as eculizumab, or due to start one. */
  complementInhibitor: boolean;
  /** Adolescent or student seeking protection. */
  universityFresher: boolean;
  /** Exclusion: a request for MenB vaccination for travel purposes. */
  hyperendemicArea: boolean;
  /** Routine doses missed, or presenting outside the NHS programme. */
  missedRoutineDoses: boolean;
  /** Laboratory staff handling Neisseria meningitidis (4CMenB two doses, 5 yearly boosters). */
  laboratoryStaff: boolean;
  /** Free-text indication for an adult at increased risk not covered above. */
  otherIndication: string;
}

export interface MeningitiBMedicalHistory {
  severeFebrilIllness: boolean;
  recentVaccination: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  anaphylaxisHistory: boolean;
  immunosuppressed: boolean;
  /** A previous systemic or local reaction to a meningococcal vaccine: not a bar to further doses. */
  previousReaction: boolean;
  /** Under 16 only: who gave consent (PGD inclusion criterion). */
  consentBasis: "parental" | "gillick" | "";
  consentGiverDetails: string;
  /** Under 16: a person with parental responsibility, or a suitable adult authorised by them, is present. */
  parentPresent: boolean;
}

export interface MeningitiBVaccineAdmin {
  product: "bexsero" | "trumenba" | "";
  /** Which dose in the course this administration represents.
   *  booster-12-months: the Bexsero infant course booster (two doses in the first year), given from 12 months and before the second birthday.
   *  booster-after-toddler-course: the Bexsero booster 12 to 23 months after a primary course whose second dose was given at 12 to 23 months of age (SmPC Table 1; decision 9, 11 September 2026). */
  doseNumber: "1st" | "2nd" | "3rd" | "booster-12-months" | "booster-after-toddler-course" | "";
  /** Trumenba only: routine 2 dose (0 and 6 months) or increased risk 3 dose (0, 1 to 2 and 6 months). */
  trumenbaSchedule: "routine" | "increased-risk" | "";
  /** Date of the previous dose in this course. Required for every dose other than the first. */
  previousDoseDate: string;
  /** Bexsero, 12 months to under 2 years: how many doses were given in the first year. Drives the SmPC schedule for that band (decision 9): none, 2 doses at least 2 months apart then a booster 12 to 23 months after the second; one, one further dose at least 2 months after it then the same booster; two, a single booster. */
  dosesInFirstYear: "0" | "1" | "2" | "";
  /** Date of this dose. */
  vaccinationDate1: string;
  /** Site of this dose. */
  injectionSite1: string;
  /** Batch number of this dose. */
  lotNumber1: string;
  expiryDate: string;
  /** Date the next dose in the course is due (booked at this appointment). */
  vaccinationDate2: string;
  injectionSite2: string;
  lotNumber2: string;
  /** Course complete with this dose: no further dose due. */
  courseComplete: boolean;
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
  /** Observe every patient for 15 minutes, seated, and record that it was completed. */
  observationCompleted: boolean;
  /** PIL and written record (product, date, next dose due) given. */
  writtenRecordGiven: boolean;
  yellowCardAdvice: boolean;
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

/** PGD strapline shown wherever the tool cites its authority. */
export const MENB_PGD_VERSION =
  "Meningococcal group B vaccine (Bexsero and Trumenba) PGD v006, issued 11 September 2026";

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
      complementInhibitor: false,
      universityFresher: false,
      hyperendemicArea: false,
      missedRoutineDoses: false,
      laboratoryStaff: false,
      otherIndication: "",
    },
    medicalHistory: {
      severeFebrilIllness: false,
      recentVaccination: false,
      pregnancy: false,
      breastfeeding: false,
      anaphylaxisHistory: false,
      immunosuppressed: false,
      previousReaction: false,
      consentBasis: "",
      consentGiverDetails: "",
      parentPresent: false,
    },
    vaccineAdmin: {
      product: "",
      doseNumber: "",
      trumenbaSchedule: "",
      previousDoseDate: "",
      dosesInFirstYear: "",
      vaccinationDate1: "",
      injectionSite1: "",
      lotNumber1: "",
      expiryDate: "",
      vaccinationDate2: "",
      injectionSite2: "",
      lotNumber2: "",
      courseComplete: false,
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
      observationCompleted: false,
      writtenRecordGiven: false,
      yellowCardAdvice: false,
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

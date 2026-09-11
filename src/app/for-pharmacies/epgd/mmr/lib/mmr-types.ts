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
  /**
   * Number of documented MMR doses already received (0, 1, or 2 or more).
   * The inclusion criterion is "without two documented doses": 2 or more is
   * a stop, and the dose number for this administration follows from it.
   */
  documentedDoses: "" | "0" | "1" | "2";
  bornAfter1970: boolean;
  noPriorTwoDoses: boolean;
  healthcareWorker: boolean;
  travelToEndemicArea: boolean;
  /** PGD v005: "or where protection is otherwise required" (students, outbreak contacts). */
  protectionOtherwiseRequired: boolean;
  /** PGD v005 inclusion: NHS-eligible children must be told the vaccine is free from their GP before any private supply; record that this was done. */
  nhsFreeOfferTold: boolean;
}

/** PGD v005 consent block: under 16, record who consented and on what basis. */
export interface MMRConsentBasis {
  basis: "" | "parental" | "gillick";
  parentName: string;
  parentRelationship: string;
  gillickBasis: string;
}

export interface MMRMedicalHistory {
  pregnancy: boolean;
  immunosuppressed: boolean;
  anaphylaxisNeomycin: boolean;
  anaphylaxisGelatin: boolean;
  anaphylaxisEgg: boolean;
  /** Known hypersensitivity to any other component of the vaccine (PGD v005 exclusion). */
  hypersensitivityOtherComponent: boolean;
  /** Anaphylaxis to a previous measles, mumps or rubella containing vaccine (PGD v005 exclusion). */
  anaphylaxisPreviousMMR: boolean;
  /** Blood dyscrasias, leukaemia, lymphoma or other malignant neoplasm of the haematopoietic or lymphatic system (PGD v005 exclusion). */
  haematologicalMalignancy: boolean;
  /** Family history of congenital or hereditary immunodeficiency, immune competence not demonstrated (PGD v005 exclusion). */
  familyImmunodeficiency: boolean;
  /** Active untreated tuberculosis (PGD v005 exclusion). */
  activeUntreatedTB: boolean;
  /** Yellow fever or varicella vaccine within the previous 4 weeks (PGD v005 exclusion: defer). */
  liveVaccineLast4Weeks: boolean;
  severeFebrilIllness: boolean;
  recentBloodProducts: boolean;
  /** PGD v005 caution: record which applied when blood products or immunoglobulin were given in the previous 3 months. */
  bloodProductsAction: "" | "deferred" | "given-repeat-3-months";
  /** PGD v005 caution: children with a history of thrombocytopenia or febrile seizures. */
  thrombocytopeniaOrFebrileSeizures: boolean;
}

export interface MMRVaccineAdmin {
  vaccine: string;
  vaccinationDate: string;
  injectionSite: string;
  lotNumber: string;
  /** Expiry date of the batch (PGD records row). */
  expiryDate: string;
  /** Route actually used. The PGD authorises subcutaneous only. */
  route: "" | "subcutaneous" | "intramuscular";
  administeredBy: string;
  /** Dose number (1 or 2), PGD v005 records row. */
  doseNumber: "" | "1" | "2";
  /** Date of the previous MMR dose, used to check the 4 week (3 month under 18 months) interval. */
  previousDoseDate: string;
  /** Date the next dose is due, PGD v005 records row. */
  nextDoseDue: string;
}

export interface MMRPostVaccine {
  reactionsObserved: boolean;
  /** What was observed and the action taken, where an immediate reaction is ticked. */
  reactionDetails: string;
  feverDeveloped: boolean;
  feverOnset: string;
  rashObserved: boolean;
  jointPainReported: boolean;
  pregnancyAdviceGiven: boolean;
  /** Observe every patient for 15 minutes, seated, and record that it was completed (PGD caution). */
  observationCompleted: boolean;
}

export interface MMRCounselling {
  commonReactionsAdvice: boolean;
  pregnancyAvoidanceAdvice: boolean;
  jointPainAdvice: boolean;
  autismMythDebunked: boolean;
  sideEffectsExplained: boolean;
  reviewScheduleAdvice: boolean;
  /** Patient information leaflet supplied (PGD v005 patient information row). */
  pilSupplied: boolean;
}

export interface MMRConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  consentBasis: MMRConsentBasis;
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
  | { type: "UPDATE_CONSENT_BASIS"; field: keyof MMRConsentBasis; value: unknown }
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
    consentBasis: {
      basis: "",
      parentName: "",
      parentRelationship: "",
      gillickBasis: "",
    },
    eligibility: {
      documentedDoses: "",
      bornAfter1970: false,
      noPriorTwoDoses: false,
      healthcareWorker: false,
      travelToEndemicArea: false,
      protectionOtherwiseRequired: false,
      nhsFreeOfferTold: false,
    },
    medicalHistory: {
      pregnancy: false,
      immunosuppressed: false,
      anaphylaxisNeomycin: false,
      anaphylaxisGelatin: false,
      anaphylaxisEgg: false,
      hypersensitivityOtherComponent: false,
      anaphylaxisPreviousMMR: false,
      haematologicalMalignancy: false,
      familyImmunodeficiency: false,
      activeUntreatedTB: false,
      liveVaccineLast4Weeks: false,
      severeFebrilIllness: false,
      recentBloodProducts: false,
      bloodProductsAction: "",
      thrombocytopeniaOrFebrileSeizures: false,
    },
    vaccineAdmin: {
      vaccine: "",
      vaccinationDate: "",
      injectionSite: "",
      lotNumber: "",
      expiryDate: "",
      route: "",
      administeredBy: "",
      doseNumber: "",
      previousDoseDate: "",
      nextDoseDue: "",
    },
    postVaccine: {
      reactionsObserved: false,
      reactionDetails: "",
      feverDeveloped: false,
      feverOnset: "",
      rashObserved: false,
      jointPainReported: false,
      pregnancyAdviceGiven: false,
      observationCompleted: false,
    },
    counselling: {
      commonReactionsAdvice: false,
      pregnancyAvoidanceAdvice: false,
      jointPainAdvice: false,
      autismMythDebunked: false,
      sideEffectsExplained: false,
      reviewScheduleAdvice: false,
      pilSupplied: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

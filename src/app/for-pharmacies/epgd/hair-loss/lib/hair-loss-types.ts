// ─── Hair Loss (Finasteride) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary, DoseRecommendation, ClinicalAlert } from "../../shared/types";

// ─── Extended types for Hair Loss PGD ───

/** Recorded sex: unanswered until the pharmacist answers. The gender stop is
 *  raised only on an explicit "not male" answer, not on an empty form. */
export type HLSexRecorded = "" | "male" | "not-male";

export interface HLPatientDetails extends BasePatientDetails {
  sexRecorded: HLSexRecorded;
  /** Derived from sexRecorded === "male"; kept for the dose and report logic. */
  maleConfirmed: boolean;
}

export interface HLClinicalAssessment {
  norwoodHamiltonScale: number | null; // 1-7
  hasAndrogeneticAlopecia: boolean;
  alopeciaOnset: string;
  familyHistory: boolean;
}

export interface HLMedicalHistory {
  liverDisease: boolean;
  prostateCancer: boolean;
  prostateCancerDetail: string;
  psaAbnormalities: boolean;
  psaAbnormaltiesDetail: string;
  hypersensitivity: boolean;
  /** Current use of 5-alpha-reductase inhibitors for other conditions (exclusion). */
  current5ARI: boolean;
  /** Rare hereditary galactose intolerance, Lapp lactase deficiency or
   *  glucose-galactose malabsorption: should not take this medicine. */
  galactoseIntolerance: boolean;
  otherConditions: string;
  /** Attestation that every exclusion question on this step was put to the patient. */
  questionsAsked: boolean;
}

export interface HLContraindications {
  depressiveMood: boolean;
  depressiveMoodDetail: string;
  /** Documented reason for proceeding despite current depression or mood symptoms. */
  moodProceedReason: string;
  /** Pharmacist has decided not to supply because of the mood symptoms and
   *  is referring instead: a stop, so the referral can be saved as not supplied. */
  moodReferred: boolean;
  /** Current suicidal ideation: stop and refer. */
  suicidalIdeation: boolean;
  /** Attestation that the mood questions were put to the patient. */
  questionsAsked: boolean;
}

export interface HLMedicineSupply {
  finasteride1mgOd: boolean;
  /** Months of treatment supplied between reviews: "3" | "6" | "9" | "12". */
  quantityMonths: string;
  /** Number of tablets actually handed over (for example 84 or 90 for 3 months). */
  tabletsSupplied: number | null;
  /** Brand dispensed (the PGD record requires name and brand). */
  brand: string;
  partnerNotified: boolean; // critical caution: teratogenic
  /** Condom recommended if a female partner is pregnant or likely to become pregnant. */
  condomAdvice: boolean;
  willMonitorSE: boolean; // sexual side effects
  understandsPSAEffect: boolean;
}

export interface HLCounselling {
  effectOnsetTime: boolean;
  hairLossResumesStopped: boolean;
  sexualSideEffects: boolean;
  moodChanges: boolean;
  annualReview: boolean;
  reportChanges: boolean;
  /** Promptly report breast lumps, pain, gynaecomastia or nipple discharge. */
  breastChanges: boolean;
  /** Realistic expectations: slows loss, partial regrowth, never complete reversal; benefit less above 41; do not exceed dose; scalp protection; psychosocial effects. */
  expectations: boolean;
  /** PIL and the patient card in the pack supplied. */
  pilAndCardSupplied: boolean;
}

export interface HLConsultationState {
  patient: HLPatientDetails;
  consent: BaseConsent;
  clinicalAssessment: HLClinicalAssessment;
  medicalHistory: HLMedicalHistory;
  contraindications: HLContraindications;
  medicineSupply: HLMedicineSupply;
  counselling: HLCounselling;
  summary: HLSummary;
  currentStep: number;
}

export interface HLSummary extends BaseSummary {
  /** Advice given and referral made when the patient is excluded. */
  exclusionAdvice: string;
}

export type HLAction =
  | { type: "UPDATE_PATIENT"; field: keyof HLPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof HLClinicalAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof HLMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof HLContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof HLMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof HLCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof HLSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): HLConsultationState {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
      gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
      sexRecorded: "",
      maleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    clinicalAssessment: {
      norwoodHamiltonScale: null,
      hasAndrogeneticAlopecia: false,
      alopeciaOnset: "",
      familyHistory: false,
    },
    medicalHistory: {
      liverDisease: false,
      prostateCancer: false,
      prostateCancerDetail: "",
      psaAbnormalities: false,
      psaAbnormaltiesDetail: "",
      hypersensitivity: false,
      current5ARI: false,
      galactoseIntolerance: false,
      otherConditions: "",
      questionsAsked: false,
    },
    contraindications: {
      depressiveMood: false,
      depressiveMoodDetail: "",
      moodProceedReason: "",
      moodReferred: false,
      suicidalIdeation: false,
      questionsAsked: false,
    },
    medicineSupply: {
      finasteride1mgOd: false,
      quantityMonths: "",
      tabletsSupplied: null,
      brand: "",
      partnerNotified: false,
      condomAdvice: false,
      willMonitorSE: false,
      understandsPSAEffect: false,
    },
    counselling: {
      effectOnsetTime: false,
      hairLossResumesStopped: false,
      sexualSideEffects: false,
      moodChanges: false,
      annualReview: false,
      reportChanges: false,
      breastChanges: false,
      expectations: false,
      pilAndCardSupplied: false,
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
      exclusionAdvice: "",
    },
    currentStep: 0,
  };
}

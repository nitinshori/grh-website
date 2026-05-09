// ─── Premature Ejaculation (Dapoxetine) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary, DoseRecommendation, ClinicalAlert } from "../../shared/types";

// ─── Extended types for PE PGD ───

export interface PEPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

export interface PEClinicalAssessment {
  peType: "lifelong" | "acquired" | ""; // lifelong vs acquired
  ieltMinutes: number | null; // Intravaginal Ejaculation Latency Time
  relationshipDistress: boolean;
  psychologicalDistress: boolean;
}

export interface PEMedicalHistory {
  cardiacDisorder: boolean; // NYHA II-IV, significant valvular disease
  cardiacDisorderDetail: string;
  syncope: boolean;
  severeHepaticImpairment: boolean;
  uncontrolledEpilepsy: boolean;
  otherConditions: string;
}

export interface PECurrentMedications {
  maoisOrSsrisOrSnris: boolean; // Major contraindication
  thioridazine: boolean;
  otherMedications: string;
}

export interface PEContraindications {
  hadSevereOrSuddenAE: boolean; // Adverse events
  aeDetail: string;
}

export interface PEMedicineSupply {
  dapoxetine30mgSupplied: boolean;
  mayIncreaseTo60mg: boolean;
  understandsUsage: boolean; // 1-3 hours before, max once per 24h, take with water
  understandsOrthostatic: boolean; // Lying/standing BP done
}

export interface PECounselling {
  takeWithWater: boolean;
  avoidAlcohol: boolean;
  noDrive2hrs: boolean;
  avoidGrapefruit: boolean;
  mayHaveSideEffects: boolean;
  notForDaily: boolean;
  review4weeks: boolean;
}

export interface PEConsultationState {
  patient: PEPatientDetails;
  consent: BaseConsent;
  clinicalAssessment: PEClinicalAssessment;
  medicalHistory: PEMedicalHistory;
  currentMedications: PECurrentMedications;
  contraindications: PEContraindications;
  medicineSupply: PEMedicineSupply;
  counselling: PECounselling;
  summary: BaseSummary & { lyingBP: string; standingBP: string };
  currentStep: number;
}

export type PEAction =
  | { type: "UPDATE_PATIENT"; field: keyof PEPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof PEClinicalAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof PEMedicalHistory; value: any }
  | { type: "UPDATE_CURRENT_MEDICATIONS"; field: keyof PECurrentMedications; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof PEContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof PEMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof PECounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): PEConsultationState {
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
      maleConfirmed: false,
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    clinicalAssessment: {
      peType: "",
      ieltMinutes: null,
      relationshipDistress: false,
      psychologicalDistress: false,
    },
    medicalHistory: {
      cardiacDisorder: false,
      cardiacDisorderDetail: "",
      syncope: false,
      severeHepaticImpairment: false,
      uncontrolledEpilepsy: false,
      otherConditions: "",
    },
    currentMedications: {
      maoisOrSsrisOrSnris: false,
      thioridazine: false,
      otherMedications: "",
    },
    contraindications: {
      hadSevereOrSuddenAE: false,
      aeDetail: "",
    },
    medicineSupply: {
      dapoxetine30mgSupplied: false,
      mayIncreaseTo60mg: false,
      understandsUsage: false,
      understandsOrthostatic: false,
    },
    counselling: {
      takeWithWater: false,
      avoidAlcohol: false,
      noDrive2hrs: false,
      avoidGrapefruit: false,
      mayHaveSideEffects: false,
      notForDaily: false,
      review4weeks: false,
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
      lyingBP: "",
      standingBP: "",
    },
    currentStep: 0,
  };
}

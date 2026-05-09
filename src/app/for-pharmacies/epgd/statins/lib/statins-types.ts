// ─── Statin Continuation ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface StatinsPatientDetails extends BasePatientDetails {}

export interface StatinsAssessment {
  hasExistingPrescription: boolean;
  lastLipidProfileMonths: number | null;
  totalCholesterol: number | null;
  ldl: number | null;
  hdl: number | null;
  triglycerides: number | null;
  currentStatin: string;
  currentDose: string;
}

export interface StatinsMedicalHistory {
  activeLiverDisease: boolean;
  elevatedTransaminases: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  ckrenal: boolean;
  elderly80Plus: boolean;
  hypothyroidism: boolean;
  highAlcoholIntake: boolean;
  otherConditions: string;
}

export interface StatinsRedFlags {
  unexplainedMusclePain: boolean;
  myopathy: boolean;
  newDiabetesSymptoms: boolean;
  yellowing: boolean;
}

export interface StatinsMedicineSupply {
  atorvastatin: boolean;
  doseSelected: string;
  dosageConfirmed: boolean;
  concomitantFusidic: boolean;
}

export interface StatinsCounselling {
  takeAtNightOrAnytime: boolean;
  reportMusclePain: boolean;
  annualBloodTest: boolean;
  lifestyleMeasures: boolean;
}

export interface StatinsConsultationState {
  patient: StatinsPatientDetails;
  consent: BaseConsent;
  assessment: StatinsAssessment;
  medicalHistory: StatinsMedicalHistory;
  redFlags: StatinsRedFlags;
  medicineSupply: StatinsMedicineSupply;
  counselling: StatinsCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type StatinsAction =
  | { type: "UPDATE_PATIENT"; field: keyof StatinsPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof StatinsAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof StatinsMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof StatinsRedFlags; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof StatinsMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof StatinsCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Lipid Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): StatinsConsultationState {
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
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      hasExistingPrescription: false,
      lastLipidProfileMonths: null,
      totalCholesterol: null,
      ldl: null,
      hdl: null,
      triglycerides: null,
      currentStatin: "",
      currentDose: "",
    },
    medicalHistory: {
      activeLiverDisease: false,
      elevatedTransaminases: false,
      pregnant: false,
      breastfeeding: false,
      ckrenal: false,
      elderly80Plus: false,
      hypothyroidism: false,
      highAlcoholIntake: false,
      otherConditions: "",
    },
    redFlags: {
      unexplainedMusclePain: false,
      myopathy: false,
      newDiabetesSymptoms: false,
      yellowing: false,
    },
    medicineSupply: {
      atorvastatin: false,
      doseSelected: "",
      dosageConfirmed: false,
      concomitantFusidic: false,
    },
    counselling: {
      takeAtNightOrAnytime: false,
      reportMusclePain: false,
      annualBloodTest: false,
      lifestyleMeasures: false,
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
    },
    currentStep: 0,
  };
}

// ─── COPD Symptom Management ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface COPDPatientDetails extends BasePatientDetails {
  maleConfirmed: boolean;
}

export interface COPDAssessment {
  hasExistingDiagnosis: boolean;
  mrcBreathlessnessScale: number | null; // 1-5
  exacerbationFrequency: string; // "none" | "1-2" | "3-4" | "frequent"
  currentInhalerRegimen: string;
}

export interface COPDMedicalHistory {
  copdDocumented: boolean;
  smokingStatus: string; // "current" | "former" | "never"
  otherRespiratoryConditions: string;
  otherConditions: string;
}

export interface COPDRedFlags {
  mrcGrade5: boolean;
  suspectedExacerbation: boolean;
  newHaemoptysis: boolean;
  weightLoss: boolean;
  recurrentInfections: boolean;
}

export interface COPDMedicineSupply {
  medicinePrescribed: boolean; // Salbutamol or Ipratropium
  medicineType: string;
  dosageConfirmed: boolean;
  notReplacementForMaintenance: boolean;
}

export interface COPDCounselling {
  notReplacementForMaintenance: boolean;
  gpReviewAdvised: boolean;
  inhalerTechniqueShown: boolean;
  smokingCessationAdvised: boolean;
  symptomMgmtExplained: boolean;
}

export interface COPDConsultationState {
  patient: COPDPatientDetails;
  consent: BaseConsent;
  assessment: COPDAssessment;
  medicalHistory: COPDMedicalHistory;
  redFlags: COPDRedFlags;
  medicineSupply: COPDMedicineSupply;
  counselling: COPDCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type COPDAction =
  | { type: "UPDATE_PATIENT"; field: keyof COPDPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof COPDAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof COPDMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof COPDRedFlags; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof COPDMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof COPDCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "COPD Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): COPDConsultationState {
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
    assessment: {
      hasExistingDiagnosis: false,
      mrcBreathlessnessScale: null,
      exacerbationFrequency: "",
      currentInhalerRegimen: "",
    },
    medicalHistory: {
      copdDocumented: false,
      smokingStatus: "",
      otherRespiratoryConditions: "",
      otherConditions: "",
    },
    redFlags: {
      mrcGrade5: false,
      suspectedExacerbation: false,
      newHaemoptysis: false,
      weightLoss: false,
      recurrentInfections: false,
    },
    medicineSupply: {
      medicinePrescribed: false,
      medicineType: "",
      dosageConfirmed: false,
      notReplacementForMaintenance: false,
    },
    counselling: {
      notReplacementForMaintenance: false,
      gpReviewAdvised: false,
      inhalerTechniqueShown: false,
      smokingCessationAdvised: false,
      symptomMgmtExplained: false,
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

// ─── Hypertension Monitoring + Amlodipine ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface HypertensionPatientDetails extends BasePatientDetails {}

export interface HypertensionAssessment {
  hasExistingDiagnosis: boolean;
  stableOnTreatmentMonths: number | null;
  clinicSystolic: number | null;
  clinicDiastolic: number | null;
  homeSystolic: number | null;
  homeDiastolic: number | null;
  currentAmlodipineDose: string;
}

export interface HypertensionMedicalHistory {
  bpDocumented: boolean;
  heartFailure: boolean;
  severeAorticStenosis: boolean;
  otherConditions: string;
}

export interface HypertensionRedFlags {
  uncontrolledBP: boolean;
  newChestPain: boolean;
  severeHeadache: boolean;
  visualChanges: boolean;
  bpGreater180110: boolean;
}

export interface HypertensionMonitoring {
  homeMonitoringDone: boolean;
  regularity: string;
  bpReadingsAccurate: boolean;
}

export interface HypertensionMedicineSupply {
  amlodipineDoseSelected: string; // "5" | "10"
  dosageConfirmed: boolean;
  sameTimeDailyUnderstood: boolean;
  grapefruitmInteractionAware: boolean;
}

export interface HypertensionCounselling {
  ankleSwellingExplained: boolean;
  takeAtSameTime: boolean;
  grapefruitmInteractionWarned: boolean;
  regularMonitoring: boolean;
  lifestyleAdvice: boolean;
  doNotStopSuddenly: boolean;
}

export interface HypertensionConsultationState {
  patient: HypertensionPatientDetails;
  consent: BaseConsent;
  assessment: HypertensionAssessment;
  medicalHistory: HypertensionMedicalHistory;
  redFlags: HypertensionRedFlags;
  monitoring: HypertensionMonitoring;
  medicineSupply: HypertensionMedicineSupply;
  counselling: HypertensionCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type HypertensionAction =
  | { type: "UPDATE_PATIENT"; field: keyof HypertensionPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof HypertensionAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof HypertensionMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof HypertensionRedFlags; value: any }
  | { type: "UPDATE_MONITORING"; field: keyof HypertensionMonitoring; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof HypertensionMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof HypertensionCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "BP Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Monitoring Review",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): HypertensionConsultationState {
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
      hasExistingDiagnosis: false,
      stableOnTreatmentMonths: null,
      clinicSystolic: null,
      clinicDiastolic: null,
      homeSystolic: null,
      homeDiastolic: null,
      currentAmlodipineDose: "",
    },
    medicalHistory: {
      bpDocumented: false,
      heartFailure: false,
      severeAorticStenosis: false,
      otherConditions: "",
    },
    redFlags: {
      uncontrolledBP: false,
      newChestPain: false,
      severeHeadache: false,
      visualChanges: false,
      bpGreater180110: false,
    },
    monitoring: {
      homeMonitoringDone: false,
      regularity: "",
      bpReadingsAccurate: false,
    },
    medicineSupply: {
      amlodipineDoseSelected: "",
      dosageConfirmed: false,
      sameTimeDailyUnderstood: false,
      grapefruitmInteractionAware: false,
    },
    counselling: {
      ankleSwellingExplained: false,
      takeAtSameTime: false,
      grapefruitmInteractionWarned: false,
      regularMonitoring: false,
      lifestyleAdvice: false,
      doNotStopSuddenly: false,
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

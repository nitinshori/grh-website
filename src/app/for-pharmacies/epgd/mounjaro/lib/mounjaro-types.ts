import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

// ─── Mounjaro Specific Types ───

export interface MounjaroWeightAssessment {
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bmiCategory: string; // "underweight" | "normal" | "overweight" | "obese"
  waistCircumference: number | null;
  comorbidities: string[]; // type2diabetes, hypertension, dyslipidaemia, osa
}

export interface MounjaroMedicalHistory {
  // Exclusions
  personalMTCHistory: boolean;
  familyMTCHistory: boolean;
  men2: boolean;
  pancreatitisHistory: boolean;
  severeGIDisease: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  type1Diabetes: boolean;
  // Cautions
  gallbladderDisease: boolean;
  renalImpairment: boolean;
  diabeticRetinopathy: boolean;
  depression: boolean;
  thyroidDisease: boolean;
}

export interface MounjaroMedications {
  takesInsulin: boolean;
  insulinDetails: string;
  currentGLP1: boolean;
  otherGLP1Details: string;
  warfarinUser: boolean;
  takesOralContraceptives: boolean;
  otherMedications: string;
  allergies: string;
}

export interface MounjaroObservations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
}

export interface MounjaroDoseSelection {
  currentDoseStage: string; // "init" | "1" | "2" | "3" | "4" | "5" | "6"
  dose: string;
  weeksAtCurrentDose: number | null;
  previousDose: string;
  injectionSite: string;
  pharmacistOverride: boolean;
  overrideReason: string;
}

export interface MounjaroCounselling {
  injectionTechnique: boolean;
  injectionSiteRotation: boolean;
  storageRefrigeration: boolean;
  missedDoseProtocol: boolean;
  giSideEffects: boolean;
  pancreatitisWarning: boolean;
  gallbladderWarning: boolean;
  retinopathyWarning: boolean;
  penDeviceUse: boolean;
  followUpSchedule: boolean;
  dietExerciseAdvice: boolean;
}

export interface MounjaroConsultationSummary extends BaseSummary {
  notes: string;
}

export interface MounjaroConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  weightAssessment: MounjaroWeightAssessment;
  medicalHistory: MounjaroMedicalHistory;
  medications: MounjaroMedications;
  observations: MounjaroObservations;
  doseSelection: MounjaroDoseSelection;
  counselling: MounjaroCounselling;
  summary: MounjaroConsultationSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type MounjaroAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_WEIGHT_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICATIONS"; field: string; value: any }
  | { type: "UPDATE_OBSERVATIONS"; field: string; value: any }
  | { type: "UPDATE_DOSE_SELECTION"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Weight Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Dose Selection",
  "Counselling",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialConsultationState(): MounjaroConsultationState {
  return {
    currentStep: 0,
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
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    weightAssessment: {
      height: null,
      weight: null,
      bmi: null,
      bmiCategory: "",
      waistCircumference: null,
      comorbidities: [],
    },
    medicalHistory: {
      personalMTCHistory: false,
      familyMTCHistory: false,
      men2: false,
      pancreatitisHistory: false,
      severeGIDisease: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      type1Diabetes: false,
      gallbladderDisease: false,
      renalImpairment: false,
      diabeticRetinopathy: false,
      depression: false,
      thyroidDisease: false,
    },
    medications: {
      takesInsulin: false,
      insulinDetails: "",
      currentGLP1: false,
      otherGLP1Details: "",
      warfarinUser: false,
      takesOralContraceptives: false,
      otherMedications: "",
      allergies: "",
    },
    observations: {
      systolicBP: null,
      diastolicBP: null,
      heartRate: null,
      weight: null,
      height: null,
    },
    doseSelection: {
      currentDoseStage: "init",
      dose: "2.5mg",
      weeksAtCurrentDose: null,
      previousDose: "",
      injectionSite: "",
      pharmacistOverride: false,
      overrideReason: "",
    },
    counselling: {
      injectionTechnique: false,
      injectionSiteRotation: false,
      storageRefrigeration: false,
      missedDoseProtocol: false,
      giSideEffects: false,
      pancreatitisWarning: false,
      gallbladderWarning: false,
      retinopathyWarning: false,
      penDeviceUse: false,
      followUpSchedule: false,
      dietExerciseAdvice: false,
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
      notes: "",
    },
    alerts: [],
    doseRecommendation: null,
  };
}

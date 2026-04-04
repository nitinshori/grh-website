// ─── Wegovy/Semaglutide Weight Management eTool TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Weight Assessment ───

export interface WegovyWeightAssessment {
  height: number | null; // cm
  weight: number | null; // kg
  bmi: number | null; // auto-calculated
  waistCircumference: number | null; // cm
  previousWeightLossAttempts: boolean;
  previousAttemptDetails: string;
  weightRelatedComorbidities: WeightRelatedComorbidity[];
  targetWeightLoss: string;
}

export type WeightRelatedComorbidity =
  | "hypertension"
  | "type2diabetes"
  | "sleepApnoea"
  | "osteoarthritis"
  | "pcos"
  | "dyslipidaemia";

// ─── Medical History ───

export interface WegovyMedicalHistory {
  personalMTCHistory: boolean; // medullary thyroid carcinoma
  familyMTCHistory: boolean;
  men2: boolean; // multiple endocrine neoplasia type 2
  severeGIDisease: boolean; // inflammatory bowel, gastroparesis
  pancreatitisHistory: boolean;
  gallbladderDisease: boolean;
  diabeticRetinopathy: boolean;
  eatingDisorder: boolean;
  severeHepatic: boolean;
  severeRenal: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  depression: boolean;
  suicidalIdeation: boolean;
  thyroidDisease: boolean;
}

// ─── Medications ───

export interface WegovyMedications {
  takesInsulin: boolean;
  insulinDetails: string;
  takesSulphonylureas: boolean;
  sulphonylureDetails: string;
  takesOralContraceptives: boolean;
  currentGLP1: boolean; // already on a GLP-1
  otherMedications: string;
  allergies: string;
}

// ─── Observations ───

export interface WegovyObservations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
}

// ─── Dose Selection ───

export interface WegovyDoseSelection {
  currentDoseStage: "initiation" | "escalation" | "maintenance" | "";
  dose: string; // "0.25mg" | "0.5mg" | "1mg" | "1.7mg" | "2.4mg"
  weeksAtCurrentDose: number | null;
  previousDose: string;
  injectionSite: string;
  pharmacistOverride: boolean;
  overrideReason: string;
}

// ─── Counselling ───

export interface WegovyCounselling {
  injectionTechnique: boolean;
  storageFridge: boolean;
  missedDose: boolean;
  giSideEffects: boolean; // nausea, vomiting, diarrhoea, constipation
  pancreatitisWarning: boolean;
  gallbladderWarning: boolean;
  suicidalIdeationWarning: boolean;
  contraceptionAdvice: boolean; // reduces OCP efficacy
  hypoglycaemiaRisk: boolean; // if on insulin/SU
  dietExerciseAdvice: boolean;
  followUpSchedule: boolean;
}

// ─── Full Consultation Summary ───

export interface WegovyConsultationSummary extends BaseSummary {
  // Additional Wegovy-specific fields if needed
}

// ─── Alerts ───

export interface ClinicalAlert {
  severity: "stop" | "caution" | "red-flag";
  code: string;
  message: string;
  detail: string;
}

// ─── Dose Recommendation ───

export interface DoseRecommendation {
  stage: "initiation" | "escalation" | "maintenance";
  dose: string;
  reason: string;
  titrationSchedule: string;
}

// ─── Full Consultation State ───

export interface WegovyConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  weightAssessment: WegovyWeightAssessment;
  medicalHistory: WegovyMedicalHistory;
  medications: WegovyMedications;
  observations: WegovyObservations;
  doseSelection: WegovyDoseSelection;
  counselling: WegovyCounselling;
  summary: WegovyConsultationSummary;
  // Computed
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type WegovyAction =
  | {
      type: "UPDATE_PATIENT";
      field: keyof BasePatientDetails;
      value: BasePatientDetails[keyof BasePatientDetails];
    }
  | {
      type: "UPDATE_CONSENT";
      field: keyof BaseConsent;
      value: BaseConsent[keyof BaseConsent];
    }
  | {
      type: "UPDATE_WEIGHT_ASSESSMENT";
      field: keyof WegovyWeightAssessment;
      value: WegovyWeightAssessment[keyof WegovyWeightAssessment];
    }
  | {
      type: "UPDATE_MEDICAL_HISTORY";
      field: keyof WegovyMedicalHistory;
      value: WegovyMedicalHistory[keyof WegovyMedicalHistory];
    }
  | {
      type: "UPDATE_MEDICATIONS";
      field: keyof WegovyMedications;
      value: WegovyMedications[keyof WegovyMedications];
    }
  | {
      type: "UPDATE_OBSERVATIONS";
      field: keyof WegovyObservations;
      value: WegovyObservations[keyof WegovyObservations];
    }
  | {
      type: "UPDATE_DOSE_SELECTION";
      field: keyof WegovyDoseSelection;
      value: WegovyDoseSelection[keyof WegovyDoseSelection];
    }
  | {
      type: "UPDATE_COUNSELLING";
      field: keyof WegovyCounselling;
      value: boolean;
    }
  | {
      type: "UPDATE_SUMMARY";
      field: keyof WegovyConsultationSummary;
      value: string;
    }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Step Labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent & ID",
  "Weight Assessment",
  "Medical History",
  "Current Medications",
  "Observations",
  "Contraindications Review",
  "Dose Selection",
  "Counselling",
  "Summary & Print",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State Factory ───

export function createInitialConsultationState(): WegovyConsultationState {
  return {
    currentStep: 0,
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
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
      waistCircumference: null,
      previousWeightLossAttempts: false,
      previousAttemptDetails: "",
      weightRelatedComorbidities: [],
      targetWeightLoss: "",
    },
    medicalHistory: {
      personalMTCHistory: false,
      familyMTCHistory: false,
      men2: false,
      severeGIDisease: false,
      pancreatitisHistory: false,
      gallbladderDisease: false,
      diabeticRetinopathy: false,
      eatingDisorder: false,
      severeHepatic: false,
      severeRenal: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      depression: false,
      suicidalIdeation: false,
      thyroidDisease: false,
    },
    medications: {
      takesInsulin: false,
      insulinDetails: "",
      takesSulphonylureas: false,
      sulphonylureDetails: "",
      takesOralContraceptives: false,
      currentGLP1: false,
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
      currentDoseStage: "",
      dose: "",
      weeksAtCurrentDose: null,
      previousDose: "",
      injectionSite: "",
      pharmacistOverride: false,
      overrideReason: "",
    },
    counselling: {
      injectionTechnique: false,
      storageFridge: false,
      missedDose: false,
      giSideEffects: false,
      pancreatitisWarning: false,
      gallbladderWarning: false,
      suicidalIdeationWarning: false,
      contraceptionAdvice: false,
      hypoglycaemiaRisk: false,
      dietExerciseAdvice: false,
      followUpSchedule: false,
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
    alerts: [],
    doseRecommendation: null,
    canProceed: false,
    isComplete: false,
  };
}

import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface OrlistatWeightAssessment {
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bmiCategory: string;
  waistCircumference: number | null;
  comorbidities: string[];
}

export interface OrlistatMedicalHistory {
  cholestasis: boolean;
  chronicMalabsorption: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  gallbladderDisease: boolean;
  severeGastrointestinal: boolean;
  chronic_diarrhea: boolean;
}

export interface OrlistatMedications {
  takesWarfarin: boolean;
  takesLevothyroxine: boolean;
  takesAntiEpileptics: boolean;
  takesCiclosporin: boolean;
  takesOralContraceptives: boolean;
  otherMedications: string;
  allergies: string;
}

export interface OrlistatObservations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
}

export interface OrlistatMedicineSupply {
  dosage: string;
  quantity: number | null;
  prescriptionType: string;
  refillSchedule: string;
}

export interface OrlistatCounselling {
  dietaryAdvice: boolean;
  steatorrhoea: boolean;
  fatSolubleVitamins: boolean;
  multivitamin: boolean;
  separationAdvice: boolean;
  reviewSchedule: boolean;
  weightLossTarget: boolean;
  followUpProtocol: boolean;
}

export interface OrlistatConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  weightAssessment: OrlistatWeightAssessment;
  medicalHistory: OrlistatMedicalHistory;
  medications: OrlistatMedications;
  observations: OrlistatObservations;
  medicineSupply: OrlistatMedicineSupply;
  counselling: OrlistatCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type OrlistatAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_WEIGHT_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICATIONS"; field: string; value: any }
  | { type: "UPDATE_OBSERVATIONS"; field: string; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Weight Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): OrlistatConsultationState {
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
      cholestasis: false,
      chronicMalabsorption: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      gallbladderDisease: false,
      severeGastrointestinal: false,
      chronic_diarrhea: false,
    },
    medications: {
      takesWarfarin: false,
      takesLevothyroxine: false,
      takesAntiEpileptics: false,
      takesCiclosporin: false,
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
    medicineSupply: {
      dosage: "120mg TDS",
      quantity: null,
      prescriptionType: "self-funded",
      refillSchedule: "monthly",
    },
    counselling: {
      dietaryAdvice: false,
      steatorrhoea: false,
      fatSolubleVitamins: false,
      multivitamin: false,
      separationAdvice: false,
      reviewSchedule: false,
      weightLossTarget: false,
      followUpProtocol: false,
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
  };
}

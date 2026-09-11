import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface OrlistatWeightAssessment {
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bmiCategory: string;
  waistCircumference: number | null;
  comorbidities: string[];
  // PGD v002 inclusion: motivated and committed to weight loss with a
  // structured reduced-calorie diet.
  motivatedStructuredDiet: boolean;
}

export interface OrlistatMedicalHistory {
  // PGD v002 exclusion: cholestasis or severe hepatic impairment.
  cholestasis: boolean;
  chronicMalabsorption: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  // PGD v002 caution: gallstone disease.
  gallbladderDisease: boolean;
  severeGastrointestinal: boolean;
  chronic_diarrhea: boolean;
  // Chronic kidney disease / volume depletion, increased hyperoxaluria
  // and oxalate-nephropathy risk on orlistat. Caution.
  chronicKidneyDisease: boolean;
  // PGD v002 exclusion: uncontrolled or newly diagnosed diabetes.
  uncontrolledOrNewDiabetes: boolean;
  // PGD v002 exclusion: known hypersensitivity to orlistat or any component.
  hypersensitivityToOrlistat: boolean;
  // PGD v002 caution: history of oxalate kidney stones.
  oxalateKidneyStones: boolean;
  // PGD v002 caution: chronic liver disease or elevated LFTs.
  chronicLiverDisease: boolean;
}

export interface OrlistatMedications {
  takesWarfarin: boolean;
  // PGD v002 caution: other anticoagulant (edoxaban, dabigatran, rivaroxaban).
  takesOtherAnticoagulant: boolean;
  takesLevothyroxine: boolean;
  takesAntiEpileptics: boolean;
  takesCiclosporin: boolean;
  // PGD v002 caution: bile acid sequestrants.
  takesBileAcidSequestrants: boolean;
  takesOralContraceptives: boolean;
  // Antiretrovirals for HIV, orlistat may reduce their absorption and
  // efficacy. Caution.
  takesHIVAntiretrovirals: boolean;
  // Any other clinically significant drug interaction. Exclusion under
  // Janey's amendment, refer to GP for medicines reconciliation.
  otherSignificantInteraction: boolean;
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
  // PGD v002 records row: name and brand of medication.
  brand: string;
  prescriptionType: string;
  refillSchedule: string;
}

// PGD v002: up to 84 capsules per patient (28-day supply at 3 capsules daily).
export const ORLISTAT_MAX_QUANTITY = 84;

export interface OrlistatCounselling {
  pilSupplied: boolean;
  dietaryAdvice: boolean;
  steatorrhoea: boolean;
  fatSolubleVitamins: boolean;
  multivitamin: boolean;
  missedMealAdvice: boolean;
  separationAdvice: boolean;
  redFlagSymptoms: boolean;
  expectedWeightLoss: boolean;
  diabetesMedicationAdvice: boolean;
  anticoagulantAdvice: boolean;
  reviewSchedule: boolean;
  weightLossTarget: boolean;
  followUpProtocol: boolean;
  yellowCard: boolean;
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
    weightAssessment: {
      height: null,
      weight: null,
      bmi: null,
      bmiCategory: "",
      waistCircumference: null,
      comorbidities: [],
      motivatedStructuredDiet: false,
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
      chronicKidneyDisease: false,
      uncontrolledOrNewDiabetes: false,
      hypersensitivityToOrlistat: false,
      oxalateKidneyStones: false,
      chronicLiverDisease: false,
    },
    medications: {
      takesWarfarin: false,
      takesOtherAnticoagulant: false,
      takesLevothyroxine: false,
      takesAntiEpileptics: false,
      takesCiclosporin: false,
      takesBileAcidSequestrants: false,
      takesOralContraceptives: false,
      takesHIVAntiretrovirals: false,
      otherSignificantInteraction: false,
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
      dosage: "120mg with each main meal containing fat, up to three times daily (maximum 360mg daily)",
      quantity: null,
      brand: "",
      prescriptionType: "self-funded",
      refillSchedule: "28 days",
    },
    counselling: {
      pilSupplied: false,
      dietaryAdvice: false,
      steatorrhoea: false,
      fatSolubleVitamins: false,
      multivitamin: false,
      missedMealAdvice: false,
      separationAdvice: false,
      redFlagSymptoms: false,
      expectedWeightLoss: false,
      diabetesMedicationAdvice: false,
      anticoagulantAdvice: false,
      reviewSchedule: false,
      weightLossTarget: false,
      followUpProtocol: false,
      yellowCard: false,
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

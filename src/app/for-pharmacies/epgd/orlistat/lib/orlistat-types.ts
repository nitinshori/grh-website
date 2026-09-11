import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export type OrlistatVisitType = "" | "initiation" | "continuation";

export interface OrlistatWeightAssessment {
  // PGD v004: review at 12 weeks from the start of treatment; continue only
  // if at least 5% of body weight has been lost from baseline.
  visitType: OrlistatVisitType;
  treatmentStartDate: string;
  baselineWeight: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bmiCategory: string;
  waistCircumference: number | null;
  comorbidities: string[];
  // PGD v004 inclusion: motivated and committed to weight loss with a
  // structured reduced-calorie diet.
  motivatedStructuredDiet: boolean;
}

export interface OrlistatMedicalHistory {
  // PGD v004 exclusion: cholestasis or severe hepatic impairment.
  cholestasis: boolean;
  chronicMalabsorption: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  // PGD v004 caution: gallstone disease.
  gallbladderDisease: boolean;
  severeGastrointestinal: boolean;
  chronic_diarrhea: boolean;
  // Chronic kidney disease / volume depletion, increased hyperoxaluria
  // and oxalate-nephropathy risk on orlistat. Caution.
  chronicKidneyDisease: boolean;
  // PGD v004 exclusion: uncontrolled or newly diagnosed diabetes.
  uncontrolledOrNewDiabetes: boolean;
  // PGD v004 exclusion: known hypersensitivity to orlistat or any component.
  hypersensitivityToOrlistat: boolean;
  // PGD v004 caution: history of oxalate kidney stones.
  oxalateKidneyStones: boolean;
  // PGD v004 caution: chronic liver disease or elevated LFTs.
  chronicLiverDisease: boolean;
}

export interface OrlistatMedications {
  takesWarfarin: boolean;
  // PGD v004 caution: other anticoagulant (edoxaban, dabigatran, rivaroxaban).
  takesOtherAnticoagulant: boolean;
  takesLevothyroxine: boolean;
  // Antiepileptic medicines: exclusion (decision 54, 11 September 2026).
  takesAntiEpileptics: boolean;
  takesCiclosporin: boolean;
  // PGD v004 caution: bile acid sequestrants.
  takesBileAcidSequestrants: boolean;
  takesOralContraceptives: boolean;
  // Antiretrovirals for HIV, orlistat may reduce their absorption and
  // efficacy. Exclusion (decision 54).
  takesHIVAntiretrovirals: boolean;
  // Amiodarone: orlistat may reduce plasma levels. Exclusion (decision 54).
  takesAmiodarone: boolean;
  // Any other medicine with an SmPC interaction that cannot be managed in a
  // pharmacy setting. Exclusion, refer to GP for medicines reconciliation.
  otherSignificantInteraction: boolean;
  otherMedications: string;
  allergies: string;
  // Explicit "no known drug allergies" assertion; the printed record used
  // to say NKDA whenever the allergies box was left blank.
  nkda: boolean;
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
  // PGD v004 records row: name and brand of medication.
  brand: string;
  prescriptionType: string;
  refillSchedule: string;
}

// PGD v004: up to 84 capsules per patient (28-day supply at 3 capsules daily).
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
  // PGD records row: advice given if excluded or declines treatment.
  exclusionAdvice: string;
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
  | { type: "UPDATE_EXCLUSION_ADVICE"; value: string }
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
      visitType: "",
      treatmentStartDate: "",
      baselineWeight: null,
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
      takesAmiodarone: false,
      otherSignificantInteraction: false,
      otherMedications: "",
      allergies: "",
      nkda: false,
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
    exclusionAdvice: "",
    alerts: [],
    doseRecommendation: null,
  };
}

// ─── Asthma Rescue ePGD Types ───
// Aligned to the signed PGD version 006, issued 11 September 2026:
// salbutamol 100mcg MDI and prednisolone 5mg tablets, adults 18 and over,
// acute exacerbation of diagnosed asthma.

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export const PGD_STRAPLINE = "Asthma Rescue PGD version 006, issued 11 September 2026";

// ─── Extended types for Asthma Rescue PGD ───

export type AsthmaPatientDetails = BasePatientDetails;

export type DiagnosisEvidence = "" | "gp-record" | "repeat-prescription" | "action-plan" | "none";

export interface AsthmaAssessment {
  hasExistingDiagnosis: boolean;
  diagnosisEvidence: DiagnosisEvidence; // GP record, repeat prescription for an asthma inhaler, or an asthma action plan
  normallyUsesSABA: boolean;
  onPreventer: boolean; // current inhaled corticosteroid therapy asked about and recorded
  preventerDetails: string;
  rescueCoursesLast12Months: number | null; // any source; more than one (2 or more): refer to GP
  pgdRescueCoursesLast12Months: number | null; // under this PGD; no more than one in 12 months is supplied (1 or more: stop)
  acuteExacerbation: boolean; // wheezing, breathlessness, chest tightness
  canUseInhalerOrSpacer: boolean;
  ableToTakeOralMedication: boolean;
  incompleteResponseToSalbutamol: boolean; // prednisolone arm entry
  frequentUse: boolean; // >3 days/week
  nocturnalSymptoms: boolean;
  activityLimitation: boolean;
  currentSABAMedication: string;
  reasonForSupply: string; // "ran out" | "replacement" | "other"
}

export interface AsthmaObservations {
  spo2: number | null; // below 92: acute severe, do not supply
  respiratoryRate: number | null; // 25 or more: acute severe
  heartRate: number | null; // 110 or more: acute severe
  pefMeasured: boolean; // where a peak flow meter is available
  pefPercentBest: number | null; // 33 to 50: acute severe; over 50 required for prednisolone
  canCompleteSentences: boolean; // required
  silentChest: boolean;
  cyanosis: boolean;
  exhaustion: boolean;
  confusion: boolean;
  poorRespiratoryEffort: boolean;
}

export interface AsthmaMedicalHistory {
  exclusionsAskedAndAnswered: boolean; // attestation: prednisolone exclusions and all cautions asked and answered
  otherRespiratoryConditions: string;
  allergies: string;
  otherConditions: string;
  // Salbutamol cautions
  cardiovascularDisease: boolean;
  diabetes: boolean;
  hyperthyroidism: boolean;
  hypokalaemia: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  // Prednisolone exclusions
  systemicInfectionUntreated: boolean;
  liveVaccineDuringTreatment: boolean;
  severeHepaticDysfunction: boolean;
  uncontrolledHypertensionOrCardiac: boolean;
  // Prednisolone cautions
  osteoporosis: boolean;
  pepticUlcer: boolean;
  psychiatricHistory: boolean;
  renalImpairment: boolean;
  hypertension: boolean;
  infection: boolean;
}

export interface AsthmaRedFlags {
  allergyStatusConfirmed: boolean; // attestation: salbutamol and prednisolone allergy status asked and confirmed
  increasingUse: boolean;
  nocturnalWakenings: boolean;
  activityLimitation: boolean;
  neverUsedSalbutamolBefore: boolean;
  noExistingDiagnosis: boolean;
  salbutamolAllergy: boolean;
  prednisoloneAllergy: boolean;
}

export type PrednisoloneDose = "" | "40" | "50";
export type PrednisoloneDays = "" | "5" | "6" | "7";

export interface AsthmaMedicineSupply {
  salbutamol100mcgPMDI: boolean;
  salbutamolBrand: string;
  twoAsDoseUnit: boolean;
  maxEightPuffsDailyUnderstood: boolean;
  spacerRecommended: boolean;
  prednisolone5mg: boolean;
  prednisoloneBrand: string;
  prednisoloneDoseMg: PrednisoloneDose;
  prednisoloneDays: PrednisoloneDays;
  prednisoloneTablets: number | null; // computed from dose and days, max 70
  tabletCountChecked: boolean; // pharmacist checked the arithmetic against the dose before supply
  salbutamolPilSupplied: boolean;
  prednisolonePilSupplied: boolean;
}

export interface AsthmaCounselling {
  relieverNotPreventer: boolean;
  inhalerTechniqueDemonstration: boolean;
  spacerUse: boolean;
  seekUrgentCareIfNotResolving: boolean;
  // PGD v006 follow-up advice
  emergencyIfNoImprovement: boolean; // no improvement within 15 to 30 minutes of salbutamol
  prednisoloneFullCourse: boolean;
  prednisoloneWithFood: boolean;
  prednisoloneDiabetes: boolean;
  prednisoloneOtherMedicines: boolean;
  seekImmediateAttention: boolean; // severe breathlessness, chest pain, confusion, exhaustion
  reviewActionPlan: boolean;
  maintenanceOptimised: boolean; // ensure maintenance therapy is optimised to prevent future exacerbations
}

export interface AsthmaExclusionOutcome {
  adviceGiven: string; // advice given and decision reached when excluded or declines
  referredTo: string; // "" | "999" | "urgent-care" | "gp" | "other"
}

export interface AsthmaConsultationState {
  patient: AsthmaPatientDetails;
  consent: BaseConsent;
  assessment: AsthmaAssessment;
  observations: AsthmaObservations;
  medicalHistory: AsthmaMedicalHistory;
  redFlags: AsthmaRedFlags;
  medicineSupply: AsthmaMedicineSupply;
  counselling: AsthmaCounselling;
  exclusionOutcome: AsthmaExclusionOutcome;
  summary: BaseSummary;
  currentStep: number;
}

export type AsthmaAction =
  | { type: "UPDATE_PATIENT"; field: keyof AsthmaPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof AsthmaAssessment; value: any }
  | { type: "UPDATE_OBSERVATIONS"; field: keyof AsthmaObservations; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof AsthmaMedicalHistory; value: any }
  | { type: "UPDATE_RED_FLAGS"; field: keyof AsthmaRedFlags; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof AsthmaMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof AsthmaCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "UPDATE_EXCLUSION_OUTCOME"; field: keyof AsthmaExclusionOutcome; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Asthma Assessment",
  "Medical History",
  "Observations & Exclusions",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): AsthmaConsultationState {
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
      deliveryDetails: "",
      consultationNotes: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    assessment: {
      hasExistingDiagnosis: false,
      diagnosisEvidence: "",
      normallyUsesSABA: false,
      onPreventer: false,
      preventerDetails: "",
      rescueCoursesLast12Months: null,
      pgdRescueCoursesLast12Months: null,
      acuteExacerbation: false,
      canUseInhalerOrSpacer: false,
      ableToTakeOralMedication: false,
      incompleteResponseToSalbutamol: false,
      frequentUse: false,
      nocturnalSymptoms: false,
      activityLimitation: false,
      currentSABAMedication: "",
      reasonForSupply: "",
    },
    observations: {
      spo2: null,
      respiratoryRate: null,
      heartRate: null,
      pefMeasured: false,
      pefPercentBest: null,
      canCompleteSentences: false,
      silentChest: false,
      cyanosis: false,
      exhaustion: false,
      confusion: false,
      poorRespiratoryEffort: false,
    },
    medicalHistory: {
      exclusionsAskedAndAnswered: false,
      otherRespiratoryConditions: "",
      allergies: "",
      otherConditions: "",
      cardiovascularDisease: false,
      diabetes: false,
      hyperthyroidism: false,
      hypokalaemia: false,
      pregnancy: false,
      breastfeeding: false,
      systemicInfectionUntreated: false,
      liveVaccineDuringTreatment: false,
      severeHepaticDysfunction: false,
      uncontrolledHypertensionOrCardiac: false,
      osteoporosis: false,
      pepticUlcer: false,
      psychiatricHistory: false,
      renalImpairment: false,
      hypertension: false,
      infection: false,
    },
    redFlags: {
      allergyStatusConfirmed: false,
      increasingUse: false,
      nocturnalWakenings: false,
      activityLimitation: false,
      neverUsedSalbutamolBefore: false,
      noExistingDiagnosis: false,
      salbutamolAllergy: false,
      prednisoloneAllergy: false,
    },
    medicineSupply: {
      salbutamol100mcgPMDI: false,
      salbutamolBrand: "",
      twoAsDoseUnit: false,
      maxEightPuffsDailyUnderstood: false,
      spacerRecommended: false,
      prednisolone5mg: false,
      prednisoloneBrand: "",
      prednisoloneDoseMg: "",
      prednisoloneDays: "",
      prednisoloneTablets: null,
      tabletCountChecked: false,
      salbutamolPilSupplied: false,
      prednisolonePilSupplied: false,
    },
    counselling: {
      relieverNotPreventer: false,
      inhalerTechniqueDemonstration: false,
      spacerUse: false,
      seekUrgentCareIfNotResolving: false,
      emergencyIfNoImprovement: false,
      prednisoloneFullCourse: false,
      prednisoloneWithFood: false,
      prednisoloneDiabetes: false,
      prednisoloneOtherMedicines: false,
      seekImmediateAttention: false,
      reviewActionPlan: false,
      maintenanceOptimised: false,
    },
    exclusionOutcome: {
      adviceGiven: "",
      referredTo: "",
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

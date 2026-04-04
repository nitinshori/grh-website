// ─── PrEP (HIV Pre-exposure Prophylaxis) ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Extended types for PrEP PGD ───

export interface PrEPPatientDetails extends BasePatientDetails {
  riskGroup: string; // msm, trans, heterosexual, sexworker, pwid, chemsex
}

export interface PrEPRiskAssessment {
  msm: boolean;
  transPerson: boolean;
  transPersonDetails: string;
  heterosexualWithHivPartner: boolean;
  sexWorkerOrPartner: boolean;
  pwid: boolean;
  chemsex: boolean;
  otherRiskFactors: string;
}

export interface PrEPBaselineTests {
  hivTestConfirmedNegative: boolean;
  hivTestDate: string; // must be <4 weeks
  hepatitisBAntigen: boolean;
  hepatitisBAntigenResult: string; // negative, positive, unknown
  eGfr: number | null; // must be ≥60
  stiScreening: boolean;
}

export interface PrEPMedicalHistory {
  activeHepatitisB: boolean; // Risk of flare on stopping
  severeKidneyDisease: boolean;
  boneDensityIssues: boolean;
  otherConditions: string;
}

export interface PrEPContraindications {
  hivPositive: boolean;
  eGfrBelow60: boolean;
  unknownHivStatus: boolean;
}

export interface PrEPMedicineSupply {
  emtricitabineTenofovir200245: boolean;
  dosingRegimen: "daily" | "event-based" | ""; // daily or on-demand
  understandsDailyDosing: boolean; // 7 days receptive anal, 21 days vaginal
  understandsEventBased: boolean; // 2+1+1 dosing
  renalMonitoring: boolean; // Every 3-6 months
}

export interface PrEPCounselling {
  notSubstituteForCondoms: boolean;
  regularHivTesting: boolean; // Every 3 months
  renalMonitoring: boolean;
  takeWithFood: boolean;
  adherenceCritical: boolean;
  missedDose: boolean;
  pepAvailable: boolean; // If exposed while off PrEP
}

export interface PrEPConsultationState {
  patient: PrEPPatientDetails;
  consent: BaseConsent;
  riskAssessment: PrEPRiskAssessment;
  baselineTests: PrEPBaselineTests;
  medicalHistory: PrEPMedicalHistory;
  contraindications: PrEPContraindications;
  medicineSupply: PrEPMedicineSupply;
  counselling: PrEPCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type PrEPAction =
  | { type: "UPDATE_PATIENT"; field: keyof PrEPPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_RISK_ASSESSMENT"; field: keyof PrEPRiskAssessment; value: any }
  | { type: "UPDATE_BASELINE_TESTS"; field: keyof PrEPBaselineTests; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof PrEPMedicalHistory; value: any }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof PrEPContraindications; value: any }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof PrEPMedicineSupply; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof PrEPCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any }
  | { type: "SET_STEP"; step: number };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Risk Assessment",
  "Baseline Testing",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): PrEPConsultationState {
  return {
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
      riskGroup: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    riskAssessment: {
      msm: false,
      transPerson: false,
      transPersonDetails: "",
      heterosexualWithHivPartner: false,
      sexWorkerOrPartner: false,
      pwid: false,
      chemsex: false,
      otherRiskFactors: "",
    },
    baselineTests: {
      hivTestConfirmedNegative: false,
      hivTestDate: "",
      hepatitisBAntigen: false,
      hepatitisBAntigenResult: "",
      eGfr: null,
      stiScreening: false,
    },
    medicalHistory: {
      activeHepatitisB: false,
      severeKidneyDisease: false,
      boneDensityIssues: false,
      otherConditions: "",
    },
    contraindications: {
      hivPositive: false,
      eGfrBelow60: false,
      unknownHivStatus: false,
    },
    medicineSupply: {
      emtricitabineTenofovir200245: false,
      dosingRegimen: "",
      understandsDailyDosing: false,
      understandsEventBased: false,
      renalMonitoring: false,
    },
    counselling: {
      notSubstituteForCondoms: false,
      regularHivTesting: false,
      renalMonitoring: false,
      takeWithFood: false,
      adherenceCritical: false,
      missedDose: false,
      pepAvailable: false,
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

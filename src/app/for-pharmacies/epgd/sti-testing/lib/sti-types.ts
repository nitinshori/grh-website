// ─── STI Testing ePGD Types ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Extended types for STI Testing PGD ───

export interface STIPatientDetails extends BasePatientDetails {
  genderIdentity: string; // male, female, trans-male, trans-female, non-binary
}

export interface STIRiskAssessment {
  numberOfPartners: number | null; // Last 3 months
  condomUsage: string; // never, sometimes, always
  previousSTIs: boolean;
  previousStiDetail: string;
  currentSymptoms: boolean;
  symptomDetail: string;
  msmStatus: boolean; // Men who have sex with men
  sexWorker: boolean;
  pwid: boolean; // People who inject drugs
  recentTravel: boolean;
  travelDetail: string;
}

export interface STIClinicalAssessment {
  symptomSite: string; // urethral, genital, rectal, pharyngeal, systemic
  urethralDischarge: boolean;
  genitalPain: boolean;
  rectalSymptoms: boolean;
  pharyngealSymptoms: boolean;
  systemicSymptoms: boolean;
  systemicDetail: string;
}

export interface STITestSelection {
  ctGc: boolean; // Chlamydia/Gonorrhoea
  ctGcSampleType: string; // urine, urethral swab, vaginal swab, rectal, pharyngeal
  hiv: boolean;
  hivTestType: string; // rapid, lab
  syphilis: boolean;
  hepatitisB: boolean;
  hepatitisC: boolean;
}

export interface STICounselling {
  windowPeriods: boolean;
  partnerNotification: boolean;
  safeSex: boolean;
  resultsTimeline: boolean;
  positiveTestMeaning: boolean;
  followUp: boolean;
}

export interface STIConsultationState {
  patient: STIPatientDetails;
  consent: BaseConsent;
  riskAssessment: STIRiskAssessment;
  clinicalAssessment: STIClinicalAssessment;
  testSelection: STITestSelection;
  counselling: STICounselling;
  summary: BaseSummary & { testsOrdered: string[] };
  currentStep: number;
}

export type STIAction =
  | { type: "UPDATE_PATIENT"; field: keyof STIPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_RISK_ASSESSMENT"; field: keyof STIRiskAssessment; value: any }
  | { type: "UPDATE_CLINICAL_ASSESSMENT"; field: keyof STIClinicalAssessment; value: any }
  | { type: "UPDATE_TEST_SELECTION"; field: keyof STITestSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof STICounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number };

// ─── Step labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Risk Assessment",
  "Clinical Assessment",
  "Test Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial state ───

export function createInitialConsultationState(): STIConsultationState {
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
      genderIdentity: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    riskAssessment: {
      numberOfPartners: null,
      condomUsage: "",
      previousSTIs: false,
      previousStiDetail: "",
      currentSymptoms: false,
      symptomDetail: "",
      msmStatus: false,
      sexWorker: false,
      pwid: false,
      recentTravel: false,
      travelDetail: "",
    },
    clinicalAssessment: {
      symptomSite: "",
      urethralDischarge: false,
      genitalPain: false,
      rectalSymptoms: false,
      pharyngealSymptoms: false,
      systemicSymptoms: false,
      systemicDetail: "",
    },
    testSelection: {
      ctGc: false,
      ctGcSampleType: "",
      hiv: false,
      hivTestType: "",
      syphilis: false,
      hepatitisB: false,
      hepatitisC: false,
    },
    counselling: {
      windowPeriods: false,
      partnerNotification: false,
      safeSex: false,
      resultsTimeline: false,
      positiveTestMeaning: false,
      followUp: false,
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
      testsOrdered: [],
    },
    currentStep: 0,
  };
}

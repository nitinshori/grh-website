import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface MySimbaAssessment {
  bmiEligible: boolean;
  uncontrolledHypertension: boolean;
  seizureDisorders: boolean;
  currentOpioidUse: boolean;
  anorexiaBulimia: boolean;
  onMAOIs: boolean;
  severeHepaticDisease: boolean;
  pregnancyStatus: string;
  weight: number | null;
  bmi: number | null;
  targetWeight: number | null;
}

export interface MySimbaCounselling {
  explainedTitrationSchedule: boolean;
  explainedNoAlcohol: boolean;
  discussedBPMonitoring: boolean;
  discussedSeizureRisk: boolean;
  discussedOpioidWithdrawal: boolean;
  offeredWrittenInfo: boolean;
}

export interface MySimbaConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: MySimbaAssessment;
  counselling: MySimbaCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type MySimbaAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean }
  | { type: "UPDATE_ASSESSMENT"; field: keyof MySimbaAssessment; value: string | number | boolean | null }
  | { type: "UPDATE_COUNSELLING"; field: keyof MySimbaCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Weight & BMI",
  "Eligibility Assessment",
  "Contraindications",
  "Counselling",
  "Titration Plan",
  "Summary & Declaration",
  "Consultation Complete",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): MySimbaConsultationState {
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
      bmiEligible: false,
      uncontrolledHypertension: false,
      seizureDisorders: false,
      currentOpioidUse: false,
      anorexiaBulimia: false,
      onMAOIs: false,
      severeHepaticDisease: false,
      pregnancyStatus: "",
      weight: null,
      bmi: null,
      targetWeight: null,
    },
    counselling: {
      explainedTitrationSchedule: false,
      explainedNoAlcohol: false,
      discussedBPMonitoring: false,
      discussedSeizureRisk: false,
      discussedOpioidWithdrawal: false,
      offeredWrittenInfo: false,
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

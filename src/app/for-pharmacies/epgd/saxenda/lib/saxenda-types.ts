import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface SaxendaAssessment {
  bmiEligible: boolean;
  mtcMenHistory: boolean;
  pancreatitisHistory: boolean;
  pregnancyStatus: string;
  type1Diabetes: boolean;
  severeRenalDisease: boolean;
  severeHepaticDisease: boolean;
  weight: number | null;
  bmi: number | null;
}

export interface SaxendaCounselling {
  explainedDoseEscalation: boolean;
  explainedInjectionTechnique: boolean;
  discussedGiSideEffects: boolean;
  discussedPancreatitisWarning: boolean;
  disclosedTargetWeight: boolean;
}

export interface SaxendaConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: SaxendaAssessment;
  counselling: SaxendaCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export type SaxendaAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: string | number | boolean | null }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: string | boolean }
  | { type: "UPDATE_ASSESSMENT"; field: keyof SaxendaAssessment; value: string | number | boolean | null }
  | { type: "UPDATE_COUNSELLING"; field: keyof SaxendaCounselling; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Weight & BMI",
  "Eligibility Assessment",
  "Contraindications",
  "Counselling",
  "Dose Titration Plan",
  "Summary & Declaration",
  "Consultation Complete",
  "Review",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): SaxendaConsultationState {
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
      mtcMenHistory: false,
      pancreatitisHistory: false,
      pregnancyStatus: "",
      type1Diabetes: false,
      severeRenalDisease: false,
      severeHepaticDisease: false,
      weight: null,
      bmi: null,
    },
    counselling: {
      explainedDoseEscalation: false,
      explainedInjectionTechnique: false,
      discussedGiSideEffects: false,
      discussedPancreatitisWarning: false,
      disclosedTargetWeight: false,
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

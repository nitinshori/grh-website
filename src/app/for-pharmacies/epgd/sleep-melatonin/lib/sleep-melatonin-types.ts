import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface SleepMelatoninAssessment {
  sleepOnsetIssue: boolean;
  sleepMaintenanceIssue: boolean;
  durationOfInsomnia: string; // "less3m", "3-12m", "over12m"
  sleepHygieneAttempted: boolean;
  ageConfirmed: boolean;
}

export interface SleepMelatoninContraindications {
  autoimmuneDiseaseActive: boolean;
  hepaticImpairment: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  contraindicated: boolean;
}

export interface SleepMelatoninPrescription {
  product: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface SleepMelatoninCounselling {
  sleepHygieneReinforcedFirstLine: boolean;
  avoidScreensAdvised: boolean;
  taperedStoppingAdvised: boolean;
  notASedativeExplained: boolean;
}

export interface SleepMelatoninConsultationSummary extends BaseSummary {
  recommendationSummary: string;
}

export interface SleepMelatoninConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: SleepMelatoninAssessment;
  contraindications: SleepMelatoninContraindications;
  prescription: SleepMelatoninPrescription;
  counselling: SleepMelatoninCounselling;
  summary: SleepMelatoninConsultationSummary;
  completedSteps: Set<number>;
}

export type SleepMelatoninAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof SleepMelatoninAssessment; value: unknown }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof SleepMelatoninContraindications; value: unknown }
  | { type: "UPDATE_PRESCRIPTION"; field: keyof SleepMelatoninPrescription; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof SleepMelatoninCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof SleepMelatoninConsultationSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = ["Patient Details", "Consent", "Sleep Assessment", "Contraindications", "Prescription", "Counselling", "Summary & Record", "Consultation Complete"];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialSleepMelatoninState(): SleepMelatoninConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { sleepOnsetIssue: false, sleepMaintenanceIssue: false, durationOfInsomnia: "", sleepHygieneAttempted: false, ageConfirmed: false },
    contraindications: { autoimmuneDiseaseActive: false, hepaticImpairment: false, pregnancy: false, breastfeeding: false, contraindicated: false },
    prescription: { product: "Prolonged-release Melatonin 2mg", dose: "2mg", frequency: "Once nightly (1-2 hours before bedtime)", duration: "Up to 13 weeks" },
    counselling: { sleepHygieneReinforcedFirstLine: false, avoidScreensAdvised: false, taperedStoppingAdvised: false, notASedativeExplained: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", recommendationSummary: "" },
    completedSteps: new Set(),
  };
}

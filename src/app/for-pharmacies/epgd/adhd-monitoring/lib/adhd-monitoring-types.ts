import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface ADHDMonitoringAssessment {
  currentMedication: string;
  currentDose: string;
  baselineHR: number | null;
  baselineBP: string;
  baselineWeight: number | null;
}

export interface ADHDMonitoringMonitoring {
  currentHR: number | null;
  currentBP: string;
  currentWeight: number | null;
  appetite: string;
  sleepQuality: string;
  moodChanges: boolean;
  ticsDeveloped: boolean;
  redFlagsPresent: boolean;
}

export interface ADHDMonitoringConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: ADHDMonitoringAssessment;
  monitoring: ADHDMonitoringMonitoring;
  summary: BaseSummary;
  completedSteps: Set<number>;
}

export type ADHDMonitoringAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof ADHDMonitoringAssessment; value: unknown }
  | { type: "UPDATE_MONITORING"; field: keyof ADHDMonitoringMonitoring; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = ["Patient Details", "Consent", "Baseline Assessment", "Current Monitoring", "Adverse Events Check", "Dose Titration", "Summary & Record", "Consultation Complete"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialADHDMonitoringState(): ADHDMonitoringConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { currentMedication: "", currentDose: "", baselineHR: null, baselineBP: "", baselineWeight: null },
    monitoring: { currentHR: null, currentBP: "", currentWeight: null, appetite: "", sleepQuality: "", moodChanges: false, ticsDeveloped: false, redFlagsPresent: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    completedSteps: new Set(),
  };
}

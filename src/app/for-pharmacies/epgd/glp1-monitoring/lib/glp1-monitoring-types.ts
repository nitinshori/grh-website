import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface GLP1Assessment {
  patientOnGLP1: boolean;
  medicationName: string;
  weightChangePercent: number | null;
  giTolerability: string;
  doseAdequate: boolean;
  injectionTechniqueCorrect: boolean;
  pancreatitisSymptoms: boolean;
  gallbladderSymptoms: boolean;
  severeVomiting: boolean;
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
}

export interface GLP1Counselling {
  reinforcedInjectionTechnique: boolean;
  discussedContinuation: boolean;
  counselledOnWarnings: boolean;
  offeredWrittenInfo: boolean;
}

export interface GLP1ConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: GLP1Assessment;
  counselling: GLP1Counselling;
  summary: BaseSummary;
  currentStep: number;
}

export const STEP_LABELS = ["Patient Details", "GLP-1 Assessment", "Monitoring Check", "Red Flags", "Counselling", "Clinical Notes", "Summary", "Review"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): GLP1ConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { patientOnGLP1: false, medicationName: "", weightChangePercent: null, giTolerability: "", doseAdequate: false, injectionTechniqueCorrect: false, pancreatitisSymptoms: false, gallbladderSymptoms: false, severeVomiting: false, systolicBP: null, diastolicBP: null, heartRate: null },
    counselling: { reinforcedInjectionTechnique: false, discussedContinuation: false, counselledOnWarnings: false, offeredWrittenInfo: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}

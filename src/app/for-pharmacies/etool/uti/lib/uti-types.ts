import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── UTI-Specific Data Structures ───

export interface UTISymptoms {
  dysuria: boolean;
  frequency: boolean;
  urgency: boolean;
  suprapubicPain: boolean;
  haematuria: boolean;
  vaginalDischarge: boolean;
  duration: string; // "< 3 days" | "3-7 days" | "> 7 days" | "unknown"
  additionalNotes: string;
}

export interface UTIMedicalHistory {
  pregnant: boolean;
  pregnancyPossible: boolean;
  breastfeeding: boolean;
  catheterised: boolean;
  previousUTIWithin4Weeks: boolean;
  recurrentUTI: boolean; // 3+ in 12 months
  kidneyDisease: boolean;
  renalImpairment: "none" | "moderate" | "severe";
  diabetesUncontrolled: boolean;
  immunosuppressed: boolean;
  knownAbnormalUrinaryTract: boolean;
  allergies: string;
  currentMedications: string;
}

export interface UTIObservations {
  temperature: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
}

export interface UTIMedicineSelection {
  medicine: "nitrofurantoin" | "trimethoprim" | "";
  dose: string;
  duration: string;
  quantity: number;
  pharmacistOverride: boolean;
  overrideReason: string;
}

export interface UTICounselling {
  completeCourse: boolean;
  hydrationAdvice: boolean;
  symptomsToReturn: boolean;
  avoidCranberry: boolean;
  painRelief: boolean;
  alkalinisingAgents: boolean;
  sexualActivityAdvice: boolean;
  pregnancyPrecautions: boolean;
}

// ─── UTI Consultation State ───

export interface UTIPatientDetails extends BasePatientDetails {
  femaleConfirmed: boolean;
}

export interface UTIConsultationState {
  patient: UTIPatientDetails;
  consent: BaseConsent;
  symptoms: UTISymptoms;
  medicalHistory: UTIMedicalHistory;
  observations: UTIObservations;
  medicineSelection: UTIMedicineSelection;
  counselling: UTICounselling;
  summary: BaseSummary;
}

// ─── Initial Values ───

export const initialUTISymptoms: UTISymptoms = {
  dysuria: false,
  frequency: false,
  urgency: false,
  suprapubicPain: false,
  haematuria: false,
  vaginalDischarge: false,
  duration: "",
  additionalNotes: "",
};

export const initialUTIMedicalHistory: UTIMedicalHistory = {
  pregnant: false,
  pregnancyPossible: false,
  breastfeeding: false,
  catheterised: false,
  previousUTIWithin4Weeks: false,
  recurrentUTI: false,
  kidneyDisease: false,
  renalImpairment: "none",
  diabetesUncontrolled: false,
  immunosuppressed: false,
  knownAbnormalUrinaryTract: false,
  allergies: "",
  currentMedications: "",
};

export const initialUTIObservations: UTIObservations = {
  temperature: null,
  systolicBP: null,
  diastolicBP: null,
};

export const initialUTIMedicineSelection: UTIMedicineSelection = {
  medicine: "",
  dose: "",
  duration: "",
  quantity: 0,
  pharmacistOverride: false,
  overrideReason: "",
};

export const initialUTICounselling: UTICounselling = {
  completeCourse: false,
  hydrationAdvice: false,
  symptomsToReturn: false,
  avoidCranberry: false,
  painRelief: false,
  alkalinisingAgents: false,
  sexualActivityAdvice: false,
  pregnancyPrecautions: false,
};

export const initialUTIPatientDetails = (basePatient?: Partial<BasePatientDetails>): UTIPatientDetails => ({
  firstName: basePatient?.firstName || "",
  lastName: basePatient?.lastName || "",
  dateOfBirth: basePatient?.dateOfBirth || "",
  age: basePatient?.age ?? null,
  gpName: basePatient?.gpName || "",
  gpPractice: basePatient?.gpPractice || "",
  nhsNumber: basePatient?.nhsNumber || "",
  address: basePatient?.address || "",
  phone: basePatient?.phone || "",
  email: basePatient?.email || "",
  femaleConfirmed: false,
});

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface TestosteroneWomenAssessment {
  menopausalStatus: string;
  libioDysfunction: boolean;
  onHRTDuration: number | null; // months
  hrtType: string;
  femaleConfirmed: boolean;
  ageConfirmed: boolean;
}

export interface TestosteroneWomenContraindications {
  breastCancer: boolean;
  endometrialCancer: boolean;
  activeLiverDisease: boolean;
  pregnancy: boolean;
  contraindicated: boolean;
}

export interface TestosteroneWomenPrescription {
  productName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  applicationSite: string;
}

export interface TestosteroneWomenMonitoring {
  baselineTestosteroneLevel: boolean;
  sixMonthFollowUpPlanned: boolean;
  levelsShouldRemainInFemaleRange: boolean;
  sideEffectsDiscussed: boolean;
}

export interface TestosteroneWomenConsultationSummary extends BaseSummary {
  recommendationSummary: string;
}

export interface TestosteroneWomenConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: TestosteroneWomenAssessment;
  contraindications: TestosteroneWomenContraindications;
  prescription: TestosteroneWomenPrescription;
  monitoring: TestosteroneWomenMonitoring;
  summary: TestosteroneWomenConsultationSummary;
  completedSteps: Set<number>;
}

export type TestosteroneWomenAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof TestosteroneWomenAssessment; value: unknown }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof TestosteroneWomenContraindications; value: unknown }
  | { type: "UPDATE_PRESCRIPTION"; field: keyof TestosteroneWomenPrescription; value: unknown }
  | { type: "UPDATE_MONITORING"; field: keyof TestosteroneWomenMonitoring; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof TestosteroneWomenConsultationSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = [
  "Patient Details",
  "Consent & Gender Confirmation",
  "Menopausal Assessment",
  "Contraindications Check",
  "Prescription Details",
  "Monitoring Plan",
  "Counselling & Documentation",
  "Summary & Record",
  "Consultation Complete",
];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialTestosteroneWomenState(): TestosteroneWomenConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { menopausalStatus: "", libioDysfunction: false, onHRTDuration: null, hrtType: "", femaleConfirmed: false, ageConfirmed: false },
    contraindications: { breastCancer: false, endometrialCancer: false, activeLiverDisease: false, pregnancy: false, contraindicated: false },
    prescription: { productName: "", strength: "1%", dosage: "Pea-sized amount", frequency: "Once daily", duration: "Review at 3-6 months", applicationSite: "" },
    monitoring: { baselineTestosteroneLevel: false, sixMonthFollowUpPlanned: false, levelsShouldRemainInFemaleRange: false, sideEffectsDiscussed: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", recommendationSummary: "" },
    completedSteps: new Set(),
  };
}

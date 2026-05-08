import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface RosaceaAssessment {
  subtype: string;
  severity: string;
  flushing: boolean;
  erythema: boolean;
  papulesPostules: boolean;
  triggersIdentified: string;
}

export interface RosaceaContraindications {
  pregnancy: boolean;
  underEighteen: boolean;
  contraindicated: boolean;
}

export interface RosaceaTreatment {
  product: string;
  strength: string;
  frequency: string;
  duration: string;
}

export interface RosaceaCounselling {
  sunProtectionAdvised: boolean;
  triggerAvoidanceAdvised: boolean;
  skinCareAdvised: boolean;
  completeCourseImportant: boolean;
}

export interface RosaceaConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: RosaceaAssessment;
  contraindications: RosaceaContraindications;
  treatment: RosaceaTreatment;
  counselling: RosaceaCounselling;
  summary: BaseSummary;
  completedSteps: Set<number>;
}

export type RosaceaAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof RosaceaAssessment; value: unknown }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof RosaceaContraindications; value: unknown }
  | { type: "UPDATE_TREATMENT"; field: keyof RosaceaTreatment; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof RosaceaCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = ["Patient Details", "Consent", "Rosacea Assessment", "Contraindications", "Treatment Selection", "Counselling", "Summary & Record", "Consultation Complete"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialRosaceaState(): RosaceaConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { subtype: "", severity: "", flushing: false, erythema: false, papulesPostules: false, triggersIdentified: "" },
    contraindications: { pregnancy: false, underEighteen: false, contraindicated: false },
    treatment: { product: "", strength: "", frequency: "", duration: "12-16 weeks" },
    counselling: { sunProtectionAdvised: false, triggerAvoidanceAdvised: false, skinCareAdvised: false, completeCourseImportant: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    completedSteps: new Set(),
  };
}

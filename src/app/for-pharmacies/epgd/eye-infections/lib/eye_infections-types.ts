import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface EyeInfectionsState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  summary: BaseSummary;
}

export type EyeInfectionsAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number };

export const STEP_LABELS = ["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary & Record", "Consultation Complete"];
export const TOTAL_STEPS = 7;

export function createInitialEyeInfectionsState() {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
  };
}

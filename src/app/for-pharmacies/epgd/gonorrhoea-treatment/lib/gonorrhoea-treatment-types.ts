import { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface Gonorrhoea_TreatmentAssessment {
  // Assessment fields for Gonorrhoea Treatment
}

export interface Gonorrhoea_TreatmentCounselling {
  counsellingCompleted: boolean;
}

export interface Gonorrhoea_TreatmentConsultationState {
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: Gonorrhoea_TreatmentAssessment;
  counselling: Gonorrhoea_TreatmentCounselling;
  summary: BaseSummary;
  currentStep: number;
}

export const STEP_LABELS = ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6", "Step 7", "Step 8"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): Gonorrhoea_TreatmentConsultationState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {},
    counselling: { counsellingCompleted: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    currentStep: 0,
  };
}

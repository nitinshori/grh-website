import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface BVAssessment {
  thinGrayishDischarge: boolean;
  fishyOdour: boolean;
  odourWorseSexOrMenses: boolean;
  itching: boolean;
  soreness: boolean;
  dysuria: boolean;
  dyspareunia: boolean;
  bloodStainedDischarge: boolean;
  fever: boolean;
  pelvicPain: boolean;
}

export interface BVMedicalHistory {
  pregnancy: boolean;
  firstEpisode: boolean;
  recurrentBV: boolean;
  activePelvicInflammation: boolean;
  planningPregnancy: boolean;
}

export interface BVMedications {
  warfarin: boolean;
  alcohol: boolean;
  otherMedications: string;
  allergies: string;
}

export interface BVMedicineSelection {
  medicineChoice: string; // "metronidazole-400" | "metronidazole-2g" | "metronidazole-gel"
  duration: string;
}

export interface BVCounselling {
  symptomsExplained: boolean;
  differentiateThrush: boolean;
  noAlcoholAdvice: boolean;
  avoidDouching: boolean;
  completesCourse: boolean;
  notSTI: boolean;
  recurrenceAdvice: boolean;
  sexPartnerAdvice: boolean;
}

export interface BVConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: BVAssessment;
  medicalHistory: BVMedicalHistory;
  medications: BVMedications;
  medicineSelection: BVMedicineSelection;
  counselling: BVCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type BVAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICATIONS"; field: string; value: any }
  | { type: "UPDATE_MEDICINE_SELECTION"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = ["Patient Details", "Consent", "Symptom Assessment", "Medical History", "Contraindications", "Medicine Selection", "Counselling", "Summary"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): BVConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { thinGrayishDischarge: false, fishyOdour: false, odourWorseSexOrMenses: false, itching: false, soreness: false, dysuria: false, dyspareunia: false, bloodStainedDischarge: false, fever: false, pelvicPain: false },
    medicalHistory: { pregnancy: false, firstEpisode: false, recurrentBV: false, activePelvicInflammation: false, planningPregnancy: false },
    medications: { warfarin: false, alcohol: false, otherMedications: "", allergies: "" },
    medicineSelection: { medicineChoice: "", duration: "5-7 days" },
    counselling: { symptomsExplained: false, differentiateThrush: false, noAlcoholAdvice: false, avoidDouching: false, completesCourse: false, notSTI: false, recurrenceAdvice: false, sexPartnerAdvice: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    alerts: [],
    doseRecommendation: null,
  };
}

import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface ThrushAssessment {
  vulvalItching: boolean;
  vulvalSoreness: boolean;
  thickWhiteDischarge: boolean;
  dysuria: boolean;
  dyspareunia: boolean;
  bloodStainedDischarge: boolean;
  offensiveSmell: boolean;
  fever: boolean;
  pelvicPain: boolean;
  recurrentEpisodes: number | null;
}

export interface ThrushMedicalHistory {
  diabetes: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  immunocompromised: boolean;
  ageUnder16: boolean;
  ageOver60: boolean;
  firstEpisode: boolean;
  recurrentThrush: boolean;
}

export interface ThrushMedications {
  warfarin: boolean;
  otherMedications: string;
  allergies: string;
}

export interface ThrushMedicineSelection {
  medicineChoice: string; // "fluconazole-oral" | "clotrimazole-pessary"
  dose: string;
  frequency: string;
}

export interface ThrushCounselling {
  typicalSymptoms: boolean;
  avoidPerfumedProducts: boolean;
  cottonUnderwear: boolean;
  completesTreatment: boolean;
  timelineToRelief: boolean;
  sexualContacts: boolean;
  recurrenceAdvice: boolean;
}

export interface ThrushConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: ThrushAssessment;
  medicalHistory: ThrushMedicalHistory;
  medications: ThrushMedications;
  medicineSelection: ThrushMedicineSelection;
  counselling: ThrushCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type ThrushAction =
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

export function createInitialConsultationState(): ThrushConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { vulvalItching: false, vulvalSoreness: false, thickWhiteDischarge: false, dysuria: false, dyspareunia: false, bloodStainedDischarge: false, offensiveSmell: false, fever: false, pelvicPain: false, recurrentEpisodes: null },
    medicalHistory: { diabetes: false, pregnancy: false, breastfeeding: false, immunocompromised: false, ageUnder16: false, ageOver60: false, firstEpisode: false, recurrentThrush: false },
    medications: { warfarin: false, otherMedications: "", allergies: "" },
    medicineSelection: { medicineChoice: "", dose: "", frequency: "" },
    counselling: { typicalSymptoms: false, avoidPerfumedProducts: false, cottonUnderwear: false, completesTreatment: false, timelineToRelief: false, sexualContacts: false, recurrenceAdvice: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    alerts: [],
    doseRecommendation: null,
  };
}

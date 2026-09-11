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
  femaleConfirmed: boolean; // PGD: women aged 16 to 65
  pregnancy: boolean; // known or suspected: PGD is for non-pregnant women
  breastfeeding: boolean; // caution, both arms
  firstEpisode: boolean;
  recurrentBV: boolean;
  activePelvicInflammation: boolean;
  planningPregnancy: boolean;
  hypersensitivity: boolean; // metronidazole or nitroimidazoles: exclusion, both arms
  hepaticImpairment: boolean; // caution (oral)
  renalImpairment: boolean; // caution (oral)
  cnsDiseaseOrBloodDyscrasia: boolean; // exclusion (oral)
}

export interface BVMedications {
  warfarin: boolean;
  alcohol: boolean; // current alcohol consumption: exclusion (oral arm)
  lithium: boolean; // exclusion (oral arm)
  disulfiram: boolean; // exclusion (oral arm)
  phenytoin: boolean; // caution (oral arm)
  otherMedications: string;
  allergies: string;
}

export type BVMedicineChoice = "" | "metronidazole-400" | "metronidazole-2g" | "metronidazole-gel";

export interface BVMedicineSelection {
  medicineChoice: BVMedicineChoice;
  duration: string;
  abilityConfirmed: boolean; // oral: able to swallow tablets; gel: able to insert gel intravaginally
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
  latexAdvice: boolean; // gel may damage latex condoms and diaphragms; alternative contraception during treatment and for 5 days after
  seekAdviceIfNotResolved: boolean; // no resolution within 5 to 7 days of completing treatment, or new symptoms (pelvic pain, fever)
}

export const PGD_VERSION_LABEL =
  "Bacterial Vaginosis PGD (metronidazole 400 mg tablets / 0.75% vaginal gel), version 003, issued 11 September 2026";

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
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { thinGrayishDischarge: false, fishyOdour: false, odourWorseSexOrMenses: false, itching: false, soreness: false, dysuria: false, dyspareunia: false, bloodStainedDischarge: false, fever: false, pelvicPain: false },
    medicalHistory: { femaleConfirmed: false, pregnancy: false, breastfeeding: false, firstEpisode: false, recurrentBV: false, activePelvicInflammation: false, planningPregnancy: false, hypersensitivity: false, hepaticImpairment: false, renalImpairment: false, cnsDiseaseOrBloodDyscrasia: false },
    medications: { warfarin: false, alcohol: false, lithium: false, disulfiram: false, phenytoin: false, otherMedications: "", allergies: "" },
    medicineSelection: { medicineChoice: "", duration: "5-7 days", abilityConfirmed: false },
    counselling: { symptomsExplained: false, differentiateThrush: false, noAlcoholAdvice: false, avoidDouching: false, completesCourse: false, notSTI: false, recurrenceAdvice: false, sexPartnerAdvice: false, latexAdvice: false, seekAdviceIfNotResolved: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    alerts: [],
    doseRecommendation: null,
  };
}

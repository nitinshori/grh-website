import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface PeriodDelayAssessment {
  reasonForDelay: string; // "holiday" | "event" | "religious" | "other"
  reasonDetails: string;
  lastPeriodDate: string;
  cycleRegular: boolean;
  daysUntilExpected: number | null;
  previousUse: boolean;
  previousIssues: string;
}

export interface PeriodDelayMedicalHistory {
  pregnancy: boolean;
  breastfeeding: boolean;
  liverDisease: boolean;
  historyOfDVT: boolean;
  historyOfPE: boolean;
  historyOfStroke: boolean;
  activeBreastCancer: boolean;
  severeArterialDisease: boolean;
  porphyria: boolean;
  abnormalVaginalBleeding: boolean;
  hormonalContraception: boolean;
  hormonalContraceptionType: string;
  ageUnder16: boolean;
  // ── PGD v002 venous thromboembolism gate ──────────────────────────────
  // v001 listed these as risk factors and then asked only that the supplier
  // "assess individual risk factors", which gates nothing and is not
  // auditable. At 5mg three times daily a clinically significant proportion
  // of norethisterone is metabolised to ethinylestradiol, so the VTE risk
  // sits closer to a combined oral contraceptive than to a POP. They are
  // exclusions in v002.
  familyVteUnder45: boolean;
  currentSmoker: boolean;
  heightCm: number | null;
  weightKg: number | null;
  /** Journey of 4+ hours seated, during the course or within 2 weeks after. */
  longJourney: boolean;
  recentOrPlannedSurgery: boolean;
  immobility: boolean;
  activeOrRecentCancer: boolean;
  migraineWithAura: boolean;
  enzymeInducer: boolean;
  /** 16 or 17: competence and safeguarding assessed and satisfied. */
  under18AssessmentDone: boolean;
  safeguardingConcern: boolean;
}

export interface PeriodDelayMedications {
  anticoagulants: boolean;
  antiepileptics: boolean;
  ciclosporin: boolean;
  otherMedications: string;
  allergies: string;
}

export interface PeriodDelayMedicineSelection {
  confirmed: boolean;
  daysToDelay: number | null;
  startDate: string;
}

export interface PeriodDelayCounselling {
  howToTake: boolean;
  startThreeDaysBefore: boolean;
  maxDuration: boolean;
  periodReturnsAfter: boolean;
  sideEffects: boolean;
  notContraceptive: boolean;
  seekHelpIfUnwell: boolean;
}

export interface PeriodDelayConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: PeriodDelayAssessment;
  medicalHistory: PeriodDelayMedicalHistory;
  medications: PeriodDelayMedications;
  medicineSelection: PeriodDelayMedicineSelection;
  counselling: PeriodDelayCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type PeriodDelayAction =
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

export const STEP_LABELS = ["Patient Details", "Consent", "Assessment", "Medical History", "Contraindications", "Treatment Plan", "Counselling", "Summary"];
export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): PeriodDelayConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: { reasonForDelay: "", reasonDetails: "", lastPeriodDate: "", cycleRegular: false, daysUntilExpected: null, previousUse: false, previousIssues: "" },
    medicalHistory: { pregnancy: false, breastfeeding: false, liverDisease: false, historyOfDVT: false, historyOfPE: false, historyOfStroke: false, activeBreastCancer: false, severeArterialDisease: false, porphyria: false, abnormalVaginalBleeding: false, hormonalContraception: false, hormonalContraceptionType: "", ageUnder16: false, familyVteUnder45: false, currentSmoker: false, heightCm: null, weightKg: null, longJourney: false, recentOrPlannedSurgery: false, immobility: false, activeOrRecentCancer: false, migraineWithAura: false, enzymeInducer: false, under18AssessmentDone: false, safeguardingConcern: false },
    medications: { anticoagulants: false, antiepileptics: false, ciclosporin: false, otherMedications: "", allergies: "" },
    medicineSelection: { confirmed: false, daysToDelay: null, startDate: "" },
    counselling: { howToTake: false, startThreeDaysBefore: false, maxDuration: false, periodReturnsAfter: false, sideEffects: false, notContraceptive: false, seekHelpIfUnwell: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    alerts: [],
    doseRecommendation: null,
  };
}

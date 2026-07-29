import {
  BasePatientDetails,
  BaseConsent,
  BaseSummary,
  ClinicalAlert,
  DoseRecommendation,
  initialPatientDetails,
  initialConsent,
  initialSummary,
} from "../../shared/types";

/**
 * Skin Infection ePGD — flucloxacillin first line, clarithromycin if
 * penicillin-allergic, doxycycline (12+) as alternative. Built from the
 * PPH-signed PGD (J. Wilkins / C. Pilkington): mild-to-moderate bacterial
 * skin infections (impetigo, folliculitis, infected eczema, infected
 * wounds, mild cellulitis/erysipelas) in adults and children aged 2+.
 */

export interface SkinInfectionPatientDetails extends BasePatientDetails {}
export interface SkinInfectionConsent extends BaseConsent {}

export interface SkinInfectionAssessment {
  infectionType:
    | "impetigo"
    | "folliculitis"
    | "infected-eczema"
    | "infected-wound"
    | "cellulitis"
    | "";
  severity: "mild" | "moderate" | "severe" | "";
  affectedSite: string;
  durationDays: string;
  spreadingRapidly: boolean;
  systemicSymptoms: boolean; // fever, rigors, malaise — suggests IV/sepsis
  abscessSuspected: boolean; // needs drainage / surgical review
}

export interface SkinInfectionMedicalHistory {
  allergies: string; // free-text allergy record (required)
  penicillinAllergy: boolean;
  macrolideAllergy: boolean;
  tetracyclineAllergy: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  immunosuppressed: boolean;
  flucloxHepaticHistory: boolean; // previous flucloxacillin jaundice / hepatic dysfunction
  severeRenalImpairment: boolean; // CrCl < 10 ml/min
  interactingMedicines: boolean; // clinically significant interaction on checking
  recentAntibioticsOrHospital: boolean; // C. difficile risk
  regularParacetamol: boolean; // HAGMA risk with flucloxacillin
  takesStatin: boolean; // simvastatin/atorvastatin interaction with clarithromycin
  currentMedicines: string;
}

export interface SkinInfectionAntibioticSelection {
  choice: "flucloxacillin" | "clarithromycin" | "doxycycline" | "";
  formulation: string;
  courseDays: "5" | "7" | "";
  quantitySupplied: string;
  rationale: string;
}

export interface SkinInfectionCounselling {
  completeCourse: boolean;
  administrationAdvice: boolean; // drug-specific: empty stomach / upright with water / with or after food
  sideEffects: boolean;
  worseningAdvice: boolean; // return / seek help if worse or no better in 2-3 days
  sunProtection: boolean; // doxycycline only
}

export interface SkinInfectionSummary extends BaseSummary {
  antibioticSupplied: string;
  courseLength: string;
}

export interface SkinInfectionConsultationState {
  patient: SkinInfectionPatientDetails;
  consent: SkinInfectionConsent;
  assessment: SkinInfectionAssessment;
  medicalHistory: SkinInfectionMedicalHistory;
  antibioticSelection: SkinInfectionAntibioticSelection;
  counselling: SkinInfectionCounselling;
  summary: SkinInfectionSummary;
  currentStep: number;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type SkinInfectionAction =
  | { type: "UPDATE_PATIENT"; field: keyof SkinInfectionPatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof SkinInfectionConsent; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: keyof SkinInfectionAssessment; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof SkinInfectionMedicalHistory; value: any }
  | { type: "UPDATE_ANTIBIOTIC_SELECTION"; field: keyof SkinInfectionAntibioticSelection; value: any }
  | { type: "UPDATE_COUNSELLING"; field: keyof SkinInfectionCounselling; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof SkinInfectionSummary; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Infection Assessment",
  "Medical History",
  "Antibiotic Selection",
  "Counselling",
  "Summary",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialConsultationState(): SkinInfectionConsultationState {
  return {
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    assessment: {
      infectionType: "",
      severity: "",
      affectedSite: "",
      durationDays: "",
      spreadingRapidly: false,
      systemicSymptoms: false,
      abscessSuspected: false,
    },
    medicalHistory: {
      allergies: "",
      penicillinAllergy: false,
      macrolideAllergy: false,
      tetracyclineAllergy: false,
      pregnant: false,
      breastfeeding: false,
      immunosuppressed: false,
      flucloxHepaticHistory: false,
      severeRenalImpairment: false,
      interactingMedicines: false,
      recentAntibioticsOrHospital: false,
      regularParacetamol: false,
      takesStatin: false,
      currentMedicines: "",
    },
    antibioticSelection: {
      choice: "",
      formulation: "",
      courseDays: "",
      quantitySupplied: "",
      rationale: "",
    },
    counselling: {
      completeCourse: false,
      administrationAdvice: false,
      sideEffects: false,
      worseningAdvice: false,
      sunProtection: false,
    },
    summary: {
      ...initialSummary(),
      antibioticSupplied: "",
      courseLength: "",
    },
    currentStep: 0,
    alerts: [],
    doseRecommendation: null,
  };
}

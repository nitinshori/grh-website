// ─── Postnatal Contraception POP ePGD Types ───

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

// ─── Postnatal Contraception-Specific Types ───

// Postnatal Contraception PGD v004 (11 September 2026). Two arms:
// desogestrel 75 microgram tablets (women 16 and over, any time postpartum)
// and medroxyprogesterone acetate 150 mg/mL injection, Depo-Provera (women
// 18 and over; from 6 weeks if breastfeeding, from 21 days if not
// breastfeeding and no additional VTE risk factor).
export const PGD_VERSION_LABEL =
  "Postnatal Contraception PGD (desogestrel 75 micrograms / Depo-Provera 150 mg), version 004, issued 11 September 2026";

export type PostnatalMedicineChoice = "" | "desogestrel" | "depo-provera";

export interface PostnatalAssessment {
  weeksPostpartum: number; // derived from daysPostpartum for display
  daysPostpartum: number | null;
  deliveryType: string;
  breastfeedingStatus: string;
  vteRiskAssessment: string; // legacy free field, no longer required
  // Additional VTE risk factors named in the Depo-Provera inclusion criteria
  previousVte: boolean;
  thrombophilia: boolean;
  immobility: boolean;
  bmi30OrOver: boolean;
  postpartumHaemorrhage: boolean;
  preEclampsia: boolean;
  smoking: boolean;
  // From day 21 pregnancy must be reasonably excluded
  unprotectedSexSinceDay21: boolean;
  negativeTest21DaysAfterLastUpsi: boolean;
}

export interface PostnatalMedicalHistory {
  knownOrSuspectedPregnancy: boolean; // exclusion, both arms
  currentBreastCancer: boolean; // exclusion, both arms
  severeLiverDisease: boolean; // exclusion, both arms
  unexplainedVaginalBleeding: boolean; // exclusion, both arms
  porphyria: boolean;
  pastBreastCancer: boolean; // caution (more than 5 years ago)
  liverTumours: boolean; // desogestrel exclusion
  sleWithAntiphospholipidAntibodies: boolean;
  activeThromboembolicDisorder: boolean; // desogestrel exclusion
  desogestrelHypersensitivity: boolean; // desogestrel exclusion
  mpaHypersensitivity: boolean; // Depo-Provera exclusion
  severeCardiovascularDisease: boolean; // Depo-Provera exclusion
  meningioma: boolean; // current or previous: Depo-Provera exclusion
  functionalOvarianCysts: boolean; // caution
  diabetes: boolean; // caution
  hypertension: boolean; // caution
  migraine: boolean; // caution
  depression: boolean; // caution
}

export interface PostnatalMedicineSupply {
  medicineChoice: PostnatalMedicineChoice;
  medicine: string;
  doseStrength: string;
  quantity: number; // desogestrel: tablets supplied (up to 84)
  startDate: string;
  administeredBy: string;
  // Depo-Provera administration record
  injectionSite: "" | "gluteal" | "deltoid";
  batchNumber: string;
  expiryDate: string;
  nextInjectionDue: string;
}

export interface PostnatalCounselling {
  timingAdvice: boolean;
  dailyTakingAdvice: boolean;
  breakThroughBleedingAdvice: boolean;
  breastfeedingCompatibilityAdvice: boolean;
  stiAdvice: boolean;
  emergencyContactAdvice: boolean;
  sideEffectsExplained: boolean;
  pillfreeIntervalAdvice: boolean;
  extraPrecautionsAdvice: boolean; // desogestrel started after day 21: barrier method for 2 days (SmPC 7 days)
  dvtPeAdvice: boolean; // seek immediate attention for calf pain, swelling, breathlessness
  unexpectedBleedingAdvice: boolean; // report any unexpected vaginal bleeding
  longerTermOptionsAdvice: boolean;
  depoFertilityAdvice: boolean; // fertility may take 5 to 6 months to return
  depoRepeatAdvice: boolean; // repeat injection every 12 weeks
}

export interface PostnatalContraceptionState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: PostnatalAssessment;
  medicalHistory: PostnatalMedicalHistory;
  medicineSupply: PostnatalMedicineSupply;
  counselling: PostnatalCounselling;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type PostnatalContraceptionAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof PostnatalAssessment; value: unknown }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: keyof PostnatalMedicalHistory; value: unknown }
  | { type: "UPDATE_MEDICINE_SUPPLY"; field: keyof PostnatalMedicineSupply; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof PostnatalCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Postnatal Assessment",
  "Medical History",
  "Contraindications",
  "Medicine Supply",
  "Counselling",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State ───

export function createInitialPostnatalContraceptionState(): PostnatalContraceptionState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    assessment: {
      weeksPostpartum: 0,
      daysPostpartum: null,
      deliveryType: "",
      breastfeedingStatus: "",
      vteRiskAssessment: "",
      previousVte: false,
      thrombophilia: false,
      immobility: false,
      bmi30OrOver: false,
      postpartumHaemorrhage: false,
      preEclampsia: false,
      smoking: false,
      unprotectedSexSinceDay21: false,
      negativeTest21DaysAfterLastUpsi: false,
    },
    medicalHistory: {
      knownOrSuspectedPregnancy: false,
      currentBreastCancer: false,
      severeLiverDisease: false,
      unexplainedVaginalBleeding: false,
      porphyria: false,
      pastBreastCancer: false,
      liverTumours: false,
      sleWithAntiphospholipidAntibodies: false,
      activeThromboembolicDisorder: false,
      desogestrelHypersensitivity: false,
      mpaHypersensitivity: false,
      severeCardiovascularDisease: false,
      meningioma: false,
      functionalOvarianCysts: false,
      diabetes: false,
      hypertension: false,
      migraine: false,
      depression: false,
    },
    medicineSupply: {
      medicineChoice: "",
      medicine: "",
      doseStrength: "",
      quantity: 0,
      startDate: "",
      administeredBy: "",
      injectionSite: "",
      batchNumber: "",
      expiryDate: "",
      nextInjectionDue: "",
    },
    counselling: {
      timingAdvice: false,
      dailyTakingAdvice: false,
      breakThroughBleedingAdvice: false,
      breastfeedingCompatibilityAdvice: false,
      stiAdvice: false,
      emergencyContactAdvice: false,
      sideEffectsExplained: false,
      pillfreeIntervalAdvice: false,
      extraPrecautionsAdvice: false,
      dvtPeAdvice: false,
      unexpectedBleedingAdvice: false,
      longerTermOptionsAdvice: false,
      depoFertilityAdvice: false,
      depoRepeatAdvice: false,
    },
    summary: initialSummary(),
    alerts: [],
    doseRecommendation: null,
  };
}

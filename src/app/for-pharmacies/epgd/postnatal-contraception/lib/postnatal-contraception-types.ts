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

// Postnatal Contraception PGD v005 (11 September 2026). Two arms:
// desogestrel 75 microgram tablets (women 16 and over, any time postpartum)
// and medroxyprogesterone acetate 150 mg/mL injection, Depo-Provera (women
// 18 and over; from 6 weeks if breastfeeding, from 21 days if not
// breastfeeding and no additional VTE risk factor).
export const PGD_VERSION_LABEL =
  "Postnatal Contraception PGD (desogestrel 75 micrograms / Depo-Provera 150 mg), version 005, issued 11 September 2026";

export type PostnatalMedicineChoice = "" | "desogestrel" | "depo-provera";

export interface PostnatalAssessment {
  deliveryDate: string; // YYYY-MM-DD: the document's assessment list starts with the delivery date
  weeksPostpartum: number; // derived from daysPostpartum for display
  daysPostpartum: number | null; // derived from deliveryDate, never typed
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
  // From day 21 pregnancy must be reasonably excluded. Asked as yes/no with
  // no default: an unanswered question is not a "no".
  unprotectedSexSinceDay21: boolean | null;
  negativeTest21DaysAfterLastUpsi: boolean;
}

export interface PostnatalMedicalHistory {
  knownOrSuspectedPregnancy: boolean; // exclusion, both arms
  currentBreastCancer: boolean; // exclusion, both arms
  severeLiverDisease: boolean; // exclusion, both arms
  unexplainedVaginalBleeding: boolean; // exclusion, both arms
  porphyria: boolean; // not in the PGD: caution only
  pastBreastCancer: boolean; // caution (more than 5 years ago)
  breastCancerWithin5Years: boolean; // past breast cancer treated within the last 5 years: UKMEC 3, refer
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
  exclusionsAsked: boolean; // pharmacist attests every exclusion and caution above was asked and recorded
}

export interface PostnatalMedicineSupply {
  medicineChoice: PostnatalMedicineChoice;
  medicine: string;
  doseStrength: string;
  quantity: number; // desogestrel: tablets supplied (up to 84)
  startDate: string;
  administeredBy: string;
  ukmecConfirmed: boolean; // inclusion criterion: UKMEC 2025 category 1 or 2 for the chosen method
  // Depo-Provera administration record
  injectionType: "" | "first" | "repeat";
  lastInjectionDate: string; // repeat only: the dose row is every 12 weeks plus or minus 5 days
  lateRepeatPregnancyExcluded: boolean; // repeat beyond 89 days: pregnancy reasonably excluded
  lateRepeatBarrierAdvised: boolean; // repeat beyond 89 days: barrier method for 7 days advised
  injectionSite: "" | "gluteal" | "deltoid";
  batchNumber: string;
  expiryDate: string;
  nextInjectionDue: string; // derived: date of injection plus 84 days
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
      deliveryDate: "",
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
      unprotectedSexSinceDay21: null,
      negativeTest21DaysAfterLastUpsi: false,
    },
    medicalHistory: {
      knownOrSuspectedPregnancy: false,
      currentBreastCancer: false,
      severeLiverDisease: false,
      unexplainedVaginalBleeding: false,
      porphyria: false,
      pastBreastCancer: false,
      breastCancerWithin5Years: false,
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
      exclusionsAsked: false,
    },
    medicineSupply: {
      medicineChoice: "",
      medicine: "",
      doseStrength: "",
      quantity: 0,
      startDate: "",
      administeredBy: "",
      ukmecConfirmed: false,
      injectionType: "",
      lastInjectionDate: "",
      lateRepeatPregnancyExcluded: false,
      lateRepeatBarrierAdvised: false,
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

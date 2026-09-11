import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

export interface SleepMelatoninAssessment {
  sleepOnsetIssue: boolean;
  sleepMaintenanceIssue: boolean;
  // PGD v007: poor quality of sleep of at least 4 weeks' duration. Under 4
  // weeks is an exclusion (give sleep hygiene advice and review).
  durationOfInsomnia: string; // "less4w", "4w-3m", "3-12m", "over12m"
  daytimeFunctioningAffected: boolean;
  daytimeImpact: string;
  // Sleep hygiene: advice given (Appendix 1) is an inclusion criterion;
  // what the patient had already tried is a required record.
  sleepHygieneAttempted: boolean;
  sleepHygieneAdviceGiven: boolean;
  sleepHygieneTried: string;
  ageConfirmed: boolean;
  // Previous Circadin supply and total weeks of treatment to date (record).
  // The weeks are parsed as a number and enforced: 13 or more is a stop,
  // and the quantity is capped so the course cannot exceed 13 weeks.
  previousCircadin: boolean;
  weeksTreatedToDate: string;
  /** Date of the most recent Circadin supply (YYYY-MM-DD). */
  lastSupplyDate: string;
  /** Is this a continuation of the current course, or was the previous
   *  course completed or stopped? A completed course within the last 6
   *  months is an exclusion. */
  previousCourseStatus: "" | "continuing" | "completed";
}

/**
 * Secondary-cause history required by PGD v007. Each item must be asked and
 * recorded; any present means the insomnia is likely secondary: refer, do
 * not supply.
 */
export interface SleepMelatoninSecondaryCauses {
  historyTaken: boolean;
  lowMoodOrMentalHealth: boolean;
  snoringDaytimeSleepiness: boolean;
  painDisturbingSleep: boolean;
  restlessLegs: boolean;
  nocturia: boolean;
  shiftWork: boolean;
  alcoholToSleep: boolean;
  caffeineNotAddressed: boolean;
  medicineCausingInsomnia: boolean;
}

export interface SleepMelatoninContraindications {
  autoimmuneDiseaseActive: boolean;
  hepaticImpairment: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  // PGD v007 exclusions
  hypersensitivity: boolean;
  fluvoxamine: boolean;
  hypnoticOrSedative: boolean;
  methoxypsoralen: boolean;
  lactoseIntolerance: boolean;
  renalImpairmentNotMildStable: boolean;
  previousCourseWithin6Months: boolean;
  // Cautions (warn, counsel, consider referral)
  cyp1a2Inhibitor: boolean;
  /**
   * Decision 56 (11 Sep 2026): a patient on cimetidine, an oestrogen or a
   * quinolone is REFERRED where they are also at risk of falls or take another
   * sedating medicine; otherwise the caution stands. Only read when
   * cyp1a2Inhibitor is ticked.
   */
  cyp1a2InhibitorFallsRisk: boolean;
  cyp1a2InhibitorOtherSedative: boolean;
  cyp1a2Inducer: boolean;
  contraindicated: boolean;
}

export interface SleepMelatoninPrescription {
  product: string;
  dose: string;
  frequency: string;
  duration: string;
  // Up to 21 tablets per supply (three weeks)
  quantityTablets: number | null;
}

export interface SleepMelatoninCounselling {
  sleepHygieneReinforcedFirstLine: boolean;
  avoidScreensAdvised: boolean;
  notASedativeExplained: boolean;
  // PGD v007 counselling and required records
  takeAfterFoodSwallowWhole: boolean;
  drowsinessDrivingAdvised: boolean;
  alcoholAdvised: boolean;
  shortCourse13Weeks: boolean;
  whenToSeekAdvice: boolean;
}

export interface SleepMelatoninConsultationSummary extends BaseSummary {
  recommendationSummary: string;
}

export interface SleepMelatoninConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  assessment: SleepMelatoninAssessment;
  secondaryCauses: SleepMelatoninSecondaryCauses;
  contraindications: SleepMelatoninContraindications;
  prescription: SleepMelatoninPrescription;
  counselling: SleepMelatoninCounselling;
  summary: SleepMelatoninConsultationSummary;
  completedSteps: Set<number>;
}

export type SleepMelatoninAction =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_ASSESSMENT"; field: keyof SleepMelatoninAssessment; value: unknown }
  | { type: "UPDATE_SECONDARY_CAUSES"; field: keyof SleepMelatoninSecondaryCauses; value: unknown }
  | { type: "UPDATE_CONTRAINDICATIONS"; field: keyof SleepMelatoninContraindications; value: unknown }
  | { type: "UPDATE_PRESCRIPTION"; field: keyof SleepMelatoninPrescription; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof SleepMelatoninCounselling; value: unknown }
  | { type: "UPDATE_SUMMARY"; field: keyof SleepMelatoninConsultationSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" };

export const STEP_LABELS = ["Patient Details", "Consent", "Sleep Assessment", "Contraindications", "Prescription", "Counselling", "Summary & Record", "Consultation Complete"];

export const TOTAL_STEPS = STEP_LABELS.length;

export function createInitialSleepMelatoninState(): SleepMelatoninConsultationState {
  return {
    currentStep: 0,
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      sleepOnsetIssue: false,
      sleepMaintenanceIssue: false,
      durationOfInsomnia: "",
      daytimeFunctioningAffected: false,
      daytimeImpact: "",
      sleepHygieneAttempted: false,
      sleepHygieneAdviceGiven: false,
      sleepHygieneTried: "",
      ageConfirmed: false,
      previousCircadin: false,
      weeksTreatedToDate: "",
      lastSupplyDate: "",
      previousCourseStatus: "",
    },
    secondaryCauses: {
      historyTaken: false,
      lowMoodOrMentalHealth: false,
      snoringDaytimeSleepiness: false,
      painDisturbingSleep: false,
      restlessLegs: false,
      nocturia: false,
      shiftWork: false,
      alcoholToSleep: false,
      caffeineNotAddressed: false,
      medicineCausingInsomnia: false,
    },
    contraindications: {
      autoimmuneDiseaseActive: false,
      hepaticImpairment: false,
      pregnancy: false,
      breastfeeding: false,
      hypersensitivity: false,
      fluvoxamine: false,
      hypnoticOrSedative: false,
      methoxypsoralen: false,
      lactoseIntolerance: false,
      renalImpairmentNotMildStable: false,
      previousCourseWithin6Months: false,
      cyp1a2Inhibitor: false,
      cyp1a2InhibitorFallsRisk: false,
      cyp1a2InhibitorOtherSedative: false,
      cyp1a2Inducer: false,
      contraindicated: false,
    },
    prescription: {
      product: "Circadin 2mg prolonged-release tablets (melatonin), PLGB 52348/0002",
      dose: "2mg (one tablet), not titrated",
      frequency: "Once daily, 1 to 2 hours before bedtime and after food; swallow whole",
      duration: "Maximum 13 weeks in total; no further supply under this PGD within 6 months of completing a course",
      quantityTablets: null,
    },
    counselling: {
      sleepHygieneReinforcedFirstLine: false,
      avoidScreensAdvised: false,
      notASedativeExplained: false,
      takeAfterFoodSwallowWhole: false,
      drowsinessDrivingAdvised: false,
      alcoholAdvised: false,
      shortCourse13Weeks: false,
      whenToSeekAdvice: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", recommendationSummary: "" },
    completedSteps: new Set(),
  };
}

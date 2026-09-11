import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

export interface PeriodDelayAssessment {
  reasonForDelay: string; // "holiday" | "event" | "religious" | "other"
  reasonDetails: string;
  lastPeriodDate: string;
  cycleRegular: boolean;
  /**
   * The date the next period is due, DD/MM/YYYY, as the patient gives it.
   *
   * Asked because norethisterone has to START 3 DAYS BEFORE the period is
   * due, so the date is the number the consultation actually turns on. The
   * tool used to ask only for "estimated days until next expected period"
   * and then ask the pharmacist to type a planned start date separately,
   * which is the same arithmetic done twice, by hand, with nothing checking
   * that the two agreed. Raised by an adopting pharmacy.
   */
  expectedPeriodDate: string;
  /** Derived from expectedPeriodDate. Kept because the alerts read it. */
  daysUntilExpected: number | null;
  previousUse: boolean;
  previousIssues: string;
  /** PGD v009 records the dates the delay is needed for. */
  datesNeededFor: string;
  /** PGD v009: previous supplies for period delay in the last 6 months.
   *  Twice already excludes; total treatment must not exceed 30 days in 6 months. */
  previousSuppliesLast6Months: "" | "0" | "1" | "2+";
  daysSuppliedLast6Months: number | null;
  // Excluding pregnancy, PGD v009: the two questions, and the test where needed.
  lastPeriodNormalOnTime: boolean;
  noUnprotectedSexSince: boolean;
  pregnancyTestNegative: boolean;
  pregnancyTestDate: string;
  /** Date of the last unprotected sex, DD/MM/YYYY: the test must be no earlier than 21 days after it. */
  lastUpsiDate: string;
}

/**
 * Appendix 1 asks eight questions and the document requires the answers to
 * be recorded, not only the outcome. Each is tri-state: null is "not asked",
 * which is not a "no". Question 4 is height and weight (numeric, required).
 * Question 1 is one field per condition (DVT, PE, stroke or TIA, MI or
 * arterial disease) so the alert names the condition actually reported.
 */
export type Appendix1Key =
  | "q1Dvt"
  | "q1Pe"
  | "q1Stroke"
  | "q1Arterial"
  | "q2Thrombophilia"
  | "q3CurrentSmoker"
  | "q3StoppedUnderOneYear"
  | "q5LongJourney"
  | "q6Surgery"
  | "q7Immobility"
  | "q8Cancer";

export type Appendix1Answers = Record<Appendix1Key, boolean | null>;

/** The medical history field each Appendix 1 answer writes to. */
export const APPENDIX1_FIELD: Record<Appendix1Key, keyof PeriodDelayMedicalHistory> = {
  q1Dvt: "historyOfDVT",
  q1Pe: "historyOfPE",
  q1Stroke: "historyOfStroke",
  q1Arterial: "severeArterialDisease",
  q2Thrombophilia: "familyVteUnder45",
  q3CurrentSmoker: "currentSmoker",
  q3StoppedUnderOneYear: "stoppedSmokingUnderOneYear",
  q5LongJourney: "longJourney",
  q6Surgery: "recentOrPlannedSurgery",
  q7Immobility: "immobility",
  q8Cancer: "activeOrRecentCancer",
};

export function createInitialAppendix1Answers(): Appendix1Answers {
  return {
    q1Dvt: null,
    q1Pe: null,
    q1Stroke: null,
    q1Arterial: null,
    q2Thrombophilia: null,
    q3CurrentSmoker: null,
    q3StoppedUnderOneYear: null,
    q5LongJourney: null,
    q6Surgery: null,
    q7Immobility: null,
    q8Cancer: null,
  };
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
  /** PGD v009 excludes male patients. */
  femaleConfirmed: boolean;
  hypersensitivity: boolean;
  /** Liver dysfunction, active liver disease, jaundice in pregnancy, or a liver tumour. */
  jaundiceInPregnancy: boolean;
  severePruritusInPregnancy: boolean;
  diabetesWithVascularComplications: boolean;
  /** Hypertension of any grade, treated or untreated, or hypertension in pregnancy. */
  hypertension: boolean;
  systolicBP: number | null;
  diastolicBP: number | null;
  atrialFibrillationOrValvularDisease: boolean;
  sleOrAntiphospholipid: boolean;
  brcaCarrier: boolean;
  dyslipidaemiaWithRiskFactor: boolean;
  lamotrigineMonotherapy: boolean;
  ciclosporin: boolean;
  /** History of depression: NOT an exclusion; individualised counselling and record. */
  historyOfDepression: boolean;
  /** Current severe depression, active suicidal ideation: exclude and refer. */
  severeDepressionOrSuicidalIdeation: boolean;
  // ── PGD v002 venous thromboembolism gate ──────────────────────────────
  // v001 listed these as risk factors and then asked only that the supplier
  // "assess individual risk factors", which gates nothing and is not
  // auditable. At 5mg three times daily a clinically significant proportion
  // of norethisterone is metabolised to ethinylestradiol, so the VTE risk
  // sits closer to a combined oral contraceptive than to a POP. They are
  // exclusions in v002.
  familyVteUnder45: boolean;
  currentSmoker: boolean;
  /** UKMEC 2025 distinguishes a recent quitter at 35+: category 3. */
  stoppedSmokingUnderOneYear: boolean;
  /** 35+ having stopped a year or more ago is UKMEC 2, not 3. */
  stoppedSmokingOverOneYear: boolean;
  /** Recorded for the notes. Both <15 and 15+ exclude at 35 or over. */
  cigarettesPerDay: number | null;
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
  /** 16 or 17: the assessment in full, not just the conclusion. */
  under18AssessmentNotes: string;
  /** Appendix 1 answers as given (null: not asked). */
  appendix1: Appendix1Answers;
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
  /** Derived from the date the period is due (3 days before). Read-only. */
  startDate: string;
}

/** Recorded whenever the patient is excluded or declines: the document says
 *  every excluded woman should leave with the Appendix 2 alternatives. */
export interface PeriodDelayExclusionAdvice {
  appendix2Given: boolean;
  adviceNotes: string;
}

export interface PeriodDelayCounselling {
  howToTake: boolean;
  startThreeDaysBefore: boolean;
  maxDuration: boolean;
  periodReturnsAfter: boolean;
  sideEffects: boolean;
  notContraceptive: boolean;
  /** Told to do a pregnancy test if her period does not arrive within a few days of finishing. */
  pregnancyTestIfNoPeriod: boolean;
  /** Move around and keep well hydrated, particularly on any journey. */
  mobilityAndHydration: boolean;
  /** Mood change is a recognised effect; monitor and seek follow up. */
  moodMonitoring: boolean;
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
  exclusionAdvice: PeriodDelayExclusionAdvice;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type PeriodDelayAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "ANSWER_APPENDIX1"; key: Appendix1Key; value: boolean }
  | { type: "UPDATE_EXCLUSION_ADVICE"; field: keyof PeriodDelayExclusionAdvice; value: any }
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
    assessment: { reasonForDelay: "", reasonDetails: "", lastPeriodDate: "", cycleRegular: false, expectedPeriodDate: "", daysUntilExpected: null, previousUse: false, previousIssues: "", datesNeededFor: "", previousSuppliesLast6Months: "", daysSuppliedLast6Months: null, lastPeriodNormalOnTime: false, noUnprotectedSexSince: false, pregnancyTestNegative: false, pregnancyTestDate: "", lastUpsiDate: "" },
    medicalHistory: { pregnancy: false, breastfeeding: false, liverDisease: false, historyOfDVT: false, historyOfPE: false, historyOfStroke: false, activeBreastCancer: false, severeArterialDisease: false, porphyria: false, abnormalVaginalBleeding: false, hormonalContraception: false, hormonalContraceptionType: "", ageUnder16: false, femaleConfirmed: false, hypersensitivity: false, jaundiceInPregnancy: false, severePruritusInPregnancy: false, diabetesWithVascularComplications: false, hypertension: false, systolicBP: null, diastolicBP: null, atrialFibrillationOrValvularDisease: false, sleOrAntiphospholipid: false, brcaCarrier: false, dyslipidaemiaWithRiskFactor: false, lamotrigineMonotherapy: false, ciclosporin: false, historyOfDepression: false, severeDepressionOrSuicidalIdeation: false, familyVteUnder45: false, currentSmoker: false, stoppedSmokingUnderOneYear: false, stoppedSmokingOverOneYear: false, cigarettesPerDay: null, heightCm: null, weightKg: null, longJourney: false, recentOrPlannedSurgery: false, immobility: false, activeOrRecentCancer: false, migraineWithAura: false, enzymeInducer: false, under18AssessmentDone: false, safeguardingConcern: false, under18AssessmentNotes: "", appendix1: createInitialAppendix1Answers() },
    medications: { anticoagulants: false, antiepileptics: false, ciclosporin: false, otherMedications: "", allergies: "" },
    medicineSelection: { confirmed: false, daysToDelay: null, startDate: "" },
    exclusionAdvice: { appendix2Given: false, adviceNotes: "" },
    counselling: { howToTake: false, startThreeDaysBefore: false, maxDuration: false, periodReturnsAfter: false, sideEffects: false, notContraceptive: false, pregnancyTestIfNoPeriod: false, mobilityAndHydration: false, moodMonitoring: false, seekHelpIfUnwell: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
    alerts: [],
    doseRecommendation: null,
  };
}

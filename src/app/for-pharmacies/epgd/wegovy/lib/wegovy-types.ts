// ─── Wegovy/Semaglutide Weight Management ePGD TypeScript Interfaces ───

import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";

// ─── Weight Assessment ───

/** What kind of visit this is. Drives which BMI is gated (the document's
 *  inclusion is an INITIAL BMI, reapplied only after a break of more than
 *  2 months) and which doses may be supplied. */
export type WegovyVisitType = "" | "new" | "continuing" | "restart";

export interface WegovyWeightAssessment {
  visitType: WegovyVisitType;
  /** Restart only: more than 2 months since the last dose, so the BMI
   *  inclusion criteria are reapplied to today's BMI. */
  breakOverTwoMonths: boolean;
  height: number | null; // cm
  weight: number | null; // kg
  bmi: number | null; // auto-calculated
  waistCircumference: number | null; // cm
  previousWeightLossAttempts: boolean;
  previousAttemptDetails: string;
  weightRelatedComorbidities: WeightRelatedComorbidity[];
  targetWeightLoss: string;
  // PGD v009 inclusion: initial face-to-face assessment completed and documented.
  initialAssessmentCompleted: boolean;
  // PGD v009 inclusion: willing to follow a reduced-calorie diet and increase
  // physical activity in line with the agreed lifestyle plan.
  lifestylePlanAgreed: boolean;
  // PGD v009 initial assessment: refer to the GP if a prescribed medicine is
  // causing the weight gain. Caution (refer).
  medicationInducedWeightGain: boolean;
}

export type WeightRelatedComorbidity =
  | "hypertension"
  | "type2diabetes"
  | "sleepApnoea"
  | "osteoarthritis"
  | "pcos"
  | "dyslipidaemia"
  | "cardiovascularDisease";

// ─── Medical History ───

export interface WegovyMedicalHistory {
  personalMTCHistory: boolean; // medullary thyroid carcinoma
  familyMTCHistory: boolean;
  men2: boolean; // multiple endocrine neoplasia type 2
  severeGIDisease: boolean; // gastroparesis or severe persistent GI disorder. Exclusion.
  pancreatitisHistory: boolean; // acute or chronic. Exclusion (PGD v009).
  // Current cholelithiasis (gallstones) or cholecystitis. Exclusion (PGD v009).
  gallbladderDisease: boolean;
  // Cholecystectomy within the last 3 months. Exclusion (PGD v009).
  recentCholecystectomy: boolean;
  // Heart failure with REDUCED ejection fraction (below 40%). Exclusion.
  // HFpEF (preserved EF) is NOT excluded; semaglutide / GLP-1 evidence
  // shows benefit in HFpEF (STEP-HFpEF trial). If EF unknown but under
  // cardiology review for "heart failure", refer to GP to clarify.
  heartFailureReducedEF: boolean;
  diabeticRetinopathy: boolean; // Exclusion (PGD v009): defer or refer.
  eatingDisorder: boolean;
  severeHepatic: boolean;
  // Severe renal impairment (eGFR below 30) or end-stage renal disease. Exclusion (PGD v009).
  severeRenal: boolean;
  // Mild to moderate renal impairment. Caution: monitor for dehydration.
  mildModerateRenal: boolean;
  /** Woman of childbearing potential. The pregnancy questions and the
   *  contraception counselling item apply only when "yes". */
  childbearingPotential: "" | "yes" | "no";
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  // History of suicidal ideation, or active severe mental illness. Caution (PGD v009).
  depression: boolean;
  // Shown when `depression` is ticked. Do not supply where oversight is absent and concern exists.
  psychiatricOversightInPlace: boolean;
  mentalHealthConcern: boolean;
  // Current suicidal ideation. Tool keeps this as a stop (stricter than the PGD caution).
  suicidalIdeation: boolean;
  thyroidDisease: boolean;
  // Known hypersensitivity to semaglutide or any excipient. Exclusion.
  semaglutideHypersensitivity: boolean;
  // Endocrine cause of obesity suspected but not yet assessed or treated. Caution (inform the GP), not an exclusion.
  endocrineObesity: boolean;
  // Type 1 diabetes mellitus. Exclusion.
  type1Diabetes: boolean;
  // Planned procedure under general anaesthesia or deep sedation. Caution (aspiration risk).
  plannedAnaesthesia: boolean;
  // Not suitable in the clinical judgement of the healthcare professional. Exclusion.
  clinicalJudgementUnsuitable: boolean;
}

// ─── Medications ───

export interface WegovyMedications {
  takesInsulin: boolean; // insulin-treated diabetes. Exclusion (PGD v009).
  insulinDetails: string;
  takesSulphonylureas: boolean; // sulfonylurea or meglitinide. Exclusion (PGD v009).
  sulphonylureDetails: string;
  // Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only. Caution: inform the GP.
  takesOtherDiabetesMeds: boolean;
  // Warfarin or another coumarin, or another oral medicine with a narrow therapeutic index. Caution.
  takesWarfarinOrNTI: boolean;
  // Hormone replacement therapy. Caution: non-oral products may be considered.
  takesHRT: boolean;
  currentGLP1: boolean; // already on a GLP-1 (any indication)
  otherMedications: string;
  allergies: string;
}

// ─── Observations ───

export interface WegovyObservations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
}

// ─── Dose Selection ───

export interface WegovyDoseSelection {
  currentDoseStage: "initiation" | "escalation" | "maintenance" | "";
  dose: string; // "0.25mg" | "0.5mg" | "1mg" | "1.7mg" | "2.4mg" | "7.2mg"
  weeksAtCurrentDose: number | null;
  /** "" not yet answered; "none" new patient or restart; otherwise the dose
   *  the patient has been on. */
  previousDose: string;
  /** Months on the maximum tolerated dose, for the 5% rule. */
  monthsOnMaxToleratedDose: number | null;
  /** Documented decision on continuation when the 5% rule applies. */
  continuationDecision: string;
  injectionSite: string;
  pharmacistOverride: boolean;
  overrideReason: string;
  // PGD v009: 7.2 mg only where the STARTING BMI was 30 or above.
  startingBMI: number | null;
  // PGD v009: maximum 2 years of continuous treatment; 5% rule at 6 months.
  treatmentStartDate: string; // YYYY-MM-DD, blank for a new patient
  initialWeight: number | null; // kg at initiation, continuing patients
  // PGD v009: recommencing after a break must titrate again from 0.25 mg.
  recommencingAfterBreak: boolean;
  // PGD v009 records: name and brand of medication, and batch number.
  batchNumber: string;
}

// ─── Counselling ───

export interface WegovyCounselling {
  injectionTechnique: boolean;
  storageFridge: boolean;
  missedDose: boolean;
  giSideEffects: boolean; // nausea, vomiting, diarrhoea, constipation, fluids
  pancreatitisWarning: boolean;
  gallbladderWarning: boolean;
  suicidalIdeationWarning: boolean;
  contraceptionAdvice: boolean; // effective contraception; stop 2 months before planned pregnancy
  hypoglycaemiaRisk: boolean; // if on other diabetes medicines
  dietExerciseAdvice: boolean;
  followUpSchedule: boolean;
  // PGD v009 additions
  urgentWarningSymptoms: boolean; // severe abdominal pain, persistent vomiting, jaundice, sudden visual loss, sustained rise in heart rate
  writtenInformationGiven: boolean; // PIL, written lifestyle advice, agreed target weight
  nhsRouteExplained: boolean; // patient told the NHS route exists and how to access it
  gpInformed: boolean; // GP informed at initiation and at each review
}

// ─── Full Consultation Summary ───

export interface WegovyConsultationSummary extends BaseSummary {
  // Additional Wegovy-specific fields if needed
}

// ─── Alerts ───

export interface ClinicalAlert {
  severity: "stop" | "caution" | "red-flag";
  code: string;
  message: string;
  detail: string;
}

// ─── Dose Recommendation ───

export interface DoseRecommendation {
  stage: "initiation" | "escalation" | "maintenance";
  dose: string;
  reason: string;
  titrationSchedule: string;
}

// ─── Full Consultation State ───

export interface WegovyConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  weightAssessment: WegovyWeightAssessment;
  medicalHistory: WegovyMedicalHistory;
  medications: WegovyMedications;
  observations: WegovyObservations;
  doseSelection: WegovyDoseSelection;
  counselling: WegovyCounselling;
  summary: WegovyConsultationSummary;
  // Computed
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
  canProceed: boolean;
  isComplete: boolean;
}

// ─── Reducer Actions ───

export type WegovyAction =
  | {
      type: "UPDATE_PATIENT";
      field: keyof BasePatientDetails;
      value: BasePatientDetails[keyof BasePatientDetails];
    }
  | {
      type: "UPDATE_CONSENT";
      field: keyof BaseConsent;
      value: BaseConsent[keyof BaseConsent];
    }
  | {
      type: "UPDATE_WEIGHT_ASSESSMENT";
      field: keyof WegovyWeightAssessment;
      value: WegovyWeightAssessment[keyof WegovyWeightAssessment];
    }
  | {
      type: "UPDATE_MEDICAL_HISTORY";
      field: keyof WegovyMedicalHistory;
      value: WegovyMedicalHistory[keyof WegovyMedicalHistory];
    }
  | {
      type: "UPDATE_MEDICATIONS";
      field: keyof WegovyMedications;
      value: WegovyMedications[keyof WegovyMedications];
    }
  | {
      type: "UPDATE_OBSERVATIONS";
      field: keyof WegovyObservations;
      value: WegovyObservations[keyof WegovyObservations];
    }
  | {
      type: "UPDATE_DOSE_SELECTION";
      field: keyof WegovyDoseSelection;
      value: WegovyDoseSelection[keyof WegovyDoseSelection];
    }
  | {
      type: "UPDATE_COUNSELLING";
      field: keyof WegovyCounselling;
      value: boolean;
    }
  | {
      type: "UPDATE_SUMMARY";
      field: keyof WegovyConsultationSummary;
      value: string;
    }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── PGD version (document strapline) ───

export const WEGOVY_PGD_VERSION =
  "Wegovy (semaglutide) Injection PGD version 009, issued 11 September 2026";

// ─── Step Labels ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent & ID",
  "Weight Assessment",
  "Medical History",
  "Current Medications",
  "Observations",
  "Contraindications Review",
  "Dose Selection",
  "Counselling",
  "Summary & Print",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;

// ─── Initial State Factory ───

export function createInitialConsultationState(): WegovyConsultationState {
  return {
    currentStep: 0,
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    weightAssessment: {
      visitType: "",
      breakOverTwoMonths: false,
      height: null,
      weight: null,
      bmi: null,
      waistCircumference: null,
      previousWeightLossAttempts: false,
      previousAttemptDetails: "",
      weightRelatedComorbidities: [],
      targetWeightLoss: "",
      initialAssessmentCompleted: false,
      lifestylePlanAgreed: false,
      medicationInducedWeightGain: false,
    },
    medicalHistory: {
      personalMTCHistory: false,
      familyMTCHistory: false,
      men2: false,
      severeGIDisease: false,
      pancreatitisHistory: false,
      gallbladderDisease: false,
      recentCholecystectomy: false,
      heartFailureReducedEF: false,
      diabeticRetinopathy: false,
      eatingDisorder: false,
      severeHepatic: false,
      severeRenal: false,
      mildModerateRenal: false,
      childbearingPotential: "",
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      depression: false,
      psychiatricOversightInPlace: false,
      mentalHealthConcern: false,
      suicidalIdeation: false,
      thyroidDisease: false,
      semaglutideHypersensitivity: false,
      endocrineObesity: false,
      type1Diabetes: false,
      plannedAnaesthesia: false,
      clinicalJudgementUnsuitable: false,
    },
    medications: {
      takesInsulin: false,
      insulinDetails: "",
      takesSulphonylureas: false,
      sulphonylureDetails: "",
      takesOtherDiabetesMeds: false,
      takesWarfarinOrNTI: false,
      takesHRT: false,
      currentGLP1: false,
      otherMedications: "",
      allergies: "",
    },
    observations: {
      systolicBP: null,
      diastolicBP: null,
      heartRate: null,
      weight: null,
      height: null,
    },
    doseSelection: {
      currentDoseStage: "",
      dose: "",
      weeksAtCurrentDose: null,
      previousDose: "",
      monthsOnMaxToleratedDose: null,
      continuationDecision: "",
      injectionSite: "",
      pharmacistOverride: false,
      overrideReason: "",
      startingBMI: null,
      treatmentStartDate: "",
      initialWeight: null,
      recommencingAfterBreak: false,
      batchNumber: "",
    },
    counselling: {
      injectionTechnique: false,
      storageFridge: false,
      missedDose: false,
      giSideEffects: false,
      pancreatitisWarning: false,
      gallbladderWarning: false,
      suicidalIdeationWarning: false,
      contraceptionAdvice: false,
      hypoglycaemiaRisk: false,
      dietExerciseAdvice: false,
      followUpSchedule: false,
      urgentWarningSymptoms: false,
      writtenInformationGiven: false,
      nhsRouteExplained: false,
      gpInformed: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
    },
    alerts: [],
    doseRecommendation: null,
    canProceed: false,
    isComplete: false,
  };
}

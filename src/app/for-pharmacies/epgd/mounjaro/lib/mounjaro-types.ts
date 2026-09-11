import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert, DoseRecommendation } from "../../shared/types";

// ─── Mounjaro Specific Types ───

export interface MounjaroWeightAssessment {
  height: number | null;
  weight: number | null;
  bmi: number | null;
  bmiCategory: string; // "underweight" | "normal" | "overweight" | "obese"
  waistCircumference: number | null;
  comorbidities: string[]; // see COMORBIDITY_OPTIONS
  /** Asked where the gating BMI is 27 to below 30. "" not yet answered;
   *  only "no" raises BMI_27_TO_30_NO_COMORBIDITY. An empty tick list on its
   *  own never stops (stop audit, 11 Sep 2026). */
  hasComorbidity: "" | "yes" | "no";
  // PGD v009 records row: "height, weight and BMI at this visit, and the target weight agreed"
  targetWeight: number | null;
  // PGD v009 inclusion: willing to follow a reduced-calorie diet and increase physical activity
  lifestylePlanAgreed: boolean;
  // PGD v009 inclusion: initial assessment completed and documented (face to face)
  initialAssessmentCompleted: boolean;
  /** BMI at the start of treatment. The document's inclusion is an INITIAL
   *  BMI, reapplied only after a break of more than 2 months; a continuing
   *  patient is judged on this, not on today's BMI. */
  startingBMI: number | null;
}

export interface MounjaroMedicalHistory {
  // Exclusions (PGD v009)
  personalMTCHistory: boolean;
  familyMTCHistory: boolean;
  men2: boolean;
  pancreatitisHistory: boolean;
  severeGIDisease: boolean;
  pregnant: boolean;
  breastfeeding: boolean;
  planningPregnancy: boolean;
  // Woman of childbearing potential not using effective contraception
  noEffectiveContraception: boolean;
  // Known hypersensitivity to tirzepatide or any excipient
  hypersensitivity: boolean;
  type1Diabetes: boolean;
  // Heart failure with REDUCED ejection fraction (EF below 40%). Exclusion
  // under this PGD. HF with PRESERVED ejection fraction (HFpEF) is NOT an
  // exclusion. If the EF is unknown but the patient is under cardiology
  // review for "heart failure", refer to the GP for clarification.
  heartFailureReducedEF: boolean;
  // Current cholelithiasis or cholecystitis: exclusion (PGD v002 onwards)
  gallbladderDisease: boolean;
  // Cholecystectomy within the last 3 months: exclusion (PGD v002 onwards)
  recentCholecystectomy: boolean;
  // Endocrine cause of obesity suspected but not yet assessed or treated:
  // a caution to inform the GP, not an exclusion (decision 48)
  endocrineObesity: boolean;
  // Severe renal impairment (eGFR below 30) or end-stage renal disease: exclusion
  severeRenalImpairment: boolean;
  // Severe hepatic impairment: exclusion
  severeHepaticImpairment: boolean;
  // Diabetic retinopathy: exclusion (defer or refer)
  diabeticRetinopathy: boolean;
  // Active eating disorder: exclusion
  activeEatingDisorder: boolean;
  // Not suitable in the clinical judgement of the healthcare professional
  notSuitableClinicalJudgement: boolean;
  // Cautions (PGD v009)
  // Mild to moderate renal impairment: monitor for dehydration
  renalImpairment: boolean;
  // History of suicidal ideation, or active severe mental illness
  depression: boolean;
  // Do not supply where psychiatric oversight is absent and concern exists
  mentalHealthOversightAbsent: boolean;
  // Pre-existing increased heart rate: caution, seek specialist advice before use
  preExistingTachycardia: boolean;
  thyroidDisease: boolean;
}

export interface MounjaroMedications {
  // Insulin-treated diabetes is an exclusion (PGD v006 onwards)
  takesInsulin: boolean;
  insulinDetails: string;
  currentGLP1: boolean;
  otherGLP1Details: string;
  warfarinUser: boolean;
  takesOralContraceptives: boolean;
  takesHRT: boolean;
  // Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only: inform the GP
  t2dmOralAgents: boolean;
  otherMedications: string;
  allergies: string;
}

export interface MounjaroObservations {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
}

export type MounjaroSupplyType = "" | "new-start" | "continue" | "escalate" | "reduce" | "restart";

export interface MounjaroDoseSelection {
  currentDoseStage: string; // "init" | "1" | "2" | "3" | "4" | "5"
  dose: string;
  weeksAtCurrentDose: number | null;
  /** Stage key of the dose the patient has been on ("init" to "5"). Required
   *  for continue, escalate and reduce; the one rule that matters for a
   *  titrated injectable (adversarial review, 11 Sep 2026). */
  previousDose: string;
  /** Weight at initiation (kg) and start date, for the 5% rule and the record. */
  initialWeight: number | null;
  treatmentStartDate: string;
  /** Months on the maximum tolerated dose, for the 5% rule. */
  monthsOnMaxToleratedDose: number | null;
  /** Documented decision on continuation when the 5% rule applies. */
  continuationDecision: string;
  injectionSite: string;
  // Nature of today's supply: new start, continuation, escalation, reduction or restart after a break
  supplyType: MounjaroSupplyType;
  // More than 2 doses missed: reduce and re-escalate (PGD v009 dose row)
  missedMoreThanTwoDoses: boolean;
  // Restart after more than 2 months off treatment: BMI inclusion criteria must be reapplied
  breakOverTwoMonths: boolean;
  // PGD v009 records row: name and brand of medication, and batch number
  batchNumber: string;
  expiryDate: string;
  pharmacistOverride: boolean;
  overrideReason: string;
}

export interface MounjaroCounselling {
  injectionTechnique: boolean;
  injectionSiteRotation: boolean;
  storageRefrigeration: boolean;
  missedDoseProtocol: boolean;
  giSideEffects: boolean;
  pancreatitisWarning: boolean;
  gallbladderWarning: boolean;
  retinopathyWarning: boolean;
  // Warning symptoms needing urgent attention (PGD v009 follow-up row)
  warningSymptoms: boolean;
  // Reduced absorption of oral medicines, oral contraceptives and HRT
  oralMedicationAbsorption: boolean;
  // Pulmonary aspiration risk under general anaesthesia or deep sedation
  anaesthesiaWarning: boolean;
  penDeviceUse: boolean;
  followUpSchedule: boolean;
  dietExerciseAdvice: boolean;
  // PIL plus written lifestyle, diet and physical activity advice and the agreed target weight
  writtenInfoProvided: boolean;
  // GP informed (required where type 2 diabetes is managed with metformin, an SGLT2 inhibitor or a DPP-4 inhibitor)
  gpInformed: boolean;
}

export interface MounjaroConsultationSummary extends BaseSummary {
  notes: string;
}

export interface MounjaroConsultationState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  weightAssessment: MounjaroWeightAssessment;
  medicalHistory: MounjaroMedicalHistory;
  medications: MounjaroMedications;
  observations: MounjaroObservations;
  doseSelection: MounjaroDoseSelection;
  counselling: MounjaroCounselling;
  summary: MounjaroConsultationSummary;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

export type MounjaroAction =
  | { type: "UPDATE_PATIENT"; field: string; value: any }
  | { type: "UPDATE_CONSENT"; field: string; value: any }
  | { type: "UPDATE_WEIGHT_ASSESSMENT"; field: string; value: any }
  | { type: "UPDATE_MEDICAL_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICATIONS"; field: string; value: any }
  | { type: "UPDATE_OBSERVATIONS"; field: string; value: any }
  | { type: "UPDATE_DOSE_SELECTION"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: string; value: any }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

// ─── Constants ───

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Weight Assessment",
  "Medical History",
  "Current Medications",
  "Contraindications",
  "Dose Selection",
  "Counselling",
  "Summary",
];

export const TOTAL_STEPS = STEP_LABELS.length;

// PGD strapline (document wins): version 009, issued 11 September 2026
export const PGD_VERSION_LABEL = "Mounjaro (tirzepatide) Injection for weight management PGD, version 009, issued 11 September 2026";

// Weight-related comorbidities named in the PGD indication and inclusion criteria
export const COMORBIDITY_OPTIONS: { id: string; label: string }[] = [
  { id: "type2diabetes", label: "Type 2 diabetes mellitus" },
  { id: "prediabetes", label: "Pre-diabetes (dysglycaemia)" },
  { id: "hypertension", label: "Hypertension" },
  { id: "dyslipidaemia", label: "Dyslipidaemia" },
  { id: "osa", label: "Obstructive sleep apnoea (OSA)" },
  { id: "cvd", label: "Established cardiovascular disease" },
];

// Mounjaro KwikPen strengths by titration stage (PGD v009 dose and frequency row)
export const STAGE_ORDER = ["init", "1", "2", "3", "4", "5"] as const;

export const DOSE_BY_STAGE: Record<string, string> = {
  init: "2.5 mg",
  "1": "5 mg",
  "2": "7.5 mg",
  "3": "10 mg",
  "4": "12.5 mg",
  "5": "15 mg",
};

// ─── Initial State ───

export function createInitialConsultationState(): MounjaroConsultationState {
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
      height: null,
      weight: null,
      bmi: null,
      bmiCategory: "",
      waistCircumference: null,
      comorbidities: [],
      hasComorbidity: "",
      targetWeight: null,
      lifestylePlanAgreed: false,
      initialAssessmentCompleted: false,
      startingBMI: null,
    },
    medicalHistory: {
      personalMTCHistory: false,
      familyMTCHistory: false,
      men2: false,
      pancreatitisHistory: false,
      severeGIDisease: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      noEffectiveContraception: false,
      hypersensitivity: false,
      type1Diabetes: false,
      heartFailureReducedEF: false,
      gallbladderDisease: false,
      recentCholecystectomy: false,
      endocrineObesity: false,
      severeRenalImpairment: false,
      severeHepaticImpairment: false,
      diabeticRetinopathy: false,
      activeEatingDisorder: false,
      notSuitableClinicalJudgement: false,
      renalImpairment: false,
      depression: false,
      mentalHealthOversightAbsent: false,
      preExistingTachycardia: false,
      thyroidDisease: false,
    },
    medications: {
      takesInsulin: false,
      insulinDetails: "",
      currentGLP1: false,
      otherGLP1Details: "",
      warfarinUser: false,
      takesOralContraceptives: false,
      takesHRT: false,
      t2dmOralAgents: false,
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
      currentDoseStage: "init",
      dose: DOSE_BY_STAGE.init,
      weeksAtCurrentDose: null,
      previousDose: "",
      initialWeight: null,
      treatmentStartDate: "",
      monthsOnMaxToleratedDose: null,
      continuationDecision: "",
      injectionSite: "",
      supplyType: "",
      missedMoreThanTwoDoses: false,
      breakOverTwoMonths: false,
      batchNumber: "",
      expiryDate: "",
      pharmacistOverride: false,
      overrideReason: "",
    },
    counselling: {
      injectionTechnique: false,
      injectionSiteRotation: false,
      storageRefrigeration: false,
      missedDoseProtocol: false,
      giSideEffects: false,
      pancreatitisWarning: false,
      gallbladderWarning: false,
      retinopathyWarning: false,
      warningSymptoms: false,
      oralMedicationAbsorption: false,
      anaesthesiaWarning: false,
      penDeviceUse: false,
      followUpSchedule: false,
      dietExerciseAdvice: false,
      writtenInfoProvided: false,
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
      notes: "",
    },
    alerts: [],
    doseRecommendation: null,
  };
}

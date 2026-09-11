"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import {
  initialPatientDetails,
  initialConsent,
  initialSummary,
  calculateAge,
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
  type BasePatientDetails,
  type BaseConsent,
  type BaseSummary,
} from "../shared/types";
import { ChestServiceSummaryReport } from "./components/ChestServiceSummaryReport";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

// ─────────────────────────────────────────────────────────────────────────
// Chest Infection Service, acute bacterial bronchitis.
//
// Aligned to the signed PGD version 008, issued 11 September 2026 (three
// arms: doxycycline, amoxicillin, clarithromycin; from age 12).
//
// Two things this tool takes seriously that a checklist would not:
//
//   1. Most acute bronchitis is viral. The default should be no antibiotic.
//      The PGD's inclusion criteria are deliberately narrow: purulent sputum
//      PLUS either a higher-risk comorbidity or symptoms beyond 14 days.
//   2. The dangerous miss is pneumonia, not a wrong antibiotic choice.
//      Every observation in Appendix 1 must be measured and recorded before
//      any supply, and the CRB score (without the age point) must be 0.
//
// Doses come from the signed document:
//   Doxycycline 200 mg on day 1 then 100 mg once daily for 4 days (6 capsules)
//   Amoxicillin 500 mg three times a day, 5 days (15 capsules)
//   Clarithromycin 250 mg twice a day, 5 days (10 tablets). The document's
//   500 mg twice a day row is for "marked systemic upset" and says those
//   patients are referred, not treated at the higher dose, so it is not
//   offered (adversarial review, 11 Sep 2026).
// ─────────────────────────────────────────────────────────────────────────

export const PGD_STRAPLINE =
  "Acute Bacterial Bronchitis PGD version 008, issued 11 September 2026";

export type Antibiotic = "" | "amoxicillin" | "doxycycline" | "clarithromycin";

export const ANTIBIOTIC_REGIMENS: Record<
  Exclude<Antibiotic, "">,
  { label: string; dose: string; product: string; quantity: string; route: string }
> = {
  doxycycline: {
    label: "Arm 1. Doxycycline 100 mg capsules: 200 mg on day 1, then 100 mg once daily for 4 days (6 capsules)",
    dose: "200 mg day 1 then 100 mg OD, 5 days total",
    product: "Doxycycline 100mg capsules",
    quantity: "6 capsules",
    route: "Oral. Swallow whole with plenty of water, sitting or standing, well before lying down",
  },
  amoxicillin: {
    label: "Arm 2. Amoxicillin 500 mg capsules: 500 mg three times a day for 5 days (15 capsules)",
    dose: "500 mg TDS, 5 days",
    product: "Amoxicillin 500mg capsules",
    quantity: "15 capsules",
    route: "Oral. Swallow whole with water, with or without food",
  },
  clarithromycin: {
    label: "Arm 3. Clarithromycin 250 mg tablets: 250 mg twice a day for 5 days (10 tablets)",
    dose: "250 mg BD, 5 days",
    product: "Clarithromycin 250mg tablets",
    quantity: "10 tablets",
    route: "Oral, with or without food",
  },
};

export type Comorbidity =
  | "chronic-lung"
  | "heart-failure"
  | "diabetes"
  | "ckd-liver"
  | "immunosuppression"
  | "age-65";

export const COMORBIDITY_OPTIONS: { value: Comorbidity; label: string }[] = [
  { value: "chronic-lung", label: "Chronic lung disease, including COPD and asthma" },
  { value: "heart-failure", label: "Heart failure" },
  { value: "diabetes", label: "Diabetes" },
  { value: "ckd-liver", label: "Chronic kidney or liver disease" },
  { value: "immunosuppression", label: "Immunosuppression" },
  { value: "age-65", label: "Age 65 and over (set from the date of birth)" },
];

export type SmokingStatus = "" | "never" | "former" | "current";

type ConsentBasis = "" | "parental" | "gillick";

export interface ChestState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  consent16: {
    basis: ConsentBasis;
    detail: string;
  };
  presentation: {
    coughDurationDays: number | null;
    /** Yes/No with no default: the inclusion turns on it, so it is answered, never assumed from an unticked box. */
    purulentSputum: "" | "yes" | "no";
    fever: boolean;
    breathless: boolean;
    wheeze: boolean;
    chestPain: boolean;
    // PGD v008 inclusion: purulent sputum AND (comorbidity OR symptoms beyond 14 days).
    // Several comorbidities may apply; "age-65" is derived from the date of birth.
    comorbidities: Comorbidity[];
    /** Explicit confirmation that no higher-risk comorbidity is present. */
    noComorbidity: boolean;
    /** The 3 week exclusion applies to current or former smokers only. */
    smokingStatus: SmokingStatus;
    lowerThresholdOver65Considered: boolean;
    rationale: string;
  };
  // Appendix 1: every observation must be measured and recorded before any supply
  observations: {
    spo2: number | null;
    respiratoryRate: number | null;
    pulse: number | null;
    systolicBP: number | null;
    diastolicBP: number | null;
    temperature: number | null;
    newConfusion: boolean;
    copdBelowBaseline: boolean;
  };
  redFlags: {
    focalChestSigns: boolean;
    suspectedPneumonia: boolean;
    sepsisFeatures: boolean;
    looksUnwell: boolean;
    haemoptysis: boolean;
    cyanosis: boolean;
    stridorOrAbsentBreathSounds: boolean;
    accessoryMuscleUse: boolean;
    hoarseness: boolean;
    troubleSwallowing: boolean;
    dyspnoeaAtRest: boolean;
    oedemaWithWeightGain: boolean;
    suspectedPeHfCancer: boolean;
    weightLoss: boolean;
    persistentVomiting: boolean;
    smokerNewOrChangedCough: boolean;
  };
  exclusions: {
    pregnancy: boolean;
    breastfeeding: boolean;
    antibioticAlreadyTaken: boolean;
    hypersensitivityToChosenAgent: boolean;
    unableToTakeOral: boolean;
    severeHepaticImpairment: boolean;
    significantRenalImpairment: boolean;
    isotretinoin: boolean;
    mononucleosisOrALL: boolean;
    qtProlongation: boolean;
    electrolyteDisturbance: boolean;
  };
  medicines: {
    penicillinAllergy: boolean;
    penicillinAllergyHistory: string;
    tetracyclineAllergy: boolean;
    macrolideAllergy: boolean;
    onSimvastatin: boolean;
    onClarithromycinInteracting: boolean;
    onColchicine: boolean;
    onWarfarin: boolean;
    onDoac: boolean;
    renalFunctionAsked: boolean;
    /** The patient's answer about kidney function (select), plus free-text detail. */
    renalFunctionAnswer: "" | "No known kidney problems" | "Patient does not know; no reason to suspect impairment" | "Known kidney impairment (see detail)";
    renalFunctionDetail: string;
    other: string;
  };
  treatment: {
    antibiotic: Antibiotic;
    firstLineUnsuitableReason: string;
    batch: string;
    expiry: string;
  };
  counselling: {
    courseCompletion: boolean;
    viralExplanation: boolean;
    sideEffects: boolean;
    doxycyclineAdvice: boolean;
    amoxicillinAdvice: boolean;
    clarithromycinAdvice: boolean;
    safetyNetting: boolean;
    followUp: boolean;
    selfCare: boolean;
    pilSupplied: boolean;
    /** Advice given where excluded, declining, or not meeting the inclusion criteria. */
    exclusionAdvice: string;
    /** Details of any adverse drug reactions and the actions taken (Yellow Card). */
    adverseReactions: string;
  };
  summary: BaseSummary;
}

const STEP_LABELS = [
  "Patient",
  "Consent",
  "Presentation",
  "Observations",
  "Red Flags",
  "Exclusions",
  "Medicines",
  "Antibiotic",
  "Counselling",
  "Summary",
];
const TOTAL_STEPS = STEP_LABELS.length;
const STEP_CONSENT = STEP_LABELS.indexOf("Consent");
const STEP_PRESENTATION = STEP_LABELS.indexOf("Presentation");
const STEP_OBSERVATIONS = STEP_LABELS.indexOf("Observations");
const STEP_MEDICINES = STEP_LABELS.indexOf("Medicines");
const STEP_ANTIBIOTIC = STEP_LABELS.indexOf("Antibiotic");
const STEP_COUNSELLING = STEP_LABELS.indexOf("Counselling");

function initialState(): ChestState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    consent16: { basis: "", detail: "" },
    presentation: {
      coughDurationDays: null,
      purulentSputum: "",
      fever: false,
      breathless: false,
      wheeze: false,
      chestPain: false,
      comorbidities: [],
      noComorbidity: false,
      smokingStatus: "",
      lowerThresholdOver65Considered: false,
      rationale: "",
    },
    observations: {
      spo2: null,
      respiratoryRate: null,
      pulse: null,
      systolicBP: null,
      diastolicBP: null,
      temperature: null,
      newConfusion: false,
      copdBelowBaseline: false,
    },
    redFlags: {
      focalChestSigns: false,
      suspectedPneumonia: false,
      sepsisFeatures: false,
      looksUnwell: false,
      haemoptysis: false,
      cyanosis: false,
      stridorOrAbsentBreathSounds: false,
      accessoryMuscleUse: false,
      hoarseness: false,
      troubleSwallowing: false,
      dyspnoeaAtRest: false,
      oedemaWithWeightGain: false,
      suspectedPeHfCancer: false,
      weightLoss: false,
      persistentVomiting: false,
      smokerNewOrChangedCough: false,
    },
    exclusions: {
      pregnancy: false,
      breastfeeding: false,
      antibioticAlreadyTaken: false,
      hypersensitivityToChosenAgent: false,
      unableToTakeOral: false,
      severeHepaticImpairment: false,
      significantRenalImpairment: false,
      isotretinoin: false,
      mononucleosisOrALL: false,
      qtProlongation: false,
      electrolyteDisturbance: false,
    },
    medicines: {
      penicillinAllergy: false,
      penicillinAllergyHistory: "",
      tetracyclineAllergy: false,
      macrolideAllergy: false,
      onSimvastatin: false,
      onClarithromycinInteracting: false,
      onColchicine: false,
      onWarfarin: false,
      onDoac: false,
      renalFunctionAsked: false,
      renalFunctionAnswer: "",
      renalFunctionDetail: "",
      other: "",
    },
    treatment: { antibiotic: "", firstLineUnsuitableReason: "", batch: "", expiry: "" },
    counselling: {
      courseCompletion: false,
      viralExplanation: false,
      sideEffects: false,
      doxycyclineAdvice: false,
      amoxicillinAdvice: false,
      clarithromycinAdvice: false,
      safetyNetting: false,
      followUp: false,
      selfCare: false,
      pilSupplied: false,
      exclusionAdvice: "",
      adverseReactions: "",
    },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_CONSENT16"; field: keyof ChestState["consent16"]; value: string }
  | { type: "UPDATE_PRESENTATION"; field: keyof ChestState["presentation"]; value: unknown }
  | { type: "UPDATE_OBSERVATION"; field: keyof ChestState["observations"]; value: unknown }
  | { type: "UPDATE_REDFLAG"; field: keyof ChestState["redFlags"]; value: boolean }
  | { type: "UPDATE_EXCLUSION"; field: keyof ChestState["exclusions"]; value: boolean }
  | { type: "UPDATE_MEDICINE"; field: keyof ChestState["medicines"]; value: unknown }
  | { type: "UPDATE_TREATMENT"; field: keyof ChestState["treatment"]; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof ChestState["counselling"]; value: boolean | string }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

function reducer(state: ChestState, action: Action): ChestState {
  switch (action.type) {
    case "UPDATE_PATIENT": {
      const patient = { ...state.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") patient.age = calculateAge(action.value as string);
      return { ...state, patient };
    }
    case "UPDATE_CONSENT":
      return { ...state, consent: { ...state.consent, [action.field]: action.value } };
    case "UPDATE_CONSENT16":
      return { ...state, consent16: { ...state.consent16, [action.field]: action.value } };
    case "UPDATE_PRESENTATION":
      return { ...state, presentation: { ...state.presentation, [action.field]: action.value } };
    case "UPDATE_OBSERVATION":
      return { ...state, observations: { ...state.observations, [action.field]: action.value } };
    case "UPDATE_REDFLAG":
      return { ...state, redFlags: { ...state.redFlags, [action.field]: action.value } };
    case "UPDATE_EXCLUSION":
      return { ...state, exclusions: { ...state.exclusions, [action.field]: action.value } };
    case "UPDATE_MEDICINE":
      return { ...state, medicines: { ...state.medicines, [action.field]: action.value } };
    case "UPDATE_TREATMENT":
      return { ...state, treatment: { ...state.treatment, [action.field]: action.value } };
    case "UPDATE_COUNSELLING":
      return { ...state, counselling: { ...state.counselling, [action.field]: action.value } };
    case "UPDATE_SUMMARY":
      return { ...state, summary: { ...state.summary, [action.field]: action.value } };
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP":
      return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case "RESET":
      return initialState();
    default:
      return state;
  }
}

export interface Alert {
  code: string;
  severity: "stop" | "caution" | "red-flag";
  message: string;
  detail: string;
}

export const RED_FLAG_LABELS: [keyof ChestState["redFlags"], string, string][] = [
  // (label, referral detail)
  ["focalChestSigns", "Focal chest signs on examination (dull percussion note, bronchial breathing, coarse crackles that do not clear with coughing)", "Focal signs suggest pneumonia rather than bronchitis. Refer the same day for medical assessment."],
  ["suspectedPneumonia", "Suspected pneumonia: focal chest signs with any systemic feature", "Pneumonia is not covered by this PGD. Refer the same day."],
  ["sepsisFeatures", "Any feature of sepsis", "Refer immediately. Call 999 if the patient looks seriously unwell."],
  ["looksUnwell", "Severely systemically unwell, or the patient simply looks unwell to you, however the observations read", "If the patient looks unwell to you, refer."],
  ["haemoptysis", "Haemoptysis (coughing blood)", "Refer regardless of any score."],
  ["cyanosis", "Cyanosis", "Refer regardless of any score."],
  ["stridorOrAbsentBreathSounds", "Stridor or absent breath sounds", "Refer regardless of any score."],
  ["accessoryMuscleUse", "Accessory muscle use", "Refer regardless of any score."],
  ["hoarseness", "Persistent hoarseness", "Refer for assessment, in line with the lung and pleural cancer referral guidance."],
  ["troubleSwallowing", "Trouble swallowing", "Refer for assessment."],
  ["dyspnoeaAtRest", "Prominent breathlessness at rest or at night", "Refer for assessment."],
  ["oedemaWithWeightGain", "Peripheral oedema with weight gain", "May indicate heart failure. Refer."],
  ["suspectedPeHfCancer", "Suspected pulmonary embolism, heart failure or lung cancer", "Exclusion. Refer."],
  ["weightLoss", "Unexplained weight loss or systemic symptoms", "Refer for assessment."],
  ["persistentVomiting", "Persistent vomiting", "Refer, and note that oral antibiotics may not be retained."],
  ["smokerNewOrChangedCough", "Current or former smoker with a cough over 3 weeks, or a smoker over 45 with a new or changed cough or voice change", "Exclusion. Refer in line with the lung cancer referral guidance."],
];

export const EXCLUSION_LABELS: Record<keyof ChestState["exclusions"], string> = {
  pregnancy: "Pregnant",
  breastfeeding: "Breastfeeding",
  antibioticAlreadyTaken: "An antibiotic already taken for this episode",
  hypersensitivityToChosenAgent: "Hypersensitivity to the intended agent or its excipients",
  unableToTakeOral: "Unable to take or retain oral medication",
  severeHepaticImpairment: "Known severe hepatic impairment",
  significantRenalImpairment: "Known significant renal impairment",
  isotretinoin: "Concurrent isotretinoin",
  mononucleosisOrALL: "Infectious mononucleosis or acute lymphoblastic leukaemia",
  qtProlongation: "Known QT prolongation, or concurrent QT-prolonging medicines",
  electrolyteDisturbance: "Known electrolyte disturbance",
};

const isClari = (a: Antibiotic) => a === "clarithromycin";

export function comorbidityLabel(c: Comorbidity): string {
  return COMORBIDITY_OPTIONS.find((o) => o.value === c)?.label.replace(/ \(.*\)$/, "") ?? c;
}

/** Comorbidities that count for inclusion: those recorded, with "age 65 and
 *  over" driven by the calculated age rather than by a dropdown choice. */
export function effectiveComorbidities(recorded: Comorbidity[], age: number | null): Comorbidity[] {
  const base = recorded.filter((c) => c !== "age-65");
  return age !== null && age >= 65 ? [...base, "age-65"] : base;
}

export function ChestServiceClient() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const __pharm = usePharmacistProfile();
  useEffect(() => {
    if (!__pharm) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: __pharm.name });
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: __pharm.gphcNumber });
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: __pharm.pharmacyName });
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: __pharm.pharmacyAddress });
  }, [__pharm, state.summary.pharmacistName, state.summary.pharmacistGPhC]);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  /** Agents ruled out by a recorded allergy. */
  const blockedAgents = useMemo(() => {
    const m = state.medicines;
    const out = new Set<string>();
    if (m.penicillinAllergy) out.add("amoxicillin");
    if (m.tetracyclineAllergy) out.add("doxycycline");
    if (m.macrolideAllergy) out.add("clarithromycin");
    return out;
  }, [state.medicines]);

  /** Arms ruled out by the PGD's arm rules (age, pregnancy, breastfeeding, allergy). */
  const armsAvailable = useMemo(() => {
    const { patient, exclusions, medicines } = state;
    const age = patient.age;
    const adult = age !== null && age >= 18;
    const pregOrBf = exclusions.pregnancy || exclusions.breastfeeding;
    return {
      doxycycline: adult && !pregOrBf && !medicines.tetracyclineAllergy,
      amoxicillin: !medicines.penicillinAllergy,
      clarithromycin: medicines.penicillinAllergy && !pregOrBf && !medicines.macrolideAllergy,
    };
  }, [state]);

  /** CRB score without the age point (Appendix 1). */
  const crbScore = useMemo(() => {
    const o = state.observations;
    let s = 0;
    if (o.newConfusion) s++;
    if (o.respiratoryRate !== null && o.respiratoryRate >= 30) s++;
    if (
      (o.systolicBP !== null && o.systolicBP < 90) ||
      (o.diastolicBP !== null && o.diastolicBP <= 60)
    )
      s++;
    return s;
  }, [state.observations]);

  const comorbidities = useMemo(
    () => effectiveComorbidities(state.presentation.comorbidities, state.patient.age),
    [state.presentation.comorbidities, state.patient.age]
  );
  const isOver65 = state.patient.age !== null && state.patient.age >= 65;

  /** PGD v008 inclusion: purulent sputum AND (higher-risk comorbidity OR symptoms beyond 14 days). */
  const inclusion = useMemo(() => {
    const p = state.presentation;
    const comorbidityMet = comorbidities.length > 0;
    const durationMet = p.coughDurationDays !== null && p.coughDurationDays > 14;
    const met = p.purulentSputum === "yes" && (comorbidityMet || durationMet);
    const feature = !met
      ? "Not met"
      : comorbidityMet && durationMet
        ? "Purulent sputum plus comorbidity and duration beyond 14 days"
        : comorbidityMet
          ? "Purulent sputum plus comorbidity"
          : "Purulent sputum plus duration beyond 14 days";
    return { met, comorbidityMet, durationMet, feature };
  }, [state.presentation, comorbidities]);

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];
    const { patient, presentation, observations, redFlags, exclusions, medicines, treatment } = state;
    const age = patient.age;

    // ── Age. The PGD covers 12 and over. ────────────────────────────
    if (age !== null && age < 12) {
      out.push({
        code: "age",
        severity: "stop",
        message: "Patient under 12",
        detail: "This PGD covers patients aged 12 years and over. Refer to the GP.",
      });
    }

    // ── Red flags. Each one routes out of the service. ──────────────
    for (const [key, label, detail] of RED_FLAG_LABELS) {
      if (redFlags[key]) {
        out.push({ code: `rf-${key}`, severity: "stop", message: label, detail });
      }
    }

    // ── Duration. The document excludes a cough of more than 3 weeks in a
    // current or former smoker. For everyone else it is a caution, not a stop.
    if (presentation.coughDurationDays !== null && presentation.coughDurationDays > 21) {
      const smoker = presentation.smokingStatus === "current" || presentation.smokingStatus === "former";
      if (smoker) {
        out.push({
          code: "duration",
          severity: "stop",
          message: `Cough lasting ${presentation.coughDurationDays} days in a ${presentation.smokingStatus} smoker`,
          detail:
            "Exclusion: a cough lasting more than 3 weeks in a current or former smoker. Refer in line with the lung cancer referral guidance.",
        });
      } else if (presentation.smokingStatus === "never") {
        out.push({
          code: "duration-caution",
          severity: "caution",
          message: `Cough lasting ${presentation.coughDurationDays} days`,
          detail:
            "The document excludes a cough over 3 weeks only in a current or former smoker. In a never-smoker it is not an exclusion, but a cough of this length needs the causes of a subacute cough considered (asthma, reflux, ACE inhibitors). Record the reasoning.",
        });
      }
    }

    // ── Appendix 1 observation thresholds. Any breach refers. ───────
    const o = observations;
    const breaches: string[] = [];
    if (o.spo2 !== null && o.spo2 < 94) breaches.push("SpO2 below 94% on air at rest");
    if (o.copdBelowBaseline) breaches.push("SpO2 below the patient's own documented COPD baseline");
    if (o.respiratoryRate !== null && o.respiratoryRate >= 22) breaches.push("respiratory rate 22 or above");
    if (o.pulse !== null && o.pulse > 110) breaches.push("pulse above 110 at rest");
    if (o.systolicBP !== null && o.systolicBP < 100) breaches.push("systolic BP below 100");
    if (o.temperature !== null && o.temperature >= 38) breaches.push("temperature 38C or above");
    if (o.newConfusion) breaches.push("new confusion, disorientation or drowsiness");
    if (breaches.length > 0) {
      out.push({
        code: "obs",
        severity: "stop",
        message: "Observation outside the Appendix 1 thresholds",
        detail: "Refer, do not supply: " + breaches.join("; ") + ". Same-day assessment.",
      });
    }
    if (crbScore >= 1) {
      out.push({
        code: "crb",
        severity: "stop",
        message: `CRB score ${crbScore} (without the age point)`,
        detail:
          "A CRB score of 1 or more (confusion; respiratory rate 30 or more; systolic below 90 or diastolic 60 or less) excludes. Refer for same-day assessment.",
      });
    }

    // ── Exclusions from the signed document (all arms). ─────────────
    if (exclusions.antibioticAlreadyTaken) {
      out.push({
        code: "abx-taken",
        severity: "stop",
        message: "An antibiotic already taken for this episode",
        detail: "One course per episode. A second course is not authorised under this PGD; refer.",
      });
    }
    if (exclusions.unableToTakeOral) {
      out.push({
        code: "oral",
        severity: "stop",
        message: "Unable to take or retain oral medication",
        detail: "Refer for medical assessment; parenteral treatment may be needed.",
      });
    }
    if (exclusions.hypersensitivityToChosenAgent) {
      out.push({
        code: "hyper",
        severity: "stop",
        message: "Hypersensitivity to the intended agent or its excipients",
        detail: "Choose an alternative agent, or refer if no suitable option remains.",
      });
    }

    // ── Pregnancy and breastfeeding: arm rules. ─────────────────────
    // Amoxicillin may be supplied in pregnancy and in breastfeeding (v008
    // cautions). Doxycycline and clarithromycin are excluded in both. A
    // pregnant or breastfeeding penicillin-allergic patient has no arm.
    const pregOrBf = exclusions.pregnancy || exclusions.breastfeeding;
    const pregOrBfLabel = exclusions.pregnancy ? "Pregnant" : "Breastfeeding";
    if (pregOrBf && medicines.penicillinAllergy) {
      out.push({
        code: "preg-pen",
        severity: "stop",
        message: `${pregOrBfLabel} and penicillin-allergic: no arm under this PGD`,
        detail:
          "A pregnant or breastfeeding patient who is penicillin-allergic has no arm under this PGD. Refer the same day: the guidance names erythromycin for that patient, which this PGD does not authorise.",
      });
    } else if (pregOrBf) {
      if (treatment.antibiotic === "doxycycline" || isClari(treatment.antibiotic)) {
        out.push({
          code: "preg-arm",
          severity: "stop",
          message: `${pregOrBfLabel}: this arm is excluded`,
          detail:
            "Doxycycline is contraindicated in pregnancy and breastfeeding, and clarithromycin is not supplied in pregnancy or breastfeeding under this PGD. Use the AMOXICILLIN arm.",
        });
      } else {
        out.push({
          code: "preg-amox",
          severity: "caution",
          message: `${pregOrBfLabel}: use the amoxicillin arm`,
          detail:
            "Amoxicillin may be supplied in pregnancy and in breastfeeding and is the usual choice in pregnancy where an antibiotic is indicated for this condition. Select amoxicillin.",
        });
      }
    }

    // ── Inclusion criteria. Recorded, not assumed. Raised on the
    // Presentation step itself once every inclusion question has been
    // answered (sputum Yes/No, duration, comorbidities or none confirmed),
    // and enforced on every later step. A blank answer never raises it.
    const presentationEntered =
      presentation.purulentSputum !== "" &&
      presentation.coughDurationDays !== null &&
      (presentation.noComorbidity || presentation.comorbidities.length > 0 || isOver65);
    if ((state.currentStep > STEP_PRESENTATION || presentationEntered) && !inclusion.met) {
      out.push({
        code: "inclusion",
        severity: "stop",
        message: "Inclusion criteria not met",
        detail:
          "This PGD requires PURULENT SPUTUM (yellow or green) AND EITHER a higher-risk comorbidity (chronic lung disease including COPD and asthma, heart failure, diabetes, chronic kidney or liver disease, immunosuppression, or age 65 and over) OR symptoms persisting beyond 14 days. Most acute cough is viral: give self-care and safety-netting advice, which is a legitimate and common outcome for this service.",
      });
    }
    // The "lower referral threshold considered" record for a patient of 65
    // or over is enforced by the Presentation step validator (a missing
    // record is not an exclusion, so it is not shown as one).

    // ── Arm rules versus chosen agent. ──────────────────────────────
    const abx = treatment.antibiotic;
    if (abx && blockedAgents.has(abx)) {
      out.push({
        code: "allergy-choice",
        severity: "stop",
        message: `${abx} conflicts with a recorded allergy`,
        detail: "Select an agent the patient is not allergic to.",
      });
    }
    if (abx === "doxycycline") {
      if (age !== null && age < 18) {
        out.push({ code: "doxy-age", severity: "stop", message: "Doxycycline arm: under 18", detail: "Doxycycline is for adults 18 and over. Use the amoxicillin arm." });
      }
      if (exclusions.severeHepaticImpairment) {
        out.push({ code: "doxy-hepatic", severity: "stop", message: "Known severe hepatic impairment", detail: "Exclusion for doxycycline. Refer, or use the amoxicillin arm with a recorded reason if otherwise suitable." });
      }
      if (exclusions.isotretinoin) {
        out.push({ code: "doxy-isotret", severity: "stop", message: "Concurrent isotretinoin", detail: "Doxycycline with a retinoid risks benign intracranial hypertension. Refer." });
      }
      if (medicines.onWarfarin) {
        out.push({ code: "doxy-warfarin", severity: "stop", message: "Anticoagulated with warfarin", detail: "Doxycycline potentiates warfarin; where the patient is anticoagulated, refer rather than supply." });
      }
    }
    if (abx === "amoxicillin") {
      // "Reason doxycycline is unsuitable" is a required record, enforced by
      // the Antibiotic step validator rather than shown as an exclusion.
      if (exclusions.mononucleosisOrALL) {
        out.push({ code: "amox-mono", severity: "stop", message: "Infectious mononucleosis or acute lymphoblastic leukaemia", detail: "Exclusion for amoxicillin because of the risk of a widespread rash. Refer." });
      }
      if (exclusions.significantRenalImpairment) {
        out.push({ code: "amox-renal", severity: "stop", message: "Known significant renal impairment", detail: "Exclusion for amoxicillin. Refer." });
      }
    }
    if (isClari(abx)) {
      if (!medicines.penicillinAllergy) {
        out.push({ code: "clari-arm", severity: "stop", message: "Clarithromycin arm requires penicillin allergy", detail: "Arm 3 is for patients who are penicillin-allergic and for whom the first-line agent is unsuitable or unavailable. Use the first-line arm." });
      }
      // The first-line reason, the penicillin allergy history and the renal
      // function answer are required records, enforced by the Antibiotic
      // step validator rather than shown as exclusions.
      if (exclusions.significantRenalImpairment) {
        out.push({ code: "clari-renal", severity: "stop", message: "Known renal impairment (creatinine clearance below 30 mL/min, or unknown severity with reason to suspect it is significant)", detail: "Exclusion for clarithromycin. Refer." });
      }
      if (medicines.onSimvastatin || medicines.onClarithromycinInteracting) {
        out.push({ code: "clari-interact", severity: "stop", message: "Clarithromycin: contraindicated concurrent medicine", detail: "Concurrent ergot alkaloids, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine, ranolazine, simvastatin or lovastatin excludes. Refer." });
      }
      if (exclusions.qtProlongation) {
        out.push({ code: "clari-qt", severity: "stop", message: "Known QT prolongation, or concurrent QT-prolonging medicines", detail: "Exclusion for clarithromycin. Refer." });
      }
      if (exclusions.electrolyteDisturbance || exclusions.severeHepaticImpairment) {
        out.push({ code: "clari-electrolyte", severity: "stop", message: "Known electrolyte disturbance, or severe hepatic impairment", detail: "Exclusion for clarithromycin. Refer." });
      }
      if (medicines.onWarfarin || medicines.onDoac) {
        out.push({ code: "clari-anticoag", severity: "stop", message: "Taking warfarin or a DOAC", detail: "Exclusion for clarithromycin. Refer." });
      }
      if (medicines.onColchicine) {
        out.push({ code: "clari-colchicine", severity: "stop", message: "Taking colchicine", detail: "Risk of toxicity with clarithromycin. Refer rather than supply." });
      }
    }
    // A blank antibiotic is a validation message on the Antibiotic step
    // ("Select the antibiotic"), never a stop (stop audit, 11 Sep 2026).
    if (
      state.currentStep >= STEP_ANTIBIOTIC &&
      !armsAvailable.doxycycline &&
      !armsAvailable.amoxicillin &&
      !armsAvailable.clarithromycin
    ) {
      out.push({
        code: "no-arm",
        severity: "stop",
        message: "No arm of this PGD covers this patient",
        detail: "The recorded age, pregnancy or breastfeeding status and allergies rule out every arm. Refer the same day.",
      });
    }

    // ── Cautions. ───────────────────────────────────────────────────
    if (medicines.renalFunctionAnswer === "Known kidney impairment (see detail)" && !exclusions.significantRenalImpairment) {
      out.push({
        code: "renal-known",
        severity: "caution",
        message: "Known kidney impairment recorded",
        detail:
          "If the creatinine clearance is below 30 mL/min, or the severity is unknown and there is reason to suspect it is significant, tick Known significant renal impairment on the Exclusions step (excludes amoxicillin and clarithromycin).",
      });
    }
    if (medicines.onWarfarin && abx === "amoxicillin") {
      out.push({
        code: "warfarin",
        severity: "caution",
        message: "On warfarin",
        detail:
          "Amoxicillin can raise INR. Advise the patient to have their INR checked during the course and tell their anticoagulation service.",
      });
    }
    if (presentation.fever && !redFlags.sepsisFeatures) {
      out.push({
        code: "fever",
        severity: "caution",
        message: "Fever reported",
        detail:
          "Measure the temperature: 38C or above refers. Reassess for pneumonia and sepsis.",
      });
    }

    return out;
  }, [state, blockedAgents, armsAvailable, crbScore, inclusion, isOver65]);

  /** Per-step validation: required records before the pharmacist may move on. */
  const validators = useMemo(() => {
    const { patient, consent, consent16, presentation, observations, medicines, treatment, counselling, summary } = state;
    const patientStep = (): string | null => {
      const base = validatePatientStep(patient, { minAge: 12 });
      if (base) return base;
      if (patient.age === null) return "The patient's age could not be calculated from the date of birth";
      return null;
    };
    const consentStep = (): string | null => {
      const base = validateConsentStep(consent);
      if (base) return base;
      if (patient.age !== null && patient.age < 16) {
        if (!consent16.basis) return "Under 16: record who gave consent (parental responsibility or Gillick competence)";
        if (!consent16.detail.trim())
          return consent16.basis === "parental"
            ? "Record the name of the person with parental responsibility"
            : "Record the basis of the Gillick competence assessment";
      }
      return null;
    };
    const presentationStep = (): string | null => {
      if (presentation.coughDurationDays === null) return "Record how many days the cough has lasted";
      if (!presentation.purulentSputum) return "Answer 'Purulent sputum (yellow or green)': Yes or No (inclusion criterion)";
      if (!presentation.smokingStatus) return "Record the smoking status (the 3 week exclusion applies to current and former smokers)";
      if (!presentation.noComorbidity && presentation.comorbidities.filter((c) => c !== "age-65").length === 0 && !isOver65)
        return "Record the higher-risk comorbidities present, or confirm there are none";
      if (presentation.noComorbidity && presentation.comorbidities.filter((c) => c !== "age-65").length > 0)
        return "Either confirm no comorbidity or select the comorbidities present, not both";
      if (isOver65 && !presentation.lowerThresholdOver65Considered)
        return "Patient is 65 or over: tick Lower referral threshold for a patient aged 65 and over considered";
      return null;
    };
    const observationsStep = (): string | null => {
      if (observations.spo2 === null) return "Record SpO2 (required before any supply)";
      if (observations.respiratoryRate === null) return "Record the respiratory rate, counted for a full 60 seconds";
      if (observations.pulse === null) return "Record the pulse";
      if (observations.systolicBP === null || observations.diastolicBP === null) return "Record the blood pressure (systolic and diastolic)";
      if (observations.temperature === null) return "Record the temperature";
      return null;
    };
    const medicinesStep = (): string | null => {
      if (medicines.penicillinAllergy && !medicines.penicillinAllergyHistory.trim())
        return "Record the penicillin allergy history in the patient's own terms";
      if (medicines.renalFunctionAnswer === "Known kidney impairment (see detail)" && !medicines.renalFunctionDetail.trim())
        return "Renal function: record the detail of the known kidney impairment";
      return null;
    };
    const antibioticStep = (): string | null => {
      const abx = treatment.antibiotic;
      if (!abx) return "Select the antibiotic";
      const adult = patient.age !== null && patient.age >= 18;
      if (abx === "amoxicillin" && adult && !state.exclusions.pregnancy && !treatment.firstLineUnsuitableReason.trim())
        return "Amoxicillin in an adult: record the reason doxycycline is unsuitable for this adult";
      if (abx === "clarithromycin") {
        if (adult && !treatment.firstLineUnsuitableReason.trim())
          return "Clarithromycin in an adult: record the reason doxycycline (first-line agent) is unsuitable or unavailable";
        if (!medicines.penicillinAllergyHistory.trim())
          return "Clarithromycin: record the penicillin allergy history in the patient's own terms (Allergies & Current Medicines step)";
        if (!medicines.renalFunctionAsked || !medicines.renalFunctionAnswer)
          return "Clarithromycin: record the patient's answer under Renal function (Allergies & Current Medicines step)";
        if (medicines.renalFunctionAnswer === "Known kidney impairment (see detail)" && !medicines.renalFunctionDetail.trim())
          return "Renal function: record the detail of the known kidney impairment (Allergies & Current Medicines step)";
      }
      if (!treatment.batch.trim()) return "Record the batch number";
      if (!treatment.expiry) return "Record the expiry date";
      if (treatment.expiry < new Date().toISOString().split("T")[0])
        return "Expiry date is in the past: this pack cannot be supplied";
      return null;
    };
    const counsellingStep = (): string | null => {
      const c = counselling;
      if (!c.courseCompletion) return "Confirm the advice to complete the full 5 day course";
      if (!c.viralExplanation) return "Confirm the patient was told a cough alone may take three weeks to settle";
      if (!c.sideEffects) return "Confirm the common side effects were explained";
      if (treatment.antibiotic === "doxycycline" && !c.doxycyclineAdvice) return "Confirm the doxycycline-specific advice";
      if (treatment.antibiotic === "amoxicillin" && !c.amoxicillinAdvice) return "Confirm the amoxicillin-specific advice";
      if (treatment.antibiotic === "clarithromycin" && !c.clarithromycinAdvice) return "Confirm the clarithromycin-specific advice";
      if (!c.selfCare) return "Confirm the self-care advice";
      if (!c.safetyNetting) return "Confirm the same-day safety-netting advice";
      if (!c.followUp) return "Confirm the follow-up advice";
      if (!c.pilSupplied) return "Confirm the patient information leaflet was supplied";
      return null;
    };
    const summaryStep = (): string | null => validateSummaryStep(summary);
    return { patientStep, consentStep, presentationStep, observationsStep, medicinesStep, antibioticStep, counsellingStep, summaryStep };
  }, [state, isOver65]);

  const validationError = useMemo<string | null>(() => {
    const v = validators;
    switch (state.currentStep) {
      case 0: return v.patientStep();
      case STEP_CONSENT: return v.consentStep();
      case STEP_PRESENTATION: return v.presentationStep();
      case STEP_OBSERVATIONS: return v.observationsStep();
      case STEP_MEDICINES: return v.medicinesStep();
      case STEP_ANTIBIOTIC: return v.antibioticStep();
      case STEP_COUNSELLING: return v.counsellingStep();
      // Save & Print on the last step runs every validator again, so an
      // answer changed on an earlier step cannot be printed unchecked.
      case TOTAL_STEPS - 1:
        return (
          v.patientStep() ||
          v.consentStep() ||
          v.presentationStep() ||
          v.observationsStep() ||
          v.medicinesStep() ||
          v.antibioticStep() ||
          v.counsellingStep() ||
          v.summaryStep()
        );
      default:
        return null;
    }
  }, [state.currentStep, validators]);

  const hasStops = alerts.some((a) => a.severity === "stop");
  // A stop anywhere disables Next on every step; the blocked step offers
  // "Save as not supplied" (self-care and referrals both end there).
  const canProceed = !hasStops && validationError === null;

  const markComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(state.currentStep));
  }, [state.currentStep]);

  const handleNext = () => {
    if (!canProceed) return;
    markComplete();
    dispatch({ type: "NEXT_STEP" });
  };
  const handlePrev = () => {
    setCompletedSteps((prev) => new Set([...prev].filter((s) => s < state.currentStep - 1)));
    dispatch({ type: "PREV_STEP" });
  };
  const handleStepClick = (step: number) => {
    if (step < state.currentStep) {
      setCompletedSteps((prev) => new Set([...prev].filter((s) => s < step)));
      dispatch({ type: "SET_STEP", step });
    }
  };

  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName,
        lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth,
        nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone,
        email: state.patient.email,
        address: state.patient.address,
        gpName: state.patient.gpName,
        gpPractice: state.patient.gpPractice,
      },
      clinicalData: {
        ...(state as unknown as Record<string, unknown>),
        crbScore,
        inclusionFeature: inclusion.feature,
        effectiveComorbidities: comorbidities,
        alerts,
        pgdVersion: PGD_STRAPLINE,
      },
      outcome: hasStops ? (inclusion.met ? "referred" : "not_supplied") : "completed",
      medicine:
        !hasStops && state.treatment.antibiotic
          ? {
              name: ANTIBIOTIC_REGIMENS[state.treatment.antibiotic].product,
              dose: ANTIBIOTIC_REGIMENS[state.treatment.antibiotic].dose,
              duration: "5 days",
              quantity: ANTIBIOTIC_REGIMENS[state.treatment.antibiotic].quantity,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharm?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharm?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharm?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharm?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: !!state.consent.notifyGp },
    };
  }, [state, hasStops, crbScore, inclusion, comorbidities, alerts, __pharm]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const stepProps = {
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    onNext: handleNext,
    onPrev: handlePrev,
    canProceed,
    validationError,
    isBlocked: hasStops,
    getConsultationData,
    onNewConsultation: handleNewConsultation,
  };

  // Where a stop exists (a referral, or the common no-antibiotic outcome),
  // the advice given and the decision reached are recorded here, then the
  // consultation is saved with "Save as not supplied".
  const exclusionBox = hasStops ? (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2 mb-4">
      <p className="text-sm font-medium text-navy-900">
        {inclusion.met ? "Excluded: record the advice given and the decision reached, then use Save as not supplied" : "No antibiotic under this PGD: record the self-care and safety-netting advice given, then use Save as not supplied"}
      </p>
      <p className="text-xs text-gray-700">
        Explain why an antibiotic cannot be supplied, and say plainly that most acute coughs do not need one and settle on their own. Refer same-day where any Appendix 1 threshold is breached, the CRB score is 1 or more, or pneumonia is suspected. Give self-care and safety-netting advice, including that a cough alone may take three weeks to settle. Inform the GP where the reason for exclusion is a new clinical finding such as a low SpO2.
      </p>
      <TextArea
        label="Advice given and decision reached"
        value={state.counselling.exclusionAdvice}
        onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "exclusionAdvice", value: v })}
        rows={3}
        placeholder="e.g. self-care and safety-netting advice given; no antibiotic; return if breathless, chest pain, haemoptysis or much worse"
      />
    </div>
  ) : null;

  const under16 = state.patient.age !== null && state.patient.age < 16;
  const isAdult = state.patient.age !== null && state.patient.age >= 18;

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" {...stepProps}>
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
              requireAdult={false}
            />
            {state.patient.age !== null && state.patient.age < 12 && (
              <p className="mt-2 text-xs text-red-600 font-medium">This PGD covers patients aged 12 and over.</p>
            )}
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" {...stepProps}>
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
            {under16 && (
              <div className="mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Patient under 16: basis of consent</p>
                <p className="text-xs text-amber-900">
                  Valid informed consent must come from a person with parental responsibility, or from
                  the young person where assessed as Gillick competent, with the basis recorded.
                </p>
                <SelectInput
                  label="Consent given by"
                  value={state.consent16.basis}
                  onChange={(v) => dispatch({ type: "UPDATE_CONSENT16", field: "basis", value: v })}
                  options={[
                    { value: "parental", label: "A person with parental responsibility" },
                    { value: "gillick", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                {state.consent16.basis === "parental" && (
                  <TextInput
                    label="Name and relationship of the person with parental responsibility"
                    value={state.consent16.detail}
                    onChange={(v) => dispatch({ type: "UPDATE_CONSENT16", field: "detail", value: v })}
                    required
                  />
                )}
                {state.consent16.basis === "gillick" && (
                  <TextArea
                    label="Basis of the Gillick competence assessment"
                    value={state.consent16.detail}
                    onChange={(v) => dispatch({ type: "UPDATE_CONSENT16", field: "detail", value: v })}
                    placeholder="How the young person showed understanding of the treatment, its risks and alternatives"
                    required
                  />
                )}
              </div>
            )}
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Presentation"
            description="Acute bronchitis is usually viral. The PGD's inclusion criteria are deliberately narrow: purulent sputum PLUS either a higher-risk comorbidity or symptoms beyond 14 days."
            {...stepProps}
          >
            <div className="space-y-4">
              <NumberInput
                label="How many days has the cough lasted?"
                value={state.presentation.coughDurationDays}
                onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "coughDurationDays", value: v })}
                min={0}
                max={365}
                unit="days"
                required
              />
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                A cough from acute bronchitis commonly lasts around three weeks, and that duration alone
                is not a reason to treat. The document excludes a cough lasting more than 3 weeks in a
                current or former smoker.
              </div>
              <SelectInput
                label="Smoking status"
                value={state.presentation.smokingStatus}
                onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "smokingStatus", value: v as SmokingStatus })}
                options={[
                  { value: "never", label: "Never smoked" },
                  { value: "former", label: "Former smoker" },
                  { value: "current", label: "Current smoker" },
                ]}
                required
              />

              <p className="text-sm font-semibold text-navy-900 pt-2">Symptoms</p>
              <div className="space-y-1">
                <SelectInput
                  label="Purulent sputum (yellow or green)"
                  value={state.presentation.purulentSputum}
                  onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "purulentSputum", value: v })}
                  options={[
                    { value: "yes", label: "Yes: purulent (yellow or green) sputum" },
                    { value: "no", label: "No: sputum clear, or no sputum (inclusion not met)" },
                  ]}
                  required
                />
                <p className="text-xs text-gray-500">Required for inclusion. Purulent sputum on its own does not indicate a bacterial infection needing an antibiotic.</p>
              </div>
              <Checkbox label="Fever" checked={state.presentation.fever} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "fever", value: v })} />
              <Checkbox label="Breathlessness" checked={state.presentation.breathless} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "breathless", value: v })} />
              <Checkbox label="Wheeze" checked={state.presentation.wheeze} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "wheeze", value: v })} />
              <Checkbox label="Chest pain" checked={state.presentation.chestPain} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "chestPain", value: v })} />

              <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Inclusion criteria</p>
                <p className="text-xs text-amber-900">
                  PURULENT SPUTUM, AND EITHER a higher-risk comorbidity OR symptoms persisting beyond
                  14 days. If these are not met, the right outcome is self-care advice and safety
                  netting, and that is a normal result for this service rather than a failed
                  consultation.
                </p>
                <p className="text-xs font-medium text-navy-900">Higher-risk comorbidities present (select all that apply) *</p>
                {COMORBIDITY_OPTIONS.map((opt) => {
                  const derived = opt.value === "age-65";
                  const checked = derived ? isOver65 : state.presentation.comorbidities.includes(opt.value);
                  return (
                    <Checkbox
                      key={opt.value}
                      label={opt.label}
                      checked={checked}
                      onChange={(v) => {
                        if (derived) return;
                        const next = v
                          ? [...state.presentation.comorbidities.filter((c) => c !== opt.value), opt.value]
                          : state.presentation.comorbidities.filter((c) => c !== opt.value);
                        dispatch({ type: "UPDATE_PRESENTATION", field: "comorbidities", value: next });
                        if (v) dispatch({ type: "UPDATE_PRESENTATION", field: "noComorbidity", value: false });
                      }}
                      description={derived ? (state.patient.age !== null ? `Patient is ${state.patient.age}: ${isOver65 ? "applies" : "does not apply"}. Set from the date of birth, not by hand.` : "Enter the date of birth on the Patient step") : undefined}
                    />
                  );
                })}
                <Checkbox
                  label="No higher-risk comorbidity present (confirmed)"
                  checked={state.presentation.noComorbidity}
                  onChange={(v) => {
                    dispatch({ type: "UPDATE_PRESENTATION", field: "noComorbidity", value: v });
                    if (v) dispatch({ type: "UPDATE_PRESENTATION", field: "comorbidities", value: [] });
                  }}
                  description={isOver65 ? "Age 65 and over still counts as a higher-risk comorbidity for inclusion." : undefined}
                />
                {isOver65 && (
                  <Checkbox
                    label="Lower referral threshold for a patient aged 65 and over considered"
                    checked={state.presentation.lowerThresholdOver65Considered}
                    onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "lowerThresholdOver65Considered", value: v })}
                    description="The CRB-65 age point is not applied in this service. Take the whole picture into account rather than the numbers alone, and refer if anything about the presentation is not straightforward. Record that you considered it."
                    required
                  />
                )}
                <div className={`text-xs font-semibold ${inclusion.met ? "text-green-700" : "text-red-700"}`}>
                  Inclusion feature: {inclusion.feature}
                </div>
                <TextArea
                  label="Clinical rationale"
                  value={state.presentation.rationale}
                  onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "rationale", value: v })}
                  placeholder="e.g. 16 days of productive cough with purulent sputum, worsening rather than settling, COPD background"
                />
              </div>
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Observations (Appendix 1)"
            description="Every observation must be measured and recorded before any supply. If any threshold is breached, or the CRB score is 1 or more, do not supply: refer."
            {...stepProps}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="SpO2 on air at rest, after 5 minutes" value={state.observations.spo2} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "spo2", value: v })} min={50} max={100} unit="% (refer if below 94)" required />
                <NumberInput label="Respiratory rate, counted for a full 60 seconds" value={state.observations.respiratoryRate} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "respiratoryRate", value: v })} min={4} max={80} unit="/min (refer if 22 or above)" required />
                <NumberInput label="Pulse at rest" value={state.observations.pulse} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "pulse", value: v })} min={20} max={250} unit="bpm (refer if above 110)" required />
                <NumberInput label="Temperature" value={state.observations.temperature} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "temperature", value: v })} min={30} max={45} unit="C (refer if 38 or above)" required />
                <NumberInput label="Systolic blood pressure" value={state.observations.systolicBP} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "systolicBP", value: v })} min={40} max={260} unit="mmHg (refer if below 100)" required />
                <NumberInput label="Diastolic blood pressure" value={state.observations.diastolicBP} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "diastolicBP", value: v })} min={20} max={160} unit="mmHg (CRB point if 60 or less)" required />
              </div>
              <Checkbox label="New confusion, disorientation or drowsiness" checked={state.observations.newConfusion} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "newConfusion", value: v })} description="Refer on any new confusion. Also scores a CRB point." />
              <Checkbox label="Known COPD: SpO2 has fallen below the patient's own documented baseline" checked={state.observations.copdBelowBaseline} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATION", field: "copdBelowBaseline", value: v })} description="Refer." />
              <div className={`p-3 rounded-md border text-sm ${crbScore === 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                <strong>CRB score (without the age point): {crbScore}</strong>
                <p className="text-xs mt-1">
                  One point each for new confusion, respiratory rate 30 or more, and systolic below 90 or
                  diastolic 60 or less. Score 0 may be treated if all other criteria are met; 1 or more,
                  refer for same-day assessment. The age point is deliberately not applied in this service.
                </p>
              </div>
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Red Flags"
            description="Any tick routes the patient out of this service, regardless of any score. The dangerous miss here is pneumonia."
            {...stepProps}
          >
            <div className="space-y-2">
              {RED_FLAG_LABELS.map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={state.redFlags[key]}
                  onChange={(v) => dispatch({ type: "UPDATE_REDFLAG", field: key, value: v })}
                />
              ))}
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper title="Exclusions" description="Items marked by arm only exclude that arm; the tool applies them when the antibiotic is chosen." {...stepProps}>
            <div className="space-y-2">
              <Checkbox label="An antibiotic already taken for this episode" checked={state.exclusions.antibioticAlreadyTaken} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "antibioticAlreadyTaken", value: v })} description="One course per episode. Exclusion, all arms." />
              <Checkbox label="Pregnant" checked={state.exclusions.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "pregnancy", value: v })} description="Amoxicillin arm only. A pregnant penicillin-allergic patient has no arm: refer the same day." />
              <Checkbox label="Breastfeeding" checked={state.exclusions.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "breastfeeding", value: v })} description="Amoxicillin arm only. Doxycycline and clarithromycin are excluded." />
              <Checkbox label="Hypersensitivity to the intended agent or any of its excipients" checked={state.exclusions.hypersensitivityToChosenAgent} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "hypersensitivityToChosenAgent", value: v })} />
              <Checkbox label="Unable to take or retain oral medication" checked={state.exclusions.unableToTakeOral} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "unableToTakeOral", value: v })} />
              <Checkbox label="Known severe hepatic impairment" checked={state.exclusions.severeHepaticImpairment} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "severeHepaticImpairment", value: v })} description="Excludes doxycycline and clarithromycin." />
              <Checkbox label="Known significant renal impairment (for clarithromycin: creatinine clearance below 30 mL/min, or unknown severity with reason to suspect it is significant)" checked={state.exclusions.significantRenalImpairment} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "significantRenalImpairment", value: v })} description="Excludes amoxicillin and clarithromycin. Refer." />
              <Checkbox label="Concurrent isotretinoin" checked={state.exclusions.isotretinoin} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "isotretinoin", value: v })} description="Excludes doxycycline: benign intracranial hypertension risk with a retinoid." />
              <Checkbox label="Infectious mononucleosis or acute lymphoblastic leukaemia" checked={state.exclusions.mononucleosisOrALL} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "mononucleosisOrALL", value: v })} description="Excludes amoxicillin: risk of a widespread rash." />
              <Checkbox label="Known QT prolongation, or concurrent QT-prolonging medicines" checked={state.exclusions.qtProlongation} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "qtProlongation", value: v })} description="Excludes clarithromycin." />
              <Checkbox label="Known electrolyte disturbance" checked={state.exclusions.electrolyteDisturbance} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "electrolyteDisturbance", value: v })} description="Excludes clarithromycin." />
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Allergies & Current Medicines"
            description="Allergies recorded here remove the corresponding antibiotic from the next step."
            {...stepProps}
          >
            <div className="space-y-2">
              <Checkbox label="Penicillin or beta-lactam allergy, or any history of cephalosporin allergy" checked={state.medicines.penicillinAllergy} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "penicillinAllergy", value: v })} description="Rules out amoxicillin. Clarithromycin arm applies (not in pregnancy or breastfeeding)." />
              {state.medicines.penicillinAllergy && (
                <TextArea
                  label="Penicillin allergy history in the patient's own terms"
                  value={state.medicines.penicillinAllergyHistory}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "penicillinAllergyHistory", value: v })}
                  placeholder="What happened, which medicine, when"
                  required
                />
              )}
              <Checkbox label="Tetracycline allergy (hypersensitivity to doxycycline or other tetracyclines)" checked={state.medicines.tetracyclineAllergy} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "tetracyclineAllergy", value: v })} description="Rules out doxycycline" />
              <Checkbox label="Macrolide allergy" checked={state.medicines.macrolideAllergy} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "macrolideAllergy", value: v })} description="Rules out clarithromycin, which is the only macrolide this PGD authorises" />
              <Checkbox label="Taking simvastatin or lovastatin" checked={state.medicines.onSimvastatin} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onSimvastatin", value: v })} description="Excludes clarithromycin" />
              <Checkbox label="Taking ergot alkaloids, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine or ranolazine" checked={state.medicines.onClarithromycinInteracting} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onClarithromycinInteracting", value: v })} description="Excludes clarithromycin" />
              <Checkbox label="Taking colchicine" checked={state.medicines.onColchicine} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onColchicine", value: v })} description="Clarithromycin: risk of toxicity. Refer rather than supply." />
              <Checkbox label="Taking warfarin" checked={state.medicines.onWarfarin} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onWarfarin", value: v })} description="Doxycycline: refer rather than supply. Clarithromycin: exclusion. Amoxicillin: advise INR check." />
              <Checkbox label="Taking a DOAC (apixaban, rivaroxaban, edoxaban, dabigatran)" checked={state.medicines.onDoac} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onDoac", value: v })} description="Excludes clarithromycin" />
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <SelectInput
                  label="Renal function: ask the patient about their kidney function and record the answer"
                  value={state.medicines.renalFunctionAnswer}
                  onChange={(v) => {
                    dispatch({ type: "UPDATE_MEDICINE", field: "renalFunctionAnswer", value: v });
                    dispatch({ type: "UPDATE_MEDICINE", field: "renalFunctionAsked", value: v !== "" });
                  }}
                  options={[
                    { value: "No known kidney problems", label: "No known kidney problems" },
                    { value: "Patient does not know; no reason to suspect impairment", label: "Patient does not know; no reason to suspect impairment" },
                    { value: "Known kidney impairment (see detail)", label: "Known kidney impairment (record the detail below)" },
                  ]}
                  required={state.medicines.penicillinAllergy}
                />
                <p className="text-xs text-gray-500">Required before a clarithromycin supply. Where the patient does not know and there is no reason to suspect impairment, supply and record the answer.</p>
                <TextInput
                  label={state.medicines.renalFunctionAnswer === "Known kidney impairment (see detail)" ? "Renal function detail" : "Renal function detail (optional)"}
                  value={state.medicines.renalFunctionDetail}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "renalFunctionDetail", value: v })}
                  placeholder="e.g. eGFR 45 at last blood test; CKD stage 3"
                  required={state.medicines.renalFunctionAnswer === "Known kidney impairment (see detail)"}
                />
              </div>
              <TextArea label="Other current medicines" value={state.medicines.other} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "other", value: v })} />
            </div>
          </StepWrapper>
        );

      case 7: {
        const armAllowed = (k: keyof typeof ANTIBIOTIC_REGIMENS) =>
          k === "doxycycline"
            ? armsAvailable.doxycycline
            : k === "amoxicillin"
              ? armsAvailable.amoxicillin
              : armsAvailable.clarithromycin;
        const options = (Object.keys(ANTIBIOTIC_REGIMENS) as Array<keyof typeof ANTIBIOTIC_REGIMENS>)
          .filter((k) => !blockedAgents.has(k) && armAllowed(k))
          .map((k) => ({ value: k, label: ANTIBIOTIC_REGIMENS[k].label }));
        const abx = state.treatment.antibiotic;
        const needsReason =
          (abx === "amoxicillin" && isAdult && !state.exclusions.pregnancy) ||
          (isClari(abx) && isAdult);
        return (
          <StepWrapper title="Antibiotic & Supply" {...stepProps}>
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                <p><strong>Arm 1, doxycycline:</strong> adults 18 and over. First line.</p>
                <p><strong>Arm 2, amoxicillin:</strong> patients aged 12 to 17; pregnant patients of any age; and adults 18 and over for whom doxycycline is unsuitable and who are not penicillin-allergic.</p>
                <p><strong>Arm 3, clarithromycin:</strong> patients aged 12 and over who are penicillin-allergic and for whom the first-line agent for their circumstances is unsuitable or unavailable. Not in pregnancy or breastfeeding. 250 mg twice a day only: the document&apos;s 500 mg row is for marked systemic upset and says those patients are referred, so it is not offered here.</p>
              </div>
              {blockedAgents.size > 0 && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-300 text-sm text-amber-900">
                  Removed because of a recorded allergy: {[...blockedAgents].join(", ")}.
                </div>
              )}
              <SelectInput
                label="Antibiotic"
                value={abx}
                onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "antibiotic", value: v as Antibiotic })}
                options={options}
                required
              />
              {abx && (
                <div className="p-3 rounded-md bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 space-y-1">
                  <p className="text-sm font-semibold text-navy-900">
                    {ANTIBIOTIC_REGIMENS[abx as Exclude<Antibiotic, "">].label}
                  </p>
                  <p className="text-xs text-gray-700">
                    Route: {ANTIBIOTIC_REGIMENS[abx as Exclude<Antibiotic, "">].route}. Maximum treatment period 5 days.
                  </p>
                </div>
              )}
              {needsReason && (
                <TextArea
                  label={
                    isClari(abx)
                      ? "Reason doxycycline (first-line agent) is unsuitable or unavailable"
                      : "Reason doxycycline is unsuitable for this adult"
                  }
                  value={state.treatment.firstLineUnsuitableReason}
                  onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "firstLineUnsuitableReason", value: v })}
                  placeholder="e.g. tetracycline allergy; concurrent isotretinoin; severe hepatic impairment; unable to obtain"
                  required
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Batch number" value={state.treatment.batch} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "batch", value: v })} required />
                <TextInput label="Expiry" type="date" value={state.treatment.expiry} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "expiry", value: v })} required />
              </div>
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                All courses under this PGD are 5 days. Supply the whole course only; one course per
                episode. A second course is not authorised under this PGD; refer.
              </div>
            </div>
          </StepWrapper>
        );
      }

      case 8:
        return (
          <StepWrapper title="Counselling" description="Confirm each item discussed. Supply the patient information leaflet." {...stepProps}>
            <div className="space-y-2">
              <Checkbox label="Finish the course: complete the full 5 day course even if feeling better" checked={state.counselling.courseCompletion} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "courseCompletion", value: v })} />
              <Checkbox label="Explained that a cough alone may take three weeks to settle, is not by itself a reason to return, and that this is not treatment failure" checked={state.counselling.viralExplanation} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "viralExplanation", value: v })} />
              <Checkbox label="Common side effects, particularly nausea and diarrhoea, and what to do about them" checked={state.counselling.sideEffects} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })} />
              {state.treatment.antibiotic === "doxycycline" && (
                <Checkbox label="Doxycycline: take with plenty of water, sitting or standing up, and do not lie down for 30 minutes afterwards; avoid antacids, indigestion remedies, iron tablets and milk within 2 hours of a dose; you may burn more easily in the sun, use sun protection" checked={state.counselling.doxycyclineAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "doxycyclineAdvice", value: v })} />
              )}
              {state.treatment.antibiotic === "amoxicillin" && (
                <Checkbox label="Amoxicillin: one capsule three times a day, every 8 hours; some diarrhoea is common, get advice if it is severe or bloody; a rash with this antibiotic is usually not an allergy, but get it checked, and seek urgent help for wheeze or swelling of the lips or tongue" checked={state.counselling.amoxicillinAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "amoxicillinAdvice", value: v })} />
              )}
              {isClari(state.treatment.antibiotic) && (
                <Checkbox label="Clarithromycin: one tablet twice a day; tell us or your GP before starting any new medicine, this antibiotic interacts with a lot of them; it can cause a metallic or altered taste, which settles after the course; possible dizziness or vertigo" checked={state.counselling.clarithromycinAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "clarithromycinAdvice", value: v })} />
              )}
              <Checkbox label="Self-care: fluids, rest, simple analgesia, and honey for cough" checked={state.counselling.selfCare} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "selfCare", value: v })} />
              <Checkbox label="Seek help the same day if you become breathless, develop chest pain, cough blood, or feel much worse at any point. Do not wait to finish the course." checked={state.counselling.safetyNetting} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "safetyNetting", value: v })} />
              <Checkbox label="Seek advice if breathlessness, chest pain or fever develop, if symptoms are no better after finishing the course, or you are worse at any point. A cough alone may take three weeks to settle." checked={state.counselling.followUp} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUp", value: v })} />
              <Checkbox label="Patient information leaflet supplied" checked={state.counselling.pilSupplied} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })} />
              <TextArea
                label="Adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk, and inform the GP)"
                value={state.counselling.adverseReactions}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "adverseReactions", value: v })}
                placeholder="None known at the time of supply"
              />
            </div>
          </StepWrapper>
        );

      case 9: {
        const abx = state.treatment.antibiotic;
        const regimen = abx ? ANTIBIOTIC_REGIMENS[abx as Exclude<Antibiotic, "">] : null;
        const o = state.observations;
        return (
          <StepWrapper title="Summary & Record" {...stepProps}>
            <div className="space-y-4 mb-6">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Record will be saved with PGD slug <code>chest-service</code>. {PGD_STRAPLINE}.
              </p>
              <div className="p-4 bg-gray-50 rounded-md text-xs space-y-2">
                <div><strong>Patient:</strong> {state.patient.firstName} {state.patient.lastName} ({state.patient.dateOfBirth}), age {state.patient.age ?? "not recorded"}</div>
                {under16 && (
                  <div><strong>Consent (under 16):</strong> {state.consent16.basis === "parental" ? "Person with parental responsibility" : state.consent16.basis === "gillick" ? "Young person, Gillick competent" : "Not recorded"}{state.consent16.detail ? `: ${state.consent16.detail}` : ""}</div>
                )}
                <div><strong>Cough duration:</strong> {state.presentation.coughDurationDays ?? "not recorded"} days</div>
                <div><strong>Inclusion feature met:</strong> {inclusion.feature}</div>
                <div><strong>Consent:</strong> {state.consent.informedConsentGiven ? "Valid informed consent given" : "NOT recorded"}</div>
                <div><strong>Comorbidities:</strong> {comorbidities.length > 0 ? comorbidities.map(comorbidityLabel).join(", ") : "None"}{isOver65 ? `; lower referral threshold considered: ${state.presentation.lowerThresholdOver65Considered ? "yes" : "no"}` : ""}</div>
                <div><strong>Smoking status:</strong> {state.presentation.smokingStatus || "not recorded"}</div>
                <div><strong>Observations:</strong> SpO2 {o.spo2 ?? "?"}%, RR {o.respiratoryRate ?? "?"}/min, pulse {o.pulse ?? "?"} bpm, BP {o.systolicBP ?? "?"}/{o.diastolicBP ?? "?"} mmHg, temp {o.temperature ?? "?"} C, new confusion {o.newConfusion ? "yes" : "no"}</div>
                <div><strong>CRB score (without age point):</strong> {crbScore}</div>
                <div><strong>Arm and medicine:</strong> {regimen ? `${regimen.product}; ${regimen.dose}; ${regimen.quantity}; ${regimen.route}` : "None supplied"}</div>
                {state.treatment.firstLineUnsuitableReason && (
                  <div><strong>Reason first-line agent not used:</strong> {state.treatment.firstLineUnsuitableReason}</div>
                )}
                <div><strong>Penicillin allergy:</strong> {state.medicines.penicillinAllergy ? `Yes: ${state.medicines.penicillinAllergyHistory || "history not recorded"}` : "None recorded"}</div>
                {isClari(abx) && (
                  <div><strong>Renal function:</strong> {state.medicines.renalFunctionAnswer || "not asked"}{state.medicines.renalFunctionDetail ? ` (${state.medicines.renalFunctionDetail})` : ""}</div>
                )}
                <div><strong>Batch / expiry:</strong> {state.treatment.batch || "not recorded"} / {state.treatment.expiry || "not recorded"}</div>
                <div><strong>Counselling:</strong> {[state.counselling.courseCompletion && "course completion", state.counselling.viralExplanation && "three week cough explained", state.counselling.sideEffects && "side effects", state.counselling.selfCare && "self-care", state.counselling.safetyNetting && "same-day safety netting", state.counselling.followUp && "follow-up", state.counselling.pilSupplied && "PIL supplied"].filter(Boolean).join(", ") || "none recorded"}</div>
                <div><strong>Stops present:</strong> {hasStops ? "Yes" : "No"}</div>
                {regimen && !hasStops ? (
                  <div><strong>Supplied under:</strong> {PGD_STRAPLINE}</div>
                ) : (
                  <div><strong>Outcome:</strong> NOT SUPPLIED. {state.counselling.exclusionAdvice ? `Advice: ${state.counselling.exclusionAdvice}` : ""}</div>
                )}
              </div>
            </div>
          </StepWrapper>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6 print:hidden">
        <ProgressBar
          stepLabels={STEP_LABELS}
          currentStep={state.currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
          hasErrors={validationError !== null || hasStops}
        />
        {alerts.length > 0 && <AlertBanner alerts={alerts} />}
        {exclusionBox}
        {renderStep()}
      </div>
      <div className="hidden print:block">
        <ChestServiceSummaryReport
          state={state}
          alerts={alerts}
          crbScore={crbScore}
          inclusionFeature={inclusion.feature}
          comorbidities={comorbidities}
          isOver65={isOver65}
        />
      </div>
    </>
  );
}

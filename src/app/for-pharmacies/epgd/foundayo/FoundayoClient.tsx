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
import {
  usePreviousWeightConsultation,
  describePrevious,
} from "../shared/hooks/usePreviousWeightConsultation";

// ─────────────────────────────────────────────────────────────────────────
// Foundayo (orforglipron) consultation tool.
//
// Aligned to PGD v007, issued 11 September 2026 (v002 was reconciled
// against the UK SPC; v003 widened the concurrent GLP-1 exclusion to any
// indication; v006 made any sulfonylurea, meglitinide or insulin a blanket
// exclusion with no GP-monitored route). Two things in here exist because
// v001 got them wrong and the SPC put them right:
//
//   1. Oral hormonal contraception. Orforglipron reduces its efficacy, and
//      the 30 day window reopens after EVERY dose increase, not just at
//      initiation. On a six step titration that is six separate windows,
//      which is easy to counsel once and then forget. The tool therefore
//      treats missing contraception advice as a hard stop rather than a
//      checklist item.
//
//   2. Pregnancy. The licensed interval is at least 3 weeks before a
//      planned pregnancy. v001 carried the semaglutide and tirzepatide
//      intervals across from the sister PGDs, which was simply wrong.
//
// Dose ceilings are enforced rather than advised: a strong CYP3A4 inhibitor
// or a clinical OATP1B inhibitor caps orforglipron at 9 mg, so selecting a
// higher tablet raises a stop instead of relying on the pharmacist to
// remember the interaction from the document.
// ─────────────────────────────────────────────────────────────────────────

type VisitType = "" | "initiation" | "escalation" | "continuation" | "restart";

/** Licensed titration ladder, in order. */
const DOSE_LADDER = ["0.8", "2.5", "5.5", "9", "14.5", "17.2"] as const;
type Dose = (typeof DOSE_LADDER)[number] | "";

/** Doses that exceed the 9 mg ceiling imposed by certain interactions. */
const ABOVE_CEILING: string[] = ["14.5", "17.2"];

/** Document: one month of treatment at the current strength per appointment. */
const MAX_TABLETS_PER_SUPPLY = 30;
const PGD_VERSION_LINE = "Foundayo PGD v007, issued 11 September 2026";

interface FoundayoState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  informedConsent: {
    treatmentExplained: boolean;
    riskBenefitDiscussed: boolean;
    alternativesDiscussed: boolean;
    privateSupplyExplained: boolean;
    writtenConsentObtained: boolean;
  };
  visit: {
    type: VisitType;
    /** Restart only: more than 2 months since discontinuing, so the BMI
     *  inclusion criteria apply again (PGD dose row). */
    restartGapOver2Months: boolean;
  };
  eligibility: {
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
    /** Weight at initiation, carried forward from the first record or
     *  entered by the pharmacist, so the 5% at 6 months figure exists. */
    initialWeightKg: number | null;
    hasComorbidity: boolean;
    comorbidities: string;
    targetWeightKg: number | null;
    willingLifestyleChange: boolean;
    initialAssessmentDone: boolean;
    canSwallowOnceDaily: boolean;
  };
  exclusions: {
    pregnancyOrPlanning: boolean;
    breastfeeding: boolean;
    hypersensitivity: boolean;
    mtcOrMen2: boolean;
    pancreatitisHistory: boolean;
    severeGiDiseaseOrGastroparesis: boolean;
    gallstonesOrRecentCholecystectomy: boolean;
    endocrineCauseOfObesity: boolean;
    concurrentGlp1OrSecretagogue: boolean;
    type1Diabetes: boolean;
    diabeticRetinopathy: boolean;
    insulinTreatedDiabetes: boolean;
    severeRenalImpairment: boolean;
    severeHepaticImpairment: boolean;
    heartFailureEfBelow40: boolean;
    activeEatingDisorder: boolean;
  };
  cautions: {
    mentalHealthHistory: boolean; // suicidal ideation history or active severe mental illness
    psychiatricOversightInPlace: boolean;
    mentalHealthConcern: boolean;
    mildModerateRenalImpairment: boolean;
    raisedRestingHeartRate: boolean;
    sustainedHeartRateRise: boolean; // on treatment: discontinue
    t2dmOnMetforminSglt2Dpp4: boolean;
    gpInformed: boolean;
  };
  interactions: {
    /** Document: check the full medication list at every visit. */
    medicationListReviewed: boolean;
    strongCyp3a4AndOatp1bInhibitor: boolean; // ritonavir, telaprevir
    strongCyp3a4Inducer: boolean; // rifampicin, carbamazepine, phenytoin, St John's wort
    moderateCyp3a4Inducer: boolean; // bosentan, efavirenz
    strongCyp3a4Inhibitor: boolean; // clarithromycin, ketoconazole, itraconazole
    oatp1bInhibitor: boolean; // ciclosporin
    simvastatin: boolean;
    simvastatinPrescriberConfirmed: boolean;
    rosuvastatinOver20mg: boolean;
    oralTopotecan: boolean;
    warfarin: boolean;
    sulfonylureaOrInsulin: boolean; // any sulfonylurea, meglitinide or insulin: exclusion
    antihypertensives: boolean;
    hypotensionSymptoms: boolean; // dizziness, light-headedness or falls on treatment
    oralHrt: boolean;
    other: string;
  };
  dose: {
    currentDose: Dose;
    newDose: Dose;
    daysAtCurrentDose: number | null;
    reassessedAtVisit: boolean;
    rationale: string;
  };
  record: {
    productName: string;
    batchNumber: string;
    quantitySupplied: number | null;
    adverseReactions: string;
    /** Advice given if excluded or declines treatment (records row). */
    adviceIfExcluded: string;
  };
  contraception: {
    notApplicable: boolean;
    usesOralHormonal: boolean;
    advisedNonOralOrBarrier: boolean;
    advisedRepeatAfterEachIncrease: boolean;
  };
  counselling: {
    swallowWholeNoRestriction: boolean;
    oneTabletOnly: boolean;
    missedDose: boolean;
    giSideEffects: boolean;
    dehydrationAndKidney: boolean;
    pancreatitisRedFlag: boolean;
    gallbladderRedFlag: boolean;
    hypotensionSymptoms: boolean;
    urgentWarningSymptoms: boolean;
    weightLossExpectations: boolean;
    pregnancy3Weeks: boolean;
    anaesthesiaWarning: boolean;
    followUpPlan: boolean;
    reassessmentAt6Months: boolean;
    pilAndWrittenAdviceGiven: boolean;
  };
  summary: BaseSummary;
}

const STEP_LABELS = [
  "Patient",
  "Consent",
  "Informed Consent",
  "Eligibility & BMI",
  "Exclusions",
  "Medicines",
  "Dose",
  "Contraception",
  "Counselling",
  "Summary",
];
const TOTAL_STEPS = STEP_LABELS.length;
const STEP_INFORMED_CONSENT = STEP_LABELS.indexOf("Informed Consent");
const STEP_ELIGIBILITY = STEP_LABELS.indexOf("Eligibility & BMI");
const STEP_MEDICINES = STEP_LABELS.indexOf("Medicines");
const STEP_SUMMARY = STEP_LABELS.indexOf("Summary");
const STEP_DOSE = STEP_LABELS.indexOf("Dose");
const STEP_CONTRACEPTION = STEP_LABELS.indexOf("Contraception");
const STEP_COUNSELLING = STEP_LABELS.indexOf("Counselling");

function initialState(): FoundayoState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    informedConsent: {
      treatmentExplained: false,
      riskBenefitDiscussed: false,
      alternativesDiscussed: false,
      privateSupplyExplained: false,
      writtenConsentObtained: false,
    },
    visit: { type: "", restartGapOver2Months: false },
    eligibility: {
      heightCm: null,
      weightKg: null,
      bmi: null,
      initialWeightKg: null,
      hasComorbidity: false,
      comorbidities: "",
      targetWeightKg: null,
      willingLifestyleChange: false,
      initialAssessmentDone: false,
      canSwallowOnceDaily: false,
    },
    exclusions: {
      pregnancyOrPlanning: false,
      breastfeeding: false,
      hypersensitivity: false,
      mtcOrMen2: false,
      pancreatitisHistory: false,
      severeGiDiseaseOrGastroparesis: false,
      gallstonesOrRecentCholecystectomy: false,
      endocrineCauseOfObesity: false,
      concurrentGlp1OrSecretagogue: false,
      type1Diabetes: false,
      diabeticRetinopathy: false,
      insulinTreatedDiabetes: false,
      severeRenalImpairment: false,
      severeHepaticImpairment: false,
      heartFailureEfBelow40: false,
      activeEatingDisorder: false,
    },
    cautions: {
      mentalHealthHistory: false,
      psychiatricOversightInPlace: false,
      mentalHealthConcern: false,
      mildModerateRenalImpairment: false,
      raisedRestingHeartRate: false,
      sustainedHeartRateRise: false,
      t2dmOnMetforminSglt2Dpp4: false,
      gpInformed: false,
    },
    interactions: {
      medicationListReviewed: false,
      strongCyp3a4AndOatp1bInhibitor: false,
      strongCyp3a4Inducer: false,
      moderateCyp3a4Inducer: false,
      strongCyp3a4Inhibitor: false,
      oatp1bInhibitor: false,
      simvastatin: false,
      simvastatinPrescriberConfirmed: false,
      rosuvastatinOver20mg: false,
      oralTopotecan: false,
      warfarin: false,
      sulfonylureaOrInsulin: false,
      antihypertensives: false,
      hypotensionSymptoms: false,
      oralHrt: false,
      other: "",
    },
    dose: {
      currentDose: "",
      newDose: "",
      daysAtCurrentDose: null,
      reassessedAtVisit: false,
      rationale: "",
    },
    record: {
      productName: "Foundayo (orforglipron) film-coated tablets",
      batchNumber: "",
      quantitySupplied: null,
      adverseReactions: "",
      adviceIfExcluded: "",
    },
    contraception: {
      notApplicable: false,
      usesOralHormonal: false,
      advisedNonOralOrBarrier: false,
      advisedRepeatAfterEachIncrease: false,
    },
    counselling: {
      swallowWholeNoRestriction: false,
      oneTabletOnly: false,
      missedDose: false,
      giSideEffects: false,
      dehydrationAndKidney: false,
      pancreatitisRedFlag: false,
      gallbladderRedFlag: false,
      hypotensionSymptoms: false,
      urgentWarningSymptoms: false,
      weightLossExpectations: false,
      pregnancy3Weeks: false,
      anaesthesiaWarning: false,
      followUpPlan: false,
      reassessmentAt6Months: false,
      pilAndWrittenAdviceGiven: false,
    },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_INFORMED"; field: keyof FoundayoState["informedConsent"]; value: boolean }
  | { type: "UPDATE_VISIT"; field: keyof FoundayoState["visit"]; value: unknown }
  | { type: "UPDATE_ELIGIBILITY"; field: keyof FoundayoState["eligibility"]; value: unknown }
  | { type: "UPDATE_EXCLUSION"; field: keyof FoundayoState["exclusions"]; value: boolean }
  | { type: "UPDATE_CAUTION"; field: keyof FoundayoState["cautions"]; value: boolean }
  | { type: "UPDATE_INTERACTION"; field: keyof FoundayoState["interactions"]; value: unknown }
  | { type: "UPDATE_DOSE"; field: keyof FoundayoState["dose"]; value: unknown }
  | { type: "UPDATE_RECORD"; field: keyof FoundayoState["record"]; value: unknown }
  | { type: "UPDATE_CONTRACEPTION"; field: keyof FoundayoState["contraception"]; value: boolean }
  | { type: "UPDATE_COUNSELLING"; field: keyof FoundayoState["counselling"]; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: unknown }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

function reducer(state: FoundayoState, action: Action): FoundayoState {
  switch (action.type) {
    case "UPDATE_PATIENT": {
      const patient = { ...state.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        patient.age = calculateAge(action.value as string);
      }
      return { ...state, patient };
    }
    case "UPDATE_CONSENT":
      return { ...state, consent: { ...state.consent, [action.field]: action.value } };
    case "UPDATE_INFORMED":
      return { ...state, informedConsent: { ...state.informedConsent, [action.field]: action.value } };
    case "UPDATE_VISIT":
      return { ...state, visit: { ...state.visit, [action.field]: action.value } };
    case "UPDATE_ELIGIBILITY": {
      const eligibility = { ...state.eligibility, [action.field]: action.value };
      if (
        (action.field === "heightCm" || action.field === "weightKg") &&
        eligibility.heightCm &&
        eligibility.weightKg
      ) {
        const m = eligibility.heightCm / 100;
        eligibility.bmi = parseFloat((eligibility.weightKg / (m * m)).toFixed(1));
      }
      return { ...state, eligibility };
    }
    case "UPDATE_EXCLUSION":
      return { ...state, exclusions: { ...state.exclusions, [action.field]: action.value } };
    case "UPDATE_CAUTION":
      return { ...state, cautions: { ...state.cautions, [action.field]: action.value } };
    case "UPDATE_INTERACTION":
      return { ...state, interactions: { ...state.interactions, [action.field]: action.value } };
    case "UPDATE_DOSE":
      return { ...state, dose: { ...state.dose, [action.field]: action.value } };
    case "UPDATE_RECORD":
      return { ...state, record: { ...state.record, [action.field]: action.value } };
    case "UPDATE_CONTRACEPTION":
      return { ...state, contraception: { ...state.contraception, [action.field]: action.value } };
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

interface Alert {
  code: string;
  severity: "stop" | "caution" | "red-flag";
  message: string;
  detail: string;
}

/** True when an interaction caps orforglipron at 9 mg once daily. */
function nineMgCeilingApplies(i: FoundayoState["interactions"]): boolean {
  return i.strongCyp3a4Inhibitor || i.oatp1bInhibitor;
}

const EXCLUSION_LABELS: [keyof FoundayoState["exclusions"], string, string?][] = [
  [
    "pregnancyOrPlanning",
    "Pregnant, planning pregnancy, or trying to conceive",
    "Effective contraception is required throughout treatment. Orforglipron must be discontinued at least 3 weeks before a planned pregnancy and stopped immediately if pregnancy occurs or is suspected.",
  ],
  ["breastfeeding", "Currently breastfeeding"],
  ["hypersensitivity", "Known hypersensitivity to orforglipron or to any of the excipients"],
  ["mtcOrMen2", "Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)"],
  ["pancreatitisHistory", "History of pancreatitis, acute or chronic"],
  ["severeGiDiseaseOrGastroparesis", "Severe gastrointestinal disease, including gastroparesis or severe persistent gastrointestinal disorder"],
  ["gallstonesOrRecentCholecystectomy", "Current cholelithiasis (gallstones) or cholecystitis, or cholecystectomy within the last 3 months"],
  [
    "endocrineCauseOfObesity",
    "Obesity caused by an endocrinological disorder",
    "If the patient was already overweight prior to that diagnosis, this exclusion may not apply.",
  ],
  [
    "concurrentGlp1OrSecretagogue",
    "Concurrent use of any other GLP-1 receptor agonist or insulin secretagogue, FOR ANY INDICATION",
    "Ask specifically about medicines taken for diabetes and name the products: oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide, dulaglutide, exenatide, and the sulfonylureas and meglitinides. Patients do not always think of a diabetes medicine as the same kind of drug as a weight loss one.",
  ],
  ["type1Diabetes", "Type 1 diabetes mellitus"],
  ["diabeticRetinopathy", "Diabetic retinopathy", "Treatment may worsen retinopathy; defer or refer to a specialist."],
  [
    "insulinTreatedDiabetes",
    "Insulin-treated diabetes",
    "Refer: a pharmacy weight-management service cannot manage insulin dose reduction. There is no GP-monitored route under this PGD.",
  ],
  ["severeRenalImpairment", "Severe renal impairment (eGFR below 30 mL/min/1.73 m2) or end-stage renal disease"],
  ["severeHepaticImpairment", "Severe hepatic impairment (Child-Pugh class C)", "Orforglipron is not recommended; refer."],
  ["heartFailureEfBelow40", "Known diagnosis of heart failure with reduced ejection fraction below 40%"],
  ["activeEatingDisorder", "Active eating disorder (anorexia nervosa, bulimia, or binge-eating disorder under specialist care)"],
];

/** Every counselling item must be confirmed before the record is made. */
const COUNSELLING_KEYS: (keyof FoundayoState["counselling"])[] = [
  "swallowWholeNoRestriction",
  "oneTabletOnly",
  "missedDose",
  "giSideEffects",
  "dehydrationAndKidney",
  "pancreatitisRedFlag",
  "gallbladderRedFlag",
  "hypotensionSymptoms",
  "urgentWarningSymptoms",
  "weightLossExpectations",
  "pregnancy3Weeks",
  "anaesthesiaWarning",
  "followUpPlan",
  "reassessmentAt6Months",
  "pilAndWrittenAdviceGiven",
];

export function FoundayoClient() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { previous, lookup: lookupPrevious } = usePreviousWeightConsultation();

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

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];
    const { patient, eligibility, exclusions, cautions, interactions, dose, contraception, visit } = state;

    // ── Age. 18 to 85 inclusive under this PGD. ─────────────────────
    if (patient.age !== null && patient.age < 18) {
      out.push({
        code: "age-under",
        severity: "stop",
        message: "Patient under 18",
        detail: "Safety and efficacy in under 18s have not been established. This PGD covers adults only.",
      });
    }
    if (patient.age !== null && patient.age > 85) {
      out.push({
        code: "age-over",
        severity: "stop",
        message: "Patient over 85",
        detail: "Upper age limit under this PGD. Only very limited SPC data exist above 85. Refer if treatment is being considered.",
      });
    }

    // ── BMI thresholds, per the marketing authorisation. The document
    // applies them at initiation, and on a restart only where more than 2
    // months have passed since discontinuing. A patient who responds and
    // drops below the threshold is not refused the next supply.
    const bmiGateApplies =
      visit.type === "" ||
      visit.type === "initiation" ||
      (visit.type === "restart" && visit.restartGapOver2Months);
    if (bmiGateApplies && eligibility.bmi !== null && eligibility.bmi < 27) {
      out.push({
        code: "bmi",
        severity: "stop",
        message: "BMI below threshold",
        detail: `BMI ${eligibility.bmi}. Must be 30 or above, or 27 or above with a weight-related comorbidity.`,
      });
    }
    if (
      bmiGateApplies &&
      eligibility.bmi !== null &&
      eligibility.bmi >= 27 &&
      eligibility.bmi < 30 &&
      !eligibility.hasComorbidity
    ) {
      out.push({
        code: "bmi-comorbidity",
        severity: "stop",
        message: "BMI 27 to 30 requires a comorbidity",
        detail: "Record at least one weight-related comorbidity, or the patient is not eligible under this PGD.",
      });
    }

    // ── Exclusions from the signed PGD. ─────────────────────────────
    for (const [key, label, note] of EXCLUSION_LABELS) {
      if (exclusions[key]) {
        out.push({
          code: `excl-${key}`,
          severity: "stop",
          message: label,
          detail: `${note ? `${note} ` : ""}Excluded under this PGD. Discuss the reason with the patient, advise on alternatives (GP, specialist weight management service or lifestyle programmes) and inform or refer to the GP as appropriate. Document the advice given.`,
        });
      }
    }

    // ── Sulfonylurea, meglitinide or insulin: blanket exclusion (v006). ──
    if (interactions.sulfonylureaOrInsulin) {
      out.push({
        code: "su-insulin",
        severity: "stop",
        message: "Any sulfonylurea, meglitinide or insulin EXCLUDES",
        detail: "There is no GP-monitored route for those patients under this PGD. Refer to the GP or a specialist weight management service.",
      });
    }

    // ── Mental health caution, with its conditional stop. ────────────
    if (cautions.mentalHealthHistory) {
      if (cautions.mentalHealthConcern && !cautions.psychiatricOversightInPlace) {
        out.push({
          code: "mh-stop",
          severity: "stop",
          message: "Mental health concern with no psychiatric oversight",
          detail: "Do not supply where oversight is absent and concern exists. Refer.",
        });
      } else {
        out.push({
          code: "mh",
          severity: "caution",
          message: "History of suicidal ideation, or active severe mental illness",
          detail: "Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern. Do not supply where oversight is absent and concern exists.",
        });
      }
    }

    // ── Heart rate. ───────────────────────────────────────────────────
    if (cautions.sustainedHeartRateRise) {
      out.push({
        code: "hr-stop",
        severity: "stop",
        message: "Clinically relevant sustained increase in resting heart rate",
        detail: "Treatment should be discontinued and advice sought. Do not supply.",
      });
    } else if (cautions.raisedRestingHeartRate) {
      out.push({
        code: "hr",
        severity: "caution",
        message: "Pre-existing increased heart rate",
        detail: "Cases of tachycardia have been reported. Use with caution and seek specialist advice before use.",
      });
    }

    // ── Interactions that rule orforglipron out entirely. ───────────
    if (interactions.strongCyp3a4AndOatp1bInhibitor) {
      out.push({
        code: "cyp-oatp",
        severity: "stop",
        message: "Strong CYP3A4 inhibitor that also inhibits OATP1B",
        detail: "For example ritonavir or telaprevir. Orforglipron should be avoided altogether. Refer to the GP.",
      });
    }
    if (interactions.strongCyp3a4Inducer) {
      out.push({
        code: "cyp-inducer",
        severity: "stop",
        message: "Strong CYP3A4 inducer",
        detail: "For example rifampicin, carbamazepine, phenytoin or St John's wort. Concomitant use should be avoided. Refer to the GP.",
      });
    }
    if (interactions.oralTopotecan) {
      out.push({
        code: "topotecan",
        severity: "stop",
        message: "Taking oral topotecan",
        detail: "Orforglipron increases topotecan exposure and these patients are under oncology care. Refer rather than supply.",
      });
    }
    if (interactions.rosuvastatinOver20mg) {
      out.push({
        code: "rosuva",
        severity: "stop",
        message: "Rosuvastatin above 20 mg daily",
        detail: "Orforglipron increases rosuvastatin exposure. Refer to the prescriber before supplying.",
      });
    }
    if (interactions.simvastatin && !interactions.simvastatinPrescriberConfirmed) {
      out.push({
        code: "simva",
        severity: "stop",
        message: "Simvastatin dose not yet confirmed with the prescriber",
        detail: "The simvastatin dose must be halved when taken with orforglipron. Do not adjust it yourself. Refer to the prescriber and confirm before supply.",
      });
    }

    // ── The 9 mg ceiling, enforced rather than advised. ─────────────
    const ceiling = nineMgCeilingApplies(interactions);
    if (ceiling) {
      out.push({
        code: "ceiling",
        severity: "caution",
        message: "Maximum dose is 9 mg once daily",
        detail: interactions.strongCyp3a4Inhibitor
          ? "A strong CYP3A4 inhibitor is recorded, for example clarithromycin, ketoconazole or itraconazole."
          : "A clinical OATP1B inhibitor is recorded, for example ciclosporin.",
      });
      if (dose.newDose && ABOVE_CEILING.includes(dose.newDose)) {
        out.push({
          code: "ceiling-breach",
          severity: "stop",
          message: `${dose.newDose} mg exceeds the 9 mg ceiling for this patient`,
          detail: "Select 9 mg or lower, or refer for review of the interacting medicine.",
        });
      }
    }

    // ── Titration interval. At least 30 days at each step. ──────────
    if (
      visit.type === "escalation" &&
      dose.daysAtCurrentDose !== null &&
      dose.daysAtCurrentDose < 30
    ) {
      out.push({
        code: "titration",
        severity: "stop",
        message: "Less than 30 days at the current dose",
        detail: `Recorded ${dose.daysAtCurrentDose} days. The licence requires at least 30 days at each dose before increasing. Supply the current strength instead and bring the increase forward to the next visit.`,
      });
    }
    if (dose.currentDose && dose.newDose) {
      const from = DOSE_LADDER.indexOf(dose.currentDose as (typeof DOSE_LADDER)[number]);
      const to = DOSE_LADDER.indexOf(dose.newDose as (typeof DOSE_LADDER)[number]);
      if (from >= 0 && to > from + 1) {
        out.push({
          code: "skip-step",
          severity: "stop",
          message: "Dose increase skips a step",
          detail: `The ladder is 0.8, 2.5, 5.5, 9, 14.5 then 17.2 mg, one step at a time. Going from ${dose.currentDose} mg to ${dose.newDose} mg skips a step.`,
        });
      }
      if (from >= 0 && to >= 0 && to < from - 1) {
        out.push({
          code: "skip-down",
          severity: "stop",
          message: "Dose reduction skips a step",
          detail: `The document allows lowering to the previous dose for gastrointestinal symptoms, one step. Going from ${dose.currentDose} mg to ${dose.newDose} mg drops more than one step; select ${DOSE_LADDER[from - 1]} mg, or refer.`,
        });
      }
      if (visit.type === "escalation" && to <= from) {
        out.push({
          code: "not-increase",
          severity: "stop",
          message: "Dose increase visit but the dose does not go up",
          detail: `Current dose ${dose.currentDose} mg, dose to supply ${dose.newDose} mg. Select the next step up, or change the visit type to continuation. A step down to the previous dose for gastrointestinal symptoms is recorded as continuation, with the rationale.`,
        });
      }
      if (visit.type === "continuation" && to > from) {
        out.push({
          code: "cont-increase",
          severity: "stop",
          message: "Continuation visit but the dose goes up",
          detail: "Record the visit as a dose increase so the 30 day interval and the contraception advice are checked.",
        });
      }
    }

    // ── Initiation and restart always begin at 0.8 mg once daily. ────
    if ((visit.type === "initiation" || visit.type === "restart") && dose.newDose && dose.newDose !== "0.8") {
      out.push({
        code: "start-dose",
        severity: "stop",
        message: `${visit.type === "restart" ? "Recommencing" : "Starting"} treatment must begin at 0.8 mg once daily`,
        detail:
          visit.type === "restart"
            ? "If the patient recommences after stopping, the dose is titrated again starting at 0.8 mg (PGD dose row)."
            : "Start at 0.8 mg once daily and increase only after at least 30 days at each step (PGD dose row).",
      });
    }
    if ((visit.type === "initiation" || visit.type === "restart") && dose.currentDose) {
      out.push({
        code: "start-current",
        severity: "stop",
        message: "A current dose is recorded on a starting visit",
        detail: "Leave the current dose blank when starting or recommencing, or change the visit type.",
      });
    }
    if ((visit.type === "escalation" || visit.type === "continuation") && !dose.currentDose && dose.newDose) {
      out.push({
        code: "followup-current",
        severity: "stop",
        message: "Follow-up visit with no current dose recorded",
        detail: "Record the dose the patient is currently taking, or change the visit type to initiation or recommencing.",
      });
    }

    // ── Contraception. The reason this tool exists. ─────────────────
    const isDoseIncrease =
      visit.type === "initiation" ||
      visit.type === "restart" ||
      (!!dose.currentDose && !!dose.newDose && dose.currentDose !== dose.newDose);
    if (state.currentStep > STEP_CONTRACEPTION) {
      if (!contraception.notApplicable && !contraception.usesOralHormonal) {
        out.push({
          code: "contra-unasked",
          severity: "stop",
          message: "Contraception not addressed",
          detail: "Record either that oral hormonal contraception is in use, or that it is not applicable for this patient.",
        });
      }
      if (contraception.usesOralHormonal && !contraception.advisedNonOralOrBarrier) {
        out.push({
          code: "contra-advice",
          severity: "stop",
          message: "Contraception advice not given",
          detail: "Orforglipron may reduce the efficacy of oral hormonal contraceptives. Advise a non-oral method, or an added barrier method, for 30 days.",
        });
      }
      if (
        contraception.usesOralHormonal &&
        isDoseIncrease &&
        !contraception.advisedRepeatAfterEachIncrease
      ) {
        out.push({
          code: "contra-escalation",
          severity: "stop",
          message: "Advice for the dose increase not recorded",
          detail: "The 30 day window reopens after every dose increase, not only at initiation. Confirm the patient has been told this applies again now.",
        });
      }
    }

    // ── Written consent, gated the same way as the other tools. ─────
    if (
      state.currentStep > STEP_INFORMED_CONSENT &&
      !state.informedConsent.writtenConsentObtained
    ) {
      out.push({
        code: "consent",
        severity: "stop",
        message: "Written informed consent not yet obtained",
        detail: "Go back to the Informed Consent step and confirm that written consent has been obtained and filed.",
      });
    }

    // ── Cautions. ──────────────────────────────────────────────────
    if (interactions.warfarin) {
      out.push({
        code: "warfarin",
        severity: "caution",
        message: "Warfarin",
        detail: "Orforglipron delays gastric emptying. Monitor INR more frequently on initiation and after each dose increase.",
      });
    }
    if (interactions.antihypertensives) {
      out.push({
        code: "bp",
        severity: "caution",
        message: "On antihypertensive treatment",
        detail: "Orforglipron may lower blood pressure, and hypotension has been reported more frequently in patients already taking antihypertensive medicines. Ask about dizziness, light-headedness and falls at each review.",
      });
    }
    if (interactions.hypotensionSymptoms) {
      out.push({
        code: "bp-symptoms",
        severity: "red-flag",
        message: "Dizziness, light-headedness or falls reported on treatment",
        detail: "Refer to the GP for review of antihypertensive therapy where symptoms occur.",
      });
    }
    if (interactions.moderateCyp3a4Inducer) {
      out.push({
        code: "cyp-mod-inducer",
        severity: "caution",
        message: "Moderate CYP3A4 inducer",
        detail: "For example bosentan or efavirenz. Monitor effectiveness and escalate the dose as needed. Check the full medication list at every visit, including over the counter products and St John's wort.",
      });
    }
    if (interactions.oralHrt) {
      out.push({
        code: "hrt",
        severity: "caution",
        message: "Takes oral HRT",
        detail: "Due to the lack of data regarding absorption, non-oral products (for example patch, gel, or levonorgestrel intrauterine device) may be considered.",
      });
    }
    if (cautions.mildModerateRenalImpairment) {
      out.push({
        code: "renal-mild",
        severity: "caution",
        message: "Mild to moderate renal impairment",
        detail: "No dose adjustment is needed. Monitor for dehydration secondary to gastrointestinal side effects and counsel on fluid intake.",
      });
    }
    if (cautions.t2dmOnMetforminSglt2Dpp4) {
      out.push({
        code: "t2dm-gp",
        severity: cautions.gpInformed ? "caution" : "red-flag",
        message: "Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only",
        detail: cautions.gpInformed
          ? "No dose adjustment is needed. GP informed of the supply."
          : "No dose adjustment is needed, but inform the GP. Record that the GP has been informed before supply.",
      });
    }

    return out;
  }, [state]);

  const hasStops = alerts.some((a) => a.severity === "stop");

  // Step-level completeness. These are the inclusion criteria and the
  // record fields the PGD requires; a step cannot be left until they are
  // met. Shown by StepWrapper once Next has been attempted.
  const stepValidationError = useMemo<string | null>(() => {
    const { visit, eligibility, dose, record, contraception, counselling, cautions, interactions, informedConsent } = state;
    switch (state.currentStep) {
      case 0:
        return validatePatientStep(state.patient, { minAge: 18, maxAge: 85 });
      case 1:
        return validateConsentStep(state.consent);
      case STEP_INFORMED_CONSENT: {
        const missing: string[] = [];
        if (!informedConsent.treatmentExplained) missing.push("treatment, titration and administration explained");
        if (!informedConsent.riskBenefitDiscussed) missing.push("risk and benefit discussed, including the side-effect profile");
        if (!informedConsent.alternativesDiscussed) missing.push("alternatives discussed");
        if (!informedConsent.privateSupplyExplained) missing.push("private supply, cost and the NHS position explained");
        if (!informedConsent.writtenConsentObtained) missing.push("written informed consent obtained and filed");
        return missing.length ? `Informed consent is an inclusion criterion: ${missing.join("; ")}.` : null;
      }
      case STEP_ELIGIBILITY: {
        const missing: string[] = [];
        if (!visit.type) missing.push("type of visit");
        if (eligibility.bmi === null) missing.push("height and weight (BMI must be calculated at this visit)");
        if (
          eligibility.bmi !== null &&
          eligibility.bmi < 30 &&
          eligibility.hasComorbidity &&
          !eligibility.comorbidities.trim()
        )
          missing.push("the weight-related comorbidity relied on, named");
        if (visit.type !== "initiation" && visit.type !== "" && eligibility.initialWeightKg === null)
          missing.push("weight at initiation (for the 5% of initial body weight review)");
        if (eligibility.targetWeightKg === null) missing.push("target weight agreed");
        if (!eligibility.willingLifestyleChange) missing.push("willing to follow the reduced-calorie diet and increased physical activity");
        if (!eligibility.initialAssessmentDone) missing.push("initial assessment completed and documented");
        if (!eligibility.canSwallowOnceDaily) missing.push("able to take one tablet once daily, swallowed whole");
        return missing.length ? `Inclusion criteria not yet confirmed: ${missing.join("; ")}.` : null;
      }
      case STEP_DOSE: {
        const missing: string[] = [];
        if (!dose.newDose) missing.push("dose to supply");
        if (visit.type === "escalation" && dose.daysAtCurrentDose === null) missing.push("days at the current dose");
        if (visit.type !== "initiation" && visit.type !== "restart" && !dose.reassessedAtVisit)
          missing.push("clinical benefit, tolerability and target weight reassessed at this visit");
        if (!record.batchNumber.trim()) missing.push("batch number");
        if (record.quantitySupplied === null || record.quantitySupplied < 1) missing.push("quantity supplied (tablets)");
        if (record.quantitySupplied !== null && record.quantitySupplied > MAX_TABLETS_PER_SUPPLY)
          missing.push(`no more than ${MAX_TABLETS_PER_SUPPLY} tablets (one month at the current strength; the PGD does not allow stocking up)`);
        if (cautions.t2dmOnMetforminSglt2Dpp4 && !cautions.gpInformed) missing.push("GP informed (type 2 diabetes on metformin, SGLT2 or DPP-4 inhibitor)");
        return missing.length ? `Before continuing, record: ${missing.join("; ")}.` : null;
      }
      case STEP_MEDICINES:
        return interactions.medicationListReviewed
          ? null
          : "Confirm the full medication list was reviewed at this visit, including over the counter products and St John's wort.";
      case STEP_SUMMARY:
        return validateSummaryStep(state.summary);
      case STEP_CONTRACEPTION: {
        if (!contraception.notApplicable && !contraception.usesOralHormonal)
          return "Record either that oral hormonal contraception is in use, or that it is not applicable for this patient.";
        if (contraception.usesOralHormonal && !contraception.advisedNonOralOrBarrier)
          return "Confirm the patient has been advised to switch to a non-oral method, or add a barrier method, for 30 days.";
        const doseGoesUp =
          visit.type === "initiation" ||
          visit.type === "restart" ||
          (!!dose.currentDose && !!dose.newDose && dose.currentDose !== dose.newDose);
        if (contraception.usesOralHormonal && doseGoesUp && !contraception.advisedRepeatAfterEachIncrease)
          return "Confirm the patient has been told the 30 day window applies again now and after every future dose increase.";
        return null;
      }
      case STEP_COUNSELLING: {
        const unticked = COUNSELLING_KEYS.filter((k) => !counselling[k]).length;
        return unticked ? `Confirm every counselling item before continuing (${unticked} outstanding). The PGD requires the advice given to be recorded.` : null;
      }
      default:
        return null;
    }
  }, [state]);

  // A stop anywhere blocks Next on that step and on every later step, and
  // blocks Save & Print on the summary. An excluded patient is saved with
  // the "Save as not supplied" path instead.
  const canProceed = !hasStops && stepValidationError === null;

  const weightLossPercent =
    state.eligibility.initialWeightKg && state.eligibility.weightKg && state.eligibility.initialWeightKg > 0
      ? Math.round(((state.eligibility.initialWeightKg - state.eligibility.weightKg) / state.eligibility.initialWeightKg) * 1000) / 10
      : null;

  const markComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(state.currentStep));
  }, [state.currentStep]);

  const handleNext = () => {
    markComplete();
    dispatch({ type: "NEXT_STEP" });
  };
  const handlePrev = () => dispatch({ type: "PREV_STEP" });
  const handleStepClick = (step: number) => {
    if (step < state.currentStep) dispatch({ type: "SET_STEP", step });
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
        ...state,
        pgdVersion: PGD_VERSION_LINE,
        stops: alerts.filter((a) => a.severity === "stop").map((a) => a.message),
        weightLossPercent,
      } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine: hasStops || !state.dose.newDose
        ? undefined
        : {
            name: state.record.productName,
            dose: `${state.dose.newDose} mg once daily, film-coated tablet, oral`,
            duration: "One month at this strength",
            quantity: state.record.quantitySupplied ?? undefined,
          },
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hasStops, alerts, weightLossPercent]);

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
    validationError: stepValidationError,
    isBlocked: hasStops,
    getConsultationData,
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" {...stepProps}>
            <div className="space-y-4">
              <PatientDetailsStep
                patient={state.patient}
                onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
                onReturningPatient={(p) =>
                  lookupPrevious(p, (prev) => {
                    // Height does not change between visits. Weight is always
                    // measured on the day, and the dose is confirmed with the
                    // pharmacist rather than assumed.
                    if (prev.heightCm !== null) {
                      dispatch({ type: "UPDATE_ELIGIBILITY", field: "heightCm", value: prev.heightCm });
                    }
                    if (prev.baselineWeightKg !== null) {
                      dispatch({ type: "UPDATE_ELIGIBILITY", field: "initialWeightKg", value: prev.baselineWeightKg });
                    }
                  })
                }
              />
              {previous && (
                <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-sm">
                  <p className="font-semibold text-amber-900">
                    This patient already has a weight management record
                  </p>
                  <p className="mt-1 text-amber-900">
                    Last seen {previous.consultationDate}
                    {previous.pgdSlug ? ` (${previous.pgdSlug})` : ""}:{" "}
                    {describePrevious(previous)}. Height{previous.baselineWeightKg !== null ? " and the weight at initiation have" : " has"} been filled in for you.
                  </p>
                </div>
              )}
            </div>
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" {...stepProps}>
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Informed Consent to Treatment"
            description="Foundayo (orforglipron) tablets, UK licensed for weight management. Documented written consent required."
            {...stepProps}
          >
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-md text-sm text-amber-900">
                <strong>Before taking consent, cover these points.</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>
                    Once-daily tablet, swallowed whole, at any time of day, with no food
                    or water restriction. Never more than one tablet a day.
                  </li>
                  <li>
                    The dose is increased one step at a time with at least 30 days at
                    each step: 0.8, 2.5, 5.5, 9, 14.5 then 17.2 mg.
                  </li>
                  <li>
                    Black triangle medicine under additional monitoring. All suspected
                    adverse reactions go to the MHRA Yellow Card scheme.
                  </li>
                  <li>
                    This is a private supply. Orforglipron is not NHS funded and the
                    NICE appraisal is still in progress. NHS-funded options may be
                    available and should be discussed.
                  </li>
                </ul>
              </div>
              <Checkbox
                label="Treatment, titration schedule and administration explained to the patient"
                checked={state.informedConsent.treatmentExplained}
                onChange={(v) => dispatch({ type: "UPDATE_INFORMED", field: "treatmentExplained", value: v })}
              />
              <Checkbox
                label="Risk and benefit discussed, including gastrointestinal effects, pancreatitis, gallbladder disease, hypotension and hypoglycaemia where relevant"
                checked={state.informedConsent.riskBenefitDiscussed}
                onChange={(v) => dispatch({ type: "UPDATE_INFORMED", field: "riskBenefitDiscussed", value: v })}
              />
              <Checkbox
                label="Alternatives discussed, including lifestyle measures, other licensed weight management medicines and specialist referral"
                checked={state.informedConsent.alternativesDiscussed}
                onChange={(v) => dispatch({ type: "UPDATE_INFORMED", field: "alternativesDiscussed", value: v })}
              />
              <Checkbox
                label="Private supply, cost and the NHS position explained"
                checked={state.informedConsent.privateSupplyExplained}
                onChange={(v) => dispatch({ type: "UPDATE_INFORMED", field: "privateSupplyExplained", value: v })}
              />
              <Checkbox
                label="Written informed consent to treatment obtained and filed"
                checked={state.informedConsent.writtenConsentObtained}
                onChange={(v) => dispatch({ type: "UPDATE_INFORMED", field: "writtenConsentObtained", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper title="Eligibility & BMI" {...stepProps}>
            <div className="space-y-4">
              <SelectInput
                label="Type of visit"
                value={state.visit.type}
                onChange={(v) => dispatch({ type: "UPDATE_VISIT", field: "type", value: v as VisitType })}
                options={[
                  { value: "", label: "Select" },
                  { value: "initiation", label: "Initiation, first supply of orforglipron" },
                  { value: "escalation", label: "Follow-up with a dose increase" },
                  { value: "continuation", label: "Follow-up continuing the same dose (or stepping down for tolerability)" },
                  { value: "restart", label: "Recommencing after stopping treatment (titrate again from 0.8 mg)" },
                ]}
                required
              />
              {state.visit.type === "restart" && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
                  <p>
                    Recommencing after a break: the dose is titrated again starting at
                    0.8 mg. The BMI inclusion criteria for initiation must be applied if
                    more than 2 months have passed since discontinuing treatment.
                  </p>
                  <Checkbox
                    label="More than 2 months since treatment was discontinued (BMI inclusion criteria apply again)"
                    checked={state.visit.restartGapOver2Months}
                    onChange={(v) => dispatch({ type: "UPDATE_VISIT", field: "restartGapOver2Months", value: v })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Height (cm)"
                  value={state.eligibility.heightCm}
                  onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "heightCm", value: v })}
                  min={100}
                  max={220}
                />
                <NumberInput
                  label="Weight today (kg)"
                  value={state.eligibility.weightKg}
                  onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "weightKg", value: v })}
                  min={30}
                  max={300}
                />
              </div>
              {state.visit.type !== "" && state.visit.type !== "initiation" && (
                <div className="p-3 rounded-md bg-gray-50 border border-gray-200 space-y-2">
                  <NumberInput
                    label="Weight at initiation (kg)"
                    value={state.eligibility.initialWeightKg}
                    onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "initialWeightKg", value: v })}
                    min={30}
                    max={300}
                    unit="kg"
                    required
                  />
                  <p className="text-xs text-gray-600">
                    {weightLossPercent !== null
                      ? `${weightLossPercent}% of initial body weight lost. If less than 5% has been lost after 6 months on the maximum tolerated dose, a decision is required on whether to continue.`
                      : "Carried forward from the first record where available. Needed for the 5% of initial body weight review at 6 months."}
                  </p>
                </div>
              )}
              {state.eligibility.bmi !== null && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-md">
                  <p className="text-sm text-[color:var(--tenant-primary)]">
                    <strong>BMI: {state.eligibility.bmi}</strong>
                    {state.visit.type === "escalation" || state.visit.type === "continuation" || (state.visit.type === "restart" && !state.visit.restartGapOver2Months)
                      ? " (recorded; the inclusion threshold applied at initiation)"
                      : ""}
                  </p>
                  <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
                    {state.eligibility.bmi >= 30
                      ? "BMI 30 or above. Eligible, no comorbidity required."
                      : state.eligibility.bmi >= 27
                      ? "BMI 27 to 30. Eligible only with a weight-related comorbidity."
                      : "BMI below 27. Not eligible under this PGD."}
                  </p>
                </div>
              )}
              <Checkbox
                label="Has at least one weight-related comorbidity (hypertension, type 2 diabetes, dyslipidaemia, obstructive sleep apnoea, cardiovascular disease)"
                checked={state.eligibility.hasComorbidity}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "hasComorbidity", value: v })}
              />
              <TextInput
                label="List comorbidities"
                value={state.eligibility.comorbidities}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "comorbidities", value: v })}
                required={state.eligibility.hasComorbidity && state.eligibility.bmi !== null && state.eligibility.bmi < 30}
              />
              <NumberInput
                label="Target weight agreed (kg)"
                value={state.eligibility.targetWeightKg}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "targetWeightKg", value: v })}
                min={30}
                max={300}
                unit="kg"
                required
              />
              <Checkbox
                label="Patient is willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan"
                description="NICE NG246: the lifestyle plan is part of the consultation, not an optional extra."
                checked={state.eligibility.willingLifestyleChange}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "willingLifestyleChange", value: v })}
                required
              />
              <Checkbox
                label="Initial assessment completed and documented, face to face"
                description="Causes of weight gain (refer to the GP if prescribed medication is the cause); lifestyle, diet and exercise; previous attempts; mental health, environmental and psychological factors; other disease states; expectations; BMI, ideal weight, target weight and review intervals."
                checked={state.eligibility.initialAssessmentDone}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "initialAssessmentDone", value: v })}
                required
              />
              <Checkbox
                label="Patient is able to take one tablet once daily, swallowed whole"
                description="Unlike oral semaglutide, Foundayo may be taken with or without food and needs no fasting period or waiting time before other food, drink or medicines."
                checked={state.eligibility.canSwallowOnceDaily}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "canSwallowOnceDaily", value: v })}
                required
              />
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                NICE guideline NG246 defines obesity from a lower BMI for some ethnic
                groups. A patient below the licensed threshold is not eligible here but
                may be eligible for NHS assessment, so refer rather than simply decline.
              </div>
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Exclusions"
            description="Tick anything that applies. Any tick is a stop under this PGD."
            {...stepProps}
          >
            <div className="space-y-2">
              {EXCLUSION_LABELS.map(([key, label, note]) => (
                <Checkbox
                  key={key}
                  label={label}
                  description={note}
                  checked={state.exclusions[key]}
                  onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: key, value: v })}
                />
              ))}
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                Also excluded: BMI below the PGD inclusion threshold (checked on the
                previous step), and any patient who, in your clinical judgement, is not
                suitable for the medication. If excluded, discuss the reason, advise on
                alternatives (GP, specialist weight management service, lifestyle
                programmes), recommend GP review for any undiagnosed or unmanaged
                comorbidity, and document the advice and decision.
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-navy-900">Cautions (from the PGD)</h3>
              <Checkbox
                label="History of suicidal ideation, or active severe mental illness"
                description="Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern. Do not supply where oversight is absent and concern exists."
                checked={state.cautions.mentalHealthHistory}
                onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "mentalHealthHistory", value: v })}
              />
              {state.cautions.mentalHealthHistory && (
                <div className="ml-6 space-y-1">
                  <Checkbox
                    label="Appropriate psychiatric oversight is in place"
                    checked={state.cautions.psychiatricOversightInPlace}
                    onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "psychiatricOversightInPlace", value: v })}
                  />
                  <Checkbox
                    label="There is a current concern about mood or mental state"
                    checked={state.cautions.mentalHealthConcern}
                    onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "mentalHealthConcern", value: v })}
                  />
                </div>
              )}
              <Checkbox
                label="Mild to moderate renal impairment"
                description="No dose adjustment, but monitor for dehydration secondary to gastrointestinal side effects."
                checked={state.cautions.mildModerateRenalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "mildModerateRenalImpairment", value: v })}
              />
              <Checkbox
                label="Pre-existing increased resting heart rate"
                description="Cases of tachycardia have been reported. Use with caution and seek specialist advice before use."
                checked={state.cautions.raisedRestingHeartRate}
                onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "raisedRestingHeartRate", value: v })}
              />
              {state.visit.type !== "initiation" && (
                <Checkbox
                  label="Clinically relevant sustained increase in resting heart rate since starting orforglipron"
                  description="Treatment should be discontinued and advice sought."
                  checked={state.cautions.sustainedHeartRateRise}
                  onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "sustainedHeartRateRise", value: v })}
                />
              )}
              <Checkbox
                label="Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only"
                description="No dose adjustment is needed, but inform the GP. Any sulfonylurea, meglitinide or insulin EXCLUDES."
                checked={state.cautions.t2dmOnMetforminSglt2Dpp4}
                onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "t2dmOnMetforminSglt2Dpp4", value: v })}
              />
              {state.cautions.t2dmOnMetforminSglt2Dpp4 && (
                <div className="ml-6">
                  <Checkbox
                    label="GP informed of the supply"
                    checked={state.cautions.gpInformed}
                    onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "gpInformed", value: v })}
                    required
                  />
                </div>
              )}
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Medicines & Interactions"
            description="Check the full medication list, including anything bought over the counter and herbal products such as St John's wort."
            {...stepProps}
          >
            <div className="space-y-2">
              <Checkbox
                label="Full medication list reviewed at this visit, including over the counter products and St John's wort"
                checked={state.interactions.medicationListReviewed}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "medicationListReviewed", value: v })}
                required
              />
              <Checkbox
                label="Ritonavir or telaprevir (strong CYP3A4 inhibitor that also inhibits OATP1B)"
                checked={state.interactions.strongCyp3a4AndOatp1bInhibitor}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "strongCyp3a4AndOatp1bInhibitor", value: v })}
              />
              <Checkbox
                label="Rifampicin, carbamazepine, phenytoin or St John's wort (strong CYP3A4 inducer)"
                checked={state.interactions.strongCyp3a4Inducer}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "strongCyp3a4Inducer", value: v })}
              />
              <Checkbox
                label="Bosentan or efavirenz (moderate CYP3A4 inducer): monitor effectiveness and escalate the dose as needed"
                checked={state.interactions.moderateCyp3a4Inducer}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "moderateCyp3a4Inducer", value: v })}
              />
              <Checkbox
                label="Clarithromycin, ketoconazole or itraconazole (strong CYP3A4 inhibitor): caps the dose at 9 mg"
                checked={state.interactions.strongCyp3a4Inhibitor}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "strongCyp3a4Inhibitor", value: v })}
              />
              <Checkbox
                label="Ciclosporin or another clinical OATP1B inhibitor: caps the dose at 9 mg"
                checked={state.interactions.oatp1bInhibitor}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "oatp1bInhibitor", value: v })}
              />
              <Checkbox
                label="Simvastatin"
                checked={state.interactions.simvastatin}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "simvastatin", value: v })}
              />
              {state.interactions.simvastatin && (
                <div className="ml-6 p-3 rounded-md bg-amber-50 border border-amber-300 space-y-2">
                  <p className="text-xs text-amber-900">
                    The simvastatin dose must be halved when taken with orforglipron.
                    That is the prescriber's decision, not yours.
                  </p>
                  <Checkbox
                    label="Prescriber contacted and the simvastatin position confirmed"
                    checked={state.interactions.simvastatinPrescriberConfirmed}
                    onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "simvastatinPrescriberConfirmed", value: v })}
                  />
                </div>
              )}
              <Checkbox
                label="Rosuvastatin above 20 mg daily"
                checked={state.interactions.rosuvastatinOver20mg}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "rosuvastatinOver20mg", value: v })}
              />
              <Checkbox
                label="Oral topotecan"
                checked={state.interactions.oralTopotecan}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "oralTopotecan", value: v })}
              />
              <Checkbox
                label="Warfarin"
                description="Frequent INR monitoring is recommended on initiation of orforglipron."
                checked={state.interactions.warfarin}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "warfarin", value: v })}
              />
              <Checkbox
                label="Any sulfonylurea, meglitinide or insulin, for any indication: EXCLUDES"
                description="There is no GP-monitored route for those patients under this PGD."
                checked={state.interactions.sulfonylureaOrInsulin}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "sulfonylureaOrInsulin", value: v })}
              />
              <Checkbox
                label="Any antihypertensive medicine"
                description="Hypotension is reported more often in these patients. Ask about dizziness, light-headedness and falls at each review."
                checked={state.interactions.antihypertensives}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "antihypertensives", value: v })}
              />
              {state.visit.type !== "initiation" && (
                <div className="ml-6">
                  <Checkbox
                    label="Dizziness, light-headedness or falls reported since starting orforglipron"
                    description="Refer to the GP for review of antihypertensive therapy where symptoms occur."
                    checked={state.interactions.hypotensionSymptoms}
                    onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "hypotensionSymptoms", value: v })}
                  />
                </div>
              )}
              <Checkbox
                label="Oral HRT"
                description="Due to the lack of data regarding absorption, non-oral products (patch, gel, or levonorgestrel intrauterine device) may be considered."
                checked={state.interactions.oralHrt}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "oralHrt", value: v })}
              />
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                Delayed gastric emptying may reduce the absorption of other oral
                medicines, especially those with a narrow therapeutic index. Counsel
                accordingly. Existing metformin, SGLT2 inhibitor or DPP-4 inhibitor
                doses can be continued (inform the GP; see the Cautions on the previous
                step).
              </div>
              <TextArea
                label="Other relevant medicines"
                value={state.interactions.other}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "other", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 6: {
        const ceiling = nineMgCeilingApplies(state.interactions);
        return (
          <StepWrapper title="Dose & Titration" {...stepProps}>
            <div className="space-y-4">
              {ceiling && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-300 text-sm text-amber-900">
                  An interacting medicine is recorded, so the maximum dose for this
                  patient is <strong>9 mg once daily</strong>. Higher tablets are
                  blocked below.
                </div>
              )}
              <SelectInput
                label="Current dose (leave blank if starting today)"
                value={state.dose.currentDose}
                onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "currentDose", value: v as Dose })}
                options={[
                  { value: "", label: "Not currently taking orforglipron" },
                  ...DOSE_LADDER.map((d) => ({ value: d, label: `${d} mg once daily` })),
                ]}
              />
              {state.visit.type === "escalation" && (
                <NumberInput
                  label="Days at the current dose"
                  value={state.dose.daysAtCurrentDose}
                  onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "daysAtCurrentDose", value: v })}
                  min={0}
                  max={365}
                  required
                />
              )}
              {state.visit.type !== "initiation" && state.visit.type !== "restart" && (
                <Checkbox
                  label="Clinical benefit, tolerability and target weight reassessed at this visit"
                  description="If the patient has not lost at least 5% of their initial body weight after 6 months on the maximum tolerated dose, a decision is required on whether to continue treatment. When the patient reaches their target weight, discuss whether to continue treatment to maintain it. In case of significant gastrointestinal symptoms during titration, consider delaying a dose increase or lowering to the previous dose until symptoms have improved."
                  checked={state.dose.reassessedAtVisit}
                  onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "reassessedAtVisit", value: v })}
                  required
                />
              )}
              <SelectInput
                label="Dose to supply today"
                value={state.dose.newDose}
                onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "newDose", value: v as Dose })}
                options={[
                  { value: "", label: "Select" },
                  ...DOSE_LADDER.filter((d) => !(ceiling && ABOVE_CEILING.includes(d))).map((d) => ({
                    value: d,
                    label:
                      d === "0.8"
                        ? "0.8 mg once daily (starting dose, 30 days)"
                        : d === "17.2"
                        ? "17.2 mg once daily (maximum dose)"
                        : `${d} mg once daily`,
                  })),
                ]}
                required
              />
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                One month of treatment at the current strength per appointment. This PGD
                does not allow extra supply so the patient can stock up. Never more than
                one tablet a day, and never combine lower strengths to make a higher dose.
                Store in the original container, below 30 C unless the SPC states
                otherwise.
              </div>
              <TextInput
                label="Product name and brand"
                value={state.record.productName}
                onChange={(v) => dispatch({ type: "UPDATE_RECORD", field: "productName", value: v })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Batch number"
                  value={state.record.batchNumber}
                  onChange={(v) => dispatch({ type: "UPDATE_RECORD", field: "batchNumber", value: v })}
                  placeholder="From the pack"
                  required
                />
                <NumberInput
                  label="Quantity supplied (tablets)"
                  value={state.record.quantitySupplied}
                  onChange={(v) => dispatch({ type: "UPDATE_RECORD", field: "quantitySupplied", value: v })}
                  min={1}
                  max={MAX_TABLETS_PER_SUPPLY}
                  unit={`tablets (max ${MAX_TABLETS_PER_SUPPLY})`}
                  required
                />
              </div>
              <TextArea
                label="Clinical rationale"
                value={state.dose.rationale}
                onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "rationale", value: v })}
                placeholder="e.g. starting dose; increased after 32 days at 2.5 mg with good tolerability; held at 5.5 mg because of ongoing nausea"
              />
            </div>
          </StepWrapper>
        );
      }

      case 7:
        return (
          <StepWrapper
            title="Contraception"
            description="Orforglipron may reduce the efficacy of oral hormonal contraceptives."
            {...stepProps}
          >
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-red-50 border border-red-300 text-sm text-red-900">
                <strong>The 30 day window reopens after every dose increase.</strong>
                <p className="mt-1">
                  A patient on the full titration will need this advice six separate
                  times: once at initiation and again after each of the five increases.
                  It is not a one-off conversation.
                </p>
              </div>
              <Checkbox
                label="Not applicable (patient does not use oral hormonal contraception)"
                checked={state.contraception.notApplicable}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRACEPTION", field: "notApplicable", value: v })}
              />
              <Checkbox
                label="Patient uses oral hormonal contraception"
                checked={state.contraception.usesOralHormonal}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRACEPTION", field: "usesOralHormonal", value: v })}
              />
              {state.contraception.usesOralHormonal && (
                <div className="ml-6 space-y-2">
                  <Checkbox
                    label="Advised to switch to a non-oral method, or to add a barrier method, for 30 days after starting orforglipron"
                    checked={state.contraception.advisedNonOralOrBarrier}
                    onChange={(v) => dispatch({ type: "UPDATE_CONTRACEPTION", field: "advisedNonOralOrBarrier", value: v })}
                    required
                  />
                  <Checkbox
                    label="Told that this applies again for 30 days after every dose increase (recorded at initiation and at each escalation)"
                    checked={state.contraception.advisedRepeatAfterEachIncrease}
                    onChange={(v) => dispatch({ type: "UPDATE_CONTRACEPTION", field: "advisedRepeatAfterEachIncrease", value: v })}
                    required
                  />
                </div>
              )}
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                Pregnancy, breastfeeding and planning pregnancy are exclusions under this
                PGD. Women of childbearing potential should use effective contraception
                throughout treatment. Orforglipron must be stopped at least 3 weeks
                before a planned pregnancy, and immediately if pregnancy occurs or is
                suspected.
              </div>
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Counselling Checklist"
            description="Confirm each item has been discussed. Every item is required: the PGD requires the advice given to be recorded."
            {...stepProps}
          >
            <div className="space-y-2">
              <Checkbox label="Expected pattern of weight loss explained, and that the medicine works alongside diet and activity, not instead of them." checked={state.counselling.weightLossExpectations} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "weightLossExpectations", value: v })} />
              <Checkbox label="Swallow whole, do not break, crush or chew. Any time of day, with or without food, no waiting period." checked={state.counselling.swallowWholeNoRestriction} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "swallowWholeNoRestriction", value: v })} />
              <Checkbox label="One tablet a day only. Never combine tablets to reach a higher dose." checked={state.counselling.oneTabletOnly} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "oneTabletOnly", value: v })} />
              <Checkbox label="Missed dose: resume dosing as soon as possible, but never two tablets in one day and never double up." checked={state.counselling.missedDose} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "missedDose", value: v })} />
              <Checkbox label="Gastrointestinal side effects (nausea, vomiting, diarrhoea, constipation) and how to manage them; gradual dose escalation reduces them." checked={state.counselling.giSideEffects} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "giSideEffects", value: v })} />
              <Checkbox label="Adequate fluid intake. Vomiting and diarrhoea can cause dehydration and affect the kidneys." checked={state.counselling.dehydrationAndKidney} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "dehydrationAndKidney", value: v })} />
              <Checkbox label="Pancreatitis red flag: severe, persistent abdominal pain. Stop and seek immediate medical attention." checked={state.counselling.pancreatitisRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pancreatitisRedFlag", value: v })} />
              <Checkbox label="Gallbladder red flag: right upper abdominal pain, jaundice or fever. Seek urgent review." checked={state.counselling.gallbladderRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gallbladderRedFlag", value: v })} />
              <Checkbox label="Warning symptoms that need urgent attention: severe abdominal pain, persistent vomiting with dehydration, jaundice, sudden visual loss, or a sustained rise in resting heart rate." checked={state.counselling.urgentWarningSymptoms} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "urgentWarningSymptoms", value: v })} />
              <Checkbox label="Blood pressure may fall. Report dizziness, light-headedness or falls, particularly if on antihypertensives." checked={state.counselling.hypotensionSymptoms} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hypotensionSymptoms", value: v })} />
              <Checkbox label="Stop at least 3 weeks before a planned pregnancy, and immediately if pregnancy occurs or is suspected. Use effective contraception throughout treatment." checked={state.counselling.pregnancy3Weeks} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancy3Weeks", value: v })} />
              <Checkbox label="Tell any anaesthetist about this medicine before surgery or a procedure under general anaesthesia or deep sedation." checked={state.counselling.anaesthesiaWarning} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "anaesthesiaWarning", value: v })} />
              <Checkbox label="When to return for review agreed: weight and tolerability review before the next increase, and no increase inside 30 days." checked={state.counselling.followUpPlan} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpPlan", value: v })} />
              <Checkbox label="Told that treatment will be reassessed if less than 5% of body weight has been lost after 6 months on the maintenance dose." checked={state.counselling.reassessmentAt6Months} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reassessmentAt6Months", value: v })} />
              <Checkbox label="Patient information leaflet supplied, with written lifestyle, diet and physical activity advice and the agreed target weight." checked={state.counselling.pilAndWrittenAdviceGiven} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pilAndWrittenAdviceGiven", value: v })} />
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                Black triangle medicine: report all suspected adverse reactions via the
                MHRA Yellow Card scheme (yellowcard.mhra.gov.uk) and inform the GP as
                appropriate.
              </div>
            </div>
          </StepWrapper>
        );

      case 9:
        return (
          <StepWrapper
            title="Summary & Record"
            {...stepProps}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextArea
                label="Adverse drug reactions reported and actions taken (Yellow Card reference if reported)"
                value={state.record.adverseReactions}
                onChange={(v) => dispatch({ type: "UPDATE_RECORD", field: "adverseReactions", value: v })}
                placeholder="None reported, or describe the reaction, the action taken and whether a Yellow Card was submitted"
              />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Record will be saved with PGD slug <code>foundayo</code>, against
                document version v007 (issued 11 September 2026). Supplied via PGD.
              </p>
              <div className="p-4 bg-gray-50 rounded-md text-xs space-y-2">
                <div><strong>Patient:</strong> {state.patient.firstName} {state.patient.lastName} ({state.patient.dateOfBirth})</div>
                <div><strong>Visit:</strong> {state.visit.type || "not recorded"}</div>
                <div>
                  <strong>Height, weight, BMI:</strong>{" "}
                  {state.eligibility.heightCm ?? "not recorded"} cm, {state.eligibility.weightKg ?? "not recorded"} kg, BMI {state.eligibility.bmi ?? "not recorded"}
                </div>
                <div><strong>Target weight agreed:</strong> {state.eligibility.targetWeightKg !== null ? `${state.eligibility.targetWeightKg} kg` : "not recorded"}</div>
                <div><strong>Outcome:</strong> {hasStops ? "NOT SUPPLIED (stop present)" : "Supplied via PGD"}</div>
                <div><strong>Medicine:</strong> {hasStops ? "Not supplied" : `${state.record.productName || "not recorded"}, batch ${state.record.batchNumber || "not recorded"}`}</div>
                <div><strong>Dose, form and route:</strong> {hasStops ? "Not supplied" : state.dose.newDose ? `${state.dose.newDose} mg film-coated tablet, oral, once daily` : "not recorded"}</div>
                <div><strong>Quantity supplied:</strong> {hasStops ? "Not supplied" : state.record.quantitySupplied !== null ? `${state.record.quantitySupplied} tablets` : "not recorded"}</div>
                {weightLossPercent !== null && <div><strong>Weight change since initiation:</strong> {weightLossPercent}% of initial body weight lost</div>}
                {hasStops && <div><strong>Advice given:</strong> {state.record.adviceIfExcluded || "not recorded"}</div>}
                <div>
                  <strong>Contraception:</strong>{" "}
                  {state.contraception.notApplicable
                    ? "Not applicable"
                    : state.contraception.usesOralHormonal
                    ? state.contraception.advisedNonOralOrBarrier
                      ? "Oral hormonal, advice given"
                      : "Oral hormonal, ADVICE NOT GIVEN"
                    : "not recorded"}
                </div>
                <div><strong>Written informed consent:</strong> {state.informedConsent.writtenConsentObtained ? "Yes" : "NO, cannot proceed"}</div>
                <div><strong>Adverse drug reactions:</strong> {state.record.adverseReactions || "None recorded"}</div>
                <div><strong>Stops present:</strong> {hasStops ? "Yes" : "No"}</div>
              </div>
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={hasStops || stepValidationError !== null}
      />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {hasStops && (
        <div className="rounded-lg bg-red-50 border border-red-300 p-4 space-y-2 print:hidden">
          <p className="text-sm font-semibold text-red-900">A stop is present: do not supply under this PGD.</p>
          <TextArea
            label="Advice given (excluded or declines treatment): reason discussed, alternatives (GP, specialist weight management service, lifestyle programmes), decision reached, GP informed or referred"
            value={state.record.adviceIfExcluded}
            onChange={(v) => dispatch({ type: "UPDATE_RECORD", field: "adviceIfExcluded", value: v })}
            rows={3}
            required
          />
          <p className="text-xs text-red-800">Record the advice, then use &quot;Save as not supplied&quot; on the step below. The PGD requires advice given to an excluded patient to be recorded.</p>
        </div>
      )}
      {renderStep()}
    </div>
  );
}

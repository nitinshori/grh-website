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
import { WegovyOralSummaryReport } from "./components/WegovyOralSummaryReport";
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

/** Strapline of the document this tool follows. */
export const PGD_VERSION_LABEL = "Wegovy (semaglutide) Tablets PGD version 010, issued 11 September 2026";

// ── State shape ────────────────────────────────────────────────

export type VisitType = "" | "initiation" | "continuation" | "restart";
export type TabletStrength = "" | "1.5" | "4" | "9" | "25";

export interface WegovyOralState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  treatmentConsent: {
    treatmentExplained: boolean;
    riskBenefitDiscussed: boolean;
    alternativesDiscussed: boolean;
    writtenConsentObtained: boolean;
  };
  eligibility: {
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
    hasComorbidity: boolean;
    comorbidities: string;
    age18To85: boolean;
    willingLifestyleChange: boolean;
    tried6MonthLifestyle: boolean;
    // PGD v010: visit type, baseline weight and target weight. The 5% review
    // rule is calculated from the recorded baseline, not the last visit.
    visitType: VisitType;
    /** Restart only: more than 2 months since stopping, so the BMI inclusion
     *  criteria are reapplied to today's BMI. */
    restartOver2Months: boolean;
    baselineWeightKg: number | null;
    targetWeightKg: number | null;
    initialAssessmentDone: boolean;
    ableEmptyStomach: boolean;
    currentDose: TabletStrength;
    monthsAtCurrentDose: number | null;
    // Switching from semaglutide injection requires documented evidence of the
    // current injection dose. Patient self-report is not sufficient.
    switchingFromInjection: boolean;
    injectionDose: '' | '0.25' | '0.5' | '1.0' | '1.7' | '2.4';
    injectionDoseEvidence: '' | 'label' | 'clinic-record' | 'pen-seen' | 'prescriber' | 'none';
    injectionStoppedOver2Months: boolean;
  };
  contraindications: {
    pregnancyOrTryingConceive: boolean;
    breastfeeding: boolean;
    type1Diabetes: boolean;
    mtcOrMen2: boolean;
    pancreatitisHistory: boolean;
    diabeticRetinopathy: boolean;
    severeGastroparesisOrIBD: boolean;
    eatingDisorder: boolean;
    severeRenalImpairment: boolean;
    severeHepaticImpairment: boolean;
    hypersensitivity: boolean;
    concurrentGlp1: boolean;
    cholelithiasisOrCholecystectomy: boolean;
    endocrineObesity: boolean;
    insulinSecretagogue: boolean;
    insulinTreated: boolean;
    heartFailureLowEf: boolean;
    clinicalJudgementUnsuitable: boolean;
  };
  cautions: {
    mentalHealthHistory: boolean;
    psychiatricOversight: boolean;
    /** The document's second limb: do not supply where oversight is absent
     *  AND concern exists. */
    mentalHealthConcern: boolean;
    mildModerateRenal: boolean;
    raisedHeartRate: boolean;
    sodiumRestrictedDiet: boolean;
  };
  interactions: {
    levothyroxine: boolean;
    warfarin: boolean;
    sulfonylureaOrInsulin: boolean;
    oralContraception: boolean;
    metforminSglt2Dpp4: boolean;
    oralHrt: boolean;
    other: string;
  };
  doseSelection: {
    product: string; // 'wegovy-oral-1.5' | 'wegovy-oral-4' | 'wegovy-oral-9' | 'wegovy-oral-25' | ''
    rationale: string;
    batchNumber: string;
  };
  counselling: {
    emptyStomachExplained: boolean;
    waterLimit120ml: boolean;
    waitBeforeFood: boolean;
    swallowWholeOneTablet: boolean;
    missedDose: boolean;
    dietAndActivity: boolean;
    gastrointestinalSe: boolean;
    pancreatitisRedFlag: boolean;
    urgentVomitingDehydration: boolean;
    gallbladderRedFlag: boolean;
    visionLoss: boolean;
    heartRateRise: boolean;
    anaesthetistWarning: boolean;
    hypoRiskIfDiabetic: boolean;
    pregnancyWarning: boolean;
    storedTablet: boolean;
    writtenInfoSupplied: boolean;
    followUpPlan: boolean;
    gpInformed: boolean;
  };
  summary: BaseSummary;
}

const STEP_LABELS = [
  "Patient",
  "Consent",
  "Informed Consent",
  "Eligibility & BMI",
  "Contraindications",
  "Interactions",
  "Dose",
  "Counselling",
  "Summary",
];
const TOTAL_STEPS = STEP_LABELS.length;
/** Index of the "Informed Consent" step. The written-consent stop only
 *  applies once the pharmacist has been past it. */
const STEP_INFORMED_CONSENT = STEP_LABELS.indexOf("Informed Consent");
const STEP_ELIGIBILITY = STEP_LABELS.indexOf("Eligibility & BMI");
const STEP_DOSE = STEP_LABELS.indexOf("Dose");
const STEP_COUNSELLING = STEP_LABELS.indexOf("Counselling");

/** Titration ladder in the document: 1.5 mg, 4 mg, 9 mg, 25 mg once daily. */
const STRENGTH_ORDER: TabletStrength[] = ["1.5", "4", "9", "25"];
const PRODUCT_STRENGTH: Record<string, TabletStrength> = {
  "wegovy-oral-1.5": "1.5",
  "wegovy-oral-4": "4",
  "wegovy-oral-9": "9",
  "wegovy-oral-25": "25",
};
export const PRODUCT_LABEL: Record<string, string> = {
  "wegovy-oral-1.5": "Wegovy (semaglutide) 1.5 mg tablets",
  "wegovy-oral-4": "Wegovy (semaglutide) 4 mg tablets",
  "wegovy-oral-9": "Wegovy (semaglutide) 9 mg tablets",
  "wegovy-oral-25": "Wegovy (semaglutide) 25 mg tablets",
};

function initialState(): WegovyOralState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    treatmentConsent: {
      treatmentExplained: false,
      riskBenefitDiscussed: false,
      alternativesDiscussed: false,
      writtenConsentObtained: false,
    },
    eligibility: {
      heightCm: null,
      weightKg: null,
      bmi: null,
      hasComorbidity: false,
      comorbidities: "",
      age18To85: false,
      willingLifestyleChange: false,
      tried6MonthLifestyle: false,
      visitType: "",
      restartOver2Months: false,
      baselineWeightKg: null,
      targetWeightKg: null,
      initialAssessmentDone: false,
      ableEmptyStomach: false,
      currentDose: "",
      monthsAtCurrentDose: null,
      switchingFromInjection: false,
      injectionDose: "",
      injectionDoseEvidence: "",
      injectionStoppedOver2Months: false,
    },
    contraindications: {
      pregnancyOrTryingConceive: false,
      breastfeeding: false,
      type1Diabetes: false,
      mtcOrMen2: false,
      pancreatitisHistory: false,
      diabeticRetinopathy: false,
      severeGastroparesisOrIBD: false,
      eatingDisorder: false,
      severeRenalImpairment: false,
      severeHepaticImpairment: false,
      hypersensitivity: false,
      concurrentGlp1: false,
      cholelithiasisOrCholecystectomy: false,
      endocrineObesity: false,
      insulinSecretagogue: false,
      insulinTreated: false,
      heartFailureLowEf: false,
      clinicalJudgementUnsuitable: false,
    },
    cautions: {
      mentalHealthHistory: false,
      psychiatricOversight: false,
      mentalHealthConcern: false,
      mildModerateRenal: false,
      raisedHeartRate: false,
      sodiumRestrictedDiet: false,
    },
    interactions: {
      levothyroxine: false,
      warfarin: false,
      sulfonylureaOrInsulin: false,
      oralContraception: false,
      metforminSglt2Dpp4: false,
      oralHrt: false,
      other: "",
    },
    doseSelection: {
      product: "",
      rationale: "",
      batchNumber: "",
    },
    counselling: {
      emptyStomachExplained: false,
      waterLimit120ml: false,
      waitBeforeFood: false,
      swallowWholeOneTablet: false,
      missedDose: false,
      dietAndActivity: false,
      gastrointestinalSe: false,
      pancreatitisRedFlag: false,
      urgentVomitingDehydration: false,
      gallbladderRedFlag: false,
      visionLoss: false,
      heartRateRise: false,
      anaesthetistWarning: false,
      hypoRiskIfDiabetic: false,
      pregnancyWarning: false,
      storedTablet: false,
      writtenInfoSupplied: false,
      followUpPlan: false,
      gpInformed: false,
    },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: BasePatientDetails[keyof BasePatientDetails] }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: "UPDATE_TREATMENT_CONSENT"; field: keyof WegovyOralState["treatmentConsent"]; value: boolean }
  | { type: "UPDATE_ELIGIBILITY"; field: keyof WegovyOralState["eligibility"]; value: WegovyOralState["eligibility"][keyof WegovyOralState["eligibility"]] }
  | { type: "UPDATE_CONTRAINDICATION"; field: keyof WegovyOralState["contraindications"]; value: boolean }
  | { type: "UPDATE_CAUTION"; field: keyof WegovyOralState["cautions"]; value: boolean }
  | { type: "UPDATE_INTERACTION"; field: keyof WegovyOralState["interactions"]; value: WegovyOralState["interactions"][keyof WegovyOralState["interactions"]] }
  | { type: "UPDATE_DOSE"; field: keyof WegovyOralState["doseSelection"]; value: string }
  | { type: "UPDATE_COUNSELLING"; field: keyof WegovyOralState["counselling"]; value: boolean }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: string }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" };

function reducer(state: WegovyOralState, action: Action): WegovyOralState {
  switch (action.type) {
    case "UPDATE_PATIENT": {
      const patient = { ...state.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") patient.age = calculateAge(action.value as string);
      return { ...state, patient };
    }
    case "UPDATE_CONSENT":
      return { ...state, consent: { ...state.consent, [action.field]: action.value } };
    case "UPDATE_TREATMENT_CONSENT":
      return { ...state, treatmentConsent: { ...state.treatmentConsent, [action.field]: action.value } };
    case "UPDATE_ELIGIBILITY": {
      const eligibility = { ...state.eligibility, [action.field]: action.value };
      if ((action.field === "heightCm" || action.field === "weightKg") && eligibility.heightCm && eligibility.weightKg) {
        const m = eligibility.heightCm / 100;
        // Unrounded: 26.99 must not pass a 27 gate by rounding
        // (adversarial review, 11 Sep 2026). Round for display only.
        eligibility.bmi = eligibility.weightKg / (m * m);
      }
      return { ...state, eligibility };
    }
    case "UPDATE_CONTRAINDICATION":
      return { ...state, contraindications: { ...state.contraindications, [action.field]: action.value } };
    case "UPDATE_CAUTION":
      return { ...state, cautions: { ...state.cautions, [action.field]: action.value } };
    case "UPDATE_INTERACTION":
      return { ...state, interactions: { ...state.interactions, [action.field]: action.value } };
    case "UPDATE_DOSE":
      return { ...state, doseSelection: { ...state.doseSelection, [action.field]: action.value } };
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

/** Percentage change from the recorded baseline weight (negative = loss). */
function percentChangeFromBaseline(baseline: number | null, weight: number | null): number | null {
  if (!baseline || !weight) return null;
  return parseFloat((((weight - baseline) / baseline) * 100).toFixed(1));
}

/** The BMI the inclusion criteria are applied to. The document's inclusion is
 *  an INITIAL BMI, reapplied only after a break of more than 2 months, so a
 *  continuing patient is judged on the baseline weight, not today's. */
export function gatingBmi(e: WegovyOralState["eligibility"]): { bmi: number | null; basis: "today" | "baseline" } {
  const reapplyToday =
    e.visitType === "initiation" ||
    (e.visitType === "restart" && e.restartOver2Months) ||
    (e.switchingFromInjection && e.injectionStoppedOver2Months) ||
    e.visitType === "";
  if (reapplyToday) return { bmi: e.bmi, basis: "today" };
  if (e.heightCm && e.baselineWeightKg) {
    const m = e.heightCm / 100;
    return { bmi: e.baselineWeightKg / (m * m), basis: "baseline" };
  }
  return { bmi: null, basis: "baseline" };
}

export function WegovyOralClient() {
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

  const pctChange = percentChangeFromBaseline(state.eligibility.baselineWeightKg, state.eligibility.weightKg);

  // ── Alerts / contraindication summary ───────────────────────
  const alerts = useMemo(() => {
    const out: { code: string; severity: "stop" | "caution" | "red-flag"; message: string; detail: string }[] = [];
    const c = state.contraindications;
    if (c.pregnancyOrTryingConceive) out.push({ code: "preg", severity: "stop", message: "Pregnancy, planning pregnancy, or trying to conceive", detail: "Excluded. Effective contraception is required throughout treatment. Semaglutide must be discontinued at least 2 months before a planned pregnancy because of its long half-life, and stopped immediately if pregnancy occurs or is suspected (SPC section 4.6)." });
    if (c.breastfeeding) out.push({ code: "bf", severity: "stop", message: "Breastfeeding", detail: "Excluded. The absorption enhancer salcaprozate sodium passes into breast milk and a risk to the breast-fed child cannot be excluded; Wegovy tablets should not be used during breastfeeding." });
    if (c.type1Diabetes) out.push({ code: "t1d", severity: "stop", message: "Type 1 diabetes mellitus", detail: "Excluded. Semaglutide must not be used as a substitute for insulin. Refer to the specialist diabetes service." });
    if (c.mtcOrMen2) out.push({ code: "mtc", severity: "stop", message: "Personal or family history of medullary thyroid carcinoma, or MEN 2", detail: "Excluded." });
    if (c.pancreatitisHistory) out.push({ code: "panc", severity: "stop", message: "History of pancreatitis, acute or chronic", detail: "Excluded. The MHRA strengthened the GLP-1 pancreatitis class warning on 29 January 2026." });
    if (c.diabeticRetinopathy) out.push({ code: "retino", severity: "stop", message: "Diabetic retinopathy", detail: "Excluded. Treatment may worsen retinopathy; defer or refer to a specialist." });
    if (c.severeGastroparesisOrIBD) out.push({ code: "gp", severity: "stop", message: "Severe gastrointestinal disease, including gastroparesis or a severe persistent gastrointestinal disorder", detail: "Excluded. Oral absorption is unreliable and symptoms may worsen." });
    if (c.eatingDisorder) out.push({ code: "ed", severity: "stop", message: "Active eating disorder", detail: "Excluded: anorexia nervosa, bulimia, or binge-eating disorder under specialist care. Refer to the specialist." });
    if (c.severeRenalImpairment) out.push({ code: "renal", severity: "stop", message: "Severe renal impairment (eGFR below 30 mL/min/1.73 m2) or end-stage renal disease", detail: "Excluded. Semaglutide is not recommended in severe renal impairment." });
    if (c.severeHepaticImpairment) out.push({ code: "hep", severity: "stop", message: "Severe hepatic impairment", detail: "Excluded. Semaglutide is not recommended in severe hepatic impairment." });
    if (c.hypersensitivity) out.push({ code: "allergy", severity: "stop", message: "Known hypersensitivity to semaglutide or to any of the excipients", detail: "Excluded." });
    if (c.concurrentGlp1) out.push({ code: "glp1", severity: "stop", message: "Concurrent use of any other GLP-1 receptor agonist, for any indication", detail: "Excluded. Ask specifically whether the patient takes anything for diabetes and name the products: orforglipron, oral semaglutide for diabetes at 3 mg, 7 mg and 14 mg, and semaglutide and tirzepatide injections. A patient does not always think of a diabetes medicine as the same kind of drug." });
    if (c.cholelithiasisOrCholecystectomy) out.push({ code: "gall", severity: "stop", message: "Current cholelithiasis or cholecystitis, or cholecystectomy within the last 3 months", detail: "Excluded." });
    if (c.endocrineObesity) out.push({ code: "endo", severity: "stop", message: "Obesity caused by an endocrinological disorder", detail: "Excluded. Where the patient was already overweight before that diagnosis, this exclusion may not apply: untick and record the reasoning in the clinical notes if so. Consider referring to the GP." });
    if (c.insulinSecretagogue) out.push({ code: "secretagogue", severity: "stop", message: "Concurrent insulin secretagogue (any sulfonylurea or meglitinide), for any indication", detail: "Excluded. There is no GP-monitored route for these patients under this PGD." });
    if (c.insulinTreated) out.push({ code: "insulin", severity: "stop", message: "Insulin-treated diabetes", detail: "Excluded. Refer: a pharmacy weight-management service cannot manage insulin dose reduction." });
    if (c.heartFailureLowEf) out.push({ code: "hf", severity: "stop", message: "Known heart failure with reduced ejection fraction below 40%", detail: "Excluded." });
    if (c.clinicalJudgementUnsuitable) out.push({ code: "judgement", severity: "stop", message: "Not suitable for the medicine in the clinical judgement of the healthcare professional", detail: "Excluded. Discuss the reason with the patient, advise on alternatives (GP, specialist weight management service, lifestyle programme) and document the advice given." });

    // Cautions from the document. Mental health: do not supply where oversight
    // is absent and concern exists.
    const ca = state.cautions;
    if (ca.mentalHealthHistory && !ca.psychiatricOversight && ca.mentalHealthConcern) {
      out.push({ code: "mh-oversight", severity: "stop", message: "History of suicidal ideation or active severe mental illness: no psychiatric oversight and concern about the current mental state", detail: "Do not supply where oversight is absent and concern exists. Refer." });
    } else if (ca.mentalHealthHistory) {
      out.push({ code: "mh", severity: "caution", message: "History of suicidal ideation, or active severe mental illness", detail: ca.psychiatricOversight ? "Psychiatric oversight confirmed. Monitor mood at review and refer if there is any concern." : "No psychiatric oversight, but no current concern recorded. Monitor mood at review and refer if any concern arises." });
    }
    if (ca.mildModerateRenal) out.push({ code: "renal-mild", severity: "caution", message: "Mild to moderate renal impairment", detail: "Monitor for dehydration secondary to gastrointestinal side effects. Patients with eGFR 30 to below 60 may experience more gastrointestinal effects." });
    if (ca.raisedHeartRate) out.push({ code: "hr", severity: "caution", message: "Pre-existing raised heart rate", detail: "Tachycardia has been reported. Use with caution and seek specialist advice first. Discontinue and seek advice for a clinically relevant sustained rise in resting heart rate." });
    if (ca.sodiumRestrictedDiet) out.push({ code: "sodium", severity: "caution", message: "Sodium-restricted diet", detail: "The 25 mg maintenance tablet contains 23 mg of sodium. The lower strengths are essentially sodium free. Rarely material, but worth knowing." });

    // Switching requires documented evidence of the injection dose.
    if (state.eligibility.switchingFromInjection) {
      if (!state.eligibility.injectionDose) {
        out.push({ code: "switch-dose", severity: "stop", message: "Injection dose not recorded", detail: "Record the current injection dose before switching." });
      }
      if (!state.eligibility.injectionDoseEvidence || state.eligibility.injectionDoseEvidence === "none") {
        out.push({
          code: "switch-evidence",
          severity: "stop",
          message: "No documented evidence of the current injection dose",
          detail:
            "The PGD does not permit a switch on patient self-report. Ask for a dispensing label, prescription or repeat slip, a record from the supplying clinic or pharmacy (including a GRH consultation record), the pen or carton itself with the strength legible, or written or verbal confirmation from the prescriber recorded with the date and the name of the person who gave it. A photograph on a phone is acceptable where the strength is legible. Tell the patient exactly what to bring so the appointment can be rebooked rather than abandoned.",
        });
      }
      if (state.eligibility.injectionDose && state.eligibility.injectionDose !== "2.4") {
        out.push({
          code: "switch-low-dose",
          severity: "caution",
          message: `Switching from ${state.eligibility.injectionDose} mg, which is below 2.4 mg`,
          detail:
            "Do not start at 25 mg. Either continue the injection under the original prescriber to 2.4 mg, or start the tablets as a new initiation at 1.5 mg one week after the last injection and titrate monthly through 4 mg and 9 mg to 25 mg. This lower-dose pathway is a Get Real Health practice decision, not a licensed instruction; record it as such.",
        });
      }
      if (state.eligibility.injectionStoppedOver2Months) {
        out.push({
          code: "switch-gap",
          severity: "caution",
          message: "Injection stopped more than 2 months ago",
          detail: "Treat as a new initiation: start at 1.5 mg once daily and apply the BMI inclusion criteria afresh.",
        });
      }
    }

    const i = state.interactions;
    if (i.warfarin) out.push({ code: "warf", severity: "caution", message: "Warfarin or other coumarin", detail: "Frequent INR monitoring is recommended on starting semaglutide. Decreased INR has been reported with acenocoumarol, so the same applies to other coumarins." });
    if (i.levothyroxine) out.push({ code: "levo", severity: "caution", message: "Levothyroxine", detail: "Oral semaglutide increases levothyroxine exposure by about a third (AUC increased 33%). Monitor thyroid function when the two are taken together, and make sure the patient keeps the 30 minute separation, which matters more here than with most co-medicines." });
    if (i.sulfonylureaOrInsulin) out.push({ code: "su", severity: "stop", message: "Sulfonylurea, meglitinide or insulin", detail: "Any sulfonylurea, meglitinide or insulin EXCLUDES under this PGD; there is no GP-monitored route for those patients. Refer." });
    if (i.oralContraception) out.push({ code: "oc", severity: "caution", message: "Oral contraception", detail: "Exposure to ethinylestradiol and levonorgestrel is not changed to a clinically relevant degree. Keep the 30 minute separation." });
    if (i.metforminSglt2Dpp4) out.push({ code: "t2dm", severity: "caution", message: "Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only", detail: "No dose adjustment is needed, but inform the GP. Record that the GP has been informed on the counselling step." });
    if (i.oralHrt) out.push({ code: "hrt", severity: "caution", message: "Oral HRT", detail: "Given the lack of absorption data, non-oral products such as a patch, gel or levonorgestrel intrauterine device may be considered." });

    // Written-consent gate.
    // Only applies once the pharmacist has worked past the Informed Consent
    // step. Reported by Rachel (Aug 2026): the stop fired from the very first
    // screen, before any details had been entered, which made canProceed false
    // and blocked every new consultation outright.
    if (state.currentStep > STEP_INFORMED_CONSENT && !state.treatmentConsent.writtenConsentObtained) {
      out.push({ code: "consent", severity: "stop", message: "Written informed consent not yet obtained", detail: "Go back to the Informed Consent step and confirm that written consent has been obtained and filed." });
    }

    // Age gate per the PGD: adults aged 18 to 85 years inclusive.
    if (state.patient.age !== null && state.patient.age < 18) {
      out.push({ code: "age", severity: "stop", message: "Patient under 18", detail: "This PGD applies to adults aged 18 to 85 years inclusive." });
    }
    if (state.patient.age !== null && state.patient.age > 85) {
      out.push({ code: "age-over", severity: "stop", message: "Patient over 85 years of age", detail: "Excluded. This is a Get Real Health position, not a licence restriction; the SPC sets no upper age limit and records only that experience above 85 is limited. Refer to a specialist if treatment is being considered." });
    }

    // Eligibility: the initial BMI. A continuing patient is judged on the
    // baseline, so losing weight is not an exclusion (adversarial review,
    // 11 Sep 2026).
    const g = gatingBmi(state.eligibility);
    const which = g.basis === "baseline" ? "Baseline BMI" : "BMI";
    if (g.bmi !== null && g.bmi < 27) {
      out.push({ code: "bmi", severity: "stop", message: `${which} below threshold`, detail: `${which} ${g.bmi.toFixed(1)}. Must be 30 or above, or 27 or above with at least one weight-related comorbidity.` });
    }
    if (g.bmi !== null && g.bmi >= 27 && g.bmi < 30 && !state.eligibility.hasComorbidity) {
      out.push({ code: "bmi-comorb", severity: "stop", message: `${which} 27 to below 30 requires a weight-related comorbidity`, detail: "Patient must have at least one weight-related comorbidity (for example hypertension, dyslipidaemia, obstructive sleep apnoea, cardiovascular disease or type 2 diabetes)." });
    }

    // Review and the stopping rule: reassess where less than 5% of BASELINE
    // body weight has been lost after 6 months at the established dose.
    const e = state.eligibility;
    if (e.visitType === "continuation" && pctChange !== null && e.monthsAtCurrentDose !== null && e.monthsAtCurrentDose >= 6 && pctChange > -5) {
      out.push({
        code: "review-5pc",
        severity: "caution",
        message: `Less than 5% of baseline weight lost after ${e.monthsAtCurrentDose} months at the current dose (${pctChange}% change)`,
        detail: "Reassess whether to continue. The rule applies at 25 mg where reached, or at the highest dose tolerated for at least 3 consecutive months where 25 mg was not reached; a patient who never reaches 25 mg is not exempt from review. Record the decision and the reasoning in the clinical rationale.",
      });
    }

    // Dose selection rules from the document.
    const d = state.doseSelection;
    const supplyStrength = PRODUCT_STRENGTH[d.product] ?? "";
    if (supplyStrength) {
      const switchingAt24 = e.switchingFromInjection && e.injectionDose === "2.4" && !e.injectionStoppedOver2Months;
      if (e.switchingFromInjection && e.injectionDose && e.injectionDose !== "2.4" && supplyStrength === "25") {
        out.push({ code: "dose-switch-low", severity: "stop", message: "25 mg selected after an injection dose below 2.4 mg", detail: "Do NOT start at 25 mg. There is no licensed switch from these doses and 25 mg would be a substantial jump. Start as a new initiation at 1.5 mg once daily, or continue the injection under the original prescriber until 2.4 mg is reached." });
      }
      if (e.switchingFromInjection && e.injectionStoppedOver2Months && supplyStrength !== "1.5") {
        out.push({ code: "dose-switch-gap", severity: "stop", message: "Injection stopped more than 2 months ago: tablets must start at 1.5 mg", detail: "Treat as a new initiation and titrate again from the lowest dose." });
      }
      if ((e.visitType === "initiation" || e.visitType === "restart") && !switchingAt24 && supplyStrength !== "1.5") {
        out.push({ code: "dose-start", severity: "stop", message: "New initiation or restart must begin at 1.5 mg once daily", detail: "Start at 1.5 mg once daily for one month, then escalate monthly through 4 mg and 9 mg to the maintenance dose of 25 mg. To recommence after stopping, titrate again from the lowest dose. The only exception is a documented switch from semaglutide 2.4 mg injection, which starts at 25 mg one week after the last injection." });
      }
      if (switchingAt24 && (e.visitType === "initiation" || e.visitType === "restart") && supplyStrength !== "25") {
        out.push({ code: "dose-switch-24", severity: "caution", message: "Documented 2.4 mg injection dose: the PGD starts the tablets at 25 mg once daily", detail: "Start Wegovy tablets at 25 mg once daily, one week after the last injection. Record the reason if a lower strength is chosen." });
      }
      if (e.visitType === "continuation" && e.currentDose) {
        const currentIdx = STRENGTH_ORDER.indexOf(e.currentDose);
        const supplyIdx = STRENGTH_ORDER.indexOf(supplyStrength);
        if (supplyIdx > currentIdx + 1) {
          out.push({ code: "dose-skip", severity: "stop", message: "Titration step skipped", detail: "Escalate monthly through 4 mg and 9 mg to 25 mg, with a minimum of one month at each step. Do not skip a step." });
        }
        if (supplyIdx === currentIdx + 1 && e.monthsAtCurrentDose !== null && e.monthsAtCurrentDose < 1) {
          out.push({ code: "dose-early", severity: "stop", message: "Less than one month at the current dose", detail: "A minimum of one month at each dose level is required before escalating." });
        }
      }
    }

    return out;
  }, [state, pctChange]);

  const hasStops = alerts.some((a) => a.severity === "stop");

  // Step-level validation for inclusion criteria and records the document
  // requires. Returns null when the step is complete.
  const stepError = useMemo((): string | null => {
    const e = state.eligibility;
    if (state.currentStep === 0) {
      const base = validatePatientStep(state.patient, { minAge: 18, maxAge: 85 });
      if (base) return base;
      if (!state.patient.address.trim()) return "Patient address is required (PGD records row)";
      if (!state.patient.gpName.trim() && !state.patient.gpPractice.trim()) return "Record the GP or practice with whom the patient is registered";
      return null;
    }
    if (state.currentStep === 1) {
      return validateConsentStep(state.consent);
    }
    if (state.currentStep === STEP_INFORMED_CONSENT) {
      const t = state.treatmentConsent;
      if (!t.treatmentExplained) return "Confirm the treatment, dosing schedule and administration requirements were explained.";
      if (!t.riskBenefitDiscussed) return "Confirm the risk-benefit discussion was completed.";
      if (!t.alternativesDiscussed) return "Confirm alternatives were discussed.";
      if (!t.writtenConsentObtained) return "Confirm written informed consent has been obtained and filed.";
      return null;
    }
    if (state.currentStep === TOTAL_STEPS - 1) {
      return validateSummaryStep(state.summary);
    }
    if (state.currentStep === STEP_ELIGIBILITY) {
      if (!e.visitType) return "Select the visit type.";
      if (!e.age18To85) return "Confirm the patient is an adult aged 18 to 85 years inclusive.";
      if (e.heightCm === null || e.weightKg === null || e.bmi === null) return "Record height, weight and BMI at this visit.";
      if (e.baselineWeightKg === null) return "Record the baseline weight. At initiation this is today's weight; at every later visit carry the baseline forward.";
      if (e.targetWeightKg === null) return "Record the agreed target weight.";
      if (!e.initialAssessmentDone) return "Confirm the initial assessment has been completed and documented.";
      if (!e.ableEmptyStomach) return "Confirm the patient is able to follow, and is following, the empty-stomach administration requirements.";
      if (!e.willingLifestyleChange) return "Confirm the patient is willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan.";
      if (e.visitType === "continuation" && !e.currentDose) return "Record the dose the patient is currently established on.";
      if (e.visitType === "continuation" && e.monthsAtCurrentDose === null) return "Record how many months the patient has been on the current dose.";
      return null;
    }
    if (state.currentStep === STEP_DOSE) {
      if (!state.doseSelection.product) return "Select the product and strength to supply.";
      if (!state.doseSelection.batchNumber.trim()) return "Record the batch number of the pack supplied (traceability requirement).";
      // The 5% review: the decision the document requires must be on the record
      if (alerts.some((a) => a.code === "review-5pc") && !state.doseSelection.rationale.trim())
        return "Less than 5% of baseline weight lost after 6 months: record the decision on continuation and the reasoning in the clinical rationale.";
      return null;
    }
    if (state.currentStep === STEP_COUNSELLING) {
      const c = state.counselling;
      const required: [boolean, string][] = [
        [c.emptyStomachExplained, "empty-stomach administration"],
        [c.waterLimit120ml, "water limit"],
        [c.waitBeforeFood, "30 minute wait"],
        [c.swallowWholeOneTablet, "swallow whole, one tablet a day"],
        [c.missedDose, "missed dose"],
        [c.dietAndActivity, "diet and activity"],
        [c.gastrointestinalSe, "gastrointestinal effects and fluids"],
        [c.pancreatitisRedFlag, "pancreatitis red flag"],
        [c.urgentVomitingDehydration, "persistent vomiting with dehydration"],
        [c.gallbladderRedFlag, "jaundice"],
        [c.visionLoss, "sudden loss of vision"],
        [c.heartRateRise, "sustained rise in resting heart rate"],
        [c.anaesthetistWarning, "anaesthetist, dentist or surgeon"],
        [c.pregnancyWarning, "pregnancy and contraception"],
        [c.storedTablet, "storage"],
        [c.writtenInfoSupplied, "written information"],
        [c.followUpPlan, "review and the 5% rule"],
      ];
      const missing = required.filter(([done]) => !done).map(([, label]) => label);
      if (missing.length > 0) return `Confirm the remaining counselling items: ${missing.join(", ")}.`;
      if (state.interactions.metforminSglt2Dpp4 && !c.gpInformed) return "Confirm the GP has been informed (type 2 diabetes on metformin, SGLT2 inhibitor or DPP-4 inhibitor).";
      return null;
    }
    return null;
  }, [state, alerts]);

  // A stop anywhere blocks Next and Save & Print on every step.
  const canProceed = !hasStops && stepError === null;

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
        ...(state as unknown as Record<string, unknown>),
        pgdVersion: PGD_VERSION_LABEL,
        alerts,
        percentChangeFromBaseline: pctChange,
        quantitySupplied: "1 calendar pack of 30 tablets (one month)",
        productSupplied: PRODUCT_LABEL[state.doseSelection.product] ?? "",
      },
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && state.doseSelection.product
          ? {
              name: "Wegovy (semaglutide) tablets",
              medicine: `${PRODUCT_LABEL[state.doseSelection.product]}${state.doseSelection.batchNumber ? ` (batch ${state.doseSelection.batchNumber})` : ""}`,
              dose: `${PRODUCT_STRENGTH[state.doseSelection.product]} mg once daily, oral, on an empty stomach`,
              duration: "30 days (one month)",
              quantity: "1 calendar pack of 30 tablets",
            }
          : undefined,
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
  }, [state, hasStops, pctChange, alerts]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
          </StepWrapper>
        );
      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Informed Consent to Treatment" description="Wegovy (semaglutide) tablets, UK-licensed for weight management. Documented written consent required, including the side-effect profile and treatment expectations." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-md text-sm text-amber-900">
                <strong>This consultation supplies Wegovy (semaglutide) tablets under {PGD_VERSION_LABEL}.</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Licensed strengths: 1.5 mg, 4 mg, 9 mg and 25 mg tablets. Maintenance dose 25 mg once daily; maximum ONE tablet per day. Never combine tablets to approximate a higher dose.</li>
                  <li>Black-triangle medicine (additional monitoring): report any suspected adverse reactions via the MHRA Yellow Card scheme and inform the GP as appropriate.</li>
                  <li>Counsel on the empty-stomach regimen: at least 8 hours fasting, swallow whole with up to half a glass of water (120 mL), wait at least 30 minutes before food, drink or other oral medicines.</li>
                </ul>
              </div>
              <Checkbox label="Treatment, dosing schedule and administration requirements clearly explained to the patient" checked={state.treatmentConsent.treatmentExplained} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT_CONSENT", field: "treatmentExplained", value: v })} />
              <Checkbox label="Risk-benefit discussion completed: side-effect profile (GI effects, gallstones, acute pancreatitis, NAION, hypoglycaemia if diabetic, retinopathy progression) and realistic treatment expectations" checked={state.treatmentConsent.riskBenefitDiscussed} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT_CONSENT", field: "riskBenefitDiscussed", value: v })} />
              <Checkbox label="Alternatives discussed (GP, specialist weight management service, lifestyle programme)" checked={state.treatmentConsent.alternativesDiscussed} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT_CONSENT", field: "alternativesDiscussed", value: v })} />
              <Checkbox label="Written informed consent to treatment obtained and filed" checked={state.treatmentConsent.writtenConsentObtained} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT_CONSENT", field: "writtenConsentObtained", value: v })} />
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Eligibility & BMI" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-4">
              <SelectInput
                label="Visit type"
                value={state.eligibility.visitType}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "visitType", value: v as VisitType })}
                options={[
                  { value: "", label: "Select" },
                  { value: "initiation", label: "New initiation (first supply of tablets, including a switch from the injection)" },
                  { value: "continuation", label: "Continuing treatment (titration step or maintenance)" },
                  { value: "restart", label: "Recommencing after stopping (titrate again from 1.5 mg)" },
                ]}
                required
              />
              {state.eligibility.visitType === "restart" && (
                <>
                  <p className="text-xs text-amber-800">To recommence after stopping, titrate again from the lowest dose. Apply the BMI inclusion criteria afresh if more than 2 months have passed since discontinuing.</p>
                  <Checkbox label="More than 2 months have passed since the last dose (BMI inclusion criteria reapplied to today's BMI)" checked={state.eligibility.restartOver2Months} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "restartOver2Months", value: v })} />
                </>
              )}
              <Checkbox label="Adult aged 18 to 85 years (inclusive)" checked={state.eligibility.age18To85} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "age18To85", value: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Height (cm)" value={state.eligibility.heightCm} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "heightCm", value: v })} min={100} max={220} required />
                <NumberInput label="Weight today (kg)" value={state.eligibility.weightKg} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "weightKg", value: v })} min={30} max={250} required />
              </div>
              {state.eligibility.bmi !== null && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-md">
                  <p className="text-sm text-[color:var(--tenant-primary)]"><strong>BMI today: {state.eligibility.bmi.toFixed(1)}</strong>{gatingBmi(state.eligibility).basis === "baseline" && gatingBmi(state.eligibility).bmi !== null ? ` (eligibility judged on the baseline BMI of ${gatingBmi(state.eligibility).bmi!.toFixed(1)})` : ""}</p>
                  <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
                    {(() => {
                      const g = gatingBmi(state.eligibility);
                      const w = g.basis === "baseline" ? "Baseline BMI" : "BMI";
                      if (g.bmi === null) return "Record the baseline weight to judge eligibility.";
                      return g.bmi >= 30
                        ? `${w} 30 or above: eligible (no comorbidity required).`
                        : g.bmi >= 27
                          ? `${w} 27 to below 30: eligible only with at least one weight-related comorbidity.`
                          : `${w} below 27: not eligible under this PGD.`;
                    })()}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Baseline weight (kg)" value={state.eligibility.baselineWeightKg} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "baselineWeightKg", value: v })} min={30} max={250} required />
                <NumberInput label="Agreed target weight (kg)" value={state.eligibility.targetWeightKg} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "targetWeightKg", value: v })} min={30} max={250} required />
              </div>
              <p className="text-xs text-gray-600">Record the weight as the BASELINE at initiation and carry it forward at every visit. The 5% review rule is calculated from this baseline, not from the weight at the last visit. Where no baseline was recorded, establish one now and the 6 months run from this point.</p>
              {pctChange !== null && (
                <p className="text-xs font-semibold text-gray-700">Change from baseline: {pctChange > 0 ? "+" : ""}{pctChange}%</p>
              )}
              <Checkbox label="Has at least one weight-related comorbidity (for example hypertension, dyslipidaemia, obstructive sleep apnoea, cardiovascular disease or type 2 diabetes)" checked={state.eligibility.hasComorbidity} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "hasComorbidity", value: v })} />
              <TextInput label="List comorbidities" value={state.eligibility.comorbidities} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "comorbidities", value: v })} />
              {state.eligibility.visitType === "continuation" && (
                <div className="grid grid-cols-2 gap-3">
                  <SelectInput
                    label="Current established dose"
                    value={state.eligibility.currentDose}
                    onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "currentDose", value: v as TabletStrength })}
                    options={[
                      { value: "", label: "Select" },
                      { value: "1.5", label: "1.5 mg once daily" },
                      { value: "4", label: "4 mg once daily" },
                      { value: "9", label: "9 mg once daily" },
                      { value: "25", label: "25 mg once daily" },
                    ]}
                    required
                  />
                  <NumberInput label="Months on this dose" value={state.eligibility.monthsAtCurrentDose} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "monthsAtCurrentDose", value: v })} min={0} max={60} required />
                </div>
              )}
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Switching from semaglutide injection</p>
                  <p className="text-xs text-amber-800 mt-1">DOCUMENTED EVIDENCE IS REQUIRED. Patient self-report of the injection dose is not sufficient and must not be relied on. Record which evidence was seen and the strength it showed.</p>
                </div>
                <Checkbox label="Patient is switching from semaglutide injection" checked={state.eligibility.switchingFromInjection} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "switchingFromInjection", value: v })} />
                {state.eligibility.switchingFromInjection && (
                  <div className="space-y-3">
                    <SelectInput label="Current injection dose, as documented" value={state.eligibility.injectionDose} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "injectionDose", value: v as WegovyOralState["eligibility"]["injectionDose"] })} options={[{ value: "", label: "Select" }, { value: "0.25", label: "0.25 mg weekly" }, { value: "0.5", label: "0.5 mg weekly" }, { value: "1.0", label: "1 mg weekly" }, { value: "1.7", label: "1.7 mg weekly" }, { value: "2.4", label: "2.4 mg weekly" }]} required />
                    <SelectInput label="Evidence seen for that dose" value={state.eligibility.injectionDoseEvidence} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "injectionDoseEvidence", value: v as WegovyOralState["eligibility"]["injectionDoseEvidence"] })} options={[{ value: "", label: "Select" }, { value: "label", label: "Dispensing label, prescription or repeat slip showing the strength" }, { value: "clinic-record", label: "Record from the supplying clinic or pharmacy, including a GRH consultation record" }, { value: "pen-seen", label: "Patient's own pen or carton, seen by the pharmacist, strength legible" }, { value: "prescriber", label: "Written or verbal confirmation from the prescriber (record the date and the name of the person who gave it)" }, { value: "none", label: "None. Patient self-report only" }]} required />
                    <Checkbox label="The injection was stopped more than 2 months ago (treat as a new initiation; apply the BMI inclusion criteria afresh)" checked={state.eligibility.injectionStoppedOver2Months} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "injectionStoppedOver2Months", value: v })} />
                    {state.eligibility.injectionDose && state.eligibility.injectionDose !== "2.4" && (
                      <p className="text-xs font-semibold text-amber-900">
                        Below 2.4 mg. Do NOT start at 25 mg. Either continue the injection under the original prescriber until 2.4 mg is reached, or start the tablets as a new initiation at 1.5 mg one week after the last injection and titrate monthly through 4 mg and 9 mg to 25 mg. Explain to the patient that starting again at 1.5 mg is not a step backwards but the only safe route, and that the titration protects them from gastrointestinal effects. This lower-dose pathway is a Get Real Health practice decision, not a licensed instruction; record it as such.
                      </p>
                    )}
                    {state.eligibility.injectionDose === "2.4" && !state.eligibility.injectionStoppedOver2Months && (
                      <p className="text-xs font-semibold text-amber-900">2.4 mg documented. Start Wegovy tablets at 25 mg once daily, one week after the last injection.</p>
                    )}
                  </div>
                )}
              </div>
              <Checkbox label="Initial assessment completed and documented (causes of weight gain, lifestyle, previous attempts, contributing factors, other disease states, expectations, height, weight and BMI)" checked={state.eligibility.initialAssessmentDone} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "initialAssessmentDone", value: v })} required />
              <Checkbox label="Able to follow the empty-stomach administration requirements: a fast of at least 8 hours before the dose, and a 30 minute wait afterwards before food, drink or other oral medicines. At follow-up: confirmed these are being followed" checked={state.eligibility.ableEmptyStomach} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "ableEmptyStomach", value: v })} required />
              <Checkbox label="Willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan" checked={state.eligibility.willingLifestyleChange} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "willingLifestyleChange", value: v })} required />
              <Checkbox label="Patient has tried lifestyle changes alone before without adequate result (record what has and has not worked)" checked={state.eligibility.tried6MonthLifestyle} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "tried6MonthLifestyle", value: v })} />
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications" description="Any ticked exclusion prevents supply. Ask specifically whether the patient takes anything for diabetes, and name the products." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-2">
              {(
                [
                  ["pregnancyOrTryingConceive", "Pregnant, planning pregnancy, or trying to conceive"],
                  ["breastfeeding", "Currently breastfeeding"],
                  ["hypersensitivity", "Known hypersensitivity to semaglutide or to any of the excipients"],
                  ["mtcOrMen2", "Personal or family history of medullary thyroid carcinoma, or Multiple Endocrine Neoplasia syndrome type 2"],
                  ["pancreatitisHistory", "History of pancreatitis, acute or chronic"],
                  ["severeGastroparesisOrIBD", "Severe gastrointestinal disease, including gastroparesis or a severe persistent gastrointestinal disorder"],
                  ["cholelithiasisOrCholecystectomy", "Current cholelithiasis or cholecystitis, or cholecystectomy within the last 3 months"],
                  ["endocrineObesity", "Obesity caused by an endocrinological disorder (may not apply where the patient was already overweight before that diagnosis)"],
                  ["concurrentGlp1", "Concurrent use of any other GLP-1 receptor agonist, for any indication (orforglipron, oral semaglutide 3 mg, 7 mg or 14 mg for diabetes, semaglutide or tirzepatide injection)"],
                  ["insulinSecretagogue", "Concurrent insulin secretagogue (any sulfonylurea or meglitinide), for any indication"],
                  ["type1Diabetes", "Type 1 diabetes mellitus"],
                  ["diabeticRetinopathy", "Diabetic retinopathy"],
                  ["insulinTreated", "Insulin-treated diabetes"],
                  ["severeRenalImpairment", "Severe renal impairment (eGFR below 30 mL/min/1.73 m2) or end-stage renal disease"],
                  ["severeHepaticImpairment", "Severe hepatic impairment"],
                  ["heartFailureLowEf", "Known heart failure with reduced ejection fraction below 40%"],
                  ["eatingDisorder", "Active eating disorder: anorexia nervosa, bulimia, or binge-eating disorder under specialist care"],
                  ["clinicalJudgementUnsuitable", "In the clinical judgement of the healthcare professional, not suitable for the medicine"],
                ] as const
              ).map(([key, label]) => (
                <Checkbox key={key} label={label} checked={state.contraindications[key]} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATION", field: key, value: v })} />
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions</p>
              <Checkbox label="History of suicidal ideation, or active severe mental illness" description="Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern. Do not supply where oversight is absent and concern exists." checked={state.cautions.mentalHealthHistory} onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "mentalHealthHistory", value: v })} />
              {state.cautions.mentalHealthHistory && (
                <div className="ml-6 space-y-2">
                  <Checkbox label="Appropriate psychiatric oversight is in place; mood will be monitored at review" checked={state.cautions.psychiatricOversight} onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "psychiatricOversight", value: v })} />
                  <Checkbox label="There is concern about the patient's current mental state" description="The document excludes only where oversight is absent AND concern exists." checked={state.cautions.mentalHealthConcern} onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "mentalHealthConcern", value: v })} />
                </div>
              )}
              <Checkbox label="Mild to moderate renal impairment (monitor for dehydration secondary to gastrointestinal side effects)" checked={state.cautions.mildModerateRenal} onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "mildModerateRenal", value: v })} />
              <Checkbox label="Pre-existing raised heart rate (use with caution and seek specialist advice first)" checked={state.cautions.raisedHeartRate} onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "raisedHeartRate", value: v })} />
              <Checkbox label="Sodium-restricted diet (the 25 mg tablet contains 23 mg of sodium)" checked={state.cautions.sodiumRestrictedDiet} onChange={(v) => dispatch({ type: "UPDATE_CAUTION", field: "sodiumRestrictedDiet", value: v })} />
            </div>
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Drug Interactions" description="Semaglutide delays gastric emptying and may reduce the absorption of other oral medicines, especially those with a narrow therapeutic index. Other oral medicines must be taken at least 30 minutes after the tablet." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-2">
              <Checkbox label="Levothyroxine (exposure increased by about a third; monitor thyroid function and keep the 30 minute separation)" checked={state.interactions.levothyroxine} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "levothyroxine", value: v })} />
              <Checkbox label="Warfarin or other coumarin (frequent INR monitoring recommended on initiation)" checked={state.interactions.warfarin} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "warfarin", value: v })} />
              <Checkbox label="Sulfonylurea, meglitinide or insulin, for any indication (EXCLUDES under this PGD)" checked={state.interactions.sulfonylureaOrInsulin} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "sulfonylureaOrInsulin", value: v })} />
              <Checkbox label="Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only (no dose adjustment; inform the GP)" checked={state.interactions.metforminSglt2Dpp4} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "metforminSglt2Dpp4", value: v })} />
              <Checkbox label="Oral contraception (no clinically relevant change in exposure; keep the 30 minute separation)" checked={state.interactions.oralContraception} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "oralContraception", value: v })} />
              <Checkbox label="Oral HRT (non-oral products such as a patch, gel or levonorgestrel intrauterine device may be considered)" checked={state.interactions.oralHrt} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "oralHrt", value: v })} />
              <TextArea label="Other relevant medications" value={state.interactions.other} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "other", value: v })} />
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Dose Selection" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 space-y-1">
                <p>Start at 1.5 mg once daily for one month. Escalate monthly through 4 mg and 9 mg to the maintenance dose of 25 mg once daily, with a minimum of one month at each step. The dose may be held at the previous level if needed. Maximum dose 25 mg once daily.</p>
                <p>For significant gastrointestinal symptoms during titration, consider delaying a dose increase or dropping to the previous dose until symptoms improve. Where several consecutive doses have been missed, use clinical judgement about restarting at a lower step and re-escalating (a practice decision rather than a licensed instruction).</p>
                <p>Quantity: one calendar pack of 30 tablets at the appropriate strength, giving one month of treatment. One month of treatment per patient appointment. This PGD does not allow additional medicine to be supplied to enable a patient to stock up.</p>
              </div>
              <SelectInput
                label="Product & strength (one pack of 30 tablets)"
                value={state.doseSelection.product}
                onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "product", value: v })}
                options={[
                  { value: "", label: "Select" },
                  { value: "wegovy-oral-1.5", label: "Wegovy 1.5 mg tablet once daily (start dose, 1 month)" },
                  { value: "wegovy-oral-4", label: "Wegovy 4 mg tablet once daily (titration, min 1 month)" },
                  { value: "wegovy-oral-9", label: "Wegovy 9 mg tablet once daily (titration, min 1 month)" },
                  { value: "wegovy-oral-25", label: "Wegovy 25 mg tablet once daily (maintenance, maximum dose)" },
                ]}
                required
              />
              <TextInput label="Batch number" value={state.doseSelection.batchNumber} onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "batchNumber", value: v })} placeholder="From the pack supplied" required />
              <TextArea label="Clinical rationale for product choice" value={state.doseSelection.rationale} onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "rationale", value: v })} placeholder="e.g. starting dose; titration step; held at previous dose for GI symptoms; 25 mg maintenance after completing titration; switch from documented 2.4 mg injection; reassessment under the 5% rule." />
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper title="Counselling Checklist" description="Confirm each item discussed with the patient." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={stepError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-2">
              <Checkbox label="Take one tablet a day on an empty stomach, after at least 8 hours without food" checked={state.counselling.emptyStomachExplained} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "emptyStomachExplained", value: v })} required />
              <Checkbox label="Take with no more than half a glass of water (about 120 mL)" checked={state.counselling.waterLimit120ml} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "waterLimit120ml", value: v })} required />
              <Checkbox label="Wait at least 30 minutes before anything else, including food, drink and other tablets; waiting less reduces absorption" checked={state.counselling.waitBeforeFood} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "waitBeforeFood", value: v })} required />
              <Checkbox label="Swallow whole. Do not split, crush or chew. Never take two in a day" checked={state.counselling.swallowWholeOneTablet} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "swallowWholeOneTablet", value: v })} required />
              <Checkbox label="Missed dose: skip it and take the next dose the following day. Never take two tablets in a day to make up a missed dose" checked={state.counselling.missedDose} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "missedDose", value: v })} required />
              <Checkbox label="The medicine works alongside diet and activity, not instead of them" checked={state.counselling.dietAndActivity} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "dietAndActivity", value: v })} required />
              <Checkbox label="Nausea and other stomach effects are common at first and usually settle. Drink enough fluid" checked={state.counselling.gastrointestinalSe} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gastrointestinalSe", value: v })} required />
              <Checkbox label="Seek urgent medical attention the same day for severe, persistent abdominal pain, often going through to the back, and stop the medicine (acute pancreatitis)" checked={state.counselling.pancreatitisRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pancreatitisRedFlag", value: v })} required />
              <Checkbox label="Seek urgent medical attention the same day for persistent vomiting with signs of dehydration" checked={state.counselling.urgentVomitingDehydration} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "urgentVomitingDehydration", value: v })} required />
              <Checkbox label="Seek urgent medical attention the same day for yellowing of the skin or the whites of the eyes" checked={state.counselling.gallbladderRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gallbladderRedFlag", value: v })} required />
              <Checkbox label="Seek urgent medical attention the same day for sudden loss of vision in one or both eyes" checked={state.counselling.visionLoss} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "visionLoss", value: v })} required />
              <Checkbox label="Seek urgent medical attention the same day for a sustained rise in resting heart rate" checked={state.counselling.heartRateRise} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "heartRateRise", value: v })} required />
              <Checkbox label="Tell any anaesthetist, dentist or surgeon that you take this medicine before any procedure with sedation or a general anaesthetic" checked={state.counselling.anaesthetistWarning} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "anaesthetistWarning", value: v })} required />
              <Checkbox label="Hypoglycaemia signs and symptoms explained (patient with type 2 diabetes on metformin, SGLT2 inhibitor or DPP-4 inhibitor)" checked={state.counselling.hypoRiskIfDiabetic} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hypoRiskIfDiabetic", value: v })} />
              <Checkbox label="Effective contraception required throughout. Stop at least 2 months before a planned pregnancy; stop immediately if pregnancy occurs or is suspected" checked={state.counselling.pregnancyWarning} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancyWarning", value: v })} required />
              <Checkbox label="Store in the original package below 30 degrees Celsius to protect from moisture. Keep the container tightly closed" checked={state.counselling.storedTablet} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "storedTablet", value: v })} required />
              <Checkbox label="Patient information leaflet supplied, with written lifestyle, diet and physical activity advice and the agreed target weight" checked={state.counselling.writtenInfoSupplied} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "writtenInfoSupplied", value: v })} required />
              <Checkbox label="Attend for review as agreed. Treatment will be reassessed if less than 5% of the starting weight has been lost after 6 months at the established dose" checked={state.counselling.followUpPlan} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpPlan", value: v })} required />
              <Checkbox label="GP informed (required where the patient has type 2 diabetes on metformin, SGLT2 inhibitor or DPP-4 inhibitor; otherwise as appropriate)" checked={state.counselling.gpInformed} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gpInformed", value: v })} required={state.interactions.metforminSglt2Dpp4} />
            </div>
          </StepWrapper>
        );
      case 8:
        return (
          <StepWrapper
            title="Summary & Record"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={stepError} isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextInput label="Pharmacy address" value={state.summary.pharmacyAddress} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })} />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4 print:hidden">Review the record below before saving and printing. Supplied under {PGD_VERSION_LABEL}.</p>
              <WegovyOralSummaryReport state={state} alerts={alerts} pctChange={pctChange} />
            </div>
          </StepWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar stepLabels={STEP_LABELS} currentStep={state.currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} hasErrors={false} />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}

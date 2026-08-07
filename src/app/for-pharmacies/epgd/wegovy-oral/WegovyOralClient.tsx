"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import {
  initialPatientDetails,
  initialConsent,
  initialSummary,
  calculateAge,
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

// ── State shape ────────────────────────────────────────────────

interface WegovyOralState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  offLabelConsent: {
    explainedOffLabel: boolean;
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
    age18To75: boolean;
    willingLifestyleChange: boolean;
    tried6MonthLifestyle: boolean;
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
  };
  interactions: {
    levothyroxine: boolean;
    warfarin: boolean;
    sulfonylureaOrInsulin: boolean;
    oralContraception: boolean;
    other: string;
  };
  doseSelection: {
    product: string; // 'wegovy-oral-1.5' | 'wegovy-oral-4' | 'wegovy-oral-9' | 'wegovy-oral-25' | ''
    rationale: string;
  };
  counselling: {
    emptyStomachExplained: boolean;
    waterLimit120ml: boolean;
    waitBeforeFood: boolean;
    gastrointestinalSe: boolean;
    pancreatitisRedFlag: boolean;
    gallbladderRedFlag: boolean;
    hypoRiskIfDiabetic: boolean;
    pregnancyWarning: boolean;
    storedTablet: boolean;
    followUpPlan: boolean;
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

function initialState(): WegovyOralState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    offLabelConsent: {
      explainedOffLabel: false,
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
      age18To75: false,
      willingLifestyleChange: false,
      tried6MonthLifestyle: false,
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
    },
    interactions: {
      levothyroxine: false,
      warfarin: false,
      sulfonylureaOrInsulin: false,
      oralContraception: false,
      other: "",
    },
    doseSelection: {
      product: "",
      rationale: "",
    },
    counselling: {
      emptyStomachExplained: false,
      waterLimit120ml: false,
      waitBeforeFood: false,
      gastrointestinalSe: false,
      pancreatitisRedFlag: false,
      gallbladderRedFlag: false,
      hypoRiskIfDiabetic: false,
      pregnancyWarning: false,
      storedTablet: false,
      followUpPlan: false,
    },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: BasePatientDetails[keyof BasePatientDetails] }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: BaseConsent[keyof BaseConsent] }
  | { type: "UPDATE_OFFLABEL"; field: keyof WegovyOralState["offLabelConsent"]; value: boolean }
  | { type: "UPDATE_ELIGIBILITY"; field: keyof WegovyOralState["eligibility"]; value: WegovyOralState["eligibility"][keyof WegovyOralState["eligibility"]] }
  | { type: "UPDATE_CONTRAINDICATION"; field: keyof WegovyOralState["contraindications"]; value: boolean }
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
    case "UPDATE_OFFLABEL":
      return { ...state, offLabelConsent: { ...state.offLabelConsent, [action.field]: action.value } };
    case "UPDATE_ELIGIBILITY": {
      const eligibility = { ...state.eligibility, [action.field]: action.value };
      if ((action.field === "heightCm" || action.field === "weightKg") && eligibility.heightCm && eligibility.weightKg) {
        const m = eligibility.heightCm / 100;
        eligibility.bmi = parseFloat((eligibility.weightKg / (m * m)).toFixed(1));
      }
      return { ...state, eligibility };
    }
    case "UPDATE_CONTRAINDICATION":
      return { ...state, contraindications: { ...state.contraindications, [action.field]: action.value } };
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

  // ── Alerts / contraindication summary ───────────────────────
  const alerts = useMemo(() => {
    const out: { code: string; severity: "stop" | "caution" | "red-flag"; message: string; detail: string }[] = [];
    const c = state.contraindications;
    if (c.pregnancyOrTryingConceive) out.push({ code: "preg", severity: "stop", message: "Pregnancy / trying to conceive", detail: "Oral semaglutide is contraindicated. Stop pregnancy 2 months before planned conception." });
    if (c.breastfeeding) out.push({ code: "bf", severity: "stop", message: "Breastfeeding", detail: "Avoid — limited data; use alternative or defer." });
    if (c.type1Diabetes) out.push({ code: "t1d", severity: "stop", message: "Type 1 diabetes", detail: "Not indicated. Refer specialist diabetes service." });
    if (c.mtcOrMen2) out.push({ code: "mtc", severity: "stop", message: "Personal / family MTC or MEN 2", detail: "Contraindicated." });
    if (c.pancreatitisHistory) out.push({ code: "panc", severity: "stop", message: "Pancreatitis history", detail: "Contraindicated." });
    if (c.diabeticRetinopathy) out.push({ code: "retino", severity: "stop", message: "Diabetic retinopathy", detail: "Risk of progression — refer specialist." });
    if (c.severeGastroparesisOrIBD) out.push({ code: "gp", severity: "stop", message: "Severe gastroparesis / IBD", detail: "Contraindicated — oral absorption unreliable + symptom risk." });
    if (c.eatingDisorder) out.push({ code: "ed", severity: "stop", message: "Active eating disorder", detail: "Contraindicated. Refer specialist." });
    if (c.severeRenalImpairment) out.push({ code: "renal", severity: "stop", message: "Severe renal impairment (eGFR <30)", detail: "Avoid." });
    if (c.severeHepaticImpairment) out.push({ code: "hep", severity: "stop", message: "Severe hepatic impairment", detail: "Avoid." });
    if (c.hypersensitivity) out.push({ code: "allergy", severity: "stop", message: "Hypersensitivity", detail: "Contraindicated." });
    if (c.concurrentGlp1) out.push({ code: "glp1", severity: "stop", message: "Concurrent GLP-1 / GIP RA", detail: "Do not double up." });

    const i = state.interactions;
    if (i.warfarin) out.push({ code: "warf", severity: "caution", message: "Warfarin", detail: "Monitor INR closely; gastric emptying delay alters absorption." });
    if (i.levothyroxine) out.push({ code: "levo", severity: "caution", message: "Levothyroxine", detail: "Take levothyroxine 4h apart from oral semaglutide — oral semaglutide significantly delays absorption." });
    if (i.sulfonylureaOrInsulin) out.push({ code: "su", severity: "caution", message: "Sulfonylurea / insulin", detail: "Hypo risk — counsel + refer prescribing GP." });
    if (i.oralContraception) out.push({ code: "oc", severity: "caution", message: "Oral contraception", detail: "GI symptoms may reduce absorption — counsel additional barrier for 7 days after vomiting/diarrhoea." });

    // Written-consent gate.
    // Only applies once the pharmacist has worked past the Informed Consent
    // step. Reported by Rachel (Aug 2026): the stop fired from the very first
    // screen, before any details had been entered, which made canProceed false
    // and blocked every new consultation outright.
    if (state.currentStep > STEP_INFORMED_CONSENT && !state.offLabelConsent.writtenConsentObtained) {
      out.push({ code: "consent", severity: "stop", message: "Written informed consent not yet obtained", detail: "Go back to the Informed Consent step and confirm that written consent has been obtained and filed." });
    }

    // Age gate per signed PGD — adults 18+ (consistency review Jul 2026)
    if (state.patient.age !== null && state.patient.age < 18) {
      out.push({ code: "age", severity: "stop", message: "Patient under 18", detail: "This PGD applies to adults aged 18 years and over." });
    }

    // Eligibility
    if (state.eligibility.bmi !== null && state.eligibility.bmi < 27) {
      out.push({ code: "bmi", severity: "stop", message: "BMI below threshold", detail: `BMI ${state.eligibility.bmi} — must be ≥30, or ≥27 with weight-related comorbidity.` });
    }
    if (state.eligibility.bmi !== null && state.eligibility.bmi >= 27 && state.eligibility.bmi < 30 && !state.eligibility.hasComorbidity) {
      out.push({ code: "bmi-comorb", severity: "stop", message: "BMI 27–30 requires comorbidity", detail: "Patient must have at least one weight-related comorbidity." });
    }

    return out;
  }, [state]);

  const hasStops = alerts.some((a) => a.severity === "stop");

  const canProceed = !hasStops || state.currentStep >= TOTAL_STEPS - 2;

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
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStops]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
          </StepWrapper>
        );
      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Informed Consent to Treatment" description="Wegovy (semaglutide) tablets — UK-licensed for weight management. Documented written consent required." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-md text-sm text-amber-900">
                <strong>This consultation supplies Wegovy (semaglutide) tablets — UK-licensed for weight management.</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Licensed strengths: 1.5 mg, 4 mg, 9 mg and 25 mg tablets. Maintenance dose 25 mg once daily; maximum ONE tablet per day.</li>
                  <li>Black-triangle medicine (additional monitoring) — report any suspected adverse reactions via the MHRA Yellow Card scheme.</li>
                  <li>Counsel on the empty-stomach regimen: at least 8 hours fasting, swallow whole with up to 120 ml water, wait at least 30 minutes before food, drink or other oral medicines.</li>
                </ul>
              </div>
              <Checkbox label="Treatment, dosing schedule and administration requirements clearly explained to the patient" checked={state.offLabelConsent.explainedOffLabel} onChange={(v) => dispatch({ type: "UPDATE_OFFLABEL", field: "explainedOffLabel", value: v })} />
              <Checkbox label="Risk-benefit discussion completed (GI side effects, gallbladder, pancreatitis, hypoglycaemia if diabetic, retinopathy progression)" checked={state.offLabelConsent.riskBenefitDiscussed} onChange={(v) => dispatch({ type: "UPDATE_OFFLABEL", field: "riskBenefitDiscussed", value: v })} />
              <Checkbox label="Alternatives discussed (subcutaneous Wegovy/Mounjaro, lifestyle, bariatric referral)" checked={state.offLabelConsent.alternativesDiscussed} onChange={(v) => dispatch({ type: "UPDATE_OFFLABEL", field: "alternativesDiscussed", value: v })} />
              <Checkbox label="Written informed consent to treatment obtained and filed" checked={state.offLabelConsent.writtenConsentObtained} onChange={(v) => dispatch({ type: "UPDATE_OFFLABEL", field: "writtenConsentObtained", value: v })} />
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Eligibility & BMI" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <div className="space-y-4">
              <Checkbox label="Adult aged 18–75 years (inclusive)" checked={state.eligibility.age18To75} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "age18To75", value: v })} />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Height (cm)" value={state.eligibility.heightCm} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "heightCm", value: v })} min={100} max={220} />
                <NumberInput label="Weight (kg)" value={state.eligibility.weightKg} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "weightKg", value: v })} min={30} max={250} />
              </div>
              {state.eligibility.bmi !== null && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-md">
                  <p className="text-sm text-[color:var(--tenant-primary)]"><strong>BMI: {state.eligibility.bmi}</strong></p>
                  <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
                    {state.eligibility.bmi >= 30
                      ? "BMI ≥30 — eligible (no comorbidity required)."
                      : state.eligibility.bmi >= 27
                      ? "BMI 27–30 — eligible only with weight-related comorbidity."
                      : "BMI <27 — not eligible under this PGD."}
                  </p>
                </div>
              )}
              <Checkbox label="Has at least one weight-related comorbidity (HTN, T2DM, dyslipidaemia, OSA, CVD)" checked={state.eligibility.hasComorbidity} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "hasComorbidity", value: v })} />
              <TextInput label="List comorbidities" value={state.eligibility.comorbidities} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "comorbidities", value: v })} />
              <Checkbox label="Patient willing to follow diet + exercise plan alongside the medication" checked={state.eligibility.willingLifestyleChange} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "willingLifestyleChange", value: v })} />
              <Checkbox label="Patient has tried ≥6 months of lifestyle changes alone without adequate result" checked={state.eligibility.tried6MonthLifestyle} onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "tried6MonthLifestyle", value: v })} />
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <div className="space-y-2">
              {(
                [
                  ["pregnancyOrTryingConceive", "Pregnant, planning pregnancy, or trying to conceive"],
                  ["breastfeeding", "Currently breastfeeding"],
                  ["type1Diabetes", "Type 1 diabetes mellitus"],
                  ["mtcOrMen2", "Personal or family history of MTC or MEN 2"],
                  ["pancreatitisHistory", "History of pancreatitis (acute or chronic)"],
                  ["diabeticRetinopathy", "Diabetic retinopathy"],
                  ["severeGastroparesisOrIBD", "Severe gastroparesis or active IBD"],
                  ["eatingDisorder", "Active eating disorder"],
                  ["severeRenalImpairment", "Severe renal impairment (eGFR <30)"],
                  ["severeHepaticImpairment", "Severe hepatic impairment"],
                  ["hypersensitivity", "Hypersensitivity to semaglutide or excipients"],
                  ["concurrentGlp1", "Currently on another GLP-1 / GIP receptor agonist"],
                ] as const
              ).map(([key, label]) => (
                <Checkbox key={key} label={label} checked={state.contraindications[key]} onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATION", field: key, value: v })} />
              ))}
            </div>
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Drug Interactions" description="Oral semaglutide delays gastric emptying — affects absorption of co-administered drugs." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <div className="space-y-2">
              <Checkbox label="Levothyroxine — counsel to space by ≥4h" checked={state.interactions.levothyroxine} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "levothyroxine", value: v })} />
              <Checkbox label="Warfarin — INR monitoring needed" checked={state.interactions.warfarin} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "warfarin", value: v })} />
              <Checkbox label="Sulfonylurea or insulin (hypo risk)" checked={state.interactions.sulfonylureaOrInsulin} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "sulfonylureaOrInsulin", value: v })} />
              <Checkbox label="Combined oral contraception — counsel barrier method if GI symptoms" checked={state.interactions.oralContraception} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "oralContraception", value: v })} />
              <TextArea label="Other relevant medications" value={state.interactions.other} onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "other", value: v })} />
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Dose Selection" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null} isBlocked={hasStops}>
            <div className="space-y-4">
              <SelectInput
                label="Product & strength"
                value={state.doseSelection.product}
                onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "product", value: v })}
                options={[
                  { value: "", label: "Select…" },
                  { value: "wegovy-oral-1.5", label: "Wegovy 1.5 mg tablet once daily (start dose, 1 month)" },
                  { value: "wegovy-oral-4", label: "Wegovy 4 mg tablet once daily (titration, min 1 month)" },
                  { value: "wegovy-oral-9", label: "Wegovy 9 mg tablet once daily (titration, min 1 month)" },
                  { value: "wegovy-oral-25", label: "Wegovy 25 mg tablet once daily (maintenance)" },
                  
                ]}
                required
              />
              <TextArea label="Clinical rationale for product choice" value={state.doseSelection.rationale} onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "rationale", value: v })} placeholder="e.g. starting dose; titration step; chosen 25 mg as long-term maintenance after completing titration; etc." />
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper title="Counselling Checklist" description="Confirm each item discussed with the patient." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={null}>
            <div className="space-y-2">
              <Checkbox label="Take on an empty stomach in the morning, at least 30 minutes before any food, drink, or other oral medication" checked={state.counselling.emptyStomachExplained} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "emptyStomachExplained", value: v })} />
              <Checkbox label="Take with up to 120 mL of plain water only — no other liquids" checked={state.counselling.waterLimit120ml} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "waterLimit120ml", value: v })} />
              <Checkbox label="Wait the full 30 minutes before food/drink — absorption is significantly reduced otherwise" checked={state.counselling.waitBeforeFood} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "waitBeforeFood", value: v })} />
              <Checkbox label="Gastrointestinal side effects (nausea, vomiting, diarrhoea, constipation) and how to manage" checked={state.counselling.gastrointestinalSe} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gastrointestinalSe", value: v })} />
              <Checkbox label="Pancreatitis red flags — severe abdominal pain, persistent vomiting — stop and seek urgent help" checked={state.counselling.pancreatitisRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pancreatitisRedFlag", value: v })} />
              <Checkbox label="Gallbladder symptoms — RUQ pain, jaundice, fever — seek urgent review" checked={state.counselling.gallbladderRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gallbladderRedFlag", value: v })} />
              <Checkbox label="Hypoglycaemia risk if patient is on sulfonylurea or insulin (refer prescribing GP)" checked={state.counselling.hypoRiskIfDiabetic} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hypoRiskIfDiabetic", value: v })} />
              <Checkbox label="Pregnancy warning — discontinue ≥2 months before planned conception" checked={state.counselling.pregnancyWarning} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancyWarning", value: v })} />
              <Checkbox label="Store tablets in original blister; keep at room temperature" checked={state.counselling.storedTablet} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "storedTablet", value: v })} />
              <Checkbox label="Follow-up plan agreed (weight + tolerability review at 4 weeks, then per protocol)" checked={state.counselling.followUpPlan} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpPlan", value: v })} />
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
            canProceed={true}
            validationError={null}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">Record will be saved with PGD slug <code>wegovy-oral</code>.</p>
              <div className="p-4 bg-gray-50 rounded-md text-xs space-y-2">
                <div><strong>Patient:</strong> {state.patient.firstName} {state.patient.lastName} ({state.patient.dateOfBirth})</div>
                <div><strong>BMI:</strong> {state.eligibility.bmi ?? "—"}</div>
                <div><strong>Product:</strong> {state.doseSelection.product || "—"}</div>
                <div><strong>Written informed consent:</strong> {state.offLabelConsent.writtenConsentObtained ? "Yes" : "NO — cannot proceed"}</div>
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
      <ProgressBar stepLabels={STEP_LABELS} currentStep={state.currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} hasErrors={false} />
      {alerts.length > 0 && state.currentStep < 4 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}

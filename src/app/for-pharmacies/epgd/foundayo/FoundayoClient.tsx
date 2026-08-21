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
import {
  usePreviousWeightConsultation,
  describePrevious,
} from "../shared/hooks/usePreviousWeightConsultation";

// ─────────────────────────────────────────────────────────────────────────
// Foundayo (orforglipron) consultation tool.
//
// Built against PGD v002, signed 21 Aug 2026, which was itself reconciled
// against the UK SPC. Two things in here exist because v001 got them wrong
// and the SPC put them right:
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

type VisitType = "" | "initiation" | "escalation" | "continuation";

/** Licensed titration ladder, in order. */
const DOSE_LADDER = ["0.8", "2.5", "5.5", "9", "14.5", "17.2"] as const;
type Dose = (typeof DOSE_LADDER)[number] | "";

/** Doses that exceed the 9 mg ceiling imposed by certain interactions. */
const ABOVE_CEILING: string[] = ["14.5", "17.2"];

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
  };
  eligibility: {
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
    hasComorbidity: boolean;
    comorbidities: string;
    willingLifestyleChange: boolean;
    initialAssessmentDone: boolean;
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
    insulinOrSuWithoutGpMonitoring: boolean;
    severeRenalImpairment: boolean;
    severeHepaticImpairment: boolean;
    heartFailureEfBelow40: boolean;
    activeEatingDisorder: boolean;
  };
  interactions: {
    strongCyp3a4AndOatp1bInhibitor: boolean; // ritonavir, telaprevir
    strongCyp3a4Inducer: boolean; // rifampicin, carbamazepine, phenytoin, St John's wort
    strongCyp3a4Inhibitor: boolean; // clarithromycin, ketoconazole, itraconazole
    oatp1bInhibitor: boolean; // ciclosporin
    simvastatin: boolean;
    simvastatinPrescriberConfirmed: boolean;
    rosuvastatinOver20mg: boolean;
    oralTopotecan: boolean;
    warfarin: boolean;
    sulfonylureaOrInsulin: boolean;
    antihypertensives: boolean;
    other: string;
  };
  dose: {
    currentDose: Dose;
    newDose: Dose;
    daysAtCurrentDose: number | null;
    rationale: string;
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
    hypoRiskIfDiabetic: boolean;
    pregnancy3Weeks: boolean;
    anaesthesiaWarning: boolean;
    followUpPlan: boolean;
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
const STEP_CONTRACEPTION = STEP_LABELS.indexOf("Contraception");

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
    visit: { type: "" },
    eligibility: {
      heightCm: null,
      weightKg: null,
      bmi: null,
      hasComorbidity: false,
      comorbidities: "",
      willingLifestyleChange: false,
      initialAssessmentDone: false,
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
      insulinOrSuWithoutGpMonitoring: false,
      severeRenalImpairment: false,
      severeHepaticImpairment: false,
      heartFailureEfBelow40: false,
      activeEatingDisorder: false,
    },
    interactions: {
      strongCyp3a4AndOatp1bInhibitor: false,
      strongCyp3a4Inducer: false,
      strongCyp3a4Inhibitor: false,
      oatp1bInhibitor: false,
      simvastatin: false,
      simvastatinPrescriberConfirmed: false,
      rosuvastatinOver20mg: false,
      oralTopotecan: false,
      warfarin: false,
      sulfonylureaOrInsulin: false,
      antihypertensives: false,
      other: "",
    },
    dose: {
      currentDose: "",
      newDose: "",
      daysAtCurrentDose: null,
      rationale: "",
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
      hypoRiskIfDiabetic: false,
      pregnancy3Weeks: false,
      anaesthesiaWarning: false,
      followUpPlan: false,
    },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_INFORMED"; field: keyof FoundayoState["informedConsent"]; value: boolean }
  | { type: "UPDATE_VISIT"; field: keyof FoundayoState["visit"]; value: VisitType }
  | { type: "UPDATE_ELIGIBILITY"; field: keyof FoundayoState["eligibility"]; value: unknown }
  | { type: "UPDATE_EXCLUSION"; field: keyof FoundayoState["exclusions"]; value: boolean }
  | { type: "UPDATE_INTERACTION"; field: keyof FoundayoState["interactions"]; value: unknown }
  | { type: "UPDATE_DOSE"; field: keyof FoundayoState["dose"]; value: unknown }
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
    case "UPDATE_INTERACTION":
      return { ...state, interactions: { ...state.interactions, [action.field]: action.value } };
    case "UPDATE_DOSE":
      return { ...state, dose: { ...state.dose, [action.field]: action.value } };
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

const EXCLUSION_LABELS: [keyof FoundayoState["exclusions"], string][] = [
  ["pregnancyOrPlanning", "Pregnant, planning pregnancy, or trying to conceive"],
  ["breastfeeding", "Currently breastfeeding"],
  ["hypersensitivity", "Hypersensitivity to orforglipron or any excipient"],
  ["mtcOrMen2", "Personal or family history of medullary thyroid carcinoma or MEN 2"],
  ["pancreatitisHistory", "History of pancreatitis, acute or chronic"],
  ["severeGiDiseaseOrGastroparesis", "Severe gastrointestinal disease, including gastroparesis"],
  ["gallstonesOrRecentCholecystectomy", "Current gallstones or cholecystitis, or cholecystectomy in the last 3 months"],
  ["endocrineCauseOfObesity", "Obesity caused by an endocrinological disorder"],
  ["concurrentGlp1OrSecretagogue", "Already taking another GLP-1 agonist or an insulin secretagogue for weight"],
  ["type1Diabetes", "Type 1 diabetes mellitus"],
  ["diabeticRetinopathy", "Diabetic retinopathy"],
  ["insulinOrSuWithoutGpMonitoring", "On insulin or a sulphonylurea, and the GP will not monitor and adjust it"],
  ["severeRenalImpairment", "Severe renal impairment (eGFR below 30) or end-stage renal disease"],
  ["severeHepaticImpairment", "Severe hepatic impairment (Child-Pugh C)"],
  ["heartFailureEfBelow40", "Heart failure with ejection fraction below 40%"],
  ["activeEatingDisorder", "Active eating disorder"],
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
    const { patient, eligibility, exclusions, interactions, dose, contraception, visit } = state;

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

    // ── BMI thresholds, per the marketing authorisation. ────────────
    if (eligibility.bmi !== null && eligibility.bmi < 27) {
      out.push({
        code: "bmi",
        severity: "stop",
        message: "BMI below threshold",
        detail: `BMI ${eligibility.bmi}. Must be 30 or above, or 27 or above with a weight-related comorbidity.`,
      });
    }
    if (
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
    for (const [key, label] of EXCLUSION_LABELS) {
      if (exclusions[key]) {
        out.push({
          code: `excl-${key}`,
          severity: "stop",
          message: label,
          detail: "Excluded under this PGD. Discuss the reason with the patient, advise on alternatives and refer as appropriate.",
        });
      }
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
    }

    // ── Contraception. The reason this tool exists. ─────────────────
    const isDoseIncrease =
      visit.type === "initiation" ||
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
    if (interactions.sulfonylureaOrInsulin) {
      out.push({
        code: "hypo",
        severity: "caution",
        message: "Sulphonylurea or insulin",
        detail: "Increased risk of hypoglycaemia. A dose reduction may be needed and blood glucose self-monitoring is necessary. Refer to the prescriber.",
      });
    }
    if (interactions.antihypertensives) {
      out.push({
        code: "bp",
        severity: "caution",
        message: "On antihypertensive treatment",
        detail: "Orforglipron may lower blood pressure and hypotension is reported more often in these patients. Ask about dizziness and falls at each review.",
      });
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

  const stepProps = {
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    onNext: handleNext,
    onPrev: handlePrev,
    canProceed,
    validationError: null,
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
                    {describePrevious(previous)}. Height has been filled in for you.
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
                  { value: "", label: "Select…" },
                  { value: "initiation", label: "Initiation, first supply of orforglipron" },
                  { value: "escalation", label: "Follow-up with a dose increase" },
                  { value: "continuation", label: "Follow-up continuing the same dose" },
                ]}
                required
              />
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
              {state.eligibility.bmi !== null && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-md">
                  <p className="text-sm text-[color:var(--tenant-primary)]">
                    <strong>BMI: {state.eligibility.bmi}</strong>
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
              />
              <Checkbox
                label="Patient willing to follow a reduced-calorie diet and increase physical activity alongside the medicine"
                checked={state.eligibility.willingLifestyleChange}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "willingLifestyleChange", value: v })}
              />
              <Checkbox
                label="Initial assessment completed and documented (causes of weight gain, previous attempts, expectations, target weight)"
                checked={state.eligibility.initialAssessmentDone}
                onChange={(v) => dispatch({ type: "UPDATE_ELIGIBILITY", field: "initialAssessmentDone", value: v })}
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
              {EXCLUSION_LABELS.map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={state.exclusions[key]}
                  onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: key, value: v })}
                />
              ))}
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
                label="Clarithromycin, ketoconazole or itraconazole (strong CYP3A4 inhibitor) — caps the dose at 9 mg"
                checked={state.interactions.strongCyp3a4Inhibitor}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "strongCyp3a4Inhibitor", value: v })}
              />
              <Checkbox
                label="Ciclosporin or another clinical OATP1B inhibitor — caps the dose at 9 mg"
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
                checked={state.interactions.warfarin}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "warfarin", value: v })}
              />
              <Checkbox
                label="Sulphonylurea or insulin"
                checked={state.interactions.sulfonylureaOrInsulin}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "sulfonylureaOrInsulin", value: v })}
              />
              <Checkbox
                label="Any antihypertensive medicine"
                checked={state.interactions.antihypertensives}
                onChange={(v) => dispatch({ type: "UPDATE_INTERACTION", field: "antihypertensives", value: v })}
              />
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
          <StepWrapper title="Dose & Titration" {...stepProps} isBlocked={hasStops}>
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
                />
              )}
              <SelectInput
                label="Dose to supply today"
                value={state.dose.newDose}
                onChange={(v) => dispatch({ type: "UPDATE_DOSE", field: "newDose", value: v as Dose })}
                options={[
                  { value: "", label: "Select…" },
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
                    label="Advised to switch to a non-oral method, or to add a barrier method, for 30 days"
                    checked={state.contraception.advisedNonOralOrBarrier}
                    onChange={(v) => dispatch({ type: "UPDATE_CONTRACEPTION", field: "advisedNonOralOrBarrier", value: v })}
                  />
                  <Checkbox
                    label="Told that this applies again for 30 days after every future dose increase"
                    checked={state.contraception.advisedRepeatAfterEachIncrease}
                    onChange={(v) => dispatch({ type: "UPDATE_CONTRACEPTION", field: "advisedRepeatAfterEachIncrease", value: v })}
                  />
                </div>
              )}
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                Pregnancy is an exclusion under this PGD. Orforglipron must be stopped at
                least 3 weeks before a planned pregnancy, and immediately if pregnancy
                occurs or is suspected.
              </div>
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Counselling Checklist"
            description="Confirm each item has been discussed."
            {...stepProps}
          >
            <div className="space-y-2">
              <Checkbox label="Swallow whole, do not break, crush or chew. Any time of day, with or without food, no waiting period." checked={state.counselling.swallowWholeNoRestriction} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "swallowWholeNoRestriction", value: v })} />
              <Checkbox label="One tablet a day only. Never combine tablets to reach a higher dose." checked={state.counselling.oneTabletOnly} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "oneTabletOnly", value: v })} />
              <Checkbox label="Missed dose: take it as soon as possible, but never two tablets in one day." checked={state.counselling.missedDose} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "missedDose", value: v })} />
              <Checkbox label="Gastrointestinal effects (nausea, vomiting, diarrhoea, constipation) and how to manage them." checked={state.counselling.giSideEffects} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "giSideEffects", value: v })} />
              <Checkbox label="Keep fluid intake up. Vomiting and diarrhoea can cause dehydration and affect the kidneys." checked={state.counselling.dehydrationAndKidney} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "dehydrationAndKidney", value: v })} />
              <Checkbox label="Pancreatitis red flag: severe, persistent abdominal pain. Stop and seek urgent medical help." checked={state.counselling.pancreatitisRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pancreatitisRedFlag", value: v })} />
              <Checkbox label="Gallbladder red flag: right upper abdominal pain, jaundice or fever. Seek urgent review." checked={state.counselling.gallbladderRedFlag} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "gallbladderRedFlag", value: v })} />
              <Checkbox label="Blood pressure may fall. Report dizziness, light-headedness or falls, particularly if on antihypertensives." checked={state.counselling.hypotensionSymptoms} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hypotensionSymptoms", value: v })} />
              <Checkbox label="Hypoglycaemia risk if taking a sulphonylurea or insulin, and what to do about it." checked={state.counselling.hypoRiskIfDiabetic} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hypoRiskIfDiabetic", value: v })} />
              <Checkbox label="Stop at least 3 weeks before a planned pregnancy, and immediately if pregnancy is suspected." checked={state.counselling.pregnancy3Weeks} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancy3Weeks", value: v })} />
              <Checkbox label="Tell any anaesthetist about this medicine before surgery or a procedure under sedation." checked={state.counselling.anaesthesiaWarning} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "anaesthesiaWarning", value: v })} />
              <Checkbox label="Follow-up agreed: weight and tolerability review before the next increase, and no increase inside 30 days." checked={state.counselling.followUpPlan} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpPlan", value: v })} />
            </div>
          </StepWrapper>
        );

      case 9:
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
              <p className="text-sm text-gray-600 mb-4">
                Record will be saved with PGD slug <code>foundayo</code>, against
                document version v002.
              </p>
              <div className="p-4 bg-gray-50 rounded-md text-xs space-y-2">
                <div><strong>Patient:</strong> {state.patient.firstName} {state.patient.lastName} ({state.patient.dateOfBirth})</div>
                <div><strong>Visit:</strong> {state.visit.type || "—"}</div>
                <div><strong>BMI:</strong> {state.eligibility.bmi ?? "—"}</div>
                <div><strong>Dose supplied:</strong> {state.dose.newDose ? `${state.dose.newDose} mg once daily` : "—"}</div>
                <div>
                  <strong>Contraception:</strong>{" "}
                  {state.contraception.notApplicable
                    ? "Not applicable"
                    : state.contraception.usesOralHormonal
                    ? state.contraception.advisedNonOralOrBarrier
                      ? "Oral hormonal, advice given"
                      : "Oral hormonal, ADVICE NOT GIVEN"
                    : "—"}
                </div>
                <div><strong>Written informed consent:</strong> {state.informedConsent.writtenConsentObtained ? "Yes" : "NO — cannot proceed"}</div>
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
        hasErrors={false}
      />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}

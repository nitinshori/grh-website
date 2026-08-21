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

// ─────────────────────────────────────────────────────────────────────────
// Chest Infection Service, acute bacterial bronchitis.
//
// The signed PGD (doxycycline, amoxicillin or clarithromycin, from age 12)
// has existed since before this tool. The tool did not: the slug was listed
// in the catalogue and on the public price list, so a pharmacy that held it
// saw the tile and clicked through to a 404. Found in the catalogue audit of
// 21 Aug 2026 and built the same day.
//
// Two things this tool takes seriously that a checklist would not:
//
//   1. Most acute bronchitis is viral. The default should be no antibiotic,
//      so the pharmacist has to positively record why this one warrants an
//      antibiotic rather than tick past it.
//   2. The dangerous miss is pneumonia, not a wrong antibiotic choice.
//      Focal chest signs and the other pneumonia features are hard stops
//      that route to same-day medical assessment.
//
// Doses come from the signed document:
//   Amoxicillin 500 mg three times a day, 5 days
//   Clarithromycin 250 to 500 mg twice a day, 5 days
//   Doxycycline 200 mg on day 1 then 100 mg once daily for 4 days
//   Erythromycin 250 to 500 mg four times a day, 5 days
// ─────────────────────────────────────────────────────────────────────────

type Antibiotic = "" | "amoxicillin" | "doxycycline" | "clarithromycin" | "erythromycin";

const ANTIBIOTIC_REGIMENS: Record<Exclude<Antibiotic, "">, { label: string; dose: string }> = {
  amoxicillin: {
    label: "Amoxicillin 500 mg three times a day for 5 days",
    dose: "500 mg TDS, 5 days",
  },
  doxycycline: {
    label: "Doxycycline 200 mg on day 1, then 100 mg once daily for 4 days",
    dose: "200 mg day 1 then 100 mg OD, 5 days total",
  },
  clarithromycin: {
    label: "Clarithromycin 250 to 500 mg twice a day for 5 days",
    dose: "250 to 500 mg BD, 5 days",
  },
  erythromycin: {
    label: "Erythromycin 250 to 500 mg four times a day for 5 days",
    dose: "250 to 500 mg QDS, 5 days",
  },
};

interface ChestState {
  currentStep: number;
  patient: BasePatientDetails;
  consent: BaseConsent;
  presentation: {
    coughDurationDays: number | null;
    purulentSputum: boolean;
    fever: boolean;
    breathless: boolean;
    wheeze: boolean;
    chestPain: boolean;
    // The stewardship judgement, recorded rather than assumed
    bacterialFeaturesPresent: boolean;
    higherRiskOfComplications: boolean;
    rationale: string;
  };
  redFlags: {
    focalChestSigns: boolean;
    suspectedPneumonia: boolean;
    sepsisFeatures: boolean;
    haemoptysis: boolean;
    hoarseness: boolean;
    troubleSwallowing: boolean;
    dyspnoeaAtRest: boolean;
    oedemaWithWeightGain: boolean;
    weightLoss: boolean;
    persistentVomiting: boolean;
    smokerNewOrChangedCough: boolean;
  };
  exclusions: {
    pregnancy: boolean;
    breastfeeding: boolean;
    hypersensitivityToChosenAgent: boolean;
    unableToTakeOral: boolean;
  };
  medicines: {
    penicillinAllergy: boolean;
    tetracyclineAllergy: boolean;
    macrolideAllergy: boolean;
    onSimvastatin: boolean;
    onWarfarin: boolean;
    other: string;
  };
  treatment: {
    antibiotic: Antibiotic;
    batch: string;
    expiry: string;
  };
  counselling: {
    courseCompletion: boolean;
    viralExplanation: boolean;
    sideEffects: boolean;
    doxycyclineAdvice: boolean;
    safetyNetting: boolean;
    selfCare: boolean;
  };
  summary: BaseSummary;
}

const STEP_LABELS = [
  "Patient",
  "Consent",
  "Presentation",
  "Red Flags",
  "Exclusions",
  "Medicines",
  "Antibiotic",
  "Counselling",
  "Summary",
];
const TOTAL_STEPS = STEP_LABELS.length;
const STEP_PRESENTATION = STEP_LABELS.indexOf("Presentation");
const STEP_REDFLAGS = STEP_LABELS.indexOf("Red Flags");
const STEP_ANTIBIOTIC = STEP_LABELS.indexOf("Antibiotic");

function initialState(): ChestState {
  return {
    currentStep: 0,
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    presentation: {
      coughDurationDays: null,
      purulentSputum: false,
      fever: false,
      breathless: false,
      wheeze: false,
      chestPain: false,
      bacterialFeaturesPresent: false,
      higherRiskOfComplications: false,
      rationale: "",
    },
    redFlags: {
      focalChestSigns: false,
      suspectedPneumonia: false,
      sepsisFeatures: false,
      haemoptysis: false,
      hoarseness: false,
      troubleSwallowing: false,
      dyspnoeaAtRest: false,
      oedemaWithWeightGain: false,
      weightLoss: false,
      persistentVomiting: false,
      smokerNewOrChangedCough: false,
    },
    exclusions: {
      pregnancy: false,
      breastfeeding: false,
      hypersensitivityToChosenAgent: false,
      unableToTakeOral: false,
    },
    medicines: {
      penicillinAllergy: false,
      tetracyclineAllergy: false,
      macrolideAllergy: false,
      onSimvastatin: false,
      onWarfarin: false,
      other: "",
    },
    treatment: { antibiotic: "", batch: "", expiry: "" },
    counselling: {
      courseCompletion: false,
      viralExplanation: false,
      sideEffects: false,
      doxycyclineAdvice: false,
      safetyNetting: false,
      selfCare: false,
    },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: unknown }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: unknown }
  | { type: "UPDATE_PRESENTATION"; field: keyof ChestState["presentation"]; value: unknown }
  | { type: "UPDATE_REDFLAG"; field: keyof ChestState["redFlags"]; value: boolean }
  | { type: "UPDATE_EXCLUSION"; field: keyof ChestState["exclusions"]; value: boolean }
  | { type: "UPDATE_MEDICINE"; field: keyof ChestState["medicines"]; value: unknown }
  | { type: "UPDATE_TREATMENT"; field: keyof ChestState["treatment"]; value: unknown }
  | { type: "UPDATE_COUNSELLING"; field: keyof ChestState["counselling"]; value: boolean }
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
    case "UPDATE_PRESENTATION":
      return { ...state, presentation: { ...state.presentation, [action.field]: action.value } };
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

interface Alert {
  code: string;
  severity: "stop" | "caution" | "red-flag";
  message: string;
  detail: string;
}

const RED_FLAG_LABELS: [keyof ChestState["redFlags"], string, string][] = [
  ["focalChestSigns", "Focal chest signs on examination", "Focal signs suggest pneumonia rather than bronchitis. Refer the same day for medical assessment."],
  ["suspectedPneumonia", "Suspected pneumonia", "Breathlessness, sputum, wheeze or pleuritic pain with focal signs. Refer the same day."],
  ["sepsisFeatures", "Any feature of sepsis", "Refer immediately. Call 999 if the patient looks seriously unwell."],
  ["haemoptysis", "Coughing blood", "Requires investigation. Refer."],
  ["hoarseness", "Persistent hoarseness", "Refer for assessment, in line with the lung and pleural cancer referral guidance."],
  ["troubleSwallowing", "Trouble swallowing", "Refer for assessment."],
  ["dyspnoeaAtRest", "Prominent breathlessness at rest or at night", "Refer for assessment."],
  ["oedemaWithWeightGain", "Peripheral oedema with weight gain", "May indicate heart failure. Refer."],
  ["weightLoss", "Unexplained weight loss or systemic symptoms", "Refer for assessment."],
  ["persistentVomiting", "Persistent vomiting", "Refer, and note that oral antibiotics may not be retained."],
  ["smokerNewOrChangedCough", "Smoker over 45 with a new or changed cough, or voice change", "Refer in line with the lung cancer referral guidance."],
];

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
    if (m.macrolideAllergy) {
      out.add("clarithromycin");
      out.add("erythromycin");
    }
    return out;
  }, [state.medicines]);

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];
    const { patient, presentation, redFlags, exclusions, medicines, treatment } = state;

    // ── Age. The PGD covers 12 and over. ────────────────────────────
    if (patient.age !== null && patient.age < 12) {
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

    // ── Duration. Beyond 3 weeks this is no longer an acute cough. ──
    if (presentation.coughDurationDays !== null && presentation.coughDurationDays > 21) {
      out.push({
        code: "duration",
        severity: "stop",
        message: `Cough lasting ${presentation.coughDurationDays} days`,
        detail:
          "A cough of more than three weeks is not an acute cough and is outside this PGD. It needs assessment for the causes of a subacute or chronic cough, which include asthma, reflux, ACE inhibitors and, in smokers, malignancy. Refer.",
      });
    }

    // ── Exclusions from the signed document. ────────────────────────
    if (exclusions.pregnancy) {
      out.push({
        code: "preg",
        severity: "stop",
        message: "Pregnant",
        detail: "Pregnancy is an exclusion under this PGD. Refer to the GP, who can consider erythromycin.",
      });
    }
    if (exclusions.breastfeeding) {
      out.push({
        code: "bf",
        severity: "stop",
        message: "Breastfeeding",
        detail: "Breastfeeding is an exclusion under this PGD. Refer to the GP.",
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

    // ── Antimicrobial stewardship. Recorded, not assumed. ───────────
    // Guarded so it cannot fire before the pharmacist reaches the step
    // where the judgement is entered.
    if (
      state.currentStep > STEP_PRESENTATION &&
      !presentation.bacterialFeaturesPresent &&
      !presentation.higherRiskOfComplications
    ) {
      out.push({
        code: "stewardship",
        severity: "stop",
        message: "No recorded reason for an antibiotic",
        detail:
          "Most acute bronchitis is viral and gets better without an antibiotic. Record either features suggesting bacterial infection or a higher risk of complications, or do not supply: give self-care advice and safety netting instead, which is a legitimate and common outcome for this service.",
      });
    }

    // ── Allergy versus chosen agent. ────────────────────────────────
    if (treatment.antibiotic && blockedAgents.has(treatment.antibiotic)) {
      out.push({
        code: "allergy-choice",
        severity: "stop",
        message: `${treatment.antibiotic} conflicts with a recorded allergy`,
        detail: "Select an agent the patient is not allergic to.",
      });
    }
    if (
      state.currentStep > STEP_ANTIBIOTIC &&
      blockedAgents.size >= 3 &&
      !treatment.antibiotic
    ) {
      out.push({
        code: "no-agent",
        severity: "stop",
        message: "No suitable antibiotic remains",
        detail: "The recorded allergies rule out the agents in this PGD. Refer to the GP.",
      });
    }

    // ── Interactions. ───────────────────────────────────────────────
    if (medicines.onSimvastatin && treatment.antibiotic === "clarithromycin") {
      out.push({
        code: "simva-clarithro",
        severity: "stop",
        message: "Clarithromycin with simvastatin",
        detail:
          "Clarithromycin must not be taken with simvastatin: the combination carries a risk of rhabdomyolysis. Choose a different antibiotic, or refer to the prescriber to suspend the statin for the course.",
      });
    }
    if (medicines.onWarfarin) {
      out.push({
        code: "warfarin",
        severity: "caution",
        message: "On warfarin",
        detail:
          "All the agents in this PGD can raise INR. Advise the patient to have their INR checked during the course and tell their anticoagulation service.",
      });
    }
    if (presentation.fever && !redFlags.sepsisFeatures) {
      out.push({
        code: "fever",
        severity: "caution",
        message: "Fever recorded",
        detail:
          "Reassess for pneumonia and sepsis. Fever alone does not exclude supply, but it should raise the threshold for referral.",
      });
    }

    return out;
  }, [state, blockedAgents]);

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
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
            />
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
            title="Presentation"
            description="Acute bronchitis is usually viral. This step is where you record whether an antibiotic is warranted at all."
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
              />
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                More than 21 days is not an acute cough and falls outside this PGD.
              </div>

              <p className="text-sm font-semibold text-navy-900 pt-2">Symptoms</p>
              <Checkbox label="Purulent or discoloured sputum" checked={state.presentation.purulentSputum} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "purulentSputum", value: v })} />
              <Checkbox label="Fever" checked={state.presentation.fever} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "fever", value: v })} />
              <Checkbox label="Breathlessness" checked={state.presentation.breathless} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "breathless", value: v })} />
              <Checkbox label="Wheeze" checked={state.presentation.wheeze} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "wheeze", value: v })} />
              <Checkbox label="Chest pain" checked={state.presentation.chestPain} onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "chestPain", value: v })} />

              <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Is an antibiotic warranted?</p>
                <p className="text-xs text-amber-900">
                  At least one of these must be recorded before the tool will let
                  you supply. If neither applies, the right outcome is self-care
                  advice and safety netting, and that is a normal result for this
                  service rather than a failed consultation.
                </p>
                <Checkbox
                  label="Features suggesting bacterial infection rather than a viral illness"
                  checked={state.presentation.bacterialFeaturesPresent}
                  onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "bacterialFeaturesPresent", value: v })}
                />
                <Checkbox
                  label="Higher risk of complications (significant comorbidity, frailty, immunosuppression)"
                  checked={state.presentation.higherRiskOfComplications}
                  onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "higherRiskOfComplications", value: v })}
                />
                <TextArea
                  label="Clinical rationale"
                  value={state.presentation.rationale}
                  onChange={(v) => dispatch({ type: "UPDATE_PRESENTATION", field: "rationale", value: v })}
                  placeholder="e.g. 10 days of productive cough with purulent sputum, worsening rather than settling, COPD background"
                />
              </div>
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Red Flags"
            description="Any tick routes the patient out of this service. The dangerous miss here is pneumonia."
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

      case 4:
        return (
          <StepWrapper title="Exclusions" {...stepProps}>
            <div className="space-y-2">
              <Checkbox label="Pregnant" checked={state.exclusions.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "pregnancy", value: v })} />
              <Checkbox label="Breastfeeding" checked={state.exclusions.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "breastfeeding", value: v })} />
              <Checkbox label="Hypersensitivity to the intended agent or any of its excipients" checked={state.exclusions.hypersensitivityToChosenAgent} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "hypersensitivityToChosenAgent", value: v })} />
              <Checkbox label="Unable to take or retain oral medication" checked={state.exclusions.unableToTakeOral} onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION", field: "unableToTakeOral", value: v })} />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Allergies & Current Medicines"
            description="Allergies recorded here remove the corresponding antibiotic from the next step."
            {...stepProps}
          >
            <div className="space-y-2">
              <Checkbox label="Penicillin allergy" checked={state.medicines.penicillinAllergy} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "penicillinAllergy", value: v })} description="Rules out amoxicillin" />
              <Checkbox label="Tetracycline allergy" checked={state.medicines.tetracyclineAllergy} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "tetracyclineAllergy", value: v })} description="Rules out doxycycline" />
              <Checkbox label="Macrolide allergy" checked={state.medicines.macrolideAllergy} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "macrolideAllergy", value: v })} description="Rules out clarithromycin and erythromycin" />
              <Checkbox label="Taking simvastatin" checked={state.medicines.onSimvastatin} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onSimvastatin", value: v })} description="Must not be combined with clarithromycin" />
              <Checkbox label="Taking warfarin" checked={state.medicines.onWarfarin} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "onWarfarin", value: v })} />
              <TextArea label="Other current medicines" value={state.medicines.other} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE", field: "other", value: v })} />
            </div>
          </StepWrapper>
        );

      case 6: {
        const options = (Object.keys(ANTIBIOTIC_REGIMENS) as Array<keyof typeof ANTIBIOTIC_REGIMENS>)
          .filter((k) => !blockedAgents.has(k))
          .map((k) => ({ value: k, label: ANTIBIOTIC_REGIMENS[k].label }));
        return (
          <StepWrapper title="Antibiotic & Supply" {...stepProps} isBlocked={hasStops}>
            <div className="space-y-4">
              {blockedAgents.size > 0 && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-300 text-sm text-amber-900">
                  Removed because of a recorded allergy: {[...blockedAgents].join(", ")}.
                </div>
              )}
              <SelectInput
                label="Antibiotic"
                value={state.treatment.antibiotic}
                onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "antibiotic", value: v as Antibiotic })}
                options={[{ value: "", label: "Select…" }, ...options]}
                required
              />
              {state.treatment.antibiotic && (
                <div className="p-3 rounded-md bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30">
                  <p className="text-sm font-semibold text-navy-900">
                    {ANTIBIOTIC_REGIMENS[state.treatment.antibiotic as Exclude<Antibiotic, "">].label}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Batch number" value={state.treatment.batch} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "batch", value: v })} />
                <TextInput label="Expiry" type="date" value={state.treatment.expiry} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "expiry", value: v })} />
              </div>
              <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600">
                All courses under this PGD are 5 days. Supply the course only; this
                PGD does not permit a repeat.
              </div>
            </div>
          </StepWrapper>
        );
      }

      case 7:
        return (
          <StepWrapper title="Counselling" description="Confirm each item discussed." {...stepProps}>
            <div className="space-y-2">
              <Checkbox label="Complete the full 5 day course even if feeling better" checked={state.counselling.courseCompletion} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "courseCompletion", value: v })} />
              <Checkbox label="Explained that a cough often lasts three weeks or more after a chest infection, and that this is not treatment failure" checked={state.counselling.viralExplanation} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "viralExplanation", value: v })} />
              <Checkbox label="Common side effects, particularly nausea and diarrhoea, and what to do about them" checked={state.counselling.sideEffects} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })} />
              <Checkbox label="If doxycycline: swallow whole with plenty of water, sitting or standing, do not lie down for 30 minutes, and avoid strong sunlight" checked={state.counselling.doxycyclineAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "doxycyclineAdvice", value: v })} />
              <Checkbox label="Self-care: fluids, rest, simple analgesia, and honey for cough" checked={state.counselling.selfCare} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "selfCare", value: v })} />
              <Checkbox label="Safety netting: seek help if breathless, coughing blood, confused, or if symptoms worsen quickly or do not improve after the course" checked={state.counselling.safetyNetting} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "safetyNetting", value: v })} />
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
              <p className="text-sm text-gray-600 mb-4">
                Record will be saved with PGD slug <code>chest-service</code>.
              </p>
              <div className="p-4 bg-gray-50 rounded-md text-xs space-y-2">
                <div><strong>Patient:</strong> {state.patient.firstName} {state.patient.lastName} ({state.patient.dateOfBirth})</div>
                <div><strong>Cough duration:</strong> {state.presentation.coughDurationDays ?? "—"} days</div>
                <div><strong>Antibiotic:</strong> {state.treatment.antibiotic ? ANTIBIOTIC_REGIMENS[state.treatment.antibiotic as Exclude<Antibiotic, "">].dose : "None supplied"}</div>
                <div><strong>Reason for antibiotic recorded:</strong> {state.presentation.bacterialFeaturesPresent || state.presentation.higherRiskOfComplications ? "Yes" : "No"}</div>
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

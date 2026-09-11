"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  AsthmaConsultationState,
  AsthmaAction,
  AsthmaPatientDetails,
  AsthmaAssessment,
  AsthmaMedicalHistory,
  AsthmaRedFlags,
  AsthmaMedicineSupply,
  AsthmaCounselling,
} from "./lib/asthma-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState, PGD_STRAPLINE } from "./lib/asthma-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  acuteSevereFeatures,
  prednisoloneTabletCount,
  SALBUTAMOL_RECOMMENDATION,
} from "./lib/asthma-clinical-logic";
import { validateStep } from "./lib/asthma-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { AsthmaSummaryReport } from "./components/AsthmaSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: AsthmaConsultationState, action: AsthmaAction): AsthmaConsultationState {
  const newState = { ...state };

  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        newState.patient.age = calculateAge(action.value as string);
      }
      break;

    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;

    case "UPDATE_ASSESSMENT":
      newState.assessment = {
        ...newState.assessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_OBSERVATIONS":
      newState.observations = {
        ...newState.observations,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_RED_FLAGS":
      newState.redFlags = {
        ...newState.redFlags,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = {
        ...newState.medicineSupply,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_COUNSELLING":
      newState.counselling = {
        ...newState.counselling,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;
  }

  return newState;
}

// ─── Main Client Component ───

export default function AsthmaClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: __pharmProfile.name } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: __pharmProfile.gphcNumber } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: __pharmProfile.pharmacyName } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: __pharmProfile.pharmacyAddress } as any);
  }, [__pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ─── Computed values ───

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 5 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);

  // ─── Step content rendering ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof AsthmaPatientDetails, value })
            }
            requireAdult={false}
          />
        );

      case 1: // Consent
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2: // Asthma Assessment
        return (
          <div className="space-y-4">
            <Checkbox
              label="Confirmed diagnosis of asthma"
              checked={state.assessment.hasExistingDiagnosis}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "hasExistingDiagnosis",
                  value: v,
                })
              }
              description="Must be DOCUMENTED. Previous inhaler use on its own is not confirmation."
              required
            />
            <SelectInput
              label="How the diagnosis is documented"
              value={state.assessment.diagnosisEvidence}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "diagnosisEvidence", value: v })
              }
              options={[
                { value: "gp-record", label: "GP record" },
                { value: "repeat-prescription", label: "Repeat prescription for an asthma inhaler" },
                { value: "action-plan", label: "Asthma action plan" },
                { value: "none", label: "None of these (previous inhaler use only): first presentation, refer" },
              ]}
              required
            />
            <Checkbox
              label="Confirm patient normally uses SABA"
              checked={state.assessment.normallyUsesSABA}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "normallyUsesSABA",
                  value: v,
                })
              }
              description="Patient must routinely use short-acting beta-agonist inhaler"
            />
            <TextInput
              label="Current SABA medication (optional)"
              value={state.assessment.currentSABAMedication}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "currentSABAMedication",
                  value: v,
                })
              }
              placeholder="e.g., Salbutamol inhaler, Ventolin"
            />
            <Checkbox
              label="Current preventer (inhaled corticosteroid) therapy asked about: patient is on a preventer"
              checked={state.assessment.onPreventer}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "onPreventer", value: v })
              }
              description="A patient with no preventer is referred to the GP for review; do not supply."
              required
            />
            <TextInput
              label="Preventer therapy details"
              value={state.assessment.preventerDetails}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "preventerDetails", value: v })
              }
              placeholder="e.g. beclometasone 200mcg two puffs twice daily; or none"
            />
            <NumberInput
              label="Rescue courses in the last 12 months"
              value={state.assessment.rescueCoursesLast12Months}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "rescueCoursesLast12Months", value: v })
              }
              min={0}
              max={20}
              unit="(no more than one rescue course in 12 months is supplied under this PGD; more than one: refer to GP)"
              required
            />
            <Checkbox
              label="Acute exacerbation with symptoms of bronchospasm (wheezing, breathlessness, chest tightness)"
              checked={state.assessment.acuteExacerbation}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "acuteExacerbation", value: v })
              }
              description="Inclusion criterion"
              required
            />
            <Checkbox
              label="Capable of using an inhaler device, or willing to use a spacer"
              checked={state.assessment.canUseInhalerOrSpacer}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "canUseInhalerOrSpacer", value: v })
              }
              description="Inclusion criterion for the salbutamol arm"
            />
            <Checkbox
              label="Moderate exacerbation with incomplete response to salbutamol"
              checked={state.assessment.incompleteResponseToSalbutamol}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "incompleteResponseToSalbutamol", value: v })
              }
              description="Entry criterion for the prednisolone arm. Any acute severe or life-threatening feature is an emergency referral, not a prednisolone supply."
            />
            <Checkbox
              label="Able to take oral medication"
              checked={state.assessment.ableToTakeOralMedication}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "ableToTakeOralMedication", value: v })
              }
              description="Inclusion criterion for the prednisolone arm"
            />
            <SelectInput
              label="Reason for supply"
              value={state.assessment.reasonForSupply}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "reasonForSupply",
                  value: v,
                })
              }
              options={[
                { value: "exacerbation", label: "Acute exacerbation: rescue treatment" },
                { value: "ran out", label: "Ran out of current supply during exacerbation" },
                { value: "other", label: "Other" },
              ]}
              required
            />
            <Checkbox
              label="Frequent use (>3 days per week)"
              checked={state.assessment.frequentUse}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "frequentUse",
                  value: v,
                })
              }
              description="Patient uses reliever more than 3 times per week"
            />
            <Checkbox
              label="Nocturnal symptoms (wakes at night due to asthma)"
              checked={state.assessment.nocturnalSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "nocturnalSymptoms",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Activity limitation due to symptoms"
              checked={state.assessment.activityLimitation}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "activityLimitation",
                  value: v,
                })
              }
              description="Symptoms limit normal activities or exercise"
            />
          </div>
        );

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <Checkbox
              label="Asthma documented in GP records"
              checked={state.medicalHistory.hasAsthmaRecord}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "hasAsthmaRecord",
                  value: v,
                })
              }
            />
            <TextInput
              label="Other respiratory conditions (optional)"
              value={state.medicalHistory.otherRespiratoryConditions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "otherRespiratoryConditions",
                  value: v,
                })
              }
              placeholder="e.g., COPD, cystic fibrosis, emphysema"
            />
            <TextInput
              label="Known allergies (optional)"
              value={state.medicalHistory.allergies}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "allergies",
                  value: v,
                })
              }
              placeholder="e.g., penicillin, latex"
            />
            <TextInput
              label="Other medical conditions (optional)"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "otherConditions",
                  value: v,
                })
              }
              placeholder="e.g., hypertension, diabetes, cardiac conditions"
            />
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Salbutamol cautions (PGD v005)</p>
              <div className="space-y-2">
                <Checkbox label="Cardiovascular disease" checked={state.medicalHistory.cardiovascularDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cardiovascularDisease", value: v })} description="Beta-2 agonists can increase heart rate and blood pressure" />
                <Checkbox label="Diabetes mellitus" checked={state.medicalHistory.diabetes} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })} description="Salbutamol: monitor blood glucose. Prednisolone: can increase blood glucose; monitor BM and adjust diabetes medication if needed" />
                <Checkbox label="Hyperthyroidism" checked={state.medicalHistory.hyperthyroidism} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hyperthyroidism", value: v })} description="Beta-2 agonists can worsen symptoms" />
                <Checkbox label="Hypokalaemia" checked={state.medicalHistory.hypokalaemia} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypokalaemia", value: v })} description="May be worsened by beta-2 agonists; monitor potassium levels" />
                <Checkbox label="Pregnant" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="Salbutamol is safe but ensure appropriate informed consent. Prednisolone generally safe for acute use; discuss benefits/risks" />
                <Checkbox label="Breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} description="Prednisolone generally safe for acute use; discuss benefits/risks" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Prednisolone exclusions (PGD v005)</p>
              <div className="space-y-2">
                <Checkbox label="Systemic infection not treated with appropriate antimicrobials" checked={state.medicalHistory.systemicInfectionUntreated} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "systemicInfectionUntreated", value: v })} description="Exclusion for prednisolone" />
                <Checkbox label="Vaccination with live vaccines during treatment" checked={state.medicalHistory.liveVaccineDuringTreatment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "liveVaccineDuringTreatment", value: v })} description="Exclusion for prednisolone" />
                <Checkbox label="Severe hepatic dysfunction" checked={state.medicalHistory.severeHepaticDysfunction} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepaticDysfunction", value: v })} description="Exclusion for prednisolone" />
                <Checkbox label="Uncontrolled hypertension or cardiac disease" checked={state.medicalHistory.uncontrolledHypertensionOrCardiac} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "uncontrolledHypertensionOrCardiac", value: v })} description="Exclusion for prednisolone (relative: discuss risk/benefit, refer)" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Prednisolone cautions (PGD v005)</p>
              <div className="space-y-2">
                <Checkbox label="Osteoporosis or risk factors" checked={state.medicalHistory.osteoporosis} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "osteoporosis", value: v })} description="Short-term treatment risk is low but inform patient" />
                <Checkbox label="Peptic ulcer disease or GI upset" checked={state.medicalHistory.pepticUlcer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pepticUlcer", value: v })} description="Consider gastroprotection" />
                <Checkbox label="Psychiatric history" checked={state.medicalHistory.psychiatricHistory} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "psychiatricHistory", value: v })} description="Corticosteroids can cause mood changes, insomnia, or exacerbate existing conditions" />
                <Checkbox label="Renal impairment" checked={state.medicalHistory.renalImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })} description="Generally safe for short-term use" />
                <Checkbox label="Hypertension (controlled)" checked={state.medicalHistory.hypertension} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypertension", value: v })} description="May worsen; monitor blood pressure" />
                <Checkbox label="Infection" checked={state.medicalHistory.infection} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "infection", value: v })} description="Corticosteroids can mask symptoms; ensure appropriate investigation before use" />
              </div>
            </div>
          </div>
        );

      case 4: { // Observations and exclusions
        const o = state.observations;
        const severe = acuteSevereFeatures(state);
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Pulse oximetry, respiratory rate and pulse must be measured and recorded before any
                supply; where a peak flow meter is available, record PEF. If any observation is
                missing, do not supply. Any acute severe or life-threatening feature: refer for
                emergency assessment (999 where life-threatening). Do not supply.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <NumberInput label="SpO2 on air" value={o.spo2} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "spo2", value: v })} min={50} max={100} unit="% (below 92: severe)" required />
              <NumberInput label="Respiratory rate" value={o.respiratoryRate} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "respiratoryRate", value: v })} min={4} max={80} unit="/min (25 or more: severe)" required />
              <NumberInput label="Heart rate" value={o.heartRate} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "heartRate", value: v })} min={20} max={250} unit="/min (110 or more: severe)" required />
            </div>
            <Checkbox label="Peak flow meter available: PEF measured" checked={o.pefMeasured} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "pefMeasured", value: v })} description="Where a peak flow meter is available, record PEF" />
            {o.pefMeasured && (
              <NumberInput label="PEF as % of best or predicted" value={o.pefPercentBest} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "pefPercentBest", value: v })} min={0} max={150} unit="% (33 to 50: acute severe; below 33: life-threatening; over 50 required for prednisolone)" required />
            )}
            <Checkbox label="Able to complete sentences in one breath" checked={o.canCompleteSentences} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "canCompleteSentences", value: v })} description="Unable to complete sentences is acute severe asthma: do not supply" required />
            <p className="text-sm font-medium text-navy-900 pt-2">Life-threatening features</p>
            <Checkbox label="Silent chest" checked={o.silentChest} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "silentChest", value: v })} />
            <Checkbox label="Cyanosis" checked={o.cyanosis} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "cyanosis", value: v })} />
            <Checkbox label="Exhaustion" checked={o.exhaustion} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "exhaustion", value: v })} />
            <Checkbox label="Confusion" checked={o.confusion} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "confusion", value: v })} />
            <Checkbox label="Poor respiratory effort" checked={o.poorRespiratoryEffort} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "poorRespiratoryEffort", value: v })} />
            <div className={`p-3 rounded-md border text-sm ${severe.length === 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {severe.length === 0
                ? "No acute severe or life-threatening feature recorded."
                : "Acute severe or life-threatening: " + severe.join(", ") + ". Emergency referral, do not supply."}
            </div>

            <p className="text-sm font-medium text-navy-900 pt-2">Other exclusions and red flags</p>
            <Checkbox
              label="Known hypersensitivity to salbutamol or other beta-2 agonists"
              checked={state.redFlags.salbutamolAllergy}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "salbutamolAllergy", value: v })}
              description="Exclusion for the salbutamol arm"
            />
            <Checkbox
              label="Known hypersensitivity to prednisolone or other corticosteroids"
              checked={state.redFlags.prednisoloneAllergy}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "prednisoloneAllergy", value: v })}
              description="Exclusion for the prednisolone arm"
            />
            <Checkbox
              label="No documented asthma diagnosis (first presentation suggestive of asthma)"
              checked={state.redFlags.noExistingDiagnosis}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "noExistingDiagnosis",
                  value: v,
                })
              }
              description="Refer for assessment. Do not supply."
            />
            <Checkbox
              label="Never used salbutamol before"
              checked={state.redFlags.neverUsedSalbutamolBefore}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "neverUsedSalbutamolBefore",
                  value: v,
                })
              }
              description="Patient has no history of SABA use"
            />
            <Checkbox
              label="Increasing use trend"
              checked={state.redFlags.increasingUse}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "increasingUse",
                  value: v,
                })
              }
              description="Patient reports increasing need for reliever medication"
            />
            <Checkbox
              label="Nocturnal wakenings due to asthma"
              checked={state.redFlags.nocturnalWakenings}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "nocturnalWakenings",
                  value: v,
                })
              }
              description="Night-time symptoms affecting sleep"
            />
            <Checkbox
              label="Activity limitation affecting normal life"
              checked={state.redFlags.activityLimitation}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "activityLimitation",
                  value: v,
                })
              }
              description="Symptoms limit exercise, work, or daily activities"
            />
          </div>
        );
      }

      case 5: { // Medicine Supply
        const ms = state.medicineSupply;
        const tablets = prednisoloneTabletCount(ms.prednisoloneDoseMg, ms.prednisoloneDays);
        return (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <Checkbox
                label="Supply Salbutamol 100mcg MDI inhaler, 1 inhaler (200 doses)"
                checked={ms.salbutamol100mcgPMDI}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "salbutamol100mcgPMDI",
                    value: v,
                  })
                }
                description="Inhalation via MDI, with or without spacer. As needed during the acute exacerbation."
              />
              {ms.salbutamol100mcgPMDI && (
                <div className="ml-6 space-y-2">
                  <p className="text-xs text-gray-700"><strong>Dose:</strong> {SALBUTAMOL_RECOMMENDATION.dose}. {SALBUTAMOL_RECOMMENDATION.frequency}</p>
                  <TextInput
                    label="Brand supplied (salbutamol)"
                    value={ms.salbutamolBrand}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "salbutamolBrand", value: v })}
                    placeholder="e.g. Ventolin Evohaler, Salamol"
                  />
                  <Checkbox
                    label="Confirm dosing: 2 to 4 puffs inhaled immediately, may repeat after 15 to 30 minutes if inadequate response"
                    checked={ms.twoAsDoseUnit}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE_SUPPLY",
                        field: "twoAsDoseUnit",
                        value: v,
                      })
                    }
                  />
                  <Checkbox
                    label="Patient understands: if symptoms do not improve within 15 to 30 minutes of salbutamol use, seek emergency medical attention"
                    checked={ms.maxEightPuffsDailyUnderstood}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE_SUPPLY",
                        field: "maxEightPuffsDailyUnderstood",
                        value: v,
                      })
                    }
                  />
                  <Checkbox
                    label="Spacer device recommended"
                    checked={ms.spacerRecommended}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE_SUPPLY",
                        field: "spacerRecommended",
                        value: v,
                      })
                    }
                    description="Use a spacer device in less experienced patients to optimise drug delivery"
                  />
                </div>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <Checkbox
                label="Supply Prednisolone 5mg tablets"
                checked={ms.prednisolone5mg}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisolone5mg", value: v })
                }
                description="Moderate exacerbation with incomplete response to salbutamol only. Oral; may be taken with food to reduce GI upset."
              />
              {ms.prednisolone5mg && (
                <div className="ml-6 space-y-3">
                  <SelectInput
                    label="Daily dose"
                    value={ms.prednisoloneDoseMg}
                    onChange={(v) => {
                      dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneDoseMg", value: v });
                      dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneTablets", value: prednisoloneTabletCount(v, ms.prednisoloneDays) });
                    }}
                    options={[
                      { value: "40", label: "40mg daily (EIGHT tablets a day), typical" },
                      { value: "50", label: "50mg daily (TEN tablets a day)" },
                    ]}
                    required
                  />
                  <SelectInput
                    label="Course length"
                    value={ms.prednisoloneDays}
                    onChange={(v) => {
                      dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneDays", value: v });
                      dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneTablets", value: prednisoloneTabletCount(ms.prednisoloneDoseMg, v) });
                    }}
                    options={[
                      { value: "5", label: "5 days" },
                      { value: "6", label: "6 days" },
                      { value: "7", label: "7 days" },
                    ]}
                    required
                  />
                  <NumberInput
                    label="Quantity of 5mg tablets"
                    value={ms.prednisoloneTablets}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneTablets", value: v })}
                    min={1}
                    max={70}
                    unit={tablets !== null ? `(course needs ${tablets}; maximum 70. Eight to ten tablets is one day, not a course)` : "(maximum 70: 50mg daily for 7 days)"}
                    required
                  />
                  <TextInput
                    label="Brand supplied (prednisolone)"
                    value={ms.prednisoloneBrand}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneBrand", value: v })}
                    placeholder="Manufacturer or brand"
                  />
                </div>
              )}
            </div>
          </div>
        );
      }

      case 6: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Counselled: Reliever only, not preventer"
              checked={state.counselling.relieverNotPreventer}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "relieverNotPreventer",
                  value: v,
                })
              }
              description="Patient advised salbutamol is emergency relief only, not long-term control"
            />
            <Checkbox
              label="Demonstrated correct inhaler technique; inhaler technique sheet provided"
              checked={state.counselling.inhalerTechniqueDemonstration}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "inhalerTechniqueDemonstration",
                  value: v,
                })
              }
              description="If using an MDI without a spacer, coordinate inhalation with actuation"
            />
            <Checkbox
              label="Rinse mouth after use"
              checked={state.counselling.rinseMouthAfterUse}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "rinseMouthAfterUse",
                  value: v,
                })
              }
              description="Reduces risk of oral thrush and sore throat"
            />
            <Checkbox
              label="Spacer use discussed"
              checked={state.counselling.spacerUse}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "spacerUse",
                  value: v,
                })
              }
              description="Spacer recommended if available; improves deposition"
            />
            <Checkbox
              label="If symptoms do not improve within 15 to 30 minutes of salbutamol use, seek emergency medical attention"
              checked={state.counselling.emergencyIfNoImprovement}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "emergencyIfNoImprovement", value: v })}
              required
            />
            {state.medicineSupply.prednisolone5mg && (
              <>
                <Checkbox
                  label="Take the full course of prednisolone as prescribed, even if symptoms improve; do not stop prednisolone abruptly"
                  checked={state.counselling.prednisoloneFullCourse}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prednisoloneFullCourse", value: v })}
                  required
                />
                <Checkbox
                  label="Take prednisolone with food if it causes stomach upset"
                  checked={state.counselling.prednisoloneWithFood}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prednisoloneWithFood", value: v })}
                  required
                />
                <Checkbox
                  label="If diabetic, monitor blood glucose more frequently as prednisolone may raise levels; inform your GP"
                  checked={state.counselling.prednisoloneDiabetes}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prednisoloneDiabetes", value: v })}
                />
                <Checkbox
                  label="If taking other medications, inform your healthcare provider of steroid use"
                  checked={state.counselling.prednisoloneOtherMedicines}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prednisoloneOtherMedicines", value: v })}
                />
              </>
            )}
            <Checkbox
              label="Seek immediate medical attention if experiencing severe breathlessness, chest pain, confusion, or exhaustion during the exacerbation"
              checked={state.counselling.seekImmediateAttention}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seekImmediateAttention", value: v })}
              required
            />
            <Checkbox
              label="Seek urgent care if symptoms not resolving"
              checked={state.counselling.seekUrgentCareIfNotResolving}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "seekUrgentCareIfNotResolving",
                  value: v,
                })
              }
              description="Patient advised when to seek emergency care (persistent symptoms despite reliever)"
            />
            <Checkbox
              label="Review your asthma action plan and triggers with your GP after recovery; ensure maintenance therapy is optimised"
              checked={state.counselling.reviewActionPlan}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reviewActionPlan", value: v })}
            />
          </div>
        );

      case 7: // Summary
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacistName",
                    value: v,
                  })
                }
                required
                placeholder="Your name"
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacistGPhC",
                    value: v,
                  })
                }
                required
                placeholder="e.g., 123456"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacyName",
                    value: v,
                  })
                }
                placeholder="Your pharmacy"
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacyAddress",
                    value: v,
                  })
                }
                placeholder="Address"
              />
            </div>
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUMMARY",
                  field: "clinicalNotes",
                  value: v,
                })
              }
              placeholder="Additional clinical details, patient counselling notes, or follow-up advice"
              rows={4}
            />
            <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded p-3">
              <p className="text-xs text-[color:var(--tenant-primary)]">
                ✓ Consultation record will be retained for 8 years in accordance with UK pharmacy records retention requirements.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Print report ───

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ─── Main render ───


  // ─── Consultation Record Data (for saving to database) ───
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
      clinicalData: { ...(state as unknown as Record<string, unknown>), pgdVersion: PGD_STRAPLINE },
      outcome: hardStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hardStops]);

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <div className="space-y-6">
        <ProgressBar
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <StepWrapper
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          title={STEP_LABELS[state.currentStep]}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={true}
          validationError={null}
            getConsultationData={getConsultationData}
        >
          <AsthmaSummaryReport
          state={state}
          alerts={alerts}
          doseRecommendation={doseRecommendation}
        />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}

      <StepWrapper
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        title={STEP_LABELS[state.currentStep]}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
      >
        {renderStep()}
      </StepWrapper>

      <div className="flex gap-3 justify-between">
        <button
          onClick={handlePrev}
          disabled={state.currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-navy-900 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-4 py-2 text-sm font-medium text-white bg-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/15 disabled:bg-gray-300 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

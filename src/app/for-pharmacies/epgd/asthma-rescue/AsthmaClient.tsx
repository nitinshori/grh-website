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
  calculateDoseRecommendations,
  acuteSevereFeatures,
  prednisoloneTabletCount,
  prednisoloneRecommendation,
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

    case "UPDATE_EXCLUSION_OUTCOME":
      newState.exclusionOutcome = { ...newState.exclusionOutcome, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;

    case "RESET":
      return createInitialConsultationState();
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
  const doseRecommendations = useMemo(() => calculateDoseRecommendations(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  // A stop anywhere disables Next (and Save & Print) everywhere. Stops used
  // to be enforced only up to step 5 (adversarial review, 11 Sep 2026).
  const canProceed = useMemo(() => {
    if (hardStops) return false;
    return !validationError;
  }, [validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && !hardStops && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, hardStops, completedSteps]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  // Backwards only: going forward always means pressing Next, where the
  // stops and validators are enforced.
  const handleStepClick = useCallback((step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [state.currentStep]);

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
            requireAdult
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
            <SelectInput
              label="Confirmed diagnosis of asthma: how is the diagnosis documented?"
              value={state.assessment.diagnosisEvidence}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "diagnosisEvidence", value: v });
                dispatch({ type: "UPDATE_ASSESSMENT", field: "hasExistingDiagnosis", value: v !== "" && v !== "none" });
              }}
              options={[
                { value: "gp-record", label: "GP record" },
                { value: "repeat-prescription", label: "Repeat prescription for an asthma inhaler" },
                { value: "action-plan", label: "Asthma action plan" },
                { value: "none", label: "None of these (previous inhaler use only): first presentation, refer" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">The diagnosis must be DOCUMENTED. Previous inhaler use on its own is not confirmation.</p>
            <Checkbox
              label="Patient normally uses a SABA (short-acting beta-2 agonist, e.g. salbutamol) reliever"
              checked={state.assessment.normallyUsesSABA}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "normallyUsesSABA",
                  value: v,
                })
              }
              description="For information only: the PGD's inclusion is a documented diagnosis plus current preventer therapy, not SABA use"
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
            <SelectInput
              label="Current preventer (inhaled corticosteroid) therapy: is the patient on a preventer?"
              value={state.assessment.preventerAnswer}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "preventerAnswer", value: v });
                dispatch({ type: "UPDATE_ASSESSMENT", field: "onPreventer", value: v === "yes" });
              }}
              options={[
                { value: "yes", label: "Yes: on a preventer (record the details below)" },
                { value: "no", label: "No preventer (exclusion: refer to the GP for review, do not supply)" },
              ]}
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
              label="Rescue courses needed in the last 12 months (any source, including GP)"
              value={state.assessment.rescueCoursesLast12Months}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "rescueCoursesLast12Months", value: v })
              }
              min={0}
              max={20}
              unit="(more than one, that is 2 or more: refer to the GP for review, do not supply)"
              required
            />
            <NumberInput
              label="Rescue courses supplied under this PGD in the last 12 months"
              value={state.assessment.pgdRescueCoursesLast12Months}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "pgdRescueCoursesLast12Months", value: v })
              }
              min={0}
              max={20}
              unit="(no more than one rescue course in 12 months is supplied under this PGD: 1 or more means do not supply)"
              required
            />
            <SelectInput
              label="Acute exacerbation with symptoms of bronchospasm (wheezing, breathlessness, chest tightness)?"
              value={state.assessment.exacerbationAnswer}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "exacerbationAnswer", value: v });
                dispatch({ type: "UPDATE_ASSESSMENT", field: "acuteExacerbation", value: v === "yes" });
              }}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No (not covered by this PGD: refer)" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">Inclusion criterion.</p>
            <SelectInput
              label="Capable of using an inhaler device, or willing to use a spacer?"
              value={state.assessment.inhalerAbilityAnswer}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "inhalerAbilityAnswer", value: v });
                dispatch({ type: "UPDATE_ASSESSMENT", field: "canUseInhalerOrSpacer", value: v === "yes" });
              }}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No (salbutamol arm not available)" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">Inclusion criterion for the salbutamol arm.</p>
            <SelectInput
              label="Moderate exacerbation with incomplete response to salbutamol?"
              value={state.assessment.incompleteResponseAnswer}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "incompleteResponseAnswer", value: v });
                dispatch({ type: "UPDATE_ASSESSMENT", field: "incompleteResponseToSalbutamol", value: v === "yes" });
              }}
              options={[
                { value: "yes", label: "Yes: moderate exacerbation, incomplete response to salbutamol (prednisolone arm available)" },
                { value: "no", label: "No (prednisolone arm not available)" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">Entry criterion for the prednisolone arm. Any acute severe or life-threatening feature is an emergency referral, not a prednisolone supply.</p>
            <SelectInput
              label="Able to take oral medication?"
              value={state.assessment.oralAbilityAnswer}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "oralAbilityAnswer", value: v });
                dispatch({ type: "UPDATE_ASSESSMENT", field: "ableToTakeOralMedication", value: v === "yes" });
              }}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No (prednisolone arm not available)" },
              ]}
              required
            />
            <p className="text-xs text-gray-500">Inclusion criterion for the prednisolone arm.</p>
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
              label="Frequent reliever use (more than 3 days per week)"
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
              <p className="text-sm font-medium text-navy-900 mb-2">Salbutamol cautions (PGD v007)</p>
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
              <p className="text-sm font-medium text-navy-900 mb-2">Prednisolone exclusions (PGD v007)</p>
              <div className="space-y-2">
                <Checkbox label="Systemic infection not treated with appropriate antimicrobials" checked={state.medicalHistory.systemicInfectionUntreated} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "systemicInfectionUntreated", value: v })} description="Exclusion for prednisolone" />
                <Checkbox label="Vaccination with live vaccines during treatment" checked={state.medicalHistory.liveVaccineDuringTreatment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "liveVaccineDuringTreatment", value: v })} description="Exclusion for prednisolone" />
                <Checkbox label="Severe hepatic dysfunction" checked={state.medicalHistory.severeHepaticDysfunction} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepaticDysfunction", value: v })} description="Exclusion for prednisolone" />
                <Checkbox label="Uncontrolled hypertension or cardiac disease" checked={state.medicalHistory.uncontrolledHypertensionOrCardiac} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "uncontrolledHypertensionOrCardiac", value: v })} description="Exclusion for prednisolone (relative: discuss risk/benefit, refer)" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Prednisolone cautions (PGD v007)</p>
              <div className="space-y-2">
                <Checkbox label="Osteoporosis or risk factors" checked={state.medicalHistory.osteoporosis} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "osteoporosis", value: v })} description="Short-term treatment risk is low but inform patient" />
                <Checkbox label="Peptic ulcer disease or GI upset" checked={state.medicalHistory.pepticUlcer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pepticUlcer", value: v })} description="Consider gastroprotection" />
                <Checkbox label="Psychiatric history" checked={state.medicalHistory.psychiatricHistory} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "psychiatricHistory", value: v })} description="Corticosteroids can cause mood changes, insomnia, or exacerbate existing conditions" />
                <Checkbox label="Renal impairment" checked={state.medicalHistory.renalImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })} description="Generally safe for short-term use" />
                <Checkbox label="Hypertension (controlled)" checked={state.medicalHistory.hypertension} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypertension", value: v })} description="May worsen; monitor blood pressure" />
                <Checkbox label="Infection" checked={state.medicalHistory.infection} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "infection", value: v })} description="Corticosteroids can mask symptoms; ensure appropriate investigation before use" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <Checkbox
                label="The prednisolone exclusions and every caution on this step were asked and answered by the patient"
                checked={state.medicalHistory.exclusionsAskedAndAnswered}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "exclusionsAskedAndAnswered", value: v })}
                description="An unticked box means the patient answered no, not that the question was skipped"
                required
              />
            </div>
          </div>
        );

      case 4: { // Observations and exclusions
        const o = state.observations;
        const severe = acuteSevereFeatures(state);
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
              <p className="text-xs text-amber-900 font-medium">
                Pulse oximetry, respiratory rate and pulse must be measured and recorded before any
                supply; where a peak flow meter is available, record PEF. If any observation is
                missing, do not supply. Any acute severe or life-threatening feature: refer for
                emergency assessment (999 where life-threatening). Do not supply.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <NumberInput label="SpO2 on air" value={o.spo2} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "spo2", value: v === null ? null : Math.round(v) })} min={50} max={100} unit="% (below 92: severe; whole number 50 to 100)" required />
              <NumberInput label="Respiratory rate" value={o.respiratoryRate} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "respiratoryRate", value: v === null ? null : Math.round(v) })} min={4} max={60} unit="/min (25 or more: severe; whole number 4 to 60)" required />
              <NumberInput label="Heart rate" value={o.heartRate} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "heartRate", value: v === null ? null : Math.round(v) })} min={30} max={220} unit="/min (110 or more: severe; whole number 30 to 220)" required />
            </div>
            <Checkbox label="Peak flow meter available: PEF measured" checked={o.pefMeasured} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "pefMeasured", value: v })} description="Where a peak flow meter is available, record PEF" />
            {o.pefMeasured && (
              <NumberInput label="PEF as % of best or predicted" value={o.pefPercentBest} onChange={(v) => dispatch({ type: "UPDATE_OBSERVATIONS", field: "pefPercentBest", value: v === null ? null : Math.round(v) })} min={5} max={150} unit="% (33 to 50: acute severe; below 33: life-threatening; over 50 required for prednisolone)" required />
            )}
            <SelectInput
              label="Able to complete sentences in one breath?"
              value={o.sentencesAnswer}
              onChange={(v) => {
                dispatch({ type: "UPDATE_OBSERVATIONS", field: "sentencesAnswer", value: v });
                dispatch({ type: "UPDATE_OBSERVATIONS", field: "canCompleteSentences", value: v === "yes" });
              }}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No: unable to complete sentences (acute severe asthma, do not supply)" },
              ]}
              required
            />
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
              label="Allergy status confirmed with the patient (salbutamol and other beta-2 agonists; prednisolone and other corticosteroids)"
              checked={state.redFlags.allergyStatusConfirmed}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "allergyStatusConfirmed", value: v })}
              required
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
              label="Not used salbutamol before"
              checked={state.redFlags.neverUsedSalbutamolBefore}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "neverUsedSalbutamolBefore",
                  value: v,
                })
              }
              description="Caution, not an exclusion: demonstrate technique and recommend a spacer"
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
                description="Inhalation via MDI, with or without spacer. As needed during the acute exacerbation, maximum 8 puffs in 24 hours under this PGD."
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
                    label="Salbutamol limits explained: maximum 8 puffs in 24 hours under this PGD; a need for more than this, for relief more often than every 4 hours, or for the reliever on most days is a same-day GP or urgent care referral. In an acute attack up to 10 puffs through a spacer, one puff at a time, while help is sought; 10 puffs through a spacer with no relief is 999"
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
                  <Checkbox
                    label="Patient information leaflet supplied with the salbutamol inhaler"
                    checked={ms.salbutamolPilSupplied}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "salbutamolPilSupplied", value: v })}
                    required
                  />
                </div>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <Checkbox
                label="Supply Prednisolone 5mg tablets"
                checked={ms.prednisolone5mg}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisolone5mg", value: v });
                  // One regimen under the PGD: 40mg once daily for 5 days, 40 tablets of 5mg
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneDoseMg", value: v ? "40" : "" });
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneDays", value: v ? "5" : "" });
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneTablets", value: v ? prednisoloneTabletCount("40", "5") : null });
                }}
                description="Moderate exacerbation with incomplete response to salbutamol only. Oral; 40mg once daily as a single morning dose for 5 days; may be taken with food to reduce GI upset."
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
                      { value: "40", label: "40mg once daily, single morning dose (EIGHT tablets a day): the only dose under this PGD" },
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
                      { value: "5", label: "5 days: the only course length under this PGD" },
                    ]}
                    required
                  />
                  <NumberInput
                    label="Quantity of 5mg tablets"
                    value={ms.prednisoloneTablets}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneTablets", value: v })}
                    min={1}
                    max={40}
                    unit="(40 tablets: 40mg daily is eight tablets a day, for 5 days. Eight tablets is one day, not a course)"
                    required
                  />
                  <TextInput
                    label="Brand supplied (prednisolone)"
                    value={ms.prednisoloneBrand}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisoloneBrand", value: v })}
                    placeholder="Manufacturer or brand"
                  />
                  <Checkbox
                    label={`Tablet count checked against the dose before supply${tablets !== null ? ` (${ms.prednisoloneDoseMg}mg daily is ${parseInt(ms.prednisoloneDoseMg, 10) / 5} tablets a day; ${tablets} tablets for ${ms.prednisoloneDays} days)` : ""}`}
                    checked={ms.tabletCountChecked}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "tabletCountChecked", value: v })}
                    required
                  />
                  <Checkbox
                    label="Patient information leaflet supplied with the prednisolone tablets"
                    checked={ms.prednisolonePilSupplied}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "prednisolonePilSupplied", value: v })}
                    required
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
              required={state.medicineSupply.salbutamol100mcgPMDI}
            />
            <Checkbox
              label="If symptoms do not improve within 15 to 30 minutes of salbutamol use, seek emergency medical attention"
              checked={state.counselling.emergencyIfNoImprovement}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "emergencyIfNoImprovement", value: v })}
              required
            />
            <Checkbox
              label="Do not use more than 8 puffs in 24 hours. If you need it more often than every 4 hours, or on most days, see your GP the same day. In an asthma attack take up to ten puffs through a spacer, one puff at a time, while help is sought; if ten puffs give no relief, call 999"
              checked={state.counselling.salbutamolLimits}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "salbutamolLimits", value: v })}
              required={state.medicineSupply.salbutamol100mcgPMDI}
            />
            {state.medicineSupply.prednisolone5mg && (
              <>
                <Checkbox
                  label="Take the full 5 day course of prednisolone (eight 5mg tablets once each morning), even if symptoms improve; do not stop prednisolone abruptly"
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
                  required
                />
                <Checkbox
                  label="If taking other medications, inform your healthcare provider of steroid use"
                  checked={state.counselling.prednisoloneOtherMedicines}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prednisoloneOtherMedicines", value: v })}
                  required
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
              label="Review your asthma action plan and triggers with your GP after recovery"
              checked={state.counselling.reviewActionPlan}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reviewActionPlan", value: v })}
              required
            />
            <Checkbox
              label="Ensure your asthma maintenance therapy is optimised to prevent future exacerbations"
              checked={state.counselling.maintenanceOptimised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "maintenanceOptimised", value: v })}
              required
            />
            <p className="text-xs text-gray-500">
              Report suspected adverse effects via the Yellow Card scheme (https://yellowcard.mhra.gov.uk) and inform the GP as appropriate.
            </p>
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

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record whether or not a medicine was chosen, so an excluded
  // patient can be saved as not supplied or referred from any step.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const ms = state.medicineSupply;
    const supplied = !hardStops && (ms.salbutamol100mcgPMDI || ms.prednisolone5mg);
    const pred = prednisoloneRecommendation(state);
    const names: string[] = [];
    const doses: string[] = [];
    const quantities: string[] = [];
    if (supplied && ms.salbutamol100mcgPMDI) {
      names.push("Salbutamol 100mcg MDI" + (ms.salbutamolBrand ? ` (${ms.salbutamolBrand})` : ""));
      doses.push(SALBUTAMOL_RECOMMENDATION.dose);
      quantities.push("1 inhaler (200 doses)");
    }
    if (supplied && ms.prednisolone5mg && pred) {
      names.push("Prednisolone 5mg tablets" + (ms.prednisoloneBrand ? ` (${ms.prednisoloneBrand})` : ""));
      doses.push(pred.dose);
      quantities.push(`${ms.prednisoloneTablets ?? "?"} tablets`);
    }
    const referred = hardStops && state.exclusionOutcome.referredTo !== "";
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
        gpAddress: state.patient.gpAddress,
        gpPhone: state.patient.gpPhone,
        gpEmail: state.patient.gpEmail,
        gpOdsCode: state.patient.gpOdsCode,
      },
      clinicalData: { ...(state as unknown as Record<string, unknown>), pgdVersion: PGD_STRAPLINE, alerts },
      outcome: hardStops ? (referred ? "referred" : "not_supplied") : "completed",
      medicine: supplied
        ? {
            name: names.join(" + "),
            dose: doses.join("; "),
            duration: ms.prednisolone5mg && ms.prednisoloneDays ? `${ms.prednisoloneDays} days` : "As required during the exacerbation",
            quantity: quantities.join("; "),
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hardStops, alerts, __pharmProfile]);

  // Advice given and decision reached for an excluded patient (PGD v007:
  // Actions if patient is excluded or declines treatment). Shown on any step
  // where a stop is present, alongside the Save as not supplied button.
  const exclusionOutcomeBlock = hardStops ? (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        Patient excluded: do not supply. Record the advice given and the decision reached, then use Save as not supplied.
      </p>
      <SelectInput
        label="Referred to"
        value={state.exclusionOutcome.referredTo}
        onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION_OUTCOME", field: "referredTo", value: v })}
        options={[
          { value: "999", label: "Emergency: 999 or A&E" },
          { value: "urgent-care", label: "Same-day GP or urgent care" },
          { value: "gp", label: "GP (routine review)" },
          { value: "other", label: "Other (state in advice given)" },
        ]}
        required
      />
      <TextArea
        label="Advice given and decision reached"
        value={state.exclusionOutcome.adviceGiven}
        onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION_OUTCOME", field: "adviceGiven", value: v })}
        placeholder="Observations at referral, alternative treatment options advised, who the patient was referred to, whether the GP was informed"
        rows={3}
        required
      />
    </div>
  ) : null;

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
        {alerts.length > 0 && <AlertBanner alerts={alerts} />}
        {exclusionOutcomeBlock}
        <StepWrapper
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          title={STEP_LABELS[state.currentStep]}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={canProceed}
          validationError={validationError}
          isBlocked={hardStops}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          <AsthmaSummaryReport
            state={state}
            alerts={alerts}
            doseRecommendations={doseRecommendations}
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
      {exclusionOutcomeBlock}

      <StepWrapper
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        title={STEP_LABELS[state.currentStep]}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hardStops}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {renderStep()}
      </StepWrapper>
    </div>
  );
}

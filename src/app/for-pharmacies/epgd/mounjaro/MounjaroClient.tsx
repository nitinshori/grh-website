"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  MounjaroConsultationState,
  MounjaroAction,
} from "./lib/mounjaro-types";
import type { BasePatientDetails } from "../shared/types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialConsultationState,
} from "./lib/mounjaro-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/mounjaro-clinical-logic";
import { validateStep, calculateBMI } from "./lib/mounjaro-validation";
import { calculateAge } from "../shared/types";
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
import { MounjaroSummaryReport } from "./components/MounjaroSummaryReport";

// ─── Reducer ───

function reducer(state: MounjaroConsultationState, action: MounjaroAction): MounjaroConsultationState {
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

    case "UPDATE_WEIGHT_ASSESSMENT":
      newState.weightAssessment = {
        ...newState.weightAssessment,
        [action.field]: action.value,
      };
      // Auto-calculate BMI
      if (action.field === "height" || action.field === "weight") {
        newState.weightAssessment.bmi = calculateBMI(
          newState.weightAssessment.height,
          newState.weightAssessment.weight
        );
        // Determine BMI category
        const bmi = newState.weightAssessment.bmi;
        if (bmi !== null) {
          if (bmi < 18.5) newState.weightAssessment.bmiCategory = "Underweight";
          else if (bmi < 25) newState.weightAssessment.bmiCategory = "Normal weight";
          else if (bmi < 30) newState.weightAssessment.bmiCategory = "Overweight";
          else newState.weightAssessment.bmiCategory = "Obese";
        }
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICATIONS":
      newState.medications = {
        ...newState.medications,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_OBSERVATIONS":
      newState.observations = {
        ...newState.observations,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_DOSE_SELECTION":
      newState.doseSelection = {
        ...newState.doseSelection,
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

    case "NEXT_STEP":
      newState.currentStep = Math.min(newState.currentStep + 1, TOTAL_STEPS - 1);
      break;

    case "PREV_STEP":
      newState.currentStep = Math.max(newState.currentStep - 1, 0);
      break;

    case "RESET":
      return createInitialConsultationState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function MounjaroClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Compute alerts and recommendations
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  // Validation for current step
  const validationError = useMemo(
    () => validateStep(state.currentStep, state),
    [state.currentStep, state]
  );

  // Can proceed to next step?
  const canProceed =
    !validationError && (!hasStops || state.currentStep >= 5);

  // Mark step as completed
  const markStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(state.currentStep);
    setCompletedSteps(newCompleted);
  }, [completedSteps, state.currentStep]);

  const handleNext = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrev = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleStepClick = (step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Confirm patient identity and age. Patient must be 18 or older."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 1: // Consent & ID
        return (
          <StepWrapper
            title="Consent & ID Verification"
            description="Obtain informed consent and verify identity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 2: // Weight Assessment
        return (
          <StepWrapper
            title="Weight Assessment"
            description="Calculate BMI and identify weight-related comorbidities. BMI ≥30 or ≥27 with comorbidity required."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberInput
                  label="Height"
                  value={state.weightAssessment.height}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "height", value: v })
                  }
                  min={100}
                  max={220}
                  unit="cm"
                />
                <NumberInput
                  label="Weight"
                  value={state.weightAssessment.weight}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "weight", value: v })
                  }
                  min={30}
                  max={300}
                  unit="kg"
                />
              </div>

              {state.weightAssessment.bmi !== null && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                  <p className="text-sm font-semibold text-teal-900">
                    BMI: {state.weightAssessment.bmi} kg/m² ({state.weightAssessment.bmiCategory})
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-navy-900 mb-3">
                  Weight-Related Comorbidities
                </p>
                <div className="space-y-2">
                  {[
                    { id: "type2diabetes", label: "Type 2 diabetes" },
                    { id: "hypertension", label: "Hypertension" },
                    { id: "dyslipidaemia", label: "Dyslipidaemia" },
                    { id: "osa", label: "Obstructive sleep apnoea (OSA)" },
                  ].map((com) => (
                    <Checkbox
                      key={com.id}
                      label={com.label}
                      checked={state.weightAssessment.comorbidities.includes(com.id)}
                      onChange={(v) => {
                        const comorbidities = [...state.weightAssessment.comorbidities];
                        if (v) {
                          comorbidities.push(com.id);
                        } else {
                          const idx = comorbidities.indexOf(com.id);
                          if (idx > -1) comorbidities.splice(idx, 1);
                        }
                        dispatch({
                          type: "UPDATE_WEIGHT_ASSESSMENT",
                          field: "comorbidities",
                          value: comorbidities,
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions relevant to Mounjaro use."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-semibold text-red-700 mb-2">
                  Absolute Contraindications
                </p>
                <p className="text-xs text-red-600 mb-3">
                  Check the following carefully. If any are present, patient cannot proceed.
                </p>
              </div>

              <Checkbox
                label="Personal history of medullary thyroid carcinoma (MTC)"
                checked={state.medicalHistory.personalMTCHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "personalMTCHistory",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Family history of medullary thyroid carcinoma"
                checked={state.medicalHistory.familyMTCHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "familyMTCHistory",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Multiple endocrine neoplasia type 2 (MEN2)"
                checked={state.medicalHistory.men2}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "men2",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="History of pancreatitis"
                checked={state.medicalHistory.pancreatitisHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pancreatitisHistory",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Severe gastrointestinal disease (gastroparesis, inflammatory bowel disease)"
                checked={state.medicalHistory.severeGIDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeGIDisease",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Type 1 diabetes mellitus"
                checked={state.medicalHistory.type1Diabetes}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "type1Diabetes",
                    value: v,
                  })
                }
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Pregnancy & Breastfeeding
                </p>
              </div>

              <Checkbox
                label="Currently pregnant"
                checked={state.medicalHistory.pregnant}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnant",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Currently breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "breastfeeding",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Planning pregnancy within 2 months"
                checked={state.medicalHistory.planningPregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "planningPregnancy",
                    value: v,
                  })
                }
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Cautions & Special Considerations
                </p>
              </div>

              <Checkbox
                label="Gallbladder disease"
                checked={state.medicalHistory.gallbladderDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "gallbladderDisease",
                    value: v,
                  })
                }
                description="Increased cholelithiasis risk"
              />

              <Checkbox
                label="Renal impairment"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "renalImpairment",
                    value: v,
                  })
                }
                description="Risk of dehydration; monitor renal function"
              />

              <Checkbox
                label="Diabetic retinopathy"
                checked={state.medicalHistory.diabeticRetinopathy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "diabeticRetinopathy",
                    value: v,
                  })
                }
                description="May transiently worsen with rapid weight loss"
              />

              <Checkbox
                label="Depression or mental health condition"
                checked={state.medicalHistory.depression}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "depression",
                    value: v,
                  })
                }
                description="Requires enhanced psychiatric monitoring"
              />

              <Checkbox
                label="Thyroid disease"
                checked={state.medicalHistory.thyroidDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "thyroidDisease",
                    value: v,
                  })
                }
                description="Monitor thyroid function and warning signs"
              />
            </div>
          </StepWrapper>
        );

      case 4: // Current Medications
        return (
          <StepWrapper
            title="Current Medications & Interactions"
            description="Check for drug interactions and medications requiring dose adjustment."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Currently taking insulin"
                checked={state.medications.takesInsulin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesInsulin",
                    value: v,
                  })
                }
                description="Risk of hypoglycaemia; may require dose reduction (~20%)"
              />

              {state.medications.takesInsulin && (
                <TextArea
                  label="Insulin details (type and dose)"
                  value={state.medications.insulinDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "insulinDetails",
                      value: v,
                    })
                  }
                  placeholder="e.g., basal-bolus regime, NPH, etc."
                  required
                />
              )}

              <Checkbox
                label="Currently taking another GLP-1 agonist"
                checked={state.medications.currentGLP1}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "currentGLP1",
                    value: v,
                  })
                }
                description="Cannot combine with another GLP-1; must clarify current therapy"
              />

              {state.medications.currentGLP1 && (
                <TextArea
                  label="Details of current GLP-1 agonist"
                  value={state.medications.otherGLP1Details}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "otherGLP1Details",
                      value: v,
                    })
                  }
                  placeholder="e.g., Wegovy, Ozempic, Victoza"
                  required
                />
              )}

              <Checkbox
                label="Taking warfarin"
                checked={state.medications.warfarinUser}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "warfarinUser",
                    value: v,
                  })
                }
                description="Risk of interaction with Mounjaro"
              />

              <Checkbox
                label="Taking oral contraceptives"
                checked={state.medications.takesOralContraceptives}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesOralContraceptives",
                    value: v,
                  })
                }
                description="May reduce efficacy; counsel on backup contraception"
              />

              <TextArea
                label="Other medications"
                value={state.medications.otherMedications}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "otherMedications",
                    value: v,
                  })
                }
                placeholder="List other regular medications"
              />

              <TextInput
                label="Allergies"
                value={state.medications.allergies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "allergies",
                    value: v,
                  })
                }
                placeholder="e.g., NKDA (no known drug allergies)"
              />
            </div>
          </StepWrapper>
        );

      case 5: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications & Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present — cannot proceed to dose selection."
                : null
            }
            isBlocked={hasStops}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard Stop — Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified contraindications, Mounjaro cannot be supplied. The
                  patient should be referred back to their GP for further assessment and
                  alternative weight management strategies.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 6: // Dose Selection
        return (
          <StepWrapper
            title="Dose Selection & Titration"
            description="Select and plan the Mounjaro dosing schedule."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  <strong>Titration Schedule:</strong> 2.5mg → 5mg → 7.5mg → 10mg → 12.5mg → 15mg<br />
                  <strong>Escalation:</strong> Every 4 weeks if tolerated
                </p>
              </div>

              <SelectInput
                label="Current dose stage"
                value={state.doseSelection.currentDoseStage}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "currentDoseStage",
                    value: v,
                  })
                }
                options={[
                  { value: "init", label: "Initial (2.5mg)" },
                  { value: "1", label: "Stage 1 (5mg)" },
                  { value: "2", label: "Stage 2 (7.5mg)" },
                  { value: "3", label: "Stage 3 (10mg)" },
                  { value: "4", label: "Stage 4 (12.5mg)" },
                  { value: "5", label: "Stage 5/Maintenance (15mg)" },
                ]}
                required
              />

              <NumberInput
                label="Weeks at current dose"
                value={state.doseSelection.weeksAtCurrentDose}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "weeksAtCurrentDose",
                    value: v,
                  })
                }
                min={0}
                max={52}
                unit="weeks"
              />

              <TextInput
                label="Injection site"
                value={state.doseSelection.injectionSite}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "injectionSite",
                    value: v,
                  })
                }
                placeholder="e.g., abdomen, thigh, upper arm"
              />

              <Checkbox
                label="Pharmacist override"
                checked={state.doseSelection.pharmacistOverride}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "pharmacistOverride",
                    value: v,
                  })
                }
                description="Tick if deviating from standard dose recommendation"
              />

              {state.doseSelection.pharmacistOverride && (
                <TextArea
                  label="Reason for override"
                  value={state.doseSelection.overrideReason}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_DOSE_SELECTION",
                      field: "overrideReason",
                      value: v,
                    })
                  }
                  required
                  placeholder="Document clinical reasoning for deviation from standard dosing."
                />
              )}
            </div>
          </StepWrapper>
        );

      case 7: // Counselling
        return (
          <StepWrapper
            title="Counselling & Patient Education"
            description="Confirm counselling points discussed with patient."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-3">
              <Checkbox
                label="Injection technique explained"
                checked={state.counselling.injectionTechnique}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "injectionTechnique",
                    value: v,
                  })
                }
                description="How to administer the weekly subcutaneous injection"
              />

              <Checkbox
                label="Injection site rotation explained"
                checked={state.counselling.injectionSiteRotation}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "injectionSiteRotation",
                    value: v,
                  })
                }
                description="Rotate between abdomen, thigh, and upper arm"
              />

              <Checkbox
                label="Storage instructions provided (refrigeration 2-8°C)"
                checked={state.counselling.storageRefrigeration}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "storageRefrigeration",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Missed dose protocol explained"
                checked={state.counselling.missedDoseProtocol}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "missedDoseProtocol",
                    value: v,
                  })
                }
                description="If missed, take within 4 days; if longer, skip and continue weekly schedule"
              />

              <Checkbox
                label="GI side effects discussed (nausea, vomiting, diarrhoea, constipation)"
                checked={state.counselling.giSideEffects}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "giSideEffects",
                    value: v,
                  })
                }
                description="Common side effects and management strategies"
              />

              <Checkbox
                label="Pancreatitis warning signs explained"
                checked={state.counselling.pancreatitisWarning}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pancreatitisWarning",
                    value: v,
                  })
                }
                description="Severe abdominal pain radiating to back; when to seek urgent help"
              />

              <Checkbox
                label="Gallbladder disease symptoms discussed"
                checked={state.counselling.gallbladderWarning}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "gallbladderWarning",
                    value: v,
                  })
                }
                description="Upper right quadrant pain, nausea; contact GP if develops"
              />

              <Checkbox
                label="Retinopathy monitoring discussed"
                checked={state.counselling.retinopathyWarning}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "retinopathyWarning",
                    value: v,
                  })
                }
                description="If diabetic, monitor vision changes; notify eye clinic"
              />

              <Checkbox
                label="Pen device use explained"
                checked={state.counselling.penDeviceUse}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "penDeviceUse",
                    value: v,
                  })
                }
                description="How to use the pre-filled injection pen"
              />

              <Checkbox
                label="Diet and exercise advice provided"
                checked={state.counselling.dietExerciseAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "dietExerciseAdvice",
                    value: v,
                  })
                }
                description="Importance of balanced diet and regular physical activity"
              />

              <Checkbox
                label="Follow-up schedule arranged"
                checked={state.counselling.followUpSchedule}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "followUpSchedule",
                    value: v,
                  })
                }
                description="Review at 4 weeks, then every 3 months; monitor tolerance and efficacy"
              />
            </div>
          </StepWrapper>
        );

      case 8: // Summary & Print
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-navy-900">
                Summary & Consultation Record
              </h2>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4 mb-6">
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
                />
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
                />
                <TextArea
                  label="Additional clinical notes"
                  value={state.summary.clinicalNotes}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "clinicalNotes",
                      value: v,
                    })
                  }
                  placeholder="Any additional information to record..."
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Review the summary below before printing the consultation record.
                </p>
                <MounjaroSummaryReport state={updatedState} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: "PREV_STEP" })}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
              >
                &larr; Previous
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
              >
                Print Consultation Record
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={Boolean(validationError)}
      />

      {/* Alert Banner */}
      {alerts.length > 0 && state.currentStep < 5 && (
        <AlertBanner alerts={alerts} />
      )}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}

"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  WegovyConsultationState,
  WegovyAction,
  WegovyWeightAssessment,
  WegovyMedicalHistory,
  WegovyMedications,
  WegovyObservations,
  WegovyDoseSelection,
  WegovyCounselling,
  WegovyConsultationSummary,
  WegovyVisitType,
} from "./lib/wegovy-types";
import type { BasePatientDetails } from "../shared/types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialConsultationState,
} from "./lib/wegovy-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  calculateBMI,
  stageForDose,
  isContinuingVisit,
  getAllowedDoses,
  fivePercentRuleApplies,
  doseIndex,
} from "./lib/wegovy-clinical-logic";
import { validateStep } from "./lib/wegovy-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
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
import { BMICalculator } from "./components/BMICalculator";
import { DoseTitrationSelector } from "./components/DoseTitrationSelector";
import { WegovySummaryReport } from "./components/WegovySummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
// ─── Reducer ───

function reducer(state: WegovyConsultationState, action: WegovyAction): WegovyConsultationState {
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
      if (
        action.field === "height" ||
        action.field === "weight"
      ) {
        newState.weightAssessment.bmi = calculateBMI(
          newState.weightAssessment.height,
          newState.weightAssessment.weight
        );
      }
      // Visit type drives the dose step: a new patient or a restart has no
      // previous dose and titrates from 0.25 mg; a continuing patient must
      // record the dose he is on.
      if (action.field === "visitType" || action.field === "breakOverTwoMonths") {
        const vt = newState.weightAssessment.visitType;
        newState.doseSelection = {
          ...newState.doseSelection,
          // A starting BMI auto-set from today's reading must not survive a
          // switch to "continuing": the pharmacist records the real one.
          startingBMI: action.field === "visitType" ? null : newState.doseSelection.startingBMI,
          recommencingAfterBreak: vt === "restart",
          previousDose: vt === "continuing" ? (newState.doseSelection.previousDose === "none" ? "" : newState.doseSelection.previousDose) : vt ? "none" : "",
          dose: vt === "continuing" ? newState.doseSelection.dose : vt ? "0.25mg" : "",
          currentDoseStage: vt === "continuing" ? newState.doseSelection.currentDoseStage : vt ? "initiation" : "",
        };
      }
      // For a patient starting (or restarting after more than 2 months) the
      // starting BMI is today's BMI.
      if (!isContinuingVisit(newState) && newState.weightAssessment.visitType) {
        newState.doseSelection = {
          ...newState.doseSelection,
          startingBMI: newState.weightAssessment.bmi,
        };
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      if (action.field === "childbearingPotential" && action.value !== "yes") {
        newState.medicalHistory.pregnant = false;
        newState.medicalHistory.breastfeeding = false;
        newState.medicalHistory.planningPregnancy = false;
      }
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
      // The stage is a property of the dose, not a separate choice
      if (action.field === "dose") {
        newState.doseSelection.currentDoseStage = stageForDose(action.value as string);
      }
      if (action.field === "previousDose") {
        // Changing the previous dose invalidates a dose chosen against it
        newState.doseSelection.dose = "";
        newState.doseSelection.currentDoseStage = "";
        newState.doseSelection.overrideReason = "";
        newState.doseSelection.pharmacistOverride = false;
      }
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

export function WegovyToolClient() {
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

  // Can proceed to next step? A stop anywhere blocks Next and Save & Print
  // on every step (adversarial review, 11 Sep 2026).
  const canProceed = !validationError && !hasStops;

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
      clinicalData: { ...(state as unknown as Record<string, unknown>), alerts },
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && state.doseSelection.dose
          ? {
              name: "Wegovy (semaglutide)",
              medicine: `Wegovy ${state.doseSelection.dose.replace("mg", " mg")} solution for injection in pre-filled pen${state.doseSelection.batchNumber ? ` (batch ${state.doseSelection.batchNumber})` : ""}`,
              dose: `${state.doseSelection.dose.replace("mg", " mg")} subcutaneously once weekly`,
              duration: "4 weeks (one month of treatment)",
              quantity: state.doseSelection.dose === "7.2mg" ? "4 single use pens" : "1 pen (4 doses)",
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
  }, [state, hasStops, alerts]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Confirm patient identity and age. Patient must be aged 18 to 75 years (inclusive)."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
            description="Calculate BMI and assess weight-related comorbidities. BMI 30 or above, or BMI 27 or above with at least one weight-related comorbidity, is required. Adults aged 18 to 75."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="mb-6 space-y-4">
              <SelectInput
                label="Visit type"
                value={state.weightAssessment.visitType}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "visitType", value: v as WegovyVisitType })
                }
                options={[
                  { value: "new", label: "New patient: starting Wegovy (0.25 mg)" },
                  { value: "continuing", label: "Continuing patient: already on Wegovy" },
                  { value: "restart", label: "Restart after a break: titrate again from 0.25 mg" },
                ]}
                required
              />
              {state.weightAssessment.visitType === "restart" && (
                <Checkbox
                  label="More than 2 months have passed since the last dose"
                  checked={state.weightAssessment.breakOverTwoMonths}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "breakOverTwoMonths", value: v })
                  }
                  description="If so, the BMI inclusion criteria are reapplied to today's BMI. Within 2 months, eligibility rests on the starting BMI."
                />
              )}
              {isContinuingVisit(state) && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 space-y-3">
                  <p className="text-xs text-amber-900">
                    The document's inclusion is an INITIAL BMI. Today's height and weight are recorded below, but eligibility for a continuing patient is judged on the BMI at the start of treatment; losing weight is not an exclusion.
                  </p>
                  <NumberInput
                    label="BMI at the start of treatment"
                    value={state.doseSelection.startingBMI}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_DOSE_SELECTION", field: "startingBMI", value: v })
                    }
                    min={10}
                    max={100}
                    unit="kg/m²"
                    required
                  />
                </div>
              )}
            </div>
            <BMICalculator
              height={state.weightAssessment.height}
              weight={state.weightAssessment.weight}
              waistCircumference={state.weightAssessment.waistCircumference}
              comorbidities={state.weightAssessment.weightRelatedComorbidities}
              onHeightChange={(v) =>
                dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "height", value: v })
              }
              onWeightChange={(v) =>
                dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "weight", value: v })
              }
              onWaistChange={(v) =>
                dispatch({
                  type: "UPDATE_WEIGHT_ASSESSMENT",
                  field: "waistCircumference",
                  value: v,
                })
              }
              onComorbidityToggle={(c, checked) => {
                const comorbidities = [...state.weightAssessment.weightRelatedComorbidities];
                if (checked) {
                  comorbidities.push(c);
                } else {
                  const idx = comorbidities.indexOf(c);
                  if (idx > -1) comorbidities.splice(idx, 1);
                }
                dispatch({
                  type: "UPDATE_WEIGHT_ASSESSMENT",
                  field: "weightRelatedComorbidities",
                  value: comorbidities,
                });
              }}
            />

            <div className="mt-6 space-y-4">
              <Checkbox
                label="Previous weight loss attempts"
                checked={state.weightAssessment.previousWeightLossAttempts}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_WEIGHT_ASSESSMENT",
                    field: "previousWeightLossAttempts",
                    value: v,
                  })
                }
                description="Patient has tried weight loss methods (diet, exercise, medication) before"
              />

              {state.weightAssessment.previousWeightLossAttempts && (
                <TextArea
                  label="Details of previous weight loss attempts"
                  value={state.weightAssessment.previousAttemptDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_WEIGHT_ASSESSMENT",
                      field: "previousAttemptDetails",
                      value: v,
                    })
                  }
                  placeholder="e.g., diet programmes tried, medications used, outcomes"
                />
              )}

              <TextInput
                label="Target weight agreed"
                value={state.weightAssessment.targetWeightLoss}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_WEIGHT_ASSESSMENT",
                    field: "targetWeightLoss",
                    value: v,
                  })
                }
                placeholder="e.g., target weight 85 kg, or 10 kg loss"
                required
              />

              <Checkbox
                label="Prescribed medication may be causing the weight gain"
                checked={state.weightAssessment.medicationInducedWeightGain}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_WEIGHT_ASSESSMENT",
                    field: "medicationInducedWeightGain",
                    value: v,
                  })
                }
                description="Refer the patient to their GP if prescribed medication is causing weight gain"
              />

              <Checkbox
                label="Initial face-to-face assessment completed and documented"
                checked={state.weightAssessment.initialAssessmentCompleted}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_WEIGHT_ASSESSMENT",
                    field: "initialAssessmentCompleted",
                    value: v,
                  })
                }
                description="Causes of weight gain; lifestyle, diet and exercise; previous attempts; mental health, environmental and psychological factors; other disease states predisposing to weight gain; expectations and whether realistic; BMI, ideal weight, target weight and review intervals"
                required
              />

              <Checkbox
                label="Patient is willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan"
                checked={state.weightAssessment.lifestylePlanAgreed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_WEIGHT_ASSESSMENT",
                    field: "lifestylePlanAgreed",
                    value: v,
                  })
                }
                required
              />
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions relevant to Wegovy use."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
                label="Known hypersensitivity to semaglutide or to any of the excipients"
                checked={state.medicalHistory.semaglutideHypersensitivity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "semaglutideHypersensitivity",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="History of pancreatitis, acute or chronic"
                checked={state.medicalHistory.pancreatitisHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pancreatitisHistory",
                    value: v,
                  })
                }
                description="Exclusion under this PGD"
              />

              <Checkbox
                label="Severe gastrointestinal disease, including gastroparesis or severe persistent gastrointestinal disorder"
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
                label="Current cholelithiasis (gallstones) or cholecystitis"
                checked={state.medicalHistory.gallbladderDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "gallbladderDisease",
                    value: v,
                  })
                }
                description="Exclusion under this PGD"
              />

              <Checkbox
                label="Cholecystectomy within the last 3 months"
                checked={state.medicalHistory.recentCholecystectomy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "recentCholecystectomy",
                    value: v,
                  })
                }
                description="Exclusion under this PGD"
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
                description="Exclusion. Treatment may worsen retinopathy; defer or refer to a specialist."
              />

              <Checkbox
                label="Severe renal impairment (eGFR below 30 mL/min/1.73 m²) or end-stage renal disease"
                checked={state.medicalHistory.severeRenal}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeRenal",
                    value: v,
                  })
                }
                description="Exclusion under this PGD"
              />

              <Checkbox
                label="Severe hepatic impairment"
                checked={state.medicalHistory.severeHepatic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeHepatic",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Known diagnosis of heart failure with reduced ejection fraction below 40%"
                checked={state.medicalHistory.heartFailureReducedEF}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "heartFailureReducedEF",
                    value: v,
                  })
                }
                description="EXCLUSION. HFpEF (preserved EF) is NOT excluded; semaglutide has shown benefit (STEP-HFpEF). If EF is unknown but patient is under cardiology review for heart failure, refer to GP to confirm."
              />

              <Checkbox
                label="Active eating disorder (anorexia nervosa, bulimia, or binge-eating disorder under specialist care)"
                checked={state.medicalHistory.eatingDisorder}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "eatingDisorder",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Current suicidal ideation"
                checked={state.medicalHistory.suicidalIdeation}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "suicidalIdeation",
                    value: v,
                  })
                }
                description="URGENT RED FLAG: do not supply; refer urgently to mental health services"
              />

              <Checkbox
                label="Not suitable for the medication in the clinical judgement of the healthcare professional"
                checked={state.medicalHistory.clinicalJudgementUnsuitable}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "clinicalJudgementUnsuitable",
                    value: v,
                  })
                }
                description="Exclusion. Document the reason in the clinical notes."
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Cautions & Special Considerations
                </p>
              </div>

              <Checkbox
                label="History of suicidal ideation, or active severe mental illness"
                checked={state.medicalHistory.depression}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "depression",
                    value: v,
                  })
                }
                description="Caution. Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern. Do not supply where oversight is absent and concern exists."
              />

              {state.medicalHistory.depression && (
                <div className="ml-6 space-y-3">
                  <Checkbox
                    label="Appropriate psychiatric oversight is in place"
                    checked={state.medicalHistory.psychiatricOversightInPlace}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICAL_HISTORY",
                        field: "psychiatricOversightInPlace",
                        value: v,
                      })
                    }
                  />
                  <Checkbox
                    label="There is concern about the patient's current mental state"
                    checked={state.medicalHistory.mentalHealthConcern}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICAL_HISTORY",
                        field: "mentalHealthConcern",
                        value: v,
                      })
                    }
                    description="Where concern exists and oversight is absent, do not supply"
                  />
                </div>
              )}

              <Checkbox
                label="Mild to moderate renal impairment"
                checked={state.medicalHistory.mildModerateRenal}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "mildModerateRenal",
                    value: v,
                  })
                }
                description="Monitor for dehydration secondary to gastrointestinal side effects"
              />

              <Checkbox
                label="Endocrine cause of obesity suspected but not yet assessed or treated"
                checked={state.medicalHistory.endocrineObesity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "endocrineObesity",
                    value: v,
                  })
                }
                description="Caution, not an exclusion. An endocrine cause of obesity does not exclude; a patient with treated hypothyroidism or treated Cushing's syndrome may be supplied. Where an endocrine cause is suspected and has not been assessed or treated, inform the GP so that it can be investigated and record this in the clinical notes."
              />

              <Checkbox
                label="Procedure under general anaesthesia or deep sedation planned"
                checked={state.medicalHistory.plannedAnaesthesia}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "plannedAnaesthesia",
                    value: v,
                  })
                }
                description="Pulmonary aspiration has been reported; the increased risk of residual gastric content due to delayed gastric emptying should be considered before the procedure"
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

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Pregnancy & Breastfeeding
                </p>
              </div>

              <SelectInput
                label="Woman of childbearing potential?"
                value={state.medicalHistory.childbearingPotential}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "childbearingPotential",
                    value: v as "" | "yes" | "no",
                  })
                }
                options={[
                  { value: "no", label: "No (male, post-menopausal, or otherwise not of childbearing potential)" },
                  { value: "yes", label: "Yes" },
                ]}
                required
              />

              {state.medicalHistory.childbearingPotential === "yes" && (
              <>
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
                label="Planning pregnancy"
                checked={state.medicalHistory.planningPregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "planningPregnancy",
                    value: v,
                  })
                }
                description="Exclusion. Effective contraception is required; advise discontinuation at least 2 months before planned conception."
              />
              </>
              )}
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700">
                  Ask specifically about medicines taken for diabetes and name the products:
                  oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide,
                  dulaglutide, exenatide, and the sulfonylureas and meglitinides. Patients do
                  not always think of a diabetes medicine as the same kind of drug as a weight
                  loss one. Any GLP-1 receptor agonist, sulfonylurea, meglitinide or insulin
                  EXCLUDES.
                </p>
              </div>

              <Checkbox
                label="Currently taking insulin (insulin-treated diabetes)"
                checked={state.medications.takesInsulin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesInsulin",
                    value: v,
                  })
                }
                description="Exclusion. Refer: a pharmacy weight-management service cannot manage insulin dose reduction."
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
                label="Currently taking a sulfonylurea or meglitinide"
                checked={state.medications.takesSulphonylureas}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesSulphonylureas",
                    value: v,
                  })
                }
                description="Exclusion. Any sulfonylurea, meglitinide or insulin EXCLUDES; there is no GP-monitored route under this PGD."
              />

              {state.medications.takesSulphonylureas && (
                <TextArea
                  label="Sulfonylurea or meglitinide details"
                  value={state.medications.sulphonylureDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "sulphonylureDetails",
                      value: v,
                    })
                  }
                  placeholder="e.g., gliclazide, glimepiride, repaglinide"
                  required
                />
              )}

              <Checkbox
                label="Already taking another GLP-1 receptor agonist, for ANY indication"
                checked={state.medications.currentGLP1}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "currentGLP1",
                    value: v,
                  })
                }
                description="Exclusion. Oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide, dulaglutide or exenatide, including when taken for diabetes."
              />

              <Checkbox
                label="Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only"
                checked={state.medications.takesOtherDiabetesMeds}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesOtherDiabetesMeds",
                    value: v,
                  })
                }
                description="Caution. No dose adjustment is needed, but inform the GP."
              />

              <Checkbox
                label="Warfarin or another coumarin anticoagulant, or another oral medicine with a narrow therapeutic index"
                checked={state.medications.takesWarfarinOrNTI}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesWarfarinOrNTI",
                    value: v,
                  })
                }
                description="Caution. Delayed gastric emptying may reduce absorption of oral medicines; frequent INR monitoring is recommended on initiation in patients on warfarin."
              />

              <Checkbox
                label="Takes HRT"
                checked={state.medications.takesHRT}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesHRT",
                    value: v,
                  })
                }
                description="Caution. Due to the lack of data regarding absorption, non-oral products (patch, gel, or levonorgestrel intrauterine device) may be considered."
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

      case 5: // Observations
        return (
          <StepWrapper
            title="Clinical Observations"
            description="Record vital signs and anthropometric measurements."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput
                label="Systolic blood pressure"
                value={state.observations.systolicBP}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_OBSERVATIONS",
                    field: "systolicBP",
                    value: v,
                  })
                }
                min={80}
                max={250}
                unit="mmHg"
              />
              <NumberInput
                label="Diastolic blood pressure"
                value={state.observations.diastolicBP}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_OBSERVATIONS",
                    field: "diastolicBP",
                    value: v,
                  })
                }
                min={40}
                max={150}
                unit="mmHg"
              />
              <NumberInput
                label="Heart rate"
                value={state.observations.heartRate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_OBSERVATIONS",
                    field: "heartRate",
                    value: v,
                  })
                }
                min={40}
                max={150}
                unit="bpm"
              />
              <NumberInput
                label="Weight (at consultation)"
                value={state.observations.weight}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_OBSERVATIONS",
                    field: "weight",
                    value: v,
                  })
                }
                min={20}
                max={300}
                unit="kg"
              />
              <NumberInput
                label="Height (if different from assessment)"
                value={state.observations.height}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_OBSERVATIONS",
                    field: "height",
                    value: v,
                  })
                }
                min={50}
                max={250}
                unit="cm"
              />
            </div>
          </StepWrapper>
        );

      case 6: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications & Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={
              hasStops
                ? "Hard stop contraindications present, cannot proceed to dose selection."
                : null
            }
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard Stop: Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified exclusion criteria, Wegovy cannot be supplied under
                  this PGD. Discuss the reason for exclusion with the patient and ensure they
                  understand. Advise on alternative treatment options and how these can be
                  accessed (the GP, a specialist weight management service, or lifestyle
                  programmes). If the exclusion relates to an undiagnosed or unmanaged
                  comorbidity, recommend GP review. Document any advice given and the decision
                  reached, and inform or refer to the GP as appropriate.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 7: // Dose Selection
        return (
          <StepWrapper
            title="Dose Selection & Titration"
            description="Select and plan the Wegovy dosing schedule."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <DoseTitrationSelector
              currentStage={state.doseSelection.currentDoseStage}
              dose={state.doseSelection.dose}
              weeksAtCurrentDose={state.doseSelection.weeksAtCurrentDose}
              previousDose={state.doseSelection.previousDose}
              injectionSite={state.doseSelection.injectionSite}
              visitType={state.weightAssessment.visitType}
              allowedDoses={getAllowedDoses(state)}
              onStageChange={(v) =>
                dispatch({
                  type: "UPDATE_DOSE_SELECTION",
                  field: "currentDoseStage",
                  value: v,
                })
              }
              onDoseChange={(v) =>
                dispatch({
                  type: "UPDATE_DOSE_SELECTION",
                  field: "dose",
                  value: v,
                })
              }
              onWeeksChange={(v) =>
                dispatch({
                  type: "UPDATE_DOSE_SELECTION",
                  field: "weeksAtCurrentDose",
                  value: v,
                })
              }
              onPreviousDoseChange={(v) =>
                dispatch({
                  type: "UPDATE_DOSE_SELECTION",
                  field: "previousDose",
                  value: v,
                })
              }
              onInjectionSiteChange={(v) =>
                dispatch({
                  type: "UPDATE_DOSE_SELECTION",
                  field: "injectionSite",
                  value: v,
                })
              }
            />

            <div className="mt-6 space-y-4">
              {state.weightAssessment.visitType === "restart" && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  Recommencing after a break: the dose is titrated again from 0.25 mg.
                  {state.weightAssessment.breakOverTwoMonths
                    ? " More than 2 months since the last dose: the BMI inclusion criteria were reapplied on the Weight Assessment step."
                    : " Within 2 months of the last dose: eligibility rests on the starting BMI."}
                </div>
              )}

              {state.weightAssessment.visitType === "continuing" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput
                    label="Treatment start date (current course)"
                    type="date"
                    value={state.doseSelection.treatmentStartDate}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_DOSE_SELECTION",
                        field: "treatmentStartDate",
                        value: v,
                      })
                    }
                    required
                  />
                  <NumberInput
                    label="Weight at initiation"
                    value={state.doseSelection.initialWeight}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_DOSE_SELECTION",
                        field: "initialWeight",
                        value: v,
                      })
                    }
                    min={20}
                    max={300}
                    unit="kg"
                    required
                  />
                  <NumberInput
                    label="Months on the maximum tolerated dose (0 if still titrating)"
                    value={state.doseSelection.monthsOnMaxToleratedDose}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_DOSE_SELECTION",
                        field: "monthsOnMaxToleratedDose",
                        value: v,
                      })
                    }
                    min={0}
                    max={36}
                    unit="months"
                    required
                  />
                </div>
              )}

              {fivePercentRuleApplies(state) && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 space-y-2">
                  <p className="text-sm font-semibold text-red-800">
                    Less than 5% of initial body weight lost after 6 months on the maximum tolerated dose
                  </p>
                  <p className="text-xs text-red-800">
                    Under this PGD treatment is stopped where this applies. A decision on continuation is required and must be documented before any further supply.
                  </p>
                  <TextArea
                    label="Decision on continuation and reasoning"
                    value={state.doseSelection.continuationDecision}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_DOSE_SELECTION",
                        field: "continuationDecision",
                        value: v,
                      })
                    }
                    required
                    placeholder="For example: stopped and referred to GP; or continued because ... (document the clinical reasoning)"
                  />
                </div>
              )}

              {state.doseSelection.dose === "7.2mg" && !isContinuingVisit(state) && (
                <NumberInput
                  label="Starting BMI (at initiation of treatment)"
                  value={state.doseSelection.startingBMI}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_DOSE_SELECTION",
                      field: "startingBMI",
                      value: v,
                    })
                  }
                  min={10}
                  max={100}
                  unit="kg/m²"
                  required
                />
              )}

              <TextInput
                label="Batch number of the product supplied"
                value={state.doseSelection.batchNumber}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "batchNumber",
                    value: v,
                  })
                }
                placeholder="Record the name and brand of medication, and batch number"
                required
              />

              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                <p className="font-semibold text-navy-900 mb-1">Monitoring and review</p>
                <p>
                  Reassess clinical benefit, tolerability and target weight at each visit. If
                  the patient has not lost at least 5% of their initial body weight after 6
                  months on the maximum tolerated dose, a decision is required on whether to
                  continue treatment. Maximum treatment period: 2 years of continuous
                  treatment under this PGD, after which the patient is referred to the GP or a
                  specialist prescriber for a decision on continuation.
                </p>
              </div>

              {state.weightAssessment.visitType === "continuing" &&
                state.doseSelection.dose &&
                state.doseSelection.previousDose &&
                doseIndex(state.doseSelection.dose) < doseIndex(state.doseSelection.previousDose) && (
                  <TextArea
                    label="Reason for supplying a lower dose than the patient has been on"
                    value={state.doseSelection.overrideReason}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_DOSE_SELECTION",
                        field: "overrideReason",
                        value: v,
                      })
                    }
                    required
                    placeholder="The document allows lowering to the previous dose for significant GI symptoms, or reducing and re-escalating after more than 2 missed doses. Record which."
                  />
                )}
            </div>
          </StepWrapper>
        );

      case 8: // Counselling
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
            isBlocked={hasStops}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
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
                label="Storage instructions provided"
                checked={state.counselling.storageFridge}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "storageFridge",
                    value: v,
                  })
                }
                description="Store in a refrigerator (2°C to 8°C); do not freeze, discard if frozen. After first use the FlexTouch pen can be stored for up to 6 weeks below 30°C or in a refrigerator. Keep the pen cap on to protect from light. When flying, carry pens in hand luggage, not checked baggage; a travel letter may be required."
              />

              <Checkbox
                label="Missed dose protocol explained"
                checked={state.counselling.missedDose}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "missedDose",
                    value: v,
                  })
                }
                description="If a dose is missed, administer as soon as possible and within 5 days. If more than 5 days have passed, skip the missed dose and take the next dose on the regularly scheduled day. If more than 2 doses are missed, the dose is reduced and re-escalated."
              />

              <Checkbox
                label="GI side effects and fluid intake discussed (nausea, vomiting, diarrhoea, constipation)"
                checked={state.counselling.giSideEffects}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "giSideEffects",
                    value: v,
                  })
                }
                description="Gradual dose escalation and how to manage GI side effects; consider delaying titration or reducing to the previous dose if significant symptoms occur. Risk of dehydration: counsel on adequate fluid intake during GI side effects."
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
                description="Persistent, severe abdominal pain: seek immediate medical attention; treatment is discontinued and referred urgently if pancreatitis is suspected"
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
                description="Gallstones are a common adverse effect, cholecystitis uncommon: upper right quadrant pain, fever or jaundice need urgent attention"
              />

              <Checkbox
                label="Urgent warning symptoms explained"
                checked={state.counselling.urgentWarningSymptoms}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "urgentWarningSymptoms",
                    value: v,
                  })
                }
                description="Severe abdominal pain, persistent vomiting with dehydration, jaundice, sudden visual loss (including partial loss; NAION has been reported, seek urgent review), or a sustained rise in resting heart rate"
              />

              <Checkbox
                label="Mood and mental health: when to seek help explained"
                checked={state.counselling.suicidalIdeationWarning}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "suicidalIdeationWarning",
                    value: v,
                  })
                }
                description="Report any low mood or suicidal thoughts; mood is monitored at review; when to seek urgent psychiatric help"
              />

              {state.medicalHistory.childbearingPotential === "yes" && (
              <Checkbox
                label="Contraception and pregnancy advice given"
                checked={state.counselling.contraceptionAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "contraceptionAdvice",
                    value: v,
                  })
                }
                description="Women of childbearing potential should use effective contraception. Semaglutide must not be used in pregnancy or breastfeeding, and must be discontinued at least 2 months before a planned pregnancy; stop and seek advice if pregnancy occurs."
              />
              )}

              {state.medications.takesOtherDiabetesMeds && (
                <Checkbox
                  label="Hypoglycaemia signs and symptoms explained (type 2 diabetes)"
                  checked={state.counselling.hypoglycaemiaRisk}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "hypoglycaemiaRisk",
                      value: v,
                    })
                  }
                  description="Semaglutide lowers blood glucose; no dose adjustment is needed with metformin, an SGLT2 inhibitor or a DPP-4 inhibitor, but inform the GP"
                />
              )}

              <Checkbox
                label="Diet and physical activity advice provided"
                checked={state.counselling.dietExerciseAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "dietExerciseAdvice",
                    value: v,
                  })
                }
                description="Expected pattern of weight loss explained; the medicine works alongside a reduced-calorie diet and increased activity, not instead of them. The pharmacist provides the diet, activity and behavioural support in place of a specialist service."
              />

              <Checkbox
                label="Written information given"
                checked={state.counselling.writtenInformationGiven}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "writtenInformationGiven",
                    value: v,
                  })
                }
                description="Patient information leaflet supplied with the medicine, together with written lifestyle, diet and physical activity advice and the agreed target weight"
              />

              <Checkbox
                label="Follow-up and review arranged"
                checked={state.counselling.followUpSchedule}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "followUpSchedule",
                    value: v,
                  })
                }
                description="One month of treatment per appointment; advised when to return for review. Benefit, tolerability and target weight reassessed at each visit; treatment reassessed if less than 5% of body weight has been lost after 6 months on the maintenance dose; maximum 2 years under this PGD."
              />

              <Checkbox
                label="Patient told that the NHS route exists and how to access it"
                checked={state.counselling.nhsRouteExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "nhsRouteExplained",
                    value: v,
                  })
                }
                description="NICE TA875 recommends semaglutide within a specialist weight management service; this PGD authorises private supply outside that commissioning position"
              />

              <Checkbox
                label="GP informed of this initiation or review"
                checked={state.counselling.gpInformed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "gpInformed",
                    value: v,
                  })
                }
                description="The GP is informed at initiation and at each review"
              />
            </div>
          </StepWrapper>
        );

      case 9: // Summary & Print
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            description="Confirm the pharmacist details, review the record, then Save & Print."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
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
              <p className="text-sm text-gray-600 mb-4 print:hidden">
                Review the summary below before saving and printing the consultation record.
              </p>
              <WegovySummaryReport state={updatedState} />
            </div>
          </StepWrapper>
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
      {alerts.length > 0 && state.currentStep !== 9 && (
        <AlertBanner alerts={alerts} />
      )}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}

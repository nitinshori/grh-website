"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  MounjaroConsultationState,
  MounjaroAction,
} from "./lib/mounjaro-types";
import type { BasePatientDetails } from "../shared/types";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  COMORBIDITY_OPTIONS,
  DOSE_BY_STAGE,
  createInitialConsultationState,
} from "./lib/mounjaro-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  bmiGateAppliesToday,
  isContinuingSupply,
  getAllowedStages,
  fivePercentRuleApplies,
  getPercentWeightLost,
} from "./lib/mounjaro-clinical-logic";
import { validateStep, calculateBMI } from "./lib/mounjaro-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import {
  usePreviousWeightConsultation,
  describePrevious,
} from "../shared/hooks/usePreviousWeightConsultation";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";
import { MounjaroSummaryReport } from "./components/MounjaroSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
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
        if (bmiGateAppliesToday(newState)) {
          newState.weightAssessment.startingBMI = newState.weightAssessment.bmi;
        }
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
      // Keep the recorded dose in step with the selected stage (previously the
      // recorded dose stayed at 2.5 mg whatever stage was chosen).
      if (action.field === "currentDoseStage") {
        newState.doseSelection.dose = DOSE_BY_STAGE[action.value as string] ?? "";
      }
      // The dose follows the supply type and the previous dose: a new start
      // or restart is 2.5 mg; anything else is chosen against the previous
      // dose, so changing either clears a dose chosen against the old one.
      if (action.field === "supplyType" || action.field === "previousDose" || action.field === "weeksAtCurrentDose" || action.field === "breakOverTwoMonths") {
        const t = newState.doseSelection.supplyType;
        if (t === "new-start" || t === "restart") {
          newState.doseSelection.currentDoseStage = "init";
          newState.doseSelection.dose = DOSE_BY_STAGE.init;
          newState.doseSelection.previousDose = "";
        } else if (action.field !== "weeksAtCurrentDose") {
          newState.doseSelection.currentDoseStage = "";
          newState.doseSelection.dose = "";
        }
        if (action.field === "supplyType" && t !== "restart") {
          newState.doseSelection.breakOverTwoMonths = false;
        }
        // Starting BMI is today's BMI when the inclusion is applied today
        if (bmiGateAppliesToday(newState)) {
          newState.weightAssessment = { ...newState.weightAssessment, startingBMI: newState.weightAssessment.bmi };
        } else if (action.field === "supplyType") {
          newState.weightAssessment = { ...newState.weightAssessment, startingBMI: null };
        }
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

export default function MounjaroClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const { previous, lookup: lookupPrevious } = usePreviousWeightConsultation();
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

  // Can proceed to next step?
  // A stop anywhere blocks Next and Save & Print on every step
  // (adversarial review, 11 Sep 2026).
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
      clinicalData: { ...(state as unknown as Record<string, unknown>), alerts, percentWeightLost: getPercentWeightLost(state) },
      outcome: hasStops ? "not_supplied" : "completed",
      medicine:
        !hasStops && state.doseSelection.dose
          ? {
              name: "Mounjaro (tirzepatide) KwikPen",
              medicine: `Mounjaro (tirzepatide) KwikPen ${state.doseSelection.dose}${state.doseSelection.batchNumber ? `, batch ${state.doseSelection.batchNumber}` : ""}`,
              dose: `${state.doseSelection.dose} once weekly by subcutaneous injection`,
              duration: "4 weeks",
              quantity: "1 KwikPen (4 x 0.6 mL doses)",
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
            description="Confirm patient identity and age. This PGD covers adults aged 18 to 75 years inclusive; over 75, refer to a specialist."
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
              <PatientDetailsStep
                patient={state.patient}
                onChange={(field, value) =>
                  dispatch({ type: "UPDATE_PATIENT", field, value })
                }
                onReturningPatient={(p) =>
                  lookupPrevious(p, (prev) => {
                    // Height does not change between visits, so carry it
                    // forward. Weight is always measured on the day.
                    if (prev.heightCm !== null) {
                      dispatch({
                        type: "UPDATE_WEIGHT_ASSESSMENT",
                        field: "height",
                        value: prev.heightCm,
                      });
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
                    {describePrevious(previous)}. Height has been filled in for
                    you.
                  </p>
                </div>
              )}
            </div>
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
            description="Calculate BMI and identify weight-related comorbidities. BMI 30 or above, or 27 or above with at least one weight-related comorbidity, is required. Complete the face to face initial assessment and agree a target weight."
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
              <SelectInput
                label="Nature of today's supply"
                value={state.doseSelection.supplyType}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_DOSE_SELECTION", field: "supplyType", value: v })
                }
                options={[
                  { value: "new-start", label: "New start (2.5 mg titration dose)" },
                  { value: "continue", label: "Continuing the same dose" },
                  { value: "escalate", label: "Escalating to the next dose (minimum 4 weeks on current dose)" },
                  { value: "reduce", label: "Reducing to a lower dose (significant GI symptoms, or more than 2 doses missed)" },
                  { value: "restart", label: "Restarting after a break (re-titrate from 2.5 mg)" },
                ]}
                required
              />
              {state.doseSelection.supplyType === "restart" && (
                <Checkbox
                  label="More than 2 months have passed since discontinuing treatment"
                  checked={state.doseSelection.breakOverTwoMonths}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_DOSE_SELECTION", field: "breakOverTwoMonths", value: v })
                  }
                  description="If so, the BMI inclusion criteria are reapplied to today's BMI. Within 2 months, eligibility rests on the starting BMI."
                />
              )}
              {!bmiGateAppliesToday(state) && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 space-y-3">
                  <p className="text-xs text-amber-900">
                    The document's inclusion is an INITIAL BMI. Today's height and weight are recorded below, but eligibility for a continuing patient is judged on the BMI at the start of treatment; losing weight is not an exclusion.
                  </p>
                  <NumberInput
                    label="BMI at the start of treatment"
                    value={state.weightAssessment.startingBMI}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "startingBMI", value: v })
                    }
                    min={10}
                    max={100}
                    unit="kg/m²"
                    required
                  />
                </div>
              )}
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
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded">
                  <p className="text-sm font-semibold text-[color:var(--tenant-primary)]">
                    BMI today: {state.weightAssessment.bmi.toFixed(1)} kg/m² ({state.weightAssessment.bmiCategory})
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-navy-900 mb-3">
                  Weight-Related Comorbidities
                </p>
                <div className="space-y-2">
                  {COMORBIDITY_OPTIONS.map((com) => (
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

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-navy-900 mb-3">
                  Initial Assessment and Lifestyle Plan
                </p>
                <div className="space-y-3">
                  <NumberInput
                    label="Target weight agreed"
                    value={state.weightAssessment.targetWeight}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "targetWeight", value: v })
                    }
                    min={30}
                    max={300}
                    unit="kg"
                    required
                  />
                  <Checkbox
                    label="Face to face initial assessment completed and documented"
                    checked={state.weightAssessment.initialAssessmentCompleted}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_WEIGHT_ASSESSMENT",
                        field: "initialAssessmentCompleted",
                        value: v,
                      })
                    }
                    description="Causes of weight gain (refer to GP if prescribed medication is the cause); lifestyle, diet and exercise; previous attempts and what worked; mental health, environmental and psychological factors (consider signposting); other disease states predisposing to weight gain (consider GP referral); expectations of weight loss and whether realistic; BMI, ideal weight, target weight and review intervals agreed."
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
              </div>
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify exclusion criteria and cautions relevant to Mounjaro use (PGD v009)."
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
                  Exclusion Criteria
                </p>
                <p className="text-xs text-red-600 mb-3">
                  Check the following carefully. If any are present the patient cannot be supplied under this PGD.
                </p>
              </div>

              <Checkbox
                label="Known hypersensitivity to tirzepatide or to any of the excipients"
                checked={state.medicalHistory.hypersensitivity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "hypersensitivity",
                    value: v,
                  })
                }
                description="Each 0.6 mL dose contains 5.4 mg benzyl alcohol (E1519), which may cause allergic reactions."
              />

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
                label="Personal or family history of Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)"
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
                label="History of pancreatitis, acute or chronic"
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
                description="Exclusion under this PGD."
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
                description="Exclusion under this PGD."
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
                label="Severe renal impairment (eGFR below 30 mL/min/1.73 m2) or end-stage renal disease"
                checked={state.medicalHistory.severeRenalImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeRenalImpairment",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Severe hepatic impairment"
                checked={state.medicalHistory.severeHepaticImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeHepaticImpairment",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Known diagnosis of heart failure with reduced ejection fraction (HFrEF, LVEF below 40%)"
                checked={state.medicalHistory.heartFailureReducedEF}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "heartFailureReducedEF",
                    value: v,
                  })
                }
                description="Exclusion. HFpEF (preserved EF) is NOT excluded. If EF is unknown but patient is under cardiology review for heart failure, refer to GP to confirm."
              />

              <Checkbox
                label="Active eating disorder (anorexia nervosa, bulimia, or binge-eating disorder under specialist care)"
                checked={state.medicalHistory.activeEatingDisorder}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "activeEatingDisorder",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="In the clinical judgement of the healthcare professional, the patient is not suitable for the medication"
                checked={state.medicalHistory.notSuitableClinicalJudgement}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "notSuitableClinicalJudgement",
                    value: v,
                  })
                }
                description="Document the reason and the advice given in the clinical notes."
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Pregnancy, Breastfeeding and Contraception (exclusions)
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
                label="Planning pregnancy"
                checked={state.medicalHistory.planningPregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "planningPregnancy",
                    value: v,
                  })
                }
                description="Exclusion. Advise discontinuation at least 1 month before planned conception for tirzepatide."
              />

              <Checkbox
                label="Woman of childbearing potential who is not using effective contraception"
                checked={state.medicalHistory.noEffectiveContraception}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "noEffectiveContraception",
                    value: v,
                  })
                }
                description="Effective contraception is required. Non-oral contraception or a barrier method is advised during titration and for 4 weeks after each dose increase."
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Cautions & Special Considerations
                </p>
              </div>

              <Checkbox
                label="Mild to moderate renal impairment"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "renalImpairment",
                    value: v,
                  })
                }
                description="Caution. Monitor for dehydration secondary to gastrointestinal side effects. Severe renal impairment (eGFR below 30) or end-stage renal disease excludes (see above)."
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
                label="History of suicidal ideation, or active severe mental illness"
                checked={state.medicalHistory.depression}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "depression",
                    value: v,
                  })
                }
                description="Caution. Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern."
              />

              {state.medicalHistory.depression && (
                <Checkbox
                  label="Psychiatric oversight is absent and there is concern"
                  checked={state.medicalHistory.mentalHealthOversightAbsent}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICAL_HISTORY",
                      field: "mentalHealthOversightAbsent",
                      value: v,
                    })
                  }
                  description="Do not supply where oversight is absent and concern exists."
                />
              )}

              <Checkbox
                label="Pre-existing increased heart rate"
                checked={state.medicalHistory.preExistingTachycardia}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "preExistingTachycardia",
                    value: v,
                  })
                }
                description="Caution. Cases of tachycardia have been reported; use with caution and seek specialist advice before use."
              />

              <Checkbox
                label="Thyroid disease (other than MTC or MEN 2)"
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
            description="Ask specifically about medicines taken for diabetes and name the products. Patients do not always think of a diabetes medicine as the same kind of drug as a weight loss one."
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
              <Checkbox
                label="Insulin-treated diabetes (currently taking insulin)"
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
                label="Currently taking another GLP-1 agonist or insulin secretagogue, for ANY indication (ask about diabetes medicines by name)"
                checked={state.medications.currentGLP1}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "currentGLP1",
                    value: v,
                  })
                }
                description="Exclusion for any indication, including one taken for diabetes: oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide, dulaglutide, exenatide, and the sulfonylureas and meglitinides"
              />

              {state.medications.currentGLP1 && (
                <TextArea
                  label="Details of current GLP-1 agonist or insulin secretagogue"
                  value={state.medications.otherGLP1Details}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "otherGLP1Details",
                      value: v,
                    })
                  }
                  placeholder="e.g., Wegovy, Ozempic, Rybelsus, Victoza, gliclazide"
                  required
                />
              )}

              <Checkbox
                label="Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only"
                checked={state.medications.t2dmOralAgents}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "t2dmOralAgents",
                    value: v,
                  })
                }
                description="Caution. No dose adjustment is needed, but inform the GP. Any sulfonylurea, meglitinide or insulin excludes."
              />

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
                description="Caution. Delayed gastric emptying may affect absorption of narrow therapeutic index medicines; frequent INR monitoring is recommended on initiation."
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
                description="Caution. Non-oral contraception or a barrier method is advised during titration and for 4 weeks after each dose increase."
              />

              <Checkbox
                label="Taking oral HRT"
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

      case 5: // Contraindications Review
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
                ? "Exclusion criteria present: cannot proceed to dose selection."
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
                  Excluded: Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Mounjaro cannot be supplied under this PGD. Discuss the reason for exclusion
                  with the patient and ensure they understand. Advise on alternative treatment
                  options and how these can be accessed (the GP, a specialist weight management
                  service, or lifestyle programmes). If the exclusion relates to an undiagnosed
                  or unmanaged comorbidity, recommend GP review. Document any advice given and
                  the decision reached; inform or refer to the GP as appropriate.
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
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  <strong>Medicine:</strong> Mounjaro (tirzepatide) solution for injection in a multi-dose pre-filled pen (KwikPen), 2.5 mg, 5 mg, 7.5 mg, 10 mg, 12.5 mg or 15 mg per 0.6 mL dose; each pen contains 4 doses (2.4 mL). POM.<br />
                  <strong>Titration:</strong> 2.5 mg once weekly for 4 weeks (titration dose, not for sustained weight management), then 5 mg once weekly. Further increases of 2.5 mg after a minimum of 4 weeks on the current dose if additional weight management is required and the current dose is tolerated. Maintenance doses 5 mg, 10 mg or 15 mg. Maximum 15 mg once weekly.<br />
                  <strong>Supply:</strong> ONE KwikPen (4 weeks of treatment) per patient appointment. No additional supply to stock up; a holiday appointment may be brought forward by a few days.<br />
                  <strong>Route:</strong> Subcutaneous injection in the abdomen, thigh or upper arm, once weekly on the same day each week. Not intravenous or intramuscular.
                </p>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                Nature of today's supply (set on the Weight Assessment step):{" "}
                <span className="font-medium text-navy-900">
                  {({
                    "new-start": "New start (2.5 mg titration dose)",
                    continue: "Continuing the same dose",
                    escalate: "Escalating to the next dose",
                    reduce: "Reducing to a lower dose",
                    restart: `Restarting after a break (${state.doseSelection.breakOverTwoMonths ? "more than" : "within"} 2 months)`,
                  } as Record<string, string>)[state.doseSelection.supplyType] ?? "Not selected"}
                </span>
              </div>

              {isContinuingSupply(state) && (
                <>
                  <SelectInput
                    label="Dose the patient has been on"
                    value={state.doseSelection.previousDose}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_DOSE_SELECTION", field: "previousDose", value: v })
                    }
                    options={[
                      { value: "init", label: "2.5 mg once weekly" },
                      { value: "1", label: "5 mg once weekly" },
                      { value: "2", label: "7.5 mg once weekly" },
                      { value: "3", label: "10 mg once weekly" },
                      { value: "4", label: "12.5 mg once weekly" },
                      { value: "5", label: "15 mg once weekly" },
                    ]}
                    required
                  />
                  <NumberInput
                    label="Weeks on that dose"
                    value={state.doseSelection.weeksAtCurrentDose}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_DOSE_SELECTION", field: "weeksAtCurrentDose", value: v })
                    }
                    min={0}
                    max={104}
                    unit="weeks"
                    required
                  />
                  {state.doseSelection.supplyType === "escalate" &&
                    state.doseSelection.weeksAtCurrentDose !== null &&
                    state.doseSelection.weeksAtCurrentDose < 4 && (
                      <p className="text-xs text-amber-800 -mt-2">
                        Fewer than 4 weeks on the current dose: escalation is not yet permitted.
                      </p>
                    )}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <NumberInput
                      label="Weight at initiation"
                      value={state.doseSelection.initialWeight}
                      onChange={(v) =>
                        dispatch({ type: "UPDATE_DOSE_SELECTION", field: "initialWeight", value: v })
                      }
                      min={30}
                      max={300}
                      unit="kg"
                      required
                    />
                    <TextInput
                      label="Treatment start date"
                      type="date"
                      value={state.doseSelection.treatmentStartDate}
                      onChange={(v) =>
                        dispatch({ type: "UPDATE_DOSE_SELECTION", field: "treatmentStartDate", value: v })
                      }
                      required
                    />
                    <NumberInput
                      label="Months on the maximum tolerated dose (0 if still titrating)"
                      value={state.doseSelection.monthsOnMaxToleratedDose}
                      onChange={(v) =>
                        dispatch({ type: "UPDATE_DOSE_SELECTION", field: "monthsOnMaxToleratedDose", value: v })
                      }
                      min={0}
                      max={36}
                      unit="months"
                      required
                    />
                  </div>
                  {getPercentWeightLost(state) !== null && (
                    <p className="text-xs font-semibold text-gray-700">
                      Change from initial weight: {getPercentWeightLost(state)! >= 0 ? "" : "+"}{Math.abs(getPercentWeightLost(state)!).toFixed(1)}% {getPercentWeightLost(state)! >= 0 ? "lost" : "gained"}
                    </p>
                  )}
                  {fivePercentRuleApplies(state) && (
                    <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 space-y-2">
                      <p className="text-sm font-semibold text-red-800">
                        Less than 5% of initial body weight lost after 6 months on the maximum tolerated dose
                      </p>
                      <p className="text-xs text-red-800">
                        PGD v009: a decision is required on whether to continue treatment, taking into account the benefit-risk profile in this patient. Record it before any further supply.
                      </p>
                      <TextArea
                        label="Decision on continuation and reasoning"
                        value={state.doseSelection.continuationDecision}
                        onChange={(v) =>
                          dispatch({ type: "UPDATE_DOSE_SELECTION", field: "continuationDecision", value: v })
                        }
                        required
                        placeholder="For example: stopped and referred to GP; or continued because ... (document the clinical reasoning)"
                      />
                    </div>
                  )}
                </>
              )}

              <SelectInput
                label="Dose to supply (KwikPen strength)"
                value={state.doseSelection.currentDoseStage}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "currentDoseStage",
                    value: v,
                  })
                }
                options={[
                  { value: "init", label: "2.5 mg once weekly (starting dose, 4 weeks)" },
                  { value: "1", label: "5 mg once weekly (maintenance dose)" },
                  { value: "2", label: "7.5 mg once weekly (titration step)" },
                  { value: "3", label: "10 mg once weekly (maintenance dose)" },
                  { value: "4", label: "12.5 mg once weekly (titration step)" },
                  { value: "5", label: "15 mg once weekly (maintenance dose, maximum)" },
                ].filter((o) => getAllowedStages(state).includes(o.value))}
                required
              />
              {getAllowedStages(state).length === 0 && (
                <p className="text-xs text-amber-800 -mt-2">
                  No dose is available yet: complete the supply type and the previous dose (and 4 weeks on it for an escalation).
                </p>
              )}

              <Checkbox
                label="More than 2 doses missed since the last supply"
                checked={state.doseSelection.missedMoreThanTwoDoses}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "missedMoreThanTwoDoses",
                    value: v,
                  })
                }
                description="Reduce and re-escalate the dose to avoid unwanted side effects when treatment is re-initiated."
              />

              <TextInput
                label="Injection site advised"
                value={state.doseSelection.injectionSite}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DOSE_SELECTION",
                    field: "injectionSite",
                    value: v,
                  })
                }
                placeholder="e.g., abdomen, thigh, upper arm (rotate sites)"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput
                  label="Batch number"
                  value={state.doseSelection.batchNumber}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_DOSE_SELECTION",
                      field: "batchNumber",
                      value: v,
                    })
                  }
                  placeholder="Batch number of the pen supplied"
                  required
                />
                <TextInput
                  label="Expiry date"
                  value={state.doseSelection.expiryDate}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_DOSE_SELECTION",
                      field: "expiryDate",
                      value: v,
                    })
                  }
                  type="date"
                />
              </div>

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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
                description="Rotate injection sites with each dose (abdomen, thigh or upper arm) to reduce local irritation"
              />

              <Checkbox
                label="Storage instructions provided"
                checked={state.counselling.storageRefrigeration}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "storageRefrigeration",
                    value: v,
                  })
                }
                description="Store in a refrigerator (2°C to 8°C). Do not freeze; a pen that has been frozen must not be used. After first use the KwikPen may be stored unrefrigerated at not above 30°C for up to 30 days and must then be discarded (SmPC section 6.4). Before first use keep it in the refrigerator and do not use it after the expiry date on the label. Inspect the solution before each use and do not use it if it contains particles or is discoloured; discard any solution left after the fourth dose. Travel: carry pens in hand luggage when flying, not in checked baggage; a travel letter may be required."
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
                description="If a dose is missed, administer as soon as possible within 4 days (96 hours). If more than 4 days have passed, skip the missed dose and resume the usual schedule. Do not administer two doses within 3 days. The dosing day can be changed if at least 3 days separate doses. If more than 2 doses are missed, the dose is reduced and re-escalated."
              />

              <Checkbox
                label="GI side effects, their management and adequate fluid intake discussed"
                checked={state.counselling.giSideEffects}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "giSideEffects",
                    value: v,
                  })
                }
                description="Very common: nausea, diarrhoea, vomiting, constipation, decreased appetite. Mostly during dose escalation. Dose escalation may be delayed or the dose reduced if significant symptoms occur. Counsel on adequate fluid intake to avoid dehydration and acute kidney injury."
                required
              />

              <Checkbox
                label="Warning symptoms needing urgent attention explained"
                checked={state.counselling.warningSymptoms}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "warningSymptoms",
                    value: v,
                  })
                }
                description="Severe abdominal pain, persistent vomiting with dehydration, jaundice, sudden visual loss, or a sustained rise in resting heart rate."
                required
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
                description="Persistent, severe abdominal pain (may radiate to the back): seek immediate medical attention. Discontinue and refer urgently if suspected; do not restart if confirmed."
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
                description="Upper right quadrant pain, fever, jaundice; contact GP if develops"
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
                description="If diabetic, report any vision changes; sudden visual loss needs urgent attention"
              />

              <Checkbox
                label="Reduced absorption of oral medicines, oral contraceptives and HRT discussed"
                checked={state.counselling.oralMedicationAbsorption}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "oralMedicationAbsorption",
                    value: v,
                  })
                }
                description="Delayed gastric emptying may reduce absorption of oral medicines, especially narrow therapeutic index drugs and oral contraceptives. Non-oral contraception or a barrier method during titration and for 4 weeks after each dose increase; non-oral HRT may be considered."
              />

              <Checkbox
                label="General anaesthesia or deep sedation advice given"
                checked={state.counselling.anaesthesiaWarning}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "anaesthesiaWarning",
                    value: v,
                  })
                }
                description="Pulmonary aspiration has been reported. Tell the anaesthetist or surgical team about tirzepatide before any procedure under general anaesthesia or deep sedation."
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
                description="How to use the KwikPen; read the instructions for use and package leaflet before administering"
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
                description="Explain the expected pattern of weight loss and that the medicine works alongside diet and activity, not instead of them."
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
                description="Review at each 4-weekly supply: reassess clinical benefit, tolerability and target weight. Treatment will be reassessed if less than 5% of body weight has been lost after 6 months on the maintenance dose. When the target weight is reached, discuss whether to continue to maintain it."
                required
              />

              <Checkbox
                label="Written information given: PIL, written lifestyle, diet and physical activity advice, and the agreed target weight"
                checked={state.counselling.writtenInfoProvided}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "writtenInfoProvided",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="GP informed"
                checked={state.counselling.gpInformed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "gpInformed",
                    value: v,
                  })
                }
                description="Required where the patient has type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor. Otherwise inform the GP as appropriate."
                required={state.medications.t2dmOralAgents}
              />
            </div>
          </StepWrapper>
        );

      case 8: // Summary & Print
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            description="Review and print the consultation record"
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
              <p className="text-sm text-gray-600 mb-4">
                Review the summary below before printing the consultation record.
              </p>
              <MounjaroSummaryReport state={updatedState} />
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
      {/* Every step except the Contraindications review (which renders its
          own banner) and the Summary (which prints the alerts) */}
      {alerts.length > 0 && state.currentStep !== 5 && state.currentStep !== TOTAL_STEPS - 1 && (
        <AlertBanner alerts={alerts} />
      )}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}

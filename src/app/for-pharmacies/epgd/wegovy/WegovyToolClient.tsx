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

  // Can proceed to next step?
  const canProceed =
    !validationError && (!hasStops || state.currentStep >= 6);

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
            description="Calculate BMI and assess weight-related comorbidities. BMI ≥30 or BMI ≥27 with comorbidities required."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
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
                label="Target weight loss"
                value={state.weightAssessment.targetWeightLoss}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_WEIGHT_ASSESSMENT",
                    field: "targetWeightLoss",
                    value: v,
                  })
                }
                placeholder="e.g., 10kg, 15% body weight reduction"
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
                label="Active eating disorder"
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
                label="Current suicidal ideation"
                checked={state.medicalHistory.suicidalIdeation}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "suicidalIdeation",
                    value: v,
                  })
                }
                description="URGENT RED FLAG: Do not proceed without psychiatric input"
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Cautions & Special Considerations
                </p>
              </div>

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
                description="Monitor closely; advise on warning signs"
              />

              <Checkbox
                label="Heart failure with reduced ejection fraction (HFrEF, LVEF ≤40%)"
                checked={state.medicalHistory.heartFailureReducedEF}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "heartFailureReducedEF",
                    value: v,
                  })
                }
                description="EXCLUSION. HFpEF (preserved EF >40%) is NOT excluded — semaglutide has shown benefit (STEP-HFpEF). If EF is unknown but patient is under cardiology review for heart failure, refer to GP to confirm."
              />

              <Checkbox
                label="Gallbladder disease (cholelithiasis / cholecystitis)"
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
                label="Cholecystectomy within the last 3 months"
                checked={state.medicalHistory.recentCholecystectomy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "recentCholecystectomy",
                    value: v,
                  })
                }
                description="Caution. Counsel on biliary warning signs; consider deferring initiation."
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
                label="Depression / mental health condition"
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

              <Checkbox
                label="Severe renal impairment"
                checked={state.medicalHistory.severeRenal}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeRenal",
                    value: v,
                  })
                }
                description="Risk of dehydration; monitor renal function"
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
                label="Currently taking sulphonylureas"
                checked={state.medications.takesSulphonylureas}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesSulphonylureas",
                    value: v,
                  })
                }
                description="Risk of hypoglycaemia; dose reduction or switch recommended"
              />

              {state.medications.takesSulphonylureas && (
                <TextArea
                  label="Sulphonylurea details"
                  value={state.medications.sulphonylureDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "sulphonylureDetails",
                      value: v,
                    })
                  }
                  placeholder="e.g., gliclazide, glipizide"
                  required
                />
              )}

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
                description="May reduce efficacy due to GI motility changes; backup contraception advised"
              />

              <Checkbox
                label="Already taking another GLP-1 agonist"
                checked={state.medications.currentGLP1}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "currentGLP1",
                    value: v,
                  })
                }
                description="Cannot combine with another GLP-1; clarify current therapy"
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
                  Based on the identified contraindications, Wegovy cannot be supplied. The
                  patient should be referred back to their GP for further assessment and
                  alternative weight management strategies.
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
          >
            <DoseTitrationSelector
              currentStage={state.doseSelection.currentDoseStage}
              dose={state.doseSelection.dose}
              weeksAtCurrentDose={state.doseSelection.weeksAtCurrentDose}
              previousDose={state.doseSelection.previousDose}
              injectionSite={state.doseSelection.injectionSite}
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
                label="Storage instructions provided (fridge 2-8°C)"
                checked={state.counselling.storageFridge}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "storageFridge",
                    value: v,
                  })
                }
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
                description="When to take if dose is missed (within 5 days); restart weekly cycle if more delayed"
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
                label="Suicidal ideation warning signs explained"
                checked={state.counselling.suicidalIdeationWarning}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "suicidalIdeationWarning",
                    value: v,
                  })
                }
                description="When to seek urgent psychiatric help; contact details provided"
              />

              <Checkbox
                label="OCP efficacy reduction and backup contraception advised"
                checked={state.counselling.contraceptionAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "contraceptionAdvice",
                    value: v,
                  })
                }
                description="If taking oral contraceptives, use backup contraception"
              />

              {(state.medications.takesInsulin ||
                state.medications.takesSulphonylureas) && (
                <Checkbox
                  label="Hypoglycaemia risk explained (if on insulin/sulphonylurea)"
                  checked={state.counselling.hypoglycaemiaRisk}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "hypoglycaemiaRisk",
                      value: v,
                    })
                  }
                  description="Symptoms, management, and need for dose adjustment"
                />
              )}

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
                description="Review at 4 weeks, then every 3 months; monitor weight, tolerability, and safety"
              />
            </div>
          </StepWrapper>
        );

      case 9: // Summary & Print
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
                <WegovySummaryReport state={updatedState} />
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
      {alerts.length > 0 && state.currentStep < 6 && (
        <AlertBanner alerts={alerts} />
      )}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}

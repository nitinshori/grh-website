"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  HPVConsultationState,
  HPVAction,
} from "./lib/hpv-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hpv-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/hpv-clinical-logic";
import { validateStep } from "./lib/hpv-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HPVSummaryReport } from "./components/HPVSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: HPVConsultationState, action: HPVAction): HPVConsultationState {
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

export default function HPVClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 4 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

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

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field, value })
            }
            genderOption={{
              label: "Patient is female",
              description: "Gardasil 9 is approved for females aged 9 years and above.",
              checked: state.patient.femaleConfirmed,
              onToggle: (v) =>
                dispatch({
                  type: "UPDATE_PATIENT",
                  field: "femaleConfirmed",
                  value: v,
                }),
            }}
          />
        );

      case 1:
        return (
          <div className="space-y-4">
            <SelectInput
              label="Pregnancy status"
              value={state.assessment.pregnancyStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "pregnancyStatus",
                  value: v,
                })
              }
              options={[
                { value: "not-pregnant", label: "Not pregnant (or unsure)" },
                { value: "confirmed", label: "Confirmed pregnant" },
                { value: "planning", label: "Planning pregnancy" },
              ]}
              required
            />
            <Checkbox
              label="Current severe febrile illness"
              checked={state.assessment.currentFebrileIllness}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "currentFebrileIllness",
                  value: v,
                })
              }
              description="Fever &gt;38.5°C or signs of systemic infection"
            />
            <Checkbox
              label="Previous Gardasil dose received"
              checked={state.assessment.previousGardasilDose}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousGardasilDose",
                  value: v,
                })
              }
              description="Has patient completed part of the HPV vaccination series?"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Check exclusion criteria:
            </p>
            <Checkbox
              label="Anaphylaxis to yeast: NOT documented"
              checked={!state.assessment.anaphylaxisToYeast}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "anaphylaxisToYeast",
                  value: !v,
                })
              }
              description="Gardasil 9 is contraindicated in patients with anaphylaxis to yeast."
            />
            <Checkbox
              label="Anaphylaxis to previous HPV dose: NOT documented"
              checked={!state.assessment.anaphylaxisToPreviousDose}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "anaphylaxisToPreviousDose",
                  value: !v,
                })
              }
              description="Contraindicated if previous anaphylactic reaction documented."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Counselling delivered:
            </p>
            <Checkbox
              label="Explained 3-dose schedule"
              checked={state.counselling.explainedDoseSchedule}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedDoseSchedule",
                  value: v,
                })
              }
              description="Doses at 0, 2, and 6 months from first dose"
            />
            <Checkbox
              label="Explained protection against HPV types"
              checked={state.counselling.explainedProtection}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedProtection",
                  value: v,
                })
              }
              description="Protects against HPV 6, 11, 16, 18, 31, 33, 45, 52, 58"
            />
            <Checkbox
              label="Discussed common reactions"
              checked={state.counselling.discussedCommonReactions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "discussedCommonReactions",
                  value: v,
                })
              }
              description="Arm soreness, mild fever, headache; serious reactions rare"
            />
            <Checkbox
              label="Clarified not treatment for existing infection"
              checked={state.counselling.explainedNotTreatment}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedNotTreatment",
                  value: v,
                })
              }
              description="Vaccine prevents infection; does not treat established HPV"
            />
            <Checkbox
              label="Offered written information"
              checked={state.counselling.offeredWrittenInfo}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "offeredWrittenInfo",
                  value: v,
                })
              }
              description="Patient information leaflet provided"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-sm font-medium text-teal-900">
                Vaccine: Gardasil 9
              </p>
              <p className="text-xs text-teal-700 mt-1">
                0.5 mL intramuscular injection into deltoid
              </p>
              <p className="text-xs text-teal-700 mt-2">
                Schedule: Dose 1 today, Dose 2 in 2 months, Dose 3 in 6 months from Dose 1
              </p>
            </div>
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
              placeholder="Any additional observations or patient concerns..."
              rows={4}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-navy-900 mb-3">
                Pharmacist Details
              </h4>
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
                  placeholder="Jane Smith"
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
                  placeholder="2123456"
                  required
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-navy-900 mb-3">
                Pharmacy Details
              </h4>
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
                  placeholder="High Street Pharmacy"
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
                  placeholder="123 High Street, London"
                />
              </div>
            </div>
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </div>
        );

      case 6:
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              Consultation Complete
            </h3>
            <p className="text-sm text-gray-600">
              The HPV vaccination ePGD consultation has been recorded successfully.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              The patient should return for their next scheduled dose as planned.
            </p>
          </div>
        );

      case 7:
        return (
          <HPVSummaryReport
            state={state}
            alerts={alerts}
            doseRecommendation={doseRecommendation}
          />
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
    </div>
  );
}

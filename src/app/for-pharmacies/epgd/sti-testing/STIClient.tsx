"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  STIConsultationState,
  STIAction,
  STIPatientDetails,
  STIRiskAssessment,
  STIClinicalAssessment,
  STITestSelection,
  STICounselling,
} from "./lib/sti-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/sti-types";
import {
  getAllAlerts,
  getRecommendedTests,
} from "./lib/sti-clinical-logic";
import { validateStep } from "./lib/sti-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { STISummaryReport } from "./components/STISummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: STIConsultationState, action: STIAction): STIConsultationState {
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

    case "UPDATE_RISK_ASSESSMENT":
      newState.riskAssessment = {
        ...newState.riskAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_CLINICAL_ASSESSMENT":
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_TEST_SELECTION":
      newState.testSelection = {
        ...newState.testSelection,
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

export default function STIClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ─── Computed values ───

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const recommendedTests = useMemo(() => getRecommendedTests(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    return !validationError;
  }, [state, validationError]);

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
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="First name"
                value={state.patient.firstName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "firstName", value: v })
                }
                required
                placeholder="John"
              />
              <TextInput
                label="Last name"
                value={state.patient.lastName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "lastName", value: v })
                }
                required
                placeholder="Smith"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Date of birth <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.patient.dateOfBirth}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "dateOfBirth", value: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Age (auto-calculated)
                </label>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
                  {state.patient.age !== null ? (
                    <>
                      {state.patient.age} years
                      {state.patient.age < 16 && (
                        <span className="ml-2 text-red-500 text-xs font-medium">
                          Minimum age 16
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Enter DOB above</span>
                  )}
                </div>
              </div>
            </div>
            <SelectInput
              label="Gender identity"
              value={state.patient.genderIdentity}
              onChange={(v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "genderIdentity", value: v })
              }
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "trans-male", label: "Trans male" },
                { value: "trans-female", label: "Trans female" },
                { value: "non-binary", label: "Non-binary" },
              ]}
              required
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="GP name"
                value={state.patient.gpName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "gpName", value: v })
                }
                placeholder="Dr. Jane Doe"
              />
              <TextInput
                label="GP practice"
                value={state.patient.gpPractice}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "gpPractice", value: v })
                }
                placeholder="High Street Medical Centre"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="NHS number (optional)"
                value={state.patient.nhsNumber}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "nhsNumber", value: v })
                }
                placeholder="123 456 7890"
              />
              <TextInput
                label="Phone (optional)"
                value={state.patient.phone}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "phone", value: v })
                }
                type="tel"
                placeholder="07..."
              />
            </div>
          </div>
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

      case 2: // Risk Assessment
        return (
          <div className="space-y-4">
            <NumberInput
              label="Number of sexual partners (last 3 months)"
              value={state.riskAssessment.numberOfPartners}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "numberOfPartners",
                  value: v,
                })
              }
              min={0}
              required
            />
            <SelectInput
              label="Condom usage"
              value={state.riskAssessment.condomUsage}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "condomUsage",
                  value: v,
                })
              }
              options={[
                { value: "never", label: "Never" },
                { value: "sometimes", label: "Sometimes" },
                { value: "always", label: "Always" },
              ]}
              required
            />
            <Checkbox
              label="History of STI"
              checked={state.riskAssessment.previousSTIs}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "previousSTIs",
                  value: v,
                })
              }
            />
            {state.riskAssessment.previousSTIs && (
              <TextInput
                label="Details (which STI, when treated)"
                value={state.riskAssessment.previousStiDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "previousStiDetail",
                    value: v,
                  })
                }
              />
            )}
            <Checkbox
              label="Current symptoms"
              checked={state.riskAssessment.currentSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "currentSymptoms",
                  value: v,
                })
              }
            />
            {state.riskAssessment.currentSymptoms && (
              <TextInput
                label="Symptom details"
                value={state.riskAssessment.symptomDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "symptomDetail",
                    value: v,
                  })
                }
                placeholder="Discharge, pain, rash, etc."
              />
            )}
            <Checkbox
              label="MSM (men who have sex with men)"
              checked={state.riskAssessment.msmStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "msmStatus",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Sex worker or partner of sex worker"
              checked={state.riskAssessment.sexWorker}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "sexWorker",
                  value: v,
                })
              }
            />
            <Checkbox
              label="PWID (people who inject drugs)"
              checked={state.riskAssessment.pwid}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "pwid",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Recent travel to high-prevalence area"
              checked={state.riskAssessment.recentTravel}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RISK_ASSESSMENT",
                  field: "recentTravel",
                  value: v,
                })
              }
            />
            {state.riskAssessment.recentTravel && (
              <TextInput
                label="Travel details"
                value={state.riskAssessment.travelDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "travelDetail",
                    value: v,
                  })
                }
                placeholder="Country, dates, sexual activity"
              />
            )}
          </div>
        );

      case 3: // Clinical Assessment
        return (
          <div className="space-y-4">
            <Checkbox
              label="Urethral discharge"
              checked={state.clinicalAssessment.urethralDischarge}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "urethralDischarge",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Genital pain or dysuria"
              checked={state.clinicalAssessment.genitalPain}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "genitalPain",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Rectal symptoms (discharge, pain, bleeding)"
              checked={state.clinicalAssessment.rectalSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "rectalSymptoms",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Pharyngeal symptoms (sore throat)"
              checked={state.clinicalAssessment.pharyngealSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "pharyngealSymptoms",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Systemic symptoms (fever, rash, lymphadenopathy)"
              checked={state.clinicalAssessment.systemicSymptoms}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "systemicSymptoms",
                  value: v,
                })
              }
            />
            {state.clinicalAssessment.systemicSymptoms && (
              <TextInput
                label="Details"
                value={state.clinicalAssessment.systemicDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "systemicDetail",
                    value: v,
                  })
                }
              />
            )}
          </div>
        );

      case 4: // Test Selection
        return (
          <div className="space-y-4">
            {recommendedTests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Recommended tests:</p>
                <ul className="text-xs text-blue-800 list-disc list-inside">
                  {recommendedTests.map((test) => (
                    <li key={test}>{test}</li>
                  ))}
                </ul>
              </div>
            )}
            <Checkbox
              label="Chlamydia/Gonorrhoea (CT/GC) NAAT"
              checked={state.testSelection.ctGc}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "ctGc",
                  value: v,
                })
              }
            />
            {state.testSelection.ctGc && (
              <SelectInput
                label="Sample type for CT/GC"
                value={state.testSelection.ctGcSampleType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_TEST_SELECTION",
                    field: "ctGcSampleType",
                    value: v,
                  })
                }
                options={[
                  { value: "urine", label: "Urine" },
                  { value: "urethral-swab", label: "Urethral swab" },
                  { value: "vaginal-swab", label: "Vaginal swab" },
                  { value: "rectal-swab", label: "Rectal swab" },
                  { value: "pharyngeal-swab", label: "Pharyngeal swab" },
                ]}
                required
              />
            )}
            <Checkbox
              label="HIV (4th gen Ag/Ab or rapid test)"
              checked={state.testSelection.hiv}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "hiv",
                  value: v,
                })
              }
            />
            {state.testSelection.hiv && (
              <SelectInput
                label="HIV test type"
                value={state.testSelection.hivTestType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_TEST_SELECTION",
                    field: "hivTestType",
                    value: v,
                  })
                }
                options={[
                  { value: "rapid", label: "Rapid test (results <15 mins)" },
                  { value: "lab", label: "Lab 4th generation test" },
                ]}
                required
              />
            )}
            <Checkbox
              label="Syphilis serology (RPR/TPPA)"
              checked={state.testSelection.syphilis}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "syphilis",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Hepatitis B"
              checked={state.testSelection.hepatitisB}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "hepatitisB",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Hepatitis C"
              checked={state.testSelection.hepatitisC}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_TEST_SELECTION",
                  field: "hepatitisC",
                  value: v,
                })
              }
            />
          </div>
        );

      case 5: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Window period information provided"
              checked={state.counselling.windowPeriods}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "windowPeriods",
                  value: v,
                })
              }
              description="Patient understands that recent infection may not be detected"
            />
            <Checkbox
              label="Partner notification discussed"
              checked={state.counselling.partnerNotification}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "partnerNotification",
                  value: v,
                })
              }
              description="Sexual partners should be informed and tested"
            />
            <Checkbox
              label="Safe sex practices advised"
              checked={state.counselling.safeSex}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "safeSex",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Results timeline explained"
              checked={state.counselling.resultsTimeline}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "resultsTimeline",
                  value: v,
                })
              }
              description="When patient will receive results and how"
            />
            <Checkbox
              label="Positive test meaning explained"
              checked={state.counselling.positiveTestMeaning}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "positiveTestMeaning",
                  value: v,
                })
              }
              description="Treatment pathways and GP referral"
            />
            <Checkbox
              label="Follow-up procedures explained"
              checked={state.counselling.followUp}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "followUp",
                  value: v,
                })
              }
              description="Test-of-cure, repeat testing, partner follow-up"
            />
          </div>
        );

      case 6: // Summary
        return (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
              }
              placeholder="John Smith"
              required
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
              }
              placeholder="e.g. 2123456"
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
              }
              placeholder="High Street Pharmacy"
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
              }
              placeholder="123 High Street, London"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Any additional clinical observations..."
              rows={4}
            />
            <STISummaryReport state={state} alerts={alerts} />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {alerts.length > 0 && (
        <AlertBanner
          alerts={alerts}
        />
      )}

      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
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

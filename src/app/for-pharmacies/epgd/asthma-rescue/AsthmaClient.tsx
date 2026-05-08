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
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/asthma-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
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
    if (state.currentStep <= 4 && hardStops) return false;
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
              label="Confirm patient has existing asthma diagnosis"
              checked={state.assessment.hasExistingDiagnosis}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "hasExistingDiagnosis",
                  value: v,
                })
              }
              description="Patient must have a documented asthma diagnosis from GP"
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
                { value: "ran out", label: "Ran out of current supply" },
                { value: "replacement", label: "Replacement before GP appointment" },
                { value: "other", label: "Other" },
              ]}
              required
            />
            <Checkbox
              label="Frequent use (&gt;3 days per week)"
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
          </div>
        );

      case 4: // Red Flags
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Red flags require referral to GP — supply cannot proceed
              </p>
            </div>
            <Checkbox
              label="No existing asthma diagnosis"
              checked={state.redFlags.noExistingDiagnosis}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "noExistingDiagnosis",
                  value: v,
                })
              }
              description="Patient has not been diagnosed with asthma by GP"
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

      case 5: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply Salbutamol 100mcg pMDI"
              checked={state.medicineSupply.salbutamol100mcgPMDI}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "salbutamol100mcgPMDI",
                  value: v,
                })
              }
              description="2-week emergency supply for known asthmatic"
            />
            <Checkbox
              label="Confirm dosing: 2 puffs per dose"
              checked={state.medicineSupply.twoAsDoseUnit}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "twoAsDoseUnit",
                  value: v,
                })
              }
              description="Standard dose is 2 puffs (200mcg)"
            />
            <Checkbox
              label="Patient understands maximum 8 puffs in 24 hours"
              checked={state.medicineSupply.maxEightPuffsDailyUnderstood}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "maxEightPuffsDailyUnderstood",
                  value: v,
                })
              }
              description="Patient confirms understanding of daily maximum dose"
            />
            <Checkbox
              label="Spacer device recommended"
              checked={state.medicineSupply.spacerRecommended}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "spacerRecommended",
                  value: v,
                })
              }
              description="Spacer improves inhaler technique and medication delivery"
            />
          </div>
        );

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
              label="Demonstrated correct inhaler technique"
              checked={state.counselling.inhalerTechniqueDemonstration}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "inhalerTechniqueDemonstration",
                  value: v,
                })
              }
              description="Patient shown how to use pMDI correctly (with or without spacer)"
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
            <div className="bg-teal-50 border border-teal-200 rounded p-3">
              <p className="text-xs text-teal-700">
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
      clinicalData: state as unknown as Record<string, unknown>,
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
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

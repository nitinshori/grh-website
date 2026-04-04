"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { TestosteroneWomenConsultationState, TestosteroneWomenAction } from "./lib/testosterone-women-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialTestosteroneWomenState } from "./lib/testosterone-women-types";
import { getAllAlerts, hasHardStops } from "./lib/testosterone-women-clinical-logic";
import { validateStep } from "./lib/testosterone-women-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TestosteroneWomenSummaryReport } from "./components/TestosteroneWomenSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from "../shared/components/FormInputs";

function reducer(state: TestosteroneWomenConsultationState, action: TestosteroneWomenAction): TestosteroneWomenConsultationState {
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
      newState.assessment = { ...newState.assessment, [action.field]: action.value };
      break;
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      if (action.field !== "contraindicated") {
        const hasCI = newState.contraindications.breastCancer || newState.contraindications.endometrialCancer || newState.contraindications.activeLiverDisease || newState.contraindications.pregnancy;
        newState.contraindications.contraindicated = hasCI;
      }
      break;
    case "UPDATE_PRESCRIPTION":
      newState.prescription = { ...newState.prescription, [action.field]: action.value };
      break;
    case "UPDATE_MONITORING":
      newState.monitoring = { ...newState.monitoring, [action.field]: action.value };
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

export default function TestosteroneWomenClient() {
  const [state, dispatch] = useReducer(reducer, createInitialTestosteroneWomenState());
  const [validationError, setValidationError] = useState<string | null>(null);

  const alerts = useMemo(() => getAllAlerts(state.assessment, state.contraindications), [state.assessment, state.contraindications]);
  const isBlocked = hasHardStops(state.contraindications);

  const handleNext = useCallback(() => {
    if (state.currentStep === 3 && isBlocked) {
      setValidationError("Cannot proceed — patient meets exclusion criteria");
      return;
    }
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) });
  }, [state, isBlocked]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, []);

  const canProceed = validateStep(state.currentStep, state) === null;

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <div className="space-y-6">
        <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
        <TestosteroneWomenSummaryReport state={state} alerts={alerts} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={state.currentStep === 3 && isBlocked}
      >
        {state.currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
            genderOption={{
              label: "Female",
              description: "Confirm patient is female",
              checked: state.assessment.femaleConfirmed,
              onToggle: (v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "femaleConfirmed", value: v }),
            }}
          />
        )}

        {state.currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <Checkbox
              label="Age 40 years or older"
              checked={state.assessment.ageConfirmed}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "ageConfirmed", value: v })}
              description="Confirm patient is aged 40 or above"
            />
            <SelectInput
              label="Menopausal status"
              value={state.assessment.menopausalStatus}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "menopausalStatus", value: v })}
              options={[
                { value: "perimenopausal", label: "Perimenopausal" },
                { value: "menopausal", label: "Menopausal" },
                { value: "postmenopausal", label: "Postmenopausal" },
              ]}
            />
            <Checkbox
              label="Documented libido dysfunction"
              checked={state.assessment.libioDysfunction}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "libioDysfunction", value: v })}
              description="Patient reports low sexual desire"
            />
            <TextInput
              label="Current HRT type"
              value={state.assessment.hrtType}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "hrtType", value: v })}
              required
              placeholder="e.g., oestradiol gel, conjugated oestrogens"
            />
            <NumberInput
              label="Duration on HRT (months)"
              value={state.assessment.onHRTDuration}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "onHRTDuration", value: v })}
              min={0}
            />
            {state.assessment.onHRTDuration !== null && state.assessment.onHRTDuration < 3 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                Patient must be on HRT for minimum 3 months before testosterone supply
              </div>
            )}
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-sm text-amber-900 mb-3">Check for Exclusion Criteria</h4>
              <div className="space-y-3">
                <Checkbox
                  label="History of breast cancer"
                  checked={state.contraindications.breastCancer}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastCancer", value: v })}
                  description="Absolute contraindication"
                />
                <Checkbox
                  label="History of endometrial cancer"
                  checked={state.contraindications.endometrialCancer}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "endometrialCancer", value: v })}
                  description="Absolute contraindication"
                />
                <Checkbox
                  label="Active liver disease"
                  checked={state.contraindications.activeLiverDisease}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "activeLiverDisease", value: v })}
                  description="Hepatic impairment is contraindicated"
                />
                <Checkbox
                  label="Pregnancy"
                  checked={state.contraindications.pregnancy}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnancy", value: v })}
                  description="Absolute contraindication"
                />
              </div>
            </div>
            {isBlocked && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700">
                  Patient meets exclusion criteria. Cannot proceed with supply.
                </p>
              </div>
            )}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4">
            <TextInput
              label="Product name"
              value={state.prescription.productName}
              onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "productName", value: v })}
              required
              placeholder="e.g., Androfeme"
            />
            <SelectInput
              label="Strength"
              value={state.prescription.strength}
              onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "strength", value: v })}
              options={[{ value: "1%", label: "1% cream/gel" }]}
            />
            <TextInput
              label="Application site"
              value={state.prescription.applicationSite}
              onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "applicationSite", value: v })}
              required
              placeholder="e.g., inner thigh, abdomen"
            />
            <TextInput label="Dosage" value={state.prescription.dosage} onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "dosage", value: v })} />
            <TextInput label="Frequency" value={state.prescription.frequency} onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "frequency", value: v })} />
            <TextInput label="Review period" value={state.prescription.duration} onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "duration", value: v })} />
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-4">
            <Checkbox
              label="Baseline testosterone level assessment documented"
              checked={state.monitoring.baselineTestosteroneLevel}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "baselineTestosteroneLevel", value: v })}
              description="Before starting testosterone therapy"
            />
            <Checkbox
              label="6-month follow-up planned"
              checked={state.monitoring.sixMonthFollowUpPlanned}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "sixMonthFollowUpPlanned", value: v })}
              description="To recheck testosterone levels and symptoms"
            />
            <Checkbox
              label="Levels should remain in female range"
              checked={state.monitoring.levelsShouldRemainInFemaleRange}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "levelsShouldRemainInFemaleRange", value: v })}
              description="Monitoring for appropriate dosing"
            />
            <Checkbox
              label="Side effects discussed"
              checked={state.monitoring.sideEffectsDiscussed}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "sideEffectsDiscussed", value: v })}
              description="Facial hair, deepening voice, clitoral enlargement"
            />
          </div>
        )}

        {state.currentStep === 6 && (
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900">Counselling Points to Cover</h4>
            <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
              <li>Apply pea-sized amount to clean, dry skin once daily</li>
              <li>Rotate application sites</li>
              <li>May cause facial hypertrichosis (especially in women)</li>
              <li>Monitor for virilisation (deepening voice, clitoral enlargement)</li>
              <li>Baseline testosterone level before starting</li>
              <li>Recheck levels at 3&ndash;6 months — should remain in female range</li>
              <li>Continue existing HRT as prescribed</li>
              <li>Report any concerning symptoms immediately</li>
            </ul>
          </div>
        )}

        {state.currentStep === 7 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })}
              required
              placeholder="Jane Smith"
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })}
              required
              placeholder="123456"
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })}
              placeholder="Main Street Pharmacy"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              placeholder="Additional clinical information..."
              rows={4}
            />
          </div>
        )}
      </StepWrapper>
    </div>
  );
}

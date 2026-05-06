"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { ADHDMonitoringConsultationState, ADHDMonitoringAction } from "./lib/adhd-monitoring-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialADHDMonitoringState } from "./lib/adhd-monitoring-types";
import { getAllAlerts, hasHardStops } from "./lib/adhd-monitoring-clinical-logic";
import { validateStep } from "./lib/adhd-monitoring-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { ADHDMonitoringSummaryReport } from "./components/ADHDMonitoringSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from "../shared/components/FormInputs";

function reducer(state: ADHDMonitoringConsultationState, action: ADHDMonitoringAction): ADHDMonitoringConsultationState {
  const newState = { ...state };
  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") newState.patient.age = calculateAge(action.value as string);
      break;
    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;
    case "UPDATE_ASSESSMENT":
      newState.assessment = { ...newState.assessment, [action.field]: action.value };
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

export default function ADHDMonitoringClient() {
  const [state, dispatch] = useReducer(reducer, createInitialADHDMonitoringState());
  const [validationError, setValidationError] = useState<string | null>(null);
  const alerts = useMemo(() => getAllAlerts(state.monitoring), [state.monitoring]);
  const isBlocked = hasHardStops(state.monitoring);

  const handleNext = useCallback(() => {
    if (isBlocked) {
      setValidationError("Red flag detected — escalate to GP immediately");
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

  const canProceed = validateStep(state.currentStep, state) === null && !isBlocked;


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
      outcome: isBlocked ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, isBlocked]);

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
          <ADHDMonitoringSummaryReport state={state} alerts={alerts} />
        </StepWrapper>
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
        isBlocked={isBlocked}
      >
        {state.currentStep === 0 && (
          <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
        )}

        {state.currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <SelectInput
              label="Current ADHD medication"
              value={state.assessment.currentMedication}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "currentMedication", value: v })}
              required
              options={[
                { value: "Methylphenidate", label: "Methylphenidate" },
                { value: "Lisdexamfetamine", label: "Lisdexamfetamine" },
                { value: "Other", label: "Other" },
              ]}
            />
            <TextInput label="Current dose" value={state.assessment.currentDose} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "currentDose", value: v })} required placeholder="e.g., 10mg BD" />
            <NumberInput label="Baseline heart rate (bpm)" value={state.assessment.baselineHR} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "baselineHR", value: v })} min={40} max={200} />
            <TextInput label="Baseline blood pressure" value={state.assessment.baselineBP} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "baselineBP", value: v })} placeholder="e.g., 120/80" />
            <NumberInput label="Baseline weight (kg)" value={state.assessment.baselineWeight} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "baselineWeight", value: v })} min={5} max={300} />
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-4">
            <NumberInput label="Current heart rate (bpm)" value={state.monitoring.currentHR} onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "currentHR", value: v })} required min={40} max={200} />
            {state.monitoring.currentHR !== null && state.monitoring.currentHR > 100 && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">HR &gt; 100 bpm — RED FLAG. Consider dose reduction.</div>}
            <TextInput label="Current blood pressure" value={state.monitoring.currentBP} onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "currentBP", value: v })} required placeholder="e.g., 120/80" />
            <NumberInput label="Current weight (kg)" value={state.monitoring.currentWeight} onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "currentWeight", value: v })} min={5} max={300} />
            <SelectInput
              label="Appetite status"
              value={state.monitoring.appetite}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "appetite", value: v })}
              options={[
                { value: "normal", label: "Normal" },
                { value: "slightly-reduced", label: "Slightly reduced" },
                { value: "significantly-reduced", label: "Significantly reduced" },
              ]}
            />
            <SelectInput
              label="Sleep quality"
              value={state.monitoring.sleepQuality}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "sleepQuality", value: v })}
              options={[
                { value: "good", label: "Good" },
                { value: "fair", label: "Fair" },
                { value: "poor", label: "Poor" },
              ]}
            />
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-sm text-amber-900 mb-3">Adverse Events Assessment</h4>
            <Checkbox
              label="Mood changes reported"
              checked={state.monitoring.moodChanges}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "moodChanges", value: v })}
              description="Irritability, anxiety, or depression"
            />
            <Checkbox
              label="New or worsening tics"
              checked={state.monitoring.ticsDeveloped}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "ticsDeveloped", value: v })}
              description="Discuss with GP; may need dose adjustment"
            />
            <Checkbox
              label="Red flag event (severe symptoms)"
              checked={state.monitoring.redFlagsPresent}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "redFlagsPresent", value: v })}
              description="Severe cardiovascular symptoms, psychosis, or acute distress"
            />
            {isBlocked && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-semibold">RED FLAG — Escalate to GP immediately</div>}
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">Dose Titration Notes</h4>
            <p className="text-xs text-blue-800 mb-3">Document any dose changes recommended and rationale for adjustment.</p>
            <TextArea
              label="Titration recommendations"
              value={state.summary.clinicalNotes}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              placeholder="e.g., Increase to 15mg BD due to symptom control, monitor BP at next review"
              rows={4}
            />
          </div>
        )}

        {state.currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
            <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
          </div>
        )}
      </StepWrapper>
    </div>
  );
}

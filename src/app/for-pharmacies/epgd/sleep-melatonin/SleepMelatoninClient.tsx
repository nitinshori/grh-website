"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { SleepMelatoninConsultationState, SleepMelatoninAction } from "./lib/sleep-melatonin-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialSleepMelatoninState } from "./lib/sleep-melatonin-types";
import { getAllAlerts, hasHardStops } from "./lib/sleep-melatonin-clinical-logic";
import { validateStep } from "./lib/sleep-melatonin-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { SleepMelatoninSummaryReport } from "./components/SleepMelatoninSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";

function reducer(state: SleepMelatoninConsultationState, action: SleepMelatoninAction): SleepMelatoninConsultationState {
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
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      if (action.field !== "contraindicated") {
        const hasCI = newState.contraindications.autoimmuneDiseaseActive || newState.contraindications.hepaticImpairment || newState.contraindications.pregnancy || newState.contraindications.breastfeeding;
        newState.contraindications.contraindicated = hasCI;
      }
      break;
    case "UPDATE_COUNSELLING":
      newState.counselling = { ...newState.counselling, [action.field]: action.value };
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

export default function SleepMelatoninClient() {
  const [state, dispatch] = useReducer(reducer, createInitialSleepMelatoninState());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
    dispatch({ type: "SET_STEP", step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) });
  }, [state, isBlocked]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, []);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      setValidationError(null);
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);

  const canProceed = validateStep(state.currentStep, state) === null;


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
          <SleepMelatoninSummaryReport state={state} alerts={alerts} />
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
        isBlocked={state.currentStep === 3 && isBlocked}
      >
        {state.currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
          />
        )}

        {state.currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <Checkbox
              label="Age 55 years or older"
              checked={state.assessment.ageConfirmed}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "ageConfirmed", value: v })}
              description="Confirm patient is aged 55 or above"
            />
            <Checkbox
              label="Sleep onset difficulty"
              checked={state.assessment.sleepOnsetIssue}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepOnsetIssue", value: v })}
              description="Difficulty falling asleep"
            />
            <Checkbox
              label="Sleep maintenance difficulty"
              checked={state.assessment.sleepMaintenanceIssue}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepMaintenanceIssue", value: v })}
              description="Frequent waking during night"
            />
            <SelectInput
              label="Duration of insomnia"
              value={state.assessment.durationOfInsomnia}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "durationOfInsomnia", value: v })}
              required
              options={[
                { value: "less3m", label: "Less than 3 months" },
                { value: "3-12m", label: "3-12 months" },
                { value: "over12m", label: "Over 12 months" },
              ]}
            />
            <Checkbox
              label="Sleep hygiene measures attempted"
              checked={state.assessment.sleepHygieneAttempted}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepHygieneAttempted", value: v })}
              description="First-line behavioural interventions"
            />
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-sm text-amber-900 mb-3">Check for Exclusion Criteria</h4>
              <div className="space-y-3">
                <Checkbox
                  label="Active autoimmune disease"
                  checked={state.contraindications.autoimmuneDiseaseActive}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "autoimmuneDiseaseActive", value: v })}
                  description="Absolute contraindication"
                />
                <Checkbox
                  label="Hepatic impairment"
                  checked={state.contraindications.hepaticImpairment}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hepaticImpairment", value: v })}
                  description="Significant liver disease"
                />
                <Checkbox
                  label="Pregnancy"
                  checked={state.contraindications.pregnancy}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnancy", value: v })}
                  description="Contraindicated in pregnancy"
                />
                <Checkbox
                  label="Breastfeeding"
                  checked={state.contraindications.breastfeeding}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })}
                  description="Contraindicated during breastfeeding"
                />
              </div>
            </div>
            {isBlocked && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-semibold text-red-700">Patient meets exclusion criteria. Cannot proceed with supply.</p></div>}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900">Prescription Details</h4>
            <Row label="Product" value={state.prescription.product} />
            <Row label="Dose" value={state.prescription.dose} />
            <Row label="Frequency" value={state.prescription.frequency} />
            <Row label="Duration" value={state.prescription.duration} />
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-4">
            <Checkbox
              label="Sleep hygiene reinforced as first-line treatment"
              checked={state.counselling.sleepHygieneReinforcedFirstLine}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sleepHygieneReinforcedFirstLine", value: v })}
              description="Regular sleep schedule, avoid napping, exercise during day"
            />
            <Checkbox
              label="Avoid screens 1-2 hours before bed"
              checked={state.counselling.avoidScreensAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidScreensAdvised", value: v })}
              description="Blue light can interfere with melatonin production"
            />
            <Checkbox
              label="Gradual tapering if stopping"
              checked={state.counselling.taperedStoppingAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "taperedStoppingAdvised", value: v })}
              description="Do not stop abruptly after prolonged use"
            />
            <Checkbox
              label="Not a sedative — promotes natural sleep"
              checked={state.counselling.notASedativeExplained}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notASedativeExplained", value: v })}
              description="Works with body's natural circadian rhythm"
            />
          </div>
        )}

        {state.currentStep === 6 && (
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
              placeholder="Additional information..."
              rows={4}
            />
          </div>
        )}
      </StepWrapper>
    </div>
  );
}

interface Row {
  label: string;
  value: string;
}

function Row({ label, value }: Row) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-xs">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-navy-900">{value}</dd>
    </div>
  );
}

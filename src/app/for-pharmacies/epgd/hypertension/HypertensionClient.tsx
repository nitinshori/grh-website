"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { HypertensionConsultationState, HypertensionAction } from "./lib/hypertension-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hypertension-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/hypertension-clinical-logic";
import { validateStep } from "./lib/hypertension-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HypertensionSummaryReport } from "./components/HypertensionSummaryReport";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";

function reducer(state: HypertensionConsultationState, action: HypertensionAction): HypertensionConsultationState {
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
    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;
    case "UPDATE_RED_FLAGS":
      newState.redFlags = { ...newState.redFlags, [action.field]: action.value };
      break;
    case "UPDATE_MONITORING":
      newState.monitoring = { ...newState.monitoring, [action.field]: action.value };
      break;
    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = { ...newState.medicineSupply, [action.field]: action.value };
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

export default function HypertensionClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const validationError = useMemo(() => validateStep(state, state.currentStep), [state]);
  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 5 && hardStops) return false;
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
    if (state.currentStep > 0) dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) dispatch({ type: "SET_STEP", step });
  }, [completedSteps, state.currentStep]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <PatientDetailsStep patient={state.patient} onChange={(field, value) =>
            dispatch({ type: "UPDATE_PATIENT", field, value })} />
        );
      case 1:
        return (
          <ConsentStep consent={state.consent} onChange={(field, value) =>
            dispatch({ type: "UPDATE_CONSENT", field, value })} />
        );
      case 2:
        return (
          <div className="space-y-4">
            <Checkbox label="Confirm existing hypertension diagnosis" checked={state.assessment.hasExistingDiagnosis}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "hasExistingDiagnosis", value: v })}
              description="GP-initiated treatment required" />
            <NumberInput label="Stable on amlodipine (months)" value={state.assessment.stableOnTreatmentMonths}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "stableOnTreatmentMonths", value: v })}
              min={0} />
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Clinic systolic (mmHg)" value={state.assessment.clinicSystolic}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "clinicSystolic", value: v })} />
              <NumberInput label="Clinic diastolic (mmHg)" value={state.assessment.clinicDiastolic}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "clinicDiastolic", value: v })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Home systolic (mmHg)" value={state.assessment.homeSystolic}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "homeSystolic", value: v })} />
              <NumberInput label="Home diastolic (mmHg)" value={state.assessment.homeDiastolic}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "homeDiastolic", value: v })} />
            </div>
            <TextInput label="Current amlodipine dose" value={state.assessment.currentAmlodipineDose}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "currentAmlodipineDose", value: v })}
              placeholder="e.g., 5mg, 10mg" />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Checkbox label="BP documented in GP records" checked={state.medicalHistory.bpDocumented}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bpDocumented", value: v })} />
            <Checkbox label="History of heart failure" checked={state.medicalHistory.heartFailure}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "heartFailure", value: v })}
              description="Amlodipine caution in heart failure" />
            <Checkbox label="Severe aortic stenosis" checked={state.medicalHistory.severeAorticStenosis}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeAorticStenosis", value: v })}
              description="Amlodipine contraindicated" />
            <TextInput label="Other medical conditions" value={state.medicalHistory.otherConditions}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherConditions", value: v })}
              placeholder="e.g., diabetes, CKD, CVD" />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-700">Document any current medications that may interact with amlodipine</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">Red flags require urgent GP referral</p>
            </div>
            <Checkbox label="Uncontrolled/unstable BP" checked={state.redFlags.uncontrolledBP}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "uncontrolledBP", value: v })} />
            <Checkbox label="BP &gt;180/110 mmHg" checked={state.redFlags.bpGreater180110}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "bpGreater180110", value: v })}
              description="URGENT REFERRAL — do not supply" />
            <Checkbox label="New chest pain" checked={state.redFlags.newChestPain}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "newChestPain", value: v })} />
            <Checkbox label="Severe headache" checked={state.redFlags.severeHeadache}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "severeHeadache", value: v })} />
            <Checkbox label="Visual changes" checked={state.redFlags.visualChanges}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "visualChanges", value: v })} />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <Checkbox label="Home BP monitoring done" checked={state.monitoring.homeMonitoringDone}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "homeMonitoringDone", value: v })}
              description="Patient performs regular home monitoring" />
            <SelectInput label="Monitoring frequency" value={state.monitoring.regularity}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "regularity", value: v })}
              options={[
                { value: "daily", label: "Daily" },
                { value: "2-3weekly", label: "2-3 times per week" },
                { value: "weekly", label: "Weekly" },
              ]} />
            <Checkbox label="Readings taken accurately" checked={state.monitoring.bpReadingsAccurate}
              onChange={(v) => dispatch({ type: "UPDATE_MONITORING", field: "bpReadingsAccurate", value: v })}
              description="Patient uses validated device, correct technique" />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <SelectInput label="Amlodipine dose to supply" value={state.medicineSupply.amlodipineDoseSelected}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "amlodipineDoseSelected", value: v })}
              options={[
                { value: "5", label: "5mg once daily" },
                { value: "10", label: "10mg once daily" },
              ]} required />
            <Checkbox label="Dosage confirmed with patient" checked={state.medicineSupply.dosageConfirmed}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dosageConfirmed", value: v })} />
            <Checkbox label="Patient knows to take at same time daily" checked={state.medicineSupply.sameTimeDailyUnderstood}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "sameTimeDailyUnderstood", value: v })} />
            <Checkbox label="Grapefruit interaction awareness" checked={state.medicineSupply.grapefruitmInteractionAware}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "grapefruitmInteractionAware", value: v })}
              description="Patient aware grapefruit increases amlodipine levels" />
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <Checkbox label="Ankle swelling explained (benign, not dangerous)" checked={state.counselling.ankleSwellingExplained}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "ankleSwellingExplained", value: v })} />
            <Checkbox label="Take at same time daily" checked={state.counselling.takeAtSameTime}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "takeAtSameTime", value: v })} />
            <Checkbox label="Grapefruit interaction warning given" checked={state.counselling.grapefruitmInteractionWarned}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "grapefruitmInteractionWarned", value: v })}
              description="Avoid grapefruit and grapefruit juice" />
            <Checkbox label="Regular monitoring advised (6-monthly)" checked={state.counselling.regularMonitoring}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "regularMonitoring", value: v })} />
            <Checkbox label="Lifestyle advice (salt, exercise, weight)" checked={state.counselling.lifestyleAdvice}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "lifestyleAdvice", value: v })} />
            <Checkbox label="Do not stop suddenly" checked={state.counselling.doNotStopSuddenly}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "doNotStopSuddenly", value: v })}
              description="Abrupt discontinuation risks rebound hypertension" />
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextInput label="Pharmacy address" value={state.summary.pharmacyAddress}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })} />
            </div>
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} rows={4} />
          </div>
        );
      default:
        return null;
    }
  };

  const handlePrint = useCallback(() => { window.print(); }, []);


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
          <HypertensionSummaryReport state={state} alerts={alerts} doseRecommendation={doseRecommendation} />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={state.currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} completedSteps={completedSteps} onStepClick={handleStepClick} />
      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}
      <StepWrapper currentStep={state.currentStep} totalSteps={TOTAL_STEPS} title={STEP_LABELS[state.currentStep]} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
        {renderStep()}
      </StepWrapper>
      <div className="flex gap-3 justify-between">
        <button onClick={handlePrev} disabled={state.currentStep === 0} className="px-4 py-2 text-sm font-medium text-navy-900 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg">
          ← Back
        </button>
        <button onClick={handleNext} disabled={!canProceed} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 rounded-lg">
          Next →
        </button>
      </div>
    </div>
  );
}

"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { StatinsConsultationState, StatinsAction } from "./lib/statins-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/statins-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/statins-clinical-logic";
import { validateStep } from "./lib/statins-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { StatinsSummaryReport } from "./components/StatinsSummaryReport";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";

function reducer(state: StatinsConsultationState, action: StatinsAction): StatinsConsultationState {
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

export default function StatinsClient() {
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
        return <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />;
      case 1:
        return <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />;
      case 2:
        return (
          <div className="space-y-4">
            <Checkbox label="Existing statin prescription" checked={state.assessment.hasExistingPrescription} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "hasExistingPrescription", value: v })} description="GP-initiated treatment required" />
            <NumberInput label="Last lipid profile (months ago)" value={state.assessment.lastLipidProfileMonths} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastLipidProfileMonths", value: v })} min={0} />
            <TextInput label="Current statin" value={state.assessment.currentStatin} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "currentStatin", value: v })} placeholder="e.g., atorvastatin 20mg" />
            <NumberInput label="Total cholesterol (mg/dL)" value={state.assessment.totalCholesterol} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "totalCholesterol", value: v })} />
            <NumberInput label="LDL (mg/dL)" value={state.assessment.ldl} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "ldl", value: v })} />
            <NumberInput label="HDL (mg/dL)" value={state.assessment.hdl} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "hdl", value: v })} />
            <NumberInput label="Triglycerides (mg/dL)" value={state.assessment.triglycerides} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "triglycerides", value: v })} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Checkbox label="Active liver disease" checked={state.medicalHistory.activeLiverDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeLiverDisease", value: v })} />
            <Checkbox label="Elevated transaminases (&gt;3x ULN)" checked={state.medicalHistory.elevatedTransaminases} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "elevatedTransaminases", value: v })} />
            <Checkbox label="Pregnant or breastfeeding" checked={state.medicalHistory.pregnant || state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnant", value: v })} />
            <Checkbox label="Chronic kidney disease" checked={state.medicalHistory.ckrenal} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ckrenal", value: v })} />
            <Checkbox label="Age &gt;80 years" checked={state.medicalHistory.elderly80Plus} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "elderly80Plus", value: v })} />
            <Checkbox label="Hypothyroidism" checked={state.medicalHistory.hypothyroidism} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypothyroidism", value: v })} />
            <Checkbox label="High alcohol intake" checked={state.medicalHistory.highAlcoholIntake} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "highAlcoholIntake", value: v })} />
          </div>
        );
      case 4:
        return <div className="space-y-4"><div className="bg-blue-50 border border-blue-200 rounded p-3"><p className="text-xs text-blue-700">Note concomitant use of fusidic acid (increases statin levels)</p></div></div>;
      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4"><p className="text-xs text-red-700 font-medium">Red flags require urgent referral</p></div>
            <Checkbox label="Unexplained muscle pain/weakness" checked={state.redFlags.unexplainedMusclePain} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "unexplainedMusclePain", value: v })} description="Rhabdomyolysis risk" />
            <Checkbox label="History of statin-induced myopathy" checked={state.redFlags.myopathy} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "myopathy", value: v })} />
            <Checkbox label="New-onset diabetes symptoms" checked={state.redFlags.newDiabetesSymptoms} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "newDiabetesSymptoms", value: v })} />
            <Checkbox label="Yellowing of skin/eyes" checked={state.redFlags.yellowing} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "yellowing", value: v })} description="Hepatotoxicity sign" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <SelectInput label="Atorvastatin dose to supply" value={state.medicineSupply.doseSelected} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "doseSelected", value: v })} options={[
              { value: "10", label: "10mg once daily" },
              { value: "20", label: "20mg once daily" },
              { value: "40", label: "40mg once daily" },
              { value: "80", label: "80mg once daily" },
            ]} required />
            <Checkbox label="Dosage confirmed" checked={state.medicineSupply.dosageConfirmed} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dosageConfirmed", value: v })} />
            <Checkbox label="No concomitant fusidic acid" checked={!state.medicineSupply.concomitantFusidic} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "concomitantFusidic", value: !v })} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <Checkbox label="Report muscle pain immediately" checked={state.counselling.reportMusclePain} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reportMusclePain", value: v })} />
            <Checkbox label="Annual blood test advised" checked={state.counselling.annualBloodTest} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "annualBloodTest", value: v })} description="LFTs and lipid profile" />
            <Checkbox label="Lifestyle measures discussed" checked={state.counselling.lifestyleMeasures} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "lifestyleMeasures", value: v })} />
            <Checkbox label="Timing of dose explained (atorvastatin)" checked={state.counselling.takeAtNightOrAnytime} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "takeAtNightOrAnytime", value: v })} description="Can take at any time of day" />
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextInput label="Pharmacy address" value={state.summary.pharmacyAddress} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })} />
            </div>
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} rows={4} />
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
          <StatinsSummaryReport state={state} alerts={alerts} doseRecommendation={doseRecommendation} />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={state.currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} completedSteps={completedSteps} onStepClick={handleStepClick} />
      {alerts.length > 0 && (<AlertBanner alerts={alerts} />)}
      <StepWrapper currentStep={state.currentStep} totalSteps={TOTAL_STEPS} title={STEP_LABELS[state.currentStep]} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>{renderStep()}</StepWrapper>
      <div className="flex gap-3 justify-between">
        <button onClick={handlePrev} disabled={state.currentStep === 0} className="px-4 py-2 text-sm font-medium text-navy-900 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg">← Back</button>
        <button onClick={handleNext} disabled={!canProceed} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 rounded-lg">Next →</button>
      </div>
    </div>
  );
}

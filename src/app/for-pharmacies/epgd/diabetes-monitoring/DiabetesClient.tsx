"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { DiabetesConsultationState, DiabetesAction } from "./lib/diabetes-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/diabetes-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/diabetes-clinical-logic";
import { validateStep } from "./lib/diabetes-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { DiabetesSummaryReport } from "./components/DiabetesSummaryReport";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";

function reducer(state: DiabetesConsultationState, action: DiabetesAction): DiabetesConsultationState {
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

export default function DiabetesClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const validationError = useMemo(() => validateStep(state, state.currentStep), [state]);
  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 6 && hardStops) return false;
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
            <Checkbox label="Type 2 diabetes diagnosed" checked={state.assessment.hasExistingT2DM} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "hasExistingT2DM", value: v })} description="GP-initiated treatment required" />
            <NumberInput label="Stable on metformin (months)" value={state.assessment.stableOnMetforminMonths} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "stableOnMetforminMonths", value: v })} min={0} />
            <TextInput label="Current metformin dose" value={state.assessment.currentMetforminDose} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "currentMetforminDose", value: v })} placeholder="e.g., 1500mg daily" />
            <NumberInput label="Last HbA1c test (months ago)" value={state.assessment.lastHbA1cMonths} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastHbA1cMonths", value: v })} min={0} />
            <NumberInput label="Last HbA1c value (mmol/mol)" value={state.assessment.lastHbA1cValue} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastHbA1cValue", value: v })} />
            <NumberInput label="Last eGFR test (months ago)" value={state.assessment.lastEgfrMonths} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastEgfrMonths", value: v })} min={0} />
            <NumberInput label="Last eGFR (mL/min/1.73m²)" value={state.assessment.lastEgfrValue} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastEgfrValue", value: v })} />
            <NumberInput label="Weight (kg)" value={state.assessment.weight} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "weight", value: v })} />
            <NumberInput label="Systolic BP (mmHg)" value={state.assessment.systolicBP} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "systolicBP", value: v })} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Checkbox label="Type 2 DM documented" checked={state.medicalHistory.diabetesDiagnosed} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetesDiagnosed", value: v })} />
            <Checkbox label="History of DKA" checked={state.medicalHistory.dka} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "dka", value: v })} />
            <Checkbox label="Severe hepatic impairment" checked={state.medicalHistory.severeHepaticImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepaticImpairment", value: v })} />
            <Checkbox label="Recent dehydration" checked={state.medicalHistory.dehydration} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "dehydration", value: v })} />
            <Checkbox label="Recent sepsis or serious infection" checked={state.medicalHistory.sepsis} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "sepsis", value: v })} />
            <Checkbox label="Recent MI" checked={state.medicalHistory.myocardialInfarction} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "myocardialInfarction", value: v })} />
          </div>
        );
      case 4:
        return <div className="space-y-4"><div className="bg-blue-50 border border-blue-200 rounded p-3"><p className="text-xs text-blue-700">Document any current medications</p></div></div>;
      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4"><p className="text-xs text-blue-700">Monitor eGFR annually (or every 6 months if eGFR 30-45)</p></div>
            {state.assessment.lastEgfrValue !== null && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-xs text-amber-700">eGFR {state.assessment.lastEgfrValue} mL/min/1.73m²</p>
                {state.assessment.lastEgfrValue < 30 && <p className="text-xs text-red-600 mt-1">Metformin CONTRAINDICATED — STOP and refer</p>}
                {state.assessment.lastEgfrValue >= 30 && state.assessment.lastEgfrValue < 45 && <p className="text-xs text-orange-600 mt-1">Max dose 1g daily</p>}
                {state.assessment.lastEgfrValue >= 45 && state.assessment.lastEgfrValue < 60 && <p className="text-xs text-orange-600 mt-1">Review dose — consider reduction</p>}
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4"><p className="text-xs text-red-700 font-medium">Red flags require urgent GP referral</p></div>
            <Checkbox label="eGFR &lt;30 (metformin contraindicated)" checked={state.redFlags.egfrBelow30} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "egfrBelow30", value: v })} />
            <Checkbox label="HbA1c &gt;75 mmol/mol (poor control)" checked={state.redFlags.hbA1cPoorControl} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "hbA1cPoorControl", value: v })} />
            <Checkbox label="Symptoms of lactic acidosis" checked={state.redFlags.lacticAcidosisSymptoms} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "lacticAcidosisSymptoms", value: v })} description="Nausea, abdominal pain, hyperventilation" />
            <Checkbox label="Acute conditions (dehydration, sepsis, MI)" checked={state.redFlags.acuteConditions} onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "acuteConditions", value: v })} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <SelectInput label="Metformin format" value={state.medicineSupply.metforminFormatSelected} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "metforminFormatSelected", value: v })} options={[
              { value: "standard", label: "Standard (take with food)" },
              { value: "mr", label: "Modified-Release (once daily)" },
            ]} required />
            <SelectInput label="Metformin dose to supply" value={state.medicineSupply.doseSelected} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "doseSelected", value: v })} options={[
              { value: "500", label: "500mg" },
              { value: "1000", label: "1000mg" },
              { value: "1500", label: "1500mg" },
              { value: "2000", label: "2000mg" },
            ]} required />
            <Checkbox label="Dosage confirmed" checked={state.medicineSupply.dosageConfirmed} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dosageConfirmed", value: v })} />
            <Checkbox label="eGFR-based dose adjustment applied" checked={state.medicineSupply.eGFRBasedDoseAdjustment} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "eGFRBasedDoseAdjustment", value: v })} description="If eGFR 30-45: max 1g/day" />
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <Checkbox label="Take with food (GI side effects reduction)" checked={state.counselling.takeWithFood} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "takeWithFood", value: v })} />
            <Checkbox label="MR formulation discussed for GI intolerance" checked={state.counselling.giIntolerance} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "giIntolerance", value: v })} />
            <Checkbox label="Sick day rules explained" checked={state.counselling.sickDayRules} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sickDayRules", value: v })} description="Stop if dehydrated, vomiting, or acute illness" />
            <Checkbox label="Alcohol moderation advised" checked={state.counselling.alcoholModeration} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "alcoholModeration", value: v })} />
            <Checkbox label="Annual review explained (eyes, feet, kidneys)" checked={state.counselling.annualReview} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "annualReview", value: v })} />
          </div>
        );
      case 9:
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
          <DiabetesSummaryReport state={state} alerts={alerts} doseRecommendation={doseRecommendation} />
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

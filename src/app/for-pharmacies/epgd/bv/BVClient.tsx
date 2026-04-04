"use client";
import { useReducer, useMemo, useState, useCallback } from "react";
import type { BVConsultationState, BVAction } from "./lib/bv-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/bv-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/bv-clinical-logic";
import { validateStep } from "./lib/bv-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import { BVSummaryReport } from "./components/BVSummaryReport";

function reducer(state: BVConsultationState, action: BVAction): BVConsultationState {
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
    case "UPDATE_MEDICATIONS":
      newState.medications = { ...newState.medications, [action.field]: action.value };
      break;
    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = { ...newState.medicineSelection, [action.field]: action.value };
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

export default function BVClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);
  const canProceed = !validationError && (!hasStops || state.currentStep >= 4);

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
    if (step < state.currentStep) dispatch({ type: "SET_STEP", step });
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
          </StepWrapper>
        );
      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Symptom Assessment" description="Assess for typical bacterial vaginosis symptoms." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <p className="text-sm text-navy-900 font-semibold">Typical BV symptoms:</p>
              <Checkbox label="Thin greyish-white discharge" checked={state.assessment.thinGrayishDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "thinGrayishDischarge", value: v })} />
              <Checkbox label="Fishy odour" checked={state.assessment.fishyOdour} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "fishyOdour", value: v })} />
              <Checkbox label="Odour worse after sex or menstruation" checked={state.assessment.odourWorseSexOrMenses} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "odourWorseSexOrMenses", value: v })} />
              <p className="text-sm text-navy-900 font-semibold mt-4">Associated symptoms (if present):</p>
              <Checkbox label="Itching (NOT typical of BV)" checked={state.assessment.itching} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "itching", value: v })} description="If significant itch, consider thrush instead" />
              <Checkbox label="Soreness (NOT typical of BV)" checked={state.assessment.soreness} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "soreness", value: v })} />
              <Checkbox label="Dysuria (pain passing urine)" checked={state.assessment.dysuria} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dysuria", value: v })} />
              <Checkbox label="Dyspareunia (pain on intercourse)" checked={state.assessment.dyspareunia} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dyspareunia", value: v })} />
              <p className="text-sm text-red-700 font-semibold mt-4">RED FLAGS - If any present, refer to GP:</p>
              <Checkbox label="Blood-stained discharge" checked={state.assessment.bloodStainedDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bloodStainedDischarge", value: v })} />
              <Checkbox label="Fever or pelvic pain" checked={state.assessment.fever || state.assessment.pelvicPain} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "fever", value: v })} />
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Medical History" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <Checkbox label="First episode of BV (not diagnosed before)" checked={state.medicalHistory.firstEpisode} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "firstEpisode", value: v })} />
              <Checkbox label="Recurrent BV" checked={state.medicalHistory.recurrentBV} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recurrentBV", value: v })} />
              <Checkbox label="Currently pregnant" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="First trimester: refer to GP for metronidazole use" />
              <Checkbox label="Planning pregnancy within 2 months" checked={state.medicalHistory.planningPregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "planningPregnancy", value: v })} />
              <Checkbox label="Active pelvic inflammatory disease" checked={state.medicalHistory.activePelvicInflammation} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activePelvicInflammation", value: v })} />
              <Checkbox label="Currently using alcohol or planning to during treatment" checked={state.medications.alcohol} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "alcohol", value: v })} description="Disulfiram reaction risk: avoid alcohol 48 hours after treatment" />
              <Checkbox label="Taking warfarin" checked={state.medications.warfarin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "warfarin", value: v })} />
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications Review" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={!hasStops} validationError={hasStops ? "Hard stops present - cannot proceed" : null} isBlocked={hasStops}>
            {alerts.length > 0 ? <AlertBanner alerts={alerts} /> : <p className="text-sm text-gray-600">No alerts identified.</p>}
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Medicine Selection" description="Choose treatment option." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops}>
            <div className="space-y-4">
              <SelectInput
                label="Treatment"
                value={state.medicineSelection.medicineChoice}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "medicineChoice", value: v })}
                options={[
                  { value: "metronidazole-400", label: "Metronidazole 400mg BD for 5-7 days" },
                  { value: "metronidazole-2g", label: "Metronidazole 2g single dose" },
                  { value: "metronidazole-gel", label: "Metronidazole intravaginal gel 0.75% for 5 days" },
                ]}
                required
              />
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Counselling & Patient Education" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-3">
              <Checkbox label="BV symptoms explained (not thrush, not STI)" checked={state.counselling.symptomsExplained} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "symptomsExplained", value: v })} />
              <Checkbox label="Differentiated from thrush (itch indicates thrush)" checked={state.counselling.differentiateThrush} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "differentiateThrush", value: v })} />
              <Checkbox label="Avoid alcohol during and for 48 hours after treatment" checked={state.counselling.noAlcoholAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noAlcoholAdvice", value: v })} description="Risk of disulfiram reaction" />
              <Checkbox label="Avoid vaginal douching" checked={state.counselling.avoidDouching} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidDouching", value: v })} />
              <Checkbox label="Complete full course of treatment" checked={state.counselling.completesCourse} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completesCourse", value: v })} />
              <Checkbox label="BV is NOT an STI" checked={state.counselling.notSTI} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notSTI", value: v })} description="Partner treatment not routinely recommended" />
              <Checkbox label="Recurrence likely (50% within 3 months)" checked={state.counselling.recurrenceAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "recurrenceAdvice", value: v })} />
              <Checkbox label="Sexual contacts/partner notification" checked={state.counselling.sexPartnerAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sexPartnerAdvice", value: v })} />
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50"><h2 className="text-lg font-bold text-navy-900">Summary & Consultation Record</h2></div>
            <div className="px-6 py-6">
              <div className="space-y-4 mb-6">
                <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
                <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
                <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
                <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
              </div>
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">Review the summary below before printing.</p>
                <BVSummaryReport state={updatedState} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <button onClick={() => dispatch({ type: "PREV_STEP" })} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">&larr; Previous</button>
              <button onClick={() => window.print()} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors">Print Consultation Record</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar stepLabels={STEP_LABELS} currentStep={state.currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} hasErrors={Boolean(validationError)} />
      {alerts.length > 0 && state.currentStep < 4 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}

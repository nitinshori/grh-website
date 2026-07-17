"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  SmokingNRTConsultationState,
  SmokingNRTAction,
  SmokingNRTPatientDetails,
  SmokingAssessment,
  SmokingMedicalHistory,
  SmokingContraindications,
  SmokingNRTSelection,
  SmokingCounselling,
  SmokingConsultationSummary,
} from "./lib/smoking-nrt-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/smoking-nrt-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/smoking-nrt-clinical-logic";
import { validateStep } from "./lib/smoking-nrt-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { SmokingNRTSummaryReport } from "./components/SmokingNRTSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: SmokingNRTConsultationState, action: SmokingNRTAction): SmokingNRTConsultationState {
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

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      break;

    case "UPDATE_NRT_SELECTION":
      newState.nrtSelection = { ...newState.nrtSelection, [action.field]: action.value };
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

export default function SmokingNRTClient() {
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
  const canProceed = !validationError && (!hasStops || state.currentStep >= 6);

  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  const handleNextStep = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrevStep = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleSetStep = (step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

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
      outcome: hasStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStops]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper
            title="Patient Details"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
            />
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper
            title="Consent"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Smoking Assessment (Fagerström)"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <NumberInput
                label="Cigarettes per day"
                value={state.assessment.cigarettesPerDay}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "cigarettesPerDay", value: v })}
                min={1}
                max={100}
                placeholder="e.g., 20"
                unit="cigarettes"
              />

              <SelectInput
                label="Time to first cigarette after waking"
                value={state.assessment.timeToFirstCigarette}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "timeToFirstCigarette", value: v })}
                options={[
                  { value: "&lt;5min", label: "Within 5 minutes" },
                  { value: "5-30min", label: "5–30 minutes" },
                  { value: "31-60min", label: "31–60 minutes" },
                  { value: "&gt;60min", label: "More than 60 minutes" },
                ]}
                required
              />

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-navy-900 mb-2">Set Quit Date</label>
                <input
                  type="date"
                  value={state.assessment.quitDate}
                  onChange={(e) => dispatch({ type: "UPDATE_ASSESSMENT", field: "quitDate", value: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Medical History"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Recent MI (myocardial infarction) — within 2 weeks"
                checked={state.medicalHistory.recentMI}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentMI", value: v })}
              />

              <Checkbox
                label="Recent stroke — within 2 weeks"
                checked={state.medicalHistory.recentStroke}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentStroke", value: v })}
              />

              <Checkbox
                label="Unstable angina"
                checked={state.medicalHistory.unstableAngina}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "unstableAngina", value: v })}
              />

              <Checkbox
                label="Cardiovascular disease (stable)"
                checked={state.medicalHistory.cardiovascularDisease}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cardiovascularDisease", value: v })}
              />

              <Checkbox
                label="Diabetes mellitus"
                checked={state.medicalHistory.diabetes}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })}
              />

              <Checkbox
                label="Pheochromocytoma"
                checked={state.medicalHistory.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pheochromocytoma", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Current Medications"
            description="Document any medications that may interact with NRT or be affected by smoking cessation"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <TextArea
              label="Current medications and doses"
              value={""}
              onChange={() => {}}
              placeholder="e.g., Aspirin 75mg daily, Lisinopril 10mg daily, Atorvastatin 20mg at night"
            />
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Contraindications Check"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <AlertBanner alerts={alerts} />
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Patient under 12 years old"
                checked={state.contraindications.childUnder12}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })}
              />

              <Checkbox
                label="Recent cardiac event (MI/stroke/unstable angina within 2 weeks)"
                checked={state.contraindications.recentCardiacEvent}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "recentCardiacEvent", value: v })}
              />

              <Checkbox
                label="Pheochromocytoma"
                checked={state.contraindications.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pheochromocytoma", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="NRT Selection"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <Checkbox
                label="Supply nicotine patches"
                checked={state.nrtSelection.usePatches}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "usePatches", value: v })}
              />

              {state.nrtSelection.usePatches && (
                <SelectInput
                  label="Patch Strength"
                  value={state.nrtSelection.patchStrength}
                  onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "patchStrength", value: v })}
                  options={[
                    { value: "21mg", label: "21mg (high strength)" },
                    { value: "14mg", label: "14mg (medium strength)" },
                    { value: "7mg", label: "7mg (low strength)" },
                  ]}
                  required
                />
              )}

              <Checkbox
                label="Supply oral NRT (gum, lozenge, inhalator, nasal spray, mouth spray)"
                checked={state.nrtSelection.useOralForm}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "useOralForm", value: v })}
              />

              {state.nrtSelection.useOralForm && (
                <SelectInput
                  label="Oral NRT Type"
                  value={state.nrtSelection.oralFormType}
                  onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "oralFormType", value: v })}
                  options={[
                    { value: "gum", label: "Gum (2mg or 4mg)" },
                    { value: "lozenge", label: "Lozenge (1mg, 2mg, or 4mg)" },
                    { value: "inhalator", label: "Inhalator" },
                    { value: "nasal-spray", label: "Nasal spray" },
                    { value: "mouth-spray", label: "Mouth spray" },
                  ]}
                  required
                />
              )}

              <Checkbox
                label="Combination therapy recommended"
                checked={state.nrtSelection.combinationTherapy}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "combinationTherapy", value: v })}
                description="Patch + oral form is more effective than single form"
              />

              <Checkbox
                label="Behavioral/psychological support arranged"
                checked={state.nrtSelection.behavioralSupport}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "behavioralSupport", value: v })}
                description="Essential for quit success"
              />
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Counselling"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling covered:</p>
              <Checkbox
                label="Combination therapy is more effective than single NRT form"
                checked={state.counselling.combinationBetter}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "combinationBetter", value: v })}
              />
              <Checkbox
                label="Quit date set and discussed"
                checked={state.counselling.quitDate}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "quitDate", value: v })}
              />
              <Checkbox
                label="Behavioral/psychological support offered alongside NRT"
                checked={state.counselling.behavioralSupport}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "behavioralSupport", value: v })}
              />
              <Checkbox
                label="Common side effects explained (skin irritation with patches, hiccups with gum)"
                checked={state.counselling.sideEffects}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })}
              />
              <Checkbox
                label="8–12 week course duration explained; step-down approach"
                checked={state.counselling.courseDuration}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "courseDuration", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Summary"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })}
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })}
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })}
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })}
              />
              <TextArea
                label="Clinical notes (optional)"
                value={state.summary.clinicalNotes}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              />
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 print:px-0 print:py-0">
        <div className="print:hidden space-y-6">
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={state.currentStep}
            onStepClick={handleSetStep}
            completedSteps={completedSteps}
            hasErrors={!!validationError}
          />
          {renderCurrentStep()}
        </div>

        <div className="hidden print:block">
          <SmokingNRTSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

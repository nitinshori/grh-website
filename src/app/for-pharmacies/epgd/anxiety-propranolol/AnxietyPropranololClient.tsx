"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  AnxietyPropranololConsultationState,
  AnxietyPropranololAction,
  AnxietyPropranololPatientDetails,
  AnxietyAssessment,
  AnxietyMedicalHistory,
  AnxietyContraindications,
  AnxietyMedicineSupply,
  AnxietyCounselling,
  AnxietyConsultationSummary,
} from "./lib/anxiety-propranolol-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/anxiety-propranolol-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/anxiety-propranolol-clinical-logic";
import { validateStep } from "./lib/anxiety-propranolol-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { AnxietyPropranololSummaryReport } from "./components/AnxietyPropranololSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: AnxietyPropranololConsultationState, action: AnxietyPropranololAction): AnxietyPropranololConsultationState {
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

export default function AnxietyPropranololClient() {
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
            title="Anxiety Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <SelectInput
                label="Anxiety Type"
                value={state.assessment.anxietyType}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "anxietyType", value: v })}
                options={[
                  { value: "situational", label: "Situational (exam, public speaking, performance)" },
                  { value: "generalized", label: "Generalised anxiety disorder" },
                  { value: "social", label: "Social anxiety" },
                ]}
                required
              />

              <TextArea
                label="Trigger Situation"
                value={state.assessment.triggerSituation}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "triggerSituation", value: v })}
                placeholder="e.g., Presentations at work, university exams, public speaking events"
                required
              />

              <TextArea
                label="Physical Symptoms When Anxious"
                value={state.assessment.physicalSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "physicalSymptoms", value: v })}
                placeholder="e.g., Tremor, palpitations, sweating, dry mouth"
                required
              />

              <TextInput
                label="Frequency of Events"
                value={state.assessment.frequencyOfEvents}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "frequencyOfEvents", value: v })}
                placeholder="e.g., Several times per year, monthly presentations"
              />
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
                label="Asthma or COPD with bronchospasm"
                checked={state.medicalHistory.asthmaOrCOPD}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "asthmaOrCOPD", value: v })}
              />

              <Checkbox
                label="Cardiac conduction disorder"
                checked={state.medicalHistory.cardiacConduction}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cardiacConduction", value: v })}
              />

              <Checkbox
                label="Bradycardia (resting HR &lt;50 bpm)"
                checked={state.medicalHistory.bradycardia}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bradycardia", value: v })}
              />

              <Checkbox
                label="Heart failure (any grade)"
                checked={state.medicalHistory.heartFailure}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "heartFailure", value: v })}
              />

              <Checkbox
                label="Prinzmetal's angina (vasospastic angina)"
                checked={state.medicalHistory.prinzmetalsAngina}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "prinzmetalsAngina", value: v })}
              />

              <Checkbox
                label="Pheochromocytoma"
                checked={state.medicalHistory.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pheochromocytoma", value: v })}
              />

              <Checkbox
                label="Diabetes mellitus"
                checked={state.medicalHistory.diabetes}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })}
              />

              <Checkbox
                label="Raynaud's syndrome"
                checked={state.medicalHistory.raynauds}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "raynauds", value: v })}
              />

              <Checkbox
                label="Hepatic impairment"
                checked={state.medicalHistory.hepaticImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hepaticImpairment", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Current Medications"
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
              placeholder="e.g., Sertraline 50mg daily, Venlafaxine 150mg daily, Metformin 1g BD"
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
                label="Asthma/COPD with bronchospasm"
                checked={state.contraindications.asthmaWithBronchospasm}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "asthmaWithBronchospasm", value: v })}
              />

              <Checkbox
                label="2nd or 3rd degree heart block"
                checked={state.contraindications.heartBlock}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "heartBlock", value: v })}
              />

              <Checkbox
                label="Bradycardia (HR &lt;50 bpm)"
                checked={state.contraindications.severeBradycardia}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "severeBradycardia", value: v })}
              />

              <Checkbox
                label="Uncontrolled heart failure (NYHA III–IV)"
                checked={state.contraindications.uncontrolledHeartFailure}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "uncontrolledHeartFailure", value: v })}
              />

              <Checkbox
                label="Prinzmetal's angina"
                checked={state.contraindications.prinzmetalsAngina}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "prinzmetalsAngina", value: v })}
              />

              <Checkbox
                label="Pheochromocytoma (not alpha-blocked)"
                checked={state.contraindications.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pheochromocytoma", value: v })}
              />

              <Checkbox
                label="Patient under 12 years old"
                checked={state.contraindications.childUnder12}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Medicine Supply"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <div className="p-3 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                <p className="text-sm font-medium text-navy-900">Propranolol 10–40mg PRN</p>
                <p className="text-xs text-gray-600 mt-1">Take 30–60 minutes before anxiety-provoking situation. For situational anxiety only.</p>
              </div>

              <NumberInput
                label="Quantity to Supply"
                value={state.medicineSupply.quantity}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: v })}
                min={1}
                max={100}
                placeholder="e.g., 10 tablets"
                unit="tablets"
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
                label="PRN use only — not for daily use or long-term"
                checked={state.counselling.prnUseOnly}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prnUseOnly", value: v })}
              />
              <Checkbox
                label="Reduces physical anxiety symptoms (tremor, palpitations, sweating)"
                checked={state.counselling.physicalSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "physicalSymptoms", value: v })}
              />
              <Checkbox
                label="Does NOT cause dependence at PRN doses"
                checked={state.counselling.noDependence}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noDependence", value: v })}
              />
              <Checkbox
                label="Do NOT stop suddenly if used regularly"
                checked={state.counselling.noSuddenWithdrawal}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noSuddenWithdrawal", value: v })}
              />
              <Checkbox
                label="Do NOT use with verapamil (severe bradycardia risk)"
                checked={state.counselling.avoidVerapamil}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidVerapamil", value: v })}
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
          <AnxietyPropranololSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

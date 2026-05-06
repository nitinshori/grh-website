"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  AlcoholReductionConsultationState,
  AlcoholReductionAction,
  AlcoholReductionPatientDetails,
  AlcoholAssessment,
  AlcoholMedicalHistory,
  AlcoholContraindications,
  AlcoholMedicineSupply,
  AlcoholCounselling,
  AlcoholConsultationSummary,
} from "./lib/alcohol-reduction-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/alcohol-reduction-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/alcohol-reduction-clinical-logic";
import { validateStep } from "./lib/alcohol-reduction-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { AlcoholReductionSummaryReport } from "./components/AlcoholReductionSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: AlcoholReductionConsultationState, action: AlcoholReductionAction): AlcoholReductionConsultationState {
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

export default function AlcoholReductionClient() {
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
            title="Alcohol Assessment (AUDIT)"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <NumberInput
                label="AUDIT Score (0–40)"
                value={state.assessment.auditScore}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "auditScore", value: v })}
                min={0}
                max={40}
                placeholder="e.g., 18"
                unit="points"
              />

              <NumberInput
                label="Alcohol consumption (units per week)"
                value={state.assessment.unitPerWeek}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "unitPerWeek", value: v })}
                min={1}
                placeholder="e.g., 35"
                unit="units/week"
              />

              <Checkbox
                label="Patient reports binge drinking"
                checked={state.assessment.bingeDrinking}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bingeDrinking", value: v })}
                description="6+ units on a single occasion"
              />

              <SelectInput
                label="Dependence Level"
                value={state.assessment.dependenceLevel}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dependenceLevel", value: v })}
                options={[
                  { value: "mild", label: "Mild dependence" },
                  { value: "moderate", label: "Moderate dependence" },
                  { value: "high", label: "High dependence" },
                ]}
                required
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
                label="Recent alcohol withdrawal (within 2 weeks)"
                checked={state.medicalHistory.recentWithdrawal}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentWithdrawal", value: v })}
              />

              <Checkbox
                label="Hepatic impairment (liver disease)"
                checked={state.medicalHistory.hepaticImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hepaticImpairment", value: v })}
              />

              <Checkbox
                label="Renal impairment (kidney disease)"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })}
              />

              <Checkbox
                label="Psychiatric comorbidity"
                checked={state.medicalHistory.psychiatricComorbidity}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "psychiatricComorbidity", value: v })}
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
              placeholder="e.g., Sertraline 50mg daily, Paracetamol PRN"
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
                label="Patient currently taking opioids"
                checked={state.contraindications.opioidUse}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "opioidUse", value: v })}
              />

              <Checkbox
                label="Patient has opioid dependence history"
                checked={state.contraindications.opioidDependence}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "opioidDependence", value: v })}
              />

              <Checkbox
                label="Severe hepatic impairment (Child-Pugh C)"
                checked={state.contraindications.severeHepaticImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "severeHepaticImpairment", value: v })}
              />

              <Checkbox
                label="Severe renal impairment (eGFR &lt;15)"
                checked={state.contraindications.severeRenalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "severeRenalImpairment", value: v })}
              />

              <Checkbox
                label="Active alcohol withdrawal"
                checked={state.contraindications.activeWithdrawal}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "activeWithdrawal", value: v })}
              />

              <Checkbox
                label="Patient under 18 years old"
                checked={state.contraindications.childUnder18}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder18", value: v })}
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
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-sm font-medium text-navy-900">Nalmefene 18mg</p>
                <p className="text-xs text-gray-600 mt-1">PRN (as needed) — 1–2 hours before anticipated drinking. Maximum 1 tablet per day.</p>
              </div>

              <NumberInput
                label="Quantity to Supply"
                value={state.medicineSupply.quantity}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: v })}
                min={1}
                max={100}
                placeholder="e.g., 30 tablets"
                unit="tablets"
              />

              <Checkbox
                label="Psychosocial/behavioral support arranged"
                checked={state.medicineSupply.psychosocialSupport}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "psychosocialSupport", value: v })}
                description="Essential alongside medication for best outcomes"
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
                label="PRN dosing — not daily tablet"
                checked={state.counselling.prnDosing}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prnDosing", value: v })}
              />
              <Checkbox
                label="Take 1–2 hours before anticipated drinking"
                checked={state.counselling.beforeDrinking}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "beforeDrinking", value: v })}
              />
              <Checkbox
                label="Reduces reward &amp; craving (not for abstinence)"
                checked={state.counselling.rewardMechanism}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "rewardMechanism", value: v })}
              />
              <Checkbox
                label="Does NOT cause disulfiram-like reaction with alcohol"
                checked={state.counselling.noDisulfiramReaction}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noDisulfiramReaction", value: v })}
              />
              <Checkbox
                label="MUST avoid opioids — blocks effect &amp; causes withdrawal"
                checked={state.counselling.avoidOpioids}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidOpioids", value: v })}
              />
              <Checkbox
                label="Continue psychosocial/behavioral support alongside medication"
                checked={state.counselling.psychosocialSupport}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "psychosocialSupport", value: v })}
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
          <AlcoholReductionSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

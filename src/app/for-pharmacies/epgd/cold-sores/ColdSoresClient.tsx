"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  ColdSoresConsultationState,
  ColdSoresAction,
  ColdSoresPatientDetails,
  ColdSoresSymptomAssessment,
  ColdSoresMedicalHistory,
  ColdSoresContraindications,
  ColdSoresMedicineSupply,
  ColdSoresCounselling,
  ColdSoresConsultationSummary,
} from "./lib/cold-sores-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/cold-sores-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/cold-sores-clinical-logic";
import { validateStep } from "./lib/cold-sores-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { ColdSoresSummaryReport } from "./components/ColdSoresSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: ColdSoresConsultationState, action: ColdSoresAction): ColdSoresConsultationState {
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

    case "UPDATE_SYMPTOM_ASSESSMENT":
      newState.symptomAssessment = {
        ...newState.symptomAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = {
        ...newState.contraindications,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = {
        ...newState.medicineSupply,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_COUNSELLING":
      newState.counselling = {
        ...newState.counselling,
        [action.field]: action.value,
      };
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

// ─── Main Component ───

export default function ColdSoresClient() {
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
  const canProceed = !validationError && (!hasStops || state.currentStep >= 5);

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
            title="Symptom Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  label="This is a recurrent episode of herpes labialis"
                  checked={state.symptomAssessment.isRecurrent}
                  onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "isRecurrent", value: v })}
                  description="PGD is for patients with previous diagnoses of recurrent cold sores"
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Checkbox
                  label="This is the first suspected episode of herpes labialis"
                  checked={state.symptomAssessment.isFirstEpisode}
                  onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "isFirstEpisode", value: v })}
                  description="If ticked, referral to GP for diagnosis is recommended"
                />
              </div>

              <TextArea
                label="Current Symptoms"
                value={state.symptomAssessment.currentSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "currentSymptoms", value: v })}
                placeholder="e.g., Tingling &amp; mild pain at lip border; no vesicles visible yet"
                required
              />

              <Checkbox
                label="Patient reports prodrome signs (tingling, burning)"
                checked={state.symptomAssessment.prodromeSigns}
                onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "prodromeSigns", value: v })}
              />

              {state.symptomAssessment.prodromeSigns && (
                <NumberInput
                  label="Hours since prodrome onset"
                  value={state.symptomAssessment.hoursFromProdrome}
                  onChange={(v) => dispatch({ type: "UPDATE_SYMPTOM_ASSESSMENT", field: "hoursFromProdrome", value: v })}
                  min={0}
                  max={48}
                  placeholder="e.g., 6"
                  unit="hours"
                />
              )}
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
            <div className="space-y-4">
              <Checkbox
                label="Patient is currently immunosuppressed"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunosuppressed", value: v })}
                description="On immunosuppressive therapy (biologics, corticosteroids, chemotherapy, etc.)"
              />

              <Checkbox
                label="Patient recently became immunosuppressed (within 2 weeks)"
                checked={state.medicalHistory.recentlyImmunosuppressed}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentlyImmunosuppressed", value: v })}
              />

              <Checkbox
                label="Patient has renal impairment"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })}
              />

              {state.medicalHistory.renalImpairment && (
                <TextArea
                  label="Renal Function Status (eGFR/creatinine)"
                  value={state.medicalHistory.renalFunction}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalFunction", value: v })}
                  placeholder="e.g., eGFR 35 mL/min (mild–moderate impairment); creatinine 1.5× baseline"
                  required
                />
              )}
            </div>
          </StepWrapper>
        );

      case 4:
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
                label="Patient is pregnant"
                checked={state.contraindications.pregnant}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnant", value: v })}
              />

              <Checkbox
                label="Patient is severely immunosuppressed"
                checked={state.contraindications.immunosuppressed}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "immunosuppressed", value: v })}
              />

              <Checkbox
                label="Patient is under 12 years old"
                checked={state.contraindications.childUnder12}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })}
              />

              <Checkbox
                label="Patient has severe renal impairment (eGFR &lt;10 mL/min)"
                checked={state.contraindications.renalImpairmentSevere}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "renalImpairmentSevere", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 5:
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
              <SelectInput
                label="Aciclovir Dose"
                value={state.medicineSupply.doseChoice}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "doseChoice", value: v })}
                options={[
                  { value: "400", label: "400mg (standard)" },
                  { value: "200", label: "200mg (lower dose option)" },
                ]}
                required
              />

              <NumberInput
                label="Quantity to Supply"
                value={state.medicineSupply.quantity}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: v })}
                min={1}
                max={100}
                placeholder="e.g., 25 tablets for 5-day course"
                unit="tablets"
              />

              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-sm font-medium text-navy-900">Dosing:</p>
                <p className="text-xs text-gray-600 mt-1">
                  {state.medicineSupply.doseChoice} mg 5 times daily for 5 days (total {state.medicineSupply.quantity || "—"} tablets)
                </p>
              </div>
            </div>
          </StepWrapper>
        );

      case 6:
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
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling points covered:</p>
              <Checkbox
                label="Start ASAP — take at first tingle (prodrome)"
                checked={state.counselling.startASAP}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "startASAP", value: v })}
              />
              <Checkbox
                label="Complete full 5-day course"
                checked={state.counselling.completeCourse}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completeCourse", value: v })}
              />
              <Checkbox
                label="Contagious until lesions fully crusted over"
                checked={state.counselling.contagious}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "contagious", value: v })}
              />
              <Checkbox
                label="Avoid kissing, sharing utensils, toothbrush"
                checked={state.counselling.avoidSharing}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidSharing", value: v })}
              />
              <Checkbox
                label="Sun exposure is a known trigger"
                checked={state.counselling.sunExposure}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sunExposure", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 7:
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
          <ColdSoresSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  AcneConsultationState,
  AcneAction,
  AcnePatientDetails,
  AcneAssessment,
  AcneMedicalHistory,
  AcneContraindications,
  AcneMedicineSelection,
  AcneCounselling,
  AcneConsultationSummary,
} from "./lib/acne-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/acne-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  getMedicineOptions,
} from "./lib/acne-clinical-logic";
import { validateStep } from "./lib/acne-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { AcneSummaryReport } from "./components/AcneSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: AcneConsultationState, action: AcneAction): AcneConsultationState {
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
      newState.assessment = {
        ...newState.assessment,
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

    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = {
        ...newState.medicineSelection,
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

export default function AcneClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Compute alerts and recommendations
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);
  const medicineOptions = useMemo(() => getMedicineOptions(state.assessment.severity), [state.assessment.severity]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  // Validation for current step
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);

  // Can proceed to next step?
  const canProceed = !validationError && (!hasStops || state.currentStep >= 5);

  // Mark step as completed
  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  // Step handlers
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

  // Handle patient field change
  const handlePatientChange = (field: keyof AcnePatientDetails, value: any) => {
    dispatch({ type: "UPDATE_PATIENT", field, value });
  };

  // Handle consent field change
  const handleConsentChange = (field: keyof (typeof state.consent), value: any) => {
    dispatch({ type: "UPDATE_CONSENT", field, value });
  };

  // Handle assessment field change
  const handleAssessmentChange = (field: keyof AcneAssessment, value: any) => {
    dispatch({ type: "UPDATE_ASSESSMENT", field, value });
  };

  // Handle medical history field change
  const handleMedicalHistoryChange = (field: keyof AcneMedicalHistory, value: any) => {
    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field, value });
  };

  // Handle contraindications field change
  const handleContraindicationsChange = (field: keyof AcneContraindications, value: any) => {
    dispatch({ type: "UPDATE_CONTRAINDICATIONS", field, value });
  };

  // Handle medicine selection field change
  const handleMedicineSelectionChange = (field: keyof AcneMedicineSelection, value: any) => {
    dispatch({ type: "UPDATE_MEDICINE_SELECTION", field, value });
  };

  // Handle counselling field change
  const handleCounsellingChange = (field: keyof AcneCounselling, value: any) => {
    dispatch({ type: "UPDATE_COUNSELLING", field, value });
  };

  // Handle summary field change
  const handleSummaryChange = (field: keyof AcneConsultationSummary, value: any) => {
    dispatch({ type: "UPDATE_SUMMARY", field, value });
  };

  // Render appropriate step
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
            <PatientDetailsStep patient={state.patient} onChange={handlePatientChange} />
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
            <div className="space-y-4">
              <ConsentStep consent={state.consent} onChange={handleConsentChange} />
              <Checkbox
                label="Patient is female (or able to become pregnant)"
                checked={state.consent.femaleConfirmed}
                onChange={(v) => handleConsentChange("femaleConfirmed", v)}
                description="Required to ensure retinoid safety — retinoids are teratogenic."
              />
            </div>
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Acne Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <SelectInput
                label="Acne Severity"
                value={state.assessment.severity}
                onChange={(v) => handleAssessmentChange("severity", v)}
                options={[
                  { value: "mild", label: "Mild (comedonal only)" },
                  { value: "moderate", label: "Moderate (inflammatory papules/pustules)" },
                  { value: "severe", label: "Severe (nodular/cystic — refer)" },
                ]}
                required
              />

              {state.assessment.severity && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-navy-900">Acne Manifestations</p>
                  <Checkbox
                    label="Comedones (blackheads/whiteheads)"
                    checked={state.assessment.comedones}
                    onChange={(v) => handleAssessmentChange("comedones", v)}
                  />
                  <Checkbox
                    label="Inflammatory papules"
                    checked={state.assessment.inflammatoryPapules}
                    onChange={(v) => handleAssessmentChange("inflammatoryPapules", v)}
                  />
                  <Checkbox
                    label="Pustules"
                    checked={state.assessment.pustules}
                    onChange={(v) => handleAssessmentChange("pustules", v)}
                  />
                  <Checkbox
                    label="Nodular/cystic lesions"
                    checked={state.assessment.nodalCystic}
                    onChange={(v) => handleAssessmentChange("nodalCystic", v)}
                  />
                </div>
              )}

              <TextArea
                label="Affected Area (location, extent)"
                value={state.assessment.affectedArea}
                onChange={(v) => handleAssessmentChange("affectedArea", v)}
                placeholder="e.g., Face, T-zone; mild distribution; approximately 30% face coverage"
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
            <div className="space-y-4">
              <TextArea
                label="Previous acne treatments"
                value={state.medicalHistory.previousTreatments}
                onChange={(v) => handleMedicalHistoryChange("previousTreatments", v)}
                placeholder="e.g., Topical benzoyl peroxide 2.5% (2021), no systemic treatments"
              />

              <TextArea
                label="Allergies/Sensitivities"
                value={state.medicalHistory.allergies}
                onChange={(v) => handleMedicalHistoryChange("allergies", v)}
                placeholder="e.g., NKDA, or penicillin allergy if considering antibiotics"
                required
              />

              <Checkbox
                label="Known sensitivity to retinoids"
                checked={state.medicalHistory.sensitiveToRetinoids}
                onChange={(v) => handleMedicalHistoryChange("sensitiveToRetinoids", v)}
                description="Extreme dryness, irritation, or rash with previous retinoid use"
              />
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
                onChange={(v) => handleContraindicationsChange("pregnant", v)}
                description="Retinoids are teratogenic. ABSOLUTE contraindication."
              />

              <Checkbox
                label="Patient is breastfeeding"
                checked={state.contraindications.breastfeeding}
                onChange={(v) => handleContraindicationsChange("breastfeeding", v)}
                description="Adapalene passes into breast milk. ABSOLUTE contraindication."
              />

              <Checkbox
                label="Patient under 12 years old"
                checked={state.contraindications.ageUnder12}
                onChange={(v) => handleContraindicationsChange("ageUnder12", v)}
                description="This PGD is for patients aged 12+."
              />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Medicine Selection"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              {state.assessment.severity === "mild" && (
                <>
                  <SelectInput
                    label="Medicine Choice"
                    value={state.medicineSelection.medicineChoice}
                    onChange={(v) => handleMedicineSelectionChange("medicineChoice", v)}
                    options={[
                      { value: "adapalene", label: "Adapalene 0.1% gel OD" },
                      { value: "benzoyl-peroxide", label: "Benzoyl peroxide 5% gel OD" },
                    ]}
                    required
                  />
                  <Checkbox
                    label="Inadequate response to monotherapy after 6–8 weeks"
                    checked={state.medicineSelection.inadequateResponse}
                    onChange={(v) => handleMedicineSelectionChange("inadequateResponse", v)}
                  />
                </>
              )}

              {state.assessment.severity === "moderate" && (
                <>
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <p className="text-sm font-medium text-navy-900">Recommended: Epiduo</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Adapalene 0.1%/Benzoyl peroxide 2.5% combination gel — apply once daily
                    </p>
                  </div>
                  <SelectInput
                    label="Confirm selection"
                    value={state.medicineSelection.medicineChoice}
                    onChange={(v) => handleMedicineSelectionChange("medicineChoice", v)}
                    options={[{ value: "epiduo", label: "Epiduo (Adapalene/BP combination)" }]}
                    required
                  />
                  <Checkbox
                    label="Inadequate response after 6–8 weeks — add Lymecycline"
                    checked={state.medicineSelection.inadequateResponse}
                    onChange={(v) => handleMedicineSelectionChange("inadequateResponse", v)}
                  />
                  {state.medicineSelection.inadequateResponse && (
                    <Checkbox
                      label="Add Lymecycline 408mg OD for 12 weeks"
                      checked={state.medicineSelection.addLymecycline}
                      onChange={(v) => handleMedicineSelectionChange("addLymecycline", v)}
                    />
                  )}
                </>
              )}
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
                label="Takes 6–8 weeks to see improvement"
                checked={state.counselling.improvementTimeline}
                onChange={(v) => handleCounsellingChange("improvementTimeline", v)}
              />
              <Checkbox
                label="Photosensitivity warning (retinoids increase UV sensitivity)"
                checked={state.counselling.photosensitivity}
                onChange={(v) => handleCounsellingChange("photosensitivity", v)}
              />
              <Checkbox
                label="Avoid excess washing; gentle cleanser only"
                checked={state.counselling.washingAdvice}
                onChange={(v) => handleCounsellingChange("washingAdvice", v)}
              />
              <Checkbox
                label="Use non-comedogenic skincare products"
                checked={state.counselling.productAdvice}
                onChange={(v) => handleCounsellingChange("productAdvice", v)}
              />
              <Checkbox
                label="Complete full course (do not stop early)"
                checked={state.counselling.courseCompletion}
                onChange={(v) => handleCounsellingChange("courseCompletion", v)}
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
          >
            <div className="space-y-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) => handleSummaryChange("pharmacistName", v)}
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) => handleSummaryChange("pharmacistGPhC", v)}
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) => handleSummaryChange("pharmacyName", v)}
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) => handleSummaryChange("pharmacyAddress", v)}
              />
              <TextArea
                label="Clinical notes (optional)"
                value={state.summary.clinicalNotes}
                onChange={(v) => handleSummaryChange("clinicalNotes", v)}
                placeholder="Any additional clinical observations or follow-up recommendations"
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
        {/* Only show progress bar and steps if not printing */}
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

        {/* Print view — show summary report */}
        <div className="hidden print:block">
          <AcneSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  EczemaConsultationState,
  EczemaAction,
  EczemaPatientDetails,
  EczemaAssessment,
  EczemaMedicalHistory,
  EczemaContraindications,
  EczemaMedicineSelection,
  EczemaCounselling,
  EczemaConsultationSummary,
} from "./lib/eczema-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/eczema-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/eczema-clinical-logic";
import { validateStep } from "./lib/eczema-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { EczemaSummaryReport } from "./components/EczemaSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: EczemaConsultationState, action: EczemaAction): EczemaConsultationState {
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

export default function EczemaClient() {
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
            title="Eczema Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <SelectInput
                label="Eczema Severity"
                value={state.assessment.severity}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "severity", value: v })}
                options={[
                  { value: "mild", label: "Mild (dry, occasional itch)" },
                  { value: "moderate", label: "Moderate (red, frequent itch, thickened)" },
                  { value: "severe", label: "Severe (extensive, cracked, oozing — refer)" },
                ]}
                required
              />

              {state.assessment.severity && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-navy-900">Eczema Manifestations</p>
                  <Checkbox
                    label="Dry skin"
                    checked={state.assessment.isDry}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isDry", value: v })}
                  />
                  <Checkbox
                    label="Red/inflamed"
                    checked={state.assessment.isRed}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isRed", value: v })}
                  />
                  <Checkbox
                    label="Thickened skin"
                    checked={state.assessment.isThickened}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isThickened", value: v })}
                  />
                  <Checkbox
                    label="Cracked"
                    checked={state.assessment.isCracked}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isCracked", value: v })}
                  />
                  <Checkbox
                    label="Oozing/weeping"
                    checked={state.assessment.isOozing}
                    onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "isOozing", value: v })}
                  />
                </div>
              )}

              <TextArea
                label="Affected Site(s)"
                value={state.assessment.affectedSite}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "affectedSite", value: v })}
                placeholder="e.g., Arms, neck; spares face and groin. Approximately 20% body surface area."
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
                label="Previous eczema treatments"
                value={state.medicalHistory.previousTreatments}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "previousTreatments", value: v })}
                placeholder="e.g., Hydrocortisone 1% cream (previous month), emollients"
              />

              <TextArea
                label="Allergies/Sensitivities"
                value={state.medicalHistory.allergies}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "allergies", value: v })}
                placeholder="e.g., NKDA, reaction to lanolin"
                required
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
                label="Bacterial infection present"
                checked={state.contraindications.bacterialInfection}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "bacterialInfection", value: v })}
              />

              <Checkbox
                label="Viral infection (suspected eczema herpeticum)"
                checked={state.contraindications.viralInfection}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "viralInfection", value: v })}
              />

              <Checkbox
                label="Affected site includes face or groin"
                checked={state.contraindications.faceOrGroin}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "faceOrGroin", value: v })}
              />

              <Checkbox
                label="Child under 1 year old"
                checked={state.contraindications.childUnder1}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder1", value: v })}
              />

              <Checkbox
                label="Rosacea or acne at treatment site"
                checked={state.contraindications.rosaceaOrAcne}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "rosaceaOrAcne", value: v })}
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
              <Checkbox
                label="Emollient confirmed as base of treatment"
                checked={state.medicineSelection.emollientFirst}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "emollientFirst", value: v })}
                description="Emollients are most important; apply frequently (every 2–3 hours)"
              />

              {state.assessment.severity === "mild" && (
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-sm font-medium text-navy-900">Hydrocortisone 1% OD–BD</p>
                  <p className="text-xs text-gray-600 mt-1">Recommended for mild eczema flares (max 7 days)</p>
                </div>
              )}

              {state.assessment.severity === "moderate" && (
                <SelectInput
                  label="Steroid Strength"
                  value={state.medicineSelection.steroidChoice}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "steroidChoice", value: v })}
                  options={[
                    { value: "betamethasone", label: "Betamethasone valerate 0.025%" },
                    { value: "clobetasone", label: "Clobetasone butyrate 0.05% (Eumovate)" },
                  ]}
                  required
                />
              )}

              <Checkbox
                label="Suspected secondary bacterial infection"
                checked={state.medicineSelection.hasFungalInfection}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "hasFungalInfection", value: v })}
              />

              {state.medicineSelection.hasFungalInfection && (
                <Checkbox
                  label="Add Fusidic acid 2% cream TDS for 7 days"
                  checked={state.medicineSelection.addFusicidAcid}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "addFusicidAcid", value: v })}
                />
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
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling covered:</p>
              <Checkbox
                label="Emollient is most important — apply frequently as prevention"
                checked={state.counselling.emollientFirst}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "emollientFirst", value: v })}
              />
              <Checkbox
                label="Fingertip unit dosing for steroids"
                checked={state.counselling.fingertipUnits}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "fingertipUnits", value: v })}
              />
              <Checkbox
                label="Apply steroid thinly (avoid overuse)"
                checked={state.counselling.applyThinly}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "applyThinly", value: v })}
              />
              <Checkbox
                label="Step-down approach (reduce frequency as improves)"
                checked={state.counselling.stepDownApproach}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "stepDownApproach", value: v })}
              />
              <Checkbox
                label="Avoid known triggers (irritants, allergens)"
                checked={state.counselling.avoidTriggers}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidTriggers", value: v })}
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
          <EczemaSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

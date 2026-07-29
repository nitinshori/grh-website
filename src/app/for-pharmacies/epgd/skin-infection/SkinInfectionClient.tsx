"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  SkinInfectionConsultationState,
  SkinInfectionAction,
} from "./lib/skin-infection-types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialConsultationState,
} from "./lib/skin-infection-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/skin-infection-logic";
import { validateStep } from "./lib/skin-infection-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { SkinInfectionSummaryReport } from "./components/SkinInfectionSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(
  state: SkinInfectionConsultationState,
  action: SkinInfectionAction,
): SkinInfectionConsultationState {
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
    case "UPDATE_ANTIBIOTIC_SELECTION":
      newState.antibioticSelection = {
        ...newState.antibioticSelection,
        [action.field]: action.value,
      };
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

export default function SkinInfectionClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
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

  const validationError = useMemo(
    () => validateStep(state.currentStep, state),
    [state.currentStep, state],
  );
  // Hard stops block progression beyond antibiotic selection; the record
  // can still be completed as "not supplied" from the summary step.
  const canProceed = !validationError && (!hasStops || state.currentStep >= 4);

  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  const handleNextStep = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };
  const handlePrevStep = () => dispatch({ type: "PREV_STEP" });
  const handleSetStep = (step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

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

  const mh = state.medicalHistory;
  const choice = state.antibioticSelection.choice;

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
              requireAdult={false}
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
            title="Infection Assessment"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <AlertBanner alerts={alerts} />
              <SelectInput
                label="Infection type"
                value={state.assessment.infectionType}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "infectionType", value: v })}
                options={[
                  { value: "impetigo", label: "Impetigo" },
                  { value: "folliculitis", label: "Folliculitis" },
                  { value: "infected-eczema", label: "Infected eczema" },
                  { value: "infected-wound", label: "Infected wound" },
                  { value: "cellulitis", label: "Cellulitis / erysipelas (mild, well demarcated)" },
                ]}
                required
              />
              <SelectInput
                label="Severity"
                value={state.assessment.severity}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "severity", value: v })}
                options={[
                  { value: "mild", label: "Mild — localised, patient well" },
                  { value: "moderate", label: "Moderate — larger area, patient well" },
                  { value: "severe", label: "Severe — extensive or patient unwell (refer)" },
                ]}
                required
              />
              <TextInput
                label="Affected site"
                value={state.assessment.affectedSite}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "affectedSite", value: v })}
                placeholder="e.g. left lower leg, 4 x 3 cm area"
                required
              />
              <TextInput
                label="Duration (days)"
                value={state.assessment.durationDays}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "durationDays", value: v })}
                placeholder="e.g. 3"
                required
              />
              <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-navy-900">Red flags</p>
                <Checkbox
                  label="Systemic symptoms (fever, rigors, malaise, feels unwell)"
                  checked={state.assessment.systemicSymptoms}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "systemicSymptoms", value: v })}
                />
                <Checkbox
                  label="Rapidly spreading erythema"
                  checked={state.assessment.spreadingRapidly}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "spreadingRapidly", value: v })}
                />
                <Checkbox
                  label="Abscess suspected (fluctuant collection needing drainage)"
                  checked={state.assessment.abscessSuspected}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "abscessSuspected", value: v })}
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
            <div className="space-y-4">
              <AlertBanner alerts={alerts} />
              <TextInput
                label="Allergies"
                value={mh.allergies}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "allergies", value: v })}
                placeholder="Record all drug allergies, or NKDA"
                required
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <Checkbox
                  label="Penicillin / beta-lactam allergy"
                  checked={mh.penicillinAllergy}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "penicillinAllergy", value: v })}
                />
                <Checkbox
                  label="Macrolide allergy"
                  checked={mh.macrolideAllergy}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "macrolideAllergy", value: v })}
                />
                <Checkbox
                  label="Tetracycline allergy"
                  checked={mh.tetracyclineAllergy}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "tetracyclineAllergy", value: v })}
                />
                <Checkbox
                  label="Pregnant"
                  checked={mh.pregnant}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnant", value: v })}
                />
                <Checkbox
                  label="Breastfeeding"
                  checked={mh.breastfeeding}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })}
                />
                <Checkbox
                  label="Immunosuppressed"
                  checked={mh.immunosuppressed}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunosuppressed", value: v })}
                />
                <Checkbox
                  label="Previous flucloxacillin jaundice / hepatic dysfunction"
                  checked={mh.flucloxHepaticHistory}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "flucloxHepaticHistory", value: v })}
                />
                <Checkbox
                  label="Severe renal failure (CrCl < 10 ml/min)"
                  checked={mh.severeRenalImpairment}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeRenalImpairment", value: v })}
                />
                <Checkbox
                  label="Recent antibiotics or hospitalisation"
                  checked={mh.recentAntibioticsOrHospital}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentAntibioticsOrHospital", value: v })}
                />
                <Checkbox
                  label="Regular paracetamol use"
                  checked={mh.regularParacetamol}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "regularParacetamol", value: v })}
                />
                <Checkbox
                  label="Takes a statin"
                  checked={mh.takesStatin}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "takesStatin", value: v })}
                />
              </div>
              <TextArea
                label="Current medicines (check interactions before supply)"
                value={mh.currentMedicines}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentMedicines", value: v })}
                placeholder="List regular and recent medicines"
              />
              <Checkbox
                label="A clinically significant interaction has been identified (excludes supply)"
                checked={mh.interactingMedicines}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "interactingMedicines", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Antibiotic Selection"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <AlertBanner alerts={alerts} />
              <SelectInput
                label="Antibiotic"
                value={choice}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "choice", value: v })}
                options={[
                  { value: "flucloxacillin", label: "Flucloxacillin (first line)" },
                  { value: "clarithromycin", label: "Clarithromycin (penicillin allergy)" },
                  { value: "doxycycline", label: "Doxycycline (12 years and over)" },
                ]}
                required
              />
              {doseRecommendation && (
                <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                  <p className="text-sm font-semibold text-navy-900">{doseRecommendation.medicine}</p>
                  <p className="text-sm text-gray-800">{doseRecommendation.dose}</p>
                  <p className="text-sm text-gray-800">Course: {doseRecommendation.duration}</p>
                  {doseRecommendation.reason && (
                    <p className="text-xs text-gray-600 mt-1">{doseRecommendation.reason}</p>
                  )}
                </div>
              )}
              <TextInput
                label="Formulation supplied"
                value={state.antibioticSelection.formulation}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "formulation", value: v })}
                placeholder="e.g. 500mg capsules / 250mg/5ml suspension"
              />
              <SelectInput
                label="Course length"
                value={state.antibioticSelection.courseDays}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "courseDays", value: v })}
                options={[
                  { value: "5", label: "5 days" },
                  { value: "7", label: "7 days" },
                ]}
                required
              />
              <TextInput
                label="Quantity supplied"
                value={state.antibioticSelection.quantitySupplied}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "quantitySupplied", value: v })}
                placeholder="e.g. 28 capsules / 100 ml suspension / 8 capsules"
                required
              />
              <TextArea
                label="Clinical rationale"
                value={state.antibioticSelection.rationale}
                onChange={(v) => dispatch({ type: "UPDATE_ANTIBIOTIC_SELECTION", field: "rationale", value: v })}
                placeholder="e.g. first-line choice; penicillin allergy so clarithromycin selected"
              />
            </div>
          </StepWrapper>
        );

      case 5:
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
                label="Complete the full course even if symptoms resolve earlier"
                checked={state.counselling.completeCourse}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completeCourse", value: v })}
              />
              <Checkbox
                label={
                  choice === "flucloxacillin"
                    ? "Take on an empty stomach (1 hour before / 2 hours after food) with a full glass of water; do not lie down straight after"
                    : choice === "doxycycline"
                      ? "Swallow whole while upright with plenty of water; stay upright for 30 minutes"
                      : "Administration advice given for the selected antibiotic"
                }
                checked={state.counselling.administrationAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "administrationAdvice", value: v })}
              />
              <Checkbox
                label="Common side effects discussed (nausea, diarrhoea, abdominal pain, rash) and when to stop and seek help"
                checked={state.counselling.sideEffects}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })}
              />
              <Checkbox
                label="Seek review if not improving within 48–72 hours, or sooner if worsening, spreading, or feeling unwell"
                checked={state.counselling.worseningAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "worseningAdvice", value: v })}
              />
              {choice === "doxycycline" && (
                <Checkbox
                  label="Sun protection advised (photosensitivity with doxycycline)"
                  checked={state.counselling.sunProtection}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sunProtection", value: v })}
                />
              )}
            </div>
          </StepWrapper>
        );

      case 6:
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
              <AlertBanner alerts={alerts} />
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
          <SkinInfectionSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

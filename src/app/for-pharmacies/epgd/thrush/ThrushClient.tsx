"use client";
import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { ThrushConsultationState, ThrushAction } from "./lib/thrush-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/thrush-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/thrush-clinical-logic";
import { validateStep } from "./lib/thrush-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import { ThrushSummaryReport } from "./components/ThrushSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: ThrushConsultationState, action: ThrushAction): ThrushConsultationState {
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

export default function ThrushClient() {
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
          <StepWrapper title="Symptom Assessment" description="Assess for typical vulvovaginal candidiasis symptoms." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-3">
              <Checkbox label="Vulval itching" checked={state.assessment.vulvalItching} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "vulvalItching", value: v })} />
              <Checkbox label="Vulval soreness" checked={state.assessment.vulvalSoreness} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "vulvalSoreness", value: v })} />
              <Checkbox label="Thick white discharge" checked={state.assessment.thickWhiteDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "thickWhiteDischarge", value: v })} />
              <Checkbox label="Dysuria (pain passing urine)" checked={state.assessment.dysuria} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dysuria", value: v })} />
              <Checkbox label="Dyspareunia (pain on intercourse)" checked={state.assessment.dyspareunia} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dyspareunia", value: v })} />
              <div className="border-t pt-4"><p className="text-sm font-semibold text-red-700 mb-3">RED FLAGS - If any present, refer to GP:</p></div>
              <Checkbox label="Blood-stained discharge" checked={state.assessment.bloodStainedDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bloodStainedDischarge", value: v })} description="Not typical of thrush" />
              <Checkbox label="Offensive-smelling discharge" checked={state.assessment.offensiveSmell} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "offensiveSmell", value: v })} description="May indicate BV or STI" />
              <Checkbox label="Fever or pelvic pain" checked={state.assessment.fever || state.assessment.pelvicPain} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "fever", value: v })} />
              <NumberInput label="Number of recurrent episodes (per year)" value={state.assessment.recurrentEpisodes} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "recurrentEpisodes", value: v })} min={0} max={20} />
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Medical History" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <Checkbox label="Diabetes" checked={state.medicalHistory.diabetes} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })} description="Increased thrush risk" />
              <Checkbox label="Currently pregnant" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="Avoid oral fluconazole" />
              <Checkbox label="Currently breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} />
              <Checkbox label="Immunocompromised" checked={state.medicalHistory.immunocompromised} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunocompromised", value: v })} />
              <Checkbox label="Patient under 16 years" checked={state.medicalHistory.ageUnder16} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ageUnder16", value: v })} />
              <Checkbox label="Patient over 60 years" checked={state.medicalHistory.ageOver60} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ageOver60", value: v })} />
              <Checkbox label="First ever episode of thrush" checked={state.medicalHistory.firstEpisode} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "firstEpisode", value: v })} />
              <Checkbox label="Recurrent thrush (4+ per year)" checked={state.medicalHistory.recurrentThrush} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recurrentThrush", value: v })} />
              <TextArea label="Other relevant medical history" value={state.medications.otherMedications} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "otherMedications", value: v })} placeholder="e.g., recent antibiotic use, treatment history" />
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
              <SelectInput label="Treatment" value={state.medicineSelection.medicineChoice} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "medicineChoice", value: v })} options={[{ value: "fluconazole-oral", label: "Fluconazole 150mg single oral dose" }, { value: "clotrimazole-pessary", label: "Clotrimazole 500mg pessary + 1% cream" }]} required />
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Counselling & Patient Education" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-3">
              <Checkbox label="Typical symptoms of thrush explained" checked={state.counselling.typicalSymptoms} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "typicalSymptoms", value: v })} />
              <Checkbox label="Avoid perfumed products" checked={state.counselling.avoidPerfumedProducts} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidPerfumedProducts", value: v })} />
              <Checkbox label="Cotton underwear advised" checked={state.counselling.cottonUnderwear} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "cottonUnderwear", value: v })} />
              <Checkbox label="Complete full course of treatment" checked={state.counselling.completesTreatment} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completesTreatment", value: v })} />
              <Checkbox label="Timeline to relief: 1-3 days" checked={state.counselling.timelineToRelief} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "timelineToRelief", value: v })} />
              <Checkbox label="Advise sexual contacts to seek treatment" checked={state.counselling.sexualContacts} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sexualContacts", value: v })} />
              <Checkbox label="Recurrence management: See GP if recurring" checked={state.counselling.recurrenceAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "recurrenceAdvice", value: v })} />
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={true}
            validationError={null}
            isBlocked={false}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">Review the summary below before printing.</p>
              <ThrushSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
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

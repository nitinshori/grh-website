"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type { RosaceaConsultationState, RosaceaAction } from "./lib/rosacea-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialRosaceaState } from "./lib/rosacea-types";
import { getAllAlerts, hasHardStops } from "./lib/rosacea-clinical-logic";
import { validateStep } from "./lib/rosacea-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";

function reducer(state: RosaceaConsultationState, action: RosaceaAction): RosaceaConsultationState {
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
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      if (action.field !== "contraindicated") {
        newState.contraindications.contraindicated = newState.contraindications.pregnancy || newState.contraindications.underEighteen;
      }
      break;
    case "UPDATE_TREATMENT":
      newState.treatment = { ...newState.treatment, [action.field]: action.value };
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

export default function RosaceaClient() {
  const [state, dispatch] = useReducer(reducer, createInitialRosaceaState());
  const [validationError, setValidationError] = useState<string | null>(null);
  const alerts = useMemo(() => getAllAlerts(state.assessment, state.contraindications), [state.assessment, state.contraindications]);
  const isBlocked = hasHardStops(state.contraindications);

  const handleNext = useCallback(() => {
    if (state.currentStep === 3 && isBlocked) {
      setValidationError("Patient meets exclusion criteria");
      return;
    }
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) });
  }, [state, isBlocked]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, []);

  const canProceed = validateStep(state.currentStep, state) === null;


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
      outcome: isBlocked ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, isBlocked]);

  return (
    <div className="space-y-6">
      <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={state.currentStep === 3 && isBlocked}
       getConsultationData={getConsultationData}>
        {state.currentStep === 0 && (
          <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
        )}

        {state.currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <SelectInput
              label="Rosacea subtype"
              value={state.assessment.subtype}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "subtype", value: v })}
              required
              options={[
                { value: "erythematotelangiectatic", label: "Erythematotelangiectatic (flushing &amp; redness)" },
                { value: "papulopustular", label: "Papulopustular (bumps &amp; pustules)" },
                { value: "phymatous", label: "Phymatous (thickened skin) — REFER" },
              ]}
            />
            {state.assessment.subtype === "phymatous" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">Phymatous rosacea requires specialist assessment. Refer to GP/dermatology.</div>
            )}
            <SelectInput
              label="Severity"
              value={state.assessment.severity}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "severity", value: v })}
              options={[
                { value: "mild", label: "Mild" },
                { value: "moderate", label: "Moderate" },
                { value: "severe", label: "Severe" },
              ]}
            />
            <Checkbox
              label="Flushing present"
              checked={state.assessment.flushing}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "flushing", value: v })}
            />
            <Checkbox
              label="Erythema present"
              checked={state.assessment.erythema}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "erythema", value: v })}
            />
            <Checkbox
              label="Papules/pustules present"
              checked={state.assessment.papulesPostules}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "papulesPostules", value: v })}
            />
            <TextInput
              label="Known triggers"
              value={state.assessment.triggersIdentified}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "triggersIdentified", value: v })}
              placeholder="e.g., alcohol, spicy food, heat, stress"
            />
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-sm text-amber-900 mb-3">Contraindications</h4>
            <Checkbox
              label="Pregnancy"
              checked={state.contraindications.pregnancy}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnancy", value: v })}
              description="Ivermectin contraindicated; use metronidazole if needed"
            />
            <Checkbox
              label="Age &lt; 18 years"
              checked={state.contraindications.underEighteen}
              onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "underEighteen", value: v })}
              description="Refer to specialist"
            />
            {isBlocked && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-semibold">Exclusion criteria met — refer to GP/specialist</div>}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4">
            <SelectInput
              label="Treatment product"
              value={state.treatment.product}
              onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "product", value: v })}
              options={[
                { value: "ivermectin", label: "Ivermectin 1% cream" },
                { value: "metronidazole", label: "Metronidazole 0.75% gel" },
              ]}
            />
            <TextInput
              label="Strength"
              value={state.treatment.strength}
              onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "strength", value: v })}
              placeholder="e.g., 1%, 0.75%"
            />
            <TextInput
              label="Frequency"
              value={state.treatment.frequency}
              onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "frequency", value: v })}
              placeholder="e.g., OD or BD"
            />
            <TextInput label="Duration" value={state.treatment.duration} onChange={(v) => dispatch({ type: "UPDATE_TREATMENT", field: "duration", value: v })} />
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-3">
            <Checkbox
              label="Sun protection SPF 30+ advised"
              checked={state.counselling.sunProtectionAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sunProtectionAdvised", value: v })}
            />
            <Checkbox
              label="Trigger avoidance discussed"
              checked={state.counselling.triggerAvoidanceAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "triggerAvoidanceAdvised", value: v })}
              description="Alcohol, spicy food, hot drinks, etc."
            />
            <Checkbox
              label="Gentle skincare advised"
              checked={state.counselling.skinCareAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "skinCareAdvised", value: v })}
            />
            <Checkbox
              label="Complete course importance explained"
              checked={state.counselling.completeCourseImportant}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completeCourseImportant", value: v })}
              description="12–16 weeks treatment needed for full effect"
            />
          </div>
        )}

        {state.currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} rows={3} />
          </div>
        )}
      </StepWrapper>
    </div>
  );
}

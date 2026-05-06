"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  HLConsultationState,
  HLAction,
  HLPatientDetails,
  HLClinicalAssessment,
  HLMedicalHistory,
  HLContraindications,
  HLMedicineSupply,
  HLCounselling,
} from "./lib/hair-loss-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hair-loss-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/hair-loss-clinical-logic";
import { validateStep } from "./lib/hair-loss-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HLSummaryReport } from "./components/HLSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: HLConsultationState, action: HLAction): HLConsultationState {
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

    case "UPDATE_CLINICAL_ASSESSMENT":
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
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
  }

  return newState;
}

// ─── Main Client Component ───

export default function HLClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ─── Computed values ───

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    // Hard stops prevent progression
    if (state.currentStep <= 4 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);

  // ─── Step content rendering ───


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
      outcome: hardStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hardStops]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof HLPatientDetails, value })
            }
            genderOption={{
              label: "Confirm patient is male",
              description:
                "Finasteride is teratogenic and contraindicated in women. This PGD is for male patients only.",
              checked: state.patient.maleConfirmed,
              onToggle: (v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "maleConfirmed", value: v }),
            }}
          />
        );

      case 1: // Consent
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2: // Assessment
        return (
          <div className="space-y-4">
            <NumberInput
              label="Norwood-Hamilton Scale (1-7)"
              value={state.clinicalAssessment.norwoodHamiltonScale}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "norwoodHamiltonScale",
                  value: v,
                })
              }
              min={1}
              max={7}
              required
            />
            <Checkbox
              label="Androgenetic alopecia (male-pattern baldness) confirmed"
              checked={state.clinicalAssessment.hasAndrogeneticAlopecia}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "hasAndrogeneticAlopecia",
                  value: v,
                })
              }
              description="Hair loss pattern consistent with male-pattern baldness"
            />
            <TextInput
              label="Onset of alopecia (duration, pattern)"
              value={state.clinicalAssessment.alopeciaOnset}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "alopeciaOnset",
                  value: v,
                })
              }
              placeholder="e.g. Progressive over 5 years, temple and crown"
              required
            />
            <Checkbox
              label="Family history of male-pattern baldness"
              checked={state.clinicalAssessment.familyHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "familyHistory",
                  value: v,
                })
              }
              description="Father, brother, or grandfather affected"
            />
          </div>
        );

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <Checkbox
              label="Liver disease"
              checked={state.medicalHistory.liverDisease}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "liverDisease",
                  value: v,
                })
              }
              description="Any history of hepatic impairment or liver disease"
            />
            <Checkbox
              label="Prostate cancer"
              checked={state.medicalHistory.prostateCancer}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "prostateCancer",
                  value: v,
                })
              }
              description="Current or history of prostate cancer"
            />
            {state.medicalHistory.prostateCancer && (
              <TextInput
                label="Details"
                value={state.medicalHistory.prostateCancerDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "prostateCancerDetail",
                    value: v,
                  })
                }
                placeholder="Diagnosis date, treatment, current status"
              />
            )}
            <Checkbox
              label="PSA abnormalities"
              checked={state.medicalHistory.psaAbnormalities}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "psaAbnormalities",
                  value: v,
                })
              }
              description="Elevated or abnormal PSA result"
            />
            {state.medicalHistory.psaAbnormalities && (
              <TextInput
                label="Details"
                value={state.medicalHistory.psaAbnormaltiesDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "psaAbnormaltiesDetail",
                    value: v,
                  })
                }
                placeholder="PSA value, date, GP action"
              />
            )}
            <Checkbox
              label="Hypersensitivity to finasteride"
              checked={state.medicalHistory.hypersensitivity}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "hypersensitivity",
                  value: v,
                })
              }
            />
            <TextInput
              label="Other conditions (optional)"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "otherConditions",
                  value: v,
                })
              }
              placeholder="Diabetes, cardiovascular disease, etc."
            />
          </div>
        );

      case 4: // Contraindications
        return (
          <div className="space-y-4">
            <Checkbox
              label="Patient reports depression or mood changes"
              checked={state.contraindications.depressiveMood}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "depressiveMood",
                  value: v,
                })
              }
              description="Mood changes have been reported in some patients taking finasteride"
            />
            {state.contraindications.depressiveMood && (
              <TextInput
                label="Details of mood symptoms"
                value={state.contraindications.depressiveMoodDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CONTRAINDICATIONS",
                    field: "depressiveMoodDetail",
                    value: v,
                  })
                }
                placeholder="When, severity, current treatment"
              />
            )}
          </div>
        );

      case 5: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply finasteride 1mg once daily"
              checked={state.medicineSupply.finasteride1mgOd}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "finasteride1mgOd",
                  value: v,
                })
              }
              description="Confirm medicine supply at standard dose"
            />
            <Checkbox
              label="Partner (if any) has been informed of teratogenic risk"
              checked={state.medicineSupply.partnerNotified}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "partnerNotified",
                  value: v,
                })
              }
              description="Women should not handle crushed tablets. Inform partner if applicable."
            />
            <Checkbox
              label="Patient will monitor for sexual side effects"
              checked={state.medicineSupply.willMonitorSE}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "willMonitorSE",
                  value: v,
                })
              }
              description="Sexual dysfunction (~2%): reduced libido, erectile dysfunction"
            />
            <Checkbox
              label="Patient understands finasteride lowers PSA by ~50%"
              checked={state.medicineSupply.understandsPSAEffect}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "understandsPSAEffect",
                  value: v,
                })
              }
              description="Inform GP when PSA testing performed. Does not affect prostate cancer screening"
            />
          </div>
        );

      case 6: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Takes 3-6 months to see effect"
              checked={state.counselling.effectOnsetTime}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "effectOnsetTime",
                  value: v,
                })
              }
              description="Hair growth benefit takes time; continued use needed"
            />
            <Checkbox
              label="Hair loss resumes if treatment stops"
              checked={state.counselling.hairLossResumesStopped}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "hairLossResumesStopped",
                  value: v,
                })
              }
              description="Benefit is lost within 12 months of stopping"
            />
            <Checkbox
              label="Sexual side effects possible (~2%)"
              checked={state.counselling.sexualSideEffects}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "sexualSideEffects",
                  value: v,
                })
              }
              description="Reduced libido, erectile dysfunction, ejaculation disorders"
            />
            <Checkbox
              label="Report mood changes to GP"
              checked={state.counselling.moodChanges}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "moodChanges",
                  value: v,
                })
              }
              description="Depression, mood changes, suicidal thoughts must be reported"
            />
            <Checkbox
              label="Annual review recommended"
              checked={state.counselling.annualReview}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "annualReview",
                  value: v,
                })
              }
              description="Regular monitoring to assess efficacy and adverse effects"
            />
            <Checkbox
              label="Report adverse changes immediately"
              checked={state.counselling.reportChanges}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "reportChanges",
                  value: v,
                })
              }
              description="Any unexpected side effects or changes to report to pharmacist"
            />
          </div>
        );

      case 7: // Summary
        return (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
              }
              placeholder="John Smith"
              required
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
              }
              placeholder="e.g. 2123456"
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
              }
              placeholder="High Street Pharmacy"
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
              }
              placeholder="123 High Street, London"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Any additional clinical observations..."
              rows={4}
            />
            <HLSummaryReport state={state} alerts={alerts} />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {alerts.length > 0 && (
        <AlertBanner
          alerts={alerts.filter((a) => a.severity === "stop")}
        />
      )}

      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hardStops}
       getConsultationData={getConsultationData}>
        {renderStep()}
      </StepWrapper>

      {doseRecommendation && state.currentStep >= 5 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="font-semibold text-teal-900 mb-2">Medicine Recommendation</h3>
          <div className="space-y-1 text-sm text-teal-800">
            <p>
              <span className="font-medium">Medicine:</span> {doseRecommendation.medicine}
            </p>
            <p>
              <span className="font-medium">Dose:</span> {doseRecommendation.dose}
            </p>
            <p>
              <span className="font-medium">Frequency:</span> {doseRecommendation.frequency}
            </p>
            <p>
              <span className="font-medium">Reason:</span> {doseRecommendation.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

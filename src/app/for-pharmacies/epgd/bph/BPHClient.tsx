"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  BPHConsultationState,
  BPHAction,
  BPHPatientDetails,
  BPHLutsAssessment,
  BPHMedicalHistory,
  BPHRedFlags,
  BPHContraindications,
  BPHMedicineSupply,
  BPHCounselling,
} from "./lib/bph-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/bph-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/bph-clinical-logic";
import { validateStep } from "./lib/bph-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { BPHSummaryReport } from "./components/BPHSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: BPHConsultationState, action: BPHAction): BPHConsultationState {
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

    case "UPDATE_LUTS_ASSESSMENT":
      newState.lutsAssessment = {
        ...newState.lutsAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_RED_FLAGS":
      newState.redFlags = {
        ...newState.redFlags,
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

export default function BPHClient() {
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
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof BPHPatientDetails, value })
            }
            genderOption={{
              label: "Confirm patient is male",
              description: "This PGD is for male patients only.",
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

      case 2: // LUTS Assessment
        return (
          <div className="space-y-4">
            <NumberInput
              label="IPSS Score (0-35)"
              value={state.lutsAssessment.ipssScore}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "ipssScore",
                  value: v,
                })
              }
              min={0}
              max={35}
              required
            />
            {state.lutsAssessment.ipssScore !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  {state.lutsAssessment.ipssScore <= 7 && "Mild symptoms (IPSS 0-7)"}
                  {state.lutsAssessment.ipssScore >= 8 && state.lutsAssessment.ipssScore <= 19 && "Moderate symptoms (IPSS 8-19)"}
                  {state.lutsAssessment.ipssScore >= 20 && "Severe symptoms (IPSS 20-35)"}
                </p>
              </div>
            )}
            <Checkbox
              label="Frequency: >8 times in 24 hours"
              checked={state.lutsAssessment.frequency}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "frequency",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Urgency: Strong, persistent urge"
              checked={state.lutsAssessment.urgency}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "urgency",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Nocturia: >1 time per night"
              checked={state.lutsAssessment.nocturia}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "nocturia",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Weak stream"
              checked={state.lutsAssessment.weakStream}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "weakStream",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Hesitancy (difficulty starting)"
              checked={state.lutsAssessment.hesitancy}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "hesitancy",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Incomplete emptying"
              checked={state.lutsAssessment.incompletEmptying}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "incompletEmptying",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Lower abdominal discomfort"
              checked={state.lutsAssessment.lowerAbdominalDiscomfort}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "lowerAbdominalDiscomfort",
                  value: v,
                })
              }
            />
          </div>
        );

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <Checkbox
              label="History of orthostatic hypotension"
              checked={state.medicalHistory.orthostasisHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "orthostasisHistory",
                  value: v,
                })
              }
              description="Previous episodes of dizziness or fainting on standing"
            />
            <Checkbox
              label="Severe hepatic impairment"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "severeHepaticImpairment",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Planned cataract surgery"
              checked={state.medicalHistory.plannedCataractSurgery}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "plannedCataractSurgery",
                  value: v,
                })
              }
              description="Tamsulosin increases risk of intraoperative floppy iris syndrome (IFIS)"
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
              placeholder="e.g. diabetes, hypertension, CVD"
            />
          </div>
        );

      case 4: // Red Flags
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Red flags require urgent referral — do not supply medicine
              </p>
            </div>
            <Checkbox
              label="Haematuria (blood in urine)"
              checked={state.redFlags.haematuria}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "haematuria",
                  value: v,
                })
              }
              description="Requires urgent urological assessment"
            />
            <Checkbox
              label="Acute urinary retention"
              checked={state.redFlags.acuteRetention}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "acuteRetention",
                  value: v,
                })
              }
              description="Sudden inability to pass urine — emergency referral"
            />
            <Checkbox
              label="Palpable bladder"
              checked={state.redFlags.palpableBladder}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "palpableBladder",
                  value: v,
                })
              }
              description="On abdominal examination — suggests significant retention"
            />
            <Checkbox
              label="PSA ≥4 ng/mL (or elevated)"
              checked={state.redFlags.psa4OrAbove}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "psa4OrAbove",
                  value: v,
                })
              }
              description="Requires prostate cancer screening assessment"
            />
            <Checkbox
              label="Unexplained weight loss"
              checked={state.redFlags.weightLoss}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "weightLoss",
                  value: v,
                })
              }
              description="May indicate malignancy — refer to GP"
            />
            <Checkbox
              label="Bone pain"
              checked={state.redFlags.bonePain}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "bonePain",
                  value: v,
                })
              }
              description="May indicate metastatic disease — refer urgently"
            />
          </div>
        );

      case 5: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Supply tamsulosin 400mcg MR once daily"
              checked={state.medicineSupply.tamsulosin400mcgMrOd}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "tamsulosin400mcgMrOd",
                  value: v,
                })
              }
              description="Modified-release formulation"
            />
            <Checkbox
              label="Patient will take 30 minutes after food"
              checked={state.medicineSupply.afterFood30mins}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "afterFood30mins",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient will take at same time daily"
              checked={state.medicineSupply.sameTimeDaily}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "sameTimeDaily",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient is aware of first-dose hypotension risk"
              checked={state.medicineSupply.firstDoseHypotension}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "firstDoseHypotension",
                  value: v,
                })
              }
              description="Take first dose at bedtime; rise slowly when standing"
            />
          </div>
        );

      case 6: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Take 30 minutes after food at same time daily"
              checked={state.counselling.take30minsAfterFood}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "take30minsAfterFood",
                  value: v,
                })
              }
            />
            <Checkbox
              label="First-dose hypotension — rise slowly from lying/sitting"
              checked={state.counselling.firstDoseHypotension}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "firstDoseHypotension",
                  value: v,
                })
              }
              description="Take first dose at night; may cause dizziness"
            />
            <Checkbox
              label="Retrograde ejaculation is common"
              checked={state.counselling.retrogradeEjaculation}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "retrogradeEjaculation",
                  value: v,
                })
              }
              description="Semen enters bladder instead of being ejaculated; harmless"
            />
            <Checkbox
              label="Inform ophthalmologist before any eye surgery"
              checked={state.counselling.informOphthalmologist}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "informOphthalmologist",
                  value: v,
                })
              }
              description="Tamsulosin increases risk of intraoperative floppy iris syndrome"
            />
            <Checkbox
              label="Review at 4-6 weeks to assess efficacy"
              checked={state.counselling.reviewAt4To6Weeks}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "reviewAt4To6Weeks",
                  value: v,
                })
              }
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
            <BPHSummaryReport state={state} alerts={alerts} />
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

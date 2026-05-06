"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  PEConsultationState,
  PEAction,
  PEPatientDetails,
  PEClinicalAssessment,
  PEMedicalHistory,
  PECurrentMedications,
  PEContraindications,
  PEMedicineSupply,
  PECounselling,
} from "./lib/pe-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/pe-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/pe-clinical-logic";
import { validateStep } from "./lib/pe-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { PESummaryReport } from "./components/PESummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: PEConsultationState, action: PEAction): PEConsultationState {
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

    case "UPDATE_CURRENT_MEDICATIONS":
      newState.currentMedications = {
        ...newState.currentMedications,
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

export default function PEClient() {
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
    if (state.currentStep <= 5 && hardStops) return false;
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
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof PEPatientDetails, value })
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

      case 2: // Assessment
        return (
          <div className="space-y-4">
            <SelectInput
              label="PE type"
              value={state.clinicalAssessment.peType}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "peType",
                  value: v,
                })
              }
              options={[
                { value: "lifelong", label: "Lifelong (present since first sexual experience)" },
                {
                  value: "acquired",
                  label: "Acquired (developed after period of normal function)",
                },
              ]}
              required
            />
            <NumberInput
              label="IELT — Intravaginal Ejaculation Latency Time (minutes)"
              value={state.clinicalAssessment.ieltMinutes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "ieltMinutes",
                  value: v,
                })
              }
              min={0}
              placeholder="Enter time in minutes"
              required
            />
            {state.clinicalAssessment.ieltMinutes !== null && state.clinicalAssessment.ieltMinutes >= 2 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-800">
                  PE diagnosis requires IELT &lt;2 minutes. Current value does not meet diagnostic criteria.
                </p>
              </div>
            )}
            <Checkbox
              label="Patient reports relationship distress due to PE"
              checked={state.clinicalAssessment.relationshipDistress}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "relationshipDistress",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient reports psychological distress"
              checked={state.clinicalAssessment.psychologicalDistress}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "psychologicalDistress",
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
              label="Cardiac disorder (NYHA II-IV or significant valvular disease)"
              checked={state.medicalHistory.cardiacDisorder}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "cardiacDisorder",
                  value: v,
                })
              }
              description="Dapoxetine can reduce blood pressure"
            />
            {state.medicalHistory.cardiacDisorder && (
              <TextInput
                label="Details"
                value={state.medicalHistory.cardiacDisorderDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "cardiacDisorderDetail",
                    value: v,
                  })
                }
                placeholder="Type of disorder, NYHA class, treatment"
              />
            )}
            <Checkbox
              label="History of syncope (fainting)"
              checked={state.medicalHistory.syncope}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "syncope",
                  value: v,
                })
              }
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
              label="Uncontrolled epilepsy"
              checked={state.medicalHistory.uncontrolledEpilepsy}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "uncontrolledEpilepsy",
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
              placeholder="e.g. diabetes, hypertension"
            />
          </div>
        );

      case 4: // Current Medications
        return (
          <div className="space-y-4">
            <Checkbox
              label="Taking MAOIs, SSRIs, or SNRIs"
              checked={state.currentMedications.maoisOrSsrisOrSnris}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CURRENT_MEDICATIONS",
                  field: "maoisOrSsrisOrSnris",
                  value: v,
                })
              }
              description="Major contraindication — significant serotonin interaction risk"
            />
            <Checkbox
              label="Taking thioridazine"
              checked={state.currentMedications.thioridazine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CURRENT_MEDICATIONS",
                  field: "thioridazine",
                  value: v,
                })
              }
              description="Risk of QT prolongation and arrhythmias"
            />
            <TextInput
              label="Other medications (optional)"
              value={state.currentMedications.otherMedications}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CURRENT_MEDICATIONS",
                  field: "otherMedications",
                  value: v,
                })
              }
              placeholder="List other current medications"
            />
          </div>
        );

      case 5: // Contraindications
        return (
          <div className="space-y-4">
            <Checkbox
              label="History of severe or sudden adverse events"
              checked={state.contraindications.hadSevereOrSuddenAE}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "hadSevereOrSuddenAE",
                  value: v,
                })
              }
              description="Any previous severe reactions to medications"
            />
            {state.contraindications.hadSevereOrSuddenAE && (
              <TextInput
                label="Details"
                value={state.contraindications.aeDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CONTRAINDICATIONS",
                    field: "aeDetail",
                    value: v,
                  })
                }
                placeholder="Reaction, medication, date, management"
              />
            )}
          </div>
        );

      case 6: // Medicine Supply
        return (
          <div className="space-y-4">
            <Checkbox
              label="Dapoxetine 30mg supplied"
              checked={state.medicineSupply.dapoxetine30mgSupplied}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "dapoxetine30mgSupplied",
                  value: v,
                })
              }
              description="Standard starting dose"
            />
            <Checkbox
              label="May increase to 60mg if inadequate response"
              checked={state.medicineSupply.mayIncreaseTo60mg}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "mayIncreaseTo60mg",
                  value: v,
                })
              }
              description="Higher dose available after initial response assessment"
            />
            <Checkbox
              label="Patient understands usage (1-3 hours before, max once per 24 hours, with water)"
              checked={state.medicineSupply.understandsUsage}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "understandsUsage",
                  value: v,
                })
              }
              description="PRN dosing instructions understood"
            />
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-navy-900 mb-3">
                Orthostatic Hypotension Assessment
              </h4>
              <div className="grid sm:grid-cols-2 gap-4 mb-3">
                <TextInput
                  label="Lying BP (e.g. 120/80)"
                  value={state.summary.lyingBP}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_SUMMARY", field: "lyingBP", value: v })
                  }
                  placeholder="mmHg"
                />
                <TextInput
                  label="Standing BP (e.g. 118/78)"
                  value={state.summary.standingBP}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_SUMMARY", field: "standingBP", value: v })
                  }
                  placeholder="mmHg"
                />
              </div>
              <Checkbox
                label="Orthostatic hypotension assessment completed"
                checked={state.medicineSupply.understandsOrthostatic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "understandsOrthostatic",
                    value: v,
                  })
                }
                description="Lying and standing BP measured before first dose"
              />
            </div>
          </div>
        );

      case 7: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Take with water 1-3 hours before sexual activity"
              checked={state.counselling.takeWithWater}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "takeWithWater",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Avoid alcohol"
              checked={state.counselling.avoidAlcohol}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "avoidAlcohol",
                  value: v,
                })
              }
              description="Increases risk of hypotension and dizziness"
            />
            <Checkbox
              label="Do not drive for 2 hours after dose"
              checked={state.counselling.noDrive2hrs}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "noDrive2hrs",
                  value: v,
                })
              }
              description="May cause dizziness or drowsiness"
            />
            <Checkbox
              label="Avoid grapefruit juice"
              checked={state.counselling.avoidGrapefruit}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "avoidGrapefruit",
                  value: v,
                })
              }
              description="Inhibits metabolism; increases blood levels"
            />
            <Checkbox
              label="May cause nausea, dizziness, headache"
              checked={state.counselling.mayHaveSideEffects}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "mayHaveSideEffects",
                  value: v,
                })
              }
              description="Common side effects; usually mild and transient"
            />
            <Checkbox
              label="Not for daily use (PRN only)"
              checked={state.counselling.notForDaily}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "notForDaily",
                  value: v,
                })
              }
              description="Use only when needed before sexual activity"
            />
            <Checkbox
              label="Review efficacy after 4 weeks"
              checked={state.counselling.review4weeks}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "review4weeks",
                  value: v,
                })
              }
              description="Follow-up consultation to assess response"
            />
          </div>
        );

      case 8: // Summary
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
            <PESummaryReport state={state} alerts={alerts} />
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

      {doseRecommendation && state.currentStep >= 6 && (
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
              <span className="font-medium">Dosing:</span> {doseRecommendation.dosingRegimen}
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

"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  COPDConsultationState,
  COPDAction,
  COPDPatientDetails,
  COPDAssessment,
  COPDMedicalHistory,
  COPDRedFlags,
  COPDMedicineSupply,
  COPDCounselling,
} from "./lib/copd-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/copd-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/copd-clinical-logic";
import { validateStep } from "./lib/copd-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { COPDSummaryReport } from "./components/COPDSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: COPDConsultationState, action: COPDAction): COPDConsultationState {
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
    case "UPDATE_RED_FLAGS":
      newState.redFlags = { ...newState.redFlags, [action.field]: action.value };
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
  }

  return newState;
}

export default function COPDClient() {
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
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const validationError = useMemo(() => validateStep(state, state.currentStep), [state]);
  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 5 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

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

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof COPDPatientDetails, value })
            }
          />
        );

      case 1:
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Confirm patient has existing COPD diagnosis"
              checked={state.assessment.hasExistingDiagnosis}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "hasExistingDiagnosis", value: v })
              }
              description="Patient must have documented COPD diagnosis from GP"
            />
            <NumberInput
              label="MRC breathlessness scale (1-5)"
              value={state.assessment.mrcBreathlessnessScale}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "mrcBreathlessnessScale", value: v })
              }
              min={1}
              max={5}
            />
            {state.assessment.mrcBreathlessnessScale === 5 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs text-red-700 font-medium">
                  Grade 5: Housebound, breathless at rest. URGENT REFERRAL REQUIRED.
                </p>
              </div>
            )}
            <SelectInput
              label="Exacerbation frequency"
              value={state.assessment.exacerbationFrequency}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "exacerbationFrequency", value: v })
              }
              options={[
                { value: "none", label: "No recent exacerbations" },
                { value: "1-2", label: "1-2 exacerbations per year" },
                { value: "3-4", label: "3-4 exacerbations per year" },
                { value: "frequent", label: "Frequent exacerbations (&gt;4/year)" },
              ]}
              required
            />
            <TextInput
              label="Current inhaler regimen"
              value={state.assessment.currentInhalerRegimen}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "currentInhalerRegimen", value: v })
              }
              placeholder="e.g., LABA/ICS twice daily"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Checkbox
              label="COPD documented in medical records"
              checked={state.medicalHistory.copdDocumented}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "copdDocumented", value: v })
              }
            />
            <SelectInput
              label="Current smoking status"
              value={state.medicalHistory.smokingStatus}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "smokingStatus", value: v })
              }
              options={[
                { value: "current", label: "Current smoker" },
                { value: "former", label: "Former smoker" },
                { value: "never", label: "Never smoked" },
              ]}
            />
            <TextInput
              label="Other respiratory conditions"
              value={state.medicalHistory.otherRespiratoryConditions}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherRespiratoryConditions", value: v })
              }
              placeholder="e.g., asthma, bronchiectasis"
            />
            <TextInput
              label="Other conditions"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherConditions", value: v })
              }
              placeholder="e.g., CVD, diabetes, osteoporosis"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Current long-acting bronchodilator therapy"
              checked={false}
              onChange={() => {}}
              description="Document current LABA/LAMA/ICS regimen above"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Red flags require urgent referral
              </p>
            </div>
            <Checkbox
              label="MRC Grade 5 (housebound, breathless at rest)"
              checked={state.redFlags.mrcGrade5}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "mrcGrade5", value: v })
              }
            />
            <Checkbox
              label="Suspected acute exacerbation"
              checked={state.redFlags.suspectedExacerbation}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "suspectedExacerbation", value: v })
              }
              description="Increased sputum, fever, or worsening breathlessness"
            />
            <Checkbox
              label="New haemoptysis"
              checked={state.redFlags.newHaemoptysis}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "newHaemoptysis", value: v })
              }
            />
            <Checkbox
              label="Unintentional weight loss"
              checked={state.redFlags.weightLoss}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "weightLoss", value: v })
              }
            />
            <Checkbox
              label="Recurrent respiratory infections"
              checked={state.redFlags.recurrentInfections}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "recurrentInfections", value: v })
              }
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Medicine to supply confirmed"
              checked={state.medicineSupply.medicinePrescribed}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "medicinePrescribed", value: v })
              }
            />
            {state.medicineSupply.medicinePrescribed && (
              <>
                <SelectInput
                  label="Medicine type"
                  value={state.medicineSupply.medicineType}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "medicineType", value: v })
                  }
                  options={[
                    { value: "salbutamol", label: "Salbutamol 100mcg pMDI (reliever)" },
                    { value: "ipratropium", label: "Ipratropium 20mcg pMDI (anticholinergic)" },
                  ]}
                  required
                />
                <Checkbox
                  label="Dosage confirmed with patient"
                  checked={state.medicineSupply.dosageConfirmed}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dosageConfirmed", value: v })
                  }
                />
              </>
            )}
            <Checkbox
              label="Patient understands not replacement for maintenance"
              checked={state.medicineSupply.notReplacementForMaintenance}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "notReplacementForMaintenance", value: v })
              }
              description="Supply does not replace regular LABA/LAMA/ICS therapy"
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Counselled: Not replacement for maintenance therapy"
              checked={state.counselling.notReplacementForMaintenance}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "notReplacementForMaintenance", value: v })
              }
            />
            <Checkbox
              label="GP review recommended"
              checked={state.counselling.gpReviewAdvised}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "gpReviewAdvised", value: v })
              }
              description="Advise GP review for COPD management optimisation"
            />
            <Checkbox
              label="Inhaler technique demonstrated"
              checked={state.counselling.inhalerTechniqueShown}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "inhalerTechniqueShown", value: v })
              }
            />
            <Checkbox
              label="Smoking cessation advice given"
              checked={state.counselling.smokingCessationAdvised}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "smokingCessationAdvised", value: v })
              }
              description="Mandatory counselling on smoking cessation"
            />
            <Checkbox
              label="Symptom management explained"
              checked={state.counselling.symptomMgmtExplained}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "symptomMgmtExplained", value: v })
              }
            />
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
                }
                required
                placeholder="Your name"
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
                }
                required
                placeholder="e.g., 123456"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
                }
                placeholder="Your pharmacy"
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
                }
                placeholder="Address"
              />
            </div>
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Additional clinical details or follow-up advice"
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);


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

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <div className="space-y-6">
        <ProgressBar
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <StepWrapper
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          title={STEP_LABELS[state.currentStep]}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={true}
          validationError={null}
            getConsultationData={getConsultationData}
        >
          <COPDSummaryReport
          state={state}
          alerts={alerts}
          doseRecommendation={doseRecommendation}
        />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}

      <StepWrapper
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        title={STEP_LABELS[state.currentStep]}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
      >
        {renderStep()}
      </StepWrapper>

      <div className="flex gap-3 justify-between">
        <button
          onClick={handlePrev}
          disabled={state.currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-navy-900 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

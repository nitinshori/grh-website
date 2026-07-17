"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  HayfeverConsultationState,
  HayfeverAction,
  HayfeverPatientDetails,
  HayfeverAssessment,
  HayfeverMedicalHistory,
  HayfeverContraindications,
  HayfeverMedicineSupply,
  HayfeverCounselling,
} from "./lib/hayfever-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hayfever-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/hayfever-clinical-logic";
import { validateStep } from "./lib/hayfever-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HayfeverSummaryReport } from "./components/HayfeverSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: HayfeverConsultationState, action: HayfeverAction): HayfeverConsultationState {
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
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
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

export default function HayfeverClient() {
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
    if (state.currentStep <= 4 && hardStops) return false;
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
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof HayfeverPatientDetails, value })
            }
            requireAdult={false}
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
            <SelectInput
              label="Symptom severity"
              value={state.assessment.symptomSeverity}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "symptomSeverity", value: v })
              }
              options={[
                { value: "mild", label: "Mild (occasional symptoms)" },
                { value: "moderate", label: "Moderate (regular symptoms)" },
                { value: "severe", label: "Severe (significant impact on daily life)" },
              ]}
              required
            />
            <SelectInput
              label="Temporal pattern"
              value={state.assessment.seasonalOrPerennial}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "seasonalOrPerennial", value: v })
              }
              options={[
                { value: "seasonal", label: "Seasonal (specific months)" },
                { value: "perennial", label: "Perennial (year-round)" },
                { value: "both", label: "Both seasonal and perennial triggers" },
              ]}
              required
            />
            <TextInput
              label="Previous OTC treatments tried"
              value={state.assessment.previousOTCUse}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "previousOTCUse", value: v })
              }
              placeholder="e.g., cetirizine, loratadine"
            />
            <TextInput
              label="Current symptom duration"
              value={state.assessment.symptomDuration}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "symptomDuration", value: v })
              }
              placeholder="e.g., past 2 weeks"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Asthma or LRTI history"
              checked={state.medicalHistory.asthmaOrLrti}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "asthmaOrLrti", value: v })
              }
              description="May indicate need for montelukast (leukotriene antagonist)"
            />
            <Checkbox
              label="Severe hepatic impairment"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepaticImpairment", value: v })
              }
            />
            <Checkbox
              label="Renal impairment"
              checked={state.medicalHistory.renalImpairment}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })
              }
              description="Caution with fexofenadine"
            />
            <Checkbox
              label="Recent nasal surgery"
              checked={state.medicalHistory.recentNasalSurgery}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentNasalSurgery", value: v })
              }
              description="Nasal sprays contraindicated"
            />
            <Checkbox
              label="Phenylketonuria (PKU)"
              checked={state.medicalHistory.phenylketonuria}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "phenylketonuria", value: v })
              }
              description="Some formulations contain aspartame"
            />
            <TextInput
              label="Other medical conditions"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherConditions", value: v })
              }
              placeholder="e.g., hypertension, cardiac conditions"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Patient is pregnant"
              checked={state.contraindications.pregnant}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnant", value: v })
              }
              description="Most antihistamines caution in pregnancy. GP consultation required."
            />
            <Checkbox
              label="Patient is breastfeeding"
              checked={state.contraindications.breastfeeding}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })
              }
              description="Some medicines contraindicated. GP consultation required."
            />
            <Checkbox
              label="Patient is under 12 years (if considering fexofenadine 180mg)"
              checked={state.contraindications.childUnder12}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })
              }
            />
            <TextInput
              label="Current medications that may interact"
              value={state.contraindications.otherMedicines}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "otherMedicines", value: v })
              }
              placeholder="List any current medications"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <SelectInput
              label="Medicine selection"
              value={state.medicineSupply.medicineSelected}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "medicineSelected", value: v })
              }
              options={[
                { value: "fexofenadine", label: "Fexofenadine 180mg OD (oral antihistamine)" },
                { value: "fluticasone", label: "Fluticasone propionate nasal spray 50mcg" },
                { value: "montelukast", label: "Montelukast 10mg OD (if co-existing asthma)" },
                { value: "combination", label: "Combination (antihistamine + nasal spray)" },
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
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Allergen avoidance measures discussed"
              checked={state.counselling.allergenAvoidance}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "allergenAvoidance", value: v })
              }
              description="Keeping windows closed, avoiding outdoor activities during high pollen counts"
            />
            <Checkbox
              label="Nasal spray technique demonstrated"
              checked={state.counselling.nasalSprayTechnique}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "nasalSprayTechnique", value: v })
              }
              description="Spray directed away from nasal septum"
            />
            <Checkbox
              label="Effectiveness timeline explained"
              checked={state.counselling.effectivenessTimeline}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "effectivenessTimeline", value: v })
              }
              description="Nasal steroids take up to 2 weeks to peak effect"
            />
            <Checkbox
              label="Combination therapy rationale explained"
              checked={state.counselling.combinationRationale}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "combinationRationale", value: v })
              }
              description="Can combine antihistamine and nasal steroid for enhanced effect"
            />
            <Checkbox
              label="Wraparound sunglasses recommended"
              checked={state.counselling.wrapsunglasses}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "wrapsunglasses", value: v })
              }
              description="Reduces pollen exposure to eyes"
            />
            <Checkbox
              label="Pollen forecast checking advised"
              checked={state.counselling.pollenForecastAdvice}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "pollenForecastAdvice", value: v })
              }
            />
          </div>
        );

      case 7:
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
          <HayfeverSummaryReport
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
          className="px-4 py-2 text-sm font-medium text-white bg-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/15 disabled:bg-gray-300 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

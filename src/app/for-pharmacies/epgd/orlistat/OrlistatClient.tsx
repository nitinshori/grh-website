"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import type { OrlistatConsultationState, OrlistatAction } from "./lib/orlistat-types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialConsultationState,
} from "./lib/orlistat-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/orlistat-clinical-logic";
import { validateStep, calculateBMI } from "./lib/orlistat-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";
import { OrlistatSummaryReport } from "./components/OrlistatSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: OrlistatConsultationState, action: OrlistatAction): OrlistatConsultationState {
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

    case "UPDATE_WEIGHT_ASSESSMENT":
      newState.weightAssessment = {
        ...newState.weightAssessment,
        [action.field]: action.value,
      };
      if (action.field === "height" || action.field === "weight") {
        newState.weightAssessment.bmi = calculateBMI(
          newState.weightAssessment.height,
          newState.weightAssessment.weight
        );
        const bmi = newState.weightAssessment.bmi;
        if (bmi !== null) {
          if (bmi < 18.5) newState.weightAssessment.bmiCategory = "Underweight";
          else if (bmi < 25) newState.weightAssessment.bmiCategory = "Normal weight";
          else if (bmi < 30) newState.weightAssessment.bmiCategory = "Overweight";
          else newState.weightAssessment.bmiCategory = "Obese";
        }
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICATIONS":
      newState.medications = {
        ...newState.medications,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_OBSERVATIONS":
      newState.observations = {
        ...newState.observations,
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

export default function OrlistatClient() {
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

  const validationError = useMemo(
    () => validateStep(state.currentStep, state),
    [state.currentStep, state]
  );

  const canProceed = !validationError && (!hasStops || state.currentStep >= 5);

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
    if (step < state.currentStep) {
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
      medicine: {
        name: "Orlistat 120mg",
        dose: state.medicineSupply.dosage,
        quantity: state.medicineSupply.quantity?.toString() ?? "",
      },
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
          <StepWrapper
            title="Patient Details"
            description="Confirm patient identity. Patient must be 18 or older."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper
            title="Consent & ID Verification"
            description="Obtain informed consent and verify identity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Weight Assessment"
            description="Calculate BMI. BMI ≥30 or ≥28 with comorbidity required."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberInput
                  label="Height"
                  value={state.weightAssessment.height}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "height", value: v })
                  }
                  min={100}
                  max={220}
                  unit="cm"
                />
                <NumberInput
                  label="Weight"
                  value={state.weightAssessment.weight}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "weight", value: v })
                  }
                  min={30}
                  max={300}
                  unit="kg"
                />
              </div>

              {state.weightAssessment.bmi !== null && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                  <p className="text-sm font-semibold text-teal-900">
                    BMI: {state.weightAssessment.bmi} kg/m² ({state.weightAssessment.bmiCategory})
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-navy-900 mb-3">
                  Weight-Related Comorbidities
                </p>
                <div className="space-y-2">
                  {[
                    { id: "type2diabetes", label: "Type 2 diabetes" },
                    { id: "hypertension", label: "Hypertension" },
                    { id: "dyslipidaemia", label: "Dyslipidaemia" },
                    { id: "cvd", label: "Cardiovascular disease" },
                  ].map((com) => (
                    <Checkbox
                      key={com.id}
                      label={com.label}
                      checked={state.weightAssessment.comorbidities.includes(com.id)}
                      onChange={(v) => {
                        const comorbidities = [...state.weightAssessment.comorbidities];
                        if (v) {
                          comorbidities.push(com.id);
                        } else {
                          const idx = comorbidities.indexOf(com.id);
                          if (idx > -1) comorbidities.splice(idx, 1);
                        }
                        dispatch({
                          type: "UPDATE_WEIGHT_ASSESSMENT",
                          field: "comorbidities",
                          value: comorbidities,
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions for Orlistat use."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-semibold text-red-700 mb-2">
                  Absolute Contraindications
                </p>
              </div>

              <Checkbox
                label="Cholestasis"
                checked={state.medicalHistory.cholestasis}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "cholestasis",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Chronic malabsorption syndrome"
                checked={state.medicalHistory.chronicMalabsorption}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "chronicMalabsorption",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Currently pregnant"
                checked={state.medicalHistory.pregnant}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnant",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Currently breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "breastfeeding",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Planning pregnancy within 2 months"
                checked={state.medicalHistory.planningPregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "planningPregnancy",
                    value: v,
                  })
                }
              />

              <div className="border-t border-gray-300 pt-4 mt-4">
                <p className="text-xs font-semibold text-navy-900 mb-3">
                  Cautions & Special Considerations
                </p>
              </div>

              <Checkbox
                label="Gallbladder disease"
                checked={state.medicalHistory.gallbladderDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "gallbladderDisease",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Chronic diarrhoea"
                checked={state.medicalHistory.chronic_diarrhea}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "chronic_diarrhea",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Chronic kidney disease / volume depletion"
                checked={state.medicalHistory.chronicKidneyDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "chronicKidneyDisease",
                    value: v,
                  })
                }
                description="Increased hyperoxaluria / oxalate-nephropathy risk on orlistat."
              />

              <Checkbox
                label="Severe gastrointestinal disease"
                checked={state.medicalHistory.severeGastrointestinal}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeGastrointestinal",
                    value: v,
                  })
                }
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Current Medications & Interactions"
            description="Check for drug interactions."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Taking warfarin"
                checked={state.medications.takesWarfarin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesWarfarin",
                    value: v,
                  })
                }
                description="Significant interaction risk"
              />

              <Checkbox
                label="Taking levothyroxine"
                checked={state.medications.takesLevothyroxine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesLevothyroxine",
                    value: v,
                  })
                }
                description="Separate dosing by at least 4 hours"
              />

              <Checkbox
                label="Taking anti-epileptic medications"
                checked={state.medications.takesAntiEpileptics}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesAntiEpileptics",
                    value: v,
                  })
                }
                description="Risk of reduced absorption"
              />

              <Checkbox
                label="Taking ciclosporin"
                checked={state.medications.takesCiclosporin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesCiclosporin",
                    value: v,
                  })
                }
                description="Risk of reduced absorption"
              />

              <Checkbox
                label="Taking oral contraceptives"
                checked={state.medications.takesOralContraceptives}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesOralContraceptives",
                    value: v,
                  })
                }
                description="Severe diarrhoea may reduce contraceptive efficacy — advise additional barrier method during episodes."
              />

              <Checkbox
                label="Taking antiretroviral therapy for HIV"
                checked={state.medications.takesHIVAntiretrovirals}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesHIVAntiretrovirals",
                    value: v,
                  })
                }
                description="Orlistat may reduce absorption — discuss with HIV specialist team before initiating."
              />

              <Checkbox
                label="Taking any other medication with a clinically significant drug interaction"
                checked={state.medications.otherSignificantInteraction}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "otherSignificantInteraction",
                    value: v,
                  })
                }
                description="EXCLUSION. Refer to GP for medicines reconciliation."
              />

              <TextArea
                label="Other medications"
                value={state.medications.otherMedications}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "otherMedications",
                    value: v,
                  })
                }
                placeholder="List other regular medications"
              />

              <TextInput
                label="Allergies"
                value={state.medications.allergies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "allergies",
                    value: v,
                  })
                }
                placeholder="e.g., NKDA"
              />
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Contraindications & Clinical Alerts Review"
            description="Review identified contraindications."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present — cannot proceed."
                : null
            }
            isBlocked={hasStops}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard Stop — Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified contraindications, Orlistat cannot be supplied.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Medicine Supply"
            description="Specify dosage and quantity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">
                  <strong>Standard dosage:</strong> 120mg three times daily with meals
                </p>
              </div>

              <NumberInput
                label="Quantity to supply"
                value={state.medicineSupply.quantity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "quantity",
                    value: v,
                  })
                }
                min={10}
                max={360}
                unit="capsules"
                required
              />

              <TextInput
                label="Refill schedule"
                value={state.medicineSupply.refillSchedule}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "refillSchedule",
                    value: v,
                  })
                }
                placeholder="e.g., monthly, 3 months"
              />
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Counselling & Patient Education"
            description="Confirm counselling points discussed with patient."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-3">
              <Checkbox
                label="Low-fat diet explained"
                checked={state.counselling.dietaryAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "dietaryAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Steatorrhoea discussed (oily stools if high-fat meals)"
                checked={state.counselling.steatorrhoea}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "steatorrhoea",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Fat-soluble vitamins (A, D, E, K) absorption counselled"
                checked={state.counselling.fatSolubleVitamins}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "fatSolubleVitamins",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Multivitamin supplement advised at bedtime"
                checked={state.counselling.multivitamin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "multivitamin",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Separation of other medications (levothyroxine by 4 hours)"
                checked={state.counselling.separationAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "separationAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="3-month review scheduled"
                checked={state.counselling.reviewSchedule}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "reviewSchedule",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Weight loss target discussed (≥5% in 12 weeks)"
                checked={state.counselling.weightLossTarget}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "weightLossTarget",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Follow-up protocol explained (discontinue if <5% loss at 12 weeks)"
                checked={state.counselling.followUpProtocol}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "followUpProtocol",
                    value: v,
                  })
                }
              />
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            description="Review and print the consultation record"
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
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacistName",
                    value: v,
                  })
                }
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacistGPhC",
                    value: v,
                  })
                }
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "pharmacyName",
                    value: v,
                  })
                }
              />
              <TextArea
                label="Additional clinical notes"
                value={state.summary.clinicalNotes}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SUMMARY",
                    field: "clinicalNotes",
                    value: v,
                  })
                }
                placeholder="Any additional information to record..."
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Review the summary below before printing the consultation record.
              </p>
              <OrlistatSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={Boolean(validationError)}
      />

      {alerts.length > 0 && state.currentStep < 5 && (
        <AlertBanner alerts={alerts} />
      )}

      {renderStep()}
    </div>
  );
}

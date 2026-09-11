"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import type { OrlistatConsultationState, OrlistatAction } from "./lib/orlistat-types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  ORLISTAT_MAX_QUANTITY,
  createInitialConsultationState,
} from "./lib/orlistat-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  weeksSinceStart,
  weightLossPercent,
  ORLISTAT_REVIEW_WEEKS,
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
  SelectInput,
} from "../shared/components/FormInputs";
import { OrlistatSummaryReport } from "./components/OrlistatSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { usePreviousWeightConsultation, describePrevious } from "../shared/hooks/usePreviousWeightConsultation";
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

    case "UPDATE_EXCLUSION_ADVICE":
      newState.exclusionAdvice = action.value;
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
  const { previous, lookup: lookupPrevious } = usePreviousWeightConsultation();

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

  // A stop anywhere blocks Next on that step and on every later step, and
  // blocks Save & Print on the summary; excluded patients are saved with
  // "Save as not supplied" from whichever step raised the stop.
  const canProceed = !validationError && !hasStops;
  const stopSummary = alerts.filter((a) => a.severity === "stop").map((a) => a.message).join("; ");
  const weeks = weeksSinceStart(state.weightAssessment.treatmentStartDate);
  const lossPercent = weightLossPercent(state.weightAssessment.baselineWeight, state.weightAssessment.weight);

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
      clinicalData: { ...state, alerts, stopSummary, weeksSinceStart: weeks, weightLossPercent: lossPercent } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine: hasStops
        ? undefined
        : {
            name: state.medicineSupply.brand.trim()
              ? `Orlistat 120mg capsules (${state.medicineSupply.brand.trim()})`
              : "Orlistat 120mg capsules",
            dose: state.medicineSupply.dosage,
            duration: state.medicineSupply.refillSchedule || undefined,
            quantity: state.medicineSupply.quantity ?? undefined,
          },
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hasStops, alerts, stopSummary, weeks, lossPercent]);

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
            description="Confirm patient identity. Patient must be aged 18 years or over and under 75 years."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <PatientDetailsStep
                patient={state.patient}
                onChange={(field, value) =>
                  dispatch({ type: "UPDATE_PATIENT", field, value })
                }
                onReturningPatient={(p) =>
                  lookupPrevious(p, (prev) => {
                    if (prev.heightCm !== null) {
                      dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "height", value: prev.heightCm });
                    }
                    if (prev.baselineWeightKg !== null) {
                      dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "baselineWeight", value: prev.baselineWeightKg });
                    }
                    if (prev.pgdSlug === "orlistat") {
                      dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "visitType", value: "continuation" });
                    }
                  })
                }
              />
              {previous && (
                <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-sm">
                  <p className="font-semibold text-amber-900">This patient already has a weight management record</p>
                  <p className="mt-1 text-amber-900">
                    Last seen {previous.consultationDate}{previous.pgdSlug ? ` (${previous.pgdSlug})` : ""}: {describePrevious(previous)}.
                    Height{previous.baselineWeightKg !== null ? " and baseline weight have" : " has"} been carried forward; confirm them, the visit type and the start date on the weight assessment step.
                  </p>
                </div>
              )}
            </div>
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
            description="Calculate BMI and document baseline weight and waist circumference. BMI 30 or more, or BMI 28 or more with at least one obesity-related comorbidity, is required."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <SelectInput
                label="Type of visit"
                value={state.weightAssessment.visitType}
                onChange={(v) => dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "visitType", value: v })}
                options={[
                  { value: "initiation", label: "First supply of orlistat (baseline recorded today)" },
                  { value: "continuation", label: "Continuation: patient already on orlistat" },
                ]}
                required
              />
              {state.weightAssessment.visitType === "continuation" && (
                <div className="p-3 rounded-md bg-gray-50 border border-gray-200 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-900 mb-1">Treatment start date (first orlistat supply) <span className="text-red-400">*</span></label>
                      <input
                        type="date"
                        value={state.weightAssessment.treatmentStartDate}
                        onChange={(e) => dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "treatmentStartDate", value: e.target.value })}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                      />
                    </div>
                    <NumberInput
                      label="Baseline weight at start of treatment"
                      value={state.weightAssessment.baselineWeight}
                      onChange={(v) => dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "baselineWeight", value: v })}
                      min={30}
                      max={300}
                      unit="kg"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {weeks !== null ? `Week ${weeks + 1} of treatment. ` : ""}
                    {lossPercent !== null ? `${lossPercent}% of baseline body weight lost. ` : ""}
                    PGD: review at {ORLISTAT_REVIEW_WEEKS} weeks from the start; continue only if at least 5% of body weight has been lost from baseline, otherwise discontinue and refer to the GP.
                  </p>
                </div>
              )}
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
                  label={state.weightAssessment.visitType === "continuation" ? "Weight today" : "Baseline weight"}
                  value={state.weightAssessment.weight}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "weight", value: v })
                  }
                  min={30}
                  max={300}
                  unit="kg"
                />
              </div>

              <NumberInput
                label="Baseline waist circumference"
                value={state.weightAssessment.waistCircumference}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_WEIGHT_ASSESSMENT", field: "waistCircumference", value: v })
                }
                min={40}
                max={250}
                unit="cm"
                required
              />

              {state.weightAssessment.bmi !== null && (
                <div className="p-3 bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded">
                  <p className="text-sm font-semibold text-[color:var(--tenant-primary)]">
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

              <div className="border-t pt-4">
                <Checkbox
                  label="Patient is motivated and committed to weight loss with a structured reduced-calorie diet"
                  checked={state.weightAssessment.motivatedStructuredDiet}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_WEIGHT_ASSESSMENT",
                      field: "motivatedStructuredDiet",
                      value: v,
                    })
                  }
                  description="Inclusion criterion. Reduced-calorie diet, typically 500 to 1000 kcal below estimated daily expenditure."
                  required
                />
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-semibold text-red-700 mb-2">
                  Exclusion Criteria (do not supply)
                </p>
              </div>

              <Checkbox
                label="Cholestasis or severe hepatic impairment"
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
                description="e.g. cystic fibrosis, coeliac disease, inflammatory bowel disease"
              />

              <Checkbox
                label="Known hypersensitivity to orlistat or any component of the formulation"
                checked={state.medicalHistory.hypersensitivityToOrlistat}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "hypersensitivityToOrlistat",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Uncontrolled or newly diagnosed diabetes"
                checked={state.medicalHistory.uncontrolledOrNewDiabetes}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "uncontrolledOrNewDiabetes",
                    value: v,
                  })
                }
                description="Requires GP review before starting orlistat."
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
                label="Gallstone disease"
                checked={state.medicalHistory.gallbladderDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "gallbladderDisease",
                    value: v,
                  })
                }
                description="Monitor for interactions and symptoms."
              />

              <Checkbox
                label="History of oxalate kidney stones"
                checked={state.medicalHistory.oxalateKidneyStones}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "oxalateKidneyStones",
                    value: v,
                  })
                }
                description="Risk of hyperoxaluria and recurrence."
              />

              <Checkbox
                label="Chronic liver disease or elevated liver function tests"
                checked={state.medicalHistory.chronicLiverDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "chronicLiverDisease",
                    value: v,
                  })
                }
                description="Proceed with caution; ensure baseline LFTs checked."
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
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
                description="EXCLUSION. Relative contraindication; requires specialist assessment."
              />

              <Checkbox
                label="Taking another anticoagulant (edoxaban, dabigatran, rivaroxaban)"
                checked={state.medications.takesOtherAnticoagulant}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesOtherAnticoagulant",
                    value: v,
                  })
                }
                description="Caution. Enhanced anticoagulant effect; requires GP liaison and INR monitoring if applicable."
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
                description="Caution. Administer levothyroxine at least 4 hours before orlistat; monitor thyroid function and dose."
              />

              <Checkbox
                label="Taking antiepileptic medicines"
                checked={state.medications.takesAntiEpileptics}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesAntiEpileptics",
                    value: v,
                  })
                }
                description="EXCLUSION. Orlistat may reduce absorption and unbalance treatment, leading to convulsions. Refer to the GP or specialist."
              />

              <Checkbox
                label="Concurrent ciclosporin therapy"
                checked={state.medications.takesCiclosporin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesCiclosporin",
                    value: v,
                  })
                }
                description="EXCLUSION. Reduced absorption of ciclosporin."
              />

              <Checkbox
                label="Taking a bile acid sequestrant (e.g. colestyramine, colesevelam)"
                checked={state.medications.takesBileAcidSequestrants}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesBileAcidSequestrants",
                    value: v,
                  })
                }
                description="Caution. Monitor for interactions and symptoms."
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
                description="Severe diarrhoea may reduce contraceptive efficacy; advise additional barrier method during episodes."
              />

              <Checkbox
                label="Taking antiretroviral medicines for HIV"
                checked={state.medications.takesHIVAntiretrovirals}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesHIVAntiretrovirals",
                    value: v,
                  })
                }
                description="EXCLUSION. Orlistat may reduce absorption and lead to loss of virological control. Refer to the GP or HIV specialist team."
              />

              <Checkbox
                label="Taking amiodarone"
                checked={state.medications.takesAmiodarone}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesAmiodarone",
                    value: v,
                  })
                }
                description="EXCLUSION. Orlistat may reduce amiodarone plasma levels. Refer to the GP or specialist."
              />

              <Checkbox
                label="Taking any other medicine with an SmPC interaction that cannot be managed in a pharmacy setting"
                checked={state.medications.otherSignificantInteraction}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "otherSignificantInteraction",
                    value: v,
                  })
                }
                description="EXCLUSION. Refer to the GP for medicines reconciliation."
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

              <Checkbox
                label="No known drug allergies (confirmed with the patient)"
                checked={state.medications.nkda}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "nkda",
                    value: v,
                  })
                }
              />
              {!state.medications.nkda && (
                <TextInput
                  label="Drug allergies"
                  value={state.medications.allergies}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "allergies",
                      value: v,
                    })
                  }
                  placeholder="Name the medicine and the reaction"
                  required
                />
              )}
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
                ? "Exclusion criteria met, cannot proceed."
                : null
            }
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Excluded: Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified exclusion criteria, orlistat cannot be supplied under this PGD.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Advise on alternative treatment options and how these can be accessed. Document any advice given and the decision reached. Inform or refer to the GP as appropriate.
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
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1">
                <p className="text-xs text-blue-700">
                  <strong>Medicine:</strong> Orlistat 120mg capsules (POM). Oral: swallow capsule whole with a glass of water with or shortly before each main meal.
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Dose:</strong> 120mg with each main meal containing fat, up to 3 times daily (typically breakfast, lunch and dinner). If a meal is missed or contains negligible fat, omit the dose. Maximum 360mg daily (3 x 120mg).
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Quantity:</strong> up to {ORLISTAT_MAX_QUANTITY} capsules per patient (28-day supply at maximum dose of 3 capsules daily).
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Treatment period:</strong> review at 12 weeks (3 months) from start. Continue only if at least 5% reduction in body weight from baseline; otherwise discontinue and refer to GP.
                </p>
              </div>

              <TextInput
                label="Brand of orlistat supplied"
                value={state.medicineSupply.brand}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "brand",
                    value: v,
                  })
                }
                placeholder="e.g., Xenical, or generic manufacturer name"
                required
              />

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
                min={1}
                max={ORLISTAT_MAX_QUANTITY}
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
                placeholder="e.g., 28 days"
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-3">
              <Checkbox
                label="Patient Information Leaflet (PIL) supplied"
                checked={state.counselling.pilSupplied}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pilSupplied",
                    value: v,
                  })
                }
                description="Ensure patient understands mechanism of action, dietary requirements and expected side effects."
                required
              />

              <Checkbox
                label="Reduced-calorie, low-fat diet explained (30% or less of daily calories from fat)"
                checked={state.counselling.dietaryAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "dietaryAdvice",
                    value: v,
                  })
                }
                description="To minimise GI side effects such as oily spotting, flatulence and stool urgency."
                required
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
                label="Multivitamin supplement containing fat-soluble vitamins (A, D, E, K) advised, taken at least 2 hours apart from orlistat"
                checked={state.counselling.multivitamin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "multivitamin",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="Do not take orlistat if a meal is missed or contains no fat"
                checked={state.counselling.missedMealAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "missedMealAdvice",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="If taking levothyroxine, administer at least 4 hours before orlistat"
                checked={state.counselling.separationAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "separationAdvice",
                    value: v,
                  })
                }
                description="Required when the patient takes levothyroxine."
                required={state.medications.takesLevothyroxine}
              />

              <Checkbox
                label="Report any jaundice, persistent abdominal pain, signs of pancreatitis, or persistent diarrhoea to the GP immediately"
                checked={state.counselling.redFlagSymptoms}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "redFlagSymptoms",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="Expect weight loss to be gradual (typically 2 to 4 kg in the first 12 weeks with a reduced-calorie diet and exercise)"
                checked={state.counselling.expectedWeightLoss}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "expectedWeightLoss",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="If diabetes medications are being taken, inform the GP as blood glucose control may improve and medication adjustment may be needed"
                checked={state.counselling.diabetesMedicationAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "diabetesMedicationAdvice",
                    value: v,
                  })
                }
                description="Required when type 2 diabetes is recorded as a comorbidity."
                required={state.weightAssessment.comorbidities.includes("type2diabetes")}
              />

              <Checkbox
                label="If on an anticoagulant, ensure GP is aware and INR is monitored as appropriate"
                checked={state.counselling.anticoagulantAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "anticoagulantAdvice",
                    value: v,
                  })
                }
                description="Required when the patient takes an anticoagulant. Warfarin itself is an exclusion."
                required={state.medications.takesOtherAnticoagulant}
              />

              <Checkbox
                label="Follow-up appointment at 12 weeks (3 months) arranged to assess weight loss progress"
                checked={state.counselling.reviewSchedule}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "reviewSchedule",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="Weight loss target discussed (at least 5% of baseline body weight by 12 weeks); continue treatment only if this target is met"
                checked={state.counselling.weightLossTarget}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "weightLossTarget",
                    value: v,
                  })
                }
                required
              />

              <Checkbox
                label="Follow-up protocol explained (discontinue and refer to GP if less than 5% loss at 12 weeks)"
                checked={state.counselling.followUpProtocol}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "followUpProtocol",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Report any suspected adverse drug reactions or side effects to the GP or via the Yellow Card scheme (yellowcard.mhra.gov.uk)"
                checked={state.counselling.yellowCard}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "yellowCard",
                    value: v,
                  })
                }
                required
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
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
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

      {hasStops && (
        <div className="rounded-lg bg-red-50 border border-red-300 p-4 space-y-2 print:hidden">
          <p className="text-sm font-semibold text-red-900">Excluded: {stopSummary}. Orlistat cannot be supplied under this PGD.</p>
          <TextArea
            label="Advice given (excluded or declines treatment): alternative treatment options and how to access them, decision reached, GP informed or referred"
            value={state.exclusionAdvice}
            onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION_ADVICE", value: v })}
            rows={3}
            required
          />
          <p className="text-xs text-red-800">Record the advice, then use &quot;Save as not supplied&quot; on the step below. The PGD requires advice given to an excluded patient to be recorded.</p>
        </div>
      )}

      {renderStep()}
    </div>
  );
}

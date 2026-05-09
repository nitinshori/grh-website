"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { ShinglesConsultationState, ShinglesAction } from "./lib/shingles-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/shingles-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/shingles-clinical-logic";
import { validateStep } from "./lib/shingles-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { ShinglesSummaryReport } from "./components/ShinglesSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: ShinglesConsultationState, action: ShinglesAction): ShinglesConsultationState {
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

export default function ShinglesClient() {
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
    if (state.currentStep <= 3 && hardStops) return false;
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
      case 0:
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
          />
        );

      case 1:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Age eligible (50+ or 18+ if immunosuppressed)"
              checked={state.assessment.ageEligible}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "ageEligible",
                  value: v,
                })
              }
              description="Standard eligibility 50+ years; 18+ if immunocompromised"
            />
            <Checkbox
              label="Patient is immunosuppressed"
              checked={state.assessment.immunosuppressed}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "immunosuppressed",
                  value: v,
                })
              }
              description="HIV, cancer treatment, organ transplant, etc."
            />
            <SelectInput
              label="Pregnancy status"
              value={state.assessment.pregnancyStatus}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "pregnancyStatus",
                  value: v,
                })
              }
              options={[
                { value: "not-pregnant", label: "Not pregnant" },
                { value: "unknown", label: "Pregnancy status unknown" },
                { value: "confirmed", label: "Confirmed pregnant" },
              ]}
              required
            />
            <Checkbox
              label="Previous Shingrix dose received"
              checked={state.assessment.previousShingrix}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousShingrix",
                  value: v,
                })
              }
              description="Has patient received dose 1 of the 2-dose series?"
            />
            <Checkbox
              label="Patient has history of shingles"
              checked={state.assessment.previousShinglesHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "previousShinglesHistory",
                  value: v,
                })
              }
              description="Vaccination still protective even with previous episode"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Check contraindications:
            </p>
            <Checkbox
              label="No anaphylaxis to vaccine components"
              checked={!state.assessment.anaphylaxisToComponent}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "anaphylaxisToComponent",
                  value: !v,
                })
              }
              description="Contraindicated if previous anaphylactic reaction to Shingrix"
            />
            <Checkbox
              label="No severe acute illness present"
              checked={!state.assessment.severeAcuteIllness}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_ASSESSMENT",
                  field: "severeAcuteIllness",
                  value: !v,
                })
              }
              description="Defer if patient has serious systemic infection or fever"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 font-medium">
              Counselling delivered:
            </p>
            <Checkbox
              label="Explained 2-dose schedule"
              checked={state.counselling.explainedDoseSchedule}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedDoseSchedule",
                  value: v,
                })
              }
              description="Dose 1 today, Dose 2 at 2 months"
            />
            <Checkbox
              label="Discussed local injection reactions"
              checked={state.counselling.explainedLocalReactions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedLocalReactions",
                  value: v,
                })
              }
              description="Stronger local reactions than other vaccines are normal"
            />
            <Checkbox
              label="Explained effectiveness"
              checked={state.counselling.explainedEffectiveness}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedEffectiveness",
                  value: v,
                })
              }
              description="Over 90% effective in preventing shingles and postherpetic neuralgia"
            />
            <Checkbox
              label="Clarified NOT a live vaccine"
              checked={state.counselling.explainedNotLiveVaccine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "explainedNotLiveVaccine",
                  value: v,
                })
              }
              description="Safe for immunocompromised patients (unlike Zostavax)"
            />
            <Checkbox
              label="Offered written information"
              checked={state.counselling.offeredWrittenInfo}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "offeredWrittenInfo",
                  value: v,
                })
              }
              description="Patient information leaflet provided"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-sm font-medium text-teal-900">
                Shingrix (Recombinant Zoster Vaccine)
              </p>
              <p className="text-xs text-teal-700 mt-1">
                0.5 mL intramuscular injection into deltoid
              </p>
              <p className="text-xs text-teal-700 mt-2">
                Schedule: Dose 1 today, Dose 2 in 2 months
              </p>
            </div>
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
              placeholder="Patient reactions or concerns..."
              rows={4}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-navy-900 mb-3">
                Pharmacist Details
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
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
                  placeholder="Jane Smith"
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
                  placeholder="2123456"
                  required
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-navy-900 mb-3">
                Pharmacy Details
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
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
                  placeholder="High Street Pharmacy"
                />
                <TextInput
                  label="Pharmacy address"
                  value={state.summary.pharmacyAddress}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "pharmacyAddress",
                      value: v,
                    })
                  }
                  placeholder="123 High Street, London"
                />
              </div>
            </div>
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </div>
        );

      case 6:
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              Consultation Complete
            </h3>
            <p className="text-sm text-gray-600">
              The shingles vaccination ePGD consultation has been recorded successfully.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Patient should return for their second dose as scheduled in 2 months.
            </p>
          </div>
        );

      case 7:
        return (
          <ShinglesSummaryReport
            state={state}
            alerts={alerts}
            doseRecommendation={doseRecommendation}
          />
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
       getConsultationData={getConsultationData}>
        {renderStep()}
      </StepWrapper>
    </div>
  );
}

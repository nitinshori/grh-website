"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  RecurrentUTIConsultationState,
  RecurrentUTIAction,
} from "./lib/recurrent-uti-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialRecurrentUTIState } from "./lib/recurrent-uti-types";
import { getAllAlerts, hasHardStops } from "./lib/recurrent-uti-clinical-logic";
import { validateStep } from "./lib/recurrent-uti-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../shared/components/SummaryReportShell";

// ─── Reducer ───

function reducer(
  state: RecurrentUTIConsultationState,
  action: RecurrentUTIAction
): RecurrentUTIConsultationState {
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

    case "UPDATE_UTI_HISTORY":
      newState.utiHistory = { ...newState.utiHistory, [action.field]: action.value };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_MEDICINES":
      newState.medicines = { ...newState.medicines, [action.field]: action.value };
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
      return createInitialRecurrentUTIState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function RecurrentUTIClient() {
  const [state, dispatch] = useReducer(reducer, createInitialRecurrentUTIState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Compute alerts
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    return newState;
  }, [state, alerts]);

  // Validation
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);

  // Can proceed?
  const canProceed = !validationError && (!hasStops || state.currentStep >= 5);

  // Mark step as completed
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

  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Female patients aged 16-65. Confirm patient identity."
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

      case 1: // Consent
        return (
          <StepWrapper
            title="Consent &amp; ID Verification"
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

      case 2: // UTI History
        return (
          <StepWrapper
            title="Recurrent UTI History"
            description="Document recurrent UTI pattern (3+ in 12 months OR 2+ in 6 months, confirmed)."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Inclusion Criteria
                </p>
                <p className="text-sm text-blue-800">
                  3 or more UTIs in the past 12 months, OR 2 or more in the past 6 months, with symptoms confirmed by clinical records.
                </p>
              </div>

              <NumberInput
                label="Number of UTIs in past 12 months"
                value={state.utiHistory.utiInPast12Months}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_UTI_HISTORY",
                    field: "utiInPast12Months",
                    value: v,
                  })
                }
                min={0}
              />

              <NumberInput
                label="Number of UTIs in past 6 months"
                value={state.utiHistory.utiInPast6Months}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_UTI_HISTORY",
                    field: "utiInPast6Months",
                    value: v,
                  })
                }
                min={0}
              />

              <Checkbox
                label="UTIs confirmed by clinical records"
                checked={state.utiHistory.confirmedByRecords}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_UTI_HISTORY",
                    field: "confirmedByRecords",
                    value: v,
                  })
                }
                description="Patient records must confirm diagnosis with symptoms or positive cultures."
              />

              <TextArea
                label="Typical UTI symptoms"
                value={state.utiHistory.symptoms}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_UTI_HISTORY",
                    field: "symptoms",
                    value: v,
                  })
                }
                placeholder="e.g. dysuria, frequency, suprapubic pain"
              />
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Currently pregnant"
                checked={state.medicalHistory.pregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancy",
                    value: v,
                  })
                }
                description="Contraindication to nitrofurantoin and trimethoprim."
              />

              <Checkbox
                label="Breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "breastfeeding",
                    value: v,
                  })
                }
                description="Caution with nitrofurantoin; trimethoprim preferred."
              />

              <Checkbox
                label="Renal impairment (eGFR < 45 mL/min)"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "renalImpairment",
                    value: v,
                  })
                }
                description="Contraindication to nitrofurantoin; trimethoprim acceptable if eGFR > 15."
              />

              <Checkbox
                label="G6PD deficiency"
                checked={state.medicalHistory.g6pdDeficiency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "g6pdDeficiency",
                    value: v,
                  })
                }
                description="Contraindication to nitrofurantoin (risk of hemolysis)."
              />

              <Checkbox
                label="Hepatic disease"
                checked={state.medicalHistory.hepaticDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "hepaticDisease",
                    value: v,
                  })
                }
                description="Assess risk/benefit; may contraindicate if severe."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Current Medications
        return (
          <StepWrapper
            title="Current Medications"
            description="Screen for interactions and contraindications."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <TextArea
                label="Current medications"
                value={state.medicalHistory.hepaticDisease ? "Medications listed" : ""}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "hepaticDisease",
                    value: v,
                  })
                }
                placeholder="List all current medications to check for interactions..."
              />
              <p className="text-sm text-gray-600">
                Note: Monitor for interactions with warfarin (trimethoprim increases INR) and methotrexate. Consider alternative prophylaxis if significant interactions identified.
              </p>
            </div>
          </StepWrapper>
        );

      case 5: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications &amp; Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present — cannot proceed to medicine supply."
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
                  Based on the identified contraindications, antibiotic prophylaxis cannot be supplied under this PGD. Refer to GP for assessment and alternative management.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 6: // Medicine Selection
        return (
          <StepWrapper
            title="Antibiotic Prophylaxis Selection"
            description="Select appropriate medicine and regimen."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-6">
              <SelectInput
                label="Prophylaxis type"
                value={state.medicines.prophylaxisType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINES",
                    field: "prophylaxisType",
                    value: v,
                  })
                }
                options={[
                  { value: "continuous", label: "Continuous long-term (3-6 months)" },
                  { value: "postcoital", label: "Post-coital (after intercourse)" },
                ]}
                required
              />

              <SelectInput
                label="Medicine"
                value={state.medicines.medicine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINES",
                    field: "medicine",
                    value: v,
                  })
                }
                options={[
                  { value: "Nitrofurantoin", label: "Nitrofurantoin" },
                  { value: "Trimethoprim", label: "Trimethoprim" },
                ]}
                required
              />

              {state.medicines.medicine === "Nitrofurantoin" && (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm font-semibold text-amber-900">Nitrofurantoin</p>
                    <p className="text-sm text-amber-800 mt-1">
                      50-100 mg at night. Avoid if eGFR {'{<'} 45 or G6PD deficiency. Take with food.
                    </p>
                  </div>

                  <SelectInput
                    label="Dose"
                    value={state.medicines.dose}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINES",
                        field: "dose",
                        value: v,
                      })
                    }
                    options={[
                      { value: "50mg", label: "50mg" },
                      { value: "100mg", label: "100mg" },
                    ]}
                    required
                  />
                </>
              )}

              {state.medicines.medicine === "Trimethoprim" && (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm font-semibold text-amber-900">Trimethoprim</p>
                    <p className="text-sm text-amber-800 mt-1">
                      100 mg at night (long-term). Monitor for hyperkalemia and folate deficiency.
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Dose: 100 mg</p>
                  </div>
                </>
              )}

              <SelectInput
                label="Frequency"
                value={state.medicines.frequency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINES",
                    field: "frequency",
                    value: v,
                  })
                }
                options={[
                  { value: "once-daily", label: "Once daily (at night)" },
                  { value: "postcoital", label: "Single dose post-intercourse" },
                ]}
                required
              />

              <SelectInput
                label="Duration"
                value={state.medicines.duration}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINES",
                    field: "duration",
                    value: v,
                  })
                }
                options={[
                  { value: "3-6-months", label: "3-6 months continuous" },
                  { value: "until-review", label: "Until GP review" },
                  { value: "postcoital-ongoing", label: "Post-coital as needed" },
                ]}
                required
              />

              <Checkbox
                label="Post-coital option discussed"
                checked={state.medicines.postCoitalOption}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINES",
                    field: "postCoitalOption",
                    value: v,
                  })
                }
                description="Patient can take single dose within 2 hours of intercourse if preferred."
              />
            </div>
          </StepWrapper>
        );

      case 7: // Counselling & Supply
        return (
          <StepWrapper
            title="Counselling &amp; Medicine Supply"
            description="Confirm counselling provided and document supply."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Advised to complete 3-6 month course"
                checked={state.counselling.completeCourseAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "completeCourseAdvice",
                    value: v,
                  })
                }
                description="Regular prophylaxis important for effectiveness."
              />

              <Checkbox
                label="Advised to perform regular urine dipstick testing"
                checked={state.counselling.urineDipstickAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "urineDipstickAdvice",
                    value: v,
                  })
                }
                description="To monitor for asymptomatic bacteriuria."
              />

              <Checkbox
                label="Advised about hydration and urinary habits"
                checked={state.counselling.hydrationAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "hydrationAdvice",
                    value: v,
                  })
                }
                description="Regular voiding, avoid holding urine, adequate fluid intake."
              />

              <Checkbox
                label="Advised about voiding habits (post-intercourse)"
                checked={state.counselling.voidingHabitsAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "voidingHabitsAdvice",
                    value: v,
                  })
                }
                description="Void soon after intercourse to prevent ascending infection."
              />

              <Checkbox
                label="Explained cranberry juice is not proven effective"
                checked={state.counselling.cranberryAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "cranberryAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Arranged GP review at end of prophylaxis course"
                checked={state.counselling.reviewScheduleAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "reviewScheduleAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Explained side effects and when to seek help"
                checked={state.counselling.sideEffectsExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "sideEffectsExplained",
                    value: v,
                  })
                }
                description="Nausea, photosensitivity (nitrofurantoin), hyperkalemia (trimethoprim)."
              />
            </div>
          </StepWrapper>
        );

      case 8: // Summary & Print
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-navy-900">
                Summary &amp; Consultation Record
              </h2>
            </div>

            <div className="px-6 py-6">
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
                <RecurrentUTISummaryReport state={updatedState} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: "PREV_STEP" })}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
              >
                &larr; Previous
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
              >
                Print Consultation Record
              </button>
            </div>
          </div>
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

      {alerts.length > 0 && state.currentStep < 6 && (
        <AlertBanner alerts={alerts} />
      )}

      {renderStep()}
    </div>
  );
}

// ─── Summary Report Component ───

function RecurrentUTISummaryReport({
  state,
}: {
  state: RecurrentUTIConsultationState;
}) {
  return (
    <div className="space-y-4 text-xs print:text-[10px]">
      <SectionHeader>Patient Information</SectionHeader>
      <Row
        label="Name"
        value={`${state.patient.firstName} ${state.patient.lastName}`}
      />
      <Row label="Date of Birth" value={state.patient.dateOfBirth} />
      <Row label="Age" value={`${state.patient.age} years`} />
      <Row label="NHS Number" value={state.patient.nhsNumber} />
      <Row label="GP" value={state.patient.gpName} />

      <SectionHeader>Recurrent UTI History</SectionHeader>
      <Row
        label="UTIs in past 12 months"
        value={`${state.utiHistory.utiInPast12Months}`}
      />
      <Row
        label="UTIs in past 6 months"
        value={`${state.utiHistory.utiInPast6Months}`}
      />
      <Row
        label="Confirmed by records"
        value={state.utiHistory.confirmedByRecords ? "Yes" : "No"}
      />

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Pregnancy"
        value={state.medicalHistory.pregnancy ? "Yes" : "No"}
      />
      <Row
        label="Renal impairment (eGFR < 45)"
        value={state.medicalHistory.renalImpairment ? "Yes" : "No"}
      />
      <Row
        label="G6PD deficiency"
        value={state.medicalHistory.g6pdDeficiency ? "Yes" : "No"}
      />

      <SectionHeader>Prophylaxis Prescribed</SectionHeader>
      <Row label="Medicine" value={state.medicines.medicine} />
      <Row label="Dose" value={state.medicines.dose} />
      <Row label="Frequency" value={state.medicines.frequency} />
      <Row label="Duration" value={state.medicines.duration} />
      <Row
        label="Post-coital option discussed"
        value={state.medicines.postCoitalOption ? "Yes" : "No"}
      />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Complete 3-6 month course", state.counselling.completeCourseAdvice],
          ["Regular urine dipstick monitoring", state.counselling.urineDipstickAdvice],
          ["Hydration &amp; voiding habits", state.counselling.hydrationAdvice],
          ["Post-intercourse voiding", state.counselling.voidingHabitsAdvice],
          ["Side effects explained", state.counselling.sideEffectsExplained],
          ["GP review at end of course", state.counselling.reviewScheduleAdvice],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Recurrent UTI Prevention"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      <ReportFooter pgdName="Recurrent UTI Prevention" />
    </div>
  );
}

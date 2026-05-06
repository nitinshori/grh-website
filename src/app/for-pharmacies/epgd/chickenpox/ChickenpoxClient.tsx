"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  ChickenpoxConsultationState,
  ChickenpoxAction,
} from "./lib/chickenpox-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialChickenpoxState } from "./lib/chickenpox-types";
import { getAllAlerts, hasHardStops } from "./lib/chickenpox-clinical-logic";
import { validateStep } from "./lib/chickenpox-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  SelectInput,
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
  state: ChickenpoxConsultationState,
  action: ChickenpoxAction
): ChickenpoxConsultationState {
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

    case "UPDATE_ELIGIBILITY":
      newState.eligibility = { ...newState.eligibility, [action.field]: action.value };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;

    case "UPDATE_VACCINE_ADMIN":
      newState.vaccineAdmin = { ...newState.vaccineAdmin, [action.field]: action.value };
      break;

    case "UPDATE_POST_VACCINE":
      newState.postVaccine = { ...newState.postVaccine, [action.field]: action.value };
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
      return createInitialChickenpoxState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function ChickenpoxClient() {
  const [state, dispatch] = useReducer(reducer, createInitialChickenpoxState());
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
  const canProceed = !validationError && (!hasStops || state.currentStep >= 4);

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


  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Confirm patient identity and age."
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

      case 2: // Eligibility
        return (
          <StepWrapper
            title="Eligibility Assessment"
            description="Confirm at least one eligibility criterion."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="No prior history of chickenpox or varicella"
                checked={state.eligibility.noPriorVaricella}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "noPriorVaricella",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Seronegative (confirmed by testing)"
                checked={state.eligibility.seronegative}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "seronegative",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Healthcare worker requiring immunity"
                checked={state.eligibility.healthcareWorker}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "healthcareWorker",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Close contact of immunosuppressed person"
                checked={state.eligibility.closeContactImmunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ELIGIBILITY",
                    field: "closeContactImmunosuppressed",
                    value: v,
                  })
                }
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
                label="Currently pregnant or planning pregnancy"
                checked={state.medicalHistory.pregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancy",
                    value: v,
                  })
                }
                description="Avoid vaccination if pregnant; avoid pregnancy 1 month after vaccination."
              />

              <Checkbox
                label="Immunosuppressed or on immunosuppressive therapy"
                checked={state.medicalHistory.immunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "immunosuppressed",
                    value: v,
                  })
                }
                description="Live vaccine is contraindicated."
              />

              <Checkbox
                label="Severe febrile illness"
                checked={state.medicalHistory.severeFebrilIllness}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeFebrilIllness",
                    value: v,
                  })
                }
                description="Defer vaccination until recovery."
              />

              <Checkbox
                label="Anaphylaxis to neomycin"
                checked={state.medicalHistory.anaphylaxisNeomycin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisNeomycin",
                    value: v,
                  })
                }
                description="Contraindication to varicella vaccine."
              />

              <Checkbox
                label="Anaphylaxis to gelatin"
                checked={state.medicalHistory.anaphylaxisGelatin}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisGelatin",
                    value: v,
                  })
                }
                description="Contraindication to varicella vaccine."
              />

              <Checkbox
                label="Active untreated tuberculosis"
                checked={state.medicalHistory.activeTB}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "activeTB",
                    value: v,
                  })
                }
                description="Live vaccine should not be given."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications & Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present — cannot proceed to vaccine administration."
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
                  Hard Stop — Cannot Vaccinate
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified contraindications, varicella vaccination cannot be
                  administered. Refer the patient to their GP or specialist clinic for further
                  advice.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 5: // Vaccine Administration
        return (
          <StepWrapper
            title="Vaccine Administration"
            description="Record vaccine administered and administration details."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <SelectInput
                label="Vaccine"
                value={state.vaccineAdmin.vaccine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "vaccine",
                    value: v,
                  })
                }
                options={[
                  { value: "Varivax", label: "Varivax (live attenuated)" },
                  { value: "Varilrix", label: "Varilrix (live attenuated)" },
                ]}
                required
              />

              <TextInput
                label="Dose 1 date"
                value={state.vaccineAdmin.dose1Date}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose1Date",
                    value: v,
                  })
                }
                type="date"
                required
              />

              <TextInput
                label="Dose 1 injection site"
                value={state.vaccineAdmin.dose1Site}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose1Site",
                    value: v,
                  })
                }
                placeholder="e.g. Left deltoid, Right deltoid"
                required
              />

              <TextInput
                label="Lot/Batch number"
                value={state.vaccineAdmin.dose1Lot}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose1Lot",
                    value: v,
                  })
                }
                placeholder="Vaccine lot number"
              />

              <TextInput
                label="Dose 2 scheduled date (4-8 weeks later)"
                value={state.vaccineAdmin.dose2Scheduled}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "dose2Scheduled",
                    value: v,
                  })
                }
                type="date"
              />

              <TextInput
                label="Administered by (name and credentials)"
                value={state.vaccineAdmin.administeredBy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_VACCINE_ADMIN",
                    field: "administeredBy",
                    value: v,
                  })
                }
                placeholder="e.g. John Smith, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Post-Vaccine Observations
        return (
          <StepWrapper
            title="Post-Vaccine Observations & Counselling"
            description="Confirm post-vaccination observations and counselling provided."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
              <Checkbox
                label="Any immediate reactions observed"
                checked={state.postVaccine.reactionsObserved}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "reactionsObserved",
                    value: v,
                  })
                }
                description="e.g. redness, swelling at injection site"
              />

              <Checkbox
                label="Mild rash developed (5-26 days post-vaccine)"
                checked={state.postVaccine.rashDeveloped}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "rashDeveloped",
                    value: v,
                  })
                }
              />

              {state.postVaccine.rashDeveloped && (
                <TextInput
                  label="Date rash onset"
                  value={state.postVaccine.rashOnset}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_POST_VACCINE",
                      field: "rashOnset",
                      value: v,
                    })
                  }
                  type="date"
                />
              )}

              <Checkbox
                label="Advised to avoid contact with immunosuppressed persons if rash develops"
                checked={state.postVaccine.contactWithImmunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "contactWithImmunosuppressed",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Advised to avoid salicylates for 6 weeks post-vaccine"
                checked={state.postVaccine.salicylatesAvoided}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "salicylatesAvoided",
                    value: v,
                  })
                }
                description="To prevent Reye's syndrome if chickenpox infection occurs."
              />

              <Checkbox
                label="Pregnancy avoidance advice given"
                checked={state.postVaccine.pregnancyAdviceGiven}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "pregnancyAdviceGiven",
                    value: v,
                  })
                }
                description="Avoid pregnancy for 1 month after dose 2."
              />
            </div>
          </StepWrapper>
        );

      case 7: // Summary & Print
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
                <ChickenpoxSummaryReport state={updatedState} />
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

      {alerts.length > 0 && state.currentStep < 5 && (
        <AlertBanner alerts={alerts} />
      )}

      {renderStep()}
    </div>
  );
}

// ─── Summary Report Component ───

function ChickenpoxSummaryReport({
  state,
}: {
  state: ChickenpoxConsultationState;
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

      <SectionHeader>Eligibility</SectionHeader>
      <Row
        label="No prior varicella history"
        value={state.eligibility.noPriorVaricella ? "Yes" : "No"}
      />
      <Row
        label="Seronegative"
        value={state.eligibility.seronegative ? "Yes" : "No"}
      />
      <Row
        label="Healthcare worker"
        value={state.eligibility.healthcareWorker ? "Yes" : "No"}
      />
      <Row
        label="Close contact of immunosuppressed"
        value={state.eligibility.closeContactImmunosuppressed ? "Yes" : "No"}
      />

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Pregnancy"
        value={state.medicalHistory.pregnancy ? "Yes" : "No"}
      />
      <Row
        label="Immunosuppressed"
        value={state.medicalHistory.immunosuppressed ? "Yes" : "No"}
      />
      <Row
        label="Anaphylaxis to neomycin/gelatin"
        value={
          state.medicalHistory.anaphylaxisNeomycin ||
          state.medicalHistory.anaphylaxisGelatin
            ? "Yes"
            : "No"
        }
      />

      <SectionHeader>Vaccine Administration</SectionHeader>
      <Row label="Vaccine" value={state.vaccineAdmin.vaccine} />
      <Row label="Dose 1 date" value={state.vaccineAdmin.dose1Date} />
      <Row label="Injection site" value={state.vaccineAdmin.dose1Site} />
      <Row label="Lot number" value={state.vaccineAdmin.dose1Lot} />
      <Row label="Dose 2 scheduled" value={state.vaccineAdmin.dose2Scheduled} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["2-dose schedule explained", state.postVaccine.pregnancyAdviceGiven],
          ["Pregnancy avoidance (1 month)", state.postVaccine.pregnancyAdviceGiven],
          ["Mild rash may develop", true],
          ["Avoid contact if rash develops", state.postVaccine.contactWithImmunosuppressed],
          ["Salicylate avoidance", state.postVaccine.salicylatesAvoided],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Chickenpox/Varicella"
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

      <ReportFooter pgdName="Chickenpox/Varicella Vaccination" />
    </div>
  );
}

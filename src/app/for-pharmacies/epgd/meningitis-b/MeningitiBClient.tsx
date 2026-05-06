"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  MeningitiBConsultationState,
  MeningitiBAction,
} from "./lib/meningitis-b-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialMeningitiBState } from "./lib/meningitis-b-types";
import { getAllAlerts, hasHardStops } from "./lib/meningitis-b-clinical-logic";
import { validateStep } from "./lib/meningitis-b-validation";
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
  state: MeningitiBConsultationState,
  action: MeningitiBAction
): MeningitiBConsultationState {
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

    case "UPDATE_RISK_ASSESSMENT":
      newState.riskAssessment = { ...newState.riskAssessment, [action.field]: action.value };
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
      return createInitialMeningitiBState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function MeningitiBClient() {
  const [state, dispatch] = useReducer(reducer, createInitialMeningitiBState());
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

      case 2: // Risk Assessment
        return (
          <StepWrapper
            title="Risk Assessment"
            description="Identify meningitis B risk factors."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Close contact of meningitis B case"
                checked={state.riskAssessment.closeContactOfCase}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "closeContactOfCase",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Complement deficiency (inherited or acquired)"
                checked={state.riskAssessment.complementDeficiency}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "complementDeficiency",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Asplenia or functional asplenia"
                checked={state.riskAssessment.asplenia}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "asplenia",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="University fresher (private provision)"
                checked={state.riskAssessment.universityFresher}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "universityFresher",
                    value: v,
                  })
                }
              />
              <Checkbox
                label="Travel to hyperendemic area"
                checked={state.riskAssessment.hyperendemicArea}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_RISK_ASSESSMENT",
                    field: "hyperendemicArea",
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
                label="Anaphylaxis to previous dose or vaccine component"
                checked={state.medicalHistory.anaphylaxisHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "anaphylaxisHistory",
                    value: v,
                  })
                }
                description="Contraindication to Bexsero vaccine."
              />

              <Checkbox
                label="Severe acute febrile illness"
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
                label="Recent other vaccination (within 1 month)"
                checked={state.medicalHistory.recentVaccination}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "recentVaccination",
                    value: v,
                  })
                }
                description="Bexsero can be given concurrently or at any interval."
              />

              <Checkbox
                label="Pregnancy"
                checked={state.medicalHistory.pregnancy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancy",
                    value: v,
                  })
                }
                description="No specific contraindication, but assess risk/benefit."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Contraindications Review
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
                  Based on the identified contraindications, Bexsero vaccination cannot be
                  administered. Refer the patient to their GP or specialist clinic.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 5: // Vaccine Administration
        return (
          <StepWrapper
            title="Vaccine Administration"
            description="Record Bexsero doses administered (2 doses, 1 month apart for adults)."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Bexsero (4CMenB) Vaccination Schedule
                </p>
                <p className="text-sm text-blue-800">
                  Two doses, 1 month apart for adults. Both doses required for full protection.
                </p>
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <h4 className="font-semibold text-sm text-navy-900 mb-4">Dose 1</h4>
                <div className="space-y-4">
                  <TextInput
                    label="Dose 1 date"
                    value={state.vaccineAdmin.vaccinationDate1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "vaccinationDate1",
                        value: v,
                      })
                    }
                    type="date"
                    required
                  />

                  <TextInput
                    label="Dose 1 injection site"
                    value={state.vaccineAdmin.injectionSite1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "injectionSite1",
                        value: v,
                      })
                    }
                    placeholder="e.g. Left deltoid, Right deltoid"
                    required
                  />

                  <TextInput
                    label="Dose 1 lot/batch number"
                    value={state.vaccineAdmin.lotNumber1}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "lotNumber1",
                        value: v,
                      })
                    }
                    placeholder="Vaccine lot number"
                  />
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <h4 className="font-semibold text-sm text-navy-900 mb-4">Dose 2 (1 month later)</h4>
                <div className="space-y-4">
                  <TextInput
                    label="Dose 2 date"
                    value={state.vaccineAdmin.vaccinationDate2}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "vaccinationDate2",
                        value: v,
                      })
                    }
                    type="date"
                    required
                  />

                  <TextInput
                    label="Dose 2 injection site"
                    value={state.vaccineAdmin.injectionSite2}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "injectionSite2",
                        value: v,
                      })
                    }
                    placeholder="e.g. Left deltoid, Right deltoid"
                    required
                  />

                  <TextInput
                    label="Dose 2 lot/batch number"
                    value={state.vaccineAdmin.lotNumber2}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_VACCINE_ADMIN",
                        field: "lotNumber2",
                        value: v,
                      })
                    }
                    placeholder="Vaccine lot number"
                  />
                </div>
              </div>

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
                placeholder="e.g. Sarah Jones, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Post-Vaccine Observations
        return (
          <StepWrapper
            title="Post-Vaccine Observations &amp; Counselling"
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
                label="Injection site reaction observed"
                checked={state.postVaccine.injectionSiteReaction}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "injectionSiteReaction",
                    value: v,
                  })
                }
                description="Very common: redness, swelling, pain at injection site."
              />

              <Checkbox
                label="Fever observed"
                checked={state.postVaccine.feverObserved}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "feverObserved",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Headache reported"
                checked={state.postVaccine.headacheReported}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "headacheReported",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Myalgia (muscle pain) reported"
                checked={state.postVaccine.myyalgiaReported}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "myyalgiaReported",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Paracetamol advice given (if needed)"
                checked={state.postVaccine.paracetamolAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "paracetamolAdvice",
                    value: v,
                  })
                }
                description="Paracetamol not routinely required but can be used for symptom relief."
              />

              <Checkbox
                label="Meningitis warning signs explained"
                checked={state.postVaccine.meningitisSignsAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "meningitisSignsAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Dose 2 schedule review arranged"
                checked={state.postVaccine.reviewScheduleAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_POST_VACCINE",
                    field: "reviewScheduleAdvice",
                    value: v,
                  })
                }
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
                <MeningitiBSummaryReport state={updatedState} />
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

function MeningitiBSummaryReport({
  state,
}: {
  state: MeningitiBConsultationState;
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

      <SectionHeader>Meningitis B Risk Factors</SectionHeader>
      <Row
        label="Close contact of case"
        value={state.riskAssessment.closeContactOfCase ? "Yes" : "No"}
      />
      <Row
        label="Complement deficiency"
        value={state.riskAssessment.complementDeficiency ? "Yes" : "No"}
      />
      <Row
        label="Asplenia"
        value={state.riskAssessment.asplenia ? "Yes" : "No"}
      />
      <Row
        label="University fresher"
        value={state.riskAssessment.universityFresher ? "Yes" : "No"}
      />

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Anaphylaxis history"
        value={state.medicalHistory.anaphylaxisHistory ? "Yes" : "No"}
      />
      <Row
        label="Febrile illness"
        value={state.medicalHistory.severeFebrilIllness ? "Yes" : "No"}
      />

      <SectionHeader>Bexsero Administration</SectionHeader>
      <Row label="Dose 1 date" value={state.vaccineAdmin.vaccinationDate1} />
      <Row label="Dose 1 site" value={state.vaccineAdmin.injectionSite1} />
      <Row label="Dose 2 date" value={state.vaccineAdmin.vaccinationDate2} />
      <Row label="Dose 2 site" value={state.vaccineAdmin.injectionSite2} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["2-dose schedule explained (1 month apart)", state.counselling.doseScheduleAdvice],
          ["Common reactions explained", state.counselling.commonReactionsAdvice],
          ["Injection site reactions (very common)", state.counselling.injectionSiteAdvice],
          ["Meningitis warning signs", state.counselling.meningitisWarningSignsAdvice],
          ["Side effects explained", state.counselling.sideEffectsExplained],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Meningitis B (Bexsero)"
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

      <ReportFooter pgdName="Meningitis B Vaccination" />
    </div>
  );
}

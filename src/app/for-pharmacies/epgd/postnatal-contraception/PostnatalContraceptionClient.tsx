"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  PostnatalContraceptionState,
  PostnatalContraceptionAction,
} from "./lib/postnatal-contraception-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialPostnatalContraceptionState } from "./lib/postnatal-contraception-types";
import { getAllAlerts, hasHardStops } from "./lib/postnatal-contraception-clinical-logic";
import { validateStep } from "./lib/postnatal-contraception-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
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
  state: PostnatalContraceptionState,
  action: PostnatalContraceptionAction
): PostnatalContraceptionState {
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

    case "NEXT_STEP":
      newState.currentStep = Math.min(newState.currentStep + 1, TOTAL_STEPS - 1);
      break;

    case "PREV_STEP":
      newState.currentStep = Math.max(newState.currentStep - 1, 0);
      break;

    case "RESET":
      return createInitialPostnatalContraceptionState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export default function PostnatalContraceptionClient() {
  const [state, dispatch] = useReducer(reducer, createInitialPostnatalContraceptionState());
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
            description="Confirm postnatal woman's identity and age."
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

      case 2: // Postnatal Assessment
        return (
          <StepWrapper
            title="Postnatal Assessment"
            description="Assess postnatal status, delivery method, and breastfeeding."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <NumberInput
                label="Weeks postpartum"
                value={state.assessment.weeksPostpartum}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "weeksPostpartum",
                    value: v,
                  })
                }
                min={0}
              />

              <SelectInput
                label="Type of delivery"
                value={state.assessment.deliveryType}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "deliveryType",
                    value: v,
                  })
                }
                options={[
                  { value: "vaginal", label: "Vaginal delivery" },
                  { value: "vaginal-instrumental", label: "Vaginal with instrumental assistance" },
                  { value: "caesarean", label: "Caesarean section" },
                ]}
                required
              />

              <SelectInput
                label="Breastfeeding status"
                value={state.assessment.breastfeedingStatus}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "breastfeedingStatus",
                    value: v,
                  })
                }
                options={[
                  { value: "exclusively-breastfeeding", label: "Exclusively breastfeeding" },
                  { value: "mixed-feeding", label: "Mixed feeding (breast and formula)" },
                  { value: "formula-feeding", label: "Formula feeding only" },
                ]}
                required
              />

              <SelectInput
                label="VTE risk assessment"
                value={state.assessment.vteRiskAssessment}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_ASSESSMENT",
                    field: "vteRiskAssessment",
                    value: v,
                  })
                }
                options={[
                  { value: "low-risk", label: "Low risk (no risk factors)" },
                  { value: "intermediate-risk", label: "Intermediate risk (minor risk factors)" },
                  { value: "high-risk", label: "High risk (significant risk factors)" },
                ]}
                required
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
                label="Current or recent breast cancer"
                checked={state.medicalHistory.currentBreastCancer}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "currentBreastCancer",
                    value: v,
                  })
                }
                description="Contraindication to POP."
              />

              <Checkbox
                label="Severe active hepatic disease"
                checked={state.medicalHistory.severeLiverDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeLiverDisease",
                    value: v,
                  })
                }
                description="Contraindication to POP."
              />

              <Checkbox
                label="Unexplained vaginal bleeding"
                checked={state.medicalHistory.unexplainedVaginalBleeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "unexplainedVaginalBleeding",
                    value: v,
                  })
                }
                description="Requires investigation before starting POP."
              />

              <Checkbox
                label="Porphyria"
                checked={state.medicalHistory.porphyria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "porphyria",
                    value: v,
                  })
                }
                description="Contraindication to POP."
              />

              <Checkbox
                label="History of breast cancer (cleared > 5 years ago)"
                checked={state.medicalHistory.pastBreastCancer}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pastBreastCancer",
                    value: v,
                  })
                }
                description="Caution; specialist advice recommended if < 5 years clear."
              />

              <Checkbox
                label="Benign or malignant liver tumours"
                checked={state.medicalHistory.liverTumours}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "liverTumours",
                    value: v,
                  })
                }
                description="Caution; assess benefit/risk."
              />

              <Checkbox
                label="SLE with antiphospholipid antibodies"
                checked={state.medicalHistory.sleWithAntiphospholipidAntibodies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "sleWithAntiphospholipidAntibodies",
                    value: v,
                  })
                }
                description="Caution due to thrombotic risk."
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
                  Based on the identified contraindications, POP cannot be supplied. Refer to GP for alternative contraceptive advice.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 5: // Medicine Supply
        return (
          <StepWrapper
            title="Medicine Supply"
            description="Desogestrel 75mcg (Cerazette/generic) supply details."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Desogestrel 75mcg (Cerazette/generic)
                </p>
                <p className="text-sm text-blue-800">
                  Progesterone-only pill. One tablet daily at the same time (12-hour window). No pill-free interval. Can start any time postpartum; if started {'>'}  21 days, use additional contraception for 48 hours.
                </p>
              </div>

              <NumberInput
                label="Number of tablets/packs to supply"
                value={state.medicineSupply.quantity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "quantity",
                    value: v,
                  })
                }
                min={1}
              />

              <TextInput
                label="Start date"
                value={state.medicineSupply.startDate}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "startDate",
                    value: v,
                  })
                }
                type="date"
                required
              />

              <TextInput
                label="Supplied by (name and credentials)"
                value={state.medicineSupply.administeredBy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "administeredBy",
                    value: v,
                  })
                }
                placeholder="e.g. Emma Brown, Pharmacist"
                required
              />
            </div>
          </StepWrapper>
        );

      case 6: // Counselling
        return (
          <StepWrapper
            title="Counselling"
            description="Confirm counselling provided about POP use and management."
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
                label="Advised when to start (any time postpartum, 48-hour backup if > 21 days)"
                checked={state.counselling.timingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "timingAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Advised to take at same time daily (12-hour window)"
                checked={state.counselling.dailyTakingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "dailyTakingAdvice",
                    value: v,
                  })
                }
                description="Strict adherence important for efficacy."
              />

              <Checkbox
                label="Explained breakthrough bleeding is common in first 3 months"
                checked={state.counselling.breakThroughBleedingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "breakThroughBleedingAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Confirmed POP does not affect breastfeeding"
                checked={state.counselling.breastfeedingCompatibilityAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "breastfeedingCompatibilityAdvice",
                    value: v,
                  })
                }
                description="Safe to use while breastfeeding."
              />

              <Checkbox
                label="Explained POP does not protect against STIs"
                checked={state.counselling.stiAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "stiAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Provided emergency contraception contact details"
                checked={state.counselling.emergencyContactAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "emergencyContactAdvice",
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
                description="Breast tenderness, nausea, mood changes, acne."
              />

              <Checkbox
                label="Clarified there is no pill-free interval"
                checked={state.counselling.pillfreeIntervalAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pillfreeIntervalAdvice",
                    value: v,
                  })
                }
                description="Continuous daily dosing; do not skip days."
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
                <PostnatalContraceptionSummaryReport state={updatedState} />
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

function PostnatalContraceptionSummaryReport({
  state,
}: {
  state: PostnatalContraceptionState;
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

      <SectionHeader>Postnatal Assessment</SectionHeader>
      <Row
        label="Weeks postpartum"
        value={`${state.assessment.weeksPostpartum} weeks`}
      />
      <Row label="Delivery type" value={state.assessment.deliveryType} />
      <Row
        label="Breastfeeding"
        value={state.assessment.breastfeedingStatus}
      />
      <Row label="VTE risk" value={state.assessment.vteRiskAssessment} />

      <SectionHeader>Medical History &amp; Contraindications</SectionHeader>
      <Row
        label="Current breast cancer"
        value={state.medicalHistory.currentBreastCancer ? "Yes" : "No"}
      />
      <Row
        label="Severe hepatic disease"
        value={state.medicalHistory.severeLiverDisease ? "Yes" : "No"}
      />
      <Row
        label="Unexplained vaginal bleeding"
        value={state.medicalHistory.unexplainedVaginalBleeding ? "Yes" : "No"}
      />
      <Row
        label="Porphyria"
        value={state.medicalHistory.porphyria ? "Yes" : "No"}
      />

      <SectionHeader>Medicine Supply</SectionHeader>
      <Row label="Medicine" value={state.medicineSupply.medicine} />
      <Row label="Quantity" value={`${state.medicineSupply.quantity} pack(s)`} />
      <Row label="Start date" value={state.medicineSupply.startDate} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Timing of start (any time postpartum)", state.counselling.timingAdvice],
          ["Daily taking (same time, 12-hour window)", state.counselling.dailyTakingAdvice],
          ["Breakthrough bleeding common (first 3 months)", state.counselling.breakThroughBleedingAdvice],
          ["Safe while breastfeeding", state.counselling.breastfeedingCompatibilityAdvice],
          ["No STI protection", state.counselling.stiAdvice],
          ["No pill-free interval", state.counselling.pillfreeIntervalAdvice],
          ["Side effects explained", state.counselling.sideEffectsExplained],
        ]}
      />

      <PharmacistDeclaration
        pgdName="Postnatal Contraception (POP)"
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

      <ReportFooter pgdName="Postnatal Contraception (POP)" />
    </div>
  );
}

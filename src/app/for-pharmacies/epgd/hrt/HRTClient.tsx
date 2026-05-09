"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { HRTConsultationState, HRTAction } from "./lib/hrt-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hrt-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/hrt-clinical-logic";
import { validateStep } from "./lib/hrt-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import { HRTSummaryReport } from "./components/HRTSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: HRTConsultationState, action: HRTAction): HRTConsultationState {
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
    case "UPDATE_MEDICATIONS":
      newState.medications = { ...newState.medications, [action.field]: action.value };
      break;
    case "UPDATE_HRT_SELECTION":
      newState.hrtSelection = { ...newState.hrtSelection, [action.field]: action.value };
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
      return createInitialConsultationState();
    default:
      break;
  }

  return newState;
}

export default function HRTClient() {
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
          <StepWrapper title="Patient Details" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} />
          </StepWrapper>
        );
      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Menopause Assessment" description="Assess menopausal status and status." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <SelectInput label="Menopause status" value={state.assessment.menopauseStatus} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "menopauseStatus", value: v })} options={[{ value: "perimenopause", label: "Perimenopause" }, { value: "postmenopause", label: "Postmenopause" }]} required />
              <TextInput label="Last menstrual period (YYYY-MM-DD)" value={state.assessment.lastMenstrualPeriod} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastMenstrualPeriod", value: v })} />
              <NumberInput label="Years post-menopause" value={state.assessment.yearsPostmenopause} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "yearsPostmenopause", value: v })} min={0} max={50} />
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Symptom Scoring" description="Score menopausal symptoms (0=none, 3=severe)." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Hot flushes" value={state.assessment.symptomScore.hotFlushes} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "hotFlushes", value: v })} min={0} max={3} />
              <NumberInput label="Night sweats" value={state.assessment.symptomScore.nightSweats} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "nightSweats", value: v })} min={0} max={3} />
              <NumberInput label="Vaginal dryness" value={state.assessment.symptomScore.vaginDryness} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "vaginDryness", value: v })} min={0} max={3} />
              <NumberInput label="Mood disturbance" value={state.assessment.symptomScore.moodDisturbance} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "moodDisturbance", value: v })} min={0} max={3} />
              <NumberInput label="Sleep problems" value={state.assessment.symptomScore.sleepProblem} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepProblem", value: v })} min={0} max={3} />
              <NumberInput label="Joint/muscle pain" value={state.assessment.symptomScore.jointMuscPain} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "jointMuscPain", value: v })} min={0} max={3} />
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Medical History" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded"><p className="text-xs font-semibold text-red-700 mb-2">Absolute Contraindications</p></div>
              <Checkbox label="Undiagnosed vaginal bleeding" checked={state.medicalHistory.undiagnosedVaginalBleeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "undiagnosedVaginalBleeding", value: v })} />
              <Checkbox label="Current breast cancer" checked={state.medicalHistory.currentBreastCancer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentBreastCancer", value: v })} />
              <Checkbox label="Active liver disease" checked={state.medicalHistory.activeLiverDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeLiverDisease", value: v })} />
              <Checkbox label="Active VTE/DVT/PE" checked={state.medicalHistory.activeVTE} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeVTE", value: v })} />
              <Checkbox label="Untreated endometrial hyperplasia" checked={state.medicalHistory.untreatEndometrialHyperplasia} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "untreatEndometrialHyperplasia", value: v })} />
              <div className="border-t pt-4"><p className="text-xs font-semibold text-navy-900 mb-3">Cautions</p></div>
              <Checkbox label="Family history of breast cancer" checked={state.medicalHistory.familyHistBreastCancer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "familyHistBreastCancer", value: v })} />
              <Checkbox label="BMI >30" checked={state.medicalHistory.bmiOver30} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bmiOver30", value: v })} />
              <Checkbox label="Migraine with aura" checked={state.medicalHistory.migraineWithAura} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "migraineWithAura", value: v })} />
              <Checkbox label="History of VTE/DVT/PE" checked={state.medicalHistory.historyVTE} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyVTE", value: v })} />
            </div>
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Contraindications Review" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={!hasStops} validationError={hasStops ? "Hard stop contraindications present" : null} isBlocked={hasStops}>
            {alerts.length > 0 ? <AlertBanner alerts={alerts} /> : <p className="text-sm text-gray-600">No alerts identified.</p>}
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="HRT Selection" description="Choose HRT type and route." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops}>
            <div className="space-y-4">
              <SelectInput label="HRT type" value={state.hrtSelection.hrtType} onChange={(v) => dispatch({ type: "UPDATE_HRT_SELECTION", field: "hrtType", value: v })} options={[{ value: "seq-combined", label: "Sequential combined (peri)" }, { value: "cont-combined", label: "Continuous combined (post 12m+)" }, { value: "oestrogen-only", label: "Oestrogen-only (post-hysterectomy)" }, { value: "local-vag", label: "Local vaginal oestrogen" }]} required />
              <SelectInput label="Oestrogen route" value={state.hrtSelection.oestroaddressRoute} onChange={(v) => dispatch({ type: "UPDATE_HRT_SELECTION", field: "oestroaddressRoute", value: v })} options={[{ value: "patch", label: "Transdermal patch (lower VTE risk)" }, { value: "gel", label: "Gel (lower VTE risk)" }, { value: "oral", label: "Oral tablets" }]} required />
              <TextInput label="Dose recommendation" value={state.hrtSelection.doseRec} onChange={(v) => dispatch({ type: "UPDATE_HRT_SELECTION", field: "doseRec", value: v })} placeholder="e.g., standard dose, estradiol 2mg/norethisterone 1mg" />
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper title="Counselling & Patient Education" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-3">
              <Checkbox label="Benefits vs. risks discussed" checked={state.counselling.benefitsVsRisks} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "benefitsVsRisks", value: v })} />
              <Checkbox label="3-month trial period explained" checked={state.counselling.threeMonthTrial} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "threeMonthTrial", value: v })} />
              <Checkbox label="Breakthrough bleeding explained" checked={state.counselling.breakthroughBleeding} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "breakthroughBleeding", value: v })} description="Common in first 3 months" />
              <Checkbox label="Transdermal advantages discussed" checked={state.counselling.transdermalAdvantage} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "transdermalAdvantage", value: v })} />
              <Checkbox label="Breast awareness counselled" checked={state.counselling.breastAwareness} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "breastAwareness", value: v })} />
              <Checkbox label="Annual review arranged" checked={state.counselling.annualReview} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "annualReview", value: v })} />
              <Checkbox label="Lifestyle advice provided" checked={state.counselling.lifeStyleAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "lifeStyleAdvice", value: v })} />
              <Checkbox label="Follow-up scheduled" checked={state.counselling.followUpArranged} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpArranged", value: v })} />
            </div>
          </StepWrapper>
        );
      case 8:
        return (
          <StepWrapper
            title="Summary & Consultation Record"
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
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} placeholder="Any additional information to record..." />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">Review the summary below before printing.</p>
              <HRTSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar stepLabels={STEP_LABELS} currentStep={state.currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} hasErrors={Boolean(validationError)} />
      {alerts.length > 0 && state.currentStep < 5 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}

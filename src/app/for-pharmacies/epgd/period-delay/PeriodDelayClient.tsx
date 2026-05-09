"use client";
import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { PeriodDelayConsultationState, PeriodDelayAction } from "./lib/period-delay-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/period-delay-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation } from "./lib/period-delay-clinical-logic";
import { validateStep } from "./lib/period-delay-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import { PeriodDelaySummaryReport } from "./components/PeriodDelaySummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: PeriodDelayConsultationState, action: PeriodDelayAction): PeriodDelayConsultationState {
  const newState = { ...state };
  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") newState.patient.age = calculateAge(action.value as string);
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
    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = { ...newState.medicineSelection, [action.field]: action.value };
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

export default function PeriodDelayClient() {
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

  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);
  const canProceed = !validationError && (!hasStops || state.currentStep >= 4);

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
    if (step < state.currentStep) dispatch({ type: "SET_STEP", step });
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
          <StepWrapper title="Period Delay Assessment" description="Assess the patient's reason for period delay and menstrual history." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <SelectInput label="Reason for period delay" value={state.assessment.reasonForDelay} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "reasonForDelay", value: v })} options={[{ value: "holiday", label: "Holiday / travel" }, { value: "event", label: "Special event (wedding, exam, etc.)" }, { value: "religious", label: "Religious observance" }, { value: "other", label: "Other" }]} required />
              {state.assessment.reasonForDelay === "other" && (
                <TextInput label="Please specify reason" value={state.assessment.reasonDetails} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "reasonDetails", value: v })} />
              )}
              <TextInput label="Date of last menstrual period (first day)" value={state.assessment.lastPeriodDate} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastPeriodDate", value: v })} placeholder="DD/MM/YYYY" required />
              <Checkbox label="Patient has a regular menstrual cycle" checked={state.assessment.cycleRegular} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "cycleRegular", value: v })} />
              <NumberInput label="Estimated days until next expected period" value={state.assessment.daysUntilExpected} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "daysUntilExpected", value: v })} min={0} max={60} />
              <Checkbox label="Patient has used norethisterone for period delay before" checked={state.assessment.previousUse} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousUse", value: v })} />
              {state.assessment.previousUse && (
                <TextArea label="Any previous issues or side effects?" value={state.assessment.previousIssues} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousIssues", value: v })} placeholder="e.g., breakthrough bleeding, nausea, headaches" />
              )}
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Medical History" description="Screen for contraindications to norethisterone." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <div className="border-b pb-3"><p className="text-sm font-semibold text-red-700">ABSOLUTE CONTRAINDICATIONS — If any present, do NOT supply:</p></div>
              <Checkbox label="Pregnant or possibility of pregnancy" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="Norethisterone is contraindicated in pregnancy" />
              <Checkbox label="Active or recent breast cancer" checked={state.medicalHistory.activeBreastCancer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeBreastCancer", value: v })} />
              <Checkbox label="History of deep vein thrombosis (DVT)" checked={state.medicalHistory.historyOfDVT} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfDVT", value: v })} />
              <Checkbox label="History of pulmonary embolism (PE)" checked={state.medicalHistory.historyOfPE} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfPE", value: v })} />
              <Checkbox label="History of stroke or TIA" checked={state.medicalHistory.historyOfStroke} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfStroke", value: v })} />
              <Checkbox label="Severe arterial disease" checked={state.medicalHistory.severeArterialDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeArterialDisease", value: v })} />
              <Checkbox label="Active liver disease or liver tumours" checked={state.medicalHistory.liverDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "liverDisease", value: v })} />
              <Checkbox label="Acute porphyria" checked={state.medicalHistory.porphyria} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "porphyria", value: v })} />
              <Checkbox label="Undiagnosed abnormal vaginal bleeding" checked={state.medicalHistory.abnormalVaginalBleeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "abnormalVaginalBleeding", value: v })} />
              <Checkbox label="Patient under 18 years" checked={state.medicalHistory.ageUnder18} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ageUnder18", value: v })} />
              <div className="border-t pt-4"><p className="text-sm font-semibold text-amber-700">CAUTIONS:</p></div>
              <Checkbox label="Currently breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} description="Small amounts pass into breast milk" />
              <Checkbox label="Currently using hormonal contraception" checked={state.medicalHistory.hormonalContraception} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hormonalContraception", value: v })} description="Combined pill users may be able to run packs back-to-back instead" />
              {state.medicalHistory.hormonalContraception && (
                <TextInput label="Type of hormonal contraception" value={state.medicalHistory.hormonalContraceptionType} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hormonalContraceptionType", value: v })} placeholder="e.g., combined pill, POP, implant, patch" />
              )}
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications & Drug Interactions" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={!hasStops} validationError={hasStops ? "Hard stops present — cannot proceed" : null} isBlocked={hasStops}>
            <div className="space-y-4 mb-4">
              <Checkbox label="Taking anticoagulants (warfarin, DOACs)" checked={state.medications.anticoagulants} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "anticoagulants", value: v })} />
              <Checkbox label="Taking antiepileptic medication" checked={state.medications.antiepileptics} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "antiepileptics", value: v })} description="Enzyme-inducers may reduce efficacy" />
              <Checkbox label="Taking ciclosporin" checked={state.medications.ciclosporin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "ciclosporin", value: v })} />
              <TextArea label="Other current medications" value={state.medications.otherMedications} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "otherMedications", value: v })} placeholder="List all current medications" />
              <TextInput label="Known allergies" value={state.medications.allergies} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "allergies", value: v })} placeholder="e.g., norethisterone, progestogens" />
            </div>
            {alerts.length > 0 ? <AlertBanner alerts={alerts} /> : <p className="text-sm text-gray-600">No alerts identified.</p>}
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Treatment Plan" description="Confirm norethisterone supply." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops}>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Standard regimen</p>
                <p className="text-sm text-blue-800">Norethisterone 5mg, three times daily, starting 3 days before the expected period. Continue for the desired duration of delay (maximum 10–14 days recommended).</p>
                <p className="text-xs text-blue-600 mt-2">Period typically returns 2–3 days after stopping.</p>
              </div>
              <NumberInput label="Number of days to delay period" value={state.medicineSelection.daysToDelay} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "daysToDelay", value: v })} min={1} max={17} />
              <TextInput label="Planned start date (3 days before expected period)" value={state.medicineSelection.startDate} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "startDate", value: v })} placeholder="DD/MM/YYYY" />
              <Checkbox label="I confirm this treatment is appropriate for this patient" checked={state.medicineSelection.confirmed} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "confirmed", value: v })} />
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Counselling & Patient Education" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-3">
              <Checkbox label="How to take: 5mg three times daily with or after food" checked={state.counselling.howToTake} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "howToTake", value: v })} />
              <Checkbox label="Must start 3 days before expected period" checked={state.counselling.startThreeDaysBefore} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "startThreeDaysBefore", value: v })} />
              <Checkbox label="Maximum recommended duration: 10–14 days (up to 20 days absolute max)" checked={state.counselling.maxDuration} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "maxDuration", value: v })} />
              <Checkbox label="Period will return 2–3 days after stopping tablets" checked={state.counselling.periodReturnsAfter} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "periodReturnsAfter", value: v })} />
              <Checkbox label="Possible side effects: nausea, headache, bloating, breast tenderness, mood changes, breakthrough bleeding" checked={state.counselling.sideEffects} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })} />
              <Checkbox label="Norethisterone at this dose is NOT a contraceptive — continue usual contraception" checked={state.counselling.notContraceptive} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notContraceptive", value: v })} />
              <Checkbox label="Seek medical advice if: severe headache, leg pain/swelling, chest pain, or prolonged bleeding" checked={state.counselling.seekHelpIfUnwell} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seekHelpIfUnwell", value: v })} />
            </div>
          </StepWrapper>
        );
      case 7:
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
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">Review the summary below before printing.</p>
              <PeriodDelaySummaryReport state={updatedState} />
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
      {alerts.length > 0 && state.currentStep < 4 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}

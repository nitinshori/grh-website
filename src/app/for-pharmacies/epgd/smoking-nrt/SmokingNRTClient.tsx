"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  SmokingNRTConsultationState,
  SmokingNRTAction,
  SmokingNRTPatientDetails,
  SmokingAssessment,
  SmokingMedicalHistory,
  SmokingContraindications,
  SmokingNRTSelection,
  SmokingCounselling,
  SmokingConsultationSummary,
} from "./lib/smoking-nrt-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/smoking-nrt-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/smoking-nrt-clinical-logic";
import { validateStep } from "./lib/smoking-nrt-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { SmokingNRTSummaryReport } from "./components/SmokingNRTSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: SmokingNRTConsultationState, action: SmokingNRTAction): SmokingNRTConsultationState {
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

    case "UPDATE_NRT_SELECTION":
      newState.nrtSelection = { ...newState.nrtSelection, [action.field]: action.value };
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

export default function SmokingNRTClient() {
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
  const canProceed = !validationError && (!hasStops || state.currentStep >= 6);

  const markStepComplete = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
  }, [state.currentStep]);

  const handleNextStep = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrevStep = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleSetStep = (step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
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


  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper
            title="Patient Details"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
            />
          </StepWrapper>
        );

      case 1:
        return (
          <StepWrapper
            title="Consent"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })}
            />
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="Smoking Assessment (Fagerström)"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <NumberInput
                label="Cigarettes per day"
                value={state.assessment.cigarettesPerDay}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "cigarettesPerDay", value: v })}
                min={1}
                max={100}
                placeholder="e.g., 20"
                unit="cigarettes"
              />

              <SelectInput
                label="Time to first cigarette after waking"
                value={state.assessment.timeToFirstCigarette}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "timeToFirstCigarette", value: v })}
                options={[
                  { value: "&lt;5min", label: "Within 5 minutes" },
                  { value: "5-30min", label: "5–30 minutes" },
                  { value: "31-60min", label: "31–60 minutes" },
                  { value: "&gt;60min", label: "More than 60 minutes" },
                ]}
                required
              />

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-navy-900 mb-2">Set Quit Date</label>
                <input
                  type="date"
                  value={state.assessment.quitDate}
                  onChange={(e) => dispatch({ type: "UPDATE_ASSESSMENT", field: "quitDate", value: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                  required
                />
              </div>

              <Checkbox
                label="Motivated to quit smoking and has set a quit date"
                checked={state.assessment.motivated}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "motivated", value: v })}
                description="PGD inclusion criterion. Non-smokers and occasional smokers are excluded (contraindications step)."
              />
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Medical History"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Recent MI (myocardial infarction), within 4 weeks"
                checked={state.medicalHistory.recentMI}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentMI", value: v })}
                description="PGD caution: assess benefit vs risk. Within 2 weeks: tick the contraindication on the next step."
              />

              <Checkbox
                label="Recent stroke, within 4 weeks"
                checked={state.medicalHistory.recentStroke}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentStroke", value: v })}
              />

              <Checkbox
                label="Unstable angina"
                checked={state.medicalHistory.unstableAngina}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "unstableAngina", value: v })}
              />

              <Checkbox
                label="Cardiovascular disease (stable), including severe arrhythmias"
                checked={state.medicalHistory.cardiovascularDisease}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cardiovascularDisease", value: v })}
                description="PGD caution: assess benefit vs risk."
              />

              <Checkbox
                label="Diabetes mellitus"
                checked={state.medicalHistory.diabetes}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })}
                description="Monitor blood glucose control; nicotine may affect insulin requirements."
              />

              <Checkbox
                label="Phaeochromocytoma"
                checked={state.medicalHistory.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pheochromocytoma", value: v })}
                description="Nicotine may cause catecholamine release."
              />

              <Checkbox
                label="Hepatic or renal impairment"
                checked={state.medicalHistory.hepaticRenalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hepaticRenalImpairment", value: v })}
                description="Consider close monitoring."
              />

              <Checkbox
                label="Peptic ulcer disease"
                checked={state.medicalHistory.pepticUlcer}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pepticUlcer", value: v })}
                description="Nicotine may increase gastric acid secretion."
              />

              <Checkbox
                label="Oral ulceration or dental work"
                checked={state.medicalHistory.oralUlcerationOrDentalWork}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "oralUlcerationOrDentalWork", value: v })}
                description="Nicotine oral products may cause irritation."
              />

              <Checkbox
                label="Pregnant"
                checked={state.medicalHistory.pregnant}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnant", value: v })}
                description="Use only if unable to quit without NRT; benefits must outweigh risks."
              />

              <Checkbox
                label="Breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })}
                description="Nicotine passes into breast milk; weigh risks and benefits."
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Current Medications"
            description="Document any medications that may interact with NRT or be affected by smoking cessation"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <TextArea
              label="Current medications and doses"
              value={""}
              onChange={() => {}}
              placeholder="e.g., Aspirin 75mg daily, Lisinopril 10mg daily, Atorvastatin 20mg at night"
            />
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Contraindications Check"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <AlertBanner alerts={alerts} />
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Patient under 18 years old"
                checked={state.contraindications.childUnder12}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })}
              />

              <Checkbox
                label="Known hypersensitivity to nicotine or excipients"
                checked={state.contraindications.hypersensitivity}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivity", value: v })}
              />

              <Checkbox
                label="Non-smoker or occasional smoker"
                checked={state.contraindications.nonSmokerOrOccasional}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "nonSmokerOrOccasional", value: v })}
              />

              <Checkbox
                label="Generalised skin disorder that may affect absorption (excludes patches; oral products may be supplied)"
                checked={state.contraindications.generalisedSkinDisorder}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "generalisedSkinDisorder", value: v })}
              />

              <Checkbox
                label="Recent cardiac event (MI/stroke/unstable angina within 2 weeks)"
                checked={state.contraindications.recentCardiacEvent}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "recentCardiacEvent", value: v })}
              />

              <Checkbox
                label="Phaeochromocytoma"
                checked={state.contraindications.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pheochromocytoma", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="NRT Selection"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <p className="font-semibold">PGD version 002, issued 11 September 2026. Two arms:</p>
                <p>1. Nicotine 24-hour transdermal patches 7mg, 14mg, 21mg (e.g. NiQuitin Clear). Nicorette Invisi patches are 16-hour patches (10mg, 15mg, 25mg) and are NOT the product described. More than 10 cigarettes a day: 21mg daily for 6 to 8 weeks, then 14mg for 2 weeks, then 7mg for 2 weeks. 10 or fewer a day: start 14mg and step down. Apply to clean, dry, hairless skin (arm or chest), rotate sites daily, press firmly for 10 seconds. 28 patches (4-week supply). Store below 25°C.</p>
                <p>2. Nicotine lozenges or gum 2mg and 4mg. 20 or fewer cigarettes a day: 2mg; more than 20 a day: 4mg. Initially 8 to 12 pieces a day, reduce gradually over 8 to 12 weeks. Up to 4-week supply, maximum 120 pieces. Store below 25°C.</p>
                <p>Total course 8 to 12 weeks. Review at 2 weeks, 4 weeks, then regularly.</p>
              </div>

              <Checkbox
                label="Supply nicotine 24-hour patches (7mg, 14mg, 21mg; e.g. NiQuitin Clear)"
                checked={state.nrtSelection.usePatches}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "usePatches", value: v })}
              />

              {state.nrtSelection.usePatches && state.contraindications.generalisedSkinDisorder && (
                <p className="text-xs text-red-700">Generalised skin disorder that may affect absorption excludes the patch arm. Supply oral products only, or refer.</p>
              )}

              {state.nrtSelection.usePatches && (
                <>
                  <SelectInput
                    label="Patch strength (24-hour patch)"
                    value={state.nrtSelection.patchStrength}
                    onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "patchStrength", value: v })}
                    options={[
                      { value: "21mg", label: "21mg/24-hour (start, more than 10 cigarettes a day; 6 to 8 weeks)" },
                      { value: "14mg", label: "14mg/24-hour (start, 10 or fewer a day; or step-down for 2 weeks)" },
                      { value: "7mg", label: "7mg/24-hour (final step-down, 2 weeks)" },
                    ]}
                    required
                  />
                  {state.assessment.cigarettesPerDay !== null && state.assessment.cigarettesPerDay <= 10 && state.nrtSelection.patchStrength === "21mg" && (
                    <p className="text-xs text-amber-700">Patient smokes 10 or fewer a day: the PGD starts lighter smokers on the 14mg patch.</p>
                  )}
                  <NumberInput
                    label="Number of patches supplied"
                    value={state.nrtSelection.patchQuantity}
                    onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "patchQuantity", value: v })}
                    min={1}
                    max={28}
                    placeholder="up to 28 (4-week supply)"
                    unit="patches"
                    required
                  />
                </>
              )}

              <Checkbox
                label="Supply oral NRT (nicotine lozenges or gum, 2mg or 4mg)"
                checked={state.nrtSelection.useOralForm}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "useOralForm", value: v })}
              />

              {state.nrtSelection.useOralForm && (
                <>
                  <SelectInput
                    label="Oral NRT type"
                    value={state.nrtSelection.oralFormType}
                    onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "oralFormType", value: v })}
                    options={[
                      { value: "gum", label: "Gum (chew slowly, then park between cheek and gum)" },
                      { value: "lozenge", label: "Lozenge (dissolve slowly; do not chew or swallow whole)" },
                    ]}
                    required
                  />
                  <SelectInput
                    label="Oral product strength"
                    value={state.nrtSelection.oralStrength}
                    onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "oralStrength", value: v })}
                    options={[
                      { value: "2mg", label: "2mg (20 or fewer cigarettes a day)" },
                      { value: "4mg", label: "4mg (more than 20 cigarettes a day)" },
                    ]}
                    required
                  />
                  {state.assessment.cigarettesPerDay !== null && (
                    (state.assessment.cigarettesPerDay > 20 && state.nrtSelection.oralStrength === "2mg") ||
                    (state.assessment.cigarettesPerDay <= 20 && state.nrtSelection.oralStrength === "4mg")
                  ) && (
                    <p className="text-xs text-amber-700">Strength does not match the PGD dose row for {state.assessment.cigarettesPerDay} cigarettes a day (2mg for 20 or fewer; 4mg for more than 20).</p>
                  )}
                  <NumberInput
                    label="Number of pieces supplied"
                    value={state.nrtSelection.oralQuantity}
                    onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "oralQuantity", value: v })}
                    min={1}
                    max={120}
                    placeholder="up to 120 (4-week supply)"
                    unit="pieces"
                    required
                  />
                </>
              )}

              <Checkbox
                label="Combination therapy recommended"
                checked={state.nrtSelection.combinationTherapy}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "combinationTherapy", value: v })}
                description="Patch + oral form is more effective than single form"
              />

              <Checkbox
                label="Behavioral/psychological support arranged"
                checked={state.nrtSelection.behavioralSupport}
                onChange={(v) => dispatch({ type: "UPDATE_NRT_SELECTION", field: "behavioralSupport", value: v })}
                description="Essential for quit success"
              />
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Counselling"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling covered:</p>
              <Checkbox
                label="Combination therapy is more effective than single NRT form"
                checked={state.counselling.combinationBetter}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "combinationBetter", value: v })}
              />
              <Checkbox
                label="Quit date set and discussed"
                checked={state.counselling.quitDate}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "quitDate", value: v })}
              />
              <Checkbox
                label="Behavioral/psychological support offered alongside NRT"
                checked={state.counselling.behavioralSupport}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "behavioralSupport", value: v })}
              />
              <Checkbox
                label="Common side effects explained (patches: remove old patch first, dispose folded sticky side in, mild skin redness is normal; oral: no eating or drinking for 15 minutes before and during use, avoid acidic drinks such as coffee and fruit juice)"
                checked={state.counselling.sideEffects}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })}
              />
              <Checkbox
                label="Continue NRT for the full 8 to 12 weeks; do not stop early even if abstinent; step-down approach explained"
                checked={state.counselling.courseDuration}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "courseDuration", value: v })}
              />
              <Checkbox
                label="Correct technique explained (patches on clean, dry, hairless skin, sites rotated daily; gum chewed slowly then parked; lozenges dissolved, not chewed)"
                checked={state.counselling.correctTechnique}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "correctTechnique", value: v })}
              />
              <Checkbox
                label="Use enough NRT: continued cravings may need higher doses or combination therapy"
                checked={state.counselling.useEnough}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "useEnough", value: v })}
              />
              <Checkbox
                label="Do not smoke while using NRT (continued smoking increases nicotine levels and adverse effects)"
                checked={state.counselling.doNotSmoke}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "doNotSmoke", value: v })}
              />
              <Checkbox
                label="Expect cravings and withdrawal symptoms; these usually improve within 2 to 3 weeks"
                checked={state.counselling.withdrawalSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "withdrawalSymptoms", value: v })}
              />
              <Checkbox
                label="Avoid driving or operating machinery if experiencing dizziness; monitor blood glucose more often if diabetic"
                checked={state.counselling.drivingWarning}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "drivingWarning", value: v })}
              />
              <Checkbox
                label="Seek immediate medical attention for chest pain, palpitations or shortness of breath"
                checked={state.counselling.cardiovascularSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "cardiovascularSymptoms", value: v })}
              />
              <Checkbox
                label="Report severe skin reactions or oral irritation to the pharmacy or GP"
                checked={state.counselling.reportReactions}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reportReactions", value: v })}
              />
              <Checkbox
                label="Inform the pharmacy or GP immediately if pregnant or planning pregnancy"
                checked={state.counselling.pregnancyAdvice}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancyAdvice", value: v })}
              />
              <Checkbox
                label="Follow-up appointments at 2 weeks, 4 weeks, and monthly to monitor progress; PIL supplied"
                checked={state.counselling.followUpSchedule}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "followUpSchedule", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Summary"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            canProceed={canProceed}
            validationError={validationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })}
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })}
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })}
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })}
              />
              <TextArea
                label="Clinical notes (optional)"
                value={state.summary.clinicalNotes}
                onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              />
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 print:px-0 print:py-0">
        <div className="print:hidden space-y-6">
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={state.currentStep}
            onStepClick={handleSetStep}
            completedSteps={completedSteps}
            hasErrors={!!validationError}
          />
          {renderCurrentStep()}
        </div>

        <div className="hidden print:block">
          <SmokingNRTSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  AnxietyPropranololConsultationState,
  AnxietyPropranololAction,
  AnxietyPropranololPatientDetails,
  AnxietyAssessment,
  AnxietyMedicalHistory,
  AnxietyContraindications,
  AnxietyMedicineSupply,
  AnxietyCounselling,
  AnxietyConsultationSummary,
} from "./lib/anxiety-propranolol-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/anxiety-propranolol-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/anxiety-propranolol-clinical-logic";
import { validateStep } from "./lib/anxiety-propranolol-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { AnxietyPropranololSummaryReport } from "./components/AnxietyPropranololSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: AnxietyPropranololConsultationState, action: AnxietyPropranololAction): AnxietyPropranololConsultationState {
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
      return createInitialConsultationState();

    default:
      break;
  }

  return newState;
}

export default function AnxietyPropranololClient() {
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
  // A stop anywhere disables Next on every step. Stops used to gate steps 0
  // to 5 only, so an exclusion ticked after the Contraindications step had
  // been passed was never enforced (adversarial review, 11 Sep 2026).
  const canProceed = !validationError && !hasStops;

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
  // Returns a record on every step, including before a medicine is chosen,
  // so an exclusion can be saved as "not supplied" from the step it is
  // raised on. Falls back to the pharmacist profile if the Summary step has
  // not been reached.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const medicineChosen = !hasStops && !!doseRecommendation;
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
        gpAddress: state.patient.gpAddress,
        gpPhone: state.patient.gpPhone,
        gpEmail: state.patient.gpEmail,
        gpOdsCode: state.patient.gpOdsCode,
      },
      clinicalData: { ...updatedState, hasStops } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      ...(medicineChosen
        ? {
            medicine: {
              name: "Propranolol 10mg tablets",
              dose: `${doseRecommendation.dose}, ${doseRecommendation.frequency ?? ""}, oral`.trim(),
              duration: doseRecommendation.duration,
              quantity: state.medicineSupply.quantity ?? undefined,
            },
          }
        : {}),
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, updatedState, hasStops, doseRecommendation, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  // Every StepWrapper gets the same gating: a stop blocks Next everywhere
  // (not just on the step it was raised on), and every step can save the
  // consultation as "not supplied".
  const wrapperProps = {
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    onNext: handleNextStep,
    onPrev: handlePrevStep,
    canProceed,
    validationError,
    isBlocked: hasStops,
    getConsultationData,
  };


  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper
            title="Patient Details"
            {...wrapperProps}
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
            {...wrapperProps}
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
            title="Anxiety Assessment"
            {...wrapperProps}
          >
            <div className="space-y-4">
              <SelectInput
                label="Anxiety Type"
                value={state.assessment.anxietyType}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "anxietyType", value: v })}
                options={[
                  { value: "situational", label: "Situational (exam, public speaking, performance)" },
                  { value: "generalized", label: "Generalised anxiety disorder (outside this PGD: refer)" },
                  { value: "social", label: "Social anxiety disorder, not tied to a discrete performance situation (outside this PGD: refer)" },
                ]}
                required
              />
              <AlertBanner alerts={alerts.filter((a) => a.code === "ANX_GAD" || a.code === "ANX_SOCIAL")} />

              <TextArea
                label="Trigger Situation"
                value={state.assessment.triggerSituation}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "triggerSituation", value: v })}
                placeholder="e.g., Presentations at work, university exams, public speaking events"
                required
              />

              <TextArea
                label="Physical Symptoms When Anxious"
                value={state.assessment.physicalSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "physicalSymptoms", value: v })}
                placeholder="e.g., Tremor, palpitations, sweating, dry mouth"
                required
              />

              <TextInput
                label="Frequency of Events"
                value={state.assessment.frequencyOfEvents}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "frequencyOfEvents", value: v })}
                placeholder="e.g., Several times per year, monthly presentations"
              />
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Medical History"
            {...wrapperProps}
          >
            <AlertBanner alerts={alerts.filter((a) => a.severity === "caution")} />
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                The exclusions (asthma or bronchospasm, heart block, bradycardia, hypotension, heart failure, Prinzmetal&apos;s angina, phaeochromocytoma and the rest) are asked once, on the Contraindications step, where each one stops supply. This step records the PGD cautions: tick each one the patient has. Leave every box unticked if the patient has none.
              </p>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                PGD cautions (supply may proceed with counselling)
              </p>

              <Checkbox
                label="Diabetes mellitus"
                checked={state.medicalHistory.diabetes}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })}
              />

              <Checkbox
                label="Raynaud's syndrome"
                checked={state.medicalHistory.raynauds}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "raynauds", value: v })}
              />

              <Checkbox
                label="Hepatic impairment"
                checked={state.medicalHistory.hepaticImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hepaticImpairment", value: v })}
              />

              <Checkbox
                label="Renal impairment"
                checked={state.medicalHistory.renalImpairment}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })}
              />

              <Checkbox
                label="First-degree heart block"
                checked={state.medicalHistory.firstDegreeHeartBlock}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "firstDegreeHeartBlock", value: v })}
              />

              <Checkbox
                label="Portal hypertension"
                checked={state.medicalHistory.portalHypertension}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "portalHypertension", value: v })}
              />

              <Checkbox
                label="Mild peripheral vascular disease (severe peripheral arterial disease excludes)"
                checked={state.medicalHistory.mildPeripheralVascularDisease}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildPeripheralVascularDisease", value: v })}
              />

              <Checkbox
                label="Psoriasis"
                checked={state.medicalHistory.psoriasis}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "psoriasis", value: v })}
              />

              <Checkbox
                label="Myasthenia gravis"
                checked={state.medicalHistory.myastheniaGravis}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "myastheniaGravis", value: v })}
              />

              <Checkbox
                label="History of anaphylaxis"
                checked={state.medicalHistory.historyOfAnaphylaxis}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfAnaphylaxis", value: v })}
              />

              <Checkbox
                label="Depression that is not severe and without any suicidal ideation"
                checked={state.medicalHistory.mildDepression}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildDepression", value: v })}
                description="Supply may proceed with counselling. Severe depression or any suicidal ideation is an exclusion (contraindications step)."
              />
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Current Medications"
            {...wrapperProps}
          >
            <TextArea
              label="Current medications and doses"
              value={state.medicalHistory.currentMedications}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentMedications", value: v })}
              placeholder="e.g., Sertraline 50mg daily, Metformin 1g BD; or 'none'"
              required
            />
            <p className="mt-2 text-xs text-gray-600">
              Check the list for another beta-blocker, verapamil or diltiazem (exclusions, asked on the next step) and for insulin or other hypoglycaemia risk.
            </p>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Contraindications Check"
            {...wrapperProps}
          >
            <AlertBanner alerts={alerts} />
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-1">Measurements taken today</p>
              <p className="text-xs text-gray-600 mb-3">
                The PGD excludes on a resting heart rate below 50 bpm and a systolic blood pressure below 90 mmHg. Both readings are required and are printed on the record.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="Resting heart rate"
                  value={state.contraindications.restingHeartRate}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "restingHeartRate", value: v })}
                  min={20}
                  max={250}
                  unit="bpm"
                  required
                />
                <NumberInput
                  label="Systolic blood pressure"
                  value={state.contraindications.systolicBP}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "systolicBP", value: v })}
                  min={50}
                  max={300}
                  unit="mmHg"
                  required
                />
              </div>
            </div>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                label="Asthma, or history of bronchospasm"
                checked={state.contraindications.asthmaWithBronchospasm}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "asthmaWithBronchospasm", value: v })}
              />

              <Checkbox
                label="2nd or 3rd degree heart block"
                checked={state.contraindications.heartBlock}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "heartBlock", value: v })}
              />

              <Checkbox
                label="Severe bradycardia (heart rate below 50 bpm at rest)"
                checked={state.contraindications.severeBradycardia}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "severeBradycardia", value: v })}
                description="Also raised automatically from the measured heart rate above."
              />

              <Checkbox
                label="Hypotension (systolic BP below 90 mmHg)"
                checked={state.contraindications.hypotension}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypotension", value: v })}
                description="Also raised automatically from the measured systolic BP above."
              />

              <Checkbox
                label="Uncontrolled heart failure"
                checked={state.contraindications.uncontrolledHeartFailure}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "uncontrolledHeartFailure", value: v })}
              />

              <Checkbox
                label="Cardiogenic shock"
                checked={state.contraindications.cardiogenicShock}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "cardiogenicShock", value: v })}
              />

              <Checkbox
                label="Sick sinus syndrome"
                checked={state.contraindications.sickSinusSyndrome}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "sickSinusSyndrome", value: v })}
              />

              <Checkbox
                label="Prinzmetal's angina"
                checked={state.contraindications.prinzmetalsAngina}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "prinzmetalsAngina", value: v })}
              />

              <Checkbox
                label="Phaeochromocytoma (unless already on alpha-blocker)"
                checked={state.contraindications.pheochromocytoma}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pheochromocytoma", value: v })}
              />

              <Checkbox
                label="Metabolic acidosis"
                checked={state.contraindications.metabolicAcidosis}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "metabolicAcidosis", value: v })}
              />

              <Checkbox
                label="Known hypersensitivity to propranolol"
                checked={state.contraindications.hypersensitivity}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivity", value: v })}
              />

              <Checkbox
                label="Severe peripheral arterial disease (rest pain, ulceration or critical ischaemia)"
                checked={state.contraindications.severePeripheralArterialDisease}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "severePeripheralArterialDisease", value: v })}
              />

              <Checkbox
                label="Prolonged fasting, or any other risk of hypoglycaemia, including insulin-treated diabetes with hypoglycaemia unawareness"
                checked={state.contraindications.fastingOrHypoglycaemiaRisk}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "fastingOrHypoglycaemiaRisk", value: v })}
              />

              <Checkbox
                label="Pregnant, or planning pregnancy"
                checked={state.contraindications.pregnancyOrPlanning}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnancyOrPlanning", value: v })}
              />

              <Checkbox
                label="Breastfeeding"
                checked={state.contraindications.breastfeeding}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })}
              />

              <Checkbox
                label="Patient under 18 years old"
                checked={state.contraindications.childUnder12}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })}
              />

              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-red-800">
                Ask about each of these. Propranolol is cardiotoxic in overdose.
              </p>
              <Checkbox
                label="Any suicidal ideation, self-harm, or severe depression"
                checked={state.contraindications.suicidalOrSevereDepression}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "suicidalOrSevereDepression", value: v })}
              />
              <Checkbox
                label="PTSD, severe panic disorder or agoraphobia"
                checked={state.contraindications.ptsdPanicOrAgoraphobia}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "ptsdPanicOrAgoraphobia", value: v })}
              />
              <Checkbox
                label="Comorbid substance or alcohol misuse"
                checked={state.contraindications.substanceOrAlcoholMisuse}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "substanceOrAlcoholMisuse", value: v })}
              />
              <Checkbox
                label="Already taking another beta-blocker"
                checked={state.contraindications.otherBetaBlocker}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "otherBetaBlocker", value: v })}
              />
              <Checkbox
                label="Taking verapamil or diltiazem (oral or intravenous)"
                checked={state.contraindications.verapamilOrDiltiazem}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "verapamilOrDiltiazem", value: v })}
              />
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Medicine Supply"
            {...wrapperProps}
          >
            <div className="space-y-4">
              <div className="p-3 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                <p className="text-sm font-medium text-navy-900">Propranolol 10mg tablets (POM). Store below 25°C, protect from light.</p>
                <p className="text-xs text-gray-600 mt-1">10 to 40mg as a single dose, taken 30 to 60 minutes before the anxiety-provoking situation. As-required use only: regular daily dosing is not authorised under this PGD. One supply per situational event; review before any repeat supply, and in any case at 4 weeks.</p>
              </div>

              <SelectInput
                label="Dose advised (single dose before the situation)"
                value={state.medicineSupply.propranololDose}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "propranololDose", value: v })}
                options={[
                  { value: "10", label: "10mg (one 10mg tablet)" },
                  { value: "20", label: "20mg (two 10mg tablets)" },
                  { value: "30", label: "30mg (three 10mg tablets)" },
                  { value: "40", label: "40mg (four 10mg tablets)" },
                ]}
                required
              />

              <NumberInput
                label="Quantity to Supply"
                value={state.medicineSupply.quantity}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: v })}
                min={1}
                max={28}
                placeholder="up to 28 tablets"
                unit="tablets"
                required
              />
              <p className="text-xs font-medium text-red-800">
                Propranolol 10mg tablets only. Maximum 28 tablets, 280mg in total: the whole supply taken at once must stay below 320mg, because propranolol is cardiotoxic in overdose. The 40mg strength is not authorised. One supply per situational event; review before any repeat.
              </p>
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Counselling"
            {...wrapperProps}
          >
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900 mb-3">Confirm counselling covered (tick every point) <span className="text-red-400">*</span></p>
              <Checkbox
                label={`As-required use only: ${state.medicineSupply.propranololDose}mg as a single dose 30 to 60 minutes before the situation, not to be taken regularly; one supply per situational event, review before any repeat`}
                checked={state.counselling.prnUseOnly}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "prnUseOnly", value: v })}
              />
              <Checkbox
                label="Reduces physical anxiety symptoms (tremor, palpitations, sweating)"
                checked={state.counselling.physicalSymptoms}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "physicalSymptoms", value: v })}
              />
              <Checkbox
                label="Not a cure for anxiety: consider psychological therapy (CBT is first-line)"
                checked={state.counselling.notACure}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notACure", value: v })}
              />
              <Checkbox
                label="Does NOT cause dependence at PRN doses"
                checked={state.counselling.noDependence}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noDependence", value: v })}
              />
              <Checkbox
                label="This supply is for as-required use only; if propranolol has ever been taken regularly (for example on prescription), it must not be stopped suddenly"
                checked={state.counselling.noSuddenWithdrawal}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noSuddenWithdrawal", value: v })}
              />
              <Checkbox
                label="Report any breathlessness or wheeze"
                checked={state.counselling.reportWheeze}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reportWheeze", value: v })}
              />
              <Checkbox
                label="May cause cold hands and feet"
                checked={state.counselling.coldExtremities}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "coldExtremities", value: v })}
              />
              <Checkbox
                label="Avoid alcohol (additive CNS depression)"
                checked={state.counselling.avoidAlcohol}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidAlcohol", value: v })}
              />
              <Checkbox
                label="Do NOT use with verapamil or diltiazem (severe bradycardia, heart block and hypotension risk)"
                checked={state.counselling.avoidVerapamil}
                onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidVerapamil", value: v })}
              />
              <p className="text-xs text-gray-600">Supply the patient information leaflet (PIL) provided with the medication. Report suspected adverse effects via the Yellow Card scheme (yellowcard.mhra.gov.uk) and inform the GP as appropriate.</p>
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Summary"
            {...wrapperProps}
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
          <AnxietyPropranololSummaryReport state={updatedState} />
        </div>
      </div>
    </div>
  );
}

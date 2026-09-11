"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  BPHConsultationState,
  BPHAction,
  BPHPatientDetails,
  BPHLutsAssessment,
  BPHMedicalHistory,
  BPHRedFlags,
  BPHContraindications,
  BPHMedicineSupply,
  BPHCounselling,
} from "./lib/bph-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/bph-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/bph-clinical-logic";
import { validateStep } from "./lib/bph-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { BPHSummaryReport } from "./components/BPHSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: BPHConsultationState, action: BPHAction): BPHConsultationState {
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

    case "UPDATE_LUTS_ASSESSMENT":
      newState.lutsAssessment = {
        ...newState.lutsAssessment,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_RED_FLAGS":
      newState.redFlags = {
        ...newState.redFlags,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = {
        ...newState.contraindications,
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

    case "SET_STEP":
      newState.currentStep = action.step;
      break;

    case "RESET":
      return createInitialConsultationState();
  }

  return newState;
}

// ─── Main Client Component ───

export default function BPHClient() {
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

  // ─── Computed values ───

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  // A stop anywhere blocks Next and Save & Print on every step, and the last
  // step's Save applies its own validation (adversarial review, 11 Sep 2026).
  const canProceed = useMemo(() => {
    if (hardStops) return false;
    return !validationError;
  }, [validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && !hardStops && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, hardStops, completedSteps]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  // Backwards only. Forward always means Next, where the stops are enforced.
  const handleStepClick = useCallback((step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [state.currentStep]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  // ─── Step content rendering ───


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
      clinicalData: { ...(state as unknown as Record<string, unknown>), alerts },
      outcome: hardStops ? "not_supplied" : "completed",
      medicine:
        !hardStops && state.medicineSupply.tamsulosin400mcgMrOd
          ? {
              name: "Tamsulosin",
              medicine: `Tamsulosin 400 micrograms modified-release capsules${state.medicineSupply.brand ? ` (${state.medicineSupply.brand})` : ""}`,
              dose: "400 micrograms once daily after food",
              duration: state.medicineSupply.quantity !== null ? `${state.medicineSupply.quantity} days` : "28 days",
              quantity: state.medicineSupply.quantity ?? undefined,
            }
          : undefined,
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
  }, [state, hardStops, alerts]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof BPHPatientDetails, value })
            }
            genderOption={{
              label: "Confirm patient is male",
              description: "This PGD is for male patients only.",
              checked: state.patient.maleConfirmed,
              onToggle: (v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "maleConfirmed", value: v }),
            }}
          />
        );

      case 1: // Consent
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2: // LUTS Assessment
        return (
          <div className="space-y-4">
            <SelectInput
              label="Supply type"
              value={state.medicineSupply.supplyType}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "supplyType", value: v })}
              required
              options={[
                { value: "initial", label: "Initial supply (4 weeks): IPSS must be 8 or more" },
                { value: "continuation", label: "Continuation after the 4 to 6 week review: IPSS must have improved by 3 or more" },
              ]}
            />
            <NumberInput
              label="IPSS Score (0-35)"
              value={state.lutsAssessment.ipssScore}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "ipssScore",
                  value: v,
                })
              }
              min={0}
              max={35}
              required
            />
            {state.lutsAssessment.ipssScore !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  {state.lutsAssessment.ipssScore <= 7 && "Mild symptoms (IPSS 0-7)"}
                  {state.lutsAssessment.ipssScore >= 8 && state.lutsAssessment.ipssScore <= 19 && "Moderate symptoms (IPSS 8-19)"}
                  {state.lutsAssessment.ipssScore >= 20 && "Severe symptoms (IPSS 20-35)"}
                </p>
              </div>
            )}
            <Checkbox
              label="Frequency: >8 times in 24 hours"
              checked={state.lutsAssessment.frequency}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "frequency",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Urgency: Strong, persistent urge"
              checked={state.lutsAssessment.urgency}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "urgency",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Nocturia: >1 time per night"
              checked={state.lutsAssessment.nocturia}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "nocturia",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Weak stream"
              checked={state.lutsAssessment.weakStream}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "weakStream",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Hesitancy (difficulty starting)"
              checked={state.lutsAssessment.hesitancy}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "hesitancy",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Incomplete emptying"
              checked={state.lutsAssessment.incompletEmptying}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "incompletEmptying",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Lower abdominal discomfort"
              checked={state.lutsAssessment.lowerAbdominalDiscomfort}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_LUTS_ASSESSMENT",
                  field: "lowerAbdominalDiscomfort",
                  value: v,
                })
              }
            />
          </div>
        );

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-2">
              <p className="text-sm font-semibold text-amber-900">Previous assessment (PGD v004)</p>
              <Checkbox
                label="Symptoms previously assessed by a GP or urologist"
                checked={state.medicalHistory.previouslyAssessedByGp}
                onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "previouslyAssessedByGp", value: v })}
              />
              {!state.medicalHistory.previouslyAssessedByGp && (
                <>
                  <p className="text-xs text-amber-800">Symptoms never assessed by a GP or urologist are an exclusion unless BOTH of the following apply and are recorded.</p>
                  <Checkbox
                    label="GP informed on the day of supply"
                    checked={state.medicalHistory.gpInformedToday}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "gpInformedToday", value: v })}
                  />
                  <Checkbox
                    label="Patient agrees to attend the GP within 6 weeks for examination and, where indicated, PSA testing"
                    checked={state.medicalHistory.patientAgreesGpWithin6Weeks}
                    onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "patientAgreesGpWithin6Weeks", value: v })}
                  />
                </>
              )}
            </div>
            <p className="text-sm font-semibold text-red-700">Exclusions (PGD v004). Any one excludes; refer.</p>
            <Checkbox
              label="Known hypersensitivity to tamsulosin or any excipient in the formulation"
              checked={state.medicalHistory.hypersensitivity}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypersensitivity", value: v })}
            />
            <Checkbox
              label="History of orthostatic hypotension (blood pressure drop on standing)"
              checked={state.medicalHistory.orthostasisHistory}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "orthostasisHistory",
                  value: v,
                })
              }
              description="Exclusion. Previous episodes of dizziness or fainting on standing"
            />
            <Checkbox
              label="Severe hepatic impairment (Child-Pugh grade C)"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "severeHepaticImpairment",
                  value: v,
                })
              }
              description="Exclusion"
            />
            <Checkbox
              label="Planned cataract or glaucoma surgery"
              checked={state.medicalHistory.plannedCataractSurgery}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "plannedCataractSurgery",
                  value: v,
                })
              }
              description="Exclusion: risk of intraoperative floppy iris syndrome (IFIS)"
            />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-navy-900">Blood pressure, lying and standing (measured at every supply)</p>
              <p className="text-xs text-gray-600">
                Measure after the patient has been lying (or seated) for at least 5 minutes, then again after standing for 1 to 3 minutes. Exclusions: 160/100 mmHg or above in either position, or a fall in systolic pressure of 20 mmHg or more on standing. Both readings are recorded.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumberInput
                  label="Lying systolic"
                  value={state.medicalHistory.lyingSystolic}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "lyingSystolic", value: v })}
                  min={50}
                  max={260}
                  unit="mmHg"
                  required
                />
                <NumberInput
                  label="Lying diastolic"
                  value={state.medicalHistory.lyingDiastolic}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "lyingDiastolic", value: v })}
                  min={30}
                  max={160}
                  unit="mmHg"
                  required
                />
                <NumberInput
                  label="Standing systolic"
                  value={state.medicalHistory.standingSystolic}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "standingSystolic", value: v })}
                  min={50}
                  max={260}
                  unit="mmHg"
                  required
                />
                <NumberInput
                  label="Standing diastolic"
                  value={state.medicalHistory.standingDiastolic}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "standingDiastolic", value: v })}
                  min={30}
                  max={160}
                  unit="mmHg"
                  required
                />
              </div>
              {state.medicalHistory.lyingSystolic !== null && state.medicalHistory.standingSystolic !== null && (
                <p className="text-xs text-gray-600">
                  Postural change in systolic pressure: {state.medicalHistory.lyingSystolic - state.medicalHistory.standingSystolic} mmHg
                  {state.medicalHistory.lyingSystolic - state.medicalHistory.standingSystolic >= 20 ? " (20 or more: excluded)" : ""}
                </p>
              )}
            </div>
            <Checkbox
              label="Neurological disease affecting bladder function: multiple sclerosis, Parkinson's disease, spinal cord disease, diabetic neuropathy"
              checked={state.medicalHistory.neurologicalBladderDisease}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "neurologicalBladderDisease", value: v })}
              description="Exclusion. Refer"
            />
            <p className="text-sm font-semibold text-amber-700 pt-2">Cautions (PGD v004)</p>
            <Checkbox
              label="Mild to moderate hepatic impairment"
              checked={state.medicalHistory.mildModerateHepaticImpairment}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildModerateHepaticImpairment", value: v })}
              description="Use with caution"
            />
            <Checkbox
              label="Renal impairment, eGFR below 10 mL/min/1.73m2"
              checked={state.medicalHistory.severeRenalImpairment}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeRenalImpairment", value: v })}
              description="Use with caution"
            />
            <Checkbox
              label="History of syncope or fainting"
              checked={state.medicalHistory.syncopeHistory}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "syncopeHistory", value: v })}
              description="Increased risk with tamsulosin; consider discontinuation if syncope occurs"
            />
            <TextInput
              label="Other conditions (optional)"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "otherConditions",
                  value: v,
                })
              }
              placeholder="e.g. diabetes, hypertension, CVD"
            />
          </div>
        );

      case 4: // Red Flags
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Red flags are exclusions under PGD v004: refer, do not supply medicine
              </p>
            </div>
            <Checkbox
              label="Visible or non-visible haematuria"
              checked={state.redFlags.haematuria}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "haematuria",
                  value: v,
                })
              }
              description="Refer: urological investigation before any treatment of symptoms"
            />
            <Checkbox
              label="Acute urinary retention requiring catheterisation or in-patient management"
              checked={state.redFlags.acuteRetention}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "acuteRetention",
                  value: v,
                })
              }
              description="Sudden inability to pass urine: emergency referral"
            />
            <Checkbox
              label="Palpable bladder"
              checked={state.redFlags.palpableBladder}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "palpableBladder",
                  value: v,
                })
              }
              description="On abdominal examination: suggests significant retention. Refer for post-void residual measurement"
            />
            <Checkbox
              label="Symptoms suggesting chronic retention: overflow incontinence, or a constant feeling of incomplete emptying with a poor stream"
              checked={state.redFlags.chronicRetentionSymptoms}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "chronicRetentionSymptoms", value: v })}
              description="Refer for post-void residual measurement"
            />
            <Checkbox
              label="Current or recurrent urinary tract infection, or dysuria with fever"
              checked={state.redFlags.urinaryTractInfection}
              onChange={(v) => dispatch({ type: "UPDATE_RED_FLAGS", field: "urinaryTractInfection", value: v })}
              description="Refer"
            />
            <Checkbox
              label="Known or suspected prostate cancer, an abnormal digital rectal examination, or a raised PSA"
              checked={state.redFlags.psa4OrAbove}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "psa4OrAbove",
                  value: v,
                })
              }
              description="Refer"
            />
            <Checkbox
              label="Unexplained weight loss"
              checked={state.redFlags.weightLoss}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "weightLoss",
                  value: v,
                })
              }
              description="May indicate malignancy: refer to GP"
            />
            <Checkbox
              label="Bone pain"
              checked={state.redFlags.bonePain}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_RED_FLAGS",
                  field: "bonePain",
                  value: v,
                })
              }
              description="May indicate metastatic disease: refer urgently"
            />
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-navy-900">Concurrent medicines</p>
              <Checkbox
                label="Taking another alpha-1 adrenoceptor antagonist (e.g. doxazosin, alfuzosin, terazosin, prazosin)"
                checked={state.contraindications.otherAlphaBlocker}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "otherAlphaBlocker", value: v })}
                description="Exclusion. Do not add a second alpha-blocker"
              />
              <Checkbox
                label="Taking a PDE5 inhibitor (sildenafil, tadalafil)"
                checked={state.contraindications.takingPde5Inhibitor}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "takingPde5Inhibitor", value: v })}
                description="Caution: additive hypotensive effects; monitor blood pressure carefully"
              />
              {state.contraindications.takingPde5Inhibitor && (
                <TextInput
                  label="PDE5 inhibitor details"
                  value={state.contraindications.pde5Detail}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pde5Detail", value: v })}
                  placeholder="Which one, dose, how often"
                />
              )}
              <Checkbox
                label="Taking antihypertensive medication"
                checked={state.contraindications.takingAntihypertensives}
                onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "takingAntihypertensives", value: v })}
                description="Caution: orthostatic hypotension; advise to sit or lie down if dizziness occurs"
              />
              {state.contraindications.takingAntihypertensives && (
                <TextInput
                  label="Antihypertensives"
                  value={state.contraindications.otherAntihypertensives}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "otherAntihypertensives", value: v })}
                  placeholder="List antihypertensive medicines"
                />
              )}
            </div>
          </div>
        );

      case 5: // Medicine Supply
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900 space-y-1">
              <p className="font-semibold">Tamsulosin 400 micrograms modified-release capsules. PGD v004, 11 September 2026.</p>
              <p>400 micrograms once daily, after food, preferably with breakfast. Swallow whole with water; do not crush, chew or open. Up to 28 capsules per supply.</p>
              <p>Maximum under this PGD: an initial supply of 4 weeks, then, where the IPSS has improved by 3 points or more at the 4 to 6 week review and the patient has been examined by the GP, further supplies to a maximum of 12 months&apos; continuous treatment, after which the GP takes over prescribing. No improvement at 4 to 6 weeks, or any new exclusion, ends supply under this PGD.</p>
            </div>
            <Checkbox
              label="Supply tamsulosin 400 micrograms MR capsules, once daily"
              checked={state.medicineSupply.tamsulosin400mcgMrOd}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "tamsulosin400mcgMrOd",
                  value: v,
                })
              }
              description="Modified-release formulation"
            />
            <SelectInput
              label="Supply type"
              value={state.medicineSupply.supplyType}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "supplyType", value: v })}
              required
              options={[
                { value: "initial", label: "Initial supply (4 weeks), review at 4 to 6 weeks" },
                { value: "continuation", label: "Continuation after the 4 to 6 week review" },
              ]}
            />
            {state.medicineSupply.supplyType === "continuation" && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-3">
                <p className="text-xs text-amber-800">Continuation requires all three: IPSS improved by 3 or more since the start of treatment (current IPSS is recorded on the LUTS step), GP examination completed, and fewer than 12 months of continuous treatment.</p>
                <NumberInput
                  label="IPSS at the start of treatment"
                  value={state.medicineSupply.previousIpss}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "previousIpss", value: v })}
                  min={0}
                  max={35}
                  required
                />
                {state.medicineSupply.previousIpss !== null && state.lutsAssessment.ipssScore !== null && (
                  <p className="text-sm text-navy-900">Improvement: {state.medicineSupply.previousIpss - state.lutsAssessment.ipssScore} points (current IPSS {state.lutsAssessment.ipssScore})</p>
                )}
                <Checkbox
                  label="Patient has been examined by the GP since starting treatment"
                  checked={state.medicineSupply.gpExaminedSinceStart}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "gpExaminedSinceStart", value: v })}
                />
                <NumberInput
                  label="Months of continuous treatment so far"
                  value={state.medicineSupply.monthsOnTreatment}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "monthsOnTreatment", value: v })}
                  min={0}
                  max={24}
                  unit="months"
                  required
                />
              </div>
            )}
            <NumberInput
              label="Quantity supplied (capsules, maximum 28)"
              value={state.medicineSupply.quantity}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: v })}
              min={1}
              max={28}
              unit="capsules"
              required
            />
            <TextInput
              label="Brand supplied"
              value={state.medicineSupply.brand}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "brand", value: v })}
              placeholder="e.g. generic manufacturer, Flomaxtra"
              required
            />
            <Checkbox
              label="Patient will take after food, preferably with breakfast"
              checked={state.medicineSupply.afterFood30mins}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "afterFood30mins",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient will take at same time daily"
              checked={state.medicineSupply.sameTimeDaily}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "sameTimeDaily",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient is aware of first-dose hypotension risk"
              checked={state.medicineSupply.firstDoseHypotension}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "firstDoseHypotension",
                  value: v,
                })
              }
              description="Stand up slowly from sitting or lying down, especially at the start of treatment"
            />
          </div>
        );

      case 6: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Take the capsule after food, preferably with breakfast, to minimise side effects"
              checked={state.counselling.take30minsAfterFood}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "take30minsAfterFood",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Do not crush, chew or open the capsule; swallow whole to maintain the modified-release formulation"
              checked={state.counselling.swallowWhole}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "swallowWhole", value: v })}
            />
            <Checkbox
              label="Stand up slowly from sitting or lying down, especially at the start of treatment, as dizziness may occur; avoid sudden changes in posture"
              checked={state.counselling.firstDoseHypotension}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "firstDoseHypotension",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Report any episodes of dizziness, fainting or lightheadedness to your doctor immediately"
              checked={state.counselling.reportDizzinessFainting}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reportDizzinessFainting", value: v })}
              description="May require dose adjustment or discontinuation"
            />
            <Checkbox
              label="Inform your GP or pharmacist if you experience abnormal ejaculation or other sexual dysfunction"
              checked={state.counselling.retrogradeEjaculation}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "retrogradeEjaculation",
                  value: v,
                })
              }
              description="Abnormal (mostly retrograde) ejaculation is very common and harmless"
            />
            <Checkbox
              label="Inform any healthcare professional, including eye surgeons and dentists, that you take tamsulosin before any planned procedure, especially eye surgery"
              checked={state.counselling.informOphthalmologist}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "informOphthalmologist",
                  value: v,
                })
              }
              description="Risk of intraoperative floppy iris syndrome"
            />
            <Checkbox
              label="An erection lasting longer than 4 hours (priapism): go to A&E or your GP immediately"
              checked={state.counselling.priapismWarning}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "priapismWarning", value: v })}
            />
            <Checkbox
              label="Seek urgent medical attention for rapid heartbeat, chest pain or severe dizziness"
              checked={state.counselling.urgentSymptoms}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "urgentSymptoms", value: v })}
            />
            <Checkbox
              label="If you develop a rash or suspect an allergic reaction, stop the medicine and contact your GP or pharmacist"
              checked={state.counselling.rashAllergy}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "rashAllergy", value: v })}
            />
            <Checkbox
              label="Review appointment arranged for 4 to 6 weeks to assess symptom improvement and tolerability; contact your GP or pharmacist with any concerns"
              checked={state.counselling.reviewAt4To6Weeks}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "reviewAt4To6Weeks",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Patient information leaflet supplied with the product"
              checked={state.counselling.pilSupplied}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })}
              description="Written information row of PGD v004. Required."
            />
          </div>
        );

      case 7: // Summary
        return (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
              }
              placeholder="John Smith"
              required
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
              }
              placeholder="e.g. 2123456"
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
              }
              placeholder="High Street Pharmacy"
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
              }
              placeholder="123 High Street, London"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Any additional clinical observations..."
              rows={4}
            />
            <BPHSummaryReport state={state} alerts={alerts} />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {alerts.length > 0 && (
        <AlertBanner
          alerts={alerts.filter((a) => a.severity === "stop")}
        />
      )}

      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hardStops}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {renderStep()}
      </StepWrapper>

      {doseRecommendation && state.currentStep >= 5 && (
        <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg p-4">
          <h3 className="font-semibold text-[color:var(--tenant-primary)] mb-2">Medicine Recommendation</h3>
          <div className="space-y-1 text-sm text-[color:var(--tenant-primary)]">
            <p>
              <span className="font-medium">Medicine:</span> {doseRecommendation.medicine}
            </p>
            <p>
              <span className="font-medium">Dose:</span> {doseRecommendation.dose}
            </p>
            <p>
              <span className="font-medium">Frequency:</span> {doseRecommendation.frequency}
            </p>
            <p>
              <span className="font-medium">Reason:</span> {doseRecommendation.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

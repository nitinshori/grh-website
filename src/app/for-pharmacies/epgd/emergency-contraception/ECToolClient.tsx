"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  ECConsultationState,
  ECAction,
  ECPatientDetails,
  ECClinicalAssessment,
  ECMedicalHistory,
  ECMedications,
  ECMedicineSelection,
  ECCounselling,
  ECConsultationSummary,
  ECPreviousECType,
  ECMedicineChoice,
} from "./lib/ec-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/ec-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  calculateHoursSinceUPSI,
  getMedicineAvailability,
  calculateBmi,
  isHighWeightOrBmi,
  getRequiredLngDose,
  daysSinceLmp,
} from "./lib/ec-clinical-logic";
import { validateStep } from "./lib/ec-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TimeCalculator } from "./components/TimeCalculator";
import { ECSummaryReport } from "./components/ECSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: ECConsultationState, action: ECAction): ECConsultationState {
  const newState = { ...state };

  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        newState.patient.age = calculateAge(action.value as string);
      }
      // The answers are recorded; "assessed" and "asked" follow from them.
      newState.patient.fraserCompetent = newState.patient.fraserOutcome === "competent";
      newState.patient.coercionAsked = newState.patient.coercionReported !== "";
      break;

    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;

    case "UPDATE_CLINICAL_ASSESSMENT":
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
        [action.field]: action.value,
      };
      if (action.field === "upsiDate" || action.field === "upsiTime") {
        newState.clinicalAssessment.hoursSinceUPSI = calculateHoursSinceUPSI(
          newState.clinicalAssessment.upsiDate,
          newState.clinicalAssessment.upsiTime
        );
      }
      // Previous EC this cycle is asked once, here. takesUPA is derived so
      // the levonorgestrel-after-ulipristal gate cannot be missed.
      if (action.field === "previousECType" || action.field === "previousEC") {
        const type: ECPreviousECType = newState.clinicalAssessment.previousEC
          ? newState.clinicalAssessment.previousECType
          : "";
        newState.clinicalAssessment.previousECType = type;
        newState.medications = { ...newState.medications, takesUPA: type === "ulipristal" };
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICATIONS":
      newState.medications = { ...newState.medications, [action.field]: action.value };
      break;

    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = {
        ...newState.medicineSelection,
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

    case "NEXT_STEP":
      newState.currentStep = Math.min(newState.currentStep + 1, TOTAL_STEPS - 1);
      // Hours since UPSI is recomputed on every step change so a
      // consultation that crosses the 72 hour line while in progress is
      // judged on the current time, not the time the date was typed.
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
        hoursSinceUPSI: calculateHoursSinceUPSI(newState.clinicalAssessment.upsiDate, newState.clinicalAssessment.upsiTime),
      };
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

// ─── Main Component ───

export function ECToolClient() {
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

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  // Compute alerts and recommendations
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);
  const medicineAvailability = useMemo(() => getMedicineAvailability(state), [state]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  // Validation for current step
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);

  // A stop anywhere disables Next on every step. The progress bar only moves
  // backwards, so the only route past a stop is "Save as not supplied".
  const canProceed = !validationError && !hasStops;

  // The levonorgestrel dose is fixed by the document (3 mg with enzyme
  // inducers or at 70 kg or over / BMI 26 or over, otherwise 1.5 mg). It is
  // derived, not chosen, so there is nothing to override.
  const requiredLng = useMemo(() => getRequiredLngDose(state), [state]);
  useEffect(() => {
    const sel = state.medicineSelection;
    if (sel.medicine === "levonorgestrel") {
      if (sel.dose !== requiredLng.dose)
        dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "dose", value: requiredLng.dose });
      if (sel.doubleDosingRequired !== (requiredLng.dose === "3mg"))
        dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "doubleDosingRequired", value: requiredLng.dose === "3mg" });
      if (sel.doubleDoseReason !== requiredLng.reason)
        dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "doubleDoseReason", value: requiredLng.reason });
    } else if (sel.medicine === "ulipristal") {
      if (sel.dose !== "30mg") dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "dose", value: "30mg" });
      if (sel.doubleDosingRequired) dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "doubleDosingRequired", value: false });
      if (sel.doubleDoseReason) dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "doubleDoseReason", value: "" });
    } else if (sel.dose || sel.doubleDoseReason || sel.doubleDosingRequired) {
      dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "dose", value: "" });
      dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "doubleDosingRequired", value: false });
      dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "doubleDoseReason", value: "" });
    }
  }, [state.medicineSelection, requiredLng]);

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
  // Returns a record on every step, with or without a medicine, so an
  // excluded patient can be saved as not supplied from the step the stop was
  // raised. Saves updatedState so alerts and the recommendation are stored.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const sel = state.medicineSelection;
    const supplied = !hasStops && (sel.medicine === "levonorgestrel" || sel.medicine === "ulipristal");
    const medicine = supplied
      ? sel.medicine === "levonorgestrel"
        ? {
            name: "Levonorgestrel 1.5mg tablet (Levonelle)",
            medicine: "levonorgestrel",
            dose: sel.dose === "3mg" ? "3 mg (two tablets) single dose" : "1.5 mg (one tablet) single dose",
            duration: "Single dose",
            quantity: sel.dose === "3mg" ? "2 tablets" : "1 tablet",
          }
        : {
            name: "Ulipristal acetate 30mg tablet (ellaOne)",
            medicine: "ulipristal",
            dose: "30 mg (one tablet) single dose",
            duration: "Single dose",
            quantity: "1 tablet",
          }
      : undefined;
    const hoursAtSave = calculateHoursSinceUPSI(state.clinicalAssessment.upsiDate, state.clinicalAssessment.upsiTime);
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
      clinicalData: { ...updatedState, hoursSinceUPSIAtSave: hoursAtSave } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : sel.medicine === "not-supplied" ? "referred" : "completed",
      medicine,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, updatedState, hasStops, __pharmProfile]);

  // Advice given and decision reached for an excluded patient. Shown on any
  // step where a stop is present, next to Save as not supplied, so the
  // record holds the advice without reaching the medicine selection step.
  const exclusionOutcomeBlock = hasStops ? (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        Patient excluded: do not supply. Record who the patient was referred to and the advice given (including the copper IUD where within 5 days of UPSI), then use Save as not supplied.
      </p>
      <SelectInput
        label="Referred to"
        value={state.medicineSelection.referredTo}
        onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "referredTo", value: v })}
        options={[
          { value: "sexual-health", label: "Sexual health service" },
          { value: "gp", label: "GP" },
          { value: "other", label: "Other (state in advice given)" },
        ]}
        required
      />
      <TextArea
        label="Advice given and decision reached"
        value={state.medicineSelection.notSuppliedReason}
        onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "notSuppliedReason", value: v })}
        placeholder="e.g. Referred to sexual health clinic today for copper IUD assessment; GP informed"
        rows={3}
        required
      />
    </div>
  ) : null;

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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field, value })
              }
              genderOption={{
                label: "Patient is female",
                description:
                  "Emergency contraception is for patients who are female.",
                checked: state.patient.femaleConfirmed,
                onToggle: (v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "femaleConfirmed", value: v }),
              }}
            />
            {state.patient.age !== null && state.patient.age < 13 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded space-y-3">
                <p className="text-sm font-semibold text-red-800">
                  Aged under 13: any sexual activity is a safeguarding concern. This ePGD does not
                  supply emergency contraception to a child under 13 (Get Real Health service decision).
                  Refer the same day to the GP or sexual health service, make a safeguarding referral
                  (mandatory), record both below, then use &quot;Save as not supplied&quot; so the
                  safeguarding record is kept.
                </p>
                <Checkbox
                  label="Safeguarding referral made"
                  checked={state.patient.safeguardingReferralMade}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "safeguardingReferralMade", value: v })
                  }
                  required
                />
                <TextArea
                  label="Safeguarding referral record"
                  value={state.patient.safeguardingNotes}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_PATIENT", field: "safeguardingNotes", value: v })
                  }
                  placeholder="Who was contacted, when, and the outcome"
                  required
                />
              </div>
            )}
            {state.patient.age !== null && state.patient.age >= 13 && state.patient.age <= 15 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded space-y-3">
                <p className="text-sm font-semibold text-amber-900">
                  Aged 13 to 15: assess and record Fraser competence, ask about coercion, the age of the
                  partner and any safeguarding concern, and follow the local safeguarding pathway.
                </p>
                <SelectInput
                  label="Fraser competence (outcome of the assessment)"
                  value={state.patient.fraserOutcome}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_PATIENT",
                      field: "fraserOutcome",
                      value: v as ECPatientDetails["fraserOutcome"],
                    })
                  }
                  options={[
                    { value: "competent", label: "Competent: understands the advice, cannot be persuaded to involve a parent, is likely to continue having sex, and their best interests require supply" },
                    { value: "not-competent", label: "Not competent: do not supply, refer" },
                  ]}
                  required
                />
                <SelectInput
                  label="Is there any coercion? (ask the young person)"
                  value={state.patient.coercionReported}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_PATIENT",
                      field: "coercionReported",
                      value: v as ECPatientDetails["coercionReported"],
                    })
                  }
                  options={[
                    { value: "no", label: "No" },
                    { value: "yes", label: "Yes: follow the local safeguarding pathway and record the action taken" },
                  ]}
                  required
                />
                <TextInput
                  label="Age of the partner"
                  value={state.patient.partnerAge}
                  onChange={(v) => dispatch({ type: "UPDATE_PATIENT", field: "partnerAge", value: v })}
                  placeholder="e.g. 15"
                  required
                />
                <Checkbox
                  label="Safeguarding concern identified"
                  checked={state.patient.safeguardingConcern}
                  onChange={(v) => dispatch({ type: "UPDATE_PATIENT", field: "safeguardingConcern", value: v })}
                  description="If ticked, follow the local safeguarding pathway and record the action taken."
                />
                <TextArea
                  label="Safeguarding assessment record"
                  value={state.patient.safeguardingNotes}
                  onChange={(v) => dispatch({ type: "UPDATE_PATIENT", field: "safeguardingNotes", value: v })}
                  placeholder="Fraser assessment, coercion, partner age, any concern and action taken"
                  required
                />
              </div>
            )}
          </StepWrapper>
        );

      case 1: // Consent & ID
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
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 2: // Clinical Assessment
        return (
          <StepWrapper
            title="Clinical Assessment"
            description="Record UPSI details and timing. This determines which medicines can be offered."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="font-semibold text-sm text-navy-900 mb-3">
                  Time since UPSI
                </h3>
                <TimeCalculator
                  upsiDate={state.clinicalAssessment.upsiDate}
                  upsiTime={state.clinicalAssessment.upsiTime}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Date of UPSI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={state.clinicalAssessment.upsiDate}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "upsiDate",
                        value: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Time of UPSI (approximate) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={state.clinicalAssessment.upsiTime}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "upsiTime",
                        value: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Last menstrual period <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.clinicalAssessment.lastMenstrualPeriod}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_CLINICAL_ASSESSMENT",
                      field: "lastMenstrualPeriod",
                      value: e.target.value,
                    })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                />
              </div>

              {(() => {
                const d = daysSinceLmp(state.clinicalAssessment.lastMenstrualPeriod);
                return d !== null && d > 35 ? (
                  <p className="text-xs text-amber-700">
                    Last period {d} days ago (more than 5 weeks): pregnancy is suspected unless a pregnancy test is negative.
                  </p>
                ) : null;
              })()}

              <Checkbox
                label="Menstrual cycle is regular"
                checked={state.clinicalAssessment.cycleRegular}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "cycleRegular",
                    value: v,
                  })
                }
              />

              {state.clinicalAssessment.cycleRegular && (
                <NumberInput
                  label="Cycle length"
                  value={state.clinicalAssessment.cycleLength}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_CLINICAL_ASSESSMENT",
                      field: "cycleLength",
                      value: v,
                    })
                  }
                  min={21}
                  max={35}
                  unit="days"
                  required
                />
              )}

              <Checkbox
                label="Patient reports pregnancy-like symptoms"
                checked={state.clinicalAssessment.currentPregnancySymptoms}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "currentPregnancySymptoms",
                    value: v,
                  })
                }
                description="e.g. nausea, breast tenderness. Pregnancy is then suspected unless a pregnancy test is negative."
              />

              <SelectInput
                label="Pregnancy test result"
                value={state.medicalHistory.pregnancyTestResult}
                onChange={(v: string) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancyTestResult",
                    value: v as "positive" | "negative" | "not-done" | "",
                  })
                }
                options={[
                  { value: "negative", label: "Negative" },
                  { value: "positive", label: "Positive (exclusion)" },
                  { value: "not-done", label: "Not done (does not lift a suspicion of pregnancy)" },
                ]}
                required
              />

              <Checkbox
                label="Known or suspected pregnancy"
                checked={state.medicalHistory.currentlyPregnant}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "currentlyPregnant",
                    value: v,
                  })
                }
                description="Exclusion for both medicines (also raised by a positive test, or by symptoms or a period more than 5 weeks ago without a negative test)."
              />

              <Checkbox
                label="Patient already uses regular contraception"
                checked={state.clinicalAssessment.regularContraception}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "regularContraception",
                    value: v,
                  })
                }
              />

              {state.clinicalAssessment.regularContraception && (
                <div className="space-y-4">
                  <TextInput
                    label="Type of contraception"
                    value={state.clinicalAssessment.contraceptionType}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "contraceptionType",
                        value: v,
                      })
                    }
                    placeholder="e.g. combined pill, IUD, implant"
                  />
                  <TextInput
                    label="How the contraception failed"
                    value={state.clinicalAssessment.contraceptionFailureType}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "contraceptionFailureType",
                        value: v,
                      })
                    }
                    placeholder="e.g. condom split, missed pills"
                  />
                </div>
              )}

              <Checkbox
                label="Patient has already used emergency contraception this cycle"
                checked={state.clinicalAssessment.previousEC}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "previousEC",
                    value: v,
                  })
                }
              />

              {state.clinicalAssessment.previousEC && (
                <div className="space-y-4">
                  <SelectInput
                    label="Which emergency contraceptive was used this cycle"
                    value={state.clinicalAssessment.previousECType}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "previousECType",
                        value: v as ECPreviousECType,
                      })
                    }
                    options={[
                      { value: "levonorgestrel", label: "Levonorgestrel (Levonelle or generic)" },
                      { value: "ulipristal", label: "Ulipristal acetate (ellaOne): levonorgestrel cannot then be given this cycle" },
                      { value: "unknown", label: "Not known" },
                    ]}
                    required
                  />
                  <TextArea
                    label="Date taken and any other detail"
                    value={state.clinicalAssessment.previousECDetails}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "previousECDetails",
                        value: v,
                      })
                    }
                    placeholder="e.g. ellaOne taken on 3 September"
                  />
                </div>
              )}

              <Checkbox
                label="Patient reports multiple UPSI episodes this cycle"
                checked={state.clinicalAssessment.additionalUPSIInstances}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "additionalUPSIInstances",
                    value: v,
                  })
                }
                description="Discussion of ongoing risk and long-term contraception is important."
              />
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions relevant to emergency contraception."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Pregnancy test result and known or suspected pregnancy were recorded on the Clinical Assessment step
                ({state.medicalHistory.pregnancyTestResult ? `test ${state.medicalHistory.pregnancyTestResult.replace("-", " ")}` : "test result not recorded"}
                {state.medicalHistory.currentlyPregnant ? "; known or suspected pregnancy recorded" : ""}).
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <NumberInput
                  label="Weight"
                  value={state.medicalHistory.weightKg}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "weightKg", value: v })
                  }
                  min={20}
                  max={300}
                  unit="kg"
                  required
                />
                <NumberInput
                  label="Height"
                  value={state.medicalHistory.heightCm}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "heightCm", value: v })
                  }
                  min={100}
                  max={250}
                  unit="cm"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">BMI</label>
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-navy-900">
                    {calculateBmi(state.medicalHistory.weightKg, state.medicalHistory.heightCm) ?? "Enter weight and height"}
                  </div>
                </div>
              </div>
              {isHighWeightOrBmi(state) && (
                <p className="text-xs text-amber-700">
                  Weight 70 kg or over, or BMI 26 or over: ulipristal is preferred (FSRH) unless unsuitable; where
                  levonorgestrel is used give 3 mg (off-label per FSRH). Explain this and record it.
                </p>
              )}

              <Checkbox
                label="Hypersensitivity to levonorgestrel or any component of the formulation"
                checked={state.medicalHistory.lngHypersensitivity}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "lngHypersensitivity", value: v })
                }
                description="Exclusion for levonorgestrel."
              />
              <Checkbox
                label="Hypersensitivity to ulipristal acetate or any component of the formulation"
                checked={state.medicalHistory.upaHypersensitivity}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "upaHypersensitivity", value: v })
                }
                description="Exclusion for ulipristal."
              />
              <Checkbox
                label="Hereditary galactose intolerance"
                checked={state.medicalHistory.galactoseIntolerance}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "galactoseIntolerance", value: v })
                }
                description="Exclusion for both medicines."
              />

              <Checkbox
                label="Severe hepatic impairment (e.g. cirrhosis)"
                checked={state.medicalHistory.severeHepatic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeHepatic",
                    value: v,
                  })
                }
                description="Contraindication for both levonorgestrel and ulipristal."
              />

              <Checkbox
                label="Severe asthma insufficiently controlled by oral glucocorticoids"
                checked={state.medicalHistory.severeAsthma}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeAsthma",
                    value: v,
                  })
                }
                description="Exclusion for ulipristal."
              />

              <Checkbox
                label="Malabsorption condition affecting drug absorption (e.g. Crohn's disease)"
                checked={state.medicalHistory.crohnsDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "crohnsDisease",
                    value: v,
                  })
                }
                description="May reduce efficacy of oral emergency contraception."
              />

              <Checkbox
                label="Currently breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "breastfeeding",
                    value: v,
                  })
                }
                description="Levonorgestrel: avoid breastfeeding for 8 hours after the dose. Ulipristal: avoid breastfeeding for 7 days after the dose."
              />

              <Checkbox
                label="Previous ectopic pregnancy"
                checked={state.medicalHistory.previousEctopic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "previousEctopic",
                    value: v,
                  })
                }
                description="Emergency contraception can still be used; advise on warning signs."
              />

              <Checkbox
                label="Acute intermittent porphyria"
                checked={state.medicalHistory.porphyria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "porphyria",
                    value: v,
                  })
                }
                description="Exclusion for levonorgestrel."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Current Medications
        return (
          <StepWrapper
            title="Current Medications & Interactions"
            description="Check for interactions and efficacy-reducing drugs."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              <Checkbox
                label="Takes enzyme-inducing drugs"
                checked={state.medications.takesEnzymeInducers}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesEnzymeInducers",
                    value: v,
                  })
                }
                description="In the last 4 weeks: anticonvulsants, rifampicin, antiretrovirals, St John's Wort. Ulipristal is not recommended; offer a copper IUD, or levonorgestrel 3 mg if declined."
              />

              {state.medications.takesEnzymeInducers && (
                <TextArea
                  label="Specify which enzyme-inducing drugs"
                  value={state.medications.enzymeInducerDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "enzymeInducerDetails",
                      value: v,
                    })
                  }
                  required
                />
              )}

              <p className="text-xs text-gray-500">
                Previous emergency contraception this cycle:{" "}
                {state.clinicalAssessment.previousEC
                  ? `${state.clinicalAssessment.previousECType || "type not recorded"}${state.medications.takesUPA ? " (levonorgestrel cannot be given after ulipristal this cycle)" : ""}`
                  : "none recorded on the Clinical Assessment step"}.
              </p>

              <Checkbox
                label="Progestogen-containing contraceptive taken in the previous 7 days"
                checked={state.medications.progestogenLast7Days}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICATIONS", field: "progestogenLast7Days", value: v })
                }
                description="May reduce ulipristal efficacy; consider levonorgestrel instead."
              />

              <Checkbox
                label="Currently uses hormonal contraception"
                checked={state.medications.currentHormonalContraception}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "currentHormonalContraception",
                    value: v,
                  })
                }
              />

              {state.medications.currentHormonalContraception && (
                <TextInput
                  label="Type of hormonal contraception"
                  value={state.medications.hormonalContraceptionType}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "hormonalContraceptionType",
                      value: v,
                    })
                  }
                  placeholder="e.g. combined oral contraceptive, POP, patch, ring"
                  required
                />
              )}
            </div>
          </StepWrapper>
        );

      case 5: // Contraindications Review
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
                ? "Exclusion present: cannot proceed to medicine selection. Give the advice, refer as appropriate, and save as not supplied."
                : null
            }
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard stop: cannot supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified contraindications, emergency contraception cannot be
                  supplied. The patient should be referred to their GP or local sexual health
                  clinic for further advice, including consideration of copper IUD if within 5
                  days of UPSI.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 6: // Medicine Selection
        return (
          <StepWrapper
            title="Medicine Selection"
            description="Select appropriate emergency contraception based on clinical assessment."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-4">
              {doseRecommendation && doseRecommendation.medicine !== "none" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Recommended:
                  </p>
                  <p className="text-sm text-blue-800">
                    {doseRecommendation.medicine === "levonorgestrel"
                      ? "Levonorgestrel"
                      : "Ulipristal"}{" "}
                    {doseRecommendation.dose}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {doseRecommendation.reason}
                  </p>
                </div>
              )}

              <SelectInput
                label="Medicine selected"
                value={state.medicineSelection.medicine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SELECTION",
                    field: "medicine",
                    value: v as ECMedicineChoice,
                  })
                }
                options={[
                  {
                    value: "levonorgestrel",
                    label: `Levonorgestrel 1.5mg tablet (Levonelle), within 72 hours (${medicineAvailability.canUseLNG ? "Available" : "Not available: " + medicineAvailability.lngReasons.join(", ")})`,
                  },
                  {
                    value: "ulipristal",
                    label: `Ulipristal acetate 30mg tablet (ellaOne), within 120 hours (${medicineAvailability.canUseUPA ? "Available" : "Not available: " + medicineAvailability.upaReasons.join(", ")})`,
                  },
                  {
                    value: "not-supplied",
                    label: "Not supplied: patient declined, or referred (for example for a copper IUD)",
                  },
                ]}
                required
              />

              {state.medicineSelection.medicine === "not-supplied" && (
                <TextArea
                  label="Advice given and decision reached"
                  value={state.medicineSelection.notSuppliedReason}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "notSuppliedReason", value: v })
                  }
                  placeholder="e.g. Referred to sexual health clinic for copper IUD today; or patient declined oral EC after discussion"
                  required
                />
              )}

              {state.medicineSelection.medicine === "levonorgestrel" && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm font-medium text-navy-900">Dose (fixed by the PGD)</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {requiredLng.dose === "3mg"
                      ? "3 mg double dose (2 tablets) as a single dose, as soon as possible"
                      : "1.5 mg (1 tablet) as a single dose, as soon as possible, ideally within 12 hours"}
                  </p>
                  {requiredLng.reason === "enzyme-inducers" && (
                    <p className="text-xs text-gray-600 mt-1">Reason: enzyme-inducing drugs in the last 4 weeks (licensed double dose).</p>
                  )}
                  {requiredLng.reason === "weight-bmi" && (
                    <p className="text-xs text-gray-600 mt-1">Reason: weight 70 kg or over, or BMI 26 or over (off-label per FSRH). Ulipristal is preferred unless unsuitable; 1.5 mg is not an option for this patient.</p>
                  )}
                </div>
              )}

              {state.medicineSelection.medicine === "levonorgestrel" &&
                requiredLng.reason === "weight-bmi" && (
                  <Checkbox
                    label="Off-label use explained to the patient and recorded"
                    checked={state.medicineSelection.offLabelExplained}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "offLabelExplained", value: v })
                    }
                    description="Weight or BMI based 3 mg levonorgestrel is off-label per FSRH guidance."
                    required
                  />
                )}

              {state.medicineSelection.medicine === "levonorgestrel" &&
                state.medications.takesEnzymeInducers && (
                  <Checkbox
                    label="Copper IUD offered and declined"
                    checked={state.medicineSelection.copperIudOffered}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "copperIudOffered", value: v })
                    }
                    description="Enzyme inducers: offer a copper IUD; if declined give levonorgestrel 3 mg (two tablets, licensed). Do not switch to ulipristal."
                    required
                  />
                )}

              {state.medicineSelection.medicine === "ulipristal" && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm font-medium text-navy-900">Dose</p>
                  <p className="text-sm text-gray-700 mt-1">30 mg as a single dose (1 tablet), as soon as possible after UPSI, effective up to 120 hours</p>
                </div>
              )}
            </div>
          </StepWrapper>
        );

      case 7: // Counselling & Follow-up
        return (
          <StepWrapper
            title="Counselling & Follow-up Advice"
            description="Confirm counselling points discussed with patient."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
          >
            <div className="space-y-3">
              <Checkbox
                label="Advised when to take the medicine"
                checked={state.counselling.timingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "timingAdvice",
                    value: v,
                  })
                }
                description="As soon as possible (levonorgestrel ideally within 12 hours, effective up to 72 hours; ulipristal up to 120 hours). Emergency contraception works best when taken as soon as possible."
              />

              <Checkbox
                label="Advised what to do if vomiting occurs"
                checked={state.counselling.vomitingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "vomitingAdvice",
                    value: v,
                  })
                }
                description="If vomiting occurs within 3 hours of taking the tablet (either medicine), return immediately as another tablet is needed."
              />

              <Checkbox
                label="Advised emergency contraception is not 100% effective"
                checked={state.counselling.notGuaranteed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "notGuaranteed",
                    value: v,
                  })
                }
                description="Use barrier contraception (condoms) until the next period."
              />

              <Checkbox
                label="Advised to take pregnancy test if period is >7 days late"
                checked={state.counselling.pregnancyTestAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pregnancyTestAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Future contraception options discussed"
                checked={state.counselling.futureContraceptionDiscussed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "futureContraceptionDiscussed",
                    value: v,
                  })
                }
                description="Long-acting methods, pill, barrier methods, etc."
              />

              <Checkbox
                label="Advised when to contact GP / return for review"
                checked={state.counselling.returnToGPAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "returnToGPAdvice",
                    value: v,
                  })
                }
                description="If the period is more than 7 days late, do a pregnancy test or contact the doctor; contact the doctor for any adverse effects or concerns."
              />

              <Checkbox
                label="STI screening advice provided"
                checked={state.counselling.stiScreeningAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "stiScreeningAdvice",
                    value: v,
                  })
                }
                description="Emergency contraception does not protect against STIs; discuss STI testing if appropriate."
              />

              <Checkbox
                label="Side effects explained"
                checked={state.counselling.sideEffectsExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "sideEffectsExplained",
                    value: v,
                  })
                }
                description="Nausea, headache, irregular bleeding, dizziness, etc."
              />

              <Checkbox
                label="Discussed how to restart/continue regular contraception"
                checked={state.counselling.hormonalContraceptionRestart}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "hormonalContraceptionRestart",
                    value: v,
                  })
                }
                description="After levonorgestrel: start or continue regular contraception. After ulipristal: wait 5 days before starting hormonal contraception, with condoms until it is reliable again."
              />

              {state.medicalHistory.breastfeeding && (
                <Checkbox
                  label="Breastfeeding advice given"
                  checked={state.counselling.breastfeedingAdvice}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_COUNSELLING", field: "breastfeedingAdvice", value: v })
                  }
                  description="Avoid breastfeeding for 8 hours after levonorgestrel, or 7 days after ulipristal."
                  required
                />
              )}

              <Checkbox
                label="Patient information leaflet (PIL) supplied with the medication"
                checked={state.counselling.pilSupplied}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })
                }
                required
              />
            </div>
          </StepWrapper>
        );

      case 8: // Summary & Print
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            description="Confirm the practitioner details, review the record, then save and print."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
                }
                required
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
                }
                required
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
                }
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
                }
              />
              <TextArea
                label="Additional clinical notes"
                value={state.summary.clinicalNotes}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
                }
                placeholder="Any additional information to record..."
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Review the summary below before saving and printing the consultation record.
              </p>
              <ECSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={Boolean(validationError)}
      />

      {/* Alert Banner */}
      {alerts.length > 0 && state.currentStep < 6 && (
        <AlertBanner alerts={alerts} />
      )}
      {exclusionOutcomeBlock}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}

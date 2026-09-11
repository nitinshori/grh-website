"use client";
import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { PeriodDelayConsultationState, PeriodDelayAction } from "./lib/period-delay-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/period-delay-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation, calculateBmi, MAX_TREATMENT_DAYS } from "./lib/period-delay-clinical-logic";
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

/**
 * Parse DD/MM/YYYY. Returns null on anything else, including 31/02/2026,
 * because Date() would silently roll that forward to 3 March and the whole
 * point of this field is that the date is right.
 */
function parseUkDate(v: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((v || "").trim());
  if (!m) return null;
  const [dd, mm, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function formatUkDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Whole days from today to `d`, negative if it is in the past. */
function daysFromToday(d: Date): number {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return Math.round((x.getTime() - t.getTime()) / 86400000);
}

/** Norethisterone is started 3 days before the period is due. */
function startDateFor(expected: Date): Date {
  const s = new Date(expected);
  s.setDate(s.getDate() - 3);
  return s;
}

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
      // The date the period is due drives two other fields. Deriving them
      // here rather than asking for them separately means they cannot
      // disagree with each other, which is what happened when the days and
      // the planned start date were both typed in by hand.
      if (action.field === "expectedPeriodDate") {
        const due = parseUkDate(action.value as string);
        newState.assessment.daysUntilExpected = due ? daysFromToday(due) : null;
        newState.medicineSelection = {
          ...newState.medicineSelection,
          startDate: due ? formatUkDate(startDateFor(due)) : "",
        };
      }
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
  const bmi = calculateBmi(state.medicalHistory.heightCm, state.medicalHistory.weightKg);

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
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
              requireAdult={false}
              genderOption={{
                label: "Patient is female",
                description: "This PGD covers women aged 16 and over. Male is an exclusion.",
                checked: state.medicalHistory.femaleConfirmed,
                onToggle: (v: boolean) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "femaleConfirmed", value: v }),
              }}
            />
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
              <TextInput label="Dates the delay is needed for" value={state.assessment.datesNeededFor} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "datesNeededFor", value: v })} placeholder="e.g. 14/10/2026 to 21/10/2026" required />
              <TextInput label="Date of last menstrual period (first day)" value={state.assessment.lastPeriodDate} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastPeriodDate", value: v })} placeholder="DD/MM/YYYY" required />
              <Checkbox label="Patient has a regular, predictable menstrual cycle" checked={state.assessment.cycleRegular} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "cycleRegular", value: v })} description="An irregular or unpredictable cycle is an exclusion: the start date cannot be calculated." />
              <TextInput label="When is the next period due? (first day)" value={state.assessment.expectedPeriodDate} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "expectedPeriodDate", value: v })} placeholder="DD/MM/YYYY" required />
              {state.assessment.expectedPeriodDate !== "" && state.assessment.daysUntilExpected === null && (
                <p className="text-sm text-red-700">Enter the date as DD/MM/YYYY.</p>
              )}
              {state.assessment.daysUntilExpected !== null && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                  <p>
                    That is <strong>{state.assessment.daysUntilExpected} day{state.assessment.daysUntilExpected === 1 ? "" : "s"}</strong> from today.
                  </p>
                  <p className="mt-1">
                    Norethisterone must be started <strong>3 days before</strong> the period is due, so the start date is{" "}
                    <strong>{state.medicineSelection.startDate || "not calculable"}</strong>.
                  </p>
                  {state.assessment.daysUntilExpected <= 3 && (
                    <p className="mt-1 font-semibold text-red-700">
                      The expected date must be more than 3 days away. This patient is excluded on this occasion.
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-2">
                <p className="text-sm font-semibold text-amber-900">Excluding pregnancy (required before any supply)</p>
                <p className="text-xs text-amber-800">Ask, in these terms: &quot;When did your last period start, and was it normal for you?&quot; and &quot;Have you had sex without contraception, or had a contraceptive failure, since that period?&quot;</p>
                <Checkbox label="Last period was normal for her and on time" checked={state.assessment.lastPeriodNormalOnTime} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastPeriodNormalOnTime", value: v })} />
                <Checkbox label="No unprotected sex or contraceptive failure since that period" checked={state.assessment.noUnprotectedSexSince} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "noUnprotectedSexSince", value: v })} />
                {!(state.assessment.lastPeriodNormalOnTime && state.assessment.noUnprotectedSexSince) && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-amber-800">Pregnancy cannot be excluded on history. Do not supply until a pregnancy test taken no earlier than 21 days after the last unprotected sex is negative. Record the date and result.</p>
                    <Checkbox label="Pregnancy test negative, taken no earlier than 21 days after the last unprotected sex" checked={state.assessment.pregnancyTestNegative} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "pregnancyTestNegative", value: v })} />
                    <TextInput label="Date of pregnancy test" value={state.assessment.pregnancyTestDate} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "pregnancyTestDate", value: v })} placeholder="DD/MM/YYYY" />
                  </div>
                )}
              </div>
              <Checkbox label="Patient has used norethisterone for period delay before" checked={state.assessment.previousUse} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousUse", value: v })} />
              {state.assessment.previousUse && (
                <TextArea label="Any previous issues or side effects?" value={state.assessment.previousIssues} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousIssues", value: v })} placeholder="e.g., breakthrough bleeding, nausea, headaches" />
              )}
              <SelectInput
                label="Previous supplies of norethisterone for period delay in the last 6 months (any source)"
                value={state.assessment.previousSuppliesLast6Months}
                onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousSuppliesLast6Months", value: v })}
                required
                options={[
                  { value: "0", label: "None" },
                  { value: "1", label: "One" },
                  { value: "2+", label: "Two or more (excluded, refer)" },
                ]}
              />
              {state.assessment.previousSuppliesLast6Months !== "" && state.assessment.previousSuppliesLast6Months !== "0" && (
                <NumberInput label="Days of norethisterone supplied in the last 6 months" value={state.assessment.daysSuppliedLast6Months} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "daysSuppliedLast6Months", value: v })} min={0} max={60} unit="days" required />
              )}
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Medical History" description="Screen for contraindications to norethisterone." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-4">
              <div className="border-b pb-3"><p className="text-sm font-semibold text-red-700">EXCLUSIONS (PGD v008). If any is present, do NOT supply. Refer.</p></div>
              <Checkbox label="Known or suspected pregnancy" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="Norethisterone is contraindicated in pregnancy. Pregnancy exclusion is recorded on the Assessment step." />
              <Checkbox label="Any hormone sensitive cancer, including breast cancer, current or past" checked={state.medicalHistory.activeBreastCancer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeBreastCancer", value: v })} />
              <Checkbox label="Known BRCA1 or BRCA2 carrier status" checked={state.medicalHistory.brcaCarrier} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "brcaCarrier", value: v })} />
              <div className="mt-4 mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                <p className="text-sm font-semibold text-amber-900">Venous thromboembolism gate (Appendix 1). Ask all eight. Any single YES excludes.</p>
                <p className="text-xs text-amber-800 mt-1">At 5mg three times daily a clinically significant proportion of norethisterone is metabolised to ethinylestradiol, so the clot risk is closer to a combined pill than to a progestogen-only pill. Record the answers, not just the outcome.</p>
              </div>
              <Checkbox label="1. Ever had a blood clot, a DVT, a clot on the lung, a stroke, a mini-stroke or a heart attack (personal history of VTE, DVT, PE, stroke, TIA, MI or any arterial disease)" checked={state.medicalHistory.historyOfDVT} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfDVT", value: v })} />
              <Checkbox label="2. Known thrombophilia, or anyone in the immediate family with a blood clot before the age of 45 or a clotting disorder" checked={state.medicalHistory.familyVteUnder45} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "familyVteUnder45", value: v })} />
              <Checkbox label="3. Currently smokes, any amount, any age" description="PGD v008 excludes all current smokers." checked={state.medicalHistory.currentSmoker} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentSmoker", value: v })} />
              <Checkbox label="Stopped smoking less than a year ago, any age" description="Ask this separately: a question that only asks whether she smokes misclassifies a recent quitter. Excludes." checked={state.medicalHistory.stoppedSmokingUnderOneYear} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "stoppedSmokingUnderOneYear", value: v })} />
              <Checkbox label="Stopped smoking a year or more ago" description="Recorded. At 35 or over this is UKMEC 2, not an exclusion in the PGD." checked={state.medicalHistory.stoppedSmokingOverOneYear} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "stoppedSmokingOverOneYear", value: v })} />
              {state.medicalHistory.currentSmoker && (
                <TextInput label="Cigarettes per day" type="number" value={state.medicalHistory.cigarettesPerDay === null ? "" : String(state.medicalHistory.cigarettesPerDay)} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cigarettesPerDay", value: v === "" ? null : Number(v) })} placeholder="For the record: any amount excludes" />
              )}
              <p className="text-sm text-navy-900">4. Height and weight, for BMI. Measure or ask. Do not estimate. BMI 30 or above excludes.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Height (cm)" type="number" value={state.medicalHistory.heightCm === null ? "" : String(state.medicalHistory.heightCm)} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "heightCm", value: v === "" ? null : Number(v) })} placeholder="Measure or ask. Do not estimate." required />
                <TextInput label="Weight (kg)" type="number" value={state.medicalHistory.weightKg === null ? "" : String(state.medicalHistory.weightKg)} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "weightKg", value: v === "" ? null : Number(v) })} placeholder="BMI 30 or above excludes" required />
              </div>
              {bmi !== null && (
                <p className={`text-sm ${bmi >= 30 ? "font-semibold text-red-700" : "text-gray-700"}`}>BMI {bmi.toFixed(1)} kg/m2{bmi >= 30 ? ": 30 or above, excluded" : ""}</p>
              )}
              <Checkbox label="5. Flight, coach, train or car journey of 4 hours or more during the course, or in the 2 weeks after it" checked={state.medicalHistory.longJourney} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "longJourney", value: v })} description="Excludes. This will exclude many holiday requests; that is the intended effect. Give the alternatives in Appendix 2." />
              <Checkbox label="6. Surgery under general anaesthetic in the last 6 weeks, or planned during or within 2 weeks of the course" checked={state.medicalHistory.recentOrPlannedSurgery} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentOrPlannedSurgery", value: v })} />
              <Checkbox label="7. Any current or expected period of immobility, including a leg in plaster or being bed-bound" checked={state.medicalHistory.immobility} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immobility", value: v })} />
              <Checkbox label="8. Cancer now, or treated for cancer in the last 12 months" checked={state.medicalHistory.activeOrRecentCancer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeOrRecentCancer", value: v })} />
              <div className="border-t pt-4"><p className="text-sm font-semibold text-red-700">Other exclusions</p></div>
              <Checkbox label="History of pulmonary embolism (PE)" checked={state.medicalHistory.historyOfPE} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfPE", value: v })} />
              <Checkbox label="History of stroke or TIA" checked={state.medicalHistory.historyOfStroke} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfStroke", value: v })} />
              <Checkbox label="Myocardial infarction or any arterial disease" checked={state.medicalHistory.severeArterialDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeArterialDisease", value: v })} />
              <Checkbox label="Liver dysfunction, active liver disease, or a liver tumour" checked={state.medicalHistory.liverDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "liverDisease", value: v })} />
              <Checkbox label="History of jaundice in pregnancy" checked={state.medicalHistory.jaundiceInPregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "jaundiceInPregnancy", value: v })} />
              <Checkbox label="Acute porphyria" checked={state.medicalHistory.porphyria} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "porphyria", value: v })} />
              <Checkbox label="Severe pruritus in a previous pregnancy" checked={state.medicalHistory.severePruritusInPregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severePruritusInPregnancy", value: v })} />
              <Checkbox label="Undiagnosed vaginal bleeding, bleeding between periods, or bleeding after sex" checked={state.medicalHistory.abnormalVaginalBleeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "abnormalVaginalBleeding", value: v })} description="Refer; this needs a diagnosis, not a delay." />
              <Checkbox label="Migraine with aura, or any migraine with focal neurological symptoms, current or past" checked={state.medicalHistory.migraineWithAura} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "migraineWithAura", value: v })} />
              <Checkbox label="Hypersensitivity to norethisterone or to any excipient in the product supplied" checked={state.medicalHistory.hypersensitivity} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypersensitivity", value: v })} />
              <Checkbox label="Diabetes with vascular complications" checked={state.medicalHistory.diabetesWithVascularComplications} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetesWithVascularComplications", value: v })} />
              <Checkbox label="Hypertension of any grade, treated or untreated, or a history of hypertension in pregnancy" checked={state.medicalHistory.hypertension} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypertension", value: v })} />
              <p className="text-sm text-navy-900">Blood pressure measured today. 140/90 or above excludes.</p>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="Systolic" value={state.medicalHistory.systolicBP} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "systolicBP", value: v })} min={60} max={250} unit="mmHg" required />
                <NumberInput label="Diastolic" value={state.medicalHistory.diastolicBP} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diastolicBP", value: v })} min={30} max={150} unit="mmHg" required />
              </div>
              <Checkbox label="Atrial fibrillation, or valvular or congenital heart disease" checked={state.medicalHistory.atrialFibrillationOrValvularDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "atrialFibrillationOrValvularDisease", value: v })} />
              <Checkbox label="Systemic lupus erythematosus, or antiphospholipid antibodies or antiphospholipid syndrome" checked={state.medicalHistory.sleOrAntiphospholipid} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "sleOrAntiphospholipid", value: v })} />
              <Checkbox label="Dyslipidaemia together with any other cardiovascular risk factor" checked={state.medicalHistory.dyslipidaemiaWithRiskFactor} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "dyslipidaemiaWithRiskFactor", value: v })} description="Obesity below the BMI threshold, diabetes, hypertension or family history (smoking is already excluded)." />
              <Checkbox label="Taking an enzyme inducing medicine" checked={state.medicalHistory.enzymeInducer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "enzymeInducer", value: v })} description="Rifampicin, rifabutin, carbamazepine, phenytoin, phenobarbital, primidone, topiramate, efavirenz, ritonavir, St John's wort. The delay is likely to fail." />
              <Checkbox label="Taking ciclosporin" checked={state.medicalHistory.ciclosporin} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ciclosporin", value: v })} />
              <Checkbox label="Taking lamotrigine as monotherapy" checked={state.medicalHistory.lamotrigineMonotherapy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "lamotrigineMonotherapy", value: v })} />
              <Checkbox label="Breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} description="Excluded. Norethisterone passes into breast milk." />
              <Checkbox label="Using hormonal contraception" checked={state.medicalHistory.hormonalContraception} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hormonalContraception", value: v })} description="Not eligible. Women on a monophasic combined pill should run packs back to back instead, which is safer and free. See Appendix 2." />
              {state.medicalHistory.hormonalContraception && (
                <TextInput label="Type of hormonal contraception" value={state.medicalHistory.hormonalContraceptionType} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hormonalContraceptionType", value: v })} placeholder="e.g., combined pill, POP, implant, patch" />
              )}
              <Checkbox label="Patient under 16 years" checked={state.medicalHistory.ageUnder16} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ageUnder16", value: v })} />
              <div className="border-t pt-4"><p className="text-sm font-semibold text-amber-700">Depression and mood</p></div>
              <p className="text-xs text-gray-600">A history of depression is NOT an exclusion. Tell every woman that mood change is a recognised effect, ask her to monitor her mood, and tell her to seek follow up if it deteriorates. Exclude only for current severe depression, active suicidal ideation, or any safeguarding concern; record the reason.</p>
              <Checkbox label="History of depression" checked={state.medicalHistory.historyOfDepression} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfDepression", value: v })} description="Say in plain terms: if your mood drops noticeably, stop taking it and speak to us or your GP." />
              <Checkbox label="Current severe depression, or active suicidal ideation" checked={state.medicalHistory.severeDepressionOrSuicidalIdeation} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeDepressionOrSuicidalIdeation", value: v })} description="Exclude and refer. Record the reason in the clinical notes." />
              {state.patient.age !== null && state.patient.age >= 16 && state.patient.age < 18 && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-2">
                  <p className="text-sm font-semibold text-amber-900">Patient is 16 or 17</p>
                  <p className="text-xs text-amber-800">Every supply to a patient under 18 requires a recorded competence assessment and a recorded consideration of safeguarding. Ask why the delay is wanted and who has suggested it. Where the request appears to come from someone other than the patient, or the reason given is inconsistent, do not supply. Consider whether the request may indicate coercion, exploitation, or an attempt to conceal something. Record the assessment, not just its conclusion.</p>
                  <Checkbox label="Competence assessed and satisfied, and reason for the request explored with the patient alone" checked={state.medicalHistory.under18AssessmentDone} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "under18AssessmentDone", value: v })} />
                  <TextArea label="Competence assessment and safeguarding consideration, in full" value={state.medicalHistory.under18AssessmentNotes} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "under18AssessmentNotes", value: v })} placeholder="Why the delay is wanted, who suggested it, understanding shown, consistency of the account, any concern considered and why it was or was not raised" />
                  <Checkbox label="Safeguarding concern (coercion, exploitation, inconsistent account)" checked={state.medicalHistory.safeguardingConcern} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "safeguardingConcern", value: v })} description="Tick to stop the consultation and follow the local safeguarding route the same day. Record what was done." />
                </div>
              )}
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications & Drug Interactions" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={!hasStops} validationError={hasStops ? "Exclusion present, cannot proceed. Give the alternatives in Appendix 2 and record the advice." : null} isBlocked={hasStops}>
            <div className="space-y-4 mb-4">
              <Checkbox label="Taking anticoagulants (warfarin, DOACs)" checked={state.medications.anticoagulants} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "anticoagulants", value: v })} />
              <Checkbox label="Taking antiepileptic medication" checked={state.medications.antiepileptics} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "antiepileptics", value: v })} description="Enzyme inducers and lamotrigine monotherapy are exclusions (Medical History step)" />
              <Checkbox label="Taking ciclosporin" checked={state.medications.ciclosporin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "ciclosporin", value: v })} description="Excluded under PGD v008" />
              <TextArea label="Other current medications" value={state.medications.otherMedications} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "otherMedications", value: v })} placeholder="List all current medications, including anything bought over the counter or online" />
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
                <p className="text-sm text-blue-800">Norethisterone 5mg tablets. One 5mg tablet three times daily, starting 3 days before the expected onset of menstruation. All three doses are taken every day of the course. MAXIMUM 14 DAYS and MAXIMUM 42 TABLETS under PGD v008. No extension. Supply only the number of days actually needed; do not round up to a pack.</p>
                <p className="text-xs text-blue-600 mt-2">A normal period should occur 2 to 3 days after the last tablet. Total norethisterone for period delay must not exceed 30 days in any 6 month period, and no patient may be supplied more than twice in 6 months.</p>
              </div>
              <NumberInput label="Number of days of treatment (from the start date to the last tablet, maximum 14)" value={state.medicineSelection.daysToDelay} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "daysToDelay", value: v })} min={1} max={MAX_TREATMENT_DAYS} unit="days" required />
              {state.medicineSelection.daysToDelay !== null && state.medicineSelection.daysToDelay > 0 && (
                <p className={`text-sm ${state.medicineSelection.daysToDelay > MAX_TREATMENT_DAYS ? "font-semibold text-red-700" : "text-gray-800"}`}>
                  Tablets to supply: <strong>{Math.min(state.medicineSelection.daysToDelay, MAX_TREATMENT_DAYS) * 3}</strong> x norethisterone 5mg{state.medicineSelection.daysToDelay > MAX_TREATMENT_DAYS ? " (exceeds the 14 day maximum)" : ""}
                </p>
              )}
              <TextInput label="Planned start date (3 days before expected period)" value={state.medicineSelection.startDate} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "startDate", value: v })} placeholder="DD/MM/YYYY" />
              <Checkbox label="I confirm this treatment is appropriate for this patient" checked={state.medicineSelection.confirmed} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "confirmed", value: v })} />
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Counselling & Patient Education" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError}>
            <div className="space-y-3">
              <Checkbox label="Take one tablet three times a day, every day, swallowed whole with some liquid, until you stop" checked={state.counselling.howToTake} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "howToTake", value: v })} required />
              <Checkbox label="Start 3 days before your period is due" checked={state.counselling.startThreeDaysBefore} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "startThreeDaysBefore", value: v })} required />
              <Checkbox label="Maximum duration is 14 days and maximum quantity is 42 tablets. There is no extension under this PGD." checked={state.counselling.maxDuration} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "maxDuration", value: v })} required />
              <Checkbox label="Your period will usually start 2 to 3 days after you take the last tablet" checked={state.counselling.periodReturnsAfter} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "periodReturnsAfter", value: v })} required />
              <Checkbox label="THIS IS NOT CONTRACEPTION. You can get pregnant while taking it. Use condoms or another method throughout and afterwards" checked={state.counselling.notContraceptive} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notContraceptive", value: v })} required description="Recorded: the patient was told norethisterone is not a contraceptive." />
              <Checkbox label="If your period does not come within a few days of finishing, do a pregnancy test. If it has not arrived within a week, do a test and see your GP" checked={state.counselling.pregnancyTestIfNoPeriod} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pregnancyTestIfNoPeriod", value: v })} required description="Recorded: the patient was told to test for pregnancy if her period does not arrive." />
              <Checkbox label="Move around and keep well hydrated, particularly on any journey where you are sitting for a long time" checked={state.counselling.mobilityAndHydration} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "mobilityAndHydration", value: v })} required />
              <Checkbox label="Some nausea, headache, breast tenderness, mood change or spotting is common and settles when you stop. Diabetes: monitor blood glucose more closely during the course" checked={state.counselling.sideEffects} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffects", value: v })} required />
              <Checkbox label="Mood change is a recognised effect: monitor your mood and seek follow up if it deteriorates. If your mood drops noticeably, stop taking it and speak to us or your GP" checked={state.counselling.moodMonitoring} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "moodMonitoring", value: v })} required description="Individualised counselling required by the PGD; record that you did." />
              <Checkbox label="Stop the tablets and get medical help the same day for: pain, swelling, redness or warmth in one leg; sudden chest pain, breathlessness or coughing up blood; a severe or unusual headache, a new migraine, or any change in vision or hearing; yellowing of the skin or eyes; weakness or numbness down one side, or difficulty speaking (call 999)" checked={state.counselling.seekHelpIfUnwell} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seekHelpIfUnwell", value: v })} required />
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

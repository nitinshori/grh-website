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
            <PatientDetailsStep patient={state.patient} onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })} requireAdult={false} />
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
                  {state.assessment.daysUntilExpected < 3 && (
                    <p className="mt-1 font-semibold text-red-700">
                      That start date has passed or is today. Starting late may not delay the period. Counsel the patient before supplying.
                    </p>
                  )}
                </div>
              )}
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
              <div className="mt-4 mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                <p className="text-sm font-semibold text-amber-900">Venous thromboembolism gate (PGD v002)</p>
                <p className="text-xs text-amber-800 mt-1">At 5mg three times daily a significant proportion of norethisterone is metabolised to ethinylestradiol, so the clot risk is closer to a combined pill than to a progestogen-only pill. Any single YES below excludes. These were cautions in v001.</p>
              </div>
              <Checkbox label="First degree relative with a blood clot before age 45, or a known clotting disorder" checked={state.medicalHistory.familyVteUnder45} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "familyVteUnder45", value: v })} />
              <Checkbox label="Current smoker" description="Under 35 this is UKMEC 2 and does not exclude on its own. At 35 or over it excludes." checked={state.medicalHistory.currentSmoker} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "currentSmoker", value: v })} />
              <Checkbox label="Stopped smoking less than a year ago" description="Asked separately: at 35 or over this is UKMEC 3 and excludes. A question that only asks whether she smokes misclassifies a recent quitter." checked={state.medicalHistory.stoppedSmokingUnderOneYear} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "stoppedSmokingUnderOneYear", value: v })} />
              <Checkbox label="Stopped smoking a year or more ago" description="At 35 or over this is UKMEC 2: a risk factor, not an exclusion." checked={state.medicalHistory.stoppedSmokingOverOneYear} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "stoppedSmokingOverOneYear", value: v })} />
              {state.medicalHistory.currentSmoker && (
                <TextInput label="Cigarettes per day" type="number" value={state.medicalHistory.cigarettesPerDay === null ? "" : String(state.medicalHistory.cigarettesPerDay)} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cigarettesPerDay", value: v === "" ? null : Number(v) })} placeholder="For the record: at 35+ both under and over 15 exclude" />
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Height (cm)" type="number" value={state.medicalHistory.heightCm === null ? "" : String(state.medicalHistory.heightCm)} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "heightCm", value: v === "" ? null : Number(v) })} placeholder="Measure or ask. Do not estimate." />
                <TextInput label="Weight (kg)" type="number" value={state.medicalHistory.weightKg === null ? "" : String(state.medicalHistory.weightKg)} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "weightKg", value: v === "" ? null : Number(v) })} placeholder="BMI 35+ excludes; 30 to 34.9 is a risk factor" />
              </div>
              <Checkbox label="Flight, coach, train or car journey of 4 hours or more, during the course or within 2 weeks after" checked={state.medicalHistory.longJourney} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "longJourney", value: v })} description="A UKMEC 2 risk factor, not an exclusion on its own. Two or more risk factors together exclude." />
              <Checkbox label="Surgery under general anaesthetic in the last 6 weeks, or planned" checked={state.medicalHistory.recentOrPlannedSurgery} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentOrPlannedSurgery", value: v })} />
              <Checkbox label="Current or expected immobility (leg in plaster, bed rest)" checked={state.medicalHistory.immobility} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immobility", value: v })} />
              <Checkbox label="Cancer now, or treated for cancer in the last 12 months" checked={state.medicalHistory.activeOrRecentCancer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activeOrRecentCancer", value: v })} />
              <Checkbox label="Migraine with aura, or migraine with focal neurological symptoms (current or past)" checked={state.medicalHistory.migraineWithAura} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "migraineWithAura", value: v })} />
              <Checkbox label="Taking an enzyme inducing medicine" checked={state.medicalHistory.enzymeInducer} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "enzymeInducer", value: v })} description="Rifampicin, rifabutin, carbamazepine, phenytoin, phenobarbital, primidone, topiramate, efavirenz, ritonavir, St John's wort. The delay is likely to fail." />
              {state.patient.age !== null && state.patient.age >= 16 && state.patient.age < 18 && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 space-y-2">
                  <p className="text-sm font-semibold text-amber-900">Patient is under 18</p>
                  <p className="text-xs text-amber-800">The age criterion was lowered from 18 to 16 without any competence or safeguarding content being added. Both are now required and recorded for every supply under 18. Ask why the delay is wanted and who suggested it.</p>
                  <Checkbox label="Competence assessed, and reason for the request explored with the patient alone" checked={state.medicalHistory.under18AssessmentDone} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "under18AssessmentDone", value: v })} />
                  <Checkbox label="Safeguarding concern (coercion, exploitation, inconsistent account)" checked={state.medicalHistory.safeguardingConcern} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "safeguardingConcern", value: v })} description="Tick to stop the consultation and follow the local safeguarding route today." />
                </div>
              )}
              <Checkbox label="History of pulmonary embolism (PE)" checked={state.medicalHistory.historyOfPE} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfPE", value: v })} />
              <Checkbox label="History of stroke or TIA" checked={state.medicalHistory.historyOfStroke} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "historyOfStroke", value: v })} />
              <Checkbox label="Severe arterial disease" checked={state.medicalHistory.severeArterialDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeArterialDisease", value: v })} />
              <Checkbox label="Active liver disease or liver tumours" checked={state.medicalHistory.liverDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "liverDisease", value: v })} />
              <Checkbox label="Acute porphyria" checked={state.medicalHistory.porphyria} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "porphyria", value: v })} />
              <Checkbox label="Undiagnosed abnormal vaginal bleeding" checked={state.medicalHistory.abnormalVaginalBleeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "abnormalVaginalBleeding", value: v })} />
              <Checkbox label="Patient under 16 years" checked={state.medicalHistory.ageUnder16} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ageUnder16", value: v })} />
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
                <p className="text-sm text-blue-800">Norethisterone 5mg, three times daily, starting 3 days before the expected period. MAXIMUM 14 DAYS and MAXIMUM 42 TABLETS under PGD v002. Supply only the days actually needed; do not round up to a pack.</p>
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
              <Checkbox label="Maximum duration is 14 days and maximum quantity is 42 tablets. There is no extension under this PGD." checked={state.counselling.maxDuration} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "maxDuration", value: v })} />
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

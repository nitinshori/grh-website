"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { SleepMelatoninConsultationState, SleepMelatoninAction } from "./lib/sleep-melatonin-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialSleepMelatoninState } from "./lib/sleep-melatonin-types";
import { getAllAlerts, hasHardStops, hasSecondaryCause, hasAssessmentStops, maxTabletsThisSupply, weeksTreated } from "./lib/sleep-melatonin-clinical-logic";
import { validateStep } from "./lib/sleep-melatonin-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { SleepMelatoninSummaryReport, SleepHygieneAppendix } from "./components/SleepMelatoninSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from "../shared/components/FormInputs";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: SleepMelatoninConsultationState, action: SleepMelatoninAction): SleepMelatoninConsultationState {
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
    case "UPDATE_SECONDARY_CAUSES":
      newState.secondaryCauses = { ...newState.secondaryCauses, [action.field]: action.value };
      break;
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      if (action.field !== "contraindicated") {
        newState.contraindications.contraindicated = hasHardStops(newState.contraindications);
      }
      break;
    case "UPDATE_PRESCRIPTION":
      newState.prescription = { ...newState.prescription, [action.field]: action.value };
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
    case "RESET":
      return createInitialSleepMelatoninState();
  }
  return newState;
}

export default function SleepMelatoninClient() {
  const [state, dispatch] = useReducer(reducer, createInitialSleepMelatoninState());
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

  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const alerts = useMemo(() => getAllAlerts(state.assessment, state.secondaryCauses, state.contraindications), [state.assessment, state.secondaryCauses, state.contraindications]);
  const secondaryBlocked = hasSecondaryCause(state.secondaryCauses) || state.assessment.durationOfInsomnia === "less4w" || hasAssessmentStops(state.assessment);
  // A stop anywhere blocks Next on every step, not only on the step it was
  // raised on (adversarial review, 11 Sep 2026).
  const isBlocked = hasHardStops(state.contraindications) || secondaryBlocked;

  const handleNext = useCallback(() => {
    if (state.currentStep === 2 && secondaryBlocked) {
      setValidationError("Cannot proceed: a secondary cause is apparent, the insomnia has lasted less than 4 weeks, or the treatment limit is reached. Refer, do not supply");
      return;
    }
    if (isBlocked) {
      setValidationError("Cannot proceed: patient meets exclusion criteria");
      return;
    }
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
    dispatch({ type: "SET_STEP", step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) });
  }, [state, isBlocked, secondaryBlocked]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, []);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      setValidationError(null);
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);

  const canProceed = validateStep(state.currentStep, state) === null && !isBlocked;

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
    setValidationError(null);
  }, []);

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step so an exclusion can be saved as "not
  // supplied" from the step it is raised on.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const supplied = !isBlocked && !!state.prescription.quantityTablets;
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
      clinicalData: { ...state, completedSteps: [...state.completedSteps], alerts, isBlocked } as unknown as Record<string, unknown>,
      outcome: isBlocked ? "not_supplied" : "completed",
      ...(supplied
        ? {
            medicine: {
              name: "Circadin 2mg prolonged-release tablets (melatonin)",
              dose: "2mg once daily, 1 to 2 hours before bedtime, after food, oral",
              duration: `${state.prescription.quantityTablets} days (maximum 13 weeks in total)`,
              quantity: state.prescription.quantityTablets ?? undefined,
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
  }, [state, isBlocked, alerts, __pharmProfile]);

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <div className="space-y-6">
        <ProgressBar
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <StepWrapper
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          title={STEP_LABELS[state.currentStep]}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={validateStep(6, state) === null && !isBlocked}
          validationError={validateStep(6, state)}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          <SleepMelatoninSummaryReport state={state} alerts={alerts} />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Appendix 1 prints on its own from any step, so an excluded patient
          still leaves with the written sleep hygiene advice. */}
      <div className="hidden print:block">
        <SleepHygieneAppendix patientName={`${state.patient.firstName} ${state.patient.lastName}`.trim()} />
      </div>
      <div className="print:hidden space-y-6">
      <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={isBlocked}
        getConsultationData={getConsultationData}
      >
        {state.currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
            requireAdult={false}
          />
        )}

        {state.currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
              <p className="font-semibold mb-1">Primary insomnia only</p>
              <p>
                Circadin is licensed for primary insomnia characterised by poor
                quality of sleep in patients aged 55 or over, and for nothing
                else. Insomnia is very often secondary. Take a proper history
                before supplying; if a cause is apparent, refer instead.
              </p>
            </div>
            <Checkbox
              label="Age 55 years or older, confirmed"
              checked={state.assessment.ageConfirmed}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "ageConfirmed", value: v })}
              description="Circadin is licensed only from 55 years. This PGD does not authorise supply below that age on any basis; a patient aged 18 to 54 who needs melatonin is a prescriber decision."
            />
            <Checkbox
              label="Sleep onset difficulty"
              checked={state.assessment.sleepOnsetIssue}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepOnsetIssue", value: v })}
              description="Difficulty falling asleep"
            />
            <Checkbox
              label="Sleep maintenance difficulty"
              checked={state.assessment.sleepMaintenanceIssue}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepMaintenanceIssue", value: v })}
              description="Frequent waking during night"
            />
            <SelectInput
              label="Duration of insomnia"
              value={state.assessment.durationOfInsomnia}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "durationOfInsomnia", value: v })}
              required
              options={[
                { value: "less4w", label: "Less than 4 weeks (excluded: sleep hygiene advice and review)" },
                { value: "4w-3m", label: "4 weeks to 3 months" },
                { value: "3-12m", label: "3 to 12 months" },
                { value: "over12m", label: "Over 12 months" },
              ]}
            />
            <Checkbox
              label="Poor quality of sleep is affecting daytime functioning"
              checked={state.assessment.daytimeFunctioningAffected}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "daytimeFunctioningAffected", value: v })}
              required
            />
            <TextInput
              label="How the insomnia affects daytime functioning"
              value={state.assessment.daytimeImpact}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "daytimeImpact", value: v })}
              placeholder="e.g. tired and irritable at work, poor concentration"
              required
            />

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-sm text-red-900">Secondary-cause history (each must be asked and recorded)</h4>
              <p className="text-xs text-red-800">Where any of these is present the insomnia is likely secondary. Treating it here masks the cause. Refer, do not supply.</p>
              <Checkbox
                label="Low mood, loss of interest, anxiety, or any current or suspected mental health condition"
                checked={state.secondaryCauses.lowMoodOrMentalHealth}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "lowMoodOrMentalHealth", value: v })}
                description="Early morning waking with low mood is depression until proved otherwise."
              />
              <Checkbox
                label="Snoring with daytime sleepiness, witnessed apnoeas, or morning headache"
                checked={state.secondaryCauses.snoringDaytimeSleepiness}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "snoringDaytimeSleepiness", value: v })}
                description="Suspect obstructive sleep apnoea and refer. The exclusion most often missed; carries cardiovascular and road-traffic risk."
              />
              <Checkbox
                label="Pain of any cause that wakes the patient or prevents sleep"
                checked={state.secondaryCauses.painDisturbingSleep}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "painDisturbingSleep", value: v })}
              />
              <Checkbox
                label="An urge to move the legs at night, or leg discomfort relieved by movement"
                checked={state.secondaryCauses.restlessLegs}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "restlessLegs", value: v })}
                description="Suspect restless legs syndrome."
              />
              <Checkbox
                label="Waking repeatedly to pass urine"
                checked={state.secondaryCauses.nocturia}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "nocturia", value: v })}
                description="Consider prostatic disease, diabetes or heart failure and refer."
              />
              <Checkbox
                label="Shift work, or a sleep pattern driven by work or travel rather than by an inability to sleep"
                checked={state.secondaryCauses.shiftWork}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "shiftWork", value: v })}
              />
              <Checkbox
                label="Alcohol used to get to sleep, or any pattern of harmful drinking"
                checked={state.secondaryCauses.alcoholToSleep}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "alcoholToSleep", value: v })}
                description="Alcohol also reduces the effectiveness of Circadin."
              />
              <Checkbox
                label="Caffeine late in the day, or a high total daily intake, not yet addressed"
                checked={state.secondaryCauses.caffeineNotAddressed}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "caffeineNotAddressed", value: v })}
              />
              <Checkbox
                label="A medicine that could be causing the insomnia (full medicine list reviewed)"
                checked={state.secondaryCauses.medicineCausingInsomnia}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "medicineCausingInsomnia", value: v })}
                description="For example a corticosteroid, a beta-agonist, an SSRI or SNRI, a stimulant, or a diuretic taken in the evening."
              />
              <Checkbox
                label="History taken covering mood, pain, snoring and daytime sleepiness, restless legs, nocturia, shift work, alcohol, caffeine and the full medicine list; no secondary cause apparent"
                checked={state.secondaryCauses.historyTaken}
                onChange={(v) => dispatch({ type: "UPDATE_SECONDARY_CAUSES", field: "historyTaken", value: v })}
                required
              />
            </div>

            <details className="p-4 bg-white border border-gray-200 rounded-lg">
              <summary className="text-sm font-semibold text-navy-900 cursor-pointer">Appendix 1: sleep hygiene advice (show, and print for the patient)</summary>
              <div className="mt-3">
                <SleepHygieneAppendix patientName={`${state.patient.firstName} ${state.patient.lastName}`.trim()} />
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold border border-[color:var(--tenant-primary)]/40 text-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/10"
                >
                  Print Appendix 1 for the patient
                </button>
              </div>
            </details>
            <Checkbox
              label="Sleep hygiene advice given (Appendix 1) and, where not already tried, a period of trying it agreed before or alongside supply"
              checked={state.assessment.sleepHygieneAdviceGiven}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepHygieneAdviceGiven", value: v })}
              required
              description="Give this whether or not you supply. It has the better long-term evidence."
            />
            <Checkbox
              label="Patient had already tried sleep hygiene measures"
              checked={state.assessment.sleepHygieneAttempted}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepHygieneAttempted", value: v })}
            />
            <TextInput
              label="What the patient had already tried"
              value={state.assessment.sleepHygieneTried}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "sleepHygieneTried", value: v })}
              placeholder="e.g. fixed wake time, no caffeine after midday, no screens in bed"
            />
            <Checkbox
              label="Previous Circadin supply"
              checked={state.assessment.previousCircadin}
              onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousCircadin", value: v })}
              description="A previous course under this PGD in the last 6 months, or 13 weeks already completed, is an exclusion (next step)."
            />
            {state.assessment.previousCircadin && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <TextInput
                  label="Total weeks of Circadin treatment to date"
                  value={state.assessment.weeksTreatedToDate}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "weeksTreatedToDate", value: v })}
                  placeholder="e.g. 6"
                  type="number"
                  required
                />
                <TextInput
                  label="Date of last Circadin supply"
                  value={state.assessment.lastSupplyDate}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "lastSupplyDate", value: v })}
                  type="date"
                  required
                />
                <SelectInput
                  label="Previous course"
                  value={state.assessment.previousCourseStatus}
                  onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "previousCourseStatus", value: v })}
                  options={[
                    { value: "continuing", label: "Continuing the current course (under 13 weeks)" },
                    { value: "completed", label: "Previous course completed or stopped" },
                  ]}
                  required
                />
                <p className="sm:col-span-3 text-xs text-gray-600">
                  Maximum 13 weeks in total: {weeksTreated(state.assessment) !== null ? `${maxTabletsThisSupply(state.assessment)} tablets may be supplied this time.` : "enter the weeks to see the cap for this supply."} A completed course within the last 6 months is an exclusion.
                </p>
              </div>
            )}
            {secondaryBlocked && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-semibold text-red-700">Refer, do not supply. Name the possible secondary cause and make the referral concrete. Give the sleep hygiene advice regardless. Document the advice given and the decision reached.</p></div>}
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-sm text-amber-900 mb-3">Exclusion criteria: refer, do not supply, where any applies</h4>
              <div className="space-y-3">
                <Checkbox
                  label="Known hypersensitivity to melatonin or to any excipient of Circadin"
                  checked={state.contraindications.hypersensitivity}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivity", value: v })}
                />
                <Checkbox
                  label="Hepatic impairment of any degree"
                  checked={state.contraindications.hepaticImpairment}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hepaticImpairment", value: v })}
                  description="Not recommended by the SPC: the liver is the primary site of melatonin metabolism."
                />
                <Checkbox
                  label="Autoimmune disease"
                  checked={state.contraindications.autoimmuneDiseaseActive}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "autoimmuneDiseaseActive", value: v })}
                  description="Not recommended by the SPC; no clinical data exist in this group."
                />
                <Checkbox
                  label="Pregnancy, or planning pregnancy"
                  checked={state.contraindications.pregnancy}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnancy", value: v })}
                  description="Not recommended by the SPC."
                />
                <Checkbox
                  label="Breastfeeding"
                  checked={state.contraindications.breastfeeding}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })}
                  description="Not recommended by the SPC."
                />
                <Checkbox
                  label="Taking fluvoxamine"
                  checked={state.contraindications.fluvoxamine}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "fluvoxamine", value: v })}
                  description="Avoid: fluvoxamine raises melatonin exposure roughly seventeen-fold."
                />
                <Checkbox
                  label="Currently taking a benzodiazepine, a Z-drug (zopiclone, zolpidem, zaleplon), or any other hypnotic, sedative or treatment for insomnia"
                  checked={state.contraindications.hypnoticOrSedative}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypnoticOrSedative", value: v })}
                  description="Circadin enhances their effect; co-dosing with zolpidem worsened attention, memory and co-ordination."
                />
                <Checkbox
                  label="Taking 5-methoxypsoralen or 8-methoxypsoralen"
                  checked={state.contraindications.methoxypsoralen}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "methoxypsoralen", value: v })}
                />
                <Checkbox
                  label="Rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption"
                  checked={state.contraindications.lactoseIntolerance}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "lactoseIntolerance", value: v })}
                  description="Circadin contains 80mg lactose per tablet."
                />
                <Checkbox
                  label="Renal impairment where the pharmacist is not satisfied it is mild and stable"
                  checked={state.contraindications.renalImpairmentNotMildStable}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "renalImpairmentNotMildStable", value: v })}
                />
                <Checkbox
                  label="A previous course of Circadin supplied under this PGD in the last 6 months, or 13 weeks of treatment already completed"
                  checked={state.contraindications.previousCourseWithin6Months}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "previousCourseWithin6Months", value: v })}
                  description="Refer for review rather than continuing."
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 mb-3">Cautions: counsel, and consider referral</h4>
              <div className="space-y-3">
                <Checkbox
                  label="Taking cimetidine, oestrogens (including combined contraceptives and HRT), or a quinolone antibiotic"
                  checked={state.contraindications.cyp1a2Inhibitor}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "cyp1a2Inhibitor", value: v })}
                  description="These raise melatonin levels. Counsel on increased drowsiness and consider referral instead."
                />
                <Checkbox
                  label="Taking carbamazepine or rifampicin, or smokes"
                  checked={state.contraindications.cyp1a2Inducer}
                  onChange={(v) => dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "cyp1a2Inducer", value: v })}
                  description="These lower melatonin levels and may make the treatment ineffective."
                />
              </div>
              <p className="text-xs text-blue-900 mt-3">Drowsiness and driving: Circadin has a moderate influence on the ability to drive and use machines. Alcohol should not be taken with Circadin. Take after food; swallow whole. Check the current SPC and BNF against the patient&apos;s full medicine list.</p>
            </div>
            {isBlocked && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-semibold text-red-700">Patient meets exclusion criteria. Cannot proceed with supply. Explain why, give the sleep hygiene advice regardless, document the advice given and the decision reached, and inform or refer to the GP as appropriate.</p></div>}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900">Supply details (PGD version 005, 11 September 2026)</h4>
              <Row label="Product" value={state.prescription.product} />
              <Row label="Legal category" value="POM" />
              <Row label="Dose" value={state.prescription.dose} />
              <Row label="Frequency" value={state.prescription.frequency} />
              <Row label="Route" value="Oral. Swallow whole with water. Do not crush, chew or halve." />
              <Row label="Quantity" value="Up to 21 tablets per supply, being three weeks" />
              <Row label="Maximum treatment" value={state.prescription.duration} />
              <Row label="Storage" value="Do not store above 25 degrees Celsius. Store in the original package to protect from light." />
            </div>
            <NumberInput
              label="Quantity supplied"
              value={state.prescription.quantityTablets}
              onChange={(v) => dispatch({ type: "UPDATE_PRESCRIPTION", field: "quantityTablets", value: v })}
              min={1}
              max={maxTabletsThisSupply(state.assessment)}
              placeholder={`up to ${maxTabletsThisSupply(state.assessment)}`}
              unit="tablets"
              required
            />
            <p className="text-xs text-gray-600">13 weeks is the licensed maximum duration and there is no extension under this PGD. A patient still not sleeping at 13 weeks needs review, not a repeat. No further supply under this PGD within 6 months of completing a course.</p>
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-4">
            <Checkbox
              label="One tablet a day, 1 to 2 hours before bed, after food; swallow whole, do not crush, chew or break"
              checked={state.counselling.takeAfterFoodSwallowWhole}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "takeAfterFoodSwallowWhole", value: v })}
              description="Food is what the licensed dosing is built around; crushing turns a night-long release into a single early peak."
            />
            <Checkbox
              label="Drowsiness and driving advised"
              checked={state.counselling.drowsinessDrivingAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "drowsinessDrivingAdvised", value: v })}
              description="Do not drive or use machinery if affected; take particular care the morning after the first few nights. Required record."
            />
            <Checkbox
              label="Alcohol advised"
              checked={state.counselling.alcoholAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "alcoholAdvised", value: v })}
              description="Do not drink alcohol with it; it makes the medicine work less well. Required record."
            />
            <Checkbox
              label="Not a sleeping tablet in the usual sense: works with the body clock and works gradually"
              checked={state.counselling.notASedativeExplained}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notASedativeExplained", value: v })}
              description="Expect an improvement in the quality of sleep rather than being knocked out."
            />
            <Checkbox
              label="Sleep hygiene reinforced: the measures matter more than the tablet over time, keep doing them"
              checked={state.counselling.sleepHygieneReinforcedFirstLine}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sleepHygieneReinforcedFirstLine", value: v })}
              description="Written sleep hygiene advice (Appendix 1) supplied with the patient information leaflet."
            />
            <Checkbox
              label="Avoid screens before bed; bed is for sleep"
              checked={state.counselling.avoidScreensAdvised}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidScreensAdvised", value: v })}
              description="No screens, no work, no television in bed; wind down for an hour before bed."
            />
            <Checkbox
              label="Short course, up to 13 weeks; not a long-term treatment"
              checked={state.counselling.shortCourse13Weeks}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "shortCourse13Weeks", value: v })}
              description="Return unused tablets to a pharmacy."
            />
            <Checkbox
              label="When to see the GP rather than continuing"
              checked={state.counselling.whenToSeekAdvice}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "whenToSeekAdvice", value: v })}
              description="Sleep not improved after 3 weeks; low mood or waking very early; told you snore heavily or stop breathing in your sleep, or sleepy in the day; rash, swelling of the face, lips or tongue, or any reaction (stop the tablets). Routine queries: contact the pharmacy."
            />
          </div>
        )}

        {state.currentStep === 6 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })}
              required
              placeholder="Jane Smith"
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })}
              required
              placeholder="123456"
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })}
              placeholder="Main Street Pharmacy"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })}
              placeholder="Additional information..."
              rows={4}
            />
          </div>
        )}
      </StepWrapper>
      </div>
    </div>
  );
}

interface Row {
  label: string;
  value: string;
}

function Row({ label, value }: Row) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-xs">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-navy-900">{value}</dd>
    </div>
  );
}

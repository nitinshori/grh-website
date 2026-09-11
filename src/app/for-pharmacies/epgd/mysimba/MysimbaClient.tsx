"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, NumberInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { calculateAge, validatePatientStep, validateConsentStep, validateSummaryStep } from "../shared/types"
import { PrintedRecord } from "./components/PrintedRecord"

// Aligned to: Mysimba (Naltrexone 8mg / Bupropion 90mg) prolonged-release
// tablets PGD, version 003, issued 11 September 2026.
const PGD_VERSION_LINE = "Mysimba PGD v003, issued 11 September 2026"
const PRODUCT_NAME = "Mysimba (naltrexone hydrochloride 8 mg / bupropion hydrochloride 90 mg) prolonged-release tablets"
const DOSE_STAGE_LABELS: Record<string, string> = {
  init: "Titration: week 1 one tablet morning; week 2 one morning and one evening; week 3 two morning and one evening; week 4 two twice daily",
  "1": "Week 2: one tablet morning and one tablet evening",
  "2": "Week 3: two tablets morning and one tablet evening",
  "3": "Week 4: two tablets morning and two tablets evening",
  "4": "Maintenance: two tablets morning and two tablets evening (4 tablets daily)",
}

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "BMI & Initial Assessment",
  "Eligibility (Exclusions/Cautions)",
  "Dose Plan & Supply",
  "Counselling & Follow-up",
  "Pharmacist Summary",
  "Consultation Complete",
]

const DOSE_TITRATION = [
  { week: "Week 1", morning: "1 tablet", evening: "none" },
  { week: "Week 2", morning: "1 tablet", evening: "1 tablet" },
  { week: "Week 3", morning: "2 tablets", evening: "1 tablet" },
  { week: "Week 4 onwards (maintenance)", morning: "2 tablets", evening: "2 tablets" },
]

// Document: maximum treatment period under this PGD is 16 weeks (the
// titration month and three maintenance months). Up to 120 tablets per supply.
const MAX_TREATMENT_WEEKS = 16
const MAX_TREATMENT_DAYS = MAX_TREATMENT_WEEKS * 7
const MAX_TABLETS_PER_SUPPLY = 120
const MAX_TABLETS_PER_DAY = 4

function daysBetween(fromIso: string, toIso: string): number | null {
  if (!fromIso || !toIso) return null
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

function weeksBetween(fromIso: string, toIso: string): number | null {
  const d = daysBetween(fromIso, toIso)
  return d === null ? null : Math.floor(d / 7)
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export function MysimbaClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false, notifyGp: false } as { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean; notifyGp?: boolean },
    // Inclusion: "Able to provide informed written consent"
    writtenConsentObtained: false,
    assessment: {
      heightCm: null as number | null,
      weightKg: null as number | null,
      bmi: null as number | null,
      hasComorbidity: false,
      comorbidityDetails: "",
      // Inclusion: documented failed weight loss attempt through lifestyle
      // intervention for at least 3 months.
      lifestyleAttemptDocumented: false,
      previousWeightLossAttempts: "",
      patientGoal: "",
      // Inclusion: resting blood pressure <140/90 mmHg. Caution: monitor heart rate.
      systolicBp: null as number | null,
      diastolicBp: null as number | null,
      pulse: null as number | null,
    },
    eligibility: {
      // Exclusions (document exclusion criteria)
      hypersensitivityNaltrexone: false,
      hypersensitivityBupropion: false,
      hypersensitivityExcipients: false,
      concomitantNaltrexone: false,
      concomitantBupropion: false,
      uncontrolledHypertension: false,
      cardiovascularDisease: false,
      seizureDisorder: false,
      cnsTumour: false,
      acuteAlcoholOrBenzodiazepineWithdrawal: false,
      bipolarHistory: false,
      currentDepressionOrSuicidality: false,
      bulimiaAnorexiaHistory: false,
      opioidUse: false,
      maoiUse: false,
      severeHepatic: false,
      endStageRenal: false,
      angleClosureGlaucoma: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      galactoseIntolerance: false,
      clinicallySignificantInteraction: false,
      // Follow-up screen at every supply (document follow-up row): the four
      // questions must be asked and the answers recorded; a "no" is only a
      // "no" once the pharmacist confirms the questions were put.
      followUpQuestionsAsked: false,
      reportsMoodChange: false,
      reportsSuicidalThoughts: false,
      reportsSeizure: false,
      reportsRaisedBpSymptoms: false,
      // Cautions: monitor closely
      ageUnder25: false,
      depressionHistory: false,
      brugadaSyndrome: false,
      brugadaFamilyHistory: false,
      hepaticImpairment: false,
      renalImpairment: false,
      hypertensionControlled: false,
      elderly: false,
      diabetes: false,
      seizureThresholdMedicines: false,
      interactingMedicines: false,
      glaucomaRisk: false,
      drivingMachinery: false,
      // Record: advice given if excluded or declines treatment
      exclusionAdvice: "",
    },
    treatment: {
      doseStage: "" as "" | "init" | "1" | "2" | "3" | "4",
      treatmentStartDate: "",
      initialWeightKg: null as number | null,
      quantityTablets: null as number | null,
      sixteenWeekReviewDate: "",
      productBatch: "",
      productExpiry: "",
    },
    counselling: {
      pilSupplied: false,
      adminText: false,
      tabletNotCrushedChewed: false,
      titrationScheduleExplained: false,
      persistenceAdvice: false,
      lifestyleAdvice: false,
      withFood: false,
      sideEffectsDiscussed: false,
      suicidalIdeationCounselled: false,
      bpMonitoringAdvice: false,
      hepatotoxicityWarning: false,
      drivingMachineryAdvice: false,
      noAlcoholAdvice: false,
      noAbruptStop: false,
      informProviders: false,
      allergyChestPainAdvice: false,
      sixteenWeekReviewExplained: false,
      contraceptionAdvice: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", adverseReactions: "" },
  })

  const pharmProfile = usePharmacistProfile()
  useEffect(() => {
    if (!pharmProfile) return
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, pharmacistName: pharmProfile.name, pharmacistGPhC: pharmProfile.gphcNumber, pharmacyName: pharmProfile.pharmacyName, pharmacyAddress: pharmProfile.pharmacyAddress },
    }))
  }, [pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC])

  const handleNext = useCallback(() => setCurrentStep((s) => Math.min(s + 1, STEP_TITLES.length - 1)), [])
  const handlePrev = useCallback(() => setCurrentStep((s) => Math.max(s - 1, 0)), [])

  function updateAssessment<K extends keyof typeof state.assessment>(field: K, value: typeof state.assessment[K]) {
    setState((prev) => {
      const ns = { ...prev, assessment: { ...prev.assessment, [field]: value } }
      if (field === "heightCm" || field === "weightKg") {
        const h = (field === "heightCm" ? value : ns.assessment.heightCm) as number | null
        const w = (field === "weightKg" ? value : ns.assessment.weightKg) as number | null
        if (h && w && h > 0) {
          ns.assessment.bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10
        }
      }
      return ns
    })
  }
  function updateEligibility<K extends keyof typeof state.eligibility>(field: K, value: typeof state.eligibility[K]) {
    setState((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } }))
  }
  function updateTreatment<K extends keyof typeof state.treatment>(field: K, value: typeof state.treatment[K]) {
    setState((prev) => ({ ...prev, treatment: { ...prev.treatment, [field]: value } }))
  }
  function updateCounselling<K extends keyof typeof state.counselling>(field: K, value: typeof state.counselling[K]) {
    setState((prev) => ({ ...prev, counselling: { ...prev.counselling, [field]: value } }))
  }

  // Step 0: inclusion "Age 18 years and over" (age is calculated from DOB below)
  const patientError = validatePatientStep(state.patient, { minAge: 18 })
  const ageUnder18 = state.patient.age !== null && state.patient.age < 18

  // Step 1: inclusion "Able to provide informed written consent"
  const consentError = validateConsentStep(state.consent) ?? (state.writtenConsentObtained ? null : "Written consent must be obtained and filed (inclusion criterion: able to provide informed written consent)")

  const bmi = state.assessment.bmi
  const bmiEligible = !!(bmi && (bmi >= 30 || (bmi >= 27 && state.assessment.hasComorbidity)))
  const bpEntered = state.assessment.systolicBp !== null && state.assessment.diastolicBp !== null
  // Inclusion: resting blood pressure <140/90 mmHg; if 140/90 or above refer to GP
  const bpAcceptable = bpEntered && (state.assessment.systolicBp as number) < 140 && (state.assessment.diastolicBp as number) < 90
  const assessmentError: string | null =
    !state.assessment.heightCm || !state.assessment.weightKg || !bmi ? "Height and weight are required"
    : !bmiEligible ? "BMI does not meet the inclusion criteria (30 or more, or 27 or more with a weight-related comorbidity)"
    : bmi < 30 && state.assessment.hasComorbidity && !state.assessment.comorbidityDetails.trim() ? "Name the weight-related comorbidity relied on for BMI 27 to 29.9"
    : !state.assessment.lifestyleAttemptDocumented ? "A documented failed weight loss attempt through lifestyle intervention for at least 3 months is an inclusion criterion"
    : !state.assessment.previousWeightLossAttempts.trim() ? "Record the details of the failed weight loss attempt (what was tried, for how long, and the outcome)"
    : !bpEntered ? "Resting blood pressure is required"
    : !bpAcceptable ? "Blood pressure is 140/90 mmHg or above: refer to the GP for management before initiating Mysimba"
    : state.assessment.pulse === null ? "Pulse (heart rate) is required"
    : null

  // Any exclusion = stop
  const e = state.eligibility
  const anyExclusion =
    ageUnder18 ||
    e.hypersensitivityNaltrexone || e.hypersensitivityBupropion || e.hypersensitivityExcipients ||
    e.concomitantNaltrexone || e.concomitantBupropion ||
    e.uncontrolledHypertension || e.cardiovascularDisease || e.seizureDisorder || e.cnsTumour ||
    e.acuteAlcoholOrBenzodiazepineWithdrawal || e.bipolarHistory || e.currentDepressionOrSuicidality ||
    e.bulimiaAnorexiaHistory || e.opioidUse || e.maoiUse ||
    e.severeHepatic || e.endStageRenal || e.angleClosureGlaucoma ||
    e.pregnant || e.breastfeeding || e.planningPregnancy ||
    e.galactoseIntolerance || e.clinicallySignificantInteraction ||
    e.reportsMoodChange || e.reportsSuicidalThoughts || e.reportsSeizure || e.reportsRaisedBpSymptoms
  const eligibilityError: string | null = anyExclusion
    ? "An exclusion criterion applies: do not supply under this PGD. Record the advice given and inform or refer to the GP."
    : !e.followUpQuestionsAsked
      ? "Confirm the patient has been asked at this supply about mood, suicidal thoughts, seizures and symptoms of raised blood pressure"
    : null

  const t = state.treatment
  const today = new Date().toISOString().split("T")[0]
  const daysSinceStart = daysBetween(t.treatmentStartDate, today)
  const weeksSinceStart = weeksBetween(t.treatmentStartDate, today)
  // The 16 week maximum applies to what is supplied, not just to today's
  // date: a supply may not run past day 112 of treatment. 4 tablets a day.
  const daysRemaining = daysSinceStart === null ? null : Math.max(0, MAX_TREATMENT_DAYS - daysSinceStart)
  const maxTabletsThisSupply = daysRemaining === null ? MAX_TABLETS_PER_SUPPLY : Math.min(MAX_TABLETS_PER_SUPPLY, daysRemaining * MAX_TABLETS_PER_DAY)
  // Expected stage from the start date: week 1 initiation, weeks 2 to 4
  // titration, week 4 onwards maintenance.
  const expectedStage: typeof t.doseStage =
    weeksSinceStart === null ? "" : weeksSinceStart <= 0 ? "init" : weeksSinceStart === 1 ? "1" : weeksSinceStart === 2 ? "2" : weeksSinceStart === 3 ? "3" : "4"
  const stageMismatch = !!t.doseStage && !!expectedStage && t.doseStage !== expectedStage && !(t.doseStage === "init" && weeksSinceStart !== null && weeksSinceStart <= 0)
  const expectedReviewDate = t.treatmentStartDate ? addDays(t.treatmentStartDate, MAX_TREATMENT_DAYS) : ""
  const reviewDateOff = !!t.sixteenWeekReviewDate && !!expectedReviewDate && Math.abs((daysBetween(expectedReviewDate, t.sixteenWeekReviewDate) ?? 0)) > 7
  const isMaintenanceStage = t.doseStage === "4"
  const currentWeight = state.assessment.weightKg
  const weightLossPercent =
    t.initialWeightKg && currentWeight && t.initialWeightKg > 0
      ? Math.round(((t.initialWeightKg - currentWeight) / t.initialWeightKg) * 1000) / 10
      : null
  const treatmentError: string | null =
    !t.doseStage ? "Select the dose stage for this consultation"
    : !t.treatmentStartDate ? "Treatment start date is required"
    : weeksSinceStart !== null && weeksSinceStart < 0 ? "Treatment start date cannot be in the future"
    : weeksSinceStart !== null && weeksSinceStart >= MAX_TREATMENT_WEEKS
      ? "Maximum treatment period under this PGD is 16 weeks. Weigh the patient and record the result; continuation beyond 16 weeks is by prescription from the GP or a specialist prescriber, not under this PGD."
    : stageMismatch
      ? `Dose stage does not match the treatment start date: week ${(weeksSinceStart ?? 0) + 1} of treatment expects "${expectedStage === "init" ? "Initiation" : expectedStage === "4" ? "Maintenance supply" : `Week ${Number(expectedStage) + 1}`}". Correct the stage or the start date.`
    : isMaintenanceStage && !t.initialWeightKg ? "Initial body weight (at the start of treatment) is required for maintenance supplies"
    : !t.quantityTablets || t.quantityTablets < 1 ? "Quantity supplied is required"
    : t.quantityTablets > MAX_TABLETS_PER_SUPPLY ? "Maximum quantity per supply under this PGD is 120 tablets"
    : t.quantityTablets > maxTabletsThisSupply
      ? `Only ${daysRemaining} day(s) of the 16 week maximum remain: supply no more than ${maxTabletsThisSupply} tablets so the course ends at 16 weeks`
    : !t.productBatch ? "Batch number is required"
    : !t.productExpiry ? "Expiry date is required"
    : t.productExpiry < today ? "Expiry date is in the past: do not supply this pack"
    : !t.sixteenWeekReviewDate ? "16-week review date is required"
    : reviewDateOff ? `16-week review date should be 16 weeks from the start date (${expectedReviewDate}, within 7 days)`
    : null

  const c = state.counselling
  const counsellingValid =
    c.pilSupplied &&
    c.adminText &&
    c.titrationScheduleExplained &&
    c.persistenceAdvice &&
    c.lifestyleAdvice &&
    c.withFood &&
    c.sideEffectsDiscussed &&
    c.suicidalIdeationCounselled &&
    c.bpMonitoringAdvice &&
    c.hepatotoxicityWarning &&
    c.noAlcoholAdvice &&
    c.noAbruptStop &&
    c.informProviders &&
    c.allergyChestPainAdvice &&
    c.sixteenWeekReviewExplained
  const counsellingError = counsellingValid ? null : "Tick every counselling item once discussed with the patient"

  const summaryError = validateSummaryStep(state.summary)

  // A stop anywhere blocks Next on that step and on every later step.
  const sixteenWeeksReached = weeksSinceStart !== null && weeksSinceStart >= MAX_TREATMENT_WEEKS
  const hasStop = anyExclusion || (!!bmi && !bmiEligible) || (bpEntered && !bpAcceptable) || sixteenWeeksReached
  const stopReason: string | null = anyExclusion
    ? (ageUnder18 ? "Patient is under 18" : "Exclusion criteria met")
    : !!bmi && !bmiEligible ? "BMI does not meet the inclusion criteria"
    : bpEntered && !bpAcceptable ? "Resting blood pressure 140/90 mmHg or above"
    : sixteenWeeksReached ? "16 week maximum treatment period reached"
    : null

  const stepErrors: (string | null)[] = [patientError, consentError, assessmentError, eligibilityError, treatmentError, counsellingError, summaryError, null]
  const validationError = stepErrors[currentStep] ?? (hasStop ? `${stopReason}: do not supply under this PGD.` : null)
  const canProceed = !validationError

  const getConsultationData = useCallback((): ConsultationRecordData | null => ({
    patient: {
      firstName: state.patient.firstName, lastName: state.patient.lastName,
      dateOfBirth: state.patient.dateOfBirth, nhsNumber: state.patient.nhsNumber,
      phone: state.patient.phone, email: state.patient.email, address: state.patient.address,
      gpName: state.patient.gpName, gpPractice: state.patient.gpPractice,
    },
    clinicalData: { ...state, pgdVersion: PGD_VERSION_LINE, product: `${PRODUCT_NAME}, oral`, stopReason, weightLossPercent, weeksSinceStart } as unknown as Record<string, unknown>,
    outcome: hasStop ? "not_supplied" : "completed",
    medicine: hasStop || !t.doseStage
      ? undefined
      : {
          name: PRODUCT_NAME,
          dose: DOSE_STAGE_LABELS[t.doseStage] ?? t.doseStage,
          duration: t.quantityTablets ? `${Math.ceil(t.quantityTablets / MAX_TABLETS_PER_DAY)} days` : undefined,
          quantity: t.quantityTablets ?? undefined,
        },
    summary: {
      pharmacistName: state.summary.pharmacistName, pharmacistGPhC: state.summary.pharmacistGPhC,
      pharmacyName: state.summary.pharmacyName, pharmacyAddress: state.summary.pharmacyAddress,
      consultationDate: state.summary.consultationDate, consultationTime: state.summary.consultationTime,
      clinicalNotes: state.summary.clinicalNotes,
    },
    consent: { notifyGp: state.consent.notifyGp },
  }), [state, hasStop, stopReason, weightLossPercent, weeksSinceStart, t])

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={STEP_TITLES.length} />
      <StepWrapper
        title={STEP_TITLES[currentStep]}
        currentStep={currentStep}
        totalSteps={STEP_TITLES.length}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        isBlocked={hasStop}
        validationError={validationError}
        getConsultationData={getConsultationData}
      >
        {hasStop && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-300 p-3 space-y-2 print:hidden">
            <p className="text-sm font-semibold text-red-900">{stopReason}: do not supply under this PGD.</p>
            <TextArea label="Advice given (excluded or declines treatment): alternative treatment options, decision reached, GP informed or referred" value={e.exclusionAdvice} onChange={(v) => updateEligibility("exclusionAdvice", v)} rows={3} required />
            <p className="text-xs text-red-800">Record the advice, then use &quot;Save as not supplied&quot; below. The document requires advice given to an excluded patient to be recorded.</p>
          </div>
        )}

        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState((prev) => {
              const patient = { ...prev.patient, [field]: value }
              if (field === "dateOfBirth") patient.age = calculateAge(value as string)
              return { ...prev, patient }
            })}
          />
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => setState((prev) => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
            />
            <Checkbox
              label="Written consent obtained and filed"
              checked={state.writtenConsentObtained}
              onChange={(v) => setState((prev) => ({ ...prev, writtenConsentObtained: v }))}
              required
              description="Inclusion criterion: able to provide informed written consent. Verbal consent alone does not satisfy this PGD."
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <p className="font-semibold mb-1">Initial assessment</p>
              <p>Discuss weight history, mental-health history, diet, exercise, expectations. Mysimba is an adjunct to a reduced-calorie diet and increased physical activity for weight management in adults with initial BMI 30 or more, or 27 or more with at least one weight-related comorbidity. Record weight, blood pressure and pulse at every consultation (follow-up: at 4 weeks, end of titration, and at 16 weeks).</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Height (cm)" value={state.assessment.heightCm} onChange={(v) => updateAssessment("heightCm", v)} min={120} max={220} unit="cm" required />
              <NumberInput label="Weight (kg)" value={state.assessment.weightKg} onChange={(v) => updateAssessment("weightKg", v)} min={40} max={250} unit="kg" required />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy-900">Calculated BMI</span>
                <span className="text-xl font-bold text-navy-900">{bmi ?? "-"} {bmi ? "kg/m²" : ""}</span>
              </div>
              {bmi !== null && (
                <p className="mt-1 text-xs text-gray-600">
                  Inclusion: BMI 30 or more, or 27 or more with at least one weight-related comorbidity.
                  {bmiEligible ? " Eligible." : " Not eligible."}
                </p>
              )}
            </div>

            <Checkbox label="Weight-related comorbidity present" checked={state.assessment.hasComorbidity} onChange={(v) => updateAssessment("hasComorbidity", v)} description="Such as type 2 diabetes, hypertension (controlled, below 140/90), dyslipidaemia or sleep apnoea." />
            {state.assessment.hasComorbidity && <TextInput label="Comorbidity details" value={state.assessment.comorbidityDetails} onChange={(v) => updateAssessment("comorbidityDetails", v)} />}

            <Checkbox label="Documented failed weight loss attempt through lifestyle intervention (reduced-calorie diet and physical activity) for at least 3 months" checked={state.assessment.lifestyleAttemptDocumented} onChange={(v) => updateAssessment("lifestyleAttemptDocumented", v)} description="Inclusion criterion. Record the details below." required />
            <TextArea label="Previous weight-loss attempts (what was tried, for how long, outcome)" value={state.assessment.previousWeightLossAttempts} onChange={(v) => updateAssessment("previousWeightLossAttempts", v)} rows={2} required />
            <TextArea label="Patient's goal and expectations" value={state.assessment.patientGoal} onChange={(v) => updateAssessment("patientGoal", v)} rows={2} />

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-navy-900">Resting blood pressure and pulse</p>
              <p className="text-xs text-gray-600">Inclusion: resting blood pressure below 140/90 mmHg. If 140/90 mmHg or above, refer to the GP for management before initiating Mysimba. Bupropion may elevate blood pressure and heart rate: monitor at least monthly initially and discontinue if sustained elevation occurs.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <NumberInput label="Systolic (mmHg)" value={state.assessment.systolicBp} onChange={(v) => updateAssessment("systolicBp", v)} min={60} max={260} unit="mmHg" required />
                <NumberInput label="Diastolic (mmHg)" value={state.assessment.diastolicBp} onChange={(v) => updateAssessment("diastolicBp", v)} min={30} max={160} unit="mmHg" required />
                <NumberInput label="Pulse (bpm)" value={state.assessment.pulse} onChange={(v) => updateAssessment("pulse", v)} min={30} max={220} unit="bpm" required />
              </div>
              {bpEntered && !bpAcceptable && (
                <p className="text-sm font-medium text-red-700">Blood pressure 140/90 mmHg or above: do not supply. Refer to the GP for management before initiating Mysimba.</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Exclusion criteria</p>
              <p>Any ticked item below blocks supply under this PGD. Advise on alternative treatment options and how these can be accessed, document the advice given and the decision reached, and inform or refer to the GP as appropriate.</p>
            </div>

            <p className="text-sm font-semibold text-navy-900">Demographics</p>
            {ageUnder18 && (
              <p className="text-sm font-medium text-red-700">Patient is under 18 (calculated from date of birth): excluded. Inclusion is age 18 years and over.</p>
            )}
            <p className="text-xs text-gray-600">Elderly patients are a caution under this PGD (tick below), not an exclusion.</p>

            <p className="text-sm font-semibold text-navy-900 mt-4">Hypersensitivity / concomitant therapy</p>
            <Checkbox label="Known hypersensitivity to naltrexone" checked={e.hypersensitivityNaltrexone} onChange={(v) => updateEligibility("hypersensitivityNaltrexone", v)} />
            <Checkbox label="Known hypersensitivity to bupropion" checked={e.hypersensitivityBupropion} onChange={(v) => updateEligibility("hypersensitivityBupropion", v)} />
            <Checkbox label="Known hypersensitivity to any excipient (including lactose)" checked={e.hypersensitivityExcipients} onChange={(v) => updateEligibility("hypersensitivityExcipients", v)} />
            <Checkbox label="Currently taking any other product containing naltrexone" checked={e.concomitantNaltrexone} onChange={(v) => updateEligibility("concomitantNaltrexone", v)} />
            <Checkbox label="Currently taking any other product containing bupropion (for example Zyban)" checked={e.concomitantBupropion} onChange={(v) => updateEligibility("concomitantBupropion", v)} />
            <Checkbox label="Use of a monoamine oxidase inhibitor (MAOI), or within 14 days of MAOI discontinuation" checked={e.maoiUse} onChange={(v) => updateEligibility("maoiUse", v)} />
            <Checkbox label="Current opioid use or opioid dependence, or within 7 to 10 days of opioid discontinuation" checked={e.opioidUse} onChange={(v) => updateEligibility("opioidUse", v)} description="Includes opioid analgesics and opioid replacement therapy." />
            <Checkbox label="Clinically significant drug interaction with current medication" checked={e.clinicallySignificantInteraction} onChange={(v) => updateEligibility("clinicallySignificantInteraction", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">CNS / seizure risk</p>
            <Checkbox label="Seizure disorder, history of seizures, or head trauma with loss of consciousness" checked={e.seizureDisorder} onChange={(v) => updateEligibility("seizureDisorder", v)} />
            <Checkbox label="CNS tumour or history of CNS tumour" checked={e.cnsTumour} onChange={(v) => updateEligibility("cnsTumour", v)} />
            <Checkbox label="Abrupt discontinuation of alcohol or benzodiazepines, alcohol withdrawal, or concurrent use of benzodiazepines" checked={e.acuteAlcoholOrBenzodiazepineWithdrawal} onChange={(v) => updateEligibility("acuteAlcoholOrBenzodiazepineWithdrawal", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Mental health / eating disorders</p>
            <Checkbox label="Any history of bipolar disorder" checked={e.bipolarHistory} onChange={(v) => updateEligibility("bipolarHistory", v)} />
            <Checkbox label="Current depression, suicidal ideation, or any history of suicide attempt" checked={e.currentDepressionOrSuicidality} onChange={(v) => updateEligibility("currentDepressionOrSuicidality", v)} />
            <Checkbox label="History of eating disorders (bulimia nervosa or anorexia nervosa)" checked={e.bulimiaAnorexiaHistory} onChange={(v) => updateEligibility("bulimiaAnorexiaHistory", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Cardiovascular, organ function and eyes</p>
            <Checkbox label="Uncontrolled hypertension (blood pressure 140/90 mmHg or above)" checked={e.uncontrolledHypertension} onChange={(v) => updateEligibility("uncontrolledHypertension", v)} description="Refer to the GP for management before initiating Mysimba." />
            <Checkbox label="History of significant cardiovascular disease" checked={e.cardiovascularDisease} onChange={(v) => updateEligibility("cardiovascularDisease", v)} />
            <Checkbox label="Severe hepatic impairment (Child-Pugh Class C)" checked={e.severeHepatic} onChange={(v) => updateEligibility("severeHepatic", v)} />
            <Checkbox label="End-stage renal failure (eGFR below 15 mL/min/1.73m²)" checked={e.endStageRenal} onChange={(v) => updateEligibility("endStageRenal", v)} />
            <Checkbox label="Angle-closure glaucoma" checked={e.angleClosureGlaucoma} onChange={(v) => updateEligibility("angleClosureGlaucoma", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Reproductive / metabolic</p>
            <Checkbox label="Currently pregnant" checked={e.pregnant} onChange={(v) => updateEligibility("pregnant", v)} />
            <Checkbox label="Breastfeeding" checked={e.breastfeeding} onChange={(v) => updateEligibility("breastfeeding", v)} />
            <Checkbox label="Planning pregnancy" checked={e.planningPregnancy} onChange={(v) => updateEligibility("planningPregnancy", v)} description="Females of childbearing potential should use effective contraception (inclusion criterion)." />
            <Checkbox label="Rare hereditary galactose intolerance / total lactase deficiency / glucose-galactose malabsorption" checked={e.galactoseIntolerance} onChange={(v) => updateEligibility("galactoseIntolerance", v)} description="Mysimba tablets contain lactose." />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Ask at every supply: stop and refer if any is present</p>
              <Checkbox label="Asked at this supply about mood, suicidal thoughts, seizures and symptoms of raised blood pressure" checked={e.followUpQuestionsAsked} onChange={(v) => updateEligibility("followUpQuestionsAsked", v)} required description="Document follow-up row: ask at every supply. The four items below only count as absent once this is ticked." />
              <p className="text-xs text-gray-600">Since starting Mysimba (or since the last supply) the patient reports:</p>
              <Checkbox label="Mood changes, depression, anxiety or unusual behaviour" checked={e.reportsMoodChange} onChange={(v) => updateEligibility("reportsMoodChange", v)} />
              <Checkbox label="Suicidal thoughts" checked={e.reportsSuicidalThoughts} onChange={(v) => updateEligibility("reportsSuicidalThoughts", v)} />
              <Checkbox label="A seizure" checked={e.reportsSeizure} onChange={(v) => updateEligibility("reportsSeizure", v)} />
              <Checkbox label="Symptoms of raised blood pressure (for example severe headache, chest pain, palpitations, visual disturbance)" checked={e.reportsRaisedBpSymptoms} onChange={(v) => updateEligibility("reportsRaisedBpSymptoms", v)} />
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions: proceed with extra counselling and monitoring</p>
              <Checkbox label="Age under 25 (higher monitoring threshold for mood changes)" checked={e.ageUnder25} onChange={(v) => updateEligibility("ageUnder25", v)} description="Patients/carers should monitor for and report worsening mood, suicidal thoughts, or unusual behaviour." />
              <Checkbox label="Past history of depression, now resolved (not current, no suicide attempt)" checked={e.depressionHistory} onChange={(v) => updateEligibility("depressionHistory", v)} description="Monitor for mood changes, depression, anxiety and suicidal thoughts, particularly in the first weeks of treatment and following any dose adjustment. Stop immediately if any new or worsening symptoms." />
              <Checkbox label="Elderly patient (including aged 75 and over)" checked={e.elderly} onChange={(v) => updateEligibility("elderly", v)} description="PGD caution: use with caution; dose adjustment may be necessary due to age-related changes in metabolism. The SmPC does not recommend use over 75: record the rationale in the clinical notes." />
              <Checkbox label="Known Brugada syndrome" checked={e.brugadaSyndrome} onChange={(v) => updateEligibility("brugadaSyndrome", v)} description="Bupropion may unmask Brugada syndrome, risk of cardiac arrest / sudden death." />
              <Checkbox label="Family history of cardiac arrest or sudden death" checked={e.brugadaFamilyHistory} onChange={(v) => updateEligibility("brugadaFamilyHistory", v)} description="Consider screening before initiation." />
              <Checkbox label="Mild to moderate hepatic impairment" checked={e.hepaticImpairment} onChange={(v) => updateEligibility("hepaticImpairment", v)} description="Use with caution in mild to moderate hepatic impairment; avoid in severe impairment. Dose adjustment may be required, see SmPC." />
              <Checkbox label="Moderate to severe renal impairment (not end-stage)" checked={e.renalImpairment} onChange={(v) => updateEligibility("renalImpairment", v)} description="Use with caution; dose adjustment may be required, see SmPC." />
              <Checkbox label="Controlled hypertension" checked={e.hypertensionControlled} onChange={(v) => updateEligibility("hypertensionControlled", v)} description="Monitor blood pressure regularly (at least monthly initially). Bupropion may elevate blood pressure; discontinue if sustained elevation occurs." />
              <Checkbox label="Diabetes" checked={e.diabetes} onChange={(v) => updateEligibility("diabetes", v)} description="May affect glucose control; monitor blood glucose closely and adjust antidiabetic medication if necessary." />
              <Checkbox label="Taking medicines that lower the seizure threshold, or other CNS condition" checked={e.seizureThresholdMedicines} onChange={(v) => updateEligibility("seizureThresholdMedicines", v)} description="Bupropion lowers the seizure threshold; avoid concurrent use of medications that lower the seizure threshold. Caution in patients with CNS conditions." />
              <Checkbox label="Taking medicines metabolised by CYP2D6, antidepressants, or other CNS-active drugs" checked={e.interactingMedicines} onChange={(v) => updateEligibility("interactingMedicines", v)} description="Potential for drug interactions; review all medications before initiating." />
              <Checkbox label="At risk of angle-closure glaucoma" checked={e.glaucomaRisk} onChange={(v) => updateEligibility("glaucomaRisk", v)} description="Bupropion may increase intraocular pressure." />
              <Checkbox label="Patient drives or operates hazardous machinery" checked={e.drivingMachinery} onChange={(v) => updateEligibility("drivingMachinery", v)} description="Counsel: Mysimba may cause dizziness/somnolence/loss of consciousness/seizure, caution required." />
            </div>

          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
              <p className="font-semibold mb-2">Mysimba tablets containing naltrexone hydrochloride 8mg and bupropion hydrochloride 90mg (prolonged-release). Oral. Titration over 4 weeks.</p>
              <table className="text-sm w-full">
                <thead className="text-xs">
                  <tr><th className="text-left pb-1">Week</th><th className="text-left pb-1">Morning</th><th className="text-left pb-1">Evening</th></tr>
                </thead>
                <tbody>
                  {DOSE_TITRATION.map((d) => (
                    <tr key={d.week}><td className="pr-3">{d.week}</td><td className="pr-3">{d.morning}</td><td>{d.evening}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs">Maximum 4 tablets per day (2 twice daily). After titration, maintain at 4 tablets daily unless dosage adjustment is required. Swallow tablets whole; do not crush, chew or divide. Can be taken with or without food (avoid high-fat meals). Store below 30°C in the original container.</p>
              <p className="mt-1 text-xs">Maximum treatment period under this PGD: 16 weeks (the titration month and three maintenance months). Continuation beyond 16 weeks is by prescription from the GP or a specialist prescriber.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose stage at this consultation <span className="text-red-400">*</span></label>
              <select value={t.doseStage} onChange={(ev) => updateTreatment("doseStage", ev.target.value as typeof state.treatment.doseStage)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">select</option>
                <option value="init">Initiation (titration month, weeks 1 to 4)</option>
                <option value="1">Week 2 (1 morning + 1 evening)</option>
                <option value="2">Week 3 (2 morning + 1 evening)</option>
                <option value="3">Week 4 (2 morning + 2 evening)</option>
                <option value="4">Maintenance supply (2 morning + 2 evening)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Treatment start date (first Mysimba supply) <span className="text-red-400">*</span></label>
                <input type="date" value={t.treatmentStartDate} onChange={(ev) => updateTreatment("treatmentStartDate", ev.target.value)} max={today} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                <p className="mt-1 text-xs text-gray-500">
                  {weeksSinceStart === null ? "Enter today's date for an initiation." : `Week ${weeksSinceStart + 1} of treatment (maximum 16 weeks under this PGD).`}
                </p>
              </div>
              <NumberInput label="Initial body weight at start of treatment (kg)" value={t.initialWeightKg} onChange={(v) => updateTreatment("initialWeightKg", v)} min={40} max={250} unit="kg" required={isMaintenanceStage} />
            </div>
            {weightLossPercent !== null && (
              <p className="text-xs text-gray-600">Weight change since start: {weightLossPercent}% of initial body weight lost. Review at 16 weeks: the pharmacist weighs the patient and records the result; discontinue if less than 5% of initial body weight has been lost.</p>
            )}
            {weeksSinceStart !== null && weeksSinceStart >= MAX_TREATMENT_WEEKS && (
              <p className="text-sm font-medium text-red-700">16 weeks reached: no further supply under this PGD. Weigh the patient and record the result. Continuation is by prescription from the GP or a specialist prescriber.</p>
            )}

            <div>
              <NumberInput label="Quantity supplied (tablets)" value={t.quantityTablets} onChange={(v) => updateTreatment("quantityTablets", v)} min={1} max={maxTabletsThisSupply} unit="tablets" required />
              {daysRemaining !== null && (
                <p className="mt-1 text-xs text-gray-700">{daysRemaining} day(s) of the 16 week maximum remain: maximum {maxTabletsThisSupply} tablets this supply.</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Up to 120 tablets (28-day supply at the full maintenance dose of 4 tablets daily). Titration month needs 70 tablets (7 + 14 + 21 + 28). Quantity may be adjusted to the patient's circumstances and remaining treatment duration. Supply 4 weeks at a time so the patient is seen at week 4 (end of titration) and at 16 weeks.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Batch number" value={t.productBatch} onChange={(v) => updateTreatment("productBatch", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Expiry date <span className="text-red-400">*</span></label>
                <input type="date" value={t.productExpiry} onChange={(ev) => updateTreatment("productExpiry", ev.target.value)} min={today} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">16-week review date (mandatory) <span className="text-red-400">*</span></label>
              <input type="date" value={t.sixteenWeekReviewDate} onChange={(ev) => updateTreatment("sixteenWeekReviewDate", ev.target.value)} min={today} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              {expectedReviewDate && <p className="mt-1 text-xs text-gray-700">16 weeks from the start date is {expectedReviewDate}.</p>}
              <p className="mt-1 text-xs text-gray-500">Follow-up: weight, blood pressure and pulse at 4 weeks (end of titration) and at 16 weeks. Discontinue if less than 5% of initial body weight has been lost at 16 weeks.</p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Tick each item once discussed with the patient.</p>
            <Checkbox label="Patient information leaflet (PIL) supplied, with written information on the dose titration schedule, lifestyle modifications (reduced-calorie diet and physical activity) and emergency contact details" checked={c.pilSupplied} onChange={(v) => updateCounselling("pilSupplied", v)} required />
            <Checkbox label="Method of administration: oral; swallow tablets whole with water; do not crush, chew or divide them" checked={c.adminText} onChange={(v) => updateCounselling("adminText", v)} required />
            <Checkbox label="Confirmed patient understands tablets must not be crushed, chewed or divided" checked={c.tabletNotCrushedChewed} onChange={(v) => updateCounselling("tabletNotCrushedChewed", v)} />
            <Checkbox label="Follow the dose titration schedule carefully over the first 4 weeks; do not increase the dose faster than prescribed" checked={c.titrationScheduleExplained} onChange={(v) => updateCounselling("titrationScheduleExplained", v)} required />
            <Checkbox label="Take the medication as prescribed even without immediate results; weight loss may take several weeks to become apparent" checked={c.persistenceAdvice} onChange={(v) => updateCounselling("persistenceAdvice", v)} required />
            <Checkbox label="Maintain a reduced-calorie diet and engage in regular physical activity as directed by the healthcare provider or dietitian" checked={c.lifestyleAdvice} onChange={(v) => updateCounselling("lifestyleAdvice", v)} required />
            <Checkbox label="Can be taken with or without food; avoid high-fat meals as they may affect absorption; take with water" checked={c.withFood} onChange={(v) => updateCounselling("withFood", v)} required />
            <Checkbox label="Side effects discussed: very common nausea, constipation, headache, insomnia; common vomiting, dry mouth, dizziness, anxiety, tremor, upper abdominal pain, tachycardia, hypertension, decreased appetite, rash, pruritus. If persistent insomnia, headache, nausea or constipation, discuss management options" checked={c.sideEffectsDiscussed} onChange={(v) => updateCounselling("sideEffectsDiscussed", v)} required />
            <Checkbox label="Report any mood changes, depression, anxiety, suicidal thoughts or unusual behaviour immediately to the healthcare provider or emergency services (patient and carer; particularly under 25s, in the first weeks and after any dose change)" checked={c.suicidalIdeationCounselled} onChange={(v) => updateCounselling("suicidalIdeationCounselled", v)} required />
            <Checkbox label="Monitor blood pressure regularly at home if possible; report any persistent elevation to the GP" checked={c.bpMonitoringAdvice} onChange={(v) => updateCounselling("bpMonitoringAdvice", v)} required />
            <Checkbox label="Hepatotoxicity warning: stop and seek medical advice if jaundice, dark urine, right upper abdominal pain or unusual fatigue (serious adverse effect: report immediately)" checked={c.hepatotoxicityWarning} onChange={(v) => updateCounselling("hepatotoxicityWarning", v)} required />
            <Checkbox label="Driving / hazardous machinery: caution, Mysimba may cause dizziness, somnolence, loss of consciousness or seizure" checked={c.drivingMachineryAdvice} onChange={(v) => updateCounselling("drivingMachineryAdvice", v)} />
            <Checkbox label="Do not consume excessive alcohol as it may increase the risk of seizures and adverse effects" checked={c.noAlcoholAdvice} onChange={(v) => updateCounselling("noAlcoholAdvice", v)} description="Alcohol lowers the seizure threshold; combined with bupropion the risk is increased." required />
            <Checkbox label="Do not stop the medication abruptly; discuss discontinuation with the healthcare provider" checked={c.noAbruptStop} onChange={(v) => updateCounselling("noAbruptStop", v)} required />
            <Checkbox label="Inform all healthcare providers (including dentists) that you are taking Mysimba, as it may interact with other medications" checked={c.informProviders} onChange={(v) => updateCounselling("informProviders", v)} required />
            <Checkbox label="Report any allergic reactions (rash, itching, swelling) or chest pain to the healthcare provider, or seek emergency care immediately" checked={c.allergyChestPainAdvice} onChange={(v) => updateCounselling("allergyChestPainAdvice", v)} required />
            <Checkbox label="Attend all follow-up appointments as scheduled (4 weeks and 16 weeks), particularly the 16-week review of weight loss and tolerability; treatment is discontinued if less than 5% of initial body weight has been lost, and continuation beyond 16 weeks is by GP or specialist prescription" checked={c.sixteenWeekReviewExplained} onChange={(v) => updateCounselling("sixteenWeekReviewExplained", v)} required />
            <Checkbox label="Female of childbearing potential: advised to use effective contraception; not to be used in pregnancy or breastfeeding" checked={c.contraceptionAdvice} onChange={(v) => updateCounselling("contraceptionAdvice", v)} description="Tick where applicable." />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} />
            <TextArea label="Details of any adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk, and inform the GP as appropriate)" value={state.summary.adverseReactions} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, adverseReactions: v } }))} rows={2} />
            <p className="text-xs text-gray-500">{PGD_VERSION_LINE}. Supplied: Mysimba (naltrexone hydrochloride 8mg / bupropion hydrochloride 90mg) prolonged-release tablets, oral, {t.quantityTablets ?? "-"} tablets.</p>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg print:hidden">
              <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
              <p className="text-sm text-green-800 mt-1">
                16-week review: {t.sixteenWeekReviewDate || "to be scheduled"}. Follow-up: weight, blood pressure and pulse at 4 weeks (end of titration) and at 16 weeks. Discontinue if less than 5% of initial body weight has been lost at 16 weeks; continuation beyond 16 weeks is by GP or specialist prescription. {PGD_VERSION_LINE}.
              </p>
            </div>
            <PrintedRecord
              title="Mysimba ePGD Consultation Record"
              pgdLine={PGD_VERSION_LINE}
              rows={[
                ["Patient", `${state.patient.firstName} ${state.patient.lastName}, born ${state.patient.dateOfBirth || "not recorded"}${state.patient.age !== null ? ` (${state.patient.age} years)` : ""}`],
                ["Address", state.patient.address || "Not recorded"],
                ["GP", [state.patient.gpName, state.patient.gpPractice].filter(Boolean).join(", ") || "Not recorded"],
                ["Consent", state.writtenConsentObtained ? "Valid informed written consent obtained and filed; private service explained" : "Not recorded"],
                ["Height, weight, BMI", `${state.assessment.heightCm ?? "-"} cm, ${state.assessment.weightKg ?? "-"} kg, BMI ${bmi ?? "-"}${t.initialWeightKg ? ` (initial weight ${t.initialWeightKg} kg${weightLossPercent !== null ? `, ${weightLossPercent}% lost` : ""})` : ""}`],
                ["Blood pressure, pulse", `${state.assessment.systolicBp ?? "-"}/${state.assessment.diastolicBp ?? "-"} mmHg, ${state.assessment.pulse ?? "-"} bpm`],
                ["Comorbidity", state.assessment.hasComorbidity ? (state.assessment.comorbidityDetails || "Yes") : "None recorded"],
                ["Follow-up questions", e.followUpQuestionsAsked ? "Asked at this supply: mood, suicidal thoughts, seizures, raised blood pressure symptoms; none reported" : "Not recorded"],
                ["Outcome", hasStop ? `NOT SUPPLIED: ${stopReason}` : "Supplied via PGD"],
                ["Medicine", hasStop ? "Not supplied" : `${PRODUCT_NAME}, oral`],
                ["Dose", hasStop ? "Not supplied" : (DOSE_STAGE_LABELS[t.doseStage] ?? "Not recorded")],
                ["Quantity", hasStop ? "Not supplied" : `${t.quantityTablets ?? "-"} tablets`],
                ["Batch and expiry", hasStop ? "Not applicable" : `${t.productBatch || "-"}, ${t.productExpiry || "-"}`],
                ["Treatment start, review", `${t.treatmentStartDate || "-"}${weeksSinceStart !== null ? ` (week ${weeksSinceStart + 1})` : ""}; 16 week review ${t.sixteenWeekReviewDate || "-"}`],
                ["Advice given", hasStop ? (e.exclusionAdvice || "Not recorded") : "PIL and written titration, lifestyle and emergency contact information supplied; administration, titration, persistence, lifestyle, food, side effects, mood and suicidal ideation, blood pressure, hepatotoxicity, alcohol, no abrupt stop, inform providers, allergy and chest pain, 16 week review"],
                ["Adverse drug reactions", state.summary.adverseReactions || "None recorded"],
                ["Clinical notes", state.summary.clinicalNotes || "None"],
                ["Practitioner", `${state.summary.pharmacistName || "-"}, GPhC ${state.summary.pharmacistGPhC || "-"}${state.summary.pharmacyName ? `, ${state.summary.pharmacyName}` : ""}`],
                ["Date and time", `${state.summary.consultationDate} ${state.summary.consultationTime}`],
              ]}
            />
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

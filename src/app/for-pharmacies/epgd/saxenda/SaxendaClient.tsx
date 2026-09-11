"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, NumberInput, SelectInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { usePreviousWeightConsultation, describePrevious } from "../shared/hooks/usePreviousWeightConsultation"
import { calculateAge, validatePatientStep, validateConsentStep, validateSummaryStep } from "../shared/types"
import { PrintedRecord } from "./components/PrintedRecord"

// Saxenda PGD v004, issued 11 September 2026. Adults 18 years and over; aged 75 or over excludes.
const PGD_MIN_AGE = 18
const PGD_MAX_AGE = 74
const PGD_VERSION_LINE = "Saxenda PGD v004, issued 11 September 2026"
const PRODUCT_NAME = "Saxenda (liraglutide 6 mg/ml) solution for injection in pre-filled pen"

// Document: review at 12 weeks on the maintenance dose (3.0 mg daily);
// discontinue if less than 5% body weight loss has been achieved.
const MAINTENANCE_REVIEW_WEEKS = 12
const MIN_WEIGHT_LOSS_PERCENT = 5

function daysBetween(fromIso: string, toIso: string): number | null {
  if (!fromIso || !toIso) return null
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

const DOSE_STAGE_LABELS: Record<string, string> = {
  init: "0.6 mg once daily (week 1, initiation)",
  "1": "1.2 mg once daily (week 2)",
  "2": "1.8 mg once daily (week 3)",
  "3": "2.4 mg once daily (week 4)",
  "4": "3.0 mg once daily (week 5, first maintenance supply)",
  "5": "3.0 mg once daily (maintenance continuation, already on 3.0 mg)",
}

// Exclusion checkboxes on the eligibility step, in the order they are shown.
// Kept as data so the stop reason and the saved record can name the
// exclusion(s) ticked rather than saying only "exclusion criteria met".
type ExclusionKey =
  | "hypersensitivity" | "mtcHistory" | "men2" | "pregnant" | "breastfeeding"
  | "planningPregnancyWithin2Months" | "severeHeartFailure" | "severeHepatic" | "severeRenal"
  | "pancreatitisHistory" | "acuteIllness" | "severeGiDisease" | "type1Diabetes"
  | "diabeticRetinopathy" | "eatingDisorder" | "concurrentGlp1" | "otherWeightManagementMedicine"
  | "secondaryObesity"
const EXCLUSION_ITEMS: { key: ExclusionKey; label: string; description?: string }[] = [
  { key: "hypersensitivity", label: "Known hypersensitivity to liraglutide or any component of the product" },
  { key: "mtcHistory", label: "Personal or family history of medullary thyroid carcinoma (MTC)" },
  { key: "men2", label: "Personal or family history of Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)" },
  { key: "pregnant", label: "Pregnant" },
  { key: "breastfeeding", label: "Breastfeeding" },
  { key: "planningPregnancyWithin2Months", label: "Planning pregnancy in the next 2 months (effective contraception required; discontinue at least 2 months before planned conception)" },
  { key: "severeHeartFailure", label: "Severe heart failure (NYHA class IV)" },
  { key: "severeHepatic", label: "Severe hepatic impairment (Child-Pugh score C or equivalent)" },
  { key: "severeRenal", label: "Severe renal impairment (eGFR below 30 mL/min/1.73m²)" },
  { key: "pancreatitisHistory", label: "History of pancreatitis (acute or chronic)", description: "PGD excludes: any pancreatitis while taking a GLP-1 receptor agonist; acute pancreatitis within 3 months; chronic pancreatitis with ongoing risk factors. This tool excludes any pancreatitis history." },
  { key: "acuteIllness", label: "Acute illness or recent surgery" },
  { key: "severeGiDisease", label: "Inflammatory bowel disease, or gastroparesis (use not recommended, SmPC)", description: "Includes diabetic gastroparesis. Other gastrointestinal disorders are a caution (below)." },
  { key: "type1Diabetes", label: "Type 1 diabetes, or insulin-treated diabetes. Refer." },
  { key: "diabeticRetinopathy", label: "Diabetic retinopathy requiring treatment", description: "Rapid weight loss may transiently worsen retinopathy." },
  { key: "eatingDisorder", label: "Current or previous eating disorder", description: "e.g. anorexia nervosa, bulimia, binge-eating disorder, at any time." },
  { key: "concurrentGlp1", label: "Concurrent use of another GLP-1 receptor agonist", description: "Includes semaglutide, tirzepatide, dulaglutide, exenatide and orforglipron for any indication. Sulfonylureas are a caution (below), not an exclusion." },
  { key: "otherWeightManagementMedicine", label: "Any other weight-management medicine, current: tirzepatide, semaglutide, orlistat or naltrexone/bupropion" },
  { key: "secondaryObesity", label: "Obesity secondary to an endocrine disorder, or to a medicine that causes weight gain" },
]

// Counselling items, in the order shown. Required items are named in the
// validation message so the pharmacist knows which tick is missing.
type CounsellingKey =
  | "pilSupplied" | "injectionTechnique" | "siteRotation" | "storageInstructions" | "missedDoseProtocol"
  | "dietExercise" | "sideEffectsDiscussed" | "pancreatitisWarning" | "dehydrationWarning"
  | "hypoglycaemiaWarning" | "thyroidMoodWarning" | "contraception" | "twelveWeekReviewExplained" | "doNotShare"
const COUNSELLING_ITEMS: { key: CounsellingKey; label: string; short: string; required: boolean; description?: string }[] = [
  { key: "pilSupplied", label: "Patient information leaflet (PIL) provided with Saxenda supplied", short: "PIL supplied", required: true, description: "Ensure the patient understands the injection technique, storage requirements, and when to seek medical advice." },
  { key: "injectionTechnique", label: "Injection technique demonstrated and patient confident with the pen (correct subcutaneous technique)", short: "injection technique", required: true },
  { key: "siteRotation", label: "Rotate injection sites to avoid lipohypertrophy; dispose of used needles safely in a sharps container", short: "site rotation and sharps", required: true },
  { key: "storageInstructions", label: "Storage: before first use store at 2 to 8°C in a refrigerator; after first use store below 30°C for up to 30 days; do not freeze; protect from light; do not use if discoloured or contains particles", short: "storage", required: true },
  { key: "missedDoseProtocol", label: "Missed dose: take when remembered if within 12 hours; otherwise skip and continue next day (optional)", short: "missed dose", required: false },
  { key: "dietExercise", label: "Take the injection at the same time each day for consistency; continue with a reduced-calorie diet and increase physical activity as advised (Saxenda is an adjunct, not a replacement)", short: "diet and activity", required: true },
  { key: "sideEffectsDiscussed", label: "Expect initial GI side effects (nausea, vomiting, diarrhoea, constipation) which typically improve over the first few weeks; take with food if nausea is problematic", short: "GI side effects", required: true },
  { key: "pancreatitisWarning", label: "Report persistent or severe abdominal pain immediately, as this may indicate pancreatitis", short: "pancreatitis warning", required: true },
  { key: "dehydrationWarning", label: "Stay well-hydrated; dehydration counselling on GI side effects", short: "hydration", required: true },
  { key: "hypoglycaemiaWarning", label: "Hypoglycaemia signs (shakiness, sweating, confusion, rapid heartbeat): inform GP or healthcare provider, particularly if taking insulin or sulfonylureas, as dose adjustment may be needed", short: "hypoglycaemia", required: true },
  { key: "thyroidMoodWarning", label: "Inform healthcare provider of symptoms of thyroiditis (neck pain, swelling, difficulty swallowing) or depression/mood changes", short: "thyroiditis and mood", required: true },
  { key: "contraception", label: "Contraception advice given (optional: only if applicable to this patient)", short: "contraception", required: false },
  { key: "twelveWeekReviewExplained", label: "Attend all review appointments: weight loss monitored at 12 weeks on the 3.0 mg maintenance dose; treatment discontinued if less than 5% body weight loss achieved; if continued, review at least every 6 months", short: "12 week review", required: true },
  { key: "doNotShare", label: "Do not share the medication with others; Saxenda is supplied specifically for this patient based on their medical history and BMI", short: "do not share", required: true },
]

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "BMI & Initial Assessment",
  "Eligibility (Exclusions/Cautions)",
  "Dose Plan & Administration",
  "Counselling & Follow-up",
  "Pharmacist Summary",
  "Consultation Complete",
]

const DOSE_TITRATION = [
  { week: "Week 1", dose: "0.6 mg" },
  { week: "Week 2", dose: "1.2 mg" },
  { week: "Week 3", dose: "1.8 mg" },
  { week: "Week 4", dose: "2.4 mg" },
  { week: "Week 5+ (maintenance)", dose: "3.0 mg" },
]

export function SaxendaClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false, notifyGp: false } as { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean; notifyGp?: boolean },
    assessment: {
      heightCm: null as number | null,
      weightKg: null as number | null,
      bmi: null as number | null,
      // "" not yet answered; only "no" (with BMI 27 to 29.9) stops. An
      // unticked box never stops (stop audit, 11 Sep 2026).
      hasComorbidity: "" as "" | "yes" | "no",
      comorbidityDetails: "",
      lifestyleCommitment: false,
      previousWeightLossAttempts: "",
      patientGoal: "",
      // Continuing patient: the document's indication is "initial BMI", so
      // the threshold is applied to the weight at initiation, not to the
      // weight of a patient who has since lost weight on treatment.
      continuingTreatment: false,
      treatmentStartDate: "",
      initialWeightKg: null as number | null,
    },
    eligibility: {
      // Exclusions per Saxenda PGD v004 (11 September 2026)
      ageUnder18: false,
      ageOver75: false,
      hypersensitivity: false,
      mtcHistory: false,
      men2: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancyWithin2Months: false,
      severeHeartFailure: false,
      severeHepatic: false,
      severeRenal: false,
      pancreatitisHistory: false,
      acuteIllness: false,
      severeGiDisease: false,
      type1Diabetes: false,
      diabeticRetinopathy: false,
      eatingDisorder: false,
      concurrentGlp1: false,
      otherWeightManagementMedicine: false,
      secondaryObesity: false,
      // Record: advice given if excluded or declines treatment (document
      // records row and actions-if-excluded row)
      exclusionAdvice: "",
      // Cautions
      // Document: sulfonylureas are a caution (hypoglycaemia risk; inform
      // the prescriber), not an exclusion.
      sulfonylurea: false,
      sulfonylureaPrescriberInformed: false,
      mildModerateRenal: false,
      mildModerateHepatic: false,
      otherGiDisorder: false,
      thyroidDisease: false,
      depressionHistory: false,
      significantDehydration: false,
      gastricMotilityMedicine: false,
      oralContraceptive: false,
      narrowTherapeuticIndexDrug: false,
      gallbladderDisease: false,
    },
    treatment: {
      doseStage: "" as "" | "init" | "1" | "2" | "3" | "4" | "5",
      // Date the 3.0 mg maintenance dose was reached: the 12 week review
      // clock runs from here (document: review at 12 weeks on the
      // maintenance dose).
      maintenanceStartDate: "",
      injectionSite: "" as "" | "abdomen" | "thigh" | "upper-arm",
      injectionTime: "",
      batchNumber: "",
      expiryDate: "",
      pensSupplied: "" as "" | "1" | "2" | "3" | "4" | "5",
      supplyDays: "" as "" | "28" | "30",
      nextReviewDate: "",
    },
    counselling: {
      pilSupplied: false,
      injectionTechnique: false,
      siteRotation: false,
      storageInstructions: false,
      missedDoseProtocol: false,
      dietExercise: false,
      sideEffectsDiscussed: false,
      pancreatitisWarning: false,
      dehydrationWarning: false,
      hypoglycaemiaWarning: false,
      thyroidMoodWarning: false,
      contraception: false,
      twelveWeekReviewExplained: false,
      doNotShare: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", adverseReactions: "" },
  })

  const pharmProfile = usePharmacistProfile()
  const { previous, lookup: lookupPrevious } = usePreviousWeightConsultation()
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
      // Recalculate BMI if height/weight changes
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

  // Step 0 and 1: patient details (age 18 to 74 from date of birth) and informed consent
  const patientError = validatePatientStep(state.patient, { minAge: PGD_MIN_AGE, maxAge: PGD_MAX_AGE })
  const consentError = validateConsentStep(state.consent)

  // Assessment valid: initial BMI 30 or above, or 27 or above with a
  // comorbidity, and patient willing to undertake lifestyle modifications.
  // The document's indication is "initial BMI": for a continuing patient the
  // threshold is applied to the weight at initiation, so a patient who has
  // lost weight on treatment is not refused the supply the PGD wants them
  // to keep having.
  const a = state.assessment
  const bmi = a.bmi
  const today = new Date().toISOString().split("T")[0]
  const initialBmi =
    a.continuingTreatment && a.initialWeightKg && a.heightCm
      ? Math.round((a.initialWeightKg / Math.pow(a.heightCm / 100, 2)) * 10) / 10
      : null
  const bmiForEligibility = a.continuingTreatment ? initialBmi : bmi
  const bmiEligible = !!(bmiForEligibility && (bmiForEligibility >= 30 || (bmiForEligibility >= 27 && a.hasComorbidity === "yes")))
  // BMI 27 to 29.9 with the comorbidity question not yet answered: not a
  // stop, a validation message that names the question (stop audit, 11 Sep
  // 2026). The stop fires only on the answer "No".
  const bmiNeedsComorbidity = bmiForEligibility !== null && bmiForEligibility >= 27 && bmiForEligibility < 30 && a.hasComorbidity === ""
  const bmiIneligible = bmiForEligibility !== null && !bmiEligible && !bmiNeedsComorbidity
  const bmiLabel = a.continuingTreatment ? "Initial BMI" : "BMI"
  const bmiStopReason = bmiForEligibility !== null && bmiForEligibility >= 27
    ? `${bmiLabel} ${bmiForEligibility} is between 27 and 29.9 and the patient has no weight-related comorbidity, so does not meet the inclusion criteria (BMI 30 or above, or 27 or above with a weight-related comorbidity)`
    : `${bmiLabel} ${bmiForEligibility ?? "-"} is below 27 and does not meet the inclusion criteria (BMI 30 or above, or 27 or above with a weight-related comorbidity)`
  const comorbidityDetailsMissing = !!bmiForEligibility && bmiForEligibility < 30 && a.hasComorbidity === "yes" && !a.comorbidityDetails.trim()
  const daysSinceStart = a.continuingTreatment ? daysBetween(a.treatmentStartDate, today) : null
  const assessmentError: string | null =
    !bmi || !a.heightCm || !a.weightKg ? "Height (cm) and Weight today (kg) are required"
    : a.continuingTreatment && !a.treatmentStartDate ? "Treatment start date (first Saxenda supply) is required for a continuing patient"
    : a.continuingTreatment && daysSinceStart !== null && daysSinceStart < 0 ? "Treatment start date cannot be in the future"
    : a.continuingTreatment && !a.initialWeightKg ? "Initial body weight at start of treatment (kg) is required for a continuing patient"
    : bmiNeedsComorbidity ? "Answer \"Does the patient have a weight-related comorbidity?\" (Yes or No): eligibility at BMI 27 to 29.9 depends on it"
    : !bmiEligible
      ? `${bmiStopReason}. This PGD cannot proceed.`
    : comorbidityDetailsMissing ? "Comorbidity details: name the weight-related comorbidity relied on for BMI 27 to 29.9"
    : !a.lifestyleCommitment ? "Tick \"Patient is willing and motivated to undertake lifestyle modifications\" (inclusion criterion)"
    : null

  // Age from date of birth: under 18, or 75 years or over, excludes regardless of the manual tick
  const computedAge = state.patient.age
  const ageExcluded = computedAge !== null && (computedAge < PGD_MIN_AGE || computedAge > PGD_MAX_AGE)

  // Eligibility valid: no exclusions ticked. The ticked exclusions are named
  // in the stop reason and the saved record.
  const tickedExclusions: string[] = [
    ...(state.eligibility.ageUnder18 || state.eligibility.ageOver75 ? ["Aged under 18, or aged 75 years or over"] : []),
    ...EXCLUSION_ITEMS.filter((item) => state.eligibility[item.key]).map((item) => item.label),
  ]
  const anyExclusion = ageExcluded || tickedExclusions.length > 0
  const exclusionSummary = tickedExclusions.length > 0
    ? `Exclusion ticked: ${tickedExclusions.join("; ")}`
    : "Exclusion criteria met"
  const eligibilityError: string | null = anyExclusion
    ? `${exclusionSummary}: this PGD cannot proceed. Advise on alternative treatment options, document the advice given and the decision reached, and inform or refer to the GP as appropriate.`
    : state.eligibility.sulfonylurea && !state.eligibility.sulfonylureaPrescriberInformed
      ? "Sulfonylurea is a caution under this PGD (hypoglycaemia risk): tick \"Prescriber informed of the Saxenda supply\" once the prescriber has been informed"
      : null

  // Treatment: only the document's regimens. Stage must match the
  // assessment (initiation vs continuing), a maintenance refill needs the
  // date the 3.0 mg dose was reached, and at 12 weeks on maintenance the
  // supply stops unless at least 5% of initial body weight has been lost.
  const t = state.treatment
  const isMaintenance = t.doseStage === "4" || t.doseStage === "5"
  const weeksOnMaintenance = t.doseStage === "5" && t.maintenanceStartDate
    ? (() => { const d = daysBetween(t.maintenanceStartDate, today); return d === null ? null : Math.floor(d / 7) })()
    : null
  const weightLossPercent =
    a.continuingTreatment && a.initialWeightKg && a.weightKg && a.initialWeightKg > 0
      ? Math.round(((a.initialWeightKg - a.weightKg) / a.initialWeightKg) * 1000) / 10
      : null
  // Fires only on a recorded weight loss below 5%. A missing initial weight
  // is held by the assessment step validator, never a stop (stop audit,
  // 11 Sep 2026).
  const maintenanceReviewFailed =
    t.doseStage === "5" &&
    weeksOnMaintenance !== null &&
    weeksOnMaintenance >= MAINTENANCE_REVIEW_WEEKS &&
    weightLossPercent !== null &&
    weightLossPercent < MIN_WEIGHT_LOSS_PERCENT
  const expiryInPast = !!t.expiryDate && t.expiryDate < today
  const nextReviewInPast = !!t.nextReviewDate && t.nextReviewDate < today
  const treatmentError: string | null =
    !t.doseStage ? "Dose stage at this consultation: select the stage"
    : t.doseStage === "init" && a.continuingTreatment ? "Initiation selected for a patient recorded as continuing treatment: go back and untick \"Continuing treatment\" on the assessment step, or select the matching stage"
    : t.doseStage !== "init" && !a.continuingTreatment ? "A titration or maintenance stage needs the treatment start date and initial weight: go back to the assessment step and tick \"Continuing treatment\""
    : t.doseStage === "5" && !t.maintenanceStartDate ? "Date the 3.0 mg maintenance dose was reached is required for a maintenance continuation"
    : t.doseStage === "5" && t.maintenanceStartDate < a.treatmentStartDate ? "Date the 3.0 mg maintenance dose was reached cannot be before the treatment start date"
    : t.doseStage === "5" && weeksOnMaintenance !== null && weeksOnMaintenance >= MAINTENANCE_REVIEW_WEEKS && weightLossPercent === null
      ? "12 weeks on the maintenance dose reached: go back to the assessment step and enter the Initial body weight at start of treatment (kg) so the 5% weight loss can be calculated"
    : maintenanceReviewFailed
      ? `12 weeks on the maintenance dose reached with ${weightLossPercent === null ? "no" : `${weightLossPercent}%`} body weight loss (less than ${MIN_WEIGHT_LOSS_PERCENT}%): discontinue under this PGD. Record the advice given and inform or refer to the GP.`
    : !t.injectionSite ? "Preferred injection site: select the site"
    : !t.batchNumber ? "Pen batch number is required"
    : !t.expiryDate ? "Pen expiry date is required"
    : expiryInPast ? "Pen expiry date is in the past: do not supply this pen"
    : !t.pensSupplied ? "Number of pre-filled pens supplied: select the number"
    : nextReviewInPast ? "Next review date cannot be in the past"
    : null

  // Every item in the document's follow-up advice row is required; the
  // missed dose and contraception items are optional and say so.
  const c = state.counselling
  const missingCounselling = COUNSELLING_ITEMS.filter((item) => item.required && !c[item.key])
  const counsellingValid = missingCounselling.length === 0
  const counsellingError = counsellingValid
    ? null
    : `Counselling item not ticked: ${missingCounselling.map((item) => item.short).join("; ")}. Tick each once discussed with the patient.`

  const summaryError = validateSummaryStep(state.summary)

  // A stop anywhere blocks Next on that step and on every later step.
  const hasStop = ageExcluded || bmiIneligible || anyExclusion || maintenanceReviewFailed
  const stopReason: string | null = ageExcluded
    ? `Calculated age ${computedAge} years is outside this PGD (18 to 74 years)`
    : anyExclusion ? exclusionSummary
    : bmiIneligible ? bmiStopReason
    : maintenanceReviewFailed ? "Less than 5% body weight loss at 12 weeks on the maintenance dose"
    : null

  const stepErrors: (string | null)[] = [
    patientError,
    consentError,
    assessmentError,
    eligibilityError,
    treatmentError,
    counsellingError,
    summaryError,
    null,
  ]
  const ownError = stepErrors[currentStep]
  const validationError = ownError ?? (hasStop ? `${stopReason}: this PGD cannot proceed.` : null)
  const canProceed = validationError === null

  const getConsultationData = useCallback((): ConsultationRecordData | null => ({
    patient: {
      firstName: state.patient.firstName, lastName: state.patient.lastName,
      dateOfBirth: state.patient.dateOfBirth, nhsNumber: state.patient.nhsNumber,
      phone: state.patient.phone, email: state.patient.email, address: state.patient.address,
      gpName: state.patient.gpName, gpPractice: state.patient.gpPractice,
    },
    clinicalData: { ...state, pgdVersion: PGD_VERSION_LINE, product: PRODUCT_NAME, stopReason, weightLossPercent, weeksOnMaintenance } as unknown as Record<string, unknown>,
    outcome: hasStop ? "not_supplied" : "completed",
    medicine: hasStop || !state.treatment.doseStage
      ? undefined
      : {
          name: PRODUCT_NAME,
          dose: DOSE_STAGE_LABELS[state.treatment.doseStage] ?? state.treatment.doseStage,
          duration: state.treatment.supplyDays ? `${state.treatment.supplyDays} days` : undefined,
          quantity: state.treatment.pensSupplied ? `${state.treatment.pensSupplied} pre-filled pen(s)` : undefined,
        },
    summary: {
      pharmacistName: state.summary.pharmacistName, pharmacistGPhC: state.summary.pharmacistGPhC,
      pharmacyName: state.summary.pharmacyName, pharmacyAddress: state.summary.pharmacyAddress,
      consultationDate: state.summary.consultationDate, consultationTime: state.summary.consultationTime,
      clinicalNotes: state.summary.clinicalNotes,
    },
    consent: { notifyGp: state.consent.notifyGp },
  }), [state, hasStop, stopReason, weightLossPercent, weeksOnMaintenance])

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
        validationError={validationError}
        isBlocked={hasStop}
        getConsultationData={getConsultationData}
      >
        {hasStop && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-300 p-3 space-y-2 print:hidden">
            <p className="text-sm font-semibold text-red-900">{stopReason}: do not supply under this PGD.</p>
            <TextArea
              label="Advice given (excluded or declines treatment): alternative treatment options, decision reached, GP informed or referred"
              value={state.eligibility.exclusionAdvice}
              onChange={(v) => updateEligibility("exclusionAdvice", v)}
              rows={3}
              required
            />
            <p className="text-xs text-red-800">Record the advice, then use &quot;Save as not supplied&quot; below. The document requires advice given to an excluded patient to be recorded.</p>
          </div>
        )}

        {currentStep === 0 && (
          <div className="space-y-4">
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => setState((prev) => {
                const patient = { ...prev.patient, [field]: value }
                if (field === "dateOfBirth") patient.age = calculateAge(value as string)
                return { ...prev, patient }
              })}
              onReturningPatient={(p) =>
                lookupPrevious(p, (prev) => {
                  setState((s) => ({
                    ...s,
                    assessment: {
                      ...s.assessment,
                      heightCm: prev.heightCm ?? s.assessment.heightCm,
                      initialWeightKg: prev.baselineWeightKg ?? s.assessment.initialWeightKg,
                      continuingTreatment: prev.pgdSlug === "saxenda" ? true : s.assessment.continuingTreatment,
                    },
                  }))
                })
              }
            />
            {previous && (
              <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-sm">
                <p className="font-semibold text-amber-900">This patient already has a weight management record</p>
                <p className="mt-1 text-amber-900">
                  Last seen {previous.consultationDate}{previous.pgdSlug ? ` (${previous.pgdSlug})` : ""}: {describePrevious(previous)}.
                  Height{previous.baselineWeightKg !== null ? " and initial weight have" : " has"} been carried forward; confirm them on the assessment step.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) => setState((prev) => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <p className="font-semibold mb-1">Initial assessment</p>
              <p>Discuss causes of weight gain, lifestyle, diet, exercise, previous weight-loss attempts, expectations, comorbidities, mental health. Saxenda is an adjunct to a reduced-calorie diet and increased physical activity, NOT a stand-alone solution. Set realistic target weight. Obesity secondary to an endocrine disorder, or to a medicine that causes weight gain, excludes (next step).</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Height (cm)" value={state.assessment.heightCm} onChange={(v) => updateAssessment("heightCm", v)} min={120} max={220} unit="cm" required />
              <NumberInput label="Weight today (kg)" value={state.assessment.weightKg} onChange={(v) => updateAssessment("weightKg", v)} min={40} max={250} unit="kg" required />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
              <Checkbox
                label="Continuing treatment: this patient has already started Saxenda (titration or maintenance supply)"
                checked={state.assessment.continuingTreatment}
                onChange={(v) => updateAssessment("continuingTreatment", v)}
                description="The PGD's indication is initial BMI. For a continuing patient the threshold is applied to the weight at the start of treatment, and the 12 week maintenance review needs the initial weight."
              />
              {state.assessment.continuingTreatment && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Treatment start date (first Saxenda supply) <span className="text-red-400">*</span></label>
                    <input type="date" value={state.assessment.treatmentStartDate} onChange={(e) => updateAssessment("treatmentStartDate", e.target.value)} max={today} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                  </div>
                  <NumberInput label="Initial body weight at start of treatment (kg)" value={state.assessment.initialWeightKg} onChange={(v) => updateAssessment("initialWeightKg", v)} min={40} max={250} unit="kg" required />
                </div>
              )}
              {weightLossPercent !== null && (
                <p className="text-xs text-gray-600">Weight change since start: {weightLossPercent}% of initial body weight lost{initialBmi !== null ? ` (initial BMI ${initialBmi})` : ""}. Review at 12 weeks on the 3.0 mg maintenance dose: discontinue if less than 5%.</p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy-900">{state.assessment.continuingTreatment ? "BMI today (initial BMI applies)" : "Calculated BMI"}</span>
                <span className="text-xl font-bold text-navy-900">{bmi ?? "-"} {bmi ? "kg/m²" : ""}</span>
              </div>
              {bmiForEligibility !== null && (
                <p className="mt-1 text-xs text-gray-600">
                  Eligibility ({state.assessment.continuingTreatment ? `initial BMI ${bmiForEligibility}` : `BMI ${bmiForEligibility}`}): BMI 30 or above, OR 27 or above with at least one weight-related comorbidity
                  {bmiEligible ? ": ELIGIBLE" : bmiNeedsComorbidity ? ": answer the comorbidity question below" : ": NOT ELIGIBLE under this PGD"}.
                </p>
              )}
            </div>

            <SelectInput
              label="Does the patient have a weight-related comorbidity? (e.g. dysglycaemia (pre-diabetes / T2DM), hypertension, dyslipidaemia, obstructive sleep apnoea)"
              value={state.assessment.hasComorbidity}
              onChange={(v) => updateAssessment("hasComorbidity", v as "" | "yes" | "no")}
              options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
              required={!!bmiForEligibility && bmiForEligibility >= 27 && bmiForEligibility < 30}
            />
            {state.assessment.hasComorbidity === "yes" && <TextInput label="Comorbidity details" value={state.assessment.comorbidityDetails} onChange={(v) => updateAssessment("comorbidityDetails", v)} placeholder="e.g. hypertension, OSA" required={!!bmiForEligibility && bmiForEligibility < 30} />}

            <Checkbox label="Patient is willing and motivated to undertake lifestyle modifications (reduced-calorie diet and increased physical activity)" checked={state.assessment.lifestyleCommitment} onChange={(v) => updateAssessment("lifestyleCommitment", v)} required description="Inclusion criterion. Saxenda is an adjunct to lifestyle modification; do not supply without this commitment." />

            <TextArea label="Previous weight-loss attempts" value={state.assessment.previousWeightLossAttempts} onChange={(v) => updateAssessment("previousWeightLossAttempts", v)} rows={2} placeholder="e.g. NHS weight-loss programme 2024; lost 4 kg but regained." />
            <TextArea label="Patient's goal and expectations" value={state.assessment.patientGoal} onChange={(v) => updateAssessment("patientGoal", v)} rows={2} placeholder="Target weight, what success looks like." />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              <p className="font-semibold">Exclusion criteria: tick any that apply</p>
              <p>A ticked exclusion stops the supply; leaving every box unticked records that none applies. Where one applies, advise on alternative treatment options and how these can be accessed, document the advice given and the decision reached, and inform or refer to the GP as appropriate.</p>
            </div>
            {ageExcluded && (
              <div className="rounded-lg bg-red-100 border border-red-300 p-3 text-sm text-red-900">
                Calculated age {computedAge} years is outside this PGD (18 years and over; aged 75 years or over excludes, use not recommended, SmPC). This PGD cannot proceed.
              </div>
            )}
            <Checkbox label="Aged under 18, or aged 75 years or over" checked={state.eligibility.ageUnder18 || state.eligibility.ageOver75} onChange={(v) => { updateEligibility("ageUnder18", v); updateEligibility("ageOver75", v); }} description="Inclusion: age 18 years and over. Exclusion: aged 75 years or over (use not recommended, SmPC). Refer outside this range." />
            {EXCLUSION_ITEMS.map((item) => (
              <Checkbox key={item.key} label={item.label} checked={state.eligibility[item.key]} onChange={(v) => updateEligibility(item.key, v)} description={item.description} />
            ))}

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions (continue with extra counselling)</p>
              <Checkbox label="Taking a sulfonylurea (for example gliclazide)" checked={state.eligibility.sulfonylurea} onChange={(v) => updateEligibility("sulfonylurea", v)} description="PGD caution: hypoglycaemia risk; inform the prescriber. Insulin-treated diabetes excludes (above)." />
              {state.eligibility.sulfonylurea && (
                <div className="ml-7">
                  <Checkbox label="Prescriber informed of the Saxenda supply (sulfonylurea dose review)" checked={state.eligibility.sulfonylureaPrescriberInformed} onChange={(v) => updateEligibility("sulfonylureaPrescriberInformed", v)} required />
                </div>
              )}
              <Checkbox label="Mild to moderate renal impairment (eGFR 30 to 60 mL/min/1.73m²)" checked={state.eligibility.mildModerateRenal} onChange={(v) => updateEligibility("mildModerateRenal", v)} description="Counsel on hydration; monitor for dehydration on GI side effects." />
              <Checkbox label="Mild to moderate hepatic impairment" checked={state.eligibility.mildModerateHepatic} onChange={(v) => updateEligibility("mildModerateHepatic", v)} />
              <Checkbox label="Other gastrointestinal disorders" checked={state.eligibility.otherGiDisorder} onChange={(v) => updateEligibility("otherGiDisorder", v)} description="Diabetic gastroparesis and inflammatory bowel disease exclude (above)." />
              <Checkbox label="Thyroid disease (monitor thyroid function if symptoms develop)" checked={state.eligibility.thyroidDisease} onChange={(v) => updateEligibility("thyroidDisease", v)} />
              <Checkbox label="History of depression or suicidal ideation (monitor mental health)" checked={state.eligibility.depressionHistory} onChange={(v) => updateEligibility("depressionHistory", v)} description="Counsel patient/carer to monitor mood; report any worsening." />
              <Checkbox label="Significant dehydration" checked={state.eligibility.significantDehydration} onChange={(v) => updateEligibility("significantDehydration", v)} description="Acute illness excludes (above). Counsel on hydration, particularly with GI side effects." />
              <Checkbox label="Concurrent use of medications affecting gastric motility" checked={state.eligibility.gastricMotilityMedicine} onChange={(v) => updateEligibility("gastricMotilityMedicine", v)} description="Liraglutide delays gastric emptying; review the combination and counsel." />
              <Checkbox label="On combined oral contraceptive" checked={state.eligibility.oralContraceptive} onChange={(v) => updateEligibility("oralContraceptive", v)} description="GLP-1s delay gastric emptying and may reduce oral contraceptive absorption. Switch to non-oral or add barrier method for 4 weeks at initiation and after each dose increase." />
              <Checkbox label="On narrow-therapeutic-index oral medication (e.g. warfarin, levothyroxine)" checked={state.eligibility.narrowTherapeuticIndexDrug} onChange={(v) => updateEligibility("narrowTherapeuticIndexDrug", v)} description="Delayed gastric emptying may alter absorption. Closer monitoring of INR / TFTs etc." />
              <Checkbox label="History of gallbladder disease" checked={state.eligibility.gallbladderDisease} onChange={(v) => updateEligibility("gallbladderDisease", v)} description="Counsel on RUQ pain, jaundice, fever; refer urgently if suspected." />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
              <p className="font-semibold mb-2">Dose titration schedule</p>
              <table className="text-sm w-full">
                <thead className="text-xs">
                  <tr><th className="text-left pb-1">Week</th><th className="text-left pb-1">Dose</th></tr>
                </thead>
                <tbody>
                  {DOSE_TITRATION.map((d) => (
                    <tr key={d.week}><td className="pr-4">{d.week}</td><td>{d.dose}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs">Saxenda (Liraglutide 6mg/ml) solution for injection in pre-filled pen. Subcutaneous injection once daily. If dose escalation is not tolerated, consider delaying by approximately one week before continuing titration. Maintenance dose: 3.0 mg once daily by subcutaneous injection.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose stage at this consultation <span className="text-red-400">*</span></label>
              <select value={state.treatment.doseStage} onChange={(e) => updateTreatment("doseStage", e.target.value as typeof state.treatment.doseStage)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">Select</option>
                <option value="init">Initiation (Week 1: 0.6 mg once daily)</option>
                <option value="1">Week 2: 1.2 mg once daily</option>
                <option value="2">Week 3: 1.8 mg once daily</option>
                <option value="3">Week 4: 2.4 mg once daily</option>
                <option value="4">Week 5: first 3.0 mg maintenance supply</option>
                <option value="5">Maintenance continuation: patient already on 3.0 mg once daily</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {state.assessment.continuingTreatment
                  ? `Continuing patient: treatment started ${state.assessment.treatmentStartDate || "(date not recorded)"}${daysSinceStart !== null ? `, week ${Math.floor(daysSinceStart / 7) + 1} of treatment` : ""}. Choose "first 3.0 mg maintenance supply" only for the patient's first pen at 3.0 mg; every later 3.0 mg supply is a "maintenance continuation" and needs the date the 3.0 mg dose was reached, so the 12 week review can be applied.`
                  : "New patient: select Initiation. Tick \"Continuing treatment\" on the assessment step for any later stage."}
              </p>
            </div>

            {isMaintenance && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-navy-900">Maintenance review (document: review at 12 weeks on 3.0 mg; discontinue if less than 5% body weight loss)</p>
                {t.doseStage === "5" && (
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Date the 3.0 mg maintenance dose was reached <span className="text-red-400">*</span></label>
                    <input type="date" value={t.maintenanceStartDate} onChange={(e) => updateTreatment("maintenanceStartDate", e.target.value)} min={state.assessment.treatmentStartDate || undefined} max={today} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  {weeksOnMaintenance !== null ? `Week ${weeksOnMaintenance + 1} on the maintenance dose. ` : ""}
                  {weightLossPercent !== null ? `Weight loss since start: ${weightLossPercent}% of initial body weight.` : "Initial weight and today's weight are needed to calculate the percentage lost."}
                </p>
                {maintenanceReviewFailed && (
                  <p className="text-sm font-medium text-red-700">12 weeks on the maintenance dose reached and less than 5% body weight lost: discontinue. No further supply under this PGD; record the advice given and inform or refer to the GP.</p>
                )}
                {t.doseStage === "5" && weeksOnMaintenance !== null && weeksOnMaintenance >= MAINTENANCE_REVIEW_WEEKS && !maintenanceReviewFailed && (
                  <p className="text-xs text-green-800">At least 5% lost at the 12 week review: treatment may continue, with review at least every 6 months.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Preferred injection site <span className="text-red-400">*</span></label>
              <select value={state.treatment.injectionSite} onChange={(e) => updateTreatment("injectionSite", e.target.value as typeof state.treatment.injectionSite)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">Select</option>
                <option value="abdomen">Abdomen</option>
                <option value="thigh">Thigh</option>
                <option value="upper-arm">Upper arm</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Subcutaneous injection into the abdomen, thigh or upper arm. Not to be administered intravenously (IV) or intramuscularly (IM).</p>
            </div>

            <TextInput label="Time of day patient will inject (any time of day, preferably the same time each day)" value={state.treatment.injectionTime} onChange={(v) => updateTreatment("injectionTime", v)} placeholder="e.g. 08:00 each morning" />

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pen batch number" value={state.treatment.batchNumber} onChange={(v) => updateTreatment("batchNumber", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Pen expiry date <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.expiryDate} onChange={(e) => updateTreatment("expiryDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Number of pre-filled pens supplied <span className="text-red-400">*</span></label>
                <select value={state.treatment.pensSupplied} onChange={(e) => updateTreatment("pensSupplied", e.target.value as typeof state.treatment.pensSupplied)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                  <option value="">Select</option>
                  <option value="1">1 pen</option>
                  <option value="2">2 pens</option>
                  <option value="3">3 pens</option>
                  <option value="4">4 pens</option>
                  <option value="5">5 pens</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Up to 5 pre-filled pens per supply (approximately 1 month at maintenance dose; each pen contains 18 mg liraglutide).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Supply duration</label>
                <select value={state.treatment.supplyDays} onChange={(e) => updateTreatment("supplyDays", e.target.value as typeof state.treatment.supplyDays)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                  <option value="">Select</option>
                  <option value="28">28-day supply (standard)</option>
                  <option value="30">30-day supply</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Next review date</label>
              <input type="date" value={state.treatment.nextReviewDate} onChange={(e) => updateTreatment("nextReviewDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              <p className="mt-1 text-xs text-gray-500">Review at 12 weeks on the maintenance dose (3.0 mg daily): discontinue if &lt;5% body weight loss has been achieved. If treatment is continued, review at least every 6 months thereafter. Longer treatment may be considered in patients achieving sustained weight loss of ≥5% body weight.</p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Tick each item once discussed with the patient. Every item is required except the two marked optional.</p>
            {COUNSELLING_ITEMS.map((item) => (
              <Checkbox key={item.key} label={item.label} checked={state.counselling[item.key]} onChange={(v) => updateCounselling(item.key, v)} required={item.required} description={item.description} />
            ))}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Decision rationale, follow-up arrangements, any further advice given" />
            <TextArea label="Adverse drug reactions and actions taken (if any)" value={state.summary.adverseReactions} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, adverseReactions: v } }))} rows={2} placeholder="Details of any adverse drug reactions to liraglutide and actions taken. Report suspected adverse effects via https://yellowcard.mhra.gov.uk and inform the GP as appropriate." />
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg print:hidden">
              <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
              <p className="text-sm text-green-800 mt-1">
                Next review: {state.treatment.nextReviewDate || "to be scheduled"}. Review at 12 weeks on the 3.0 mg maintenance dose; discontinue if less than 5% body weight loss. If continued, review at least every 6 months. {PGD_VERSION_LINE}.
              </p>
            </div>
            <PrintedRecord
              title="Saxenda ePGD Consultation Record"
              pgdLine={PGD_VERSION_LINE}
              rows={[
                ["Patient", `${state.patient.firstName} ${state.patient.lastName}, born ${state.patient.dateOfBirth || "not recorded"}${computedAge !== null ? ` (${computedAge} years)` : ""}`],
                ["Address", state.patient.address || "Not recorded"],
                ["GP", [state.patient.gpName, state.patient.gpPractice].filter(Boolean).join(", ") || "Not recorded"],
                ["Consent", state.consent.informedConsentGiven ? `Valid informed consent obtained${state.consent.idVerified ? `; identity verified (${state.consent.idType || "ID seen"})` : ""}; private service explained` : "Not recorded"],
                ["Height, weight, BMI", `${a.heightCm ?? "-"} cm, ${a.weightKg ?? "-"} kg, BMI ${bmi ?? "-"}${initialBmi !== null ? ` (initial BMI ${initialBmi}, initial weight ${a.initialWeightKg} kg, started ${a.treatmentStartDate})` : ""}`],
                ["Comorbidity", a.hasComorbidity === "yes" ? (a.comorbidityDetails || "Yes") : a.hasComorbidity === "no" ? "None" : "Not answered"],
                ["Outcome", hasStop ? `NOT SUPPLIED: ${stopReason}` : "Supplied via PGD"],
                ["Medicine", hasStop ? "Not supplied" : `${PRODUCT_NAME}, subcutaneous injection`],
                ["Dose", hasStop ? "Not supplied" : DOSE_STAGE_LABELS[t.doseStage] ?? "Not recorded"],
                ["Quantity", hasStop ? "Not supplied" : `${t.pensSupplied || "-"} pre-filled pen(s)${t.supplyDays ? `, ${t.supplyDays} day supply` : ""}`],
                ["Batch, expiry, site", hasStop ? "Not applicable" : `${t.batchNumber || "-"}, ${t.expiryDate || "-"}, ${t.injectionSite || "-"}`],
                ["Cautions", [
                  state.eligibility.sulfonylurea ? `sulfonylurea (prescriber informed: ${state.eligibility.sulfonylureaPrescriberInformed ? "yes" : "no"})` : "",
                  state.eligibility.mildModerateRenal ? "mild to moderate renal impairment" : "",
                  state.eligibility.mildModerateHepatic ? "mild to moderate hepatic impairment" : "",
                  state.eligibility.otherGiDisorder ? "other GI disorder" : "",
                  state.eligibility.thyroidDisease ? "thyroid disease" : "",
                  state.eligibility.depressionHistory ? "history of depression or suicidal ideation" : "",
                  state.eligibility.significantDehydration ? "significant dehydration" : "",
                  state.eligibility.gastricMotilityMedicine ? "gastric motility medicine" : "",
                  state.eligibility.oralContraceptive ? "combined oral contraceptive" : "",
                  state.eligibility.narrowTherapeuticIndexDrug ? "narrow therapeutic index medicine" : "",
                  state.eligibility.gallbladderDisease ? "gallbladder disease" : "",
                ].filter(Boolean).join("; ") || "None"],
                ["Advice given", hasStop ? (state.eligibility.exclusionAdvice || "Not recorded") : (COUNSELLING_ITEMS.filter((item) => c[item.key]).map((item) => item.short).join("; ") || "None recorded")],
                ["Next review", t.nextReviewDate || "Not recorded"],
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

"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, NumberInput, SelectInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { calculateAge, validatePatientStep, validateConsentStep, validateSummaryStep } from "../shared/types"
import { PrintedRecord } from "./components/PrintedRecord"

// Aligned to: Vitamin B12 and folate PGD v009 (PGD 1 of 3 hydroxocobalamin
// injection; PGD 2 of 3 cyanocobalamin tablets), issued 11 September 2026.
const PGD_VERSION_LINE = "Vitamin B12 and folate PGD v009 (PGD 1 of 3 and 2 of 3), issued 11 September 2026"
const INJECTION_NAME = "Hydroxocobalamin 1 mg/ml solution for injection"
const TABLET_NAME = "Cyanocobalamin 50 microgram tablets"

// Document thresholds (NICE NG239): confirmed deficiency is total B12 below
// 180 ng/L (133 pmol/L) or active B12 below 25 pmol/L; 180 to 350 ng/L (133
// to 258 pmol/L) or active 25 to 70 pmol/L is indeterminate; above that
// deficiency is unlikely.
type B12Classification = "deficient" | "indeterminate" | "unlikely" | null
function classifyB12(testType: string, value: number | null, unit: string): B12Classification {
  if (value === null || !testType) return null
  if (testType === "active") {
    if (value < 25) return "deficient"
    if (value <= 70) return "indeterminate"
    return "unlikely"
  }
  const ngL = unit === "pmol/L" ? value / 0.738 : value
  if (ngL < 180) return "deficient"
  if (ngL <= 350) return "indeterminate"
  return "unlikely"
}

function daysBetween(fromIso: string, toIso: string): number | null {
  if (!fromIso || !toIso) return null
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "Eligibility & Indication",
  "Treatment Plan",
  "Administration",
  "Pharmacist Summary",
  "Consultation Complete",
]

export function B12InjectionClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false, notifyGp: false } as { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean; notifyGp?: boolean },
    eligibility: {
      // Indication
      confirmedDeficiency: false,
      deficiencySource: "" as "" | "labs" | "established" | "post-bariatric" | "dietary",
      // The result is structured so the tool can compare it with the
      // document's thresholds rather than accept "normal" as confirmation.
      b12TestType: "" as "" | "total" | "active",
      b12Value: null as number | null,
      b12Unit: "ng/L" as "ng/L" | "pmol/L",
      // Indeterminate result: only confirmed with a raised MMA or a
      // documented clinical picture (document guidance summary).
      indeterminateJustified: false,
      indeterminateJustification: "",
      labDate: "",
      // Established maintenance patients: the original result or its
      // source, and the established cause, are still required record items.
      establishedResultSource: "",
      establishedCause: "",
      // Severe deficiency on a loading course: plasma potassium must be
      // monitored during initial correction (document caution).
      severeDeficiency: false,
      potassiumMonitoringPlan: "",
      // Record: advice given if excluded or declines treatment
      referralAdvice: "",
      // PGD v009: FBC, blood film and serum folate must have been obtained
      // and reviewed alongside the B12 result (a B12-only point of care
      // device does not satisfy the PGD).
      bloodsReviewed: false,
      labDevice: "",
      // Symptoms
      hasSymptoms: false,
      symptoms: "",
      // New or progressive neurological symptoms or signs: EXCLUSION (refer
      // for same-week medical assessment)
      neuroSymptoms: false,
      // Contraindications
      anyHypersensitivity: false,
      hypersensitivityDetails: "",
      // LHON is an exclusion for cyanocobalamin tablets (PGD 2 of 3) only;
      // hydroxocobalamin is the licensed treatment for Leber's optic atrophy.
      lhonHistory: false,
      hereditaryCobalaminDisorder: false,
      abnormalBloodPicture: false,
      // Injection-specific exclusions (PGD 1 of 3)
      injectionSiteInfection: false,
      bleedingDisorder: false,
      bleedingRiskAssessedSafe: false,
      suitableForIM: false,
      // Cyanocobalamin tablet inclusion (PGD 2 of 3)
      malabsorptionExcluded: false,
      onB12Supplement: false,
      // Cautions
      pregnant: false,
      breastfeeding: false,
      anticoagulants: false,
      folateAlsoLow: false,
      allergyOrAsthmaHistory: false,
      // Drug interactions / additional cautions (per CKS)
      onChloramphenicol: false,
      onOralContraceptives: false,
    },
    treatment: {
      regime: "" as "" | "loading" | "maintenance" | "oral-tablets",
      doseNumber: "" as "" | "1" | "2" | "3" | "4" | "5" | "6",
      // Date of the previous injection, for the interval check (loading:
      // three times a week for two weeks; maintenance: every 2 to 3 months
      // or twice yearly).
      previousInjectionDate: "",
      loadingForEstablishedReason: "",
      nextDueDate: "",
      // Diet-related maintenance: cyanocobalamin tablets 50 to 150 mcg daily
      // OR 6-monthly hydroxocobalamin 1 mg IM.
      maintenanceInterval: "" as "" | "8-weeks" | "12-weeks" | "26-weeks-diet-related",
      // Diet-related vs not-diet-related pathway
      maintenancePathway: "" as "" | "not-diet-related" | "diet-related",
      // Cyanocobalamin 50 microgram tablets (PGD 2 of 3): 50 to 150 mcg
      // daily between meals, up to 3 months supply.
      tabletDose: "" as "" | "50" | "100" | "150",
      tabletSupplyDays: "" as "" | "28" | "56" | "84",
    },
    administration: {
      batchNumber: "",
      expiryDate: "",
      injectionSite: "" as "" | "left-deltoid" | "right-deltoid" | "left-gluteus" | "right-gluteus" | "left-thigh" | "right-thigh",
      administeredAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      adrenalineAvailable: false,
      postObsMinutes: "" as "" | "5" | "10" | "15",
      patientWell: false,
      adverseReaction: false,
      adverseReactionDetails: "",
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", gpInformed: false },
  })

  // Auto-fill pharmacist details from session
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

  // Eligibility logic (PGD v009, 11 September 2026): blocks if any
  // exclusion shared by all three arms is ticked, requires a documented
  // deficiency basis and the full blood work-up (FBC, film, folate).
  const el = state.eligibility
  const today = new Date().toISOString().split("T")[0]
  const isEstablishedPatient = el.deficiencySource === "established"
  const b12Class = classifyB12(el.b12TestType, el.b12Value, el.b12Unit)
  // Deficiency is confirmed by the result: below threshold, or an
  // indeterminate result with a documented MMA or clinical justification.
  const resultConfirmsDeficiency =
    b12Class === "deficient" ||
    (b12Class === "indeterminate" && el.indeterminateJustified && !!el.indeterminateJustification.trim())
  const resultRefutesDeficiency = b12Class === "unlikely"
  const bloodRecordComplete = isEstablishedPatient
    ? !!el.establishedResultSource.trim() && !!el.establishedCause.trim()
    : !!el.b12TestType && el.b12Value !== null && !!el.labDate && !!el.labDevice
  const stopReason: string | null =
    state.patient.age !== null && state.patient.age < 18 ? "Patient is under 18"
    : el.neuroSymptoms ? "New or progressive neurological symptoms or signs: refer for same-week medical assessment"
    : el.abnormalBloodPicture ? "Abnormal full blood count or blood film beyond macrocytic anaemia: refer"
    : el.pregnant ? "Pregnancy: refer to the GP or midwife"
    : el.anyHypersensitivity ? "Known hypersensitivity: do not administer or supply"
    : el.hereditaryCobalaminDisorder ? "Hereditary problem of cobalamin metabolism: refer"
    : !isEstablishedPatient && resultRefutesDeficiency ? "B12 result above the deficiency thresholds (deficiency unlikely): deficiency not confirmed on testing"
    : !isEstablishedPatient && b12Class === "indeterminate" && !resultConfirmsDeficiency ? "Indeterminate B12 result without a raised MMA or documented clinical justification: deficiency not confirmed on testing"
    : null
  const hasStop = stopReason !== null
  const eligibilityError: string | null =
    hasStop ? `${stopReason}. Do not treat under this PGD; document the advice given.`
    : !el.confirmedDeficiency ? "Confirm that B12 deficiency has been documented on blood testing"
    : !el.deficiencySource ? "Select the basis for the diagnosis"
    : !el.bloodsReviewed ? "Confirm the full blood count, blood film and serum folate were obtained and reviewed"
    : !bloodRecordComplete
      ? (isEstablishedPatient
          ? "Record the original result relied on (or its source, for example GP record dated ...) and the established cause"
          : "Record the B12 result relied on: test type, value, date sampled and laboratory")
    : !isEstablishedPatient && !resultConfirmsDeficiency ? "The B12 result does not confirm deficiency under this PGD"
    : null

  // Treatment plan needs a regime + dose-number choice, and the arm-specific
  // inclusion / exclusion checks for that regime.
  const isOralTablets = state.treatment.regime === "oral-tablets"
  const isInjection = state.treatment.regime === "loading" || state.treatment.regime === "maintenance"
  const injectionSuitable =
    state.eligibility.suitableForIM &&
    !state.eligibility.injectionSiteInfection &&
    (!state.eligibility.bleedingDisorder || state.eligibility.bleedingRiskAssessedSafe)
  const maintenanceIntervalMatchesPathway =
    state.treatment.maintenancePathway === "diet-related"
      ? state.treatment.maintenanceInterval === "26-weeks-diet-related"
      : state.treatment.maintenancePathway === "not-diet-related"
        ? state.treatment.maintenanceInterval === "8-weeks" || state.treatment.maintenanceInterval === "12-weeks"
        : false
  const tabletEligible =
    state.eligibility.deficiencySource === "dietary" &&
    state.eligibility.malabsorptionExcluded &&
    !state.eligibility.lhonHistory
  const tr = state.treatment
  const daysSincePrevious = daysBetween(tr.previousInjectionDate, today)
  const isFirstLoadingDose = tr.regime === "loading" && tr.doseNumber === "1"
  const previousDateNeeded = (tr.regime === "loading" && !!tr.doseNumber && !isFirstLoadingDose) || tr.regime === "maintenance"
  const tabletCount = tr.tabletDose && tr.tabletSupplyDays ? (Number(tr.tabletDose) / 50) * Number(tr.tabletSupplyDays) : null
  const treatmentError: string | null =
    !tr.regime ? "Select the treatment regime"
    : isInjection && !injectionSuitable ? "Patient is excluded from the injection pathway (site infection, bleeding risk not assessed, or not suitable for IM injection). Refer."
    : isOralTablets && !tabletEligible ? "Cyanocobalamin tablets are only for diet related deficiency with malabsorption and pernicious anaemia thought unlikely, and are excluded in Leber's hereditary optic neuropathy. Use the injection pathway or refer."
    : tr.regime === "loading" && isEstablishedPatient && !tr.loadingForEstablishedReason.trim() ? "A loading course for a patient on established maintenance needs a documented reason (for example a lapse in treatment); otherwise select maintenance"
    : tr.regime === "loading" && !tr.doseNumber ? "Select which loading dose this is"
    : tr.regime === "loading" && el.severeDeficiency && !el.potassiumMonitoringPlan.trim() ? "Severe deficiency on a loading course: record the arrangement for monitoring plasma potassium during initial correction"
    : tr.regime === "maintenance" && !maintenanceIntervalMatchesPathway ? "Select the maintenance pathway and a matching interval"
    : previousDateNeeded && !tr.previousInjectionDate ? "Date of the previous injection is required"
    : previousDateNeeded && daysSincePrevious !== null && daysSincePrevious < 0 ? "Previous injection date cannot be in the future"
    : tr.regime === "loading" && !isFirstLoadingDose && daysSincePrevious !== null && daysSincePrevious < 1 ? "Loading doses are given on alternate days (three times a week): the previous dose was today"
    : tr.regime === "loading" && !isFirstLoadingDose && daysSincePrevious !== null && daysSincePrevious > 7 ? `More than 7 days since the previous loading dose (${daysSincePrevious} days): the 2 week course is broken. Review with the GP before continuing.`
    : tr.regime === "maintenance" && daysSincePrevious !== null && daysSincePrevious < 42 ? `Only ${daysSincePrevious} days since the previous injection: maintenance is every 2 to 3 months (twice yearly if diet related). Do not give early under this PGD.`
    : isOralTablets && (!tr.tabletDose || !tr.tabletSupplyDays) ? "Select the daily dose and the supply"
    : !tr.nextDueDate ? (isOralTablets ? "Review date is required" : "Next injection due date is required")
    : null

  // Administration needs batch/expiry (all arms); injections also need site,
  // adrenaline available and the post-injection observation. An adverse
  // reaction must be described.
  const ad = state.administration
  const adminError: string | null =
    !ad.batchNumber ? "Batch number is required"
    : !ad.expiryDate ? "Expiry date is required"
    : ad.expiryDate < today ? "Expiry date is in the past: do not use this ampoule or pack"
    : isOralTablets ? null
    : !ad.injectionSite ? "Injection site is required"
    : !ad.adrenalineAvailable ? "Confirm adrenaline 1 in 1,000 and anaphylaxis facilities are available"
    : !ad.postObsMinutes ? "Record the post-injection observation period"
    : ad.adverseReaction && !ad.adverseReactionDetails.trim() ? "Describe the adverse reaction, the action taken and whether a Yellow Card was submitted"
    : !ad.adverseReaction && !ad.patientWell ? "Confirm the patient was well at the end of the observation period, or record an adverse reaction"
    : null

  // Step 0: adults aged 18 years and over; names and DOB required; age is
  // stored on every DOB change.
  const patientError = validatePatientStep(state.patient, { minAge: 18 })
  const consentError = validateConsentStep(state.consent)
  const summaryError = validateSummaryStep(state.summary) ?? (state.summary.gpInformed ? null : "Confirm the GP has been informed (or a referral made)")

  const stepErrors: (string | null)[] = [patientError, consentError, eligibilityError, treatmentError, adminError, summaryError, null]
  // A stop anywhere blocks Next on that step and on every later step.
  const validationError = stepErrors[currentStep] ?? (hasStop ? `${stopReason}: do not treat under this PGD.` : null)
  const canProceed = validationError === null

  const b12ResultText = isEstablishedPatient
    ? `Established patient: ${el.establishedResultSource || "source not recorded"}; cause ${el.establishedCause || "not recorded"}`
    : el.b12Value !== null
      ? `${el.b12TestType === "active" ? "Active B12" : "Total B12"} ${el.b12Value} ${el.b12TestType === "active" ? "pmol/L" : el.b12Unit}${b12Class ? ` (${b12Class})` : ""}${b12Class === "indeterminate" && el.indeterminateJustified ? `; confirmed on: ${el.indeterminateJustification}` : ""}`
      : "Not recorded"

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
      clinicalData: {
        ...state,
        // Nothing is administered on the oral arm: no time of administration.
        administration: { ...state.administration, administeredAt: isOralTablets ? "" : state.administration.administeredAt },
        pgdVersion: PGD_VERSION_LINE,
        stopReason,
        b12Classification: b12Class,
        b12ResultText,
        tabletCount,
      } as unknown as Record<string, unknown>,
      outcome: hasStop ? "referred" : "completed",
      medicine: hasStop || !state.treatment.regime
        ? undefined
        : isOralTablets
          ? {
              name: TABLET_NAME,
              dose: `${state.treatment.tabletDose || "-"} micrograms daily by mouth between meals`,
              duration: state.treatment.tabletSupplyDays ? `${state.treatment.tabletSupplyDays} days` : undefined,
              quantity: tabletCount ?? undefined,
            }
          : {
              name: INJECTION_NAME,
              dose: `1 mg intramuscular (${state.treatment.regime === "loading" ? `loading dose ${state.treatment.doseNumber || "-"} of 6` : `maintenance, ${state.treatment.maintenanceInterval || "-"}`})`,
              quantity: "1 x 1 mg ampoule",
            },
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
    }
  }, [state, isOralTablets, hasStop, stopReason, b12Class, b12ResultText, tabletCount])

  function updateEligibility<K extends keyof typeof state.eligibility>(field: K, value: typeof state.eligibility[K]) {
    setState((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } }))
  }
  function updateTreatment<K extends keyof typeof state.treatment>(field: K, value: typeof state.treatment[K]) {
    setState((prev) => ({ ...prev, treatment: { ...prev.treatment, [field]: value } }))
  }
  function updateAdmin<K extends keyof typeof state.administration>(field: K, value: typeof state.administration[K]) {
    setState((prev) => ({ ...prev, administration: { ...prev.administration, [field]: value } }))
  }

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
            <p className="text-sm font-semibold text-red-900">{stopReason}. Do not treat under this PGD.</p>
            <TextArea
              label="Advice given and referral made: alternative options including the GP practice, decision reached, who was informed"
              value={el.referralAdvice}
              onChange={(v) => updateEligibility("referralAdvice", v)}
              rows={3}
              required
            />
            <p className="text-xs text-red-800">Make the referral clear and timely and do not delay it by starting treatment. Record the advice, then use &quot;Save as not supplied&quot; below.</p>
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
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) => setState((prev) => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">Confirmed B12 deficiency required</p>
              <p>
                This PGD is for adults with vitamin B12 deficiency confirmed on
                blood testing (total B12 below 180 ng/L or active B12 below
                25 pmol/L, interpreted with the clinical picture), where a full
                blood count, blood film and serum folate from an accredited
                laboratory have been obtained and reviewed alongside the B12
                result. A point of care or finger prick device that reports
                B12 alone does not satisfy this PGD. Patients presenting only
                with unconfirmed symptoms, or with incomplete testing, should
                be referred to their GP for diagnostic workup rather than
                treated under this PGD.
              </p>
            </div>

            <Checkbox
              label="Documented B12 deficiency confirmed on blood testing"
              checked={state.eligibility.confirmedDeficiency}
              onChange={(v) => updateEligibility("confirmedDeficiency", v)}
              description="Tick to continue. If deficiency is not confirmed on testing, or testing is incomplete, refer to GP."
            />

            {state.eligibility.confirmedDeficiency && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Basis for diagnosis <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.eligibility.deficiencySource}
                  onChange={(e) => updateEligibility("deficiencySource", e.target.value as typeof state.eligibility.deficiencySource)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                >
                  <option value="">— select —</option>
                  <option value="labs">Laboratory-confirmed (low total or active B12, with or without raised MMA)</option>
                  <option value="established">Established maintenance, existing patient continuing therapy with diagnosis and cause already established</option>
                  <option value="post-bariatric">Confirmed deficiency after gastrectomy, bariatric or ileal surgery (lifelong replacement indicated)</option>
                  <option value="dietary">Diet related (vegan or severely restricted diet) with confirmed deficiency</option>
                </select>
              </div>
            )}

            {!!state.eligibility.deficiencySource && (
              <div className="space-y-3">
                <Checkbox
                  label="Full blood count, blood film and serum folate obtained from an accredited laboratory and reviewed alongside the B12 result"
                  checked={state.eligibility.bloodsReviewed}
                  onChange={(v) => updateEligibility("bloodsReviewed", v)}
                  required
                  description="Required by the PGD. A B12-only point of care or finger prick result is not sufficient to start treatment."
                />
                {!isEstablishedPatient && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <SelectInput
                        label="B12 test"
                        value={el.b12TestType}
                        onChange={(v) => updateEligibility("b12TestType", v as typeof el.b12TestType)}
                        options={[
                          { value: "total", label: "Total B12 (serum cobalamin)" },
                          { value: "active", label: "Active B12 (holotranscobalamin), pmol/L" },
                        ]}
                        required
                      />
                      <NumberInput label="Result" value={el.b12Value} onChange={(v) => updateEligibility("b12Value", v)} min={0} max={5000} unit={el.b12TestType === "active" ? "pmol/L" : el.b12Unit} required />
                      {el.b12TestType !== "active" && (
                        <SelectInput
                          label="Unit"
                          value={el.b12Unit}
                          onChange={(v) => updateEligibility("b12Unit", v as typeof el.b12Unit)}
                          options={[
                            { value: "ng/L", label: "ng/L" },
                            { value: "pmol/L", label: "pmol/L" },
                          ]}
                        />
                      )}
                    </div>
                    {b12Class !== null && (
                      <p className={`text-xs ${b12Class === "deficient" ? "text-green-800" : "text-red-700"}`}>
                        {b12Class === "deficient"
                          ? "Confirmed deficiency (total B12 below 180 ng/L or active B12 below 25 pmol/L)."
                          : b12Class === "indeterminate"
                            ? "Indeterminate result (total B12 180 to 350 ng/L or active B12 25 to 70 pmol/L): possible deficiency. Under this PGD deficiency is confirmed only with a raised serum MMA or a documented clinical picture; otherwise refer."
                            : "Deficiency unlikely (total B12 above 350 ng/L or active B12 above 70 pmol/L): deficiency is not confirmed on testing. Do not treat under this PGD; refer for further assessment."}
                      </p>
                    )}
                    {b12Class === "indeterminate" && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
                        <Checkbox
                          label="Indeterminate result confirmed as deficiency: raised serum methylmalonic acid (MMA), or symptoms and signs and blood picture consistent with deficiency, documented"
                          checked={el.indeterminateJustified}
                          onChange={(v) => updateEligibility("indeterminateJustified", v)}
                        />
                        {el.indeterminateJustified && (
                          <TextInput label="MMA result or clinical justification" value={el.indeterminateJustification} onChange={(v) => updateEligibility("indeterminateJustification", v)} placeholder="e.g. MMA 620 nmol/L on 2026-08-30" required />
                        )}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1">
                          Date sample taken <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={el.labDate}
                          onChange={(e) => updateEligibility("labDate", e.target.value)}
                          max={today}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                        />
                      </div>
                      <TextInput
                        label="Laboratory used"
                        value={el.labDevice}
                        onChange={(v) => updateEligibility("labDevice", v)}
                        placeholder="e.g. NHS lab via GP"
                        required
                      />
                    </div>
                  </>
                )}
                {isEstablishedPatient && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">
                      Repeat blood testing is not required before each maintenance
                      injection once the diagnosis and cause are established. Do
                      not repeat serum B12 in a patient on intramuscular
                      maintenance (NICE NG239: the result is uninformative). The
                      results originally relied on, their date and source, and
                      the established cause are still required record items.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <TextInput label="Original result relied on, with date and source" value={el.establishedResultSource} onChange={(v) => updateEligibility("establishedResultSource", v)} placeholder="e.g. total B12 121 ng/L, 2024-03-12, GP record" required />
                      <TextInput label="Established cause of deficiency" value={el.establishedCause} onChange={(v) => updateEligibility("establishedCause", v)} placeholder="e.g. pernicious anaemia (anti-IF positive)" required />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Exclusion criteria (any ticked: do not treat under this PGD)</p>
              <div className="space-y-2">
                <Checkbox
                  label="Known hypersensitivity to hydroxocobalamin, cyanocobalamin, cobalamin derivatives or any excipient"
                  checked={state.eligibility.anyHypersensitivity}
                  onChange={(v) => updateEligibility("anyHypersensitivity", v)}
                />
                {state.eligibility.anyHypersensitivity && (
                  <p className="text-xs text-red-700 ml-7">
                    Hypersensitivity is an absolute contraindication. Do not
                    administer or supply. Refer to GP.
                  </p>
                )}
                <Checkbox
                  label="Known hereditary problems of cobalamin metabolism"
                  checked={state.eligibility.hereditaryCobalaminDisorder}
                  onChange={(v) => updateEligibility("hereditaryCobalaminDisorder", v)}
                />
                {state.eligibility.hereditaryCobalaminDisorder && (
                  <p className="text-xs text-red-700 ml-7">Excluded. Refer to GP.</p>
                )}
                <Checkbox
                  label="Patient is pregnant"
                  checked={state.eligibility.pregnant}
                  onChange={(v) => updateEligibility("pregnant", v)}
                />
                {state.eligibility.pregnant && (
                  <p className="text-xs text-red-700 ml-7">
                    Pregnancy is an exclusion. The SPC states that
                    hydroxocobalamin injection should not be used for the
                    treatment of megaloblastic anaemia of pregnancy, and B12
                    results are less reliable in pregnancy. Refer to the GP or
                    midwife so that the cause is properly identified and
                    antenatal care is not delayed.
                  </p>
                )}
                <Checkbox
                  label="New or progressive neurological symptoms or signs (sensory disturbance, gait disturbance, cognitive change)"
                  checked={state.eligibility.neuroSymptoms}
                  onChange={(v) => updateEligibility("neuroSymptoms", v)}
                />
                {state.eligibility.neuroSymptoms && (
                  <p className="text-xs text-red-700 ml-7">
                    Excluded. Refer for same-week medical assessment: these
                    require prompt investigation and may need a different
                    treatment schedule. Do not delay the referral by starting
                    treatment.
                  </p>
                )}
                <Checkbox
                  label="Abnormal full blood count or blood film beyond macrocytic anaemia (unexplained cytopenias or features suggesting another cause)"
                  checked={state.eligibility.abnormalBloodPicture}
                  onChange={(v) => updateEligibility("abnormalBloodPicture", v)}
                />
                {state.eligibility.abnormalBloodPicture && (
                  <p className="text-xs text-red-700 ml-7">
                    Excluded. Refer to GP; make the referral clear and timely.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Cautions</p>
              <div className="space-y-2">
                <Checkbox
                  label="Serum folate is also low"
                  checked={state.eligibility.folateAlsoLow}
                  onChange={(v) => updateEligibility("folateAlsoLow", v)}
                  description="Where both B12 and folate are low, treat B12 first or at the same time. Folic acid alone can precipitate or worsen subacute combined degeneration of the cord. Folic acid 5 mg may be supplied under PGD 3 of 3 once B12 treatment has been started. If in any doubt about the order of treatment, refer."
                />
                <Checkbox
                  label="Patient is breastfeeding"
                  checked={state.eligibility.breastfeeding}
                  onChange={(v) => updateEligibility("breastfeeding", v)}
                  description="Not a contraindication. Hydroxocobalamin is excreted in breast milk but is unlikely to harm the infant. Review at 1 month after the loading course rather than 3 months."
                />
                <Checkbox
                  label="History of significant allergy or asthma"
                  checked={state.eligibility.allergyOrAsthmaHistory}
                  onChange={(v) => updateEligibility("allergyOrAsthmaHistory", v)}
                  description="Use with caution. Anaphylaxis is rare but recognised: facilities and trained staff for its management, adrenaline 1 in 1,000 and a telephone must be available, and the patient must be observed after administration."
                />
                <Checkbox
                  label="Patient takes oral anticoagulants"
                  checked={state.eligibility.anticoagulants}
                  onChange={(v) => updateEligibility("anticoagulants", v)}
                  description="Apply pressure to injection site for at least 2 minutes post-injection."
                />
                <Checkbox
                  label="Patient takes chloramphenicol"
                  checked={state.eligibility.onChloramphenicol}
                  onChange={(v) => updateEligibility("onChloramphenicol", v)}
                  description="People taking chloramphenicol may respond poorly to hydroxocobalamin. Where the response is inadequate, review the medication history and refer."
                />
                <Checkbox
                  label="Patient is on oral contraceptives (combined or progesterone-only)"
                  checked={state.eligibility.onOralContraceptives}
                  onChange={(v) => updateEligibility("onOralContraceptives", v)}
                  description="Serum concentrations may be lowered by oral contraceptives. Unlikely to be clinically significant but consider when interpreting a borderline result."
                />
                <Checkbox
                  label="Patient already takes a B12 containing supplement"
                  checked={state.eligibility.onB12Supplement}
                  onChange={(v) => updateEligibility("onB12Supplement", v)}
                  description="Can raise measured levels without correcting deficiency. Interpret the result with caution."
                />
              </div>
              <div className="mt-3 space-y-2">
                <Checkbox
                  label="Severe deficiency (marked anaemia, low haemoglobin, or significant symptoms)"
                  checked={el.severeDeficiency}
                  onChange={(v) => updateEligibility("severeDeficiency", v)}
                  description="Document caution: monitor plasma potassium during the initial correction phase, as rapid haematological response can cause hypokalaemia. Refer any patient who becomes unwell or develops palpitations or muscle weakness during initiation."
                />
                {el.severeDeficiency && (
                  <TextInput label="Potassium monitoring arrangement during the loading course" value={el.potassiumMonitoringPlan} onChange={(v) => updateEligibility("potassiumMonitoringPlan", v)} placeholder="e.g. U&E requested via GP for day 7 of the course" required />
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-2">Symptoms (optional)</p>
              <Checkbox
                label="Patient reports any current symptoms"
                checked={state.eligibility.hasSymptoms}
                onChange={(v) => updateEligibility("hasSymptoms", v)}
              />
              {state.eligibility.hasSymptoms && (
                <div className="mt-3 space-y-3">
                  <TextArea
                    label="Symptom details"
                    value={state.eligibility.symptoms}
                    onChange={(v) => updateEligibility("symptoms", v)}
                    rows={2}
                    placeholder="e.g. fatigue, glossitis (any new or progressive neurological symptoms must be ticked above and referred)"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-2">
                Treatment regime <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="regime"
                    checked={state.treatment.regime === "loading"}
                    onChange={() => updateTreatment("regime", "loading")}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-navy-900">Initial correction (loading), hydroxocobalamin 1 mg/ml injection</div>
                    <div className="text-gray-600">1 mg IM three times a week for 2 weeks (6 injections total). Use at start of treatment for newly diagnosed deficiency. Where neurological involvement is suspected the schedule differs and the patient is excluded from this PGD; refer.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="regime"
                    checked={state.treatment.regime === "maintenance"}
                    onChange={() => updateTreatment("regime", "maintenance")}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-navy-900">Maintenance, hydroxocobalamin 1 mg/ml injection</div>
                    <div className="text-gray-600">1 mg IM every 2 to 3 months where the deficiency is not diet related (usually lifelong), or 1 mg IM twice yearly where the deficiency is diet related.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="regime"
                    checked={state.treatment.regime === "oral-tablets"}
                    onChange={() => updateTreatment("regime", "oral-tablets")}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-navy-900">Oral maintenance, cyanocobalamin 50 microgram tablets (PGD 2 of 3)</div>
                    <div className="text-gray-600">Diet related deficiency only: 50 to 150 micrograms daily by mouth, taken between meals. Up to 3 months supply at the selected dose, with review before further supply.</div>
                  </div>
                </label>
              </div>
            </div>

            {isInjection && (
              <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-navy-900">Injection pathway checks</p>
                <Checkbox
                  label="Suitable for intramuscular injection in a non-acute setting"
                  checked={state.eligibility.suitableForIM}
                  onChange={(v) => updateEligibility("suitableForIM", v)}
                  required
                />
                <Checkbox
                  label="Active infection at the proposed injection site"
                  checked={state.eligibility.injectionSiteInfection}
                  onChange={(v) => updateEligibility("injectionSiteInfection", v)}
                />
                {state.eligibility.injectionSiteInfection && (
                  <p className="text-xs text-red-700 ml-7">Excluded. Do not inject at an infected site; refer or rebook once resolved.</p>
                )}
                <Checkbox
                  label="Severe thrombocytopenia or a bleeding disorder"
                  checked={state.eligibility.bleedingDisorder}
                  onChange={(v) => updateEligibility("bleedingDisorder", v)}
                />
                {state.eligibility.bleedingDisorder && (
                  <div className="ml-7 space-y-2">
                    <p className="text-xs text-red-700">
                      Excluded unless intramuscular injection has been assessed
                      as safe by a clinician familiar with the individual&apos;s
                      bleeding risk.
                    </p>
                    <Checkbox
                      label="Intramuscular injection has been assessed as safe by a clinician familiar with the individual's bleeding risk (documented)"
                      checked={state.eligibility.bleedingRiskAssessedSafe}
                      onChange={(v) => updateEligibility("bleedingRiskAssessedSafe", v)}
                    />
                  </div>
                )}
              </div>
            )}

            {isOralTablets && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-navy-900">Cyanocobalamin tablet checks (PGD 2 of 3)</p>
                  {state.eligibility.deficiencySource !== "dietary" && (
                    <p className="text-xs text-red-700">
                      Oral maintenance is only for deficiency assessed as diet
                      related. Deficiency due to, or possibly due to,
                      malabsorption, pernicious anaemia, gastric or ileal
                      surgery, or any cause other than diet is excluded: oral
                      replacement at this dose is not reliable in
                      malabsorption. Use the injection pathway or refer.
                    </p>
                  )}
                  <Checkbox
                    label="Malabsorption and pernicious anaemia have been considered and are thought unlikely"
                    checked={state.eligibility.malabsorptionExcluded}
                    onChange={(v) => updateEligibility("malabsorptionExcluded", v)}
                    required
                  />
                  <Checkbox
                    label="Leber's hereditary optic neuropathy, or a family history of it"
                    checked={state.eligibility.lhonHistory}
                    onChange={(v) => updateEligibility("lhonHistory", v)}
                  />
                  {state.eligibility.lhonHistory && (
                    <p className="text-xs text-red-700 ml-7">
                      Cyanocobalamin is excluded in Leber&apos;s hereditary
                      optic neuropathy. Hydroxocobalamin injection is not
                      excluded on this ground; use the injection pathway or
                      refer.
                    </p>
                  )}
                  <p className="text-xs text-gray-600">
                    Adherence matters: oral maintenance only works if taken
                    daily and continued. Where adherence is likely to be poor,
                    the injection pathway may be more appropriate.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Daily dose <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={state.treatment.tabletDose}
                      onChange={(e) => updateTreatment("tabletDose", e.target.value as typeof state.treatment.tabletDose)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                    >
                      <option value="">select</option>
                      <option value="50">50 micrograms daily (1 tablet)</option>
                      <option value="100">100 micrograms daily (2 tablets)</option>
                      <option value="150">150 micrograms daily (3 tablets)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Supply <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={state.treatment.tabletSupplyDays}
                      onChange={(e) => updateTreatment("tabletSupplyDays", e.target.value as typeof state.treatment.tabletSupplyDays)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                    >
                      <option value="">select</option>
                      <option value="28">28 days</option>
                      <option value="56">56 days</option>
                      <option value="84">84 days (3 months, maximum)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {state.treatment.regime === "loading" && isEstablishedPatient && (
              <TextInput label="Reason for a loading course in a patient on established maintenance" value={tr.loadingForEstablishedReason} onChange={(v) => updateTreatment("loadingForEstablishedReason", v)} placeholder="e.g. no injection for 9 months, symptomatic; GP agrees to reload" required />
            )}

            {state.treatment.regime === "loading" && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Which loading dose is this? <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.treatment.doseNumber}
                  onChange={(e) => updateTreatment("doseNumber", e.target.value as typeof state.treatment.doseNumber)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                >
                  <option value="">— select —</option>
                  <option value="1">1st of 6 (Week 1, Day 1)</option>
                  <option value="2">2nd of 6 (Week 1, Day 3)</option>
                  <option value="3">3rd of 6 (Week 1, Day 5)</option>
                  <option value="4">4th of 6 (Week 2, Day 1)</option>
                  <option value="5">5th of 6 (Week 2, Day 3)</option>
                  <option value="6">6th of 6 (Week 2, Day 5)</option>
                </select>
              </div>
            )}

            {state.treatment.regime === "maintenance" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Maintenance pathway <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="maintenancePathway"
                        checked={state.treatment.maintenancePathway === "not-diet-related"}
                        onChange={() => updateTreatment("maintenancePathway", "not-diet-related")}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-navy-900">Deficiency NOT diet related</div>
                        <div className="text-gray-600">e.g. pernicious anaemia (autoimmune gastritis), gastrectomy, bariatric or ileal surgery, malabsorption. Maintenance is 1 mg IM every 2 to 3 months, continuing long term (usually lifelong). A daily high dose oral alternative (500 to 1000 micrograms) is outside this PGD; discuss with the GP if the patient prefers it.</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="maintenancePathway"
                        checked={state.treatment.maintenancePathway === "diet-related"}
                        onChange={() => updateTreatment("maintenancePathway", "diet-related")}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-navy-900">Deficiency IS diet related</div>
                        <div className="text-gray-600">e.g. vegan or severely restricted diet. Maintenance is either cyanocobalamin tablets 50 to 150 micrograms daily (select the oral maintenance regime above), OR hydroxocobalamin 1 mg IM twice yearly.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Maintenance interval <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={state.treatment.maintenanceInterval}
                    onChange={(e) => updateTreatment("maintenanceInterval", e.target.value as typeof state.treatment.maintenanceInterval)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  >
                    <option value="">— select —</option>
                    <option value="8-weeks">Every 2 months (8 weeks), deficiency not diet related</option>
                    <option value="12-weeks">Every 3 months (12 weeks), deficiency not diet related</option>
                    <option value="26-weeks-diet-related">Twice yearly (every 6 months), diet related deficiency only</option>
                  </select>
                  {!!state.treatment.maintenancePathway && !!state.treatment.maintenanceInterval && !maintenanceIntervalMatchesPathway && (
                    <p className="mt-1 text-xs text-red-700">
                      Interval does not match the maintenance pathway. Not diet
                      related: every 2 to 3 months. Diet related: twice yearly.
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  Review at 3 months after the loading course (symptoms,
                  response, full blood count; at 1 month if breastfeeding), then
                  at least annually with symptoms, adherence and a full blood
                  count. Do not repeat serum B12 on intramuscular maintenance.
                  Refer to the GP if there is no response to the initial
                  correction, if new neurological symptoms develop, if the blood
                  picture changes, or if the cause of the deficiency has never
                  been established.
                </p>
              </>
            )}

            {previousDateNeeded && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Date of previous injection <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={tr.previousInjectionDate}
                  onChange={(e) => updateTreatment("previousInjectionDate", e.target.value)}
                  max={today}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                />
                {daysSincePrevious !== null && (
                  <p className="mt-1 text-xs text-gray-600">{daysSincePrevious} day(s) since the previous injection. Loading: alternate days, three a week for 2 weeks. Maintenance: every 2 to 3 months, or twice yearly if diet related.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                {isOralTablets ? "Review date (before further supply)" : "Next injection due"} <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={state.treatment.nextDueDate}
                onChange={(e) => updateTreatment("nextDueDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 p-3 text-sm text-[color:var(--tenant-primary)]">
              <p className="font-semibold">
                {isOralTablets
                  ? `Cyanocobalamin 50 microgram tablets, ${state.treatment.tabletDose || "50 to 150"} micrograms daily by mouth between meals, ${state.treatment.tabletSupplyDays || "up to 84"} days supply${tabletCount ? ` (${tabletCount} tablets)` : ""} (P medicine)`
                  : "Hydroxocobalamin 1mg/ml Solution for Injection, one 1 mg ampoule intramuscularly (POM)"}
              </p>
              <p className="mt-1 text-xs">
                {isOralTablets
                  ? "Store below 25°C in the original container, protected from light."
                  : "Store below 25°C. Protect from light. Do not freeze. Record the anatomical site used and rotate sites where a course is given."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label={isOralTablets ? "Batch number of pack supplied" : "Ampoule batch number"}
                value={state.administration.batchNumber}
                onChange={(v) => updateAdmin("batchNumber", v)}
                required
                placeholder="e.g. AB1234"
              />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Expiry date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.administration.expiryDate}
                  onChange={(e) => updateAdmin("expiryDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                />
              </div>
            </div>

            {isOralTablets && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                Supply the patient information leaflet (PIL) with the pack,
                together with written dietary advice on B12 sources. Counsel:
                take the tablets every day, between meals. Improvement in
                tiredness and other symptoms may take a few weeks. Continue
                while the dietary cause persists and attend for annual review
                (symptoms, adherence, repeat B12 and full blood count). Seek
                medical advice promptly for any new numbness, tingling,
                unsteadiness, or memory or mood change.
              </div>
            )}

            {isInjection && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Injection site <span className="text-red-400">*</span>
              </label>
              <select
                value={state.administration.injectionSite}
                onChange={(e) => updateAdmin("injectionSite", e.target.value as typeof state.administration.injectionSite)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <option value="left-deltoid">Left deltoid</option>
                <option value="right-deltoid">Right deltoid</option>
                <option value="left-gluteus">Left gluteus (ventrogluteal preferred)</option>
                <option value="right-gluteus">Right gluteus (ventrogluteal preferred)</option>
                <option value="left-thigh">Left vastus lateralis (thigh)</option>
                <option value="right-thigh">Right vastus lateralis (thigh)</option>
              </select>
            </div>
            )}

            {isInjection && (
            <TextInput
              label="Time administered"
              value={state.administration.administeredAt}
              onChange={(v) => updateAdmin("administeredAt", v)}
              placeholder="HH:MM"
            />
            )}

            {isInjection && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Post-injection observation</p>
              <div className="mb-3">
                <Checkbox
                  label="Facilities and trained staff for the management of anaphylaxis available, with immediate access to adrenaline (epinephrine) 1 in 1,000 injection and a telephone"
                  checked={state.administration.adrenalineAvailable}
                  onChange={(v) => updateAdmin("adrenalineAvailable", v)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Observation period <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.administration.postObsMinutes}
                  onChange={(e) => updateAdmin("postObsMinutes", e.target.value as typeof state.administration.postObsMinutes)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                >
                  <option value="">— select —</option>
                  <option value="5">5 minutes (low risk, returning patient)</option>
                  <option value="10">10 minutes (standard)</option>
                  <option value="15">15 minutes (first dose / atopic patient)</option>
                </select>
              </div>
              <div className="mt-3 space-y-2">
                <Checkbox
                  label="Patient well at end of observation period"
                  checked={state.administration.patientWell}
                  onChange={(v) => updateAdmin("patientWell", v)}
                />
                <Checkbox
                  label="Any adverse reaction (mild or otherwise)"
                  checked={state.administration.adverseReaction}
                  onChange={(v) => setState((prev) => ({ ...prev, administration: { ...prev.administration, adverseReaction: v, patientWell: v ? false : prev.administration.patientWell } }))}
                />
                {state.administration.adverseReaction && (
                  <TextArea
                    label="Adverse reaction details, action taken, Yellow Card reference"
                    value={state.administration.adverseReactionDetails}
                    onChange={(v) => updateAdmin("adverseReactionDetails", v)}
                    rows={2}
                    placeholder="Describe reaction, action taken, Yellow Card reported (https://yellowcard.mhra.gov.uk), GP informed"
                    required
                  />
                )}
              </div>
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                Supply the PIL and a written record of the dose given and the
                date the next dose is due. Counsel: hydroxocobalamin starts to
                work straight away, but it may take a few days or weeks before
                B12 levels and symptoms such as extreme tiredness start to
                improve. At first the injection may be needed a few times a
                week to build levels up; once the condition improves it may
                only be needed every few months. There may be some mild,
                short-lived pain, swelling or itching at the injection site.
                It is safe to take long term and some people need it for the
                rest of their lives. Urine may look reddish for a short time
                after the injection, which is harmless. Seek medical advice
                promptly for any new numbness, tingling, unsteadiness, memory
                or mood change, and urgent advice for any breathing difficulty,
                facial swelling or widespread rash after an injection.
              </div>
            </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Any further notes, advice given, follow-up arrangements" />
            <Checkbox
              label="GP informed of the supply or administration under this PGD (or referral made)"
              checked={state.summary.gpInformed}
              onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, gpInformed: v } }))}
              description="The PGD requires the individual's GP to be informed."
              required
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg print:hidden">
              <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
              <p className="text-sm text-green-800 mt-1">
                Save the consultation to lock the record. Patient should return on
                {state.treatment.nextDueDate ? ` ${state.treatment.nextDueDate}` : " the date you noted"}
                {isOralTablets ? " for review before further supply." : " for the next dose."}
                {" "}Review at 3 months after the loading course (1 month if breastfeeding), then at least annually with a full blood count.
              </p>
            </div>
            <PrintedRecord
              title="Vitamin B12 ePGD Consultation Record"
              pgdLine={`${PGD_VERSION_LINE}: ${isOralTablets ? "PGD 2 of 3, cyanocobalamin tablets" : "PGD 1 of 3, hydroxocobalamin injection"}`}
              rows={[
                ["Patient", `${state.patient.firstName} ${state.patient.lastName}, born ${state.patient.dateOfBirth || "not recorded"}${state.patient.age !== null ? ` (${state.patient.age} years)` : ""}`],
                ["Address", state.patient.address || "Not recorded"],
                ["GP", [state.patient.gpName, state.patient.gpPractice].filter(Boolean).join(", ") || "Not recorded"],
                ["Consent", state.consent.informedConsentGiven ? "Valid informed consent obtained; private service explained" : "Not recorded"],
                ["Blood results relied on", `${b12ResultText}${!isEstablishedPatient ? `; sampled ${el.labDate || "-"}; ${el.labDevice || "-"}` : ""}; FBC, film and folate ${el.bloodsReviewed ? "reviewed" : "not reviewed"}`],
                ["Basis", el.deficiencySource || "Not recorded"],
                ["Outcome", hasStop ? `NOT TREATED, REFERRED: ${stopReason}` : (isOralTablets ? "Supplied via PGD" : "Administered via PGD")],
                ["Medicine", hasStop ? "Not supplied" : isOralTablets ? `${TABLET_NAME}, oral` : `${INJECTION_NAME}, intramuscular`],
                ["Dose", hasStop ? "Not supplied" : isOralTablets ? `${tr.tabletDose || "-"} micrograms daily between meals` : `1 mg IM, ${tr.regime === "loading" ? `loading dose ${tr.doseNumber || "-"} of 6` : `maintenance ${tr.maintenanceInterval || "-"}`}`],
                ["Quantity", hasStop ? "Not supplied" : isOralTablets ? `${tabletCount ?? "-"} tablets (${tr.tabletSupplyDays || "-"} days)` : "1 x 1 mg ampoule"],
                ["Batch, expiry, site", hasStop ? "Not applicable" : `${ad.batchNumber || "-"}, ${ad.expiryDate || "-"}${isOralTablets ? "" : `, ${ad.injectionSite || "-"} at ${ad.administeredAt || "-"}`}`],
                ["Observation", hasStop || isOralTablets ? "Not applicable" : `${ad.postObsMinutes || "-"} minutes; adrenaline available: ${ad.adrenalineAvailable ? "yes" : "no"}; ${ad.adverseReaction ? `adverse reaction: ${ad.adverseReactionDetails}` : "patient well"}`],
                ["Previous and next", `${tr.previousInjectionDate ? `previous injection ${tr.previousInjectionDate}; ` : ""}next due or review ${tr.nextDueDate || "-"}`],
                ["Advice given", hasStop ? (el.referralAdvice || "Not recorded") : isOralTablets ? "PIL and written dietary advice on B12 sources supplied; take daily between meals; annual review; seek advice for new numbness, tingling, unsteadiness, memory or mood change" : "PIL and written record of the dose and next due date supplied; injection site effects, reddish urine, when to seek advice, review at 3 months then annually"],
                ["GP informed", state.summary.gpInformed ? "Yes" : "No"],
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

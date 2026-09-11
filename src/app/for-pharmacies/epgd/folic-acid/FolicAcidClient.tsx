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

// Aligned to: Vitamin B12 and folate PGD v009 (PGD 3 of 3, folic acid 5 mg
// tablets), issued 11 September 2026.
const PGD_VERSION_LINE = "Vitamin B12 and folate PGD v009 (PGD 3 of 3: folic acid 5 mg tablets), issued 11 September 2026"
const PRODUCT_NAME = "Folic acid 5 mg tablets"
// Document: up to 4 months supply, one tablet daily.
const MAX_TABLETS = 120

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "Eligibility & B12 Exclusion",
  "Treatment Plan",
  "Counselling & Written Advice",
  "Pharmacist Summary",
  "Consultation Complete",
]

// B12 thresholds from the document's guidance summary (NICE NG239):
// deficiency unlikely above 350 ng/L (258 pmol/L) total, or above 70
// pmol/L active. Anything at or below that is not "excluded on testing".
type B12Classification = "excluded" | "indeterminate" | "deficient" | null
function classifyB12(testType: string, value: number | null, unit: string): B12Classification {
  if (value === null || !testType) return null
  if (testType === "active") {
    if (value > 70) return "excluded"
    if (value >= 25) return "indeterminate"
    return "deficient"
  }
  const ngL = unit === "pmol/L" ? value / 0.738 : value
  if (ngL > 350) return "excluded"
  if (ngL >= 180) return "indeterminate"
  return "deficient"
}

export function FolicAcidClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false, notifyGp: false } as { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean; notifyGp?: boolean },
    eligibility: {
      confirmedFolateDeficiency: false,
      serumFolateResult: "",
      serumFolateDate: "",
      // FBC and blood film reviewed; abnormal picture beyond macrocytic
      // anaemia, or unexplained anaemia, is an exclusion (PGD v009).
      fbcReviewed: false,
      abnormalBloodPicture: false,
      // CRITICAL: B12 must be checked before folate replacement. PGD v009:
      // B12 deficiency excluded, OR present and hydroxocobalamin started
      // first or at the same time under PGD 1 of 3. Unknown or untreated is
      // an exclusion.
      // "tested": the result below is classified by the tool against the
      // document's thresholds; only "deficiency unlikely" counts as
      // excluded. Indeterminate or deficient is a stop unless B12 treatment
      // has been started (option "treated").
      b12Status: "" as "" | "tested" | "treated" | "untreated" | "unknown",
      b12TestType: "" as "" | "total" | "active",
      b12Value: null as number | null,
      b12Unit: "ng/L" as "ng/L" | "pmol/L",
      b12Date: "",
      labDevice: "",
      // Common deficiency causes
      cause: "" as "" | "dietary" | "malabsorption" | "alcohol" | "drugs" | "haemolysis" | "pregnancy" | "other",
      causeOther: "",
      // Cause "drugs": the interacting medicine must be named and the GP
      // informed (document guidance summary: trimethoprim and sulfonamides
      // reduce the effect, sulfasalazine reduces absorption).
      interactingMedicine: "",
      // Record: advice given if excluded or declines treatment
      exclusionAdvice: "",
      // Exclusions
      hypersensitivity: false,
      malignancy: false,
      malignancySpecialistAgrees: false,
      pregnant: false,
      antifolateOrAntiepileptic: false,
    },
    treatment: {
      durationMonths: "" as "" | "4" | "shorter",
      durationReason: "",
      quantityTablets: null as number | null,
      nextReviewDate: "",
      batchNumber: "",
      expiryDate: "",
    },
    counselling: {
      pilSupplied: false,
      writtenDietaryAdvice: false,
      fullCourseAdherence: false,
      dietarySources: false,
      repeatBloodTest: false,
      neurologicalWarning: false,
      seekAdviceIfWorse: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", gpInformed: false },
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

  function updateEligibility<K extends keyof typeof state.eligibility>(field: K, value: typeof state.eligibility[K]) {
    setState((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } }))
  }
  function updateTreatment<K extends keyof typeof state.treatment>(field: K, value: typeof state.treatment[K]) {
    setState((prev) => ({ ...prev, treatment: { ...prev.treatment, [field]: value } }))
  }
  function updateCounselling<K extends keyof typeof state.counselling>(field: K, value: typeof state.counselling[K]) {
    setState((prev) => ({ ...prev, counselling: { ...prev.counselling, [field]: value } }))
  }

  const today = new Date().toISOString().split("T")[0]

  // Step 0: adults aged 18 years and over; first name, last name and DOB
  // required; age is stored on every DOB change.
  const patientError = validatePatientStep(state.patient, { minAge: 18 })
  const ageUnder18 = state.patient.age !== null && state.patient.age < 18
  const consentError = validateConsentStep(state.consent)

  // Step 2 (eligibility): folate deficiency confirmed, FBC/film reviewed,
  // B12 status known and safe, cause established, no exclusion ticked.
  const el = state.eligibility
  const b12Class = el.b12Status === "tested" ? classifyB12(el.b12TestType, el.b12Value, el.b12Unit) : null
  const b12ExcludedOnTesting = el.b12Status === "tested" && b12Class === "excluded"
  const b12NotExcluded = el.b12Status === "tested" && (b12Class === "indeterminate" || b12Class === "deficient")
  const b12ResultRecorded = el.b12Status === "treated"
    ? !!el.b12Date && !!el.labDevice
    : !!el.b12TestType && el.b12Value !== null && !!el.b12Date && !!el.labDevice
  const causeRequiresReferral =
    state.eligibility.cause === "other" ||
    state.eligibility.cause === "malabsorption" ||
    state.eligibility.cause === "pregnancy"
  const exclusionTicked =
    state.eligibility.hypersensitivity ||
    (state.eligibility.malignancy && !state.eligibility.malignancySpecialistAgrees) ||
    state.eligibility.pregnant ||
    state.eligibility.antifolateOrAntiepileptic ||
    state.eligibility.abnormalBloodPicture ||
    el.b12Status === "untreated" ||
    el.b12Status === "unknown" ||
    b12NotExcluded ||
    causeRequiresReferral
  const stopReason: string | null = ageUnder18
    ? "Patient is under 18"
    : el.b12Status === "untreated" || el.b12Status === "unknown"
      ? "Vitamin B12 status unknown, or B12 deficiency present and untreated"
    : b12NotExcluded
      ? `B12 not excluded on testing (${b12Class === "deficient" ? "confirmed deficiency" : "indeterminate result"}): start hydroxocobalamin first or at the same time under PGD 1 of 3, or refer`
    : causeRequiresReferral ? "Cause of folate deficiency requires referral"
    : exclusionTicked ? "Exclusion criteria met"
    : null
  const hasStop = stopReason !== null
  const eligibilityError: string | null =
    hasStop ? `${stopReason}. Do not supply folic acid under this PGD; refer to the GP and document the advice given.`
    : !el.b12Status ? "Vitamin B12 status is required"
    : !b12ResultRecorded ? "Record the B12 result relied on (test type, value, date and laboratory or device)"
    : !el.confirmedFolateDeficiency ? "Documented folate deficiency is an inclusion criterion"
    : !el.serumFolateResult || !el.serumFolateDate ? "Serum folate result and test date are required"
    : !el.fbcReviewed ? "Confirm the full blood count and blood film were reviewed alongside the folate result"
    : !el.cause ? "Cause of deficiency is required"
    : el.cause === "drugs" && !el.interactingMedicine.trim() ? "Name the interacting medicine (for example trimethoprim or sulfasalazine) and inform the GP"
    : null

  const tr = state.treatment
  const treatmentError: string | null =
    !tr.durationMonths ? "Select the supply"
    : tr.durationMonths === "shorter" && !tr.durationReason.trim() ? "Record the reason for a shorter supply and the planned review"
    : !tr.quantityTablets || tr.quantityTablets < 1 ? "Quantity supplied (tablets) is required"
    : tr.quantityTablets > MAX_TABLETS ? `Maximum supply under this PGD is ${MAX_TABLETS} tablets (4 months, one daily)`
    : tr.durationMonths === "shorter" && tr.quantityTablets >= MAX_TABLETS ? "A shorter supply must be fewer than 120 tablets"
    : !tr.batchNumber ? "Batch number of the pack supplied is required"
    : !tr.expiryDate ? "Expiry date of the pack supplied is required"
    : tr.expiryDate < today ? "Expiry date is in the past: do not supply this pack"
    : !tr.nextReviewDate ? "Review date (repeat full blood count and folate) is required"
    : null

  const cs = state.counselling
  const counsellingError: string | null =
    !cs.pilSupplied ? "Confirm the patient information leaflet was supplied"
    : !cs.writtenDietaryAdvice ? "Confirm written dietary advice was given"
    : !cs.fullCourseAdherence ? "Confirm the patient was told to take one tablet daily for the full course"
    : !cs.dietarySources ? "Confirm dietary sources of folate were discussed"
    : !cs.repeatBloodTest ? "Confirm the repeat blood test at the end of the course was explained"
    : !cs.neurologicalWarning ? "Confirm the patient was told to seek prompt advice for numbness, tingling or unsteadiness"
    : !cs.seekAdviceIfWorse ? "Confirm the patient was told to seek advice if symptoms persist or worsen"
    : null

  const summaryError = validateSummaryStep(state.summary) ?? (state.summary.gpInformed ? null : "Confirm the GP has been informed of the supply (or a referral made)")

  const stepErrors: (string | null)[] = [patientError, consentError, eligibilityError, treatmentError, counsellingError, summaryError, null]
  // A stop anywhere blocks Next on that step and on every later step.
  const validationError = stepErrors[currentStep] ?? (hasStop ? `${stopReason}: do not supply under this PGD.` : null)
  const canProceed = validationError === null

  const b12ResultText = el.b12Status === "treated"
    ? "B12 deficiency present; hydroxocobalamin started first or at the same time under PGD 1 of 3"
    : el.b12Status === "tested" && el.b12Value !== null
      ? `${el.b12TestType === "active" ? "Active B12" : "Total B12"} ${el.b12Value} ${el.b12TestType === "active" ? "pmol/L" : el.b12Unit}${b12Class ? ` (${b12Class === "excluded" ? "deficiency unlikely, excluded on testing" : b12Class})` : ""}`
      : el.b12Status || "Not recorded"

  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName, lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth, nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone, email: state.patient.email, address: state.patient.address,
        gpName: state.patient.gpName, gpPractice: state.patient.gpPractice,
      },
      clinicalData: { ...state, pgdVersion: PGD_VERSION_LINE, product: PRODUCT_NAME, stopReason, b12Classification: b12Class, b12ResultText } as unknown as Record<string, unknown>,
      outcome: hasStop ? "referred" : "completed",
      medicine: hasStop || !state.treatment.quantityTablets
        ? undefined
        : {
            name: PRODUCT_NAME,
            dose: "5 mg once daily, oral",
            duration: state.treatment.durationMonths === "4" ? "4 months" : `${state.treatment.quantityTablets} days (shorter supply with planned review)`,
            quantity: state.treatment.quantityTablets,
          },
      summary: {
        pharmacistName: state.summary.pharmacistName, pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName, pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate, consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    }
  }, [state, hasStop, stopReason, b12Class, b12ResultText])

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
              label="Advice given (excluded or declines treatment): alternative options including the GP practice, dietary advice, decision reached, GP informed or referred"
              value={el.exclusionAdvice}
              onChange={(v) => updateEligibility("exclusionAdvice", v)}
              rows={3}
              required
            />
            <p className="text-xs text-red-800">Record the advice, then use &quot;Save as not supplied&quot; below. The document requires advice given to an excluded patient to be recorded and the GP informed.</p>
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
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold mb-1">Always confirm B12 status before starting folic acid</p>
              <p>
                This is the single most important safety check in this PGD.
                Folic acid alone can precipitate or worsen subacute combined
                degeneration of the spinal cord in untreated B12 deficiency.
                Where both B12 and folate are low, B12 must be treated first,
                or at least at the same time (hydroxocobalamin under PGD 1 of
                3). If B12 status is unknown, or B12 deficiency is present and
                untreated: test and treat B12 first, or refer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Vitamin B12 status <span className="text-red-400">*</span>
              </label>
              <select
                value={state.eligibility.b12Status}
                onChange={(e) => updateEligibility("b12Status", e.target.value as typeof state.eligibility.b12Status)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">select</option>
                <option value="tested">B12 tested: enter the result below (excluded only if total B12 above 350 ng/L or active B12 above 70 pmol/L)</option>
                <option value="treated">B12 deficiency present and hydroxocobalamin started first or at the same time under PGD 1 of 3</option>
                <option value="untreated">B12 deficiency present and NOT yet treated</option>
                <option value="unknown">B12 status unknown or not tested</option>
              </select>
              {(el.b12Status === "untreated" || el.b12Status === "unknown") && (
                <p className="mt-1 text-xs text-red-700">
                  Excluded. Vitamin B12 status unknown, or B12 deficiency
                  present and untreated. Test and treat B12 first (B12
                  Injection PGD), or refer to the GP.
                </p>
              )}
            </div>
            {el.b12Status === "tested" && (
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
            )}
            {el.b12Status === "tested" && b12Class !== null && (
              <p className={`text-xs ${b12Class === "excluded" ? "text-green-800" : "text-red-700"}`}>
                {b12Class === "excluded"
                  ? "Deficiency unlikely (total B12 above 350 ng/L or active B12 above 70 pmol/L): B12 deficiency excluded on testing."
                  : b12Class === "indeterminate"
                    ? "Indeterminate result (total B12 180 to 350 ng/L or active B12 25 to 70 pmol/L). This is not excluded on testing: B12 must be treated first or at the same time under PGD 1 of 3 (select that option once started), or consider serum MMA and refer. Folic acid alone in unrecognised B12 deficiency can precipitate subacute combined degeneration."
                    : "Confirmed B12 deficiency (total below 180 ng/L or active below 25 pmol/L). Treat B12 first or at the same time under PGD 1 of 3 (select that option once started), or refer."}
              </p>
            )}
            {(el.b12Status === "tested" || el.b12Status === "treated") && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">B12 test date <span className="text-red-400">*</span></label>
                  <input type="date" value={el.b12Date} onChange={(e) => updateEligibility("b12Date", e.target.value)} max={today} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                </div>
                <TextInput label="Laboratory or device used" value={el.labDevice} onChange={(v) => updateEligibility("labDevice", v)} placeholder="e.g. NHS lab via GP" required />
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <Checkbox
                label="Documented folate deficiency"
                checked={state.eligibility.confirmedFolateDeficiency}
                onChange={(v) => updateEligibility("confirmedFolateDeficiency", v)}
                required
                description="Serum folate below 7 nanomol/L (3 micrograms/L), or 7 to 10 nanomol/L with supporting clinical features, interpreted with the full blood count and blood film."
              />
              {state.eligibility.confirmedFolateDeficiency && (
                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                  <TextInput label="Serum folate result" value={state.eligibility.serumFolateResult} onChange={(v) => updateEligibility("serumFolateResult", v)} placeholder="e.g. 5.2 nmol/L" required />
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Folate test date <span className="text-red-400">*</span></label>
                    <input type="date" value={state.eligibility.serumFolateDate} onChange={(e) => updateEligibility("serumFolateDate", e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                  </div>
                </div>
              )}
              <div className="mt-3 space-y-2">
                <Checkbox
                  label="Full blood count and blood film reviewed alongside the folate result"
                  checked={state.eligibility.fbcReviewed}
                  onChange={(v) => updateEligibility("fbcReviewed", v)}
                  required
                />
                <Checkbox
                  label="Unexplained anaemia where the cause has not been established, or an abnormal blood picture beyond macrocytic anaemia"
                  checked={state.eligibility.abnormalBloodPicture}
                  onChange={(v) => updateEligibility("abnormalBloodPicture", v)}
                />
                {state.eligibility.abnormalBloodPicture && (
                  <p className="text-xs text-red-700 ml-7">Excluded. Refer to GP. Folic acid should never be used to treat anaemia without a full investigation of the cause.</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-navy-900 mb-1">Cause of deficiency <span className="text-red-400">*</span></label>
              <select
                value={state.eligibility.cause}
                onChange={(e) => updateEligibility("cause", e.target.value as typeof state.eligibility.cause)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">select</option>
                <option value="dietary">Poor diet (low intake)</option>
                <option value="alcohol">Alcohol excess</option>
                <option value="drugs">Drug-induced (e.g. trimethoprim, sulfasalazine); methotrexate and antiepileptics are excluded below</option>
                <option value="haemolysis">Haemolysis (longer treatment likely; inform GP)</option>
                <option value="malabsorption">Malabsorption including coeliac disease (refer)</option>
                <option value="pregnancy">Pregnancy (refer to GP or midwife)</option>
                <option value="other">Cause unclear (refer)</option>
              </select>
              {causeRequiresReferral && (
                <p className="mt-1 text-xs text-red-700">
                  Excluded under this PGD. Establish the cause of the folate
                  deficiency: where the cause is unclear or suggests
                  malabsorption, refer. Folic acid dosing in pregnancy belongs
                  with the GP or midwife.
                </p>
              )}
              {el.cause === "other" && (
                <div className="mt-3">
                  <TextInput label="Describe the suspected cause (for the referral)" value={el.causeOther} onChange={(v) => updateEligibility("causeOther", v)} />
                </div>
              )}
              {el.cause === "drugs" && (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs text-amber-900">
                    Caution: trimethoprim and sulfonamides reduce the effect of
                    folic acid, which may be serious in megaloblastic anaemia;
                    sulfasalazine reduces its absorption. Name the medicine and
                    inform the GP so the interacting medicine is reviewed.
                  </p>
                  <TextInput label="Interacting medicine" value={el.interactingMedicine} onChange={(v) => updateEligibility("interactingMedicine", v)} placeholder="e.g. trimethoprim 200 mg twice daily" required />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Exclusion criteria (any ticked: do not supply)</p>
              <div className="space-y-2">
                <Checkbox
                  label="Known hypersensitivity to folic acid or to any excipient"
                  checked={state.eligibility.hypersensitivity}
                  onChange={(v) => updateEligibility("hypersensitivity", v)}
                />
                <Checkbox
                  label="Known or suspected malignancy"
                  checked={state.eligibility.malignancy}
                  onChange={(v) => updateEligibility("malignancy", v)}
                  description="Excluded unless folate deficiency has been confirmed and the treating specialist agrees, because folic acid may accelerate the progression of some tumours."
                />
                {state.eligibility.malignancy && (
                  <div className="ml-7">
                    <Checkbox
                      label="Folate deficiency confirmed and the treating specialist agrees to folic acid (documented)"
                      checked={state.eligibility.malignancySpecialistAgrees}
                      onChange={(v) => updateEligibility("malignancySpecialistAgrees", v)}
                    />
                  </div>
                )}
                <Checkbox
                  label="Pregnant or planning pregnancy"
                  checked={state.eligibility.pregnant}
                  onChange={(v) => updateEligibility("pregnant", v)}
                  description="Excluded. Folic acid dosing in pregnancy, including the 5 mg dose for higher risk groups, belongs with the GP or midwife. Refer."
                />
                <Checkbox
                  label="Taking methotrexate, phenytoin, phenobarbital, primidone or another antifolate or antiepileptic where folate supplementation may alter treatment"
                  checked={state.eligibility.antifolateOrAntiepileptic}
                  onChange={(v) => updateEligibility("antifolateOrAntiepileptic", v)}
                  description="Excluded. Refer to the GP."
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Cautions</p>
              <p className="text-xs text-gray-600 mb-2">
                Where anaemia does not correct after a course, refer rather
                than repeating treatment. Interactions: reduced absorption
                with sulfasalazine, cholestyramine and aluminium or magnesium
                antacids; reduced effect with trimethoprim or sulfonamides;
                avoid the combination with fluorouracil. Methotrexate,
                phenytoin, phenobarbital and primidone are exclusions (above).
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 p-3 text-sm text-[color:var(--tenant-primary)]">
              <p className="font-semibold">Folic acid 5mg tablets (POM), one tablet by mouth once daily</p>
              <p className="mt-1">In most people treatment is required for 4 months. Supply up to 4 months, or a shorter supply with planned review. Repeat full blood count and folate at the end of the course, and refer if not resolved. Where the underlying cause persists (for example malabsorption), refer to the GP rather than continuing indefinitely under this PGD. Store below 25°C in the original container, protected from light.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Supply <span className="text-red-400">*</span>
              </label>
              <select
                value={state.treatment.durationMonths}
                onChange={(e) => updateTreatment("durationMonths", e.target.value as typeof state.treatment.durationMonths)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">select</option>
                <option value="4">4 months supply (usual course, maximum under this PGD)</option>
                <option value="shorter">Shorter supply with planned review before further supply</option>
              </select>
            </div>

            <TextArea
              label={state.treatment.durationMonths === "shorter" ? "Reason for the shorter supply and planned review" : "Reason for supply choice"}
              value={state.treatment.durationReason}
              onChange={(v) => updateTreatment("durationReason", v)}
              rows={2}
              placeholder="e.g. dietary cause; expect resolution within 4 months"
              required={state.treatment.durationMonths === "shorter"}
            />

            <div>
              <NumberInput label="Quantity supplied (tablets, one daily)" value={state.treatment.quantityTablets} onChange={(v) => updateTreatment("quantityTablets", v)} min={1} max={MAX_TABLETS} unit="tablets" required />
              <p className="mt-1 text-xs text-gray-500">Folic acid 5 mg once daily: 4 months is {MAX_TABLETS} tablets, the maximum under this PGD.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number of pack supplied"
                value={state.treatment.batchNumber}
                onChange={(v) => updateTreatment("batchNumber", v)}
                required
                placeholder="e.g. AB1234"
              />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Expiry date of pack supplied <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.treatment.expiryDate}
                  onChange={(e) => updateTreatment("expiryDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Review date (repeat full blood count and folate) <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={state.treatment.nextReviewDate}
                onChange={(e) => updateTreatment("nextReviewDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              />
              <p className="mt-1 text-xs text-gray-500">Repeat full blood count and folate at the end of the course (usually 4 months); refer if not resolved. Where anaemia does not correct after a course, refer rather than repeating treatment.</p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Document: supply the PIL together with written dietary advice, and give the follow-up advice below. Tick each item once done; every item is required.</p>
            <Checkbox label="Patient information leaflet (PIL) supplied with the medicine" checked={cs.pilSupplied} onChange={(v) => updateCounselling("pilSupplied", v)} required />
            <Checkbox label="Written dietary advice given" checked={cs.writtenDietaryAdvice} onChange={(v) => updateCounselling("writtenDietaryAdvice", v)} required />
            <Checkbox label="Take one tablet daily for the full course, usually 4 months" checked={cs.fullCourseAdherence} onChange={(v) => updateCounselling("fullCourseAdherence", v)} required />
            <Checkbox label="Good dietary sources of folate discussed: broccoli, Brussels sprouts, asparagus, peas, chickpeas and brown rice" checked={cs.dietarySources} onChange={(v) => updateCounselling("dietarySources", v)} required />
            <Checkbox label={`Attend for a repeat blood test (full blood count and folate) at the end of the course${state.treatment.nextReviewDate ? ` (${state.treatment.nextReviewDate})` : ""}`} checked={cs.repeatBloodTest} onChange={(v) => updateCounselling("repeatBloodTest", v)} required />
            <Checkbox label="Seek medical advice promptly for any new numbness, tingling or unsteadiness" checked={cs.neurologicalWarning} onChange={(v) => updateCounselling("neurologicalWarning", v)} required />
            <Checkbox label="Seek medical advice if symptoms persist or worsen" checked={cs.seekAdviceIfWorse} onChange={(v) => updateCounselling("seekAdviceIfWorse", v)} required />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Counselling given, advice on dietary sources of folate, when to seek review" />
            <Checkbox
              label="GP informed of the supply under this PGD (or referral made)"
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
                Repeat full blood count and folate at the end of the course{state.treatment.nextReviewDate ? ` (${state.treatment.nextReviewDate})` : ""}; refer if not resolved. {PGD_VERSION_LINE}.
              </p>
            </div>
            <PrintedRecord
              title="Folic Acid ePGD Consultation Record"
              pgdLine={PGD_VERSION_LINE}
              rows={[
                ["Patient", `${state.patient.firstName} ${state.patient.lastName}, born ${state.patient.dateOfBirth || "not recorded"}${state.patient.age !== null ? ` (${state.patient.age} years)` : ""}`],
                ["Address", state.patient.address || "Not recorded"],
                ["GP", [state.patient.gpName, state.patient.gpPractice].filter(Boolean).join(", ") || "Not recorded"],
                ["Consent", state.consent.informedConsentGiven ? "Valid informed consent obtained; private service explained" : "Not recorded"],
                ["B12 status checked", `${b12ResultText}; sampled ${el.b12Date || "-"}; ${el.labDevice || "-"}`],
                ["Serum folate", `${el.serumFolateResult || "-"} on ${el.serumFolateDate || "-"}; FBC and film ${el.fbcReviewed ? "reviewed" : "not reviewed"}`],
                ["Cause", `${el.cause || "-"}${el.cause === "other" && el.causeOther ? `: ${el.causeOther}` : ""}${el.cause === "drugs" && el.interactingMedicine ? `: ${el.interactingMedicine}` : ""}`],
                ["Outcome", hasStop ? `NOT SUPPLIED, REFERRED: ${stopReason}` : "Supplied via PGD"],
                ["Medicine", hasStop ? "Not supplied" : `${PRODUCT_NAME}, oral`],
                ["Dose", hasStop ? "Not supplied" : "5 mg once daily"],
                ["Quantity", hasStop ? "Not supplied" : `${tr.quantityTablets ?? "-"} tablets (${tr.durationMonths === "4" ? "4 months" : "shorter supply with planned review"})`],
                ["Batch and expiry", hasStop ? "Not applicable" : `${tr.batchNumber || "-"}, ${tr.expiryDate || "-"}`],
                ["Review", tr.nextReviewDate || "Not recorded"],
                ["Advice given", hasStop ? (el.exclusionAdvice || "Not recorded") : "PIL and written dietary advice supplied; one tablet daily for the full course; dietary sources of folate; repeat blood test at the end of the course; seek advice for numbness, tingling or unsteadiness, or if symptoms persist or worsen"],
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

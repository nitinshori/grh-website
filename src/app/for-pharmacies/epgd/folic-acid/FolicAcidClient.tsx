"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { calculateAge } from "../shared/types"

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "Eligibility & B12 Exclusion",
  "Treatment Plan",
  "Pharmacist Summary",
  "Consultation Complete",
]

export function FolicAcidClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    eligibility: {
      confirmedFolateDeficiency: false,
      serumFolateResult: "",
      serumFolateDate: "",
      // FBC and blood film reviewed; abnormal picture beyond macrocytic
      // anaemia, or unexplained anaemia, is an exclusion (PGD v008).
      fbcReviewed: false,
      abnormalBloodPicture: false,
      // CRITICAL: B12 must be checked before folate replacement. PGD v008:
      // B12 deficiency excluded, OR present and hydroxocobalamin started
      // first or at the same time under PGD 1 of 3. Unknown or untreated is
      // an exclusion.
      b12Status: "" as "" | "excluded" | "treated" | "untreated" | "unknown",
      b12Result: "",
      b12Date: "",
      labDevice: "",
      // Common deficiency causes
      cause: "" as "" | "dietary" | "malabsorption" | "alcohol" | "drugs" | "haemolysis" | "pregnancy" | "other",
      causeOther: "",
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
      nextReviewDate: "",
      batchNumber: "",
      expiryDate: "",
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

  // Age gate per PGD v008: adults aged 18 years and over.
  const patientAge = calculateAge(state.patient.dateOfBirth)
  const patientValid = !state.patient.dateOfBirth || patientAge === null || patientAge >= 18

  // Step 3 (eligibility): folate deficiency confirmed, FBC/film reviewed,
  // B12 status known and safe, cause established, no exclusion ticked.
  const b12Safe = state.eligibility.b12Status === "excluded" || state.eligibility.b12Status === "treated"
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
    state.eligibility.b12Status === "untreated" ||
    state.eligibility.b12Status === "unknown" ||
    causeRequiresReferral
  const eligibilityValid =
    state.eligibility.confirmedFolateDeficiency &&
    !!state.eligibility.serumFolateResult &&
    !!state.eligibility.serumFolateDate &&
    state.eligibility.fbcReviewed &&
    b12Safe &&
    !!state.eligibility.b12Result &&
    !!state.eligibility.labDevice &&
    !!state.eligibility.cause &&
    !exclusionTicked

  const treatmentValid =
    !!state.treatment.durationMonths &&
    !!state.treatment.nextReviewDate &&
    !!state.treatment.batchNumber &&
    !!state.treatment.expiryDate

  const canProceedByStep = [patientValid, true, eligibilityValid, treatmentValid, true, true]
  const canProceed = canProceedByStep[currentStep]

  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName, lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth, nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone, email: state.patient.email, address: state.patient.address,
        gpName: state.patient.gpName, gpPractice: state.patient.gpPractice,
      },
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName, pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate, consultationTime: state.summary.consultationTime,
      },
    }
  }, [state])

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
        validationError={
          !canProceed
            ? currentStep === 0 && !patientValid
              ? "This PGD applies to adults aged 18 years and over"
              : currentStep === 2 && exclusionTicked
                ? "An exclusion criterion applies. Do not supply folic acid under this PGD; refer to the GP and document the advice given."
                : "Please complete all required fields"
            : null
        }
        getConsultationData={getConsultationData}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState((prev) => ({ ...prev, patient: { ...prev.patient, [field]: value } }))}
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
                <option value="excluded">B12 deficiency excluded on testing (total B12 above 350 ng/L or active B12 above 70 pmol/L, or indeterminate result assessed as not deficient with the clinical picture)</option>
                <option value="treated">B12 deficiency present and hydroxocobalamin started first or at the same time under PGD 1 of 3</option>
                <option value="untreated">B12 deficiency present and NOT yet treated</option>
                <option value="unknown">B12 status unknown or not tested</option>
              </select>
              {(state.eligibility.b12Status === "untreated" || state.eligibility.b12Status === "unknown") && (
                <p className="mt-1 text-xs text-red-700">
                  Excluded. Vitamin B12 status unknown, or B12 deficiency
                  present and untreated. Test and treat B12 first (B12
                  Injection PGD), or refer to the GP.
                </p>
              )}
            </div>
            {b12Safe && (
              <div className="grid sm:grid-cols-3 gap-4">
                <TextInput label="B12 result relied on" value={state.eligibility.b12Result} onChange={(v) => updateEligibility("b12Result", v)} placeholder="e.g. 412 ng/L" required />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">B12 test date</label>
                  <input type="date" value={state.eligibility.b12Date} onChange={(e) => updateEligibility("b12Date", e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                </div>
                <TextInput label="Laboratory or device used" value={state.eligibility.labDevice} onChange={(v) => updateEligibility("labDevice", v)} placeholder="e.g. NHS lab via GP" required />
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
              label="Reason for supply choice"
              value={state.treatment.durationReason}
              onChange={(v) => updateTreatment("durationReason", v)}
              rows={2}
              placeholder="e.g. dietary cause; expect resolution within 4 months"
            />

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
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Supply the PIL with written dietary advice. Counsel patient: take
              one tablet daily for the full course, usually 4 months. Good
              dietary sources of folate include broccoli, Brussels sprouts,
              asparagus, peas, chickpeas and brown rice. Attend for a repeat
              blood test at the end of the course
              {state.treatment.nextReviewDate ? ` (${state.treatment.nextReviewDate})` : ""}. Seek medical
              advice if symptoms persist or worsen, and promptly for any new
              numbness, tingling or unsteadiness.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

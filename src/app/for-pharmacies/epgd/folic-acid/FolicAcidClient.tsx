"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"

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
      // CRITICAL: B12 must be checked before folate replacement
      b12Excluded: false,
      b12Result: "",
      b12Date: "",
      // Common deficiency causes
      cause: "" as "" | "dietary" | "malabsorption" | "alcohol" | "drugs" | "haemolysis" | "pregnancy" | "other",
      causeOther: "",
      // Contraindications
      hypersensitivity: false,
      malignancy: false,
      // Cautions
      pregnant: false,
      epilepsy: false,
      methotrexate: false,
    },
    treatment: {
      durationMonths: "" as "" | "4" | "6" | "ongoing",
      durationReason: "",
      nextReviewDate: "",
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
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

  // Step 3 (eligibility) needs B12 excluded + folate deficiency confirmed
  const eligibilityValid =
    state.eligibility.confirmedFolateDeficiency &&
    state.eligibility.b12Excluded &&
    !state.eligibility.hypersensitivity &&
    !state.eligibility.malignancy

  const treatmentValid = !!state.treatment.durationMonths && !!state.treatment.nextReviewDate

  const canProceedByStep = [true, true, eligibilityValid, treatmentValid, true, true]
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
        validationError={!canProceed ? "Please complete all required fields" : null}
        getConsultationData={getConsultationData}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState((prev) => ({ ...prev, patient: { ...prev.patient, [field]: value } }))}
            requireAdult={false}
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
              <p className="font-semibold mb-1">B12 deficiency MUST be excluded first</p>
              <p>
                High-dose folic acid can correct the anaemia of B12 deficiency
                while neurological damage progresses unchecked. ALWAYS check
                B12 levels before initiating folate replacement. If B12 is
                low or indeterminate, treat the B12 deficiency FIRST (see
                B12 Injection PGD).
              </p>
            </div>

            <Checkbox
              label="Serum B12 confirmed in normal range (>180 ng/L total B12, or >25 pmol/L active B12)"
              checked={state.eligibility.b12Excluded}
              onChange={(v) => updateEligibility("b12Excluded", v)}
            />
            {state.eligibility.b12Excluded && (
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Serum B12 result" value={state.eligibility.b12Result} onChange={(v) => updateEligibility("b12Result", v)} placeholder="e.g. 412 ng/L" />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">B12 test date</label>
                  <input type="date" value={state.eligibility.b12Date} onChange={(e) => updateEligibility("b12Date", e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <Checkbox
                label="Documented folate deficiency"
                checked={state.eligibility.confirmedFolateDeficiency}
                onChange={(v) => updateEligibility("confirmedFolateDeficiency", v)}
                description="Serum folate <7 nmol/L confirmed, or 7–10 nmol/L with clinical features."
              />
              {state.eligibility.confirmedFolateDeficiency && (
                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                  <TextInput label="Serum folate result" value={state.eligibility.serumFolateResult} onChange={(v) => updateEligibility("serumFolateResult", v)} placeholder="e.g. 5.2 nmol/L" />
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">Folate test date</label>
                    <input type="date" value={state.eligibility.serumFolateDate} onChange={(e) => updateEligibility("serumFolateDate", e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-navy-900 mb-1">Cause of deficiency</label>
              <select
                value={state.eligibility.cause}
                onChange={(e) => updateEligibility("cause", e.target.value as typeof state.eligibility.cause)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <option value="dietary">Dietary (low intake — vegan / poor diet)</option>
                <option value="malabsorption">Malabsorption (coeliac, IBD, post-bariatric) — also refer to GP</option>
                <option value="alcohol">Excessive alcohol</option>
                <option value="drugs">Drug-induced (methotrexate, phenytoin, trimethoprim) — review with prescriber</option>
                <option value="haemolysis">Chronic haemolysis — REFER TO GP, longer course needed</option>
                <option value="pregnancy">Pregnancy — note 400 mcg is standard prevention; 5 mg only if indicated</option>
                <option value="other">Other / unclear</option>
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Contraindications</p>
              <Checkbox
                label="Known hypersensitivity to folic acid or any excipients"
                checked={state.eligibility.hypersensitivity}
                onChange={(v) => updateEligibility("hypersensitivity", v)}
              />
              <Checkbox
                label="Untreated B12 deficiency (TICK if known low B12 not yet treated)"
                checked={state.eligibility.malignancy}
                onChange={(v) => updateEligibility("malignancy", v)}
                description="ABSOLUTE — treat B12 first via the B12 PGD or refer to GP."
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Cautions</p>
              <Checkbox label="Pregnant" checked={state.eligibility.pregnant} onChange={(v) => updateEligibility("pregnant", v)} description="Folic acid 5 mg only if specifically indicated (epilepsy on AED, sickle cell, previous neural-tube defect). Otherwise 400 mcg is standard." />
              <Checkbox label="On antiepileptic drug (phenytoin, phenobarbital, primidone)" checked={state.eligibility.epilepsy} onChange={(v) => updateEligibility("epilepsy", v)} description="Folate may reduce phenytoin levels — monitor seizure control with GP." />
              <Checkbox label="On methotrexate" checked={state.eligibility.methotrexate} onChange={(v) => updateEligibility("methotrexate", v)} description="Folate is normally co-prescribed with methotrexate — confirm regime with GP." />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 p-3 text-sm text-[color:var(--tenant-primary)]">
              <p className="font-semibold">Folic Acid 5 mg — one tablet by mouth, once daily</p>
              <p className="mt-1">Standard course is 4 months. Patient should be referred back to GP for repeat folate testing 8 weeks after starting treatment, and again at end of course.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Treatment duration <span className="text-red-400">*</span>
              </label>
              <select
                value={state.treatment.durationMonths}
                onChange={(e) => updateTreatment("durationMonths", e.target.value as typeof state.treatment.durationMonths)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <option value="4">4 months — standard</option>
                <option value="6">6 months — slower response / persistent dietary cause</option>
                <option value="ongoing">Ongoing maintenance — chronic haemolysis / malabsorption (refer to GP for long-term plan)</option>
              </select>
            </div>

            <TextArea
              label="Reason for duration choice"
              value={state.treatment.durationReason}
              onChange={(v) => updateTreatment("durationReason", v)}
              rows={2}
              placeholder="e.g. dietary cause; expect resolution within 4 months"
            />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Next folate review date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={state.treatment.nextReviewDate}
                onChange={(e) => updateTreatment("nextReviewDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              />
              <p className="mt-1 text-xs text-gray-500">Recommend follow-up bloods at 8 weeks (early response) and end of course.</p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Counselling given, advice on dietary sources of folate, when to seek review" />
          </div>
        )}

        {currentStep === 5 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Counsel patient: take one tablet daily, ideally same time each
              day. Improvement in fatigue typically within 2–4 weeks. Bloods
              repeat at 8 weeks. Diet advice: green leafy veg, beans, peas,
              chickpeas, fortified cereals, brown rice.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

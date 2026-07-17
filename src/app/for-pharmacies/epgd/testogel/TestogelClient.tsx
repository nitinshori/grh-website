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
  "Diagnosis & Bloods",
  "Eligibility (Exclusions/Cautions)",
  "Dose Plan",
  "Counselling",
  "Pharmacist Summary",
  "Consultation Complete",
]

export function TestogelClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    diagnosis: {
      symptomsConfirmed: false,
      symptomsDetails: "",
      // Two early-morning fasting testosterone results required
      testosterone1Value: "",
      testosterone1Date: "",
      testosterone2Value: "",
      testosterone2Date: "",
      // Baseline TRT panel results
      shbg: "",
      lh: "",
      fsh: "",
      prolactin: "",
      hctBaseline: "",
      psa: "",
      ltf: "",
      lipids: "",
      hba1c: "",
    },
    eligibility: {
      // Hard exclusions
      prostateCancer: false,
      breastCancer: false,
      severeLuts: false,
      polycythaemia: false,
      hypersensitivity: false,
      severeCardiac: false,
      // PGD age range 25–65
      ageUnder25: false,
      ageOver65: false,
      // Cautions
      hypertension: false,
      sleepApnoea: false,
      thrombophilia: false,
      epilepsy: false,
      mildModerateHepatic: false,
      mildModerateRenal: false,
      cancerHypercalcaemia: false,
      partnerPregnantOrChildren: false,
      diabetes: false,
    },
    treatment: {
      product: "" as "" | "testogel-pump" | "testogel-sachet",
      dailyActuations: "" as "" | "1" | "2" | "3" | "4",
      doseChangeReason: "",
      applicationSite: "",
      supplyMonths: "" as "" | "1" | "3",
      nextReviewDate: "",
      annualReviewDate: "",
      productBatch: "",
      productExpiry: "",
    },
    counselling: {
      applicationTechnique: false,
      siteSelection: false,
      transferAvoidance: false,
      handWashing: false,
      ethanolFlammability: false,
      driedBeforeContact: false,
      sideEffectsDiscussed: false,
      monitoringExplained: false,
      annualReviewExplained: false,
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

  function updateDiagnosis<K extends keyof typeof state.diagnosis>(field: K, value: typeof state.diagnosis[K]) {
    setState((prev) => ({ ...prev, diagnosis: { ...prev.diagnosis, [field]: value } }))
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

  // Diagnosis valid: symptoms + 2 morning fasting bloods both below normal
  const diagnosisValid =
    state.diagnosis.symptomsConfirmed &&
    !!state.diagnosis.testosterone1Value &&
    !!state.diagnosis.testosterone2Value

  const e = state.eligibility
  const anyExclusion =
    e.prostateCancer || e.breastCancer || e.severeLuts ||
    e.polycythaemia || e.hypersensitivity || e.severeCardiac ||
    e.ageUnder25 || e.ageOver65
  const eligibilityValid = !anyExclusion

  const treatmentValid =
    !!state.treatment.product &&
    !!state.treatment.dailyActuations &&
    !!state.treatment.applicationSite &&
    !!state.treatment.supplyMonths &&
    !!state.treatment.annualReviewDate &&
    !!state.treatment.productBatch &&
    !!state.treatment.productExpiry

  const counsellingValid =
    state.counselling.applicationTechnique &&
    state.counselling.transferAvoidance &&
    state.counselling.sideEffectsDiscussed &&
    state.counselling.annualReviewExplained

  const canProceedByStep = [true, true, diagnosisValid, eligibilityValid, treatmentValid, counsellingValid, true, true]
  const canProceed = canProceedByStep[currentStep]

  const getConsultationData = useCallback((): ConsultationRecordData | null => ({
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
  }), [state])

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
          <PatientDetailsStep patient={state.patient} onChange={(field, value) => setState((prev) => ({ ...prev, patient: { ...prev.patient, [field]: value } }))} />
        )}

        {currentStep === 1 && (
          <ConsentStep consent={state.consent} onChange={(field, value) => setState((prev) => ({ ...prev, consent: { ...prev.consent, [field]: value } }))} />
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <p className="font-semibold">Diagnosis requires both symptoms AND biochemistry</p>
              <p>Clinical features (low libido, fatigue, ED, decreased muscle mass, reduced morning erections, depressed mood etc) PLUS TWO early-morning fasting total testosterone measurements taken at least 4 weeks apart, both showing low testosterone.</p>
            </div>

            <Checkbox label="Clinical symptoms of testosterone deficiency confirmed" checked={state.diagnosis.symptomsConfirmed} onChange={(v) => updateDiagnosis("symptomsConfirmed", v)} />
            {state.diagnosis.symptomsConfirmed && (
              <TextArea label="Symptom details" value={state.diagnosis.symptomsDetails} onChange={(v) => updateDiagnosis("symptomsDetails", v)} rows={2} placeholder="e.g. low libido, ED, fatigue, low mood for 8 months" />
            )}

            <div className="border-t border-gray-200 pt-4 space-y-4">
              <p className="text-sm font-semibold text-navy-900">Early-morning fasting total testosterone (x2, ≥4 weeks apart)</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Test 1 result (nmol/L)" value={state.diagnosis.testosterone1Value} onChange={(v) => updateDiagnosis("testosterone1Value", v)} placeholder="e.g. 7.2" />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Test 1 date</label>
                  <input type="date" value={state.diagnosis.testosterone1Date} onChange={(ev) => updateDiagnosis("testosterone1Date", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Test 2 result (nmol/L)" value={state.diagnosis.testosterone2Value} onChange={(v) => updateDiagnosis("testosterone2Value", v)} placeholder="e.g. 6.8" />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Test 2 date</label>
                  <input type="date" value={state.diagnosis.testosterone2Date} onChange={(ev) => updateDiagnosis("testosterone2Date", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Baseline TRT panel results</p>
              <p className="text-xs text-gray-600">Record key values. PSA is mandatory if age ≥40. Patients &lt;40 may omit PSA at baseline.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextInput label="SHBG (nmol/L)" value={state.diagnosis.shbg} onChange={(v) => updateDiagnosis("shbg", v)} />
                <TextInput label="LH (IU/L)" value={state.diagnosis.lh} onChange={(v) => updateDiagnosis("lh", v)} />
                <TextInput label="FSH (IU/L)" value={state.diagnosis.fsh} onChange={(v) => updateDiagnosis("fsh", v)} />
                <TextInput label="Prolactin (mIU/L)" value={state.diagnosis.prolactin} onChange={(v) => updateDiagnosis("prolactin", v)} />
                <TextInput label="HCT baseline (%)" value={state.diagnosis.hctBaseline} onChange={(v) => updateDiagnosis("hctBaseline", v)} placeholder="<50% to proceed" />
                <TextInput label={"PSA (ng/mL) " + (state.patient.age !== null && state.patient.age >= 40 ? "(required)" : "(if ≥40)")} value={state.diagnosis.psa} onChange={(v) => updateDiagnosis("psa", v)} />
                <TextInput label="LFTs (ALT IU/L)" value={state.diagnosis.ltf} onChange={(v) => updateDiagnosis("ltf", v)} />
                <TextInput label="Lipid profile (e.g. tot chol mmol/L)" value={state.diagnosis.lipids} onChange={(v) => updateDiagnosis("lipids", v)} />
                <TextInput label="HbA1c (mmol/mol) or fasting glucose" value={state.diagnosis.hba1c} onChange={(v) => updateDiagnosis("hba1c", v)} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Hard exclusions</p>
              <p>If any apply, this PGD cannot proceed. Refer to GP or endocrinology.</p>
            </div>
            <Checkbox label="Age under 25 OR over 65" checked={e.ageUnder25 || e.ageOver65} onChange={(v) => { updateEligibility("ageUnder25", v); updateEligibility("ageOver65", v); }} description="PPH TRT PGD scope is 25–65. Refer outside this range." />
            <Checkbox label="Known or suspected prostate cancer" checked={e.prostateCancer} onChange={(v) => updateEligibility("prostateCancer", v)} description="Includes raised PSA pending workup." />
            <Checkbox label="Known or suspected male breast cancer" checked={e.breastCancer} onChange={(v) => updateEligibility("breastCancer", v)} />
            <Checkbox label="Severe lower urinary tract symptoms (IPSS severe band)" checked={e.severeLuts} onChange={(v) => updateEligibility("severeLuts", v)} />
            <Checkbox label="Polycythaemia (baseline HCT ≥50%)" checked={e.polycythaemia} onChange={(v) => updateEligibility("polycythaemia", v)} />
            <Checkbox label="Known hypersensitivity to testosterone or any excipient" checked={e.hypersensitivity} onChange={(v) => updateEligibility("hypersensitivity", v)} />
            <Checkbox label="Severe cardiac / hepatic / renal insufficiency, ischaemic heart disease, or known congestive heart failure" checked={e.severeCardiac} onChange={(v) => updateEligibility("severeCardiac", v)} />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions</p>
              <Checkbox label="Hypertension (controlled)" checked={e.hypertension} onChange={(v) => updateEligibility("hypertension", v)} description="Monitor BP at each review — testosterone can raise BP." />
              <Checkbox label="Sleep apnoea / risk factors (obesity, chronic respiratory disease)" checked={e.sleepApnoea} onChange={(v) => updateEligibility("sleepApnoea", v)} description="Counsel risk; may be exacerbated." />
              <Checkbox label="Thrombophilia or VTE risk factors" checked={e.thrombophilia} onChange={(v) => updateEligibility("thrombophilia", v)} />
              <Checkbox label="Epilepsy or migraine history" checked={e.epilepsy} onChange={(v) => updateEligibility("epilepsy", v)} description="May be aggravated." />
              <Checkbox label="Mild–moderate hepatic impairment" checked={e.mildModerateHepatic} onChange={(v) => updateEligibility("mildModerateHepatic", v)} />
              <Checkbox label="Mild–moderate renal impairment" checked={e.mildModerateRenal} onChange={(v) => updateEligibility("mildModerateRenal", v)} />
              <Checkbox label="Cancer with risk of hypercalcaemia (bone metastases)" checked={e.cancerHypercalcaemia} onChange={(v) => updateEligibility("cancerHypercalcaemia", v)} description="Monitor calcium; refer to GP." />
              <Checkbox label="Pregnant partner OR young children in household" checked={e.partnerPregnantOrChildren} onChange={(v) => updateEligibility("partnerPregnantOrChildren", v)} description="Strict precautions for gel transfer — counsel below." />
              <Checkbox label="Diabetes (insulin or sulfonylurea)" checked={e.diabetes} onChange={(v) => updateEligibility("diabetes", v)} description="Testosterone may improve insulin sensitivity — may need antidiabetic dose adjustment." />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Product chosen <span className="text-red-400">*</span></label>
              <select value={state.treatment.product} onChange={(ev) => updateTreatment("product", ev.target.value as typeof state.treatment.product)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="testogel-pump">Testogel 16.2 mg/g pump (1 actuation = 20.25 mg, 1.25 g gel)</option>
                <option value="testogel-sachet">Testogel 40.5 mg single-dose sachet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Daily dose (actuations / sachets) <span className="text-red-400">*</span></label>
              <select value={state.treatment.dailyActuations} onChange={(ev) => updateTreatment("dailyActuations", ev.target.value as typeof state.treatment.dailyActuations)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="1">1 actuation = 20.25 mg (half-sachet) — minimum dose</option>
                <option value="2">2 actuations = 40.5 mg (1 sachet) — STARTING DOSE</option>
                <option value="3">3 actuations = 60.75 mg (1.5 sachets) — titrated</option>
                <option value="4">4 actuations = 81 mg (2 sachets) — MAXIMUM</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Therapy should be discontinued if testosterone consistently exceeds normal range on the lowest daily dose, OR if range cannot be achieved on the maximum dose.</p>
            </div>

            <TextArea label="Reason for dose / change" value={state.treatment.doseChangeReason} onChange={(v) => updateTreatment("doseChangeReason", v)} rows={2} placeholder="e.g. initiation at standard 40.5 mg; or titrating up due to inadequate response" />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Application site (counselling) <span className="text-red-400">*</span></label>
              <select value={state.treatment.applicationSite} onChange={(ev) => updateTreatment("applicationSite", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="shoulders">Shoulders (both)</option>
                <option value="upper-arms">Upper arms (both)</option>
                <option value="both">Shoulders AND upper arms (alternate)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">NOT to be applied to genital area (high alcohol content causes local irritation).</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Supply duration <span className="text-red-400">*</span></label>
                <select value={state.treatment.supplyMonths} onChange={(ev) => updateTreatment("supplyMonths", ev.target.value as typeof state.treatment.supplyMonths)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                  <option value="">— select —</option>
                  <option value="1">1 month — initiation / titration phase</option>
                  <option value="3">3 months — stable maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Annual review date <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.annualReviewDate} onChange={(ev) => updateTreatment("annualReviewDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Next consultation date</label>
              <input type="date" value={state.treatment.nextReviewDate} onChange={(ev) => updateTreatment("nextReviewDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              <p className="mt-1 text-xs text-gray-500">Recommended: follow-up bloods at 6–12 weeks after initiation; then every 3–6 months in year 1, then annually.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Product batch number" value={state.treatment.productBatch} onChange={(v) => updateTreatment("productBatch", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Product expiry <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.productExpiry} onChange={(ev) => updateTreatment("productExpiry", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <Checkbox label="Application technique explained (apply to clean, dry, healthy skin; spread thin layer; do not rub in)" checked={state.counselling.applicationTechnique} onChange={(v) => updateCounselling("applicationTechnique", v)} />
            <Checkbox label="Site selection counselled (shoulders / upper arms only — NOT genital area)" checked={state.counselling.siteSelection} onChange={(v) => updateCounselling("siteSelection", v)} />
            <Checkbox label="Transfer-avoidance counselled: wait ≥1 hour before close contact / showering; cover site with clean clothing once dried; wash hands after application" checked={state.counselling.transferAvoidance} onChange={(v) => updateCounselling("transferAvoidance", v)} description="Inadvertent androgenisation in partner / children is a recognised harm. Counsel carefully." />
            <Checkbox label="Hand-washing after application emphasised" checked={state.counselling.handWashing} onChange={(v) => updateCounselling("handWashing", v)} />
            <Checkbox label="Ethanol flammability — keep away from open flame until dried" checked={state.counselling.ethanolFlammability} onChange={(v) => updateCounselling("ethanolFlammability", v)} />
            <Checkbox label="Allow 3–5 min to dry before dressing" checked={state.counselling.driedBeforeContact} onChange={(v) => updateCounselling("driedBeforeContact", v)} />
            <Checkbox label="Side effects discussed: acne/oily skin, gynaecomastia, polycythaemia, fluid retention, reduced fertility" checked={state.counselling.sideEffectsDiscussed} onChange={(v) => updateCounselling("sideEffectsDiscussed", v)} />
            <Checkbox label="Monitoring schedule explained: bloods at 6–12 weeks initially, then every 3–6 months in year 1, then annually. PSA yearly if ≥40." checked={state.counselling.monitoringExplained} onChange={(v) => updateCounselling("monitoringExplained", v)} />
            <Checkbox label="Annual pharmacy review explained — indefinite treatment if response good and bloods OK" checked={state.counselling.annualReviewExplained} onChange={(v) => updateCounselling("annualReviewExplained", v)} />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} />
          </div>
        )}

        {currentStep === 7 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Next review: {state.treatment.nextReviewDate || "to be scheduled"}. Annual pharmacy review: {state.treatment.annualReviewDate || "to be scheduled"}. Counsel patient to bring repeat blood test results to each consultation.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

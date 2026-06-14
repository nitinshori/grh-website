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
  "Patient Details", "Consent", "Diagnosis & Bloods",
  "Eligibility (Exclusions/Cautions)", "Dose Plan", "Counselling",
  "Pharmacist Summary", "Consultation Complete",
]

export function TostranClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    diagnosis: {
      symptomsConfirmed: false, symptomsDetails: "",
      testosterone1Value: "", testosterone1Date: "",
      testosterone2Value: "", testosterone2Date: "",
      shbg: "", lh: "", fsh: "", prolactin: "",
      hctBaseline: "", psa: "", ltf: "", lipids: "", hba1c: "",
    },
    eligibility: {
      prostateCancer: false, breastCancer: false, severeLuts: false,
      polycythaemia: false, hypersensitivity: false, severeCardiac: false,
      ageUnder25: false, ageOver65: false,
      // Tostran-specific exclusion: major risk of non-compliance with
      // safety instructions (severe alcoholism, drug abuse, severe psych)
      majorComplianceRisk: false,
      hypertension: false, sleepApnoea: false, thrombophilia: false,
      epilepsy: false, mildModerateHepatic: false, mildModerateRenal: false,
      cancerHypercalcaemia: false, partnerPregnantOrChildren: false,
      diabetes: false, anticoagulants: false,
    },
    treatment: {
      dailyActuations: "" as "" | "4" | "5" | "6" | "7" | "8",
      doseChangeReason: "",
      applicationSite: "" as "" | "abdomen" | "inner-thighs" | "rotating",
      supplyMonths: "" as "" | "1" | "3",
      nextReviewDate: "",
      annualReviewDate: "",
      productBatch: "",
      productExpiry: "",
    },
    counselling: {
      applicationTechnique: false,
      siteRotation: false,
      transferAvoidance: false,
      handWashing: false,
      waitBeforeBathing: false,
      waitBeforeSex: false,
      sideEffectsDiscussed: false,
      monitoringExplained: false,
      annualReviewExplained: false,
      storageUpright: false,
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

  function updateDiagnosis<K extends keyof typeof state.diagnosis>(field: K, value: typeof state.diagnosis[K]) { setState((prev) => ({ ...prev, diagnosis: { ...prev.diagnosis, [field]: value } })) }
  function updateEligibility<K extends keyof typeof state.eligibility>(field: K, value: typeof state.eligibility[K]) { setState((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } })) }
  function updateTreatment<K extends keyof typeof state.treatment>(field: K, value: typeof state.treatment[K]) { setState((prev) => ({ ...prev, treatment: { ...prev.treatment, [field]: value } })) }
  function updateCounselling<K extends keyof typeof state.counselling>(field: K, value: typeof state.counselling[K]) { setState((prev) => ({ ...prev, counselling: { ...prev.counselling, [field]: value } })) }

  const diagnosisValid = state.diagnosis.symptomsConfirmed && !!state.diagnosis.testosterone1Value && !!state.diagnosis.testosterone2Value
  const e = state.eligibility
  const anyExclusion =
    e.prostateCancer || e.breastCancer || e.severeLuts || e.polycythaemia ||
    e.hypersensitivity || e.severeCardiac || e.ageUnder25 || e.ageOver65 ||
    e.majorComplianceRisk
  const eligibilityValid = !anyExclusion
  const treatmentValid = !!state.treatment.dailyActuations && !!state.treatment.applicationSite && !!state.treatment.supplyMonths && !!state.treatment.annualReviewDate && !!state.treatment.productBatch && !!state.treatment.productExpiry
  const counsellingValid = state.counselling.applicationTechnique && state.counselling.transferAvoidance && state.counselling.sideEffectsDiscussed && state.counselling.annualReviewExplained && state.counselling.storageUpright

  const canProceedByStep = [true, true, diagnosisValid, eligibilityValid, treatmentValid, counsellingValid, true, true]
  const canProceed = canProceedByStep[currentStep]

  const getConsultationData = useCallback((): ConsultationRecordData | null => ({
    patient: { firstName: state.patient.firstName, lastName: state.patient.lastName, dateOfBirth: state.patient.dateOfBirth, nhsNumber: state.patient.nhsNumber, phone: state.patient.phone, email: state.patient.email, address: state.patient.address, gpName: state.patient.gpName, gpPractice: state.patient.gpPractice },
    clinicalData: state as unknown as Record<string, unknown>,
    outcome: "completed",
    summary: { pharmacistName: state.summary.pharmacistName, pharmacistGPhC: state.summary.pharmacistGPhC, consultationDate: state.summary.consultationDate, consultationTime: state.summary.consultationTime },
  }), [state])

  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={STEP_TITLES.length} />
      <StepWrapper title={STEP_TITLES[currentStep]} currentStep={currentStep} totalSteps={STEP_TITLES.length} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={!canProceed ? "Please complete all required fields" : null} getConsultationData={getConsultationData}>
        {currentStep === 0 && <PatientDetailsStep patient={state.patient} onChange={(field, value) => setState((prev) => ({ ...prev, patient: { ...prev.patient, [field]: value } }))} />}
        {currentStep === 1 && <ConsentStep consent={state.consent} onChange={(field, value) => setState((prev) => ({ ...prev, consent: { ...prev.consent, [field]: value } }))} />}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <p className="font-semibold">Diagnosis: clinical symptoms + 2 early-morning fasting bloods (≥4 weeks apart) both showing low testosterone.</p>
            </div>
            <Checkbox label="Clinical symptoms of testosterone deficiency confirmed" checked={state.diagnosis.symptomsConfirmed} onChange={(v) => updateDiagnosis("symptomsConfirmed", v)} />
            {state.diagnosis.symptomsConfirmed && <TextArea label="Symptom details" value={state.diagnosis.symptomsDetails} onChange={(v) => updateDiagnosis("symptomsDetails", v)} rows={2} />}
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <p className="text-sm font-semibold text-navy-900">Early-morning fasting total testosterone</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Test 1 (nmol/L)" value={state.diagnosis.testosterone1Value} onChange={(v) => updateDiagnosis("testosterone1Value", v)} />
                <div><label className="block text-sm font-medium text-navy-900 mb-1">Test 1 date</label><input type="date" value={state.diagnosis.testosterone1Date} onChange={(ev) => updateDiagnosis("testosterone1Date", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Test 2 (nmol/L)" value={state.diagnosis.testosterone2Value} onChange={(v) => updateDiagnosis("testosterone2Value", v)} />
                <div><label className="block text-sm font-medium text-navy-900 mb-1">Test 2 date</label><input type="date" value={state.diagnosis.testosterone2Date} onChange={(ev) => updateDiagnosis("testosterone2Date", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" /></div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Baseline TRT panel</p>
              <p className="text-xs text-gray-600">PSA required if ≥40. Tostran dose-monitoring blood should be taken 2 hours after application.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextInput label="SHBG" value={state.diagnosis.shbg} onChange={(v) => updateDiagnosis("shbg", v)} />
                <TextInput label="LH" value={state.diagnosis.lh} onChange={(v) => updateDiagnosis("lh", v)} />
                <TextInput label="FSH" value={state.diagnosis.fsh} onChange={(v) => updateDiagnosis("fsh", v)} />
                <TextInput label="Prolactin" value={state.diagnosis.prolactin} onChange={(v) => updateDiagnosis("prolactin", v)} />
                <TextInput label="HCT baseline (%)" value={state.diagnosis.hctBaseline} onChange={(v) => updateDiagnosis("hctBaseline", v)} placeholder="<50% to proceed" />
                <TextInput label={"PSA " + (state.patient.age !== null && state.patient.age >= 40 ? "(required)" : "(if ≥40)")} value={state.diagnosis.psa} onChange={(v) => updateDiagnosis("psa", v)} />
                <TextInput label="LFTs (ALT)" value={state.diagnosis.ltf} onChange={(v) => updateDiagnosis("ltf", v)} />
                <TextInput label="Lipids" value={state.diagnosis.lipids} onChange={(v) => updateDiagnosis("lipids", v)} />
                <TextInput label="HbA1c" value={state.diagnosis.hba1c} onChange={(v) => updateDiagnosis("hba1c", v)} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900"><p className="font-semibold">Hard exclusions</p></div>
            <Checkbox label="Age under 25 OR over 65" checked={e.ageUnder25 || e.ageOver65} onChange={(v) => { updateEligibility("ageUnder25", v); updateEligibility("ageOver65", v); }} />
            <Checkbox label="Known or suspected prostate cancer" checked={e.prostateCancer} onChange={(v) => updateEligibility("prostateCancer", v)} />
            <Checkbox label="Known or suspected male breast cancer" checked={e.breastCancer} onChange={(v) => updateEligibility("breastCancer", v)} />
            <Checkbox label="Severe lower urinary tract symptoms" checked={e.severeLuts} onChange={(v) => updateEligibility("severeLuts", v)} />
            <Checkbox label="Polycythaemia (HCT ≥50%)" checked={e.polycythaemia} onChange={(v) => updateEligibility("polycythaemia", v)} />
            <Checkbox label="Known hypersensitivity to testosterone or any excipient" checked={e.hypersensitivity} onChange={(v) => updateEligibility("hypersensitivity", v)} />
            <Checkbox label="Severe cardiac / hepatic / renal insufficiency, IHD or known heart failure" checked={e.severeCardiac} onChange={(v) => updateEligibility("severeCardiac", v)} />
            <Checkbox label="Major risk of non-compliance with safety instructions (severe alcoholism, drug abuse, severe psychiatric disorder)" checked={e.majorComplianceRisk} onChange={(v) => updateEligibility("majorComplianceRisk", v)} description="Tostran-specific exclusion per SmPC." />
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions</p>
              <Checkbox label="Hypertension (controlled)" checked={e.hypertension} onChange={(v) => updateEligibility("hypertension", v)} />
              <Checkbox label="Sleep apnoea / risk factors" checked={e.sleepApnoea} onChange={(v) => updateEligibility("sleepApnoea", v)} />
              <Checkbox label="Thrombophilia / VTE risk" checked={e.thrombophilia} onChange={(v) => updateEligibility("thrombophilia", v)} />
              <Checkbox label="Epilepsy or migraine history" checked={e.epilepsy} onChange={(v) => updateEligibility("epilepsy", v)} />
              <Checkbox label="Mild–moderate hepatic impairment" checked={e.mildModerateHepatic} onChange={(v) => updateEligibility("mildModerateHepatic", v)} />
              <Checkbox label="Mild–moderate renal impairment" checked={e.mildModerateRenal} onChange={(v) => updateEligibility("mildModerateRenal", v)} />
              <Checkbox label="On oral anticoagulants" checked={e.anticoagulants} onChange={(v) => updateEligibility("anticoagulants", v)} description="Close INR monitoring required, especially at start/stop/dose change." />
              <Checkbox label="Cancer with hypercalcaemia risk (bone metastases)" checked={e.cancerHypercalcaemia} onChange={(v) => updateEligibility("cancerHypercalcaemia", v)} />
              <Checkbox label="Pregnant partner or young children in household" checked={e.partnerPregnantOrChildren} onChange={(v) => updateEligibility("partnerPregnantOrChildren", v)} description="Strict transfer-prevention counselling required (see Counselling step)." />
              <Checkbox label="Diabetes (insulin/sulfonylurea)" checked={e.diabetes} onChange={(v) => updateEligibility("diabetes", v)} />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-900">
              <p>1 actuation = 0.5 g gel = 10 mg testosterone. Starting dose 3 g/day (60 mg, 6 actuations).</p>
              <p className="mt-1">Adjust to keep serum testosterone 5–15 µg/L (sample taken 2 h post application, ~14 days after starting):
                <br />· &lt;5 µg/L → increase to 4 g/day (80 mg, 8 actuations)
                <br />· 5–15 µg/L → no change (continue 3 g/day)
                <br />· &gt;15 µg/L → reduce to 2 g/day (40 mg, 4 actuations)
                <br />Maximum 4 g/day (8 actuations).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Daily dose (actuations) <span className="text-red-400">*</span></label>
              <select value={state.treatment.dailyActuations} onChange={(ev) => updateTreatment("dailyActuations", ev.target.value as typeof state.treatment.dailyActuations)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— select —</option>
                <option value="4">4 actuations / 2 g / 40 mg — reduced (serum &gt;15 µg/L)</option>
                <option value="5">5 actuations / 2.5 g / 50 mg</option>
                <option value="6">6 actuations / 3 g / 60 mg — STARTING DOSE</option>
                <option value="7">7 actuations / 3.5 g / 70 mg</option>
                <option value="8">8 actuations / 4 g / 80 mg — MAXIMUM</option>
              </select>
            </div>

            <TextArea label="Reason for dose / change" value={state.treatment.doseChangeReason} onChange={(v) => updateTreatment("doseChangeReason", v)} rows={2} />

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Application site <span className="text-red-400">*</span></label>
              <select value={state.treatment.applicationSite} onChange={(ev) => updateTreatment("applicationSite", ev.target.value as typeof state.treatment.applicationSite)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— select —</option>
                <option value="abdomen">Abdomen (entire dose over ≥10 × 30 cm area)</option>
                <option value="inner-thighs">Both inner thighs (half dose each, ≥10 × 15 cm per thigh)</option>
                <option value="rotating">Rotating daily between abdomen and inner thighs (recommended)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Supply duration <span className="text-red-400">*</span></label>
                <select value={state.treatment.supplyMonths} onChange={(ev) => updateTreatment("supplyMonths", ev.target.value as typeof state.treatment.supplyMonths)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">— select —</option>
                  <option value="1">1 month — initiation / titration</option>
                  <option value="3">3 months — stable maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Annual review date <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.annualReviewDate} onChange={(ev) => updateTreatment("annualReviewDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Next consultation date</label>
              <input type="date" value={state.treatment.nextReviewDate} onChange={(ev) => updateTreatment("nextReviewDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <p className="mt-1 text-xs text-gray-500">Recommended: bloods at 14 days post-initiation (2 h post-application), then every 3–6 months in year 1, then annually.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Canister batch number" value={state.treatment.productBatch} onChange={(v) => updateTreatment("productBatch", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Expiry <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.productExpiry} onChange={(ev) => updateTreatment("productExpiry", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <Checkbox label="Application technique explained (clean, dry, intact skin; rub in gently with one finger until dry)" checked={state.counselling.applicationTechnique} onChange={(v) => updateCounselling("applicationTechnique", v)} />
            <Checkbox label="Daily rotation between abdomen and inner thighs counselled (reduces irritation)" checked={state.counselling.siteRotation} onChange={(v) => updateCounselling("siteRotation", v)} />
            <Checkbox label="Transfer-avoidance counselled: wait ≥2 hours before close contact / shower / bath; cover site with clean clothing once dried; wait ≥4 hours before sexual intercourse" checked={state.counselling.transferAvoidance} onChange={(v) => updateCounselling("transferAvoidance", v)} />
            <Checkbox label="Hand-washing after application emphasised" checked={state.counselling.handWashing} onChange={(v) => updateCounselling("handWashing", v)} />
            <Checkbox label="Wait at least 2 hours before bathing/showering after application" checked={state.counselling.waitBeforeBathing} onChange={(v) => updateCounselling("waitBeforeBathing", v)} />
            <Checkbox label="Wait at least 4 hours between application and sexual intercourse (or shower first)" checked={state.counselling.waitBeforeSex} onChange={(v) => updateCounselling("waitBeforeSex", v)} />
            <Checkbox label="Store canister upright once opened" checked={state.counselling.storageUpright} onChange={(v) => updateCounselling("storageUpright", v)} description="Tostran-specific storage instruction." />
            <Checkbox label="Side effects discussed: acne/oily skin, gynaecomastia, polycythaemia, fluid retention, reduced fertility, application-site reaction" checked={state.counselling.sideEffectsDiscussed} onChange={(v) => updateCounselling("sideEffectsDiscussed", v)} />
            <Checkbox label="Monitoring schedule explained" checked={state.counselling.monitoringExplained} onChange={(v) => updateCounselling("monitoringExplained", v)} />
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
            <p className="text-sm text-green-800 mt-1">Annual review: {state.treatment.annualReviewDate || "to be scheduled"}.</p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

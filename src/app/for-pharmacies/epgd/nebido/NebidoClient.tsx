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
  "Eligibility (Exclusions/Cautions)", "Administration",
  "Post-Injection Observation", "Pharmacist Summary", "Consultation Complete",
]

export function NebidoClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    diagnosis: {
      symptomsConfirmed: false, symptomsDetails: "",
      testosterone1Value: "", testosterone1Date: "",
      testosterone2Value: "", testosterone2Date: "",
      troughTestosterone: "",
      hctBaseline: "", psa: "", ltf: "",
    },
    eligibility: {
      prostateCancer: false,
      breastCancer: false,
      liverTumour: false,
      severeLuts: false,
      polycythaemia: false,
      hypersensitivity: false,
      severeCardiac: false,
      ageUnder25: false,
      ageOver65: false,
      bleedingDisorder: false,
      hypertension: false,
      sleepApnoea: false,
      thrombophilia: false,
      epilepsy: false,
      diabetes: false,
      anticoagulants: false,
      cancerHypercalcaemia: false,
      previousMI: false,
      sglt2Inhibitor: false,
    },
    administration: {
      dosePhase: "" as "" | "loading-1" | "loading-2" | "maintenance",
      injectionSite: "" as "" | "left-glute" | "right-glute",
      batchNumber: "",
      expiryDate: "",
      administeredAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      injectedSlowly: false,
      nextInjectionDate: "",
      annualReviewDate: "",
    },
    postObs: {
      observationMinutes: "" as "" | "15" | "20" | "30",
      patientWell: false,
      pulmonaryEmbolismSigns: false,
      pulmonaryEmbolismDetails: "",
      anaphylacticSigns: false,
      anyAdverseReaction: false,
      adverseReactionDetails: "",
      injectionSiteReaction: false,
      yellowCardDiscussed: false,
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
  function updateAdmin<K extends keyof typeof state.administration>(field: K, value: typeof state.administration[K]) { setState((prev) => ({ ...prev, administration: { ...prev.administration, [field]: value } })) }
  function updatePostObs<K extends keyof typeof state.postObs>(field: K, value: typeof state.postObs[K]) { setState((prev) => ({ ...prev, postObs: { ...prev.postObs, [field]: value } })) }

  const diagnosisValid = state.diagnosis.symptomsConfirmed && !!state.diagnosis.testosterone1Value && !!state.diagnosis.testosterone2Value

  const e = state.eligibility
  const anyExclusion =
    e.prostateCancer || e.breastCancer || e.liverTumour ||
    e.severeLuts || e.polycythaemia || e.hypersensitivity ||
    e.severeCardiac || e.ageUnder25 || e.ageOver65 || e.bleedingDisorder
  const eligibilityValid = !anyExclusion

  const adminValid = !!state.administration.dosePhase && !!state.administration.injectionSite && !!state.administration.batchNumber && !!state.administration.expiryDate && !!state.administration.nextInjectionDate && !!state.administration.annualReviewDate && state.administration.injectedSlowly

  const postObsValid = !!state.postObs.observationMinutes && state.postObs.patientWell && !state.postObs.pulmonaryEmbolismSigns && !state.postObs.anaphylacticSigns

  const canProceedByStep = [true, true, diagnosisValid, eligibilityValid, adminValid, postObsValid, true, true]
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
              <p className="font-semibold">Diagnosis (initial): symptoms + 2 early-morning fasting bloods ≥4 weeks apart.</p>
              <p>For maintenance refills: record trough testosterone at end of injection interval — aim for LOWER THIRD of normal range. Below normal → shorten interval; above normal → extend interval.</p>
            </div>
            <Checkbox label="Clinical symptoms of testosterone deficiency confirmed" checked={state.diagnosis.symptomsConfirmed} onChange={(v) => updateDiagnosis("symptomsConfirmed", v)} />
            {state.diagnosis.symptomsConfirmed && <TextArea label="Symptom details" value={state.diagnosis.symptomsDetails} onChange={(v) => updateDiagnosis("symptomsDetails", v)} rows={2} />}
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Test 1 (nmol/L)" value={state.diagnosis.testosterone1Value} onChange={(v) => updateDiagnosis("testosterone1Value", v)} />
              <div><label className="block text-sm font-medium text-navy-900 mb-1">Test 1 date</label><input type="date" value={state.diagnosis.testosterone1Date} onChange={(ev) => updateDiagnosis("testosterone1Date", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Test 2 (nmol/L)" value={state.diagnosis.testosterone2Value} onChange={(v) => updateDiagnosis("testosterone2Value", v)} />
              <div><label className="block text-sm font-medium text-navy-900 mb-1">Test 2 date</label><input type="date" value={state.diagnosis.testosterone2Date} onChange={(ev) => updateDiagnosis("testosterone2Date", ev.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" /></div>
            </div>

            <TextInput label="Trough testosterone (for maintenance refill — nmol/L)" value={state.diagnosis.troughTestosterone} onChange={(v) => updateDiagnosis("troughTestosterone", v)} placeholder="Sample taken at end of last injection interval" />

            <div className="grid sm:grid-cols-3 gap-3">
              <TextInput label="HCT (%)" value={state.diagnosis.hctBaseline} onChange={(v) => updateDiagnosis("hctBaseline", v)} placeholder="<50% to proceed" />
              <TextInput label={"PSA " + (state.patient.age !== null && state.patient.age >= 40 ? "(required)" : "(if ≥40)")} value={state.diagnosis.psa} onChange={(v) => updateDiagnosis("psa", v)} />
              <TextInput label="LFTs (ALT)" value={state.diagnosis.ltf} onChange={(v) => updateDiagnosis("ltf", v)} />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900"><p className="font-semibold">Hard exclusions</p></div>
            <Checkbox label="Age under 25 OR over 65" checked={e.ageUnder25 || e.ageOver65} onChange={(v) => { updateEligibility("ageUnder25", v); updateEligibility("ageOver65", v); }} />
            <Checkbox label="Past or present liver tumour" checked={e.liverTumour} onChange={(v) => updateEligibility("liverTumour", v)} description="Specific to Nebido — testosterone undecanoate is metabolised via liver." />
            <Checkbox label="Known or suspected prostate cancer" checked={e.prostateCancer} onChange={(v) => updateEligibility("prostateCancer", v)} />
            <Checkbox label="Known or suspected male breast cancer" checked={e.breastCancer} onChange={(v) => updateEligibility("breastCancer", v)} />
            <Checkbox label="Severe LUTS" checked={e.severeLuts} onChange={(v) => updateEligibility("severeLuts", v)} />
            <Checkbox label="Polycythaemia (HCT ≥50%)" checked={e.polycythaemia} onChange={(v) => updateEligibility("polycythaemia", v)} />
            <Checkbox label="Known hypersensitivity to testosterone undecanoate or castor oil/benzyl benzoate excipients" checked={e.hypersensitivity} onChange={(v) => updateEligibility("hypersensitivity", v)} />
            <Checkbox label="Severe cardiac / hepatic / renal insufficiency, IHD, heart failure" checked={e.severeCardiac} onChange={(v) => updateEligibility("severeCardiac", v)} />
            <Checkbox label="Acquired or inherited bleeding disorder" checked={e.bleedingDisorder} onChange={(v) => updateEligibility("bleedingDisorder", v)} />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions</p>
              <Checkbox label="Hypertension (controlled)" checked={e.hypertension} onChange={(v) => updateEligibility("hypertension", v)} />
              <Checkbox label="Sleep apnoea / risk factors" checked={e.sleepApnoea} onChange={(v) => updateEligibility("sleepApnoea", v)} />
              <Checkbox label="Thrombophilia / VTE risk" checked={e.thrombophilia} onChange={(v) => updateEligibility("thrombophilia", v)} />
              <Checkbox label="Epilepsy or migraine history" checked={e.epilepsy} onChange={(v) => updateEligibility("epilepsy", v)} />
              <Checkbox label="Diabetes (insulin/sulfonylurea)" checked={e.diabetes} onChange={(v) => updateEligibility("diabetes", v)} description="May improve insulin sensitivity — hypoglycaemic dose review needed." />
              <Checkbox label="On oral anticoagulants" checked={e.anticoagulants} onChange={(v) => updateEligibility("anticoagulants", v)} description="Close INR monitoring." />
              <Checkbox label="On SGLT-2 inhibitor (dapagliflozin, empagliflozin, etc)" checked={e.sglt2Inhibitor} onChange={(v) => updateEligibility("sglt2Inhibitor", v)} description="Combined risk of erythrocytosis — monitor HCT/Hb more frequently." />
              <Checkbox label="Cancer with hypercalcaemia risk (bone metastases)" checked={e.cancerHypercalcaemia} onChange={(v) => updateEligibility("cancerHypercalcaemia", v)} />
              <Checkbox label="Previous MI or cardiovascular event" checked={e.previousMI} onChange={(v) => updateEligibility("previousMI", v)} />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-900">
              <p className="font-semibold">Nebido schedule</p>
              <p>• Loading: 1st dose, then 2nd dose 6 weeks later.<br />• Maintenance: every 10–14 weeks (adjust based on trough testosterone).<br />Inject VERY SLOWLY over ≥2 minutes — risk of pulmonary oily microembolism AND anaphylactic-type reactions.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose phase <span className="text-red-400">*</span></label>
              <select value={state.administration.dosePhase} onChange={(ev) => updateAdmin("dosePhase", ev.target.value as typeof state.administration.dosePhase)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="loading-1">Loading dose 1 — initiation</option>
                <option value="loading-2">Loading dose 2 — 6 weeks after loading 1</option>
                <option value="maintenance">Maintenance refill (every 10–14 weeks)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Injection site (deep IM gluteal) <span className="text-red-400">*</span></label>
              <select value={state.administration.injectionSite} onChange={(ev) => updateAdmin("injectionSite", ev.target.value as typeof state.administration.injectionSite)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="left-glute">Left gluteus (ventrogluteal preferred)</option>
                <option value="right-glute">Right gluteus (ventrogluteal preferred)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Ampoule batch number" value={state.administration.batchNumber} onChange={(v) => updateAdmin("batchNumber", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Expiry <span className="text-red-400">*</span></label>
                <input type="date" value={state.administration.expiryDate} onChange={(ev) => updateAdmin("expiryDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <TextInput label="Time administered" value={state.administration.administeredAt} onChange={(v) => updateAdmin("administeredAt", v)} />

            <Checkbox label="Injection administered VERY SLOWLY (≥2 minutes total) to minimise risk of POME" checked={state.administration.injectedSlowly} onChange={(v) => updateAdmin("injectedSlowly", v)} description="REQUIRED — slow injection is the key safety step." />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Next injection due <span className="text-red-400">*</span></label>
                <input type="date" value={state.administration.nextInjectionDate} onChange={(ev) => updateAdmin("nextInjectionDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
                <p className="mt-1 text-xs text-gray-500">Loading 2: 6 weeks. Maintenance: 10–14 weeks.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Annual review date <span className="text-red-400">*</span></label>
                <input type="date" value={state.administration.annualReviewDate} onChange={(ev) => updateAdmin("annualReviewDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">POME + anaphylactic reactions</p>
              <p>Pulmonary oily microembolism: cough, dyspnoea, chest pain, sweating, dizziness, paraesthesia, syncope. Anaphylactic-type reactions also reported with Nebido specifically. Observe carefully.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Observation period <span className="text-red-400">*</span></label>
              <select value={state.postObs.observationMinutes} onChange={(ev) => updatePostObs("observationMinutes", ev.target.value as typeof state.postObs.observationMinutes)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="15">15 minutes (standard maintenance)</option>
                <option value="20">20 minutes (atopic / first dose)</option>
                <option value="30">30 minutes (loading 1)</option>
              </select>
            </div>

            <Checkbox label="Patient well at end of observation (no POME / no anaphylactic signs)" checked={state.postObs.patientWell} onChange={(v) => updatePostObs("patientWell", v)} />
            <Checkbox label="POME signs (cough, dyspnoea, chest pain, sweating, dizziness)" checked={state.postObs.pulmonaryEmbolismSigns} onChange={(v) => updatePostObs("pulmonaryEmbolismSigns", v)} description="If ticked, manage acutely — supplemental O₂, observe further, escalate if severe." />
            {state.postObs.pulmonaryEmbolismSigns && <TextArea label="POME details" value={state.postObs.pulmonaryEmbolismDetails} onChange={(v) => updatePostObs("pulmonaryEmbolismDetails", v)} rows={3} />}

            <Checkbox label="Anaphylactic-type signs (rash, swelling, breathing difficulty, hypotension)" checked={state.postObs.anaphylacticSigns} onChange={(v) => updatePostObs("anaphylacticSigns", v)} description="If ticked, manage as anaphylaxis (IM adrenaline) and escalate. Stop Nebido permanently." />

            <Checkbox label="Injection-site reaction (mild)" checked={state.postObs.injectionSiteReaction} onChange={(v) => updatePostObs("injectionSiteReaction", v)} />
            <Checkbox label="Any other adverse reaction" checked={state.postObs.anyAdverseReaction} onChange={(v) => updatePostObs("anyAdverseReaction", v)} />
            {state.postObs.anyAdverseReaction && <TextArea label="Details" value={state.postObs.adverseReactionDetails} onChange={(v) => updatePostObs("adverseReactionDetails", v)} rows={2} />}
            <Checkbox label="Yellow Card discussed" checked={state.postObs.yellowCardDiscussed} onChange={(v) => updatePostObs("yellowCardDiscussed", v)} />
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
            <p className="text-sm text-green-800 mt-1">Next injection: {state.administration.nextInjectionDate}. Annual review: {state.administration.annualReviewDate}.</p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

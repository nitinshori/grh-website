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

export function SustanonClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    diagnosis: {
      symptomsConfirmed: false, symptomsDetails: "",
      testosterone1Value: "", testosterone1Date: "",
      testosterone2Value: "", testosterone2Date: "",
      hctBaseline: "", psa: "", ltf: "",
    },
    eligibility: {
      // CRITICAL exclusions
      peanutOrSoyaAllergy: false,
      prostateCancer: false,
      breastCancer: false,
      severeLuts: false,
      polycythaemia: false,
      hypersensitivity: false,
      severeCardiac: false,
      ageUnder25: false,
      ageOver65: false,
      bleedingDisorder: false,
      // Cautions
      hypertension: false,
      sleepApnoea: false,
      thrombophilia: false,
      epilepsy: false,
      diabetes: false,
      anticoagulants: false,
      cancerHypercalcaemia: false,
      previousMI: false,
    },
    administration: {
      doseNumber: "" as "" | "1" | "2-12" | "13plus",
      injectionSite: "" as "" | "left-glute" | "right-glute" | "left-thigh" | "right-thigh",
      batchNumber: "",
      expiryDate: "",
      administeredAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      injectedSlowly: false,
      ampoulesSupplied: "" as "" | "1" | "4",
      nextInjectionDate: "",
      annualReviewDate: "",
    },
    postObs: {
      observationMinutes: "" as "" | "10" | "15" | "20",
      patientWell: false,
      pulmonaryEmbolismSigns: false,
      pulmonaryEmbolismDetails: "",
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
    e.peanutOrSoyaAllergy || e.prostateCancer || e.breastCancer || e.severeLuts ||
    e.polycythaemia || e.hypersensitivity || e.severeCardiac ||
    e.ageUnder25 || e.ageOver65 || e.bleedingDisorder
  const eligibilityValid = !anyExclusion

  const adminValid = !!state.administration.doseNumber && !!state.administration.injectionSite && !!state.administration.batchNumber && !!state.administration.expiryDate && !!state.administration.ampoulesSupplied && !!state.administration.nextInjectionDate && !!state.administration.annualReviewDate && state.administration.injectedSlowly

  const postObsValid = !!state.postObs.observationMinutes && state.postObs.patientWell && !state.postObs.pulmonaryEmbolismSigns

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
              <p className="font-semibold">Diagnosis: symptoms + 2 early-morning fasting bloods (≥4 weeks apart) both showing low testosterone.</p>
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
            <div className="grid sm:grid-cols-3 gap-3">
              <TextInput label="HCT baseline (%)" value={state.diagnosis.hctBaseline} onChange={(v) => updateDiagnosis("hctBaseline", v)} placeholder="<50%" />
              <TextInput label={"PSA " + (state.patient.age !== null && state.patient.age >= 40 ? "(required)" : "(if ≥40)")} value={state.diagnosis.psa} onChange={(v) => updateDiagnosis("psa", v)} />
              <TextInput label="LFTs (ALT)" value={state.diagnosis.ltf} onChange={(v) => updateDiagnosis("ltf", v)} />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Hard exclusions</p>
              <p>Sustanon contains <strong>arachis (peanut) oil</strong> — contraindicated in peanut and soya allergy.</p>
            </div>
            <Checkbox label="PEANUT or SOYA allergy" checked={e.peanutOrSoyaAllergy} onChange={(v) => updateEligibility("peanutOrSoyaAllergy", v)} description="ABSOLUTE contraindication. Refer to GP or switch to Testogel / Tostran / Nebido." />
            <Checkbox label="Age under 25 OR over 65" checked={e.ageUnder25 || e.ageOver65} onChange={(v) => { updateEligibility("ageUnder25", v); updateEligibility("ageOver65", v); }} />
            <Checkbox label="Known or suspected prostate cancer" checked={e.prostateCancer} onChange={(v) => updateEligibility("prostateCancer", v)} />
            <Checkbox label="Known or suspected male breast cancer" checked={e.breastCancer} onChange={(v) => updateEligibility("breastCancer", v)} />
            <Checkbox label="Severe LUTS (IPSS severe)" checked={e.severeLuts} onChange={(v) => updateEligibility("severeLuts", v)} />
            <Checkbox label="Polycythaemia (HCT ≥50%)" checked={e.polycythaemia} onChange={(v) => updateEligibility("polycythaemia", v)} />
            <Checkbox label="Known hypersensitivity to testosterone esters or excipients" checked={e.hypersensitivity} onChange={(v) => updateEligibility("hypersensitivity", v)} />
            <Checkbox label="Severe cardiac / hepatic / renal insufficiency, IHD, heart failure" checked={e.severeCardiac} onChange={(v) => updateEligibility("severeCardiac", v)} />
            <Checkbox label="Acquired or inherited bleeding disorder" checked={e.bleedingDisorder} onChange={(v) => updateEligibility("bleedingDisorder", v)} description="IM injection contraindicated in significant bleeding tendency." />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions</p>
              <Checkbox label="Hypertension (controlled)" checked={e.hypertension} onChange={(v) => updateEligibility("hypertension", v)} />
              <Checkbox label="Sleep apnoea / risk factors" checked={e.sleepApnoea} onChange={(v) => updateEligibility("sleepApnoea", v)} />
              <Checkbox label="Thrombophilia / VTE risk" checked={e.thrombophilia} onChange={(v) => updateEligibility("thrombophilia", v)} />
              <Checkbox label="Epilepsy or migraine history" checked={e.epilepsy} onChange={(v) => updateEligibility("epilepsy", v)} />
              <Checkbox label="Diabetes (insulin/sulfonylurea)" checked={e.diabetes} onChange={(v) => updateEligibility("diabetes", v)} />
              <Checkbox label="On oral anticoagulants (coumarin)" checked={e.anticoagulants} onChange={(v) => updateEligibility("anticoagulants", v)} description="Close INR monitoring; consider dose reduction of anticoagulant." />
              <Checkbox label="Cancer with hypercalcaemia risk" checked={e.cancerHypercalcaemia} onChange={(v) => updateEligibility("cancerHypercalcaemia", v)} />
              <Checkbox label="Previous MI / cardiovascular event" checked={e.previousMI} onChange={(v) => updateEligibility("previousMI", v)} description="Monitor; stop if cardiac symptoms recur or deteriorate." />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-900">
              <p className="font-semibold">Standard regime: 1 mL deep IM every 3 weeks</p>
              <p>Adjust based on individual response and serum trough levels. Sample taken just BEFORE next due dose. Inject VERY SLOWLY to minimise risk of pulmonary oily microembolism (POME).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose number at this consultation <span className="text-red-400">*</span></label>
              <select value={state.administration.doseNumber} onChange={(ev) => updateAdmin("doseNumber", ev.target.value as typeof state.administration.doseNumber)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="1">1st injection (initiation)</option>
                <option value="2-12">2nd–12th injection (first year)</option>
                <option value="13plus">13th+ injection (stable maintenance)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Injection site (deep IM) <span className="text-red-400">*</span></label>
              <select value={state.administration.injectionSite} onChange={(ev) => updateAdmin("injectionSite", ev.target.value as typeof state.administration.injectionSite)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="left-glute">Left gluteus (ventrogluteal preferred)</option>
                <option value="right-glute">Right gluteus (ventrogluteal preferred)</option>
                <option value="left-thigh">Left vastus lateralis (thigh)</option>
                <option value="right-thigh">Right vastus lateralis (thigh)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Ampoule batch number" value={state.administration.batchNumber} onChange={(v) => updateAdmin("batchNumber", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Expiry <span className="text-red-400">*</span></label>
                <input type="date" value={state.administration.expiryDate} onChange={(ev) => updateAdmin("expiryDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <TextInput label="Time administered" value={state.administration.administeredAt} onChange={(v) => updateAdmin("administeredAt", v)} placeholder="HH:MM" />

            <Checkbox label="Injection administered SLOWLY (≥1 minute) to minimise risk of pulmonary oily microembolism" checked={state.administration.injectedSlowly} onChange={(v) => updateAdmin("injectedSlowly", v)} description="REQUIRED — slow injection is the key safety step." />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Ampoules supplied today <span className="text-red-400">*</span></label>
                <select value={state.administration.ampoulesSupplied} onChange={(ev) => updateAdmin("ampoulesSupplied", ev.target.value as typeof state.administration.ampoulesSupplied)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                  <option value="">— select —</option>
                  <option value="1">1 — single injection (administered now)</option>
                  <option value="4">4 — 3 months (1 injected, 3 dispensed for return appointments)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Next injection due <span className="text-red-400">*</span></label>
                <input type="date" value={state.administration.nextInjectionDate} onChange={(ev) => updateAdmin("nextInjectionDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Annual review date <span className="text-red-400">*</span></label>
              <input type="date" value={state.administration.annualReviewDate} onChange={(ev) => updateAdmin("annualReviewDate", ev.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Pulmonary oily microembolism (POME)</p>
              <p>Rare but serious. Symptoms occur during or immediately after injection: cough, dyspnoea, malaise, hyperhidrosis, chest pain, dizziness, paraesthesia, syncope. Usually reversible — supportive treatment.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Observation period <span className="text-red-400">*</span></label>
              <select value={state.postObs.observationMinutes} onChange={(ev) => updatePostObs("observationMinutes", ev.target.value as typeof state.postObs.observationMinutes)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="10">10 minutes (minimum)</option>
                <option value="15">15 minutes (standard)</option>
                <option value="20">20 minutes (first injection / atopic patient)</option>
              </select>
            </div>

            <Checkbox label="Patient well at end of observation (no signs of POME)" checked={state.postObs.patientWell} onChange={(v) => updatePostObs("patientWell", v)} />
            <Checkbox label="ANY signs of pulmonary microembolism observed?" checked={state.postObs.pulmonaryEmbolismSigns} onChange={(v) => updatePostObs("pulmonaryEmbolismSigns", v)} description="If ticked, treatment cannot proceed today. Manage acutely and follow up." />
            {state.postObs.pulmonaryEmbolismSigns && <TextArea label="POME details (timing, symptoms, action taken)" value={state.postObs.pulmonaryEmbolismDetails} onChange={(v) => updatePostObs("pulmonaryEmbolismDetails", v)} rows={3} />}

            <Checkbox label="Local injection-site reaction (mild)" checked={state.postObs.injectionSiteReaction} onChange={(v) => updatePostObs("injectionSiteReaction", v)} description="Common, usually self-limiting." />

            <Checkbox label="Any other adverse reaction" checked={state.postObs.anyAdverseReaction} onChange={(v) => updatePostObs("anyAdverseReaction", v)} />
            {state.postObs.anyAdverseReaction && <TextArea label="Adverse reaction details" value={state.postObs.adverseReactionDetails} onChange={(v) => updatePostObs("adverseReactionDetails", v)} rows={2} />}

            <Checkbox label="Yellow Card reporting discussed with patient" checked={state.postObs.yellowCardDiscussed} onChange={(v) => updatePostObs("yellowCardDiscussed", v)} />
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

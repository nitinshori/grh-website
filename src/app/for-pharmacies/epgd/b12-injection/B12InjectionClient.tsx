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
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    eligibility: {
      // Indication
      confirmedDeficiency: false,
      deficiencySource: "" as "" | "labs" | "established" | "post-bariatric" | "dietary",
      labB12Result: "",
      labDate: "",
      // Symptoms
      hasSymptoms: false,
      symptoms: "",
      neuroSymptoms: false,
      // Contraindications
      anyHypersensitivity: false,
      hypersensitivityDetails: "",
      lhonHistory: false,
      // Cautions
      pregnant: false,
      breastfeeding: false,
      anticoagulants: false,
      // Drug interactions / additional cautions (per CKS)
      onChloramphenicol: false,
      onOralContraceptives: false,
    },
    treatment: {
      regime: "" as "" | "loading" | "maintenance" | "oral-tablets",
      doseNumber: "" as "" | "1" | "2" | "3" | "4" | "5" | "6",
      nextDueDate: "",
      // Diet-related maintenance: cyanocobalamin tablets 50–150 mcg daily
      // OR 6-monthly hydroxocobalamin 1 mg IM.
      maintenanceInterval: "" as "" | "8-weeks" | "12-weeks" | "26-weeks-diet-related",
      // Diet-related vs not-diet-related pathway
      maintenancePathway: "" as "" | "not-diet-related" | "diet-related",
    },
    administration: {
      batchNumber: "",
      expiryDate: "",
      injectionSite: "" as "" | "left-deltoid" | "right-deltoid" | "left-gluteus" | "right-gluteus" | "left-thigh" | "right-thigh",
      administeredAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      postObsMinutes: "" as "" | "5" | "10" | "15",
      patientWell: false,
      adverseReaction: false,
      adverseReactionDetails: "",
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
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

  // Eligibility logic — blocks if any contraindication ticked, requires
  // documented deficiency basis.
  const eligibilityValid =
    state.eligibility.confirmedDeficiency &&
    !!state.eligibility.deficiencySource &&
    !state.eligibility.anyHypersensitivity &&
    !state.eligibility.lhonHistory

  // Treatment plan needs a regime + dose-number choice
  const treatmentValid =
    !!state.treatment.regime &&
    (state.treatment.regime === "maintenance"
      ? !!state.treatment.maintenanceInterval
      : !!state.treatment.doseNumber) &&
    !!state.treatment.nextDueDate

  // Administration needs batch/expiry/site + post-obs check
  const adminValid =
    !!state.administration.batchNumber &&
    !!state.administration.expiryDate &&
    !!state.administration.injectionSite &&
    !!state.administration.postObsMinutes &&
    state.administration.patientWell

  // Age gate per signed PGD — adults 18+ (consistency review Jul 2026)
  const patientAge = calculateAge(state.patient.dateOfBirth)
  const patientValid = !state.patient.dateOfBirth || patientAge === null || patientAge >= 18

  const canProceedByStep = [patientValid, true, eligibilityValid, treatmentValid, adminValid, true, true]
  const canProceed = canProceedByStep[currentStep]

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
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    }
  }, [state])

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
        validationError={
          !canProceed
            ? currentStep === 0 && !patientValid
              ? "This PGD applies to adults aged 18 years and over"
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">Confirmed B12 deficiency required</p>
              <p>
                This PGD is for patients with established B12 deficiency
                (laboratory-confirmed, or established maintenance therapy after
                bariatric surgery / atrophic gastritis / dietary). Patients
                presenting only with unconfirmed symptoms (fatigue,
                paraesthesia, etc) should be referred to their GP for
                diagnostic workup rather than treated under this PGD.
              </p>
            </div>

            <Checkbox
              label="Documented B12 deficiency confirmed"
              checked={state.eligibility.confirmedDeficiency}
              onChange={(v) => updateEligibility("confirmedDeficiency", v)}
              description="Tick to continue. If unconfirmed, refer to GP."
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
                  <option value="labs">Laboratory-confirmed (low serum B12 ± raised MMA / low holoTC)</option>
                  <option value="established">Established maintenance — existing patient continuing therapy</option>
                  <option value="post-bariatric">Post-bariatric surgery (lifelong replacement indicated)</option>
                  <option value="dietary">Long-term strict vegan / vegetarian + confirmed deficiency</option>
                </select>
              </div>
            )}

            {state.eligibility.deficiencySource === "labs" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput
                  label="Serum B12 result (ng/L or pmol/L)"
                  value={state.eligibility.labB12Result}
                  onChange={(v) => updateEligibility("labB12Result", v)}
                  placeholder="e.g. 142 ng/L"
                />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Test date</label>
                  <input
                    type="date"
                    value={state.eligibility.labDate}
                    onChange={(e) => updateEligibility("labDate", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Contraindications</p>
              <div className="space-y-2">
                <Checkbox
                  label="Known hypersensitivity to hydroxocobalamin or any cobalamin"
                  checked={state.eligibility.anyHypersensitivity}
                  onChange={(v) => updateEligibility("anyHypersensitivity", v)}
                />
                {state.eligibility.anyHypersensitivity && (
                  <p className="text-xs text-red-700 ml-7">
                    Hypersensitivity is an absolute contraindication. Do not
                    administer. Refer to GP.
                  </p>
                )}
                <Checkbox
                  label="History of Leber's hereditary optic neuropathy (LHON)"
                  checked={state.eligibility.lhonHistory}
                  onChange={(v) => updateEligibility("lhonHistory", v)}
                />
                {state.eligibility.lhonHistory && (
                  <p className="text-xs text-red-700 ml-7">
                    Hydroxocobalamin contraindicated in LHON — refer to GP for
                    alternative.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Cautions</p>
              <div className="space-y-2">
                <Checkbox
                  label="Patient is pregnant"
                  checked={state.eligibility.pregnant}
                  onChange={(v) => updateEligibility("pregnant", v)}
                  description="Per NICE CKS: hydroxocobalamin CAN be used in pregnancy to correct an established B12 deficiency. SmPC restriction relates to megaloblastic anaemia of pregnancy specifically — refer if that's the indication."
                />
                <Checkbox
                  label="Patient is breastfeeding"
                  checked={state.eligibility.breastfeeding}
                  onChange={(v) => updateEligibility("breastfeeding", v)}
                  description="Compatible with breastfeeding — hydroxocobalamin is excreted in breast milk but is unlikely to be harmful."
                />
                <Checkbox
                  label="Patient takes oral anticoagulants"
                  checked={state.eligibility.anticoagulants}
                  onChange={(v) => updateEligibility("anticoagulants", v)}
                  description="Apply pressure to injection site for ≥2 min post-injection."
                />
                <Checkbox
                  label="Patient takes chloramphenicol"
                  checked={state.eligibility.onChloramphenicol}
                  onChange={(v) => updateEligibility("onChloramphenicol", v)}
                  description="Chloramphenicol may reduce the haematological response to hydroxocobalamin. Discuss with patient and consider extended monitoring."
                />
                <Checkbox
                  label="Patient is on oral contraceptives (combined or progesterone-only)"
                  checked={state.eligibility.onOralContraceptives}
                  onChange={(v) => updateEligibility("onOralContraceptives", v)}
                  description="May lower serum B12 due to reduced carrier protein. Unlikely to be clinically significant but document for the record."
                />
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
                    placeholder="e.g. fatigue, paraesthesia, glossitis"
                  />
                  <Checkbox
                    label="Any neurological symptoms (paraesthesia, ataxia, memory changes, cognitive decline)"
                    checked={state.eligibility.neuroSymptoms}
                    onChange={(v) => updateEligibility("neuroSymptoms", v)}
                    description="If present, use the every-2-month maintenance interval and notify GP."
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
                    <div className="font-medium text-navy-900">Loading therapy</div>
                    <div className="text-gray-600">1 mg IM three times weekly for two weeks (6 injections total). Use at start of treatment for newly diagnosed deficiency.</div>
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
                    <div className="font-medium text-navy-900">Maintenance therapy</div>
                    <div className="text-gray-600">1 mg IM every 2 months (with neurological involvement) or every 3 months (without). Lifelong for most indications.</div>
                  </div>
                </label>
              </div>
            </div>

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
                        <div className="font-medium text-navy-900">Non-diet-related deficiency</div>
                        <div className="text-gray-600">e.g. pernicious anaemia, post-bariatric surgery, atrophic gastritis. Maintenance is 1 mg IM every 2–3 months for life (8 weeks if neuro involvement; 12 weeks otherwise). Alternatively, large oral daily doses (500–1000 micrograms cyanocobalamin) can be considered.</div>
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
                        <div className="font-medium text-navy-900">Diet-related deficiency</div>
                        <div className="text-gray-600">e.g. vegan / vegetarian. Maintenance is either cyanocobalamin tablets 50–150 micrograms daily, OR 6-monthly hydroxocobalamin 1 mg IM.</div>
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
                    <option value="8-weeks">Every 8 weeks — non-diet-related with neurological involvement</option>
                    <option value="12-weeks">Every 12 weeks — non-diet-related, no neurological involvement</option>
                    <option value="26-weeks-diet-related">Every 6 months — diet-related deficiency only</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Next injection due <span className="text-red-400">*</span>
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
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Vaccine / drug batch number"
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

            <TextInput
              label="Time administered"
              value={state.administration.administeredAt}
              onChange={(v) => updateAdmin("administeredAt", v)}
              placeholder="HH:MM"
            />

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Post-injection observation</p>
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
                  onChange={(v) => updateAdmin("adverseReaction", v)}
                />
                {state.administration.adverseReaction && (
                  <TextArea
                    label="Adverse reaction details"
                    value={state.administration.adverseReactionDetails}
                    onChange={(v) => updateAdmin("adverseReactionDetails", v)}
                    rows={2}
                    placeholder="Describe reaction, action taken, Yellow Card reported"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Any further notes, advice given, follow-up arrangements" />
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Save the consultation to lock the record. Patient should return on
              {state.treatment.nextDueDate ? ` ${state.treatment.nextDueDate}` : " the date you noted"} for the next dose.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

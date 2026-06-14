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
  "Travel Risk Assessment",
  "Eligibility & Vaccine Choice",
  "Administration",
  "Pharmacist Summary",
  "Consultation Complete",
]

export function ChikungunyaClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    travel: {
      destinations: "",
      departureDate: "",
      durationWeeks: "",
      ruralExposure: false,
      visitingFriendsRelatives: false,
      outdoorActivities: false,
      timeOfYear: "" as "" | "wet-season" | "dry-season" | "year-round" | "unknown",
    },
    eligibility: {
      vaccineChoice: "" as "" | "vimkunya" | "ixchiq",
      // Common contraindications
      anyHypersensitivity: false,
      hypersensitivityDetails: "",
      acuteFebrileIllness: false,
      // VIMKUNYA-specific
      previousAnaphylaxis: false,
      // IXCHIQ-specific (live vaccine — stricter exclusions)
      pregnant: false,
      breastfeeding: false,
      immunocompromised: false,
      immunoDetails: "",
      ageOver65: false,
      historicCardiacDisease: false,
      // Cautions (both)
      atopic: false,
      onAnticoagulants: false,
    },
    administration: {
      vaccineGiven: "" as "" | "vimkunya" | "ixchiq",
      batchNumber: "",
      expiryDate: "",
      injectionSite: "" as "" | "left-deltoid" | "right-deltoid",
      administeredAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      postObsMinutes: "" as "" | "15" | "30",
      patientWell: false,
      adverseReaction: false,
      adverseReactionDetails: "",
      anaphylaxisKitChecked: false,
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

  function updateTravel<K extends keyof typeof state.travel>(field: K, value: typeof state.travel[K]) {
    setState((prev) => ({ ...prev, travel: { ...prev.travel, [field]: value } }))
  }
  function updateEligibility<K extends keyof typeof state.eligibility>(field: K, value: typeof state.eligibility[K]) {
    setState((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } }))
  }
  function updateAdmin<K extends keyof typeof state.administration>(field: K, value: typeof state.administration[K]) {
    setState((prev) => ({ ...prev, administration: { ...prev.administration, [field]: value } }))
  }

  // Auto-advise IXCHIQ contraindication for over-65 / cardiac / immunocomp.
  const ixchiqUnsuitable =
    state.eligibility.ageOver65 ||
    state.eligibility.immunocompromised ||
    state.eligibility.pregnant ||
    state.eligibility.breastfeeding ||
    state.eligibility.historicCardiacDisease

  const eligibilityValid =
    !!state.eligibility.vaccineChoice &&
    !state.eligibility.anyHypersensitivity &&
    !state.eligibility.acuteFebrileIllness &&
    !(state.eligibility.vaccineChoice === "ixchiq" && ixchiqUnsuitable)

  const adminValid =
    !!state.administration.vaccineGiven &&
    !!state.administration.batchNumber &&
    !!state.administration.expiryDate &&
    !!state.administration.injectionSite &&
    !!state.administration.postObsMinutes &&
    state.administration.patientWell &&
    state.administration.anaphylaxisKitChecked

  const canProceedByStep = [true, true, !!state.travel.destinations && !!state.travel.departureDate, eligibilityValid, adminValid, true, true]
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
            <TextArea
              label="Destination(s)"
              value={state.travel.destinations}
              onChange={(v) => updateTravel("destinations", v)}
              rows={2}
              placeholder="e.g. Brazil (Rio de Janeiro, Salvador), 3 weeks"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Departure date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.travel.departureDate}
                  onChange={(e) => updateTravel("departureDate", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <TextInput
                label="Trip duration (weeks)"
                value={state.travel.durationWeeks}
                onChange={(v) => updateTravel("durationWeeks", v)}
                placeholder="e.g. 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Time of year at destination
              </label>
              <select
                value={state.travel.timeOfYear}
                onChange={(e) => updateTravel("timeOfYear", e.target.value as typeof state.travel.timeOfYear)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="wet-season">Wet / monsoon season (higher Aedes mosquito activity)</option>
                <option value="dry-season">Dry season</option>
                <option value="year-round">Year-round endemic area</option>
                <option value="unknown">Not sure</option>
              </select>
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Exposure profile</p>
              <Checkbox label="Rural / off-tourist-circuit travel" checked={state.travel.ruralExposure} onChange={(v) => updateTravel("ruralExposure", v)} />
              <Checkbox label="Visiting friends / relatives (VFR)" checked={state.travel.visitingFriendsRelatives} onChange={(v) => updateTravel("visitingFriendsRelatives", v)} description="VFR travellers typically have longer, more local exposure to mosquitoes." />
              <Checkbox label="Outdoor / forest / hiking / extended day-time outdoor exposure" checked={state.travel.outdoorActivities} onChange={(v) => updateTravel("outdoorActivities", v)} />
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
              Also counsel the patient on bite-avoidance: DEET 50% repellent, long sleeves at peak day-time Aedes activity, accommodation with screened windows or air conditioning. Vaccine is in addition to, not a replacement for, bite avoidance.
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-2">
                Vaccine choice <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="vaccine"
                    checked={state.eligibility.vaccineChoice === "vimkunya"}
                    onChange={() => updateEligibility("vaccineChoice", "vimkunya")}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-navy-900">VIMKUNYA (Bavarian Nordic)</div>
                    <div className="text-gray-600">VLP (non-live) recombinant vaccine. Single 0.5 mL IM dose. Licensed from age 12. Preferred for travellers aged 65+, immunocompromised, pregnancy / breastfeeding (clinician judgement), or those with cardiac disease.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="vaccine"
                    checked={state.eligibility.vaccineChoice === "ixchiq"}
                    onChange={() => updateEligibility("vaccineChoice", "ixchiq")}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-navy-900">IXCHIQ (Valneva)</div>
                    <div className="text-gray-600">Live-attenuated vaccine. Single 0.5 mL IM dose. Licensed for adults 18+. <strong>Not for over-65s</strong>, immunocompromised, pregnant or breastfeeding patients (MHRA Drug Safety Update 2024 — serious adverse events reported in elderly).</div>
                  </div>
                </label>
              </div>
            </div>

            {state.eligibility.vaccineChoice === "ixchiq" && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <p className="text-sm font-semibold text-navy-900">IXCHIQ-specific exclusions</p>
                <Checkbox label="Patient is aged 65 or over" checked={state.eligibility.ageOver65} onChange={(v) => updateEligibility("ageOver65", v)} />
                <Checkbox label="Patient is pregnant" checked={state.eligibility.pregnant} onChange={(v) => updateEligibility("pregnant", v)} />
                <Checkbox label="Patient is breastfeeding" checked={state.eligibility.breastfeeding} onChange={(v) => updateEligibility("breastfeeding", v)} />
                <Checkbox label="Immunocompromised (HIV, malignancy, biologic / DMARD therapy, transplant)" checked={state.eligibility.immunocompromised} onChange={(v) => updateEligibility("immunocompromised", v)} />
                <Checkbox label="Significant cardiovascular disease (recent MI, uncontrolled arrhythmia, heart failure)" checked={state.eligibility.historicCardiacDisease} onChange={(v) => updateEligibility("historicCardiacDisease", v)} />
                {ixchiqUnsuitable && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900 mt-2">
                    <strong>IXCHIQ is not suitable for this patient.</strong> Switch to VIMKUNYA or defer vaccination and seek specialist travel medicine advice.
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Common contraindications</p>
              <Checkbox label="Known hypersensitivity to any vaccine component" checked={state.eligibility.anyHypersensitivity} onChange={(v) => updateEligibility("anyHypersensitivity", v)} />
              {state.eligibility.anyHypersensitivity && (
                <TextInput label="Detail (which component / what reaction)" value={state.eligibility.hypersensitivityDetails} onChange={(v) => updateEligibility("hypersensitivityDetails", v)} />
              )}
              <Checkbox label="Acute febrile illness today (temp ≥38°C)" checked={state.eligibility.acuteFebrileIllness} onChange={(v) => updateEligibility("acuteFebrileIllness", v)} description="Defer vaccination until recovered." />
              <Checkbox label="Previous severe (anaphylactic) reaction to any vaccine" checked={state.eligibility.previousAnaphylaxis} onChange={(v) => updateEligibility("previousAnaphylaxis", v)} />
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions</p>
              <Checkbox label="Atopic patient (asthma, severe eczema, multiple allergies)" checked={state.eligibility.atopic} onChange={(v) => updateEligibility("atopic", v)} description="Extend post-injection observation to 30 minutes." />
              <Checkbox label="On oral anticoagulants" checked={state.eligibility.onAnticoagulants} onChange={(v) => updateEligibility("onAnticoagulants", v)} description="Apply pressure to injection site for ≥2 min." />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Vaccine administered <span className="text-red-400">*</span>
              </label>
              <select
                value={state.administration.vaccineGiven}
                onChange={(e) => updateAdmin("vaccineGiven", e.target.value as typeof state.administration.vaccineGiven)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="vimkunya">VIMKUNYA (Bavarian Nordic)</option>
                <option value="ixchiq">IXCHIQ (Valneva)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Batch number" value={state.administration.batchNumber} onChange={(v) => updateAdmin("batchNumber", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Expiry date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.administration.expiryDate}
                  onChange={(e) => updateAdmin("expiryDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Injection site (IM) <span className="text-red-400">*</span>
              </label>
              <select
                value={state.administration.injectionSite}
                onChange={(e) => updateAdmin("injectionSite", e.target.value as typeof state.administration.injectionSite)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="left-deltoid">Left deltoid</option>
                <option value="right-deltoid">Right deltoid</option>
              </select>
            </div>

            <TextInput label="Time administered" value={state.administration.administeredAt} onChange={(v) => updateAdmin("administeredAt", v)} placeholder="HH:MM" />

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-navy-900 mb-3">Post-vaccine observation</p>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Observation period <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.administration.postObsMinutes}
                  onChange={(e) => updateAdmin("postObsMinutes", e.target.value as typeof state.administration.postObsMinutes)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— select —</option>
                  <option value="15">15 minutes (standard)</option>
                  <option value="30">30 minutes (atopic / first travel vaccine)</option>
                </select>
              </div>
              <div className="mt-3 space-y-2">
                <Checkbox label="Anaphylaxis kit checked + in-date" checked={state.administration.anaphylaxisKitChecked} onChange={(v) => updateAdmin("anaphylaxisKitChecked", v)} />
                <Checkbox label="Patient well at end of observation period" checked={state.administration.patientWell} onChange={(v) => updateAdmin("patientWell", v)} />
                <Checkbox label="Any adverse reaction" checked={state.administration.adverseReaction} onChange={(v) => updateAdmin("adverseReaction", v)} />
                {state.administration.adverseReaction && (
                  <TextArea label="Adverse reaction details" value={state.administration.adverseReactionDetails} onChange={(v) => updateAdmin("adverseReactionDetails", v)} rows={2} />
                )}
                <Checkbox label="Yellow Card reporting discussed with patient" checked={state.administration.yellowCardDiscussed} onChange={(v) => updateAdmin("yellowCardDiscussed", v)} description="Patient or pharmacist may submit at yellowcard.mhra.gov.uk for any suspected reaction." />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Any further advice given (bite avoidance, action if febrile illness post-vaccine, etc)" />
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Save to lock the record. Counsel patient that chikungunya
              vaccine takes ~14 days to achieve adequate protection — they
              should bite-avoid carefully in the meantime.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

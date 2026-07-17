"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"

// ─────────────────────────────────────────────────────────────────────────
// Hepatitis A / B Travel ePGD
//
// Replaces the previous tool that was a duplicate of MenACWY with the names
// changed but the content untouched (reported by Moin, 16 Jun 2026). This
// version is a genuine Hep A / Hep B consultation flow covering:
//
//   • Twinrix Adult (combined Hep A + Hep B, ≥16y)
//   • Twinrix Paediatric (combined, 1–15y)
//   • Havrix Monodose / Havrix Junior (Hep A only)
//   • Engerix-B Adult / Paediatric (Hep B only)
//
// Schedules supported:
//   • Standard       — 0 / 1 / 6 months (preferred where time allows)
//   • Accelerated    — 0 / 7 / 21 days + booster at 12 months
//   • Very accelerated (Twinrix only) — 0 / 7 / 21 days, licensed for adults
//
// Clinical content cross-referenced against:
//   • Green Book (Public Health England) chapters 17 (Hep A) and 18 (Hep B)
//   • BNF (Hepatitis vaccines)
//   • SPC Twinrix, Havrix, Engerix-B
//   • TravelHealthPro country recommendations
//
// REQUIRES SIGN-OFF before un-gating in dashboard + pgd-access registry.
// ─────────────────────────────────────────────────────────────────────────

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "Travel Risk Assessment",
  "Eligibility & Vaccine Choice",
  "Schedule & Administration",
  "Post-Vaccine Advice",
  "Pharmacist Summary",
  "Consultation Complete",
]

type VaccineProduct =
  | ""
  | "twinrix-adult"
  | "twinrix-paediatric"
  | "havrix-monodose"
  | "havrix-junior"
  | "engerix-b-adult"
  | "engerix-b-paediatric"

type Schedule = "" | "standard-0-1-6" | "accelerated-0-7-21-12m" | "very-accelerated"

export function HepABClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null as number | null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
      gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    travel: {
      destinations: "",
      departureDate: "",
      durationWeeks: "",
      hepARisk: false,
      hepBRisk: false,
      longerStay: false,
      ruralOrRemote: false,
      healthcareWorkerExposure: false,
      sexualOrBloodExposureRisk: false,
      bodyModificationRisk: false,
      previousHepAVaccine: false,
      previousHepBVaccine: false,
      previousVaccineDetails: "",
    },
    eligibility: {
      vaccineChoice: "" as VaccineProduct,
      // Common contraindications
      hypersensitivityToVaccine: false,
      hypersensitivityDetails: "",
      acuteFebrileIllness: false,
      previousAnaphylaxisToHepVaccine: false,
      // Cautions to document
      pregnant: false,
      breastfeeding: false,
      immunocompromised: false,
      immunoDetails: "",
      onAnticoagulants: false,
      bleedingDisorder: false,
      chronicLiverDisease: false,
      yeastAllergy: false, // Hep B vaccines contain recombinant yeast-derived HBsAg
      neomycinAllergy: false, // Hep A vaccines may contain trace neomycin
    },
    administration: {
      vaccineGiven: "" as VaccineProduct,
      schedule: "" as Schedule,
      doseNumberThisVisit: "" as "" | "1" | "2" | "3" | "booster",
      batchNumber: "",
      expiryDate: "",
      injectionSite: "" as "" | "left-deltoid" | "right-deltoid" | "anterolateral-thigh",
      administeredAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      postObsMinutes: "" as "" | "15" | "30",
      patientWell: false,
      adverseReaction: false,
      adverseReactionDetails: "",
      anaphylaxisKitChecked: false,
      yellowCardDiscussed: false,
      nextDoseDueDate: "",
    },
    advice: {
      sideEffectsCounselled: false,
      yellowCardLeafletGiven: false,
      vaccineRecordCardIssued: false,
      gpInformed: false,
      followUpScheduleAgreed: false,
      travelHealthAdviceProvided: false,
      foodAndWaterHygieneCounselled: false,
      sexualHealthCounselling: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
    },
  })

  const pharmProfile = usePharmacistProfile()
  useEffect(() => {
    if (!pharmProfile) return
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return
    setState((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        pharmacistName: pharmProfile.name,
        pharmacistGPhC: pharmProfile.gphcNumber,
        pharmacyName: pharmProfile.pharmacyName,
        pharmacyAddress: pharmProfile.pharmacyAddress,
      },
    }))
  }, [pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC])

  const handleNext = useCallback(
    () => setCurrentStep((s) => Math.min(s + 1, STEP_TITLES.length - 1)),
    []
  )
  const handlePrev = useCallback(
    () => setCurrentStep((s) => Math.max(s - 1, 0)),
    []
  )

  function updateTravel<K extends keyof typeof state.travel>(
    field: K,
    value: typeof state.travel[K]
  ) {
    setState((prev) => ({ ...prev, travel: { ...prev.travel, [field]: value } }))
  }
  function updateEligibility<K extends keyof typeof state.eligibility>(
    field: K,
    value: typeof state.eligibility[K]
  ) {
    setState((prev) => ({
      ...prev,
      eligibility: { ...prev.eligibility, [field]: value },
    }))
  }
  function updateAdmin<K extends keyof typeof state.administration>(
    field: K,
    value: typeof state.administration[K]
  ) {
    setState((prev) => ({
      ...prev,
      administration: { ...prev.administration, [field]: value },
    }))
  }
  function updateAdvice<K extends keyof typeof state.advice>(
    field: K,
    value: typeof state.advice[K]
  ) {
    setState((prev) => ({ ...prev, advice: { ...prev.advice, [field]: value } }))
  }

  // ── Eligibility gating ─────────────────────────────────────────────
  // Contraindications: any of these blocks the consultation.
  const blocked =
    state.eligibility.hypersensitivityToVaccine ||
    state.eligibility.acuteFebrileIllness ||
    state.eligibility.previousAnaphylaxisToHepVaccine ||
    // Yeast allergy blocks all Hep B vaccines (including Twinrix)
    (state.eligibility.yeastAllergy &&
      ["twinrix-adult", "twinrix-paediatric", "engerix-b-adult", "engerix-b-paediatric"].includes(
        state.eligibility.vaccineChoice
      )) ||
    // Neomycin anaphylaxis blocks Hep A-containing vaccines
    (state.eligibility.neomycinAllergy &&
      ["twinrix-adult", "twinrix-paediatric", "havrix-monodose", "havrix-junior"].includes(
        state.eligibility.vaccineChoice
      ))

  const ageMatchesVaccine = (() => {
    const age = state.patient.age
    if (age === null) return true
    switch (state.eligibility.vaccineChoice) {
      case "twinrix-adult":
      case "havrix-monodose":
        return age >= 16
      case "twinrix-paediatric":
      case "havrix-junior":
        return age >= 1 && age <= 15
      case "engerix-b-adult":
        return age >= 16
      case "engerix-b-paediatric":
        return age < 16
      default:
        return true
    }
  })()

  const eligibilityValid =
    !!state.eligibility.vaccineChoice && !blocked && ageMatchesVaccine

  const adminValid =
    !!state.administration.vaccineGiven &&
    !!state.administration.schedule &&
    !!state.administration.doseNumberThisVisit &&
    !!state.administration.batchNumber &&
    !!state.administration.expiryDate &&
    !!state.administration.injectionSite &&
    !!state.administration.postObsMinutes &&
    state.administration.patientWell &&
    state.administration.anaphylaxisKitChecked

  const adviceValid =
    state.advice.sideEffectsCounselled &&
    state.advice.vaccineRecordCardIssued &&
    state.advice.followUpScheduleAgreed

  const canProceedByStep = [
    true,
    true,
    !!state.travel.destinations && !!state.travel.departureDate,
    eligibilityValid,
    adminValid,
    adviceValid,
    true,
    true,
  ]
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
        validationError={
          !canProceed ? "Please complete all required fields" : null
        }
        getConsultationData={getConsultationData}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                patient: { ...prev.patient, [field]: value },
              }))
            }
            requireAdult={false}
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                consent: { ...prev.consent, [field]: value },
              }))
            }
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <TextArea
              label="Destination(s)"
              value={state.travel.destinations}
              onChange={(v) => updateTravel("destinations", v)}
              rows={2}
              placeholder="e.g. India (Delhi, Goa), 4 weeks; volunteering in rural areas"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Departure date"
                type="date"
                value={state.travel.departureDate}
                onChange={(v) => updateTravel("departureDate", v)}
              />
              <TextInput
                label="Duration (weeks)"
                type="number"
                value={state.travel.durationWeeks}
                onChange={(v) => updateTravel("durationWeeks", v)}
                placeholder="e.g. 4"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">
                Risk factors driving vaccine choice
              </p>
              <Checkbox
                label="Hepatitis A risk — travel to intermediate/high endemic area (much of Africa, Asia, Central/South America)"
                checked={state.travel.hepARisk}
                onChange={(v) => updateTravel("hepARisk", v)}
              />
              <Checkbox
                label="Hepatitis B risk — longer stay, healthcare exposure, sexual/blood exposure risk, body modification, or close family contact"
                checked={state.travel.hepBRisk}
                onChange={(v) => updateTravel("hepBRisk", v)}
              />
              <Checkbox
                label="Longer-term stay (≥4 weeks) or repeat visits"
                checked={state.travel.longerStay}
                onChange={(v) => updateTravel("longerStay", v)}
              />
              <Checkbox
                label="Rural / remote travel"
                checked={state.travel.ruralOrRemote}
                onChange={(v) => updateTravel("ruralOrRemote", v)}
              />
              <Checkbox
                label="Healthcare worker / aid worker / blood-and-body-fluid exposure risk"
                checked={state.travel.healthcareWorkerExposure}
                onChange={(v) => updateTravel("healthcareWorkerExposure", v)}
              />
              <Checkbox
                label="Sexual or blood-borne exposure risk (multiple partners, unprotected sex, IVDU)"
                checked={state.travel.sexualOrBloodExposureRisk}
                onChange={(v) => updateTravel("sexualOrBloodExposureRisk", v)}
              />
              <Checkbox
                label="Body modification while abroad (tattoos, piercings)"
                checked={state.travel.bodyModificationRisk}
                onChange={(v) => updateTravel("bodyModificationRisk", v)}
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">
                Prior vaccination history
              </p>
              <Checkbox
                label="Previously vaccinated against Hepatitis A"
                checked={state.travel.previousHepAVaccine}
                onChange={(v) => updateTravel("previousHepAVaccine", v)}
              />
              <Checkbox
                label="Previously vaccinated against Hepatitis B"
                checked={state.travel.previousHepBVaccine}
                onChange={(v) => updateTravel("previousHepBVaccine", v)}
              />
              {(state.travel.previousHepAVaccine ||
                state.travel.previousHepBVaccine) && (
                <TextArea
                  label="Previous vaccine details (product, dates, schedule completed)"
                  value={state.travel.previousVaccineDetails}
                  onChange={(v) => updateTravel("previousVaccineDetails", v)}
                  rows={2}
                  placeholder="e.g. Twinrix x2 doses in 2024, booster due"
                />
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Vaccine choice <span className="text-red-400">*</span>
              </label>
              <select
                value={state.eligibility.vaccineChoice}
                onChange={(ev) =>
                  updateEligibility(
                    "vaccineChoice",
                    ev.target.value as VaccineProduct
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <optgroup label="Combined Hep A + Hep B">
                  <option value="twinrix-adult">
                    Twinrix Adult (1 mL IM, &ge;16y)
                  </option>
                  <option value="twinrix-paediatric">
                    Twinrix Paediatric (0.5 mL IM, 1&ndash;15y)
                  </option>
                </optgroup>
                <optgroup label="Hepatitis A only">
                  <option value="havrix-monodose">
                    Havrix Monodose (1 mL IM, &ge;16y)
                  </option>
                  <option value="havrix-junior">
                    Havrix Junior (0.5 mL IM, 1&ndash;15y)
                  </option>
                </optgroup>
                <optgroup label="Hepatitis B only">
                  <option value="engerix-b-adult">
                    Engerix-B Adult (1 mL IM, &ge;16y)
                  </option>
                  <option value="engerix-b-paediatric">
                    Engerix-B Paediatric (0.5 mL IM, &lt;16y)
                  </option>
                </optgroup>
              </select>
              {!ageMatchesVaccine && state.eligibility.vaccineChoice && (
                <p className="text-xs text-red-600 mt-1">
                  Selected vaccine is not licensed for this patient&apos;s age.
                  Choose the age-appropriate product.
                </p>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-red-900">
                Contraindications &mdash; any tick here BLOCKS the consultation
              </p>
              <Checkbox
                label="Known hypersensitivity to this vaccine, any of its active substances, or excipients"
                checked={state.eligibility.hypersensitivityToVaccine}
                onChange={(v) =>
                  updateEligibility("hypersensitivityToVaccine", v)
                }
              />
              {state.eligibility.hypersensitivityToVaccine && (
                <TextArea
                  label="Details"
                  value={state.eligibility.hypersensitivityDetails}
                  onChange={(v) =>
                    updateEligibility("hypersensitivityDetails", v)
                  }
                  rows={2}
                />
              )}
              <Checkbox
                label="Acute moderate or severe febrile illness today — postpone vaccination"
                checked={state.eligibility.acuteFebrileIllness}
                onChange={(v) => updateEligibility("acuteFebrileIllness", v)}
              />
              <Checkbox
                label="Previous anaphylaxis to a Hepatitis A or Hepatitis B vaccine"
                checked={state.eligibility.previousAnaphylaxisToHepVaccine}
                onChange={(v) =>
                  updateEligibility("previousAnaphylaxisToHepVaccine", v)
                }
              />
              <Checkbox
                label="Severe yeast allergy (blocks all Hep B-containing vaccines including Twinrix and Engerix-B)"
                checked={state.eligibility.yeastAllergy}
                onChange={(v) => updateEligibility("yeastAllergy", v)}
              />
              <Checkbox
                label="Severe neomycin allergy (blocks all Hep A-containing vaccines including Twinrix and Havrix)"
                checked={state.eligibility.neomycinAllergy}
                onChange={(v) => updateEligibility("neomycinAllergy", v)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900">
                Cautions &mdash; proceed with documented benefit-vs-risk assessment
              </p>
              <Checkbox
                label="Pregnant (Hep A inactivated and Hep B recombinant may be given when benefit outweighs theoretical risk)"
                checked={state.eligibility.pregnant}
                onChange={(v) => updateEligibility("pregnant", v)}
              />
              <Checkbox
                label="Breastfeeding"
                checked={state.eligibility.breastfeeding}
                onChange={(v) => updateEligibility("breastfeeding", v)}
              />
              <Checkbox
                label="Immunocompromised (may require additional doses; serology may be indicated for Hep B)"
                checked={state.eligibility.immunocompromised}
                onChange={(v) => updateEligibility("immunocompromised", v)}
              />
              {state.eligibility.immunocompromised && (
                <TextArea
                  label="Details (condition / medication)"
                  value={state.eligibility.immunoDetails}
                  onChange={(v) => updateEligibility("immunoDetails", v)}
                  rows={2}
                />
              )}
              <Checkbox
                label="On anticoagulants (use thin needle, firm pressure &ge;2 minutes)"
                checked={state.eligibility.onAnticoagulants}
                onChange={(v) => updateEligibility("onAnticoagulants", v)}
              />
              <Checkbox
                label="Bleeding disorder (haemophilia, severe thrombocytopenia &mdash; assess as above)"
                checked={state.eligibility.bleedingDisorder}
                onChange={(v) => updateEligibility("bleedingDisorder", v)}
              />
              <Checkbox
                label="Chronic liver disease (strongly indicated &mdash; accelerated schedule may be appropriate)"
                checked={state.eligibility.chronicLiverDisease}
                onChange={(v) => updateEligibility("chronicLiverDisease", v)}
              />
            </div>

            {blocked && (
              <div className="bg-red-100 border border-red-400 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-900">
                  Consultation blocked. Patient does not meet PGD inclusion
                  criteria for the selected vaccine. Refer to GP / travel
                  clinic for individual prescription assessment.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Vaccine administered <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Confirms what was actually drawn up and given. Should match the
                vaccine choice from the previous step.
              </p>
              <select
                value={state.administration.vaccineGiven}
                onChange={(ev) =>
                  updateAdmin(
                    "vaccineGiven",
                    ev.target.value as VaccineProduct
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— confirm —</option>
                <option value="twinrix-adult">Twinrix Adult</option>
                <option value="twinrix-paediatric">Twinrix Paediatric</option>
                <option value="havrix-monodose">Havrix Monodose</option>
                <option value="havrix-junior">Havrix Junior</option>
                <option value="engerix-b-adult">Engerix-B Adult</option>
                <option value="engerix-b-paediatric">Engerix-B Paediatric</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Schedule <span className="text-red-400">*</span>
              </label>
              <select
                value={state.administration.schedule}
                onChange={(ev) =>
                  updateAdmin("schedule", ev.target.value as Schedule)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select schedule —</option>
                <option value="standard-0-1-6">
                  Standard: 0 / 1 / 6 months (preferred if time allows)
                </option>
                <option value="accelerated-0-7-21-12m">
                  Accelerated: 0 / 7 / 21 days + booster at 12 months
                </option>
                <option value="very-accelerated">
                  Very accelerated: 0 / 7 / 21 days (Twinrix Adult only)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Dose number at this visit <span className="text-red-400">*</span>
              </label>
              <select
                value={state.administration.doseNumberThisVisit}
                onChange={(ev) =>
                  updateAdmin(
                    "doseNumberThisVisit",
                    ev.target.value as "" | "1" | "2" | "3" | "booster"
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <option value="1">Dose 1 (primary)</option>
                <option value="2">Dose 2</option>
                <option value="3">Dose 3</option>
                <option value="booster">Booster (12 months post accelerated)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.administration.batchNumber}
                onChange={(v) => updateAdmin("batchNumber", v)}
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.administration.expiryDate}
                onChange={(v) => updateAdmin("expiryDate", v)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Injection site <span className="text-red-400">*</span>
              </label>
              <select
                value={state.administration.injectionSite}
                onChange={(ev) =>
                  updateAdmin(
                    "injectionSite",
                    ev.target.value as
                      | ""
                      | "left-deltoid"
                      | "right-deltoid"
                      | "anterolateral-thigh"
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <option value="left-deltoid">Left deltoid (preferred adults)</option>
                <option value="right-deltoid">Right deltoid</option>
                <option value="anterolateral-thigh">
                  Anterolateral thigh (young children)
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Intramuscular only. Do NOT inject IV, subcutaneously or
                intradermally.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Post-administration observation
              </label>
              <select
                value={state.administration.postObsMinutes}
                onChange={(ev) =>
                  updateAdmin(
                    "postObsMinutes",
                    ev.target.value as "" | "15" | "30"
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">— select —</option>
                <option value="15">15 minutes (routine)</option>
                <option value="30">30 minutes (history of severe atopy)</option>
              </select>
            </div>

            <Checkbox
              label="Patient remained well during observation period"
              checked={state.administration.patientWell}
              onChange={(v) => updateAdmin("patientWell", v)}
            />
            <Checkbox
              label="Anaphylaxis kit checked, in date and accessible"
              checked={state.administration.anaphylaxisKitChecked}
              onChange={(v) => updateAdmin("anaphylaxisKitChecked", v)}
            />
            <Checkbox
              label="Adverse reaction at this visit"
              checked={state.administration.adverseReaction}
              onChange={(v) => updateAdmin("adverseReaction", v)}
            />
            {state.administration.adverseReaction && (
              <TextArea
                label="Adverse reaction details"
                value={state.administration.adverseReactionDetails}
                onChange={(v) => updateAdmin("adverseReactionDetails", v)}
                rows={2}
              />
            )}

            <TextInput
              label="Next dose due date"
              type="date"
              value={state.administration.nextDoseDueDate}
              onChange={(v) => updateAdmin("nextDoseDueDate", v)}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-1">
                Counsel the patient on
              </p>
              <ul className="text-sm text-blue-900 list-disc ml-5 space-y-1">
                <li>
                  Common side effects: sore arm, mild fever, headache, fatigue
                  &mdash; usually resolve within 48 hours
                </li>
                <li>
                  Seek urgent help if breathing difficulty, swelling of face /
                  lips / tongue, widespread rash, persistent high fever, or
                  confusion
                </li>
                <li>
                  Hep A protection begins ~2 weeks post-dose; Hep B protection
                  builds over the full schedule (seroconversion typically after
                  the third dose)
                </li>
                <li>
                  Complete the full schedule &mdash; partial vaccination does not
                  provide long-term protection
                </li>
                <li>
                  Travel-related precautions: food/water hygiene (Hep A), safe
                  sex / no needle sharing / no body modification by unverified
                  operators (Hep B)
                </li>
              </ul>
            </div>

            <Checkbox
              label="Common and serious side effects counselled"
              checked={state.advice.sideEffectsCounselled}
              onChange={(v) => updateAdvice("sideEffectsCounselled", v)}
            />
            <Checkbox
              label="Yellow Card scheme leaflet given / discussed"
              checked={state.advice.yellowCardLeafletGiven}
              onChange={(v) => updateAdvice("yellowCardLeafletGiven", v)}
            />
            <Checkbox
              label="Vaccine record card issued (with batch, date, next-dose date)"
              checked={state.advice.vaccineRecordCardIssued}
              onChange={(v) => updateAdvice("vaccineRecordCardIssued", v)}
            />
            <Checkbox
              label="Follow-up dose dates confirmed with patient and reminder set"
              checked={state.advice.followUpScheduleAgreed}
              onChange={(v) => updateAdvice("followUpScheduleAgreed", v)}
            />
            <Checkbox
              label="GP informed (with consent)"
              checked={state.advice.gpInformed}
              onChange={(v) => updateAdvice("gpInformed", v)}
            />
            <Checkbox
              label="Wider travel health advice provided (TravelHealthPro signposted)"
              checked={state.advice.travelHealthAdviceProvided}
              onChange={(v) => updateAdvice("travelHealthAdviceProvided", v)}
            />
            <Checkbox
              label="Food and water hygiene counselling provided (Hep A)"
              checked={state.advice.foodAndWaterHygieneCounselled}
              onChange={(v) => updateAdvice("foodAndWaterHygieneCounselled", v)}
            />
            <Checkbox
              label="Sexual health and blood-borne risk counselling provided (Hep B)"
              checked={state.advice.sexualHealthCounselling}
              onChange={(v) => updateAdvice("sexualHealthCounselling", v)}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, pharmacistName: v },
                  }))
                }
              />
              <TextInput
                label="GPhC number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, pharmacistGPhC: v },
                  }))
                }
              />
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, pharmacyName: v },
                  }))
                }
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, pharmacyAddress: v },
                  }))
                }
              />
              <TextInput
                label="Consultation date"
                type="date"
                value={state.summary.consultationDate}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, consultationDate: v },
                  }))
                }
              />
              <TextInput
                label="Consultation time"
                value={state.summary.consultationTime}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, consultationTime: v },
                  }))
                }
              />
            </div>
            <TextArea
              label="Clinical notes"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, clinicalNotes: v },
                }))
              }
              rows={4}
              placeholder="Anything else worth recording — patient queries, future risk profile, anything that would matter at next appointment."
            />
          </div>
        )}

        {currentStep === 7 && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-6">
            <p className="text-lg font-semibold text-green-900 mb-2">
              Consultation complete
            </p>
            <p className="text-sm text-green-900">
              Vaccination details recorded. Patient given counselling, vaccine
              record card issued, and next dose date confirmed.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

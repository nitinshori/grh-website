"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, SelectInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { validatePatientStep, validateConsentStep } from "../shared/types"

// ─────────────────────────────────────────────────────────────────────────
// Hepatitis A / B Travel ePGD
//
// Aligned to the signed document: Hepatitis A and Hepatitis B Vaccination
// (Havrix, Avaxim, Engerix B and Twinrix, for travel and lifestyle risk),
// PGD version 006, issued 11 September 2026. Individuals aged 1 year and over.
//
//   • Twinrix Adult (combined Hep A + Hep B, 16y and over)
//   • Twinrix Paediatric (combined, 1 to 15y; standard schedule only)
//   • Havrix Monodose / Havrix Junior Monodose (Hep A only)
//   • Avaxim / Avaxim Junior (Hep A only, added at document v003)
//   • Engerix B / Engerix B Paediatric (Hep B only)
//
// Schedules per the document:
//   • Hep A monovalent: single dose, booster at 6 to 12 months
//   • Standard: 0, 1 and 6 months (Engerix B all ages; Twinrix Adult; Twinrix Paediatric only)
//   • Accelerated: 0, 1 and 2 months plus 12-month booster (Engerix B, all ages)
//   • Very rapid: 0, 7 and 21 days plus 12-month dose (Engerix B and Twinrix Adult;
//     18 and over under this PGD; 16 to 17 off-label with documented consent)
//
// Out of scope (exclusions): occupational hepatitis B needing proof of immunity,
// renal or dialysis patients, newborns of hepatitis B positive mothers, any
// post-exposure situation, known non-responders, post-vaccination serology.
// ─────────────────────────────────────────────────────────────────────────

const PGD_VERSION =
  "Hepatitis A and Hepatitis B Vaccination (Havrix, Avaxim, Engerix B and Twinrix) PGD v006, issued 11 September 2026"

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
  // Avaxim added 9 Sep 2026 with document v003. v002 authorised Havrix only,
  // so a pharmacy holding Avaxim, a widely stocked UK-licensed hepatitis A
  // vaccine, could not use it. Raised twice by an adopting pharmacy.
  | "avaxim-adult"
  | "avaxim-junior"
  | "engerix-b-adult"
  | "engerix-b-paediatric"

type Schedule =
  | ""
  | "hepa-single-booster-6-12m"
  | "standard-0-1-6"
  | "accelerated-0-1-2-12m"
  | "rapid-0-7-21-12m"

type ConsentBasis = "" | "parental" | "self"

const HEP_A_PRODUCTS: VaccineProduct[] = [
  "twinrix-adult", "twinrix-paediatric", "havrix-monodose", "havrix-junior", "avaxim-adult", "avaxim-junior",
]
const HEP_B_PRODUCTS: VaccineProduct[] = [
  "twinrix-adult", "twinrix-paediatric", "engerix-b-adult", "engerix-b-paediatric",
]

/** Schedules the document permits for each product. */
const SCHEDULES_FOR_PRODUCT: Record<Exclude<VaccineProduct, "">, Schedule[]> = {
  "havrix-monodose": ["hepa-single-booster-6-12m"],
  "havrix-junior": ["hepa-single-booster-6-12m"],
  "avaxim-adult": ["hepa-single-booster-6-12m"],
  "avaxim-junior": ["hepa-single-booster-6-12m"],
  "engerix-b-adult": ["standard-0-1-6", "accelerated-0-1-2-12m", "rapid-0-7-21-12m"],
  "engerix-b-paediatric": ["standard-0-1-6", "accelerated-0-1-2-12m"],
  "twinrix-adult": ["standard-0-1-6", "rapid-0-7-21-12m"],
  "twinrix-paediatric": ["standard-0-1-6"],
}

const SCHEDULE_LABEL: Record<Exclude<Schedule, "">, string> = {
  "hepa-single-booster-6-12m": "Hepatitis A monovalent: single dose, booster at 6 to 12 months (Avaxim Junior: 6 months to 15 years)",
  "standard-0-1-6": "Standard: 0, 1 and 6 months",
  "accelerated-0-1-2-12m": "Accelerated: 0, 1 and 2 months, booster at 12 months (Engerix B)",
  "rapid-0-7-21-12m": "Very rapid: 0, 7 and 21 days, plus a dose at 12 months (18 and over under this PGD)",
}

const PRODUCT_LABEL: Record<Exclude<VaccineProduct, "">, string> = {
  "twinrix-adult": "Twinrix Adult, Hep A 720 EU + HBsAg 20 mcg, 1.0 mL",
  "twinrix-paediatric": "Twinrix Paediatric, Hep A 360 EU + HBsAg 10 mcg, 0.5 mL",
  "havrix-monodose": "Havrix Monodose, Hep A 1440 ELISA units, 1.0 mL",
  "havrix-junior": "Havrix Junior Monodose, Hep A 720 ELISA units, 0.5 mL",
  "avaxim-adult": "Avaxim, Hep A 160 EU, 0.5 mL",
  "avaxim-junior": "Avaxim Junior, Hep A 80 EU, 0.5 mL",
  "engerix-b-adult": "Engerix B, HBsAg 20 micrograms, 1.0 mL",
  "engerix-b-paediatric": "Engerix B Paediatric, HBsAg 10 micrograms, 0.5 mL",
}

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
      hepANonTravelRisk: false,
      hepBRisk: false,
      longerStay: false,
      ruralOrRemote: false,
      healthcareWorkerExposure: false,
      sexualOrBloodExposureRisk: false,
      bodyModificationRisk: false,
      previousHepAVaccine: false,
      previousHepBVaccine: false,
      previousVaccineDetails: "",
      previousVaccinationInfoSufficient: false,
      consentBasis: "" as ConsentBasis,
      consentGivenBy: "",
    },
    eligibility: {
      vaccineChoice: "" as VaccineProduct,
      // Common contraindications
      hypersensitivityToVaccine: false,
      hypersensitivityDetails: "",
      acuteFebrileIllness: false,
      previousAnaphylaxisToHepVaccine: false,
      previousHypersensitivityToHepVaccine: false,
      outOfScope: false,
      proofOfImmunityRequired: false,
      // Cautions to document
      pregnant: false,
      pregnancyRiskAssessment: "",
      breastfeeding: false,
      breastfeedingDecision: "",
      immunocompromised: false,
      immunoDetails: "",
      onAnticoagulants: false,
      bleedingDisorder: false,
      chronicLiverDisease: false,
      latexAllergy: false,
      otherVaccinesSameVisit: false,
      twinrixPaedCoAdminRecorded: false,
      yeastAllergy: false, // Hep B vaccines contain recombinant yeast-derived HBsAg
      neomycinAllergy: false, // Hep A vaccines may contain trace neomycin
    },
    administration: {
      vaccineGiven: "" as VaccineProduct,
      schedule: "" as Schedule,
      offLabelScheduleConsented: false,
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
      courseComplete: false,
    },
    advice: {
      sideEffectsCounselled: false,
      yellowCardLeafletGiven: false,
      pilGiven: false,
      vaccineRecordCardIssued: false,
      gpInformed: false,
      followUpScheduleAgreed: false,
      protectionByTravelExplained: false,
      hepCNotCoveredExplained: false,
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
  const age = state.patient.age
  const isUnder16 = age !== null && age < 16
  const choice = state.eligibility.vaccineChoice
  const choiceHasHepA = HEP_A_PRODUCTS.includes(choice)
  const choiceHasHepB = HEP_B_PRODUCTS.includes(choice)
  const isTwinrix = choice === "twinrix-adult" || choice === "twinrix-paediatric"

  // Contraindications: any of these blocks the consultation.
  const blocked =
    (age !== null && age < 1) ||
    state.eligibility.hypersensitivityToVaccine ||
    state.eligibility.acuteFebrileIllness ||
    state.eligibility.previousAnaphylaxisToHepVaccine ||
    state.eligibility.previousHypersensitivityToHepVaccine ||
    state.eligibility.outOfScope ||
    state.eligibility.proofOfImmunityRequired ||
    // Pregnancy: Twinrix is not used under this PGD in pregnancy. Where
    // hepatitis B protection is needed, use a monovalent hepatitis B vaccine
    // and document the risk assessment.
    (state.eligibility.pregnant && isTwinrix) ||
    // Yeast allergy blocks all Hep B vaccines (including Twinrix)
    (state.eligibility.yeastAllergy && choiceHasHepB) ||
    // Neomycin allergy excludes Havrix, Twinrix and Avaxim (trace neomycin)
    (state.eligibility.neomycinAllergy && choiceHasHepA)

  const blockReason = (() => {
    if (age !== null && age < 1) return "Under 1 year of age: the vaccines are not licensed below 1 year."
    if (state.eligibility.outOfScope) return "Out of scope of this PGD (occupational hepatitis B, renal or dialysis, newborn of a hepatitis B positive mother, post-exposure, known non-responder or serology). Refer to the GP, occupational health, the renal team, the Health Protection Team or emergency care as appropriate; make the urgency clear where it is a post-exposure situation."
    if (state.eligibility.proofOfImmunityRequired) return "The patient requires proof of immunity: serology is out of scope. Refer to occupational health or the GP."
    if (state.eligibility.pregnant && isTwinrix) return "Pregnancy: Twinrix is not given under this PGD (SPC advises delay until after delivery). Where hepatitis B protection is needed in pregnancy, use a monovalent hepatitis B vaccine and document the risk assessment; Havrix is preferred for hepatitis A."
    if (state.eligibility.neomycinAllergy && choiceHasHepA) return "Neomycin allergy: Havrix, Twinrix and Avaxim contain trace neomycin and are excluded."
    if (state.eligibility.acuteFebrileIllness) return "Acute severe febrile illness: postpone until recovered. Minor illness without fever is not a reason to defer."
    return "Confirmed anaphylaxis or previous hypersensitivity reaction to a hepatitis A or B containing vaccine or any component: excluded. Refer to the GP or a travel clinic."
  })()

  const ageMatchesVaccine = (() => {
    if (age === null) return true
    switch (choice) {
      case "twinrix-adult":
      case "havrix-monodose":
      // Avaxim adult is 16 and over; its SPC says it is not recommended at
      // 15 or under for want of safety and efficacy data.
      case "avaxim-adult":
      case "engerix-b-adult":
        return age >= 16
      case "twinrix-paediatric":
      case "havrix-junior":
      case "avaxim-junior":
      case "engerix-b-paediatric":
        return age >= 1 && age <= 15
      default:
        return true
    }
  })()

  // Inclusion: hepatitis A needs a travel or non-travel risk factor; hepatitis
  // B needs travel with a risk factor, or a lifestyle risk factor.
  const indicationMet =
    !!choice &&
    (!choiceHasHepA || state.travel.hepARisk || state.travel.hepANonTravelRisk) &&
    (!choiceHasHepB || state.travel.hepBRisk)

  const cautionsDocumented =
    (!state.eligibility.pregnant || !!state.eligibility.pregnancyRiskAssessment.trim()) &&
    (!state.eligibility.breastfeeding || !!state.eligibility.breastfeedingDecision.trim()) &&
    (!(choice === "twinrix-paediatric" && state.eligibility.otherVaccinesSameVisit) ||
      state.eligibility.twinrixPaedCoAdminRecorded)

  const eligibilityValid =
    !!choice && !blocked && ageMatchesVaccine && indicationMet && cautionsDocumented

  const eligibilityError = (() => {
    if (!choice) return "Select the vaccine"
    if (blocked) return blockReason
    if (!ageMatchesVaccine) return "Selected vaccine is not licensed for this patient's age. Choose the age-appropriate product."
    if (!indicationMet) return choiceHasHepA && !(state.travel.hepARisk || state.travel.hepANonTravelRisk)
      ? "Hepatitis A inclusion not met: record travel to a moderate or high endemicity area, or a non-travel risk factor, on the Travel Risk Assessment step"
      : "Hepatitis B inclusion not met: record travel to an intermediate or high prevalence area with a risk factor, or a lifestyle risk factor, on the Travel Risk Assessment step"
    if (!cautionsDocumented) return "Record the pregnancy risk assessment, breastfeeding decision, or the Twinrix Paediatric co-administration decision"
    return null
  })()

  // ── Schedule gating ───────────────────────────────────────────────
  const given = state.administration.vaccineGiven
  const allowedSchedules: Schedule[] = given ? SCHEDULES_FOR_PRODUCT[given] : []
  const schedule = state.administration.schedule
  const scheduleAllowed = !!schedule && allowedSchedules.includes(schedule)
  // Very rapid schedule: 18 and over under this PGD; 16 to 17 off-label with
  // documented consent (Engerix B and Twinrix Adult).
  const rapidOffLabel = schedule === "rapid-0-7-21-12m" && age !== null && age < 18
  const offLabelUsed = rapidOffLabel
  const nextDoseRequired = !state.administration.courseComplete

  const adminValid =
    !!given &&
    given === choice &&
    scheduleAllowed &&
    (!offLabelUsed || state.administration.offLabelScheduleConsented) &&
    !!state.administration.doseNumberThisVisit &&
    !!state.administration.batchNumber &&
    !!state.administration.expiryDate &&
    !!state.administration.injectionSite &&
    !!state.administration.postObsMinutes &&
    state.administration.patientWell &&
    state.administration.anaphylaxisKitChecked &&
    (!nextDoseRequired || !!state.administration.nextDoseDueDate)

  const adminError = (() => {
    if (!given) return "Confirm the vaccine administered"
    if (given !== choice) return "The vaccine administered must match the vaccine chosen on the eligibility step; go back and change the choice if a different product was given"
    if (!schedule) return "Select the schedule"
    if (!scheduleAllowed) return `${SCHEDULE_LABEL[schedule]} is not a schedule the document permits for ${PRODUCT_LABEL[given]}`
    if (offLabelUsed && !state.administration.offLabelScheduleConsented) return "Very rapid schedule in a 16 or 17 year old is off-label: confirm it was explained and consented to, and recorded as such"
    if (!state.administration.doseNumberThisVisit) return "Record the dose number at this visit"
    if (!state.administration.batchNumber) return "Record the batch number"
    if (!state.administration.expiryDate) return "Record the expiry date"
    if (!state.administration.injectionSite) return "Record the injection site"
    if (!state.administration.anaphylaxisKitChecked) return "Confirm adrenaline 1:1000 and the written anaphylaxis protocol are immediately available"
    if (!state.administration.postObsMinutes || !state.administration.patientWell) return "Record that the 15 minute seated observation period was completed"
    if (nextDoseRequired && !state.administration.nextDoseDueDate) return "Record the date the next dose is due, or mark the course complete"
    return null
  })()

  const givenHasHepA = HEP_A_PRODUCTS.includes(given)
  const givenHasHepB = HEP_B_PRODUCTS.includes(given)

  const adviceValid =
    state.advice.sideEffectsCounselled &&
    state.advice.pilGiven &&
    state.advice.vaccineRecordCardIssued &&
    state.advice.followUpScheduleAgreed &&
    state.advice.protectionByTravelExplained &&
    state.advice.hepCNotCoveredExplained &&
    (!givenHasHepA || state.advice.foodAndWaterHygieneCounselled) &&
    (!givenHasHepB || state.advice.sexualHealthCounselling)

  const patientError = validatePatientStep(state.patient, { minAge: 1 })
  const consentError = (() => {
    const base = validateConsentStep(state.consent)
    if (base) return base
    if (isUnder16) {
      if (state.travel.consentBasis !== "parental") return "Under 16: consent must be obtained from a person with parental responsibility"
      if (!state.travel.consentGivenBy.trim()) return "Record the name and relationship of the person with parental responsibility who consented"
    } else if (!state.travel.consentBasis) {
      return "Record who gave consent"
    }
    return null
  })()

  const travelError = (() => {
    if (!state.travel.destinations) return "Record the destination(s)"
    if (!state.travel.departureDate) return "Record the departure date"
    if (!state.travel.previousVaccinationInfoSufficient) return "Confirm sufficient information is available about any previous hepatitis A or B vaccination"
    return null
  })()

  const stepErrors: (string | null)[] = [
    patientError,
    consentError,
    travelError,
    eligibilityError,
    adminError,
    adviceValid ? null : "Please confirm every counselling point that applies to the vaccine given",
    null,
    null,
  ]
  const canProceed = stepErrors[currentStep] === null

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
      clinicalData: {
        ...state,
        pgdVersion: PGD_VERSION,
        product: given ? PRODUCT_LABEL[given] : "",
        scheduleLabel: schedule ? SCHEDULE_LABEL[schedule] : "",
        route: "Intramuscular",
        offLabelSchedule: offLabelUsed,
      } as unknown as Record<string, unknown>,
      outcome: blocked || !given ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    }
  }, [state, given, schedule, offLabelUsed, blocked])

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
        validationError={stepErrors[currentStep]}
        isBlocked={blocked && currentStep === 3}
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
          <div className="space-y-4">
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                setState((prev) => ({
                  ...prev,
                  consent: { ...prev.consent, [field]: value },
                }))
              }
            />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-900">Who gave consent</p>
              <SelectInput
                label="Consent given by"
                value={state.travel.consentBasis}
                onChange={(v) => updateTravel("consentBasis", v as ConsentBasis)}
                options={[
                  ...(isUnder16 ? [] : [{ value: "self", label: "The patient (16 and over)" }]),
                  { value: "parental", label: "A person with parental responsibility (patient is a child)" },
                ]}
                required
              />
              {state.travel.consentBasis === "parental" && (
                <TextInput
                  label="Name and relationship of the person with parental responsibility"
                  value={state.travel.consentGivenBy}
                  onChange={(v) => updateTravel("consentGivenBy", v)}
                  placeholder="e.g. Jane Smith, mother"
                  required
                />
              )}
              <p className="text-xs text-amber-900">
                The patient (or parent) understands this is a private service and what it costs.
              </p>
            </div>
          </div>
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
                label="Hepatitis A inclusion: travel to an area of moderate or high hepatitis A endemicity (in practice anywhere outside northern and western Europe, North America, Australia and New Zealand)"
                checked={state.travel.hepARisk}
                onChange={(v) => updateTravel("hepARisk", v)}
              />
              <Checkbox
                label="Hepatitis A inclusion, non-travel risk factor: chronic liver disease including chronic hepatitis B or C, haemophilia or receipt of plasma-derived clotting factors, injecting drug use, gay, bisexual and other men who have sex with men, or occupational risk such as laboratory or sewage work"
                checked={state.travel.hepANonTravelRisk}
                onChange={(v) => updateTravel("hepANonTravelRisk", v)}
              />
              <Checkbox
                label="Hepatitis B inclusion: travel to an area of intermediate or high prevalence together with a risk factor, or a lifestyle risk factor regardless of travel (longer stay or expatriate posting, likely need for medical or dental care abroad, travel for medical treatment, unprotected sex with new partners, injecting drug use, tattooing, piercing or acupuncture where sterility cannot be assured, contact sports, adopting a child from a higher prevalence country)"
                checked={state.travel.hepBRisk}
                onChange={(v) => updateTravel("hepBRisk", v)}
              />
              <Checkbox
                label="Longer stay or expatriate posting, or repeat visits"
                checked={state.travel.longerStay}
                onChange={(v) => updateTravel("longerStay", v)}
              />
              <Checkbox
                label="Rural / remote travel, or likely need for medical or dental care abroad"
                checked={state.travel.ruralOrRemote}
                onChange={(v) => updateTravel("ruralOrRemote", v)}
              />
              <Checkbox
                label="Relief or aid healthcare work abroad with blood or body fluid exposure (NOT occupational hepatitis B vaccination requiring proof of immunity, which is excluded from this PGD)"
                checked={state.travel.healthcareWorkerExposure}
                onChange={(v) => updateTravel("healthcareWorkerExposure", v)}
              />
              <Checkbox
                label="Sexual or blood-borne exposure risk (unprotected sex with new partners, injecting drug use, contact sports)"
                checked={state.travel.sexualOrBloodExposureRisk}
                onChange={(v) => updateTravel("sexualOrBloodExposureRisk", v)}
              />
              <Checkbox
                label="Tattooing, piercing or acupuncture abroad where sterility cannot be assured"
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
              <Checkbox
                label="Sufficient information is available about any previous hepatitis A or B vaccination (inclusion criterion)"
                checked={state.travel.previousVaccinationInfoSufficient}
                onChange={(v) => updateTravel("previousVaccinationInfoSufficient", v)}
              />
              <p className="text-xs text-gray-600">
                An interrupted course is resumed, not restarted; continue with the same product where possible. A late hepatitis A booster still works. Hepatitis A can be given up to the day of departure; hepatitis B needs more lead time (very rapid schedule gives roughly 65% seroprotection by day 28). For a late presenter, still start the course, arrange completion on return, and be explicit that they will not be fully protected while away.
              </p>
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
                <option value="">Select</option>
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
                  <option value="avaxim-adult">
                    Avaxim 160 EU (0.5 mL IM, &ge;16y)
                  </option>
                  <option value="avaxim-junior">
                    Avaxim Junior 80 EU (0.5 mL IM, 1&ndash;15y)
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
                Contraindications: any tick here BLOCKS the consultation
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
                label="Acute severe febrile illness: postpone until recovered (minor illness without fever is not a reason to defer)"
                checked={state.eligibility.acuteFebrileIllness}
                onChange={(v) => updateEligibility("acuteFebrileIllness", v)}
              />
              <Checkbox
                label="Confirmed anaphylactic reaction to a previous dose of the same vaccine, or to any component"
                checked={state.eligibility.previousAnaphylaxisToHepVaccine}
                onChange={(v) =>
                  updateEligibility("previousAnaphylaxisToHepVaccine", v)
                }
              />
              <Checkbox
                label="Previous hypersensitivity reaction following a hepatitis A or hepatitis B containing vaccine"
                checked={state.eligibility.previousHypersensitivityToHepVaccine}
                onChange={(v) =>
                  updateEligibility("previousHypersensitivityToHepVaccine", v)
                }
              />
              <Checkbox
                label="Out of scope: occupational hepatitis B vaccination (healthcare or laboratory workers, employment requiring proof of immunity); renal failure or dialysis; newborn of a hepatitis B positive mother; ANY post-exposure situation including needlestick or sexual assault; known non-responder after a completed course; post-vaccination serology requested"
                checked={state.eligibility.outOfScope}
                onChange={(v) => updateEligibility("outOfScope", v)}
              />
              <Checkbox
                label="The patient requires proof of immunity (serology is out of scope)"
                checked={state.eligibility.proofOfImmunityRequired}
                onChange={(v) => updateEligibility("proofOfImmunityRequired", v)}
              />
              <Checkbox
                label="Neomycin allergy (excludes Havrix, Twinrix and Avaxim, which contain trace neomycin)"
                checked={state.eligibility.neomycinAllergy}
                onChange={(v) => updateEligibility("neomycinAllergy", v)}
              />
              <Checkbox
                label="Severe yeast allergy (blocks all Hep B-containing vaccines including Twinrix and Engerix B)"
                checked={state.eligibility.yeastAllergy}
                onChange={(v) => updateEligibility("yeastAllergy", v)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900">
                Cautions: proceed with documented benefit-vs-risk assessment
              </p>
              <Checkbox
                label="Pregnant. Hepatitis A vaccine may be given where clearly indicated (Havrix preferred; Avaxim only where clearly necessary after a recorded risk-benefit assessment). Twinrix is not given in pregnancy under this PGD: where hepatitis B protection is needed, use monovalent hepatitis B vaccine and document the risk assessment"
                checked={state.eligibility.pregnant}
                onChange={(v) => updateEligibility("pregnant", v)}
              />
              {state.eligibility.pregnant && (
                <TextArea
                  label="Pregnancy: risk assessment documented"
                  value={state.eligibility.pregnancyRiskAssessment}
                  onChange={(v) => updateEligibility("pregnancyRiskAssessment", v)}
                  rows={2}
                  placeholder="Indication, product chosen and why, discussion with the patient"
                />
              )}
              <Checkbox
                label="Breastfeeding. Excretion in breast milk is unknown; no established contraindication. Weigh benefit and record the decision"
                checked={state.eligibility.breastfeeding}
                onChange={(v) => updateEligibility("breastfeeding", v)}
              />
              {state.eligibility.breastfeeding && (
                <TextInput
                  label="Breastfeeding: decision recorded"
                  value={state.eligibility.breastfeedingDecision}
                  onChange={(v) => updateEligibility("breastfeedingDecision", v)}
                  placeholder="e.g. benefit outweighs unknown risk, patient wishes to proceed"
                />
              )}
              <Checkbox
                label="Immunosuppression, including HIV. Response may be reduced and additional doses may be needed. Where the patient needs to know whether they responded, that requires serology and is outside this PGD: counsel and refer rather than assuming protection"
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
                label="On anticoagulants (fine needle, 25G where possible, firm pressure without rubbing for at least 2 minutes)"
                checked={state.eligibility.onAnticoagulants}
                onChange={(v) => updateEligibility("onAnticoagulants", v)}
              />
              <Checkbox
                label="Bleeding disorder or thrombocytopenia (fine needle and pressure as above; deep subcutaneous is the fallback, but the Twinrix SPC warns the subcutaneous route may give a suboptimal response)"
                checked={state.eligibility.bleedingDisorder}
                onChange={(v) => updateEligibility("bleedingDisorder", v)}
              />
              <Checkbox
                label="Chronic liver disease (hepatitis A indicated as a non-travel risk factor)"
                checked={state.eligibility.chronicLiverDisease}
                onChange={(v) => updateEligibility("chronicLiverDisease", v)}
              />
              <Checkbox
                label="Latex allergy: check the current PIL for the presentation in hand before reassuring (adult Avaxim attached-needle shield may be natural rubber)"
                checked={state.eligibility.latexAllergy}
                onChange={(v) => updateEligibility("latexAllergy", v)}
              />
              <Checkbox
                label="Other vaccines are being given at the same visit"
                checked={state.eligibility.otherVaccinesSameVisit}
                onChange={(v) => updateEligibility("otherVaccinesSameVisit", v)}
              />
              {choice === "twinrix-paediatric" && state.eligibility.otherVaccinesSameVisit && (
                <Checkbox
                  label="Twinrix Paediatric: the SPC states vaccines other than Cervarix should not be given at the same time. Either separate the visits, or record here that co-administration was an informed off-label decision"
                  checked={state.eligibility.twinrixPaedCoAdminRecorded}
                  onChange={(v) => updateEligibility("twinrixPaedCoAdminRecorded", v)}
                />
              )}
            </div>

            {blocked && (
              <div className="bg-red-100 border border-red-400 rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-red-900">
                  Consultation blocked. {blockReason}
                </p>
                <p className="text-xs text-red-900">
                  Give risk reduction advice regardless (food and water hygiene for hepatitis A; avoiding unprotected sex, unsterile tattooing, piercing and acupuncture, and not sharing needles or razors for hepatitis B). Document the reason, the advice given and the decision reached.
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
                <option value="">Confirm</option>
                <option value="twinrix-adult">Twinrix Adult</option>
                <option value="twinrix-paediatric">Twinrix Paediatric</option>
                <option value="havrix-monodose">Havrix Monodose</option>
                <option value="havrix-junior">Havrix Junior</option>
                <option value="avaxim-adult">Avaxim 160 EU</option>
                <option value="avaxim-junior">Avaxim Junior 80 EU</option>
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
                <option value="">Select schedule</option>
                {(given ? SCHEDULES_FOR_PRODUCT[given] : []).map((s) => (
                  <option key={s} value={s}>
                    {SCHEDULE_LABEL[s as Exclude<Schedule, "">]}
                  </option>
                ))}
              </select>
              {given && (
                <p className="text-xs text-gray-500 mt-1">
                  {PRODUCT_LABEL[given]}. Only the schedules the document permits for this product are offered. Twinrix Paediatric has no accelerated or rapid schedule; do not improvise one.
                </p>
              )}
              {rapidOffLabel && (
                <div className="mt-2">
                  <Checkbox
                    label="Very rapid schedule in a 16 or 17 year old is off-label under this PGD: explained to the patient, consented to, and recorded as an explicit decision (the standard schedule is the alternative)"
                    checked={state.administration.offLabelScheduleConsented}
                    onChange={(v) => updateAdmin("offLabelScheduleConsented", v)}
                  />
                </div>
              )}
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
                <option value="">Select</option>
                <option value="1">Dose 1 (primary)</option>
                <option value="2">Dose 2</option>
                <option value="3">Dose 3</option>
                <option value="booster">Booster or 12-month dose (hepatitis A booster at 6 to 12 months; 12-month dose after an accelerated or very rapid schedule)</option>
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
                <option value="">Select</option>
                <option value="left-deltoid">Left deltoid (older children and adults)</option>
                <option value="right-deltoid">Right deltoid</option>
                <option value="anterolateral-thigh">
                  Anterolateral thigh (infants and young children)
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Intramuscular. Never into the gluteal muscle, and never intravenously or intradermally. Deep subcutaneous is the fallback only for bleeding disorders (Twinrix SPC warns of a suboptimal response). Where another vaccine is given at the same visit, use a separate limb where possible, or sites at least 2.5 cm apart, and record the site of each.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Post-administration observation (observe every patient for 15 minutes, seated) <span className="text-red-400">*</span>
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
                <option value="">Select</option>
                <option value="15">15 minutes (routine)</option>
                <option value="30">30 minutes (history of severe atopy)</option>
              </select>
            </div>

            <Checkbox
              label="Observation period completed, seated, and patient remained well"
              checked={state.administration.patientWell}
              onChange={(v) => updateAdmin("patientWell", v)}
            />
            <Checkbox
              label="Adrenaline 1:1000 injection immediately available, in date, with a written anaphylaxis protocol consistent with Resuscitation Council UK guidance"
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

            <Checkbox
              label="Course complete with this dose (no further dose due)"
              checked={state.administration.courseComplete}
              onChange={(v) => updateAdmin("courseComplete", v)}
            />
            {!state.administration.courseComplete && (
              <TextInput
                label="Next dose due date"
                type="date"
                value={state.administration.nextDoseDueDate}
                onChange={(v) => updateAdmin("nextDoseDueDate", v)}
              />
            )}
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
                  Common side effects: sore arm, mild fever, headache, fatigue;
                  usually resolve within 48 hours
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
                  Complete the full schedule: partial vaccination does not
                  provide long-term protection
                </li>
                <li>
                  Travel-related precautions: food/water hygiene (Hep A), safe
                  sex / no needle sharing / no body modification by unverified
                  operators (Hep B)
                </li>
                <li>
                  Vaccination does not protect against hepatitis C, for which there is no vaccine; the same precautions apply
                </li>
                <li>
                  Keep a record of what was given, including the brand, because it determines how a course is completed elsewhere
                </li>
              </ul>
            </div>

            <Checkbox
              label="Common local and systemic reactions and their self-limiting nature counselled; when to seek urgent help"
              checked={state.advice.sideEffectsCounselled}
              onChange={(v) => updateAdvice("sideEffectsCounselled", v)}
            />
            <Checkbox
              label="Manufacturer's patient information leaflet given"
              checked={state.advice.pilGiven}
              onChange={(v) => updateAdvice("pilGiven", v)}
            />
            <Checkbox
              label="Yellow Card scheme leaflet given / discussed"
              checked={state.advice.yellowCardLeafletGiven}
              onChange={(v) => updateAdvice("yellowCardLeafletGiven", v)}
            />
            <Checkbox
              label="Written record given (brand, strength, batch, date) and patient advised to keep it because the brand determines how a course is completed elsewhere"
              checked={state.advice.vaccineRecordCardIssued}
              onChange={(v) => updateAdvice("vaccineRecordCardIssued", v)}
            />
            <Checkbox
              label="Schedule given in writing with the date each remaining dose is due; explained that an incomplete course gives incomplete protection"
              checked={state.advice.followUpScheduleAgreed}
              onChange={(v) => updateAdvice("followUpScheduleAgreed", v)}
            />
            <Checkbox
              label="Explicit about what protection the patient will and will not have by the time they travel (particularly hepatitis B on a rapid schedule)"
              checked={state.advice.protectionByTravelExplained}
              onChange={(v) => updateAdvice("protectionByTravelExplained", v)}
            />
            <Checkbox
              label="Explained that vaccination does not protect against hepatitis C and the same precautions apply"
              checked={state.advice.hepCNotCoveredExplained}
              onChange={(v) => updateAdvice("hepCNotCoveredExplained", v)}
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
              label={`Risk reduction advice, hepatitis A: food and water hygiene${givenHasHepA ? " (required for the vaccine given)" : ""}`}
              checked={state.advice.foodAndWaterHygieneCounselled}
              onChange={(v) => updateAdvice("foodAndWaterHygieneCounselled", v)}
            />
            <Checkbox
              label={`Risk reduction advice, hepatitis B: avoiding unprotected sex, unsterile tattooing, piercing and acupuncture, and not sharing needles or razors${givenHasHepB ? " (required for the vaccine given)" : ""}`}
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
              placeholder="Anything else worth recording: patient queries, future risk profile, anything that would matter at next appointment."
            />
            <p className="text-xs text-gray-500">Administered under {PGD_VERSION}.</p>
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

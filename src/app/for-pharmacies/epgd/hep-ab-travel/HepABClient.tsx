"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, SelectInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { validatePatientStep, validateConsentStep, validateSummaryStep, calculateAge } from "../shared/types"
import { HepABSummaryReport } from "./components/HepABSummaryReport"

// ─────────────────────────────────────────────────────────────────────────
// Hepatitis A / B Travel ePGD
//
// Aligned to the signed document: Hepatitis A and Hepatitis B Vaccination
// (Havrix, Avaxim, Engerix B and Twinrix, for travel and lifestyle risk),
// PGD version 008, issued 11 September 2026. Individuals aged 1 year and over.
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

import {
  PGD_VERSION,
  STEP_TITLES,
  HEP_A_PRODUCTS,
  HEP_B_PRODUCTS,
  SCHEDULES_FOR_PRODUCT,
  SCHEDULE_LABEL,
  PRODUCT_LABEL,
  DOSES_FOR_SCHEDULE,
  DOSE_LABEL,
  SCHEDULE_INTERVALS,
  parseLocalDate,
  todayLocal,
  daysBetween,
  addDays,
  createInitialState,
  type VaccineProduct,
  type Schedule,
  type ConsentBasis,
  type DoseNumber,
  type HepABState,
} from "./hep-ab-travel-types"

export function HepABClient() {
  const [currentStep, setCurrentStep] = useState(0)
  const [state, setState] = useState<HepABState>(createInitialState)

  // New Consultation: fresh state objects, back to step 0. StepWrapper also
  // resets the tracking hook and clears the shared safety block.
  const handleNewConsultation = useCallback(() => {
    setState(createInitialState())
    setCurrentStep(0)
  }, [])

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
  /** Gillick competence is offered as a consent basis from 12 to 15 years, as
   *  in the other vaccine tools; below 12 the parental route is the only one
   *  offered. The document sets no lower age for a Gillick assessment. */
  const GILLICK_MIN_AGE = 12
  const gillickOffered = age !== null && age >= GILLICK_MIN_AGE && age < 16
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
    (state.eligibility.neomycinAllergy && choiceHasHepA) ||
    // A completed course: no new primary dose of that component
    (state.travel.previousHepACourseComplete && choiceHasHepA && state.administration.doseNumberThisVisit === "1") ||
    (state.travel.previousHepBCourseComplete && choiceHasHepB && state.administration.doseNumberThisVisit === "1")

  const blockReason = (() => {
    if (age !== null && age < 1) return "Under 1 year of age: the vaccines are not licensed below 1 year."
    if (state.travel.previousHepACourseComplete && choiceHasHepA && state.administration.doseNumberThisVisit === "1") return "A completed hepatitis A course is recorded: a new primary dose is not indicated. No further booster is recommended for immunocompetent adults."
    if (state.travel.previousHepBCourseComplete && choiceHasHepB && state.administration.doseNumberThisVisit === "1") return "A completed hepatitis B primary course is recorded: a new primary course is not indicated. Immunocompetent people who completed a course do not need a reinforcing dose."
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
    if (state.eligibility.pregnant && !state.eligibility.pregnancyRiskAssessment.trim()) return "Pregnant is ticked: complete \"Pregnancy: risk assessment documented\""
    if (state.eligibility.breastfeeding && !state.eligibility.breastfeedingDecision.trim()) return "Breastfeeding is ticked: complete \"Breastfeeding: decision recorded\""
    if (!cautionsDocumented) return "Other vaccines at the same visit with Twinrix Paediatric: either separate the visits (untick \"Other vaccines are being given at the same visit\") or tick the Twinrix Paediatric co-administration decision"
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
  const doseNumber = state.administration.doseNumberThisVisit
  const doseOptions: DoseNumber[] = scheduleAllowed ? DOSES_FOR_SCHEDULE[schedule as Exclude<Schedule, "">] : []
  const doseAllowed = !!doseNumber && doseOptions.includes(doseNumber)
  const interval = scheduleAllowed && doseAllowed ? SCHEDULE_INTERVALS[schedule as Exclude<Schedule, "">][doseNumber as Exclude<DoseNumber, "">] : null
  const previousDoseRequired = interval !== null && interval.minDays !== null
  const previousDoseDate = parseLocalDate(state.administration.previousDoseDate)
  const daysSincePrevious = previousDoseDate ? daysBetween(previousDoseDate, todayLocal()) : null
  const intervalTooShort =
    interval !== null && interval.minDays !== null && daysSincePrevious !== null && daysSincePrevious < interval.minDays
  const previousDoseInFuture = daysSincePrevious !== null && daysSincePrevious < 0
  const computedNextDue = interval !== null && interval.nextDays !== null ? addDays(interval.nextDays) : ""
  const courseCompleteWithThisDose = interval !== null && interval.nextDays === null
  const expiryDate = parseLocalDate(state.administration.expiryDate)
  const batchExpired = expiryDate !== null && daysBetween(todayLocal(), expiryDate) < 0

  // The next-due date and course-complete flag are derived from the schedule
  // and dose number (computedNextDue, courseCompleteWithThisDose) and written
  // into the record at save time: the written schedule the document requires
  // is computed, not typed from memory.

  const adminValid =
    !!given &&
    given === choice &&
    scheduleAllowed &&
    (!offLabelUsed || state.administration.offLabelScheduleConsented) &&
    doseAllowed &&
    (!previousDoseRequired || (previousDoseDate !== null && !intervalTooShort && !previousDoseInFuture)) &&
    !!state.administration.batchNumber &&
    expiryDate !== null &&
    !batchExpired &&
    !!state.administration.injectionSite &&
    !!state.administration.postObsMinutes &&
    state.administration.patientWell &&
    state.administration.anaphylaxisKitChecked &&
    (!state.administration.adverseReaction || !!state.administration.adverseReactionDetails.trim())

  const adminError = (() => {
    if (!given) return "Confirm the vaccine administered"
    if (given !== choice) return "The vaccine administered must match the vaccine chosen on the eligibility step; go back and change the choice if a different product was given"
    if (!schedule) return "Select the schedule"
    if (!scheduleAllowed) return `${SCHEDULE_LABEL[schedule]} is not a schedule the document permits for ${PRODUCT_LABEL[given]}`
    if (offLabelUsed && !state.administration.offLabelScheduleConsented) return "Very rapid schedule in a 16 or 17 year old is off-label: confirm it was explained and consented to, and recorded as such"
    if (!doseNumber) return "Record the dose number at this visit"
    if (!doseAllowed) return `${DOSE_LABEL[doseNumber]} is not part of the ${SCHEDULE_LABEL[schedule as Exclude<Schedule, "">]} schedule`
    if (previousDoseRequired && !previousDoseDate) return "Record the date of the previous dose"
    if (previousDoseInFuture) return "The previous dose date is in the future: check the date"
    if (intervalTooShort && interval && interval.minDays !== null) return `Only ${daysSincePrevious} days since the previous dose; the schedule minimum before ${DOSE_LABEL[doseNumber as Exclude<DoseNumber, "">].toLowerCase()} is ${interval.minDays} days. This dose is not due: rebook for ${addDays(interval.minDays - (daysSincePrevious ?? 0))}`
    if (!state.administration.batchNumber) return "Record the batch number"
    if (!expiryDate) return "Record the expiry date"
    if (batchExpired) return "Vaccine batch has expired: do not administer, quarantine the stock and select an in-date batch"
    if (!state.administration.injectionSite) return "Record the injection site"
    if (!state.administration.anaphylaxisKitChecked) return "Confirm adrenaline 1:1000 and the written anaphylaxis protocol are immediately available"
    if (!state.administration.postObsMinutes) return "Select the post-administration observation period"
    if (!state.administration.patientWell) return "Tick \"Observation period completed, seated, and patient remained well\" once the period has actually been completed"
    if (state.administration.adverseReaction && !state.administration.adverseReactionDetails.trim()) return "Record the adverse reaction and the action taken"
    return null
  })()

  const givenHasHepA = HEP_A_PRODUCTS.includes(given)
  const givenHasHepB = HEP_B_PRODUCTS.includes(given)

  const adviceValid =
    state.advice.sideEffectsCounselled &&
    state.advice.pilGiven &&
    state.advice.yellowCardLeafletGiven &&
    state.advice.vaccineRecordCardIssued &&
    state.advice.followUpScheduleAgreed &&
    state.advice.protectionByTravelExplained &&
    state.advice.hepCNotCoveredExplained &&
    !!state.advice.gpInformedDecision &&
    (!givenHasHepA || state.advice.foodAndWaterHygieneCounselled) &&
    (!givenHasHepB || state.advice.sexualHealthCounselling)

  const adviceError = (() => {
    if (!state.advice.sideEffectsCounselled) return "Tick \"Common local and systemic reactions and their self-limiting nature counselled\""
    if (!state.advice.pilGiven) return "Tick \"Manufacturer's patient information leaflet given\""
    if (!state.advice.yellowCardLeafletGiven) return "Tick \"Yellow Card scheme leaflet given / discussed\""
    if (!state.advice.vaccineRecordCardIssued) return "Tick \"Written record given (brand, strength, batch, date)\""
    if (!state.advice.followUpScheduleAgreed) return "Tick \"Schedule given in writing with the date each remaining dose is due\""
    if (!state.advice.protectionByTravelExplained) return "Tick \"Explicit about what protection the patient will and will not have by the time they travel\""
    if (!state.advice.hepCNotCoveredExplained) return "Tick \"Explained that vaccination does not protect against hepatitis C\""
    if (!state.advice.gpInformedDecision) return "Select an option under \"GP informed\": GP informed, or patient declined GP notification"
    if (givenHasHepA && !state.advice.foodAndWaterHygieneCounselled) return "Tick \"Risk reduction advice, hepatitis A: food and water hygiene\" (required for the vaccine given)"
    if (givenHasHepB && !state.advice.sexualHealthCounselling) return "Tick \"Risk reduction advice, hepatitis B\" (required for the vaccine given)"
    return "Please confirm every counselling point that applies to the vaccine given"
  })()

  const summaryError = (() => {
    const base = validateSummaryStep(state.summary)
    if (base) return base
    if (!parseLocalDate(state.summary.consultationDate)) return "Record the consultation date"
    if (!/^\d{2}:\d{2}$/.test(state.summary.consultationTime.trim())) return "Record the consultation time as HH:MM"
    return null
  })()

  const patientError = validatePatientStep(state.patient, { minAge: 1 })
  const consentError = (() => {
    const base = validateConsentStep(state.consent)
    if (base) return base
    if (isUnder16) {
      if (state.travel.consentBasis === "gillick" && !gillickOffered) return `Gillick competence is offered from ${GILLICK_MIN_AGE} years to 15 years; record consent from a person with parental responsibility for this child`
      if (state.travel.consentBasis !== "parental" && state.travel.consentBasis !== "gillick") return "Under 16: consent must come from a person with parental responsibility, or from the young person where assessed as Gillick competent"
      if (state.travel.consentBasis === "parental" && !state.travel.consentGivenBy.trim()) return "Record the name and relationship of the person with parental responsibility who consented"
      if (state.travel.consentBasis === "gillick" && !state.travel.consentGivenBy.trim()) return "Record the basis of the Gillick competence assessment"
    } else if (state.travel.consentBasis === "gillick") {
      return "Aged 16 or over: the patient consents in their own right"
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
    adviceValid ? null : adviceError,
    summaryError,
    summaryError,
  ]
  // A stop anywhere disables Next on every step, and Save & Print on the last.
  const canProceed = stepErrors[currentStep] === null && !blocked

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
        administration: { ...state.administration, nextDoseDueDate: computedNextDue, courseComplete: courseCompleteWithThisDose },
        pgdVersion: PGD_VERSION,
        product: blocked ? "" : given ? PRODUCT_LABEL[given] : "",
        scheduleLabel: schedule ? SCHEDULE_LABEL[schedule] : "",
        route: blocked ? "" : "Intramuscular",
        offLabelSchedule: offLabelUsed,
        nextDoseDueDate: computedNextDue,
        courseCompleteWithThisDose,
        exclusion: blocked
          ? { reason: blockReason, advice: state.eligibility.exclusionAdvice, referral: state.eligibility.exclusionReferral }
          : null,
        adverseReaction: state.administration.adverseReaction ? state.administration.adverseReactionDetails : null,
      } as unknown as Record<string, unknown>,
      outcome: blocked
        ? (state.eligibility.exclusionReferral && state.eligibility.exclusionReferral !== "declined" ? "referred" : "not_supplied")
        : !given
        ? "not_supplied"
        : "completed",
      ...(blocked || !given
        ? {}
        : {
            medicine: {
              name: PRODUCT_LABEL[given],
              dose: `${PRODUCT_LABEL[given].split(", ").slice(-1)[0]} intramuscular, ${doseNumber ? DOSE_LABEL[doseNumber as Exclude<DoseNumber, "">] : "dose"}${schedule ? `, ${SCHEDULE_LABEL[schedule]}` : ""}`,
              duration: courseCompleteWithThisDose ? "Course complete" : computedNextDue ? `Next dose due ${computedNextDue}` : "",
              quantity: 1,
            },
          }),
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.advice.gpInformedDecision === "informed" },
    }
  }, [state, given, schedule, offLabelUsed, blocked, blockReason, computedNextDue, courseCompleteWithThisDose, doseNumber])

  const exclusionOutcomeBlock = blocked ? (
    <div className="bg-red-100 border border-red-400 rounded-lg p-4 space-y-3 print:hidden">
      <p className="text-sm font-semibold text-red-900">Consultation blocked. {blockReason}</p>
      <p className="text-xs text-red-900">
        Give risk reduction advice regardless (food and water hygiene for hepatitis A; avoiding unprotected sex, unsterile tattooing, piercing and acupuncture, and not sharing needles or razors for hepatitis B). Document the reason, the advice given and the decision reached, then use &quot;Save as not supplied&quot; in the step footer.
      </p>
      <TextArea
        label="Advice given and decision reached"
        value={state.eligibility.exclusionAdvice}
        onChange={(v) => updateEligibility("exclusionAdvice", v)}
        rows={3}
        placeholder="e.g. Needlestick 2 days ago: post-exposure is outside this PGD, advised to attend A&E today; risk reduction advice given"
        required
      />
      <SelectInput
        label="Referral"
        value={state.eligibility.exclusionReferral}
        onChange={(v) => updateEligibility("exclusionReferral", v as HepABState["eligibility"]["exclusionReferral"])}
        options={[
          { value: "gp", label: "Referred to GP" },
          { value: "occupational-health", label: "Referred to occupational health" },
          { value: "travel-clinic", label: "Referred to a travel clinic" },
          { value: "hpt-urgent", label: "Post-exposure: urgent same-day referral (emergency care or Health Protection Team)" },
          { value: "declined", label: "Patient declined referral; advice given" },
        ]}
        required
      />
    </div>
  ) : null

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
        validationError={blocked && currentStep !== 3 ? `Exclusion criteria met: ${blockReason}` : stepErrors[currentStep]}
        isBlocked={blocked}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {currentStep !== 3 && currentStep !== 7 && exclusionOutcomeBlock}
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                patient: {
                  ...prev.patient,
                  [field]: value,
                  // Age is what every gate in this tool reads. It was never
                  // computed before (adversarial review, 11 Sep 2026).
                  ...(field === "dateOfBirth" ? { age: calculateAge(value as string) } : {}),
                },
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
                  { value: "parental", label: "A person with parental responsibility (patient is under 16)" },
                  ...(gillickOffered ? [{ value: "gillick", label: "The young person, assessed as Gillick competent (12 to 15 years)" }] : []),
                ]}
                required
              />
              {(state.travel.consentBasis === "parental" || state.travel.consentBasis === "gillick") && (
                <TextInput
                  label={state.travel.consentBasis === "gillick" ? "Basis of the Gillick competence assessment" : "Name and relationship of the person with parental responsibility"}
                  value={state.travel.consentGivenBy}
                  onChange={(v) => updateTravel("consentGivenBy", v)}
                  placeholder={state.travel.consentBasis === "gillick" ? "Why the young person was judged competent" : "e.g. Jane Smith, mother. A parent accompanying a child does not automatically hold parental responsibility. Ask."}
                  required
                />
              )}
              {isUnder16 && (
                <p className="text-xs text-amber-900">
                  Under 16: valid consent must come from a person with parental responsibility, or from the young person where you assess them as Gillick competent. Record which of the two applied.
                </p>
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
              required
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Departure date"
                type="date"
                value={state.travel.departureDate}
                onChange={(v) => updateTravel("departureDate", v)}
                required
              />
              <TextInput
                label="Duration (weeks, optional)"
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
              <p className="text-xs text-blue-900">
                Tick every risk factor that applies. Leave a box unticked where the answer is no. At least one inclusion line must be ticked for the vaccine chosen on the next step.
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
              <p className="text-xs text-gray-600">
                Ask about any previous hepatitis A or B vaccine. Leave both boxes unticked where the answer is no.
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
              {state.travel.previousHepAVaccine && (
                <Checkbox
                  label="Hepatitis A course COMPLETE (primary dose plus booster): no new primary dose; no further booster for immunocompetent adults"
                  checked={state.travel.previousHepACourseComplete}
                  onChange={(v) => updateTravel("previousHepACourseComplete", v)}
                />
              )}
              {state.travel.previousHepBVaccine && (
                <Checkbox
                  label="Hepatitis B primary course COMPLETE: no new primary course; immunocompetent people do not need a reinforcing dose"
                  checked={state.travel.previousHepBCourseComplete}
                  onChange={(v) => updateTravel("previousHepBCourseComplete", v)}
                />
              )}
              <Checkbox
                label="Sufficient information is available about any previous hepatitis A or B vaccination (inclusion criterion; required, tick this also when the patient has never been vaccinated)"
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
                    Engerix-B Paediatric (0.5 mL IM, 1&ndash;15y)
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
              <p className="text-xs text-red-900">
                Ask each one. Leave the box unticked where the answer is no.
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
                  required
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
                  required
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

            {exclusionOutcomeBlock}
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
                    ev.target.value as DoseNumber
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
              >
                <option value="">Select</option>
                {doseOptions.map((d) => (
                  <option key={d} value={d}>
                    {d === "booster"
                      ? schedule === "hepa-single-booster-6-12m"
                        ? "Booster (6 to 12 months after the first dose)"
                        : "12-month dose (booster after the accelerated or very rapid schedule)"
                      : DOSE_LABEL[d as Exclude<DoseNumber, "">]}
                  </option>
                ))}
              </select>
              {!schedule && <p className="text-xs text-gray-500 mt-1">Select the schedule first; only its dose numbers are offered.</p>}
            </div>

            {previousDoseRequired && (
              <div>
                <TextInput
                  label="Date of the previous dose"
                  type="date"
                  value={state.administration.previousDoseDate}
                  onChange={(v) => updateAdmin("previousDoseDate", v)}
                  required
                />
                {interval && interval.minDays !== null && (
                  <p className={`text-xs mt-1 ${intervalTooShort ? "text-red-600" : "text-gray-500"}`}>
                    {daysSincePrevious !== null && daysSincePrevious >= 0
                      ? `${daysSincePrevious} days since the previous dose (schedule minimum ${interval.minDays} days). ${intervalTooShort ? "Not due: rebook." : daysSincePrevious > interval.minDays * 2 ? "Late dose: resume, do not restart (document rule)." : "Due."}`
                      : `Schedule minimum ${interval.minDays} days since the previous dose.`}
                  </p>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Batch number"
                value={state.administration.batchNumber}
                onChange={(v) => updateAdmin("batchNumber", v)}
                required
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.administration.expiryDate}
                onChange={(v) => updateAdmin("expiryDate", v)}
                required
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
              label="Observation period completed, seated, and patient remained well (required)"
              checked={state.administration.patientWell}
              onChange={(v) => updateAdmin("patientWell", v)}
            />
            <Checkbox
              label="Adrenaline 1:1000 injection immediately available, in date, with a written anaphylaxis protocol consistent with Resuscitation Council UK guidance (required)"
              checked={state.administration.anaphylaxisKitChecked}
              onChange={(v) => updateAdmin("anaphylaxisKitChecked", v)}
            />
            <Checkbox
              label="Adverse reaction at this visit"
              checked={state.administration.adverseReaction}
              onChange={(v) => { updateAdmin("adverseReaction", v); if (!v) updateAdmin("adverseReactionDetails", "") }}
            />
            {state.administration.adverseReaction && (
              <TextArea
                label="Adverse reaction and action taken (report via Yellow Card and inform the GP)"
                value={state.administration.adverseReactionDetails}
                onChange={(v) => updateAdmin("adverseReactionDetails", v)}
                rows={2}
                required
              />
            )}

            {interval && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold">{courseCompleteWithThisDose ? "Course complete with this dose" : `Next dose due: ${computedNextDue}`}</p>
                <p className="text-xs mt-1">{interval.nextLabel}. Computed from the schedule and dose number; give it to the patient in writing.</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Tick each item once it has been done. Every item on this step is required except where marked optional.
            </p>
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
            <SelectInput
              label="GP informed (the document says the individual's GP should be informed)"
              value={state.advice.gpInformedDecision}
              onChange={(v) => {
                updateAdvice("gpInformedDecision", v as "" | "informed" | "declined")
                updateAdvice("gpInformed", v === "informed")
                // Keep the optional GP-copy tick on the Consent step in line
                // with this answer, so the saved consent does not contradict it.
                setState((prev) => ({ ...prev, consent: { ...prev.consent, notifyGp: v === "informed" } }))
              }}
              options={[
                { value: "informed", label: "GP informed (with the patient's consent)" },
                { value: "declined", label: "Patient declined GP notification; recorded" },
              ]}
              required
            />
            <Checkbox
              label="Wider travel health advice provided (TravelHealthPro signposted) (optional)"
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
                required
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
                required
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
                required
                value={state.summary.consultationDate}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    summary: { ...prev.summary, consultationDate: v },
                  }))
                }
              />
              <TextInput
                label="Consultation time (HH:MM)"
                required
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
          <div className="space-y-4">
            {exclusionOutcomeBlock}
            <HepABSummaryReport
              state={state}
              blocked={blocked}
              blockReason={blockReason}
              nextDoseDueDate={computedNextDue}
              courseComplete={courseCompleteWithThisDose}
              offLabelUsed={offLabelUsed}
            />
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

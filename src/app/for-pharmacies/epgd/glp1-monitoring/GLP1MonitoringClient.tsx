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
// GLP-1 Ongoing Monitoring & Dose Titration ePGD
//
// For patients already on injectable Wegovy (semaglutide), Mounjaro
// (tirzepatide), or licensed Oral Wegovy (semaglutide 25/50 mg). Covers
// follow-up review, weight-loss assessment against the 5%-by-12-weeks
// gate, side-effect screening, and dose-titration decisions (continue
// same / step up / hold / step down / stop).
//
// References: BNF GLP-1 receptor agonists; Wegovy SPC; Mounjaro SPC;
// Oral Wegovy SPC (UK 2026); NICE TA875 (semaglutide for weight
// management); NICE TA1026 (tirzepatide for weight management).
// ─────────────────────────────────────────────────────────────────────────

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "Treatment History",
  "Progress & Weight Review",
  "Safety & Side Effect Review",
  "Dose Decision",
  "Pharmacist Summary",
  "Consultation Complete",
]

type Product = "" | "wegovy" | "mounjaro" | "wegovy-oral"
type WegovyDose = "0.25" | "0.5" | "1.0" | "1.7" | "2.4" | ""
type MounjaroDose = "2.5" | "5" | "7.5" | "10" | "12.5" | "15" | ""
type WegovyOralDose = "25" | "50" | ""
type Decision = "" | "continue" | "step-up" | "hold" | "step-down" | "stop" | "refer"

export function GLP1MonitoringClient() {
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
    treatment: {
      product: "" as Product,
      currentWegovyDose: "" as WegovyDose,
      currentMounjaroDose: "" as MounjaroDose,
      currentWegovyOralDose: "" as WegovyOralDose,
      weeksOnTherapy: "",
      lastDoseDate: "",
      missedDosesRecent: false,
      missedDosesDetail: "",
      previousDoseEscalations: "",
    },
    progress: {
      baselineWeightKg: "",
      currentWeightKg: "",
      heightCm: "",
      weightChangePct: null as number | null, // computed
      meeting5pctBy12wkGate: false,
      patientReportedAppetiteControl: "" as
        | ""
        | "very-good"
        | "good"
        | "partial"
        | "poor",
      patientSatisfaction: "" as "" | "satisfied" | "neutral" | "dissatisfied",
      lifestyleAdherenceDietExercise: false,
    },
    safety: {
      // Common / expected
      nauseaOrVomiting: false,
      diarrhoeaOrConstipation: false,
      injectionSiteReaction: false,
      headache: false,
      fatigue: false,
      // Significant / referable
      severeAbdominalPain: false, // pancreatitis red flag
      persistentVomiting: false, // dehydration / DKA risk
      jaundiceOrPaleStools: false, // biliary / hepatic
      gallstoneSymptoms: false,
      visualChanges: false, // diabetic retinopathy worsening (T2DM context)
      hypoglycaemia: false,
      newPregnancy: false,
      newBreastCancerHistory: false,
      newMtcOrMen2Concern: false,
      severeAcutePsychiatricChange: false,
      // Empty-stomach issue (oral product)
      oralAdminAdherenceProblem: false, // only relevant if wegovy-oral
      sideEffectFreeText: "",
    },
    decision: {
      action: "" as Decision,
      newWegovyDose: "" as WegovyDose,
      newMounjaroDose: "" as MounjaroDose,
      newWegovyOralDose: "" as WegovyOralDose,
      nextReviewWeeks: "",
      counsellingProvided: false,
      lifestyleAdviceReinforced: false,
      yellowCardDiscussed: false,
      gpInformed: false,
      rationaleNotes: "",
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

  // Compute weight-loss percentage and gate
  useEffect(() => {
    const baseline = parseFloat(state.progress.baselineWeightKg)
    const current = parseFloat(state.progress.currentWeightKg)
    if (
      !isNaN(baseline) &&
      baseline > 0 &&
      !isNaN(current) &&
      current > 0
    ) {
      const pct = ((baseline - current) / baseline) * 100
      setState((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          weightChangePct: Number(pct.toFixed(1)),
          meeting5pctBy12wkGate: pct >= 5,
        },
      }))
    }
  }, [state.progress.baselineWeightKg, state.progress.currentWeightKg])

  const handleNext = useCallback(
    () => setCurrentStep((s) => Math.min(s + 1, STEP_TITLES.length - 1)),
    []
  )
  const handlePrev = useCallback(
    () => setCurrentStep((s) => Math.max(s - 1, 0)),
    []
  )

  function updateTreatment<K extends keyof typeof state.treatment>(
    field: K,
    value: typeof state.treatment[K]
  ) {
    setState((prev) => ({
      ...prev,
      treatment: { ...prev.treatment, [field]: value },
    }))
  }
  function updateProgress<K extends keyof typeof state.progress>(
    field: K,
    value: typeof state.progress[K]
  ) {
    setState((prev) => ({
      ...prev,
      progress: { ...prev.progress, [field]: value },
    }))
  }
  function updateSafety<K extends keyof typeof state.safety>(
    field: K,
    value: typeof state.safety[K]
  ) {
    setState((prev) => ({
      ...prev,
      safety: { ...prev.safety, [field]: value },
    }))
  }
  function updateDecision<K extends keyof typeof state.decision>(
    field: K,
    value: typeof state.decision[K]
  ) {
    setState((prev) => ({
      ...prev,
      decision: { ...prev.decision, [field]: value },
    }))
  }

  // Red-flag detection — any of these forces "refer" / "stop" decision
  const redFlag =
    state.safety.severeAbdominalPain ||
    state.safety.persistentVomiting ||
    state.safety.jaundiceOrPaleStools ||
    state.safety.gallstoneSymptoms ||
    state.safety.newPregnancy ||
    state.safety.newBreastCancerHistory ||
    state.safety.newMtcOrMen2Concern ||
    state.safety.severeAcutePsychiatricChange

  // ── Validation ─────────────────────────────────────────────────────
  const treatmentValid =
    !!state.treatment.product &&
    !!state.treatment.weeksOnTherapy &&
    !!state.treatment.lastDoseDate &&
    // Product-specific dose must be set
    ((state.treatment.product === "wegovy" && !!state.treatment.currentWegovyDose) ||
      (state.treatment.product === "mounjaro" && !!state.treatment.currentMounjaroDose) ||
      (state.treatment.product === "wegovy-oral" && !!state.treatment.currentWegovyOralDose))

  const progressValid =
    !!state.progress.baselineWeightKg &&
    !!state.progress.currentWeightKg &&
    !!state.progress.heightCm &&
    !!state.progress.patientReportedAppetiteControl

  const decisionValid =
    !!state.decision.action &&
    !!state.decision.nextReviewWeeks &&
    state.decision.counsellingProvided

  const canProceedByStep = [
    true,
    true,
    treatmentValid,
    progressValid,
    true, // safety review always lets user proceed, decision step enforces
    decisionValid,
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
        validationError={!canProceed ? "Please complete all required fields" : null}
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
            requireAdult={true}
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
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Current product <span className="text-red-400">*</span>
              </label>
              <select
                value={state.treatment.product}
                onChange={(ev) =>
                  updateTreatment("product", ev.target.value as Product)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="wegovy">Wegovy (semaglutide injection, 0.25–2.4 mg weekly)</option>
                <option value="mounjaro">Mounjaro (tirzepatide injection, 2.5–15 mg weekly)</option>
                <option value="wegovy-oral">Oral Wegovy (semaglutide 25/50 mg daily)</option>
              </select>
            </div>

            {state.treatment.product === "wegovy" && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Current Wegovy dose <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.treatment.currentWegovyDose}
                  onChange={(ev) =>
                    updateTreatment("currentWegovyDose", ev.target.value as WegovyDose)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— select —</option>
                  <option value="0.25">0.25 mg weekly (week 1–4)</option>
                  <option value="0.5">0.5 mg weekly (week 5–8)</option>
                  <option value="1.0">1.0 mg weekly (week 9–12)</option>
                  <option value="1.7">1.7 mg weekly (week 13–16)</option>
                  <option value="2.4">2.4 mg weekly (maintenance, week 17+)</option>
                </select>
              </div>
            )}

            {state.treatment.product === "mounjaro" && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Current Mounjaro dose <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.treatment.currentMounjaroDose}
                  onChange={(ev) =>
                    updateTreatment("currentMounjaroDose", ev.target.value as MounjaroDose)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— select —</option>
                  <option value="2.5">2.5 mg weekly (week 1–4, starter)</option>
                  <option value="5">5 mg weekly (week 5–8)</option>
                  <option value="7.5">7.5 mg weekly (week 9–12)</option>
                  <option value="10">10 mg weekly (week 13–16)</option>
                  <option value="12.5">12.5 mg weekly (week 17–20)</option>
                  <option value="15">15 mg weekly (maintenance, week 21+)</option>
                </select>
              </div>
            )}

            {state.treatment.product === "wegovy-oral" && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Current Oral Wegovy dose <span className="text-red-400">*</span>
                </label>
                <select
                  value={state.treatment.currentWegovyOralDose}
                  onChange={(ev) =>
                    updateTreatment("currentWegovyOralDose", ev.target.value as WegovyOralDose)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— select —</option>
                  <option value="25">25 mg daily (initial maintenance)</option>
                  <option value="50">50 mg daily (target maintenance)</option>
                </select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Weeks on therapy"
                type="number"
                value={state.treatment.weeksOnTherapy}
                onChange={(v) => updateTreatment("weeksOnTherapy", v)}
                placeholder="e.g. 12"
              />
              <TextInput
                label="Last dose date"
                type="date"
                value={state.treatment.lastDoseDate}
                onChange={(v) => updateTreatment("lastDoseDate", v)}
              />
            </div>

            <Checkbox
              label="Missed doses in the last month"
              checked={state.treatment.missedDosesRecent}
              onChange={(v) => updateTreatment("missedDosesRecent", v)}
            />
            {state.treatment.missedDosesRecent && (
              <TextArea
                label="Missed-dose details (how many, reason, action taken)"
                value={state.treatment.missedDosesDetail}
                onChange={(v) => updateTreatment("missedDosesDetail", v)}
                rows={2}
              />
            )}

            <TextArea
              label="Previous dose escalations (when and to what)"
              value={state.treatment.previousDoseEscalations}
              onChange={(v) => updateTreatment("previousDoseEscalations", v)}
              rows={2}
              placeholder="e.g. 0.25 → 0.5 mg on 4 Mar; 0.5 → 1.0 mg on 1 Apr"
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <TextInput
                label="Baseline weight (kg)"
                type="number"
                value={state.progress.baselineWeightKg}
                onChange={(v) => updateProgress("baselineWeightKg", v)}
                placeholder="e.g. 102.5"
              />
              <TextInput
                label="Current weight (kg)"
                type="number"
                value={state.progress.currentWeightKg}
                onChange={(v) => updateProgress("currentWeightKg", v)}
                placeholder="e.g. 96.0"
              />
              <TextInput
                label="Height (cm)"
                type="number"
                value={state.progress.heightCm}
                onChange={(v) => updateProgress("heightCm", v)}
                placeholder="e.g. 178"
              />
            </div>

            {state.progress.weightChangePct !== null && (
              <div
                className={`p-4 rounded-lg border ${
                  state.progress.meeting5pctBy12wkGate
                    ? "bg-green-50 border-green-300"
                    : "bg-amber-50 border-amber-300"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    state.progress.meeting5pctBy12wkGate
                      ? "text-green-900"
                      : "text-amber-900"
                  }`}
                >
                  Weight change: {state.progress.weightChangePct}%
                  {state.progress.meeting5pctBy12wkGate
                    ? " — meets the 5% gate"
                    : " — below the 5% gate (consider whether response is adequate at this duration)"}
                </p>
                {parseInt(state.treatment.weeksOnTherapy) >= 12 &&
                  !state.progress.meeting5pctBy12wkGate && (
                    <p className="text-xs text-amber-800 mt-2">
                      Patient is ≥12 weeks into therapy and has not reached 5%
                      weight loss. Per NICE TA875/TA1026 guidance, consider
                      whether continuing treatment is appropriate or whether
                      to step up dose / refer / step down / stop.
                    </p>
                  )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Patient-reported appetite control{" "}
                <span className="text-red-400">*</span>
              </label>
              <select
                value={state.progress.patientReportedAppetiteControl}
                onChange={(ev) =>
                  updateProgress(
                    "patientReportedAppetiteControl",
                    ev.target.value as "" | "very-good" | "good" | "partial" | "poor"
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="very-good">Very good — strong satiety effect</option>
                <option value="good">Good — noticeably reduced</option>
                <option value="partial">Partial — some effect, intermittent</option>
                <option value="poor">Poor — minimal change from baseline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Patient satisfaction with progress
              </label>
              <select
                value={state.progress.patientSatisfaction}
                onChange={(ev) =>
                  updateProgress(
                    "patientSatisfaction",
                    ev.target.value as "" | "satisfied" | "neutral" | "dissatisfied"
                  )
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="satisfied">Satisfied</option>
                <option value="neutral">Neutral</option>
                <option value="dissatisfied">Dissatisfied</option>
              </select>
            </div>

            <Checkbox
              label="Patient is sticking to dietary and physical activity recommendations"
              checked={state.progress.lifestyleAdherenceDietExercise}
              onChange={(v) => updateProgress("lifestyleAdherenceDietExercise", v)}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">
                Expected side effects — note presence but generally continue
              </p>
              <Checkbox
                label="Nausea or vomiting (mild/moderate, usually transient)"
                checked={state.safety.nauseaOrVomiting}
                onChange={(v) => updateSafety("nauseaOrVomiting", v)}
              />
              <Checkbox
                label="Diarrhoea or constipation"
                checked={state.safety.diarrhoeaOrConstipation}
                onChange={(v) => updateSafety("diarrhoeaOrConstipation", v)}
              />
              <Checkbox
                label="Injection site reaction (injectable products)"
                checked={state.safety.injectionSiteReaction}
                onChange={(v) => updateSafety("injectionSiteReaction", v)}
              />
              <Checkbox
                label="Headache"
                checked={state.safety.headache}
                onChange={(v) => updateSafety("headache", v)}
              />
              <Checkbox
                label="Fatigue"
                checked={state.safety.fatigue}
                onChange={(v) => updateSafety("fatigue", v)}
              />
            </div>

            <div className="bg-red-50 border border-red-300 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-red-900">
                Red flags — any of these triggers HOLD / STOP / REFER on next step
              </p>
              <Checkbox
                label="Severe persistent abdominal pain (consider pancreatitis — refer urgently)"
                checked={state.safety.severeAbdominalPain}
                onChange={(v) => updateSafety("severeAbdominalPain", v)}
              />
              <Checkbox
                label="Persistent vomiting with dehydration risk"
                checked={state.safety.persistentVomiting}
                onChange={(v) => updateSafety("persistentVomiting", v)}
              />
              <Checkbox
                label="Jaundice, pale stools, or right upper-quadrant pain (biliary / hepatic)"
                checked={state.safety.jaundiceOrPaleStools}
                onChange={(v) => updateSafety("jaundiceOrPaleStools", v)}
              />
              <Checkbox
                label="Gallstone symptoms (RUQ pain, post-fatty-meal pain)"
                checked={state.safety.gallstoneSymptoms}
                onChange={(v) => updateSafety("gallstoneSymptoms", v)}
              />
              <Checkbox
                label="Visual changes (T2DM context — diabetic retinopathy review)"
                checked={state.safety.visualChanges}
                onChange={(v) => updateSafety("visualChanges", v)}
              />
              <Checkbox
                label="Hypoglycaemia episodes (T2DM context — consider concomitant therapy adjustment)"
                checked={state.safety.hypoglycaemia}
                onChange={(v) => updateSafety("hypoglycaemia", v)}
              />
              <Checkbox
                label="New pregnancy or planning pregnancy (must stop and use effective contraception)"
                checked={state.safety.newPregnancy}
                onChange={(v) => updateSafety("newPregnancy", v)}
              />
              <Checkbox
                label="New personal or family history of medullary thyroid carcinoma / MEN2"
                checked={state.safety.newMtcOrMen2Concern}
                onChange={(v) => updateSafety("newMtcOrMen2Concern", v)}
              />
              <Checkbox
                label="New diagnosis of breast cancer or active malignancy"
                checked={state.safety.newBreastCancerHistory}
                onChange={(v) => updateSafety("newBreastCancerHistory", v)}
              />
              <Checkbox
                label="Severe acute psychiatric change (low mood, suicidal ideation, self-harm thoughts)"
                checked={state.safety.severeAcutePsychiatricChange}
                onChange={(v) => updateSafety("severeAcutePsychiatricChange", v)}
              />
              {state.treatment.product === "wegovy-oral" && (
                <Checkbox
                  label="Significant difficulty with empty-stomach administration (Oral Wegovy specific — may need switch to injectable)"
                  checked={state.safety.oralAdminAdherenceProblem}
                  onChange={(v) => updateSafety("oralAdminAdherenceProblem", v)}
                />
              )}
            </div>

            <TextArea
              label="Other side effects / patient concerns (free text)"
              value={state.safety.sideEffectFreeText}
              onChange={(v) => updateSafety("sideEffectFreeText", v)}
              rows={3}
            />

            {redFlag && (
              <div className="bg-red-100 border border-red-400 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-900">
                  Red flag detected. On the next step, the recommended action
                  is REFER (severe pathology), HOLD (until investigated), or
                  STOP (pregnancy / malignancy / persistent severe reaction)
                  rather than continuing or escalating dose.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">
                Decision <span className="text-red-400">*</span>
              </label>
              <select
                value={state.decision.action}
                onChange={(ev) =>
                  updateDecision("action", ev.target.value as Decision)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">— select —</option>
                <option value="continue">
                  Continue current dose (tolerating well, on track)
                </option>
                <option value="step-up">
                  Step up to next dose (tolerating, response below target,
                  next titration step due)
                </option>
                <option value="hold">
                  Hold at current dose (intolerable side effects, retry
                  escalation later)
                </option>
                <option value="step-down">
                  Step down to previous dose (intolerable at current dose)
                </option>
                <option value="stop">
                  Stop treatment (red flag / failure to achieve 5% by 12 wks
                  on maintenance dose / patient choice)
                </option>
                <option value="refer">
                  Refer to GP / specialist (red flag requiring investigation)
                </option>
              </select>
            </div>

            {state.decision.action === "step-up" && state.treatment.product === "wegovy" && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  New Wegovy dose
                </label>
                <select
                  value={state.decision.newWegovyDose}
                  onChange={(ev) =>
                    updateDecision("newWegovyDose", ev.target.value as WegovyDose)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— select —</option>
                  <option value="0.5">0.5 mg weekly</option>
                  <option value="1.0">1.0 mg weekly</option>
                  <option value="1.7">1.7 mg weekly</option>
                  <option value="2.4">2.4 mg weekly (maintenance)</option>
                </select>
              </div>
            )}

            {state.decision.action === "step-up" && state.treatment.product === "mounjaro" && (
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  New Mounjaro dose
                </label>
                <select
                  value={state.decision.newMounjaroDose}
                  onChange={(ev) =>
                    updateDecision("newMounjaroDose", ev.target.value as MounjaroDose)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— select —</option>
                  <option value="5">5 mg weekly</option>
                  <option value="7.5">7.5 mg weekly</option>
                  <option value="10">10 mg weekly</option>
                  <option value="12.5">12.5 mg weekly</option>
                  <option value="15">15 mg weekly (maintenance)</option>
                </select>
              </div>
            )}

            {state.decision.action === "step-up" &&
              state.treatment.product === "wegovy-oral" && (
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    New Oral Wegovy dose
                  </label>
                  <select
                    value={state.decision.newWegovyOralDose}
                    onChange={(ev) =>
                      updateDecision(
                        "newWegovyOralDose",
                        ev.target.value as WegovyOralDose
                      )
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="">— select —</option>
                    <option value="50">50 mg daily (target maintenance)</option>
                  </select>
                </div>
              )}

            <TextInput
              label="Next review (weeks)"
              type="number"
              value={state.decision.nextReviewWeeks}
              onChange={(v) => updateDecision("nextReviewWeeks", v)}
              placeholder="e.g. 4 (titrating) or 12 (maintenance)"
            />

            <TextArea
              label="Decision rationale / clinical notes"
              value={state.decision.rationaleNotes}
              onChange={(v) => updateDecision("rationaleNotes", v)}
              rows={4}
              placeholder="Why this dose decision. Quote weight change, tolerability, patient preference, anything relevant."
            />

            <Checkbox
              label="Counselling provided (decision rationale, side effects, what to do if reaction)"
              checked={state.decision.counsellingProvided}
              onChange={(v) => updateDecision("counsellingProvided", v)}
            />
            <Checkbox
              label="Lifestyle (diet / activity) advice reinforced"
              checked={state.decision.lifestyleAdviceReinforced}
              onChange={(v) => updateDecision("lifestyleAdviceReinforced", v)}
            />
            <Checkbox
              label="Yellow Card scheme discussed for any side effects experienced"
              checked={state.decision.yellowCardDiscussed}
              onChange={(v) => updateDecision("yellowCardDiscussed", v)}
            />
            <Checkbox
              label="GP informed of decision (with consent)"
              checked={state.decision.gpInformed}
              onChange={(v) => updateDecision("gpInformed", v)}
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
              placeholder="Anything else worth recording for the next review — patient queries, planned lifestyle changes, comorbidity reviews."
            />
          </div>
        )}

        {currentStep === 7 && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-6">
            <p className="text-lg font-semibold text-green-900 mb-2">
              Monitoring consultation complete
            </p>
            <p className="text-sm text-green-900">
              Decision recorded: {state.decision.action || "—"}. Next review in{" "}
              {state.decision.nextReviewWeeks || "—"} weeks.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

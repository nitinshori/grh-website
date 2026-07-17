"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, NumberInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"

const STEP_TITLES = [
  "Patient Details",
  "Consent",
  "BMI & Initial Assessment",
  "Eligibility (Exclusions/Cautions)",
  "Dose Plan & Supply",
  "Counselling & Follow-up",
  "Pharmacist Summary",
  "Consultation Complete",
]

const DOSE_TITRATION = [
  { week: "Week 1", morning: "1 tab", evening: "—" },
  { week: "Week 2", morning: "1 tab", evening: "1 tab" },
  { week: "Week 3", morning: "2 tabs", evening: "1 tab" },
  { week: "Week 4+ maintenance", morning: "2 tabs", evening: "2 tabs" },
]

export function MysimbaClient() {
  const [currentStep, setCurrentStep] = useState(0)

  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    assessment: {
      heightCm: null as number | null,
      weightKg: null as number | null,
      bmi: null as number | null,
      hasComorbidity: false,
      comorbidityDetails: "",
      previousWeightLossAttempts: "",
      patientGoal: "",
    },
    eligibility: {
      // Exclusions per Janey's Mysimba amendments
      ageUnder18: false,
      ageOver75: false,
      hypersensitivityNaltrexone: false,
      hypersensitivityBupropion: false,
      hypersensitivityExcipients: false,
      concomitantNaltrexone: false,
      concomitantBupropion: false,
      uncontrolledHypertension: false,
      seizureDisorder: false,
      cnsTumour: false,
      acuteAlcoholOrBenzodiazepineWithdrawal: false,
      bipolarHistory: false,
      bulimiaAnorexiaHistory: false,
      opioidUse: false,
      maoiUse: false,
      severeHepatic: false,
      endStageRenal: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancy: false,
      galactoseIntolerance: false,
      clinicallySignificantInteraction: false,
      // Cautions per Janey: monitor closely
      ageUnder25: false,
      depressionHistory: false,
      brugadaSyndrome: false,
      brugadaFamilyHistory: false,
      hepaticImpairment: false,
      renalImpairment: false,
      hypertensionControlled: false,
      cardiovascularDisease: false,
      drivingMachinery: false,
    },
    treatment: {
      doseStage: "" as "" | "init" | "1" | "2" | "3" | "4",
      supplyWeeks: "" as "" | "4" | "8" | "12",
      sixteenWeekReviewDate: "",
      productBatch: "",
      productExpiry: "",
    },
    counselling: {
      adminText: false,
      tabletNotCrushedChewed: false,
      withFood: false,
      sideEffectsDiscussed: false,
      suicidalIdeationCounselled: false,
      hepatotoxicityWarning: false,
      drivingMachineryAdvice: false,
      noAlcoholAdvice: false,
      sixteenWeekReviewExplained: false,
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

  function updateAssessment<K extends keyof typeof state.assessment>(field: K, value: typeof state.assessment[K]) {
    setState((prev) => {
      const ns = { ...prev, assessment: { ...prev.assessment, [field]: value } }
      if (field === "heightCm" || field === "weightKg") {
        const h = (field === "heightCm" ? value : ns.assessment.heightCm) as number | null
        const w = (field === "weightKg" ? value : ns.assessment.weightKg) as number | null
        if (h && w && h > 0) {
          ns.assessment.bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10
        }
      }
      return ns
    })
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

  const bmi = state.assessment.bmi
  const bmiEligible = !!(bmi && (bmi >= 30 || (bmi >= 27 && state.assessment.hasComorbidity)))
  const assessmentValid = !!bmi && !!state.assessment.heightCm && !!state.assessment.weightKg && bmiEligible

  // Any exclusion = stop
  const e = state.eligibility
  const anyExclusion =
    e.ageUnder18 || e.ageOver75 ||
    e.hypersensitivityNaltrexone || e.hypersensitivityBupropion || e.hypersensitivityExcipients ||
    e.concomitantNaltrexone || e.concomitantBupropion ||
    e.uncontrolledHypertension || e.seizureDisorder || e.cnsTumour ||
    e.acuteAlcoholOrBenzodiazepineWithdrawal || e.bipolarHistory ||
    e.bulimiaAnorexiaHistory || e.opioidUse || e.maoiUse ||
    e.severeHepatic || e.endStageRenal ||
    e.pregnant || e.breastfeeding || e.planningPregnancy ||
    e.galactoseIntolerance || e.clinicallySignificantInteraction
  const eligibilityValid = !anyExclusion

  const treatmentValid = !!state.treatment.doseStage && !!state.treatment.productBatch && !!state.treatment.productExpiry
  const counsellingValid =
    state.counselling.adminText &&
    state.counselling.sideEffectsDiscussed &&
    state.counselling.suicidalIdeationCounselled &&
    state.counselling.hepatotoxicityWarning &&
    state.counselling.sixteenWeekReviewExplained

  const canProceedByStep = [true, true, assessmentValid, eligibilityValid, treatmentValid, counsellingValid, true, true]
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
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <p className="font-semibold mb-1">Initial assessment</p>
              <p>Discuss weight history, mental-health history, diet, exercise, expectations. Mysimba is an adjunct to a reduced-calorie diet and increased physical activity. Particularly relevant for patients who struggle with food cravings.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Height (cm)" value={state.assessment.heightCm} onChange={(v) => updateAssessment("heightCm", v)} min={120} max={220} unit="cm" />
              <NumberInput label="Weight (kg)" value={state.assessment.weightKg} onChange={(v) => updateAssessment("weightKg", v)} min={40} max={250} unit="kg" />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy-900">Calculated BMI</span>
                <span className="text-xl font-bold text-navy-900">{bmi ?? "—"} {bmi ? "kg/m²" : ""}</span>
              </div>
              {bmi !== null && (
                <p className="mt-1 text-xs text-gray-600">
                  Eligibility: BMI ≥30 OR ≥27 with comorbidity
                  {bmiEligible ? " — ✓ ELIGIBLE" : " — ✗ NOT ELIGIBLE"}.
                </p>
              )}
            </div>

            <Checkbox label="Weight-related comorbidity present" checked={state.assessment.hasComorbidity} onChange={(v) => updateAssessment("hasComorbidity", v)} description="e.g. dysglycaemia, hypertension (CONTROLLED), dyslipidaemia, OSA." />
            {state.assessment.hasComorbidity && <TextInput label="Comorbidity details" value={state.assessment.comorbidityDetails} onChange={(v) => updateAssessment("comorbidityDetails", v)} />}
            <TextArea label="Previous weight-loss attempts" value={state.assessment.previousWeightLossAttempts} onChange={(v) => updateAssessment("previousWeightLossAttempts", v)} rows={2} />
            <TextArea label="Patient's goal and expectations" value={state.assessment.patientGoal} onChange={(v) => updateAssessment("patientGoal", v)} rows={2} />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Exclusion criteria</p>
              <p>Mysimba has a substantial exclusion list. Any ticked item below blocks this PGD — refer to GP / specialist weight management service.</p>
            </div>

            <p className="text-sm font-semibold text-navy-900">Demographics</p>
            <Checkbox label="Age under 18 or over 75" checked={e.ageUnder18 || e.ageOver75} onChange={(v) => { updateEligibility("ageUnder18", v); updateEligibility("ageOver75", v); }} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Hypersensitivity / concomitant therapy</p>
            <Checkbox label="Known hypersensitivity to naltrexone" checked={e.hypersensitivityNaltrexone} onChange={(v) => updateEligibility("hypersensitivityNaltrexone", v)} />
            <Checkbox label="Known hypersensitivity to bupropion" checked={e.hypersensitivityBupropion} onChange={(v) => updateEligibility("hypersensitivityBupropion", v)} />
            <Checkbox label="Known hypersensitivity to any excipient (including lactose)" checked={e.hypersensitivityExcipients} onChange={(v) => updateEligibility("hypersensitivityExcipients", v)} />
            <Checkbox label="Currently taking naltrexone (any other product)" checked={e.concomitantNaltrexone} onChange={(v) => updateEligibility("concomitantNaltrexone", v)} />
            <Checkbox label="Currently taking bupropion (any other product)" checked={e.concomitantBupropion} onChange={(v) => updateEligibility("concomitantBupropion", v)} />
            <Checkbox label="On MAOI within last 14 days (or planning to start)" checked={e.maoiUse} onChange={(v) => updateEligibility("maoiUse", v)} />
            <Checkbox label="Currently taking opioid analgesics or opioid replacement therapy" checked={e.opioidUse} onChange={(v) => updateEligibility("opioidUse", v)} />
            <Checkbox label="Clinically significant drug interaction with current medication" checked={e.clinicallySignificantInteraction} onChange={(v) => updateEligibility("clinicallySignificantInteraction", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">CNS / seizure risk</p>
            <Checkbox label="Current or history of seizure disorder" checked={e.seizureDisorder} onChange={(v) => updateEligibility("seizureDisorder", v)} />
            <Checkbox label="History of CNS tumour" checked={e.cnsTumour} onChange={(v) => updateEligibility("cnsTumour", v)} />
            <Checkbox label="Acute alcohol or benzodiazepine withdrawal" checked={e.acuteAlcoholOrBenzodiazepineWithdrawal} onChange={(v) => updateEligibility("acuteAlcoholOrBenzodiazepineWithdrawal", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Mental health / eating disorders</p>
            <Checkbox label="Current or history of bipolar disorder" checked={e.bipolarHistory} onChange={(v) => updateEligibility("bipolarHistory", v)} />
            <Checkbox label="Current or history of anorexia nervosa or bulimia" checked={e.bulimiaAnorexiaHistory} onChange={(v) => updateEligibility("bulimiaAnorexiaHistory", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Organ function</p>
            <Checkbox label="Severe hepatic impairment (Child-Pugh C)" checked={e.severeHepatic} onChange={(v) => updateEligibility("severeHepatic", v)} />
            <Checkbox label="End-stage renal disease" checked={e.endStageRenal} onChange={(v) => updateEligibility("endStageRenal", v)} />
            <Checkbox label="Uncontrolled hypertension" checked={e.uncontrolledHypertension} onChange={(v) => updateEligibility("uncontrolledHypertension", v)} />

            <p className="text-sm font-semibold text-navy-900 mt-4">Reproductive / metabolic</p>
            <Checkbox label="Pregnant" checked={e.pregnant} onChange={(v) => updateEligibility("pregnant", v)} />
            <Checkbox label="Breastfeeding" checked={e.breastfeeding} onChange={(v) => updateEligibility("breastfeeding", v)} />
            <Checkbox label="Planning pregnancy" checked={e.planningPregnancy} onChange={(v) => updateEligibility("planningPregnancy", v)} />
            <Checkbox label="Rare hereditary galactose intolerance / total lactase deficiency / glucose-galactose malabsorption" checked={e.galactoseIntolerance} onChange={(v) => updateEligibility("galactoseIntolerance", v)} description="Mysimba tablets contain lactose." />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions — proceed with extra counselling and monitoring</p>
              <Checkbox label="Age under 25 (higher monitoring threshold for mood changes)" checked={e.ageUnder25} onChange={(v) => updateEligibility("ageUnder25", v)} description="Patients/carers should monitor for and report worsening mood, suicidal thoughts, or unusual behaviour." />
              <Checkbox label="History of depression or suicidal ideation" checked={e.depressionHistory} onChange={(v) => updateEligibility("depressionHistory", v)} description="Stop Mysimba immediately if any new or worsening symptoms." />
              <Checkbox label="Known Brugada syndrome" checked={e.brugadaSyndrome} onChange={(v) => updateEligibility("brugadaSyndrome", v)} description="Bupropion may unmask Brugada syndrome — risk of cardiac arrest / sudden death." />
              <Checkbox label="Family history of cardiac arrest or sudden death" checked={e.brugadaFamilyHistory} onChange={(v) => updateEligibility("brugadaFamilyHistory", v)} description="Consider screening before initiation." />
              <Checkbox label="Mild–moderate hepatic impairment" checked={e.hepaticImpairment} onChange={(v) => updateEligibility("hepaticImpairment", v)} description="Maximum dose may need adjustment — see SmPC." />
              <Checkbox label="Mild–moderate renal impairment" checked={e.renalImpairment} onChange={(v) => updateEligibility("renalImpairment", v)} description="Maximum dose may need adjustment — see SmPC." />
              <Checkbox label="Controlled hypertension" checked={e.hypertensionControlled} onChange={(v) => updateEligibility("hypertensionControlled", v)} description="Monitor BP at every visit; bupropion may raise BP." />
              <Checkbox label="Cardiovascular disease / known IHD" checked={e.cardiovascularDisease} onChange={(v) => updateEligibility("cardiovascularDisease", v)} description="Counsel cardiovascular risk." />
              <Checkbox label="Patient drives or operates hazardous machinery" checked={e.drivingMachinery} onChange={(v) => updateEligibility("drivingMachinery", v)} description="Counsel: Mysimba may cause dizziness/somnolence/loss of consciousness/seizure — caution required." />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
              <p className="font-semibold mb-2">Dose titration schedule (8 mg / 90 mg prolonged-release tablets)</p>
              <table className="text-sm w-full">
                <thead className="text-xs">
                  <tr><th className="text-left pb-1">Week</th><th className="text-left pb-1">Morning</th><th className="text-left pb-1">Evening</th></tr>
                </thead>
                <tbody>
                  {DOSE_TITRATION.map((d) => (
                    <tr key={d.week}><td className="pr-3">{d.week}</td><td className="pr-3">{d.morning}</td><td>{d.evening}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs">Maximum daily dose: 4 tablets (2 morning + 2 evening). Take with food. Tablets must be swallowed whole — do NOT cut, chew or crush.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose stage at this consultation <span className="text-red-400">*</span></label>
              <select value={state.treatment.doseStage} onChange={(e) => updateTreatment("doseStage", e.target.value as typeof state.treatment.doseStage)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="init">Initiation — Week 1 (1 morning)</option>
                <option value="1">Week 2 (1 morning + 1 evening)</option>
                <option value="2">Week 3 (2 morning + 1 evening)</option>
                <option value="3">Week 4 (2 morning + 2 evening)</option>
                <option value="4">Maintenance refill (2 + 2)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Supply</label>
              <select value={state.treatment.supplyWeeks} onChange={(e) => updateTreatment("supplyWeeks", e.target.value as typeof state.treatment.supplyWeeks)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">— select —</option>
                <option value="4">4 weeks (titration phase)</option>
                <option value="8">8 weeks</option>
                <option value="12">12 weeks</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Recommend 4-week supply during titration so the pharmacist sees the patient at week 4 for the first formal review.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Batch number" value={state.treatment.productBatch} onChange={(v) => updateTreatment("productBatch", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Expiry date <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.productExpiry} onChange={(e) => updateTreatment("productExpiry", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">16-week review date (mandatory) <span className="text-red-400">*</span></label>
              <input type="date" value={state.treatment.sixteenWeekReviewDate} onChange={(e) => updateTreatment("sixteenWeekReviewDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              <p className="mt-1 text-xs text-gray-500">Discontinue if patient has not lost ≥5% of initial body weight at 16 weeks.</p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Tick each item once discussed with the patient.</p>
            <Checkbox label="Method of administration: oral, swallow whole with water, take with food. Do NOT cut, chew or crush." checked={state.counselling.adminText} onChange={(v) => updateCounselling("adminText", v)} />
            <Checkbox label="Confirmed patient understands tablet should not be crushed or chewed" checked={state.counselling.tabletNotCrushedChewed} onChange={(v) => updateCounselling("tabletNotCrushedChewed", v)} />
            <Checkbox label="Take with food (reduces nausea)" checked={state.counselling.withFood} onChange={(v) => updateCounselling("withFood", v)} />
            <Checkbox label="Common side effects discussed: nausea, headache, insomnia, constipation, dizziness, dry mouth" checked={state.counselling.sideEffectsDiscussed} onChange={(v) => updateCounselling("sideEffectsDiscussed", v)} />
            <Checkbox label="Patient (and carer) advised to monitor for / report any worsening mood, suicidal thoughts, unusual behaviour — especially &lt;25s" checked={state.counselling.suicidalIdeationCounselled} onChange={(v) => updateCounselling("suicidalIdeationCounselled", v)} />
            <Checkbox label="Hepatotoxicity (DILI) warning: stop and seek medical advice if symptoms (jaundice, dark urine, RUQ pain, fatigue)" checked={state.counselling.hepatotoxicityWarning} onChange={(v) => updateCounselling("hepatotoxicityWarning", v)} />
            <Checkbox label="Driving / hazardous machinery: caution — Mysimba may cause dizziness, somnolence, loss of consciousness, seizure" checked={state.counselling.drivingMachineryAdvice} onChange={(v) => updateCounselling("drivingMachineryAdvice", v)} />
            <Checkbox label="No alcohol with Mysimba" checked={state.counselling.noAlcoholAdvice} onChange={(v) => updateCounselling("noAlcoholAdvice", v)} description="Alcohol can lower seizure threshold; combined with bupropion = increased risk." />
            <Checkbox label="16-week review explained — discontinue if &lt;5% weight loss" checked={state.counselling.sixteenWeekReviewExplained} onChange={(v) => updateCounselling("sixteenWeekReviewExplained", v)} />
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
              16-week review: {state.treatment.sixteenWeekReviewDate || "to be scheduled"}. Patient should expect noticeable weight loss within the first 8–12 weeks; review for discontinuation if &lt;5% loss at 16 weeks.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

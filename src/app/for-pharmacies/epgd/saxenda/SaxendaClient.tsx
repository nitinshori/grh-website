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
  "Dose Plan & Administration",
  "Counselling & Follow-up",
  "Pharmacist Summary",
  "Consultation Complete",
]

const DOSE_TITRATION = [
  { week: "Week 1", dose: "0.6 mg" },
  { week: "Week 2", dose: "1.2 mg" },
  { week: "Week 3", dose: "1.8 mg" },
  { week: "Week 4", dose: "2.4 mg" },
  { week: "Week 5+ (maintenance)", dose: "3.0 mg" },
]

export function SaxendaClient() {
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
      // Exclusions per Janey's Saxenda doc
      ageUnder18: false,
      ageOver75: false,
      hypersensitivity: false,
      mtcHistory: false,
      men2: false,
      pregnant: false,
      breastfeeding: false,
      planningPregnancyWithin2Months: false,
      severeHeartFailure: false,
      severeHepatic: false,
      severeRenal: false,
      pancreatitisHistory: false,
      acuteIllness: false,
      severeGiDisease: false,
      type1Diabetes: false,
      diabeticRetinopathy: false,
      eatingDisorder: false,
      concurrentGlp1OrSecretagogue: false,
      // Cautions
      mildModerateRenal: false,
      mildModerateHepatic: false,
      thyroidDisease: false,
      depressionHistory: false,
      oralContraceptive: false,
      narrowTherapeuticIndexDrug: false,
      gallbladderDisease: false,
    },
    treatment: {
      doseStage: "" as "" | "init" | "1" | "2" | "3" | "4" | "5",
      injectionSite: "" as "" | "abdomen" | "thigh" | "upper-arm",
      injectionTime: "",
      batchNumber: "",
      expiryDate: "",
      supplyDays: "" as "" | "28" | "30",
      nextReviewDate: "",
    },
    counselling: {
      injectionTechnique: false,
      siteRotation: false,
      storageInstructions: false,
      missedDoseProtocol: false,
      dietExercise: false,
      sideEffectsDiscussed: false,
      pancreatitisWarning: false,
      dehydrationWarning: false,
      contraception: false,
      twelveWeekReviewExplained: false,
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
      // Recalculate BMI if height/weight changes
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

  // Assessment valid: BMI ≥30 OR BMI ≥27 with comorbidity
  const bmi = state.assessment.bmi
  const bmiEligible = !!(bmi && (bmi >= 30 || (bmi >= 27 && state.assessment.hasComorbidity)))
  const assessmentValid = !!bmi && !!state.assessment.heightCm && !!state.assessment.weightKg && bmiEligible

  // Eligibility valid: no exclusions ticked
  const anyExclusion =
    state.eligibility.ageUnder18 ||
    state.eligibility.ageOver75 ||
    state.eligibility.hypersensitivity ||
    state.eligibility.mtcHistory ||
    state.eligibility.men2 ||
    state.eligibility.pregnant ||
    state.eligibility.breastfeeding ||
    state.eligibility.planningPregnancyWithin2Months ||
    state.eligibility.severeHeartFailure ||
    state.eligibility.severeHepatic ||
    state.eligibility.severeRenal ||
    state.eligibility.pancreatitisHistory ||
    state.eligibility.acuteIllness ||
    state.eligibility.severeGiDisease ||
    state.eligibility.type1Diabetes ||
    state.eligibility.diabeticRetinopathy ||
    state.eligibility.eatingDisorder ||
    state.eligibility.concurrentGlp1OrSecretagogue
  const eligibilityValid = !anyExclusion

  const treatmentValid = !!state.treatment.doseStage && !!state.treatment.injectionSite && !!state.treatment.batchNumber && !!state.treatment.expiryDate
  const counsellingValid =
    state.counselling.injectionTechnique &&
    state.counselling.storageInstructions &&
    state.counselling.sideEffectsDiscussed &&
    state.counselling.twelveWeekReviewExplained

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
              <p>Discuss causes of weight gain, lifestyle, diet, exercise, previous weight-loss attempts, expectations, comorbidities, mental health. Saxenda is an adjunct to a reduced-calorie diet and increased physical activity — NOT a stand-alone solution. Set realistic target weight.</p>
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
                  Eligibility: BMI ≥30, OR BMI ≥27 with a weight-related comorbidity
                  {bmiEligible ? " — ✓ ELIGIBLE" : " — ✗ NOT ELIGIBLE under this PGD"}.
                </p>
              )}
            </div>

            <Checkbox label="Patient has a weight-related comorbidity" checked={state.assessment.hasComorbidity} onChange={(v) => updateAssessment("hasComorbidity", v)} description="e.g. dysglycaemia (pre-diabetes / T2DM), hypertension, dyslipidaemia, obstructive sleep apnoea, cardiovascular disease." />
            {state.assessment.hasComorbidity && <TextInput label="Comorbidity details" value={state.assessment.comorbidityDetails} onChange={(v) => updateAssessment("comorbidityDetails", v)} placeholder="e.g. hypertension, OSA" />}

            <TextArea label="Previous weight-loss attempts" value={state.assessment.previousWeightLossAttempts} onChange={(v) => updateAssessment("previousWeightLossAttempts", v)} rows={2} placeholder="e.g. NHS weight-loss programme 2024; lost 4 kg but regained." />
            <TextArea label="Patient's goal and expectations" value={state.assessment.patientGoal} onChange={(v) => updateAssessment("patientGoal", v)} rows={2} placeholder="Target weight, what success looks like." />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Exclusion criteria — tick any that apply</p>
              <p>If any of these are ticked, this PGD cannot proceed. Refer to GP / specialist weight-management service.</p>
            </div>
            <Checkbox label="Age under 18 OR over 75" checked={state.eligibility.ageUnder18 || state.eligibility.ageOver75} onChange={(v) => { updateEligibility("ageUnder18", v); updateEligibility("ageOver75", v); }} description="Saxenda PGD scope is 18–75. Refer to specialist outside this range." />
            <Checkbox label="Known hypersensitivity to liraglutide or any of the excipients" checked={state.eligibility.hypersensitivity} onChange={(v) => updateEligibility("hypersensitivity", v)} />
            <Checkbox label="Personal or family history of medullary thyroid carcinoma (MTC)" checked={state.eligibility.mtcHistory} onChange={(v) => updateEligibility("mtcHistory", v)} />
            <Checkbox label="Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)" checked={state.eligibility.men2} onChange={(v) => updateEligibility("men2", v)} />
            <Checkbox label="Pregnant" checked={state.eligibility.pregnant} onChange={(v) => updateEligibility("pregnant", v)} />
            <Checkbox label="Breastfeeding" checked={state.eligibility.breastfeeding} onChange={(v) => updateEligibility("breastfeeding", v)} />
            <Checkbox label="Planning pregnancy in the next 2 months (effective contraception required; discontinue ≥2 months before planned conception)" checked={state.eligibility.planningPregnancyWithin2Months} onChange={(v) => updateEligibility("planningPregnancyWithin2Months", v)} />
            <Checkbox label="Severe heart failure (NYHA class IV)" checked={state.eligibility.severeHeartFailure} onChange={(v) => updateEligibility("severeHeartFailure", v)} />
            <Checkbox label="Severe hepatic impairment (Child-Pugh C)" checked={state.eligibility.severeHepatic} onChange={(v) => updateEligibility("severeHepatic", v)} />
            <Checkbox label="Severe renal impairment (eGFR <30 mL/min/1.73m²)" checked={state.eligibility.severeRenal} onChange={(v) => updateEligibility("severeRenal", v)} />
            <Checkbox label="History of pancreatitis (acute or chronic)" checked={state.eligibility.pancreatitisHistory} onChange={(v) => updateEligibility("pancreatitisHistory", v)} />
            <Checkbox label="Acute illness or recent surgery" checked={state.eligibility.acuteIllness} onChange={(v) => updateEligibility("acuteIllness", v)} />
            <Checkbox label="Severe GI disease (gastroparesis or persistent GI disorder)" checked={state.eligibility.severeGiDisease} onChange={(v) => updateEligibility("severeGiDisease", v)} />
            <Checkbox label="Type 1 diabetes mellitus" checked={state.eligibility.type1Diabetes} onChange={(v) => updateEligibility("type1Diabetes", v)} />
            <Checkbox label="Diabetic retinopathy requiring treatment" checked={state.eligibility.diabeticRetinopathy} onChange={(v) => updateEligibility("diabeticRetinopathy", v)} description="Rapid weight loss may transiently worsen retinopathy." />
            <Checkbox label="Active eating disorder (anorexia, bulimia, binge-eating under specialist care)" checked={state.eligibility.eatingDisorder} onChange={(v) => updateEligibility("eatingDisorder", v)} />
            <Checkbox label="Concurrent GLP-1 agonist or insulin secretagogue" checked={state.eligibility.concurrentGlp1OrSecretagogue} onChange={(v) => updateEligibility("concurrentGlp1OrSecretagogue", v)} />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions (continue with extra counselling)</p>
              <Checkbox label="Mild–moderate renal impairment (eGFR 30–60)" checked={state.eligibility.mildModerateRenal} onChange={(v) => updateEligibility("mildModerateRenal", v)} description="Counsel on hydration; monitor for dehydration on GI side effects." />
              <Checkbox label="Mild–moderate hepatic impairment" checked={state.eligibility.mildModerateHepatic} onChange={(v) => updateEligibility("mildModerateHepatic", v)} />
              <Checkbox label="Thyroid disease (monitor function if symptoms develop)" checked={state.eligibility.thyroidDisease} onChange={(v) => updateEligibility("thyroidDisease", v)} />
              <Checkbox label="History of depression or suicidal ideation" checked={state.eligibility.depressionHistory} onChange={(v) => updateEligibility("depressionHistory", v)} description="Counsel patient/carer to monitor mood; report any worsening." />
              <Checkbox label="On combined oral contraceptive" checked={state.eligibility.oralContraceptive} onChange={(v) => updateEligibility("oralContraceptive", v)} description="GLP-1s delay gastric emptying — may reduce oral contraceptive absorption. Switch to non-oral or add barrier method for 4 weeks at initiation and after each dose increase." />
              <Checkbox label="On narrow-therapeutic-index oral medication (e.g. warfarin, levothyroxine)" checked={state.eligibility.narrowTherapeuticIndexDrug} onChange={(v) => updateEligibility("narrowTherapeuticIndexDrug", v)} description="Delayed gastric emptying may alter absorption. Closer monitoring of INR / TFTs etc." />
              <Checkbox label="History of gallbladder disease" checked={state.eligibility.gallbladderDisease} onChange={(v) => updateEligibility("gallbladderDisease", v)} description="Counsel on RUQ pain, jaundice, fever; refer urgently if suspected." />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
              <p className="font-semibold mb-2">Dose titration schedule</p>
              <table className="text-sm w-full">
                <thead className="text-xs">
                  <tr><th className="text-left pb-1">Week</th><th className="text-left pb-1">Dose</th></tr>
                </thead>
                <tbody>
                  {DOSE_TITRATION.map((d) => (
                    <tr key={d.week}><td className="pr-4">{d.week}</td><td>{d.dose}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs">If significant GI side effects on titration, delay the next dose increase by 1 week (or reduce to previous dose) until symptoms improve.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose stage at this consultation <span className="text-red-400">*</span></label>
              <select value={state.treatment.doseStage} onChange={(e) => updateTreatment("doseStage", e.target.value as typeof state.treatment.doseStage)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— select —</option>
                <option value="init">Initiation (Week 1 — 0.6 mg)</option>
                <option value="1">Week 2 — 1.2 mg</option>
                <option value="2">Week 3 — 1.8 mg</option>
                <option value="3">Week 4 — 2.4 mg</option>
                <option value="4">Week 5+ Maintenance — 3.0 mg</option>
                <option value="5">Maintenance refill — 3.0 mg</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Preferred injection site <span className="text-red-400">*</span></label>
              <select value={state.treatment.injectionSite} onChange={(e) => updateTreatment("injectionSite", e.target.value as typeof state.treatment.injectionSite)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— select —</option>
                <option value="abdomen">Abdomen</option>
                <option value="thigh">Thigh</option>
                <option value="upper-arm">Upper arm (back)</option>
              </select>
            </div>

            <TextInput label="Time of day patient will inject (recommend same time each day)" value={state.treatment.injectionTime} onChange={(v) => updateTreatment("injectionTime", v)} placeholder="e.g. 08:00 each morning" />

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pen batch number" value={state.treatment.batchNumber} onChange={(v) => updateTreatment("batchNumber", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Pen expiry date <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.expiryDate} onChange={(e) => updateTreatment("expiryDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Supply duration</label>
              <select value={state.treatment.supplyDays} onChange={(e) => updateTreatment("supplyDays", e.target.value as typeof state.treatment.supplyDays)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— select —</option>
                <option value="28">28-day supply (standard)</option>
                <option value="30">30-day supply</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Next review date</label>
              <input type="date" value={state.treatment.nextReviewDate} onChange={(e) => updateTreatment("nextReviewDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              <p className="mt-1 text-xs text-gray-500">12-week review on the 3.0 mg maintenance dose is mandatory — discontinue if &lt;5% weight loss.</p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Tick each item once discussed with the patient.</p>
            <Checkbox label="Injection technique demonstrated and patient confident with the pen" checked={state.counselling.injectionTechnique} onChange={(v) => updateCounselling("injectionTechnique", v)} />
            <Checkbox label="Injection-site rotation explained" checked={state.counselling.siteRotation} onChange={(v) => updateCounselling("siteRotation", v)} />
            <Checkbox label="Storage: refrigerate 2–8°C; after first use up to 28 days at <30°C; keep cap on; do NOT freeze" checked={state.counselling.storageInstructions} onChange={(v) => updateCounselling("storageInstructions", v)} />
            <Checkbox label="Missed dose: take when remembered if within 12 hours; otherwise skip and continue next day" checked={state.counselling.missedDoseProtocol} onChange={(v) => updateCounselling("missedDoseProtocol", v)} />
            <Checkbox label="Diet and physical activity counselling given (Saxenda is an adjunct, not a replacement)" checked={state.counselling.dietExercise} onChange={(v) => updateCounselling("dietExercise", v)} />
            <Checkbox label="Common side effects discussed: nausea, vomiting, diarrhoea, constipation (mostly during titration)" checked={state.counselling.sideEffectsDiscussed} onChange={(v) => updateCounselling("sideEffectsDiscussed", v)} />
            <Checkbox label="Pancreatitis warning: stop and seek medical advice if severe abdominal pain" checked={state.counselling.pancreatitisWarning} onChange={(v) => updateCounselling("pancreatitisWarning", v)} />
            <Checkbox label="Dehydration counselling on GI side effects" checked={state.counselling.dehydrationWarning} onChange={(v) => updateCounselling("dehydrationWarning", v)} />
            <Checkbox label="Contraception advice given (if applicable)" checked={state.counselling.contraception} onChange={(v) => updateCounselling("contraception", v)} />
            <Checkbox label="12-week review explained — must achieve ≥5% weight loss on 3.0 mg dose, otherwise discontinue" checked={state.counselling.twelveWeekReviewExplained} onChange={(v) => updateCounselling("twelveWeekReviewExplained", v)} />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Decision rationale, follow-up arrangements, any further advice given" />
          </div>
        )}

        {currentStep === 7 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Next review: {state.treatment.nextReviewDate || "to be scheduled"}. Counsel patient that improvement in weight is gradual; meaningful results typically by 12 weeks on the maintenance dose.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

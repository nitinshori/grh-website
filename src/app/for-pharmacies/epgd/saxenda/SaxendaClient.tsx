"use client"

import { useCallback, useEffect, useState } from "react"
import { ProgressBar } from "../shared/components/ProgressBar"
import { StepWrapper } from "../shared/components/StepWrapper"
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking"
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep"
import { ConsentStep } from "../shared/steps/ConsentStep"
import { TextInput, TextArea, Checkbox, NumberInput } from "../shared/components/FormInputs"
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile"
import { validatePatientStep, validateConsentStep } from "../shared/types"

// Saxenda PGD v003, issued 11 September 2026. Adults 18 years and over; aged 75 or over excludes.
const PGD_MIN_AGE = 18
const PGD_MAX_AGE = 74

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
      lifestyleCommitment: false,
      previousWeightLossAttempts: "",
      patientGoal: "",
    },
    eligibility: {
      // Exclusions per Saxenda PGD v003 (11 September 2026)
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
      otherWeightManagementMedicine: false,
      secondaryObesity: false,
      // Cautions
      mildModerateRenal: false,
      mildModerateHepatic: false,
      otherGiDisorder: false,
      thyroidDisease: false,
      depressionHistory: false,
      significantDehydration: false,
      gastricMotilityMedicine: false,
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
      pensSupplied: "" as "" | "1" | "2" | "3" | "4" | "5",
      supplyDays: "" as "" | "28" | "30",
      nextReviewDate: "",
    },
    counselling: {
      pilSupplied: false,
      injectionTechnique: false,
      siteRotation: false,
      storageInstructions: false,
      missedDoseProtocol: false,
      dietExercise: false,
      sideEffectsDiscussed: false,
      pancreatitisWarning: false,
      dehydrationWarning: false,
      hypoglycaemiaWarning: false,
      thyroidMoodWarning: false,
      contraception: false,
      twelveWeekReviewExplained: false,
      doNotShare: false,
    },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "", adverseReactions: "" },
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

  // Step 0 and 1: patient details (age 18 to 74 from date of birth) and informed consent
  const patientError = validatePatientStep(state.patient, { minAge: PGD_MIN_AGE, maxAge: PGD_MAX_AGE })
  const consentError = validateConsentStep(state.consent)

  // Assessment valid: BMI ≥30 OR BMI ≥27 with comorbidity, and patient willing to undertake lifestyle modifications
  const bmi = state.assessment.bmi
  const bmiEligible = !!(bmi && (bmi >= 30 || (bmi >= 27 && state.assessment.hasComorbidity)))
  const assessmentValid = !!bmi && !!state.assessment.heightCm && !!state.assessment.weightKg && bmiEligible && state.assessment.lifestyleCommitment
  const assessmentError = !bmi || !state.assessment.heightCm || !state.assessment.weightKg
    ? "Height and weight are required"
    : !bmiEligible
      ? "BMI does not meet the inclusion criteria (BMI 30 or above, or 27 or above with a weight-related comorbidity). This PGD cannot proceed."
      : !state.assessment.lifestyleCommitment
        ? "Confirm the patient is willing and motivated to undertake lifestyle modifications"
        : null

  // Age from date of birth: under 18, or 75 years or over, excludes regardless of the manual tick
  const computedAge = state.patient.age
  const ageExcluded = computedAge !== null && (computedAge < PGD_MIN_AGE || computedAge > PGD_MAX_AGE)

  // Eligibility valid: no exclusions ticked
  const anyExclusion =
    ageExcluded ||
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
    state.eligibility.concurrentGlp1OrSecretagogue ||
    state.eligibility.otherWeightManagementMedicine ||
    state.eligibility.secondaryObesity
  const eligibilityValid = !anyExclusion

  const treatmentValid = !!state.treatment.doseStage && !!state.treatment.injectionSite && !!state.treatment.batchNumber && !!state.treatment.expiryDate && !!state.treatment.pensSupplied
  const counsellingValid =
    state.counselling.pilSupplied &&
    state.counselling.injectionTechnique &&
    state.counselling.storageInstructions &&
    state.counselling.sideEffectsDiscussed &&
    state.counselling.twelveWeekReviewExplained

  const canProceedByStep = [!patientError, !consentError, assessmentValid, eligibilityValid, treatmentValid, counsellingValid, true, true]
  const canProceed = canProceedByStep[currentStep]
  const stepErrors: (string | null)[] = [
    patientError,
    consentError,
    assessmentError,
    anyExclusion ? "Exclusion criteria met: this PGD cannot proceed. Advise on alternative treatment options, document the decision and inform or refer to the GP as appropriate." : null,
    treatmentValid ? null : "Please complete all required fields",
    counsellingValid ? null : "Please complete all required fields",
    null,
    null,
  ]
  const validationError = canProceed ? null : (stepErrors[currentStep] ?? "Please complete all required fields")

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
        validationError={validationError}
        isBlocked={(currentStep === 3 && anyExclusion) || (currentStep === 2 && !!bmi && !bmiEligible)}
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
              <p>Discuss causes of weight gain, lifestyle, diet, exercise, previous weight-loss attempts, expectations, comorbidities, mental health. Saxenda is an adjunct to a reduced-calorie diet and increased physical activity, NOT a stand-alone solution. Set realistic target weight. Obesity secondary to an endocrine disorder, or to a medicine that causes weight gain, excludes (next step).</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <NumberInput label="Height (cm)" value={state.assessment.heightCm} onChange={(v) => updateAssessment("heightCm", v)} min={120} max={220} unit="cm" />
              <NumberInput label="Weight (kg)" value={state.assessment.weightKg} onChange={(v) => updateAssessment("weightKg", v)} min={40} max={250} unit="kg" />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy-900">Calculated BMI</span>
                <span className="text-xl font-bold text-navy-900">{bmi ?? "-"} {bmi ? "kg/m²" : ""}</span>
              </div>
              {bmi !== null && (
                <p className="mt-1 text-xs text-gray-600">
                  Eligibility: BMI ≥30, OR BMI ≥27 with at least one weight-related comorbidity
                  {bmiEligible ? ": ELIGIBLE" : ": NOT ELIGIBLE under this PGD"}.
                </p>
              )}
            </div>

            <Checkbox label="Patient has a weight-related comorbidity" checked={state.assessment.hasComorbidity} onChange={(v) => updateAssessment("hasComorbidity", v)} description="e.g. dysglycaemia (pre-diabetes / T2DM), hypertension, dyslipidaemia, obstructive sleep apnoea." />
            {state.assessment.hasComorbidity && <TextInput label="Comorbidity details" value={state.assessment.comorbidityDetails} onChange={(v) => updateAssessment("comorbidityDetails", v)} placeholder="e.g. hypertension, OSA" />}

            <Checkbox label="Patient is willing and motivated to undertake lifestyle modifications (reduced-calorie diet and increased physical activity)" checked={state.assessment.lifestyleCommitment} onChange={(v) => updateAssessment("lifestyleCommitment", v)} required description="Inclusion criterion. Saxenda is an adjunct to lifestyle modification; do not supply without this commitment." />

            <TextArea label="Previous weight-loss attempts" value={state.assessment.previousWeightLossAttempts} onChange={(v) => updateAssessment("previousWeightLossAttempts", v)} rows={2} placeholder="e.g. NHS weight-loss programme 2024; lost 4 kg but regained." />
            <TextArea label="Patient's goal and expectations" value={state.assessment.patientGoal} onChange={(v) => updateAssessment("patientGoal", v)} rows={2} placeholder="Target weight, what success looks like." />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
              <p className="font-semibold">Exclusion criteria: tick any that apply</p>
              <p>If any of these are ticked, this PGD cannot proceed. Advise on alternative treatment options and how these can be accessed. Document any advice given and the decision reached. Inform or refer to the GP as appropriate.</p>
            </div>
            {ageExcluded && (
              <div className="rounded-lg bg-red-100 border border-red-300 p-3 text-sm text-red-900">
                Calculated age {computedAge} years is outside this PGD (18 years and over; aged 75 years or over excludes, use not recommended, SmPC). This PGD cannot proceed.
              </div>
            )}
            <Checkbox label="Aged under 18, or aged 75 years or over" checked={state.eligibility.ageUnder18 || state.eligibility.ageOver75} onChange={(v) => { updateEligibility("ageUnder18", v); updateEligibility("ageOver75", v); }} description="Inclusion: age 18 years and over. Exclusion: aged 75 years or over (use not recommended, SmPC). Refer outside this range." />
            <Checkbox label="Known hypersensitivity to liraglutide or any component of the product" checked={state.eligibility.hypersensitivity} onChange={(v) => updateEligibility("hypersensitivity", v)} />
            <Checkbox label="Personal or family history of medullary thyroid carcinoma (MTC)" checked={state.eligibility.mtcHistory} onChange={(v) => updateEligibility("mtcHistory", v)} />
            <Checkbox label="Personal or family history of Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)" checked={state.eligibility.men2} onChange={(v) => updateEligibility("men2", v)} />
            <Checkbox label="Pregnant" checked={state.eligibility.pregnant} onChange={(v) => updateEligibility("pregnant", v)} />
            <Checkbox label="Breastfeeding" checked={state.eligibility.breastfeeding} onChange={(v) => updateEligibility("breastfeeding", v)} />
            <Checkbox label="Planning pregnancy in the next 2 months (effective contraception required; discontinue ≥2 months before planned conception)" checked={state.eligibility.planningPregnancyWithin2Months} onChange={(v) => updateEligibility("planningPregnancyWithin2Months", v)} />
            <Checkbox label="Severe heart failure (NYHA class IV)" checked={state.eligibility.severeHeartFailure} onChange={(v) => updateEligibility("severeHeartFailure", v)} />
            <Checkbox label="Severe hepatic impairment (Child-Pugh score C or equivalent)" checked={state.eligibility.severeHepatic} onChange={(v) => updateEligibility("severeHepatic", v)} />
            <Checkbox label="Severe renal impairment (eGFR <30 mL/min/1.73m²)" checked={state.eligibility.severeRenal} onChange={(v) => updateEligibility("severeRenal", v)} />
            <Checkbox label="History of pancreatitis (acute or chronic)" checked={state.eligibility.pancreatitisHistory} onChange={(v) => updateEligibility("pancreatitisHistory", v)} description="PGD excludes: any pancreatitis while taking a GLP-1 receptor agonist; acute pancreatitis within 3 months; chronic pancreatitis with ongoing risk factors. This tool excludes any pancreatitis history." />
            <Checkbox label="Acute illness or recent surgery" checked={state.eligibility.acuteIllness} onChange={(v) => updateEligibility("acuteIllness", v)} />
            <Checkbox label="Inflammatory bowel disease, or gastroparesis (use not recommended, SmPC)" checked={state.eligibility.severeGiDisease} onChange={(v) => updateEligibility("severeGiDisease", v)} description="Includes diabetic gastroparesis. Other gastrointestinal disorders are a caution (below)." />
            <Checkbox label="Type 1 diabetes, or insulin-treated diabetes. Refer." checked={state.eligibility.type1Diabetes} onChange={(v) => updateEligibility("type1Diabetes", v)} />
            <Checkbox label="Diabetic retinopathy requiring treatment" checked={state.eligibility.diabeticRetinopathy} onChange={(v) => updateEligibility("diabeticRetinopathy", v)} description="Rapid weight loss may transiently worsen retinopathy." />
            <Checkbox label="Current or previous eating disorder" checked={state.eligibility.eatingDisorder} onChange={(v) => updateEligibility("eatingDisorder", v)} description="e.g. anorexia nervosa, bulimia, binge-eating disorder, at any time." />
            <Checkbox label="Concurrent use of another GLP-1 receptor agonist, or an insulin secretagogue (sulfonylurea)" checked={state.eligibility.concurrentGlp1OrSecretagogue} onChange={(v) => updateEligibility("concurrentGlp1OrSecretagogue", v)} description="PGD excludes concurrent GLP-1 receptor agonists. Sulfonylureas are a PGD caution (hypoglycaemia risk; inform the prescriber); this tool excludes them." />
            <Checkbox label="Any other weight-management medicine, current: tirzepatide, semaglutide, orlistat or naltrexone/bupropion" checked={state.eligibility.otherWeightManagementMedicine} onChange={(v) => updateEligibility("otherWeightManagementMedicine", v)} />
            <Checkbox label="Obesity secondary to an endocrine disorder, or to a medicine that causes weight gain" checked={state.eligibility.secondaryObesity} onChange={(v) => updateEligibility("secondaryObesity", v)} />

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <p className="text-sm font-semibold text-navy-900">Cautions (continue with extra counselling)</p>
              <Checkbox label="Mild to moderate renal impairment (eGFR 30 to 60 mL/min/1.73m²)" checked={state.eligibility.mildModerateRenal} onChange={(v) => updateEligibility("mildModerateRenal", v)} description="Counsel on hydration; monitor for dehydration on GI side effects." />
              <Checkbox label="Mild to moderate hepatic impairment" checked={state.eligibility.mildModerateHepatic} onChange={(v) => updateEligibility("mildModerateHepatic", v)} />
              <Checkbox label="Other gastrointestinal disorders" checked={state.eligibility.otherGiDisorder} onChange={(v) => updateEligibility("otherGiDisorder", v)} description="Diabetic gastroparesis and inflammatory bowel disease exclude (above)." />
              <Checkbox label="Thyroid disease (monitor thyroid function if symptoms develop)" checked={state.eligibility.thyroidDisease} onChange={(v) => updateEligibility("thyroidDisease", v)} />
              <Checkbox label="History of depression or suicidal ideation (monitor mental health)" checked={state.eligibility.depressionHistory} onChange={(v) => updateEligibility("depressionHistory", v)} description="Counsel patient/carer to monitor mood; report any worsening." />
              <Checkbox label="Significant dehydration" checked={state.eligibility.significantDehydration} onChange={(v) => updateEligibility("significantDehydration", v)} description="Acute illness excludes (above). Counsel on hydration, particularly with GI side effects." />
              <Checkbox label="Concurrent use of medications affecting gastric motility" checked={state.eligibility.gastricMotilityMedicine} onChange={(v) => updateEligibility("gastricMotilityMedicine", v)} description="Liraglutide delays gastric emptying; review the combination and counsel." />
              <Checkbox label="On combined oral contraceptive" checked={state.eligibility.oralContraceptive} onChange={(v) => updateEligibility("oralContraceptive", v)} description="GLP-1s delay gastric emptying and may reduce oral contraceptive absorption. Switch to non-oral or add barrier method for 4 weeks at initiation and after each dose increase." />
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
              <p className="mt-2 text-xs">Saxenda (Liraglutide 6mg/ml) solution for injection in pre-filled pen. Subcutaneous injection once daily. If dose escalation is not tolerated, consider delaying by approximately one week before continuing titration. Maintenance dose: 3.0 mg once daily by subcutaneous injection.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Dose stage at this consultation <span className="text-red-400">*</span></label>
              <select value={state.treatment.doseStage} onChange={(e) => updateTreatment("doseStage", e.target.value as typeof state.treatment.doseStage)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">Select</option>
                <option value="init">Initiation (Week 1: 0.6 mg once daily)</option>
                <option value="1">Week 2: 1.2 mg once daily</option>
                <option value="2">Week 3: 1.8 mg once daily</option>
                <option value="3">Week 4: 2.4 mg once daily</option>
                <option value="4">Week 5 onwards, maintenance: 3.0 mg once daily</option>
                <option value="5">Maintenance refill: 3.0 mg once daily</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Preferred injection site <span className="text-red-400">*</span></label>
              <select value={state.treatment.injectionSite} onChange={(e) => updateTreatment("injectionSite", e.target.value as typeof state.treatment.injectionSite)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                <option value="">Select</option>
                <option value="abdomen">Abdomen</option>
                <option value="thigh">Thigh</option>
                <option value="upper-arm">Upper arm</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Subcutaneous injection into the abdomen, thigh or upper arm. Not to be administered intravenously (IV) or intramuscularly (IM).</p>
            </div>

            <TextInput label="Time of day patient will inject (any time of day, preferably the same time each day)" value={state.treatment.injectionTime} onChange={(v) => updateTreatment("injectionTime", v)} placeholder="e.g. 08:00 each morning" />

            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput label="Pen batch number" value={state.treatment.batchNumber} onChange={(v) => updateTreatment("batchNumber", v)} required />
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Pen expiry date <span className="text-red-400">*</span></label>
                <input type="date" value={state.treatment.expiryDate} onChange={(e) => updateTreatment("expiryDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Number of pre-filled pens supplied <span className="text-red-400">*</span></label>
                <select value={state.treatment.pensSupplied} onChange={(e) => updateTreatment("pensSupplied", e.target.value as typeof state.treatment.pensSupplied)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                  <option value="">Select</option>
                  <option value="1">1 pen</option>
                  <option value="2">2 pens</option>
                  <option value="3">3 pens</option>
                  <option value="4">4 pens</option>
                  <option value="5">5 pens</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Up to 5 pre-filled pens per supply (approximately 1 month at maintenance dose; each pen contains 18 mg liraglutide).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Supply duration</label>
                <select value={state.treatment.supplyDays} onChange={(e) => updateTreatment("supplyDays", e.target.value as typeof state.treatment.supplyDays)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]">
                  <option value="">Select</option>
                  <option value="28">28-day supply (standard)</option>
                  <option value="30">30-day supply</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Next review date</label>
              <input type="date" value={state.treatment.nextReviewDate} onChange={(e) => updateTreatment("nextReviewDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]" />
              <p className="mt-1 text-xs text-gray-500">Review at 12 weeks on the maintenance dose (3.0 mg daily): discontinue if &lt;5% body weight loss has been achieved. If treatment is continued, review at least every 6 months thereafter. Longer treatment may be considered in patients achieving sustained weight loss of ≥5% body weight.</p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Tick each item once discussed with the patient.</p>
            <Checkbox label="Patient information leaflet (PIL) provided with Saxenda supplied" checked={state.counselling.pilSupplied} onChange={(v) => updateCounselling("pilSupplied", v)} required description="Ensure the patient understands the injection technique, storage requirements, and when to seek medical advice." />
            <Checkbox label="Injection technique demonstrated and patient confident with the pen (correct subcutaneous technique)" checked={state.counselling.injectionTechnique} onChange={(v) => updateCounselling("injectionTechnique", v)} required />
            <Checkbox label="Rotate injection sites to avoid lipohypertrophy; dispose of used needles safely in a sharps container" checked={state.counselling.siteRotation} onChange={(v) => updateCounselling("siteRotation", v)} />
            <Checkbox label="Storage: before first use store at 2 to 8°C in a refrigerator; after first use store below 30°C for up to 30 days; do not freeze; protect from light; do not use if discoloured or contains particles" checked={state.counselling.storageInstructions} onChange={(v) => updateCounselling("storageInstructions", v)} required />
            <Checkbox label="Missed dose: take when remembered if within 12 hours; otherwise skip and continue next day" checked={state.counselling.missedDoseProtocol} onChange={(v) => updateCounselling("missedDoseProtocol", v)} />
            <Checkbox label="Take the injection at the same time each day for consistency; continue with a reduced-calorie diet and increase physical activity as advised (Saxenda is an adjunct, not a replacement)" checked={state.counselling.dietExercise} onChange={(v) => updateCounselling("dietExercise", v)} />
            <Checkbox label="Expect initial GI side effects (nausea, vomiting, diarrhoea, constipation) which typically improve over the first few weeks; take with food if nausea is problematic" checked={state.counselling.sideEffectsDiscussed} onChange={(v) => updateCounselling("sideEffectsDiscussed", v)} required />
            <Checkbox label="Report persistent or severe abdominal pain immediately, as this may indicate pancreatitis" checked={state.counselling.pancreatitisWarning} onChange={(v) => updateCounselling("pancreatitisWarning", v)} />
            <Checkbox label="Stay well-hydrated; dehydration counselling on GI side effects" checked={state.counselling.dehydrationWarning} onChange={(v) => updateCounselling("dehydrationWarning", v)} />
            <Checkbox label="Hypoglycaemia signs (shakiness, sweating, confusion, rapid heartbeat): inform GP or healthcare provider, particularly if taking insulin or sulfonylureas, as dose adjustment may be needed" checked={state.counselling.hypoglycaemiaWarning} onChange={(v) => updateCounselling("hypoglycaemiaWarning", v)} />
            <Checkbox label="Inform healthcare provider of symptoms of thyroiditis (neck pain, swelling, difficulty swallowing) or depression/mood changes" checked={state.counselling.thyroidMoodWarning} onChange={(v) => updateCounselling("thyroidMoodWarning", v)} />
            <Checkbox label="Contraception advice given (if applicable)" checked={state.counselling.contraception} onChange={(v) => updateCounselling("contraception", v)} />
            <Checkbox label="Attend all review appointments: weight loss monitored at 12 weeks on the 3.0 mg maintenance dose; treatment discontinued if <5% body weight loss achieved; if continued, review at least every 6 months" checked={state.counselling.twelveWeekReviewExplained} onChange={(v) => updateCounselling("twelveWeekReviewExplained", v)} required />
            <Checkbox label="Do not share the medication with others; Saxenda is supplied specifically for this patient based on their medical history and BMI" checked={state.counselling.doNotShare} onChange={(v) => updateCounselling("doNotShare", v)} />
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, clinicalNotes: v } }))} rows={3} placeholder="Decision rationale, follow-up arrangements, any further advice given" />
            <TextArea label="Adverse drug reactions and actions taken (if any)" value={state.summary.adverseReactions} onChange={(v) => setState((p) => ({ ...p, summary: { ...p.summary, adverseReactions: v } }))} rows={2} placeholder="Details of any adverse drug reactions to liraglutide and actions taken. Report suspected adverse effects via https://yellowcard.mhra.gov.uk and inform the GP as appropriate." />
          </div>
        )}

        {currentStep === 7 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Consultation record complete</p>
            <p className="text-sm text-green-800 mt-1">
              Next review: {state.treatment.nextReviewDate || "to be scheduled"}. Review at 12 weeks on the 3.0 mg maintenance dose; discontinue if less than 5% body weight loss. If continued, review at least every 6 months. Saxenda PGD v003, issued 11 September 2026.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  )
}

"use client";

import { useState, useMemo, useEffect } from "react";
import type { ClinicalAlert } from "../shared/types";
import {
  calculateAge, initialPatientDetails, initialConsent, initialSummary,
  validatePatientStep, validateConsentStep, validateSummaryStep,
  type BasePatientDetails, type BaseConsent, type BaseSummary,
} from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from "../shared/components/FormInputs";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { PeriodPainSummaryReport } from "./components/PeriodPainSummaryReport";

/**
 * Period Pain ePGD, aligned to the Naproxen or Mefenamic acid for Period
 * Pain (Dysmenorrhoea) PGD, version 005, issued 11 September 2026:
 * primary dysmenorrhoea in females aged 16+. NSAID exclusions enforced as
 * hard stops (ulcer/GI bleed history, NSAID/aspirin hypersensitivity,
 * severe hepatic/renal/cardiac impairment, other NSAIDs or anticoagulants,
 * interacting medicines, pregnancy, breastfeeding; coagulation disorders
 * for naproxen; inflammatory bowel disease for mefenamic acid). One cycle
 * per supply.
 */

const PGD_STRAPLINE = "Naproxen or Mefenamic acid for Period Pain (Dysmenorrhoea) PGD, version 005, issued 11 September 2026";

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

interface Clinical {
  femaleConfirmed: boolean;
  primaryDysmenorrhoea: boolean;
  /** Decision 44: inclusion criterion. Paracetamol or an antispasmodic has been
   *  tried for at least one cycle and was insufficient, or is unsuitable for
   *  this patient, with the answer recorded. "not-tried" fails the criterion. */
  priorTreatment: "" | "tried-insufficient" | "unsuitable" | "not-tried";
  /** What was tried and for how long, or why paracetamol and antispasmodics are unsuitable. */
  priorTreatmentDetail: string;
  redFlagSymptoms: boolean; // abnormal bleeding, fever, suspected secondary cause
  pregnantOrSuspected: boolean;
  breastfeeding: boolean;
  ulcerOrGIBleed: boolean;
  nsaidHypersensitivity: boolean;
  severeOrganImpairment: boolean;
  otherNsaidsOrAnticoagulants: boolean;
  coagulationDisorder: boolean;
  interactingMedicines: boolean;
  /** Exclusion in the mefenamic acid arm; caution (UC, Crohn's) in the naproxen arm. */
  inflammatoryBowelDisease: boolean;
  asthma: boolean; // caution, NSAID-sensitive asthma
  giConditionHistory: boolean; // caution
  cardiovascularRisk: boolean; // caution: uncontrolled hypertension, HF, IHD, PAD, CVD
  sleOrMctd: boolean; // caution: aseptic meningitis
  epilepsy: boolean; // caution, mefenamic acid
  bleedingRiskMedicines: boolean; // caution: corticosteroids, SSRIs
  allergies: string;
  /** One cycle per supply; short-term use only. Previous supplies are asked so
   *  a woman is not supplied month after month with no reassessment. */
  previousSupply: boolean;
  lastSupplyDate: string;
  previousCycles: number | null;
  /** Failure of first-line treatment is a referral trigger in the guidance summary. */
  notRespondingToTreatment: boolean;
  product: "naproxen" | "mefenamic-acid" | "";
  quantity: string;
  brand: string;
  withFoodAdvice: boolean;
  maxDoseAdvice: boolean;
  reviewAdvice: boolean;
  avoidAlcoholAdvice: boolean;
  noOtherNsaidsAdvice: boolean;
  stopIfReactionAdvice: boolean;
  nonDrugAdvice: boolean;
  contraceptionAlternativeAdvice: boolean;
  pilSupplied: boolean;
}

export default function PeriodPainClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const blank: Clinical = {
    femaleConfirmed: false,
    primaryDysmenorrhoea: false, priorTreatment: "", priorTreatmentDetail: "", redFlagSymptoms: false, pregnantOrSuspected: false, breastfeeding: false,
    ulcerOrGIBleed: false, nsaidHypersensitivity: false, severeOrganImpairment: false,
    otherNsaidsOrAnticoagulants: false, coagulationDisorder: false, interactingMedicines: false,
    inflammatoryBowelDisease: false,
    asthma: false, giConditionHistory: false, cardiovascularRisk: false, sleOrMctd: false, epilepsy: false, bleedingRiskMedicines: false,
    allergies: "", previousSupply: false, lastSupplyDate: "", previousCycles: null, notRespondingToTreatment: false,
    product: "", quantity: "", brand: "",
    withFoodAdvice: false, maxDoseAdvice: false, reviewAdvice: false,
    avoidAlcoholAdvice: false, noOtherNsaidsAdvice: false, stopIfReactionAdvice: false, nonDrugAdvice: false, contraceptionAlternativeAdvice: false, pilSupplied: false,
  };
  const [c, setC] = useState<Clinical>(blank);
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  // Auto-fill pharmacist details from the logged-in user; refires after a
  // "New Consultation" reset so later patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    setSummary((p) => ({
      ...p,
      pharmacistName: __pharmProfile.name,
      pharmacistGPhC: __pharmProfile.gphcNumber,
      pharmacyName: __pharmProfile.pharmacyName,
      pharmacyAddress: __pharmProfile.pharmacyAddress,
    }));
  }, [__pharmProfile, summary.pharmacistName, summary.pharmacistGPhC]);

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    if (patient.age !== null && patient.age < 16)
      a.push({ code: "under-16", severity: "stop", message: "Under 16, excluded from this PGD", detail: "Refer to the GP." });
    if (c.priorTreatment === "not-tried")
      a.push({ code: "prior-treatment", severity: "stop", message: "Paracetamol or an antispasmodic not yet tried, inclusion criterion not met", detail: "Decision 44: supply under this PGD requires that paracetamol or an antispasmodic has been tried for at least one cycle and was insufficient, or is unsuitable for this patient. Advise paracetamol or an antispasmodic (as a separate sale, subject to the usual checks) and review after one cycle." });
    if (c.redFlagSymptoms)
      a.push({ code: "red-flags", severity: "stop", message: "Features suggesting secondary dysmenorrhoea", detail: "Symptoms starting later in life; severe, progressive or unresponsive pain; intermenstrual or postcoital bleeding, dyspareunia or abnormal discharge need GP assessment, not PGD supply." });
    if (c.pregnantOrSuspected)
      a.push({ code: "pregnancy", severity: "stop", message: "Known or suspected pregnancy, excluded", detail: "NSAIDs are excluded; refer to the GP or midwife." });
    if (c.breastfeeding)
      a.push({ code: "breastfeeding", severity: "stop", message: "Breastfeeding, excluded", detail: "Refer to the GP." });
    if (c.ulcerOrGIBleed)
      a.push({ code: "gi-history", severity: "stop", message: "History of peptic ulcer disease or GI bleeding, excluded", detail: "NSAIDs contraindicated; refer." });
    if (c.nsaidHypersensitivity)
      a.push({ code: "nsaid-allergy", severity: "stop", message: "NSAID or aspirin hypersensitivity, or hypersensitivity to any ingredient, excluded", detail: "Refer for alternative management." });
    if (c.severeOrganImpairment)
      a.push({ code: "organ-impairment", severity: "stop", message: "Severe hepatic, renal or cardiac impairment, excluded", detail: "Refer to the GP." });
    if (c.otherNsaidsOrAnticoagulants)
      a.push({ code: "nsaid-anticoag", severity: "stop", message: "Concurrent NSAIDs (including aspirin) or anticoagulants, excluded", detail: "Bleeding risk; refer to the GP." });
    if (c.coagulationDisorder)
      a.push({ code: "coagulation", severity: "stop", message: "Coagulation disorder or drug therapy interfering with haemostasis, excluded", detail: "Refer to the GP." });
    if (c.interactingMedicines)
      a.push({ code: "interaction", severity: "stop", message: "Clinically significant interacting medication", detail: "Excluded from this PGD; refer." });
    // IBD excludes only the mefenamic acid arm. The stop fires only once
    // mefenamic acid is chosen; before a product is chosen, and with
    // naproxen, it is a caution, so the IBD patient is not stopped on the
    // history step before she can be offered naproxen.
    if (c.inflammatoryBowelDisease && c.product === "mefenamic-acid")
      a.push({ code: "ibd", severity: "stop", message: "Inflammatory bowel disease, excluded from the mefenamic acid arm", detail: "Mefenamic acid is excluded. Choose naproxen (with care: ulcerative colitis or Crohn's disease may be exacerbated) or refer." });
    if (c.inflammatoryBowelDisease && c.product !== "mefenamic-acid")
      a.push({ code: "ibd-caution", severity: "caution", message: "Inflammatory bowel disease: mefenamic acid excluded, naproxen with care", detail: "Ulcerative colitis and Crohn's disease may be exacerbated by NSAIDs. Mefenamic acid cannot be supplied; naproxen may be given with care." });
    if (c.notRespondingToTreatment)
      a.push({ code: "not-responding", severity: "stop", message: "Symptoms have not responded to first-line treatment over 3 to 6 months", detail: "Failure of first-line treatment is a referral trigger. Refer to the GP or gynaecology rather than supplying again." });
    if (c.asthma)
      a.push({ code: "asthma", severity: "caution", message: "Asthma, NSAID caution", detail: "NSAIDs have been reported to precipitate bronchospasm. Confirm no previous NSAID-triggered bronchospasm; counsel to stop and seek help if wheeze develops." });
    if (c.giConditionHistory)
      a.push({ code: "gi-caution", severity: "caution", message: "History of gastrointestinal conditions", detail: "Use with caution. Advise to avoid alcohol and to report any unusual abdominal symptoms, stopping the medicine until reviewed." });
    if (c.cardiovascularRisk)
      a.push({ code: "cv-caution", severity: "caution", message: "Uncontrolled hypertension, heart failure, ischaemic heart disease, peripheral arterial or cerebrovascular disease", detail: "Treat only after careful consideration; fluid retention, oedema and a small increased risk of arterial thrombotic events are reported with NSAIDs. Severe cardiac impairment is an exclusion." });
    if (c.sleOrMctd)
      a.push({ code: "sle", severity: "caution", message: "SLE or mixed connective tissue disorder", detail: "Increased risk of aseptic meningitis with NSAIDs." });
    if (c.epilepsy && c.product !== "naproxen")
      a.push({ code: "epilepsy", severity: "caution", message: "Epilepsy, mefenamic acid caution", detail: "Caution should be exercised; mefenamic acid can cause seizures in overdose. Do not exceed the stated dose." });
    if (c.bleedingRiskMedicines)
      a.push({ code: "bleeding-risk", severity: "caution", message: "Oral corticosteroid or SSRI", detail: "Increases the risk of GI ulceration or bleeding with an NSAID. Counsel to report any unusual abdominal symptoms." });
    return a;
  }, [patient.age, c]);
  const hasStops = alerts.some((x) => x.severity === "stop");

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 16, requireFemale: true, femaleConfirmed: c.femaleConfirmed });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.primaryDysmenorrhoea) return "Please confirm the presentation is primary dysmenorrhoea";
        if (!c.priorTreatment) return "Record whether paracetamol or an antispasmodic has been tried for at least one cycle, or is unsuitable";
        if ((c.priorTreatment === "tried-insufficient" || c.priorTreatment === "unsuitable") && !c.priorTreatmentDetail.trim()) return c.priorTreatment === "unsuitable" ? "Record why paracetamol and antispasmodics are unsuitable" : "Record what was tried and for how many cycles";
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        if (c.previousSupply && (!c.lastSupplyDate || c.previousCycles === null)) return "Record the date of the last supply and the number of cycles already treated";
        return null;
      case 3:
        if (!c.product) return "Please select the treatment";
        if (!c.quantity.trim()) return "Please select the quantity supplied (one cycle per supply)";
        if (!c.brand.trim()) return "Please record the brand of medication supplied";
        return null;
      case 4:
        if (
          !c.withFoodAdvice || !c.maxDoseAdvice || !c.reviewAdvice || !c.avoidAlcoholAdvice ||
          !c.noOtherNsaidsAdvice || !c.stopIfReactionAdvice || !c.nonDrugAdvice || !c.contraceptionAlternativeAdvice
        ) return "Please confirm all counselling points";
        if (!c.pilSupplied) return "Confirm the patient information leaflet was supplied";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary]);

  // A stop anywhere disables Next on every step. The progress bar only moves
  // backwards, so the only route past a stop is "Save as not supplied".
  const canProceed = !validationError && !hasStops;
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: { patient, consent, clinical: c, alerts, pgd: PGD_STRAPLINE } as unknown as Record<string, unknown>,
    outcome: hasStops ? "not_supplied" : "completed",
    medicine: !hasStops && c.product
      ? {
          name: c.product === "naproxen" ? "Naproxen tablets" : "Mefenamic acid",
          medicine: c.product,
          dose: c.product === "naproxen" ? "500 mg then 250 mg every 6 to 8 hours as needed" : "500 mg three times a day",
          duration: "Up to 3 days per menstrual cycle",
          quantity: c.quantity,
        }
      : undefined,
    summary: {
      pharmacistName: summary.pharmacistName || __pharmProfile?.name || "",
      pharmacistGPhC: summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
      pharmacyName: summary.pharmacyName || __pharmProfile?.pharmacyName || "",
      pharmacyAddress: summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
      consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
      clinicalNotes: summary.clinicalNotes,
    },
    consent: { notifyGp: consent.notifyGp },
  });

  const onPatientChange = (field: keyof BasePatientDetails, value: any) =>
    setPatient((p) => ({ ...p, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value) } : {}) }));

  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <PatientDetailsStep
            patient={patient}
            onChange={onPatientChange}
            requireAdult={false}
            genderOption={{
              label: "Patient is female",
              description: "This PGD is for female patients aged 16 years or older.",
              checked: c.femaleConfirmed,
              onToggle: (v: boolean) => set({ femaleConfirmed: v }),
            }}
          />
        );
      case 1: return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <Checkbox label="Presentation consistent with primary dysmenorrhoea (cyclical crampy pain before or during menstruation, no red flags)" checked={c.primaryDysmenorrhoea} onChange={(v) => set({ primaryDysmenorrhoea: v })} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-navy-900">Paracetamol or an antispasmodic (inclusion criterion)</p>
              <SelectInput
                label="Has paracetamol or an antispasmodic been tried for at least one cycle?"
                value={c.priorTreatment}
                onChange={(v) => set({ priorTreatment: v as Clinical["priorTreatment"], ...(v === "not-tried" ? { priorTreatmentDetail: "" } : {}) })}
                options={[
                  { value: "tried-insufficient", label: "Tried for at least one cycle and insufficient" },
                  { value: "unsuitable", label: "Unsuitable for this patient (record why)" },
                  { value: "not-tried", label: "Not yet tried (inclusion criterion not met; advise and review after one cycle)" },
                ]}
                required
              />
              {(c.priorTreatment === "tried-insufficient" || c.priorTreatment === "unsuitable") && (
                <TextInput
                  label={c.priorTreatment === "unsuitable" ? "Why paracetamol and antispasmodics are unsuitable" : "What was tried, at what dose, and for how many cycles"}
                  value={c.priorTreatmentDetail}
                  onChange={(v) => set({ priorTreatmentDetail: v })}
                  placeholder={c.priorTreatment === "unsuitable" ? "e.g. paracetamol hypersensitivity; hyoscine butylbromide contraindicated" : "e.g. paracetamol 1 g four times a day for two cycles, pain not controlled"}
                  required
                />
              )}
            </div>
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-navy-900">Previous treatment (one cycle per supply; short-term use only)</p>
              <Checkbox label="Supplied under this PGD before" checked={c.previousSupply} onChange={(v) => set({ previousSupply: v, ...(v ? {} : { lastSupplyDate: "", previousCycles: null }) })} />
              {c.previousSupply && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput label="Date of last supply" type="date" value={c.lastSupplyDate} onChange={(v) => set({ lastSupplyDate: v })} required />
                  <NumberInput label="Cycles already treated" value={c.previousCycles} onChange={(v) => set({ previousCycles: v })} min={0} max={24} unit="cycles" required />
                </div>
              )}
              <Checkbox label="Symptoms have not responded to first-line treatment over 3 to 6 months" description="Failure of first-line treatment is a referral trigger: refer rather than supply again." checked={c.notRespondingToTreatment} onChange={(v) => set({ notRespondingToTreatment: v })} />
            </div>
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">Exclusions. Any one excludes; refer.</p>
              <Checkbox label="Features suggesting a secondary cause: symptoms starting later in life; severe, progressively worsening or unresponsive pain; intermenstrual or postcoital bleeding, dyspareunia or abnormal discharge; fever" checked={c.redFlagSymptoms} onChange={(v) => set({ redFlagSymptoms: v })} />
              <Checkbox label="Known or suspected pregnancy" checked={c.pregnantOrSuspected} onChange={(v) => set({ pregnantOrSuspected: v })} />
              <Checkbox label="Breastfeeding" checked={c.breastfeeding} onChange={(v) => set({ breastfeeding: v })} />
              <Checkbox label="History of peptic ulcer disease or gastrointestinal bleeding" checked={c.ulcerOrGIBleed} onChange={(v) => set({ ulcerOrGIBleed: v })} />
              <Checkbox label="NSAID or aspirin hypersensitivity, or hypersensitivity to any of the ingredients" checked={c.nsaidHypersensitivity} onChange={(v) => set({ nsaidHypersensitivity: v })} />
              <Checkbox label="Severe hepatic, renal or cardiac impairment" checked={c.severeOrganImpairment} onChange={(v) => set({ severeOrganImpairment: v })} />
              <Checkbox label="Concurrent use of other NSAIDs (including aspirin) or anticoagulants" checked={c.otherNsaidsOrAnticoagulants} onChange={(v) => set({ otherNsaidsOrAnticoagulants: v })} />
              <Checkbox label="Coagulation disorder, or drug therapy that interferes with haemostasis" checked={c.coagulationDisorder} onChange={(v) => set({ coagulationDisorder: v })} />
              <Checkbox label="Clinically significant interacting medication" checked={c.interactingMedicines} onChange={(v) => set({ interactingMedicines: v })} />
              <Checkbox label="Inflammatory bowel disease" checked={c.inflammatoryBowelDisease} onChange={(v) => set({ inflammatoryBowelDisease: v })} description="Excludes mefenamic acid. Naproxen with care only (ulcerative colitis, Crohn's disease may be exacerbated)." />
            </div>
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800">Cautions</p>
              <Checkbox label="Asthma, or a previous history of bronchial asthma" checked={c.asthma} onChange={(v) => set({ asthma: v })} />
              <Checkbox label="History of gastrointestinal conditions" checked={c.giConditionHistory} onChange={(v) => set({ giConditionHistory: v })} />
              <Checkbox label="Uncontrolled hypertension, heart failure, ischaemic heart disease, peripheral arterial disease or cerebrovascular disease" checked={c.cardiovascularRisk} onChange={(v) => set({ cardiovascularRisk: v })} description="Treat only after careful consideration." />
              <Checkbox label="Systemic lupus erythematosus or mixed connective tissue disorder" checked={c.sleOrMctd} onChange={(v) => set({ sleOrMctd: v })} />
              <Checkbox label="Epilepsy" checked={c.epilepsy} onChange={(v) => set({ epilepsy: v })} description="Caution with mefenamic acid." />
              <Checkbox label="Taking an oral corticosteroid or an SSRI" checked={c.bleedingRiskMedicines} onChange={(v) => set({ bleedingRiskMedicines: v })} description="Increased risk of GI ulceration or bleeding." />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Treatment" value={c.product} onChange={(v) => set({ product: v as Clinical["product"], quantity: "" })}
              options={[
                { value: "naproxen", label: "Naproxen 250 mg or 500 mg tablets" },
                { value: "mefenamic-acid", label: "Mefenamic acid 250 mg capsules or 500 mg tablets" },
              ]} required />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-1">
              {c.product === "naproxen" && (
                <>
                  <p>Naproxen: initially 500 mg followed by 250 mg every 6 to 8 hours as needed. Maximum 1250 mg on day 1, then up to 1000 mg daily. Oral, with or after food.</p>
                  <p>Supply: 28 tablets of 250 mg. Typically up to 3 days per menstrual cycle. Lowest effective dose for the shortest duration. (The document also lists 14 x 500 mg, but the regimen needs 250 mg doses, which 500 mg tablets cannot deliver without splitting; that pack is not offered until the document is reissued.)</p>
                </>
              )}
              {c.product === "mefenamic-acid" && (
                <>
                  <p>Mefenamic acid: 500 mg three times a day. Oral, with or after food.</p>
                  <p>One cycle per supply: 18 capsules of 250 mg, or 9 tablets of 500 mg (500 mg three times a day for 3 days). A further supply needs a further consultation.</p>
                  <p className="font-semibold text-red-700">Do not exceed the stated dose. Mefenamic acid can cause seizures in overdose; 40 mg/kg or more is potentially toxic, so a 50 kg woman needs only one extra 500 mg dose in 24 hours to be at risk.</p>
                </>
              )}
              {!c.product && "Select a treatment to see the dosing summary."}
            </div>
            <SelectInput
              label="Quantity supplied"
              value={c.quantity}
              onChange={(v) => set({ quantity: v })}
              disabled={!c.product}
              options={
                c.product === "naproxen"
                  ? [
                      { value: "28 x naproxen 250 mg tablets", label: "28 x 250 mg tablets" },
                    ]
                  : c.product === "mefenamic-acid"
                    ? [
                        { value: "18 x mefenamic acid 250 mg capsules", label: "18 x 250 mg capsules (one cycle)" },
                        { value: "9 x mefenamic acid 500 mg tablets", label: "9 x 500 mg tablets (one cycle)" },
                      ]
                    : []
              }
              required
            />
            <TextInput label="Brand of medication supplied" value={c.brand} onChange={(v) => set({ brand: v })} placeholder="Name and brand, as required by the PGD record" required />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-4 print:hidden">
            <AlertBanner alerts={alerts} />
            <p className="text-xs text-gray-600">{PGD_STRAPLINE}. Supplied: {c.product === "naproxen" ? "Naproxen" : c.product === "mefenamic-acid" ? "Mefenamic acid" : "not selected"}{c.quantity ? `, ${c.quantity}` : ""}{c.brand ? ` (${c.brand})` : ""}. Oral, with or after food.</p>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Take with or after food; report any unusual abdominal symptoms (indigestion, black stools, vomiting blood) and stop the medicine until reviewed" checked={c.withFoodAdvice} onChange={(v) => set({ withFoodAdvice: v })} />
              <Checkbox label={c.product === "mefenamic-acid" ? "Maximum dose explained: 500 mg three times a day, do not exceed the stated dose (seizure risk in overdose); lowest effective dose for the shortest duration, up to 3 days per cycle" : "Maximum dose explained: 1250 mg on day 1, then up to 1000 mg daily; lowest effective dose for the shortest duration, up to 3 days per cycle"} checked={c.maxDoseAdvice} onChange={(v) => set({ maxDoseAdvice: v })} />
              <Checkbox label="Avoid alcohol while taking; monitor for gastrointestinal discomfort or bleeding" checked={c.avoidAlcoholAdvice} onChange={(v) => set({ avoidAlcoholAdvice: v })} />
              <Checkbox label="Avoid taking two or more NSAIDs (including aspirin) together" checked={c.noOtherNsaidsAdvice} onChange={(v) => set({ noOtherNsaidsAdvice: v })} />
              <Checkbox label={c.product === "mefenamic-acid" ? "Stop immediately and seek advice for rash, mouth ulcers, diarrhoea, wheeze or any sign of hypersensitivity" : "Stop immediately and seek advice for rash, mouth ulcers, wheeze, visual disturbance or any sign of hypersensitivity"} checked={c.stopIfReactionAdvice} onChange={(v) => set({ stopIfReactionAdvice: v })} />
              <Checkbox label="Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or you become systemically very unwell; refer to a gynaecologist if severe symptoms do not respond within 3 to 6 months" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
              <Checkbox label="Local heat (hot water bottle or heat patch) and TENS may help reduce pain" checked={c.nonDrugAdvice} onChange={(v) => set({ nonDrugAdvice: v })} />
              <Checkbox label="For women who do not wish to conceive, hormonal contraception is an alternative first-line treatment" checked={c.contraceptionAlternativeAdvice} onChange={(v) => set({ contraceptionAlternativeAdvice: v })} />
              <Checkbox label="Patient information leaflet (PIL) supplied with the medication" checked={c.pilSupplied} onChange={(v) => set({ pilSupplied: v })} required />
            </div>
            <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
            <TextInput label="Pharmacy name" value={summary.pharmacyName} onChange={(v) => setSummary((p) => ({ ...p, pharmacyName: v }))} />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4 print:hidden">Review the record below before saving and printing. This is what prints.</p>
              <PeriodPainSummaryReport patient={patient} consent={consent} clinical={c} summary={summary} alerts={alerts} strapline={PGD_STRAPLINE} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          <ProgressBar stepLabels={STEP_LABELS} currentStep={step} onStepClick={(s) => { if (s < step) setStep(s); }} completedSteps={completed} hasErrors={!!validationError} />
          <StepWrapper
            title={STEP_LABELS[step]}
            currentStep={step}
            totalSteps={STEP_LABELS.length}
            onNext={next}
            onPrev={prev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={() => { setStep(0); setCompleted(new Set()); setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent }); setSummary(initialSummary()); setC({ ...blank }); }}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

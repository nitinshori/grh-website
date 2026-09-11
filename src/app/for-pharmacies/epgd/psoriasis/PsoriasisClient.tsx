"use client";

import { useState, useMemo } from "react";
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
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";

/**
 * Plaque Psoriasis ePGD, aligned to the Plaque Psoriasis PGD version 004,
 * issued 11 September 2026: calcipotriol 50 micrograms/g with betamethasone
 * (as dipropionate) 0.5 mg/g, as ointment, gel, cream or cutaneous foam,
 * once daily for up to 4 weeks, in adults aged 18 and over with STABLE plaque
 * psoriasis of the trunk, limbs or scalp. Maximum 15g in any one day, maximum
 * 30% of body surface, up to 100g per week. One 4 week course; a further
 * course only after GP review; maximum three courses in any 12 months.
 * Erythrodermic, pustular, exfoliative and guttate psoriasis are excluded.
 */
export const PSORIASIS_PGD_VERSION = "Plaque Psoriasis PGD, version 004, issued 11 September 2026";

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

type Formulation = "" | "ointment" | "gel" | "foam" | "cream";

const FORMULATION_LABEL: Record<Exclude<Formulation, "">, string> = {
  ointment: "Ointment (Dovobet ointment or generic): body and limb plaques",
  gel: "Gel (Dovobet gel or generic): licensed for scalp as well as body",
  foam: "Cutaneous foam (Enstilar): body and scalp; extremely flammable aerosol",
  cream: "Cream (Wynzora)",
};

interface Clinical {
  confirmedPlaque: boolean;
  emergencyFormsExcluded: boolean; // erythrodermic, pustular, exfoliative and guttate considered and excluded
  erythrodermic: boolean;
  pustular: boolean;
  exfoliative: boolean;
  guttate: boolean;
  unstable: boolean;
  extentPercent: string;
  extentEstimatedHow: string;
  sites: string;
  scalpInvolved: boolean;
  faceGenitalFlexural: boolean;
  extensiveNeedsSystemic: boolean;
  over15gPerDay: boolean;
  otherSkinConditions: boolean; // viral, fungal, bacterial, parasitic, TB or syphilis skin lesions; perioral dermatitis, rosacea, acne
  atrophicSkin: boolean; // atrophic skin, striae atrophicae, fragile skin veins, ichthyosis
  ulcersOrWounds: boolean;
  secondaryInfection: boolean;
  otherTopicalSteroidSameArea: boolean;
  phototherapyOrImmunosuppressed: boolean;
  pregnantOrBreastfeeding: boolean;
  componentAllergy: boolean;
  calciumDisorder: boolean;
  severeRenalOrHepatic: boolean;
  diabetes: boolean;
  visualDisturbance: boolean;
  courseType: "" | "first" | "repeat";
  gpReviewDate: string;
  coursesLast12Months: "" | "0" | "1" | "2" | "3-or-more";
  allergies: string;
  product: "calcipotriol-betamethasone" | "";
  formulation: Formulation;
  brand: string;
  licensedForSite: boolean;
  quantity: string;
  batchNumber: string;
  expiryDate: string;
  applicationAdvice: boolean;
  maxDoseAdvice: boolean;
  handsDressingShowerAdvice: boolean;
  emollientAdvice: boolean;
  fireRiskAdvice: boolean;
  sunAdvice: boolean;
  fourWeekAdvice: boolean;
  reboundAdvice: boolean;
  symptomsAdvice: boolean;
  reviewAdvice: boolean;
}

const blank: Clinical = {
  confirmedPlaque: false, emergencyFormsExcluded: false,
  erythrodermic: false, pustular: false, exfoliative: false, guttate: false, unstable: false,
  extentPercent: "", extentEstimatedHow: "", sites: "", scalpInvolved: false, faceGenitalFlexural: false,
  extensiveNeedsSystemic: false, over15gPerDay: false, otherSkinConditions: false, atrophicSkin: false,
  ulcersOrWounds: false, secondaryInfection: false, otherTopicalSteroidSameArea: false,
  phototherapyOrImmunosuppressed: false, pregnantOrBreastfeeding: false, componentAllergy: false,
  calciumDisorder: false, severeRenalOrHepatic: false, diabetes: false, visualDisturbance: false,
  courseType: "", gpReviewDate: "", coursesLast12Months: "", allergies: "",
  product: "", formulation: "", brand: "", licensedForSite: false, quantity: "", batchNumber: "", expiryDate: "",
  applicationAdvice: false, maxDoseAdvice: false, handsDressingShowerAdvice: false, emollientAdvice: false,
  fireRiskAdvice: false, sunAdvice: false, fourWeekAdvice: false, reboundAdvice: false, symptomsAdvice: false,
  reviewAdvice: false,
};

export default function PsoriasisClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>(blank);
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const extent = parseFloat(c.extentPercent);

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    if (patient.age !== null && patient.age < 18)
      a.push({ code: "under-18", severity: "stop", message: "Under 18: excluded from this PGD", detail: "Safety and efficacy have not been established below 18. Refer children and young people with any type of psoriasis to a specialist." });
    if (c.erythrodermic)
      a.push({ code: "erythrodermic", severity: "stop", message: "ERYTHRODERMIC psoriasis: same-day EMERGENCY referral. Do not supply", detail: "Widespread redness over most of the body with scaling and shedding, often cold, shivery or unwell. Fluid, heat and protein loss, and risk of sepsis. SPC contraindication." });
    if (c.pustular)
      a.push({ code: "pustular", severity: "stop", message: "PUSTULAR psoriasis: contraindicated. Generalised pustular psoriasis is a same-day EMERGENCY", detail: "Sheets or clusters of small sterile pustules on red skin. Generalised: same-day emergency referral. Localised to palms and soles: still a contraindication; refer, though not as an emergency unless the patient is unwell." });
    if (c.exfoliative)
      a.push({ code: "exfoliative", severity: "stop", message: "EXFOLIATIVE psoriasis: same-day referral. Do not supply", detail: "Widespread peeling or shedding of skin in sheets. SPC contraindication." });
    if (c.guttate)
      a.push({ code: "guttate", severity: "stop", message: "GUTTATE psoriasis: refer", detail: "Multiple small drop-like lesions, often after a sore throat. There is no experience with this product in guttate psoriasis." });
    if (c.unstable)
      a.push({ code: "unstable", severity: "stop", message: "Unstable or rapidly worsening psoriasis: refer", detail: "This PGD is for STABLE plaque psoriasis only." });
    if (c.faceGenitalFlexural)
      a.push({ code: "site-excluded", severity: "stop", message: "Facial, genital or flexural psoriasis: excluded", detail: "The skin at those sites is very sensitive to corticosteroids and the SPC says the product should not be used there. Refer." });
    if (!isNaN(extent) && extent > 30)
      a.push({ code: "extent", severity: "stop", message: "More than 30% of body surface affected: refer", detail: "The 30% limit exists because of calcipotriol and the risk of hypercalcaemia. Do not supply and advise partial use; refer to the GP." });
    if (c.over15gPerDay)
      a.push({ code: "over-15g", severity: "stop", message: "Would need more than 15g in a day: refer", detail: "Maximum 15g in any one day is the SPC limit that protects against hypercalcaemia." });
    if (c.extensiveNeedsSystemic)
      a.push({ code: "extensive", severity: "stop", message: "Severe or extensive psoriasis not amenable to topical therapy", detail: "Refer to the GP or dermatology." });
    if (c.otherSkinConditions)
      a.push({ code: "other-conditions", severity: "stop", message: "Skin infection or excluded skin condition at the site", detail: "Viral (herpes simplex, varicella), fungal, bacterial or parasitic skin infection, skin manifestations of tuberculosis or syphilis, perioral dermatitis, rosacea, acne rosacea or acne vulgaris exclude supply." });
    if (c.atrophicSkin)
      a.push({ code: "atrophic", severity: "stop", message: "Atrophic skin, striae atrophicae, fragility of skin veins, or ichthyosis: excluded", detail: "SPC contraindication. Refer." });
    if (c.ulcersOrWounds)
      a.push({ code: "ulcers", severity: "stop", message: "Ulcers or wounds in or near the area to be treated: excluded", detail: "Refer." });
    if (c.secondaryInfection)
      a.push({ code: "secondary-infection", severity: "stop", message: "Secondary infection of the plaques: treat the infection first", detail: "Under the appropriate PGD or by referral. If infection worsens, the corticosteroid must be stopped." });
    if (c.otherTopicalSteroidSameArea)
      a.push({ code: "other-steroid", severity: "stop", message: "Currently using another topical corticosteroid on the same area: excluded", detail: "Concurrent treatment with other steroids on the same site must be avoided." });
    if (c.phototherapyOrImmunosuppressed)
      a.push({ code: "phototherapy", severity: "stop", message: "Current phototherapy, or systemic immunosuppressive or systemic anti-psoriatic treatment", detail: "Excluded; refer to the treating team." });
    if (c.pregnantOrBreastfeeding)
      a.push({ code: "pregnancy", severity: "stop", message: "Pregnant, planning pregnancy, or breastfeeding: excluded", detail: "Refer to the GP." });
    if (c.componentAllergy)
      a.push({ code: "allergy", severity: "stop", message: "Hypersensitivity to calcipotriol, betamethasone or any corticosteroid, or any excipient", detail: "Excluded; refer." });
    if (c.calciumDisorder)
      a.push({ code: "calcium", severity: "stop", message: "Known disorder of calcium metabolism: excluded", detail: "SPC contraindication (calcipotriol and hypercalcaemia). Refer." });
    if (c.severeRenalOrHepatic)
      a.push({ code: "renal-hepatic", severity: "stop", message: "Severe renal impairment or severe hepatic disease: excluded", detail: "Safety and efficacy have not been evaluated. Refer." });
    if (c.courseType === "repeat" && !c.gpReviewDate)
      a.push({ code: "repeat-no-review", severity: "stop", message: "Repeat course without GP review since the last course: excluded", detail: "A further course requires that the GP has reviewed the patient since the last course and agreed continuation. Ask, and record the answer and the date." });
    if (c.coursesLast12Months === "3-or-more")
      a.push({ code: "three-courses", severity: "stop", message: "Three 4 week courses already in the last 12 months: refer", detail: "Maximum three 4 week courses in any 12 months under this PGD, whatever the GP has said. Beyond that, refer." });
    if (c.visualDisturbance)
      a.push({ code: "visual", severity: "stop", message: "Blurred vision or other visual disturbance: refer to an ophthalmologist", detail: "Reported with topical as well as systemic corticosteroids; possible causes include cataract, glaucoma and central serous chorioretinopathy. Refer for evaluation rather than supplying a potent steroid." });
    if (c.diabetes)
      a.push({ code: "diabetes", severity: "caution", message: "Diabetes: systemic absorption of a potent corticosteroid can affect glycaemic control", detail: "Advise closer monitoring during the course." });
    if (c.scalpInvolved && (c.formulation === "ointment" || c.formulation === "cream"))
      a.push({ code: "scalp-formulation", severity: "caution", message: "Scalp treated: check the formulation is licensed for the scalp", detail: "The gel and the cutaneous foam are licensed for the scalp. The Dovobet ointment SPC states there is limited experience of its use on the scalp. Check the formulation is licensed for the site being treated before supplying." });
    return a;
  }, [patient.age, c, extent]);
  const hasStops = alerts.some((x) => x.severity === "stop");

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 18 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.confirmedPlaque) return "Please confirm the diagnosis of stable plaque psoriasis, mild to moderate, amenable to topical therapy";
        if (!c.emergencyFormsExcluded) return "Confirm that erythrodermic, pustular, exfoliative and guttate presentations were considered and excluded (Appendix 1)";
        if (!c.sites.trim()) return "Please record the sites treated (trunk, limbs or scalp)";
        if (!c.extentPercent.trim() || isNaN(extent)) return "Record the body surface area affected as a percentage (the patient's palm is roughly 1%)";
        if (!c.extentEstimatedHow.trim()) return "Record how the body surface area was estimated";
        if (!c.courseType) return "Record whether this is a first course or a repeat";
        if (c.courseType === "repeat" && !c.gpReviewDate) return "Repeat course: record the date of the GP review that agreed continuation";
        if (!c.coursesLast12Months) return "Record the number of courses in the last 12 months";
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        return null;
      case 3:
        if (!c.product) return "Please confirm the product";
        if (!c.formulation) return "Please select the formulation";
        if (!c.brand.trim()) return "Record the brand or generic product supplied";
        if (!c.licensedForSite) return "Confirm the formulation is licensed for the site being treated";
        if (!c.quantity.trim()) return "Please record the quantity supplied (enough for the 4 week course and no more, up to 100g per week)";
        if (!c.batchNumber.trim()) return "Please record the batch number";
        if (!c.expiryDate.trim()) return "Please record the expiry date";
        return null;
      case 4:
        if (!c.applicationAdvice || !c.maxDoseAdvice || !c.handsDressingShowerAdvice || !c.emollientAdvice || !c.fireRiskAdvice || !c.sunAdvice || !c.fourWeekAdvice || !c.reboundAdvice || !c.symptomsAdvice || !c.reviewAdvice)
          return "Please confirm all counselling points, including the rebound advice in terms";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary, extent]);

  const canProceed = !validationError && (!hasStops || step >= 3);
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: { patient, consent, clinical: c, alerts, pgdVersion: PSORIASIS_PGD_VERSION } as unknown as Record<string, unknown>,
    outcome: hasStops ? "not_supplied" : "completed",
    summary: {
      pharmacistName: summary.pharmacistName, pharmacistGPhC: summary.pharmacistGPhC,
      consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
    },
  });

  const onPatientChange = (field: keyof BasePatientDetails, value: any) =>
    setPatient((p) => ({ ...p, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value) } : {}) }));

  const stepBody = () => {
    switch (step) {
      case 0: return (
        <>
          <p className="text-xs text-gray-600 mb-3">{PSORIASIS_PGD_VERSION}. Adults aged 18 and over.</p>
          <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={true} />
        </>
      );
      case 1: return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <Checkbox label="Stable plaque psoriasis, diagnosed or previously diagnosed, mild to moderate, amenable to topical therapy" checked={c.confirmedPlaque} onChange={(v) => set({ confirmedPlaque: v })} />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-navy-900">The form of psoriasis (Appendix 1): SPC contraindications and emergencies</p>
              <Checkbox label="ERYTHRODERMIC: widespread redness over most of the skin with scaling, often shivering, unwell or unable to keep warm (same-day emergency)" checked={c.erythrodermic} onChange={(v) => set({ erythrodermic: v })} />
              <Checkbox label="PUSTULAR: sheets or clusters of small sterile pustules on red skin, localised to palms and soles or generalised (generalised is a same-day emergency)" checked={c.pustular} onChange={(v) => set({ pustular: v })} />
              <Checkbox label="EXFOLIATIVE: widespread peeling or shedding of the skin (same-day referral)" checked={c.exfoliative} onChange={(v) => set({ exfoliative: v })} />
              <Checkbox label="GUTTATE: multiple small drop-like lesions, often after a sore throat (refer)" checked={c.guttate} onChange={(v) => set({ guttate: v })} />
              <Checkbox label="Unstable or rapidly worsening psoriasis of any kind" checked={c.unstable} onChange={(v) => set({ unstable: v })} />
              <Checkbox label="Erythrodermic, pustular, exfoliative and guttate presentations considered and excluded (recorded)" checked={c.emergencyFormsExcluded} onChange={(v) => set({ emergencyFormsExcluded: v })} required />
            </div>
            <TextInput label="Sites treated (trunk, limbs or scalp)" value={c.sites} onChange={(v) => set({ sites: v })} placeholder="e.g. extensor elbows and knees" required />
            <Checkbox label="Scalp involved (the formulation must be licensed for the scalp)" checked={c.scalpInvolved} onChange={(v) => set({ scalpInvolved: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <TextInput label="Body surface area affected (%)" value={c.extentPercent} onChange={(v) => set({ extentPercent: v })} placeholder="e.g. 3" type="number" required />
              <TextInput label="How it was estimated" value={c.extentEstimatedHow} onChange={(v) => set({ extentEstimatedHow: v })} placeholder="e.g. palm method, about 3 palms" required />
            </div>
            <p className="text-xs text-gray-600">The patient's whole palm including the fingers is roughly 1% of body surface. 30% is roughly thirty palms; above that, refer. Record the estimate as a percentage.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectInput label="Course" value={c.courseType} onChange={(v) => set({ courseType: v as Clinical["courseType"] })}
                options={[
                  { value: "first", label: "First 4 week course under this PGD" },
                  { value: "repeat", label: "Repeat course (GP has reviewed since the last course and agreed continuation)" },
                ]} required />
              {c.courseType === "repeat" && (
                <TextInput label="Date of the GP review that agreed continuation" type="date" value={c.gpReviewDate} onChange={(v) => set({ gpReviewDate: v })} required />
              )}
            </div>
            <SelectInput label="4 week courses under this PGD in the last 12 months" value={c.coursesLast12Months} onChange={(v) => set({ coursesLast12Months: v as Clinical["coursesLast12Months"] })}
              options={[
                { value: "0", label: "None" },
                { value: "1", label: "One" },
                { value: "2", label: "Two" },
                { value: "3-or-more", label: "Three or more (refer, whatever the GP has said)" },
              ]} required />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-navy-900">Exclusions: refer, do not supply</p>
              <Checkbox label="Facial, genital or flexural psoriasis" checked={c.faceGenitalFlexural} onChange={(v) => set({ faceGenitalFlexural: v })} />
              <Checkbox label="Would need more than 15g of product in a day" checked={c.over15gPerDay} onChange={(v) => set({ over15gPerDay: v })} />
              <Checkbox label="Severe or extensive disease not amenable to topical therapy (likely to need systemic treatment)" checked={c.extensiveNeedsSystemic} onChange={(v) => set({ extensiveNeedsSystemic: v })} />
              <Checkbox label="Viral (herpes simplex, varicella), fungal, bacterial or parasitic skin infection; skin manifestations of tuberculosis or syphilis; perioral dermatitis, rosacea, acne rosacea or acne vulgaris" checked={c.otherSkinConditions} onChange={(v) => set({ otherSkinConditions: v })} />
              <Checkbox label="Secondary infection of the plaques (treat the infection first)" checked={c.secondaryInfection} onChange={(v) => set({ secondaryInfection: v })} />
              <Checkbox label="Atrophic skin, striae atrophicae, fragility of skin veins, or ichthyosis" checked={c.atrophicSkin} onChange={(v) => set({ atrophicSkin: v })} />
              <Checkbox label="Ulcers or wounds in or near the area to be treated" checked={c.ulcersOrWounds} onChange={(v) => set({ ulcersOrWounds: v })} />
              <Checkbox label="Currently using any other topical corticosteroid on the same area" checked={c.otherTopicalSteroidSameArea} onChange={(v) => set({ otherTopicalSteroidSameArea: v })} />
              <Checkbox label="Current phototherapy, or systemic immunosuppressive or systemic anti-psoriatic treatment" checked={c.phototherapyOrImmunosuppressed} onChange={(v) => set({ phototherapyOrImmunosuppressed: v })} />
              <Checkbox label="Pregnant, planning pregnancy, or breastfeeding" checked={c.pregnantOrBreastfeeding} onChange={(v) => set({ pregnantOrBreastfeeding: v })} />
              <Checkbox label="Hypersensitivity to calcipotriol, to betamethasone or any corticosteroid, or to any excipient of the formulation" checked={c.componentAllergy} onChange={(v) => set({ componentAllergy: v })} />
              <Checkbox label="Known disorder of calcium metabolism" checked={c.calciumDisorder} onChange={(v) => set({ calciumDisorder: v })} />
              <Checkbox label="Severe renal impairment or severe hepatic disease" checked={c.severeRenalOrHepatic} onChange={(v) => set({ severeRenalOrHepatic: v })} />
              <Checkbox label="Blurred vision or other visual disturbance (refer to an ophthalmologist)" checked={c.visualDisturbance} onChange={(v) => set({ visualDisturbance: v })} />
            </div>
            <Checkbox label="Diabetes (caution: closer glycaemic monitoring during the course)" checked={c.diabetes} onChange={(v) => set({ diabetes: v })} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Product" value={c.product} onChange={(v) => set({ product: v as Clinical["product"] })}
              options={[
                { value: "calcipotriol-betamethasone", label: "Calcipotriol 50 micrograms/g with betamethasone (as dipropionate) 0.5 mg/g, once daily" },
              ]} required />
            <SelectInput label="Formulation (check it is licensed for the site treated; the strength is the same across all four, the licensed sites are not)" value={c.formulation} onChange={(v) => set({ formulation: v as Formulation })}
              options={[
                { value: "ointment", label: FORMULATION_LABEL.ointment },
                { value: "gel", label: FORMULATION_LABEL.gel },
                { value: "foam", label: FORMULATION_LABEL.foam },
                { value: "cream", label: FORMULATION_LABEL.cream },
              ]} required />
            <TextInput label="Brand or generic product supplied" value={c.brand} onChange={(v) => set({ brand: v })} placeholder="e.g. Dovobet ointment 60g; generic calcipotriol/betamethasone gel" required />
            <p className="text-xs text-gray-600">Xamiol gel is discontinued and must not be ordered.</p>
            <Checkbox label="The formulation supplied is licensed for the site being treated" checked={c.licensedForSite} onChange={(v) => set({ licensedForSite: v })} required />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              Apply once daily to affected areas. MAXIMUM 15g IN ANY ONE DAY. Body surface treated must not exceed 30%. Up to 100g per week, within the 15g daily maximum and appropriate to the area treated: supply enough for the 4 WEEK course and no more. Then stop and review. Continuing or restarting beyond 4 weeks requires GP review; maximum three courses in any 12 months.
            </div>
            <TextInput label="Quantity supplied" value={c.quantity} onChange={(v) => set({ quantity: v })} placeholder="e.g. two 60g tubes (4 weeks at about 4g a day)" required />
            <div className="grid sm:grid-cols-2 gap-3">
              <TextInput label="Batch number" value={c.batchNumber} onChange={(v) => set({ batchNumber: v })} required />
              <TextInput label="Expiry date" type="month" value={c.expiryDate} onChange={(v) => set({ expiryDate: v })} required />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900">Confirm counselling covered (supply the PIL and written advice on how much to use, the 4 week limit, and what to do when the course finishes):</p>
              <Checkbox label="Once a day, to the patchy areas only. Not on your face, genitals or in skin folds" checked={c.applicationAdvice} onChange={(v) => set({ applicationAdvice: v })} />
              <Checkbox label="No more than one 15g tube-worth in a day, and not on more than about a third of your body. Your palm is roughly 1% of your skin" checked={c.maxDoseAdvice} onChange={(v) => set({ maxDoseAdvice: v })} />
              <Checkbox label="Wash your hands thoroughly afterwards so none reaches your face or eyes. Do not cover the treated area with a dressing or wrap. Do not shower or bathe straight after putting it on" checked={c.handsDressingShowerAdvice} onChange={(v) => set({ handsDressingShowerAdvice: v })} />
              <Checkbox label="Keep using your emollients. They are the foundation and you should not stop them" checked={c.emollientAdvice} onChange={(v) => set({ emollientAdvice: v })} />
              <Checkbox label={`FIRE RISK from emollients and paraffin-based ointments (including paraffin-free products): they soak into clothing, bedding and dressings and make them catch fire more easily. Do not smoke, use a naked flame or go near anything burning; wash clothing and bedding often, knowing washing may not remove the residue completely${c.formulation === "foam" ? ". Enstilar foam is an extremely flammable aerosol: keep away from flames, sparks and heat, do not pierce or burn the can" : ""}`} checked={c.fireRiskAdvice} onChange={(v) => set({ fireRiskAdvice: v })} />
              <Checkbox label="Avoid a lot of sun or sunbeds while using this" checked={c.sunAdvice} onChange={(v) => set({ sunAdvice: v })} />
              <Checkbox label="THIS IS A 4 WEEK COURSE. Do not keep using it beyond that without seeing your GP" checked={c.fourWeekAdvice} onChange={(v) => set({ fourWeekAdvice: v })} />
              <Checkbox label="REBOUND advice given in terms: when you finish, keep using emollients and see your GP as arranged; do not just stop everything. Get medical advice THE SAME DAY if the skin becomes widely red and sore, starts shedding or peeling all over, or you develop crops of small pus-filled spots. Do not restart the cream yourself to control that; come back or see the GP" checked={c.reboundAdvice} onChange={(v) => set({ reboundAdvice: v })} />
              <Checkbox label="Seek advice for blurred vision or other eye symptoms, and for increased thirst, passing urine often, constipation, muscle weakness or confusion (hypercalcaemia)" checked={c.symptomsAdvice} onChange={(v) => set({ symptomsAdvice: v })} />
              <Checkbox label="Review at 4 weeks as arranged; seek advice sooner if worsening, skin thinning or irritation" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-navy-900">Record ({PSORIASIS_PGD_VERSION})</p>
              <p>Form: stable plaque psoriasis; erythrodermic, pustular, exfoliative and guttate {c.emergencyFormsExcluded ? "considered and excluded" : "NOT confirmed as excluded"}. Body surface {c.extentPercent || "?"}% ({c.extentEstimatedHow || "method not recorded"}). Sites: {c.sites || "not recorded"}; face, genitals and flexures {c.faceGenitalFlexural ? "INVOLVED" : "not involved"}.</p>
              <p>{hasStops ? "NOT SUPPLIED: exclusion criteria met; patient referred." : `Supplied: calcipotriol 50 micrograms/g with betamethasone 0.5 mg/g ${c.formulation || ""} (${c.brand || "brand not recorded"}), licensed for the site treated: ${c.licensedForSite ? "yes" : "no"}. Quantity ${c.quantity || "not recorded"}. Batch ${c.batchNumber || "not recorded"}, expiry ${c.expiryDate || "not recorded"}. Date ${summary.consultationDate}.`}</p>
              <p>Course: {c.courseType === "repeat" ? `repeat; GP review agreeing continuation on ${c.gpReviewDate || "date not recorded"}` : c.courseType === "first" ? "first course" : "not recorded"}. Courses in the last 12 months: {c.coursesLast12Months || "not recorded"}. Rebound advice given in terms: {c.reboundAdvice ? "yes" : "no"}.</p>
            </div>
            <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          <ProgressBar stepLabels={STEP_LABELS} currentStep={step} onStepClick={(s) => { if (completed.has(s) || s <= step) setStep(s); }} completedSteps={completed} hasErrors={!!validationError} />
          <StepWrapper
            title={STEP_LABELS[step]}
            currentStep={step}
            totalSteps={STEP_LABELS.length}
            onNext={next}
            onPrev={prev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops && step === 3}
            {...(step === STEP_LABELS.length - 1 ? { getConsultationData, onNewConsultation: () => { setStep(0); setCompleted(new Set()); setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent }); setSummary(initialSummary()); setC(blank); } } : {})}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

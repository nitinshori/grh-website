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
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { PsoriasisSummaryReport } from "./components/PsoriasisSummaryReport";

/**
 * Plaque Psoriasis ePGD, aligned to the Plaque Psoriasis PGD version 006,
 * issued 11 September 2026: calcipotriol 50 micrograms/g with betamethasone
 * (as dipropionate) 0.5 mg/g, as ointment, gel, cream or cutaneous foam,
 * once daily for up to 4 weeks, in adults aged 18 and over with STABLE plaque
 * psoriasis of the trunk, limbs or scalp. Maximum 15g in any one day, maximum
 * 10% of body surface (decision 32, 11 September 2026; the 30% calcipotriol licence limit is not the PGD ceiling), up to 100g per week. One 4 week course; a further
 * course only after GP review; maximum three courses in any 12 months.
 * Erythrodermic, pustular, exfoliative and guttate psoriasis are excluded.
 */
export const PSORIASIS_PGD_VERSION = "Plaque Psoriasis PGD, version 006, issued 11 September 2026";

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

export type Formulation = "" | "ointment" | "gel" | "foam" | "cream";

export const FORMULATION_LABEL: Record<Exclude<Formulation, "">, string> = {
  ointment: "Ointment (Dovobet ointment or generic): body and limb plaques",
  gel: "Gel (Dovobet gel or generic): licensed for scalp as well as body",
  foam: "Cutaneous foam (Enstilar): body and scalp; extremely flammable aerosol",
  cream: "Cream (Wynzora)",
};

/** Document quantity ceiling: up to 100g per week for the 4 week course. */
export const MAX_COURSE_GRAMS = 400;

/** Grams a 4 week once-daily course could plausibly use for the recorded
 *  area: one fingertip unit (about 0.5g) covers about 2% of body surface,
 *  so extent% x 0.25g per day, x 28 days, with a 50% allowance for tube
 *  sizes and a 60g floor (the smallest common pack). */
export function expectedCourseGrams(extentPercent: number): number {
  if (isNaN(extentPercent) || extentPercent <= 0) return 60;
  return Math.max(60, Math.ceil(extentPercent * 0.25 * 28 * 1.5));
}

export interface Clinical {
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
  /** Repeat course: when the last course ended, so "reviewed since" can be checked. */
  lastCourseEndDate: string;
  gpReviewDate: string;
  coursesLast12Months: "" | "0" | "1" | "2" | "3-or-more";
  allergies: string;
  product: "calcipotriol-betamethasone" | "";
  formulation: Formulation;
  brand: string;
  licensedForSite: boolean;
  /** Quantity supplied in grams (document: up to 100g per week, enough for 4 weeks and no more). */
  quantityGrams: string;
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
  disposalAdvice: boolean;
  writtenAdviceGiven: boolean;
  /** Advice given where the patient is excluded or declines (document record item). */
  exclusionAdvice: string;
  /** Details of any adverse drug reactions and the actions taken (Yellow Card). */
  adverseReactions: string;
}

const blankClinical = (): Clinical => ({
  confirmedPlaque: false, emergencyFormsExcluded: false,
  erythrodermic: false, pustular: false, exfoliative: false, guttate: false, unstable: false,
  extentPercent: "", extentEstimatedHow: "", sites: "", scalpInvolved: false, faceGenitalFlexural: false,
  extensiveNeedsSystemic: false, over15gPerDay: false, otherSkinConditions: false, atrophicSkin: false,
  ulcersOrWounds: false, secondaryInfection: false, otherTopicalSteroidSameArea: false,
  phototherapyOrImmunosuppressed: false, pregnantOrBreastfeeding: false, componentAllergy: false,
  calciumDisorder: false, severeRenalOrHepatic: false, diabetes: false, visualDisturbance: false,
  courseType: "", lastCourseEndDate: "", gpReviewDate: "", coursesLast12Months: "", allergies: "",
  product: "", formulation: "", brand: "", licensedForSite: false, quantityGrams: "", batchNumber: "", expiryDate: "",
  applicationAdvice: false, maxDoseAdvice: false, handsDressingShowerAdvice: false, emollientAdvice: false,
  fireRiskAdvice: false, sunAdvice: false, fourWeekAdvice: false, reboundAdvice: false, symptomsAdvice: false,
  reviewAdvice: false, disposalAdvice: false, writtenAdviceGiven: false,
  exclusionAdvice: "", adverseReactions: "",
});

const todayIso = () => new Date().toISOString().split("T")[0];

export default function PsoriasisClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>(blankClinical);
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    setSummary((p) => ({ ...p, pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress }));
  }, [__pharmProfile, summary.pharmacistName, summary.pharmacistGPhC]);

  const extent = parseFloat(c.extentPercent);
  const quantityGrams = parseFloat(c.quantityGrams);

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
    if (!isNaN(extent) && extent > 10)
      a.push({ code: "extent", severity: "stop", message: "More than 10% of body surface affected: refer", detail: "The PGD ceiling is 10% of body surface, NICE's threshold for extensive psoriasis, where topical treatment alone is unlikely to give satisfactory control and specialist referral should be considered. Do not supply and advise partial use; refer to the GP." });
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
    if (c.courseType === "repeat" && c.gpReviewDate && c.lastCourseEndDate && c.gpReviewDate < c.lastCourseEndDate)
      a.push({ code: "review-before-course", severity: "stop", message: "The GP review is dated before the last course ended: it is not a review SINCE the last course", detail: "The document requires that the GP has reviewed the patient since the last course. A review that predates the end of that course does not meet the criterion. Refer." });
    if (c.courseType === "first" && (c.coursesLast12Months === "1" || c.coursesLast12Months === "2"))
      a.push({ code: "first-with-courses", severity: "caution", message: "Recorded as a first course, but courses under this PGD in the last 12 months are also recorded", detail: "A course after an earlier course under this PGD is a repeat and needs a GP review since the last course. Check which it is." });
    if (c.coursesLast12Months === "3-or-more")
      a.push({ code: "three-courses", severity: "stop", message: "Three 4 week courses already in the last 12 months: refer", detail: "Maximum three 4 week courses in any 12 months under this PGD, whatever the GP has said. Beyond that, refer." });
    if (c.visualDisturbance)
      a.push({ code: "visual", severity: "stop", message: "Blurred vision or other visual disturbance: refer to an ophthalmologist", detail: "Reported with topical as well as systemic corticosteroids; possible causes include cataract, glaucoma and central serous chorioretinopathy. Refer for evaluation rather than supplying a potent steroid." });
    if (c.diabetes)
      a.push({ code: "diabetes", severity: "caution", message: "Diabetes: systemic absorption of a potent corticosteroid can affect glycaemic control", detail: "Advise closer monitoring during the course." });
    if (c.scalpInvolved && (c.formulation === "ointment" || c.formulation === "cream"))
      a.push({ code: "scalp-formulation", severity: "stop", message: "Scalp treated: this formulation is not one the document lists as licensed for the scalp", detail: "The document lists the gel and the cutaneous foam as licensed for the scalp; the ointment is for body and limb plaques, and the Dovobet ointment SPC states there is limited experience of its use on the scalp. Select the gel or the foam for a patient with scalp involvement, or refer." });
    if (!isNaN(quantityGrams) && quantityGrams > 0 && !isNaN(extent) && extent > 0 && quantityGrams > expectedCourseGrams(extent))
      a.push({ code: "quantity-vs-area", severity: "caution", message: `Quantity ${quantityGrams}g is more than a 4 week course could use on ${extent}% of body surface`, detail: `At about one fingertip unit (0.5g) per 2% of body surface once daily, ${extent}% uses about ${Math.ceil(extent * 0.25 * 28)}g in 28 days. The document says supply enough for the 4 week course and no more. Reduce the quantity or record why more is needed.` });
    return a;
  }, [patient.age, c, extent, quantityGrams]);
  const hasStops = alerts.some((x) => x.severity === "stop");

  const validateAssessment = (): string | null => {
    if (patient.age === null) return "The patient's age is not known: enter the date of birth on the Patient Details step";
    if (!c.confirmedPlaque) return "Please confirm the diagnosis of stable plaque psoriasis, mild to moderate, amenable to topical therapy";
    if (!c.emergencyFormsExcluded) return "Confirm that erythrodermic, pustular, exfoliative and guttate presentations were considered and excluded (Appendix 1)";
    if (!c.sites.trim()) return "Please record the sites treated (trunk, limbs or scalp)";
    if (!c.extentPercent.trim() || isNaN(extent) || extent <= 0) return "Record the body surface area affected as a percentage (the patient's palm is roughly 1%)";
    if (!c.extentEstimatedHow.trim()) return "Record how the body surface area was estimated";
    if (!c.courseType) return "Record whether this is a first course or a repeat";
    if (c.courseType === "repeat" && !c.lastCourseEndDate) return "Repeat course: record when the last course ended";
    if (c.courseType === "repeat" && c.lastCourseEndDate > todayIso()) return "The last course end date is in the future";
    if (c.courseType === "repeat" && !c.gpReviewDate) return "Repeat course: record the date of the GP review that agreed continuation";
    if (c.courseType === "repeat" && c.gpReviewDate > todayIso()) return "The GP review date is in the future";
    if (!c.coursesLast12Months) return "Record the number of courses in the last 12 months";
    if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
    return null;
  };
  const validateTreatment = (): string | null => {
    if (!c.product) return "Please confirm the product";
    if (!c.formulation) return "Please select the formulation";
    if (!c.brand.trim()) return "Record the brand or generic product supplied";
    if (!c.licensedForSite) return "Confirm the formulation is licensed for the site being treated";
    if (!c.quantityGrams.trim() || isNaN(quantityGrams) || quantityGrams <= 0) return "Record the quantity supplied in grams";
    if (quantityGrams > MAX_COURSE_GRAMS) return `The document allows up to 100g per week for the 4 week course: ${MAX_COURSE_GRAMS}g maximum`;
    if (!c.batchNumber.trim()) return "Please record the batch number";
    if (!c.expiryDate.trim()) return "Please record the expiry date";
    return null;
  };
  const validateCounselling = (): string | null => {
    if (!c.applicationAdvice || !c.maxDoseAdvice || !c.handsDressingShowerAdvice || !c.emollientAdvice || !c.fireRiskAdvice || !c.sunAdvice || !c.fourWeekAdvice || !c.reboundAdvice || !c.symptomsAdvice || !c.reviewAdvice)
      return "Please confirm all counselling points, including the rebound advice in terms";
    if (!c.disposalAdvice) return "Confirm the disposal advice (return any unused product to a pharmacy)";
    if (!c.writtenAdviceGiven) return "Confirm the patient information leaflet and the written advice sheet were supplied";
    return validateSummaryStep(summary);
  };

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 18 });
      case 1: return validateConsentStep(consent);
      case 2: return validateAssessment();
      case 3: return validateTreatment();
      // Last step: every validator runs again before Save & Print, so an
      // answer changed on an earlier step cannot be printed unchecked.
      case 4:
        return (
          validatePatientStep(patient, { minAge: 18 }) ||
          validateConsentStep(consent) ||
          validateAssessment() ||
          validateTreatment() ||
          validateCounselling()
        );
      default: return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, patient, consent, c, summary, extent, quantityGrams]);

  // A stop anywhere disables Next on every step and offers "Save as not
  // supplied" wherever it is shown.
  const isBlocked = hasStops && step >= 2;
  const canProceed = !validationError && !isBlocked;
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: { patient, consent, clinical: c, alerts, pgdVersion: PSORIASIS_PGD_VERSION } as unknown as Record<string, unknown>,
    outcome: hasStops ? "referred" : "completed",
    medicine:
      !hasStops && c.product
        ? {
            name: `Calcipotriol 50 micrograms/g with betamethasone (as dipropionate) 0.5 mg/g ${c.formulation}${c.brand ? ` (${c.brand})` : ""}`.trim(),
            dose: "Apply once daily to affected areas; maximum 15g in any one day; not more than 10% of body surface (the PGD ceiling)",
            duration: "4 weeks",
            quantity: c.quantityGrams ? `${c.quantityGrams}g` : undefined,
          }
        : undefined,
    summary: {
      pharmacistName: summary.pharmacistName || __pharmProfile?.name || "",
      pharmacistGPhC: summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
      pharmacyName: summary.pharmacyName || __pharmProfile?.pharmacyName,
      pharmacyAddress: summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
      consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
      clinicalNotes: summary.clinicalNotes,
    },
    consent: { notifyGp: !!consent.notifyGp },
  });

  const exclusionBox = hasStops ? (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
      <p className="text-sm font-medium text-navy-900">Excluded: record the advice given and the decision reached, then use Save as not supplied</p>
      <p className="text-xs text-gray-700">Where the presentation is erythrodermic, pustular or exfoliative, make the urgency explicit: same-day emergency assessment. Otherwise refer to the GP and say why a potent steroid is not the right treatment here.</p>
      <TextArea label="Advice given and decision reached" value={c.exclusionAdvice} onChange={(v) => set({ exclusionAdvice: v })} rows={3} placeholder="e.g. same-day referral to A&E for erythrodermic psoriasis; emollient advice given" />
    </div>
  ) : null;

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
            {exclusionBox}
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
            <p className="text-xs text-gray-600">The patient's whole palm including the fingers is roughly 1% of body surface. 10% is roughly ten palms, about one arm's worth of skin; above that, refer. Record the estimate as a percentage.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectInput label="Course" value={c.courseType} onChange={(v) => set({ courseType: v as Clinical["courseType"] })}
                options={[
                  { value: "first", label: "First 4 week course under this PGD" },
                  { value: "repeat", label: "Repeat course (GP has reviewed since the last course and agreed continuation)" },
                ]} required />
              {c.courseType === "repeat" && (
                <>
                  <TextInput label="Date the last course ended" type="date" value={c.lastCourseEndDate} onChange={(v) => set({ lastCourseEndDate: v })} required />
                  <TextInput label="Date of the GP review that agreed continuation (must be after the last course ended)" type="date" value={c.gpReviewDate} onChange={(v) => set({ gpReviewDate: v })} required />
                </>
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
            {exclusionBox}
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
              Apply once daily to affected areas. MAXIMUM 15g IN ANY ONE DAY. Body surface treated must not exceed 10% (the PGD ceiling; the calcipotriol licence limit is 30%). Up to 100g per week, within the 15g daily maximum and appropriate to the area treated: supply enough for the 4 WEEK course and no more. Then stop and review. Continuing or restarting beyond 4 weeks requires GP review; maximum three courses in any 12 months.
            </div>
            <TextInput label={`Quantity supplied in grams (maximum ${MAX_COURSE_GRAMS}g: 100g per week for 4 weeks; enough for the course and no more)`} type="number" value={c.quantityGrams} onChange={(v) => set({ quantityGrams: v })} placeholder="e.g. 60" required />
            {!isNaN(extent) && extent > 0 && (
              <p className="text-xs text-gray-600">Guide for {extent}% of body surface once daily for 28 days: about {Math.ceil(extent * 0.25 * 28)}g (one fingertip unit, 0.5g, covers about 2%). The tool warns above {expectedCourseGrams(extent)}g and refuses above {MAX_COURSE_GRAMS}g.</p>
            )}
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
            {exclusionBox}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-navy-900">Confirm counselling covered:</p>
              <Checkbox label="Once a day, to the patchy areas only. Not on your face, genitals or in skin folds" checked={c.applicationAdvice} onChange={(v) => set({ applicationAdvice: v })} />
              <Checkbox label="No more than one 15g tube-worth in a day, and not on more than about one tenth of your body (about ten palms). Your palm is roughly 1% of your skin" checked={c.maxDoseAdvice} onChange={(v) => set({ maxDoseAdvice: v })} />
              <Checkbox label="Wash your hands thoroughly afterwards so none reaches your face or eyes. Do not cover the treated area with a dressing or wrap. Do not shower or bathe straight after putting it on" checked={c.handsDressingShowerAdvice} onChange={(v) => set({ handsDressingShowerAdvice: v })} />
              <Checkbox label="Keep using your emollients. They are the foundation and you should not stop them" checked={c.emollientAdvice} onChange={(v) => set({ emollientAdvice: v })} />
              <Checkbox label={`FIRE RISK from emollients and paraffin-based ointments (including paraffin-free products): they soak into clothing, bedding and dressings and make them catch fire more easily. Do not smoke, use a naked flame or go near anything burning; wash clothing and bedding often, knowing washing may not remove the residue completely${c.formulation === "foam" ? ". Enstilar foam is an extremely flammable aerosol: keep away from flames, sparks and heat, do not pierce or burn the can" : ""}`} checked={c.fireRiskAdvice} onChange={(v) => set({ fireRiskAdvice: v })} />
              <Checkbox label="Avoid a lot of sun or sunbeds while using this" checked={c.sunAdvice} onChange={(v) => set({ sunAdvice: v })} />
              <Checkbox label="THIS IS A 4 WEEK COURSE. Do not keep using it beyond that without seeing your GP" checked={c.fourWeekAdvice} onChange={(v) => set({ fourWeekAdvice: v })} />
              <Checkbox label="REBOUND advice given in terms: when you finish, keep using emollients and see your GP as arranged; do not just stop everything. Get medical advice THE SAME DAY if the skin becomes widely red and sore, starts shedding or peeling all over, or you develop crops of small pus-filled spots. Do not restart the cream yourself to control that; come back or see the GP" checked={c.reboundAdvice} onChange={(v) => set({ reboundAdvice: v })} />
              <Checkbox label="Seek advice for blurred vision or other eye symptoms, and for increased thirst, passing urine often, constipation, muscle weakness or confusion (hypercalcaemia)" checked={c.symptomsAdvice} onChange={(v) => set({ symptomsAdvice: v })} />
              <Checkbox label="Review at 4 weeks as arranged; seek advice sooner if worsening, skin thinning or irritation" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
              <Checkbox label="Return any unused product to a pharmacy (disposal)" checked={c.disposalAdvice} onChange={(v) => set({ disposalAdvice: v })} />
              <Checkbox label="Patient information leaflet for the formulation supplied, together with WRITTEN advice on how much to use, the 4 week limit, and what to do when the course finishes" checked={c.writtenAdviceGiven} onChange={(v) => set({ writtenAdviceGiven: v })} />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-1">
              <p className="font-semibold text-navy-900">Record ({PSORIASIS_PGD_VERSION})</p>
              <p>Form: stable plaque psoriasis; erythrodermic, pustular, exfoliative and guttate {c.emergencyFormsExcluded ? "considered and excluded" : "NOT confirmed as excluded"}. Body surface {c.extentPercent || "?"}% ({c.extentEstimatedHow || "method not recorded"}). Sites: {c.sites || "not recorded"}; face, genitals and flexures {c.faceGenitalFlexural ? "INVOLVED" : "not involved"}.</p>
              <p>{hasStops ? "NOT SUPPLIED: exclusion criteria met; patient referred." : `Supplied: calcipotriol 50 micrograms/g with betamethasone 0.5 mg/g ${c.formulation || ""} (${c.brand || "brand not recorded"}), licensed for the site treated: ${c.licensedForSite ? "yes" : "no"}. Quantity ${c.quantityGrams ? `${c.quantityGrams}g` : "not recorded"}. Batch ${c.batchNumber || "not recorded"}, expiry ${c.expiryDate || "not recorded"}. Date ${summary.consultationDate}.`}</p>
              <p>Course: {c.courseType === "repeat" ? `repeat; last course ended ${c.lastCourseEndDate || "date not recorded"}; GP review agreeing continuation on ${c.gpReviewDate || "date not recorded"}` : c.courseType === "first" ? "first course" : "not recorded"}. Courses in the last 12 months: {c.coursesLast12Months || "not recorded"}. Rebound advice given in terms: {c.reboundAdvice ? "yes" : "no"}.</p>
            </div>
            <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
            <TextInput label="Pharmacy name" value={summary.pharmacyName} onChange={(v) => setSummary((p) => ({ ...p, pharmacyName: v }))} />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
            <TextArea label="Adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk, and inform the GP)" value={c.adverseReactions} onChange={(v) => set({ adverseReactions: v })} placeholder="None known at the time of supply" />
          </div>
        );
      default: return null;
    }
  };

  const newConsultation = () => {
    setStep(0);
    setCompleted(new Set());
    setPatient({ ...initialPatientDetails });
    setConsent({ ...initialConsent });
    setSummary(initialSummary());
    setC(blankClinical());
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8 print:hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          <ProgressBar
            stepLabels={STEP_LABELS}
            currentStep={step}
            onStepClick={(s) => {
              // Backwards only; every later step is forgotten so an edited
              // answer has to pass Next (and its validator) again.
              if (s <= step) {
                setCompleted((p) => new Set([...p].filter((x) => x < s)));
                setStep(s);
              }
            }}
            completedSteps={completed}
            hasErrors={!!validationError}
          />
          <StepWrapper
            title={STEP_LABELS[step]}
            currentStep={step}
            totalSteps={STEP_LABELS.length}
            onNext={next}
            onPrev={prev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={isBlocked}
            getConsultationData={getConsultationData}
            onNewConsultation={newConsultation}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
    <div className="hidden print:block">
      <PsoriasisSummaryReport patient={patient} consent={consent} clinical={c} summary={summary} alerts={alerts} />
    </div>
    </>
  );
}

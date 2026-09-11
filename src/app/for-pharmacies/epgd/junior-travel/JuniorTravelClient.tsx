"use client";

import { useState, useMemo, useEffect } from "react";
import type { ClinicalAlert } from "../shared/types";
import {
  calculateAge,
  initialPatientDetails,
  initialConsent,
  initialSummary,
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
  type BasePatientDetails,
  type BaseConsent,
  type BaseSummary,
} from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import JuniorTravelSummaryReport from "./components/JuniorTravelSummaryReport";
import { PGD_VERSION, type Clinical, type DoseEntry, type ConsentBasis, type ExclusionReferral } from "./junior-travel-types";

/**
 * Junior Travel Vaccines ePGD, PGD version 007, issued 11 September 2026.
 * Children and young people aged 12 months to 17 years inclusive. Each
 * vaccine carries its own licensed minimum age and dose, which the tool
 * enforces against the child's age (the HIGHER of 12 months and the
 * vaccine-specific minimum applies): a vaccine selected below its minimum age
 * becomes a hard stop, and the dose shown is the age-correct one (Ixiaro
 * splits at 3 years).
 *
 * Fix round, 11 September 2026 (adversarial review findings_2):
 * - stops are enforced on every step, and any stop can be saved as
 *   "not supplied" with the advice given and the referral recorded;
 * - a person with parental responsibility must be present for every
 *   under-16 (the document's inclusion criterion is unconditional; Gillick
 *   competence is a consent basis, not a substitute for presence);
 * - each selected vaccine records its dose number, the date of the previous
 *   dose, batch, expiry and site; intervals below the schedule minimum stop;
 * - the departure date is a real date and course timing is checked;
 * - the final step renders a printable summary record.
 */

const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Travel Risk Assessment",
  "Vaccine Selection",
  "Eligibility",
  "Administration",
  "Counselling & Summary",
] as const;

/** Age from which a Gillick competence assessment is offered as a consent
 *  basis. The document sets no age; below this the parental route is the only
 *  one offered. Policy choice, flagged in the fix report. */
const GILLICK_MIN_AGE = 12;

export interface DoseOption {
  value: string;
  label: string;
}

export interface VaccineDef {
  id: string;
  name: string;
  minAgeMonths: number;
  maxAgeYears: number;
  dose: (ageMonths: number) => string;
  schedule: string;
  route: "Intramuscular" | "Oral";
  /** Dose numbers the document's schedule authorises for this product. */
  doseOptions: (ageMonths: number | null) => DoseOption[];
  /** Minimum days since the previous dose for the given dose number, or null when
   *  no previous dose applies (first dose). */
  minIntervalDays: (doseValue: string) => number | null;
  /** Maximum days since the previous dose before the course must be restarted
   *  (caution only), or null when none applies. */
  maxIntervalDays: (doseValue: string) => number | null;
  /** Next dose: days from today and the wording for the record, or null when
   *  the course is complete after this dose. */
  nextDose: (doseValue: string) => { days: number; label: string } | null;
  /** Days before departure needed for this vaccine to give protection
   *  (caution below this). */
  leadTimeDays: (ageMonths: number | null) => number;
}

const MONTH = 30;
const YEAR = 365;

const primaryAndBooster = (boosterLabel: string): DoseOption[] => [
  { value: "1", label: "Single dose" },
  { value: "booster", label: boosterLabel },
];

export const VACCINES: VaccineDef[] = [
  {
    id: "hep-a",
    name: "Hepatitis A paediatric (Havrix Junior Monodose or Avaxim Junior)",
    minAgeMonths: 12,
    maxAgeYears: 15,
    dose: () => "0.5 ml intramuscular",
    schedule: "Single dose protects from about 2 weeks. Second dose at 6 to 12 months (Havrix Junior) or 6 to 36 months (Avaxim Junior) for long-term protection.",
    route: "Intramuscular",
    doseOptions: () => [
      { value: "1", label: "Dose 1 (primary)" },
      { value: "2", label: "Dose 2 (6 to 12 months after dose 1; up to 36 months for Avaxim Junior)" },
    ],
    minIntervalDays: (d) => (d === "2" ? 6 * MONTH : null),
    maxIntervalDays: () => null,
    nextDose: (d) => (d === "1" ? { days: 6 * MONTH, label: "Dose 2 due 6 to 12 months after dose 1 (Havrix Junior) or 6 to 36 months (Avaxim Junior)" } : null),
    leadTimeDays: () => 14,
  },
  {
    id: "twinrix-paed",
    name: "Hepatitis A and B combined, Twinrix Paediatric",
    minAgeMonths: 12,
    maxAgeYears: 15,
    dose: () => "0.5 ml intramuscular",
    schedule: "Three doses at 0, 1 and 6 months.",
    route: "Intramuscular",
    doseOptions: () => [
      { value: "1", label: "Dose 1 (day 0)" },
      { value: "2", label: "Dose 2 (1 month after dose 1)" },
      { value: "3", label: "Dose 3 (6 months after dose 1)" },
    ],
    minIntervalDays: (d) => (d === "2" ? 28 : d === "3" ? 5 * MONTH : null),
    maxIntervalDays: () => null,
    nextDose: (d) =>
      d === "1" ? { days: 28, label: "Dose 2 due 1 month after dose 1" }
      : d === "2" ? { days: 5 * MONTH, label: "Dose 3 due 6 months after dose 1 (5 months after dose 2)" }
      : null,
    leadTimeDays: () => 14,
  },
  {
    id: "ambirix",
    name: "Hepatitis A and B combined, Ambirix",
    minAgeMonths: 12,
    maxAgeYears: 15,
    dose: () => "1.0 ml intramuscular",
    schedule: "Two doses, the second 6 to 12 months after the first. Only where the risk of hepatitis B during the course is low.",
    route: "Intramuscular",
    doseOptions: () => [
      { value: "1", label: "Dose 1" },
      { value: "2", label: "Dose 2 (6 to 12 months after dose 1)" },
    ],
    minIntervalDays: (d) => (d === "2" ? 6 * MONTH : null),
    maxIntervalDays: () => null,
    nextDose: (d) => (d === "1" ? { days: 6 * MONTH, label: "Dose 2 due 6 to 12 months after dose 1" } : null),
    leadTimeDays: () => 14,
  },
  {
    id: "hep-b",
    name: "Hepatitis B paediatric (Engerix B Paediatric or HBvaxPRO Paediatric)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: () => "0.5 ml intramuscular",
    schedule: "Three doses at 0, 1 and 6 months, or an accelerated schedule (0, 1, 2 and 12 months) per the SPC and Green Book chapter 18.",
    route: "Intramuscular",
    doseOptions: () => [
      { value: "1", label: "Dose 1 (day 0)" },
      { value: "2", label: "Dose 2 (1 month after dose 1)" },
      { value: "3", label: "Dose 3 (6 months after dose 1, or 2 months on the accelerated schedule)" },
      { value: "4", label: "Dose 4 (12 months, accelerated schedule only)" },
    ],
    minIntervalDays: (d) => (d === "2" ? 28 : d === "3" ? 28 : d === "4" ? 10 * MONTH : null),
    maxIntervalDays: () => null,
    nextDose: (d) =>
      d === "1" ? { days: 28, label: "Dose 2 due 1 month after dose 1" }
      : d === "2" ? { days: 28, label: "Dose 3 due 6 months after dose 1 (standard) or 1 month after dose 2 (accelerated)" }
      : d === "3" ? { days: 10 * MONTH, label: "Dose 4 at 12 months if the accelerated schedule was used; otherwise the course is complete" }
      : null,
    leadTimeDays: () => 14,
  },
  {
    id: "typhoid",
    name: "Typhoid Vi polysaccharide (Typhim Vi or Typherix)",
    minAgeMonths: 24,
    maxAgeYears: 17,
    dose: () => "0.5 ml intramuscular",
    schedule: "Single dose at least 2 weeks before travel. Booster every 3 years where exposure continues.",
    route: "Intramuscular",
    doseOptions: () => primaryAndBooster("Booster (3 years after the last dose)"),
    minIntervalDays: (d) => (d === "booster" ? 3 * YEAR : null),
    maxIntervalDays: () => null,
    nextDose: () => ({ days: 3 * YEAR, label: "Booster due in 3 years where exposure continues" }),
    leadTimeDays: () => 14,
  },
  {
    id: "menacwy",
    name: "Meningococcal ACWY (Nimenrix or MenQuadfi)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: () => "0.5 ml intramuscular",
    schedule: "Single dose at least 2 weeks before travel. Booster after 5 years where risk continues. Required for Hajj and Umrah.",
    route: "Intramuscular",
    doseOptions: () => primaryAndBooster("Booster (5 years after the last dose)"),
    minIntervalDays: (d) => (d === "booster" ? 5 * YEAR : null),
    maxIntervalDays: () => null,
    nextDose: () => ({ days: 5 * YEAR, label: "Booster due after 5 years where risk continues" }),
    leadTimeDays: () => 14,
  },
  {
    id: "rabies",
    name: "Rabies pre-exposure (Rabipur or Verorab)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: () => "1.0 ml (Rabipur) or 0.5 ml (Verorab) intramuscular",
    schedule: "Three doses at days 0, 7 and 21 to 28. Pre-exposure only. Any actual or suspected exposure needs urgent medical assessment.",
    route: "Intramuscular",
    doseOptions: () => [
      { value: "1", label: "Dose 1 (day 0)" },
      { value: "2", label: "Dose 2 (day 7)" },
      { value: "3", label: "Dose 3 (day 21 to 28)" },
    ],
    minIntervalDays: (d) => (d === "2" ? 7 : d === "3" ? 14 : null),
    maxIntervalDays: () => null,
    nextDose: (d) =>
      d === "1" ? { days: 7, label: "Dose 2 due on day 7" }
      : d === "2" ? { days: 14, label: "Dose 3 due on day 21 to 28 (14 to 21 days after dose 2)" }
      : null,
    leadTimeDays: () => 21,
  },
  {
    id: "je",
    name: "Japanese encephalitis (Ixiaro)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: (m) => (m < 36 ? "0.25 ml intramuscular (under 3 years)" : "0.5 ml intramuscular (3 years and over)"),
    schedule: "Two doses 28 days apart. The accelerated schedule is licensed for 18 years and over only.",
    route: "Intramuscular",
    doseOptions: () => [
      { value: "1", label: "Dose 1 (day 0)" },
      { value: "2", label: "Dose 2 (day 28)" },
    ],
    minIntervalDays: (d) => (d === "2" ? 28 : null),
    maxIntervalDays: () => null,
    nextDose: (d) => (d === "1" ? { days: 28, label: "Dose 2 due 28 days after dose 1; complete at least a week before travel" } : null),
    leadTimeDays: () => 35,
  },
  {
    id: "cholera",
    name: "Cholera oral (Dukoral)",
    minAgeMonths: 24,
    maxAgeYears: 17,
    dose: () => "Oral suspension in the supplied buffer, with no food or drink for one hour before and after administration",
    schedule: "Age 2 to under 6 years: three doses at least one week apart. Age 6 years and over: two doses at least one week apart. Complete at least one week before travel. Separate from oral typhoid vaccine and from antimalarials in accordance with the SPC.",
    route: "Oral",
    doseOptions: (m) => {
      const three = m !== null && m < 72;
      const opts: DoseOption[] = [
        { value: "1", label: "Dose 1" },
        { value: "2", label: three ? "Dose 2 (at least one week after dose 1)" : "Dose 2 of 2 (at least one week after dose 1)" },
      ];
      if (three) opts.push({ value: "3", label: "Dose 3 of 3 (at least one week after dose 2)" });
      return opts;
    },
    minIntervalDays: (d) => (d === "2" || d === "3" ? 7 : null),
    maxIntervalDays: (d) => (d === "2" || d === "3" ? 42 : null),
    nextDose: (d) => (d === "1" || d === "2" ? { days: 7, label: "Next dose due at least one week after this one (and within 6 weeks); complete at least one week before travel" } : null),
    leadTimeDays: (m) => (m !== null && m < 72 ? 21 : 14),
  },
];

const emptyDose: DoseEntry = { doseNumber: "", previousDoseDate: "", batchNumber: "", expiryDate: "", site: "" };

const emptyClinical = (): Clinical => ({
  destination: "", departureDate: "", itinerary: "", recommendedForDestination: false,
  routineUpToDate: false, catchUpPlanDiscussed: false, selected: [], doses: {}, twinrixCoAdminReason: "",
  anaphylaxisComponent: false, acuteFebrileIllness: false, immunosuppressed: false,
  pregnant: false, bleedingDisorder: false, postExposure: false, clinicalUncertainty: false,
  chronicConditionOrRemote: false, parentPresent: false, parentPresentDetail: "", consentBasis: "", consentDetail: "",
  allergies: "", anaphylaxisKit: false, observationCompleted: false,
  scheduleAdvice: false, sideEffectAdvice: false, bitesAndFoodAdvice: false, rabiesAdvice: false,
  adverseReaction: false, adverseReactionDetails: "", gpInformed: false,
  exclusionAdvice: "", exclusionReferral: "",
});

// ─── Date helpers (calendar days, local midnight to local midnight) ───

function localMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((localMidnight(to).getTime() - localMidnight(from).getTime()) / 86400000);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = localMidnight(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Expiry entered as YYYY-MM-DD (date input). Expired when before today. */
function isExpired(expiry: string): boolean {
  const d = parseLocalDate(expiry);
  if (!d) return false;
  return daysBetween(new Date(), d) < 0;
}

export interface PlannedDose {
  def: VaccineDef;
  entry: DoseEntry;
  doseText: string;
  nextDueDate: string | null;
  nextDueLabel: string | null;
}

export const SITE_OPTIONS = [
  { value: "Left deltoid", label: "Left deltoid" },
  { value: "Right deltoid", label: "Right deltoid" },
  { value: "Left anterolateral thigh", label: "Left anterolateral thigh" },
  { value: "Right anterolateral thigh", label: "Right anterolateral thigh" },
  { value: "Oral", label: "Oral (Dukoral)" },
];

export default function JuniorTravelClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>(emptyClinical());
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));
  const setDose = (id: string, patch: Partial<DoseEntry>) =>
    setC((prev) => ({ ...prev, doses: { ...prev.doses, [id]: { ...(prev.doses[id] ?? emptyDose), ...patch } } }));

  // Pharmacist name and GPhC number from the logged-in profile, so the record
  // does not depend on them being typed. Refires after a reset.
  const profile = usePharmacistProfile();
  useEffect(() => {
    if (!profile) return;
    if (summary.pharmacistName || summary.pharmacistGPhC) return;
    setSummary((prev) => ({
      ...prev,
      pharmacistName: profile.name,
      pharmacistGPhC: profile.gphcNumber,
      pharmacyName: profile.pharmacyName,
      pharmacyAddress: profile.pharmacyAddress,
    }));
  }, [profile, summary.pharmacistName, summary.pharmacistGPhC]);

  // Age in months, derived from date of birth so the vaccine minimum ages
  // can be enforced precisely for infants and toddlers.
  const ageMonths = useMemo(() => {
    if (!patient.dateOfBirth) return null;
    const dob = new Date(patient.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let m = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) m -= 1;
    return m;
  }, [patient.dateOfBirth]);

  const toggleVaccine = (id: string) =>
    setC((prev) => {
      const on = prev.selected.includes(id);
      const doses = { ...prev.doses };
      if (on) delete doses[id];
      else doses[id] = { ...emptyDose };
      return { ...prev, selected: on ? prev.selected.filter((x) => x !== id) : [...prev.selected, id], doses };
    });

  const selectedDefs = useMemo(() => VACCINES.filter((v) => c.selected.includes(v.id)), [c.selected]);

  const daysToDeparture = useMemo(() => {
    const d = parseLocalDate(c.departureDate);
    return d ? daysBetween(new Date(), d) : null;
  }, [c.departureDate]);

  /** Per-vaccine planned dose, with the next due date computed from the schedule. */
  const planned = useMemo<PlannedDose[]>(
    () =>
      selectedDefs.map((def) => {
        const entry = c.doses[def.id] ?? emptyDose;
        const nd = entry.doseNumber ? def.nextDose(entry.doseNumber) : null;
        return {
          def,
          entry,
          doseText: ageMonths !== null ? def.dose(ageMonths) : "",
          nextDueDate: nd ? formatLocalDate(addDays(new Date(), nd.days)) : null,
          nextDueLabel: nd ? nd.label : null,
        };
      }),
    [selectedDefs, c.doses, ageMonths]
  );

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    const age = patient.age;

    if (ageMonths !== null && ageMonths < 12)
      a.push({
        code: "under-12-months",
        severity: "stop",
        message: "Under 12 months is excluded from this PGD",
        detail: "Refer to the GP or a specialist travel health service.",
      });
    if (age !== null && age >= 18)
      a.push({
        code: "adult",
        severity: "stop",
        message: "18 years and over, use the adult travel health PGDs",
        detail: "This PGD covers 12 months to 17 years inclusive.",
      });

    // Per-vaccine age gating and dose interval checks
    for (const p of planned) {
      const v = p.def;
      if (ageMonths !== null && ageMonths < v.minAgeMonths) {
        const label = v.minAgeMonths >= 24 ? `${v.minAgeMonths / 12} years` : `${v.minAgeMonths} months`;
        a.push({
          code: `min-age-${v.id}`,
          severity: "stop",
          message: `${v.name} is licensed from ${label}`,
          detail: "The child is below the licensed minimum age for this vaccine. Deselect it and refer for that component if protection is needed.",
        });
      }
      if (age !== null && age > v.maxAgeYears) {
        a.push({
          code: `max-age-${v.id}`,
          severity: "stop",
          message: `${v.name} is a paediatric presentation, licensed to ${v.maxAgeYears} years`,
          detail: "Use the adult presentation under the adult travel PGD instead.",
        });
      }
      const minGap = p.entry.doseNumber ? v.minIntervalDays(p.entry.doseNumber) : null;
      const prevDate = parseLocalDate(p.entry.previousDoseDate);
      if (minGap !== null && prevDate) {
        const gap = daysBetween(prevDate, new Date());
        if (gap < 0)
          a.push({
            code: `future-prev-${v.id}`,
            severity: "stop",
            message: `${v.name}: the previous dose date is in the future`,
            detail: "Check the date of the previous dose.",
          });
        else if (gap < minGap)
          a.push({
            code: `interval-${v.id}`,
            severity: "stop",
            message: `${v.name}: only ${gap} days since the previous dose, the schedule minimum is ${minGap} days`,
            detail: "This dose is not due. Giving it early is outside the schedule in the PGD. Rebook for the due date.",
          });
        const maxGap = v.maxIntervalDays(p.entry.doseNumber);
        if (maxGap !== null && gap > maxGap)
          a.push({
            code: `restart-${v.id}`,
            severity: "caution",
            message: `${v.name}: ${gap} days since the previous dose exceeds ${maxGap} days`,
            detail: "The SPC requires the primary course to be restarted. Record this as dose 1 of a new course.",
          });
      }
      if (p.entry.expiryDate && isExpired(p.entry.expiryDate))
        a.push({
          code: `expired-${v.id}`,
          severity: "stop",
          message: `${v.name}: the batch entered has expired`,
          detail: "Do not administer. Quarantine the stock and select an in-date batch.",
        });
    }

    if (c.postExposure)
      a.push({
        code: "post-exposure",
        severity: "stop",
        message: "Post-exposure treatment is outside this PGD",
        detail: "Any animal bite, scratch or lick to broken skin needs immediate wound washing and urgent medical assessment. Arrange this the same day and do not delay.",
      });
    if (c.anaphylaxisComponent)
      a.push({
        code: "anaphylaxis",
        severity: "stop",
        message: "Confirmed anaphylaxis to a previous dose or vaccine component",
        detail: "Excluded from this PGD. Refer to the GP or a specialist service.",
      });
    if (c.acuteFebrileIllness)
      a.push({
        code: "febrile",
        severity: "stop",
        message: "Acute severe febrile illness, postpone",
        detail: "A minor infection without fever is not a contraindication. Advise when to return.",
      });
    if (c.immunosuppressed)
      a.push({
        code: "immunosuppression",
        severity: "stop",
        message: "Significant immunosuppression, asplenia or complement deficiency",
        detail: "Excluded from this PGD. Refer for specialist advice.",
      });
    if (c.pregnant)
      a.push({
        code: "pregnancy",
        severity: "stop",
        message: "Known or suspected pregnancy",
        detail: "Excluded from this PGD. Refer to the GP.",
      });
    if (c.bleedingDisorder)
      a.push({
        code: "bleeding",
        severity: "stop",
        message: "Bleeding disorder without a clinician's assessment",
        detail: "Intramuscular injection must be assessed as safe by a clinician familiar with the child's bleeding risk before proceeding. Where assessed as safe, use a 23 gauge or finer needle with firm pressure without rubbing for at least 2 minutes.",
      });
    if (c.clinicalUncertainty)
      a.push({
        code: "clinical-uncertainty",
        severity: "stop",
        message: "Complex itinerary, unresolved immunisation history or clinical uncertainty",
        detail: "Excluded from this PGD. Refer to the GP or a specialist travel health service.",
      });
    // The inclusion criterion is unconditional for every child under 16: a
    // person with parental responsibility, or a suitable adult authorised by
    // them, must be present. Gillick competence is a basis for consent, not a
    // substitute for an adult being present. Gated on the eligibility step
    // being reached, where the box is ticked.
    if (step > 4 && !c.parentPresent && age !== null && age < 16)
      a.push({
        code: "no-parent",
        severity: "stop",
        message: "No person with parental responsibility (or authorised adult) present",
        detail: "Go back to the Eligibility step. A child under 16 cannot be vaccinated under this PGD unless a person with parental responsibility, or a suitable adult authorised by them, is present.",
      });

    if (!c.routineUpToDate && !c.catchUpPlanDiscussed)
      a.push({
        code: "routine-catchup",
        severity: "caution",
        message: "Routine UK immunisations not confirmed up to date",
        detail: "Inclusion requires the routine schedule to be up to date, or a catch-up plan discussed and the GP informed. Catch-up is a priority before travel-specific vaccines.",
      });
    if (c.selected.includes("twinrix-paed") && c.selected.length > 1)
      a.push({
        code: "twinrix-coadmin",
        severity: "caution",
        message: "Twinrix Paediatric: SmPC advises against same-day co-administration",
        detail: "Vaccines other than Cervarix should not be given at the same time as Twinrix Paediatric. Give separately, or follow Green Book advice and record the reason.",
      });
    if (c.chronicConditionOrRemote)
      a.push({
        code: "chronic-or-remote",
        severity: "caution",
        message: "Chronic condition, specialist care, or prolonged rural, remote or high-altitude travel",
        detail: "Discuss with or refer to the GP.",
      });
    if (c.selected.includes("rabies"))
      a.push({
        code: "rabies-counsel",
        severity: "caution",
        message: "Rabies pre-exposure course",
        detail: "Three doses at days 0, 7 and 21 to 28 must be completed before travel. Pre-exposure vaccination reduces but does not remove the need for urgent treatment after any exposure.",
      });
    if (c.selected.includes("cholera") && ageMonths !== null && ageMonths < 72 && ageMonths >= 24)
      a.push({
        code: "cholera-3-dose",
        severity: "caution",
        message: "Cholera: three dose schedule under 6 years",
        detail: "Children aged 2 to under 6 years need three doses at least one week apart. Confirm there is time before departure.",
      });

    // Course timing against the departure date, per vaccine
    if (daysToDeparture !== null) {
      if (daysToDeparture < 0)
        a.push({
          code: "departed",
          severity: "caution",
          message: "The departure date is in the past",
          detail: "Check the date. If the child has already travelled, record why vaccination is being given now (for example completing a course).",
        });
      for (const p of planned) {
        const lead = p.def.leadTimeDays(ageMonths);
        const firstDose = !p.entry.doseNumber || p.entry.doseNumber === "1";
        if (daysToDeparture >= 0 && daysToDeparture < lead && firstDose)
          a.push({
            code: `timing-${p.def.id}`,
            severity: "caution",
            message: `${p.def.name}: ${daysToDeparture} days to departure, ${lead} days are needed for this course to give protection before travel`,
            detail: p.def.id === "typhoid" || p.def.id === "menacwy"
              ? "The document requires a single dose at least 2 weeks before travel. Protection may be incomplete; tell the parent or young person and record that it was discussed."
              : p.def.id === "cholera"
              ? "Dukoral doses are at least one week apart and the course must be complete at least one week before travel. Protection may be incomplete."
              : p.def.id === "rabies"
              ? "The three dose pre-exposure course (days 0, 7 and 21 to 28) cannot be completed before travel. Tell the family that any exposure abroad still needs urgent post-exposure treatment."
              : p.def.id === "je"
              ? "Two doses 28 days apart, completed a week before travel: the course cannot be completed before departure. The accelerated schedule is licensed for 18 years and over only."
              : "Protection may be incomplete at departure. Advise that the course must still be completed after travel.",
          });
      }
    }

    if (!c.anaphylaxisKit && step >= 5)
      a.push({
        code: "no-kit",
        severity: "red-flag",
        message: "Anaphylaxis kit not confirmed",
        detail: "Adrenaline 1 in 1,000 injection and a telephone must be immediately available before any vaccine is given.",
      });

    return a;
  }, [patient.age, ageMonths, planned, c, step, daysToDeparture]);

  const hasStops = alerts.some((x) => x.severity === "stop");
  const isUnder16 = patient.age !== null && patient.age < 16;
  const gillickOffered = patient.age !== null && patient.age >= GILLICK_MIN_AGE && patient.age < 16;

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 1 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.destination.trim()) return "Please record the destination";
        if (!c.departureDate.trim() || !parseLocalDate(c.departureDate)) return "Please record the departure date";
        if (!c.recommendedForDestination) return "Confirm the vaccine is recommended by NaTHNaC / TravelHealthPro for the destination, or the child is otherwise at risk as described in the Green Book";
        if (!c.routineUpToDate && !c.catchUpPlanDiscussed) return "Confirm routine UK childhood immunisations are up to date, or that a catch-up plan has been discussed and the GP informed";
        return null;
      case 3:
        if (c.selected.length === 0) return "Please select at least one vaccine";
        for (const p of planned) {
          if (!p.entry.doseNumber) return `${p.def.name}: select which dose in the course is being given today`;
          if (p.def.minIntervalDays(p.entry.doseNumber) !== null && !parseLocalDate(p.entry.previousDoseDate))
            return `${p.def.name}: record the date of the previous dose`;
        }
        if (c.selected.includes("twinrix-paed") && c.selected.length > 1 && !c.twinrixCoAdminReason.trim()) return "Twinrix Paediatric with another vaccine today: record the reason for same-day co-administration, or give separately";
        return null;
      case 4:
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        if (isUnder16 && !c.parentPresent) return "Under 16: a person with parental responsibility, or a suitable adult authorised by them, must be present for the vaccination";
        if (isUnder16 && c.parentPresent && !c.parentPresentDetail.trim()) return "Record who is present and their relationship to the child";
        if (!c.consentBasis) return "Record who gave consent";
        if (isUnder16 && c.consentBasis === "self") return "Under 16: consent must come from a person with parental responsibility, or the young person must be assessed as Gillick competent";
        if (c.consentBasis === "gillick" && !gillickOffered) return `Gillick competence is offered from ${GILLICK_MIN_AGE} years to 15 years; record parental consent for this child`;
        if (!isUnder16 && c.consentBasis === "gillick") return "Aged 16 or 17: the young person consents in their own right";
        if ((c.consentBasis === "parental" || c.consentBasis === "gillick") && !c.consentDetail.trim()) return c.consentBasis === "parental" ? "Record the relationship of the person with parental responsibility to the child" : "Record the basis of the Gillick competence assessment";
        return null;
      case 5:
        if (!c.anaphylaxisKit) return "Confirm anaphylaxis facilities and adrenaline 1 in 1,000 are immediately available";
        for (const p of planned) {
          if (!p.entry.batchNumber.trim()) return `${p.def.name}: record the batch number`;
          if (!parseLocalDate(p.entry.expiryDate)) return `${p.def.name}: record the expiry date`;
          if (!p.entry.site) return `${p.def.name}: record the anatomical site (or oral)`;
          if (p.def.route === "Oral" && p.entry.site !== "Oral") return `${p.def.name}: Dukoral is given orally`;
          if (p.def.route !== "Oral" && p.entry.site === "Oral") return `${p.def.name}: select an injection site`;
        }
        return null;
      case 6:
        if (!c.observationCompleted) return "Confirm the 15 minute seated observation period was completed";
        if (!c.scheduleAdvice || !c.sideEffectAdvice || !c.bitesAndFoodAdvice || !c.rabiesAdvice) return "Please confirm all counselling points";
        if (c.adverseReaction && !c.adverseReactionDetails.trim()) return "Record the adverse reaction and the action taken";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary, planned, isUnder16, gillickOffered]);

  // A stop anywhere disables Next on every step. The only way past a stop is
  // to resolve it or to save the consultation as not supplied.
  const canProceed = !validationError && !hasStops;
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const resetAll = () => {
    setStep(0); setCompleted(new Set());
    setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent });
    setSummary(initialSummary()); setC(emptyClinical());
  };

  const vaccinesGiven = planned.map((p) => ({
    id: p.def.id,
    name: p.def.name,
    dose: p.doseText,
    route: p.def.route,
    doseNumber: p.entry.doseNumber,
    previousDoseDate: p.entry.previousDoseDate,
    batchNumber: p.entry.batchNumber,
    expiryDate: p.entry.expiryDate,
    site: p.entry.site,
    nextDueDate: p.nextDueDate,
    nextDueLabel: p.nextDueLabel,
    schedule: p.def.schedule,
  }));

  const outcome: ConsultationRecordData["outcome"] = hasStops
    ? (c.exclusionReferral && c.exclusionReferral !== "declined" ? "referred" : "not_supplied")
    : "completed";

  // Returns a record on every step, including before a vaccine is chosen, so
  // an exclusion on step 0 can still be saved as not supplied.
  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: {
      patient, consent, clinical: c, alerts, ageMonths, daysToDeparture, pgdVersion: PGD_VERSION,
      vaccines: hasStops ? [] : vaccinesGiven,
      vaccinesPlanned: vaccinesGiven,
      exclusion: hasStops
        ? { reasons: alerts.filter((x) => x.severity === "stop").map((x) => x.message), advice: c.exclusionAdvice, referral: c.exclusionReferral }
        : null,
      adverseReaction: c.adverseReaction ? c.adverseReactionDetails : null,
      gpInformed: c.gpInformed,
    } as unknown as Record<string, unknown>,
    outcome,
    ...(hasStops || vaccinesGiven.length === 0
      ? {}
      : {
          medicine: {
            name: vaccinesGiven.map((v) => v.name).join("; "),
            dose: vaccinesGiven.map((v) => `${v.name.split(" (")[0]}: ${v.dose}${v.doseNumber ? `, dose ${v.doseNumber}` : ""}`).join("; "),
            duration: "Single visit",
            quantity: vaccinesGiven.length,
          },
        }),
    summary: {
      pharmacistName: summary.pharmacistName, pharmacistGPhC: summary.pharmacistGPhC,
      pharmacyName: summary.pharmacyName, pharmacyAddress: summary.pharmacyAddress,
      consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
      clinicalNotes: summary.clinicalNotes,
    },
    consent: { notifyGp: c.gpInformed || !!consent.notifyGp },
  });

  const onPatientChange = (field: keyof BasePatientDetails, value: unknown) =>
    setPatient((p) => ({ ...p, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value as string) } : {}) }));

  const ageLabel = (v: VaccineDef) =>
    v.minAgeMonths >= 24 ? `from ${v.minAgeMonths / 12} years` : `from ${v.minAgeMonths} months`;

  // Shown on any step where a stop is on screen: the document requires the
  // advice given and the decision reached to be documented, and the GP to be
  // informed or the child referred. Saved with the "Save as not supplied"
  // button in the step footer.
  const exclusionOutcome = hasStops ? (
    <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-300 print:hidden">
      <p className="text-sm font-semibold text-red-800">Exclusion: record the advice given and the decision reached</p>
      <p className="text-xs text-red-800">
        This child cannot be vaccinated under this PGD while an exclusion applies. Advise on alternative options (GP practice, specialist travel health clinic), the risks of travelling unvaccinated, and give written destination-specific risk-avoidance advice. Then use &quot;Save as not supplied&quot; below.
      </p>
      <TextArea label="Advice given and decision reached" value={c.exclusionAdvice} onChange={(v) => set({ exclusionAdvice: v })} placeholder="e.g. Advised to see GP for specialist referral; written food, water and bite-avoidance advice given; parent understands the risk of travelling unvaccinated" required />
      <SelectInput label="GP informed or referral made" value={c.exclusionReferral} onChange={(v) => set({ exclusionReferral: v as ExclusionReferral })}
        options={[
          { value: "gp-informed", label: "GP informed" },
          { value: "gp-referred", label: "Referred to GP" },
          { value: "specialist-travel-clinic", label: "Referred to a specialist travel health clinic" },
          { value: "urgent-same-day", label: "Urgent same-day medical assessment arranged (post-exposure)" },
          { value: "declined", label: "Parent or young person declined referral; advice given" },
        ]} required />
    </div>
  ) : null;

  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            {hasStops && <AlertBanner alerts={alerts} />}
            {exclusionOutcome}
            <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            {hasStops && <AlertBanner alerts={alerts} />}
            {exclusionOutcome}
            <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            {exclusionOutcome}
            <TextInput label="Destination" value={c.destination} onChange={(v) => set({ destination: v })} placeholder="e.g. rural Kenya" required />
            <TextInput label="Departure date" type="date" value={c.departureDate} onChange={(v) => set({ departureDate: v })} required />
            {daysToDeparture !== null && (
              <p className="text-xs text-gray-600">{daysToDeparture < 0 ? `Departure date is ${-daysToDeparture} days in the past` : `${daysToDeparture} days to departure`}</p>
            )}
            <TextArea label="Itinerary, duration and planned activities" value={c.itinerary} onChange={(v) => set({ itinerary: v })} placeholder="Rural or urban, length of stay, animal contact, accommodation, season" />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Travelling to, or residing in, an area where the vaccine is recommended by NaTHNaC / TravelHealthPro (checked at this consultation), or otherwise at occupational or lifestyle risk as described in the relevant Green Book chapter" checked={c.recommendedForDestination} onChange={(v) => set({ recommendedForDestination: v })} />
              <Checkbox label="Routine UK childhood immunisations confirmed up to date" checked={c.routineUpToDate} onChange={(v) => set({ routineUpToDate: v })} />
              {!c.routineUpToDate && (
                <Checkbox label="Routine immunisations not up to date: a catch-up plan has been discussed and the GP informed" checked={c.catchUpPlanDiscussed} onChange={(v) => set({ catchUpPlanDiscussed: v })} />
              )}
              <Checkbox label="Chronic condition, under specialist care, or itinerary includes prolonged rural travel, remote areas or high-altitude destinations (discuss with or refer to the GP)" checked={c.chronicConditionOrRemote} onChange={(v) => set({ chronicConditionOrRemote: v })} />
            </div>
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              Check TravelHealthPro (NaTHNaC) for this destination at the time of the consultation. Vaccination does not replace bite avoidance, food and water precautions, or malaria chemoprophylaxis where indicated.
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            {exclusionOutcome}
            <p className="text-sm text-gray-600">
              Select the vaccines indicated by the risk assessment. Age eligibility is checked against the child&apos;s date of birth: the higher of 12 months and the vaccine-specific minimum age applies.
            </p>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              {VACCINES.map((v) => {
                const tooYoung = ageMonths !== null && ageMonths < v.minAgeMonths;
                const tooOld = patient.age !== null && patient.age > v.maxAgeYears;
                return (
                  <div key={v.id} className={tooYoung || tooOld ? "opacity-60" : ""}>
                    <Checkbox
                      label={`${v.name} (${ageLabel(v)}${tooYoung ? ", below minimum age" : ""}${tooOld ? ", above paediatric range" : ""})`}
                      checked={c.selected.includes(v.id)}
                      onChange={() => toggleVaccine(v.id)}
                    />
                  </div>
                );
              })}
            </div>
            {planned.length > 0 && ageMonths !== null && (
              <div className="space-y-4">
                {planned.map((p) => {
                  const needsPrev = p.entry.doseNumber ? p.def.minIntervalDays(p.entry.doseNumber) !== null : false;
                  return (
                    <div key={p.def.id} className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-3">
                      <p className="font-semibold">{p.def.name}</p>
                      <p>{p.doseText}. {p.def.schedule}</p>
                      <SelectInput label="Dose being given today" value={p.entry.doseNumber} onChange={(v) => setDose(p.def.id, { doseNumber: v, ...(p.def.minIntervalDays(v) === null ? { previousDoseDate: "" } : {}) })} options={p.def.doseOptions(ageMonths)} required />
                      {needsPrev && (
                        <TextInput label="Date of the previous dose" type="date" value={p.entry.previousDoseDate} onChange={(v) => setDose(p.def.id, { previousDoseDate: v })} required />
                      )}
                      {p.nextDueDate && (
                        <p className="text-xs text-gray-700">Next dose due from <strong>{p.nextDueDate}</strong>: {p.nextDueLabel}</p>
                      )}
                      {p.entry.doseNumber && !p.nextDueDate && (
                        <p className="text-xs text-gray-700">Course complete after this dose.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {c.selected.includes("twinrix-paed") && c.selected.length > 1 && (
              <TextInput label="Twinrix Paediatric with another vaccine today: reason for same-day co-administration (Green Book advice)" value={c.twinrixCoAdminReason} onChange={(v) => set({ twinrixCoAdminReason: v })} placeholder="e.g. imminent departure, Green Book permits co-administration at separate sites" required />
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            {exclusionOutcome}
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">Exclusions</p>
              <Checkbox label="Confirmed anaphylaxis to a previous dose or any vaccine component" checked={c.anaphylaxisComponent} onChange={(v) => set({ anaphylaxisComponent: v })} />
              <Checkbox label="Acute severe febrile illness" checked={c.acuteFebrileIllness} onChange={(v) => set({ acuteFebrileIllness: v })} />
              <Checkbox label="Significant immunosuppression, asplenia or complement deficiency" checked={c.immunosuppressed} onChange={(v) => set({ immunosuppressed: v })} />
              <Checkbox label="Known or suspected pregnancy" checked={c.pregnant} onChange={(v) => set({ pregnant: v })} />
              <Checkbox label="Bleeding disorder not assessed as safe for intramuscular injection" checked={c.bleedingDisorder} onChange={(v) => set({ bleedingDisorder: v })} />
              <Checkbox label="Attending for post-exposure treatment (including animal bite, scratch or lick to broken skin)" checked={c.postExposure} onChange={(v) => set({ postExposure: v })} />
              <Checkbox label="Complex itinerary, incomplete or unreliable immunisation history that cannot be resolved, or any clinical uncertainty" checked={c.clinicalUncertainty} onChange={(v) => set({ clinicalUncertainty: v })} />
            </div>
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800">Presence of an adult (required for every child under 16)</p>
              <Checkbox label="A person with parental responsibility, or a suitable adult authorised by them, is present for the vaccination" checked={c.parentPresent} onChange={(v) => set({ parentPresent: v })} description={isUnder16 ? "Inclusion criterion. This is required for every child under 16 whatever the consent basis; a Gillick-competent young person under 16 must still be accompanied." : "Not required at 16 or 17."} />
              {c.parentPresent && (
                <TextInput label="Who is present and their relationship to the child" value={c.parentPresentDetail} onChange={(v) => set({ parentPresentDetail: v })} placeholder="e.g. mother; or aunt, authorised by the mother" required={isUnder16} />
              )}
            </div>
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800">Consent</p>
              <SelectInput label="Consent given by" value={c.consentBasis} onChange={(v) => set({ consentBasis: v as ConsentBasis })}
                options={[
                  { value: "parental", label: "A person with parental responsibility" },
                  ...(gillickOffered ? [{ value: "gillick", label: "The young person, assessed as Gillick competent (12 to 15 years)" }] : []),
                  ...(!isUnder16 && patient.age !== null ? [{ value: "self", label: "The young person, aged 16 or 17" }] : []),
                ]} required />
              {c.consentBasis === "parental" && (
                <TextInput label="Relationship of the person with parental responsibility to the child" value={c.consentDetail} onChange={(v) => set({ consentDetail: v })} placeholder="e.g. mother" required />
              )}
              {c.consentBasis === "gillick" && (
                <TextInput label={`Basis of the Gillick competence assessment (child aged ${patient.age})`} value={c.consentDetail} onChange={(v) => set({ consentDetail: v })} placeholder="e.g. understands the purpose, benefits and risks and can retain and weigh the information" required />
              )}
            </div>
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              Check neomycin, polymyxin, streptomycin, latex and thiomersal sensitivities against the specific product SPC before administration. Rabies vaccine presentations differ, check the SPC where there is an egg allergy.
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            {exclusionOutcome}
            <Checkbox label="Facilities and trained staff for anaphylaxis are available, with immediate access to adrenaline (epinephrine) 1 in 1,000 injection and a telephone" checked={c.anaphylaxisKit} onChange={(v) => set({ anaphylaxisKit: v })} />
            {ageMonths !== null && planned.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">Intramuscular injection into the deltoid, or the anterolateral thigh in younger children where deltoid bulk is insufficient. Use separate sites, preferably different limbs, or at least 2.5 cm apart in the same limb. Record the site of each. Inspect each vaccine visually and do not use if the appearance differs from the SPC. Vaccinate seated and observe for 15 minutes.</p>
                {planned.map((p) => (
                  <div key={p.def.id} className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-3">
                    <p className="font-semibold">{p.def.name}</p>
                    <p>{p.doseText}{p.entry.doseNumber ? `, dose ${p.entry.doseNumber === "booster" ? "booster" : p.entry.doseNumber}` : ""}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <TextInput label="Batch number" value={p.entry.batchNumber} onChange={(v) => setDose(p.def.id, { batchNumber: v })} placeholder="e.g. X012345" required />
                      <TextInput label="Expiry date" type="date" value={p.entry.expiryDate} onChange={(v) => setDose(p.def.id, { expiryDate: v })} required />
                      <SelectInput label="Anatomical site" value={p.entry.site} onChange={(v) => setDose(p.def.id, { site: v })} options={p.def.route === "Oral" ? SITE_OPTIONS.filter((s) => s.value === "Oral") : SITE_OPTIONS.filter((s) => s.value !== "Oral")} required />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-600">The shared safety block below also carries a single batch field; the per-vaccine batches above are the record for a recall.</p>
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-4 print:hidden">
              <AlertBanner alerts={alerts} />
              {exclusionOutcome}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Checkbox label="Observed for 15 minutes after vaccination, seated, and the observation period completed" checked={c.observationCompleted} onChange={(v) => set({ observationCompleted: v })} />
                <Checkbox label="PIL offered for each vaccine; written record of vaccines given with dates provided; remaining doses and dates explained, and that the course should be completed even if travel has taken place" checked={c.scheduleAdvice} onChange={(v) => set({ scheduleAdvice: v })} />
                <Checkbox label="Side effects and their management explained; advised to seek medical advice for an adverse reaction and to report it via the Yellow Card scheme" checked={c.sideEffectAdvice} onChange={(v) => set({ sideEffectAdvice: v })} />
                <Checkbox label="Destination-specific written advice given on food and water hygiene, insect bite avoidance, animal avoidance and rabies risk, and malaria prevention where indicated; advised that any fever during or after travel to a malarial area needs urgent medical assessment" checked={c.bitesAndFoodAdvice} onChange={(v) => set({ bitesAndFoodAdvice: v })} />
                <Checkbox label="Advised that any animal bite, scratch or lick to broken skin abroad needs immediate wound washing and urgent medical attention regardless of rabies vaccination status" checked={c.rabiesAdvice} onChange={(v) => set({ rabiesAdvice: v })} />
              </div>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Checkbox label="Adverse reaction observed during or after vaccination" checked={c.adverseReaction} onChange={(v) => set({ adverseReaction: v, ...(v ? {} : { adverseReactionDetails: "" }) })} />
                {c.adverseReaction && (
                  <TextArea label="Adverse reaction and action taken (report via Yellow Card and inform the GP)" value={c.adverseReactionDetails} onChange={(v) => set({ adverseReactionDetails: v })} required />
                )}
                <Checkbox label="GP informed of the vaccines given (the document requires the individual's GP to be informed)" checked={c.gpInformed} onChange={(v) => set({ gpInformed: v })} />
              </div>
              <p className="text-xs text-gray-500">{PGD_VERSION}.</p>
              <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
              <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
              <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
            </div>
            <JuniorTravelSummaryReport
              patient={patient}
              consent={consent}
              summary={summary}
              clinical={c}
              alerts={alerts}
              hasStops={hasStops}
              vaccines={vaccinesGiven}
              daysToDeparture={daysToDeparture}
            />
          </div>
        );
      default:
        return null;
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
            onNewConsultation={resetAll}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

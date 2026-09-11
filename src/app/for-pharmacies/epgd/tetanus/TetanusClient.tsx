"use client";

import { useState, useMemo } from "react";
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
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import {
  PGD_VERSION,
  STEP_LABELS,
  WITHIN_10_YEARS,
  type Clinical,
  type Indication,
  type LastDose,
  type Priming,
  type ConsentBasis,
  type Route,
  createEmptyClinical,
  expiryMonthIsCurrent,
  daysSince,
} from "./tetanus-types";
import { TetanusSummaryReport } from "./components/TetanusSummaryReport";

/**
 * Tetanus, Diphtheria and Polio ePGD (Td/IPV, Revaxis), PGD version 009,
 * issued 11 September 2026. Faithful to the signed PGD: 10 years and over,
 * single 0.5 mL intramuscular dose. Covers the missed adolescent booster,
 * incomplete or unknown history, the travel booster where the last dose was
 * over 10 years ago, and tetanus-prone wounds assessed by time since the last
 * dose (not dose count). Pregnancy, a dose within the last 12 months (other
 * than the scheduled second or third primary dose), outbreak case and contact
 * management and current neurological deterioration are hard stops with
 * referral. A wound needing immunoglobulin does NOT exclude the vaccine dose:
 * the dose is given and the patient is referred the same day.
 */

export default function TetanusClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>(createEmptyClinical());
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const isUnder16 = patient.age !== null && patient.age < 16;

  // Derived wound logic (UKHSA Tetanus: advice for health professionals, Table 4;
  // Green Book chapter 30 table 30.1), as stated in the PGD.
  const wound = c.indication === "wound";
  const uncertainHistory = c.priming === "incomplete" || c.lastDose === "unknown";
  const primedWithin10 = wound && c.woundProne && c.priming === "adequate" && WITHIN_10_YEARS.includes(c.lastDose);
  const immunoglobulinIndicated = wound && c.woundProne && (c.woundHighRisk || uncertainHistory);
  const woundDoseIndicated = wound && c.woundProne && !primedWithin10 && (c.lastDose === "over-10" || uncertainHistory);

  // A course (with a next dose to book) is only involved for the primary course indication.
  const courseInvolved = c.indication === "incomplete-history";

  // Off-label: primary immunisation over 10 years, or a dose 12 months to 5 years after the last.
  const offLabel = c.indication === "incomplete-history" || (c.lastDose === "under-5" && c.indication !== "adolescent-booster");

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    const age = patient.age;

    if (age !== null && age < 10)
      a.push({
        code: "under-10",
        severity: "stop",
        message: "Under 10 years is excluded from this PGD",
        detail: "Refer to the GP or an appropriate immunisation service for an age-appropriate vaccine (DTaP/IPV/Hib/HepB or dTaP/IPV).",
      });
    if (c.pregnant)
      a.push({
        code: "pregnancy",
        severity: "stop",
        message: "Pregnancy is excluded from this PGD in all circumstances, including after a tetanus-prone wound",
        detail: "Refer to the GP or midwife THE SAME DAY and make the urgency explicit where a wound is involved. There is no 'protection required without delay' route under this PGD. From week 16 a pertussis-containing vaccine is routinely indicated instead, which is a different product and a different decision.",
      });
    // A dose within 12 months excludes for every indication except the
    // scheduled continuation of a primary course. Under that indication the
    // stop waits for the continuation question to be answered No; the
    // unanswered question is a validation message, not a stop (stop audit,
    // 11 Sep 2026).
    const within12Excluded =
      c.lastDose === "under-12-months" &&
      c.indication !== "" &&
      (c.indication !== "incomplete-history" || c.primaryCourseContinuationAnswer === "no");
    if (within12Excluded)
      a.push({
        code: "dose-within-12-months",
        severity: "stop",
        message: "A tetanus, diphtheria or polio containing vaccine within the last 12 months excludes",
        detail: "Refer to establish what was given and when. The only exception is the second or third dose of a primary course being given under this PGD at the scheduled one-month interval.",
      });
    if (c.anaphylaxisPreviousDose)
      a.push({
        code: "anaphylaxis-previous",
        severity: "stop",
        message: "Confirmed anaphylaxis to a previous diphtheria, tetanus or polio containing vaccine",
        detail: "Excluded from this PGD, including any conjugate vaccine in which diphtheria or tetanus toxoid is used as the carrier. Refer to the GP.",
      });
    if (c.anaphylaxisComponent)
      a.push({
        code: "anaphylaxis-component",
        severity: "stop",
        message: "Confirmed anaphylaxis to a vaccine component",
        detail: "Includes neomycin, streptomycin and polymyxin B. Refer to the GP.",
      });
    if (c.acuteFebrileIllness)
      a.push({
        code: "febrile",
        severity: "stop",
        message: "Acute severe febrile illness, postpone",
        detail: "A minor infection is not a contraindication. Advise when to return and arrange another appointment.",
      });
    if (c.outbreakContact)
      a.push({
        code: "outbreak",
        severity: "stop",
        message: "Case or contact in a diphtheria or polio outbreak",
        detail: "Must be managed by the local Health Protection Team. Outside this PGD.",
      });
    if (c.neurologicalDeterioration)
      a.push({
        code: "neuro",
        severity: "stop",
        message: "Current neurological deterioration, defer",
        detail: "Defer and seek advice so that any change is not incorrectly attributed to the vaccine. A stable neurological condition is not a contraindication; only current deterioration defers.",
      });
    if (c.neuroComplicationsPrevious)
      a.push({
        code: "neuro-complications",
        severity: "stop",
        message: "Neurological complications after a previous diphtheria or tetanus containing vaccine",
        detail: "Guillain-Barre syndrome or brachial neuritis following a previous diphtheria or tetanus containing vaccine is excluded (Revaxis SmPC). Refer.",
      });

    // Travel: the final dose of the relevant antigen must be more than 10 years ago.
    if (c.indication === "travel" && WITHIN_10_YEARS.includes(c.lastDose))
      a.push({
        code: "travel-not-due",
        severity: "stop",
        message: "Travel booster not indicated",
        detail: "A travel booster under this PGD requires the final dose of the relevant antigen more than 10 years ago (this applies even where 5 doses have been received). Give reassurance and wound care advice, and check TravelHealthPro for the destination.",
      });
    if ((c.indication === "travel" || c.indication === "adolescent-booster") && c.lastDose === "unknown")
      a.push({
        code: "travel-uncertain",
        severity: "stop",
        message: c.indication === "travel"
          ? "Uncertain history in a traveller: use the incomplete or uncertain history indication"
          : "Uncertain history: a single adolescent booster is not indicated; use the incomplete or uncertain history indication",
        detail: "Where there is no reliable history, assume undocumented doses are missing. Select 'No history, or incomplete or unknown history' so that a primary course is offered and recorded.",
      });
    // The adolescent booster is 'a minimum of 5 years after the pre-school
    // booster' (dose row). Earlier than that it is not indicated, not
    // off-label: the off-label paragraph covers resumed primary courses only.
    if (c.indication === "adolescent-booster" && c.lastDose === "under-5")
      a.push({
        code: "booster-too-early",
        severity: "stop",
        message: "Adolescent booster not indicated: last dose within 5 years",
        detail: "The adolescent booster is given a minimum of 5 years after the pre-school booster. A booster given earlier is not authorised by this PGD. Refer to the GP if there is doubt about the history; otherwise advise when the booster falls due.",
      });

    // Tetanus-prone wound, assessed by time since the last dose. The stop is
    // raised only once the question has been answered No, on the step it is asked.
    if (wound && c.woundProneAnswer === "no")
      a.push({
        code: "wound-not-prone",
        severity: "stop",
        message: "Wound assessed as not tetanus-prone: no immunisation action under this indication",
        detail: "Where the wound is not tetanus-prone (Green Book chapter 30 table 30.1), give wound care advice and record the assessment; save as not supplied. If another indication applies, go back and select it instead.",
      });
    if (primedWithin10)
      a.push({
        code: "wound-primed-within-10",
        severity: "stop",
        message: "Adequately primed with the last dose within 10 years: no vaccine needed",
        detail: c.woundHighRisk
          ? "No further vaccine is needed. The wound is HIGH RISK: refer the same day for tetanus immunoglobulin, which this PGD does not supply. Give wound care advice and record the assessment."
          : "No further vaccine is needed. Give wound care advice and record the assessment against table 30.1.",
      });
    if (immunoglobulinIndicated && !primedWithin10)
      a.push({
        code: "immunoglobulin",
        severity: "red-flag",
        message: "Tetanus immunoglobulin indicated: give the vaccine dose and refer the same day",
        detail: uncertainHistory
          ? "Not adequately primed or history uncertain with a tetanus-prone wound: give the vaccine dose under this PGD AND refer the same day for tetanus immunoglobulin, whether or not the wound is high risk. Immunoglobulin is not a PGD supply. Do not delay."
          : "High-risk wound (heavy contamination with soil or manure, devitalised tissue, burns, sepsis, or more than 6 hours to surgical treatment) with the last dose more than 10 years ago: give the reinforcing dose AND refer the same day for tetanus immunoglobulin, which this PGD does not supply. Do not delay.",
      });
    if (wound && c.woundProne && c.priming === "adequate" && c.lastDose === "over-10" && !c.woundHighRisk)
      a.push({
        code: "wound-reinforcing",
        severity: "caution",
        message: "Reinforcing dose indicated",
        detail: "Adequate priming with the last dose more than 10 years ago: a single reinforcing dose under this PGD, whatever the total number of doses. Immunoglobulin is not indicated unless the wound is high risk.",
      });

    if (c.indication === "incomplete-history")
      a.push({
        code: "primary-course",
        severity: "caution",
        message: "Primary course required",
        detail: "Where there is no reliable history, assume undocumented doses are missing: 3 doses one month apart, resumed (not restarted) if interrupted, then a first booster at least 5 years after the third dose and a second booster a minimum of 5 and ideally 10 years after the first. Primary immunisation over 10 years of age is off-label: explain and record. Book the next dose today and inform the GP.",
      });
    if (c.lastDose === "under-5" && c.indication !== "adolescent-booster")
      a.push({
        code: "off-label-interval",
        severity: "caution",
        message: "Dose within 5 years of the last diphtheria or tetanus toxoid containing vaccine is off-label",
        detail: "Outside the Revaxis SmPC (section 4.4) and given in accordance with the Green Book. Explain this as part of consent and record it.",
      });
    {
      // The 12-month exception is only for the scheduled second or third
      // primary dose: the prior dose must have been about a month ago.
      const d = daysSince(c.priorPrimaryDoseDate);
      if (c.indication === "incomplete-history" && c.primaryCourseContinuation && d !== null && (d < 21 || d > 365))
        a.push({
          code: "primary-interval",
          severity: "stop",
          message: d < 21 ? "Prior primary dose less than 3 weeks ago: the next dose is not yet due" : "Prior primary dose more than 12 months ago: this is not the scheduled continuation",
          detail: "Primary doses are given one month apart. Where the interval is longer, the course is resumed, not restarted, but the 12 month exclusion no longer applies as an exception and the dose must be recorded as a resumed course. Check the date.",
        });
    }
    if (c.immunosuppressed)
      a.push({
        code: "immunosuppression",
        severity: "caution",
        message: "Immunosuppression, response may be reduced",
        detail: "Vaccination is still recommended. Advise the patient that protection may be limited.",
      });
    if (c.bleedingDisorder)
      a.push({
        code: "bleeding",
        severity: "caution",
        message: "Bleeding disorder or anticoagulation",
        detail: "Stable anticoagulation (warfarin up to date with INR testing and latest INR below the upper threshold of the therapeutic range) may be vaccinated intramuscularly with a 23 gauge or finer needle, followed by firm pressure without rubbing for at least 2 minutes. Advise on the risk of haematoma. Where the intramuscular route is not suitable, give by deep subcutaneous injection.",
      });
    // The anaphylaxis facilities confirmation is a required tick on the
    // administration step (validation names the control); it no longer
    // raises a red flag simply because the box has not been reached yet.

    return a;
  }, [patient.age, c, wound, uncertainHistory, primedWithin10, immunoglobulinIndicated]);

  const hasStops = alerts.some((x) => x.severity === "stop");

  const doseText = useMemo(() => {
    const base = "Revaxis 0.5 mL by intramuscular injection, preferably into the deltoid muscle of the upper arm.";
    if (c.indication === "incomplete-history")
      return `${base} ${c.primaryCourseContinuation ? "Second or third dose" : "First dose"} of a 3 dose primary course, one month between doses; an interrupted course is resumed, not restarted. First booster at least 5 years after the third dose, second booster a minimum of 5 and ideally 10 years after the first.`;
    if (c.indication === "wound")
      return `${base} Single reinforcing dose for a tetanus-prone wound.`;
    if (c.indication === "travel")
      return `${base} Single travel booster (last dose more than 10 years ago).`;
    return `${base} Single adolescent booster dose, a minimum of 5 years after the pre-school booster.`;
  }, [c.indication, c.primaryCourseContinuation]);

  const validationError = useMemo(() => {
    switch (step) {
      case 0: {
        const base = validatePatientStep(patient, { minAge: 10 });
        if (base) return base;
        // Never trust a stale age: recompute from the DOB here.
        const age = calculateAge(patient.dateOfBirth);
        if (age === null) return "Unable to calculate age from the date of birth";
        if (age < 10) return "Patient must be 10 years or older";
        // PGD v009 records: patient name, address, date of birth and the GP with whom they are registered.
        if (!patient.address.trim()) return "Patient address is required (the PGD requires it to be recorded)";
        if (!patient.gpPractice.trim() && !patient.gpName.trim()) return "The GP with whom the patient is registered is required: search for the practice, or enter \"Not registered\" as the GP name";
        return null;
      }
      case 1: {
        const base = validateConsentStep(consent);
        if (base) return base;
        if (isUnder16) {
          if (!c.consentBasis) return "Under 16: record whether the young person is Gillick competent or consent was given by a person with parental responsibility";
          if (c.consentBasis === "parental" && !c.parentName.trim()) return "Record the name and relationship of the person with parental responsibility";
          if (c.consentBasis === "gillick" && !c.parentName.trim()) return "Record the basis of the Gillick assessment (the PGD requires it to be recorded)";
        }
        return null;
      }
      case 2:
        if (!c.indication) return "Please select the indication";
        if (c.indication === "travel" && !c.destination.trim()) return "Please record the destination";
        if (!c.lastDose) return "Please record when the last tetanus-containing dose was given";
        if (c.indication === "incomplete-history" && c.lastDose === "under-12-months" && !c.primaryCourseContinuationAnswer)
          return "Answer \"Is this the second or third dose of a primary course being given under this PGD at the scheduled one-month interval?\" (Yes or No)";
        if (c.indication === "incomplete-history" && c.lastDose === "under-12-months" && c.primaryCourseContinuation && !c.priorPrimaryDoseDate.trim())
          return "Record the date of the prior primary-course dose given under this PGD";
        if (!c.lastDoseDate.trim()) return "Please record the date of the most recent tetanus-containing dose and how it was established";
        if (!c.dosesReceived.trim()) return "Please record the number of documented prior doses";
        if (!c.dosesSource.trim()) return "Please record the source of the dose history";
        return null;
      case 3:
        if (!c.allergies.trim()) return "\"Allergies\" is required: record allergies, or NKDA";
        if (wound && !c.woundProneAnswer) return "Answer \"Is the wound tetanus-prone?\" (Yes or No)";
        if (wound && !c.priming) return "Select the \"Priming status\" for the wound assessment";
        if (wound && !c.woundAssessmentNote.trim()) return "Please record the wound assessment against table 30.1 and the conclusion on immunoglobulin";
        return null;
      case 4:
        if (!c.anaphylaxisKit) return "Tick \"Facilities and trained staff for anaphylaxis are available...\"";
        if (offLabel && !c.offLabelExplained) return "Tick \"Off-label use explained...\" once it has been explained and consent given on that basis";
        if (immunoglobulinIndicated && !c.immunoglobulinReferralArranged) return "Tick \"Same-day referral for tetanus immunoglobulin arranged\" once it has been arranged";
        if (!c.batchNumber.trim()) return "Please record the batch number";
        if (!c.expiryDate.trim()) return "Please record the expiry date";
        if (!expiryMonthIsCurrent(c.expiryDate)) return "Expiry date must be MM/YYYY and must not be in the past";
        if (!c.route) return "Please record the route (intramuscular, or deep subcutaneous where the intramuscular route is not suitable)";
        if (!c.site.trim()) return "Please record the anatomical site";
        return null;
      case 5:
        if (!c.observationCompleted) return "Tick \"15 minute observation period after vaccination completed\" once the 15 minutes have elapsed";
        if (!c.recordAdvice) return "Tick \"Written record of the vaccine given...\" once it has been supplied";
        if (courseInvolved && !c.courseAdvice) return "Tick \"The next dose of the primary course has been booked...\" once it has been booked";
        if (!c.sideEffectAdvice) return "Tick \"Advised that a sore arm, mild fever...\" once the advice has been given";
        if (!c.woundAdvice) return "Tick \"Advised that any dirty wound...\" once the advice has been given";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary, isUnder16, wound, offLabel, immunoglobulinIndicated, courseInvolved]);

  // A stop anywhere disables Next on every step; an excluded patient is
  // recorded through the "not vaccinated" panel and "Save as not supplied".
  const canProceed = !validationError && !hasStops;
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const routeText = c.route === "deep-subcutaneous" ? "Deep subcutaneous" : c.route === "intramuscular" ? "Intramuscular" : "";

  // Returns a record on every step so an excluded patient can be saved as
  // "not supplied" from the step the stop is raised on.
  const getConsultationData = (): ConsultationRecordData => {
    const vaccinated = !hasStops && !!c.batchNumber.trim();
    return {
      patient: {
        firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
        nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
        gpName: patient.gpName, gpPractice: patient.gpPractice, gpAddress: patient.gpAddress,
        gpPhone: patient.gpPhone, gpEmail: patient.gpEmail, gpOdsCode: patient.gpOdsCode,
      },
      clinicalData: {
        patient, consent, clinical: c, alerts, dose: doseText, pgdVersion: PGD_VERSION,
        route: routeText, woundDoseIndicated, immunoglobulinIndicated, offLabel,
      } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine: vaccinated
        ? {
            name: "Revaxis (Td/IPV), adsorbed diphtheria (low dose), tetanus and inactivated poliomyelitis vaccine",
            dose: `0.5 mL ${routeText.toLowerCase() || "intramuscular"}${c.site ? `, ${c.site}` : ""}`,
            duration: c.indication === "incomplete-history"
              ? (c.primaryCourseContinuation ? "Second or third primary dose" : "First primary dose (3 dose course)")
              : c.indication === "wound" ? "Single reinforcing dose (tetanus-prone wound)"
              : c.indication === "travel" ? "Single travel booster"
              : "Single adolescent booster",
            quantity: 1,
          }
        : undefined,
      summary: {
        pharmacistName: summary.pharmacistName, pharmacistGPhC: summary.pharmacistGPhC,
        pharmacyName: summary.pharmacyName, pharmacyAddress: summary.pharmacyAddress,
        consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
        clinicalNotes: summary.clinicalNotes,
      },
      consent: { notifyGp: consent.notifyGp },
    };
  };

  const onPatientChange = (field: keyof BasePatientDetails, value: unknown) =>
    setPatient((p) => ({ ...p, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value as string) } : {}) }));

  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Required on this tool as well as the starred fields: patient address, and the GP practice (or
              &quot;Not registered&quot; as the GP name). Patients aged 10 years and over.
            </p>
            <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />
            {isUnder16 && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-800">Consent in a young person under 16</p>
                <SelectInput label="Basis of consent" value={c.consentBasis} onChange={(v) => set({ consentBasis: v as ConsentBasis })}
                  options={[
                    { value: "gillick", label: "Young person assessed as Gillick competent and consents" },
                    { value: "parental", label: "Consent from a person with parental responsibility" },
                  ]} required />
                {c.consentBasis === "parental" && (
                  <TextInput label="Name and relationship of the person with parental responsibility" value={c.parentName} onChange={(v) => set({ parentName: v })} placeholder="e.g. Jane Smith, mother" required />
                )}
                {c.consentBasis === "gillick" && (
                  <TextInput label="Basis of the Gillick assessment" value={c.parentName} onChange={(v) => set({ parentName: v })} placeholder="e.g. understands the purpose, benefits and risks and can retain and weigh the information" required />
                )}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Indication" value={c.indication} onChange={(v) => set({ indication: v as Indication })}
              options={[
                { value: "adolescent-booster", label: "Adolescent booster following a primary course (usually offered at 13 to 18 years), not already completed" },
                { value: "incomplete-history", label: "No history, or incomplete or uncertain history" },
                { value: "travel", label: "Travel where medical attention may not be accessible, or residing in an endemic or epidemic area, and last dose more than 10 years ago" },
                { value: "wound", label: "Tetanus-prone wound, reinforcing dose (UKHSA Table 4)" },
              ]} required />
            {c.indication === "travel" && (
              <TextInput label="Destination and travel dates" value={c.destination} onChange={(v) => set({ destination: v })} placeholder="e.g. rural Nepal, departing 12 Sep" required />
            )}
            <SelectInput label="Last tetanus, diphtheria or polio containing dose" value={c.lastDose} onChange={(v) => set({ lastDose: v as LastDose, ...(v !== "under-12-months" ? { primaryCourseContinuationAnswer: "" as const, primaryCourseContinuation: false, priorPrimaryDoseDate: "" } : {}) })}
              options={[
                { value: "over-10", label: "More than 10 years ago" },
                { value: "5-to-10", label: "5 to 10 years ago" },
                { value: "under-5", label: "Between 12 months and 5 years ago" },
                { value: "under-12-months", label: "Within the last 12 months" },
                { value: "unknown", label: "Unknown or uncertain" },
              ]} required />
            {c.indication === "incomplete-history" && c.lastDose === "under-12-months" && (
              <SelectInput
                label="Is this the second or third dose of a primary course being given under this PGD at the scheduled one-month interval?"
                value={c.primaryCourseContinuationAnswer}
                onChange={(v) => set({ primaryCourseContinuationAnswer: v as Clinical["primaryCourseContinuationAnswer"], primaryCourseContinuation: v === "yes", priorPrimaryDoseDate: v === "yes" ? c.priorPrimaryDoseDate : "" })}
                options={[
                  { value: "yes", label: "Yes: scheduled second or third primary dose under this PGD" },
                  { value: "no", label: "No: another tetanus, diphtheria or polio containing vaccine within 12 months (excluded: the tool will stop)" },
                ]}
                required
              />
            )}
            {c.indication === "incomplete-history" && c.lastDose === "under-12-months" && c.primaryCourseContinuation && (
              <TextInput label="Date of the prior primary-course dose given under this PGD" type="date" value={c.priorPrimaryDoseDate} onChange={(v) => set({ priorPrimaryDoseDate: v })} required />
            )}
            <TextInput label="Date of the most recent tetanus-containing dose, and how it was established" value={c.lastDoseDate} onChange={(v) => set({ lastDoseDate: v })} placeholder="e.g. 14/03/2012 from GP record; or unknown, no records available" required />
            <TextInput label="Number of documented prior doses" value={c.dosesReceived} onChange={(v) => set({ dosesReceived: v })} placeholder="e.g. 5, or 0 documented" required />
            <TextInput label="Source of the dose history" value={c.dosesSource} onChange={(v) => set({ dosesSource: v })} placeholder="e.g. GP summary care record, red book, patient recall" required />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              Five documented doses is a complete lifetime course for routine purposes. It does not exempt the individual from a travel booster or a wound reinforcing dose where the last dose was more than 10 years ago. A dose within the last 12 months excludes, other than the scheduled second and third doses of a primary course under this PGD. Some countries require proof of polio vaccination within the previous 12 months, check TravelHealthPro for the destination.
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">Exclusions</p>
              <Checkbox label="Pregnant (excluded in all circumstances, including after a tetanus-prone wound: refer to the GP or midwife the same day)" checked={c.pregnant} onChange={(v) => set({ pregnant: v })} />
              <Checkbox label="Confirmed anaphylaxis to a previous diphtheria, tetanus or polio containing vaccine (including a conjugate vaccine using diphtheria or tetanus toxoid as the carrier)" checked={c.anaphylaxisPreviousDose} onChange={(v) => set({ anaphylaxisPreviousDose: v })} />
              <Checkbox label="Confirmed anaphylaxis to a vaccine component (neomycin, streptomycin, polymyxin B)" checked={c.anaphylaxisComponent} onChange={(v) => set({ anaphylaxisComponent: v })} />
              <Checkbox label="Acute severe febrile illness (a minor infection is not a contraindication)" checked={c.acuteFebrileIllness} onChange={(v) => set({ acuteFebrileIllness: v })} />
              <Checkbox label="Case or contact in a diphtheria or polio outbreak" checked={c.outbreakContact} onChange={(v) => set({ outbreakContact: v })} />
              <Checkbox label="Current neurological deterioration" checked={c.neurologicalDeterioration} onChange={(v) => set({ neurologicalDeterioration: v })} />
              <Checkbox label="Neurological complications (Guillain-Barre syndrome or brachial neuritis) following a previous diphtheria or tetanus containing vaccine" checked={c.neuroComplicationsPrevious} onChange={(v) => set({ neuroComplicationsPrevious: v })} />
            </div>
            {wound && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-800">Wound assessment (Green Book chapter 30 table 30.1; UKHSA Tetanus: advice for health professionals, Table 4)</p>
                <SelectInput
                  label="Is the wound tetanus-prone?"
                  value={c.woundProneAnswer}
                  onChange={(v) => set({ woundProneAnswer: v as Clinical["woundProneAnswer"], woundProne: v === "yes" })}
                  options={[
                    { value: "yes", label: "Yes: tetanus-prone (table 30.1)" },
                    { value: "no", label: "No: not tetanus-prone (no immunisation action under this indication; the tool will stop)" },
                  ]}
                  required
                />
                <Checkbox label="Wound is HIGH RISK: heavy contamination with soil or manure, devitalised tissue, burns, sepsis, or a delay of more than 6 hours to surgical treatment" checked={c.woundHighRisk} onChange={(v) => set({ woundHighRisk: v })} />
                <SelectInput label="Priming status" value={c.priming} onChange={(v) => set({ priming: v as Priming })}
                  options={[
                    { value: "adequate", label: "Adequate priming course: 3 or more documented doses" },
                    { value: "incomplete", label: "Not adequately primed, or incomplete or uncertain history" },
                  ]} required />
                <p className="text-xs text-amber-900 font-medium">
                  Definition applied by this tool: adequate priming is 3 or more documented doses (UKHSA Tetanus: advice
                  for health professionals, Table 4; Green Book chapter 30). The document&apos;s &quot;Five documented
                  doses&quot; box says fewer than 5 doses needs immunoglobulin with a tetanus-prone wound; that wording is
                  referred for clinical review and is not applied here. Record which definition you used in the assessment note.
                </p>
                <TextArea label="Assessment against table 30.1 and conclusion on immunoglobulin" value={c.woundAssessmentNote} onChange={(v) => set({ woundAssessmentNote: v })} placeholder="e.g. puncture wound gardening, soil contamination, 3 doses documented, last dose 2009: reinforcing dose given, high-risk wound, same-day referral for immunoglobulin" required />
                <p className="text-xs text-amber-800">
                  Adequate priming with the last dose within 10 years: no vaccine. Last dose more than 10 years ago, whatever the total number of doses: a reinforcing dose. Immunoglobulin is indicated where the wound is high risk, or where the person is not adequately primed or the history is uncertain; it is a same-day referral, not a PGD supply, and does not exclude the vaccine dose.
                </p>
              </div>
            )}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700">Cautions</p>
              <Checkbox label="Immunosuppressed (vaccinate; advise protection may be limited)" checked={c.immunosuppressed} onChange={(v) => set({ immunosuppressed: v })} />
              <Checkbox label="Bleeding disorder or anticoagulation" checked={c.bleedingDisorder} onChange={(v) => set({ bleedingDisorder: v })} />
            </div>
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              A stable neurological condition is not a contraindication; only current deterioration defers. Revaxis contains approximately 10 micrograms of phenylalanine per 0.5 mL dose. The NSPKU advises this amount is negligible and that individuals with phenylketonuria should take up the offer of immunisation.
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              <p className="font-semibold mb-1">Dose</p>
              <p>{doseText}</p>
              <p className="mt-2">Revaxis, adsorbed diphtheria (low dose), tetanus and inactivated poliomyelitis vaccine, suspension for injection in a pre-filled syringe, 0.5 mL. Shake the pre-filled syringe well before use; the normal appearance is a cloudy white suspension that may sediment. Inspect visually and do not administer if there is foreign particulate matter or any variation from the expected appearance. Where given with other vaccines, use separate sites, preferably different limbs, or at least 2.5 cm apart in the same limb, and record the site of each. Vaccinate seated and observe every patient for 15 minutes after vaccination.</p>
            </div>
            <Checkbox label="Facilities and trained staff for anaphylaxis are available, with immediate access to adrenaline (epinephrine) 1 in 1,000 injection and a telephone" checked={c.anaphylaxisKit} onChange={(v) => set({ anaphylaxisKit: v })} required />
            {offLabel && (
              <Checkbox label="Off-label use explained (given outside the product licence but in accordance with the Green Book) and consent given on that basis" checked={c.offLabelExplained} onChange={(v) => set({ offLabelExplained: v })} required />
            )}
            {immunoglobulinIndicated && (
              <Checkbox label="Same-day referral for tetanus immunoglobulin arranged (immunoglobulin is not supplied under this PGD)" checked={c.immunoglobulinReferralArranged} onChange={(v) => set({ immunoglobulinReferralArranged: v })} required />
            )}
            <TextInput label="Batch number" value={c.batchNumber} onChange={(v) => set({ batchNumber: v })} required />
            <TextInput label="Expiry date" value={c.expiryDate} onChange={(v) => set({ expiryDate: v })} placeholder="MM/YYYY" required />
            <SelectInput
              label="Route"
              value={c.route}
              onChange={(v) => set({ route: v as Route })}
              options={[
                { value: "intramuscular", label: "Intramuscular (the PGD route)" },
                { value: "deep-subcutaneous", label: "Deep subcutaneous (bleeding disorder where the intramuscular route is not suitable)" },
              ]}
              required
            />
            <TextInput label="Anatomical site" value={c.site} onChange={(v) => set({ site: v })} placeholder="e.g. left deltoid" required />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="print:hidden"><AlertBanner alerts={alerts} /></div>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg print:hidden">
              <p className="text-xs text-gray-600">Tick each item once it has been done or the advice given (all are required).</p>
              <Checkbox label="15 minute observation period after vaccination completed" checked={c.observationCompleted} onChange={(v) => set({ observationCompleted: v })} required />
              <Checkbox label="Written record of the vaccine given (date, brand, batch number) and the patient information leaflet supplied; told to keep the record because the number of doses determines what happens if they are ever injured" checked={c.recordAdvice} onChange={(v) => set({ recordAdvice: v })} required />
              {courseInvolved && (
                <Checkbox label="The next dose of the primary course has been booked at this appointment and the patient advised to come back for every dose" checked={c.courseAdvice} onChange={(v) => set({ courseAdvice: v })} required />
              )}
              <Checkbox label="Advised that a sore arm, mild fever, headache or aching for a day or two is common and settles by itself; Yellow Card reporting explained" checked={c.sideEffectAdvice} onChange={(v) => set({ sideEffectAdvice: v })} required />
              <Checkbox label="Advised that any dirty wound, puncture wound, burn, animal bite or wound with soil or manure in it must be cleaned and medical advice sought, whatever vaccinations they have had (and, for travellers, that vaccination does not remove the need to get any significant wound cleaned and assessed while away)" checked={c.woundAdvice} onChange={(v) => set({ woundAdvice: v })} required />
            </div>
            <div className="space-y-4 print:hidden">
              <p className="text-xs text-gray-500">{PGD_VERSION}.</p>
              <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
              <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
              <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
            </div>
            {/* The printed record: this is what Save & Print prints. */}
            <TetanusSummaryReport patient={patient} consent={consent} clinical={c} summary={summary} alerts={alerts} doseText={doseText} immunoglobulinIndicated={immunoglobulinIndicated} offLabel={offLabel} />
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
          <div className="print:hidden">
            <ProgressBar stepLabels={STEP_LABELS} currentStep={step} onStepClick={(s) => { if (s < step) setStep(s); }} completedSteps={completed} hasErrors={hasStops} />
          </div>
          <StepWrapper
            title={STEP_LABELS[step]}
            currentStep={step}
            totalSteps={STEP_LABELS.length}
            onNext={next}
            onPrev={prev}
            canProceed={canProceed}
            validationError={hasStops ? (validationError ?? "Exclusion criteria met: do not vaccinate under this PGD. Record the assessment, referral and advice, and save as not supplied.") : validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={() => {
              setStep(0); setCompleted(new Set());
              setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent });
              setSummary(initialSummary()); setC(createEmptyClinical());
            }}
          >
            {stepBody()}
            {hasStops && (
              <div className="mt-6 space-y-3 p-4 rounded-lg border border-red-300 bg-red-50">
                <p className="text-sm font-semibold text-red-900">Not vaccinated: record the assessment, referral and advice</p>
                <p className="text-xs text-red-900">
                  The PGD requires the advice given to an excluded patient to be recorded, the wound assessment and
                  the conclusion on immunoglobulin where a wound is involved, and same-day referral for a pregnant
                  patient or a high-risk wound. Complete the items below and use &quot;Save as not supplied&quot;.
                </p>
                <Checkbox label="Explained why the vaccine cannot be given under this PGD and what happens next" checked={c.exclusionExplained} onChange={(v) => set({ exclusionExplained: v })} />
                <Checkbox
                  label={
                    c.pregnant || (wound && c.woundHighRisk)
                      ? "SAME-DAY referral arranged (pregnancy: GP or midwife; high-risk wound: tetanus immunoglobulin)"
                      : "Referral arranged where indicated (GP, immunisation service, Health Protection Team, or immunoglobulin)"
                  }
                  checked={c.referralArranged}
                  onChange={(v) => set({ referralArranged: v })}
                />
                <TextInput label="Referral: to whom, and when" value={c.referralDetails} onChange={(v) => set({ referralDetails: v })} placeholder="e.g. GP surgery, same day, phoned 14:20; or emergency department for immunoglobulin" />
                <Checkbox label="Wound care advice given (clean the wound, seek medical advice for any dirty, puncture or contaminated wound)" checked={c.woundAdvice} onChange={(v) => set({ woundAdvice: v })} />
                <Checkbox label="GP informed, or will be informed" checked={c.gpInformed} onChange={(v) => set({ gpInformed: v })} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
                  <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
                </div>
                <TextArea label="Advice given and decision reached" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
              </div>
            )}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

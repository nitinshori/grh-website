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
  YF_PGD_VERSION,
  STEP_LABELS,
  STEP_PRECAUTIONS,
  type Clinical,
  createEmptyClinical,
  expiryMonthIsCurrent,
} from "./yellow-fever-types";
import { YellowFeverSummaryReport } from "./components/YellowFeverSummaryReport";

/**
 * Yellow Fever ePGD, rebuilt from scratch 6 Aug 2026.
 *
 * The previous tool at this route was a MenACWY clone: it offered Nimenrix
 * and Menveo, allowed patients from 6 weeks, and treated immunosuppression
 * as a caution. Yellow fever vaccine (Stamaril) is a LIVE attenuated 17D
 * vaccine, and immunosuppression, thymus disorder and a first-degree family
 * history of YEL-AVD or YEL-AND are absolute contraindications, because the
 * vaccine strain can replicate and cause fatal disease.
 *
 * Built to the NaTHNaC contraindications and precautions table (updated
 * 27 May 2026) and Green Book chapter 35. Yellow fever may only be given at
 * a designated Yellow Fever Vaccination Centre, so the tool asks the
 * pharmacist to confirm designation before anything else.
 *
 * Aligned to PGD v005 (11 September 2026): pregnancy is an exclusion, any
 * immediate-type egg or component allergy excludes, 6 to 8 months is outside
 * the PGD, destinations where vaccination is neither recommended nor required
 * are outside the PGD, and a patient under the precautions cannot be
 * vaccinated without recorded specialist advice.
 */

/** Whole days from today until the departure date (YYYY-MM-DD), or null. */
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** True when any PGD precaution requiring specialist advice is ticked. */
function hasSpecialistPrecaution(c: Clinical): boolean {
  return c.breastfeedingInfantUnder9m || c.hivPositive;
}

export function YellowFeverClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>(createEmptyClinical());
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  // Age in months, so the 6 month and 9 month thresholds can be applied
  // exactly rather than rounded to whole years.
  const ageMonths = useMemo(() => {
    if (!patient.dateOfBirth) return null;
    const dob = new Date(patient.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let m = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) m -= 1;
    return m;
  }, [patient.dateOfBirth]);

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    const age = patient.age;

    // ── Designation ────────────────────────────────────────────────
    if (step > 0 && !c.yfvcDesignated)
      a.push({
        code: "not-yfvc",
        severity: "stop",
        message: "Yellow fever vaccine may only be given at a designated Yellow Fever Vaccination Centre",
        detail: "Confirm the pharmacy's NaTHNaC designation and that you are authorised to administer under it. If the centre is not designated, the patient must be referred to a designated YFVC.",
      });

    // ── Absolute contraindications (NaTHNaC, 27 May 2026) ──────────
    if (ageMonths !== null && ageMonths < 6)
      a.push({
        code: "under-6-months",
        severity: "stop",
        message: "Under 6 months of age",
        detail: "Absolute contraindication because of the increased risk of vaccine-associated encephalitis. Refer.",
      });
    if (c.anaphylaxisPreviousYf)
      a.push({
        code: "anaphylaxis-yf",
        severity: "stop",
        message: "Confirmed anaphylaxis to a previous dose of yellow fever vaccine",
        detail: "Do not vaccinate. Consider a Medical Letter of Exemption where a certificate is required for entry.",
      });
    if (c.anaphylaxisComponent || c.eggAnaphylaxis)
      a.push({
        code: "anaphylaxis-component",
        severity: "stop",
        message: "Immediate-type allergy to egg or chicken protein, or to a vaccine component",
        detail: "Stamaril is propagated in chick embryos. Any immediate-type (IgE-mediated) allergy to egg or chicken protein, or to any component of the vaccine, that has not been shown to be outgrown, excludes. Refer to an allergy specialist or hospital-based clinic; do not vaccinate under this PGD. Consider a Medical Letter of Exemption where a certificate is required.",
      });
    if (c.thymusDisorder)
      a.push({
        code: "thymus",
        severity: "stop",
        message: "History of thymus disorder or thymectomy",
        detail: "Includes myasthenia gravis, thymoma, and removal of the thymus for any reason including during cardiac surgery. Increased risk of vaccine-associated serious adverse events. Do not vaccinate.",
      });
    if (c.familyHistorySae)
      a.push({
        code: "family-sae",
        severity: "stop",
        message: "First-degree relative with a serious adverse event after yellow fever vaccine",
        detail: "Where a blood relative has had YEL-AVD or YEL-AND not explained by a known risk factor, an unidentified genetic predisposition is assumed. Do not vaccinate.",
      });
    if (c.immunodeficiency)
      a.push({
        code: "immunodeficiency",
        severity: "stop",
        message: "Primary or acquired immunodeficiency",
        detail: "Live vaccine strains can replicate and cause extensive, severe and sometimes fatal infection. This covers leukaemia and lymphoma, severe immunosuppression due to HIV, cellular immune deficiencies, chronic lymphoproliferative disorders, stem cell transplant within 24 months, chemotherapy or radiotherapy within 6 months, solid organ transplant immunosuppression within 6 months, biological therapy within 12 months, and high dose corticosteroids or oral immune modulating drugs within 3 months at the NaTHNaC thresholds. Refer.",
      });
    if (c.acuteFebrileIllness)
      a.push({
        code: "febrile",
        severity: "stop",
        message: "Acute febrile illness, postpone",
        detail: "Defer until recovered and rebook, allowing 10 days before travel for the certificate to become valid.",
      });

    if (c.pregnant)
      a.push({
        code: "pregnancy",
        severity: "stop",
        message: "Pregnancy: do not vaccinate under this PGD",
        detail: "Advise against travel to a yellow fever risk area. Where travel is unavoidable, refer to a specialist yellow fever centre for an individual risk assessment, and offer a Medical Letter of Exemption where a certificate is required for entry. Vaccinate after pregnancy if the risk continues.",
      });
    if (ageMonths !== null && ageMonths >= 6 && ageMonths < 9)
      a.push({
        code: "infant-6-8m",
        severity: "stop",
        message: "Aged 6 to 8 months: outside this PGD",
        detail: "Vaccination is only considered where the risk of transmission is high, such as during an outbreak, and travel is unavoidable. Seek specialist advice from NaTHNaC (020 7383 7474) and refer; do not vaccinate under this PGD.",
      });
    if (c.certificateRequired === "not-required")
      a.push({
        code: "not-recommended-destination",
        severity: "stop",
        message: "Vaccination neither recommended nor required for this destination",
        detail: age !== null && age >= 60
          ? "Aged 60 or over and travelling only to areas where WHO designates yellow fever vaccination as generally not recommended or not recommended is a Green Book contraindication and an exclusion under this PGD."
          : "The PGD covers travel to or residence in an area where vaccination is recommended by NaTHNaC or a certificate is required for entry, confirmed on TravelHealthPro. Outside that, do not vaccinate under this PGD.",
      });
    if (age !== null && age >= 60 && c.certificateRequired !== "not-required")
      a.push({
        code: "over-60",
        severity: "caution",
        message: "Aged 60 years or over",
        detail: "The risk of YEL-AND and YEL-AVD rises with age, and almost all cases occur with a first dose. Vaccinate only where there is significant and unavoidable risk after a detailed risk assessment, and record it.",
      });
    {
      const days = daysUntil(c.departureDate);
      if (c.certificateRequired === "required" && days !== null && days < 10)
        a.push({
          code: "late-traveller",
          severity: "caution",
          message: "Departing within 10 days: certificate will not be valid in time",
          detail: "The certificate becomes valid 10 days after vaccination. Explain that the destination may refuse entry or quarantine, reinforce bite avoidance, and vaccinate if the traveller wishes. Record the advice.",
        });
    }
    if (c.mmrToday)
      a.push({
        code: "mmr-same-day",
        severity: "stop",
        message: "MMR given today or planned for today: do not give yellow fever vaccine on the same day",
        detail: "The Green Book rule the PGD carries is absolute: yellow fever and MMR are never given on the same day. Rebook, separating the two by 28 days where possible.",
      });
    if (c.mmrWithin28Days && !c.mmrToday)
      a.push({
        code: "mmr-interval",
        severity: "caution",
        message: "MMR given within the last 28 days or planned within 28 days",
        detail: "Separate yellow fever and MMR by 28 days unless protection is needed rapidly, in which case give at any interval, record the reason, and consider an additional MMR dose. Other live and inactivated vaccines may be given at any interval, at separate sites.",
      });

    // ── Precautions: specialist advice, not automatic refusal ───────
    if (c.breastfeedingInfantUnder9m)
      a.push({
        code: "breastfeeding",
        severity: "red-flag",
        message: "Breastfeeding an infant under 9 months",
        detail: "There is evidence of transmission of live vaccine virus in breast milk to infants under 2 months. Seek specialist advice before vaccinating.",
      });
    if (c.hivPositive)
      a.push({
        code: "hiv",
        severity: "red-flag",
        message: "Living with HIV",
        detail: "Vaccine may be given safely where CD4 is above 200 with a suppressed viral load, but evidence is limited and the antibody response may be reduced. Seek specialist advice.",
      });
    if (c.lowDoseImmunomodulator)
      a.push({
        code: "low-dose-immunomodulator",
        severity: "caution",
        message: "Low dose corticosteroid or non-biological immune modulating therapy",
        detail: "Long term low dose therapy is not usually considered sufficiently immunosuppressive and these patients can generally receive live vaccines. Data are limited, so specialist advice may be sought.",
      });

    if (hasSpecialistPrecaution(c) && !c.specialistAdviceObtained && step >= STEP_PRECAUTIONS)
      a.push({
        code: "no-specialist-advice",
        severity: "stop",
        message: "Specialist advice not obtained",
        detail: "Any patient falling under the precautions where specialist advice cannot be obtained before vaccination is excluded. Call NaTHNaC on 020 7383 7474, record who gave the advice and when, or do not vaccinate.",
      });

    if (!c.anaphylaxisKit && step >= 5)
      a.push({
        code: "no-kit",
        severity: "red-flag",
        message: "Anaphylaxis kit not confirmed",
        detail: "Adrenaline 1 in 1,000 and a telephone must be immediately available before any vaccine is given.",
      });

    return a;
  }, [patient.age, ageMonths, c, step]);

  const hasStops = alerts.some((x) => x.severity === "stop");
  const lateTraveller = (() => { const d = daysUntil(c.departureDate); return c.certificateRequired === "required" && d !== null && d < 10; })();
  const underSixteen = patient.age !== null && patient.age < 16;
  // Gillick competence is offered from age 10; an infant cannot be Gillick competent.
  const gillickPossible = patient.age !== null && patient.age >= 10;

  const validationError = useMemo(() => {
    switch (step) {
      case 0: {
        if (!c.yfvcDesignated) return "Confirm this is a designated Yellow Fever Vaccination Centre";
        if (!c.yfvcCode.trim()) return "Please record the YFVC designation number";
        if (!c.pharmacistNotTechnicianConfirmed) return "Confirm you are a registered pharmacist: pharmacy technicians may not administer yellow fever vaccine under the NaTHNaC conditions of designation";
        const base = validatePatientStep(patient);
        if (base) return base;
        // Never trust a stale age: recompute from the DOB here.
        if (calculateAge(patient.dateOfBirth) === null) return "Unable to calculate age from the date of birth";
        // PGD v005 records: name, address, date of birth and GP with whom the individual is registered.
        if (!patient.address.trim()) return "Patient address is required (the PGD requires it to be recorded)";
        if (!patient.gpPractice.trim() && !patient.gpName.trim()) return "The GP with whom the patient is registered is required: search for the practice, or enter \"Not registered\" as the GP name";
        return null;
      }
      case 1: {
        const base = validateConsentStep(consent);
        if (base) return base;
        if (underSixteen && !c.consentBasis) return "Under 16: record whether consent came from a person with parental responsibility or from a Gillick-competent young person";
        if (underSixteen && c.consentBasis === "gillick" && !gillickPossible) return "A child under 10 cannot be assessed as Gillick competent for this purpose: consent must come from a person with parental responsibility";
        if (underSixteen && !c.consentGiverDetails.trim()) return "Under 16: record the consent giver's name and relationship, or the basis of the Gillick assessment";
        return null;
      }
      case 2:
        if (!c.destination.trim()) return "Please record the destination";
        if (!c.departureDate.trim()) return "Please record the departure date";
        if (!c.certificateRequired) return "Please record the certificate requirement for this destination";
        if (lateTraveller && !c.lateTravelAdviceGiven) return "Departure within 10 days: confirm the traveller was told the certificate will not be valid in time and that the advice was recorded";
        if (c.mmrWithin28Days && !c.mmrToday && !c.mmrWithin28DaysReason.trim()) return "MMR within 28 days: record why protection is needed rapidly enough to give at a shorter interval";
        return null;
      case 3: return null;
      case STEP_PRECAUTIONS:
        if (hasSpecialistPrecaution(c) && !c.specialistAdviceObtained) return "Specialist advice must be obtained and recorded before vaccinating a patient under the precautions";
        if (hasSpecialistPrecaution(c) && !c.specialistAdviceDetails.trim()) return "Record who gave the specialist advice and when";
        return null;
      case 5:
        if (!c.anaphylaxisKit) return "Confirm adrenaline 1 in 1,000 and a telephone are immediately available";
        if (!c.doseType) return "Record whether this is a first dose, a reinforcing dose or a booster";
        if (c.doseType === "reinforcing" && !c.reinforcingReason) return "Record which Green Book reinforcing-dose group applies";
        if (!c.batchNumber.trim()) return "Please record the batch number";
        if (!c.expiryDate.trim()) return "Please record the expiry date";
        if (!expiryMonthIsCurrent(c.expiryDate)) return "Expiry date must be MM/YYYY and must not be in the past";
        if (!c.route) return "Please record the route of administration";
        if (!c.site.trim()) return "Please record the anatomical site";
        return null;
      case 6:
        if (!c.observationCompleted) return "Record that the 15 minute seated observation period was completed";
        if (!c.validFromExplained || !c.adverseEventAdvice || !c.biteAvoidanceAdvice || !c.pilOffered)
          return "Please confirm all counselling points";
        if (!c.avoidPregnancyAdvice) return "Record whether the avoid-pregnancy-for-one-month advice was given, or that it was not applicable";
        if (c.certificateIssued && !c.certificateNumber.trim())
          return "Please record the certificate number";
        if (c.certificateIssued && !c.certificateValidFrom.trim())
          return "Please record the date from which the certificate is valid";
        if (!c.certificateIssued && !c.certificateNotIssuedReason.trim())
          return "The PGD says to issue the ICVP: either record the certificate number, or record the reason it was not issued";
        if (!c.gpInformed) return "Confirm the GP will be informed";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary, underSixteen, lateTraveller, hasStops]);

  // A stop anywhere disables Next on every step; an excluded patient is
  // recorded through the "not vaccinated" panel and "Save as not supplied".
  const canProceed = !validationError && !hasStops;
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

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
      clinicalData: { patient, consent, clinical: c, alerts, ageMonths, pgdVersion: YF_PGD_VERSION } as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine: vaccinated
        ? {
            name: "Stamaril, yellow fever vaccine (live attenuated 17D-204)",
            dose: `0.5 ml ${c.route || "subcutaneous"}${c.site ? `, ${c.site}` : ""}`,
            duration: c.doseType === "first" ? "Single dose (certificate valid for life)" : c.doseType === "reinforcing" ? `Reinforcing dose (${c.reinforcingReason})` : "Booster after 10 years",
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
            <AlertBanner alerts={alerts} />
            <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-sm">
              <p className="font-semibold text-amber-900">Designated centres only</p>
              <p className="text-amber-900 mt-1">
                Yellow fever vaccine may only be given at a centre designated by
                NaTHNaC, by a registered doctor, nurse, pharmacist or dentist
                working under that designation.
              </p>
            </div>
            <Checkbox
              label="I confirm this pharmacy is a designated Yellow Fever Vaccination Centre and I am authorised to administer under its designation"
              checked={c.yfvcDesignated}
              onChange={(v) => set({ yfvcDesignated: v })}
            />
            <TextInput label="YFVC designation number" value={c.yfvcCode} onChange={(v) => set({ yfvcCode: v })} required />
            <Checkbox
              label="I am a registered pharmacist (not a pharmacy technician)"
              checked={c.pharmacistNotTechnicianConfirmed}
              onChange={(v) => set({ pharmacistNotTechnicianConfirmed: v })}
              description="The NaTHNaC conditions of designation restrict administration to registered doctors, nurses, pharmacists and dentists. Pharmacy technicians may not administer yellow fever vaccine under this PGD."
              required
            />
            <TextInput label="Administering clinician" value={c.administeringClinician} onChange={(v) => set({ administeringClinician: v })} placeholder="Name and role" />
            <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />
            {underSixteen && (
              <div className="space-y-3 p-4 rounded-lg border border-amber-300 bg-amber-50">
                <p className="text-sm font-semibold text-amber-900">Under 16: consent basis (PGD inclusion criterion)</p>
                <SelectInput
                  label="Consent given by"
                  value={c.consentBasis}
                  onChange={(v) => set({ consentBasis: v as Clinical["consentBasis"] })}
                  options={[
                    { value: "", label: "Select..." },
                    { value: "parental", label: "A person with parental responsibility" },
                    ...(gillickPossible ? [{ value: "gillick", label: "The young person, assessed as Gillick competent" }] : []),
                  ]}
                  required
                />
                <TextInput
                  label={c.consentBasis === "gillick" ? "Basis of the Gillick competence assessment" : "Name and relationship of the person with parental responsibility"}
                  value={c.consentGiverDetails}
                  onChange={(v) => set({ consentGiverDetails: v })}
                  placeholder={c.consentBasis === "gillick" ? "Why the young person was judged competent" : "A parent accompanying a child does not automatically hold parental responsibility. Ask."}
                  required
                />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <TextInput label="Destination" value={c.destination} onChange={(v) => set({ destination: v })} placeholder="e.g. Ghana, Brazil (Minas Gerais)" required />
            <TextInput label="Departure date" type="date" value={c.departureDate} onChange={(v) => set({ departureDate: v })} required />
            <SelectInput
              label="Certificate requirement for this destination"
              value={c.certificateRequired}
              onChange={(v) => set({ certificateRequired: v as Clinical["certificateRequired"] })}
              options={[
                { value: "required", label: "Certificate required as a condition of entry" },
                { value: "recommended", label: "Vaccination recommended for protection, no certificate requirement" },
                { value: "not-required", label: "Neither required nor recommended" },
              ]}
              required
            />
            <div className="p-4 rounded-lg border border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 text-sm">
              Check the destination on TravelHealthPro at the time of the
              consultation. The PGD covers travel to or residence in an area
              where vaccination is recommended by NaTHNaC or a certificate is
              required for entry. Where it is neither required nor recommended,
              vaccination is outside this PGD; in patients aged 60 and over it
              is a Green Book contraindication.
            </div>
            {lateTraveller && (
              <Checkbox
                label="Departure within 10 days: explained that the certificate will not be valid in time, that the destination may refuse entry or quarantine, reinforced bite avoidance, and recorded the advice"
                checked={c.lateTravelAdviceGiven}
                onChange={(v) => set({ lateTravelAdviceGiven: v })}
                required
              />
            )}
            <Checkbox
              label="MMR given today, or planned for today"
              checked={c.mmrToday}
              onChange={(v) => set({ mmrToday: v })}
              description="Never on the same day. This is a stop: rebook."
            />
            <Checkbox
              label="MMR given in the last 28 days, or planned within the next 28 days (not today)"
              checked={c.mmrWithin28Days}
              onChange={(v) => set({ mmrWithin28Days: v, mmrWithin28DaysReason: v ? c.mmrWithin28DaysReason : "" })}
              description="Separate yellow fever and MMR by 28 days unless protection is needed rapidly, in which case record the reason and consider an additional MMR dose. Other vaccines may be given at any interval, at separate sites."
            />
            {c.mmrWithin28Days && !c.mmrToday && (
              <TextInput
                label="Reason for giving within 28 days of MMR (protection needed rapidly)"
                value={c.mmrWithin28DaysReason}
                onChange={(v) => set({ mmrWithin28DaysReason: v })}
                placeholder="e.g. departing in 12 days to a certificate-required destination; additional MMR dose advised"
                required
              />
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <p className="text-sm text-gray-600">
              Absolute contraindications. Any one of these means the vaccine
              must not be given. Where a certificate is required for entry, a
              Medical Letter of Exemption can be offered instead.
            </p>
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <Checkbox label="Confirmed anaphylaxis to a previous dose of yellow fever vaccine" checked={c.anaphylaxisPreviousYf} onChange={(v) => set({ anaphylaxisPreviousYf: v })} />
              <Checkbox label="Immediate-type (IgE-mediated) allergy to any component of the vaccine, not shown to be outgrown" checked={c.anaphylaxisComponent} onChange={(v) => set({ anaphylaxisComponent: v })} />
              <Checkbox label="Immediate-type (IgE-mediated) allergy to egg or chicken protein, not shown to be outgrown" checked={c.eggAnaphylaxis} onChange={(v) => set({ eggAnaphylaxis: v })} description="Refer to an allergy specialist or hospital-based clinic; do not vaccinate under this PGD." />
              <Checkbox label="History of thymus disorder (myasthenia gravis, thymoma) or thymectomy, including during cardiac surgery" checked={c.thymusDisorder} onChange={(v) => set({ thymusDisorder: v })} />
              <Checkbox label="First-degree relative with a serious adverse event following yellow fever vaccine (YEL-AVD or YEL-AND)" checked={c.familyHistorySae} onChange={(v) => set({ familyHistorySae: v })} />
              <Checkbox label="Primary or acquired immunodeficiency, or immunosuppressive therapy (see detail in the alert above)" checked={c.immunodeficiency} onChange={(v) => set({ immunodeficiency: v })} />
              <Checkbox label="Acute severe febrile illness today" checked={c.acuteFebrileIllness} onChange={(v) => set({ acuteFebrileIllness: v })} description="Postpone until recovered, allowing 10 days before travel for the certificate to become valid." />
              <Checkbox label="Pregnant" checked={c.pregnant} onChange={(v) => set({ pregnant: v })} description="Do not vaccinate under this PGD. Refer to a specialist yellow fever centre where travel is unavoidable; offer a Medical Letter of Exemption where a certificate is required." />
            </div>
          </div>
        );
      case STEP_PRECAUTIONS:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <p className="text-sm text-gray-600">
              Precautions. These do not automatically prevent vaccination, but
              they need a documented risk assessment and, in most cases,
              specialist advice from NaTHNaC on 020 7383 7474.
            </p>
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Checkbox label="Breastfeeding an infant under 9 months" checked={c.breastfeedingInfantUnder9m} onChange={(v) => set({ breastfeedingInfantUnder9m: v })} />
              <Checkbox label="Living with HIV" checked={c.hivPositive} onChange={(v) => set({ hivPositive: v })} />
              <Checkbox label="Low dose corticosteroid or non-biological oral immune modulating therapy" checked={c.lowDoseImmunomodulator} onChange={(v) => set({ lowDoseImmunomodulator: v })} />
            </div>
            {hasSpecialistPrecaution(c) && (
              <div className="space-y-3 p-4 rounded-lg border border-red-300 bg-red-50 text-sm">
                <p className="font-semibold text-red-900">Specialist advice needed before vaccinating</p>
                <p className="text-red-900">
                  A patient under these precautions where specialist advice
                  cannot be obtained before vaccination is excluded. Call
                  NaTHNaC on 020 7383 7474.
                </p>
                <Checkbox label="Specialist advice obtained and supports vaccination" checked={c.specialistAdviceObtained} onChange={(v) => set({ specialistAdviceObtained: v })} required />
                <TextInput label="Who gave the advice, and when" value={c.specialistAdviceDetails} onChange={(v) => set({ specialistAdviceDetails: v })} placeholder="e.g. NaTHNaC advice line, Dr X, 11/09/2026 14:20" required />
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="p-4 rounded-lg border border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 text-sm">
              <p className="font-semibold">Stamaril, yellow fever vaccine (live attenuated 17D-204 strain), powder and solvent for suspension for injection in a pre-filled syringe</p>
              <p className="mt-1">
                {YF_PGD_VERSION}. Reconstitute with the supplied solvent, mix
                gently, inspect visually, and administer immediately; discard
                any unused reconstituted vaccine. Give one 0.5 ml dose by
                subcutaneous injection, usually into the upper arm. Where given
                with other vaccines, use separate sites, preferably different
                limbs, or at least 2.5 cm apart, and record the site of each.
                Vaccinate at least 10 days before travel where a certificate is
                required.
              </p>
            </div>
            <Checkbox label="Adrenaline (epinephrine) 1 in 1,000 injection and a telephone are immediately available, with facilities and trained staff for anaphylaxis" checked={c.anaphylaxisKit} onChange={(v) => set({ anaphylaxisKit: v })} required />
            <SelectInput
              label="Dose"
              value={c.doseType}
              onChange={(v) => set({ doseType: v as Clinical["doseType"], reinforcingReason: v === "reinforcing" ? c.reinforcingReason : "" })}
              options={[
                { value: "", label: "Select..." },
                { value: "first", label: "First dose (single 0.5 ml dose; certificate then valid for life)" },
                { value: "reinforcing", label: "Reinforcing dose (Green Book chapter 35 group)" },
                { value: "booster", label: "Booster after 10 years for prolonged high-risk exposure" },
              ]}
              required
            />
            {c.doseType === "reinforcing" && (
              <SelectInput
                label="Reinforcing dose: which applied"
                value={c.reinforcingReason}
                onChange={(v) => set({ reinforcingReason: v })}
                options={[
                  { value: "", label: "Select..." },
                  { value: "first-dose-under-2", label: "First dose given when aged under 2 years" },
                  { value: "first-dose-pregnancy", label: "First dose given during pregnancy" },
                  { value: "first-dose-hiv", label: "First dose given while infected with HIV" },
                  { value: "first-dose-immunosuppressed", label: "First dose given while immunosuppressed" },
                  { value: "before-bmt", label: "First dose given before a bone marrow transplant" },
                ]}
                required
              />
            )}
            <TextInput label="Batch number" value={c.batchNumber} onChange={(v) => set({ batchNumber: v })} required />
            <TextInput label="Expiry date (MM/YYYY, must not be in the past)" value={c.expiryDate} onChange={(v) => set({ expiryDate: v })} placeholder="MM/YYYY" required />
            <SelectInput
              label="Route of administration"
              value={c.route}
              onChange={(v) => set({ route: v as Clinical["route"] })}
              options={[
                { value: "subcutaneous", label: "Subcutaneous (the PGD route)" },
                { value: "intramuscular", label: "Intramuscular (SmPC alternative; record the reason in the notes)" },
              ]}
              required
            />
            <TextInput label="Anatomical site" value={c.site} onChange={(v) => set({ site: v })} placeholder="e.g. left upper arm" required />
            <TextInput label="Other vaccines given at this visit and their sites (if any)" value={c.otherVaccinesSites} onChange={(v) => set({ otherVaccinesSites: v })} placeholder="e.g. Typhoid, right deltoid IM" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="print:hidden"><AlertBanner alerts={alerts} /></div>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg print:hidden">
              <Checkbox label="Observed for 15 minutes after vaccination, seated, and the observation period completed" checked={c.observationCompleted} onChange={(v) => set({ observationCompleted: v })} required />
              <Checkbox label="International Certificate of Vaccination or Prophylaxis (ICVP) issued, completed and signed in accordance with NaTHNaC requirements" checked={c.certificateIssued} onChange={(v) => set({ certificateIssued: v, certificateNotIssuedReason: v ? "" : c.certificateNotIssuedReason })} />
              {c.certificateIssued ? (
                <>
                  <TextInput label="Certificate number" value={c.certificateNumber} onChange={(v) => set({ certificateNumber: v })} required />
                  <TextInput label="Certificate valid from (10 days after this dose)" type="date" value={c.certificateValidFrom} onChange={(v) => set({ certificateValidFrom: v })} required />
                </>
              ) : (
                <TextInput label="Reason the certificate was not issued" value={c.certificateNotIssuedReason} onChange={(v) => set({ certificateNotIssuedReason: v })} placeholder="The PGD says to issue the ICVP. e.g. patient already holds a lifetime certificate; booster recorded on existing certificate" required />
              )}
              <Checkbox label="Explained the certificate becomes valid 10 days after this dose and then remains valid for life, and that a replacement can be obtained if lost" checked={c.validFromExplained} onChange={(v) => set({ validFromExplained: v })} />
              <Checkbox label="Marketing authorisation holder's patient information leaflet offered" checked={c.pilOffered} onChange={(v) => set({ pilOffered: v })} />
              <Checkbox label="Advised on possible adverse effects and their management, and to seek urgent medical attention for fever, jaundice or severe illness in the days and weeks after vaccination, mentioning the vaccine" checked={c.adverseEventAdvice} onChange={(v) => set({ adverseEventAdvice: v })} />
              <Checkbox label="Mosquito bite avoidance reinforced: it also protects against dengue, Zika, chikungunya and malaria, none of which this vaccine covers; malaria prophylaxis may still be required" checked={c.biteAvoidanceAdvice} onChange={(v) => set({ biteAvoidanceAdvice: v })} />
              <SelectInput
                label="Women of childbearing potential: advised to avoid pregnancy for one month after vaccination (Stamaril SmPC 4.6)"
                value={c.avoidPregnancyAdvice}
                onChange={(v) => set({ avoidPregnancyAdvice: v as Clinical["avoidPregnancyAdvice"] })}
                options={[
                  { value: "", label: "Select..." },
                  { value: "given", label: "Advice given and recorded" },
                  { value: "not-applicable", label: "Not applicable" },
                ]}
                required
              />
              <Checkbox label="GP informed, or will be informed, of this vaccination and any adverse reaction" checked={c.gpInformed} onChange={(v) => set({ gpInformed: v })} required />
              <Checkbox label="Medical Letter of Exemption discussed (where vaccination was not given and a certificate is required); acceptance is at the discretion of the destination country" checked={c.exemptionLetterDiscussed} onChange={(v) => set({ exemptionLetterDiscussed: v })} />
            </div>
            <div className="space-y-4 print:hidden">
              <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
              <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
              <TextArea label="Clinical notes, including any specialist advice received and from whom" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
            </div>
            {/* The printed record: this is what Save & Print prints. */}
            <YellowFeverSummaryReport patient={patient} consent={consent} clinical={c} summary={summary} alerts={alerts} ageMonths={ageMonths} />
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
            <ProgressBar stepLabels={STEP_LABELS} currentStep={step} onStepClick={(s) => { if (s < step) setStep(s); }} completedSteps={completed} hasErrors={!!validationError} />
          </div>
          <StepWrapper
            title={STEP_LABELS[step]}
            currentStep={step}
            totalSteps={STEP_LABELS.length}
            onNext={next}
            onPrev={prev}
            canProceed={canProceed}
            validationError={hasStops ? (validationError ?? "Exclusion criteria met: do not vaccinate under this PGD. Record the advice given and save as not supplied.") : validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={() => {
              setStep(0); setCompleted(new Set());
              setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent });
              setSummary(initialSummary()); setC(createEmptyClinical());
            }}
          >
            {stepBody()}
            {hasStops && step > 0 && (
              <div className="mt-6 space-y-3 p-4 rounded-lg border border-red-300 bg-red-50">
                <p className="text-sm font-semibold text-red-900">Not vaccinated: record the advice given</p>
                <p className="text-xs text-red-900">
                  The PGD requires the advice given to an excluded patient to be recorded, that a Medical Letter of
                  Exemption was offered where a certificate is required, and that the GP is informed. Complete the
                  items below and use &quot;Save as not supplied&quot;.
                </p>
                <Checkbox label="Explained why the vaccine cannot be given and what the alternatives are" checked={c.exclusionExplained} onChange={(v) => set({ exclusionExplained: v })} />
                {c.certificateRequired === "required" && (
                  <Checkbox label="Medical Letter of Exemption offered; explained that acceptance is at the discretion of the destination country" checked={c.exemptionLetterDiscussed} onChange={(v) => set({ exemptionLetterDiscussed: v })} />
                )}
                <Checkbox label="Mosquito bite avoidance reinforced (the only other protection against yellow fever)" checked={c.biteAvoidanceAdvice} onChange={(v) => set({ biteAvoidanceAdvice: v })} />
                <Checkbox label="Advised on alternative provision (GP practice or a specialist travel clinic)" checked={c.alternativeProvisionAdvised} onChange={(v) => set({ alternativeProvisionAdvised: v })} />
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

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
 */

const STEP_LABELS = [
  "Centre & Patient",
  "Consent",
  "Travel Risk",
  "Contraindications",
  "Precautions",
  "Administration",
  "Certificate & Summary",
] as const;

const STEP_PRECAUTIONS = 4;

interface Clinical {
  // Designation
  yfvcDesignated: boolean;
  yfvcCode: string;
  administeringClinician: string;
  // Travel
  destination: string;
  departureDate: string;
  certificateRequired: "required" | "recommended" | "not-required" | "";
  // Absolute contraindications
  anaphylaxisPreviousYf: boolean;
  anaphylaxisComponent: boolean;
  eggAnaphylaxis: boolean;
  thymusDisorder: boolean;
  familyHistorySae: boolean;
  immunodeficiency: boolean;
  acuteFebrileIllness: boolean;
  // Precautions
  pregnant: boolean;
  breastfeedingInfantUnder9m: boolean;
  hivPositive: boolean;
  lowDoseImmunomodulator: boolean;
  // Administration
  batchNumber: string;
  expiryDate: string;
  site: string;
  anaphylaxisKit: boolean;
  // Certificate and counselling
  certificateIssued: boolean;
  certificateNumber: string;
  validFromExplained: boolean;
  adverseEventAdvice: boolean;
  biteAvoidanceAdvice: boolean;
  exemptionLetterDiscussed: boolean;
}

const emptyClinical: Clinical = {
  yfvcDesignated: false, yfvcCode: "", administeringClinician: "",
  destination: "", departureDate: "", certificateRequired: "",
  anaphylaxisPreviousYf: false, anaphylaxisComponent: false, eggAnaphylaxis: false,
  thymusDisorder: false, familyHistorySae: false, immunodeficiency: false,
  acuteFebrileIllness: false,
  pregnant: false, breastfeedingInfantUnder9m: false, hivPositive: false,
  lowDoseImmunomodulator: false,
  batchNumber: "", expiryDate: "", site: "", anaphylaxisKit: false,
  certificateIssued: false, certificateNumber: "", validFromExplained: false,
  adverseEventAdvice: false, biteAvoidanceAdvice: false, exemptionLetterDiscussed: false,
};

export function YellowFeverClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>({ ...emptyClinical });
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
        message: "Confirmed anaphylaxis to a vaccine component, including egg",
        detail: "Stamaril is propagated in chick embryos. Egg allergy is a relative contraindication and some patients can be vaccinated in specialist centres; anaphylaxis to egg or another component is a hard stop here. Refer for specialist assessment and consider a Medical Letter of Exemption.",
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
        detail: "Live vaccine strains can replicate and cause extensive, severe and sometimes fatal infection. This covers leukaemia and lymphoma, severe HIV, cellular immune deficiencies, recent stem cell transplant, chemotherapy or radiotherapy within 6 months, solid organ transplant immunosuppression, biological therapy within 12 months, and high-dose steroids or oral immune modulating drugs within 3 months. Refer.",
      });
    if (c.acuteFebrileIllness)
      a.push({
        code: "febrile",
        severity: "stop",
        message: "Acute febrile illness, postpone",
        detail: "Defer until recovered and rebook, allowing 10 days before travel for the certificate to become valid.",
      });

    // ── Precautions: specialist advice, not automatic refusal ───────
    if (ageMonths !== null && ageMonths >= 6 && ageMonths < 9)
      a.push({
        code: "infant-6-8m",
        severity: "red-flag",
        message: "Infant aged 6 to 8 months",
        detail: "Vaccination is generally only recommended where the risk of transmission is high, such as during an outbreak, and travel is unavoidable. Seek specialist advice from NaTHNaC (020 7383 7474) before proceeding.",
      });
    if (age !== null && age >= 60)
      a.push({
        code: "over-60",
        severity: "caution",
        message: "Aged 60 years or over",
        detail: "The risk of YEL-AND and YEL-AVD rises with age, and almost all cases occur with a first dose. Vaccinate only where there is significant and unavoidable risk after a detailed risk assessment. Do not vaccinate for travel to areas where vaccination is not recommended by WHO.",
      });
    if (c.pregnant)
      a.push({
        code: "pregnancy",
        severity: "red-flag",
        message: "Pregnancy",
        detail: "Advise against travel to a yellow fever risk area. Vaccinate only after a detailed risk assessment where the benefit outweighs the theoretical risk of foetal infection from the live virus, and discuss with a specialist first. Revaccinate after pregnancy if risk continues.",
      });
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
  const hasSpecialistFlags = alerts.some((x) => x.severity === "red-flag" && x.code !== "no-kit");

  const validationError = useMemo(() => {
    switch (step) {
      case 0:
        if (!c.yfvcDesignated) return "Confirm this is a designated Yellow Fever Vaccination Centre";
        if (!c.yfvcCode.trim()) return "Please record the YFVC designation number";
        return validatePatientStep(patient);
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.destination.trim()) return "Please record the destination";
        if (!c.departureDate.trim()) return "Please record the departure date";
        if (!c.certificateRequired) return "Please record the certificate requirement for this destination";
        return null;
      case 3: return null;
      case STEP_PRECAUTIONS: return null;
      case 5:
        if (!c.anaphylaxisKit) return "Confirm the anaphylaxis kit is immediately available";
        if (!c.batchNumber.trim()) return "Please record the batch number";
        if (!c.expiryDate.trim()) return "Please record the expiry date";
        if (!c.site.trim()) return "Please record the anatomical site";
        return null;
      case 6:
        if (!c.validFromExplained || !c.adverseEventAdvice || !c.biteAvoidanceAdvice)
          return "Please confirm all counselling points";
        if (c.certificateIssued && !c.certificateNumber.trim())
          return "Please record the certificate number";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary]);

  const canProceed = !validationError && (!hasStops || step >= 5);
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: { patient, consent, clinical: c, alerts, ageMonths } as unknown as Record<string, unknown>,
    outcome: hasStops ? "not_supplied" : "completed",
    summary: {
      pharmacistName: summary.pharmacistName, pharmacistGPhC: summary.pharmacistGPhC,
      consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
    },
  });

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
            <TextInput label="Administering clinician" value={c.administeringClinician} onChange={(v) => set({ administeringClinician: v })} placeholder="Name and role" />
            <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />
          </div>
        );
      case 1:
        return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <TextInput label="Destination" value={c.destination} onChange={(v) => set({ destination: v })} placeholder="e.g. Ghana, Brazil (Minas Gerais)" required />
            <TextInput label="Departure date" value={c.departureDate} onChange={(v) => set({ departureDate: v })} placeholder="DD/MM/YYYY" required />
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
              consultation. Where vaccination is neither required nor
              recommended, and particularly in patients aged 60 and over, the
              risk of vaccination may outweigh the risk of disease.
            </div>
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
              <Checkbox label="Confirmed anaphylaxis to any vaccine component" checked={c.anaphylaxisComponent} onChange={(v) => set({ anaphylaxisComponent: v })} />
              <Checkbox label="Confirmed anaphylaxis to egg" checked={c.eggAnaphylaxis} onChange={(v) => set({ eggAnaphylaxis: v })} />
              <Checkbox label="History of thymus disorder (myasthenia gravis, thymoma) or thymectomy, including during cardiac surgery" checked={c.thymusDisorder} onChange={(v) => set({ thymusDisorder: v })} />
              <Checkbox label="First-degree relative with a serious adverse event following yellow fever vaccine (YEL-AVD or YEL-AND)" checked={c.familyHistorySae} onChange={(v) => set({ familyHistorySae: v })} />
              <Checkbox label="Primary or acquired immunodeficiency, or immunosuppressive therapy (see detail in the alert above)" checked={c.immunodeficiency} onChange={(v) => set({ immunodeficiency: v })} />
              <Checkbox label="Acute febrile illness today" checked={c.acuteFebrileIllness} onChange={(v) => set({ acuteFebrileIllness: v })} />
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
              <Checkbox label="Pregnant" checked={c.pregnant} onChange={(v) => set({ pregnant: v })} />
              <Checkbox label="Breastfeeding an infant under 9 months" checked={c.breastfeedingInfantUnder9m} onChange={(v) => set({ breastfeedingInfantUnder9m: v })} />
              <Checkbox label="Living with HIV" checked={c.hivPositive} onChange={(v) => set({ hivPositive: v })} />
              <Checkbox label="Low dose corticosteroid or non-biological oral immune modulating therapy" checked={c.lowDoseImmunomodulator} onChange={(v) => set({ lowDoseImmunomodulator: v })} />
            </div>
            {hasSpecialistFlags && (
              <div className="p-4 rounded-lg border border-red-300 bg-red-50 text-sm">
                <p className="font-semibold text-red-900">Specialist advice needed before vaccinating</p>
                <p className="text-red-900 mt-1">
                  Record the advice received and who gave it in the clinical
                  notes before proceeding. If advice cannot be obtained today,
                  do not vaccinate.
                </p>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="p-4 rounded-lg border border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 text-sm">
              <p className="font-semibold">Stamaril (yellow fever vaccine, live attenuated 17D-204)</p>
              <p className="mt-1">
                0.5 mL by subcutaneous injection after reconstitution with the
                supplied solvent. Use immediately after reconstitution. Give at
                least 10 days before travel, as the certificate is not valid
                until 10 days after a first dose.
              </p>
            </div>
            <Checkbox label="Adrenaline 1 in 1,000 and anaphylaxis facilities are immediately available" checked={c.anaphylaxisKit} onChange={(v) => set({ anaphylaxisKit: v })} />
            <TextInput label="Batch number" value={c.batchNumber} onChange={(v) => set({ batchNumber: v })} required />
            <TextInput label="Expiry date" value={c.expiryDate} onChange={(v) => set({ expiryDate: v })} placeholder="MM/YYYY" required />
            <TextInput label="Anatomical site" value={c.site} onChange={(v) => set({ site: v })} placeholder="e.g. left upper arm, subcutaneous" required />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="International Certificate of Vaccination or Prophylaxis (ICVP) issued" checked={c.certificateIssued} onChange={(v) => set({ certificateIssued: v })} />
              {c.certificateIssued && (
                <TextInput label="Certificate number" value={c.certificateNumber} onChange={(v) => set({ certificateNumber: v })} required />
              )}
              <Checkbox label="Explained the certificate becomes valid 10 days after a first dose and then remains valid for life" checked={c.validFromExplained} onChange={(v) => set({ validFromExplained: v })} />
              <Checkbox label="Advised on possible adverse effects and to seek urgent medical attention for fever, jaundice or severe illness in the weeks after vaccination, mentioning the vaccine" checked={c.adverseEventAdvice} onChange={(v) => set({ adverseEventAdvice: v })} />
              <Checkbox label="Mosquito bite avoidance advised, since the vaccine does not protect against other mosquito-borne disease" checked={c.biteAvoidanceAdvice} onChange={(v) => set({ biteAvoidanceAdvice: v })} />
              <Checkbox label="Medical Letter of Exemption discussed (where vaccination was not given and a certificate is required)" checked={c.exemptionLetterDiscussed} onChange={(v) => set({ exemptionLetterDiscussed: v })} />
            </div>
            <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
            <TextArea label="Clinical notes, including any specialist advice received and from whom" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
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
          <ProgressBar stepLabels={STEP_LABELS} currentStep={step} onStepClick={(s) => { if (completed.has(s) || s <= step) setStep(s); }} completedSteps={completed} hasErrors={!!validationError} />
          <StepWrapper
            title={STEP_LABELS[step]}
            currentStep={step}
            totalSteps={STEP_LABELS.length}
            onNext={next}
            onPrev={prev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops && step === 5}
            {...(step === STEP_LABELS.length - 1 ? {
              getConsultationData,
              onNewConsultation: () => {
                setStep(0); setCompleted(new Set());
                setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent });
                setSummary(initialSummary()); setC({ ...emptyClinical });
              },
            } : {})}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

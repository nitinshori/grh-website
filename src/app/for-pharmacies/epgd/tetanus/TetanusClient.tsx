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
 * Tetanus, Diphtheria and Polio ePGD (Td/IPV, Revaxis), signed 30 Jul 2026.
 * Faithful to the signed PGD: 10 years and over, single 0.5 ml intramuscular
 * dose. Covers the missed adolescent booster, incomplete or unknown history,
 * the travel booster where the last dose was over 10 years ago, and
 * tetanus-prone wounds where immunoglobulin is NOT indicated. Wounds needing
 * immunoglobulin, outbreak case and contact management, and pregnancy are
 * hard stops with referral.
 */

const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Indication",
  "History & Exclusions",
  "Administration",
  "Counselling & Summary",
] as const;

type Indication = "adolescent-booster" | "incomplete-history" | "travel" | "wound" | "";
type LastDose = "over-10" | "5-to-10" | "under-5" | "unknown" | "";

interface Clinical {
  indication: Indication;
  destination: string;
  lastDose: LastDose;
  dosesReceived: string;
  woundProne: boolean;
  immunoglobulinIndicated: boolean;
  outbreakContact: boolean;
  anaphylaxisPreviousDose: boolean;
  anaphylaxisComponent: boolean;
  acuteFebrileIllness: boolean;
  pregnant: boolean;
  neurologicalDeterioration: boolean;
  immunosuppressed: boolean;
  bleedingDisorder: boolean;
  allergies: string;
  batchNumber: string;
  expiryDate: string;
  site: string;
  anaphylaxisKit: boolean;
  courseAdvice: boolean;
  sideEffectAdvice: boolean;
  woundAdvice: boolean;
}

const emptyClinical: Clinical = {
  indication: "", destination: "", lastDose: "", dosesReceived: "",
  woundProne: false, immunoglobulinIndicated: false, outbreakContact: false,
  anaphylaxisPreviousDose: false, anaphylaxisComponent: false, acuteFebrileIllness: false,
  pregnant: false, neurologicalDeterioration: false, immunosuppressed: false, bleedingDisorder: false,
  allergies: "", batchNumber: "", expiryDate: "", site: "", anaphylaxisKit: false,
  courseAdvice: false, sideEffectAdvice: false, woundAdvice: false,
};

export default function TetanusClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>({ ...emptyClinical });
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    const age = patient.age;

    if (age !== null && age < 10)
      a.push({
        code: "under-10",
        severity: "stop",
        message: "Under 10 years is excluded from this PGD",
        detail: "Refer to the GP or an immunisation service for an age-appropriate vaccine (DTaP/IPV/Hib/HepB or dTaP/IPV).",
      });
    if (c.anaphylaxisPreviousDose)
      a.push({
        code: "anaphylaxis-previous",
        severity: "stop",
        message: "Confirmed anaphylaxis to a previous diphtheria, tetanus or polio containing vaccine",
        detail: "Excluded from this PGD, including conjugate vaccines using diphtheria or tetanus toxoid as the carrier. Refer to the GP.",
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
        detail: "A minor infection without fever is not a contraindication. Advise when to return and arrange another appointment.",
      });
    if (c.pregnant)
      a.push({
        code: "pregnancy",
        severity: "stop",
        message: "Pregnancy is excluded from this PGD",
        detail: "From week 16 a pertussis-containing vaccine is routinely indicated instead. Refer to the GP or midwife.",
      });
    if (c.immunoglobulinIndicated)
      a.push({
        code: "immunoglobulin",
        severity: "stop",
        message: "Tetanus immunoglobulin indicated, outside this PGD",
        detail: "Arrange same-day medical assessment. Do not delay. Immunoglobulin cannot be supplied under this PGD.",
      });
    if (c.outbreakContact)
      a.push({
        code: "outbreak",
        severity: "stop",
        message: "Case or contact in a diphtheria or polio outbreak",
        detail: "Must be managed by the local Health Protection Team. Outside this PGD.",
      });

    // Indication-specific logic
    if (c.indication === "travel" && c.lastDose === "under-5")
      a.push({
        code: "travel-not-due",
        severity: "caution",
        message: "Booster not indicated for travel",
        detail: "The last dose was under 5 years ago. A travel booster is indicated only where the last relevant dose was more than 10 years ago. Give reassurance and wound care advice instead.",
      });
    if (c.indication === "travel" && c.lastDose === "5-to-10")
      a.push({
        code: "travel-interval",
        severity: "caution",
        message: "Check the interval before supply",
        detail: "A travel booster is indicated where the last relevant dose was more than 10 years ago. Where the interval is 5 to 10 years, confirm the destination risk against TravelHealthPro before proceeding.",
      });
    if (c.indication === "wound" && !c.woundProne)
      a.push({
        code: "wound-not-prone",
        severity: "caution",
        message: "Confirm the wound is tetanus-prone",
        detail: "Reinforcing doses under this PGD are for tetanus-prone wounds as described in Green Book chapter 30. Assess the wound and refer if there is any doubt.",
      });
    if (c.indication === "incomplete-history")
      a.push({
        code: "primary-course",
        severity: "caution",
        message: "Primary course required",
        detail: "Where there is no reliable history, assume unimmunised: 3 doses one month apart, then boosters at 5 and 10 year intervals. Book the follow-up doses today and inform the GP.",
      });

    if (c.neurologicalDeterioration)
      a.push({
        code: "neuro",
        severity: "caution",
        message: "Current neurological deterioration",
        detail: "Consider deferring so that any change is not incorrectly attributed to the vaccine. Balance against the risk of preventable infection and seek advice.",
      });
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
        detail: "Intramuscular vaccination is appropriate where assessed as safe: use a 23 gauge or finer needle, apply firm pressure without rubbing for at least 2 minutes, and advise on the risk of haematoma.",
      });
    if (!c.anaphylaxisKit && step >= 4)
      a.push({
        code: "no-kit",
        severity: "red-flag",
        message: "Anaphylaxis kit not confirmed",
        detail: "Adrenaline 1 in 1,000 injection and a telephone must be immediately available before any vaccine is given.",
      });

    return a;
  }, [patient.age, c, step]);

  const hasStops = alerts.some((x) => x.severity === "stop");

  const doseText = useMemo(() => {
    if (c.indication === "incomplete-history")
      return "Revaxis 0.5 ml intramuscular. First of a 3 dose primary course, doses one month apart. First booster at least 5 years after the third dose, second booster a minimum of 5 and ideally 10 years after the first.";
    return "Revaxis 0.5 ml intramuscular, single dose into the deltoid muscle of the upper arm.";
  }, [c.indication]);

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 10 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.indication) return "Please select the indication";
        if (c.indication === "travel" && !c.destination.trim()) return "Please record the destination";
        if (!c.lastDose) return "Please record when the last tetanus-containing dose was given";
        return null;
      case 3:
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        return null;
      case 4:
        if (!c.anaphylaxisKit) return "Confirm the anaphylaxis kit is immediately available";
        if (!c.batchNumber.trim()) return "Please record the batch number";
        if (!c.expiryDate.trim()) return "Please record the expiry date";
        if (!c.site.trim()) return "Please record the anatomical site";
        return null;
      case 5:
        if (!c.courseAdvice || !c.sideEffectAdvice || !c.woundAdvice) return "Please confirm all counselling points";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary]);

  const canProceed = !validationError && (!hasStops || step >= 4);
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: { patient, consent, clinical: c, alerts, dose: doseText } as unknown as Record<string, unknown>,
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
        return <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />;
      case 1:
        return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Indication" value={c.indication} onChange={(v) => set({ indication: v as Indication })}
              options={[
                { value: "adolescent-booster", label: "Adolescent booster (missed or due, usually 13 to 18 years)" },
                { value: "incomplete-history", label: "No history, or incomplete or unknown history" },
                { value: "travel", label: "Travel to an endemic or epidemic area, or where medical care may not be accessible" },
                { value: "wound", label: "Tetanus-prone wound, reinforcing dose" },
              ]} required />
            {c.indication === "travel" && (
              <TextInput label="Destination and travel dates" value={c.destination} onChange={(v) => set({ destination: v })} placeholder="e.g. rural Nepal, departing 12 Sep" required />
            )}
            <SelectInput label="Last tetanus-containing dose" value={c.lastDose} onChange={(v) => set({ lastDose: v as LastDose })}
              options={[
                { value: "over-10", label: "More than 10 years ago" },
                { value: "5-to-10", label: "5 to 10 years ago" },
                { value: "under-5", label: "Less than 5 years ago" },
                { value: "unknown", label: "Unknown or uncertain" },
              ]} required />
            <TextInput label="Number of previous doses documented (if known)" value={c.dosesReceived} onChange={(v) => set({ dosesReceived: v })} placeholder="e.g. 5, or unknown" />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              A travel booster is indicated where the last relevant dose was more than 10 years ago, even where 5 doses have previously been received. Some countries require proof of polio vaccination within the previous 12 months, check TravelHealthPro for the destination.
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
              <Checkbox label="Confirmed anaphylaxis to a previous diphtheria, tetanus or polio containing vaccine" checked={c.anaphylaxisPreviousDose} onChange={(v) => set({ anaphylaxisPreviousDose: v })} />
              <Checkbox label="Confirmed anaphylaxis to a vaccine component (neomycin, streptomycin, polymyxin B)" checked={c.anaphylaxisComponent} onChange={(v) => set({ anaphylaxisComponent: v })} />
              <Checkbox label="Acute severe febrile illness" checked={c.acuteFebrileIllness} onChange={(v) => set({ acuteFebrileIllness: v })} />
              <Checkbox label="Pregnant" checked={c.pregnant} onChange={(v) => set({ pregnant: v })} />
              <Checkbox label="Tetanus immunoglobulin indicated for this wound" checked={c.immunoglobulinIndicated} onChange={(v) => set({ immunoglobulinIndicated: v })} />
              <Checkbox label="Case or contact in a diphtheria or polio outbreak" checked={c.outbreakContact} onChange={(v) => set({ outbreakContact: v })} />
            </div>
            {c.indication === "wound" && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-800">Wound assessment</p>
                <Checkbox label="Wound is tetanus-prone (Green Book chapter 30)" checked={c.woundProne} onChange={(v) => set({ woundProne: v })} />
              </div>
            )}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700">Cautions</p>
              <Checkbox label="Current neurological deterioration" checked={c.neurologicalDeterioration} onChange={(v) => set({ neurologicalDeterioration: v })} />
              <Checkbox label="Immunosuppressed" checked={c.immunosuppressed} onChange={(v) => set({ immunosuppressed: v })} />
              <Checkbox label="Bleeding disorder or anticoagulation" checked={c.bleedingDisorder} onChange={(v) => set({ bleedingDisorder: v })} />
            </div>
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              Revaxis contains approximately 10 micrograms of phenylalanine per 0.5 ml dose. The NSPKU advises this amount is negligible and that individuals with phenylketonuria should take up the offer of immunisation.
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
              <p className="mt-2">Shake the pre-filled syringe well before use. Inspect visually and do not administer if the appearance differs from a cloudy white suspension. Where given with other vaccines, use separate sites, preferably different limbs, or at least 2.5 cm apart.</p>
            </div>
            <Checkbox label="Adrenaline 1 in 1,000 and anaphylaxis facilities are immediately available" checked={c.anaphylaxisKit} onChange={(v) => set({ anaphylaxisKit: v })} />
            <TextInput label="Batch number" value={c.batchNumber} onChange={(v) => set({ batchNumber: v })} required />
            <TextInput label="Expiry date" value={c.expiryDate} onChange={(v) => set({ expiryDate: v })} placeholder="MM/YYYY" required />
            <TextInput label="Anatomical site" value={c.site} onChange={(v) => set({ site: v })} placeholder="e.g. left deltoid" required />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Advised when any further doses are due, and that the course should be completed" checked={c.courseAdvice} onChange={(v) => set({ courseAdvice: v })} />
              <Checkbox label="Side effects and their management explained, including Yellow Card reporting" checked={c.sideEffectAdvice} onChange={(v) => set({ sideEffectAdvice: v })} />
              <Checkbox label="Advised that any future tetanus-prone wound needs medical assessment regardless of immunisation status" checked={c.woundAdvice} onChange={(v) => set({ woundAdvice: v })} />
            </div>
            <TextInput label="Pharmacist name" value={summary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
            <TextInput label="GPhC registration number" value={summary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
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
            isBlocked={hasStops && step === 4}
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

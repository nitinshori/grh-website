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
 * Psoriasis ePGD (PPH-signed PGD, J. Wilkins): calcipotriol/betamethasone
 * for mild-to-moderate plaque psoriasis in adults 18+. Facial, genital
 * and flexural psoriasis excluded; max calcipotriol 5 mg/week equivalents
 * (15 g/day, 100 g/week); review at 4 weeks.
 */

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

interface Clinical {
  confirmedPlaque: boolean;
  extentPercent: string;
  sites: string;
  faceGenitalFlexural: boolean;
  extensiveNeedsSystemic: boolean;
  otherSkinConditions: boolean;
  phototherapyOrImmunosuppressed: boolean;
  pregnantOrBreastfeeding: boolean;
  componentAllergy: boolean;
  calciumDisorder: boolean;
  allergies: string;
  product: "calcipotriol-betamethasone" | "calcipotriol" | "";
  quantity: string;
  applicationAdvice: boolean;
  maxDoseAdvice: boolean;
  reviewAdvice: boolean;
}

export default function PsoriasisClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const blank: Clinical = {
    confirmedPlaque: false, extentPercent: "", sites: "", faceGenitalFlexural: false,
    extensiveNeedsSystemic: false, otherSkinConditions: false, phototherapyOrImmunosuppressed: false,
    pregnantOrBreastfeeding: false, componentAllergy: false, calciumDisorder: false, allergies: "",
    product: "", quantity: "", applicationAdvice: false, maxDoseAdvice: false, reviewAdvice: false,
  };
  const [c, setC] = useState<Clinical>(blank);
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    if (patient.age !== null && patient.age < 18)
      a.push({ code: "under-18", severity: "stop", message: "Under 18 — excluded from this PGD", detail: "Refer to the GP or dermatology." });
    if (c.faceGenitalFlexural)
      a.push({ code: "site-excluded", severity: "stop", message: "Facial, genital or flexural psoriasis — excluded", detail: "These sites need alternative treatment; refer." });
    if (c.extensiveNeedsSystemic)
      a.push({ code: "extensive", severity: "stop", message: "Extensive psoriasis requiring systemic treatment", detail: "Refer to the GP or dermatology." });
    if (c.otherSkinConditions)
      a.push({ code: "other-conditions", severity: "stop", message: "Coexisting infective/other skin conditions at the site", detail: "Viral, fungal or bacterial infection, rosacea or acne at the treatment site excludes supply." });
    if (c.phototherapyOrImmunosuppressed)
      a.push({ code: "phototherapy", severity: "stop", message: "Current phototherapy or systemic immunosuppression", detail: "Excluded; refer to the treating team." });
    if (c.pregnantOrBreastfeeding)
      a.push({ code: "pregnancy", severity: "stop", message: "Pregnancy or breastfeeding — excluded", detail: "Refer to the GP." });
    if (c.componentAllergy)
      a.push({ code: "allergy", severity: "stop", message: "Hypersensitivity to calcipotriol/betamethasone", detail: "Excluded; refer." });
    if (c.calciumDisorder)
      a.push({ code: "calcium", severity: "caution", message: "Disorder of calcium metabolism", detail: "Calcipotriol caution — confirm suitability before supply; observe maximum weekly amounts strictly." });
    return a;
  }, [patient.age, c]);
  const hasStops = alerts.some((x) => x.severity === "stop");

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 18 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.confirmedPlaque) return "Please confirm the diagnosis of mild-to-moderate plaque psoriasis";
        if (!c.sites.trim()) return "Please record the affected sites";
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        return null;
      case 3:
        if (!c.product) return "Please select the treatment";
        if (!c.quantity.trim()) return "Please record the quantity supplied";
        return null;
      case 4:
        if (!c.applicationAdvice || !c.maxDoseAdvice || !c.reviewAdvice) return "Please confirm all counselling points";
        return validateSummaryStep(summary);
      default: return null;
    }
  }, [step, patient, consent, c, summary]);

  const canProceed = !validationError && (!hasStops || step >= 3);
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice,
    },
    clinicalData: { patient, consent, clinical: c, alerts } as unknown as Record<string, unknown>,
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
      case 0: return <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={true} />;
      case 1: return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <Checkbox label="Confirmed mild-to-moderate plaque psoriasis (first presentation, or repeat supply with previous appropriate response)" checked={c.confirmedPlaque} onChange={(v) => set({ confirmedPlaque: v })} />
            <TextInput label="Affected sites" value={c.sites} onChange={(v) => set({ sites: v })} placeholder="e.g. extensor elbows and knees" required />
            <TextInput label="Approximate extent (% body surface)" value={c.extentPercent} onChange={(v) => set({ extentPercent: v })} placeholder="e.g. 3%" />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <Checkbox label="Facial, genital or flexural involvement" checked={c.faceGenitalFlexural} onChange={(v) => set({ faceGenitalFlexural: v })} />
              <Checkbox label="Extensive disease likely to need systemic treatment" checked={c.extensiveNeedsSystemic} onChange={(v) => set({ extensiveNeedsSystemic: v })} />
              <Checkbox label="Other skin conditions at the site (infection, rosacea, acne)" checked={c.otherSkinConditions} onChange={(v) => set({ otherSkinConditions: v })} />
              <Checkbox label="Current phototherapy or systemic immunosuppressants" checked={c.phototherapyOrImmunosuppressed} onChange={(v) => set({ phototherapyOrImmunosuppressed: v })} />
              <Checkbox label="Pregnant or breastfeeding" checked={c.pregnantOrBreastfeeding} onChange={(v) => set({ pregnantOrBreastfeeding: v })} />
              <Checkbox label="Hypersensitivity to calcipotriol / betamethasone / components" checked={c.componentAllergy} onChange={(v) => set({ componentAllergy: v })} />
              <Checkbox label="Disorder of calcium metabolism" checked={c.calciumDisorder} onChange={(v) => set({ calciumDisorder: v })} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Treatment" value={c.product} onChange={(v) => set({ product: v as Clinical["product"] })}
              options={[
                { value: "calcipotriol-betamethasone", label: "Calcipotriol + betamethasone (Dovobet-type) — once daily" },
                { value: "calcipotriol", label: "Calcipotriol alone — once or twice daily" },
              ]} required />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              {c.product === "calcipotriol" ?
                "Apply twice daily initially (morning and evening); may reduce to once daily as it improves." :
                "Apply once daily to affected areas."} Maximum calcipotriol 5 mg/week: no more than 15 g per day, 100 g per week, and no more than 30% of body surface. Review response at 4 weeks.
            </div>
            <TextInput label="Quantity supplied" value={c.quantity} onChange={(v) => set({ quantity: v })} placeholder="e.g. one 60 g tube" required />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Application advice given (thin layer to plaques only, wash hands, avoid face/flexures)" checked={c.applicationAdvice} onChange={(v) => set({ applicationAdvice: v })} />
              <Checkbox label="Maximum amounts explained (15 g/day, 100 g/week, under 30% body surface)" checked={c.maxDoseAdvice} onChange={(v) => set({ maxDoseAdvice: v })} />
              <Checkbox label="Review at 4 weeks; seek advice sooner if worsening or skin thinning/irritation" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
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

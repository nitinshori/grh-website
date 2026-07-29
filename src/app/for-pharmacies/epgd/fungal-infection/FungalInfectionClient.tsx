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
 * Fungal Skin Infection ePGD (PPH-signed PGD, J. Wilkins):
 * miconazole 2% cream for superficial fungal infection (athlete's foot,
 * ringworm) 16+; Trimovate for localised inflamed skin with suspected
 * mixed fungal/bacterial involvement, 18+, short course only.
 */

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

interface Clinical {
  presentation: string;
  site: string;
  brokenOozing: boolean;
  nailOrScalp: boolean;
  systemic: boolean;
  pregnantOrBreastfeeding: boolean;
  miconazoleAllergy: boolean;
  steroidOrTrimovateAllergy: boolean;
  allergies: string;
  product: "miconazole" | "trimovate" | "";
  quantity: string;
  completeCourse: boolean;
  applicationAdvice: boolean;
  reviewAdvice: boolean;
}

export default function FungalInfectionClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>({
    presentation: "", site: "", brokenOozing: false, nailOrScalp: false, systemic: false,
    pregnantOrBreastfeeding: false, miconazoleAllergy: false, steroidOrTrimovateAllergy: false,
    allergies: "", product: "", quantity: "", completeCourse: false, applicationAdvice: false, reviewAdvice: false,
  });
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    const age = patient.age;
    if (age !== null && age < 16)
      a.push({ code: "under-16", severity: "stop", message: "Under 16 — excluded from this PGD", detail: "Refer to the GP." });
    if (c.product === "trimovate" && age !== null && age < 18)
      a.push({ code: "trimovate-under-18", severity: "stop", message: "Trimovate is 18+ under this PGD", detail: "Select miconazole (16+) or refer." });
    if (c.nailOrScalp)
      a.push({ code: "nail-scalp", severity: "stop", message: "Nail or scalp infection — excluded", detail: "Needs systemic or alternative treatment; refer to the GP." });
    if (c.brokenOozing)
      a.push({ code: "broken-skin", severity: "stop", message: "Infected, broken or oozing skin — excluded", detail: "Topical antifungal inappropriate; refer." });
    if (c.systemic)
      a.push({ code: "systemic", severity: "stop", message: "Signs of systemic infection — excluded", detail: "Refer urgently." });
    if (c.pregnantOrBreastfeeding)
      a.push({ code: "pregnancy", severity: "stop", message: "Pregnancy or breastfeeding — excluded unless prescriber-approved", detail: "Refer to the GP." });
    if (c.product === "miconazole" && c.miconazoleAllergy)
      a.push({ code: "mic-allergy", severity: "stop", message: "Miconazole hypersensitivity", detail: "Select an alternative or refer." });
    if (c.product === "trimovate" && c.steroidOrTrimovateAllergy)
      a.push({ code: "trim-allergy", severity: "stop", message: "Hypersensitivity to Trimovate components", detail: "Corticosteroid, nystatin or oxytetracycline allergy excludes Trimovate." });
    return a;
  }, [patient.age, c]);
  const hasStops = alerts.some((x) => x.severity === "stop");

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 16 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.presentation) return "Please select the presentation";
        if (!c.site.trim()) return "Please describe the affected site";
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        return null;
      case 3:
        if (!c.product) return "Please select the treatment";
        if (!c.quantity.trim()) return "Please record the quantity supplied";
        return null;
      case 4:
        if (!c.completeCourse || !c.applicationAdvice || !c.reviewAdvice) return "Please confirm all counselling points";
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
      case 0:
        return <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />;
      case 1:
        return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Presentation" value={c.presentation} onChange={(v) => set({ presentation: v })}
              options={[
                { value: "athletes-foot", label: "Athlete's foot (tinea pedis)" },
                { value: "ringworm", label: "Ringworm (tinea corporis)" },
                { value: "other-superficial", label: "Other superficial fungal infection" },
                { value: "inflamed-mixed", label: "Localised inflamed skin, suspected mixed fungal/bacterial (Trimovate pathway, 18+)" },
              ]} required />
            <TextInput label="Affected site" value={c.site} onChange={(v) => set({ site: v })} placeholder="e.g. web spaces both feet" required />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <Checkbox label="Nail or scalp involvement" checked={c.nailOrScalp} onChange={(v) => set({ nailOrScalp: v })} />
              <Checkbox label="Infected, broken or oozing skin" checked={c.brokenOozing} onChange={(v) => set({ brokenOozing: v })} />
              <Checkbox label="Signs of systemic infection / patient unwell" checked={c.systemic} onChange={(v) => set({ systemic: v })} />
              <Checkbox label="Pregnant or breastfeeding" checked={c.pregnantOrBreastfeeding} onChange={(v) => set({ pregnantOrBreastfeeding: v })} />
              <Checkbox label="Miconazole allergy" checked={c.miconazoleAllergy} onChange={(v) => set({ miconazoleAllergy: v })} />
              <Checkbox label="Allergy to corticosteroids / nystatin / oxytetracycline" checked={c.steroidOrTrimovateAllergy} onChange={(v) => set({ steroidOrTrimovateAllergy: v })} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Treatment" value={c.product} onChange={(v) => set({ product: v as Clinical["product"] })}
              options={[
                { value: "miconazole", label: "Miconazole 2% cream (16+)" },
                { value: "trimovate", label: "Trimovate cream (18+, short course)" },
              ]} required />
            {c.product === "miconazole" && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
                Apply thinly twice daily. Continue for at least 7 days after lesions have healed. Avoid eyes and mucous membranes.
              </div>
            )}
            {c.product === "trimovate" && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
                Apply thinly once or twice daily. Maximum 7–10 days continuous use; one 30 g tube per course. Not for face, broken skin or long-term use.
              </div>
            )}
            <TextInput label="Quantity supplied" value={c.quantity} onChange={(v) => set({ quantity: v })} placeholder="e.g. one 30 g tube" required />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Complete the course (continue miconazole 7+ days after healing / respect Trimovate 7–10 day maximum)" checked={c.completeCourse} onChange={(v) => set({ completeCourse: v })} />
              <Checkbox label="Application advice given (thin layer, wash hands, avoid eyes, keep area clean and dry)" checked={c.applicationAdvice} onChange={(v) => set({ applicationAdvice: v })} />
              <Checkbox label="Review advice given (see GP if no better in 2 weeks, or sooner if worsening/spreading)" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
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
            isBlocked={hasStops && step === 3}
            {...(step === STEP_LABELS.length - 1 ? { getConsultationData, onNewConsultation: () => { setStep(0); setCompleted(new Set()); setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent }); setSummary(initialSummary()); setC({ presentation: "", site: "", brokenOozing: false, nailOrScalp: false, systemic: false, pregnantOrBreastfeeding: false, miconazoleAllergy: false, steroidOrTrimovateAllergy: false, allergies: "", product: "", quantity: "", completeCourse: false, applicationAdvice: false, reviewAdvice: false }); } } : {})}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

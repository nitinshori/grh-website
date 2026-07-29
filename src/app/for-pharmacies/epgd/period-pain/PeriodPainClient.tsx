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
 * Period Pain ePGD (PPH-signed PGD, J. Wilkins): naproxen or mefenamic
 * acid for primary dysmenorrhoea in females aged 16+. NSAID exclusions
 * enforced as hard stops (ulcer/GI bleed history, NSAID/aspirin
 * hypersensitivity, severe hepatic/renal/cardiac impairment, other
 * NSAIDs or anticoagulants, coagulation disorders, pregnancy,
 * breastfeeding).
 */

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

interface Clinical {
  primaryDysmenorrhoea: boolean;
  redFlagSymptoms: boolean; // abnormal bleeding, fever, suspected secondary cause
  pregnantOrSuspected: boolean;
  breastfeeding: boolean;
  ulcerOrGIBleed: boolean;
  nsaidHypersensitivity: boolean;
  severeOrganImpairment: boolean;
  otherNsaidsOrAnticoagulants: boolean;
  coagulationDisorder: boolean;
  interactingMedicines: boolean;
  asthma: boolean; // caution — NSAID-sensitive asthma
  allergies: string;
  product: "naproxen" | "mefenamic-acid" | "";
  quantity: string;
  withFoodAdvice: boolean;
  maxDoseAdvice: boolean;
  reviewAdvice: boolean;
}

export default function PeriodPainClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const blank: Clinical = {
    primaryDysmenorrhoea: false, redFlagSymptoms: false, pregnantOrSuspected: false, breastfeeding: false,
    ulcerOrGIBleed: false, nsaidHypersensitivity: false, severeOrganImpairment: false,
    otherNsaidsOrAnticoagulants: false, coagulationDisorder: false, interactingMedicines: false,
    asthma: false, allergies: "", product: "", quantity: "",
    withFoodAdvice: false, maxDoseAdvice: false, reviewAdvice: false,
  };
  const [c, setC] = useState<Clinical>(blank);
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    if (patient.age !== null && patient.age < 16)
      a.push({ code: "under-16", severity: "stop", message: "Under 16 — excluded from this PGD", detail: "Refer to the GP." });
    if (c.redFlagSymptoms)
      a.push({ code: "red-flags", severity: "stop", message: "Features suggesting secondary cause", detail: "Abnormal bleeding, fever, or atypical features need GP assessment, not PGD supply." });
    if (c.pregnantOrSuspected)
      a.push({ code: "pregnancy", severity: "stop", message: "Known or suspected pregnancy — excluded", detail: "NSAIDs are excluded; refer to the GP or midwife." });
    if (c.breastfeeding)
      a.push({ code: "breastfeeding", severity: "stop", message: "Breastfeeding — excluded", detail: "Refer to the GP." });
    if (c.ulcerOrGIBleed)
      a.push({ code: "gi-history", severity: "stop", message: "History of peptic ulcer or GI bleeding — excluded", detail: "NSAIDs contraindicated; refer." });
    if (c.nsaidHypersensitivity)
      a.push({ code: "nsaid-allergy", severity: "stop", message: "NSAID/aspirin hypersensitivity — excluded", detail: "Refer for alternative management." });
    if (c.severeOrganImpairment)
      a.push({ code: "organ-impairment", severity: "stop", message: "Severe hepatic, renal or cardiac impairment — excluded", detail: "Refer to the GP." });
    if (c.otherNsaidsOrAnticoagulants)
      a.push({ code: "nsaid-anticoag", severity: "stop", message: "Concurrent NSAIDs (incl. aspirin) or anticoagulants — excluded", detail: "Bleeding risk; refer to the GP." });
    if (c.coagulationDisorder)
      a.push({ code: "coagulation", severity: "stop", message: "Coagulation disorder or haemostasis-interfering therapy — excluded", detail: "Refer to the GP." });
    if (c.interactingMedicines)
      a.push({ code: "interaction", severity: "stop", message: "Clinically significant interacting medication", detail: "Excluded from this PGD; refer." });
    if (c.asthma)
      a.push({ code: "asthma", severity: "caution", message: "Asthma — NSAID caution", detail: "Confirm no previous NSAID-triggered bronchospasm; counsel to stop and seek help if wheeze develops." });
    return a;
  }, [patient.age, c]);
  const hasStops = alerts.some((x) => x.severity === "stop");

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 16 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.primaryDysmenorrhoea) return "Please confirm the presentation is primary dysmenorrhoea";
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        return null;
      case 3:
        if (!c.product) return "Please select the treatment";
        if (!c.quantity.trim()) return "Please record the quantity supplied";
        return null;
      case 4:
        if (!c.withFoodAdvice || !c.maxDoseAdvice || !c.reviewAdvice) return "Please confirm all counselling points";
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
      case 0: return <PatientDetailsStep patient={patient} onChange={onPatientChange} requireAdult={false} />;
      case 1: return <ConsentStep consent={consent} onChange={(f, v) => setConsent((p) => ({ ...p, [f]: v }))} />;
      case 2:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <Checkbox label="Presentation consistent with primary dysmenorrhoea (cyclical pain around menstruation, no red flags)" checked={c.primaryDysmenorrhoea} onChange={(v) => set({ primaryDysmenorrhoea: v })} />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <Checkbox label="Red flags: abnormal bleeding, fever, pain outside menses, suspected secondary cause" checked={c.redFlagSymptoms} onChange={(v) => set({ redFlagSymptoms: v })} />
              <Checkbox label="Known or suspected pregnancy" checked={c.pregnantOrSuspected} onChange={(v) => set({ pregnantOrSuspected: v })} />
              <Checkbox label="Breastfeeding" checked={c.breastfeeding} onChange={(v) => set({ breastfeeding: v })} />
              <Checkbox label="History of peptic ulcer disease or GI bleeding" checked={c.ulcerOrGIBleed} onChange={(v) => set({ ulcerOrGIBleed: v })} />
              <Checkbox label="NSAID or aspirin hypersensitivity" checked={c.nsaidHypersensitivity} onChange={(v) => set({ nsaidHypersensitivity: v })} />
              <Checkbox label="Severe hepatic, renal or cardiac impairment" checked={c.severeOrganImpairment} onChange={(v) => set({ severeOrganImpairment: v })} />
              <Checkbox label="Taking other NSAIDs (incl. aspirin) or anticoagulants" checked={c.otherNsaidsOrAnticoagulants} onChange={(v) => set({ otherNsaidsOrAnticoagulants: v })} />
              <Checkbox label="Coagulation disorder or therapy affecting haemostasis" checked={c.coagulationDisorder} onChange={(v) => set({ coagulationDisorder: v })} />
              <Checkbox label="Clinically significant interacting medication" checked={c.interactingMedicines} onChange={(v) => set({ interactingMedicines: v })} />
              <Checkbox label="Asthma" checked={c.asthma} onChange={(v) => set({ asthma: v })} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Treatment" value={c.product} onChange={(v) => set({ product: v as Clinical["product"] })}
              options={[
                { value: "naproxen", label: "Naproxen" },
                { value: "mefenamic-acid", label: "Mefenamic acid" },
              ]} required />
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              {c.product === "naproxen" &&
                "Naproxen: 500 mg initially, then 250 mg every 6–8 hours as needed. Maximum 1250 mg on day 1, then up to 1000 mg daily. Supply: 28 x 250 mg tablets or 14 x 500 mg tablets."}
              {c.product === "mefenamic-acid" &&
                "Mefenamic acid: 500 mg three times a day. Do not exceed the stated dose. Supply: 60 x 250 mg capsules or 30 x 500 mg tablets."}
              {!c.product && "Select a treatment to see the dosing summary."}
            </div>
            <TextInput label="Quantity supplied" value={c.quantity} onChange={(v) => set({ quantity: v })} placeholder="e.g. 28 x 250 mg tablets" required />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Take with or after food; stop and seek advice if indigestion, black stools or vomiting blood" checked={c.withFoodAdvice} onChange={(v) => set({ withFoodAdvice: v })} />
              <Checkbox label="Maximum daily dose explained; use for the shortest time needed" checked={c.maxDoseAdvice} onChange={(v) => set({ maxDoseAdvice: v })} />
              <Checkbox label="See the GP if pain is not controlled, worsening, or bleeding pattern changes" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
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

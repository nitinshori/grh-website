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
import { TextInput, Checkbox, TextArea } from "../shared/components/FormInputs";

/**
 * Junior Travel Vaccines ePGD, signed 30 Jul 2026. Children and young people
 * aged 12 months to 17 years inclusive. Each vaccine carries its own licensed
 * minimum age and dose, which the tool enforces against the child's age: a
 * vaccine selected below its minimum age becomes a hard stop, and the dose
 * shown is the age-correct one (Ixiaro splits at 3 years).
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

interface VaccineDef {
  id: string;
  name: string;
  minAgeMonths: number;
  maxAgeYears: number;
  dose: (ageMonths: number) => string;
  schedule: string;
}

const VACCINES: VaccineDef[] = [
  {
    id: "hep-a",
    name: "Hepatitis A paediatric (Havrix Junior Monodose or Avaxim Junior)",
    minAgeMonths: 12,
    maxAgeYears: 15,
    dose: () => "0.5 ml intramuscular",
    schedule: "Single dose protects from about 2 weeks. Second dose at 6 to 12 months (Havrix Junior) or 6 to 36 months (Avaxim Junior) for long-term protection.",
  },
  {
    id: "twinrix-paed",
    name: "Hepatitis A and B combined, Twinrix Paediatric",
    minAgeMonths: 12,
    maxAgeYears: 15,
    dose: () => "0.5 ml intramuscular",
    schedule: "Three doses at 0, 1 and 6 months. Accelerated schedule per the SPC where travel is imminent.",
  },
  {
    id: "ambirix",
    name: "Hepatitis A and B combined, Ambirix",
    minAgeMonths: 12,
    maxAgeYears: 15,
    dose: () => "1.0 ml intramuscular",
    schedule: "Two doses, the second 6 to 12 months after the first. Only where the risk of hepatitis B during the course is low.",
  },
  {
    id: "hep-b",
    name: "Hepatitis B paediatric (Engerix B Paediatric or HBvaxPRO Paediatric)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: () => "0.5 ml intramuscular",
    schedule: "Three doses at 0, 1 and 6 months, or an accelerated schedule per the SPC and Green Book chapter 18.",
  },
  {
    id: "typhoid",
    name: "Typhoid Vi polysaccharide (Typhim Vi or Typherix)",
    minAgeMonths: 24,
    maxAgeYears: 17,
    dose: () => "0.5 ml intramuscular",
    schedule: "Single dose at least 2 weeks before travel. Booster every 3 years where exposure continues.",
  },
  {
    id: "menacwy",
    name: "Meningococcal ACWY (Nimenrix or MenQuadfi)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: () => "0.5 ml intramuscular",
    schedule: "Single dose at least 2 weeks before travel. Booster after 5 years where risk continues. Required for Hajj and Umrah.",
  },
  {
    id: "rabies",
    name: "Rabies pre-exposure (Rabipur or Verorab)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: () => "1.0 ml (Rabipur) or 0.5 ml (Verorab) intramuscular",
    schedule: "Three doses at days 0, 7 and 21 to 28. Pre-exposure only. Any actual or suspected exposure needs urgent medical assessment.",
  },
  {
    id: "je",
    name: "Japanese encephalitis (Ixiaro)",
    minAgeMonths: 12,
    maxAgeYears: 17,
    dose: (m) => (m < 36 ? "0.25 ml intramuscular (under 3 years)" : "0.5 ml intramuscular (3 years and over)"),
    schedule: "Two doses 28 days apart. The accelerated schedule is licensed for 18 years and over only.",
  },
  {
    id: "cholera",
    name: "Cholera oral (Dukoral)",
    minAgeMonths: 24,
    maxAgeYears: 17,
    dose: () => "Oral suspension in the supplied buffer",
    schedule: "Age 2 to under 6 years: three doses at least one week apart. Age 6 years and over: two doses at least one week apart. Complete at least one week before travel.",
  },
];

interface Clinical {
  destination: string;
  departureDate: string;
  itinerary: string;
  routineUpToDate: boolean;
  selected: string[];
  anaphylaxisComponent: boolean;
  acuteFebrileIllness: boolean;
  immunosuppressed: boolean;
  pregnant: boolean;
  bleedingDisorder: boolean;
  postExposure: boolean;
  parentPresent: boolean;
  allergies: string;
  batchNumbers: string;
  sites: string;
  anaphylaxisKit: boolean;
  scheduleAdvice: boolean;
  sideEffectAdvice: boolean;
  bitesAndFoodAdvice: boolean;
  rabiesAdvice: boolean;
}

const emptyClinical: Clinical = {
  destination: "", departureDate: "", itinerary: "", routineUpToDate: false, selected: [],
  anaphylaxisComponent: false, acuteFebrileIllness: false, immunosuppressed: false,
  pregnant: false, bleedingDisorder: false, postExposure: false, parentPresent: false,
  allergies: "", batchNumbers: "", sites: "", anaphylaxisKit: false,
  scheduleAdvice: false, sideEffectAdvice: false, bitesAndFoodAdvice: false, rabiesAdvice: false,
};

export default function JuniorTravelClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>({ ...emptyClinical });
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

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
    setC((prev) => ({
      ...prev,
      selected: prev.selected.includes(id) ? prev.selected.filter((x) => x !== id) : [...prev.selected, id],
    }));

  const selectedDefs = useMemo(() => VACCINES.filter((v) => c.selected.includes(v.id)), [c.selected]);

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

    // Per-vaccine age gating
    for (const v of selectedDefs) {
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
    }

    if (c.postExposure)
      a.push({
        code: "post-exposure",
        severity: "stop",
        message: "Post-exposure treatment is outside this PGD",
        detail: "Any animal bite, scratch or lick to broken skin needs immediate wound washing and urgent medical assessment. Do not delay.",
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
        detail: "Intramuscular injection must be assessed as safe by a clinician familiar with the child's bleeding risk before proceeding.",
      });
    // Gated on reaching the eligibility step, where the box is ticked.
    // Otherwise this fired from step 0 for every under-16, which is the whole
    // point of this PGD, and blocked the consultation before the pharmacist
    // could reach the tick box.
    if (step > 4 && !c.parentPresent && age !== null && age < 16)
      a.push({
        code: "no-parent",
        severity: "stop",
        message: "No person with parental responsibility present",
        detail: "Go back to the Eligibility step and confirm that a person with parental responsibility is present, or that the young person is Gillick competent.",
      });

    if (!c.routineUpToDate)
      a.push({
        code: "routine-catchup",
        severity: "caution",
        message: "Routine UK immunisations not confirmed up to date",
        detail: "Catch-up of the routine schedule is a priority before travel-specific vaccines. Discuss a catch-up plan and inform the GP.",
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
    if (c.departureDate)
      a.push({
        code: "timing",
        severity: "caution",
        message: "Check course timing against the departure date",
        detail: "Multi-dose courses must be started early enough to complete before travel. Where time is short, check whether an accelerated schedule is licensed for the product and age.",
      });
    if (!c.anaphylaxisKit && step >= 5)
      a.push({
        code: "no-kit",
        severity: "red-flag",
        message: "Anaphylaxis kit not confirmed",
        detail: "Adrenaline 1 in 1,000 injection and a telephone must be immediately available before any vaccine is given.",
      });

    return a;
  }, [patient.age, ageMonths, selectedDefs, c, step]);

  const hasStops = alerts.some((x) => x.severity === "stop");

  const validationError = useMemo(() => {
    switch (step) {
      case 0: return validatePatientStep(patient, { minAge: 1 });
      case 1: return validateConsentStep(consent);
      case 2:
        if (!c.destination.trim()) return "Please record the destination";
        if (!c.departureDate.trim()) return "Please record the departure date";
        return null;
      case 3:
        if (c.selected.length === 0) return "Please select at least one vaccine";
        return null;
      case 4:
        if (!c.allergies.trim()) return "Please record allergy status (or NKDA)";
        return null;
      case 5:
        if (!c.anaphylaxisKit) return "Confirm the anaphylaxis kit is immediately available";
        if (!c.batchNumbers.trim()) return "Please record the batch number and expiry for each vaccine given";
        if (!c.sites.trim()) return "Please record the anatomical site for each vaccine given";
        return null;
      case 6:
        if (!c.scheduleAdvice || !c.sideEffectAdvice || !c.bitesAndFoodAdvice) return "Please confirm all counselling points";
        if (c.selected.includes("rabies") && !c.rabiesAdvice) return "Please confirm the rabies exposure advice";
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
    clinicalData: {
      patient, consent, clinical: c, alerts, ageMonths,
      vaccines: selectedDefs.map((v) => ({ name: v.name, dose: ageMonths !== null ? v.dose(ageMonths) : "", schedule: v.schedule })),
    } as unknown as Record<string, unknown>,
    outcome: hasStops ? "not_supplied" : "completed",
    summary: {
      pharmacistName: summary.pharmacistName, pharmacistGPhC: summary.pharmacistGPhC,
      consultationDate: summary.consultationDate, consultationTime: summary.consultationTime,
    },
  });

  const onPatientChange = (field: keyof BasePatientDetails, value: unknown) =>
    setPatient((p) => ({ ...p, [field]: value, ...(field === "dateOfBirth" ? { age: calculateAge(value as string) } : {}) }));

  const ageLabel = (v: VaccineDef) =>
    v.minAgeMonths >= 24 ? `from ${v.minAgeMonths / 12} years` : `from ${v.minAgeMonths} months`;

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
            <TextInput label="Destination" value={c.destination} onChange={(v) => set({ destination: v })} placeholder="e.g. rural Kenya" required />
            <TextInput label="Departure date" value={c.departureDate} onChange={(v) => set({ departureDate: v })} placeholder="DD/MM/YYYY" required />
            <TextArea label="Itinerary, duration and planned activities" value={c.itinerary} onChange={(v) => set({ itinerary: v })} placeholder="Rural or urban, length of stay, animal contact, accommodation, season" />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Routine UK childhood immunisations confirmed up to date" checked={c.routineUpToDate} onChange={(v) => set({ routineUpToDate: v })} />
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
            <p className="text-sm text-gray-600">
              Select the vaccines indicated by the risk assessment. Age eligibility is checked against the child&apos;s date of birth.
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
            {selectedDefs.length > 0 && ageMonths !== null && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-2">
                <p className="font-semibold">Doses for this child</p>
                {selectedDefs.map((v) => (
                  <div key={v.id}>
                    <p className="font-medium">{v.name}</p>
                    <p>{v.dose(ageMonths)}. {v.schedule}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">Exclusions</p>
              <Checkbox label="Confirmed anaphylaxis to a previous dose or any vaccine component" checked={c.anaphylaxisComponent} onChange={(v) => set({ anaphylaxisComponent: v })} />
              <Checkbox label="Acute severe febrile illness" checked={c.acuteFebrileIllness} onChange={(v) => set({ acuteFebrileIllness: v })} />
              <Checkbox label="Significant immunosuppression, asplenia or complement deficiency" checked={c.immunosuppressed} onChange={(v) => set({ immunosuppressed: v })} />
              <Checkbox label="Known or suspected pregnancy" checked={c.pregnant} onChange={(v) => set({ pregnant: v })} />
              <Checkbox label="Bleeding disorder not assessed as safe for intramuscular injection" checked={c.bleedingDisorder} onChange={(v) => set({ bleedingDisorder: v })} />
              <Checkbox label="Attending for post-exposure treatment (including animal bite, scratch or lick to broken skin)" checked={c.postExposure} onChange={(v) => set({ postExposure: v })} />
            </div>
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800">Consent</p>
              <Checkbox label="A person with parental responsibility, or an adult authorised by them, is present (or the young person is Gillick competent)" checked={c.parentPresent} onChange={(v) => set({ parentPresent: v })} />
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
            {ageMonths !== null && selectedDefs.length > 0 && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-2">
                <p className="font-semibold">To be administered today</p>
                {selectedDefs.map((v) => (
                  <p key={v.id}>{v.name}: {v.dose(ageMonths)}</p>
                ))}
                <p className="mt-2">Use separate sites, preferably different limbs, or at least 2.5 cm apart in the same limb. Use the anterolateral thigh in younger children where deltoid bulk is insufficient. Record the site of each.</p>
              </div>
            )}
            <Checkbox label="Adrenaline 1 in 1,000 and anaphylaxis facilities are immediately available" checked={c.anaphylaxisKit} onChange={(v) => set({ anaphylaxisKit: v })} />
            <TextArea label="Batch numbers and expiry dates" value={c.batchNumbers} onChange={(v) => set({ batchNumbers: v })} placeholder="One line per vaccine given" />
            <TextArea label="Anatomical sites" value={c.sites} onChange={(v) => set({ sites: v })} placeholder="One line per vaccine given, e.g. Typhim Vi, left deltoid" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label="Written record of vaccines given provided, and remaining doses and dates explained" checked={c.scheduleAdvice} onChange={(v) => set({ scheduleAdvice: v })} />
              <Checkbox label="Side effects and their management explained, including Yellow Card reporting" checked={c.sideEffectAdvice} onChange={(v) => set({ sideEffectAdvice: v })} />
              <Checkbox label="Bite avoidance, food and water hygiene and malaria advice given, and advised that fever during or after travel needs urgent assessment" checked={c.bitesAndFoodAdvice} onChange={(v) => set({ bitesAndFoodAdvice: v })} />
              {c.selected.includes("rabies") && (
                <Checkbox label="Advised that any animal bite, scratch or lick to broken skin needs immediate wound washing and urgent medical attention regardless of vaccination" checked={c.rabiesAdvice} onChange={(v) => set({ rabiesAdvice: v })} />
              )}
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

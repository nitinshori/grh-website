"use client";

import { useState, useMemo } from "react";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import { FungalInfectionSummaryReport } from "./components/FungalInfectionSummaryReport";
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
 * Fungal Skin Infection ePGD, aligned to the Miconazole 2% cream / Trimovate
 * cream PGD, version 004, issued 11 September 2026:
 * miconazole 2% cream (P) for superficial fungal skin infection (athlete's
 * foot, ringworm, candidal intertrigo) 16+; Trimovate cream (POM) for inflamed
 * intertrigo, infected eczema or seborrhoeic dermatitis with a suspected
 * secondary bacterial or candidal component, 18+, short course only. Trimovate
 * is NOT a treatment for any primary fungal, bacterial or viral skin infection.
 */

const PGD_STRAPLINE = "Miconazole 2% cream / Trimovate cream PGD, version 004, issued 11 September 2026";
const PRIMARY_FUNGAL = new Set(["athletes-foot", "ringworm", "candidal-intertrigo", "other-superficial"]);

const STEP_LABELS = ["Patient Details", "Consent", "Assessment & History", "Treatment", "Counselling & Summary"] as const;

export interface Clinical {
  presentation: string;
  site: string;
  brokenOozing: boolean;
  nailOrScalp: boolean;
  systemic: boolean;
  /** Skin infection requiring systemic therapy (Trimovate exclusion). */
  requiresSystemicTherapy: boolean;
  /** Primary bacterial (impetigo, cellulitis) or viral (herpes simplex,
   *  chickenpox, shingles, warts, molluscum) skin infection: outside both arms. */
  bacterialOrViral: boolean;
  /** Affected area is the face or genitals (Trimovate exclusion). */
  faceOrGenitals: boolean;
  /** Blurred vision or other visual disturbance (Trimovate caution: consider ophthalmology referral). */
  visualDisturbance: boolean;
  /** Warfarin or other vitamin K antagonist (miconazole caution). */
  warfarin: boolean;
  pregnantOrBreastfeeding: boolean;
  miconazoleAllergy: boolean;
  steroidOrTrimovateAllergy: boolean;
  allergies: string;
  product: "miconazole" | "trimovate" | "";
  brand: string;
  quantity: string;
  completeCourse: boolean;
  applicationAdvice: boolean;
  reviewAdvice: boolean;
  hygieneAdvice: boolean;
  pilSupplied: boolean;
}

const EMPTY_CLINICAL: Clinical = {
  presentation: "", site: "", brokenOozing: false, nailOrScalp: false, systemic: false,
  requiresSystemicTherapy: false, bacterialOrViral: false, faceOrGenitals: false, visualDisturbance: false, warfarin: false,
  pregnantOrBreastfeeding: false, miconazoleAllergy: false, steroidOrTrimovateAllergy: false,
  allergies: "", product: "", brand: "", quantity: "", completeCourse: false, applicationAdvice: false, reviewAdvice: false,
  hygieneAdvice: false, pilSupplied: false,
};

export default function FungalInfectionClient() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [patient, setPatient] = useState<BasePatientDetails>({ ...initialPatientDetails });
  const [consent, setConsent] = useState<BaseConsent>({ ...initialConsent });
  const [summary, setSummary] = useState<BaseSummary>(initialSummary());
  const [c, setC] = useState<Clinical>({ ...EMPTY_CLINICAL });
  const set = (patch: Partial<Clinical>) => setC((prev) => ({ ...prev, ...patch }));

  // Pharmacist details default to the logged-in profile (derived, so a new
  // consultation picks them up again without an effect).
  const __pharmProfile = usePharmacistProfile();
  const effectiveSummary = useMemo<BaseSummary>(() => ({
    ...summary,
    pharmacistName: summary.pharmacistName || __pharmProfile?.name || "",
    pharmacistGPhC: summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
    pharmacyName: summary.pharmacyName || __pharmProfile?.pharmacyName || "",
    pharmacyAddress: summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
  }), [summary, __pharmProfile]);

  const alerts = useMemo<ClinicalAlert[]>(() => {
    const a: ClinicalAlert[] = [];
    const age = patient.age;
    if (age !== null && age < 16)
      a.push({ code: "under-16", severity: "stop", message: "Under 16, excluded from this PGD", detail: "Miconazole is for individuals aged 16 years and over; Trimovate for adults aged 18 years and over. Advise on alternative options; inform or refer to the GP as appropriate." });
    if (c.product === "trimovate" && age !== null && age < 18)
      a.push({ code: "trimovate-under-18", severity: "stop", message: "Trimovate is for adults aged 18 years and over", detail: "Select miconazole (16+) where a superficial fungal infection is diagnosed, or refer." });
    if (c.nailOrScalp)
      a.push({ code: "nail-scalp", severity: "stop", message: "Nail or scalp infection, excluded", detail: "Requires systemic or alternative treatment; refer to the GP." });
    if (c.brokenOozing)
      a.push({ code: "broken-skin", severity: "stop", message: "Infected, broken, ulcerated, oozing or weeping skin, excluded", detail: "Topical antifungal inappropriate (miconazole); broken, ulcerated or weeping skin excludes Trimovate. Refer." });
    if (c.systemic)
      a.push({ code: "systemic", severity: "stop", message: "Signs of systemic infection, excluded", detail: "Refer urgently." });
    if (c.bacterialOrViral)
      a.push({ code: "bacterial-viral", severity: "stop", message: "Primary bacterial or viral skin infection suspected", detail: "Impetigo, cellulitis, herpes simplex, chickenpox, shingles, warts and molluscum are not fungal infections and Trimovate is contraindicated in all of them (SmPC 4.3). Refer or use the appropriate PGD." });
    if (c.product === "trimovate" && c.requiresSystemicTherapy)
      a.push({ code: "systemic-therapy", severity: "stop", message: "Skin infection requiring systemic therapy, excluded", detail: "Trimovate exclusion. Refer to the GP." });
    if (c.product === "trimovate" && PRIMARY_FUNGAL.has(c.presentation))
      a.push({ code: "trimovate-primary-fungal", severity: "stop", message: "Trimovate is not a treatment for primary fungal infection", detail: "Tinea of any site, including ringworm and athlete's foot, is a Trimovate exclusion (SmPC 4.3). Use miconazole under the first arm, or refer." });
    if (c.product === "trimovate" && c.faceOrGenitals)
      a.push({ code: "face-genitals", severity: "stop", message: "Use on the face or genitals, excluded", detail: "Trimovate must not be used on the face or genitals. Refer." });
    if (c.pregnantOrBreastfeeding)
      a.push({ code: "pregnancy", severity: "stop", message: "Pregnancy or breastfeeding, excluded", detail: "Both arms exclude pregnancy or breastfeeding unless approved by a prescriber; there is no prescriber in a PGD supply. Refer to the GP." });
    if (c.product === "miconazole" && c.miconazoleAllergy)
      a.push({ code: "mic-allergy", severity: "stop", message: "Hypersensitivity to miconazole or any of the excipients", detail: "Select an alternative or refer." });
    if (c.product === "trimovate" && c.steroidOrTrimovateAllergy)
      a.push({ code: "trim-allergy", severity: "stop", message: "Hypersensitivity to Trimovate components", detail: "Hypersensitivity to corticosteroids, nystatin, oxytetracycline or any excipient excludes Trimovate." });
    if (c.warfarin && c.product !== "trimovate")
      a.push({ code: "warfarin", severity: "caution", message: "Warfarin or other vitamin K antagonist", detail: "Miconazole: caution should be exercised and the anticoagulant effect should be monitored in patients on warfarin or other vitamin K antagonists." });
    if (c.visualDisturbance)
      a.push({ code: "visual", severity: "red-flag", message: "Blurred vision or other visual disturbance", detail: "Trimovate caution: the patient should be considered for referral to an ophthalmologist for evaluation of possible causes." });
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
        if (c.product === "miconazole" && c.presentation === "inflamed-mixed") return "Miconazole requires a diagnosis of superficial fungal skin infection. For inflamed intertrigo or infected eczema with a suspected secondary component, select Trimovate (18+) or refer.";
        if (!c.brand.trim()) return "Record the brand supplied (PGD record: name and brand of medication)";
        if (!c.quantity.trim()) return "Please record the quantity supplied";
        return null;
      case 4:
        if (!c.completeCourse || !c.applicationAdvice || !c.reviewAdvice || !c.hygieneAdvice) return "Please confirm all counselling points";
        if (!c.pilSupplied) return "Please confirm the patient information leaflet has been supplied";
        return validateSummaryStep(effectiveSummary);
      default: return null;
    }
  }, [step, patient, consent, c, effectiveSummary]);

  // A stop anywhere disables Next on every step (adversarial review, 11 Sep 2026).
  const canProceed = !validationError && !hasStops;
  const next = () => { if (canProceed) { setCompleted((p) => new Set([...p, step])); setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1)); } };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const medicineName = c.product === "miconazole"
    ? "Miconazole 2% cream"
    : c.product === "trimovate"
      ? "Trimovate cream (clobetasone butyrate 0.05%, oxytetracycline 3%, nystatin 100,000 units/g)"
      : "";
  const medicineDose = c.product === "miconazole"
    ? "Apply thinly twice daily to the clean, dry affected area, topical; continue at least one week after symptoms clear (minimum 2 weeks, maximum 4 weeks)"
    : c.product === "trimovate"
      ? "Apply thinly once or twice daily, topical; maximum 7 to 10 days continuous use without review"
      : "";

  // Returns a record on every step so an exclusion can be saved as "not
  // supplied" from the step it is raised on.
  const getConsultationData = (): ConsultationRecordData => ({
    patient: {
      firstName: patient.firstName, lastName: patient.lastName, dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber, phone: patient.phone, email: patient.email, address: patient.address,
      gpName: patient.gpName, gpPractice: patient.gpPractice, gpAddress: patient.gpAddress,
      gpPhone: patient.gpPhone, gpEmail: patient.gpEmail, gpOdsCode: patient.gpOdsCode,
    },
    clinicalData: { patient, consent, clinical: c, alerts, hasStops, summary: effectiveSummary } as unknown as Record<string, unknown>,
    outcome: hasStops ? "not_supplied" : "completed",
    ...(!hasStops && c.product
      ? {
          medicine: {
            name: `${medicineName}${c.brand ? ` (${c.brand})` : ""}`,
            dose: medicineDose,
            duration: c.product === "miconazole" ? "2 to 4 weeks, one course" : "7 to 10 days, one course",
            quantity: c.quantity === "one-30g-tube" ? "1 x 30 g tube" : c.quantity,
          },
        }
      : {}),
    summary: {
      pharmacistName: effectiveSummary.pharmacistName,
      pharmacistGPhC: effectiveSummary.pharmacistGPhC,
      pharmacyName: effectiveSummary.pharmacyName,
      pharmacyAddress: effectiveSummary.pharmacyAddress,
      consultationDate: effectiveSummary.consultationDate, consultationTime: effectiveSummary.consultationTime,
      clinicalNotes: effectiveSummary.clinicalNotes,
    },
    consent: { notifyGp: consent.notifyGp },
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
                { value: "candidal-intertrigo", label: "Candidal intertrigo (superficial fungal, miconazole arm)" },
                { value: "inflamed-mixed", label: "Inflamed intertrigo, infected eczema or seborrhoeic dermatitis with suspected secondary bacterial or candidal component (Trimovate arm, 18+)" },
              ]} required />
            <TextInput label="Affected site" value={c.site} onChange={(v) => set({ site: v })} placeholder="e.g. web spaces both feet" required />
            <TextInput label="Allergies" value={c.allergies} onChange={(v) => set({ allergies: v })} placeholder="Record allergies, or NKDA" required />
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <Checkbox label="Nail or scalp involvement" checked={c.nailOrScalp} onChange={(v) => set({ nailOrScalp: v })} description="Requires systemic or alternative treatment" />
              <Checkbox label="Infected, broken, ulcerated, oozing or weeping skin" checked={c.brokenOozing} onChange={(v) => set({ brokenOozing: v })} />
              <Checkbox label="Signs of systemic infection / patient unwell" checked={c.systemic} onChange={(v) => set({ systemic: v })} />
              <Checkbox label="Skin infection requiring systemic therapy" checked={c.requiresSystemicTherapy} onChange={(v) => set({ requiresSystemicTherapy: v })} description="Trimovate exclusion" />
              <Checkbox label="Primary bacterial (impetigo, cellulitis) or viral (herpes simplex, chickenpox, shingles, warts, molluscum) skin infection suspected" checked={c.bacterialOrViral} onChange={(v) => set({ bacterialOrViral: v })} description="Not a fungal infection; Trimovate contraindicated (SmPC 4.3)" />
              <Checkbox label="Affected area is the face or genitals" checked={c.faceOrGenitals} onChange={(v) => set({ faceOrGenitals: v })} description="Trimovate exclusion" />
              <Checkbox label="Pregnant or breastfeeding" checked={c.pregnantOrBreastfeeding} onChange={(v) => set({ pregnantOrBreastfeeding: v })} />
              <Checkbox label="Hypersensitivity to miconazole or any of the excipients" checked={c.miconazoleAllergy} onChange={(v) => set({ miconazoleAllergy: v })} />
              <Checkbox label="Hypersensitivity to corticosteroids, nystatin, oxytetracycline or any excipient" checked={c.steroidOrTrimovateAllergy} onChange={(v) => set({ steroidOrTrimovateAllergy: v })} />
            </div>
            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Checkbox label="Taking warfarin or another vitamin K antagonist" checked={c.warfarin} onChange={(v) => set({ warfarin: v })} description="Miconazole caution: anticoagulant effect should be monitored" />
              <Checkbox label="Blurred vision or other visual disturbance" checked={c.visualDisturbance} onChange={(v) => set({ visualDisturbance: v })} description="Trimovate caution: consider referral to an ophthalmologist" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <SelectInput label="Treatment" value={c.product} onChange={(v) => set({ product: v as Clinical["product"] })}
              options={[
                { value: "miconazole", label: "Miconazole 2% cream, P (16+): superficial fungal skin infection" },
                { value: "trimovate", label: "Trimovate cream, POM (18+, short course): clobetasone 17-butyrate 0.05% w/w, oxytetracycline 3.0% w/w, nystatin 100,000 units per gram" },
              ]} required />
            {c.product === "miconazole" && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-1">
                <p>Miconazole 2% cream. Apply thinly to the clean, dry affected area twice daily; rub in until fully penetrated. Continue for at least one week after disappearance of all signs and symptoms.</p>
                <p>Minimum 2 weeks; maximum 4 weeks. One 30 g tube per treatment course. Store below 25 C, do not freeze.</p>
                <p>Avoid contact with eyes and mucous membranes. Wash hands before and after application.</p>
                <p>Legal category P: a PGD is not legally required for a P sale; where the P licence is narrower than this PGD, the P licence governs.</p>
              </div>
            )}
            {c.product === "trimovate" && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-1">
                <p>Trimovate cream (POM). Apply thinly to the affected area once or twice daily, using only enough to cover the area. Wash hands after applying unless the hands are being treated. Allow time for absorption before applying an emollient.</p>
                <p>Maximum 7 to 10 days continuous use without review. One 30 g tube per treatment course. Store below 25 C.</p>
                <p>Do not use under occlusion. Avoid prolonged use. Avoid contact with eyes and mucous membranes. Not for the face, genitals, broken skin or long-term use without review. If the condition does not improve within seven days, or worsens, treatment and diagnosis should be re-evaluated.</p>
              </div>
            )}
            <TextInput label="Brand supplied" value={c.brand} onChange={(v) => set({ brand: v })} placeholder={c.product === "trimovate" ? "Trimovate cream" : "e.g. Daktarin, or generic miconazole 2% cream"} required />
            <SelectInput label="Quantity supplied" value={c.quantity} onChange={(v) => set({ quantity: v })}
              options={[{ value: "one-30g-tube", label: "One 30 g tube per treatment course" }]} required />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <AlertBanner alerts={alerts} />
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox label={c.product === "trimovate" ? "Treatment period explained: maximum 7 to 10 days continuous use without review; re-evaluate if not improved within seven days or if worsening" : "Complete the course: continue miconazole for at least one week after all signs and symptoms disappear; minimum 2 weeks, maximum 4 weeks"} checked={c.completeCourse} onChange={(v) => set({ completeCourse: v })} />
              <Checkbox label={c.product === "trimovate" ? "Application advice given (apply thinly once or twice daily, wash hands after applying, avoid eyes and mucous membranes, no occlusion, allow absorption before emollient)" : "Application advice given (apply thinly twice daily to clean, dry skin, wash hands before and after, avoid eyes and mucous membranes)"} checked={c.applicationAdvice} onChange={(v) => set({ applicationAdvice: v })} />
              <Checkbox label="Follow-up advice given: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or the patient becomes systemically very unwell" checked={c.reviewAdvice} onChange={(v) => set({ reviewAdvice: v })} />
              <Checkbox label="Hygiene advice given: wash affected skin daily and dry thoroughly (especially skin folds), loose-fitting cotton or moisture-wicking clothes, avoid scratching, do not share towels, wash towels, clothes and bed linen frequently" checked={c.hygieneAdvice} onChange={(v) => set({ hygieneAdvice: v })} />
              <Checkbox label="Patient information leaflet (PIL) supplied with the medication" checked={c.pilSupplied} onChange={(v) => set({ pilSupplied: v })} />
            </div>
            <TextInput label="Pharmacist name" value={effectiveSummary.pharmacistName} onChange={(v) => setSummary((p) => ({ ...p, pharmacistName: v }))} required />
            <TextInput label="GPhC registration number" value={effectiveSummary.pharmacistGPhC} onChange={(v) => setSummary((p) => ({ ...p, pharmacistGPhC: v }))} required />
            <TextArea label="Clinical notes (optional)" value={summary.clinicalNotes} onChange={(v) => setSummary((p) => ({ ...p, clinicalNotes: v }))} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 print:px-0 print:py-0">
        <div className="hidden print:block">
          <FungalInfectionSummaryReport patient={patient} consent={consent} clinical={c} summary={effectiveSummary} alerts={alerts} />
        </div>
        <div className="print:hidden space-y-6">
          <p className="text-xs text-gray-500">{PGD_STRAPLINE}</p>
          <ProgressBar stepLabels={STEP_LABELS} currentStep={step} onStepClick={(s) => { if (completed.has(s) || s <= step) setStep(s); }} completedSteps={completed} hasErrors={!!validationError} />
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
            onNewConsultation={() => { setStep(0); setCompleted(new Set()); setPatient({ ...initialPatientDetails }); setConsent({ ...initialConsent }); setSummary(initialSummary()); setC({ ...EMPTY_CLINICAL }); }}
          >
            {stepBody()}
          </StepWrapper>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";
import { calculateAge, validatePatientStep, validateConsentStep } from "../shared/types";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

// Aligned to the signed PGD version 005, issued 11 September 2026: Acute
// Otitis Externa. Two products: ciprofloxacin 2mg/ml single-dose ear drops
// (from 1 year, preferred) and dexamethasone with neomycin and acetic acid
// ear spray (from 2 years, not in pregnancy). Otoscopy is required; the
// tympanic membrane must be seen and recorded as intact before either is
// supplied. One course per episode.
const PGD_STRAPLINE = "Acute Otitis Externa PGD version 005, issued 11 September 2026";

type Product = "" | "ciprofloxacin" | "spray";

const PRODUCTS: Record<Exclude<Product, "">, { name: string; form: string; dose: string; frequency: string; duration: string; quantity: string; route: string }> = {
  ciprofloxacin: {
    name: "Ciprofloxacin 2mg/ml ear drops solution in single-dose container (for example Cetraxal)",
    form: "Ear drops, single-dose ampoules; each 0.25mL ampoule delivers 0.5mg ciprofloxacin",
    dose: "The contents of one single-dose ampoule into the affected ear",
    frequency: "Twice daily. Where an otowick or tampon is used, the FIRST dose only is doubled (two ampoules)",
    duration: "7 days. One course per episode; no repeat supply",
    quantity: "One pack of 15 single-dose ampoules (a 7 day course at twice daily uses 14, with one spare). Supply for one ear unless both are affected and both were examined",
    route: "Auricular. Warm the ampoule in the hand; lie with the affected ear upward; instil, pull the auricle several times, stay for about 5 minutes; discard the ampoule after use",
  },
  spray: {
    name: "Dexamethasone 0.1% w/w, neomycin sulfate 0.5% w/w and acetic acid 2% w/w ear spray (for example Otomize)",
    form: "Ear spray, metered dose",
    dose: "One metered spray into the affected ear",
    frequency: "Three times daily. Prime the pump before first use; shake well before use",
    duration: "7 days, extended to a maximum of 14 days only where the patient has clearly improved but not resolved and the ear has been re-examined. One course per episode",
    quantity: "One bottle. No repeat supply",
    route: "Topical spray into the external auditory canal. Keep the head tilted, or lie on the side, for a few minutes after applying",
  },
};

function initialState() {
  return {
    patient: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: null as number | null,
      gpName: "",
      gpPractice: "",
      gpAddress: "",
      gpPhone: "",
      gpEmail: "",
      gpOdsCode: "",
      nhsNumber: "",
      address: "",
      phone: "",
      email: "",
    },
    consent: {
      informedConsentGiven: false,
      idVerified: false,
      idType: "",
      patientAwarePrivateService: false,
    },
    consent16: {
      basis: "" as "" | "parental" | "gillick",
      detail: "",
    },
    assessment: {
      earAffected: "" as "" | "left" | "right" | "both",
      bothEarsExamined: false,
      symptomDuration: "" as "" | "<48h" | "2-7d" | ">7d" | ">14d",
      painSeverity: "" as "" | "mild" | "moderate" | "severe",
      treatmentTried: "",
      earPain: false,
      discharge: false,
      reducedHearing: false,
      itching: false,
      earSurgeryHistory: false,
      grommetsInPlace: false,
      foreignBodySuspected: false,
      quinoloneAllergy: false,
      neomycinOrSprayAllergy: false,
      otherEarDrops: false,
      immunosuppressed: false,
      highTemperature: false,
      spreadingCellulitis: false,
      vertigoHearingLossNeuro: false,
      otitisMediaOrOralAntibioticNeeded: false,
      pregnancy: false,
      breastfeeding: false,
      breastfeedingDecisionRecorded: "",
      // Otoscopy is a required step. The drum must be seen and recorded as
      // intact before either product is supplied.
      tympanicMembrane: "" as "" | "intact" | "perforated" | "not-seen",
      canalFindings: "",
      diabetes: false,
      severeUnremittingPain: false,
      facialPalsy: false,
      mastoidSigns: false,
      fungalDebris: false,
      previousEpisodes12m: "" as "" | "0" | "1-2" | "3+",
      previousCourseUnderPgd12m: false,
      alreadyTreatedThisEpisode: false,
    },
    treatment: {
      product: "ciprofloxacin" as Product,
      productReason: "",
      batchNumber: "",
      expiryDate: "",
    },
    counselling: {
      warmDrops: false,
      liedPosition: false,
      instilTechnique: false,
      completeCourse: false,
      avoidWater: false,
      nothingInEar: false,
      painRelief: false,
      sprayTechnique: false,
      sprayStopIfIrritation: false,
      seekAdvice: false,
      noSecondCourse: false,
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clinicalNotes: "",
    },
  };
}

export default function EarInfectionClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [state, setState] = useState(initialState);

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;
    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);

  const age = useMemo(() => calculateAge(state.patient.dateOfBirth), [state.patient.dateOfBirth]);
  const under16 = age !== null && age < 16;

  const alerts: ClinicalAlert[] = useMemo(() => {
    const issues: ClinicalAlert[] = [];
    const a = state.assessment;
    const product = state.treatment.product;

    // ── Age ──────────────────────────────────────────────────────────────
    if (age !== null && age <= 1) {
      issues.push({
        severity: "stop",
        code: "AGE_UNDER_2",
        message: "Aged 1 year or under",
        detail:
          "Ciprofloxacin drops: safety and efficacy below 1 year have not been established (inclusion: aged more than 1 year). The spray is for 2 years and over. Refer.",
      });
    }

    // ── Otoscopy is a required step ──────────────────────────────────────
    if (a.tympanicMembrane !== "intact") {
      issues.push({
        severity: "stop",
        code: "OTOSCOPY_REQUIRED",
        message:
          a.tympanicMembrane === ""
            ? "Otoscopy not recorded"
            : a.tympanicMembrane === "perforated"
              ? "Tympanic membrane perforated or perforation suspected"
              : "Tympanic membrane could not be visualised",
        detail:
          "The tympanic membrane must be visualised and recorded as intact before either product is supplied. If you cannot see the drum, you cannot use this PGD. Refer. Never supply the neomycin spray where the drum is not seen or is perforated.",
      });
    }

    // ── Appendix 1 red flags: any one excludes ───────────────────────────
    if (a.severeUnremittingPain && (a.diabetes || a.immunosuppressed)) {
      issues.push({
        severity: "stop",
        code: "NECROTISING_OE",
        message: "Suspect necrotising (malignant) otitis externa",
        detail:
          "Severe unremitting pain in a patient with diabetes or immunosuppression. This is an EMERGENCY ENT referral today, not a treatment failure and not a PGD supply. It needs imaging and intravenous antibiotics. Pain out of proportion to the appearance of the canal is the clue.",
      });
    }

    if (a.facialPalsy) {
      issues.push({
        severity: "stop",
        code: "FACIAL_PALSY",
        message: "Facial nerve palsy, or any weakness or drooping of the face",
        detail: "Emergency ENT referral the same day.",
      });
    }

    if (a.mastoidSigns) {
      issues.push({
        severity: "stop",
        code: "MASTOIDITIS",
        message: "Pain, swelling, redness or tenderness over the mastoid, or a pinna pushed forward",
        detail: "Suspect mastoiditis. Emergency referral the same day.",
      });
    }

    if (a.highTemperature) {
      issues.push({
        severity: "stop",
        code: "SYSTEMIC_ILLNESS",
        message: "Systemic illness: fever, rigors, or the patient appearing unwell",
        detail: "Exclusion. Refer the same day.",
      });
    }

    if (a.spreadingCellulitis) {
      issues.push({
        severity: "stop",
        code: "SPREADING_INFECTION",
        message: "Spreading infection: cellulitis of the pinna, the face or the neck",
        detail: "Exclusion. Refer the same day.",
      });
    }

    if (a.vertigoHearingLossNeuro) {
      issues.push({
        severity: "stop",
        code: "NEURO",
        message: "Vertigo, new hearing loss beyond simple canal blockage, new tinnitus, or any other neurological symptom",
        detail: "Exclusion. Refer.",
      });
    }

    if (a.fungalDebris) {
      issues.push({
        severity: "stop",
        code: "FUNGAL",
        message: "White or black fuzzy debris in the canal",
        detail:
          "Suggests fungal otitis externa. Antibacterial treatment will not help and may make it worse. Refer.",
      });
    }

    if (a.previousEpisodes12m === "3+") {
      issues.push({
        severity: "stop",
        code: "RECURRENT_OE",
        message: "3 or more episodes in the last 12 months",
        detail: "Recurrent otitis externa. Refer to ENT for investigation rather than treating again.",
      });
    }

    if (a.alreadyTreatedThisEpisode) {
      issues.push({
        severity: "stop",
        code: "TREATMENT_FAILURE",
        message: "A course already supplied for this episode, or failure to improve after a full course",
        detail:
          "One course per episode. A patient who has not improved after a full course is referred, not re-supplied. Do not supply a second course blind.",
      });
    }

    if (a.symptomDuration === ">14d") {
      issues.push({
        severity: "stop",
        code: "PROLONGED",
        message: "Symptoms for more than 14 days",
        detail: "Failed treatment after 2 weeks, or chronic otitis externa (symptoms over 3 months). Refer to ENT.",
      });
    }

    if (a.otitisMediaOrOralAntibioticNeeded) {
      issues.push({
        severity: "stop",
        code: "OTITIS_MEDIA",
        message: "Otitis media, or any infection requiring an oral antibiotic",
        detail: "This is an otitis externa service. It does not authorise any oral antibiotic. Refer.",
      });
    }

    // HARD STOP: Ear surgery history (tool criterion, retained)
    if (a.earSurgeryHistory) {
      issues.push({
        severity: "stop",
        code: "EAR_SURGERY_HISTORY",
        message: "History of ear surgery or perforated eardrum",
        detail:
          "Perforation, or a risk of perforation, excludes. Refer to GP or ENT specialist.",
      });
    }

    if (a.grommetsInPlace) {
      issues.push({
        severity: "stop",
        code: "GROMMETS_IN_PLACE",
        message: "Grommet or tympanostomy tube in situ",
        detail: "Exclusion for both products. Refer to GP or ENT.",
      });
    }

    if (a.foreignBodySuspected) {
      issues.push({
        severity: "stop",
        code: "FOREIGN_BODY",
        message: "Suspected foreign body in the canal",
        detail: "Refer for removal.",
      });
    }

    if (a.otherEarDrops) {
      issues.push({
        severity: "stop",
        code: "OTHER_EAR_DROPS",
        message: "Already using another ear preparation",
        detail:
          "Exclusion. Concomitant ear preparations are not recommended. Do not use both products, and do not use any other ear preparation at the same time.",
      });
    }

    // ── Product-specific ────────────────────────────────────────────────
    if (a.quinoloneAllergy && product === "ciprofloxacin") {
      issues.push({
        severity: "stop",
        code: "QUINOLONE_ALLERGY",
        message: "Known hypersensitivity to ciprofloxacin, any quinolone, or any excipient",
        detail: "Ciprofloxacin drops cannot be supplied. Consider the spray if its own criteria are met, or refer.",
      });
    }
    if (a.neomycinOrSprayAllergy && product === "spray") {
      issues.push({
        severity: "stop",
        code: "SPRAY_ALLERGY",
        message: "Known hypersensitivity to neomycin, any aminoglycoside, dexamethasone, acetic acid or any excipient",
        detail: "The spray cannot be supplied. Use the ciprofloxacin arm if its own criteria are met, or refer.",
      });
    }
    if (product === "spray" && age !== null && age < 2) {
      issues.push({
        severity: "stop",
        code: "SPRAY_AGE",
        message: "Aged under 2 years: spray excluded",
        detail: "Use the ciprofloxacin arm from 1 year, or refer.",
      });
    }
    if (product === "spray" && a.pregnancy) {
      issues.push({
        severity: "stop",
        code: "SPRAY_PREGNANCY",
        message: "Pregnancy: spray excluded",
        detail: "This product is not recommended in pregnancy; use the ciprofloxacin arm.",
      });
    }
    if (product === "spray" && a.breastfeeding && !a.breastfeedingDecisionRecorded.trim()) {
      issues.push({
        severity: "stop",
        code: "SPRAY_BREASTFEEDING",
        message: "Breastfeeding: spray excluded unless a decision is recorded",
        detail:
          "Excluded unless a decision has been made and recorded about whether to continue breastfeeding or the treatment. The ciprofloxacin arm avoids the question.",
      });
    }

    // ── Cautions ─────────────────────────────────────────────────────────
    if (a.immunosuppressed && !a.severeUnremittingPain) {
      issues.push({
        severity: "caution",
        code: "IMMUNOSUPPRESSED",
        message: "Patient is immunosuppressed",
        detail:
          "Record immunosuppression status. Any severe unremitting pain in this patient is necrotising otitis externa until proven otherwise: emergency ENT referral.",
      });
    }
    if (a.diabetes && !a.severeUnremittingPain) {
      issues.push({
        severity: "caution",
        code: "DIABETES",
        message: "Patient has diabetes",
        detail:
          "Record diabetes status. Any severe unremitting pain in this patient is necrotising otitis externa until proven otherwise: emergency ENT referral.",
      });
    }
    if ((a.pregnancy || a.breastfeeding) && product === "ciprofloxacin") {
      issues.push({
        severity: "caution",
        code: "PREGNANCY_BREASTFEEDING",
        message: "Pregnant or breastfeeding",
        detail:
          "Ciprofloxacin drops may be used in both: systemic exposure after otic administration is negligible. This is the arm to use in a pregnant or breastfeeding woman.",
      });
    }
    if (a.tympanicMembrane === "intact" && product === "spray") {
      issues.push({
        severity: "caution",
        code: "SPRAY_DRUM",
        message: "Spray selected: confirm the tympanic membrane is intact",
        detail:
          "This is the single most important check for this product. Neomycin is an aminoglycoside and is potentially ototoxic if it reaches the middle ear. Ciprofloxacin drops are preferred where there is any doubt about the drum.",
      });
    }

    return issues;
  }, [state.assessment, state.treatment.product, age]);

  const hasStopAlerts = alerts.some((a) => a.severity === "stop");

  const stepError = useMemo<string | null>(() => {
    const a = state.assessment;
    switch (currentStep) {
      case 0:
        return validatePatientStep({ ...state.patient, age });
      case 1: {
        const base = validateConsentStep(state.consent);
        if (base) return base;
        if (under16) {
          if (!state.consent16.basis) return "Under 16: record who gave consent (parental responsibility, or the young person if Gillick competent)";
          if (!state.consent16.detail.trim())
            return state.consent16.basis === "parental"
              ? "Record the name and relationship of the person with parental responsibility"
              : "Record the basis of the Gillick assessment";
        }
        return null;
      }
      case 2:
        if (hasStopAlerts) return "Cannot proceed: exclusion criteria present";
        if (!a.earAffected) return "Record which ear is affected";
        if (a.earAffected === "both" && !a.bothEarsExamined) return "Both ears affected: confirm both were examined";
        if (!a.symptomDuration) return "Record how long symptoms have been present";
        if (!a.painSeverity) return "Record the severity of pain";
        if (!a.tympanicMembrane) return "Record the otoscopy finding";
        if (!a.canalFindings.trim()) return "Record the otoscopy finding in terms: the state of the canal";
        if (!a.previousEpisodes12m) return "Record any previous episode in the last 12 months";
        return null;
      case 3:
        if (!state.treatment.product) return "Select the product supplied";
        if (!state.treatment.productReason.trim()) return "Record which product was supplied and why";
        if (!state.treatment.expiryDate) return "Record the expiry date";
        return null;
      case 4: {
        const c = state.counselling;
        if (state.treatment.product === "ciprofloxacin" && (!c.warmDrops || !c.liedPosition || !c.instilTechnique || !c.completeCourse))
          return "Confirm the ciprofloxacin administration counselling";
        if (state.treatment.product === "spray" && (!c.sprayTechnique || !c.sprayStopIfIrritation))
          return "Confirm the spray counselling";
        if (!c.avoidWater || !c.nothingInEar) return "Confirm the water-avoidance and nothing-in-the-ear advice";
        if (!c.seekAdvice || !c.noSecondCourse) return "Confirm the same-day help advice and that no second course is to be started";
        return null;
      }
      default:
        return null;
    }
  }, [currentStep, state, age, under16, hasStopAlerts]);

  const handleNext = useCallback(() => {
    if (stepError) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, [currentStep, stepError]);

  const handlePrev = useCallback(
    () => setCurrentStep((prev) => Math.max(prev - 1, 0)),
    []
  );

  const handleStepClick = useCallback(
    (step: number) => {
      if (completedSteps.has(step) || step <= currentStep) {
        setCurrentStep(step);
      }
    },
    [completedSteps, currentStep]
  );

  const stepTitles = [
    "Patient Details",
    "Consent",
    "Assessment",
    "Treatment",
    "Counselling",
    "Summary",
    "Consultation Complete",
  ];

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setState(initialState());
  }, []);

  const product = state.treatment.product ? PRODUCTS[state.treatment.product as Exclude<Product, "">] : null;

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName,
        lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth,
        nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone,
        email: state.patient.email,
        address: state.patient.address,
        gpName: state.patient.gpName,
        gpPractice: state.patient.gpPractice,
      },
      clinicalData: {
        ...(state as unknown as Record<string, unknown>),
        productSupplied: product?.name ?? null,
        pgdVersion: PGD_STRAPLINE,
      },
      outcome: hasStopAlerts ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStopAlerts, product]);

  const setA = (patch: Partial<typeof state.assessment>) =>
    setState((prev) => ({ ...prev, assessment: { ...prev.assessment, ...patch } }));
  const setC = (patch: Partial<typeof state.counselling>) =>
    setState((prev) => ({ ...prev, counselling: { ...prev.counselling, ...patch } }));

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={stepTitles}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={currentStep === 2 && hasStopAlerts}
      />
      <StepWrapper
        title={stepTitles[currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={stepError === null}
        isBlocked={currentStep === 2 && hasStopAlerts}
        validationError={stepError}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {/* Step 0: Patient Details */}
        {currentStep === 0 && (
          <>
            {age !== null && age <= 1 && <AlertBanner alerts={alerts.filter((x) => x.code === "AGE_UNDER_2")} />}
            <PatientDetailsStep
              patient={{ ...state.patient, age }}
              onChange={(field, value) =>
                setState((prev) => ({
                  ...prev,
                  patient: { ...prev.patient, [field]: value },
                }))
              }
              requireAdult={false}
            />
          </>
        )}

        {/* Step 1: Consent */}
        {currentStep === 1 && (
          <>
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                setState((prev) => ({
                  ...prev,
                  consent: { ...prev.consent, [field]: value },
                }))
              }
            />
            {under16 && (
              <div className="mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Patient under 16: basis of consent</p>
                <p className="text-xs text-amber-900">
                  Valid informed consent must be obtained from a person with parental responsibility where the
                  patient is under 16 and not Gillick competent. Record from whom.
                </p>
                <SelectInput
                  label="Consent given by"
                  value={state.consent16.basis}
                  onChange={(v) => setState((prev) => ({ ...prev, consent16: { ...prev.consent16, basis: v as "" | "parental" | "gillick" } }))}
                  options={[
                    { value: "parental", label: "A person with parental responsibility" },
                    { value: "gillick", label: "The young person, assessed as Gillick competent" },
                  ]}
                  required
                />
                {state.consent16.basis === "parental" && (
                  <TextInput
                    label="Name and relationship of the person with parental responsibility"
                    value={state.consent16.detail}
                    onChange={(v) => setState((prev) => ({ ...prev, consent16: { ...prev.consent16, detail: v } }))}
                    required
                  />
                )}
                {state.consent16.basis === "gillick" && (
                  <TextArea
                    label="Basis of the Gillick assessment"
                    value={state.consent16.detail}
                    onChange={(v) => setState((prev) => ({ ...prev, consent16: { ...prev.consent16, detail: v } }))}
                    required
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Step 2: Assessment */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {alerts.length > 0 && (
              <AlertBanner alerts={alerts} />
            )}

            <div className="space-y-4">
              <SelectInput
                label="Which ear is affected?"
                value={state.assessment.earAffected}
                onChange={(v) => setA({ earAffected: v as any })}
                options={[
                  { value: "", label: "Select..." },
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                  { value: "both", label: "Both" },
                ]}
                required
              />
              {state.assessment.earAffected === "both" && (
                <Checkbox
                  label="Both ears examined by otoscopy"
                  checked={state.assessment.bothEarsExamined}
                  onChange={(v) => setA({ bothEarsExamined: v })}
                  description="Supply for one ear unless both are affected and both were examined"
                  required
                />
              )}

              <SelectInput
                label="Duration of symptoms"
                value={state.assessment.symptomDuration}
                onChange={(v) => setA({ symptomDuration: v as any })}
                options={[
                  { value: "", label: "Select..." },
                  { value: "<48h", label: "Less than 48 hours" },
                  { value: "2-7d", label: "2-7 days" },
                  { value: ">7d", label: "7-14 days" },
                  { value: ">14d", label: "More than 14 days (failed treatment or chronic: refer)" },
                ]}
                required
              />

              <SelectInput
                label="Severity of pain"
                value={state.assessment.painSeverity}
                onChange={(v) => setA({ painSeverity: v as any })}
                options={[
                  { value: "mild", label: "Mild" },
                  { value: "moderate", label: "Moderate" },
                  { value: "severe", label: "Severe" },
                ]}
                required
              />

              <TextInput
                label="Treatment already tried for this episode"
                value={state.assessment.treatmentTried}
                onChange={(v) => setA({ treatmentTried: v })}
                placeholder="e.g. none; olive oil drops; acetic acid spray bought OTC"
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  Clinical signs and symptoms of acute otitis externa
                </p>
                <div className="space-y-2">
                  <Checkbox label="Ear pain, or tenderness of the tragus or pinna" checked={state.assessment.earPain} onChange={(v) => setA({ earPain: v })} />
                  <Checkbox label="Discharge from ear" checked={state.assessment.discharge} onChange={(v) => setA({ discharge: v })} />
                  <Checkbox label="Reduced hearing (simple canal blockage)" checked={state.assessment.reducedHearing} onChange={(v) => setA({ reducedHearing: v })} />
                  <Checkbox label="Itching in the ear" checked={state.assessment.itching} onChange={(v) => setA({ itching: v })} />
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-red-900">Otoscopy (required)</p>
                  <p className="text-xs text-red-800 mt-1">The tympanic membrane must be visualised and recorded as intact before either product is supplied. If you cannot see the drum, you cannot use this PGD. Where discharge or debris obstructs the canal, refer for aural toilet; do not attempt to clear the canal in the pharmacy.</p>
                </div>
                <SelectInput
                  label="Tympanic membrane on otoscopy"
                  value={state.assessment.tympanicMembrane}
                  onChange={(v) => setA({ tympanicMembrane: v as any })}
                  options={[
                    { value: "intact", label: "Seen, and intact" },
                    { value: "perforated", label: "Perforated, or perforation suspected" },
                    { value: "not-seen", label: "Could not be visualised" },
                  ]}
                  required
                />
                <TextArea
                  label="Otoscopy finding in terms: state of the canal (and what was done where the drum could not be seen)"
                  value={state.assessment.canalFindings}
                  onChange={(v) => setA({ canalFindings: v })}
                  placeholder="e.g. right canal red and oedematous with scant discharge, drum seen, intact, no debris"
                  rows={2}
                  required
                />
              </div>

              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-red-900">Appendix 1 red flags: ask and look for these before supplying anything. Any one excludes; the first three are emergencies.</p>
                </div>
                <Checkbox label="Patient has diabetes" checked={state.assessment.diabetes} onChange={(v) => setA({ diabetes: v })} />
                <Checkbox label="Patient is immunosuppressed" checked={state.assessment.immunosuppressed} onChange={(v) => setA({ immunosuppressed: v })} />
                <Checkbox
                  label="Severe unremitting pain"
                  checked={state.assessment.severeUnremittingPain}
                  onChange={(v) => setA({ severeUnremittingPain: v })}
                  description="With diabetes or immunosuppression this is necrotising (malignant) otitis externa until proven otherwise. Emergency ENT referral the same day, not a PGD supply."
                />
                <Checkbox label="Facial nerve palsy, or any weakness or drooping of the face" checked={state.assessment.facialPalsy} onChange={(v) => setA({ facialPalsy: v })} description="Emergency ENT referral the same day." />
                <Checkbox label="Pain, swelling, redness or tenderness over the mastoid (behind the ear), or an ear pushed forward" checked={state.assessment.mastoidSigns} onChange={(v) => setA({ mastoidSigns: v })} description="Suspect mastoiditis. Emergency referral the same day." />
                <Checkbox label="Systemic illness: fever, rigors, or the patient appearing unwell" checked={state.assessment.highTemperature} onChange={(v) => setA({ highTemperature: v })} description="Refer the same day." />
                <Checkbox label="Spreading infection: cellulitis of the pinna, the face or the neck" checked={state.assessment.spreadingCellulitis} onChange={(v) => setA({ spreadingCellulitis: v })} description="Refer the same day." />
                <Checkbox label="Vertigo, new hearing loss beyond simple canal blockage, tinnitus of new onset, or any other neurological symptom" checked={state.assessment.vertigoHearingLossNeuro} onChange={(v) => setA({ vertigoHearingLossNeuro: v })} />
                <Checkbox label="Suspected foreign body in the canal" checked={state.assessment.foreignBodySuspected} onChange={(v) => setA({ foreignBodySuspected: v })} description="Refer for removal." />
                <Checkbox label="White or black fuzzy debris in the canal" checked={state.assessment.fungalDebris} onChange={(v) => setA({ fungalDebris: v })} description="Suggests fungal infection. Antibacterial drops will not help and may worsen it. Refer." />
                <SelectInput
                  label="Episodes of this in the last 12 months"
                  value={state.assessment.previousEpisodes12m}
                  onChange={(v) => setA({ previousEpisodes12m: v as any })}
                  options={[
                    { value: "0", label: "None" },
                    { value: "1-2", label: "1 or 2" },
                    { value: "3+", label: "3 or more (recurrent: refer to ENT)" },
                  ]}
                  required
                />
                <Checkbox label="A previous course supplied under this PGD in the last 12 months" checked={state.assessment.previousCourseUnderPgd12m} onChange={(v) => setA({ previousCourseUnderPgd12m: v })} description="Record for the consultation record." />
                <Checkbox
                  label="A course already supplied for this episode, or no improvement after a full course"
                  checked={state.assessment.alreadyTreatedThisEpisode}
                  onChange={(v) => setA({ alreadyTreatedThisEpisode: v })}
                  description="One course per episode. Refer; do not supply a second course blind."
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Other exclusions
                </p>
                <Checkbox label="Otitis media, or any infection requiring an oral antibiotic" checked={state.assessment.otitisMediaOrOralAntibioticNeeded} onChange={(v) => setA({ otitisMediaOrOralAntibioticNeeded: v })} description="This document does not authorise an oral antibiotic. Refer." />
                <Checkbox label="History of ear surgery or perforated eardrum" checked={state.assessment.earSurgeryHistory} onChange={(v) => setA({ earSurgeryHistory: v })} />
                <Checkbox label="Grommet or tympanostomy tube in situ" checked={state.assessment.grommetsInPlace} onChange={(v) => setA({ grommetsInPlace: v })} />
                <Checkbox label="Known hypersensitivity to ciprofloxacin, any quinolone antibacterial, or any excipient" checked={state.assessment.quinoloneAllergy} onChange={(v) => setA({ quinoloneAllergy: v })} description="Excludes the ciprofloxacin drops" />
                <Checkbox label="Known hypersensitivity to neomycin, any aminoglycoside, dexamethasone, acetic acid or any excipient" checked={state.assessment.neomycinOrSprayAllergy} onChange={(v) => setA({ neomycinOrSprayAllergy: v })} description="Excludes the ear spray" />
                <Checkbox label="Already using another ear preparation" checked={state.assessment.otherEarDrops} onChange={(v) => setA({ otherEarDrops: v })} description="Exclusion. Concomitant ear preparations are not recommended." />
                <Checkbox label="Pregnant" checked={state.assessment.pregnancy} onChange={(v) => setA({ pregnancy: v })} description="Use the ciprofloxacin drops. The spray is not recommended in pregnancy." />
                <Checkbox label="Breastfeeding" checked={state.assessment.breastfeeding} onChange={(v) => setA({ breastfeeding: v })} description="Use the ciprofloxacin drops. The spray is excluded unless a decision about continuing breastfeeding or the treatment is recorded." />
                {state.assessment.breastfeeding && (
                  <TextInput
                    label="If the spray is to be used while breastfeeding: decision made and recorded"
                    value={state.assessment.breastfeedingDecisionRecorded}
                    onChange={(v) => setA({ breastfeedingDecisionRecorded: v })}
                    placeholder="Leave blank if using the ciprofloxacin drops"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Treatment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {alerts.some((x) => x.severity === "stop") && <AlertBanner alerts={alerts.filter((x) => x.severity === "stop")} />}
            <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
              <p>Where the tympanic membrane is intact and clearly seen, either product may be used. Ciprofloxacin drops are preferred where there is any doubt about the drum, in pregnancy and breastfeeding, and for a child aged 1 to under 2.</p>
              <p>The spray contains a corticosteroid and may settle a very inflamed, itchy canal faster; that is the only reason to choose it over the drops. Do not use both.</p>
            </div>
            <SelectInput
              label="Product supplied"
              value={state.treatment.product}
              onChange={(v) => setState((prev) => ({ ...prev, treatment: { ...prev.treatment, product: v as Product } }))}
              options={[
                { value: "ciprofloxacin", label: "Ciprofloxacin 2mg/ml ear drops, single-dose containers (from 1 year; preferred)" },
                { value: "spray", label: "Dexamethasone, neomycin and acetic acid ear spray (from 2 years; not in pregnancy)" },
              ]}
              required
            />
            <TextArea
              label="Which product was supplied and why"
              value={state.treatment.productReason}
              onChange={(v) => setState((prev) => ({ ...prev, treatment: { ...prev.treatment, productReason: v } }))}
              placeholder="e.g. drops: drum seen but view partly obscured; or spray: very inflamed itchy canal, drum clearly intact"
              rows={2}
              required
            />
            {product && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-900 mb-3">
                  {product.name}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">Form:</dt><dd className="font-medium text-gray-900 text-right">{product.form}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">Dose:</dt><dd className="font-medium text-gray-900 text-right">{product.dose}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">Frequency:</dt><dd className="font-medium text-gray-900 text-right">{product.frequency}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">Duration:</dt><dd className="font-medium text-gray-900 text-right">{product.duration}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">Quantity supplied:</dt><dd className="font-medium text-gray-900 text-right">{product.quantity}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-600">Route and method:</dt><dd className="font-medium text-gray-900 text-right">{product.route}</dd></div>
                </dl>
              </div>
            )}

            <div className="space-y-4">
              <TextInput
                label="Batch number"
                value={state.treatment.batchNumber}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, batchNumber: v },
                  }))
                }
                placeholder="e.g., LOT123456"
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.treatment.expiryDate}
                onChange={(v) =>
                  setState((prev) => ({
                    ...prev,
                    treatment: { ...prev.treatment, expiryDate: v },
                  }))
                }
                required
              />
            </div>
          </div>
        )}

        {/* Step 4: Counselling */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Confirm that the following counselling points have been provided
              to the patient. Supply the patient information leaflet provided with the product.
            </p>
            <div className="space-y-3">
              {state.treatment.product === "ciprofloxacin" && (
                <>
                  <Checkbox label="Warm the ampoule in your hand first. Cold drops make you dizzy." checked={state.counselling.warmDrops} onChange={(v) => setC({ warmDrops: v })} />
                  <Checkbox label="Lie with the sore ear facing up, put the drops in, tug the ear gently a few times, and stay there for 5 minutes" checked={state.counselling.liedPosition} onChange={(v) => setC({ liedPosition: v })} />
                  <Checkbox label="Use a new ampoule each time and throw it away afterwards; if an ear wick is used the first dose only is two ampoules" checked={state.counselling.instilTechnique} onChange={(v) => setC({ instilTechnique: v })} />
                  <Checkbox label="Twice a day for 7 days" checked={state.counselling.completeCourse} onChange={(v) => setC({ completeCourse: v })} />
                </>
              )}
              {state.treatment.product === "spray" && (
                <>
                  <Checkbox label="Shake the bottle well; prime before first use. One spray into the sore ear, three times a day. Keep your head tilted or lie on your side for a few minutes afterwards." checked={state.counselling.sprayTechnique} onChange={(v) => setC({ sprayTechnique: v })} />
                  <Checkbox label="Stop and tell us if the ear becomes more irritated or you get a rash. Some people become allergic to neomycin. A transient stinging or burning in the first few days is expected." checked={state.counselling.sprayStopIfIrritation} onChange={(v) => setC({ sprayStopIfIrritation: v })} />
                </>
              )}
              <Checkbox label="Keep water out of the ear for the whole course and a week after. No swimming. Shower cap or petroleum jelly on cotton wool." checked={state.counselling.avoidWater} onChange={(v) => setC({ avoidWater: v })} />
              <Checkbox label="Nothing goes in the ear: no cotton buds, no earplugs, no self-cleaning" checked={state.counselling.nothingInEar} onChange={(v) => setC({ nothingInEar: v })} />
              <Checkbox label="Paracetamol or ibuprofen for the pain if they suit you (separate pharmacy sale, usual checks)" checked={state.counselling.painRelief} onChange={(v) => setC({ painRelief: v })} />
              <Checkbox
                label="Seek help the SAME DAY if: the pain becomes severe and does not let up (particularly with diabetes or a weakened immune system); any weakness or drooping of the face; swelling, redness or pain in the bone behind the ear, or the ear starts to stick out; a temperature or feeling generally unwell; a rash or swelling of the lips, face or throat (stop the drops)"
                checked={state.counselling.seekAdvice}
                onChange={(v) => setC({ seekAdvice: v })}
              />
              <Checkbox label="If no better after finishing the 7 days, go to your GP. Do not start a second course." checked={state.counselling.noSecondCourse} onChange={(v) => setC({ noSecondCourse: v })} />
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Pharmacist details
              </h3>
              <div className="space-y-3">
                <TextInput
                  label="Pharmacist name"
                  value={state.summary.pharmacistName}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, pharmacistName: v },
                    }))
                  }
                  required
                />
                <TextInput
                  label="GPhC registration number"
                  value={state.summary.pharmacistGPhC}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, pharmacistGPhC: v },
                    }))
                  }
                  required
                  placeholder="e.g., 2123456"
                />
                <TextInput
                  label="Pharmacy name"
                  value={state.summary.pharmacyName}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, pharmacyName: v },
                    }))
                  }
                />
                <TextInput
                  label="Pharmacy address"
                  value={state.summary.pharmacyAddress}
                  onChange={(v) =>
                    setState((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, pharmacyAddress: v },
                    }))
                  }
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Consultation details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {state.summary.consultationDate}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {state.summary.consultationTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-md text-xs space-y-1 border border-gray-200">
              <div><strong>PGD:</strong> {PGD_STRAPLINE}</div>
              <div><strong>Consent:</strong> {state.consent.informedConsentGiven ? "Given" : "Not recorded"}{under16 ? `; under 16: ${state.consent16.basis === "parental" ? "person with parental responsibility" : state.consent16.basis === "gillick" ? "Gillick competent young person" : "not recorded"}${state.consent16.detail ? ` (${state.consent16.detail})` : ""}` : ""}</div>
              <div><strong>Ear:</strong> {state.assessment.earAffected || "not recorded"}{state.assessment.earAffected === "both" ? `; both examined: ${state.assessment.bothEarsExamined ? "yes" : "no"}` : ""}</div>
              <div><strong>Otoscopy:</strong> drum {state.assessment.tympanicMembrane === "intact" ? "seen and intact" : state.assessment.tympanicMembrane === "perforated" ? "perforated or suspected" : state.assessment.tympanicMembrane === "not-seen" ? "not visualised" : "not recorded"}; canal: {state.assessment.canalFindings || "not recorded"}</div>
              <div><strong>Red flags (Appendix 1) asked about or looked for:</strong> {hasStopAlerts ? "present, see alerts" : "all absent"}</div>
              <div><strong>Diabetes:</strong> {state.assessment.diabetes ? "yes" : "no"}; <strong>immunosuppression:</strong> {state.assessment.immunosuppressed ? "yes" : "no"}; <strong>pain severity:</strong> {state.assessment.painSeverity || "not recorded"}</div>
              <div><strong>Duration:</strong> {state.assessment.symptomDuration || "not recorded"}; <strong>treatment tried:</strong> {state.assessment.treatmentTried || "none recorded"}</div>
              <div><strong>Episodes in last 12 months:</strong> {state.assessment.previousEpisodes12m || "not recorded"}; <strong>previous course under this PGD:</strong> {state.assessment.previousCourseUnderPgd12m ? "yes" : "no"}</div>
              <div><strong>Product supplied and why:</strong> {product?.name ?? "none"}; {state.treatment.productReason || "reason not recorded"}</div>
              {product && (
                <div><strong>Form, strength, dose, quantity:</strong> {product.form}; {product.dose}, {product.frequency}; {product.duration}; {product.quantity}. Batch {state.treatment.batchNumber || "not recorded"}, expiry {state.treatment.expiryDate || "not recorded"}. Supplied under this PGD.</div>
              )}
            </div>

            <TextArea
              label="Clinical notes"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  summary: { ...prev.summary, clinicalNotes: v },
                }))
              }
              rows={4}
              placeholder="Record any additional clinical notes or observations..."
            />
          </div>
        )}

        {/* Step 6: Consultation Complete */}
        {currentStep === 6 && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-4xl text-green-600 mb-2">✓</div>
            <p className="text-lg font-semibold text-green-900 mb-2">
              Consultation Record Complete
            </p>
            <p className="text-sm text-green-700">
              The acute otitis externa ePGD consultation ({product?.name ?? "no product supplied"}) has been recorded under the {PGD_STRAPLINE}.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}

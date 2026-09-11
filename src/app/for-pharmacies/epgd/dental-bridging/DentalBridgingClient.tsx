"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";
import { calculateAge, validatePatientStep, validateConsentStep, validateSummaryStep } from "../shared/types";
import { DentalBridgingSummaryReport } from "./components/DentalBridgingSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

// Aligned to the signed PGD version 008, issued 11 September 2026:
// amoxicillin 500mg capsules first line, metronidazole 200mg tablets for
// penicillin allergy; adults 18 and over; spreading or systemic infection only.
export const PGD_STRAPLINE = "Acute Dental Infection (bridging antibiotic) PGD version 008, issued 11 September 2026";
const COURSE_QUANTITY = 15;

export const AMOXICILLIN_ARM = "Amoxicillin 500mg TDS";
export const METRONIDAZOLE_ARM = "Metronidazole 200mg TDS";

export function createInitialState() {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null as number | null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false, notifyGp: false as boolean | undefined },
    assessment: {
      painType: "",
      painDuration: "",
      painSeverity: "",
      localisedSwelling: false,
      pusDischarge: false,
      // ── Signs of SPREADING or SYSTEMIC infection ──────────────────────
      // Under v004 these are what makes an antibiotic indicated. Under v003
      // they were exclusions, which is why the indication was inverted.
      facialSwelling: false,
      lymphadenopathy: false,
      malaise: false,
      cellulitis: false,
      /** Fever is derived from the measured temperature only (38 or above). */
      temperature: null as number | null,
      /** Positive confirmation that Appendix 1 was worked through, never inferred from untouched boxes. */
      redFlagsAssessed: false,
      /** Positive confirmation that the signs of spread and systemic involvement were assessed (set when spreadPresent is answered). */
      spreadAssessed: false,
      /**
       * The pharmacist's answer to "is the infection spreading, or the patient
       * systemically involved?". The localised, no-antibiotic outcome is a stop
       * and fires only on an explicit "no", never because the sign boxes above
       * were left unticked (stop audit, 11 Sep 2026).
       */
      spreadPresent: "" as "" | "yes" | "no",
      // ── Higher risk of complications even if localised (CKS) ──────────
      immunosuppressed: false,
      poorlyControlledDiabetes: false,
      higherRiskReason: "",
      // ── EMERGENCY red flags: 999 or same-day, never a supply ──────────
      difficultSwallowingBreathing: false,
      floorOfMouthSwelling: false,
      trismus: false,
      periorbital: false,
      rapidlySpreading: false,
      sepsisSigns: false,
      penicillinAllergy: false,
      penicillinAllergyHistory: "",
      metronidazoleAllergy: false,
      warfarin: false,
      pregnancy: false,
      breastfeeding: false,
      otherAntibiotics: false,
      courseAlreadySuppliedThisEpisode: false,
      // Amoxicillin arm exclusions
      renalFunctionAsked: false,
      /** The patient's answer about kidney function, recorded as given. */
      renalFunctionAnswer: "" as "" | "none-known" | "unknown-no-suspicion" | "known-impairment",
      renalFunctionDetail: "",
      significantRenalImpairment: false,
      mononucleosisOrALL: false,
      // Metronidazole arm exclusions
      alcoholCanAvoid: "" as "" | "yes" | "no",
      cockayneSyndrome: false,
      severeHepaticOrNeurological: false,
      // Inclusion: unable to obtain definitive dental treatment before the
      // infection would worsen, and willing and able to arrange an urgent
      // dental appointment within 24 to 48 hours
      urgentDentalAppointmentCommitted: false,
      dentalAppointmentBooked: false,
      dentalAppointmentDate: "",
    },
    treatment: {
      // Follows the allergy answer (rewritten by the allergy checkbox);
      // treatmentError refuses any mismatch.
      antibiotic: AMOXICILLIN_ARM as string,
      quantity: COURSE_QUANTITY as number | null,
      batchNumber: "",
      expiryDate: "",
      // v004 supplies no analgesia. v003 offered ibuprofen and paracetamol
      // as "OTC Analgesics (Recommended)" while the document said ibuprofen
      // is not supplied under this PGD. Recorded now as advice given and a
      // pharmacy sale under the pharmacy's own protocol, which is what the
      // document actually authorises.
      analgesiaAdviceGiven: false,
      analgesiaSoldUnderProtocol: "",
    },
    // The document's counselling rows, each confirmed individually.
    counselling: {
      bridgeNotCure: false,
      finishCourse: false,
      howToTake: false,
      sameDayHelp: false,
      armSpecific: false,
      painReliefOtc: false,
      dentalAppointmentArranged: false,
      pilSupplied: false,
      /** Advice given where excluded, declining, or where no antibiotic is indicated. */
      exclusionAdvice: "",
      /** Details of any adverse drug reactions and the actions taken (Yellow Card). */
      adverseReactions: "",
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      clinicalNotes: "",
    },
  };
}

export type DentalState = ReturnType<typeof createInitialState>;

export function renalFunctionText(answer: DentalState["assessment"]["renalFunctionAnswer"], detail: string): string {
  switch (answer) {
    case "none-known":
      return "Asked: no known kidney problems";
    case "unknown-no-suspicion":
      return "Asked: patient does not know; no reason to suspect impairment";
    case "known-impairment":
      return `Asked: known kidney impairment${detail ? ` (${detail})` : ""}`;
    default:
      return "Not asked";
  }
}

export default function DentalBridgingClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<DentalState>(createInitialState);

  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if ((state as any).summary?.pharmacistName || (state as any).summary?.pharmacistGPhC) return;
    setState((prev: any) => ({ ...prev, summary: { ...(prev.summary || {}), pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, (state as any).summary?.pharmacistName, (state as any).summary?.pharmacistGPhC]);


  // ── Which of the three outcomes applies ───────────────────────────────
  //
  // Aligned to signed document v004 (9 Sep 2026). v003 had the indication
  // inverted: it required the ABSENCE of swelling, fever and systemic
  // features, so it authorised an antibiotic for the cohort SDCEP and NICE
  // CKS say should not receive one, and referred the cohort that is the
  // actual indication. This tool followed the same shape: fever was an
  // advisory "red flag" rather than anything that changed the outcome.
  //
  // v004: decide the outcome FIRST, then consider a medicine.
  const emergency = useMemo(() => {
    const a = state.assessment;
    return (
      a.difficultSwallowingBreathing ||
      a.floorOfMouthSwelling ||
      a.trismus ||
      a.periorbital ||
      a.rapidlySpreading ||
      a.sepsisSigns
    );
  }, [state.assessment]);

  const age = state.patient.age;
  const patientError = useMemo(() => {
    const base = validatePatientStep(state.patient, { minAge: 18 });
    if (base) return base;
    if (state.patient.age === null) return "The patient's age could not be calculated from the date of birth";
    return null;
  }, [state.patient]);

  const fever = state.assessment.temperature !== null && state.assessment.temperature >= 38;
  const spreadingOrSystemic = useMemo(() => {
    const a = state.assessment;
    return a.facialSwelling || a.lymphadenopathy || a.malaise || a.cellulitis || fever;
  }, [state.assessment, fever]);

  const higherRisk = useMemo(
    () => state.assessment.immunosuppressed || state.assessment.poorlyControlledDiabetes,
    [state.assessment]
  );

  const outcome = useMemo<"emergency" | "no-antibiotic" | "bridge">(() => {
    if (emergency) return "emergency";
    if (spreadingOrSystemic || higherRisk) return "bridge";
    return "no-antibiotic";
  }, [emergency, spreadingOrSystemic, higherRisk]);

  const clinicalAlerts = useMemo<ClinicalAlert[]>(() => {
    const alerts: ClinicalAlert[] = [];
    const a = state.assessment;

    // ── Age: adults 18 and over only ────────────────────────────────────
    if (age !== null && age < 18) {
      alerts.push({
        severity: "stop",
        code: "UNDER_18",
        message: "Under 18: refer",
        detail:
          "Children with dental infection are referred: this PGD carries no paediatric dose, no suitable formulation and no paediatric red flag route.",
      });
    }

    // ── Outcome 3: emergency ────────────────────────────────────────────
    if (a.difficultSwallowingBreathing) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_AIRWAY",
        message: "EMERGENCY: call 999 now",
        detail:
          "Difficulty swallowing or breathing, or a change in the voice, suggests airway involvement or Ludwig's angina. Call 999. Do not supply an antibiotic and do not let arranging one delay the call.",
      });
    }
    if (a.floorOfMouthSwelling) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_LUDWIG",
        message: "EMERGENCY: call 999 now",
        detail:
          "Swelling of the floor of the mouth, or a raised or displaced tongue, suggests Ludwig's angina. Call 999.",
      });
    }
    if (a.trismus) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_TRISMUS",
        message: "Emergency: same-day assessment, do not supply",
        detail:
          "The patient cannot open their mouth more than about two finger widths. This suggests deep space infection. Same-day emergency assessment, not a dental appointment and not an antibiotic. v003 treated this as an advisory note only.",
      });
    }
    if (a.periorbital) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_PERIORBITAL",
        message: "Emergency: same-day assessment, do not supply",
        detail:
          "Swelling closing the eye, eye pain, double vision or reduced vision indicates periorbital or orbital involvement. Same-day emergency assessment.",
      });
    }
    if (a.rapidlySpreading) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_SPREADING",
        message: "Emergency: same-day assessment, do not supply",
        detail: "Rapidly spreading swelling, or swelling extending down the neck. Same-day emergency assessment.",
      });
    }
    if (a.sepsisSigns) {
      alerts.push({
        severity: "stop",
        code: "EMERGENCY_SEPSIS",
        message: "EMERGENCY: possible sepsis",
        detail:
          "Rigors, confusion, very rapid breathing or heart rate, mottled or ashen skin, or not passing urine. Treat as sepsis and escalate immediately.",
      });
    }

    // ── Outcome 1: localised, no antibiotic indicated ───────────────────
    // Raised only on the pharmacist's explicit answer "No" to the spread
    // question (a No to the inclusion), once the red flags are confirmed as
    // assessed. Unticked sign boxes on their own never raise it.
    if (outcome === "no-antibiotic" && a.redFlagsAssessed && a.spreadPresent === "no") {
      alerts.push({
        severity: "stop",
        code: "LOCALISED_NO_ANTIBIOTIC",
        message: "Localised infection: an antibiotic is NOT indicated",
        detail:
          "No sign of spreading or systemic infection, and no higher-risk factor. SDCEP and NICE CKS are consistent that antibiotics are not indicated for a localised dental infection in an otherwise healthy patient: the infection is being contained, and the abscess is largely walled off from the circulation so very little antibiotic reaches it. Give analgesia advice, sell analgesia under the pharmacy's own protocol if needed, and arrange urgent dental care. This is the service working correctly, not a refusal.",
      });
    }

    // ── Outcome 2: the bridging cohort ──────────────────────────────────
    if (outcome === "bridge") {
      alerts.push({
        severity: "caution",
        code: "BRIDGE_INDICATED",
        message: higherRisk && !spreadingOrSystemic
          ? "Higher-risk patient: bridging antibiotic may be supplied"
          : "Spreading or systemic infection: bridging antibiotic indicated",
        detail:
          "Supply under this PGD AND arrange an urgent dental appointment within 24 to 48 hours. The antibiotic is a bridge: it does not drain the infection or remove the cause. Record which sign of spread, or which higher-risk factor, justified the supply.",
      });
    }

    // ── Arm selection and arm-specific exclusions ───────────────────────
    if (a.penicillinAllergy && a.metronidazoleAllergy) {
      alerts.push({
        severity: "stop",
        code: "UNSUITABLE_BOTH_ALLERGIES",
        message: "No arm available: refer",
        detail: "Allergic to both penicillin and metronidazole. Refer for dental assessment and alternative management.",
      });
    } else if (a.penicillinAllergy) {
      alerts.push({
        severity: "caution",
        code: "PENICILLIN_ALLERGY_METRONIDAZOLE",
        message: "Penicillin allergy: metronidazole arm applies",
        detail:
          "Metronidazole 200mg three times daily for 5 days. NOT 400mg: 200mg is the licensed dose for acute dental infection and this PGD stays within the licence. Confirm the patient can avoid alcohol completely during the course and for 48 hours afterwards.",
      });
    }

    // Metronidazole arm exclusions. These are exclusions in v008, not
    // cautions: v003's tool listed warfarin as a caution to "inform the GP".
    if (a.penicillinAllergy && a.warfarin) {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_WARFARIN",
        message: "Interacting medicine excludes the metronidazole arm",
        detail:
          "Warfarin or another coumarin, lithium, disulfiram, busulfan, 5-fluorouracil, ciclosporin, phenytoin, phenobarbital, or a QT-prolonging medicine excludes metronidazole. Refer. Say plainly that the issue is the antibiotic and not the dental problem.",
      });
    }
    if (a.penicillinAllergy && a.alcoholCanAvoid === "no") {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_ALCOHOL",
        message: "Unable or unwilling to avoid alcohol: metronidazole arm excluded",
        detail:
          "The patient must avoid alcohol completely during the course and for 48 hours afterwards. Ask directly and record the answer. Refer.",
      });
    }
    if (a.penicillinAllergy && a.cockayneSyndrome) {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_COCKAYNE",
        message: "Cockayne syndrome: absolute exclusion for metronidazole",
        detail:
          "Reports of severe and sometimes fatal hepatotoxicity of very rapid onset. Refer.",
      });
    }
    if (a.penicillinAllergy && a.severeHepaticOrNeurological) {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_HEPATIC_NEURO",
        message: "Severe hepatic impairment or active neurological disease excludes the metronidazole arm",
        detail: "Refer.",
      });
    }
    // Amoxicillin arm exclusions
    if (!a.penicillinAllergy && a.significantRenalImpairment) {
      alerts.push({
        severity: "stop",
        code: "AMOXICILLIN_RENAL",
        message: "Known significant renal impairment: refer",
        detail: "A short bridging course is not the place for a dose adjustment. Refer.",
      });
    }
    if (!a.penicillinAllergy && a.renalFunctionAnswer === "known-impairment" && !a.significantRenalImpairment) {
      alerts.push({
        severity: "caution",
        code: "AMOXICILLIN_RENAL_KNOWN",
        message: "Known kidney impairment recorded",
        detail:
          "If the impairment is significant, tick Known significant renal impairment (exclusion for the amoxicillin arm) and refer. Mild impairment does not exclude a 5 day course.",
      });
    }
    if (!a.penicillinAllergy && a.mononucleosisOrALL) {
      alerts.push({
        severity: "stop",
        code: "AMOXICILLIN_MONO",
        message: "Infectious mononucleosis or acute lymphoblastic leukaemia: amoxicillin excluded",
        detail: "Because of the risk of a widespread rash. Refer.",
      });
    }
    if (a.penicillinAllergy && (a.pregnancy || a.breastfeeding)) {
      alerts.push({
        severity: "stop",
        code: "METRONIDAZOLE_PREGNANCY",
        message: "Pregnancy or breastfeeding excludes the metronidazole arm",
        detail:
          "The SPC advises metronidazole should not be given in pregnancy or lactation unless considered essential, which is a prescriber judgement and not a PGD one. Refer. Say plainly that the issue is the antibiotic and not the dental problem.",
      });
    }

    // Amoxicillin arm: pregnancy and breastfeeding PERMIT supply. v003
    // deleted these statements from the document altogether, and the tool
    // said metronidazole "should be avoided in first trimester", which is
    // not the position either the SPC or this PGD takes.
    if (!a.penicillinAllergy && (a.pregnancy || a.breastfeeding)) {
      alerts.push({
        severity: "caution",
        code: "AMOXICILLIN_PREGNANCY_OK",
        message: "Amoxicillin may be supplied in pregnancy and breastfeeding",
        detail:
          "Amoxicillin is well established in pregnancy and is the usual choice where an antibiotic is indicated. Small amounts appear in breast milk; that is not a reason to withhold it or to interrupt feeding.",
      });
    }

    if (a.otherAntibiotics) {
      alerts.push({
        severity: "stop",
        code: "CONCURRENT_ANTIBIOTICS",
        message: "Already taking an antibiotic: do not supply",
        detail:
          "An antibiotic already taken for this or any other indication is an exclusion under this PGD. Refer.",
      });
    }
    if (a.courseAlreadySuppliedThisEpisode) {
      alerts.push({
        severity: "stop",
        code: "COURSE_ALREADY_SUPPLIED",
        message: "A course already supplied for this episode: do not supply",
        detail: "One supply per episode. A second course is not authorised under this PGD; refer.",
      });
    }

    return alerts;
  }, [state.assessment, outcome, higherRisk, spreadingOrSystemic, age]);

  const hasStopAlerts = clinicalAlerts.some(a => a.severity === "stop");

  // Required records before leaving the assessment (PGD v008 inclusion
  // criteria and records to be kept).
  const assessmentError = useMemo<string | null>(() => {
    const a = state.assessment;
    if (!a.redFlagsAssessed) return "Confirm that the Appendix 1 emergency red flags were assessed";
    if (a.temperature === null) return "Record the temperature";
    if (!a.spreadPresent) return "Answer: is the infection spreading, or is the patient systemically involved? (Yes or No)";
    if (a.spreadPresent === "yes" && !spreadingOrSystemic)
      return "You answered Yes to spread or systemic involvement but no sign is ticked and there is no fever: tick the sign that is present, or change the answer to No";
    if (a.spreadPresent === "no" && spreadingOrSystemic)
      return "You answered No to spread or systemic involvement but a sign is ticked or the temperature is 38 or above: untick the sign, or change the answer to Yes";
    if (!a.painType) return "Pain assessment: select the type of dental pain";
    if (!a.painDuration) return "Pain assessment: select the duration of symptoms";
    if (!a.painSeverity) return "Pain assessment: select the severity of pain";
    if (higherRisk && !spreadingOrSystemic && !a.higherRiskReason.trim())
      return "Record which higher-risk factor applies and why you judged the risk higher";
    if (a.penicillinAllergy && !a.penicillinAllergyHistory.trim())
      return "Record the penicillin allergy history in the patient's own terms";
    if (a.penicillinAllergy && !a.alcoholCanAvoid)
      return "Ask directly whether the patient can avoid alcohol completely during the course and for 48 hours afterwards, and record the answer";
    if (!a.penicillinAllergy && (!a.renalFunctionAsked || !a.renalFunctionAnswer))
      return "Renal function: ask the patient about their kidney function and select the answer given";
    if (!a.penicillinAllergy && a.renalFunctionAnswer === "known-impairment" && !a.renalFunctionDetail.trim())
      return "Renal function: record the detail of the known kidney impairment";
    if (a.dentalAppointmentBooked && a.dentalAppointmentDate && a.dentalAppointmentDate < new Date().toISOString().split("T")[0])
      return "Dental appointment date is in the past: check the date";
    if (!a.urgentDentalAppointmentCommitted)
      return "Confirm the patient is unable to obtain definitive dental treatment before the infection would worsen, and is willing and able to arrange an urgent dental appointment within 24 to 48 hours";
    return null;
  }, [state.assessment, higherRisk, spreadingOrSystemic]);

  // The arm follows the allergy on every render: it is never "set once" and
  // left behind when the allergy answer changes (adversarial review, 11 Sep
  // 2026: a penicillin allergy ticked after the treatment page had loaded
  // left amoxicillin selected and greyed out).
  const selectedAntibiotic = state.assessment.penicillinAllergy ? METRONIDAZOLE_ARM : AMOXICILLIN_ARM;
  const isMetronidazole = selectedAntibiotic === METRONIDAZOLE_ARM;

  const treatmentError = useMemo<string | null>(() => {
    const t = state.treatment;
    if (t.antibiotic !== selectedAntibiotic) return "The antibiotic does not match the recorded allergy status";
    if (t.quantity !== COURSE_QUANTITY) return `Quantity must be ${COURSE_QUANTITY}: supply the whole 5-day course, do not split it`;
    if (!t.batchNumber.trim()) return "Record the batch number";
    if (!t.expiryDate) return "Record the expiry date";
    if (t.expiryDate < new Date().toISOString().split("T")[0]) return "Expiry date is in the past: this pack cannot be supplied";
    return null;
  }, [state.treatment, selectedAntibiotic]);

  const counsellingError = useMemo<string | null>(() => {
    const c = state.counselling;
    if (!c.bridgeNotCure) return "Confirm the patient was told this is a bridge, not a cure, and that a dentist is still needed within 24 to 48 hours";
    if (!c.finishCourse) return "Confirm the advice to finish the whole course";
    if (!c.howToTake) return "Confirm the advice on how to take the antibiotic";
    if (!c.armSpecific) return isMetronidazole ? "Confirm the metronidazole advice: no alcohol at all, metallic taste, numbness or pins and needles" : "Confirm the amoxicillin advice: diarrhoea, and rash or swelling";
    if (!c.sameDayHelp) return "Confirm the same-day and 999 advice";
    if (!c.painReliefOtc) return "Confirm the pain relief advice";
    if (!c.dentalAppointmentArranged) return "Confirm the dental appointment was arranged, or the NHS 111 route given";
    if (!c.pilSupplied) return "Confirm the patient information leaflet was supplied";
    return null;
  }, [state.counselling, isMetronidazole]);

  const summaryError = useMemo(() => validateSummaryStep(state.summary), [state.summary]);
  const consentError = useMemo(() => validateConsentStep(state.consent), [state.consent]);

  const stepError = useMemo<string | null>(() => {
    switch (currentStep) {
      case 0:
        return patientError;
      case 1:
        return consentError;
      case 2:
        return assessmentError;
      case 3:
        return treatmentError;
      case 4:
        return counsellingError;
      case 5:
        return summaryError;
      // Last step: every rule runs again before Save & Print.
      case 6:
        return patientError || consentError || assessmentError || treatmentError || counsellingError || summaryError;
      default:
        return null;
    }
  }, [currentStep, patientError, assessmentError, treatmentError, counsellingError, summaryError, consentError]);

  // Outcomes 1 (localised, no antibiotic) and 3 (emergency) are stops: they
  // block Next on the assessment step and every later one, and are saved
  // from the blocked step with "Save as not supplied".
  // (The under-18 stop is raised on the Patient step, so the referral can be
  // saved from there too.)
  const isBlocked = hasStopAlerts;

  const handleNext = useCallback(() => {
    if (stepError || isBlocked) return;
    setCurrentStep(prev => Math.min(prev + 1, 6));
  }, [stepError, isBlocked]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setState(createInitialState());
  }, []);

  const stepTitles = [
    "Patient Details",
    "Consent",
    "Assessment",
    "Treatment",
    "Counselling",
    "Summary",
    "Consultation Complete",
  ];


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
        outcomeCategory: outcome,
        alerts: clinicalAlerts,
        selectedAntibiotic,
        pgdVersion: PGD_STRAPLINE,
      },
      outcome: outcome === "emergency" ? "referred" : hasStopAlerts || outcome !== "bridge" ? "not_supplied" : "completed",
      medicine:
        !hasStopAlerts && outcome === "bridge"
          ? {
              name: isMetronidazole ? "Metronidazole 200mg tablets" : "Amoxicillin 500mg capsules",
              dose: isMetronidazole ? "200mg three times daily" : "500mg three times daily",
              duration: "5 days",
              quantity: COURSE_QUANTITY,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: !!state.consent.notifyGp },
    };
  }, [state, outcome, hasStopAlerts, clinicalAlerts, selectedAntibiotic, isMetronidazole, __pharmProfile]);

  return (
    <>
    <div className="space-y-6 print:hidden">
      <ProgressBar current={currentStep + 1} total={7} />

      {clinicalAlerts.length > 0 && <AlertBanner alerts={clinicalAlerts} />}
      {isBlocked && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
          <p className="text-sm font-medium text-navy-900">
            {age !== null && age < 18
              ? "Under 18: this PGD is for adults. Refer for dental assessment. Record the advice given, then use Save as not supplied"
              : outcome === "emergency"
              ? "Outcome 3, emergency: make the urgency explicit and act on it in front of the patient. Record the advice and action, then use Save as not supplied"
              : outcome === "no-antibiotic"
                ? "Outcome 1, localised infection: no antibiotic. Say so plainly and explain why; offer analgesia advice and help with a dental appointment. Record the advice, then use Save as not supplied"
                : "Excluded: say plainly that the issue is the antibiotic and not the dental problem. Record the advice given and the decision, then use Save as not supplied"}
          </p>
          <TextArea
            label="Advice given and decision reached"
            value={state.counselling.exclusionAdvice}
            onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, exclusionAdvice: v } }))}
            rows={3}
            placeholder="e.g. explained antibiotics do not treat a localised abscess; analgesia advice given; NHS 111 emergency dental route given"
          />
        </div>
      )}

      <StepWrapper
        title={stepTitles[currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={stepError === null && !isBlocked}
        validationError={stepError}
        isBlocked={isBlocked}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState(prev => ({
                ...prev,
                patient: {
                  ...prev.patient,
                  [field]: value,
                  ...(field === "dateOfBirth" ? { age: calculateAge(String(value ?? "")) } : {}),
                },
              }))
            }
          />
        )}

        {currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              setState(prev => ({
                ...prev,
                consent: { ...prev.consent, [field]: value },
              }))
            }
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* ──────────────────────────────────────────────────────────
                Order matters here, and it is the order of signed document
                v004: emergency red flags, then spread, then higher risk.
                v003 asked about swelling and fever as things that STOPPED a
                supply, which inverted the indication. Under v004 they are
                what makes an antibiotic indicated at all.
               ────────────────────────────────────────────────────────── */}
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg space-y-3">
              <h3 className="text-base font-semibold text-red-900">
                Step 1. Emergency red flags. Any one of these is 999 or same-day care, never a supply.
              </h3>
              <Checkbox
                label="Difficulty breathing or swallowing, drooling, or any change in the voice"
                checked={state.assessment.difficultSwallowingBreathing}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, difficultSwallowingBreathing: v } }))}
                description="Call 999."
              />
              <Checkbox
                label="Swelling of the floor of the mouth, or a raised or displaced tongue"
                checked={state.assessment.floorOfMouthSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, floorOfMouthSwelling: v } }))}
                description="Suggests Ludwig's angina. Call 999."
              />
              <Checkbox
                label="Trismus: cannot open the mouth more than about two finger widths"
                checked={state.assessment.trismus}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, trismus: v } }))}
                description="Same-day emergency assessment. Earlier versions treated this as an advisory note only."
              />
              <Checkbox
                label="Periorbital or orbital involvement: swelling closing the eye, eye pain, double or reduced vision"
                checked={state.assessment.periorbital}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, periorbital: v } }))}
                description="Same-day emergency assessment."
              />
              <Checkbox
                label="Rapidly spreading swelling, or swelling extending down the neck"
                checked={state.assessment.rapidlySpreading}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, rapidlySpreading: v } }))}
              />
              <Checkbox
                label="Signs of sepsis: rigors, confusion, very rapid breathing or heart rate, mottled skin, not passing urine"
                checked={state.assessment.sepsisSigns}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, sepsisSigns: v } }))}
              />
              <Checkbox
                label="Appendix 1 emergency red flags assessed (airway, floor of mouth, trismus, periorbital, rapid spread, sepsis)"
                checked={state.assessment.redFlagsAssessed}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, redFlagsAssessed: v } }))}
                description="Required. The record states that Appendix 1 was worked through only when this is confirmed, never because the boxes above were left untouched."
                required
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3">
              <h3 className="text-base font-semibold text-amber-900">
                Step 2. Is the infection spreading, or is the patient systemically involved?
              </h3>
              <p className="text-xs text-amber-900">
                This is the question that decides whether an antibiotic is indicated at all. If none of
                these is present and the patient is not at higher risk, an antibiotic is NOT indicated:
                analgesia advice and urgent dental care are the correct answer.
              </p>
              <NumberInput
                label="Temperature"
                value={state.assessment.temperature}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, temperature: v } }))}
                min={30}
                max={45}
                unit="C (38 or above is a sign of systemic involvement)"
                required
              />
              <p className={`text-xs font-medium ${fever ? "text-red-700" : "text-gray-600"}`}>
                {state.assessment.temperature === null ? "Fever is taken from the measured temperature only." : fever ? `Measured ${state.assessment.temperature} C: fever present (systemic involvement).` : `Measured ${state.assessment.temperature} C: no fever.`}
              </p>
              <Checkbox
                label="Facial swelling, or swelling beyond the tooth and its immediate gum"
                checked={state.assessment.facialSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, facialSwelling: v } }))}
                description="Tick this only where no emergency red flag above applies."
              />
              <Checkbox
                label="Regional lymphadenopathy: tender, enlarged nodes in the neck or under the jaw"
                checked={state.assessment.lymphadenopathy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, lymphadenopathy: v } }))}
              />
              <Checkbox
                label="Cellulitis: diffuse redness and swelling spreading into the soft tissues of the face, without red flags"
                checked={state.assessment.cellulitis}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, cellulitis: v } }))}
                description="ANY spread to the neck is an Appendix 1 emergency (tick the red flag above), not a reason to supply."
              />
              <Checkbox
                label="Malaise, feeling generally unwell"
                checked={state.assessment.malaise}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, malaise: v } }))}
                description="Rigors are NOT on this list: a rigor is a sepsis red flag (tick it above) and refers."
              />
              <SelectInput
                label="Is the infection spreading, or is the patient systemically involved? (temperature measured; facial swelling, lymphadenopathy, cellulitis and malaise looked for)"
                value={state.assessment.spreadPresent}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, spreadPresent: v as "" | "yes" | "no", spreadAssessed: v !== "" } }))}
                options={[
                  { value: "yes", label: "Yes: at least one sign above is present, or the temperature is 38 or above (antibiotic indicated)" },
                  { value: "no", label: "No: none of the signs above is present and there is no fever (localised infection: no antibiotic unless higher risk)" },
                ]}
                required
              />
              <p className="text-xs text-gray-500">
                Required. The record states a sign is absent only when No is answered here; untouched boxes are not an answer.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Step 3. Higher risk of complications, even if the infection looks localised
              </h3>
              <Checkbox
                label="Significant immunosuppression"
                checked={state.assessment.immunosuppressed}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, immunosuppressed: v } }))}
                description="A bridging antibiotic may be supplied for an apparently localised infection. Record the reason."
              />
              <Checkbox
                label="Poorly controlled diabetes"
                checked={state.assessment.poorlyControlledDiabetes}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, poorlyControlledDiabetes: v } }))}
              />
              {higherRisk && (
                <TextArea
                  label="Which higher-risk factor applies, and why you judged the risk higher"
                  value={state.assessment.higherRiskReason}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, higherRiskReason: v } }))}
                  placeholder="e.g. on methotrexate and prednisolone for rheumatoid arthritis; HbA1c 90 at last check"
                  required
                />
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Local findings, for the record</h3>
              <Checkbox
                label="Localised swelling of the gum next to the tooth"
                checked={state.assessment.localisedSwelling}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, localisedSwelling: v } }))}
              />
              <Checkbox
                label="Purulent discharge from the gum"
                checked={state.assessment.pusDischarge}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pusDischarge: v } }))}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pain assessment, for the record</h3>
              <SelectInput
                label="Type of dental pain"
                value={state.assessment.painType}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painType: v } }))}
                options={[
                  { value: "toothache", label: "Toothache" },
                  { value: "abscess", label: "Abscess" },
                  { value: "swelling", label: "Swelling of gum or face" },
                  { value: "post-extraction", label: "Post-extraction pain" },
                  { value: "other", label: "Other" },
                ]}
                required
              />
              <SelectInput
                label="Duration of symptoms"
                value={state.assessment.painDuration}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painDuration: v } }))}
                options={[
                  { value: "<24h", label: "Less than 24 hours" },
                  { value: "1-3d", label: "1 to 3 days" },
                  { value: "3-7d", label: "3 to 7 days" },
                  { value: ">7d", label: "More than 7 days" },
                ]}
                required
              />
              <SelectInput
                label="Severity of pain"
                value={state.assessment.painSeverity}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, painSeverity: v } }))}
                options={[
                  { value: "mild", label: "Mild" },
                  { value: "moderate", label: "Moderate" },
                  { value: "severe", label: "Severe" },
                ]}
                required
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Allergies, medicines and pregnancy</h3>
              <Checkbox
                label="Penicillin or beta-lactam allergy, or any history of cephalosporin allergy"
                checked={state.assessment.penicillinAllergy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, penicillinAllergy: v }, treatment: { ...prev.treatment, antibiotic: v ? METRONIDAZOLE_ARM : AMOXICILLIN_ARM }, counselling: { ...prev.counselling, armSpecific: false } }))}
                description="Routes to the metronidazole arm. Record the allergy history in the patient's own words, distinguishing true allergy from intolerance."
              />
              {state.assessment.penicillinAllergy && (
                <TextArea
                  label="Penicillin allergy history in the patient's own terms"
                  value={state.assessment.penicillinAllergyHistory}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, penicillinAllergyHistory: v } }))}
                  placeholder="What happened, which medicine, when"
                  required
                />
              )}
              <Checkbox
                label="Metronidazole or nitroimidazole allergy"
                checked={state.assessment.metronidazoleAllergy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, metronidazoleAllergy: v } }))}
              />
              <Checkbox
                label="Taking warfarin or another coumarin, lithium, disulfiram, busulfan, 5-fluorouracil, ciclosporin, phenytoin, phenobarbital, or a QT-prolonging medicine"
                checked={state.assessment.warfarin}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, warfarin: v } }))}
                description="Excludes the metronidazole arm. Not relevant to amoxicillin."
              />
              {state.assessment.penicillinAllergy && (
                <>
                  <SelectInput
                    label="Can the patient avoid alcohol completely during the course and for 48 hours afterwards? (ask directly)"
                    value={state.assessment.alcoholCanAvoid}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, alcoholCanAvoid: v as "" | "yes" | "no" } }))}
                    options={[
                      { value: "yes", label: "Yes: the rule was explained and the patient confirmed they can keep to it" },
                      { value: "no", label: "No: unable or unwilling to avoid alcohol (exclusion)" },
                    ]}
                    required
                  />
                  <Checkbox
                    label="Cockayne syndrome"
                    checked={state.assessment.cockayneSyndrome}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, cockayneSyndrome: v } }))}
                    description="Absolute exclusion for metronidazole."
                  />
                  <Checkbox
                    label="Severe hepatic impairment, or active neurological disease"
                    checked={state.assessment.severeHepaticOrNeurological}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, severeHepaticOrNeurological: v } }))}
                    description="Excludes the metronidazole arm."
                  />
                </>
              )}
              {!state.assessment.penicillinAllergy && (
                <>
                  <SelectInput
                    label="Renal function: ask the patient about their kidney function and select the answer given"
                    value={state.assessment.renalFunctionAnswer}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, renalFunctionAnswer: v as "" | "none-known" | "unknown-no-suspicion" | "known-impairment", renalFunctionAsked: v !== "" } }))}
                    options={[
                      { value: "none-known", label: "No known kidney problems" },
                      { value: "unknown-no-suspicion", label: "Patient does not know; no reason to suspect impairment" },
                      { value: "known-impairment", label: "Known kidney impairment (record the detail below)" },
                    ]}
                    required
                  />
                  <p className="text-xs text-gray-500">Required record for the amoxicillin arm.</p>
                  {state.assessment.renalFunctionAnswer === "known-impairment" && (
                    <TextInput
                      label="Renal function detail"
                      value={state.assessment.renalFunctionDetail}
                      onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, renalFunctionDetail: v } }))}
                      placeholder="e.g. eGFR 45 at last blood test; CKD stage 3"
                      required
                    />
                  )}
                  <Checkbox
                    label="Known significant renal impairment"
                    checked={state.assessment.significantRenalImpairment}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, significantRenalImpairment: v } }))}
                    description="Exclusion. A short bridging course is not the place for a dose adjustment. Refer."
                  />
                  <Checkbox
                    label="Infectious mononucleosis or acute lymphoblastic leukaemia"
                    checked={state.assessment.mononucleosisOrALL}
                    onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, mononucleosisOrALL: v } }))}
                    description="Exclusion for amoxicillin because of the risk of a widespread rash."
                  />
                </>
              )}
              <Checkbox
                label="Pregnant"
                checked={state.assessment.pregnancy}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, pregnancy: v } }))}
                description="Amoxicillin may be supplied. Metronidazole is excluded."
              />
              <Checkbox
                label="Breastfeeding"
                checked={state.assessment.breastfeeding}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, breastfeeding: v } }))}
                description="Amoxicillin may be supplied. Metronidazole is excluded."
              />
              <Checkbox
                label="Already taking an antibiotic, for this or any other indication"
                checked={state.assessment.otherAntibiotics}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, otherAntibiotics: v } }))}
                description="Exclusion."
              />
              <Checkbox
                label="A course already supplied for this episode"
                checked={state.assessment.courseAlreadySuppliedThisEpisode}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, courseAlreadySuppliedThisEpisode: v } }))}
                description="Exclusion. One supply per episode; a second course is not authorised."
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dental care</h3>
              <Checkbox
                label="Unable to obtain definitive dental treatment before the infection would be expected to worsen, and willing and able to arrange an urgent dental appointment within 24 to 48 hours"
                checked={state.assessment.urgentDentalAppointmentCommitted}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, urgentDentalAppointmentCommitted: v } }))}
                description="Inclusion criterion. Arrange the appointment before the patient leaves where possible, or give the NHS 111 route to emergency dental care."
                required
              />
              <Checkbox
                label="Patient already has a dental appointment booked"
                checked={state.assessment.dentalAppointmentBooked}
                onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, dentalAppointmentBooked: v } }))}
              />
              {state.assessment.dentalAppointmentBooked && (
                <TextInput
                  label="Appointment date"
                  type="date"
                  value={state.assessment.dentalAppointmentDate}
                  onChange={v => setState(prev => ({ ...prev, assessment: { ...prev.assessment, dentalAppointmentDate: v } }))}
                />
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Bridging Treatment Notice:</strong> This is bridging treatment only. The patient MUST see a dentist to address the underlying cause.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Antibiotic Prescription</h3>
              <SelectInput
                label="Antibiotic (set by the recorded allergy status; change the allergy answer on the Assessment step to change the arm)"
                value={selectedAntibiotic}
                onChange={() => undefined}
                options={[
                  { value: AMOXICILLIN_ARM, label: "Amoxicillin 500mg capsules: 500mg three times daily, one capsule every 8 hours, for 5 days (15 capsules)" },
                  // 200mg, the licensed dose for acute dental infection. The
                  // 400mg option this tool used to carry is off-label for this
                  // indication and is deliberately not offered.
                  { value: METRONIDAZOLE_ARM, label: "Metronidazole 200mg tablets: 200mg three times daily for 5 days (15 tablets), penicillin allergy" },
                ]}
                required
                disabled
              />
              <p className="text-xs text-gray-600">
                {isMetronidazole
                  ? "Oral. Swallow with water, with or after food to reduce nausea. Maximum treatment period 5 days; one course per episode."
                  : "Oral. Swallow whole with water, with or without food. Maximum treatment period 5 days; one course per episode."}
              </p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-500">Quantity (document: the whole 5 day course, never split)</p>
                <p className="text-sm font-semibold text-navy-900">{COURSE_QUANTITY} {isMetronidazole ? "tablets" : "capsules"}</p>
              </div>
              <TextInput
                label="Batch number"
                value={state.treatment.batchNumber}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, batchNumber: v } }))}
                required
              />
              <TextInput
                label="Expiry date"
                type="date"
                value={state.treatment.expiryDate}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, expiryDate: v } }))}
                required
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Analgesia</h3>
              <p className="text-xs text-gray-600">
                This PGD supplies no analgesia. Where the patient needs pain relief, sell it as a
                pharmacy medicine under the pharmacy&apos;s own protocol and record that you did.
                Earlier versions of this tool offered ibuprofen and paracetamol here as
                &quot;recommended&quot;, while the signed document said ibuprofen is not supplied
                under this PGD.
              </p>
              <Checkbox
                label="Analgesia advice given"
                checked={state.treatment.analgesiaAdviceGiven}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, analgesiaAdviceGiven: v } }))}
              />
              <TextInput
                label="Analgesia sold under the pharmacy's own protocol (if any)"
                value={state.treatment.analgesiaSoldUnderProtocol}
                onChange={v => setState(prev => ({ ...prev, treatment: { ...prev.treatment, analgesiaSoldUnderProtocol: v } }))}
                placeholder="e.g. paracetamol 500mg, 32 tablets"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-navy-900">Confirm each counselling point from the document ({isMetronidazole ? "metronidazole arm" : "amoxicillin arm"}):</p>
            <Checkbox
              label="THIS IS A BRIDGE, NOT A CURE. The antibiotic will slow the infection down. It cannot drain the abscess or fix the tooth. You still need to see a dentist urgently, within 24 to 48 hours"
              checked={state.counselling.bridgeNotCure}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, bridgeNotCure: v } }))}
            />
            <Checkbox
              label="Finish the whole course even if the pain settles"
              checked={state.counselling.finishCourse}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, finishCourse: v } }))}
            />
            <Checkbox
              label={isMetronidazole ? "Take one tablet every 8 hours, with or after food" : "Take one capsule every 8 hours, with or without food"}
              checked={state.counselling.howToTake}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, howToTake: v } }))}
            />
            <Checkbox
              label={
                isMetronidazole
                  ? "NO ALCOHOL AT ALL during the course and for 48 hours after the last tablet, including wine, beer, spirits and alcohol in medicines such as some cough remedies and mouthwashes (the reaction causes flushing, vomiting and a racing heart). A metallic taste is common and goes when the course finishes. Tell us if you get numbness or pins and needles in your hands or feet"
                  : "Some diarrhoea is common; get advice if it is severe or bloody. A rash that appears with this antibiotic is usually not an allergy, but get it checked, and seek urgent help for any swelling of the lips or tongue or any wheeze"
              }
              checked={state.counselling.armSpecific}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, armSpecific: v } }))}
            />
            <Checkbox
              label="Come back or seek urgent help the same day if the swelling spreads, your eye starts to close, you cannot open your mouth properly, you have difficulty swallowing or breathing, or you feel much worse. Call 999 for breathing or swallowing difficulty. Pain should improve within 24 to 48 hours; worsening pain, worsening fever or spreading swelling needs the same-day routes rather than a wait"
              checked={state.counselling.sameDayHelp}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, sameDayHelp: v } }))}
            />
            <Checkbox
              label="For pain relief, ask us: we can sell you something suitable over the counter (no analgesia is supplied under this PGD)"
              checked={state.counselling.painReliefOtc}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, painReliefOtc: v } }))}
            />
            <Checkbox
              label="Dental appointment arranged before leaving where possible, or the NHS 111 route to emergency dental care given"
              checked={state.counselling.dentalAppointmentArranged}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, dentalAppointmentArranged: v } }))}
            />
            <Checkbox
              label={isMetronidazole ? "Metronidazole patient information leaflet supplied (no ibuprofen leaflet)" : "Amoxicillin patient information leaflet supplied (no ibuprofen leaflet)"}
              checked={state.counselling.pilSupplied}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, pilSupplied: v } }))}
            />
            <TextArea
              label="Adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk, and inform the GP)"
              value={state.counselling.adverseReactions}
              onChange={v => setState(prev => ({ ...prev, counselling: { ...prev.counselling, adverseReactions: v } }))}
              placeholder="None known at the time of supply"
              rows={2}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistName: v } }))}
              required
            />
            <TextInput
              label="GPhC registration"
              value={state.summary.pharmacistGPhC}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistGPhC: v } }))}
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacyName: v } }))}
            />
            <TextArea
              label="Clinical notes"
              value={state.summary.clinicalNotes}
              onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))}
              rows={3}
            />
            <div className="p-4 bg-gray-50 rounded-md text-xs space-y-1 border border-gray-200">
              <div><strong>Outcome:</strong> {outcome === "bridge" ? "2. Spreading or systemic infection (or higher risk), no emergency red flag: bridging antibiotic supplied" : outcome === "emergency" ? "3. Emergency red flag: 999 or same-day care" : "1. Localised infection only: no antibiotic"}</div>
              <div><strong>Finding that decided it:</strong> {[
                fever ? "temperature 38C or above" : "",
                state.assessment.facialSwelling ? "facial swelling" : "",
                state.assessment.lymphadenopathy ? "regional lymphadenopathy" : "",
                state.assessment.cellulitis ? "cellulitis of the face" : "",
                state.assessment.malaise ? "malaise" : "",
                state.assessment.immunosuppressed ? "significant immunosuppression" : "",
                state.assessment.poorlyControlledDiabetes ? "poorly controlled diabetes" : "",
              ].filter(Boolean).join(", ") || "none recorded"}{state.assessment.higherRiskReason ? `; ${state.assessment.higherRiskReason}` : ""}</div>
              <div><strong>Appendix 1 worked through:</strong> {state.assessment.redFlagsAssessed ? (emergency ? "Yes; emergency red flag PRESENT" : "Yes; no emergency red flag") : "NOT confirmed"}</div>
              <div><strong>Temperature:</strong> {state.assessment.temperature ?? "not recorded"} C; facial swelling {state.assessment.spreadAssessed ? (state.assessment.facialSwelling ? "present" : "absent") : "not assessed"}; lymphadenopathy {state.assessment.spreadAssessed ? (state.assessment.lymphadenopathy ? "present" : "absent") : "not assessed"}</div>
              <div><strong>Arm:</strong> {selectedAntibiotic}{state.assessment.penicillinAllergy ? ` (penicillin allergy: ${state.assessment.penicillinAllergyHistory || "history not recorded"})` : " (first line, not penicillin-allergic)"}</div>
              {state.assessment.penicillinAllergy && (
                <div><strong>Alcohol rule explained and patient confirmed they can keep to it:</strong> {state.assessment.alcoholCanAvoid === "yes" ? "Yes" : state.assessment.alcoholCanAvoid === "no" ? "No (excluded)" : "Not recorded"}</div>
              )}
              {!state.assessment.penicillinAllergy && (
                <div><strong>Renal function:</strong> {renalFunctionText(state.assessment.renalFunctionAnswer, state.assessment.renalFunctionDetail)}</div>
              )}
              <div><strong>Supply:</strong> {isMetronidazole ? "Metronidazole 200mg tablets, oral" : "Amoxicillin 500mg capsules, oral"}, 5 days, {state.treatment.quantity ?? "?"} supplied; batch {state.treatment.batchNumber || "not recorded"}, expiry {state.treatment.expiryDate || "not recorded"}</div>
              <div><strong>Told this is a bridge, dental appointment still needed:</strong> {state.counselling.bridgeNotCure ? "Yes" : "No"}</div>
              {!hasStopAlerts && outcome === "bridge" ? (
                <div><strong>Supplied under:</strong> {PGD_STRAPLINE}</div>
              ) : (
                <div><strong>Outcome:</strong> NOT SUPPLIED</div>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Acute Dental Infection Bridging Consultation Complete</p>
            <p className="text-sm text-green-800 mt-2">
              Patient has received a bridging antibiotic and counselling under the {PGD_STRAPLINE}. Urgent dental appointment within 24 to 48 hours required. Save & Print Record saves the consultation and prints the record.
            </p>
          </div>
        )}
      </StepWrapper>
    </div>
    <div className="hidden print:block">
      <DentalBridgingSummaryReport state={state} alerts={clinicalAlerts} outcome={outcome} fever={fever} selectedAntibiotic={selectedAntibiotic} />
    </div>
    </>
  );
}

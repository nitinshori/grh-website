"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import type { ClinicalAlert } from "../shared/types";
import { calculateAge } from "../shared/types";
import { validatePatient, validateConsent, validateSummary } from "./lib/wound-validation";
import { WoundCareSummaryReport } from "./components/WoundCareSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";

/**
 * Minor Wound Care ePGD, aligned to the Minor Wound Care PGD version 007,
 * issued 11 September 2026. Two arms, chosen on the mechanism of the wound:
 *   Arm 1, co-amoxiclav 500/125mg tablets: infected bite wounds and heavily
 *     contaminated wounds, 12 years and over.
 *   Arm 2, flucloxacillin 500mg capsules or 250mg/5mL suspension: infected
 *     non-bite wounds, 2 years and over.
 * Every observation in Appendix 1 (age-banded) is recorded before supply;
 * tetanus status is established and recorded for every patient; both arms are
 * beta-lactams so penicillin allergy is a referral with the alternative named.
 */
export const WOUND_CARE_PGD_VERSION = "Minor Wound Care PGD, version 007, issued 11 September 2026";

export type AgeBand = "2-4" | "5-11" | "12+" | null;
export function getAgeBand(age: number | null): AgeBand {
  if (age === null || age < 2) return null;
  if (age <= 4) return "2-4";
  if (age <= 11) return "5-11";
  return "12+";
}
function num(v: string): number | null {
  if (!v || !v.trim()) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/** Hours since the time of injury, unfloored; null when not recorded. */
export function hoursSinceInjury(timeOfInjury: string): number | null {
  if (!timeOfInjury) return null;
  const t = new Date(timeOfInjury).getTime();
  if (isNaN(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60);
}

export type WoundFormulation = "" | "tablets" | "capsules" | "suspension";

/** The formulations the document names for this arm and age. */
export function allowedFormulations(antibiotic: WoundState["treatment"]["antibiotic"], age: number | null): { value: WoundFormulation; label: string }[] {
  if (antibiotic === "co-amoxiclav") return [{ value: "tablets", label: "Co-amoxiclav 500/125mg tablets" }];
  if (antibiotic === "flucloxacillin") {
    if (age !== null && age >= 2 && age <= 9) return [{ value: "suspension", label: "Flucloxacillin 250mg/5mL oral suspension (2 to 9 years: 5 mL four times daily)" }];
    return [{ value: "capsules", label: "Flucloxacillin 500mg capsules (10 years and over)" }];
  }
  return [];
}

/** Quantity from the document's quantity row: nothing else can be recorded. */
export function documentQuantity(formulation: WoundFormulation, courseDays: "" | "5" | "7"): string {
  if (!formulation || !courseDays) return "";
  if (formulation === "tablets") return courseDays === "5" ? "15 tablets" : "21 tablets";
  if (formulation === "capsules") return courseDays === "5" ? "20 capsules" : "28 capsules";
  return courseDays === "5" ? "100 mL" : "140 mL";
}

export interface WoundState {
  patient: { firstName: string; lastName: string; dateOfBirth: string; age: number | null; gpName: string; gpPractice: string; gpAddress: string; gpPhone: string; gpEmail: string; gpOdsCode: string; nhsNumber: string; address: string; phone: string; email: string };
  consent: { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean; notifyGp?: boolean };
  consentDetails: { parentName: string; parentRelationship: string };
  assessment: {
    woundType: string;
    woundLocation: string;
    woundSize: string;
    woundDepth: string;
    timeOfInjury: string;
    activeBleedingControlled: boolean;
    signsOfInfection: string[];
    redTrackingLines: boolean;
    spreadingCellulitis: boolean;
    necrotisingFeatures: boolean;
    foreignBody: boolean;
    needsClosureOrSurgicalReview: boolean;
    tendonNerveDamage: boolean;
    overJointTendonBone: boolean;
    abscess: boolean;
    heavilyContaminated: boolean;
    highRiskTetanusWound: boolean;
    tetanusStatus: string;
    tetanusAction: string;
    immunosuppressed: boolean;
    diabetic: boolean;
    takingAnticoagulants: boolean;
    antibioticAlreadyTaken: boolean;
    penicillinAllergy: boolean;
    cephalosporinAllergy: boolean;
    coamoxiclavHepaticHistory: boolean;
    flucloxHepaticHistory: boolean;
    mononucleosisOrALL: boolean;
    severeHepaticOrEgfrBelow30: boolean;
    crclBelow10: boolean;
    pregnant: boolean;
    breastfeeding: boolean;
    // Observations, Appendix 1
    temperature: string;
    pulse: string;
    respiratoryRate: string;
    systolicBP: string;
    oxygenSaturation: string;
    /** Under 12 only: a measured value, never a default (Appendix 1: "REFER if more than 2 seconds"). */
    capillaryRefill: "" | "2s-or-less" | "over-2s";
    alteredConsciousness: boolean;
    /** Why human tetanus immunoglobulin is NOT indicated where the document
     *  lists the finding (heavy contamination, more than 6 hours) under the
     *  HTIG exclusion. Required before supply in either case. */
    htigNotIndicatedReason: string;
    /** Advice given where the patient is excluded (document record item). */
    exclusionAdvice: string;
  };
  treatment: {
    antibiotic: "" | "co-amoxiclav" | "flucloxacillin";
    formulation: WoundFormulation;
    courseDays: "" | "5" | "7";
    /** Patient declined the antibiotic: record the advice given, save as not supplied. */
    patientDeclined: boolean;
    declinedAdvice: string;
    antibioticRationale: string;
    irrigationMethod: string;
    closureMethod: string;
    dressingType: string;
    topicalAntiseptic: boolean;
    suppliedItemBatch: string;
    suppliedItemExpiry: string;
    tetanusReferralGenerated: boolean;
  };
  counselling: {
    counsellingProvided: boolean;
    administrationAdvice: boolean;
    sameDayWarningSigns: boolean;
    redStreaks: boolean;
    seriousReaction: boolean;
    hepaticAdvice: boolean;
    woundCareAndReview: boolean;
    counsellingNotes: string;
  };
  summary: {
    pharmacistName: string;
    pharmacistGPhC: string;
    pharmacyName: string;
    pharmacyAddress: string;
    consultationDate: string;
    consultationTime: string;
    clinicalNotes: string;
    /** Details of any adverse drug reactions and the actions taken (Yellow Card). */
    adverseReactions: string;
  };
}

const BITE_TYPES = new Set(["bite-animal", "bite-human"]);

function createInitialState(): WoundState {
  return {
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", gpAddress: "", gpPhone: "", gpEmail: "", gpOdsCode: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    consentDetails: { parentName: "", parentRelationship: "" },
    assessment: {
      woundType: "",
      woundLocation: "",
      woundSize: "",
      woundDepth: "",
      timeOfInjury: "",
      activeBleedingControlled: true,
      signsOfInfection: [],
      redTrackingLines: false,
      spreadingCellulitis: false,
      necrotisingFeatures: false,
      foreignBody: false,
      needsClosureOrSurgicalReview: false,
      tendonNerveDamage: false,
      overJointTendonBone: false,
      abscess: false,
      heavilyContaminated: false,
      highRiskTetanusWound: false,
      tetanusStatus: "",
      tetanusAction: "",
      immunosuppressed: false,
      diabetic: false,
      takingAnticoagulants: false,
      antibioticAlreadyTaken: false,
      penicillinAllergy: false,
      cephalosporinAllergy: false,
      coamoxiclavHepaticHistory: false,
      flucloxHepaticHistory: false,
      mononucleosisOrALL: false,
      severeHepaticOrEgfrBelow30: false,
      crclBelow10: false,
      pregnant: false,
      breastfeeding: false,
      temperature: "",
      pulse: "",
      respiratoryRate: "",
      systolicBP: "",
      oxygenSaturation: "",
      capillaryRefill: "",
      alteredConsciousness: false,
      htigNotIndicatedReason: "",
      exclusionAdvice: "",
    },
    treatment: {
      antibiotic: "",
      formulation: "",
      courseDays: "",
      patientDeclined: false,
      declinedAdvice: "",
      antibioticRationale: "",
      irrigationMethod: "",
      closureMethod: "",
      dressingType: "",
      topicalAntiseptic: false,
      suppliedItemBatch: "",
      suppliedItemExpiry: "",
      tetanusReferralGenerated: false,
    },
    counselling: {
      counsellingProvided: false,
      administrationAdvice: false,
      sameDayWarningSigns: false,
      redStreaks: false,
      seriousReaction: false,
      hepaticAdvice: false,
      woundCareAndReview: false,
      counsellingNotes: "",
    },
    summary: {
      pharmacistName: "",
      pharmacistGPhC: "",
      pharmacyName: "",
      pharmacyAddress: "",
      consultationDate: new Date().toISOString().split("T")[0],
      consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      clinicalNotes: "",
      adverseReactions: "",
    },
  };
}

/** Arm chosen on the mechanism of the wound (document: "the choice is made on the mechanism"). */
function requiredArm(a: WoundState["assessment"]): "co-amoxiclav" | "flucloxacillin" | "" {
  if (!a.woundType) return "";
  if (BITE_TYPES.has(a.woundType) || a.heavilyContaminated) return "co-amoxiclav";
  return "flucloxacillin";
}

function observationBreaches(a: WoundState["assessment"], band: AgeBand): string[] {
  const b: string[] = [];
  const temp = num(a.temperature);
  const hr = num(a.pulse);
  const rr = num(a.respiratoryRate);
  const sbp = num(a.systolicBP);
  const spo2 = num(a.oxygenSaturation);
  if (!band) return b;
  if (temp !== null && temp >= 38) b.push("temperature 38C or above");
  if (spo2 !== null && spo2 < 94) b.push("SpO2 below 94% on air at rest");
  if (band === "2-4") {
    if (hr !== null && hr > 140) b.push("pulse above 140");
    if (rr !== null && rr >= 40) b.push("respiratory rate 40 or above");
    if (a.capillaryRefill === "over-2s") b.push("capillary refill more than 2 seconds");
  } else if (band === "5-11") {
    if (hr !== null && hr > 120) b.push("pulse above 120");
    if (rr !== null && rr >= 25) b.push("respiratory rate 25 or above");
    if (a.capillaryRefill === "over-2s") b.push("capillary refill more than 2 seconds");
  } else {
    if (hr !== null && hr > 110) b.push("pulse above 110 at rest");
    if (rr !== null && rr >= 22) b.push("respiratory rate 22 or above");
    if (sbp !== null && sbp < 100) b.push("systolic below 100");
  }
  if (a.alteredConsciousness) b.push("new confusion or drowsiness (in a child: drowsiness, floppiness, or not responding normally)");
  return b;
}

function computeAlerts(state: WoundState): ClinicalAlert[] {
  const a = state.assessment;
  const age = state.patient.age;
  const band = getAgeBand(age);
  const arm = requiredArm(a);
  const isBite = BITE_TYPES.has(a.woundType);
  const newAlerts: ClinicalAlert[] = [];

  if (!a.activeBleedingControlled) {
    newAlerts.push({ severity: "stop", code: "ACTIVE_BLEEDING", message: "Active bleeding not controlled", detail: "Emergency referral required. Patient needs urgent attention." });
  }
  if (a.necrotisingFeatures) {
    newAlerts.push({
      severity: "stop",
      code: "NECROTISING_FASCIITIS",
      message: "Feature suggesting necrotising fasciitis: EMERGENCY assessment now (999 or A&E)",
      detail: "Pain out of proportion to the appearance of the wound, rapidly advancing erythema over hours, crepitus or gas in the tissues, skin necrosis, bullae or dusky discoloration, anaesthesia over the affected skin, or systemic illness out of keeping with the wound. Emergency, not a referral.",
    });
  }
  const breaches = observationBreaches(a, band);
  if (breaches.length > 0) {
    newAlerts.push({
      severity: "stop",
      code: "OBSERVATIONS",
      message: "Observation threshold breached for the patient's age band: refer, do not supply",
      detail: `Breached: ${breaches.join("; ")}. Any observation outside the Appendix 1 thresholds, or any sign of systemic illness or sepsis, excludes supply.`,
    });
  }
  if (a.signsOfInfection.length === 0 && a.woundType) {
    newAlerts.push({
      severity: "stop",
      code: "NOT_INFECTED",
      message: "No signs of infection recorded: an antibiotic is not authorised",
      detail: "This PGD supplies an oral antibiotic for an INFECTED wound (erythema, warmth, swelling, tenderness or purulent discharge). Give wound care and tetanus advice; do not supply an antibiotic.",
    });
  }
  if (a.redTrackingLines) {
    newAlerts.push({ severity: "stop", code: "RED_TRACKING", message: "Lymphangitis: red streaks tracking proximally from the wound", detail: "Referral trigger (Appendix 1). Refer." });
  }
  if (a.spreadingCellulitis) {
    newAlerts.push({ severity: "stop", code: "SPREADING", message: "Spreading cellulitis, or erythema extending well beyond the wound margin", detail: "Referral trigger (Appendix 1). Refer." });
  }
  if (a.highRiskTetanusWound) {
    newAlerts.push({
      severity: "stop",
      code: "HTIG",
      message: "High-risk tetanus-prone wound: immunoglobulin may be indicated. Refer the same day",
      detail: "Heavy contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment. Human tetanus immunoglobulin is not covered by this or any GRH PGD.",
    });
  }
  if (a.woundType === "burn") {
    newAlerts.push({
      severity: "stop",
      code: "BURN",
      message: "Burn: listed as a high-risk tetanus-prone wound where immunoglobulin may be indicated. Refer the same day",
      detail: "The document lists burns among the high-risk tetanus-prone wounds that exclude supply.",
    });
  }
  if (a.foreignBody || a.needsClosureOrSurgicalReview) {
    newAlerts.push({ severity: "stop", code: "SURGICAL", message: "Wound requiring closure, exploration or surgical review, or a retained foreign body", detail: "Excluded. Refer." });
  }
  if (a.woundDepth === "full-thickness" || a.woundDepth === "deep" || a.woundType === "puncture-wound") {
    newAlerts.push({ severity: "stop", code: "DEEP_WOUND", message: "Deep or penetrating wound", detail: "Excluded from this PGD. Refer." });
  }
  if (a.overJointTendonBone || a.tendonNerveDamage) {
    newAlerts.push({ severity: "stop", code: "JOINT_TENDON_BONE", message: "Wound over a joint, tendon or bone, or tendon or nerve damage suspected", detail: "Excluded. Refer for specialist assessment." });
  }
  if (isBite && (a.woundLocation === "face" || a.woundLocation === "hand-finger")) {
    newAlerts.push({ severity: "stop", code: "BITE_FACE_HAND", message: "Bite to the face or hand", detail: "Excluded from both arms. Refer." });
  }
  if (a.abscess) {
    newAlerts.push({ severity: "stop", code: "ABSCESS", message: "Abscess requiring drainage", detail: "Excluded. Refer for incision and drainage." });
  }
  if (a.immunosuppressed) {
    newAlerts.push({ severity: "stop", code: "IMMUNOSUPPRESSED", message: "Immunosuppression of any kind", detail: "Excluded from both arms. Refer." });
  }
  if (a.diabetic && a.woundLocation === "foot") {
    newAlerts.push({ severity: "stop", code: "DIABETIC_FOOT", message: "Diabetic foot wound", detail: "Excluded from both arms. Refer." });
  } else if (a.diabetic) {
    newAlerts.push({ severity: "caution", code: "DIABETES", message: "Diabetes", detail: "Manage any predisposing condition. A diabetic FOOT wound is an exclusion." });
  }
  if (a.antibioticAlreadyTaken) {
    newAlerts.push({ severity: "stop", code: "ANTIBIOTIC_TAKEN", message: "An antibiotic already taken for this episode", detail: "One course per episode. A second course is not authorised; refer." });
  }
  if (a.penicillinAllergy || a.cephalosporinAllergy) {
    newAlerts.push({
      severity: "stop",
      code: "PENICILLIN_ALLERGY",
      message: "Penicillin or cephalosporin allergy: both arms are beta-lactams. Refer, naming the likely alternative",
      detail: isBite || a.heavilyContaminated
        ? "For an infected bite the usual choice is doxycycline with metronidazole. Name this in the referral so the patient is not sent away empty-handed."
        : "For a non-bite wound infection the usual choice is clarithromycin or doxycycline. Name this in the referral so the patient is not sent away empty-handed.",
    });
  }
  if (age !== null && age < 2) {
    newAlerts.push({ severity: "stop", code: "UNDER_2", message: "Under 2 years of age", detail: "Excluded from this PGD. Refer." });
  }
  if (arm === "co-amoxiclav") {
    if (age !== null && age < 12) {
      newAlerts.push({ severity: "stop", code: "COAMOX_UNDER_12", message: "Bite or heavily contaminated wound under 12 years", detail: "The co-amoxiclav arm is 12 years and over, and flucloxacillin does not reliably cover Pasteurella or Eikenella. Refer." });
    }
    if (a.coamoxiclavHepaticHistory) {
      newAlerts.push({ severity: "stop", code: "COAMOX_HEPATIC", message: "History of co-amoxiclav-associated jaundice or hepatic dysfunction", detail: "Excluded. Refer." });
    }
    if (a.mononucleosisOrALL) {
      newAlerts.push({ severity: "stop", code: "MONO_ALL", message: "Infectious mononucleosis or acute lymphoblastic leukaemia", detail: "Excluded from the co-amoxiclav arm. Refer." });
    }
    if (a.severeHepaticOrEgfrBelow30) {
      newAlerts.push({ severity: "stop", code: "COAMOX_RENAL_HEPATIC", message: "Severe hepatic dysfunction, or eGFR below 30", detail: "Excluded from the co-amoxiclav arm. Refer." });
    }
    if (a.takingAnticoagulants) {
      newAlerts.push({ severity: "stop", code: "COAMOX_ANTICOAGULANT", message: "Anticoagulated: refer rather than supply co-amoxiclav", detail: "Possible increased anticoagulant effect. The document says where the patient is anticoagulated, refer rather than supply." });
    }
    if (a.pregnant || a.breastfeeding) {
      newAlerts.push({ severity: "caution", code: "COAMOX_PREGNANCY", message: "Pregnancy or breastfeeding: co-amoxiclav may be supplied where clinically indicated", detail: "Document caution. Advise that any rash should stop the course and prompt review." });
    }
  }
  if (arm === "flucloxacillin") {
    if (a.flucloxHepaticHistory) {
      newAlerts.push({ severity: "stop", code: "FLUCLOX_HEPATIC", message: "History of flucloxacillin-associated jaundice or hepatic dysfunction", detail: "Excluded. Refer." });
    }
    if (a.crclBelow10) {
      newAlerts.push({ severity: "stop", code: "FLUCLOX_RENAL", message: "Severe renal impairment (creatinine clearance below 10 mL/min)", detail: "Excluded from the flucloxacillin arm. Refer." });
    }
    if (a.pregnant || a.breastfeeding) {
      newAlerts.push({ severity: "caution", code: "FLUCLOX_PREGNANCY", message: "Pregnancy or breastfeeding: flucloxacillin may be supplied where clinically indicated", detail: "Document caution, aligned with the Skin and Soft Tissue Infection PGD. Hepatic reactions may occur up to two months after treatment." });
    }
  }

  // Heavy contamination is the indication for Arm 1 AND a listed feature of a
  // high-risk tetanus-prone wound where HTIG may be indicated (an exclusion
  // in both arms). The document contradicts itself; the tool says so on
  // screen and requires the pharmacist to record why immunoglobulin is not
  // indicated before any supply (adversarial review, 11 Sep 2026).
  if (a.heavilyContaminated && !a.highRiskTetanusWound) {
    newAlerts.push({
      severity: "caution",
      code: "HEAVY_CONTAMINATION_HTIG",
      message: "Heavily contaminated wound: the document lists heavy contamination under the HTIG exclusion as well as under the co-amoxiclav indication",
      detail: "Exclusion (both arms): \"High-risk tetanus-prone wound where human tetanus immunoglobulin may be indicated (heavy contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment). Refer the same day.\" Before supplying, assess whether immunoglobulin is indicated and record why it is not. If it may be, tick the high-risk tetanus-prone wound box and refer the same day.",
    });
  }

  const hoursOld = hoursSinceInjury(a.timeOfInjury);
  if (hoursOld !== null && hoursOld > 6 && !a.highRiskTetanusWound) {
    newAlerts.push({
      severity: "caution",
      code: "WOUND_AGE",
      message: "More than 6 hours since injury: tetanus-prone wound, and a finding the document lists under the HTIG exclusion",
      detail: "Appendix 1 lists wounds presenting after 6 hours as tetanus-prone (vaccine dose where indicated) AND lists \"more than 6 hours to treatment\" among the high-risk features where immunoglobulin may be indicated, which is a same-day referral in both arms. Establish the tetanus history, record the action, and record why immunoglobulin is not indicated before any supply. If it may be, tick the high-risk tetanus-prone wound box and refer the same day.",
    });
  }
  if (hoursOld !== null && hoursOld > 14 * 24) {
    newAlerts.push({
      severity: "caution",
      code: "WOUND_CHRONIC",
      message: "Injury more than 14 days ago: check this is an acute minor wound and not a chronic wound",
      detail: "This PGD covers infected minor wounds. A wound that has been present for weeks needs assessment of why it has not healed; consider referral.",
    });
  }
  if (a.tetanusStatus === "over-10-years" || a.tetanusStatus === "incomplete-or-unknown") {
    newAlerts.push({
      severity: "caution",
      code: "TETANUS",
      message: "Reinforcing tetanus dose indicated for a tetanus-prone wound",
      detail: age !== null && age >= 10
        ? "Last tetanus-containing dose more than 10 years ago (whatever the dose count) or an incomplete history: a reinforcing dose may be given under the Tetanus (Td/IPV) PGD from age 10. A wound that needs only a vaccine dose does not exclude this supply."
        : "Under 10: refer for the vaccine dose. A wound that needs only a vaccine dose does not exclude this supply.",
    });
  }

  return newAlerts;
}

export default function WoundCareClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WoundState>(createInitialState);

  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    setState((prev) => ({ ...prev, summary: { ...prev.summary, pharmacistName: __pharmProfile.name, pharmacistGPhC: __pharmProfile.gphcNumber, pharmacyName: __pharmProfile.pharmacyName, pharmacyAddress: __pharmProfile.pharmacyAddress } }));
  }, [__pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);

  const alerts = useMemo(() => computeAlerts(state), [state]);
  const hasStopAlerts = alerts.some((a) => a.severity === "stop");
  const age = state.patient.age;
  const band = getAgeBand(age);
  const arm = requiredArm(state.assessment);
  const a = state.assessment;
  const t = state.treatment;

  // Dose text from the document, per arm and age.
  const doseText = useMemo(() => {
    if (t.antibiotic === "co-amoxiclav")
      return {
        medicine: "Co-amoxiclav 500/125mg tablets",
        dose: "One tablet (500/125mg) three times a day, at the start of a meal",
        quantity: "15 tablets for a 5 day course, or 21 tablets for a 7 day course",
      };
    if (t.antibiotic === "flucloxacillin") {
      if (age !== null && age >= 2 && age <= 9)
        return {
          medicine: "Flucloxacillin 250mg/5mL oral suspension",
          dose: "250mg four times daily, which is 5 mL of the 250mg/5mL suspension four times daily. CHECK THE VOLUME AGAINST THE STRENGTH: 50mg per mL",
          quantity: "Suspension: 100mL for 5 days, 140mL for 7 days",
        };
      return {
        medicine: "Flucloxacillin 500mg capsules",
        dose: "500mg four times daily, on an empty stomach, one hour before or two hours after food",
        quantity: "Capsules: 20 for a 5 day course, 28 for a 7 day course",
      };
    }
    return null;
  }, [t.antibiotic, age]);

  const formulationOptions = useMemo(() => allowedFormulations(t.antibiotic, age), [t.antibiotic, age]);
  const quantitySupplied = documentQuantity(t.formulation, t.courseDays);
  const hoursOld = hoursSinceInjury(a.timeOfInjury);
  const htigReasonRequired = (a.heavilyContaminated || (hoursOld !== null && hoursOld > 6)) && !a.highRiskTetanusWound;

  const assessmentError = useCallback((): string | null => {
    // Never assess against a missing age: every threshold in Appendix 1 is
    // banded, and a null band used to switch every observation check off.
    if (age === null) return "The patient's age is not known: enter the date of birth on the Patient Details step";
    if (!band) return "This PGD is for patients aged 2 years and over";
    if (!a.woundType) return "Select the wound type (mechanism)";
    if (!a.woundLocation) return "Select the wound location";
    if (!a.woundSize) return "Select the wound size (extent)";
    if (!a.woundDepth) return "Select the wound depth";
    if (!a.timeOfInjury) return "Record the time of injury";
    if (hoursOld === null) return "The time of injury is not a valid date and time";
    if (hoursOld < 0) return "The time of injury is in the future";
    if (!a.temperature.trim()) return "Record the temperature";
    if (!a.pulse.trim()) return "Record the pulse";
    if (!a.respiratoryRate.trim()) return "Record the respiratory rate";
    if (!a.oxygenSaturation.trim()) return "Record the oxygen saturation on air at rest";
    if (band === "12+" && !a.systolicBP.trim()) return "Record the systolic blood pressure (required from age 12)";
    if (band !== "12+" && !a.capillaryRefill) return "Under 12: measure and record the capillary refill time";
    if (!a.tetanusStatus) return "Establish and record the tetanus immunisation status";
    if (!a.tetanusAction.trim()) return "Record the tetanus action taken";
    if (htigReasonRequired && !a.htigNotIndicatedReason.trim())
      return "The document lists this finding under the HTIG exclusion: record why immunoglobulin is not indicated, or tick the high-risk tetanus-prone wound box and refer";
    return null;
  }, [a, band, age, hoursOld, htigReasonRequired]);

  const treatmentError = useCallback((): string | null => {
    if (t.patientDeclined) {
      if (!t.declinedAdvice.trim()) return "Record the advice given to the patient who declined treatment";
      return null;
    }
    if (!t.antibiotic) return "Select the antibiotic arm";
    if (arm && t.antibiotic !== arm)
      return arm === "co-amoxiclav"
        ? "A bite or heavily contaminated wound is treated with co-amoxiclav (Arm 1), not flucloxacillin"
        : "A non-bite wound is treated with flucloxacillin (Arm 2); co-amoxiclav is for bites and heavily contaminated wounds";
    if (!t.formulation) return "Select the formulation supplied";
    if (!formulationOptions.some((f) => f.value === t.formulation))
      return "That formulation is not the one the document names for this arm and age";
    if (!t.courseDays) return "Select the course length (5 or 7 days)";
    if (!quantitySupplied) return "The quantity could not be derived from the formulation and course length";
    if (!t.antibioticRationale.trim()) return "Record which antibiotic was chosen and why";
    if (!t.suppliedItemBatch.trim()) return "Record the batch number";
    if (!t.suppliedItemExpiry) return "Record the expiry date";
    return null;
  }, [t, arm, formulationOptions, quantitySupplied]);

  const counsellingError = useCallback((): string | null => {
    const c = state.counselling;
    if (!c.administrationAdvice) return "Confirm the administration advice for the antibiotic supplied";
    if (!c.sameDayWarningSigns) return "Confirm the same-day warning-sign advice";
    if (!c.redStreaks) return "Confirm the advice about red streaks tracking from the wound";
    if (!c.seriousReaction) return "Confirm the serious reaction advice (rash, wheeze, lip or tongue swelling)";
    if (!c.hepaticAdvice) return "Confirm the jaundice / dark urine advice";
    if (!c.woundCareAndReview) return "Confirm the wound care and 2 to 3 day review advice";
    if (!c.counsellingProvided) return "Confirm counselling was provided";
    return null;
  }, [state.counselling]);

  const consentError = useCallback((): string | null => {
    const base = validateConsent(state.consent);
    if (base) return base;
    if (age !== null && age < 16) {
      if (!state.consentDetails.parentName.trim() || !state.consentDetails.parentRelationship.trim())
        return "Patient is a child: record the name and relationship of the person with parental responsibility who gave consent";
    }
    return null;
  }, [state.consent, state.consentDetails, age]);

  const getValidationError = useCallback((): string | null => {
    if (currentStep === 0) return validatePatient(state.patient);
    if (currentStep === 1) return consentError();
    if (currentStep === 2) return assessmentError();
    if (currentStep === 3) return treatmentError();
    if (currentStep === 4) return counsellingError();
    if (currentStep === 5) return validateSummary(state.summary);
    // Last step: Save & Print applies every rule again, so nothing changed
    // on an earlier step can be printed without the checks running.
    if (currentStep === 6)
      return (
        validatePatient(state.patient) ||
        consentError() ||
        assessmentError() ||
        treatmentError() ||
        counsellingError() ||
        validateSummary(state.summary)
      );
    return null;
  }, [currentStep, state.patient, state.summary, consentError, assessmentError, treatmentError, counsellingError]);

  const validationError = getValidationError();
  // A stop raised on the assessment step blocks Next on that step and every
  // later one; a patient who declines is blocked from the treatment step on.
  // Either can be saved from the blocked step with "Save as not supplied".
  const isBlocked = (hasStopAlerts && currentStep >= 2) || (t.patientDeclined && currentStep >= 3);
  const canProceed = !validationError && !isBlocked;

  const handleNext = useCallback(() => {
    if (canProceed) setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, [canProceed]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNewConsultation = useCallback(() => {
    setCurrentStep(0);
    setState(createInitialState());
  }, []);

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
        ...state,
        alerts,
        quantitySupplied,
        ageBand: band,
        pgdVersion: WOUND_CARE_PGD_VERSION,
      } as unknown as Record<string, unknown>,
      outcome: hasStopAlerts ? "referred" : t.patientDeclined ? "not_supplied" : "completed",
      medicine:
        !hasStopAlerts && !t.patientDeclined && t.antibiotic && doseText
          ? {
              name: doseText.medicine,
              dose: doseText.dose,
              duration: t.courseDays ? `${t.courseDays} days` : undefined,
              quantity: quantitySupplied || undefined,
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
  }, [state, alerts, hasStopAlerts, t.patientDeclined, t.antibiotic, t.courseDays, doseText, quantitySupplied, band, __pharmProfile]);

  const setA = (patch: Partial<WoundState["assessment"]>) => setState((prev) => ({ ...prev, assessment: { ...prev.assessment, ...patch } }));
  const setT = (patch: Partial<WoundState["treatment"]>) => setState((prev) => ({ ...prev, treatment: { ...prev.treatment, ...patch } }));
  const setC = (patch: Partial<WoundState["counselling"]>) => setState((prev) => ({ ...prev, counselling: { ...prev.counselling, ...patch } }));

  const isBite = BITE_TYPES.has(a.woundType);

  return (
    <>
    <div className="space-y-6 print:hidden">
      <p className="text-xs text-gray-600">{WOUND_CARE_PGD_VERSION}</p>
      <ProgressBar current={currentStep + 1} total={7} />
      <StepWrapper
        title={["Patient Details", "Consent", "Wound Assessment", "Treatment Plan", "Counselling", "Summary", "Consultation Complete"][currentStep]}
        currentStep={currentStep}
        totalSteps={7}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={isBlocked}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              setState((prev) => ({
                ...prev,
                patient: {
                  ...prev.patient,
                  [field]: value,
                  // Every threshold in this PGD is age-banded: the age is
                  // recalculated on every change of date of birth.
                  ...(field === "dateOfBirth" ? { age: calculateAge(String(value ?? "")) } : {}),
                },
              }))
            }
            requireAdult={false}
          />
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => setState(prev => ({ ...prev, consent: { ...prev.consent, [field]: value } }))}
            />
            {age !== null && age < 16 && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                <p className="text-sm font-medium text-navy-900">Child: consent from a person with parental responsibility</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <TextInput label="Name" value={state.consentDetails.parentName} onChange={(v) => setState((prev) => ({ ...prev, consentDetails: { ...prev.consentDetails, parentName: v } }))} required />
                  <TextInput label="Relationship to the patient" value={state.consentDetails.parentRelationship} onChange={(v) => setState((prev) => ({ ...prev, consentDetails: { ...prev.consentDetails, parentRelationship: v } }))} placeholder="e.g. mother" required />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}
            {hasStopAlerts && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
                <p className="text-sm font-medium text-navy-900">Excluded: record the advice given and the decision, then use Save as not supplied</p>
                <p className="text-xs text-gray-700">Explain why treatment cannot be supplied and arrange the appropriate assessment. Inform the GP where the reason for exclusion is a new clinical finding. For penicillin allergy, name the likely alternative in the referral.</p>
                <TextArea label="Advice given and decision reached" value={a.exclusionAdvice} onChange={(v) => setA({ exclusionAdvice: v })} rows={3} placeholder="e.g. referred same day to urgent care for HTIG assessment; GP informed" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Wound type (mechanism)"
                value={a.woundType}
                onChange={(v) => setA({ woundType: v })}
                options={[
                  { value: "", label: "Select wound type" },
                  { value: "laceration-cut", label: "Laceration / cut" },
                  { value: "abrasion-graze", label: "Abrasion / graze" },
                  { value: "puncture-wound", label: "Puncture wound (deep or penetrating: excluded)" },
                  { value: "bite-animal", label: "Bite wound (animal): co-amoxiclav arm, 12 and over" },
                  { value: "bite-human", label: "Bite wound (human): co-amoxiclav arm, 12 and over" },
                  { value: "burn", label: "Burn (high-risk tetanus-prone: refer)" },
                ]}
                required
              />
              <SelectInput
                label="Wound location (site)"
                value={a.woundLocation}
                onChange={(v) => setA({ woundLocation: v })}
                options={[
                  { value: "", label: "Select location" },
                  { value: "hand-finger", label: "Hand / finger" },
                  { value: "arm", label: "Arm" },
                  { value: "leg", label: "Leg" },
                  { value: "face", label: "Face" },
                  { value: "torso", label: "Torso" },
                  { value: "foot", label: "Foot" },
                  { value: "other", label: "Other" },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Wound size (extent)"
                value={a.woundSize}
                onChange={(v) => setA({ woundSize: v })}
                options={[
                  { value: "", label: "Select size" },
                  { value: "less-2cm", label: "Under 2cm" },
                  { value: "2-5cm", label: "2 to 5cm" },
                  { value: "greater-5cm", label: "Over 5cm" },
                ]}
                required
              />
              <SelectInput
                label="Wound depth"
                value={a.woundDepth}
                onChange={(v) => setA({ woundDepth: v })}
                options={[
                  { value: "", label: "Select depth" },
                  { value: "superficial", label: "Superficial" },
                  { value: "partial-thickness", label: "Partial thickness" },
                  { value: "full-thickness", label: "Full thickness / deep (excluded)" },
                ]}
                required
              />
            </div>

            <TextInput label="Time of injury" type="datetime-local" value={a.timeOfInjury} onChange={(v) => setA({ timeOfInjury: v })} required />
            {hoursOld !== null && hoursOld >= 0 && (
              <p className="text-xs text-gray-600">{hoursOld < 48 ? `${hoursOld.toFixed(1)} hours` : `${(hoursOld / 24).toFixed(1)} days`} since injury.</p>
            )}

            <Checkbox
              label="Heavily contaminated with soil or organic material (co-amoxiclav arm, 12 and over)"
              checked={a.heavilyContaminated}
              onChange={(v) => setA({ heavilyContaminated: v })}
              description="The document also lists heavy contamination among the high-risk tetanus-prone features where immunoglobulin may be indicated (same-day referral). Assess and record below."
            />
            {htigReasonRequired && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                <p className="text-sm font-medium text-navy-900">Tetanus immunoglobulin assessment (required before supply)</p>
                <p className="text-xs text-gray-700">
                  {a.heavilyContaminated ? "Heavy contamination" : "More than 6 hours since injury"} appears in the document's HTIG exclusion: "High-risk tetanus-prone wound where human tetanus immunoglobulin may be indicated (heavy contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment). Refer the same day." Record why immunoglobulin is not indicated for this wound. If it may be, tick the high-risk box below and refer the same day.
                </p>
                <TextArea label="Why human tetanus immunoglobulin is not indicated" value={a.htigNotIndicatedReason} onChange={(v) => setA({ htigNotIndicatedReason: v })} rows={2} required placeholder="e.g. superficial graze, thoroughly irrigated, no devitalised tissue, immunisation up to date" />
              </div>
            )}

            <Checkbox label="Active bleeding controlled by pressure" checked={a.activeBleedingControlled} onChange={(v) => setA({ activeBleedingControlled: v })} />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-1">Signs of infection (inclusion: at least one)</p>
              <p className="text-xs text-blue-900 mb-3">Erythema, warmth, swelling, tenderness or purulent discharge.</p>
              <div className="space-y-2">
                {["Erythema (redness)", "Warmth at wound site", "Swelling", "Tenderness", "Purulent discharge (pus)"].map((sign) => (
                  <Checkbox
                    key={sign}
                    label={sign}
                    checked={a.signsOfInfection.includes(sign)}
                    onChange={(checked) => {
                      if (checked) setA({ signsOfInfection: [...a.signsOfInfection, sign] });
                      else setA({ signsOfInfection: a.signsOfInfection.filter((s) => s !== sign) });
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-navy-900">
                Observations before supply (Appendix 1{band ? `, age band ${band === "2-4" ? "2 to 4" : band === "5-11" ? "5 to 11" : "12 and over"}` : ""})
              </p>
              <p className="text-xs text-gray-600">
                {band === "2-4"
                  ? "Refer if temperature 38C or above, pulse above 140, respiratory rate 40 or above, SpO2 below 94%, capillary refill more than 2 seconds, or any drowsiness, floppiness or not responding normally. Do not apply an adult blood pressure threshold."
                  : band === "5-11"
                    ? "Refer if temperature 38C or above, pulse above 120, respiratory rate 25 or above, SpO2 below 94%, capillary refill more than 2 seconds, or any drowsiness, floppiness or not responding normally. Do not apply an adult blood pressure threshold."
                    : "Refer if temperature 38C or above, pulse above 110 at rest, respiratory rate 22 or above, systolic below 100, SpO2 below 94%, or any new confusion or drowsiness."}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextInput label="Temperature (C)" type="number" value={a.temperature} onChange={(v) => setA({ temperature: v })} required />
                <TextInput label="Pulse (per minute)" type="number" value={a.pulse} onChange={(v) => setA({ pulse: v })} required />
                <TextInput label="Respiratory rate (per minute)" type="number" value={a.respiratoryRate} onChange={(v) => setA({ respiratoryRate: v })} required />
                <TextInput label="Oxygen saturation on air at rest (%)" type="number" value={a.oxygenSaturation} onChange={(v) => setA({ oxygenSaturation: v })} required />
                {band === "12+" && (
                  <TextInput label="Systolic blood pressure (mmHg)" type="number" value={a.systolicBP} onChange={(v) => setA({ systolicBP: v })} required />
                )}
              </div>
              {(band === "2-4" || band === "5-11") && (
                <SelectInput
                  label="Capillary refill time (measured)"
                  value={a.capillaryRefill}
                  onChange={(v) => setA({ capillaryRefill: v as WoundState["assessment"]["capillaryRefill"] })}
                  options={[
                    { value: "", label: "Not yet measured" },
                    { value: "2s-or-less", label: "2 seconds or less" },
                    { value: "over-2s", label: "More than 2 seconds (refer)" },
                  ]}
                  required
                />
              )}
              <Checkbox
                label={band === "12+" ? "New confusion or drowsiness" : "Any drowsiness, floppiness, or not responding normally to social cues"}
                checked={a.alteredConsciousness}
                onChange={(v) => setA({ alteredConsciousness: v })}
              />
            </div>

            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-navy-900">Red flags and exclusions</p>
              <Checkbox
                label="Any feature suggesting necrotising fasciitis: pain out of proportion, rapidly advancing erythema, crepitus, skin necrosis, bullae or dusky discoloration, anaesthesia over the skin, systemic illness out of keeping with the wound (EMERGENCY)"
                checked={a.necrotisingFeatures}
                onChange={(v) => setA({ necrotisingFeatures: v })}
              />
              <Checkbox label="Red streaks tracking proximally from the wound (lymphangitis)" checked={a.redTrackingLines} onChange={(v) => setA({ redTrackingLines: v })} />
              <Checkbox label="Spreading cellulitis, or erythema extending well beyond the wound margin" checked={a.spreadingCellulitis} onChange={(v) => setA({ spreadingCellulitis: v })} />
              <Checkbox label="Wound requiring closure, exploration or surgical review" checked={a.needsClosureOrSurgicalReview} onChange={(v) => setA({ needsClosureOrSurgicalReview: v })} />
              <Checkbox label="Retained foreign body" checked={a.foreignBody} onChange={(v) => setA({ foreignBody: v })} />
              <Checkbox label="Wound over a joint, tendon or bone" checked={a.overJointTendonBone} onChange={(v) => setA({ overJointTendonBone: v })} />
              <Checkbox label="Tendon or nerve damage suspected (loss of movement or sensation)" checked={a.tendonNerveDamage} onChange={(v) => setA({ tendonNerveDamage: v })} />
              <Checkbox label="Abscess requiring drainage" checked={a.abscess} onChange={(v) => setA({ abscess: v })} />
              <Checkbox
                label="High-risk tetanus-prone wound where immunoglobulin may be indicated: heavy contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment (refer the same day)"
                checked={a.highRiskTetanusWound}
                onChange={(v) => setA({ highRiskTetanusWound: v })}
              />
            </div>

            <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-navy-900">Tetanus immunisation status (establish and record for every patient)</p>
              <SelectInput
                label="Tetanus status"
                value={a.tetanusStatus}
                onChange={(v) => setA({ tetanusStatus: v })}
                options={[
                  { value: "", label: "Select tetanus status" },
                  { value: "up-to-date", label: "Up to date (complete course, last dose within 10 years)" },
                  { value: "over-10-years", label: "Last tetanus-containing dose more than 10 years ago (reinforcing dose indicated for a tetanus-prone wound)" },
                  { value: "incomplete-or-unknown", label: "Incomplete or unknown history (reinforcing dose indicated for a tetanus-prone wound)" },
                ]}
                required
              />
              <TextInput
                label="Tetanus action taken"
                value={a.tetanusAction}
                onChange={(v) => setA({ tetanusAction: v })}
                placeholder="e.g. up to date, no action; Td/IPV dose given under the Tetanus PGD; referred to GP for vaccine (under 10)"
                required
              />
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-navy-900">Medical history</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Checkbox label="Immunosuppression of any kind" checked={a.immunosuppressed} onChange={(v) => setA({ immunosuppressed: v })} />
                <Checkbox label="Diabetic" checked={a.diabetic} onChange={(v) => setA({ diabetic: v })} />
                <Checkbox label="Taking anticoagulants" checked={a.takingAnticoagulants} onChange={(v) => setA({ takingAnticoagulants: v })} />
                <Checkbox label="An antibiotic already taken for this episode" checked={a.antibioticAlreadyTaken} onChange={(v) => setA({ antibioticAlreadyTaken: v })} />
                <Checkbox label="Known penicillin or beta-lactam allergy" checked={a.penicillinAllergy} onChange={(v) => setA({ penicillinAllergy: v })} />
                <Checkbox label="Known cephalosporin allergy" checked={a.cephalosporinAllergy} onChange={(v) => setA({ cephalosporinAllergy: v })} />
                <Checkbox label="History of co-amoxiclav-associated jaundice or hepatic dysfunction" checked={a.coamoxiclavHepaticHistory} onChange={(v) => setA({ coamoxiclavHepaticHistory: v })} />
                <Checkbox label="History of flucloxacillin-associated jaundice or hepatic dysfunction" checked={a.flucloxHepaticHistory} onChange={(v) => setA({ flucloxHepaticHistory: v })} />
                <Checkbox label="Infectious mononucleosis or acute lymphoblastic leukaemia" checked={a.mononucleosisOrALL} onChange={(v) => setA({ mononucleosisOrALL: v })} />
                <Checkbox label="Severe hepatic dysfunction, or eGFR below 30" checked={a.severeHepaticOrEgfrBelow30} onChange={(v) => setA({ severeHepaticOrEgfrBelow30: v })} />
                <Checkbox label="Severe renal impairment (creatinine clearance below 10 mL/min)" checked={a.crclBelow10} onChange={(v) => setA({ crclBelow10: v })} />
                <Checkbox label="Pregnant" checked={a.pregnant} onChange={(v) => setA({ pregnant: v })} />
                <Checkbox label="Breastfeeding" checked={a.breastfeeding} onChange={(v) => setA({ breastfeeding: v })} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <Checkbox
                label="Patient declined the antibiotic"
                checked={t.patientDeclined}
                onChange={(v) => setT({ patientDeclined: v })}
                description="Record the advice given, then use Save as not supplied. The document requires advice given to a patient who declines to be recorded."
              />
              {t.patientDeclined && (
                <TextArea label="Advice given to the patient who declined" value={t.declinedAdvice} onChange={(v) => setT({ declinedAdvice: v })} rows={2} required />
              )}
            </div>

            <SelectInput
              label="Antibiotic arm (chosen on the mechanism of the wound)"
              value={t.antibiotic}
              onChange={(v) => setT({ antibiotic: v as WoundState["treatment"]["antibiotic"], formulation: "" })}
              options={[
                { value: "", label: "Select antibiotic" },
                { value: "co-amoxiclav", label: "Arm 1: Co-amoxiclav 500/125mg tablets (bites and heavily contaminated wounds, 12 and over)" },
                { value: "flucloxacillin", label: "Arm 2: Flucloxacillin (non-bite wounds, 2 and over)" },
              ]}
              required
            />
            {arm && (
              <p className="text-xs text-gray-600">
                Document route for this wound: {arm === "co-amoxiclav" ? "co-amoxiclav (bite or heavily contaminated)" : "flucloxacillin (non-bite)"}.
                {isBite ? " Flucloxacillin does not reliably cover Pasteurella multocida or Eikenella." : ""}
              </p>
            )}
            {doseText && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30">
                <p className="text-sm font-semibold text-navy-900">{doseText.medicine}</p>
                <p className="text-sm text-gray-800">{doseText.dose}</p>
                <p className="text-sm text-gray-800">Duration 5 to 7 days. Maximum 7 days; one course per episode.</p>
                <p className="text-xs text-gray-600 mt-1">{doseText.quantity}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <SelectInput
                label="Formulation supplied (document formulation for this arm and age)"
                value={t.formulation}
                onChange={(v) => setT({ formulation: v as WoundFormulation })}
                options={[{ value: "", label: t.antibiotic ? "Select formulation" : "Select the antibiotic arm first" }, ...formulationOptions]}
                required
              />
              <SelectInput
                label="Course length"
                value={t.courseDays}
                onChange={(v) => setT({ courseDays: v as WoundState["treatment"]["courseDays"] })}
                options={[
                  { value: "", label: "Select" },
                  { value: "5", label: "5 days" },
                  { value: "7", label: "7 days" },
                ]}
                required
              />
            </div>
            {t.antibiotic === "flucloxacillin" && age !== null && age >= 10 && age < 18 && (
              <p className="text-xs text-gray-600">The document states suspension quantities (100 mL, 140 mL) for the 2 to 9 year dose only. A patient of 10 or over who cannot swallow capsules has no stated quantity under this PGD: refer.</p>
            )}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500">Quantity supplied (from the document's quantity row; nothing else can be recorded)</p>
              <p className="text-sm font-semibold text-navy-900">{quantitySupplied || "Select the formulation and course length"}</p>
            </div>
            <TextArea label="Which antibiotic was chosen and why" value={t.antibioticRationale} onChange={(v) => setT({ antibioticRationale: v })} rows={2} required placeholder="e.g. dog bite to forearm, infected, no penicillin allergy: co-amoxiclav" />

            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Batch number" value={t.suppliedItemBatch} onChange={(v) => setT({ suppliedItemBatch: v })} required />
              <TextInput label="Expiry date" type="date" value={t.suppliedItemExpiry} onChange={(v) => setT({ suppliedItemExpiry: v })} required />
            </div>

            <p className="text-sm font-medium text-navy-900 pt-2">Wound care given alongside (optional record)</p>
            <SelectInput
              label="Wound irrigation"
              value={t.irrigationMethod}
              onChange={(v) => setT({ irrigationMethod: v })}
              options={[
                { value: "", label: "Not recorded" },
                { value: "sterile-saline", label: "Sterile saline" },
                { value: "clean-water", label: "Clean water" },
                { value: "chlorhexidine", label: "Chlorhexidine solution" },
              ]}
            />
            <SelectInput
              label="Dressing"
              value={t.dressingType}
              onChange={(v) => setT({ dressingType: v })}
              options={[
                { value: "", label: "Not recorded" },
                { value: "adhesive", label: "Adhesive dressing" },
                { value: "non-adhesive", label: "Non-adhesive pad with tape" },
                { value: "hydrocolloid", label: "Hydrocolloid dressing" },
              ]}
            />
            <Checkbox label="Topical antiseptic applied" checked={t.topicalAntiseptic} onChange={(v) => setT({ topicalAntiseptic: v })} />
            <Checkbox label="Tetanus referral or Td/IPV supply arranged (where a reinforcing dose is indicated)" checked={t.tetanusReferralGenerated} onChange={(v) => setT({ tetanusReferralGenerated: v })} />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-navy-900">Confirm counselling covered (document counselling row):</p>
            <Checkbox
              label={
                t.antibiotic === "co-amoxiclav"
                  ? "Take one tablet three times a day at the start of a meal, and finish the course"
                  : "Take on an empty stomach, an hour before food or two hours after, and finish the course"
              }
              checked={state.counselling.administrationAdvice}
              onChange={(v) => setC({ administrationAdvice: v })}
            />
            <Checkbox
              label="Seek help THE SAME DAY if the pain becomes severe or out of proportion to how the wound looks, if redness spreads quickly, if the skin darkens or blisters, or if you develop fever, shivering or feel generally unwell"
              checked={state.counselling.sameDayWarningSigns}
              onChange={(v) => setC({ sameDayWarningSigns: v })}
            />
            <Checkbox label="Seek help if you see red streaks tracking away from the wound" checked={state.counselling.redStreaks} onChange={(v) => setC({ redStreaks: v })} />
            <Checkbox
              label="Stop and seek urgent help if you develop a rash, wheeze, or swelling of the lips or tongue (any rash should stop the course and prompt review)"
              checked={state.counselling.seriousReaction}
              onChange={(v) => setC({ seriousReaction: v })}
            />
            <Checkbox label="Report yellowing of the eyes or skin, or dark urine, even weeks after finishing" checked={state.counselling.hepaticAdvice} onChange={(v) => setC({ hepaticAdvice: v })} />
            <Checkbox
              label="Keep the wound clean and dry. Come back if it is no better in 2 to 3 days, and sooner if any warning sign develops. The tetanus question has been answered before the patient leaves"
              checked={state.counselling.woundCareAndReview}
              onChange={(v) => setC({ woundCareAndReview: v })}
            />
            <Checkbox label="Counselling provided to patient and the patient information leaflet supplied" checked={state.counselling.counsellingProvided} onChange={(v) => setC({ counsellingProvided: v })} required />
            <TextArea label="Additional counselling notes" value={state.counselling.counsellingNotes} onChange={(v) => setC({ counsellingNotes: v })} rows={3} />
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800 space-y-1">
              <p className="font-semibold text-navy-900">Record ({WOUND_CARE_PGD_VERSION})</p>
              <p>Outcome: {hasStopAlerts ? "NOT SUPPLIED, exclusion criteria met; patient referred" : t.patientDeclined ? "NOT SUPPLIED, patient declined" : `Supplied ${doseText?.medicine || t.antibiotic}, ${t.formulation || ""} ${t.courseDays ? `${t.courseDays} days` : ""}, quantity ${quantitySupplied || "not recorded"}, oral. Batch ${t.suppliedItemBatch || "not recorded"}, expiry ${t.suppliedItemExpiry || "not recorded"}.`}</p>
              <p>Wound: {a.woundType || "not recorded"}{isBite ? " (bite)" : ""}{a.heavilyContaminated ? ", heavily contaminated" : ""}; site {a.woundLocation || "not recorded"}; extent {a.woundSize || "not recorded"}; depth {a.woundDepth || "not recorded"}; injury {a.timeOfInjury || "not recorded"}. Signs of infection: {a.signsOfInfection.join(", ") || "none"}.</p>
              <p>Observations: temperature {a.temperature || "?"} C, pulse {a.pulse || "?"}, RR {a.respiratoryRate || "?"}, SpO2 {a.oxygenSaturation || "?"}%{band === "12+" ? `, systolic ${a.systolicBP || "?"}` : `, capillary refill ${a.capillaryRefill === "over-2s" ? "over 2 s" : a.capillaryRefill === "2s-or-less" ? "2 s or less" : "not measured"}`}, {a.alteredConsciousness ? "altered consciousness" : "alert"}.</p>
              <p>Tetanus: {a.tetanusStatus || "not recorded"}; action: {a.tetanusAction || "not recorded"}.{a.htigNotIndicatedReason ? ` HTIG not indicated: ${a.htigNotIndicatedReason}.` : ""}</p>
              <p>Antibiotic chosen and why: {t.antibioticRationale || "not recorded"}</p>
              {age !== null && age < 16 && (
                <p>Consent from person with parental responsibility: {state.consentDetails.parentName || "not recorded"} ({state.consentDetails.parentRelationship || "not recorded"}).</p>
              )}
            </div>
            <TextInput label="Pharmacist Name" value={state.summary.pharmacistName} onChange={(v) => setState((prev) => ({ ...prev, summary: { ...prev.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC Registration" value={state.summary.pharmacistGPhC} onChange={(v) => setState((prev) => ({ ...prev, summary: { ...prev.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy Name" value={state.summary.pharmacyName} onChange={(v) => setState((prev) => ({ ...prev, summary: { ...prev.summary, pharmacyName: v } }))} />
            <TextInput label="Pharmacy Address" value={state.summary.pharmacyAddress} onChange={(v) => setState((prev) => ({ ...prev, summary: { ...prev.summary, pharmacyAddress: v } }))} />
            <TextArea label="Clinical Notes" value={state.summary.clinicalNotes} onChange={(v) => setState((prev) => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))} rows={3} />
            <TextArea
              label="Adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk, and inform the GP)"
              value={state.summary.adverseReactions}
              onChange={(v) => setState((prev) => ({ ...prev, summary: { ...prev.summary, adverseReactions: v } }))}
              rows={2}
              placeholder="None known at the time of supply"
            />
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Wound Care Consultation Complete</p>
            <p className="text-xs text-green-700 mt-1">Supplied under the {WOUND_CARE_PGD_VERSION}. Save & Print Record saves the consultation and prints the record below.</p>
          </div>
        )}
      </StepWrapper>
    </div>
    <div className="hidden print:block">
      <WoundCareSummaryReport
        state={state}
        alerts={alerts}
        band={band}
        doseText={doseText}
        quantitySupplied={quantitySupplied}
      />
    </div>
    </>
  );
}

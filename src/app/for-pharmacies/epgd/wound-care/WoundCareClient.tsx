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
import { validatePatient, validateConsent, validateSummary } from "./lib/wound-validation";

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

type AgeBand = "2-4" | "5-11" | "12+" | null;
function getAgeBand(age: number | null): AgeBand {
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

interface WoundState {
  patient: { firstName: string; lastName: string; dateOfBirth: string; age: number | null; gpName: string; gpPractice: string; gpAddress: string; gpPhone: string; gpEmail: string; gpOdsCode: string; nhsNumber: string; address: string; phone: string; email: string };
  consent: { informedConsentGiven: boolean; idVerified: boolean; idType: string; patientAwarePrivateService: boolean };
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
    capillaryRefillOver2s: boolean;
    alteredConsciousness: boolean;
  };
  treatment: {
    antibiotic: "" | "co-amoxiclav" | "flucloxacillin";
    formulation: string;
    courseDays: "" | "5" | "7";
    quantitySupplied: string;
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
      capillaryRefillOver2s: false,
      alteredConsciousness: false,
    },
    treatment: {
      antibiotic: "",
      formulation: "",
      courseDays: "",
      quantitySupplied: "",
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
    if (a.capillaryRefillOver2s) b.push("capillary refill more than 2 seconds");
  } else if (band === "5-11") {
    if (hr !== null && hr > 120) b.push("pulse above 120");
    if (rr !== null && rr >= 25) b.push("respiratory rate 25 or above");
    if (a.capillaryRefillOver2s) b.push("capillary refill more than 2 seconds");
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
    if (a.takingAnticoagulants) {
      newAlerts.push({ severity: "caution", code: "ANTICOAGULANT", message: "Anticoagulant use", detail: "Increased bleeding risk. Monitor the wound carefully." });
    }
    if (a.pregnant || a.breastfeeding) {
      newAlerts.push({ severity: "caution", code: "FLUCLOX_PREGNANCY", message: "Pregnancy or breastfeeding: flucloxacillin may be supplied where clinically indicated", detail: "Document caution, aligned with the Skin and Soft Tissue Infection PGD. Hepatic reactions may occur up to two months after treatment." });
    }
  }

  const hoursOld = a.timeOfInjury ? Math.floor((Date.now() - new Date(a.timeOfInjury).getTime()) / (1000 * 60 * 60)) : 0;
  if (hoursOld > 6) {
    newAlerts.push({ severity: "caution", code: "WOUND_AGE", message: "More than 6 hours since injury: tetanus-prone wound", detail: "Wounds presenting after 6 hours are tetanus-prone. Establish the tetanus history and record the action. Where immunoglobulin may be indicated (high-risk wound), refer the same day." });
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
        medicine: "Flucloxacillin 500mg capsules (250mg/5mL suspension for children unable to swallow capsules)",
        dose: "500mg four times daily, on an empty stomach, one hour before or two hours after food",
        quantity: "Capsules: 20 for a 5 day course, 28 for a 7 day course",
      };
    }
    return null;
  }, [t.antibiotic, age]);

  const assessmentError = useCallback((): string | null => {
    if (!a.woundType) return "Select the wound type (mechanism)";
    if (!a.woundLocation) return "Select the wound location";
    if (!a.woundSize) return "Select the wound size (extent)";
    if (!a.woundDepth) return "Select the wound depth";
    if (!a.timeOfInjury) return "Record the time of injury";
    if (!a.temperature.trim()) return "Record the temperature";
    if (!a.pulse.trim()) return "Record the pulse";
    if (!a.respiratoryRate.trim()) return "Record the respiratory rate";
    if (!a.oxygenSaturation.trim()) return "Record the oxygen saturation on air at rest";
    if (band === "12+" && !a.systolicBP.trim()) return "Record the systolic blood pressure (required from age 12)";
    if (!a.tetanusStatus) return "Establish and record the tetanus immunisation status";
    if (!a.tetanusAction.trim()) return "Record the tetanus action taken";
    return null;
  }, [a, band]);

  const treatmentError = useCallback((): string | null => {
    if (!t.antibiotic) return "Select the antibiotic arm";
    if (arm && t.antibiotic !== arm)
      return arm === "co-amoxiclav"
        ? "A bite or heavily contaminated wound is treated with co-amoxiclav (Arm 1), not flucloxacillin"
        : "A non-bite wound is treated with flucloxacillin (Arm 2); co-amoxiclav is for bites and heavily contaminated wounds";
    if (!t.courseDays) return "Select the course length (5 or 7 days)";
    if (!t.quantitySupplied.trim()) return "Record the quantity supplied";
    if (!t.antibioticRationale.trim()) return "Record which antibiotic was chosen and why";
    if (!t.suppliedItemBatch.trim()) return "Record the batch number";
    if (!t.suppliedItemExpiry) return "Record the expiry date";
    return null;
  }, [t, arm]);

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
    return null;
  }, [currentStep, state.patient, state.summary, consentError, assessmentError, treatmentError, counsellingError]);

  const validationError = getValidationError();
  // Stops block progression from the assessment step; the record can still be
  // completed as "not supplied" once the treatment step has been reached.
  const canProceed = !validationError && !(hasStopAlerts && currentStep === 2);

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
      clinicalData: { ...state, alerts, pgdVersion: WOUND_CARE_PGD_VERSION } as unknown as Record<string, unknown>,
      outcome: hasStopAlerts ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, alerts, hasStopAlerts]);

  const setA = (patch: Partial<WoundState["assessment"]>) => setState((prev) => ({ ...prev, assessment: { ...prev.assessment, ...patch } }));
  const setT = (patch: Partial<WoundState["treatment"]>) => setState((prev) => ({ ...prev, treatment: { ...prev.treatment, ...patch } }));
  const setC = (patch: Partial<WoundState["counselling"]>) => setState((prev) => ({ ...prev, counselling: { ...prev.counselling, ...patch } }));

  const isBite = BITE_TYPES.has(a.woundType);

  return (
    <div className="space-y-6">
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
        isBlocked={hasStopAlerts && currentStep === 3}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }))}
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

            <Checkbox
              label="Heavily contaminated with soil or organic material (co-amoxiclav arm, 12 and over)"
              checked={a.heavilyContaminated}
              onChange={(v) => setA({ heavilyContaminated: v })}
            />

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
                <Checkbox label="Capillary refill more than 2 seconds" checked={a.capillaryRefillOver2s} onChange={(v) => setA({ capillaryRefillOver2s: v })} />
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

            <SelectInput
              label="Antibiotic arm (chosen on the mechanism of the wound)"
              value={t.antibiotic}
              onChange={(v) => setT({ antibiotic: v as WoundState["treatment"]["antibiotic"] })}
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
              <TextInput label="Formulation supplied" value={t.formulation} onChange={(v) => setT({ formulation: v })} placeholder={t.antibiotic === "flucloxacillin" ? "e.g. 500mg capsules / 250mg/5mL suspension" : "e.g. 500/125mg tablets"} />
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
            <TextInput label="Quantity supplied" value={t.quantitySupplied} onChange={(v) => setT({ quantitySupplied: v })} placeholder="e.g. 21 tablets / 28 capsules / 100 mL" required />
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
              <p>Outcome: {hasStopAlerts ? "NOT SUPPLIED, exclusion criteria met; patient referred" : `Supplied ${doseText?.medicine || t.antibiotic}, ${t.formulation || ""} ${t.courseDays ? `${t.courseDays} days` : ""}, quantity ${t.quantitySupplied || "not recorded"}, oral. Batch ${t.suppliedItemBatch || "not recorded"}, expiry ${t.suppliedItemExpiry || "not recorded"}.`}</p>
              <p>Wound: {a.woundType || "not recorded"}{isBite ? " (bite)" : ""}{a.heavilyContaminated ? ", heavily contaminated" : ""}; site {a.woundLocation || "not recorded"}; extent {a.woundSize || "not recorded"}; depth {a.woundDepth || "not recorded"}; injury {a.timeOfInjury || "not recorded"}. Signs of infection: {a.signsOfInfection.join(", ") || "none"}.</p>
              <p>Observations: temperature {a.temperature || "?"} C, pulse {a.pulse || "?"}, RR {a.respiratoryRate || "?"}, SpO2 {a.oxygenSaturation || "?"}%{band === "12+" ? `, systolic ${a.systolicBP || "?"}` : `, capillary refill ${a.capillaryRefillOver2s ? "over 2 s" : "2 s or less"}`}, {a.alteredConsciousness ? "altered consciousness" : "alert"}.</p>
              <p>Tetanus: {a.tetanusStatus || "not recorded"}; action: {a.tetanusAction || "not recorded"}.</p>
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
          </div>
        )}

        {currentStep === 6 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">Wound Care Consultation Complete</p>
            <p className="text-xs text-green-700 mt-1">Supplied under the {WOUND_CARE_PGD_VERSION}. Click Print Consultation Record to generate and save the PDF report.</p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}

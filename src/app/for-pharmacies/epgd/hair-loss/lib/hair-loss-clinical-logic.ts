// ─── Hair Loss (Finasteride) Clinical Logic ───
// Aligned to the Finasteride (Androgenetic Alopecia) PGD, version 003,
// issued 11 September 2026. One document serves both the 'hair-loss' and
// 'alopecia-minoxidil' catalogue entries.

export const PGD_STRAPLINE = "Finasteride 1 mg (Androgenetic Alopecia) PGD, version 003, issued 11 September 2026";

/** Plain-language descriptions of the Norwood-Hamilton stages, so a locum
 *  who does not know the chart can still pick the right stage. */
export const NORWOOD_STAGES: [number, string][] = [
  [1, "no visible recession of the hairline"],
  [2, "slight recession at the temples"],
  [3, "deep recession at the temples (earliest stage of baldness), or thinning at the crown"],
  [4, "temples and crown both thinning, with a band of hair between them"],
  [5, "band of hair between temples and crown is narrowing"],
  [6, "temples and crown have joined; band of hair gone"],
  [7, "hair only around the sides and back of the head"],
];

import type { ClinicalAlert, DoseRecommendation, AlertSeverity } from "../../shared/types";
import type { HLConsultationState } from "./hair-loss-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: HLConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stop: not male. Raised only on an explicit answer; an empty form
  // used to open with "CONSULTATION CANNOT PROCEED" before any patient data
  // existed. The patient-step validator is the gate for an unanswered form.
  if (state.patient.sexRecorded === "not-male") {
    alerts.push({
      severity: "stop",
      code: "HL_GENDER",
      message: "This PGD is for male patients only",
      detail: "Female patients are excluded: finasteride 1 mg is not indicated. Tablets should not be handled by women who are or may become pregnant.",
    });
  }

  // Hard stop: Age <18 or >65
  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "HL_AGE_MIN",
      message: "Patient must be 18 years or older",
      detail: "Inclusion: male patients aged 18 to 65 years.",
    });
  }

  if (state.patient.age !== null && state.patient.age > 65) {
    alerts.push({
      severity: "stop",
      code: "HL_AGE_MAX",
      message: "This PGD is for patients 65 years or younger",
      detail: "Inclusion: male patients aged 18 to 65 years. Refer to the GP.",
    });
  }

  // Hard stop: Liver disease
  if (state.medicalHistory.liverDisease) {
    alerts.push({
      severity: "stop",
      code: "HL_LIVER",
      message: "History of liver disease is an exclusion",
      detail: "Finasteride is metabolised by hepatic cytochrome P450. Refer to GP.",
    });
  }

  // Hard stop: Prostate cancer
  if (state.medicalHistory.prostateCancer) {
    alerts.push({
      severity: "stop",
      code: "HL_PROSTATE_CANCER",
      message: "Suspected prostate cancer is an exclusion",
      detail: "Finasteride is not suitable. Refer to GP / urology.",
    });
  }

  // Hard stop: PSA abnormalities
  if (state.medicalHistory.psaAbnormalities) {
    alerts.push({
      severity: "stop",
      code: "HL_PSA",
      message: "Raised PSA under investigation is an exclusion",
      detail: "Refer to GP for further assessment before considering finasteride.",
    });
  }

  // Hard stop: Hypersensitivity
  if (state.medicalHistory.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "HL_HYPERSENS",
      message: "Known hypersensitivity to finasteride or any component of the formulation",
      detail: "Do not supply. Document allergy in patient record.",
    });
  }

  // Hard stop: current 5-alpha-reductase inhibitor use
  if (state.medicalHistory.current5ARI) {
    alerts.push({
      severity: "stop",
      code: "HL_5ARI",
      message: "Current use of a 5-alpha-reductase inhibitor for another condition",
      detail: "Exclusion (for example finasteride 5 mg or dutasteride for BPH). Do not supply; refer to GP.",
    });
  }

  // Hard stop: galactose intolerance, Lapp lactase deficiency, glucose-galactose malabsorption
  if (state.medicalHistory.galactoseIntolerance) {
    alerts.push({
      severity: "stop",
      code: "HL_GALACTOSE",
      message: "Rare hereditary galactose intolerance, Lapp lactase deficiency or glucose-galactose malabsorption",
      detail: "Patients with these problems should not take this medicine (contains lactose). Do not supply.",
    });
  }

  // Hard stop: current suicidal ideation
  if (state.contraindications.suicidalIdeation) {
    alerts.push({
      severity: "stop",
      code: "HL_SUICIDAL",
      message: "Current suicidal ideation reported",
      detail: "Suicidal ideation has been reported with finasteride 1 mg and the document requires discontinuation and medical advice if psychiatric symptoms occur. Do not start treatment; refer the patient for medical assessment today (GP, NHS 111, or emergency services if at immediate risk).",
    });
  }

  // Stop: pharmacist has decided to refer rather than supply because of
  // current mood symptoms. Without this the only way to record that
  // decision was to carry on to a supply.
  if (state.contraindications.depressiveMood && state.contraindications.moodReferred) {
    alerts.push({
      severity: "stop",
      code: "HL_MOOD_REFER",
      message: "Not supplied: referred because of current depression or mood symptoms",
      detail: "The pharmacist has decided not to start finasteride and to refer the patient for medical review of their mood symptoms. Record the advice given and use Save as not supplied.",
    });
  }

  // Caution: Depressive mood
  if (state.contraindications.depressiveMood) {
    alerts.push({
      severity: "caution",
      code: "HL_MOOD",
      message: "Patient reports depressive mood or mood changes",
      detail: "Mood alterations including depressed mood, depression and, less frequently, suicidal ideation have been reported with finasteride 1 mg. Monitor for psychiatric symptoms; if they occur, discontinue and advise the patient to seek medical advice.",
    });
  }

  // Caution: Partner not notified (teratogenic)
  if (
    state.medicineSupply.finasteride1mgOd &&
    !state.medicineSupply.partnerNotified
  ) {
    alerts.push({
      severity: "caution",
      code: "HL_PARTNER",
      message: "Partner should be made aware of the risk of fetal harm",
      detail: "Tablets should not be handled by women who are or may become pregnant. A condom is recommended if a female partner is pregnant or likely to become pregnant (finasteride is excreted in semen).",
    });
  }

  // Caution: PSA effect awareness
  if (
    state.medicineSupply.finasteride1mgOd &&
    !state.medicineSupply.understandsPSAEffect
  ) {
    alerts.push({
      severity: "caution",
      code: "HL_PSA_EFFECT",
      message: "Patient should understand PSA effect",
      detail: "Finasteride can affect PSA levels; the patient must tell any clinician conducting PSA tests.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: HLConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: HLConsultationState
): DoseRecommendation | null {
  if (!state.patient.maleConfirmed) return null;
  if (state.patient.age === null || state.patient.age < 18) return null;
  if (hasHardStops(state)) return null;

  const months = state.medicineSupply.quantityMonths;
  return {
    medicine: "Finasteride 1 mg tablets (POM)",
    dose: "1 mg orally once daily, with or without food",
    frequency: "Once daily",
    dosingRegimen: "1 mg OD (oral daily)",
    duration: months
      ? `${months} months of treatment supplied between reviews (3 to 12 months permitted; first review after 3 to 6 months). Minimum 3 to 6 months of continuous treatment to assess effectiveness.`
      : "3 to 12 months of treatment can be supplied between reviews; first review after 3 to 6 months. Minimum 3 to 6 months of continuous treatment to assess effectiveness.",
    reason: "Androgenetic alopecia (male pattern hair loss) in men aged 18 to 65 years, to increase hair growth and prevent further hair loss.",
  };
}

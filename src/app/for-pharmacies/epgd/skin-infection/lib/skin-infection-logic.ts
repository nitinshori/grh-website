import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { SkinInfectionConsultationState } from "./skin-infection-types";

/**
 * Clinical decision logic for the Skin Infection ePGD, faithful to the
 * PPH-signed PGD (flucloxacillin / clarithromycin / doxycycline).
 * Hard stops mirror the PGD's exclusion criteria; cautions mirror its
 * cautions section (C. difficile risk, HAGMA with paracetamol,
 * renal/hepatic caution, clarithromycin-statin interaction).
 */

export function getAllAlerts(state: SkinInfectionConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age = state.patient.age;
  const mh = state.medicalHistory;
  const a = state.assessment;
  const choice = state.antibioticSelection.choice;

  // ── Hard stops (PGD exclusions) ────────────────────────────────
  if (age !== null && age < 2) {
    alerts.push({
      code: "under-2",
      severity: "stop",
      message: "Children under 2 years are excluded from this PGD",
      detail: "Refer to the GP. No antibiotic can be supplied under this PGD for a child under 2.",
    });
  }
  if (a.severity === "severe" || a.systemicSymptoms) {
    alerts.push({
      code: "severe-systemic",
      severity: "stop",
      message: "Severe or systemic infection — outside this PGD",
      detail:
        "Fever, rigors, malaise, rapidly spreading erythema or systemic involvement suggests a need for intravenous therapy or sepsis assessment. Refer urgently (same-day GP or A&E as appropriate).",
    });
  }
  if (a.abscessSuspected) {
    alerts.push({
      code: "abscess",
      severity: "stop",
      message: "Abscess requiring drainage / surgical review",
      detail: "Excluded from this PGD. Refer for incision and drainage or surgical assessment.",
    });
  }
  if (mh.immunosuppressed) {
    alerts.push({
      code: "immunosuppressed",
      severity: "stop",
      message: "Immunosuppressed patient — excluded",
      detail: "Refer to the GP; skin infection in immunosuppression needs medical assessment.",
    });
  }
  if (mh.pregnant) {
    alerts.push({
      code: "pregnancy",
      severity: "stop",
      message: "Pregnancy — excluded from this PGD",
      detail: "Refer to the GP or midwife for assessment and treatment.",
    });
  }
  if (mh.interactingMedicines) {
    alerts.push({
      code: "interaction",
      severity: "stop",
      message: "Clinically significant drug interaction identified",
      detail: "Excluded from this PGD. Refer to the GP for prescribing with appropriate monitoring.",
    });
  }
  if (
    mh.penicillinAllergy &&
    mh.macrolideAllergy &&
    (mh.tetracyclineAllergy || (age !== null && age < 12))
  ) {
    alerts.push({
      code: "no-option",
      severity: "stop",
      message: "No suitable antibiotic available under this PGD",
      detail:
        "Allergies (and/or age) exclude flucloxacillin, clarithromycin and doxycycline. Refer to the GP.",
    });
  }

  // ── Antibiotic-specific blocks ─────────────────────────────────
  if (choice === "flucloxacillin") {
    if (mh.penicillinAllergy)
      alerts.push({
      code: "fluclox-pen-allergy",
        severity: "stop",
        message: "Penicillin/beta-lactam allergy — flucloxacillin contraindicated",
        detail: "Select clarithromycin (or doxycycline if 12+) instead.",
      });
    if (mh.flucloxHepaticHistory)
      alerts.push({
      code: "fluclox-hepatic",
        severity: "stop",
        message: "History of flucloxacillin-associated jaundice or hepatic dysfunction",
        detail: "Flucloxacillin is excluded. Select an alternative antibiotic or refer.",
      });
    if (mh.severeRenalImpairment)
      alerts.push({
      code: "fluclox-renal",
        severity: "stop",
        message: "Severe renal failure (CrCl < 10 ml/min) — flucloxacillin excluded",
        detail: "Refer to the GP for dose-adjusted prescribing.",
      });
    if (mh.breastfeeding)
      alerts.push({
      code: "fluclox-breastfeeding",
        severity: "caution",
        message: "Breastfeeding — flucloxacillin only under appropriate supervision",
        detail: "Per the PGD, supply to breastfeeding patients requires appropriate supervision; consider GP discussion.",
      });
    if (mh.regularParacetamol)
      alerts.push({
      code: "fluclox-hagma",
        severity: "caution",
        message: "Concomitant paracetamol — HAGMA risk",
        detail:
          "Flucloxacillin with paracetamol carries an increased risk of high anion gap metabolic acidosis, particularly in sepsis, renal impairment, malnutrition and older age. Counsel and consider monitoring.",
      });
  }
  if (choice === "clarithromycin") {
    if (mh.macrolideAllergy)
      alerts.push({
      code: "clari-allergy",
        severity: "stop",
        message: "Macrolide allergy — clarithromycin contraindicated",
        detail: "Select an alternative antibiotic or refer.",
      });
    if (mh.takesStatin)
      alerts.push({
      code: "clari-statin",
        severity: "caution",
        message: "Statin interaction",
        detail:
          "Clarithromycin interacts with simvastatin and atorvastatin (rhabdomyolysis risk). Advise withholding the statin during the course or discuss with the GP.",
      });
  }
  if (choice === "doxycycline") {
    if (age !== null && age < 12)
      alerts.push({
      code: "doxy-under-12",
        severity: "stop",
        message: "Doxycycline is contraindicated under 12 years",
        detail: "Select flucloxacillin or clarithromycin per allergy status.",
      });
    if (mh.tetracyclineAllergy)
      alerts.push({
      code: "doxy-tetracycline",
        severity: "stop",
        message: "Tetracycline allergy — doxycycline contraindicated",
        detail: "Select an alternative antibiotic or refer.",
      });
    if (mh.breastfeeding)
      alerts.push({
      code: "doxy-breastfeeding",
        severity: "stop",
        message: "Breastfeeding — doxycycline excluded",
        detail: "Select flucloxacillin (with supervision) or clarithromycin per allergy status.",
      });
  }

  // ── General cautions (PGD cautions section) ────────────────────
  if (mh.recentAntibioticsOrHospital) {
    alerts.push({
      code: "cdiff-risk",
      severity: "caution",
      message: "C. difficile risk",
      detail:
        "Recent antibiotic use or hospitalisation increases C. difficile risk. Counsel on diarrhoea red flags and use the shortest effective course.",
    });
  }
  if (a.spreadingRapidly && a.severity !== "severe") {
    alerts.push({
      code: "spreading",
      severity: "red-flag",
      message: "Rapidly spreading infection — low threshold for referral",
      detail: "Mark the margins, review within 48 hours, and refer if progressing.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((x) => x.severity === "stop");
}

export function calculateDoseRecommendation(
  state: SkinInfectionConsultationState,
): DoseRecommendation | null {
  const age = state.patient.age;
  const choice = state.antibioticSelection.choice;
  if (!choice || age === null) return null;

  if (choice === "flucloxacillin") {
    if (age >= 2 && age <= 9)
      return {
        medicine: "Flucloxacillin 250mg/5ml suspension",
        dose: "125–250 mg four times a day",
        duration: "5–7 days",
        reason:
          "Take on an empty stomach (1 hour before or 2 hours after food) with a full glass of water; do not lie down immediately after. Suspension stored in the fridge (2–8°C).",
      };
    if (age >= 10 && age <= 17)
      return {
        medicine: "Flucloxacillin 250mg or 500mg capsules (or suspension)",
        dose: "250–500 mg four times a day",
        duration: "5–7 days",
        reason:
          "Take on an empty stomach (1 hour before or 2 hours after food) with a full glass of water (250 ml); do not lie down immediately after.",
      };
    return {
      medicine: "Flucloxacillin 500mg capsules",
      dose: "500 mg four times a day",
      duration: "5–7 days (20 or 28 capsules per clinical judgement)",
      reason:
        "Take on an empty stomach (1 hour before or 2 hours after food) with a full glass of water (250 ml); do not lie down immediately after.",
    };
  }

  if (choice === "clarithromycin") {
    if (age >= 2 && age <= 11)
      return {
        medicine: "Clarithromycin suspension",
        dose:
          "By body weight, twice daily: under 8 kg — 7.5 mg/kg; 8–11 kg — 62.5 mg; 12–19 kg — 125 mg; 20–29 kg — 187.5 mg; 30–40 kg — 250 mg",
        duration: "5–7 days",
        reason: "Confirm current weight before supply.",
      };
    return {
      medicine: "Clarithromycin 250mg or 500mg tablets",
      dose: "250–500 mg twice a day",
      duration: "5–7 days",
      reason: "Check interactions (statins, warfarin, QT-prolonging medicines) before supply.",
    };
  }

  if (choice === "doxycycline") {
    if (age < 12) return null;
    return {
      medicine: "Doxycycline 100mg capsules",
      dose: "200 mg on the first day, then 100 mg once daily",
      duration: "5–7 days (6 capsules for 5 days; 8 capsules for 7 days)",
      reason:
        "Swallow whole while upright with plenty of water; avoid lying down for 30 minutes. Avoid strong sunlight/UV (photosensitivity).",
    };
  }

  return null;
}

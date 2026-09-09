import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { SkinInfectionConsultationState } from "./skin-infection-types";

/**
 * Clinical decision logic for the Skin Infection ePGD, aligned to signed
 * document v003 (9 September 2026).
 *
 * Four things were wrong against v002/v003 and are corrected here:
 *   1. flucloxacillin doses were given as ranges ("125-250 mg", "250-500 mg")
 *      that the document does not authorise. v003 states 250mg four times
 *      daily for ages 2 to 9 and 500mg four times daily from 10.
 *   2. the clarithromycin weight bands still carried "under 8 kg 7.5 mg/kg"
 *      and "8-11 kg 62.5 mg". v003 removes both and sets a 12 kg floor.
 *   3. no cellulitis age gate. v003 restricts cellulitis to 12 and over.
 *   4. pregnancy was an absolute stop, while the document says flucloxacillin
 *      may be supplied in pregnancy where clinically indicated. The tool was
 *      refusing patients the PGD permits.
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
  // Pregnancy is arm-specific under v003, not a blanket exclusion.
  // Flucloxacillin MAY be supplied; clarithromycin and doxycycline may not.
  if (mh.pregnant) {
    if (choice === "clarithromycin" || choice === "doxycycline") {
      alerts.push({
        code: "pregnancy-arm",
        severity: "stop",
        message: "Pregnancy excludes this arm",
        detail:
          "Clarithromycin and doxycycline are excluded in pregnancy under v003. Flucloxacillin may be supplied in pregnancy where clinically indicated. If the patient is penicillin allergic, refer.",
      });
    } else {
      alerts.push({
        code: "pregnancy-fluclox-ok",
        severity: "caution",
        message: "Pregnant: flucloxacillin may be supplied",
        detail:
          "v003 permits flucloxacillin in pregnancy and breastfeeding where clinically indicated, in line with the Wound Care PGD. Earlier versions of this tool stopped every pregnant patient, which refused people the PGD allows.",
      });
    }
  }

  // Cellulitis is restricted to 12 and over under v003. It is the
  // highest-acuity condition in the document and the one most likely to
  // deteriorate; in a younger child it needs assessment, not a supply.
  if (a.infectionType === "cellulitis" && age !== null && age < 12) {
    alerts.push({
      code: "cellulitis-under-12",
      severity: "stop",
      message: "Cellulitis under 12: refer, do not supply",
      detail:
        "v003 restricts cellulitis to patients aged 12 and over. Impetigo, folliculitis, infected eczema and infected wounds remain in scope from 2 years. Say plainly that the child needs to be seen rather than treated here, and help arrange it.",
    });
  }

  // Cellulitis needs margins marked and an in-person 48-hour review booked
  // at the supplying pharmacy. v002 required a review and named nobody.
  if (a.infectionType === "cellulitis" && age !== null && age >= 12) {
    alerts.push({
      code: "cellulitis-review",
      severity: "caution",
      message: "Mark the margins and book the 48-hour review before the patient leaves",
      detail:
        "Mark the edge of the erythema with a skin-safe pen and record that you did. The review at 48 hours is in person, by a pharmacist at this pharmacy: a phone call is not sufficient, because the point is to see whether the erythema has passed the mark. Spread beyond the mark is a same-day referral, not a change of antibiotic. If the patient does not attend, contact them the same day, and if you cannot reach them record the attempt and inform the GP.",
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
    // v003 states single doses, not ranges. The ranges this tool used to
    // carry ("125-250 mg", "250-500 mg") included doses the document does
    // not authorise, and gave no volume for the suspension. The document's
    // own v002 carried the volume error that prompted this: 250mg of a
    // 250mg/5mL suspension is 5 mL, not 10 mL.
    if (age >= 2 && age <= 9)
      return {
        medicine: "Flucloxacillin 250mg/5mL oral suspension",
        dose: "250 mg four times a day, which is 5 mL of the 250mg/5mL suspension",
        duration: "5 days, or 7 days for cellulitis (12 and over only)",
        reason:
          "100 mL for 5 days, 140 mL for 7 days. Take on an empty stomach, 1 hour before or 2 hours after food. Write the volume in millilitres on the label as well as the milligram dose, and show the parent the mark on the oral syringe. Reconstituted suspension: refrigerate and discard after 7 days.",
      };
    if (age >= 10 && age <= 17)
      return {
        medicine: "Flucloxacillin 500mg capsules, or 250mg/5mL suspension if unable to swallow capsules",
        dose: "500 mg four times a day, which is 10 mL of the 250mg/5mL suspension",
        duration: "5 days, or 7 days for cellulitis",
        reason:
          "Capsules: 20 for 5 days, 28 for 7 days. Suspension: 200 mL for 5 days, 280 mL for 7 days. Take on an empty stomach, 1 hour before or 2 hours after food.",
      };
    return {
      medicine: "Flucloxacillin 500mg capsules, or 250mg/5mL suspension if unable to swallow capsules",
      dose: "500 mg four times a day, which is 10 mL of the 250mg/5mL suspension",
      duration: "5 days, or 7 days for cellulitis",
      reason:
        "Capsules: 20 for 5 days, 28 for 7 days. Suspension: 200 mL for 5 days, 280 mL for 7 days. Take on an empty stomach, 1 hour before or 2 hours after food.",
    };
  }

  if (choice === "clarithromycin") {
    // v003 removed the "under 8 kg" and "8 to 11 kg" bands and set a 12 kg
    // floor. No child of 2 weighs 8 to 11 kg, so those bands were
    // unreachable in a service starting at 2 and implied a scope this PGD
    // does not have.
    if (age >= 2 && age <= 11)
      return {
        medicine: "Clarithromycin oral suspension",
        dose:
          "By body weight, twice daily: 12 to 19 kg, 125 mg (5 mL of 125mg/5mL); 20 to 29 kg, 187.5 mg (3.75 mL of 250mg/5mL); 30 to 40 kg, 250 mg (5 mL of 250mg/5mL). Under 12 kg is outside this PGD: refer.",
        duration: "5 days, or 7 days for cellulitis (12 and over only)",
        reason:
          "Confirm current weight before supply. A child under 12 weighing more than 40 kg receives the adult dose of 250 mg twice daily.",
      };
    return {
      medicine: "Clarithromycin 250mg tablets",
      dose:
        "250 mg twice a day. 500 mg twice a day only for MORE EXTENSIVE INFECTION, meaning erythema larger than about 10 cm across, more than one body region involved, or cellulitis rather than a superficial infection. v002 used that phrase and defined it nowhere.",
      duration: "5 days, or 7 days for cellulitis",
      reason:
        "Ask about renal function and record the answer: known creatinine clearance below 30 mL/min excludes this arm under v003 and the patient is referred. Check interactions (statins, warfarin and DOACs, QT-prolonging medicines) before supply.",
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

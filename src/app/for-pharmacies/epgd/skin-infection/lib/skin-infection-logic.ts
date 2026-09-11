import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type {
  SkinInfectionConsultationState,
  SkinInfectionAssessment,
} from "./skin-infection-types";

/**
 * Clinical decision logic for the Skin Infection ePGD.
 *
 * Two documents are enforced here, selected by state.variant:
 *   "skin-infection": Skin and Soft Tissue Infection PGD v007, issued
 *     11 September 2026. From 2 years; cellulitis from 12 years. Observations
 *     are AGE-BANDED (Appendix 1). Flucloxacillin may be supplied in pregnancy
 *     and breastfeeding; clarithromycin and doxycycline may not.
 *   "cellulitis": Cellulitis PGD v004, issued 11 September 2026. Adults 18 and
 *     over, MILD cellulitis (Eron class I) of a limb or the trunk only. Adult
 *     sepsis thresholds. Flucloxacillin may be supplied in pregnancy and
 *     breastfeeding (decision 26, 11 September 2026); clarithromycin and
 *     doxycycline may not. A 48-hour reassessment at the supplying pharmacy
 *     is booked before the patient leaves (decision 28).
 */

export function isCellulitisPgd(state: SkinInfectionConsultationState): boolean {
  return state.variant === "cellulitis";
}

export type AgeBand = "2-4" | "5-11" | "12+" | null;

export function getAgeBand(age: number | null): AgeBand {
  if (age === null) return null;
  if (age < 2) return null;
  if (age <= 4) return "2-4";
  if (age <= 11) return "5-11";
  return "12+";
}

export const AGE_BAND_LABEL: Record<Exclude<AgeBand, null>, string> = {
  "2-4": "2 to 4 years",
  "5-11": "5 to 11 years",
  "12+": "12 and over",
};

function num(v: string): number | null {
  if (!v || !v.trim()) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/**
 * Observation breaches against the thresholds that apply to this patient.
 * Skin-infection document: Appendix 1, by age band. Cellulitis document:
 * temperature 38 or above or below 36, heart rate above 90, respiratory
 * rate 20 or above, systolic below 100, new confusion, or rigors.
 */
export function getObservationBreaches(state: SkinInfectionConsultationState): string[] {
  const a = state.assessment;
  const breaches: string[] = [];
  const rr = num(a.respiratoryRate);
  const hr = num(a.pulse);
  const temp = num(a.temperature);
  const sbp = num(a.systolicBP);
  const spo2 = num(a.oxygenSaturation);

  if (isCellulitisPgd(state)) {
    if (temp !== null && (temp >= 38 || temp < 36)) breaches.push("temperature 38C or above, or below 36C");
    if (hr !== null && hr > 90) breaches.push("heart rate above 90");
    if (rr !== null && rr >= 20) breaches.push("respiratory rate 20 or above");
    if (sbp !== null && sbp < 100) breaches.push("systolic blood pressure below 100");
    if (a.alteredConsciousness) breaches.push("new confusion");
    if (a.rigors) breaches.push("rigors");
    return breaches;
  }

  const band = getAgeBand(state.patient.age);
  if (!band) return breaches;
  if (temp !== null && temp >= 38) breaches.push("temperature 38C or above");
  if (spo2 !== null && spo2 < 94) breaches.push("oxygen saturation below 94% on air");
  if (band === "2-4") {
    if (rr !== null && rr >= 40) breaches.push("respiratory rate 40 or above");
    if (hr !== null && hr > 140) breaches.push("pulse above 140");
    if (a.capillaryRefillOver2s) breaches.push("capillary refill more than 2 seconds");
    if (a.alteredConsciousness)
      breaches.push("new drowsiness, floppiness, or not responding normally to social cues");
  } else if (band === "5-11") {
    if (rr !== null && rr >= 25) breaches.push("respiratory rate 25 or above");
    if (hr !== null && hr > 120) breaches.push("pulse above 120");
    if (a.capillaryRefillOver2s) breaches.push("capillary refill more than 2 seconds");
    if (a.alteredConsciousness) breaches.push("new confusion or drowsiness");
  } else {
    if (rr !== null && rr >= 22) breaches.push("respiratory rate 22 or above");
    if (hr !== null && hr > 90) breaches.push("pulse above 90 at rest");
    if (sbp !== null && sbp < 100) breaches.push("systolic blood pressure below 100");
    if (a.alteredConsciousness) breaches.push("new confusion or drowsiness");
  }
  return breaches;
}

/**
 * Appendix 2 (skin-infection document): more extensive infection means an
 * area of erythema larger than about 10 cm across, OR more than one body
 * region, OR cellulitis. Derived from the measured findings so the record
 * holds the finding that met the definition, not a tick.
 */
export function isMoreExtensiveInfection(a: SkinInfectionAssessment): boolean {
  const diameter = num(a.erythemaDiameterCm);
  const regions = num(a.bodyRegionCount);
  return (
    a.infectionType === "cellulitis" ||
    (diameter !== null && diameter > 10) ||
    (regions !== null && regions > 1)
  );
}

/** The Appendix 2 finding(s) that met the definition, for the record. */
export function extensiveInfectionFindings(a: SkinInfectionAssessment): string[] {
  const diameter = num(a.erythemaDiameterCm);
  const regions = num(a.bodyRegionCount);
  const findings: string[] = [];
  if (diameter !== null && diameter > 10) findings.push(`erythema ${diameter} cm across (larger than about 10 cm)`);
  if (regions !== null && regions > 1) findings.push(`${regions} body regions involved (more than one)`);
  if (a.infectionType === "cellulitis") findings.push("cellulitis rather than a superficial infection");
  return findings;
}

export interface FormulationOption {
  value: string;
  label: string;
  /** Quantity for a 5-day course, as the document states it. */
  quantity5: string;
  /** Quantity for a 7-day course, as the document states it. */
  quantity7: string;
}

/**
 * The document's formulations for the chosen arm, age band and weight band,
 * each with its fixed quantity for 5 and 7 days. Quantity is never typed:
 * it is read off the option for the course length chosen.
 */
export function getFormulationOptions(state: SkinInfectionConsultationState): FormulationOption[] {
  const age = state.patient.age;
  const choice = state.antibioticSelection.choice;
  if (!choice || age === null) return [];
  const cellulitisPgd = isCellulitisPgd(state);
  const a = state.assessment;
  const weight = num(a.weightKg);
  const extensive = isMoreExtensiveInfection(a);

  if (cellulitisPgd) {
    if (choice === "flucloxacillin")
      return [{ value: "flucloxacillin-500mg-capsules", label: "Flucloxacillin 500mg capsules", quantity5: "20 capsules", quantity7: "28 capsules" }];
    if (choice === "clarithromycin") {
      const halve =
        state.medicalHistory.renalFunction === "crcl-below-30-or-suspected" ||
        state.medicalHistory.renalFunction === "crcl-below-10" ||
        state.medicalHistory.severeRenalImpairment;
      return halve
        ? [{ value: "clarithromycin-250mg-tablets", label: "Clarithromycin 250mg tablets (dose halved for renal impairment)", quantity5: "10 tablets", quantity7: "14 tablets" }]
        : [{ value: "clarithromycin-500mg-tablets", label: "Clarithromycin 500mg tablets", quantity5: "10 tablets", quantity7: "14 tablets" }];
    }
    return [{ value: "doxycycline-100mg-capsules", label: "Doxycycline 100mg capsules", quantity5: "6 capsules", quantity7: "8 capsules" }];
  }

  if (choice === "flucloxacillin") {
    if (age >= 2 && age <= 9)
      return [{ value: "flucloxacillin-250mg-5ml-suspension", label: "Flucloxacillin 250mg/5mL oral suspension (5 mL four times a day)", quantity5: "100 mL", quantity7: "140 mL" }];
    return [
      { value: "flucloxacillin-500mg-capsules", label: "Flucloxacillin 500mg capsules", quantity5: "20 capsules", quantity7: "28 capsules" },
      { value: "flucloxacillin-250mg-5ml-suspension", label: "Flucloxacillin 250mg/5mL oral suspension (10 mL four times a day; unable to swallow capsules)", quantity5: "200 mL", quantity7: "280 mL" },
    ];
  }

  if (choice === "clarithromycin") {
    if (age >= 2 && age <= 11) {
      if (weight === null || weight < 12) return [];
      if (weight <= 19)
        return [{ value: "clarithromycin-125mg-5ml-suspension", label: "Clarithromycin 125mg/5mL oral suspension (12 to 19 kg: 5 mL twice daily)", quantity5: "50 mL", quantity7: "70 mL" }];
      if (weight <= 29)
        return [{ value: "clarithromycin-250mg-5ml-suspension", label: "Clarithromycin 250mg/5mL oral suspension (20 to 29 kg: 3.75 mL twice daily)", quantity5: "37.5 mL", quantity7: "52.5 mL" }];
      if (weight <= 40)
        return [{ value: "clarithromycin-250mg-5ml-suspension", label: "Clarithromycin 250mg/5mL oral suspension (30 to 40 kg: 5 mL twice daily)", quantity5: "50 mL", quantity7: "70 mL" }];
      return [{ value: "clarithromycin-250mg-tablets", label: "Clarithromycin 250mg tablets (over 40 kg: 250 mg twice daily)", quantity5: "10 tablets", quantity7: "14 tablets" }];
    }
    return extensive
      ? [
          { value: "clarithromycin-250mg-tablets", label: "Clarithromycin 250mg tablets (500 mg twice daily: two tablets per dose)", quantity5: "20 tablets", quantity7: "28 tablets" },
          { value: "clarithromycin-250mg-5ml-suspension", label: "Clarithromycin 250mg/5mL oral suspension (10 mL twice daily; unable to swallow tablets)", quantity5: "100 mL", quantity7: "140 mL" },
        ]
      : [
          { value: "clarithromycin-250mg-tablets", label: "Clarithromycin 250mg tablets (250 mg twice daily)", quantity5: "10 tablets", quantity7: "14 tablets" },
          { value: "clarithromycin-250mg-5ml-suspension", label: "Clarithromycin 250mg/5mL oral suspension (5 mL twice daily; unable to swallow tablets)", quantity5: "50 mL", quantity7: "70 mL" },
        ];
  }

  if (choice === "doxycycline") {
    if (age < 12) return [];
    return extensive
      ? [{ value: "doxycycline-100mg-capsules", label: "Doxycycline 100mg capsules (200 mg daily throughout)", quantity5: "10 capsules", quantity7: "14 capsules" }]
      : [{ value: "doxycycline-100mg-capsules", label: "Doxycycline 100mg capsules (200 mg day 1, then 100 mg daily)", quantity5: "6 capsules", quantity7: "8 capsules" }];
  }

  return [];
}

/** The document's quantity for the formulation and course length chosen, or "" if not yet determinable. */
export function derivedQuantity(state: SkinInfectionConsultationState): string {
  const sel = state.antibioticSelection;
  const opt = getFormulationOptions(state).find((o) => o.value === sel.formulation);
  if (!opt || !sel.courseDays) return "";
  return sel.courseDays === "7" ? opt.quantity7 : opt.quantity5;
}

/** Hours between the consultation date and time and an ISO datetime-local value; null if either is unparseable. */
export function hoursUntilReview(consultationDate: string, consultationTime: string, reviewDateTime: string): number | null {
  if (!consultationDate || !reviewDateTime) return null;
  const start = new Date(`${consultationDate}T${consultationTime || "00:00"}`);
  const review = new Date(reviewDateTime);
  if (isNaN(start.getTime()) || isNaN(review.getTime())) return null;
  return (review.getTime() - start.getTime()) / 3600000;
}

export function getAllAlerts(state: SkinInfectionConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age = state.patient.age;
  const mh = state.medicalHistory;
  const a = state.assessment;
  const choice = state.antibioticSelection.choice;
  const cellulitisPgd = isCellulitisPgd(state);
  const weight = num(a.weightKg);

  // ── Age (document scope) ─────────────────────────────────────────
  if (cellulitisPgd) {
    if (age !== null && age < 18) {
      alerts.push({
        code: "under-18",
        severity: "stop",
        message: "Under 18: outside the Cellulitis PGD",
        detail:
          "The Cellulitis PGD covers adults aged 18 years and over only. Refer. (A patient aged 12 to 17 with cellulitis may be assessed under the Skin and Soft Tissue Infection PGD, which has its own age-banded observations.)",
      });
    }
  } else if (age !== null && age < 2) {
    alerts.push({
      code: "under-2",
      severity: "stop",
      message: "Children under 2 years are excluded from this PGD",
      detail: "Refer to the GP. No antibiotic can be supplied under this PGD for a child under 2.",
    });
  }

  // ── Emergency: necrotising fasciitis features ────────────────────
  if (a.necrotisingFeatures || a.spreadingRapidly) {
    alerts.push({
      code: "necrotising-fasciitis",
      severity: "stop",
      message: "Feature suggesting necrotising fasciitis: arrange EMERGENCY assessment (999 or A&E)",
      detail:
        "Pain out of proportion to appearance, rapidly advancing erythema (over hours rather than days), crepitus, skin necrosis, bullae or dusky discolouration. This is a surgical emergency: emergency assessment now, not a routine referral and not an antibiotic from a pharmacy.",
    });
  }

  // ── Systemic illness / sepsis and observations ───────────────────
  const breaches = getObservationBreaches(state);
  if (a.severity === "severe" || a.systemicSymptoms || breaches.length > 0) {
    alerts.push({
      code: "severe-systemic",
      severity: "stop",
      message: cellulitisPgd
        ? "Systemic illness or sepsis: not MILD (Eron class I). Call 999 or send to A&E"
        : "Observation threshold breached, or systemic illness or sepsis: outside this PGD",
      detail:
        (breaches.length > 0 ? `Breached: ${breaches.join("; ")}. ` : "") +
        (cellulitisPgd
          ? "Moderate or severe cellulitis (Eron class II to IV) is not covered by this PGD. Arrange emergency care before the patient leaves the pharmacy."
          : "Any observation outside the thresholds for the patient's age band (Appendix 1), or any sign of systemic illness or sepsis, means refer, do not supply. Arrange same-day assessment."),
    });
  }

  if (a.abscessSuspected) {
    alerts.push({
      code: "abscess",
      severity: "stop",
      message: "Abscess requiring drainage, or infected wound needing surgical review",
      detail: "Excluded from this PGD. Refer for incision and drainage or surgical assessment.",
    });
  }
  if (a.facialOrExcludedSite) {
    alerts.push({
      code: "excluded-site",
      severity: "stop",
      message: cellulitisPgd
        ? "Periorbital, orbital or facial cellulitis, or not a limb or the trunk: same-day urgent referral"
        : "Facial or periorbital cellulitis, or cellulitis of the hand: refer",
      detail: cellulitisPgd
        ? "The Cellulitis PGD covers mild cellulitis of a limb or the trunk only. Periorbital, orbital or facial cellulitis needs same-day urgent referral; arrange it before the patient leaves."
        : "Facial, periorbital and hand cellulitis are outside this PGD entirely. Refer for same-day assessment.",
    });
  }
  if (a.biteOrWaterExposure) {
    alerts.push({
      code: "bite",
      severity: "stop",
      message: cellulitisPgd
        ? "Following an animal or human bite, or fresh water or sea water exposure: refer"
        : "Animal or human bite: refer",
      detail: cellulitisPgd
        ? "Different organisms are involved. Refer to the GP the same day and record that this was done."
        : "Bites need co-amoxiclav, which is not covered here. Bite wounds are not covered by this PGD.",
    });
  }
  if (!cellulitisPgd && a.jointOrBoneInvolvement) {
    alerts.push({
      code: "joint-bone",
      severity: "stop",
      message: "Suspected osteomyelitis or septic arthritis, or infection over a joint or tendon",
      detail: "Excluded from this PGD. Refer.",
    });
  }
  if (!cellulitisPgd && a.possibleTinea) {
    alerts.push({
      code: "tinea",
      severity: "stop",
      message: "Untreated fungal infection, or a rash that may be tinea rather than bacterial infection",
      detail:
        "Tinea misdiagnosed as bacterial infection is a common error, and an antibiotic will not treat it. Refer, do not supply.",
    });
  }
  if (!cellulitisPgd && a.possibleViral) {
    alerts.push({
      code: "viral",
      severity: "stop",
      message: "Suspected viral infection, including eczema herpeticum",
      detail:
        "Rapidly worsening, painful, punched-out or clustered vesicular lesions. Refer. An antibiotic will not treat it.",
    });
  }
  if (a.diabeticFootOrLymphoedema) {
    alerts.push({
      code: "diabetic-foot",
      severity: "stop",
      message: cellulitisPgd
        ? "Diabetic foot, or a limb with lymphoedema or chronic venous ulceration: same-day GP referral"
        : "Diabetic foot infection: refer",
      detail: cellulitisPgd
        ? "Refer to the GP the same day and record that this was done."
        : "Excluded from this PGD. Refer.",
    });
  }
  if (cellulitisPgd && a.suspectedDvtOrBilateral) {
    alerts.push({
      code: "dvt-bilateral",
      severity: "stop",
      message: "Suspected deep vein thrombosis, or redness of both legs: refer",
      detail:
        "Bilateral leg redness is usually not cellulitis. Refer to the GP the same day and record that this was done.",
    });
  }
  if (!cellulitisPgd && a.antibioticAlreadyTaken) {
    alerts.push({
      code: "antibiotic-taken",
      severity: "stop",
      message: "An antibiotic already taken for this episode: refer",
      detail: "One course per episode. A second course is not authorised under this PGD.",
    });
  }
  if (cellulitisPgd && a.antibioticFailureOrRecurrence) {
    alerts.push({
      code: "antibiotic-failure",
      severity: "stop",
      message: "Not improving after 48 hours of an antibiotic, or a second episode at the same site within 3 months: refer",
      detail: "Refer to the GP the same day and record that this was done.",
    });
  }
  if (mh.immunosuppressed) {
    alerts.push({
      code: "immunosuppressed",
      severity: "stop",
      message: cellulitisPgd
        ? "Immunosuppression (chemotherapy, biologics, long-term oral steroids, poorly controlled diabetes): excluded"
        : "Immunosuppression of any kind: absolute exclusion",
      detail: cellulitisPgd
        ? "Refer to the GP the same day and record that this was done."
        : "A skin infection in an immunosuppressed patient can progress to necrotising infection and needs assessment rather than an antibiotic from a pharmacy. (Under the Acute Bacterial Bronchitis PGD immunosuppression is a qualifying comorbidity; here it is an absolute exclusion. That difference is deliberate.)",
    });
  }

  // ── Pregnancy and breastfeeding ──────────────────────────────────
  // Both documents: flucloxacillin MAY be supplied in pregnancy and
  // breastfeeding where clinically indicated (Cellulitis PGD from decision 26,
  // 11 September 2026, matching the Skin and Soft Tissue Infection PGD);
  // clarithromycin and doxycycline may not.
  if (mh.pregnant || mh.breastfeeding) {
    const which = [mh.pregnant ? "Pregnancy" : "", mh.breastfeeding ? "breastfeeding" : ""]
      .filter(Boolean)
      .join(" and ");
    if (choice === "clarithromycin" || choice === "doxycycline") {
      alerts.push({
        code: "pregnancy-arm",
        severity: "stop",
        message: `${which}: this arm is excluded. Refer`,
        detail: cellulitisPgd
          ? "The clarithromycin and doxycycline arms of the Cellulitis PGD exclude pregnant and breastfeeding individuals. Flucloxacillin may be supplied in pregnancy and breastfeeding where clinically indicated and there is no penicillin allergy. If the patient is penicillin allergic, refer."
          : "Clarithromycin and doxycycline are excluded in pregnancy and breastfeeding. Flucloxacillin may be supplied in pregnancy and breastfeeding where clinically indicated. If the patient is penicillin allergic, refer.",
      });
    } else {
      alerts.push({
        code: "pregnancy-fluclox-ok",
        severity: "caution",
        message: `${which}: flucloxacillin may be supplied where clinically indicated`,
        detail: cellulitisPgd
          ? "The Cellulitis PGD permits flucloxacillin in pregnancy and breastfeeding where clinically indicated (NICE NG141 first line in pregnancy; SmPC), matching the Skin and Soft Tissue Infection PGD. Record that the patient is pregnant or breastfeeding and the indication. Clarithromycin and doxycycline are excluded in pregnancy and breastfeeding."
          : "The document permits flucloxacillin in pregnancy and breastfeeding where clinically indicated, in line with the Wound Care PGD. Clarithromycin and doxycycline are excluded in pregnancy and breastfeeding.",
      });
    }
  }

  // ── Cellulitis age gate and review (skin-infection document) ─────
  if (!cellulitisPgd && a.infectionType === "cellulitis" && age !== null && age < 12) {
    alerts.push({
      code: "cellulitis-under-12",
      severity: "stop",
      message: "Cellulitis under 12: refer, do not supply",
      detail:
        "Cellulitis under this PGD is restricted to patients aged 12 and over. Impetigo, folliculitis, infected eczema and infected wounds remain in scope from 2 years. Say plainly that the child needs to be seen rather than treated here, and help arrange it.",
    });
  }
  if (a.infectionType === "cellulitis" && (cellulitisPgd || (age !== null && age >= 12))) {
    alerts.push({
      code: "cellulitis-review",
      severity: "caution",
      message: cellulitisPgd
        ? "Mark the margin, record the time, and book the 48-hour reassessment at this pharmacy before the patient leaves"
        : "Mark the margins and book the in-person 48-hour review before the patient leaves",
      detail: cellulitisPgd
        ? "Marking the margin and recording the time, and booking a reassessment at 48 hours at the supplying pharmacy before the patient leaves, are inclusion requirements. The reassessment is in person, by a pharmacist at this pharmacy: a phone call is not sufficient. Record at the reassessment whether the erythema is within or beyond the mark, the temperature, whether pain has improved, and the decision. Spread beyond the mark, no improvement, deterioration or an unclear diagnosis is a same-day referral. If the patient does not attend, contact them the same day; if they cannot be reached, record the attempt and inform the GP."
        : "Mark the edge of the erythema with a skin-safe pen and record that you did. The review at 48 hours is in person, by a pharmacist at this pharmacy, booked as an appointment before the patient leaves: a phone call is not sufficient. Record at the review whether the erythema is inside or beyond the mark, the temperature, whether pain has improved, and the decision. Spread beyond the mark is a same-day referral, not a change of antibiotic. If the patient does not attend, contact them the same day; if you cannot reach them, record the attempt and inform the GP.",
    });
  }

  if (!cellulitisPgd && a.beyondMildModerateScope) {
    alerts.push({
      code: "beyond-scope",
      severity: "stop",
      message: "Infection beyond the Appendix 2 definition: outside the mild to moderate scope",
      detail:
        "Appendix 2: more extensive infection (erythema larger than about 10 cm, more than one body region, or cellulitis) takes the higher clarithromycin or doxycycline dose. Anything beyond that is outside this PGD: refer.",
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

  // ── Antibiotic-specific blocks ───────────────────────────────────
  if (choice === "flucloxacillin") {
    if (mh.penicillinAllergy)
      alerts.push({
        code: "fluclox-pen-allergy",
        severity: "stop",
        message: "Penicillin or beta-lactam allergy: flucloxacillin contraindicated",
        detail: "Select clarithromycin (or doxycycline if 12 and over) instead, and record the reason.",
      });
    if (mh.flucloxHepaticHistory)
      alerts.push({
        code: "fluclox-hepatic",
        severity: "stop",
        message: "History of flucloxacillin-associated jaundice or hepatic dysfunction",
        detail: "Flucloxacillin is excluded. Select an alternative antibiotic or refer.",
      });
    if (mh.severeRenalImpairment || mh.renalFunction === "crcl-below-10")
      alerts.push({
        code: "fluclox-renal",
        severity: "stop",
        message: "Severe renal impairment (creatinine clearance below 10 mL/min): flucloxacillin excluded",
        detail: "Refer to the GP for dose-adjusted prescribing.",
      });
    if (mh.regularParacetamol)
      alerts.push({
        code: "fluclox-hagma",
        severity: "caution",
        message: "Concomitant paracetamol: HAGMA risk",
        detail:
          "Flucloxacillin with paracetamol carries an increased risk of high anion gap metabolic acidosis, particularly in sepsis, renal impairment, malnutrition and older age. Counsel and consider monitoring.",
      });
    if (!cellulitisPgd && age !== null && age < 10)
      alerts.push({
        code: "fluclox-child-empty-stomach",
        severity: "caution",
        message: "Child: flucloxacillin must still be given on an empty stomach",
        detail:
          "Flucloxacillin is poorly tolerated on an empty stomach by some children. It must still be given an hour before food or two hours after, because food substantially reduces absorption. If a child cannot manage that, refer rather than compromise the dosing. Any rash should stop the course and prompt review.",
      });
  }

  if (choice === "clarithromycin") {
    if (mh.macrolideAllergy)
      alerts.push({
        code: "clari-allergy",
        severity: "stop",
        message: "Macrolide hypersensitivity: clarithromycin contraindicated",
        detail: "Select an alternative antibiotic or refer.",
      });
    if (!cellulitisPgd && weight !== null && weight < 12)
      alerts.push({
        code: "clari-under-12kg",
        severity: "stop",
        message: "Weighing under 12 kg: outside the clarithromycin arm",
        detail: "A child weighing under 12 kg is outside this PGD; refer.",
      });
    if (!cellulitisPgd && (mh.renalFunction === "crcl-below-30-or-suspected" || mh.renalFunction === "crcl-below-10" || mh.severeRenalImpairment))
      alerts.push({
        code: "clari-renal",
        severity: "stop",
        message: "Known renal impairment (creatinine clearance below 30 mL/min) or suspected significant impairment: refer",
        detail:
          "A pharmacy supply is not the place to make a renal dose adjustment on an unverified estimate, so this PGD excludes and refers instead.",
      });
    if (cellulitisPgd && (mh.renalFunction === "crcl-below-30-or-suspected" || mh.renalFunction === "crcl-below-10" || mh.severeRenalImpairment))
      alerts.push({
        code: "clari-renal-halve",
        severity: "caution",
        message: "Creatinine clearance below 30 mL/min: halve the clarithromycin dose to 250 mg twice daily",
        detail:
          "The Cellulitis PGD states that in renal impairment with creatinine clearance less than 30 mL/min the dosage should be reduced by one half, 250 mg twice daily. Supply 250 mg tablets.",
      });
    if (mh.qtProlongation)
      alerts.push({
        code: "clari-qt",
        severity: "stop",
        message: "Known QT prolongation, or concurrent QT-prolonging medicines: clarithromycin excluded",
        detail: "Select an alternative antibiotic or refer.",
      });
    if (mh.clariContraindicatedMedicines)
      alerts.push({
        code: "clari-contraindicated-meds",
        severity: "stop",
        message: "Concurrent medicine contraindicated with clarithromycin",
        detail:
          "Ergot alkaloids, oral midazolam, lomitapide, astemizole, cisapride, domperidone, pimozide, terfenadine, ticagrelor, ivabradine, ranolazine, simvastatin or lovastatin. Select an alternative antibiotic or refer.",
      });
    if (mh.takesColchicine)
      alerts.push({
        code: "clari-colchicine",
        severity: "stop",
        message: "Colchicine: risk of toxicity. Refer rather than supply",
        detail: "Concomitant clarithromycin and colchicine is contraindicated. Select an alternative antibiotic or refer.",
      });
    if (mh.takesWarfarin || mh.takesDoac)
      alerts.push({
        code: "clari-anticoagulant",
        severity: cellulitisPgd ? "caution" : "stop",
        message: cellulitisPgd
          ? "Warfarin or a DOAC: bleeding risk with clarithromycin"
          : "Taking warfarin or a DOAC: clarithromycin excluded. Refer",
        detail: cellulitisPgd
          ? "Risk of serious haemorrhage and INR elevation with warfarin; caution with dabigatran, rivaroxaban, apixaban and edoxaban, particularly at high bleeding risk. INR should be frequently monitored; consider an alternative arm or GP referral."
          : "Refer to the GP.",
      });
    if (mh.severeHepaticImpairment || (cellulitisPgd && mh.flucloxHepaticHistory))
      alerts.push({
        code: "clari-hepatic",
        severity: "stop",
        message: cellulitisPgd
          ? "Hepatic dysfunction: clarithromycin excluded"
          : "Severe hepatic impairment: clarithromycin excluded",
        detail: "Select an alternative antibiotic or refer.",
      });
    if (mh.electrolyteDisturbance)
      alerts.push({
        code: "clari-electrolytes",
        severity: "stop",
        message: "Known electrolyte disturbance (hypokalaemia or hypomagnesaemia): clarithromycin excluded",
        detail: "Risk of QT prolongation. Select an alternative antibiotic or refer.",
      });
    if (mh.takesStatin)
      alerts.push({
        code: "clari-statin",
        severity: "caution",
        message: "Statin interaction",
        detail:
          "Simvastatin and lovastatin are an exclusion (above). Other statins such as atorvastatin interact with clarithromycin (myopathy risk): advise withholding the statin during the course or discuss with the GP.",
      });
  }

  if (choice === "doxycycline") {
    if (age !== null && age < 12)
      alerts.push({
        code: "doxy-under-12",
        severity: "stop",
        message: "Doxycycline is not used under 12 years",
        detail: "Select flucloxacillin or clarithromycin per allergy status.",
      });
    if (mh.tetracyclineAllergy)
      alerts.push({
        code: "doxy-tetracycline",
        severity: "stop",
        message: "Hypersensitivity to doxycycline or other tetracyclines: contraindicated",
        detail: "Select an alternative antibiotic or refer.",
      });
    if (mh.severeHepaticImpairment || (cellulitisPgd && mh.flucloxHepaticHistory))
      alerts.push({
        code: "doxy-hepatic",
        severity: cellulitisPgd ? "caution" : "stop",
        message: cellulitisPgd
          ? "Hepatic issues: use doxycycline with caution"
          : "Known severe hepatic impairment: doxycycline excluded",
        detail: cellulitisPgd
          ? "Use with caution in patients with a history of hepatic issues or receiving potentially hepatotoxic drugs."
          : "Select an alternative antibiotic or refer.",
      });
    if (mh.myastheniaSleOrPorphyria)
      alerts.push({
        code: "doxy-mg-sle-porphyria",
        severity: cellulitisPgd ? "caution" : "stop",
        message: cellulitisPgd
          ? "Myasthenia gravis, systemic lupus erythematosus or porphyria: doxycycline caution"
          : "Myasthenia gravis, systemic lupus erythematosus or porphyria: doxycycline excluded",
        detail: cellulitisPgd
          ? "The Cellulitis PGD lists these as cautions for doxycycline (weak neuromuscular blockade in myasthenia gravis; exacerbation of SLE; rare reports of porphyria). Consider flucloxacillin or clarithromycin instead."
          : "Select an alternative antibiotic or refer.",
      });
    if (mh.takesIsotretinoin)
      alerts.push({
        code: "doxy-isotretinoin",
        severity: "stop",
        message: "Concurrent isotretinoin: refer",
        detail: "Both cause benign intracranial hypertension. Select an alternative antibiotic or refer.",
      });
    if (mh.takesWarfarin)
      alerts.push({
        code: "doxy-warfarin",
        severity: "stop",
        message: "Taking warfarin: doxycycline potentiates it. Refer",
        detail:
          "Warfarin is an exclusion here (and a caution in the Acute Bacterial Bronchitis PGD, where the instruction is also to refer). Do not supply; refer.",
      });
  }

  // ── General cautions ─────────────────────────────────────────────
  if (mh.recentAntibioticsOrHospital) {
    alerts.push({
      code: "cdiff-risk",
      severity: "caution",
      message: "C. difficile risk",
      detail:
        "Recent antibiotic use or hospitalisation increases C. difficile risk. Counsel on diarrhoea red flags and use the shortest effective course.",
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
  const cellulitisPgd = isCellulitisPgd(state);
  const a = state.assessment;
  const extensive = isMoreExtensiveInfection(a);
  const weight = num(a.weightKg);

  // ── Cellulitis PGD v004: adults, mild cellulitis of a limb or the trunk ──
  if (cellulitisPgd) {
    if (choice === "flucloxacillin")
      return {
        medicine: "Flucloxacillin 500mg capsules",
        dose: "500 mg four times a day (every 6 hours), one 500mg capsule per dose",
        duration: "5 to 7 days depending on clinical response",
        reason:
          "500mg capsules only: 20 capsules for 5 days or 28 capsules for 7 days. Oral, on an empty stomach (1 hour before or 2 hours after food), ideally with a full glass of water (250 mL).",
      };
    if (choice === "clarithromycin") {
      const halve =
        state.medicalHistory.renalFunction === "crcl-below-30-or-suspected" ||
        state.medicalHistory.renalFunction === "crcl-below-10" ||
        state.medicalHistory.severeRenalImpairment;
      return {
        medicine: halve ? "Clarithromycin 250mg tablets" : "Clarithromycin 500mg tablets",
        dose: halve
          ? "250 mg twice daily (dose halved: creatinine clearance below 30 mL/min)"
          : "500 mg twice daily",
        duration: "5 to 7 days depending on clinical response",
        reason:
          "10 tablets for 5 days or 14 tablets for 7 days. Oral, twice daily. In renal impairment with creatinine clearance below 30 mL/min the dose is reduced by one half to 250 mg twice daily.",
      };
    }
    return {
      medicine: "Doxycycline 100mg capsules",
      dose: "200 mg on the first day, then 100 mg daily",
      duration: "5 to 7 days depending on clinical response",
      reason:
        "6 capsules for 5 days or 8 capsules for 7 days. Swallow with a full glass of water (250 mL), sitting or standing, well before retiring at night. If gastric irritation occurs, take with food or milk.",
    };
  }

  // ── Skin and Soft Tissue Infection PGD v007 ──────────────────────
  if (choice === "flucloxacillin") {
    // The document states single doses, not ranges: 250mg four times daily
    // for ages 2 to 9 (5 mL of the 250mg/5mL suspension) and 500mg four
    // times daily from 10.
    if (age >= 2 && age <= 9)
      return {
        medicine: "Flucloxacillin 250mg/5mL oral suspension",
        dose: "250 mg four times a day, which is 5 mL of the 250mg/5mL suspension",
        duration: "5 days for uncomplicated infection (cellulitis is 12 and over only)",
        reason:
          "100 mL for 5 days. CHECK THE VOLUME AGAINST THE STRENGTH BEFORE SUPPLY: the 250mg/5mL suspension delivers 50 mg per mL. Take on an empty stomach, 1 hour before or 2 hours after food. Write the volume in millilitres on the label as well as the milligram dose, and show the parent the mark on the oral syringe. Reconstituted suspension: refrigerate and discard after 7 days. Supply the whole course; do not split.",
      };
    return {
      medicine: "Flucloxacillin 500mg capsules, or 250mg/5mL oral suspension if unable to swallow capsules",
      dose: "500 mg four times a day, which is 10 mL of the 250mg/5mL suspension",
      duration: a.infectionType === "cellulitis" ? "7 days for cellulitis" : "5 days for uncomplicated infection",
      reason:
        "Capsules: 20 for 5 days, 28 for 7 days. Suspension: 200 mL for 5 days, 280 mL for 7 days. Take on an empty stomach, 1 hour before or 2 hours after food. Maximum 7 days; one course per episode. Supply the whole course; do not split.",
    };
  }

  if (choice === "clarithromycin") {
    if (age >= 2 && age <= 11) {
      let band = "";
      if (weight !== null) {
        if (weight < 12) band = "Under 12 kg is outside this PGD: refer.";
        else if (weight <= 19) band = "12 to 19 kg: 125 mg twice daily, 5 mL of 125mg/5mL suspension (50 mL for 5 days, 70 mL for 7 days).";
        else if (weight <= 29) band = "20 to 29 kg: 187.5 mg twice daily, 3.75 mL of 250mg/5mL suspension (37.5 mL for 5 days, 52.5 mL for 7 days).";
        else if (weight <= 40) band = "30 to 40 kg: 250 mg twice daily, 5 mL of 250mg/5mL suspension (50 mL for 5 days, 70 mL for 7 days).";
        else band = "Over 40 kg: adult dose, 250 mg twice daily (250mg tablets, 10 for 5 days, 14 for 7 days).";
      }
      return {
        medicine: "Clarithromycin 125mg/5mL or 250mg/5mL oral suspension (250mg tablets over 40 kg)",
        dose: band || "By body weight, twice daily: 12 to 19 kg, 125 mg; 20 to 29 kg, 187.5 mg; 30 to 40 kg, 250 mg. Enter the weight to see the band.",
        duration: "5 days for uncomplicated infection (cellulitis is 12 and over only)",
        reason:
          "Confirm current weight before supply. A child under 12 weighing more than 40 kg receives the adult dose of 250 mg twice daily. A child weighing under 12 kg is outside this PGD. Write the volume per dose in millilitres on the label as well as the milligram dose. With or without food.",
      };
    }
    return {
      medicine: "Clarithromycin 250mg tablets, or 250mg/5mL oral suspension if unable to swallow tablets",
      dose: extensive
        ? "500 mg twice a day (MORE EXTENSIVE INFECTION, Appendix 2), which is 10 mL of 250mg/5mL suspension"
        : "250 mg twice a day, which is 5 mL of 250mg/5mL suspension",
      duration: a.infectionType === "cellulitis" ? "7 days for cellulitis" : "5 days for uncomplicated infection",
      reason: extensive
        ? "Tablets, 500 mg twice daily: 20 for 5 days, 28 for 7 days. Suspension: 100 mL for 5 days, 140 mL for 7 days. Dose increase applies because the infection meets the Appendix 2 definition (erythema larger than about 10 cm across, more than one body region, or cellulitis). Record the finding that met it."
        : "Tablets, 250 mg twice daily: 10 for 5 days, 14 for 7 days. Suspension: 50 mL for 5 days, 70 mL for 7 days. 500 mg twice daily only for MORE EXTENSIVE INFECTION as defined in Appendix 2.",
    };
  }

  if (choice === "doxycycline") {
    if (age < 12) return null;
    return {
      medicine: "Doxycycline 100mg capsules",
      dose: extensive
        ? "200 mg daily throughout (MORE EXTENSIVE INFECTION, Appendix 2)"
        : "200 mg on day 1 as a single dose, then 100 mg once daily",
      duration: a.infectionType === "cellulitis" ? "7 days for cellulitis" : "5 days for uncomplicated infection",
      reason: extensive
        ? "200 mg daily regimen: 10 capsules for 5 days, 14 capsules for 7 days. Dose increase applies because the infection meets the Appendix 2 definition; record the finding that met it. Swallow whole with plenty of water, sitting or standing, well before lying down."
        : "Standard regimen: 6 capsules for 5 days, 8 capsules for 7 days. Swallow whole with plenty of water, sitting or standing, well before lying down. Separate from antacids, iron and dairy by at least 2 hours. Photosensitivity: advise sun protection.",
    };
  }

  return null;
}

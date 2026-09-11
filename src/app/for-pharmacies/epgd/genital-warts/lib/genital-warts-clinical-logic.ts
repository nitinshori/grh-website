import type { GenitalWartsConsultationState } from "./genital-warts-types";
import { MAX_SUPPLIES } from "./genital-warts-types";
import type { ClinicalAlert } from "../../shared/types";

/**
 * Clinical logic for the genital warts ePGD.
 *
 * Every rule here traces to the signed PGD version 004 (11 September 2026),
 * which carries separate inclusion and exclusion criteria for podophyllotoxin and
 * for imiquimod. Where they differ, the rule is scoped to the chosen agent.
 *
 * A deliberate note on the shape of these conditions. Every stop below fires
 * on a flag being positively set, never on the absence of a confirmation.
 * A rule written as `!confirmedSafe` would fire on step 0 with the default
 * state and lock the pharmacist out of a consultation they had not started,
 * which is exactly the bug that reached a live tool once already. If you add
 * a rule here, make it assert something the pharmacist has actually recorded.
 */

/**
 * Podophyllotoxin: the Warticon SmPC limits unsupervised application to a
 * total treatment area of 4 cm2 and treatment to 4 weekly cycles (PGD v002
 * correction, carried in v004). The earlier 50-wart figure had no source and
 * was removed from the document.
 */
const PODO_MAX_AREA_CM2 = 4;
const PODO_MAX_CYCLES = 4;

export function getAllAlerts(
  state: GenitalWartsConsultationState,
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const a = state.assessment;
  const agent = state.treatment.agent;

  // ── Hard exclusions, both agents ──────────────────────────────

  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "WARTS_UNDER_18",
      message: "Patient is under 18",
      detail:
        "Both PGDs are restricted to adults aged 18 and over. Refer to the GP or a sexual health service.",
    });
  }

  if (a.internalWarts) {
    alerts.push({
      severity: "stop",
      code: "WARTS_INTERNAL",
      message: "Internal warts (urethral, vaginal, cervical or rectal)",
      detail:
        "Excluded under both PGDs. These need specialist assessment and treatment, not a patient-applied topical. External perianal warts remain in scope.",
    });
  }

  if (a.pregnancyStatus === "confirmed" || a.pregnancyStatus === "possible") {
    alerts.push({
      severity: "stop",
      code: "WARTS_PREGNANCY",
      message:
        a.pregnancyStatus === "confirmed"
          ? "Patient is pregnant"
          : "Pregnancy cannot be excluded",
      detail:
        "Excluded under both PGDs. Podophyllotoxin is teratogenic. Defer treatment until after pregnancy and advise the patient to inform their midwife or GP.",
    });
  }

  if (a.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "WARTS_BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail: "Excluded under both PGDs. Refer for an alternative approach.",
    });
  }

  if (a.openWoundsPresent) {
    alerts.push({
      severity: "stop",
      code: "WARTS_BROKEN_SKIN",
      message: "Open wounds or broken skin at the application site",
      detail:
        "Neither agent may be applied to broken skin. Defer until healed.",
    });
  }

  // Hypersensitivity is recorded per agent so the record keeps the allergy
  // when the other agent is used; it stops only when the matching agent is
  // selected (adversarial review, 11 Sep 2026).
  if (a.hypersensitivityPodophyllotoxin && agent === "podophyllotoxin") {
    alerts.push({
      severity: "stop",
      code: "WARTS_HYPERSENSITIVITY_PODO",
      message: "Known hypersensitivity to podophyllotoxin: excluded for this agent",
      detail:
        "Excluded from the podophyllotoxin arm. Select imiquimod if otherwise suitable, otherwise refer.",
    });
  }

  if (a.hypersensitivityImiquimod && agent === "imiquimod") {
    alerts.push({
      severity: "stop",
      code: "WARTS_HYPERSENSITIVITY_IMIQ",
      message: "Known hypersensitivity to imiquimod: excluded for this agent",
      detail:
        "Excluded from the imiquimod arm. Select podophyllotoxin if otherwise suitable, otherwise refer.",
    });
  }

  // Course limits, both agents: podophyllotoxin 4 cycles; imiquimod 4
  // dispensings (16 weeks). Beyond that the PGD authorises nothing.
  if (agent && state.treatment.supplyNumber !== null && state.treatment.supplyNumber > MAX_SUPPLIES[agent]) {
    alerts.push({
      severity: "stop",
      code: "WARTS_COURSE_LIMIT",
      message:
        agent === "podophyllotoxin"
          ? "More than 4 podophyllotoxin cycles: outside the PGD"
          : "More than 4 imiquimod dispensings (16 weeks): outside the PGD",
      detail:
        agent === "podophyllotoxin"
          ? "The PGD authorises up to 4 cycles (4 weeks, the licensed maximum). Refer to the GP or a sexual health service."
          : "The PGD authorises up to 16 weeks of imiquimod. Refer to the GP or a sexual health service.",
    });
  }

  if (agent && state.treatment.supplyNumber !== null && state.treatment.supplyNumber >= 3 && state.treatment.priorReviewOutcome === "cleared") {
    alerts.push({
      severity: "stop",
      code: "WARTS_CLEARED",
      message: "Warts cleared at review: no further supply",
      detail:
        agent === "podophyllotoxin"
          ? "The PGD repeats treatment only if warts persist after 2 cycles."
          : "The PGD: if complete clearance at the 8-week review, stop treatment.",
    });
  }

  // ── Podophyllotoxin-specific limits ───────────────────────────
  // Imiquimod carries no equivalent cap, so these are scoped to the agent
  // and only bite once podophyllotoxin has actually been selected.

  if (agent === "podophyllotoxin") {
    if (
      a.treatmentAreaCm2 !== null &&
      a.treatmentAreaCm2 > PODO_MAX_AREA_CM2
    ) {
      alerts.push({
        severity: "stop",
        code: "WARTS_PODO_AREA",
        message: `Treatment area greater than ${PODO_MAX_AREA_CM2} cm2`,
        detail:
          "Above the SmPC limit for unsupervised podophyllotoxin use; the PGD excludes it (needs healthcare professional supervision; refer). Imiquimod is the agent indicated for larger or keratinised lesions.",
      });
    }

    if (a.keratinised) {
      alerts.push({
        severity: "stop",
        code: "WARTS_PODO_KERATINISED",
        message: "Keratinised lesions: podophyllotoxin is not indicated",
        detail:
          "The podophyllotoxin arm covers visible, non-keratinised external warts only. Select imiquimod, the agent the PGD indicates for keratinised lesions.",
      });
    }
  }

  // ── Imiquimod-specific cautions ───────────────────────────────

  if (agent === "imiquimod") {
    if (a.uncircumcisedMale) {
      alerts.push({
        severity: "caution",
        code: "WARTS_IMIQ_PHIMOSIS",
        message: "Uncircumcised male: risk of phimosis",
        detail:
          "Counsel on careful application and daily retraction hygiene. If phimosis develops, stop treatment and refer to the GP.",
      });
    }

    if (a.autoimmuneCondition) {
      alerts.push({
        severity: "caution",
        code: "WARTS_IMIQ_AUTOIMMUNE",
        message: "Autoimmune condition",
        detail:
          "Imiquimod is an immune response modifier and may exacerbate autoimmune disease. Monitor closely and consider specialist input.",
      });
    }
  }

  // ── Red flags and cautions, both agents ──────────────────────

  if (a.suspiciousLesion) {
    alerts.push({
      severity: "stop",
      code: "WARTS_SUSPICIOUS",
      message: "Atypical, bleeding or ulcerated lesion",
      detail:
        "Do not treat. Refer for biopsy to exclude squamous cell carcinoma or other pathology.",
    });
  }

  if (a.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "WARTS_IMMUNOSUPP",
      message: "Immunocompromised patient",
      detail:
        "Higher risk of extensive disease, poorer response and recurrence. Treatment may proceed, but monitor closely and consider specialist input.",
    });
  }

  return alerts;
}

export function hasHardStops(
  state: GenitalWartsConsultationState,
): boolean {
  return getAllAlerts(state).some((alert) => alert.severity === "stop");
}

/**
 * Which agent the PGD points to, given what has been recorded. Advisory: the
 * pharmacist chooses, this only surfaces the PGD's own steer so the choice is
 * an informed one.
 */
export function suggestedAgent(
  state: GenitalWartsConsultationState,
): { agent: "podophyllotoxin" | "imiquimod"; reason: string } | null {
  const a = state.assessment;

  if (a.keratinised) {
    return {
      agent: "imiquimod",
      reason:
        "Keratinised lesions. The PGD indicates imiquimod for larger or keratinised warts.",
    };
  }

  if (a.treatmentAreaCm2 !== null && a.treatmentAreaCm2 > PODO_MAX_AREA_CM2) {
    return {
      agent: "imiquimod",
      reason: `Treatment area above ${PODO_MAX_AREA_CM2} cm2, which is above the podophyllotoxin limit for unsupervised use.`,
    };
  }

  if (
    a.externalWartsConfirmed &&
    a.wartCount !== null &&
    a.treatmentAreaCm2 !== null
  ) {
    return {
      agent: "podophyllotoxin",
      reason:
        "Small, non-keratinised external warts within the podophyllotoxin limits.",
    };
  }

  return null;
}

/** The dosing schedule for the selected agent, straight from the PGD. */
export function doseSchedule(agent: string): {
  regimen: string;
  course: string;
  review: string;
  quantity: string;
} | null {
  if (agent === "podophyllotoxin") {
    return {
      regimen:
        "Apply a thin layer to the warts twice daily for 3 consecutive days, then 4 days with no treatment.",
      course: `Repeat the 3-days-on, 4-days-off cycle for up to ${PODO_MAX_CYCLES} cycles (4 weeks total treatment, the licensed maximum).`,
      review:
        "Review progress after 2 cycles. If warts persist, repeat for an additional 2 cycles.",
      quantity: "1 bottle of solution (15 mL) or 1 tube of cream (5 g) per treatment cycle. Total treatment area up to and including 4 cm2.",
    };
  }

  if (agent === "imiquimod") {
    return {
      regimen:
        "Apply a thin layer 3 times a week at bedtime, for example Monday, Wednesday and Friday. Wash off after 6 to 10 hours.",
      course: "Continue for up to 16 weeks.",
      review: "Review at 8 weeks. Stop if the warts have cleared completely.",
      quantity: "12 sachets per dispensing, which covers 4 weeks at 3 times a week.",
    };
  }

  return null;
}

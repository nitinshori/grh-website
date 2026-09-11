import type { EczemaConsultationState } from "./eczema-types";
import { QUANTITY_BY_AREA } from "./eczema-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

/**
 * Clinical logic for the Eczema and Dermatitis PGD v006 (11 September 2026).
 * Severity AND site decide the arm: mild anywhere permitted, or moderate on
 * the face, flexures or genital skin (7 days maximum there): clobetasone
 * butyrate 0.05% (Arm 1). Moderate on the trunk or limbs: betamethasone
 * valerate 0.1% (Arm 2). Eyelids: refer.
 */

/** The arm the document routes this presentation to, before exclusions. */
export function requiredArm(state: EczemaConsultationState): "clobetasone" | "betamethasone" | null {
  const a = state.assessment;
  if (a.severity === "mild") return "clobetasone";
  if (a.severity === "moderate") return a.thinSkinSite ? "clobetasone" : "betamethasone";
  return null;
}

export function getAllAlerts(state: EczemaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const a = state.assessment;
  const c = state.contraindications;
  const mh = state.medicalHistory;
  const choice = state.medicineSelection.steroidChoice;
  const thinSkin = a.thinSkinSite;

  // ── Age ──────────────────────────────────────────────────────────
  if (state.patient.age !== null && state.patient.age < 12) {
    alerts.push({
      severity: "stop",
      code: "ECZ_AGE",
      message: "Under 12 years: outside this PGD",
      detail:
        "This PGD covers 12 years and over. Refer to the GP. Emollients remain first-line at any age and can be advised.",
    });
  }

  // ── Emergency and exclusions ─────────────────────────────────────
  if (c.viralInfection) {
    alerts.push({
      severity: "stop",
      code: "ECZ_VIRAL",
      message: "Suspected eczema herpeticum: arrange EMERGENCY assessment",
      detail:
        "Rapidly worsening, painful, punched-out or clustered vesicular lesions, or a systemically unwell patient. This is an emergency, not a routine referral.",
    });
  }
  if (c.fungalInfection) {
    alerts.push({
      severity: "stop",
      code: "ECZ_FUNGAL",
      message: "Untreated fungal infection, or a rash that might be tinea: refer",
      detail:
        "A topical steroid on tinea produces tinea incognito: the rash spreads, loses its edge and becomes much harder to diagnose. Say plainly why a steroid is not the right treatment and arrange review.",
    });
  }
  if (a.eyelids) {
    alerts.push({
      severity: "stop",
      code: "ECZ_EYELIDS",
      message: "Eyelid involvement: excluded from both arms. Refer",
      detail: "The eyelids are excluded from both arms. Say plainly why a steroid is not the right treatment here and arrange review.",
    });
  }
  // The stop fires only on the pharmacist's explicit answer that the
  // infection is not mild and localised (refer). A blank answer is a
  // validation message, not a stop (stop audit, 11 Sep 2026).
  const infectionSigns = c.bacterialInfection || a.isOozing;
  const concurrentRouteMet = c.infectionManagement === "concurrent" && c.concurrentAntibioticSupplied && c.concurrentInfectionMildLocalised;
  if (infectionSigns && c.infectionManagement === "refer") {
    alerts.push({
      severity: "stop",
      code: "ECZ_BACTERIAL",
      message: "Signs of secondary bacterial infection: refer, unless MILD and LOCALISED and treated concurrently under the Skin and Soft Tissue Infection PGD",
      detail:
        "Weeping, crusting or sudden worsening suggests secondary bacterial infection. Where the infection is MILD and LOCALISED the patient may have the topical corticosteroid under this PGD and an oral antibiotic under the Skin and Soft Tissue Infection PGD at the same consultation, both recorded in one record: select the concurrent route in the 'Secondary bacterial infection' panel, tick both boxes and record the antibiotic supplied. Where the infection is not mild and localised, or any red flag from the infection PGD is present, refer and supply neither.",
    });
  }
  if (infectionSigns && concurrentRouteMet) {
    alerts.push({
      severity: "caution",
      code: "ECZ_CONCURRENT",
      message: "Concurrent supply: mild, localised secondary infection treated under the Skin and Soft Tissue Infection PGD",
      detail:
        "Both supplies must be in this one consultation record. If any red flag from the infection PGD is present, refer and supply neither.",
    });
  }
  if (c.ulceratedOrOpenWound) {
    alerts.push({
      severity: "stop",
      code: "ECZ_ULCERATED",
      message: "Ulcerated skin or an open wound: refer",
      detail: "Ulcerated skin and open wounds are excluded. Excoriation from scratching is NOT an exclusion.",
    });
  }
  if (c.rosaceaOrAcne) {
    alerts.push({
      severity: "stop",
      code: "ECZ_ROSACEA",
      message: "Rosacea, perioral dermatitis or acne: refer",
      detail: "A topical steroid makes all three worse. Excluded from both arms.",
    });
  }
  if (a.treatedArea === "over-10-palms") {
    alerts.push({
      severity: "stop",
      code: "ECZ_AREA",
      message: "More than 10% of body surface affected (about ten adult palms): refer",
      detail: "Refer to the GP for review rather than supplying.",
    });
  }
  if (mh.coursesLast12Months === "3-or-more" && mh.gpReviewSinceLastCourse === "no") {
    alerts.push({
      severity: "stop",
      code: "ECZ_COURSES",
      message: "Three or more courses already supplied in the last 12 months without GP review: refer",
      detail: "Maximum three courses in any 12 months before GP review. Refer to the GP rather than supplying again. Where the GP has reviewed the patient since the last course, record that on the Medical History step.",
    });
  }
  if (mh.coursesLast12Months === "3-or-more" && mh.gpReviewSinceLastCourse === "yes") {
    alerts.push({
      severity: "caution",
      code: "ECZ_COURSES_REVIEWED",
      message: "Three or more courses in the last 12 months, GP review recorded since the last course",
      detail: "Supply is permitted after GP review. Record the review in the clinical notes.",
    });
  }
  if (mh.lastCourseEndDate) {
    const end = new Date(mh.lastCourseEndDate).getTime();
    const daysSince = isNaN(end) ? null : (Date.now() - end) / (1000 * 60 * 60 * 24);
    if (daysSince !== null && daysSince < 28) {
      alerts.push({
        severity: "caution",
        code: "ECZ_CONTINUOUS",
        message: "The last course ended less than 4 weeks ago: check the 4 week continuous ceiling",
        detail: "Maximum 4 weeks of continuous daily treatment on the trunk and limbs, and 7 days on the face, flexures or genital skin. A second supply may be made after review, within that ceiling; beyond it the patient needs GP review rather than a further supply here.",
      });
    }
  }
  if (mh.productHypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "ECZ_HYPERSENSITIVITY",
      message: "Known hypersensitivity to the product or any excipient",
      detail: "Excluded. Refer.",
    });
  }
  if (mh.currentlyUsingTopicalSteroid) {
    alerts.push({
      severity: "stop",
      code: "ECZ_SECOND_STEROID",
      message: "Already using another topical corticosteroid: do not add a second. Refer",
      detail: "Document caution: where the patient is already using another topical corticosteroid, do not add a second. Refer.",
    });
  }
  if (mh.pregnantOrBreastfeeding) {
    if (mh.treatmentToBreastArea) {
      alerts.push({
        severity: "stop",
        code: "ECZ_BREAST",
        message: "Pregnancy or breastfeeding with treatment to the breast or nipple area: excluded",
        detail: "Refer.",
      });
    } else {
      alerts.push({
        severity: "caution",
        code: "ECZ_PREGNANCY",
        message: "Pregnancy or breastfeeding: short-term use of these potencies is acceptable away from the breast or nipple area",
        detail: "Record the site treated.",
      });
    }
  }
  if (a.severity === "severe") {
    alerts.push({
      severity: "stop",
      code: "ECZ_SEVERE",
      message: "Severe eczema: outside this PGD. Refer",
      detail: "This PGD covers mild and moderate disease only. Extensive, cracked or oozing eczema needs assessment and may need systemic treatment.",
    });
  }

  // ── Site and arm ─────────────────────────────────────────────────
  if (thinSkin) {
    alerts.push({
      severity: "caution",
      code: "ECZ_SITE",
      message: "Face, flexures or genital skin: clobetasone only (Arm 1), 7 days maximum at those sites",
      detail:
        "Betamethasone valerate 0.1% (Arm 2) is not authorised on the face, eyelids, flexures or genital skin: a potent steroid on thin skin causes atrophy quickly. Clobetasone butyrate 0.05% may be used there for mild or moderate disease for up to 7 days only. The eyelids are excluded from both arms.",
    });
  }
  if (choice === "betamethasone" && thinSkin) {
    alerts.push({
      severity: "stop",
      code: "ECZ_BETA_SITE",
      message: "Betamethasone valerate 0.1% is not authorised on the face, flexures or genital skin",
      detail: "Use clobetasone butyrate 0.05% under Arm 1 for those sites, capped at 7 days, and record which arm was used and why.",
    });
  }
  if (choice === "betamethasone" && a.severity === "mild") {
    alerts.push({
      severity: "stop",
      code: "ECZ_BETA_MILD",
      message: "Mild disease: use Arm 1 (clobetasone). Do not start at a potent steroid where a moderate one is appropriate",
      detail: "Arm 2 excludes mild disease.",
    });
  }
  if (choice === "clobetasone" && a.severity === "moderate" && !thinSkin) {
    alerts.push({
      severity: "stop",
      code: "ECZ_CLOB_MODERATE",
      message: "Moderate disease on the trunk or limbs: use Arm 2 (betamethasone valerate 0.1%)",
      detail: "Arm 1 excludes moderate disease on the trunk or limbs.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: EczemaConsultationState): DoseRecommendation | null {
  const a = state.assessment;
  const arm = requiredArm(state);
  if (!arm) return null;
  const thinSkin = a.thinSkinSite;
  const quantity =
    a.treatedArea && a.treatedArea !== "over-10-palms" ? QUANTITY_BY_AREA[a.treatedArea] : "sized to the treated area (15g, 30g or 60g)";

  if (arm === "clobetasone") {
    return {
      medicine: "Clobetasone butyrate 0.05% cream or ointment (PGD Arm 1, moderate potency)",
      dose: "Apply a THIN layer to affected skin only, measured in fingertip units",
      frequency: "Once or twice daily",
      dosingRegimen: `One fingertip unit is about 0.5g and covers about two adult palms. Ointment for dry, lichenified skin; cream for weeping or moist areas and for the face where an ointment is not tolerated. Supply ${quantity}.`,
      duration: thinSkin
        ? "FACE, FLEXURES OR GENITAL SKIN: 7 DAYS MAXIMUM, whichever severity. Not 4 weeks"
        : "Up to 7 days initially, then review. Maximum 4 weeks of continuous daily treatment on the trunk and limbs",
      reason: thinSkin
        ? `${a.severity === "moderate" ? "Moderate" : "Mild"} disease on the face, flexures or genital skin, where the potent arm is not authorised. Capped at 7 days at those sites; explain the cap and record it. Maximum three courses in any 12 months before GP review. One supply per consultation.`
        : "Mild disease. Clobetasone butyrate 0.05% is the first-line potency under this PGD. Maximum three courses in any 12 months before GP review. One supply per consultation; a second supply may be made after review, within the 4 week ceiling.",
    };
  }
  return {
    medicine: "Betamethasone valerate 0.1% cream or ointment (PGD Arm 2, potent)",
    dose: "Apply a THIN layer to affected skin only, measured in fingertip units",
    frequency: "Once or twice daily",
    dosingRegimen: `One fingertip unit is about 0.5g and covers about two adult palms. Ointment for dry, lichenified skin; cream for moist areas. Supply ${quantity}.`,
    duration: "Up to 7 days initially, then review. Maximum 4 weeks of continuous daily treatment on the trunk and limbs",
    reason:
      "Moderate disease on the trunk or limbs. NOT AUTHORISED on the face, eyelids, flexures or genital skin: use clobetasone under Arm 1 there. Keep the course as short as the flare requires and review at 7 days; step down to a moderate potency once the flare settles rather than stopping abruptly. Maximum three courses in any 12 months before GP review.",
  };
}

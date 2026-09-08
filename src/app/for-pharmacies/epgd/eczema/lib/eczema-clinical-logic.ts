import type { EczemaConsultationState } from "./eczema-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: EczemaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.bacterialInfection) {
    alerts.push({
      severity: "stop",
      code: "ECZ_BACTERIAL",
      message: "Bacterial infection present",
      detail: "Widespread infected eczema requires antibiotic therapy. Refer to GP for treatment.",
    });
  }

  if (state.contraindications.viralInfection) {
    alerts.push({
      severity: "stop",
      code: "ECZ_VIRAL",
      message: "Viral infection present (suspected eczema herpeticum)",
      detail: "Refer to GP/urgent care. Antiviral therapy needed.",
    });
  }

  if (state.contraindications.faceOrGroin) {
    alerts.push({
      severity: "stop",
      code: "ECZ_SITE",
      message: "Potent steroid inappropriate for face/groin",
      detail: "Use only mild potency steroids (hydrocortisone 1%) on face/groin due to atrophy risk.",
    });
  }

  if (state.contraindications.childUnder1) {
    alerts.push({
      severity: "stop",
      code: "ECZ_AGE",
      message: "Child under 1 year — moderate+ steroids contraindicated",
      detail: "Only mild steroids (hydrocortisone 1%) safe in infants. Emollients are first-line.",
    });
  }

  // Red flags
  if (state.assessment.severity === "severe") {
    alerts.push({
      severity: "red-flag",
      code: "ECZ_SEVERE",
      message: "Severe eczema flare — consider urgent GP referral",
      detail: "Extensive, cracked, or oozing eczema requires specialist assessment and may need systemic treatment.",
    });
  }

  if (state.contraindications.rosaceaOrAcne) {
    alerts.push({
      severity: "caution",
      code: "ECZ_ROSACEA",
      message: "Rosacea or acne at treatment site",
      detail: "Topical steroids may worsen rosacea. Use with caution; consider alternative.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: EczemaConsultationState): DoseRecommendation | null {
  if (!state.assessment.severity) return null;

  let recommendation: DoseRecommendation | null = null;

  if (state.assessment.severity === "mild") {
    recommendation = {
      // Hydrocortisone is NOT in the eczema PGD, which authorises
      // betamethasone and clobetasone. It does not need to be: hydrocortisone
      // 1% is a P medicine and mild eczema can be handled as a pharmacy sale.
      // Say so, rather than implying this PGD authorises it.
      medicine: "Hydrocortisone 1% cream (PHARMACY SALE, not under this PGD)",
      dose: "Apply thinly",
      frequency: "Once or twice daily",
      duration: "Up to 7 days (body areas)",
      dosingRegimen: "Fingertip unit per hand-sized area. Apply thinly to affected skin. Use emollient as base first.",
      reason:
        "Mild eczema. Hydrocortisone 1% is a P medicine: sell it under pharmacy protocol with a consultation record. This PGD authorises betamethasone and clobetasone, and neither is needed for a mild flare.",
    };
  } else if (state.assessment.severity === "moderate") {
    recommendation = {
      medicine: state.medicineSelection.steroidChoice || "Betamethasone valerate 0.025% or Clobetasone butyrate 0.05% (Eumovate)",
      dose: "Apply thinly",
      frequency: "Once or twice daily",
      duration: "Up to 14 days",
      dosingRegimen: "Fingertip unit per hand-sized area. Apply thinly. Use emollient as base.",
      reason: "Moderate potency steroid for moderate inflammatory eczema",
    };

    // Fusidic acid removed 8 Sep 2026. Two problems, either of which was
    // enough on its own:
    //
    // 1. Fusidic acid appears nowhere in the eczema PGD, so the tool was
    //    suggesting an antibacterial the document does not authorise.
    // 2. The condition gated it on hasFungalInfection while the text it added
    //    said "if secondary bacterial infection suspected". Fusidic acid does
    //    not treat fungal infection. The check and the advice were for
    //    different organisms.
    //
    // Infected eczema is now a referral, or a supply under the impetigo or
    // skin infection PGD if the presentation fits one of those.
    if (state.medicineSelection.hasFungalInfection) {
      recommendation.reason +=
        ". SUSPECTED INFECTION: this PGD does not authorise any antibacterial or antifungal. Do not add fusidic acid. Refer, or treat under the impetigo or skin infection PGD if the presentation fits.";
    }
  }

  return recommendation;
}

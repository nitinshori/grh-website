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
      medicine: "Hydrocortisone 1% cream/ointment",
      dose: "Apply thinly",
      frequency: "Once or twice daily",
      duration: "Up to 7 days (body areas)",
      dosingRegimen: "Fingertip unit per hand-sized area. Apply thinly to affected skin. Use emollient as base first.",
      reason: "Mild potency steroid suitable for mild eczema flares",
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

    if (state.medicineSelection.hasFungalInfection && state.medicineSelection.addFusicidAcid) {
      recommendation.reason += "; add Fusidic acid 2% if secondary bacterial infection suspected";
    }
  }

  return recommendation;
}

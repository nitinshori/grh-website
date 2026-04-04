import type { AcneConsultationState } from "./acne-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: AcneConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops — pregnancy/breastfeeding
  if (state.contraindications.pregnant) {
    alerts.push({
      severity: "stop",
      code: "ACNE_PREGNANCY",
      message: "Retinoids contraindicated in pregnancy",
      detail: "Adapalene is teratogenic. Patient must not be pregnant. Discuss contraception.",
    });
  }

  if (state.contraindications.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "ACNE_BREASTFEEDING",
      message: "Retinoids contraindicated in breastfeeding",
      detail: "Adapalene passes into breast milk. Patient should not breastfeed if using this treatment.",
    });
  }

  // Hard stops — age under 12
  if (state.contraindications.ageUnder12) {
    alerts.push({
      severity: "stop",
      code: "ACNE_AGE",
      message: "Patient under 12 years old",
      detail: "This PGD is for patients aged 12 and above.",
    });
  }

  // Red flag — severe/nodular acne
  if (state.assessment.nodalCystic) {
    alerts.push({
      severity: "red-flag",
      code: "ACNE_SEVERE",
      message: "Nodular or cystic acne — refer to dermatology",
      detail: "Severe acne requires specialist assessment and potentially systemic treatment (isotretinoin). Recommend urgent GP referral.",
    });
  }

  // Caution — retinoid sensitivity
  if (state.medicalHistory.sensitiveToRetinoids) {
    alerts.push({
      severity: "caution",
      code: "ACNE_RETINOID_SENS",
      message: "History of retinoid sensitivity",
      detail: "Patient has previously reacted to retinoid products. Discuss risk-benefit with patient.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: AcneConsultationState): DoseRecommendation | null {
  if (!state.assessment.severity) return null;

  let recommendation: DoseRecommendation | null = null;

  if (state.assessment.severity === "mild") {
    if (state.medicineSelection.medicineChoice === "adapalene") {
      recommendation = {
        medicine: "Adapalene 0.1% gel",
        dose: "Apply once daily",
        frequency: "Once daily",
        duration: "Ongoing (review at 6-8 weeks)",
        reason: "First-line retinoid for mild comedonal acne",
      };
    } else if (state.medicineSelection.medicineChoice === "benzoyl-peroxide") {
      recommendation = {
        medicine: "Benzoyl peroxide 5% gel",
        dose: "Apply once daily",
        frequency: "Once daily",
        duration: "Ongoing (review at 6-8 weeks)",
        reason: "First-line antibacterial for mild acne",
      };
    }
  } else if (state.assessment.severity === "moderate") {
    recommendation = {
      medicine: "Adapalene 0.1%/Benzoyl peroxide 2.5% (Epiduo) gel",
      dose: "Apply once daily",
      frequency: "Once daily",
      duration: "Ongoing (review at 6-8 weeks)",
      reason: "Combination therapy for moderate inflammatory acne",
    };

    if (state.medicineSelection.inadequateResponse && state.medicineSelection.addLymecycline) {
      recommendation.reason += "; add Lymecycline if inadequate response";
    }
  }

  return recommendation;
}

export function getMedicineOptions(severity: string): string[] {
  if (severity === "mild") {
    return ["adapalene", "benzoyl-peroxide"];
  } else if (severity === "moderate") {
    return ["epiduo"];
  }
  return [];
}

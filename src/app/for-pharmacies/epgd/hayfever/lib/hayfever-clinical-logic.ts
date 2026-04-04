// ─── Hayfever Clinical Logic ───

import type { HayfeverConsultationState } from "./hayfever-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: HayfeverConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.contraindications.pregnant) {
    alerts.push({
      severity: "caution",
      code: "PREGNANCY",
      message: "Patient is pregnant",
      detail: "Most antihistamines have caution in pregnancy. Consultation required with GP.",
    });
  }

  if (state.contraindications.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail: "Some antihistamines contraindicated. Consult GP for safety.",
    });
  }

  if (state.contraindications.childUnder12) {
    alerts.push({
      severity: "caution",
      code: "AGE_RESTRICTION",
      message: "Patient under 12 years",
      detail: "Fexofenadine 180mg not suitable for children under 12. Recommend GP referral.",
    });
  }

  if (state.medicalHistory.recentNasalSurgery) {
    alerts.push({
      severity: "caution",
      code: "NASAL_SURGERY",
      message: "Recent nasal surgery",
      detail: "Nasal sprays contraindicated. Do not supply fluticasone nasal spray.",
    });
  }

  if (state.medicalHistory.phenylketonuria) {
    alerts.push({
      severity: "caution",
      code: "PKU",
      message: "Patient has phenylketonuria",
      detail: "Some formulations contain aspartame. Check product compatibility.",
    });
  }

  return alerts;
}

export function hasHardStops(state: HayfeverConsultationState): boolean {
  return (
    state.contraindications.pregnant ||
    state.contraindications.breastfeeding ||
    state.medicalHistory.recentNasalSurgery
  );
}

export function calculateDoseRecommendation(
  state: HayfeverConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.medicineSelected) return null;

  const recommendations: Record<string, DoseRecommendation> = {
    fexofenadine: {
      medicine: "Fexofenadine 180mg tablets",
      dose: "180mg",
      frequency: "Once daily",
      duration: "As needed during hay fever season",
      reason: "Non-drowsy antihistamine for allergic rhinitis symptoms",
    },
    fluticasone: {
      medicine: "Fluticasone propionate nasal spray",
      dose: "50mcg per actuation",
      frequency: "2 sprays each nostril once daily",
      duration: "As needed during hay fever season",
      reason: "Intranasal corticosteroid for nasal symptoms",
    },
    montelukast: {
      medicine: "Montelukast 10mg tablets",
      dose: "10mg",
      frequency: "Once daily in evening",
      duration: "As needed during hay fever season",
      reason: "Leukotriene receptor antagonist (especially if co-existing asthma)",
    },
    combination: {
      medicine: "Fexofenadine 180mg + Fluticasone nasal spray",
      dose: "Fexofenadine 180mg once daily + Fluticasone 2 sprays each nostril once daily",
      frequency: "Daily during hay fever season",
      reason: "Combination for moderate-severe symptoms (systemic + intranasal)",
    },
  };

  return recommendations[state.medicineSupply.medicineSelected] || null;
}

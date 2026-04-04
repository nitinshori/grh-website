import type { BVConsultationState } from "./bv-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: BVConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.bloodStainedDischarge) {
    alerts.push({
      severity: "stop",
      code: "BLOOD_DISCHARGE",
      message: "Blood-stained discharge",
      detail: "Not typical of BV. Refer to GP for diagnosis.",
    });
  }

  if (state.assessment.fever || state.assessment.pelvicPain) {
    alerts.push({
      severity: "stop",
      code: "FEVER_PAIN",
      message: "Fever or pelvic pain",
      detail: "Not typical of uncomplicated BV. Refer to GP for assessment.",
    });
  }

  if (state.medicalHistory.firstEpisode) {
    alerts.push({
      severity: "stop",
      code: "FIRST_EPISODE",
      message: "First episode of BV",
      detail: "Requires GP diagnosis confirmation before treatment.",
    });
  }

  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "caution",
      code: "PREGNANCY",
      message: "Currently pregnant (first trimester)",
      detail: "Metronidazole contraindicated in first trimester. Refer to GP.",
    });
  }

  if (state.medicalHistory.activePelvicInflammation) {
    alerts.push({
      severity: "stop",
      code: "PELVIC_INFLAM",
      message: "Active pelvic inflammatory disease",
      detail: "Requires specialist assessment. Refer to GP urgently.",
    });
  }

  if (state.medications.warfarin) {
    alerts.push({
      severity: "caution",
      code: "WARFARIN",
      message: "Taking warfarin",
      detail: "Metronidazole may increase warfarin effect. Monitor INR closely.",
    });
  }

  if (state.medications.alcohol) {
    alerts.push({
      severity: "caution",
      code: "ALCOHOL",
      message: "Patient reports alcohol use",
      detail: "Metronidazole + alcohol: disulfiram reaction risk. Advise complete avoidance during and for 48 hours after.",
    });
  }

  if (state.medicalHistory.recurrentBV) {
    alerts.push({
      severity: "caution",
      code: "RECURRENT",
      message: "Recurrent BV",
      detail: "Consider underlying cause; may benefit from longer duration or maintenance therapy.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: BVConsultationState): DoseRecommendation | null {
  const choice = state.medicineSelection.medicineChoice;

  if (choice === "metronidazole-400") {
    return {
      medicine: "Metronidazole",
      dose: "400mg",
      frequency: "Twice daily (BD)",
      duration: "5-7 days",
      dosingRegimen: "400mg twice daily for 5-7 days",
      reason: "Uncomplicated bacterial vaginosis",
    };
  } else if (choice === "metronidazole-2g") {
    return {
      medicine: "Metronidazole",
      dose: "2g",
      frequency: "Single dose",
      duration: "One-off",
      dosingRegimen: "2g single oral dose",
      reason: "Uncomplicated bacterial vaginosis",
    };
  } else if (choice === "metronidazole-gel") {
    return {
      medicine: "Metronidazole",
      dose: "Intravaginal 0.75% gel",
      frequency: "Once daily",
      duration: "5 days",
      dosingRegimen: "One applicator (5g) intravaginally once daily for 5 days",
      reason: "Uncomplicated bacterial vaginosis",
    };
  }

  return null;
}

import type { GonorrhoeaConsultationState } from "./gonorrhoea-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: GonorrhoeaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (!state.assessment.neatPositive) {
    alerts.push({
      severity: "stop",
      code: "GONNO_NO_NAAT",
      message: "NAAT confirmation not documented",
      detail: "Confirmed positive NAAT result required before treatment",
    });
  }

  if (state.assessment.pharyngealGonorrhoea) {
    alerts.push({
      severity: "red-flag",
      code: "GONNO_PHARYNGEAL",
      message: "Pharyngeal gonorrhoea",
      detail: "Refer to sexual health specialist (not covered by this PGD)",
    });
  }

  if (state.assessment.cephalosporinAllergy) {
    alerts.push({
      severity: "stop",
      code: "GONNO_ALLERGY",
      message: "Cephalosporin allergy documented",
      detail: "Cannot use ceftriaxone; refer to sexual health clinic for alternative",
    });
  }

  if (!state.assessment.partnerNotificationPlanned) {
    alerts.push({
      severity: "caution",
      code: "GONNO_PARTNER",
      message: "Partner notification not planned",
      detail: "Essential to contact and treat sexual partner(s) within last 2 weeks",
    });
  }

  return alerts;
}

export function hasHardStops(state: GonorrhoeaConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

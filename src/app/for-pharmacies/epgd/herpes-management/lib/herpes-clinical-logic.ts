import type { HerpesConsultationState } from "./herpes-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: HerpesConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.severeRenalImpairment) {
    alerts.push({
      severity: "caution",
      code: "HERPES_RENAL",
      message: "Severe renal impairment",
      detail: "Dose adjustment needed; consider aciclovir IV or refer",
    });
  }

  if (state.assessment.pregnancyFirstEpisode) {
    alerts.push({
      severity: "caution",
      code: "HERPES_PREGNANCY_FIRST",
      message: "Pregnancy with first episode of herpes",
      detail: "High risk of neonatal herpes if delivery during active episode; specialist referral recommended",
    });
  }

  return alerts;
}

export function hasHardStops(state: HerpesConsultationState): boolean {
  return false; // No absolute contraindications for antiviral therapy
}

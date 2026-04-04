import type { GenitalWartsConsultationState } from "./genital-warts-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: GenitalWartsConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.internalWartsPresent || state.assessment.analWarts || state.assessment.cervicalWarts) {
    alerts.push({
      severity: "red-flag",
      code: "WARTS_INTERNAL",
      message: "Internal/anal/cervical warts present",
      detail: "NOT suitable for self-applied podophyllotoxin; refer to specialist",
    });
  }

  if (state.assessment.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "WARTS_IMMUNOSUPP",
      message: "Immunosuppressed patient",
      detail: "Consider specialist referral; may have slower response to treatment",
    });
  }

  if (state.assessment.pregnancyStatus === "confirmed") {
    alerts.push({
      severity: "stop",
      code: "WARTS_PREGNANCY",
      message: "Patient is pregnant",
      detail: "Podophyllotoxin contraindicated; defer treatment until after pregnancy",
    });
  }

  if (state.assessment.openWoundsPresent) {
    alerts.push({
      severity: "stop",
      code: "WARTS_WOUNDS",
      message: "Open wounds or broken skin at treatment site",
      detail: "Cannot apply podophyllotoxin to broken skin; defer until healed",
    });
  }

  return alerts;
}

export function hasHardStops(state: GenitalWartsConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

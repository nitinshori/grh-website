// ─── MMR Clinical Logic ───

import type { MMRConsultationState } from "./mmr-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: MMRConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Pregnancy contraindication
  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Patient is pregnant",
      detail: "MMR vaccine is contraindicated in pregnancy. Advise to avoid pregnancy for 1 month after vaccination.",
    });
  }

  // Immunosuppression
  if (state.medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail: "Live attenuated MMR vaccine is contraindicated. Refer to specialist.",
    });
  }

  // Anaphylaxis to neomycin
  if (state.medicalHistory.anaphylaxisNeomycin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_NEOMYCIN",
      message: "Anaphylaxis to neomycin",
      detail: "MMR vaccine is contraindicated due to neomycin content.",
    });
  }

  // Anaphylaxis to gelatin
  if (state.medicalHistory.anaphylaxisGelatin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_GELATIN",
      message: "Anaphylaxis to gelatin",
      detail: "MMR vaccine is contraindicated due to gelatin content.",
    });
  }

  // Anaphylaxis to egg (MMRVaxPro specific)
  if (state.medicalHistory.anaphylaxisEgg && state.vaccineAdmin.vaccine === "MMRVaxPro") {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_EGG",
      message: "Anaphylaxis to egg",
      detail: "MMRVaxPro is contraindicated. Priorix (egg-free) may be considered.",
    });
  }

  // Severe febrile illness
  if (state.medicalHistory.severeFebrilIllness) {
    alerts.push({
      severity: "caution",
      code: "FEBRILE_ILLNESS",
      message: "Severe febrile illness",
      detail: "Vaccination should be deferred until recovery from acute illness.",
    });
  }

  // Recent blood products
  if (state.medicalHistory.recentBloodProducts) {
    alerts.push({
      severity: "caution",
      code: "RECENT_BLOOD_PRODUCTS",
      message: "Recent blood products received",
      detail: "May need to defer MMR vaccination by 3 months depending on product type.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

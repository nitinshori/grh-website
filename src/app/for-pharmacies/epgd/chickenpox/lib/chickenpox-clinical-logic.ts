// ─── Chickenpox Clinical Logic ───

import type { ChickenpoxConsultationState } from "./chickenpox-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: ChickenpoxConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age check (12 months+)
  if (state.patient.age !== null && state.patient.age < 1) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient under 12 months old",
      detail: "Varicella vaccine is not recommended for infants under 12 months.",
    });
  }

  // Pregnancy contraindication
  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Patient is pregnant",
      detail: "Varicella vaccine is contraindicated in pregnancy. Advise to avoid pregnancy for 1 month after vaccination.",
    });
  }

  // Immunosuppression
  if (state.medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail: "Live attenuated varicella vaccine is contraindicated. Consider alternative approach or refer to specialist.",
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

  // Anaphylaxis to neomycin
  if (state.medicalHistory.anaphylaxisNeomycin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_NEOMYCIN",
      message: "Anaphylaxis to neomycin",
      detail: "Varicella vaccine is contraindicated due to neomycin content.",
    });
  }

  // Anaphylaxis to gelatin
  if (state.medicalHistory.anaphylaxisGelatin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_GELATIN",
      message: "Anaphylaxis to gelatin",
      detail: "Varicella vaccine is contraindicated due to gelatin content.",
    });
  }

  // Active TB
  if (state.medicalHistory.activeTB) {
    alerts.push({
      severity: "caution",
      code: "ACTIVE_TB",
      message: "Active untreated TB",
      detail: "Live vaccine should not be given during active TB. Refer for specialist advice.",
    });
  }

  // Post-vaccination rash with immunosuppressed contact
  if (state.postVaccine.rashDeveloped && state.postVaccine.contactWithImmunosuppressed) {
    alerts.push({
      severity: "red-flag",
      code: "RASH_IMMUNOSUPPRESSED_CONTACT",
      message: "Rash developed and contact with immunosuppressed person",
      detail: "Patient should avoid close contact with immunosuppressed individuals until rash resolves.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

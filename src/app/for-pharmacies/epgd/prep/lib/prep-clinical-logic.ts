// ─── PrEP (HIV Pre-exposure Prophylaxis) Clinical Logic ───

import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { PrEPConsultationState } from "./prep-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: PrEPConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stop: HIV positive
  if (state.contraindications.hivPositive) {
    alerts.push({
      severity: "stop",
      code: "PREP_HIV_POSITIVE",
      message: "Patient is HIV positive",
      detail: "PrEP is not indicated in HIV-positive individuals. Refer to HIV specialist for treatment.",
    });
  }

  // Hard stop: Unknown HIV status
  if (state.contraindications.unknownHivStatus) {
    alerts.push({
      severity: "stop",
      code: "PREP_UNKNOWN_HIV",
      message: "HIV status must be confirmed negative before PrEP",
      detail: "Baseline HIV test confirmed negative (within 4 weeks) is required.",
    });
  }

  // Hard stop: eGFR <60
  if (state.contraindications.eGfrBelow60) {
    alerts.push({
      severity: "stop",
      code: "PREP_EGFR",
      message: "eGFR <60 mL/min/1.73m² is a contraindication",
      detail: "Tenofovir is nephrotoxic. Refer to renal specialist.",
    });
  }

  // Caution: Active Hepatitis B (risk of flare on stopping PrEP)
  if (state.medicalHistory.activeHepatitisB) {
    alerts.push({
      severity: "caution",
      code: "PREP_HBV",
      message: "Active Hepatitis B infection",
      detail: "PrEP may mask HBV replication; risk of flare on stopping. Requires specialist assessment.",
    });
  }

  // Red flag: Bone density issues in prolonged use
  if (state.medicalHistory.boneDensityIssues) {
    alerts.push({
      severity: "red-flag",
      code: "PREP_BONE",
      message: "Bone density concerns",
      detail: "Tenofovir may affect bone density. Monitor regularly during prolonged PrEP.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: PrEPConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: PrEPConsultationState
): DoseRecommendation | null {
  if (hasHardStops(state)) return null;

  if (state.medicineSupply.dosingRegimen === "daily") {
    return {
      medicine: "Emtricitabine/Tenofovir disoproxil",
      dose: "200mg/245mg",
      frequency: "Once daily",
      dosingRegimen: "1 tablet OD (with food)",
      reason: "HIV pre-exposure prophylaxis (daily dosing). Takes 7 days for receptive anal sex protection, 21 days for vaginal protection.",
    };
  }

  if (state.medicineSupply.dosingRegimen === "event-based") {
    return {
      medicine: "Emtricitabine/Tenofovir disoproxil",
      dose: "200mg/245mg",
      frequency: "As needed (event-based dosing)",
      dosingRegimen: "2 tablets 2-24 hours before exposure, 1 tablet 24 hours after, 1 tablet 48 hours after",
      reason: "HIV pre-exposure prophylaxis (on-demand dosing).",
    };
  }

  return null;
}

// ─── Check HIV test timing (must be <4 weeks)
export function checkHivTestTiming(testDate: string): boolean {
  if (!testDate) return false;
  const testDateObj = new Date(testDate);
  const today = new Date();
  const daysAgo = Math.floor((today.getTime() - testDateObj.getTime()) / (1000 * 60 * 60 * 24));
  return daysAgo <= 28; // 4 weeks = 28 days
}

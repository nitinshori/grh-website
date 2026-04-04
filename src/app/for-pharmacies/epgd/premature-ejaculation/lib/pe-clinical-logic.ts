// ─── Premature Ejaculation (Dapoxetine) Clinical Logic ───

import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { PEConsultationState } from "./pe-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: PEConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stop: Not male
  if (!state.patient.maleConfirmed) {
    alerts.push({
      severity: "stop",
      code: "PE_GENDER",
      message: "This PGD is for male patients only",
      detail: "Dapoxetine is not indicated in females.",
    });
  }

  // Hard stop: Age <18 or >64
  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "PE_AGE_MIN",
      message: "Patient must be 18 years or older",
      detail: "Dapoxetine is not recommended in patients under 18.",
    });
  }

  if (state.patient.age !== null && state.patient.age > 64) {
    alerts.push({
      severity: "stop",
      code: "PE_AGE_MAX",
      message: "This PGD is for patients 64 years or younger",
      detail: "Dapoxetine is not recommended in patients over 64.",
    });
  }

  // Hard stop: Cardiac disorder NYHA II-IV
  if (state.medicalHistory.cardiacDisorder) {
    alerts.push({
      severity: "stop",
      code: "PE_CARDIAC",
      message: "Cardiac disorder (NYHA II-IV or significant valvular disease) is a contraindication",
      detail: "Dapoxetine can reduce blood pressure. Refer to cardiologist.",
    });
  }

  // Hard stop: Syncope
  if (state.medicalHistory.syncope) {
    alerts.push({
      severity: "stop",
      code: "PE_SYNCOPE",
      message: "History of syncope is a contraindication",
      detail: "Dapoxetine may cause orthostatic hypotension and syncope.",
    });
  }

  // Hard stop: Severe hepatic impairment
  if (state.medicalHistory.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "PE_LIVER",
      message: "Severe hepatic impairment is a contraindication",
      detail: "Dapoxetine is metabolised hepatically. Contraindicated in severe liver disease.",
    });
  }

  // Hard stop: Uncontrolled epilepsy
  if (state.medicalHistory.uncontrolledEpilepsy) {
    alerts.push({
      severity: "stop",
      code: "PE_EPILEPSY",
      message: "Uncontrolled epilepsy is a contraindication",
      detail: "Dapoxetine may lower seizure threshold. Refer to neurologist.",
    });
  }

  // Hard stop: MAOIs, SSRIs, SNRIs, thioridazine
  if (state.currentMedications.maoisOrSsrisOrSnris) {
    alerts.push({
      severity: "stop",
      code: "PE_MAOI_SSRI",
      message: "Concomitant MAOIs, SSRIs, or SNRIs are contraindications",
      detail: "Significant serotonin interaction risk. Refer to GP.",
    });
  }

  if (state.currentMedications.thioridazine) {
    alerts.push({
      severity: "stop",
      code: "PE_THIORIDAZINE",
      message: "Concomitant thioridazine is a contraindication",
      detail: "Risk of QT prolongation and arrhythmias. Do not supply.",
    });
  }

  // Caution: Orthostatic hypotension test not done
  if (
    state.medicineSupply.dapoxetine30mgSupplied &&
    !state.medicineSupply.understandsOrthostatic
  ) {
    alerts.push({
      severity: "caution",
      code: "PE_ORTHOSTATIC",
      message: "Orthostatic hypotension test should be performed",
      detail:
        "Lying and standing BP must be measured before first dose. Check results are recorded.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: PEConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: PEConsultationState
): DoseRecommendation | null {
  if (!state.patient.maleConfirmed) return null;
  if (state.patient.age === null || state.patient.age < 18) return null;
  if (hasHardStops(state)) return null;

  const dosingRegimen = state.medicineSupply.mayIncreaseTo60mg
    ? "30mg or 60mg PRN (1-3 hours before, max once per 24 hours)"
    : "30mg PRN (1-3 hours before, max once per 24 hours)";

  return {
    medicine: "Dapoxetine",
    dose: "30mg (or 60mg if inadequate response)",
    dosingRegimen,
    frequency: "As needed, 1-3 hours before sexual activity",
    reason: "Premature ejaculation (IELT <2 minutes). PRN dosing.",
  };
}

import type { PeriodDelayConsultationState } from "./period-delay-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: PeriodDelayConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops — absolute contraindications to norethisterone
  if (state.medicalHistory.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY", message: "Patient is or may be pregnant", detail: "Norethisterone is contraindicated in pregnancy. Advise pregnancy test if any doubt." });
  }

  if (state.medicalHistory.activeBreastCancer) {
    alerts.push({ severity: "stop", code: "BREAST_CANCER", message: "Active or recent breast cancer", detail: "Norethisterone is contraindicated. Refer to GP." });
  }

  if (state.medicalHistory.historyOfDVT || state.medicalHistory.historyOfPE) {
    alerts.push({ severity: "stop", code: "VTE_HISTORY", message: "History of DVT or pulmonary embolism", detail: "Norethisterone increases thrombotic risk. Contraindicated with VTE history. Refer to GP." });
  }

  if (state.medicalHistory.historyOfStroke) {
    alerts.push({ severity: "stop", code: "STROKE", message: "History of stroke or TIA", detail: "Norethisterone contraindicated with cerebrovascular disease. Refer to GP." });
  }

  if (state.medicalHistory.severeArterialDisease) {
    alerts.push({ severity: "stop", code: "ARTERIAL", message: "Severe arterial disease", detail: "Norethisterone contraindicated. Refer to GP." });
  }

  if (state.medicalHistory.liverDisease) {
    alerts.push({ severity: "stop", code: "LIVER", message: "Active liver disease or history of liver tumours", detail: "Norethisterone is hepatically metabolised. Contraindicated with significant liver disease. Refer to GP." });
  }

  if (state.medicalHistory.porphyria) {
    alerts.push({ severity: "stop", code: "PORPHYRIA", message: "Acute porphyria", detail: "Norethisterone may precipitate an attack. Contraindicated. Refer to GP." });
  }

  if (state.medicalHistory.abnormalVaginalBleeding) {
    alerts.push({ severity: "stop", code: "VAGINAL_BLEEDING", message: "Undiagnosed vaginal bleeding", detail: "Must be investigated before progestogen use. Refer to GP." });
  }

  if (state.medicalHistory.ageUnder16) {
    alerts.push({ severity: "stop", code: "AGE", message: "Patient under 16 years", detail: "Outside the scope of this PGD. Refer to GP." });
  }

  // Cautions
  if (state.medicalHistory.breastfeeding) {
    alerts.push({ severity: "caution", code: "BREASTFEEDING", message: "Currently breastfeeding", detail: "Norethisterone passes into breast milk in small amounts. Discuss risks and benefits." });
  }

  if (state.medicalHistory.hormonalContraception) {
    alerts.push({ severity: "caution", code: "HORMONAL_CONTRACEPTION", message: "Using hormonal contraception", detail: "Norethisterone is NOT a contraceptive at this dose. If on progesterone-only pill, timing may need adjustment. Combined pill users: period delay may not be needed — can run pill packs back-to-back." });
  }

  if (state.medications.anticoagulants) {
    alerts.push({ severity: "caution", code: "ANTICOAGULANTS", message: "Taking anticoagulants", detail: "Norethisterone may alter anticoagulant effect. Monitor closely or refer." });
  }

  if (state.medications.antiepileptics) {
    alerts.push({ severity: "caution", code: "ANTIEPILEPTICS", message: "Taking antiepileptic medication", detail: "Enzyme-inducing antiepileptics (carbamazepine, phenytoin, phenobarbital) may reduce norethisterone efficacy." });
  }

  if (state.medications.ciclosporin) {
    alerts.push({ severity: "caution", code: "CICLOSPORIN", message: "Taking ciclosporin", detail: "Norethisterone may increase ciclosporin levels. Refer to GP." });
  }

  // Timing caution
  if (state.assessment.daysUntilExpected !== null && state.assessment.daysUntilExpected < 3) {
    alerts.push({ severity: "caution", code: "LATE_START", message: "Fewer than 3 days until expected period", detail: "Norethisterone should ideally be started 3 days before the expected period. May not be effective if started too late." });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: PeriodDelayConsultationState): DoseRecommendation | null {
  if (!state.medicineSelection.confirmed) return null;

  const days = state.medicineSelection.daysToDelay || 17;
  const duration = Math.min(days, 17); // Max 17 days (20 days total supply is absolute max)

  return {
    medicine: "Norethisterone",
    dose: "5mg",
    frequency: "Three times daily",
    duration: `${duration} days (period expected 2-3 days after stopping)`,
    dosingRegimen: `5mg three times daily, starting 3 days before expected period, for up to ${duration} days`,
    reason: "Short-term delay of menstruation",
  };
}

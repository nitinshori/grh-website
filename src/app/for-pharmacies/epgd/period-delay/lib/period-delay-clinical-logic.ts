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

  // ── PGD v002 venous thromboembolism gate ────────────────────────────
  // Any single YES excludes. v001 treated all of these as cautions.
  const mh = state.medicalHistory;

  if (mh.familyVteUnder45) {
    alerts.push({ severity: "stop", code: "FAMILY_VTE", message: "First degree relative with VTE under 45", detail: "Suggests inherited thrombophilia. Excluded under PGD v002. Refer." });
  }

  if (mh.currentSmoker) {
    alerts.push({ severity: "stop", code: "SMOKER", message: "Current smoker", detail: "Excluded under PGD v002, at any amount and any age. Refer." });
  }

  const bmi =
    mh.heightCm && mh.weightKg && mh.heightCm > 0
      ? mh.weightKg / Math.pow(mh.heightCm / 100, 2)
      : null;
  if (bmi !== null && bmi >= 30) {
    alerts.push({
      severity: "stop",
      code: "BMI_30_PLUS",
      message: `BMI ${bmi.toFixed(1)}, which is 30 or above`,
      detail: "Excluded under PGD v002. Refer.",
    });
  }

  if (mh.longJourney) {
    alerts.push({
      severity: "stop",
      code: "LONG_JOURNEY",
      message: "Seated journey of 4 hours or more during, or within 2 weeks of, the course",
      detail:
        "Excluded under PGD v002. This will exclude many holiday requests, which is the intended effect. Offer the alternatives in Appendix 2 of the PGD rather than a flat refusal: a woman on a monophasic combined pill can run packs back to back, and her GP can assess her individually.",
    });
  }

  if (mh.recentOrPlannedSurgery) {
    alerts.push({ severity: "stop", code: "SURGERY", message: "Surgery under general anaesthetic within 6 weeks, or planned", detail: "Excluded under PGD v002. Refer." });
  }

  if (mh.immobility) {
    alerts.push({ severity: "stop", code: "IMMOBILITY", message: "Current or expected immobility", detail: "Excluded under PGD v002. Refer." });
  }

  if (mh.activeOrRecentCancer) {
    alerts.push({ severity: "stop", code: "CANCER", message: "Active cancer, or cancer treated within 12 months", detail: "Excluded under PGD v002. Refer." });
  }

  if (mh.migraineWithAura) {
    alerts.push({ severity: "stop", code: "MIGRAINE_AURA", message: "Migraine with aura or focal neurological symptoms", detail: "Excluded under PGD v002, current or past. Refer." });
  }

  if (mh.enzymeInducer) {
    alerts.push({
      severity: "stop",
      code: "ENZYME_INDUCER",
      message: "Taking an enzyme inducing medicine",
      detail:
        "Rifampicin, rifabutin, carbamazepine, phenytoin, phenobarbital, primidone, topiramate, efavirenz, ritonavir or St John's wort. These reduce norethisterone efficacy and the delay is likely to fail. Excluded under PGD v002.",
    });
  }

  // 16 and 17 year olds: v001 lowered the age from 18 to 16 and added no
  // competence or safeguarding content at all.
  const age = state.patient.age;
  if (age !== null && age >= 16 && age < 18) {
    if (mh.safeguardingConcern) {
      alerts.push({
        severity: "stop",
        code: "SAFEGUARDING_CONCERN",
        message: "Safeguarding concern recorded in a patient under 18",
        detail: "Do not supply. Follow the local safeguarding route today and record what was done.",
      });
    } else if (!mh.under18AssessmentDone) {
      alerts.push({
        severity: "stop",
        code: "UNDER18_ASSESSMENT_REQUIRED",
        message: "Competence and safeguarding assessment required",
        detail:
          "Every supply to a patient aged 16 or 17 requires a recorded competence assessment and a recorded safeguarding consideration, including who suggested the delay and why. Complete it before proceeding.",
      });
    }
  }

  if (state.medicalHistory.ageUnder16) {
    alerts.push({ severity: "stop", code: "AGE", message: "Patient under 16 years", detail: "Outside the scope of this PGD. Refer to GP." });
  }

  // Cautions
  if (state.medicalHistory.breastfeeding) {
    alerts.push({ severity: "stop", code: "BREASTFEEDING", message: "Currently breastfeeding", detail: "Excluded under PGD v002. Refer." });
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

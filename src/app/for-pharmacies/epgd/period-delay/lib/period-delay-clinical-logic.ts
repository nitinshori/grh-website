import type { PeriodDelayConsultationState } from "./period-delay-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Aligned to the Period Delay (Norethisterone) PGD, version 008, issued
// 11 September 2026. Maximum 14 days, maximum 42 tablets, VTE risk factors
// are exclusions, twice in 6 months and 30 days in 6 months are limits.

export const MAX_TREATMENT_DAYS = 14;
export const MAX_TABLETS = 42;
export const MAX_DAYS_IN_6_MONTHS = 30;

export function calculateBmi(heightCm: number | null, weightKg: number | null): number | null {
  return heightCm && weightKg && heightCm > 0 ? weightKg / Math.pow(heightCm / 100, 2) : null;
}

/** PGD v008: pregnancy can be excluded on history where the last period was
 *  normal, on time, and there has been no unprotected sex since. Otherwise a
 *  negative test taken no earlier than 21 days after the last unprotected sex. */
export function isPregnancyExcluded(state: PeriodDelayConsultationState): boolean {
  const a = state.assessment;
  if (a.lastPeriodNormalOnTime && a.noUnprotectedSexSince) return true;
  return a.pregnancyTestNegative && a.pregnancyTestDate.trim() !== "";
}

export function getAllAlerts(state: PeriodDelayConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const mh = state.medicalHistory;
  const step = state.currentStep;

  // Hard stops: SPC contraindications and PGD v008 exclusions
  if (mh.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY", message: "Known or suspected pregnancy, or pregnancy cannot be excluded", detail: "Norethisterone is contraindicated in pregnancy. Excluded. Refer." });
  }

  // Pregnancy exclusion is asked on the Assessment step; only raise once it has been reached.
  if (step >= 2 && !mh.pregnancy && !isPregnancyExcluded(state)) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY_NOT_EXCLUDED",
      message: "Pregnancy has not been excluded",
      detail:
        "Do not supply until pregnancy has been excluded: last period normal and on time with no unprotected sex since, or a negative pregnancy test taken no earlier than 21 days after the last unprotected sex. Record the date and result.",
    });
  }

  if (mh.activeBreastCancer) {
    alerts.push({ severity: "stop", code: "BREAST_CANCER", message: "Hormone sensitive cancer, including breast cancer, current or past", detail: "Excluded. Refer to GP." });
  }

  if (mh.brcaCarrier) {
    alerts.push({ severity: "stop", code: "BRCA", message: "Known BRCA1 or BRCA2 carrier status", detail: "Excluded under PGD v008. Refer." });
  }

  if (mh.historyOfDVT || mh.historyOfPE) {
    alerts.push({ severity: "stop", code: "VTE_HISTORY", message: "Personal history of venous thromboembolism, DVT or pulmonary embolism", detail: "Norethisterone increases thrombotic risk. Excluded. Refer to GP." });
  }

  if (mh.historyOfStroke) {
    alerts.push({ severity: "stop", code: "STROKE", message: "History of stroke or transient ischaemic attack", detail: "Excluded. Refer to GP." });
  }

  if (mh.severeArterialDisease) {
    alerts.push({ severity: "stop", code: "ARTERIAL", message: "Myocardial infarction or any arterial disease", detail: "Excluded. Refer to GP." });
  }

  if (mh.liverDisease || mh.jaundiceInPregnancy) {
    alerts.push({ severity: "stop", code: "LIVER", message: "Liver dysfunction, active liver disease, jaundice in pregnancy, or a liver tumour", detail: "Excluded. Refer to GP." });
  }

  if (mh.porphyria || mh.severePruritusInPregnancy) {
    alerts.push({ severity: "stop", code: "PORPHYRIA", message: "Acute porphyria, or severe pruritus in a previous pregnancy", detail: "Excluded. Refer to GP." });
  }

  if (mh.abnormalVaginalBleeding) {
    alerts.push({ severity: "stop", code: "VAGINAL_BLEEDING", message: "Undiagnosed vaginal bleeding, bleeding between periods, or bleeding after sex", detail: "Refer; this needs a diagnosis, not a delay." });
  }

  if (mh.hypersensitivity) {
    alerts.push({ severity: "stop", code: "HYPERSENSITIVITY", message: "Hypersensitivity to norethisterone or to any excipient", detail: "Excluded. Refer." });
  }

  // ── Venous thromboembolism gate, Appendix 1: any single YES excludes ──
  if (mh.familyVteUnder45) {
    alerts.push({ severity: "stop", code: "FAMILY_VTE", message: "Known thrombophilia, or first degree relative with VTE under 45", detail: "Excluded under PGD v008. Refer." });
  }

  if (mh.currentSmoker) {
    alerts.push({
      severity: "stop",
      code: "SMOKER",
      message: "Currently smokes, any amount, any age",
      detail:
        "PGD v008 excludes all current smokers, because this is a lifestyle supply and the risk is avoidable. Refer.",
    });
  }

  if (mh.stoppedSmokingUnderOneYear) {
    alerts.push({
      severity: "stop",
      code: "QUIT_UNDER_1YR",
      message: "Stopped smoking less than a year ago, any age",
      detail: "Excluded under PGD v008. Refer.",
    });
  }

  const bmi = calculateBmi(mh.heightCm, mh.weightKg);
  if (bmi !== null && bmi >= 30) {
    alerts.push({
      severity: "stop",
      code: "BMI_30_PLUS",
      message: `BMI ${bmi.toFixed(1)}, which is 30 or above`,
      detail: "PGD v008 excludes from BMI 30. Measure or ask for height and weight; do not estimate. Refer.",
    });
  }

  if (mh.longJourney) {
    alerts.push({
      severity: "stop",
      code: "LONG_JOURNEY",
      message: "Flight, coach, train or car journey of 4 hours or more during the course, or within 2 weeks of finishing it",
      detail:
        "Excluded under PGD v008. This will exclude many holiday requests; that is intended. Give the alternatives in Appendix 2: monophasic combined pill packs run back to back, menstrual cups or period underwear, tranexamic acid or an NSAID for the bleeding, and the GP can assess individually.",
    });
  }

  if (mh.recentOrPlannedSurgery) {
    alerts.push({ severity: "stop", code: "SURGERY", message: "Surgery under general anaesthetic within the last 6 weeks, or planned during or within 2 weeks of the course", detail: "Excluded. Refer." });
  }

  if (mh.immobility) {
    alerts.push({ severity: "stop", code: "IMMOBILITY", message: "Current or expected period of immobility", detail: "Excluded. Refer." });
  }

  if (mh.activeOrRecentCancer) {
    alerts.push({ severity: "stop", code: "CANCER", message: "Active cancer, or cancer treated within the last 12 months", detail: "Excluded. Refer." });
  }

  // ── Aged 40 or over is the one UKMEC 2 factor this PGD does not exclude ──
  const patientAge = state.patient.age;
  const riskFactors: string[] = [];
  if (patientAge !== null && patientAge >= 40) riskFactors.push("aged 40 or over");
  if (patientAge !== null && patientAge >= 35 && mh.stoppedSmokingOverOneYear)
    riskFactors.push("aged 35 or over, stopped smoking a year or more ago");

  if (riskFactors.length === 1) {
    alerts.push({
      severity: "caution",
      code: "UKMEC2_SINGLE",
      message: `One UKMEC 2 risk factor: ${riskFactors[0]}`,
      detail:
        "On its own this does not exclude. Supply, and counsel on the precautions: move around at least hourly on any journey, keep well hydrated, avoid alcohol and sedatives on the journey, and consider graduated compression stockings. Seek urgent help for a painful swollen calf, sudden breathlessness or chest pain. Record the risk factor, not only the conclusion.",
    });
  } else if (riskFactors.length >= 2) {
    alerts.push({
      severity: "stop",
      code: "UKMEC2_CUMULATIVE",
      message: `${riskFactors.length} UKMEC 2 risk factors together: ${riskFactors.join(", ")}`,
      detail:
        "UKMEC 2025 states that where multiple category 2 conditions relate to the same risk, clinical judgement must decide whether the risks outweigh the benefits. Exclude and refer. Record which factors were present.",
    });
  }

  // ── Other exclusions ──
  if (mh.migraineWithAura) {
    alerts.push({ severity: "stop", code: "MIGRAINE_AURA", message: "Migraine with aura, or any migraine with focal neurological symptoms, current or past", detail: "Excluded. Refer." });
  }

  if (mh.diabetesWithVascularComplications) {
    alerts.push({ severity: "stop", code: "DIABETES_VASCULAR", message: "Diabetes with vascular complications", detail: "Excluded under PGD v008. Refer." });
  }

  const bpHigh =
    (mh.systolicBP !== null && mh.systolicBP >= 140) || (mh.diastolicBP !== null && mh.diastolicBP >= 90);
  if (mh.hypertension || bpHigh) {
    alerts.push({
      severity: "stop",
      code: "HYPERTENSION",
      message: mh.hypertension
        ? "Hypertension of any grade, treated or untreated, or a history of hypertension in pregnancy"
        : `Blood pressure ${mh.systolicBP ?? "?"}/${mh.diastolicBP ?? "?"} measured today, 140/90 or above`,
      detail: "Excluded under PGD v008. Refer.",
    });
  }

  if (mh.atrialFibrillationOrValvularDisease) {
    alerts.push({ severity: "stop", code: "AF_VALVULAR", message: "Atrial fibrillation, or valvular or congenital heart disease", detail: "Excluded under PGD v008. Refer." });
  }

  if (mh.sleOrAntiphospholipid) {
    alerts.push({ severity: "stop", code: "SLE_APS", message: "Systemic lupus erythematosus, antiphospholipid antibodies or antiphospholipid syndrome", detail: "Excluded under PGD v008. Refer." });
  }

  if (mh.dyslipidaemiaWithRiskFactor) {
    alerts.push({
      severity: "stop",
      code: "DYSLIPIDAEMIA",
      message: "Dyslipidaemia together with another cardiovascular risk factor",
      detail: "Obesity below the BMI threshold, diabetes, hypertension or family history. Excluded under PGD v008. Refer.",
    });
  }

  if (mh.enzymeInducer) {
    alerts.push({
      severity: "stop",
      code: "ENZYME_INDUCER",
      message: "Taking an enzyme inducing medicine",
      detail:
        "Rifampicin, rifabutin, carbamazepine, phenytoin, phenobarbital, primidone, topiramate, efavirenz, ritonavir or St John's wort. These reduce norethisterone efficacy and the delay is likely to fail. Excluded.",
    });
  }

  if (mh.ciclosporin || state.medications.ciclosporin) {
    alerts.push({ severity: "stop", code: "CICLOSPORIN", message: "Taking ciclosporin", detail: "Excluded under PGD v008. Refer." });
  }

  if (mh.lamotrigineMonotherapy) {
    alerts.push({ severity: "stop", code: "LAMOTRIGINE", message: "Taking lamotrigine as monotherapy", detail: "Excluded under PGD v008. Refer." });
  }

  if (mh.severeDepressionOrSuicidalIdeation) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_DEPRESSION",
      message: "Current severe depression or active suicidal ideation",
      detail: "Exclude and refer. This is a clinical judgement, not a tick box; record the reason.",
    });
  }

  // 16 and 17 year olds: recorded competence and safeguarding assessment.
  // The assessment is on the Medical History step; raise the stop only once
  // that step has been reached so a 17 year old can get there.
  const age = state.patient.age;
  if (age !== null && age >= 16 && age < 18) {
    if (mh.safeguardingConcern) {
      alerts.push({
        severity: "stop",
        code: "SAFEGUARDING_CONCERN",
        message: "Safeguarding concern recorded in a patient under 18",
        detail: "Do not supply. Follow the local safeguarding route today and record what was done.",
      });
    } else if (step >= 3 && (!mh.under18AssessmentDone || mh.under18AssessmentNotes.trim() === "")) {
      alerts.push({
        severity: "stop",
        code: "UNDER18_ASSESSMENT_REQUIRED",
        message: "Competence and safeguarding assessment required, and recorded in full",
        detail:
          "Every supply to a patient aged 16 or 17 requires a recorded competence assessment and a recorded safeguarding consideration, including who suggested the delay and why. Record the assessment, not just its conclusion.",
      });
    }
  }

  if (mh.ageUnder16 || (age !== null && age < 16)) {
    alerts.push({ severity: "stop", code: "AGE", message: "Patient under 16 years", detail: "Outside the scope of this PGD. Refer to GP." });
  }

  if (!mh.femaleConfirmed) {
    alerts.push({ severity: "stop", code: "MALE", message: "Patient not confirmed as female", detail: "This PGD covers women only. Male is an exclusion." });
  }

  if (mh.breastfeeding) {
    alerts.push({ severity: "stop", code: "BREASTFEEDING", message: "Breastfeeding", detail: "Excluded. Norethisterone passes into breast milk. Refer." });
  }

  if (mh.hormonalContraception) {
    alerts.push({
      severity: "stop",
      code: "HORMONAL_CONTRACEPTION",
      message: "Using hormonal contraception",
      detail:
        "Inclusion requires that the patient is not using hormonal contraception. Monophasic combined pill: run packs back to back for up to 3 consecutive packs, which is safer and free. Everyday combined preparation: skip the placebo tablets. Progestogen-only pill, implant or injection: cannot reliably delay a period; refer.",
    });
  }

  // Cycle and timing (Assessment step)
  if (step >= 2 && !state.assessment.cycleRegular) {
    alerts.push({ severity: "stop", code: "IRREGULAR_CYCLE", message: "Irregular or unpredictable menstrual cycle", detail: "Inclusion requires a regular, predictable cycle so that the start date can be calculated. Excluded. Refer." });
  }

  if (state.assessment.daysUntilExpected !== null && state.assessment.daysUntilExpected <= 3) {
    alerts.push({
      severity: "stop",
      code: "TOO_LATE_TO_START",
      message: "Expected period is not more than 3 days away",
      detail:
        "Inclusion requires that the expected date of the next period is known and is more than 3 days away, because norethisterone must start 3 days before it. Excluded on this occasion.",
    });
  }

  // Repeat supply limits
  if (state.assessment.previousSuppliesLast6Months === "2+") {
    alerts.push({
      severity: "stop",
      code: "REPEAT_SUPPLY",
      message: "Already supplied norethisterone for period delay twice in the last 6 months",
      detail: "Refer; repeated requests need review. No patient may be supplied more than twice in 6 months under this PGD.",
    });
  }

  const priorDays = state.assessment.daysSuppliedLast6Months ?? 0;
  const thisCourse = state.medicineSelection.daysToDelay ?? 0;
  if (priorDays + thisCourse > MAX_DAYS_IN_6_MONTHS) {
    alerts.push({
      severity: "stop",
      code: "THIRTY_DAYS_IN_6_MONTHS",
      message: `Total treatment would be ${priorDays + thisCourse} days in 6 months`,
      detail: "Total norethisterone for period delay must not exceed 30 days in any 6 month period. Refer.",
    });
  }

  // Cautions
  if (mh.historyOfDepression) {
    alerts.push({
      severity: "caution",
      code: "DEPRESSION_HISTORY",
      message: "History of depression",
      detail:
        "NOT an exclusion. Tell her in plain terms: if your mood drops noticeably, stop taking it and speak to us or your GP. Record that you did.",
    });
  }

  if (state.medications.anticoagulants) {
    alerts.push({ severity: "caution", code: "ANTICOAGULANTS", message: "Taking anticoagulants", detail: "Ask why: a personal history of VTE or a thrombophilia excludes. Otherwise consider risks and benefits carefully, or refer." });
  }

  if (state.medications.antiepileptics) {
    alerts.push({ severity: "caution", code: "ANTIEPILEPTICS", message: "Taking antiepileptic medication", detail: "Carbamazepine, phenytoin, phenobarbital, primidone and topiramate are enzyme inducers and exclude; lamotrigine monotherapy excludes. Fluid retention may aggravate epilepsy." });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: PeriodDelayConsultationState): DoseRecommendation | null {
  if (!state.medicineSelection.confirmed) return null;

  const days = Math.min(state.medicineSelection.daysToDelay || MAX_TREATMENT_DAYS, MAX_TREATMENT_DAYS);
  const tablets = days * 3;

  return {
    medicine: "Norethisterone 5mg tablets",
    dose: "5mg",
    frequency: "Three times daily",
    duration: `${days} days, ${tablets} tablets (period expected 2 to 3 days after stopping)`,
    dosingRegimen: `One 5mg tablet three times daily, starting 3 days before the expected period, for ${days} days (${tablets} tablets). Maximum 14 days, 42 tablets.`,
    reason: "Short-term delay of menstruation, PGD v008",
  };
}

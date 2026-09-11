import type { PeriodDelayConsultationState } from "./period-delay-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Aligned to the Period Delay (Norethisterone) PGD, version 009, issued
// 11 September 2026. Maximum 14 days, maximum 42 tablets, VTE risk factors
// are exclusions, twice in 6 months and 30 days in 6 months are limits.

export const MAX_TREATMENT_DAYS = 14;
export const MAX_TABLETS = 42;
export const MAX_DAYS_IN_6_MONTHS = 30;

/**
 * Parse DD/MM/YYYY. Returns null on anything else, including 31/02/2026,
 * because Date() would silently roll that forward to 3 March.
 */
export function parseUkDate(v: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((v || "").trim());
  if (!m) return null;
  const [dd, mm, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

export function formatUkDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Whole days from today to `d`, negative if it is in the past. */
export function daysFromToday(d: Date): number {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return Math.round((x.getTime() - t.getTime()) / 86400000);
}

/** Whole days between two UK dates (b minus a), or null if either is invalid. */
export function daysBetweenUk(a: string, b: string): number | null {
  const da = parseUkDate(a);
  const db = parseUkDate(b);
  if (!da || !db) return null;
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function calculateBmi(heightCm: number | null, weightKg: number | null): number | null {
  return heightCm && weightKg && heightCm > 0 ? weightKg / Math.pow(heightCm / 100, 2) : null;
}

/** PGD v009: pregnancy can be excluded on history where the last period was
 *  normal, on time, and there has been no unprotected sex since. Otherwise a
 *  negative test taken no earlier than 21 days after the last unprotected sex. */
export function isPregnancyExcluded(state: PeriodDelayConsultationState): boolean | "unanswered" {
  const a = state.assessment;
  if (a.lastPeriodNormalOnTime === null || a.noUnprotectedSexSince === null) return "unanswered";
  if (a.lastPeriodNormalOnTime === true && a.noUnprotectedSexSince === true) return true;
  // Pregnancy cannot be excluded on history. The test question is a Yes/No
  // with no default: a blank is "unanswered" (the validator asks), only an
  // explicit No, or a test taken too early, is adverse (stop audit, 11
  // September 2026).
  if (a.pregnancyTestNegative === null) return "unanswered";
  if (a.pregnancyTestNegative === false) return false;
  // The test must be a real date, no earlier than 21 days after the last
  // unprotected sex, and not in the future. Missing or unparseable dates are
  // validation matters; a future date is corrected, not a stop.
  const test = parseUkDate(a.pregnancyTestDate);
  if (!test || daysFromToday(test) > 0) return "unanswered";
  const interval = daysBetweenUk(a.lastUpsiDate, a.pregnancyTestDate);
  if (interval === null) return "unanswered";
  return interval >= 21;
}

/** Why pregnancy is not yet excluded, for the validator. */
export function getPregnancyExclusionError(state: PeriodDelayConsultationState): string | null {
  const a = state.assessment;
  if (a.lastPeriodNormalOnTime === null) return "Answer \"Last period was normal for her and on time\" (Yes or No)";
  if (a.noUnprotectedSexSince === null) return "Answer \"No unprotected sex or contraceptive failure since that period\" (Yes or No)";
  if (a.lastPeriodNormalOnTime && a.noUnprotectedSexSince) return null;
  if (a.pregnancyTestNegative === null) return "Pregnancy cannot be excluded on history. Answer \"Pregnancy test negative, taken no earlier than 21 days after the last unprotected sex\" (Yes or No)";
  if (a.pregnancyTestNegative === false) return "No negative pregnancy test: pregnancy has not been excluded. Do not supply; save as not supplied";
  if (!parseUkDate(a.lastUpsiDate)) return "Enter the date of the last unprotected sex as DD/MM/YYYY";
  const test = parseUkDate(a.pregnancyTestDate);
  if (!test) return "Enter the date of the pregnancy test as DD/MM/YYYY";
  if (daysFromToday(test) > 0) return "The pregnancy test date is in the future";
  const interval = daysBetweenUk(a.lastUpsiDate, a.pregnancyTestDate);
  if (interval === null || interval < 21) return `The test was taken ${interval === null ? "an unknown number of" : interval} days after the last unprotected sex; it must be at least 21 days after. Do not supply`;
  return null;
}

export function getAllAlerts(state: PeriodDelayConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const mh = state.medicalHistory;
  const step = state.currentStep;

  // Hard stops: SPC contraindications and PGD v009 exclusions
  if (mh.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY", message: "Known or suspected pregnancy, or pregnancy cannot be excluded", detail: "Norethisterone is contraindicated in pregnancy. Excluded. Refer." });
  }

  // Pregnancy exclusion is asked on the Assessment step; raise only once both
  // history questions have been answered, so an unasked question is not a stop.
  if (step >= 2 && !mh.pregnancy && isPregnancyExcluded(state) === false) {
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
    alerts.push({ severity: "stop", code: "BRCA", message: "Known BRCA1 or BRCA2 carrier status", detail: "Excluded under PGD v009. Refer." });
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
    alerts.push({ severity: "stop", code: "FAMILY_VTE", message: "Known thrombophilia, or first degree relative with VTE under 45", detail: "Excluded under PGD v009. Refer." });
  }

  if (mh.currentSmoker) {
    alerts.push({
      severity: "stop",
      code: "SMOKER",
      message: "Currently smokes, any amount, any age",
      detail:
        "PGD v009 excludes all current smokers, because this is a lifestyle supply and the risk is avoidable. Refer.",
    });
  }

  if (mh.stoppedSmokingUnderOneYear) {
    alerts.push({
      severity: "stop",
      code: "QUIT_UNDER_1YR",
      message: "Stopped smoking less than a year ago, any age",
      detail: "Excluded under PGD v009. Refer.",
    });
  }

  const bmi = calculateBmi(mh.heightCm, mh.weightKg);
  if (bmi !== null && bmi >= 30) {
    alerts.push({
      severity: "stop",
      code: "BMI_30_PLUS",
      message: `BMI ${bmi.toFixed(1)}, which is 30 or above`,
      detail: "PGD v009 excludes from BMI 30. Measure or ask for height and weight; do not estimate. Refer.",
    });
  }

  if (mh.longJourney) {
    alerts.push({
      severity: "stop",
      code: "LONG_JOURNEY",
      message: "Flight, coach, train or car journey of 4 hours or more during the course, or within 2 weeks of finishing it",
      detail:
        "Excluded under PGD v009. This will exclude many holiday requests; that is intended. Give the alternatives in Appendix 2: monophasic combined pill packs run back to back, menstrual cups or period underwear, tranexamic acid or an NSAID for the bleeding, and the GP can assess individually.",
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
    // Not an exclusion in PGD v009 (neither age 40 plus nor a long-quit
    // ex-smoker is listed): a caution for the pharmacist's judgement.
    alerts.push({
      severity: "caution",
      code: "UKMEC2_CUMULATIVE",
      message: `${riskFactors.length} UKMEC 2 risk factors together: ${riskFactors.join(", ")}`,
      detail:
        "UKMEC 2025 states that where multiple category 2 conditions relate to the same risk, clinical judgement must decide whether the risks outweigh the benefits. Not an exclusion in the PGD. Use judgement, counsel on the VTE precautions, and record which factors were present and the decision.",
    });
  }

  // ── Other exclusions ──
  if (mh.migraineWithAura) {
    alerts.push({ severity: "stop", code: "MIGRAINE_AURA", message: "Migraine with aura, or any migraine with focal neurological symptoms, current or past", detail: "Excluded. Refer." });
  }

  if (mh.diabetesWithVascularComplications) {
    alerts.push({ severity: "stop", code: "DIABETES_VASCULAR", message: "Diabetes with vascular complications", detail: "Excluded under PGD v009. Refer." });
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
      detail: "Excluded under PGD v009. Refer.",
    });
  }

  if (mh.atrialFibrillationOrValvularDisease) {
    alerts.push({ severity: "stop", code: "AF_VALVULAR", message: "Atrial fibrillation, or valvular or congenital heart disease", detail: "Excluded under PGD v009. Refer." });
  }

  if (mh.sleOrAntiphospholipid) {
    alerts.push({ severity: "stop", code: "SLE_APS", message: "Systemic lupus erythematosus, antiphospholipid antibodies or antiphospholipid syndrome", detail: "Excluded under PGD v009. Refer." });
  }

  if (mh.dyslipidaemiaWithRiskFactor) {
    alerts.push({
      severity: "stop",
      code: "DYSLIPIDAEMIA",
      message: "Dyslipidaemia together with another cardiovascular risk factor",
      detail: "Obesity below the BMI threshold, diabetes, hypertension or family history. Excluded under PGD v009. Refer.",
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
    alerts.push({ severity: "stop", code: "CICLOSPORIN", message: "Taking ciclosporin", detail: "Excluded under PGD v009. Refer." });
  }

  if (mh.lamotrigineMonotherapy) {
    alerts.push({ severity: "stop", code: "LAMOTRIGINE", message: "Taking lamotrigine as monotherapy", detail: "Excluded under PGD v009. Refer." });
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
    }
    // The competence and safeguarding record itself is required by the
    // Medical History step validator (Next stays off until it is done). It is
    // not an exclusion, so it is not raised as a stop.
  }

  if (mh.ageUnder16 || (age !== null && age < 16)) {
    alerts.push({ severity: "stop", code: "AGE", message: "Patient under 16 years", detail: "Outside the scope of this PGD. Refer to GP." });
  }

  // Raised only on an explicit "No" to "Patient is female". An unanswered
  // question is a validation message, never a stop.
  if (mh.femaleConfirmed === false) {
    alerts.push({ severity: "stop", code: "MALE", message: "Patient is not female", detail: "This PGD covers women only. Save as not supplied and refer." });
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
  if (state.assessment.cycleRegular === false) {
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
    reason: "Short-term delay of menstruation, PGD v009",
  };
}

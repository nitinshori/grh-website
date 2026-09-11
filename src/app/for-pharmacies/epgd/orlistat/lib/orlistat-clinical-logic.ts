import type { OrlistatConsultationState } from "./orlistat-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// PGD v004: review at 12 weeks from the start of treatment; continue only if
// at least 5% of body weight has been lost from baseline.
export const ORLISTAT_REVIEW_WEEKS = 12;
export const ORLISTAT_MIN_LOSS_PERCENT = 5;

export function weeksSinceStart(startIso: string): number | null {
  if (!startIso) return null;
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return null;
  return Math.floor((Date.now() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function weightLossPercent(baseline: number | null, current: number | null): number | null {
  if (!baseline || !current || baseline <= 0) return null;
  return Math.round(((baseline - current) / baseline) * 1000) / 10;
}

/** BMI used for the inclusion test: baseline BMI on a continuation, today's BMI otherwise. */
export function bmiForInclusion(state: OrlistatConsultationState): number | null {
  const w = state.weightAssessment;
  if (w.visitType === "continuation" && w.baselineWeight !== null && w.height) {
    return Math.round((w.baselineWeight / Math.pow(w.height / 100, 2)) * 10) / 10;
  }
  return w.bmi;
}

export const COMORBIDITY_LABELS: Record<string, string> = {
  type2diabetes: "Type 2 diabetes",
  hypertension: "Hypertension",
  dyslipidaemia: "Dyslipidaemia",
  cvd: "Cardiovascular disease",
};

export function getAllAlerts(state: OrlistatConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Inclusion BMI. A stop rather than a bare validation error, so a patient
  // who does not meet the threshold can be saved as "not supplied" with the
  // advice given, as the PGD records row requires (walkthrough review,
  // 11 Sep 2026). BMI 28 to 29.9 stops only on the answer "No" to the
  // comorbidity question; a blank answer is held by the Weight Assessment
  // validator (stop audit, 11 Sep 2026).
  const inclusionBmi = bmiForInclusion(state);
  if (inclusionBmi !== null) {
    const prefix = state.weightAssessment.visitType === "continuation" ? "Baseline BMI" : "BMI";
    const noComorbidity = state.weightAssessment.hasComorbidity === "no";
    if (inclusionBmi < 28) {
      alerts.push({
        severity: "stop",
        code: "BMI_BELOW_28",
        message: `${prefix} ${inclusionBmi} is below the inclusion threshold`,
        detail: "Inclusion: BMI 30 or more, or BMI 28 or more with at least one obesity-related comorbidity. Not eligible under this PGD. Advise on alternatives and refer to the GP or NHS weight management as appropriate.",
      });
    } else if (inclusionBmi < 30 && noComorbidity) {
      alerts.push({
        severity: "stop",
        code: "BMI_28_NO_COMORBIDITY",
        message: `${prefix} ${inclusionBmi} is between 28 and 29.9 and the patient has no weight-related comorbidity`,
        detail: "Eligible only with an obesity-related comorbidity, and the patient has none, so is not eligible under this PGD. Advise on alternatives and refer to the GP or NHS weight management as appropriate.",
      });
    }
  }

  // 12 week review on a continuation visit: less than 5% lost from baseline
  // means discontinue and refer, not another 84 capsules.
  if (state.weightAssessment.visitType === "continuation") {
    const weeks = weeksSinceStart(state.weightAssessment.treatmentStartDate);
    const loss = weightLossPercent(state.weightAssessment.baselineWeight, state.weightAssessment.weight);
    // Fires only on a recorded loss below 5%. A missing baseline or today's
    // weight is held by the Weight Assessment validator, never a stop
    // (stop audit, 11 Sep 2026).
    if (weeks !== null && weeks >= ORLISTAT_REVIEW_WEEKS && loss !== null && loss < ORLISTAT_MIN_LOSS_PERCENT) {
      alerts.push({
        severity: "stop",
        code: "REVIEW_12_WEEKS",
        message: `12 week review: ${loss}% body weight lost (target at least ${ORLISTAT_MIN_LOSS_PERCENT}%)`,
        detail:
          "PGD maximum treatment period: continue only if the patient has achieved at least a 5% reduction in body weight from baseline at 12 weeks. Discontinue orlistat and refer to the GP. Do not supply.",
      });
    }
  }

  if (state.medicalHistory.cholestasis) {
    alerts.push({
      severity: "stop",
      code: "CHOLESTASIS",
      message: "Cholestasis or severe hepatic impairment",
      detail: "Exclusion under this PGD. Do not supply.",
    });
  }

  if (state.medicalHistory.chronicMalabsorption) {
    alerts.push({
      severity: "stop",
      code: "MALABSORPTION",
      message: "Chronic malabsorption syndrome",
      detail: "Exclusion under this PGD (e.g. cystic fibrosis, coeliac disease, inflammatory bowel disease). Do not supply.",
    });
  }

  if (state.medicalHistory.hypersensitivityToOrlistat) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY",
      message: "Known hypersensitivity to orlistat or any component of the formulation",
      detail: "Exclusion under this PGD. Do not supply.",
    });
  }

  if (state.medicalHistory.uncontrolledOrNewDiabetes) {
    alerts.push({
      severity: "stop",
      code: "UNCONTROLLED_DIABETES",
      message: "Uncontrolled or newly diagnosed diabetes",
      detail: "Exclusion under this PGD. Requires GP review before starting orlistat. Do not supply; refer to GP.",
    });
  }

  if (state.medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANT",
      message: "Currently pregnant",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "BREASTFEEDING",
      message: "Currently breastfeeding",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medications.takesWarfarin) {
    alerts.push({
      severity: "stop",
      code: "WARFARIN",
      message: "Warfarin therapy",
      detail: "Exclusion under this PGD: relative contraindication, requires specialist assessment. Do not supply; refer to GP.",
    });
  }

  if (state.medications.takesOtherAnticoagulant) {
    alerts.push({
      severity: "caution",
      code: "ANTICOAGULANT",
      message: "Anticoagulant therapy (edoxaban, dabigatran, rivaroxaban)",
      detail: "Enhanced anticoagulant effect; requires GP liaison and INR monitoring if applicable.",
    });
  }

  if (state.weightAssessment.comorbidities.includes("type2diabetes")) {
    alerts.push({
      severity: "caution",
      code: "DIABETES",
      message: "Diabetes mellitus",
      detail: "Blood glucose control may improve; dose of antidiabetic medication (especially insulin and sulfonylureas) may require adjustment. Inform the GP.",
    });
  }

  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "caution",
      code: "GALLBLADDER",
      message: "Gallstone disease",
      detail: "Monitor for interactions and symptoms.",
    });
  }

  if (state.medications.takesBileAcidSequestrants) {
    alerts.push({
      severity: "caution",
      code: "BILE_ACID_SEQUESTRANT",
      message: "Taking a bile acid sequestrant",
      detail: "Monitor for interactions and symptoms.",
    });
  }

  if (state.medicalHistory.oxalateKidneyStones) {
    alerts.push({
      severity: "caution",
      code: "OXALATE_STONES",
      message: "History of oxalate kidney stones",
      detail: "Risk of hyperoxaluria and recurrence.",
    });
  }

  if (state.medicalHistory.chronicLiverDisease) {
    alerts.push({
      severity: "caution",
      code: "LIVER_DISEASE",
      message: "Chronic liver disease or elevated liver function tests",
      detail: "Proceed with caution; ensure baseline LFTs checked.",
    });
  }

  if (state.medications.takesLevothyroxine) {
    alerts.push({
      severity: "caution",
      code: "LEVOTHYROXINE",
      message: "Hypothyroidism: taking levothyroxine",
      detail: "Levothyroxine absorption may be reduced; monitor thyroid function and dose. Administer levothyroxine at least 4 hours before orlistat.",
    });
  }

  // PGD v004: concurrent ciclosporin therapy is an exclusion, not a caution.
  if (state.medications.takesCiclosporin) {
    alerts.push({
      severity: "stop",
      code: "CICLOSPORIN",
      message: "Concurrent ciclosporin therapy",
      detail: "Exclusion under this PGD (reduced absorption of ciclosporin). Do not supply; refer to GP.",
    });
  }

  if (state.medicalHistory.chronic_diarrhea) {
    alerts.push({
      severity: "caution",
      code: "CHRONIC_DIARRHEA",
      message: "Chronic diarrhoea",
      detail: "Orlistat may worsen symptoms. Consider alternative therapy.",
    });
  }

  // Chronic kidney disease, increased hyperoxaluria / oxalate-nephropathy
  // risk. Per orlistat SmPC + recent post-marketing reports.
  if (state.medicalHistory.chronicKidneyDisease) {
    alerts.push({
      severity: "caution",
      code: "RENAL_CKD",
      message: "Chronic kidney disease / volume depletion",
      detail:
        "Orlistat may cause hyperoxaluria and oxalate nephropathy leading to renal failure, particularly in patients with underlying CKD or volume depletion. Counsel patient on adequate fluid intake; monitor renal function.",
    });
  }

  // Interaction exclusion (PGD exclusion criteria, decision 54, 11 September
  // 2026): antiepileptic medicines, antiretroviral medicines for HIV,
  // amiodarone, or any other medicine with an SmPC interaction that cannot be
  // managed in a pharmacy setting. Refer to the GP or specialist.
  if (state.medications.takesAntiEpileptics) {
    alerts.push({
      severity: "stop",
      code: "ANTIEPILEPTICS",
      message: "Concurrent antiepileptic therapy",
      detail:
        "Excluded under this PGD. Orlistat may reduce the absorption of antiepileptic medicines and unbalance treatment, leading to convulsions. Do not supply; refer to the GP or specialist.",
    });
  }

  if (state.medications.takesHIVAntiretrovirals) {
    alerts.push({
      severity: "stop",
      code: "ANTIRETROVIRALS",
      message: "Concurrent HIV antiretroviral therapy",
      detail:
        "Excluded under this PGD. Orlistat may reduce the absorption of antiretroviral medicines and lead to loss of virological control. Do not supply; refer to the GP or HIV specialist team.",
    });
  }

  if (state.medications.takesAmiodarone) {
    alerts.push({
      severity: "stop",
      code: "AMIODARONE",
      message: "Concurrent amiodarone therapy",
      detail:
        "Excluded under this PGD. Orlistat may reduce amiodarone plasma levels, with a clinical effect that cannot be monitored in a pharmacy setting. Do not supply; refer to the GP or specialist.",
    });
  }

  if (state.medications.otherSignificantInteraction) {
    alerts.push({
      severity: "stop",
      code: "DRUG_INTERACTION",
      message: "Other medicine with an SmPC interaction that cannot be managed in a pharmacy setting",
      detail:
        "Excluded under this PGD. Refer to the GP for medicines reconciliation before considering orlistat.",
    });
  }

  // Asked on the medical history step; the SmPC advises against use in
  // pregnancy and orlistat is not a treatment for severe GI disease.
  if (state.medicalHistory.planningPregnancy) {
    alerts.push({
      severity: "caution",
      code: "PLANNING_PREGNANCY",
      message: "Planning pregnancy within 2 months",
      detail:
        "Pregnancy is an exclusion. Advise effective contraception while taking orlistat and to stop and seek advice if pregnancy is planned or confirmed; a 28 day supply may be inappropriate if conception is imminent.",
    });
  }
  if (state.medicalHistory.severeGastrointestinal) {
    alerts.push({
      severity: "caution",
      code: "SEVERE_GI",
      message: "Severe gastrointestinal disease",
      detail:
        "Chronic malabsorption and cholestasis exclude (tick above if present). Other severe gastrointestinal disease: orlistat will worsen faecal urgency, oily stools and flatulence; consider referral rather than supply.",
    });
  }

  // Rectal bleeding caution, surfaces as a counselling point rather than
  // a per-patient alert; included in the patient counselling step below.

  // Severe-diarrhoea contraception caution, surfaces in counselling /
  // OC users.
  if (state.medications.takesOralContraceptives) {
    alerts.push({
      severity: "caution",
      code: "ORAL_CONTRACEPTIVE",
      message: "Patient on oral contraceptive",
      detail:
        "In case of severe diarrhoea, the efficacy of oral contraceptives may be reduced. Advise an additional barrier method during episodes of severe diarrhoea.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: OrlistatConsultationState): DoseRecommendation | null {
  return {
    medicine: "Orlistat 120mg capsules",
    dose: "120mg",
    frequency: "With each main meal containing fat, up to three times daily (maximum 360mg daily)",
    duration: "Review at 12 weeks (3 months) from start; continue only if at least 5% reduction in body weight from baseline, otherwise discontinue and refer to GP",
    dosingRegimen: "Swallow capsule whole with a glass of water with or shortly before each main meal (typically breakfast, lunch and dinner). If a meal is missed or contains negligible fat, omit the dose. Supply up to 84 capsules (28-day supply).",
    reason: "Adjunct to reduced-calorie diet and lifestyle changes in adults aged 18 to 74 with BMI 30 kg/m2 or more, or BMI 28 kg/m2 or more with an obesity-related comorbidity",
  };
}

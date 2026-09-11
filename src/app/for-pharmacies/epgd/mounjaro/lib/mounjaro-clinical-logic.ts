import type { MounjaroConsultationState } from "./mounjaro-types";
import { DOSE_BY_STAGE } from "./mounjaro-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// Alerts follow the Mounjaro (tirzepatide) Injection for weight management PGD,
// version 007, issued 11 September 2026. "stop" = exclusion criterion (do not
// supply, refer); "caution" = caution row; "red-flag" = monitoring point.

export function getAllAlerts(state: MounjaroConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── STOP Alerts (exclusion criteria) ───

  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "AGE_UNDER_18",
      message: "Patient is under 18 years of age",
      detail: "Exclusion. This PGD covers adults aged 18 to 75 years inclusive. Do not supply.",
    });
  }

  if (state.patient.age !== null && state.patient.age > 75) {
    alerts.push({
      severity: "stop",
      code: "AGE_OVER_75",
      message: "Patient is over 75 years of age",
      detail:
        "Exclusion. Upper age limit under this PGD is 75 years; refer to a specialist if treatment is being considered.",
    });
  }

  if (state.medicalHistory.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY",
      message: "Known hypersensitivity to tirzepatide or to any of the excipients",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.personalMTCHistory) {
    alerts.push({
      severity: "stop",
      code: "MTC_PERSONAL",
      message: "Personal history of medullary thyroid carcinoma",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.familyMTCHistory) {
    alerts.push({
      severity: "stop",
      code: "MTC_FAMILY",
      message: "Family history of medullary thyroid carcinoma",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.men2) {
    alerts.push({
      severity: "stop",
      code: "MEN2",
      message: "Multiple endocrine neoplasia syndrome type 2 (MEN 2)",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.pancreatitisHistory) {
    alerts.push({
      severity: "stop",
      code: "PANCREATITIS",
      message: "History of pancreatitis, acute or chronic",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.severeGIDisease) {
    alerts.push({
      severity: "stop",
      code: "GI_DISEASE",
      message: "Severe gastrointestinal disease, including gastroparesis or severe persistent gastrointestinal disorder",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "stop",
      code: "GALLBLADDER",
      message: "Current cholelithiasis (gallstones) or cholecystitis",
      detail: "Exclusion. Do not supply. Recommend GP review of the gallbladder disease.",
    });
  }

  if (state.medicalHistory.recentCholecystectomy) {
    alerts.push({
      severity: "stop",
      code: "RECENT_CHOLECYSTECTOMY",
      message: "Cholecystectomy within the last 3 months",
      detail: "Exclusion. Do not supply until more than 3 months have passed since the cholecystectomy.",
    });
  }

  if (state.medicalHistory.endocrineObesity) {
    alerts.push({
      severity: "stop",
      code: "ENDOCRINE_OBESITY",
      message: "Obesity caused by an endocrinological disorder",
      detail:
        "Exclusion. Refer to the GP. If the patient was already overweight before that diagnosis this exclusion may not apply: untick and document the reasoning in the clinical notes.",
    });
  }

  if (state.medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANT",
      message: "Currently pregnant",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "BREASTFEEDING",
      message: "Currently breastfeeding",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.planningPregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREG_PLAN",
      message: "Planning pregnancy",
      detail:
        "Exclusion. Do not supply. Tirzepatide must be discontinued at least 1 month before planned conception.",
    });
  }

  if (state.medicalHistory.noEffectiveContraception) {
    alerts.push({
      severity: "stop",
      code: "NO_CONTRACEPTION",
      message: "Woman of childbearing potential not using effective contraception",
      detail:
        "Exclusion. Effective contraception is required. Non-oral contraception or a barrier method is advised during titration and for 4 weeks after each dose increase.",
    });
  }

  if (state.medicalHistory.type1Diabetes) {
    alerts.push({
      severity: "stop",
      code: "T1DM",
      message: "Type 1 diabetes mellitus",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.diabeticRetinopathy) {
    alerts.push({
      severity: "stop",
      code: "RETINOPATHY",
      message: "Diabetic retinopathy",
      detail: "Exclusion. Treatment may worsen retinopathy; defer or refer to a specialist.",
    });
  }

  if (state.medications.takesInsulin) {
    alerts.push({
      severity: "stop",
      code: "INSULIN",
      message: "Insulin-treated diabetes",
      detail:
        "Exclusion. Refer: a pharmacy weight-management service cannot manage insulin dose reduction. There is no GP-monitored route under this PGD.",
    });
  }

  if (state.medications.currentGLP1) {
    alerts.push({
      severity: "stop",
      code: "GLP1",
      message: "Already taking another GLP-1 receptor agonist or insulin secretagogue, for any indication",
      detail:
        "Exclusion. Oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide, dulaglutide, exenatide, and the sulfonylureas and meglitinides all exclude, whether taken for diabetes or for weight. Do not supply.",
    });
  }

  if (state.medicalHistory.severeRenalImpairment) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_RENAL",
      message: "Severe renal impairment (eGFR below 30 mL/min/1.73 m2) or end-stage renal disease",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.heartFailureReducedEF) {
    alerts.push({
      severity: "stop",
      code: "HFREF",
      message: "Known diagnosis of heart failure with reduced ejection fraction",
      detail:
        "Exclusion where left ventricular ejection fraction is 40% or below. HFpEF (preserved EF) is not excluded. If EF is unknown but the patient is under cardiology review for heart failure, refer to the GP to confirm EF before considering treatment.",
    });
  }

  if (state.medicalHistory.activeEatingDisorder) {
    alerts.push({
      severity: "stop",
      code: "EATING_DISORDER",
      message: "Active eating disorder (anorexia nervosa, bulimia, or binge-eating disorder under specialist care)",
      detail: "Exclusion. Do not supply.",
    });
  }

  if (state.medicalHistory.depression && state.medicalHistory.mentalHealthOversightAbsent) {
    alerts.push({
      severity: "stop",
      code: "MENTAL_HEALTH_NO_OVERSIGHT",
      message: "Mental health concern without appropriate psychiatric oversight",
      detail:
        "Do not supply where oversight is absent and concern exists (PGD cautions row). Refer to the GP or mental health team.",
    });
  }

  if (state.medicalHistory.notSuitableClinicalJudgement) {
    alerts.push({
      severity: "stop",
      code: "CLINICAL_JUDGEMENT",
      message: "Not suitable for the medication in the clinical judgement of the healthcare professional",
      detail: "Exclusion. Document the reason and the advice given; inform or refer to the GP as appropriate.",
    });
  }

  // ─── CAUTION Alerts (cautions row) ───

  if (state.medicalHistory.depression && !state.medicalHistory.mentalHealthOversightAbsent) {
    alerts.push({
      severity: "caution",
      code: "MENTAL_HEALTH",
      message: "History of suicidal ideation, or active severe mental illness",
      detail:
        "Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern. Do not supply where oversight is absent and concern exists.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "caution",
      code: "RENAL",
      message: "Mild to moderate renal impairment",
      detail:
        "Monitor for dehydration secondary to gastrointestinal side effects. Counsel on adequate fluid intake. Severe renal impairment (eGFR below 30) or end-stage renal disease excludes.",
    });
  }

  if (state.medicalHistory.preExistingTachycardia) {
    alerts.push({
      severity: "caution",
      code: "TACHYCARDIA",
      message: "Pre-existing increased heart rate",
      detail:
        "Cases of tachycardia have been reported. Use with caution and seek specialist advice before use. If a clinically relevant sustained increase in resting heart rate occurs, treatment should be discontinued and advice sought.",
    });
  }

  if (state.medications.warfarinUser) {
    alerts.push({
      severity: "caution",
      code: "WARFARIN",
      message: "Taking warfarin",
      detail:
        "Tirzepatide delays gastric emptying and may affect absorption of narrow therapeutic index medicines. On initiation of tirzepatide, frequent monitoring of INR is recommended.",
    });
  }

  if (state.medications.takesOralContraceptives) {
    alerts.push({
      severity: "caution",
      code: "ORAL_CONTRACEPTIVE",
      message: "Taking an oral contraceptive",
      detail:
        "Delayed gastric emptying may reduce absorption. Non-oral contraception or a barrier method is advised during titration and for 4 weeks after each dose increase.",
    });
  }

  if (state.medications.takesHRT) {
    alerts.push({
      severity: "caution",
      code: "HRT",
      message: "Taking oral HRT",
      detail:
        "Due to the lack of data regarding absorption, non-oral products (for example patch, gel, or levonorgestrel intrauterine device) may be considered.",
    });
  }

  if (state.medications.t2dmOralAgents) {
    alerts.push({
      severity: "caution",
      code: "T2DM_ORAL",
      message: "Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only",
      detail:
        "No dose adjustment is needed, but inform the GP. Any sulfonylurea, meglitinide or insulin excludes.",
    });
  }

  if (state.doseSelection.missedMoreThanTwoDoses) {
    alerts.push({
      severity: "caution",
      code: "MISSED_DOSES",
      message: "More than 2 doses missed",
      detail: "Reduce and re-escalate the dose to avoid unwanted side effects when treatment is re-initiated.",
    });
  }

  if (state.doseSelection.supplyType === "restart") {
    alerts.push({
      severity: "caution",
      code: "RESTART",
      message: "Recommencing treatment after a break",
      detail:
        "The dose must be titrated again from 2.5 mg following the schedule. The BMI inclusion criteria must be reapplied if more than 2 months have passed since discontinuing treatment.",
    });
  }

  // ─── RED-FLAG Alerts (monitoring) ───

  if (state.medicalHistory.thyroidDisease) {
    alerts.push({
      severity: "red-flag",
      code: "THYROID",
      message: "Thyroid disease",
      detail: "Confirm this is not medullary thyroid carcinoma or MEN 2 (both exclude). Monitor thyroid function and warning signs.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: MounjaroConsultationState): DoseRecommendation | null {
  // Mounjaro titration schedule (PGD v007): 2.5 mg for 4 weeks, then 5 mg; further
  // 2.5 mg increases after a minimum of 4 weeks on the current dose if required
  // and tolerated. Maintenance doses 5 mg, 10 mg or 15 mg. Maximum 15 mg once weekly.
  const doseStages = [
    { stage: "init", detail: "Starting dose for 4 weeks. Titration dose, not intended for sustained weight management" },
    { stage: "1", detail: "Maintenance dose. Further 2.5 mg increases after a minimum of 4 weeks on the current dose if required and tolerated" },
    { stage: "2", detail: "Titration step. Increase after a minimum of 4 weeks if required and tolerated" },
    { stage: "3", detail: "Maintenance dose. Increase after a minimum of 4 weeks if required and tolerated" },
    { stage: "4", detail: "Titration step. Increase after a minimum of 4 weeks if required and tolerated" },
    { stage: "5", detail: "Maintenance dose. Maximum dose 15 mg once weekly" },
  ];

  const currentStage = doseStages.find((s) => s.stage === state.doseSelection.currentDoseStage);
  if (!currentStage) return null;

  return {
    medicine: "Mounjaro (tirzepatide) KwikPen",
    dose: `${DOSE_BY_STAGE[currentStage.stage]} per 0.6 mL dose`,
    frequency: "Once weekly, subcutaneous injection (abdomen, thigh or upper arm), same day each week",
    duration: "4 weeks: one KwikPen (4 x 0.6 mL doses, 2.4 mL) per patient appointment",
    dosingRegimen: `${currentStage.detail}. Do not administer intravenously or intramuscularly.`,
    reason: "Weight management in adults aged 18 to 75 with BMI 30 or above, or 27 or above with at least one weight-related comorbidity",
  };
}

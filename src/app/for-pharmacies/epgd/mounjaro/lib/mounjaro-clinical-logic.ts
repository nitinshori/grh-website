import type { MounjaroConsultationState } from "./mounjaro-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: MounjaroConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── STOP Alerts (Hard stops) ───

  if (state.medicalHistory.personalMTCHistory) {
    alerts.push({
      severity: "stop",
      code: "MTC_PERSONAL",
      message: "Personal history of medullary thyroid carcinoma",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.familyMTCHistory) {
    alerts.push({
      severity: "stop",
      code: "MTC_FAMILY",
      message: "Family history of medullary thyroid carcinoma",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.men2) {
    alerts.push({
      severity: "stop",
      code: "MEN2",
      message: "Multiple endocrine neoplasia type 2 (MEN2)",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.pancreatitisHistory) {
    alerts.push({
      severity: "stop",
      code: "PANCREATITIS",
      message: "History of pancreatitis",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.severeGIDisease) {
    alerts.push({
      severity: "stop",
      code: "GI_DISEASE",
      message: "Severe gastrointestinal disease",
      detail: "Absolute contraindication. Do not supply.",
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

  if (state.medicalHistory.type1Diabetes) {
    alerts.push({
      severity: "stop",
      code: "T1DM",
      message: "Type 1 diabetes mellitus",
      detail: "Mounjaro is not indicated for T1DM. Do not supply.",
    });
  }

  if (state.medicalHistory.heartFailureReducedEF) {
    alerts.push({
      severity: "stop",
      code: "HFREF",
      message: "Heart failure with reduced ejection fraction (HFrEF)",
      detail:
        "Excluded under this PGD where left ventricular ejection fraction is ≤40%. Where evidence shows GLP-1s have benefit in HFpEF (preserved EF), benefit is NOT established for HFrEF and there are signals of harm. Refer to GP. (If EF is unknown but patient under cardiology review for 'heart failure', refer to GP to confirm EF before considering treatment.)",
    });
  }

  // ─── CAUTION Alerts ───

  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "caution",
      code: "GALLBLADDER",
      message: "Gallbladder disease",
      detail: "Increased cholelithiasis risk. Monitor closely; advise on warning signs.",
    });
  }

  if (state.medicalHistory.recentCholecystectomy) {
    alerts.push({
      severity: "caution",
      code: "RECENT_CHOLECYSTECTOMY",
      message: "Cholecystectomy within the last 3 months",
      detail:
        "Tirzepatide-related GI / biliary symptoms could complicate the post-operative recovery period. Counsel carefully on warning signs (severe RUQ pain, fever, jaundice) and consider deferring initiation until recovery is established.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "caution",
      code: "RENAL",
      message: "Renal impairment",
      detail: "Risk of dehydration. Monitor renal function and fluid intake.",
    });
  }

  if (state.medicalHistory.diabeticRetinopathy) {
    alerts.push({
      severity: "caution",
      code: "RETINOPATHY",
      message: "Diabetic retinopathy",
      detail: "May transiently worsen with rapid weight loss. Monitor closely.",
    });
  }

  if (state.medications.takesInsulin) {
    alerts.push({
      severity: "caution",
      code: "INSULIN",
      message: "Taking insulin",
      detail: "Risk of hypoglycaemia. May require insulin dose reduction (~20%).",
    });
  }

  if (state.medications.currentGLP1) {
    alerts.push({
      severity: "stop",
      code: "GLP1",
      message: "Already taking another GLP-1 agonist",
      detail: "Cannot combine with another GLP-1. Clarify current therapy. Do not supply.",
    });
  }

  if (state.medicalHistory.planningPregnancy) {
    alerts.push({
      severity: "caution",
      code: "PREG_PLAN",
      message: "Planning pregnancy within 2 months",
      detail: "Advise discontinuation 2 months before attempting conception.",
    });
  }

  // ─── RED-FLAG Alerts ───

  if (state.medicalHistory.depression) {
    alerts.push({
      severity: "red-flag",
      code: "DEPRESSION",
      message: "Depression or mental health condition",
      detail: "Requires enhanced psychiatric monitoring during treatment.",
    });
  }

  if (state.medicalHistory.thyroidDisease) {
    alerts.push({
      severity: "red-flag",
      code: "THYROID",
      message: "Thyroid disease",
      detail: "Monitor thyroid function and GLP-1 warning signs closely.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: MounjaroConsultationState): DoseRecommendation | null {
  // Mounjaro titration schedule: 2.5mg → 5mg → 7.5mg → 10mg → 12.5mg → 15mg (4-week escalation)
  const doseStages = [
    { stage: "init", dose: "2.5mg", detail: "Initial dose, weekly SC" },
    { stage: "1", dose: "5mg", detail: "After 4 weeks, escalate if tolerated" },
    { stage: "2", dose: "7.5mg", detail: "After 4 weeks, escalate if tolerated" },
    { stage: "3", dose: "10mg", detail: "After 4 weeks, escalate if tolerated" },
    { stage: "4", dose: "12.5mg", detail: "After 4 weeks, escalate if tolerated" },
    { stage: "5", dose: "15mg", detail: "Maintenance dose" },
  ];

  const currentStage = doseStages.find((s) => s.stage === state.doseSelection.currentDoseStage);
  if (!currentStage) return null;

  return {
    medicine: "Tirzepatide (Mounjaro)",
    dose: currentStage.dose,
    frequency: "Once weekly",
    duration: "Ongoing (titrate over 4 weeks, then continue)",
    dosingRegimen: `${currentStage.detail}. Dual GIP/GLP-1 receptor agonist, SC injection.`,
    reason: "Weight management in patients with BMI ≥30 or ≥27 with comorbidity",
  };
}

import type { SaxendaConsultationState } from "./saxenda-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: SaxendaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "SAXENDA_AGE",
      message: "Patient under 18 years",
      detail: "Saxenda is only approved for adults 18 years and above.",
    });
  }

  if (!state.assessment.bmiEligible) {
    alerts.push({
      severity: "stop",
      code: "SAXENDA_BMI",
      message: "BMI does not meet eligibility criteria",
      detail: "BMI must be >30 kg/m² or >27 kg/m² with comorbidity (diabetes, hypertension, dyslipidaemia).",
    });
  }

  if (state.assessment.mtcMenHistory) {
    alerts.push({
      severity: "stop",
      code: "SAXENDA_MTC_MEN",
      message: "Medullary thyroid carcinoma or MEN2 history",
      detail: "Contraindicated. GLP-1 agonists contraindicated in MTC/MEN2 due to C-cell tumour risk.",
    });
  }

  if (state.assessment.pancreatitisHistory) {
    alerts.push({
      severity: "stop",
      code: "SAXENDA_PANCREATITIS",
      message: "History of pancreatitis",
      detail: "Contraindicated. GLP-1 agonists not recommended with acute or chronic pancreatitis history.",
    });
  }

  if (state.assessment.pregnancyStatus === "confirmed") {
    alerts.push({
      severity: "stop",
      code: "SAXENDA_PREGNANCY",
      message: "Patient is pregnant",
      detail: "Contraindicated in pregnancy. Counsel on contraception requirement.",
    });
  }

  if (state.assessment.type1Diabetes) {
    alerts.push({
      severity: "stop",
      code: "SAXENDA_T1DM",
      message: "Type 1 diabetes",
      detail: "Saxenda not approved for T1DM. Use only in Type 2 diabetes if applicable.",
    });
  }

  if (state.assessment.severeRenalDisease) {
    alerts.push({
      severity: "caution",
      code: "SAXENDA_RENAL",
      message: "Severe renal impairment",
      detail: "Use with caution; no dose adjustment needed but monitor renal function.",
    });
  }

  if (state.assessment.severeHepaticDisease) {
    alerts.push({
      severity: "caution",
      code: "SAXENDA_HEPATIC",
      message: "Severe hepatic disease",
      detail: "Use with caution in severe hepatic impairment.",
    });
  }

  return alerts;
}

export function hasHardStops(state: SaxendaConsultationState): boolean {
  const alerts = getAllAlerts(state);
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: SaxendaConsultationState): DoseRecommendation | null {
  if (!state.assessment.bmiEligible || state.patient.age === null || state.patient.age < 18) {
    return null;
  }

  return {
    medicine: "Saxenda (liraglutide 6 mg/mL subcutaneous injection pen)",
    dose: "Starting 0.6 mg subcutaneously once daily",
    dosingRegimen:
      "Week 1: 0.6 mg OD, Week 2: 1.2 mg OD, Week 3: 1.8 mg OD, Week 4: 2.4 mg OD, Week 5+: 3.0 mg OD (target maintenance)",
    reason: `Adult with BMI ${state.assessment.bmi} kg/m²; meets inclusion criteria for weight management under PGD.`,
  };
}

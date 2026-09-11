// ─── Asthma Rescue Clinical Logic (PGD v005, 11 September 2026) ───

import type { AsthmaConsultationState } from "./asthma-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export const MAX_PREDNISOLONE_TABLETS = 70;

/** Acute severe or life-threatening features (both arms): any one excludes. */
export function acuteSevereFeatures(state: AsthmaConsultationState): string[] {
  const o = state.observations;
  const out: string[] = [];
  if (!o.canCompleteSentences) out.push("unable to complete sentences in one breath");
  if (o.respiratoryRate !== null && o.respiratoryRate >= 25) out.push("respiratory rate 25/min or more");
  if (o.heartRate !== null && o.heartRate >= 110) out.push("heart rate 110/min or more");
  if (o.pefMeasured && o.pefPercentBest !== null && o.pefPercentBest <= 50)
    out.push(
      o.pefPercentBest < 33
        ? "PEF below 33% of best or predicted (life-threatening)"
        : "PEF 33 to 50% of best or predicted"
    );
  if (o.spo2 !== null && o.spo2 < 92) out.push("SpO2 below 92%");
  if (o.silentChest) out.push("silent chest");
  if (o.cyanosis) out.push("cyanosis");
  if (o.exhaustion) out.push("exhaustion");
  if (o.confusion) out.push("confusion");
  if (o.poorRespiratoryEffort) out.push("poor respiratory effort");
  return out;
}

/** Observations that must be measured and recorded before any supply. */
export function missingObservations(state: AsthmaConsultationState): string[] {
  const o = state.observations;
  const out: string[] = [];
  if (o.spo2 === null) out.push("pulse oximetry (SpO2)");
  if (o.respiratoryRate === null) out.push("respiratory rate");
  if (o.heartRate === null) out.push("pulse");
  if (o.pefMeasured && o.pefPercentBest === null) out.push("PEF as % of best or predicted");
  return out;
}

export function salbutamolArmBlockers(state: AsthmaConsultationState): string[] {
  const a = state.assessment;
  const out: string[] = [];
  if (state.redFlags.salbutamolAllergy)
    out.push("known hypersensitivity to salbutamol or other beta-2 agonists");
  if (!a.acuteExacerbation)
    out.push("no acute exacerbation with symptoms of bronchospasm recorded");
  if (!a.canUseInhalerOrSpacer)
    out.push("not capable of using an inhaler device or willing to use a spacer");
  if (!a.onPreventer)
    out.push("no current preventer (inhaled corticosteroid) therapy: refer to the GP for review");
  if (a.rescueCoursesLast12Months !== null && a.rescueCoursesLast12Months >= 1)
    out.push(
      "a rescue course has already been supplied in the last 12 months: no more than one rescue course in 12 months is supplied under this PGD; refer to the GP for review"
    );
  return out;
}

export function prednisoloneArmBlockers(state: AsthmaConsultationState): string[] {
  const a = state.assessment;
  const o = state.observations;
  const h = state.medicalHistory;
  const out: string[] = [];
  if (state.redFlags.prednisoloneAllergy)
    out.push("known hypersensitivity to prednisolone or other corticosteroids");
  if (!a.incompleteResponseToSalbutamol)
    out.push("moderate exacerbation with incomplete response to salbutamol not recorded");
  if (o.pefMeasured && o.pefPercentBest !== null && o.pefPercentBest <= 50)
    out.push("PEF not over 50% of best or predicted");
  if (!a.ableToTakeOralMedication) out.push("not able to take oral medication");
  if (h.systemicInfectionUntreated)
    out.push("systemic infection not treated with appropriate antimicrobials");
  if (h.liveVaccineDuringTreatment) out.push("vaccination with live vaccines during treatment");
  if (h.severeHepaticDysfunction) out.push("severe hepatic dysfunction");
  if (h.uncontrolledHypertensionOrCardiac)
    out.push("uncontrolled hypertension or cardiac disease (relative: discuss risk/benefit, refer)");
  return out;
}

// ─── Alert generation ───

export function getAllAlerts(state: AsthmaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const a = state.assessment;
  const h = state.medicalHistory;

  // Hard stops (STOP severity)
  if (state.redFlags.noExistingDiagnosis || a.diagnosisEvidence === "none") {
    alerts.push({
      severity: "stop",
      code: "NO_ASTHMA_DX",
      message: "No documented asthma diagnosis: first presentation",
      detail:
        "A confirmed diagnosis must be DOCUMENTED: GP record, a repeat prescription for an asthma inhaler, or an asthma action plan. Previous inhaler use on its own is not confirmation. First presentation suggestive of asthma without prior diagnosis: refer for assessment.",
    });
  }

  if (state.redFlags.neverUsedSalbutamolBefore) {
    alerts.push({
      severity: "stop",
      code: "NEVER_USED_SABA",
      message: "Patient has never used salbutamol before",
      detail:
        "Patient must normally use SABA for asthma. Refer to GP for initial diagnosis and treatment.",
    });
  }

  const severe = acuteSevereFeatures(state);
  if (state.currentStep >= 4 && severe.length > 0) {
    alerts.push({
      severity: "stop",
      code: "ACUTE_SEVERE",
      message: "Acute severe or life-threatening asthma",
      detail:
        "Present: " + severe.join(", ") + ". Refer for emergency assessment (999 where life-threatening). Do not supply.",
    });
  }

  if (state.currentStep > 2 && a.onPreventer === false) {
    alerts.push({
      severity: "stop",
      code: "NO_PREVENTER",
      message: "No current preventer (inhaled corticosteroid) therapy",
      detail:
        "A patient with no preventer is referred to the GP for review. Do not supply under this PGD.",
    });
  }
  if (a.rescueCoursesLast12Months !== null && a.rescueCoursesLast12Months >= 1) {
    alerts.push({
      severity: "stop",
      code: "RESCUE_COURSE_LIMIT",
      message: "Rescue course already supplied in the last 12 months",
      detail:
        "No more than one rescue course in 12 months is supplied under this PGD. A patient who has needed more than one rescue course in the last 12 months is referred to the GP for review.",
    });
  }

  if (state.redFlags.increasingUse) {
    alerts.push({
      severity: "red-flag",
      code: "INCREASING_USE",
      message: "Increasing salbutamol use reported",
      detail: "Refer for GP asthma review. May indicate poor control or need for preventer therapy.",
    });
  }

  if (state.redFlags.nocturnalWakenings) {
    alerts.push({
      severity: "red-flag",
      code: "NOCTURNAL_SYMPTOMS",
      message: "Night-time symptoms present",
      detail: "Refer for GP asthma review. May indicate need for additional therapy.",
    });
  }

  if (state.redFlags.activityLimitation) {
    alerts.push({
      severity: "red-flag",
      code: "ACTIVITY_LIMITATION",
      message: "Activity limitation due to symptoms",
      detail: "Refer for GP asthma review. May indicate inadequate control.",
    });
  }

  // Frequent use caution
  if (a.frequentUse) {
    alerts.push({
      severity: "caution",
      code: "FREQUENT_USE",
      message: "Frequent salbutamol use (>3 days/week)",
      detail: "Patient may benefit from preventer therapy. Advise GP review.",
    });
  }

  // Salbutamol cautions
  if (h.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "SALB_CVD",
      message: "Cardiovascular disease",
      detail: "Beta-2 agonists can increase heart rate and blood pressure.",
    });
  }
  if (h.diabetes) {
    alerts.push({
      severity: "caution",
      code: "DIABETES",
      message: "Diabetes mellitus",
      detail:
        "Salbutamol: monitor blood glucose (hyperglycaemia can occur). Prednisolone: corticosteroids can increase blood glucose; monitor BM and adjust diabetes medication if needed.",
    });
  }
  if (h.hyperthyroidism) {
    alerts.push({
      severity: "caution",
      code: "SALB_THYROID",
      message: "Hyperthyroidism",
      detail: "Beta-2 agonists can worsen symptoms.",
    });
  }
  if (h.hypokalaemia) {
    alerts.push({
      severity: "caution",
      code: "SALB_HYPOKALAEMIA",
      message: "Hypokalaemia",
      detail: "May be worsened by beta-2 agonists; monitor potassium levels.",
    });
  }
  if (h.pregnancy || h.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "PREGNANCY",
      message: h.pregnancy ? "Pregnancy" : "Breastfeeding",
      detail:
        "Salbutamol is safe in pregnancy but ensure appropriate informed consent. Prednisolone: generally safe for acute use in pregnancy and breastfeeding; discuss benefits and risks.",
    });
  }

  // Prednisolone cautions
  if (h.osteoporosis) {
    alerts.push({ severity: "caution", code: "PRED_OSTEO", message: "Osteoporosis or risk factors", detail: "Prednisolone: short-term treatment risk is low but inform patient." });
  }
  if (h.pepticUlcer) {
    alerts.push({ severity: "caution", code: "PRED_PUD", message: "Peptic ulcer disease or GI upset", detail: "Prednisolone: consider gastroprotection." });
  }
  if (h.psychiatricHistory) {
    alerts.push({ severity: "caution", code: "PRED_PSYCH", message: "Psychiatric history", detail: "Corticosteroids can cause mood changes, insomnia, or exacerbate existing conditions." });
  }
  if (h.renalImpairment) {
    alerts.push({ severity: "caution", code: "PRED_RENAL", message: "Renal impairment", detail: "Prednisolone: generally safe for short-term use." });
  }
  if (h.hypertension) {
    alerts.push({ severity: "caution", code: "PRED_HTN", message: "Hypertension", detail: "Prednisolone may worsen; monitor blood pressure." });
  }
  if (h.infection) {
    alerts.push({ severity: "caution", code: "PRED_INFECTION", message: "Infection", detail: "Corticosteroids can mask symptoms; ensure appropriate investigation before use." });
  }

  // Arm selection versus recorded exclusions
  const ms = state.medicineSupply;
  if (ms.salbutamol100mcgPMDI) {
    const blockers = salbutamolArmBlockers(state);
    if (blockers.length > 0) {
      alerts.push({
        severity: "stop",
        code: "SALBUTAMOL_EXCLUDED",
        message: "Salbutamol arm excluded",
        detail: blockers.join("; ") + ". Do not supply salbutamol under this PGD.",
      });
    }
  }
  if (ms.prednisolone5mg) {
    const blockers = prednisoloneArmBlockers(state);
    if (blockers.length > 0) {
      alerts.push({
        severity: "stop",
        code: "PREDNISOLONE_EXCLUDED",
        message: "Prednisolone arm excluded",
        detail: blockers.join("; ") + ". Do not supply prednisolone under this PGD.",
      });
    }
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: AsthmaConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Dose recommendation ───

export function prednisoloneTabletCount(doseMg: string, days: string): number | null {
  const d = parseInt(doseMg, 10);
  const n = parseInt(days, 10);
  if (isNaN(d) || isNaN(n)) return null;
  return (d / 5) * n;
}

export const SALBUTAMOL_RECOMMENDATION: DoseRecommendation = {
  medicine: "Salbutamol 100mcg metered-dose inhaler (MDI), inhalation with or without spacer",
  dose: "2 to 4 puffs as required for acute symptom relief; initial dose 2 to 4 puffs inhaled immediately",
  frequency: "May repeat after 15 to 30 minutes if inadequate response. Use a spacer in less experienced patients.",
  duration: "1 MDI inhaler (200 doses). As needed during the acute exacerbation.",
  reason: "Acute symptom relief in an acute exacerbation of diagnosed asthma",
};

export function calculateDoseRecommendation(
  state: AsthmaConsultationState
): DoseRecommendation | null {
  const ms = state.medicineSupply;
  if (ms.salbutamol100mcgPMDI) return SALBUTAMOL_RECOMMENDATION;
  if (ms.prednisolone5mg) return prednisoloneRecommendation(state);
  return null;
}

export function prednisoloneRecommendation(state: AsthmaConsultationState): DoseRecommendation | null {
  const ms = state.medicineSupply;
  if (!ms.prednisolone5mg) return null;
  const tablets = prednisoloneTabletCount(ms.prednisoloneDoseMg, ms.prednisoloneDays);
  const perDay = ms.prednisoloneDoseMg ? parseInt(ms.prednisoloneDoseMg, 10) / 5 : null;
  return {
    medicine: "Prednisolone 5mg tablets, oral",
    dose: ms.prednisoloneDoseMg
      ? `${ms.prednisoloneDoseMg}mg daily (${perDay} tablets a day) as a single dose or in divided doses`
      : "40 to 50mg daily as a single dose or in divided doses",
    frequency: "May be taken with food to reduce GI upset",
    duration: ms.prednisoloneDays
      ? `${ms.prednisoloneDays} days; ${tablets ?? "?"} tablets of 5mg`
      : "5 to 7 days for acute exacerbation",
    reason: "Moderate exacerbation with incomplete response to salbutamol",
  };
}

// ─── COPD Management Clinical Logic (PGD v004, 11 September 2026) ───

import type { COPDConsultationState } from "./copd-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export const MAX_SALBUTAMOL_SUPPLIES_12_MONTHS = 2;

/**
 * Supplies in the last 12 months: the higher of what the patient reports and
 * what this pharmacy's saved COPD records show. The document's only quantity
 * control (maximum 2 supplies in any 12 months) used to rest on a number
 * typed from memory (adversarial review, 11 Sep 2026).
 */
export function effectiveSalbutamolSupplies12Months(state: COPDConsultationState): number {
  const a = state.assessment;
  return Math.max(a.salbutamolSuppliesLast12Months ?? 0, a.platformSalbutamolSupplies12Months ?? 0);
}

/** Salbutamol arm: exclusions that apply whichever arm is chosen are in getAllAlerts. */
export function salbutamolArmBlockers(state: COPDConsultationState): string[] {
  const out: string[] = [];
  const a = state.assessment;
  if (state.currentMedications.salbutamolAllergy)
    out.push("known hypersensitivity to salbutamol or other beta-2 agonists");
  // Only the recorded answer "No" excludes; a blank answer is a validation
  // message on the assessment step, never a stop (stop audit, 11 Sep 2026).
  if (a.inhalerAbilityAnswer === "no")
    out.push("not capable of using an inhaler device or willing to use a spacer (answer recorded on the COPD Assessment step)");
  if (effectiveSalbutamolSupplies12Months(state) >= MAX_SALBUTAMOL_SUPPLIES_12_MONTHS)
    out.push(
      "already had 2 supplies in the last 12 months under this PGD: a third request is a GP review of the patient's COPD, not a further supply"
    );
  return out;
}

export function amoxicillinArmBlockers(state: COPDConsultationState): string[] {
  const out: string[] = [];
  const a = state.assessment;
  const h = state.medicalHistory;
  // Each of these fires only on an answer the pharmacist recorded (a
  // presentation other than exacerbation, or an explicit "No"); a blank
  // answer is a validation message, never a stop (stop audit, 11 Sep 2026).
  if (a.presentation && a.presentation !== "exacerbation")
    out.push("presentation recorded as breathlessness, not an acute exacerbation");
  if (a.purulentSputumAnswer === "no")
    out.push("purulent (yellow/green) sputum recorded as absent");
  if (a.oralAbilityAnswer === "no") out.push("not able to take oral medication (answer recorded on the COPD Assessment step)");
  if (state.currentMedications.penicillinAllergy)
    out.push("known penicillin or beta-lactam allergy");
  if (h.infectiousMononucleosis)
    out.push("infectious mononucleosis (amoxicillin can precipitate severe rash)");
  if (h.severeRenalImpairment)
    out.push("severe renal impairment (eGFR below 30 mL/min/1.73m2); dose adjustment needed");
  if (h.localResistanceConcern)
    out.push("antibiotic resistance suspected in local resistance patterns");
  return out;
}

export function getAllAlerts(state: COPDConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const a = state.assessment;
  const h = state.medicalHistory;
  const r = state.redFlags;

  // Fires only on the recorded answer "No". A blank answer is a validation
  // message on the assessment step; an unvisited step is never a stop
  // (stop audit, 11 Sep 2026).
  if (a.diagnosisStatus === "not-confirmed") {
    alerts.push({
      severity: "stop",
      code: "NO_COPD_DX",
      message: "No confirmed COPD diagnosis",
      detail:
        "Inclusion requires a confirmed diagnosis of COPD with documented spirometry and GOLD classification. Do not supply; refer to the GP for assessment.",
    });
  }
  // A blank presentation is a validation message on the assessment step
  // (and again at medicine supply), not a stop (stop audit, 11 Sep 2026).

  // Severe exacerbation with hypoxia: emergency referral and oxygen therapy
  const spo2Low = a.spo2 !== null && a.spo2 < 88;
  if (r.severeHypoxia || spo2Low) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HYPOXIA",
      message: "Severe exacerbation with hypoxia (SpO2 below 88%)",
      detail:
        "Exclusion: requires emergency referral and oxygen therapy. Do not supply. Call 999 or arrange same-day emergency care.",
    });
  }
  // Respiratory rate 25 or more: exclusion in both arms (PGD decision 36)
  const rrHigh = a.respiratoryRate !== null && a.respiratoryRate >= 25;
  if (r.highRespiratoryRate || rrHigh) {
    alerts.push({
      severity: "stop",
      code: "HIGH_RESP_RATE",
      message: "Respiratory rate 25 breaths per minute or more",
      detail:
        "Exclusion in both arms: a respiratory rate of 25 or more is a severity marker for hospital assessment. Do not supply salbutamol or amoxicillin. Emergency referral.",
    });
  }
  if (r.acuteDistress) {
    alerts.push({
      severity: "stop",
      code: "ACUTE_DISTRESS",
      message: "Acute distress with inability to speak, cyanosis, or signs of respiratory failure",
      detail: "Exclusion: emergency referral. Do not supply. Call 999.",
    });
  }

  // Derived from the assessment value as well as the checkbox: recording
  // MRC 5 on the assessment step used to show a red banner without a stop.
  if (r.mrcGrade5 || a.mrcBreathlessnessScale === 5) {
    alerts.push({
      severity: "stop",
      code: "MRC_GRADE_5",
      message: "MRC Grade 5 (housebound, breathless at rest)",
      detail: "Urgent referral required. Do not supply; refer to GP or respiratory services.",
    });
  }

  if (r.newHaemoptysis) {
    alerts.push({
      severity: "red-flag",
      code: "HAEMOPTYSIS",
      message: "New haemoptysis",
      detail: "Urgent referral to GP. May indicate serious underlying condition.",
    });
  }

  if (r.weightLoss) {
    alerts.push({
      severity: "red-flag",
      code: "WEIGHT_LOSS",
      message: "Unintentional weight loss",
      detail: "Urgent referral to GP for investigation.",
    });
  }

  if (r.recurrentInfections) {
    alerts.push({
      severity: "red-flag",
      code: "RECURRENT_INFECTIONS",
      message: "Recurrent respiratory infections",
      detail: "May require prophylaxis or vaccination review. Advise GP review.",
    });
  }

  // Salbutamol cautions (PGD v004)
  if (h.cardiovascularDisease || h.hypertension || h.coronaryDiseaseOrRecentMI) {
    alerts.push({
      severity: "caution",
      code: "SALBUTAMOL_CARDIAC",
      message: "Cardiovascular disease, hypertension, or coronary artery disease / recent MI",
      detail:
        "Salbutamol can increase heart rate and blood pressure; assess cardiac risk, monitor blood pressure, assess risk/benefit and monitor for angina.",
    });
  }
  if (h.diabetes) {
    alerts.push({
      severity: "caution",
      code: "SALBUTAMOL_DIABETES",
      message: "Diabetes mellitus",
      detail: "Salbutamol: monitor blood glucose (hyperglycaemia possible).",
    });
  }
  if (h.hyperthyroidism) {
    alerts.push({
      severity: "caution",
      code: "SALBUTAMOL_THYROID",
      message: "Hyperthyroidism",
      detail: "Beta-2 agonists can worsen symptoms.",
    });
  }
  if (h.hypokalaemia) {
    alerts.push({
      severity: "caution",
      code: "SALBUTAMOL_HYPOKALAEMIA",
      message: "Hypokalaemia",
      detail: "May be worsened by salbutamol; monitor potassium levels.",
    });
  }
  if (h.pregnancy || h.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "PREGNANCY_BREASTFEEDING",
      message: h.pregnancy ? "Pregnancy" : "Breastfeeding",
      detail:
        "Salbutamol in pregnancy: generally safe; ensure informed consent. Amoxicillin in pregnancy and breastfeeding: generally safe; ensure informed consent.",
    });
  }

  // Amoxicillin cautions
  if (h.mildModerateRenalImpairment) {
    alerts.push({
      severity: "caution",
      code: "AMOX_RENAL",
      message: "Mild to moderate renal impairment",
      detail: "Amoxicillin: monitor renal function; dose adjustment may be needed.",
    });
  }
  if (h.hepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "AMOX_HEPATIC",
      message: "Hepatic impairment",
      detail: "Amoxicillin: generally safe but monitor liver function.",
    });
  }
  if (state.currentMedications.oralContraceptive) {
    alerts.push({
      severity: "caution",
      code: "AMOX_CONTRACEPTIVE",
      message: "Uses oral contraception",
      detail:
        "Amoxicillin may reduce efficacy of oral contraceptives; advise additional contraception during and for 7 days after the course.",
    });
  }

  // Arm selection versus recorded exclusions
  const ms = state.medicineSupply;
  if (ms.supplySalbutamol) {
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
  if (ms.supplyAmoxicillin) {
    const blockers = amoxicillinArmBlockers(state);
    if (blockers.length > 0) {
      alerts.push({
        severity: "stop",
        code: "AMOXICILLIN_EXCLUDED",
        message: "Amoxicillin arm excluded",
        detail: blockers.join("; ") + ". Do not supply amoxicillin under this PGD.",
      });
    }
  }

  return alerts;
}

export function hasHardStops(state: COPDConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

export const SALBUTAMOL_RECOMMENDATION: DoseRecommendation = {
  medicine: "Salbutamol 100mcg metered-dose inhaler (MDI), inhalation with or without spacer",
  dose: "1 to 2 puffs (100 to 200 micrograms) as required for breathlessness",
  frequency:
    "Up to 4 times in 24 hours. Maximum 8 puffs in 24 hours under this PGD. More than this, relief more often than every 4 hours, or the reliever on most days: same-day GP or urgent care referral. Ten puffs through a spacer with no relief: call 999.",
  duration: "1 MDI inhaler (200 doses) per supply. Maximum 2 supplies in any 12 months under this PGD.",
  reason: "Acute symptom relief in COPD exacerbation or breathlessness",
};

export const AMOXICILLIN_RECOMMENDATION: DoseRecommendation = {
  medicine: "Amoxicillin 500mg capsules, oral",
  dose: "500mg (one capsule) three times daily",
  frequency:
    "On an empty stomach (1 hour before or 2 hours after meals) for optimal absorption, or with food if GI upset occurs",
  duration: "5 days; 15 capsules. Maximum treatment period 5 days.",
  reason: "Infective acute exacerbation of COPD with purulent sputum",
};

/** Every regimen chosen, in the order the document lists them. */
export function calculateDoseRecommendations(
  state: COPDConsultationState
): DoseRecommendation[] {
  if (!state.medicineSupply.medicinePrescribed) return [];
  const out: DoseRecommendation[] = [];
  if (state.medicineSupply.supplySalbutamol) out.push(SALBUTAMOL_RECOMMENDATION);
  if (state.medicineSupply.supplyAmoxicillin) out.push(AMOXICILLIN_RECOMMENDATION);
  return out;
}

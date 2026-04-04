import type {
  EDConsultationState,
  ClinicalAlert,
  DoseRecommendation,
} from "./ed-types";

// ══════════════════════════════════════════════════════════════
// EXCLUSION CHECKS — Hard stops: cannot supply
// ══════════════════════════════════════════════════════════════

export function checkExclusions(state: EDConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medications, observations, medicalHistory } = state;

  // Nitrates — absolute contraindication
  if (medications.takesNitrates) {
    alerts.push({
      severity: "stop",
      code: "NITRATE",
      message: "Patient takes nitrates — CANNOT supply PDE5 inhibitor",
      detail:
        "Concurrent use of organic nitrates in any form (e.g. GTN, isosorbide mononitrate/dinitrate) or nitric oxide donors (e.g. amyl nitrite) is an absolute contraindication due to risk of severe, potentially fatal hypotension.",
    });
  }

  // Riociguat
  if (medications.takesRiociguat) {
    alerts.push({
      severity: "stop",
      code: "RIOCIGUAT",
      message: "Patient takes riociguat — CANNOT supply PDE5 inhibitor",
      detail:
        "Concurrent use of riociguat (a guanylate cyclase stimulator) is contraindicated with PDE5 inhibitors.",
    });
  }

  // Blood pressure — hypotension
  if (
    observations.systolicBP !== null &&
    observations.diastolicBP !== null &&
    observations.bpTakenToday
  ) {
    if (observations.systolicBP < 90 || observations.diastolicBP < 50) {
      alerts.push({
        severity: "stop",
        code: "HYPOTENSION",
        message: `Blood pressure ${observations.systolicBP}/${observations.diastolicBP} mmHg — CANNOT supply`,
        detail:
          "Hypotension (BP <90/50 mmHg) is a contraindication. The patient should be referred to their GP for further assessment.",
      });
    }

    // Blood pressure — uncontrolled hypertension
    if (observations.systolicBP > 170 || observations.diastolicBP > 100) {
      alerts.push({
        severity: "stop",
        code: "HYPERTENSION",
        message: `Blood pressure ${observations.systolicBP}/${observations.diastolicBP} mmHg — CANNOT supply`,
        detail:
          "Uncontrolled hypertension (BP >170/100 mmHg) is a contraindication. The patient should be referred to their GP for blood pressure management.",
      });
    }
  }

  // Recent MI or stroke (within 6 months)
  if (medicalHistory.recentMIOrStroke) {
    alerts.push({
      severity: "stop",
      code: "RECENT_MI_STROKE",
      message: "Recent MI or stroke within 6 months — CANNOT supply",
      detail:
        "Patients who have had a myocardial infarction or stroke within the last 6 months are excluded. Refer to GP/cardiologist.",
    });
  }

  // Severe hepatic impairment
  if (medicalHistory.hepaticImpairment === "severe") {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment — CANNOT supply",
      detail:
        "Severe hepatic impairment is a contraindication for both sildenafil and tadalafil. Refer to GP.",
    });
  }

  // NAION history
  if (medicalHistory.naionHistory) {
    alerts.push({
      severity: "stop",
      code: "NAION",
      message: "Previous NAION — CANNOT supply PDE5 inhibitor",
      detail:
        "Previous episode of non-arteritic anterior ischaemic optic neuropathy (NAION) is a contraindication. Refer to ophthalmology/GP.",
    });
  }

  // Unstable angina
  if (medicalHistory.unstableAngina) {
    alerts.push({
      severity: "stop",
      code: "UNSTABLE_ANGINA",
      message: "Unstable angina — CANNOT supply",
      detail:
        "Sexual activity is inadvisable in patients with unstable angina. Refer to cardiology/GP.",
    });
  }

  // Severe heart failure
  if (medicalHistory.severeHeartFailure) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HF",
      message: "Severe heart failure (NYHA IV) — CANNOT supply",
      detail:
        "Sexual activity is inadvisable in patients with severe heart failure (NYHA class IV). Refer to cardiology/GP.",
    });
  }

  // Uncontrolled arrhythmias
  if (medicalHistory.uncontrolledArrhythmias) {
    alerts.push({
      severity: "stop",
      code: "ARRHYTHMIAS",
      message: "Uncontrolled arrhythmias — CANNOT supply",
      detail:
        "Sexual activity is inadvisable in patients with uncontrolled arrhythmias. Refer to cardiology/GP.",
    });
  }

  // Hereditary retinal disorders
  if (medicalHistory.retinalDisorders) {
    alerts.push({
      severity: "stop",
      code: "RETINAL",
      message: "Hereditary degenerative retinal disorder — CANNOT supply",
      detail:
        "Known hereditary degenerative retinal disorders (e.g. retinitis pigmentosa) are a contraindication for PDE5 inhibitors.",
    });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// CAUTION CHECKS — Warnings: dose adjustment may be needed
// ══════════════════════════════════════════════════════════════

export function checkCautions(state: EDConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medications, medicalHistory, patient } = state;

  // Alpha-blocker use
  if (medications.takesAlphaBlockers) {
    if (!medications.alphaBlockerStable) {
      alerts.push({
        severity: "caution",
        code: "ALPHA_UNSTABLE",
        message: "Patient not stable on alpha-blocker — stabilise first",
        detail:
          "Patient must be stable on alpha-blocker therapy before initiating PDE5 inhibitor. Consider deferring supply.",
      });
    } else {
      alerts.push({
        severity: "caution",
        code: "ALPHA_BLOCKER",
        message: "Alpha-blocker use — start sildenafil at 25mg",
        detail:
          "Concurrent alpha-blocker use requires a lower starting dose. Sildenafil should start at 25mg. Monitor for postural hypotension.",
      });
    }
  }

  // CYP3A4 inhibitors
  if (medications.takesCYP3A4Inhibitors) {
    alerts.push({
      severity: "caution",
      code: "CYP3A4",
      message: "CYP3A4 inhibitor use — dose adjustment required",
      detail:
        "Concurrent use of CYP3A4 inhibitors (e.g. erythromycin, ketoconazole, itraconazole, ritonavir) requires dose adjustment. Sildenafil: start at 25mg. Tadalafil on-demand: max 10mg in 72-hour period.",
    });
  }

  // Age over 65
  if (patient.age !== null && patient.age >= 65) {
    alerts.push({
      severity: "caution",
      code: "AGE_65",
      message: "Patient aged ≥65 — consider lower starting dose",
      detail:
        "In patients aged 65 and over, consider a starting dose of sildenafil 25mg due to potentially altered pharmacokinetics.",
    });
  }

  // Mild-moderate hepatic impairment
  if (medicalHistory.hepaticImpairment === "mild-moderate") {
    alerts.push({
      severity: "caution",
      code: "HEPATIC_MILD_MOD",
      message: "Mild-moderate hepatic impairment — dose adjustment",
      detail:
        "Sildenafil: consider starting dose of 25mg. Tadalafil on-demand: dose should not exceed 10mg.",
    });
  }

  // Severe renal impairment
  if (medicalHistory.renalImpairment === "severe") {
    alerts.push({
      severity: "caution",
      code: "RENAL_SEVERE",
      message: "Severe renal impairment (eGFR <30) — dose adjustment",
      detail:
        "Sildenafil: consider starting dose of 25mg. Tadalafil daily dosing is not recommended with severe renal impairment.",
    });
  }

  // Moderate renal impairment
  if (medicalHistory.renalImpairment === "moderate") {
    alerts.push({
      severity: "caution",
      code: "RENAL_MODERATE",
      message: "Moderate renal impairment (eGFR 30-50) — caution with daily tadalafil",
      detail:
        "For tadalafil once-daily dosing, start at 2.5mg with caution. On-demand dosing unaffected.",
    });
  }

  // Penile deformity
  if (medicalHistory.penileDeformity) {
    alerts.push({
      severity: "caution",
      code: "PENILE_DEFORMITY",
      message: "Anatomical penile deformity — use with caution",
      detail:
        "Conditions such as angulation, cavernosal fibrosis, or Peyronie's disease require caution with PDE5 inhibitors.",
    });
  }

  // Conditions predisposing to priapism
  if (medicalHistory.sickleCell) {
    alerts.push({
      severity: "caution",
      code: "PRIAPISM_RISK",
      message: "Sickle cell disease — increased priapism risk",
      detail:
        "Conditions predisposing to priapism (sickle cell anaemia, multiple myeloma, leukaemia) require caution. Ensure patient understands priapism warning.",
    });
  }

  // Bleeding disorders / peptic ulceration
  if (medicalHistory.bleedingDisorders) {
    alerts.push({
      severity: "caution",
      code: "BLEEDING",
      message: "Active peptic ulceration or bleeding disorder — use with caution",
      detail:
        "PDE5 inhibitors may exacerbate bleeding in patients with active peptic ulceration or bleeding disorders.",
    });
  }

  // Cardiovascular disease (general)
  if (medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "CVD_RISK",
      message: "Cardiovascular disease — risk assessment required",
      detail:
        "Patients with cardiovascular disease should have risk assessed before treatment initiation. Ensure sexual activity is not inadvisable.",
    });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// RED FLAG CHECKS — Referral recommended
// ══════════════════════════════════════════════════════════════

export function checkRedFlags(state: EDConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { redFlags, medicalHistory, complaint } = state;

  if (redFlags.pelvicPerinealTrauma) {
    alerts.push({
      severity: "red-flag",
      code: "PELVIC_TRAUMA",
      message: "Pelvic or perineal trauma — consider referral",
      detail:
        "History of pelvic or perineal trauma may indicate structural cause. Consider urology referral.",
    });
  }

  if (redFlags.penileAnatomicalAbnormality || medicalHistory.penileDeformity) {
    alerts.push({
      severity: "red-flag",
      code: "PENILE_ABNORMALITY",
      message: "Penile anatomical abnormality (e.g. Peyronie's) — consider referral",
      detail:
        "Penile anatomical abnormalities may require specialist assessment. Consider urology referral.",
    });
  }

  if (medicalHistory.priapismHistory) {
    alerts.push({
      severity: "red-flag",
      code: "PRIAPISM_HISTORY",
      message: "History of priapism — refer to specialist",
      detail:
        "Patients with a history of priapism or sickle cell disease should be referred for specialist assessment before initiating PDE5 therapy.",
    });
  }

  if (medicalHistory.hypogonadism) {
    alerts.push({
      severity: "red-flag",
      code: "HYPOGONADISM",
      message: "Suspected hypogonadism — refer for endocrine assessment",
      detail:
        "Unexplained hypogonadism or suspected endocrine disorder requires specialist assessment. Check early morning testosterone.",
    });
  }

  if (medicalHistory.psychiatricIssues && complaint.psychosexualFactors) {
    alerts.push({
      severity: "red-flag",
      code: "PSYCHOSEXUAL",
      message: "Complex psychiatric/psychosexual issues — consider referral",
      detail:
        "Complex psychiatric or psychosexual issues may require specialist counselling or therapy alongside pharmacological treatment.",
    });
  }

  if (redFlags.previousPDE5Failure) {
    alerts.push({
      severity: "red-flag",
      code: "PDE5_FAILURE",
      message: "Failed 2 PDE5 inhibitors at max dose — refer to specialist",
      detail:
        "Failure to respond to two different PDE5 inhibitors at maximum dose after adequate trial (6-8 attempts each) warrants referral to urology.",
    });
  }

  // Sudden onset may suggest psychogenic cause
  if (complaint.onsetType === "sudden") {
    alerts.push({
      severity: "red-flag",
      code: "SUDDEN_ONSET",
      message: "Sudden onset ED — consider psychogenic cause",
      detail:
        "Sudden onset ED is more suggestive of a psychogenic cause. Consider psychological/psychosexual assessment alongside pharmacological treatment.",
    });
  }

  return alerts;
}

// ══════════════════════════════════════════════════════════════
// DOSE RECOMMENDATION ENGINE
// ══════════════════════════════════════════════════════════════

export function calculateDoseRecommendation(
  state: EDConsultationState
): DoseRecommendation | null {
  const { medications, medicalHistory, patient } = state;

  // If there are hard stops, no recommendation
  const exclusions = checkExclusions(state);
  if (exclusions.length > 0) return null;

  const needsLowerDose =
    (patient.age !== null && patient.age >= 65) ||
    medicalHistory.hepaticImpairment === "mild-moderate" ||
    medicalHistory.renalImpairment === "severe" ||
    medications.takesAlphaBlockers ||
    medications.takesCYP3A4Inhibitors;

  const reasons: string[] = [];

  if (patient.age !== null && patient.age >= 65) reasons.push("age ≥65");
  if (medicalHistory.hepaticImpairment === "mild-moderate")
    reasons.push("hepatic impairment");
  if (medicalHistory.renalImpairment === "severe")
    reasons.push("severe renal impairment");
  if (medications.takesAlphaBlockers) reasons.push("alpha-blocker use");
  if (medications.takesCYP3A4Inhibitors)
    reasons.push("CYP3A4 inhibitor use");

  if (needsLowerDose) {
    return {
      medicine: "sildenafil",
      dosingRegimen: "on-demand",
      dose: "25mg",
      reason: `Lower starting dose recommended due to: ${reasons.join(", ")}`,
    };
  }

  // Default recommendation
  return {
    medicine: "sildenafil",
    dosingRegimen: "on-demand",
    dose: "50mg",
    reason: "Standard starting dose for adult males with no dose-adjustment factors",
  };
}

// ══════════════════════════════════════════════════════════════
// AGGREGATE ALL ALERTS
// ══════════════════════════════════════════════════════════════

export function getAllAlerts(state: EDConsultationState): ClinicalAlert[] {
  return [
    ...checkExclusions(state),
    ...checkCautions(state),
    ...checkRedFlags(state),
  ];
}

export function hasHardStops(state: EDConsultationState): boolean {
  return checkExclusions(state).length > 0;
}

// ══════════════════════════════════════════════════════════════
// AVAILABLE DOSES
// ══════════════════════════════════════════════════════════════

export const SILDENAFIL_DOSES = ["25mg", "50mg", "100mg"] as const;
export const TADALAFIL_ON_DEMAND_DOSES = ["5mg", "10mg", "20mg"] as const;
export const TADALAFIL_DAILY_DOSES = ["2.5mg", "5mg"] as const;

export function getAvailableDoses(
  medicine: string,
  regimen: string
): readonly string[] {
  if (medicine === "sildenafil") return SILDENAFIL_DOSES;
  if (medicine === "tadalafil" && regimen === "daily")
    return TADALAFIL_DAILY_DOSES;
  if (medicine === "tadalafil") return TADALAFIL_ON_DEMAND_DOSES;
  return [];
}

export function getMaxQuantity(
  medicine: string,
  regimen: string
): number {
  if (medicine === "tadalafil" && regimen === "daily") return 28;
  return 8;
}

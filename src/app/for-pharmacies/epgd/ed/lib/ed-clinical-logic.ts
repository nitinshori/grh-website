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
  const { medications, observations, medicalHistory, redFlags } = state;

  // Nitrates: absolute contraindication
  if (medications.takesNitrates) {
    alerts.push({
      severity: "stop",
      code: "NITRATE",
      message: "Patient takes a prescribed nitrate. CANNOT supply a PDE5 inhibitor",
      detail:
        "Concurrent use of organic nitrates in any form (e.g. GTN, isosorbide mononitrate/dinitrate) or nitric oxide donors (e.g. amyl nitrite) is an absolute contraindication due to risk of severe, potentially fatal hypotension.",
    });
  }

  if (medications.takesNicorandil) {
    alerts.push({
      severity: "stop",
      code: "NICORANDIL",
      message: "Patient takes nicorandil",
      detail:
        "Nicorandil is a nitric oxide donor. Combined with a PDE5 inhibitor it causes profound, prolonged and potentially fatal hypotension, exactly as an organic nitrate does. Absolute contraindication in both arms.",
    });
  }

  if (medications.usesPoppers) {
    alerts.push({
      severity: "stop",
      code: "POPPERS",
      message: "Patient uses poppers (amyl or alkyl nitrite)",
      detail:
        "Absolute contraindication. Explain that it is the combination that is dangerous, not either one alone, and that the risk persists for as long as the tablet is in his system: up to 36 hours for tadalafil. Do not supply while he is unwilling to stop.",
    });
  }

  if (observations.exerciseTolerance === "no" || observations.exerciseTolerance === "unknown") {
    alerts.push({
      severity: "stop",
      code: "CV_FITNESS",
      message: "Fails, or cannot answer, the cardiovascular fitness question",
      detail:
        "PGD v006 Appendix 1: the patient must be able to walk a mile on the flat in about 20 minutes, or climb two flights of stairs briskly, without chest pain and without stopping for breath. Sexual activity carries a comparable cardiac workload. Refer to the GP for cardiovascular assessment.",
    });
  }

  if (observations.symptomsOnExertionOrSex) {
    alerts.push({
      severity: "stop",
      code: "CV_SYMPTOMS",
      message: "Chest pain, breathlessness or palpitations on exertion or during sex",
      detail: "Do not supply. Refer for cardiovascular assessment. This is the presentation the fitness question exists to catch.",
    });
  }

  // Riociguat
  if (medications.takesRiociguat) {
    alerts.push({
      severity: "stop",
      code: "RIOCIGUAT",
      message: "Patient takes riociguat, CANNOT supply PDE5 inhibitor",
      detail:
        "Concurrent use of riociguat or any other soluble guanylate cyclase stimulator is contraindicated with PDE5 inhibitors.",
    });
  }

  // Both arms excluded by medicines: ritonavir/cobicistat bars sildenafil, doxazosin bars tadalafil
  if (medications.takesRitonavirOrCobicistat && medications.takesDoxazosin) {
    alerts.push({
      severity: "stop",
      code: "BOTH_ARMS_EXCLUDED",
      message: "Ritonavir or cobicistat excludes sildenafil and doxazosin excludes tadalafil",
      detail: "Neither arm of this PGD can be used. Refer to the GP.",
    });
  }

  if (medications.takesOtherPDE5Inhibitor) {
    alerts.push({
      severity: "stop",
      code: "OTHER_PDE5",
      message: "Already taking another PDE5 inhibitor",
      detail:
        "Including one obtained online or from another supplier. Do not add a second. Excluded under PGD v006.",
    });
  }

  if (medicalHistory.priapismHistory) {
    alerts.push({
      severity: "stop",
      code: "PRIAPISM_HISTORY",
      message: "Previous priapism, or an erection lasting more than 4 hours on any previous PDE5 inhibitor",
      detail: "Excluded under PGD v006. Refer for specialist assessment.",
    });
  }

  if (redFlags.suddenOnsetSecondaryCause) {
    alerts.push({
      severity: "stop",
      code: "SUDDEN_ONSET_SECONDARY",
      message: "Erectile dysfunction of sudden onset following trauma, surgery or a new medicine, or accompanied by penile pain or deformity",
      detail: "Excluded. Refer for a diagnosis rather than treating the symptom.",
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
        message: `Blood pressure ${observations.systolicBP}/${observations.diastolicBP} mmHg, CANNOT supply`,
        detail:
          "Hypotension (BP below 90/50 mmHg, measured today) is an exclusion. The patient should be referred to their GP for further assessment.",
      });
    }

    // Blood pressure — uncontrolled hypertension
    if (observations.systolicBP > 170 || observations.diastolicBP > 100) {
      alerts.push({
        severity: "stop",
        code: "HYPERTENSION",
        message: `Blood pressure ${observations.systolicBP}/${observations.diastolicBP} mmHg, CANNOT supply`,
        detail:
          "Uncontrolled hypertension (BP above 170/100 mmHg, measured today) is an exclusion. The patient should be referred to their GP for blood pressure management.",
      });
    }
  }

  // Recent MI or stroke (within 6 months)
  if (medicalHistory.recentMIOrStroke) {
    alerts.push({
      severity: "stop",
      code: "RECENT_MI_STROKE",
      message: "Recent MI or stroke within 6 months, CANNOT supply",
      detail:
        "Patients who have had a myocardial infarction or stroke within the last 6 months are excluded. Refer to GP/cardiologist.",
    });
  }

  // Severe hepatic impairment
  if (medicalHistory.hepaticImpairment === "severe") {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment (Child-Pugh C), CANNOT supply",
      detail:
        "Severe hepatic impairment is an exclusion for both sildenafil and tadalafil. Refer to GP.",
    });
  }

  // NAION history
  if (medicalHistory.naionHistory) {
    alerts.push({
      severity: "stop",
      code: "NAION",
      message: "Previous NAION, CANNOT supply PDE5 inhibitor",
      detail:
        "Previous episode of non-arteritic anterior ischaemic optic neuropathy (NAION) is a contraindication. Refer to ophthalmology/GP.",
    });
  }

  // Unstable angina
  if (medicalHistory.unstableAngina) {
    alerts.push({
      severity: "stop",
      code: "UNSTABLE_ANGINA",
      message: "Unstable angina, or angina during sexual activity, CANNOT supply",
      detail:
        "Sexual activity is inadvisable in patients with unstable angina. Refer to cardiology/GP.",
    });
  }

  // Severe heart failure
  if (medicalHistory.severeHeartFailure) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HF",
      message: "Heart failure of NYHA class 2 or greater in the last 6 months, CANNOT supply",
      detail:
        "Excluded under PGD v006 (Cialis SmPC 4.3). Refer to cardiology/GP.",
    });
  }

  if (medicalHistory.structuralHeartDisease) {
    alerts.push({
      severity: "stop",
      code: "STRUCTURAL_HEART",
      message: "Hypertrophic cardiomyopathy, significant aortic stenosis or other moderate to severe valve disease, or a murmur of unknown cause",
      detail: "Excluded under PGD v006 (BSSM high-risk group). Refer to cardiology/GP.",
    });
  }

  // Uncontrolled arrhythmias
  if (medicalHistory.uncontrolledArrhythmias) {
    alerts.push({
      severity: "stop",
      code: "ARRHYTHMIAS",
      message: "Uncontrolled arrhythmias, CANNOT supply",
      detail:
        "Sexual activity is inadvisable in patients with uncontrolled arrhythmias. Refer to cardiology/GP.",
    });
  }

  // Hereditary retinal disorders
  if (medicalHistory.retinalDisorders) {
    alerts.push({
      severity: "stop",
      code: "RETINAL",
      message: "Hereditary degenerative retinal disorder, CANNOT supply",
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
        message: "Patient not stable on alpha-blocker, stabilise first",
        detail:
          "The patient must be stable on his alpha-blocker before starting. Defer supply.",
      });
    } else {
      alerts.push({
        severity: "caution",
        code: "ALPHA_BLOCKER",
        message: "Alpha-blocker: sildenafil START AT 25mg; tadalafil on-demand 10mg (do not exceed until tolerance established), once-daily 2.5mg",
        detail:
          "Do not start sildenafil at 50mg. Record which alpha-blocker and that he is stable on it. Doxazosin excludes the tadalafil arm.",
      });
    }
  }

  if (medications.takesRitonavirOrCobicistat) {
    alerts.push({
      severity: "caution",
      code: "RITONAVIR",
      message: "Ritonavir or cobicistat: sildenafil arm excluded",
      detail:
        "The sildenafil dose must not exceed 25mg in 48 hours and cannot be titrated under this PGD. Tadalafil on-demand only, not exceeding 10mg in any 72 hour period (potent CYP3A4 inhibitor).",
    });
  }

  if (medications.takesDoxazosin) {
    alerts.push({
      severity: "caution",
      code: "DOXAZOSIN",
      message: "Doxazosin: tadalafil arm excluded",
      detail: "The combination with tadalafil is not recommended in the SmPC. Use the sildenafil arm (start at 25mg, stable on the alpha-blocker first) or refer.",
    });
  }

  // CYP3A4 inhibitors
  if (medications.takesCYP3A4Inhibitors) {
    alerts.push({
      severity: "caution",
      code: "CYP3A4",
      message: "CYP3A4 inhibitor: sildenafil start at 25mg; tadalafil on-demand not more than 10mg in any 72 hours",
      detail:
        "For example erythromycin, clarithromycin, ketoconazole or itraconazole. Ritonavir and cobicistat exclude the sildenafil arm. Record the inhibitor and the starting dose chosen.",
    });
  }

  // Age over 65
  if (patient.age !== null && patient.age >= 65) {
    alerts.push({
      severity: "caution",
      code: "AGE_65",
      message: "Aged 65 or over: sildenafil start at 25mg; tadalafil on-demand 10mg rather than escalating, once-daily 2.5mg",
      detail:
        "PGD v006 dose reduction for the over-65s. Record the starting dose chosen.",
    });
  }

  // Mild-moderate hepatic impairment
  if (medicalHistory.hepaticImpairment === "mild-moderate") {
    alerts.push({
      severity: "caution",
      code: "HEPATIC_MILD_MOD",
      message: "Mild to moderate hepatic impairment (Child-Pugh A or B): sildenafil start at 25mg; tadalafil on-demand not more than 10mg",
      detail:
        "Record the impairment and the starting dose chosen as a result.",
    });
  }

  // Severe renal impairment
  if (medicalHistory.renalImpairment === "severe") {
    alerts.push({
      severity: "caution",
      code: "RENAL_SEVERE",
      message: "Severe renal impairment (creatinine clearance below 30 mL/min): sildenafil start at 25mg; tadalafil once-daily excluded, on-demand not more than 10mg",
      detail:
        "PGD v006. Record the impairment and the starting dose chosen as a result.",
    });
  }

  // Moderate renal impairment
  if (medicalHistory.renalImpairment === "moderate") {
    alerts.push({
      severity: "caution",
      code: "RENAL_MODERATE",
      message: "Moderate renal impairment (creatinine clearance 30 to 50 mL/min): tadalafil once-daily start at 2.5mg",
      detail:
        "On-demand dosing is unaffected. Record the impairment and the starting dose chosen.",
    });
  }

  if (medicalHistory.cardiovascularDisease && !medicalHistory.lastCvReviewDate.trim()) {
    alerts.push({
      severity: "caution",
      code: "CV_REVIEW_DATE",
      message: "Known cardiovascular disease: record the date of the last cardiovascular review where known",
      detail: "Where he has not had a recent check, recommend one and record that you did.",
    });
  }

  // Penile deformity
  if (medicalHistory.penileDeformity) {
    alerts.push({
      severity: "caution",
      code: "PENILE_DEFORMITY",
      message: "Anatomical penile deformity, use with caution",
      detail:
        "Conditions such as angulation, cavernosal fibrosis, or Peyronie's disease require caution with PDE5 inhibitors.",
    });
  }

  // Conditions predisposing to priapism
  if (medicalHistory.sickleCell) {
    alerts.push({
      severity: "caution",
      code: "PRIAPISM_RISK",
      message: "Sickle cell disease, multiple myeloma or leukaemia: increased priapism risk",
      detail:
        "Conditions predisposing to priapism (sickle cell anaemia, multiple myeloma, leukaemia) require caution. Ensure patient understands priapism warning.",
    });
  }

  // Bleeding disorders / peptic ulceration
  if (medicalHistory.bleedingDisorders) {
    alerts.push({
      severity: "caution",
      code: "BLEEDING",
      message: "Active peptic ulceration or bleeding disorder, use with caution",
      detail:
        "PDE5 inhibitors may exacerbate bleeding in patients with active peptic ulceration or bleeding disorders.",
    });
  }

  // Cardiovascular disease (general)
  if (medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "CVD_RISK",
      message: "Known cardiovascular disease: apply the Appendix 1 fitness assessment and record what it is",
      detail:
        "Ensure sexual activity is not inadvisable. Record the condition and the date of the last cardiovascular review.",
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
      message: "Pelvic or perineal trauma, consider referral",
      detail:
        "History of pelvic or perineal trauma may indicate structural cause. Consider urology referral.",
    });
  }

  if (redFlags.penileAnatomicalAbnormality || medicalHistory.penileDeformity) {
    alerts.push({
      severity: "red-flag",
      code: "PENILE_ABNORMALITY",
      message: "Penile anatomical abnormality (e.g. Peyronie's), consider referral",
      detail:
        "Penile anatomical abnormalities may require specialist assessment. Consider urology referral.",
    });
  }

  if (medicalHistory.hypogonadism) {
    alerts.push({
      severity: "red-flag",
      code: "HYPOGONADISM",
      message: "Suspected hypogonadism, refer for endocrine assessment",
      detail:
        "Unexplained hypogonadism or suspected endocrine disorder requires specialist assessment. Check early morning testosterone.",
    });
  }

  if (medicalHistory.psychiatricIssues && complaint.psychosexualFactors) {
    alerts.push({
      severity: "red-flag",
      code: "PSYCHOSEXUAL",
      message: "Complex psychiatric/psychosexual issues, consider referral",
      detail:
        "Complex psychiatric or psychosexual issues may require specialist counselling or therapy alongside pharmacological treatment.",
    });
  }

  if (redFlags.previousPDE5Failure) {
    alerts.push({
      severity: "red-flag",
      code: "PDE5_FAILURE",
      message: "Failed 2 PDE5 inhibitors at max dose, refer to specialist",
      detail:
        "Failure to respond to two different PDE5 inhibitors at maximum dose after adequate trial (6-8 attempts each) warrants referral to urology.",
    });
  }

  // Sudden onset may suggest psychogenic cause
  if (complaint.onsetType === "sudden") {
    alerts.push({
      severity: "red-flag",
      code: "SUDDEN_ONSET",
      message: "Sudden onset ED: ask whether it followed trauma, surgery or a new medicine, or comes with penile pain or deformity",
      detail:
        "Those presentations are exclusions (Red Flags step). Otherwise sudden onset is more suggestive of a psychogenic cause; consider psychosexual assessment alongside treatment.",
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

  if (patient.age !== null && patient.age >= 65) reasons.push("age 65 or over");
  if (medicalHistory.hepaticImpairment === "mild-moderate")
    reasons.push("hepatic impairment");
  if (medicalHistory.renalImpairment === "severe")
    reasons.push("severe renal impairment");
  if (medications.takesAlphaBlockers) reasons.push("alpha-blocker use");
  if (medications.takesCYP3A4Inhibitors)
    reasons.push("CYP3A4 inhibitor use");

  // Sildenafil arm excluded by ritonavir or cobicistat: recommend tadalafil on-demand 10mg
  if (medications.takesRitonavirOrCobicistat) {
    return {
      medicine: "tadalafil",
      dosingRegimen: "on-demand",
      dose: "10mg",
      reason: "Ritonavir or cobicistat excludes the sildenafil arm. Tadalafil on-demand, not exceeding 10mg in any 72 hour period.",
    };
  }

  if (needsLowerDose) {
    return {
      medicine: "sildenafil",
      dosingRegimen: "on-demand",
      dose: "25mg",
      reason: `START AT 25mg (PGD v006) due to: ${reasons.join(", ")}`,
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

/** Which arms of PGD v006 remain open for this patient, and why not. */
export interface ArmAvailability {
  sildenafil: boolean;
  tadalafil: boolean;
  sildenafilReason: string;
  tadalafilReason: string;
}

export function getArmAvailability(state: EDConsultationState): ArmAvailability {
  const { medications } = state;
  return {
    sildenafil: !medications.takesRitonavirOrCobicistat,
    tadalafil: !medications.takesDoxazosin,
    sildenafilReason: medications.takesRitonavirOrCobicistat
      ? "Excluded: ritonavir or cobicistat (sildenafil cannot exceed 25mg in 48 hours and cannot be titrated under this PGD)"
      : "",
    tadalafilReason: medications.takesDoxazosin
      ? "Excluded: doxazosin (combination not recommended in the SmPC)"
      : "",
  };
}

/** Dose limits from the PGD v006 cautions. Starting-dose rules apply to a
 *  patient who has not used the medicine before; hard caps always apply. */
export interface DoseCaps {
  sildenafilMaxMg: number;
  tadalafilOnDemandMaxMg: number;
  tadalafilDailyMaxMg: number;
  tadalafilDailyAllowed: boolean;
  reasons: string[];
}

export function getDoseCaps(state: EDConsultationState): DoseCaps {
  const { medications, medicalHistory, patient, complaint } = state;
  const caps: DoseCaps = {
    sildenafilMaxMg: 100,
    tadalafilOnDemandMaxMg: 20,
    tadalafilDailyMaxMg: 5,
    tadalafilDailyAllowed: true,
    reasons: [],
  };
  const firstUse = !complaint.previousTreatment;

  // Hard caps, whatever the history
  if (medicalHistory.hepaticImpairment === "mild-moderate") {
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.reasons.push("hepatic impairment: tadalafil on-demand not more than 10mg");
  }
  if (medications.takesCYP3A4Inhibitors || medications.takesRitonavirOrCobicistat) {
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.reasons.push("CYP3A4 inhibitor: tadalafil on-demand not more than 10mg in any 72 hours");
  }
  if (medicalHistory.renalImpairment === "severe") {
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.tadalafilDailyAllowed = false;
    caps.reasons.push("severe renal impairment: tadalafil once-daily excluded, on-demand not more than 10mg");
  }

  // Starting-dose rules for a patient new to the medicine
  const startLow =
    (patient.age !== null && patient.age >= 65) ||
    medicalHistory.hepaticImpairment === "mild-moderate" ||
    medicalHistory.renalImpairment === "severe" ||
    medications.takesAlphaBlockers ||
    medications.takesCYP3A4Inhibitors;
  if (firstUse && startLow) {
    caps.sildenafilMaxMg = Math.min(caps.sildenafilMaxMg, 25);
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.tadalafilDailyMaxMg = Math.min(caps.tadalafilDailyMaxMg, 2.5);
    caps.reasons.push("starting dose: sildenafil 25mg, tadalafil on-demand 10mg, once-daily 2.5mg (over 65, alpha-blocker, CYP3A4 inhibitor, hepatic or renal impairment)");
  }
  if (firstUse && medicalHistory.renalImpairment === "moderate") {
    caps.tadalafilDailyMaxMg = Math.min(caps.tadalafilDailyMaxMg, 2.5);
    caps.reasons.push("moderate renal impairment: tadalafil once-daily start at 2.5mg");
  }
  return caps;
}

function mg(dose: string): number {
  return parseFloat(dose.replace("mg", ""));
}

export function getAvailableDoses(
  medicine: string,
  regimen: string,
  caps?: DoseCaps
): readonly string[] {
  if (medicine === "sildenafil")
    return SILDENAFIL_DOSES.filter((d) => !caps || mg(d) <= caps.sildenafilMaxMg);
  if (medicine === "tadalafil" && regimen === "daily")
    return TADALAFIL_DAILY_DOSES.filter((d) => !caps || mg(d) <= caps.tadalafilDailyMaxMg);
  if (medicine === "tadalafil")
    return TADALAFIL_ON_DEMAND_DOSES.filter((d) => !caps || mg(d) <= caps.tadalafilOnDemandMaxMg);
  return [];
}

export function getMaxQuantity(
  medicine: string,
  regimen: string
): number {
  if (medicine === "tadalafil" && regimen === "daily") return 28;
  return 8;
}

import type {
  EDConsultationState,
  ClinicalAlert,
  DoseRecommendation,
} from "./ed-types";

/** Doxazosin is an alpha-blocker; ticking it implies alpha-blocker use even
 *  if the parent box has been cleared. */
export function takesAnyAlphaBlocker(medications: EDConsultationState["medications"]): boolean {
  return medications.takesAlphaBlockers || medications.takesDoxazosin;
}

/** The document says "over 65". */
export function isOver65(age: number | null): boolean {
  return age !== null && age > 65;
}

// ══════════════════════════════════════════════════════════════
// EXCLUSION CHECKS — Hard stops: cannot supply
// ══════════════════════════════════════════════════════════════

export function checkExclusions(state: EDConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const { medications, observations, medicalHistory, redFlags } = state;

  // First exclusion in both arms. Was a free-text allergies box with no gate
  // (adversarial review, 11 Sep 2026).
  if (medications.hypersensitivityPDE5) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY",
      message: "Known hypersensitivity to sildenafil, tadalafil or any excipient",
      detail:
        "Exclusion in both arms of PGD v008. Do not supply. Refer to the GP.",
    });
  }

  // The document says the patient MUST be stable on his alpha-blocker before
  // starting. This was a caution that said "defer supply" and deferred nothing.
  if (takesAnyAlphaBlocker(medications) && !medications.alphaBlockerStable) {
    alerts.push({
      severity: "stop",
      code: "ALPHA_UNSTABLE",
      message: "Not yet stable on his alpha-blocker: do not supply",
      detail:
        "PGD v008 (both arms): the patient must be stable on his alpha-blocker before starting a PDE5 inhibitor. Defer supply until he is, and record it.",
    });
  }

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
        "PGD v008 Appendix 1: the patient must be able to walk a mile on the flat in about 20 minutes, or climb two flights of stairs briskly, without chest pain and without stopping for breath. Sexual activity carries a comparable cardiac workload. Refer to the GP for cardiovascular assessment.",
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
        "Including one obtained online or from another supplier. Do not add a second. Excluded under PGD v008.",
    });
  }

  if (medicalHistory.priapismHistory) {
    alerts.push({
      severity: "stop",
      code: "PRIAPISM_HISTORY",
      message: "Previous priapism, or an erection lasting more than 4 hours on any previous PDE5 inhibitor",
      detail: "Excluded under PGD v008. Refer for specialist assessment.",
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
        "Excluded under PGD v008 (Cialis SmPC 4.3). Refer to cardiology/GP.",
    });
  }

  if (medicalHistory.structuralHeartDisease) {
    alerts.push({
      severity: "stop",
      code: "STRUCTURAL_HEART",
      message: "Hypertrophic cardiomyopathy, significant aortic stenosis or other moderate to severe valve disease, or a murmur of unknown cause",
      detail: "Excluded under PGD v008 (BSSM high-risk group). Refer to cardiology/GP.",
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

  // Alpha-blocker use (not stable is a stop, in checkExclusions)
  if (takesAnyAlphaBlocker(medications) && medications.alphaBlockerStable) {
    alerts.push({
      severity: "caution",
      code: "ALPHA_BLOCKER",
      message: "Alpha-blocker: sildenafil START AT 25mg; tadalafil on-demand 10mg (do not exceed until tolerance established), once-daily 2.5mg",
      detail:
        "Do not start sildenafil at 50mg. Record which alpha-blocker and that he is stable on it. Doxazosin excludes the tadalafil arm.",
    });
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

  // Age over 65 (the document says "over 65")
  if (isOver65(patient.age)) {
    alerts.push({
      severity: "caution",
      code: "AGE_65",
      message: "Aged over 65: sildenafil start at 25mg; tadalafil on-demand 10mg rather than escalating, once-daily 2.5mg",
      detail:
        "PGD v008 dose reduction for the over-65s. Record the starting dose chosen.",
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
        "PGD v008. Record the impairment and the starting dose chosen as a result.",
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
    isOver65(patient.age) ||
    medicalHistory.hepaticImpairment === "mild-moderate" ||
    medicalHistory.renalImpairment === "severe" ||
    takesAnyAlphaBlocker(medications) ||
    medications.takesCYP3A4Inhibitors;

  const reasons: string[] = [];

  if (isOver65(patient.age)) reasons.push("age over 65");
  if (medicalHistory.hepaticImpairment === "mild-moderate")
    reasons.push("hepatic impairment");
  if (medicalHistory.renalImpairment === "severe")
    reasons.push("severe renal impairment");
  if (takesAnyAlphaBlocker(medications)) reasons.push("alpha-blocker use");
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
      reason: `START AT 25mg (PGD v008) due to: ${reasons.join(", ")}`,
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

/** Which arms of PGD v008 remain open for this patient, and why not. */
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

/** Dose limits from the PGD v008 cautions and dose rows.
 *
 *  Starting-dose rules apply to a patient who has not used THAT medicine
 *  before: the document's dose rows give one starting dose (sildenafil 50mg,
 *  or 25mg with a dose-adjustment factor; tadalafil on-demand 10mg; once-daily
 *  2.5mg) and allow titration "on efficacy and tolerability", which needs a
 *  previous, tolerated supply of the same medicine. Ticking "previous
 *  treatment" for a pump or a herbal product used to lift every cap
 *  (adversarial review, 11 Sep 2026). Hard caps always apply. */
export interface DoseCaps {
  sildenafilMinMg: number;
  sildenafilMaxMg: number;
  tadalafilOnDemandMinMg: number;
  tadalafilOnDemandMaxMg: number;
  tadalafilDailyMinMg: number;
  tadalafilDailyMaxMg: number;
  tadalafilDailyAllowed: boolean;
  /** Tadalafil on-demand with a potent CYP3A4 inhibitor: 10mg in 72 hours. */
  tadalafil72HourRule: boolean;
  reasons: string[];
}

/** Which medicine, if any, the patient has previously taken at a stated dose
 *  and tolerated. Only that arm may be titrated. */
export function priorToleratedMedicine(
  complaint: EDConsultationState["complaint"]
): "sildenafil" | "tadalafil-on-demand" | "tadalafil-daily" | "" {
  if (!complaint.previousTreatment) return "";
  if (!complaint.previousPDE5Tolerated) return "";
  if (!complaint.previousPDE5Dose.trim()) return "";
  const p = complaint.previousPDE5Inhibitor;
  if (p === "sildenafil" || p === "tadalafil-on-demand" || p === "tadalafil-daily") return p;
  return "";
}

export function getDoseCaps(state: EDConsultationState): DoseCaps {
  const { medications, medicalHistory, patient, complaint } = state;
  const caps: DoseCaps = {
    sildenafilMinMg: 25,
    sildenafilMaxMg: 100,
    tadalafilOnDemandMinMg: 5,
    tadalafilOnDemandMaxMg: 20,
    tadalafilDailyMinMg: 2.5,
    tadalafilDailyMaxMg: 5,
    tadalafilDailyAllowed: true,
    tadalafil72HourRule: false,
    reasons: [],
  };
  const prior = priorToleratedMedicine(complaint);
  const sildenafilFirstUse = prior !== "sildenafil";
  const tadalafilOnDemandFirstUse = prior !== "tadalafil-on-demand";
  const tadalafilDailyFirstUse = prior !== "tadalafil-daily";

  // Hard caps, whatever the history
  if (medicalHistory.hepaticImpairment === "mild-moderate") {
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.reasons.push("hepatic impairment: tadalafil on-demand not more than 10mg");
  }
  if (medications.takesCYP3A4Inhibitors || medications.takesRitonavirOrCobicistat) {
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.tadalafil72HourRule = true;
    caps.reasons.push("potent CYP3A4 inhibitor: tadalafil on-demand not more than 10mg in any 72 hours (quantity capped at 4)");
  }
  if (medicalHistory.renalImpairment === "severe") {
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.tadalafilDailyAllowed = false;
    caps.reasons.push("severe renal impairment: tadalafil once-daily excluded, on-demand not more than 10mg");
  }

  // Starting-dose rules for a patient new to the medicine
  const startLow =
    isOver65(patient.age) ||
    medicalHistory.hepaticImpairment === "mild-moderate" ||
    medicalHistory.renalImpairment === "severe" ||
    takesAnyAlphaBlocker(medications) ||
    medications.takesCYP3A4Inhibitors;

  if (sildenafilFirstUse) {
    const start = startLow ? 25 : 50;
    caps.sildenafilMinMg = start;
    caps.sildenafilMaxMg = Math.min(caps.sildenafilMaxMg, start);
    caps.reasons.push(
      startLow
        ? "first sildenafil supply: START AT 25mg (over 65, alpha-blocker, CYP3A4 inhibitor, hepatic or severe renal impairment)"
        : "first sildenafil supply: starting dose 50mg (titration needs a previous tolerated supply of sildenafil)"
    );
  }
  if (tadalafilOnDemandFirstUse) {
    caps.tadalafilOnDemandMinMg = 10;
    caps.tadalafilOnDemandMaxMg = Math.min(caps.tadalafilOnDemandMaxMg, 10);
    caps.reasons.push("first tadalafil on-demand supply: starting dose 10mg");
  }
  if (tadalafilDailyFirstUse || medicalHistory.renalImpairment === "moderate" || startLow) {
    caps.tadalafilDailyMinMg = 2.5;
    caps.tadalafilDailyMaxMg = Math.min(caps.tadalafilDailyMaxMg, 2.5);
    caps.reasons.push(
      tadalafilDailyFirstUse
        ? "first tadalafil once-daily supply: start at 2.5mg"
        : "tadalafil once-daily: start at 2.5mg (moderate renal impairment, over 65, alpha-blocker, CYP3A4 inhibitor, hepatic impairment)"
    );
  }
  // A patient who has titrated before may be decreased on tolerability; the
  // floor is the document's lowest strength, so no further change.
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
    return SILDENAFIL_DOSES.filter(
      (d) => !caps || (mg(d) <= caps.sildenafilMaxMg && mg(d) >= caps.sildenafilMinMg)
    );
  if (medicine === "tadalafil" && regimen === "daily")
    return TADALAFIL_DAILY_DOSES.filter(
      (d) => !caps || (mg(d) <= caps.tadalafilDailyMaxMg && mg(d) >= caps.tadalafilDailyMinMg)
    );
  if (medicine === "tadalafil")
    return TADALAFIL_ON_DEMAND_DOSES.filter(
      (d) => !caps || (mg(d) <= caps.tadalafilOnDemandMaxMg && mg(d) >= caps.tadalafilOnDemandMinMg)
    );
  return [];
}

export function getMaxQuantity(
  medicine: string,
  regimen: string,
  caps?: DoseCaps
): number {
  if (medicine === "tadalafil" && regimen === "daily") return 28;
  // 10mg in any 72 hours: 8 tablets would be 24 days of daily use. Four is
  // about a month at the permitted frequency.
  if (medicine === "tadalafil" && caps?.tadalafil72HourRule) return 4;
  return 8;
}

/** True when the tadalafil on-demand 72-hour rule applies to this supply. */
export function tadalafil72HourApplies(state: EDConsultationState): boolean {
  const sel = state.medicineSelection;
  return (
    sel.medicine === "tadalafil" &&
    sel.dosingRegimen === "on-demand" &&
    getDoseCaps(state).tadalafil72HourRule
  );
}

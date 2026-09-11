// ─── BPH (Tamsulosin) Clinical Logic ───
// Aligned to the Tamsulosin 400mcg MR capsules for BPH PGD, version 003,
// issued 11 September 2026.

import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { BPHConsultationState } from "./bph-types";

export const MAX_CAPSULES_PER_SUPPLY = 28;
export const MAX_MONTHS_CONTINUOUS = 12;

// ─── Get all clinical alerts ───

export function getAllAlerts(state: BPHConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const mh = state.medicalHistory;
  const rf = state.redFlags;
  const ci = state.contraindications;

  // Hard stop: Not male. Raised once step 0 has been left; on step 0 the
  // shared validation asks for the confirmation, so a blank form does not
  // open with an exclusion on screen.
  if (!state.patient.maleConfirmed && state.currentStep > 0) {
    alerts.push({
      severity: "stop",
      code: "BPH_GENDER",
      message: "This PGD is for male patients only",
      detail: "Tamsulosin is indicated for BPH in males.",
    });
  }

  // Hard stop: under 45
  if (state.patient.age !== null && state.patient.age < 45) {
    alerts.push({
      severity: "stop",
      code: "BPH_AGE",
      message: "Aged under 45: lower urinary tract symptoms at this age are unlikely to be BPH",
      detail: "Excluded under PGD v003. Refer to the GP for diagnosis.",
    });
  }

  // Inclusion: IPSS 8 or above, at INITIATION. A continuation patient is
  // required to have improved by 3 or more points; a man who started at 10
  // and is now 6 is the success the PGD wants, not an exclusion
  // (adversarial review, 11 Sep 2026).
  if (
    state.medicineSupply.supplyType !== "continuation" &&
    state.lutsAssessment.ipssScore !== null &&
    state.lutsAssessment.ipssScore < 8
  ) {
    alerts.push({
      severity: "stop",
      code: "BPH_IPSS",
      message: `IPSS ${state.lutsAssessment.ipssScore}: below the moderate threshold`,
      detail: "Inclusion requires an IPSS of moderate severity or above (8 or more). Advise on conservative measures and watchful waiting; refer if concerned.",
    });
  }

  // ─── Exclusions (PGD v003) ───
  if (mh.hypersensitivity) {
    alerts.push({ severity: "stop", code: "BPH_HYPERSENSITIVITY", message: "Known hypersensitivity to tamsulosin or any excipient", detail: "Excluded. Refer." });
  }

  if (mh.orthostasisHistory) {
    alerts.push({
      severity: "stop",
      code: "BPH_ORTHOSTASIS",
      message: "History of orthostatic hypotension (blood pressure drop on standing)",
      detail: "Excluded under PGD v003. Tamsulosin can cause first-dose hypotension and syncope. Refer.",
    });
  }

  if (mh.severeHepaticImpairment) {
    alerts.push({ severity: "stop", code: "BPH_HEPATIC", message: "Severe hepatic impairment (Child-Pugh grade C)", detail: "Excluded. Refer." });
  }

  if (ci.otherAlphaBlocker) {
    alerts.push({ severity: "stop", code: "BPH_ALPHA", message: "Concurrent use of another alpha-1 adrenoceptor antagonist", detail: "Excluded. Do not add a second alpha-blocker. Refer." });
  }

  if (mh.plannedCataractSurgery) {
    alerts.push({
      severity: "stop",
      code: "BPH_CATARACT",
      message: "Planned cataract or glaucoma surgery",
      detail: "Excluded under PGD v003 because of the risk of intraoperative floppy iris syndrome (IFIS). Refer to the GP; the surgeon must be told of any alpha-blocker use.",
    });
  }

  if (mh.uncontrolledHypertension) {
    alerts.push({ severity: "stop", code: "BPH_HYPERTENSION", message: "Uncontrolled hypertension", detail: "Excluded. Refer." });
  }

  // Red flags: all exclusions, refer
  if (rf.acuteRetention) {
    alerts.push({
      severity: "stop",
      code: "BPH_RETENTION",
      message: "Acute urinary retention requiring catheterisation or in-patient management",
      detail: "Patient requires emergency urological assessment. Do not supply medicine.",
    });
  }

  if (rf.haematuria) {
    alerts.push({
      severity: "stop",
      code: "BPH_HAEMATURIA",
      message: "Visible or non-visible haematuria",
      detail: "Refer: urological investigation before any treatment of symptoms. Do not supply.",
    });
  }

  if (rf.urinaryTractInfection) {
    alerts.push({
      severity: "stop",
      code: "BPH_UTI",
      message: "Current or recurrent urinary tract infection, or dysuria with fever",
      detail: "Excluded. Refer.",
    });
  }

  if (rf.palpableBladder || rf.chronicRetentionSymptoms) {
    alerts.push({
      severity: "stop",
      code: "BPH_PALPABLE",
      message: "Palpable bladder, or symptoms suggesting chronic retention",
      detail: "Overflow incontinence, or a constant feeling of incomplete emptying with a poor stream. Refer for post-void residual measurement. Do not supply.",
    });
  }

  if (rf.psa4OrAbove) {
    alerts.push({
      severity: "stop",
      code: "BPH_PSA",
      message: "Known or suspected prostate cancer, an abnormal digital rectal examination, or a raised PSA",
      detail: "Refer to GP or urology. Do not supply.",
    });
  }

  if (mh.neurologicalBladderDisease) {
    alerts.push({
      severity: "stop",
      code: "BPH_NEURO",
      message: "Neurological disease affecting bladder function",
      detail: "Multiple sclerosis, Parkinson's disease, spinal cord disease, diabetic neuropathy. Excluded. Refer.",
    });
  }

  if (rf.weightLoss) {
    alerts.push({
      severity: "stop",
      code: "BPH_WEIGHT_LOSS",
      message: "Unexplained weight loss requires investigation",
      detail: "May indicate malignancy. Refer to GP for assessment.",
    });
  }

  if (rf.bonePain) {
    alerts.push({
      severity: "stop",
      code: "BPH_BONE_PAIN",
      message: "Bone pain requires investigation",
      detail: "May indicate metastatic disease. Refer to GP urgently.",
    });
  }

  // Symptoms never assessed by a GP or urologist
  if (state.currentStep >= 3 && !mh.previouslyAssessedByGp && !(mh.gpInformedToday && mh.patientAgreesGpWithin6Weeks)) {
    alerts.push({
      severity: "stop",
      code: "BPH_NOT_ASSESSED",
      message: "Symptoms not previously assessed by a GP or urologist",
      detail:
        "Excluded unless the GP is informed on the day of supply and the patient agrees to attend the GP within 6 weeks for examination and, where indicated, PSA testing. Record both.",
    });
  }

  // ─── Cautions (PGD v003) ───
  if (ci.takingAntihypertensives || (state.patient.age !== null && state.patient.age >= 65)) {
    alerts.push({
      severity: "caution",
      code: "BPH_ORTHO_RISK",
      message: "Orthostatic hypotension risk: elderly patient or concurrent antihypertensive medication",
      detail: "Advise the patient to sit or lie down if dizziness occurs. A history of orthostatic hypotension excludes.",
    });
  }

  if (mh.severeRenalImpairment) {
    alerts.push({ severity: "caution", code: "BPH_RENAL", message: "Renal impairment, eGFR below 10 mL/min/1.73m2", detail: "Use with caution." });
  }

  if (mh.mildModerateHepaticImpairment) {
    alerts.push({ severity: "caution", code: "BPH_HEPATIC_MILD", message: "Mild to moderate hepatic impairment", detail: "Use with caution. Severe hepatic disease excludes." });
  }

  if (ci.takingPde5Inhibitor) {
    alerts.push({
      severity: "caution",
      code: "BPH_PDE5",
      message: "Concurrent PDE5 inhibitor (sildenafil, tadalafil): additive hypotensive effects",
      detail: "Monitor blood pressure carefully. Counsel patient on dizziness and standing slowly.",
    });
  }

  if (mh.syncopeHistory) {
    alerts.push({
      severity: "caution",
      code: "BPH_SYNCOPE",
      message: "History of syncope or fainting: increased risk with tamsulosin",
      detail: "Consider discontinuation if syncope occurs. A history of orthostatic hypotension excludes.",
    });
  }

  // ─── Continuation gate (maximum treatment period) ───
  const ms = state.medicineSupply;
  if (ms.supplyType === "continuation") {
    const current = state.lutsAssessment.ipssScore;
    if (ms.previousIpss !== null && current !== null && ms.previousIpss - current < 3) {
      alerts.push({
        severity: "stop",
        code: "BPH_NO_IMPROVEMENT",
        message: `IPSS improved by ${ms.previousIpss - current} points: less than the 3 required`,
        detail: "No improvement at the 4 to 6 week review ends supply under this PGD. Refer to the GP.",
      });
    }
    if (!ms.gpExaminedSinceStart) {
      alerts.push({
        severity: "stop",
        code: "BPH_GP_EXAM",
        message: "Continuation requires that the patient has been examined by the GP",
        detail: "PGD v003 maximum treatment period. Do not continue supply until the GP has examined the patient.",
      });
    }
    if (ms.monthsOnTreatment !== null && ms.monthsOnTreatment >= MAX_MONTHS_CONTINUOUS) {
      alerts.push({
        severity: "stop",
        code: "BPH_12_MONTHS",
        message: "12 months of continuous treatment reached",
        detail: "The GP takes over prescribing after 12 months. No further supply under this PGD.",
      });
    }
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: BPHConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: BPHConsultationState
): DoseRecommendation | null {
  if (!state.patient.maleConfirmed) return null;
  if (hasHardStops(state)) return null;

  return {
    medicine: "Tamsulosin 400 micrograms modified-release capsules",
    dose: "400 micrograms",
    frequency: "Once daily, after food, preferably with breakfast; swallow whole, do not crush, chew or open",
    dosingRegimen: "400 micrograms MR once daily after food. Up to 28 capsules per supply.",
    reason:
      state.medicineSupply.supplyType === "continuation"
        ? "Continuation after the 4 to 6 week review: IPSS improved by 3 or more and GP examination completed. Maximum 12 months' continuous treatment under this PGD."
        : "Initial 4-week supply for LUTS due to BPH (IPSS 8 or more). Review at 4 to 6 weeks.",
  };
}

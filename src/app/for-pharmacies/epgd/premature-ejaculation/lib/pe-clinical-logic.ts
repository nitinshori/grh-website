// ─── Premature Ejaculation (Dapoxetine) Clinical Logic ───

import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { PEConsultationState } from "./pe-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: PEConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stop: Not male. Raised once the patient step has been left; on
  // step 0 the shared validation asks for the confirmation instead, so a
  // blank form does not open with an exclusion on screen.
  if (!state.patient.maleConfirmed && state.currentStep > 0) {
    alerts.push({
      severity: "stop",
      code: "PE_GENDER",
      message: "This PGD is for male patients only",
      detail: "Dapoxetine is not indicated in females.",
    });
  }

  // Hard stop: Age <18 or >64
  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "PE_AGE_MIN",
      message: "Patient must be 18 years or older",
      detail: "Dapoxetine is not recommended in patients under 18.",
    });
  }

  if (state.patient.age !== null && state.patient.age > 64) {
    alerts.push({
      severity: "stop",
      code: "PE_AGE_MAX",
      message: "This PGD is for patients 64 years or younger",
      detail: "Dapoxetine is not recommended in patients over 64.",
    });
  }

  // Hard stop: Cardiac disorder NYHA II-IV, significant valvular disease
  if (state.medicalHistory.cardiacDisorder) {
    alerts.push({
      severity: "stop",
      code: "PE_CARDIAC",
      message: "Significant cardiac disorder (NYHA class II to IV heart failure, or significant valvular disease) is an exclusion",
      detail: "Dapoxetine can reduce blood pressure. Refer to GP or cardiologist.",
    });
  }

  if (state.medicalHistory.conductionOrQT) {
    alerts.push({
      severity: "stop",
      code: "PE_QT",
      message: "Conduction abnormality or a condition that prolongs the QT interval is an exclusion",
      detail: "PGD v004. Do not supply. Refer.",
    });
  }

  if (state.medicalHistory.ischaemicHeartDisease) {
    alerts.push({
      severity: "stop",
      code: "PE_IHD",
      message: "History of ischaemic heart disease is an exclusion",
      detail: "PGD v004. Do not supply. Refer.",
    });
  }

  // Hard stop: Syncope or orthostatic hypotension
  if (state.medicalHistory.syncope) {
    alerts.push({
      severity: "stop",
      code: "PE_SYNCOPE",
      message: "History of syncope or orthostatic hypotension is an exclusion",
      detail: "Dapoxetine may cause orthostatic hypotension and syncope.",
    });
  }

  // Hard stop: Moderate or severe hepatic impairment (Child-Pugh B or C)
  if (state.medicalHistory.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "PE_LIVER",
      message: "Moderate or severe hepatic impairment (Child-Pugh class B or C) is an exclusion",
      detail: "The Priligy SmPC contraindicates moderate as well as severe impairment. Do not supply.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "stop",
      code: "PE_RENAL",
      message: "Moderate or severe renal impairment is an exclusion",
      detail: "PGD v004. Do not supply. Refer.",
    });
  }

  if (state.medicalHistory.bipolarOrMania) {
    alerts.push({
      severity: "stop",
      code: "PE_BIPOLAR",
      message: "History of bipolar disorder or mania is an exclusion",
      detail: "PGD v004. Do not supply. Refer.",
    });
  }

  if (state.currentMedications.potentCyp3a4Inhibitor) {
    alerts.push({
      severity: "stop",
      code: "PE_CYP3A4",
      message: "Concurrent potent CYP3A4 inhibitor (ketoconazole, ritonavir, etc.) is an exclusion",
      detail: "PGD v004. Do not supply.",
    });
  }

  // Hard stop: Uncontrolled epilepsy
  if (state.medicalHistory.uncontrolledEpilepsy) {
    alerts.push({
      severity: "stop",
      code: "PE_EPILEPSY",
      message: "Uncontrolled epilepsy is a contraindication",
      detail: "Dapoxetine may lower seizure threshold. Refer to neurologist.",
    });
  }

  // Hard stop: serotonergic medicines, now or within the last 14 days
  if (state.currentMedications.maoisOrSsrisOrSnris) {
    alerts.push({
      severity: "stop",
      code: "PE_MAOI_SSRI",
      message: "Serotonergic medicine now or within the last 14 days is an exclusion",
      detail:
        "MAOIs, SSRIs, SNRIs, tricyclic antidepressants, tramadol, triptans, linezolid, lithium, L-tryptophan and St John's wort. Serotonin syndrome risk. Refer to GP.",
    });
  }

  if (state.currentMedications.thioridazine) {
    alerts.push({
      severity: "stop",
      code: "PE_THIORIDAZINE",
      message: "Concomitant thioridazine is a contraindication",
      detail: "Risk of QT prolongation and arrhythmias. Do not supply.",
    });
  }

  // Cautions (PGD v004)
  if (state.medicalHistory.mildHepaticImpairment) {
    alerts.push({ severity: "caution", code: "PE_LIVER_MILD", message: "Mild hepatic impairment (Child-Pugh class A): use with caution", detail: "Moderate or severe impairment excludes." });
  }
  if (state.currentMedications.moderateCyp3a4Inhibitor) {
    alerts.push({ severity: "caution", code: "PE_CYP3A4_MOD", message: "Moderate CYP3A4 inhibitor may increase dapoxetine concentrations", detail: "Use with caution; do not increase to 60mg." });
  }
  if (state.medicalHistory.cyp2d6PoorMetaboliser) {
    alerts.push({ severity: "caution", code: "PE_CYP2D6", message: "CYP2D6 poor metaboliser may require dose adjustment", detail: "Use with caution; do not increase to 60mg." });
  }
  if (state.medicalHistory.orthostaticRiskFactors) {
    alerts.push({ severity: "caution", code: "PE_ORTHO_RISK", message: "Risk factors for orthostatic hypotension", detail: "Advise to stand slowly. A history of syncope or orthostatic hypotension excludes." });
  }
  if (state.currentMedications.pde5Inhibitor) {
    alerts.push({ severity: "caution", code: "PE_PDE5", message: "Concomitant PDE5 inhibitor (sildenafil, tadalafil): increased hypotension risk", detail: "Counsel on dizziness and standing slowly." });
  }
  if (state.medicalHistory.bleedingDisorderOrAnticoagulant) {
    alerts.push({ severity: "caution", code: "PE_BLEEDING", message: "Bleeding disorder or concurrent anticoagulant therapy: increased bleeding risk", detail: "Use with caution." });
  }
  if (state.medicalHistory.seizureHistory) {
    alerts.push({ severity: "caution", code: "PE_SEIZURE", message: "History of seizures: dapoxetine may lower the seizure threshold", detail: "Use with caution. Uncontrolled epilepsy excludes." });
  }
  if (state.medicalHistory.hyponatraemiaRisk) {
    alerts.push({ severity: "caution", code: "PE_SODIUM", message: "Hyponatraemia risk: monitor sodium levels, particularly during the first 2 weeks", detail: "Use with caution." });
  }

  // Caution: a previous severe or sudden adverse reaction recorded on the
  // Contraindications step. Not an exclusion in PGD v004, but it was a field
  // nothing read (adversarial review, 11 Sep 2026).
  if (state.contraindications.hadSevereOrSuddenAE) {
    alerts.push({
      severity: "caution",
      code: "PE_PREVIOUS_AE",
      message: "Previous severe or sudden adverse reaction to a medicine recorded",
      detail: `Review the reaction before supply and consider referral: ${state.contraindications.aeDetail || "details not recorded"}. Hypersensitivity to dapoxetine or any excipient contraindicates (Priligy SmPC).`,
    });
  }

  // Caution: Orthostatic hypotension test not done
  if (
    state.medicineSupply.dapoxetine30mgSupplied &&
    !state.medicineSupply.understandsOrthostatic
  ) {
    alerts.push({
      severity: "caution",
      code: "PE_ORTHOSTATIC",
      message: "Orthostatic hypotension test should be performed",
      detail:
        "Lying and standing BP must be measured before first dose. Check results are recorded.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: PEConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: PEConsultationState
): DoseRecommendation | null {
  if (!state.patient.maleConfirmed) return null;
  if (state.patient.age === null || state.patient.age < 18) return null;
  if (hasHardStops(state)) return null;

  const dosingRegimen = state.medicineSupply.mayIncreaseTo60mg
    ? "60mg as needed, 1 to 3 hours before sexual activity, maximum one dose in 24 hours (30mg insufficient and well tolerated)"
    : "30mg as needed, 1 to 3 hours before sexual activity, maximum one dose in 24 hours";

  return {
    medicine: "Dapoxetine 30mg and 60mg tablets (Priligy)",
    dose: state.medicineSupply.mayIncreaseTo60mg ? "60mg" : "30mg (starting dose)",
    dosingRegimen,
    frequency: "As needed, 1 to 3 hours before sexual activity; not daily. Up to 6 tablets per supply",
    reason: "Premature ejaculation (IELT under 2 minutes) causing significant personal distress. Review after 4 weeks (about 6 doses); reassess every 6 months.",
  };
}

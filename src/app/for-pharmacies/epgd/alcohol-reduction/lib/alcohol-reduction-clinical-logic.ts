import type { AlcoholReductionConsultationState } from "./alcohol-reduction-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: AlcoholReductionConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.opioidUse || state.contraindications.opioidDependence) {
    alerts.push({
      severity: "stop",
      code: "ALCO_OPIOID",
      message: "Patient on opioids or opioid dependent — nalmefene contraindicated",
      detail: "Nalmefene precipitates withdrawal in opioid users. Patient must cease opioids before treatment.",
    });
  }

  if (state.contraindications.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "ALCO_LIVER",
      message: "Severe hepatic impairment (Child-Pugh C) — refer to specialist",
      detail: "Nalmefene not suitable. Requires specialist assessment.",
    });
  }

  if (state.contraindications.severeRenalImpairment) {
    alerts.push({
      severity: "stop",
      code: "ALCO_KIDNEY",
      message: "Severe renal impairment — refer to specialist",
      detail: "Nalmefene clearance significantly impaired. Specialist assessment needed.",
    });
  }

  if (state.contraindications.activeWithdrawal) {
    alerts.push({
      severity: "stop",
      code: "ALCO_WITHDRAWAL",
      message: "Active alcohol withdrawal — refer for medical support",
      detail: "Nalmefene is for reduction in non-dependent or mildly dependent patients without withdrawal. Specialist detoxification required.",
    });
  }

  if (state.contraindications.childUnder18) {
    alerts.push({
      severity: "stop",
      code: "ALCO_AGE",
      message: "Patient under 18 years old",
      detail: "Nalmefene is not licensed for use in patients under 18 years.",
    });
  }

  // ── Licence gates, added 21 Aug 2026 ─────────────────────────────────
  // Nalmefene's indication is unusually prescriptive and none of it was
  // enforced here. These are conditions of the marketing authorisation,
  // not house policy, so each is a stop rather than a caution.
  //
  // Every one of them is guarded by the step it is asked on. Without that
  // guard they would all fire from the patient details screen, canProceed
  // would be false, and the pharmacist could never reach the step where
  // the answer is entered. That is the fault that made five tools unusable
  // in July and it is very easy to reintroduce, so: a stop may only depend
  // on something the user has already had the chance to fill in.
  //
  // Step 2 is Alcohol Assessment, step 6 is Medicine Supply.
  const a = state.assessment;
  const PAST_ASSESSMENT = state.currentStep > 2;
  const PAST_SUPPLY = state.currentStep > 6;

  // 1. Two week run-in. The licence permits initiation only in patients who
  //    still have a high drinking risk level two weeks after the initial
  //    assessment. A first visit is an assessment, not a supply.
  if (PAST_ASSESSMENT && !a.initialAssessmentDate) {
    alerts.push({
      severity: "stop",
      code: "ALCO_NO_RUNIN",
      message: "No initial assessment date recorded",
      detail:
        "Nalmefene may only be started in a patient who still has a high drinking risk level two weeks after an initial assessment. If this is the first visit, carry out the assessment, ask the patient to record their drinking, and book them back in two weeks. Do not supply today.",
    });
  } else if (PAST_ASSESSMENT) {
    const days = Math.floor(
      (Date.now() - new Date(a.initialAssessmentDate).getTime()) / 86400000,
    );
    if (Number.isFinite(days) && days < 14) {
      alerts.push({
        severity: "stop",
        code: "ALCO_RUNIN_SHORT",
        message: `Only ${days} days since the initial assessment`,
        detail:
          "The licence requires at least 14 days between the initial assessment and starting treatment. Book the patient back in rather than supplying early.",
      });
    }
  }

  if (PAST_ASSESSMENT && !a.stillHighRiskAtReview) {
    alerts.push({
      severity: "stop",
      code: "ALCO_NOT_STILL_HIGH",
      message: "Not confirmed as still high drinking risk level",
      detail:
        "Confirm the patient still has a high drinking risk level at this review. If their drinking has already fallen below it, they are not eligible: support them to continue without medication rather than starting it.",
    });
  }

  if (PAST_ASSESSMENT && !a.consumptionRecordReviewed) {
    alerts.push({
      severity: "stop",
      code: "ALCO_NO_RECORD",
      message: "Consumption record not reviewed",
      detail:
        "The patient should have recorded their drinking across the two week run-in, and that record should be reviewed before supply. It is also the baseline the monthly reviews are measured against.",
    });
  }

  // 2. Drinking risk level, which the licence defines per DAY and by sex.
  if (PAST_ASSESSMENT && (a.unitsPerDay === null || !a.sexForThreshold)) {
    alerts.push({
      severity: "stop",
      code: "ALCO_NO_DRL",
      message: "Daily drinking risk level not established",
      detail:
        "Record units per day and the sex used for the threshold. The licence threshold is a daily figure: over 7.5 units a day for men, over 5 units a day for women. Weekly units cannot express it.",
    });
  } else if (PAST_ASSESSMENT && a.unitsPerDay !== null) {
    const threshold = a.sexForThreshold === "male" ? 7.5 : 5;
    if (a.unitsPerDay <= threshold) {
      alerts.push({
        severity: "stop",
        code: "ALCO_BELOW_DRL",
        message: `${a.unitsPerDay} units/day is below the high risk threshold`,
        detail: `Nalmefene is licensed only for a high drinking risk level, which is over ${threshold} units a day for this patient. Below that, offer brief advice and continued support rather than medication.`,
      });
    }
  }

  // 3. Treatment goal. Nalmefene reduces consumption; it is not an
  //    abstinence medicine, and a patient aiming to stop needs a different
  //    conversation and probably a different drug.
  if (PAST_ASSESSMENT && !a.goalIsReduction) {
    alerts.push({
      severity: "stop",
      code: "ALCO_GOAL",
      message: "Treatment goal not confirmed as reduction",
      detail:
        "Nalmefene is licensed to reduce consumption, not to achieve abstinence. If the patient wants to stop drinking altogether, refer to their GP or an alcohol service for consideration of naltrexone or acamprosate.",
    });
  }

  // 4. Psychosocial support is part of the indication, not an optional add-on.
  if (PAST_SUPPLY && !state.medicineSupply.psychosocialSupport) {
    alerts.push({
      severity: "stop",
      code: "ALCO_NO_PSYCHOSOCIAL",
      message: "No psychosocial support in place",
      detail:
        "The licence states nalmefene should only be provided in conjunction with continuous psychosocial support focused on treatment adherence and reducing consumption. Record what support is in place, or refer into it, before supplying.",
    });
  }

  // Caution
  if (state.medicalHistory.hepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "ALCO_MILD_LIVER",
      message: "Mild–moderate hepatic impairment — monitor closely",
      detail: "Dose adjustment may be required. Ensure adequate monitoring.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "caution",
      code: "ALCO_MILD_KIDNEY",
      message: "Mild–moderate renal impairment — monitor closely",
      detail: "Ensure adequate hydration. Consider reduced dosing if necessary.",
    });
  }

  if (state.medicalHistory.psychiatricComorbidity) {
    alerts.push({
      severity: "caution",
      code: "ALCO_PSYCH",
      message: "Psychiatric comorbidity — ensure specialist involvement",
      detail: "Mental health support alongside medication is important.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: AlcoholReductionConsultationState): DoseRecommendation | null {
  return {
    medicine: "Nalmefene 18mg",
    dose: "18mg",
    frequency: "PRN (as needed)",
    duration: "Ongoing PRN",
    dosingRegimen: "Take 1–2 hours before anticipated drinking occasion. Maximum 1 tablet per day. Not for daily use.",
    reason: "Opioid receptor antagonist to reduce craving and reward from alcohol",
  };
}

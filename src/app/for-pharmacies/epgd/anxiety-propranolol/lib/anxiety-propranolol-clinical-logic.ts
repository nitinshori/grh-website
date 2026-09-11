import type { AnxietyPropranololConsultationState } from "./anxiety-propranolol-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: AnxietyPropranololConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.asthmaWithBronchospasm) {
    alerts.push({
      severity: "stop",
      code: "ANX_ASTHMA",
      message: "Asthma or history of bronchospasm: propranolol excluded",
      detail: "Beta-blockers can precipitate bronchoconstriction. Patient should be referred to GP for alternative.",
    });
  }

  // PGD v004 exclusions (11 September 2026)
  if (state.contraindications.cardiogenicShock) {
    alerts.push({
      severity: "stop",
      code: "ANX_SHOCK",
      message: "Cardiogenic shock: propranolol excluded",
      detail: "Do not supply. Urgent medical assessment.",
    });
  }
  if (state.contraindications.hypotension) {
    alerts.push({
      severity: "stop",
      code: "ANX_HYPOTENSION",
      message: "Hypotension (systolic BP below 90 mmHg): propranolol excluded",
      detail: "Do not supply. Refer to GP.",
    });
  }
  if (state.contraindications.sickSinusSyndrome) {
    alerts.push({
      severity: "stop",
      code: "ANX_SSS",
      message: "Sick sinus syndrome: propranolol excluded",
      detail: "Do not supply. Refer to GP.",
    });
  }
  if (state.contraindications.metabolicAcidosis) {
    alerts.push({
      severity: "stop",
      code: "ANX_ACIDOSIS",
      message: "Metabolic acidosis: propranolol excluded",
      detail: "Do not supply. Refer.",
    });
  }
  if (state.contraindications.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "ANX_HYPERSENS",
      message: "Known hypersensitivity to propranolol",
      detail: "Do not supply. Refer to GP for an alternative.",
    });
  }
  if (state.contraindications.severePeripheralArterialDisease) {
    alerts.push({
      severity: "stop",
      code: "ANX_PAD",
      message: "Severe peripheral arterial disease (rest pain, ulceration or critical ischaemia): propranolol excluded",
      detail: "Do not supply. Refer to GP. Mild peripheral vascular disease is a caution, not an exclusion.",
    });
  }
  if (state.contraindications.fastingOrHypoglycaemiaRisk) {
    alerts.push({
      severity: "stop",
      code: "ANX_HYPO",
      message: "Prolonged fasting or other risk of hypoglycaemia, including insulin-treated diabetes with hypoglycaemia unawareness: propranolol excluded",
      detail: "Propranolol masks the warning symptoms of hypoglycaemia. Do not supply. Refer to GP.",
    });
  }
  if (state.contraindications.pregnancyOrPlanning) {
    alerts.push({
      severity: "stop",
      code: "ANX_PREGNANCY",
      message: "Pregnancy, or planning pregnancy: excluded",
      detail: "Do not supply under this PGD. Refer.",
    });
  }
  if (state.contraindications.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "ANX_BREASTFEEDING",
      message: "Breastfeeding: excluded",
      detail: "Do not supply under this PGD. Refer to GP.",
    });
  }

  if (state.contraindications.heartBlock) {
    alerts.push({
      severity: "stop",
      code: "ANX_BLOCK",
      message: "2nd or 3rd degree heart block — propranolol contraindicated",
      detail: "Beta-blockers worsen conduction delay. Refer to cardiology.",
    });
  }

  if (state.contraindications.severeBradycardia) {
    alerts.push({
      severity: "stop",
      code: "ANX_BRADY",
      message: "Bradycardia (HR &lt;50 bpm) — propranolol contraindicated",
      detail: "Further heart rate reduction may be dangerous. Refer to GP.",
    });
  }

  if (state.contraindications.uncontrolledHeartFailure) {
    alerts.push({
      severity: "stop",
      code: "ANX_HF",
      message: "Uncontrolled heart failure — propranolol contraindicated",
      detail: "May decompensate heart failure. Specialist assessment needed.",
    });
  }

  if (state.contraindications.prinzmetalsAngina) {
    alerts.push({
      severity: "stop",
      code: "ANX_PRINZ",
      message: "Prinzmetal's angina — propranolol contraindicated",
      detail: "Non-selective beta-blocker can worsen coronary vasospasm. Refer to cardiology.",
    });
  }

  if (state.contraindications.pheochromocytoma) {
    alerts.push({
      severity: "stop",
      code: "ANX_PHEO",
      message: "Pheochromocytoma (unless alpha-blocked) — propranolol contraindicated",
      detail: "Risk of hypertensive crisis. Refer to endocrinology.",
    });
  }

  // Age is an inclusion criterion (adults aged 18 years and over): derived
  // from the date of birth as well as the manual tick.
  if (state.contraindications.childUnder12 || (state.patient.age !== null && state.patient.age < 18)) {
    alerts.push({
      severity: "stop",
      code: "ANX_AGE",
      message: "Patient under 18 years old",
      detail: "This PGD is for adults aged 18 and over. Refer to GP.",
    });
  }

  // PGD v002 exclusions, 9 September 2026.
  if (state.contraindications.suicidalOrSevereDepression) {
    alerts.push({
      severity: "stop",
      code: "ANX_SUICIDE",
      message: "Suicidal ideation, self-harm or severe depression",
      detail: "Propranolol is cardiotoxic in overdose. Do not supply. Refer, and follow local safeguarding and crisis pathways where there is immediate risk.",
    });
  }
  if (state.contraindications.ptsdPanicOrAgoraphobia) {
    alerts.push({
      severity: "stop",
      code: "ANX_PTSD",
      message: "PTSD, severe panic disorder or agoraphobia",
      detail: "This PGD is for the physical symptoms of situational anxiety only. Refer to GP.",
    });
  }
  if (state.contraindications.substanceOrAlcoholMisuse) {
    alerts.push({
      severity: "stop",
      code: "ANX_SUBSTANCE",
      message: "Comorbid substance or alcohol misuse",
      detail: "Do not supply. Refer to GP.",
    });
  }
  if (state.contraindications.otherBetaBlocker) {
    alerts.push({
      severity: "stop",
      code: "ANX_BB",
      message: "Already taking another beta-blocker",
      detail: "Do not add propranolol to an existing beta-blocker. Refer to GP.",
    });
  }
  if (state.contraindications.verapamilOrDiltiazem) {
    alerts.push({
      severity: "stop",
      code: "ANX_CCB",
      message: "Taking verapamil or diltiazem, oral or intravenous",
      detail: "With a beta-blocker the combination risks severe bradycardia, heart block and hypotension. Do not supply.",
    });
  }

  // Indication: symptomatic relief of situational/performance anxiety
  // (physical symptoms) only. Generalised anxiety disorder is outside the
  // PGD indication, so it blocks supply.
  if (state.assessment.anxietyType === "generalized") {
    alerts.push({
      severity: "stop",
      code: "ANX_GAD",
      message: "Generalised anxiety disorder: outside this PGD, refer to GP",
      detail: "This PGD is for the physical symptoms of situational anxiety only. Propranolol is not first-line for generalised anxiety disorder; CBT is first-line psychological treatment. Refer to primary care.",
    });
  }

  // Cautions
  if (state.medicalHistory.diabetes) {
    alerts.push({
      severity: "caution",
      code: "ANX_DM",
      message: "Diabetes: propranolol masks hypoglycaemia symptoms",
      detail: "Beta-blockers can hide tremor and palpitations of low blood sugar. Patient must be aware. Insulin-treated diabetes with hypoglycaemia unawareness, or any other risk of hypoglycaemia, is an exclusion.",
    });
  }

  if (state.medicalHistory.raynauds) {
    alerts.push({
      severity: "caution",
      code: "ANX_RAYNAUD",
      message: "Raynaud's: may worsen peripheral vasospasm",
      detail: "Monitor for worsening symptoms.",
    });
  }

  if (state.medicalHistory.hepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "ANX_LIVER",
      message: "Hepatic impairment: propranolol metabolism reduced",
      detail: "Consider dose reduction. Monitor patient closely.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "caution",
      code: "ANX_RENAL",
      message: "Renal impairment: caution",
      detail: "Use the lowest effective dose and counsel on adverse effects.",
    });
  }

  if (state.medicalHistory.firstDegreeHeartBlock) {
    alerts.push({
      severity: "caution",
      code: "ANX_HB1",
      message: "First-degree heart block: caution",
      detail: "Second-degree or third-degree heart block excludes. Counsel on bradycardia and dizziness.",
    });
  }

  if (state.medicalHistory.portalHypertension) {
    alerts.push({
      severity: "caution",
      code: "ANX_PORTAL",
      message: "Portal hypertension: caution",
      detail: "Counsel and consider GP review if used regularly.",
    });
  }

  if (state.medicalHistory.mildPeripheralVascularDisease) {
    alerts.push({
      severity: "caution",
      code: "ANX_PVD",
      message: "Mild peripheral vascular disease: caution",
      detail: "Severe peripheral arterial disease (rest pain, ulceration or critical ischaemia) excludes. Counsel on cold extremities.",
    });
  }

  if (state.medicalHistory.psoriasis) {
    alerts.push({
      severity: "caution",
      code: "ANX_PSORIASIS",
      message: "Psoriasis: caution",
      detail: "Beta-blockers may exacerbate psoriasis (psoriasiform rash is a rare adverse effect). Counsel.",
    });
  }

  if (state.medicalHistory.myastheniaGravis) {
    alerts.push({
      severity: "caution",
      code: "ANX_MG",
      message: "Myasthenia gravis: caution",
      detail: "Beta-blockers may worsen muscle weakness. Counsel and advise GP review.",
    });
  }

  if (state.medicalHistory.historyOfAnaphylaxis) {
    alerts.push({
      severity: "caution",
      code: "ANX_ANAPHYLAXIS",
      message: "History of anaphylaxis: caution",
      detail: "Beta-blockers may increase the severity of anaphylaxis and reduce the response to adrenaline. Counsel.",
    });
  }

  if (state.medicalHistory.mildDepression) {
    alerts.push({
      severity: "caution",
      code: "ANX_DEPRESSION",
      message: "Depression that is not severe and without any suicidal ideation: supply may proceed with counselling",
      detail: "Severe depression or any suicidal ideation is an exclusion (contraindications step). Propranolol is cardiotoxic in overdose.",
    });
  }

  if (state.patient.age !== null && state.patient.age >= 65) {
    alerts.push({
      severity: "caution",
      code: "ANX_ELDERLY",
      message: "Elderly: caution",
      detail: "Use the lowest effective dose and counsel on dizziness, bradycardia and falls.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: AnxietyPropranololConsultationState): DoseRecommendation | null {
  if (state.medicineSupply.regimen === "regular") {
    return {
      medicine: "Propranolol 10mg tablets",
      dose: "10 to 40mg",
      frequency: "Two to three times daily",
      duration: "Ongoing situational anxiety; review at 4 weeks",
      dosingRegimen: "10 to 40mg two to three times daily for ongoing situational anxiety. Maximum 120mg daily. Review at 4 weeks; consider gradual dose reduction if discontinuing. Do not stop abruptly.",
      reason: "Beta-blocker reduces physical anxiety symptoms (tremor, palpitations, sweating) in situational anxiety",
    };
  }
  return {
    medicine: "Propranolol 10mg tablets",
    dose: "10 to 40mg",
    frequency: "PRN (as needed)",
    duration: "Single dose before anxiety-provoking situation",
    dosingRegimen: "Take 10 to 40mg 30 to 60 minutes before the anticipated anxiety-provoking situation (exam, presentation, public speaking). Maximum 120mg daily.",
    reason: "Beta-blocker reduces physical anxiety symptoms (tremor, palpitations, sweating) in situational anxiety",
  };
}

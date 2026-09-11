import type { ClinicalAlert } from "../../shared/types";
import type { SleepMelatoninAssessment, SleepMelatoninContraindications, SleepMelatoninSecondaryCauses } from "./sleep-melatonin-types";

/** Weeks of Circadin treatment to date as a number, or null if not given. */
export function weeksTreated(assessment: SleepMelatoninAssessment): number | null {
  if (!assessment.previousCircadin) return 0;
  const t = assessment.weeksTreatedToDate.trim();
  if (!t) return null;
  const n = parseFloat(t);
  return isNaN(n) || n < 0 ? null : n;
}

/** Days since the last Circadin supply, or null if no date recorded. */
export function daysSinceLastSupply(assessment: SleepMelatoninAssessment): number | null {
  if (!assessment.previousCircadin || !assessment.lastSupplyDate) return null;
  const d = new Date(assessment.lastSupplyDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/**
 * Maximum tablets this supply: 21 (three weeks), reduced so that the course
 * cannot exceed 13 weeks in total. With 12 weeks already taken, 7 tablets.
 */
export function maxTabletsThisSupply(assessment: SleepMelatoninAssessment): number {
  const w = weeksTreated(assessment);
  if (w === null) return 21;
  return Math.max(0, Math.min(21, Math.floor((13 - w) * 7)));
}

export function getAssessmentAlerts(assessment: SleepMelatoninAssessment): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  // Treatment limits derived from the recorded history, not only from the
  // manual tick on the next step. "12 weeks already taken" used to allow
  // another 21 tablets (adversarial review, 11 Sep 2026).
  const w = weeksTreated(assessment);
  if (w !== null && w >= 13) {
    alerts.push({
      severity: "stop",
      code: "REPEAT_CI",
      message: `STOP: ${w} weeks of Circadin treatment already completed (maximum 13 weeks in total)`,
      detail: "There is no extension under this PGD. A patient still not sleeping at 13 weeks needs review, not a repeat. Refer, do not supply.",
    });
  }
  const days = daysSinceLastSupply(assessment);
  if (assessment.previousCourseStatus === "completed" && days !== null && days < 183) {
    alerts.push({
      severity: "stop",
      code: "REPEAT_6M_CI",
      message: `STOP: Previous course of Circadin completed, last supplied ${days} days ago (within 6 months)`,
      detail: "No further supply under this PGD within 6 months of completing a course. Refer for review, do not supply.",
    });
  }
  if (!assessment.sleepHygieneAdviceGiven) {
    alerts.push({
      severity: "caution",
      code: "SLEEP_HYGIENE_FIRST",
      message: "Sleep hygiene advice (Appendix 1) must be given to every patient, whether or not anything is supplied",
      detail: "It is the intervention with the better long-term evidence. Where the patient has not already tried it, agree a period of trying it before or alongside supply.",
    });
  }
  if (assessment.durationOfInsomnia === "less4w") {
    alerts.push({
      severity: "stop",
      code: "SLEEP_DURATION",
      message: "STOP: Insomnia present for less than 4 weeks",
      detail: "Give sleep hygiene advice and review; do not medicate a short-lived disturbance.",
    });
  }
  return alerts;
}

const SECONDARY_CAUSE_ALERTS: { field: keyof SleepMelatoninSecondaryCauses; code: string; message: string; detail: string }[] = [
  { field: "lowMoodOrMentalHealth", code: "SEC_MOOD", message: "STOP: Low mood, loss of interest, anxiety, or any current or suspected mental health condition", detail: "Early morning waking with low mood is depression until proved otherwise. Refer for a mood assessment; do not supply." },
  { field: "snoringDaytimeSleepiness", code: "SEC_OSA", message: "STOP: Snoring with daytime sleepiness, witnessed apnoeas, or morning headache", detail: "Suspect obstructive sleep apnoea and refer for a sleep apnoea assessment. This is the exclusion most often missed and it carries cardiovascular and road-traffic risk." },
  { field: "painDisturbingSleep", code: "SEC_PAIN", message: "STOP: Pain of any cause that wakes the patient or prevents sleep", detail: "Insomnia is likely secondary. Refer; do not supply." },
  { field: "restlessLegs", code: "SEC_RLS", message: "STOP: Urge to move the legs at night, or leg discomfort relieved by movement", detail: "Suspect restless legs syndrome. Refer; do not supply." },
  { field: "nocturia", code: "SEC_NOCTURIA", message: "STOP: Waking repeatedly to pass urine", detail: "Consider prostatic disease, diabetes or heart failure and refer." },
  { field: "shiftWork", code: "SEC_SHIFT", message: "STOP: Shift work, or a sleep pattern driven by work or travel rather than by an inability to sleep", detail: "Not primary insomnia. Refer; do not supply." },
  { field: "alcoholToSleep", code: "SEC_ALCOHOL", message: "STOP: Alcohol used to get to sleep, or any pattern of harmful drinking", detail: "Alcohol also reduces the effectiveness of Circadin. Refer; do not supply." },
  { field: "caffeineNotAddressed", code: "SEC_CAFFEINE", message: "STOP: Caffeine late in the day, or a high total daily intake, not yet addressed", detail: "Give sleep hygiene advice (no caffeine after midday) and review; do not supply." },
  { field: "medicineCausingInsomnia", code: "SEC_MEDICINE", message: "STOP: A medicine that could be causing the insomnia", detail: "For example a corticosteroid, a beta-agonist, an SSRI or SNRI, a stimulant, or a diuretic taken in the evening. Refer to the GP for medicine review; do not supply." },
];

export function getSecondaryCauseAlerts(secondaryCauses: SleepMelatoninSecondaryCauses): ClinicalAlert[] {
  return SECONDARY_CAUSE_ALERTS.filter((a) => secondaryCauses[a.field]).map((a) => ({
    severity: "stop" as const,
    code: a.code,
    message: a.message,
    detail: a.detail,
  }));
}

export function getContraindicationAlerts(contraindications: SleepMelatoninContraindications): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (contraindications.hypersensitivity) {
    alerts.push({ severity: "stop", code: "HYPERSENS_CI", message: "STOP: Known hypersensitivity to melatonin or to any excipient of Circadin", detail: "Refer, do not supply." });
  }
  if (contraindications.autoimmuneDiseaseActive) {
    alerts.push({ severity: "stop", code: "AUTOIMMUNE_CI", message: "STOP: Autoimmune disease", detail: "The SPC does not recommend Circadin, as no clinical data exist in this group. Refer, do not supply." });
  }
  if (contraindications.hepaticImpairment) {
    alerts.push({ severity: "stop", code: "HEPATIC_CI", message: "STOP: Hepatic impairment of any degree", detail: "Circadin is not recommended by the SPC: the liver is the primary site of melatonin metabolism and endogenous levels are already markedly raised in hepatic impairment. Refer, do not supply." });
  }
  if (contraindications.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY_CI", message: "STOP: Pregnancy or planning pregnancy", detail: "Not recommended by the SPC. Refer, do not supply." });
  }
  if (contraindications.breastfeeding) {
    alerts.push({ severity: "stop", code: "BREASTFEEDING_CI", message: "STOP: Breastfeeding", detail: "Not recommended by the SPC. Refer, do not supply." });
  }
  if (contraindications.fluvoxamine) {
    alerts.push({ severity: "stop", code: "FLUVOXAMINE_CI", message: "STOP: Taking fluvoxamine", detail: "The combination is to be avoided: fluvoxamine raises melatonin exposure roughly seventeen-fold. Refer, do not supply." });
  }
  if (contraindications.hypnoticOrSedative) {
    alerts.push({ severity: "stop", code: "HYPNOTIC_CI", message: "STOP: Taking a benzodiazepine, a Z-drug (zopiclone, zolpidem, zaleplon), or any other hypnotic, sedative or treatment for insomnia", detail: "Circadin enhances their effect, and co-dosing with zolpidem measurably worsened attention, memory and co-ordination. Refer, do not supply." });
  }
  if (contraindications.methoxypsoralen) {
    alerts.push({ severity: "stop", code: "PSORALEN_CI", message: "STOP: Taking 5-methoxypsoralen or 8-methoxypsoralen", detail: "Raises melatonin levels by inhibiting its metabolism. Refer, do not supply." });
  }
  if (contraindications.lactoseIntolerance) {
    alerts.push({ severity: "stop", code: "LACTOSE_CI", message: "STOP: Rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption", detail: "Circadin contains 80mg lactose per tablet. Refer, do not supply." });
  }
  if (contraindications.renalImpairmentNotMildStable) {
    alerts.push({ severity: "stop", code: "RENAL_CI", message: "STOP: Renal impairment where the pharmacist is not satisfied it is mild and stable", detail: "The effect of renal impairment on melatonin pharmacokinetics has not been studied. Refer, do not supply." });
  }
  if (contraindications.previousCourseWithin6Months) {
    alerts.push({ severity: "stop", code: "REPEAT_CI", message: "STOP: A previous course of Circadin supplied under this PGD in the last 6 months, or 13 weeks of treatment already completed", detail: "Refer for review rather than continuing. A patient still not sleeping at 13 weeks needs review, not a repeat." });
  }
  if (contraindications.cyp1a2Inhibitor) {
    alerts.push({ severity: "caution", code: "CYP1A2_INHIBITOR", message: "Caution: cimetidine, oestrogens (including combined contraceptives and HRT) or a quinolone antibiotic", detail: "These raise melatonin levels by inhibiting its metabolism. Counsel on increased drowsiness and consider referral instead." });
  }
  if (contraindications.cyp1a2Inducer) {
    alerts.push({ severity: "caution", code: "CYP1A2_INDUCER", message: "Caution: carbamazepine, rifampicin or smoking", detail: "These lower melatonin levels and may make the treatment ineffective. Counsel." });
  }
  return alerts;
}

export function getAllAlerts(assessment: SleepMelatoninAssessment, secondaryCauses: SleepMelatoninSecondaryCauses, contraindications: SleepMelatoninContraindications): ClinicalAlert[] {
  return [...getAssessmentAlerts(assessment), ...getSecondaryCauseAlerts(secondaryCauses), ...getContraindicationAlerts(contraindications)];
}

export function hasSecondaryCause(secondaryCauses: SleepMelatoninSecondaryCauses): boolean {
  return SECONDARY_CAUSE_ALERTS.some((a) => secondaryCauses[a.field]);
}

/** Stops raised on the assessment step (duration, treatment limits). */
export function hasAssessmentStops(assessment: SleepMelatoninAssessment): boolean {
  return getAssessmentAlerts(assessment).some((a) => a.severity === "stop");
}

export function hasHardStops(contraindications: SleepMelatoninContraindications): boolean {
  return (
    contraindications.hypersensitivity ||
    contraindications.autoimmuneDiseaseActive ||
    contraindications.hepaticImpairment ||
    contraindications.pregnancy ||
    contraindications.breastfeeding ||
    contraindications.fluvoxamine ||
    contraindications.hypnoticOrSedative ||
    contraindications.methoxypsoralen ||
    contraindications.lactoseIntolerance ||
    contraindications.renalImpairmentNotMildStable ||
    contraindications.previousCourseWithin6Months
  );
}

import type { SmokingNRTConsultationState } from "./smoking-nrt-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: SmokingNRTConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops. PGD v003 (11 September 2026): adults aged 18 years and over.
  if (state.contraindications.childUnder12 || (state.patient.age !== null && state.patient.age < 18)) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_AGE",
      message: "Patient under 18 years old",
      detail: "This PGD is for adults aged 18 years and over. Refer to GP or the local stop smoking service.",
    });
  }

  if (state.contraindications.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_HYPERSENS",
      message: "Known hypersensitivity to nicotine or excipients",
      detail: "Exclusion under the PGD. Do not supply. Advise on alternatives and inform or refer to the GP.",
    });
  }

  // Non-smoker: derived from the recorded consumption as well as the tick.
  // A recorded 0 a day used to proceed to a 21mg patch unless the box was
  // separately ticked (adversarial review, 11 Sep 2026).
  const cigs = state.assessment.cigarettesPerDay;
  if (state.contraindications.nonSmokerOrOccasional || (cigs !== null && cigs <= 0)) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_NONSMOKER",
      message: cigs !== null && cigs <= 0 ? "Recorded as smoking 0 cigarettes a day: non-smoker" : "Non-smoker or occasional smoker",
      detail: "Exclusion under the PGD. NRT is not supplied to non-smokers or occasional smokers.",
    });
  } else if (cigs !== null && cigs < 5) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_OCCASIONAL",
      message: `${cigs} cigarettes a day: confirm this is a regular, daily smoker and not an occasional smoker`,
      detail: "Occasional smokers are excluded under the PGD. If the patient does not smoke every day, tick the exclusion on the Contraindications step and advise on alternatives.",
    });
  }

  // Patch-arm exclusion (blocks the patch selection, not oral products)
  if (state.contraindications.generalisedSkinDisorder) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_SKIN",
      message: "Generalised skin disorder that may affect absorption: nicotine patches excluded",
      detail: "Exclusion for the patch arm of the PGD. Oral products (gum or lozenge) may still be supplied.",
    });
  }

  // Cautions (PGD v003)
  if (state.medicalHistory.recentMI || state.medicalHistory.recentStroke || state.medicalHistory.unstableAngina || state.medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_CVD",
      message: "Cardiovascular disease: recent MI (within 4 weeks), unstable angina, severe arrhythmias",
      detail: "Assess benefit vs risk. Advise the patient to seek immediate medical attention for chest pain, palpitations or shortness of breath.",
    });
  }

  if (state.medicalHistory.pheochromocytoma) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_PHEO",
      message: "Phaeochromocytoma (nicotine may cause catecholamine release)",
      detail: "PGD caution. Assess benefit against risk, counsel, and consider discussing with the patient's specialist.",
    });
  }

  if (state.medicalHistory.diabetes) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_DM",
      message: "Diabetes: monitor blood glucose control",
      detail: "Nicotine may affect insulin requirements. Advise more frequent blood glucose monitoring.",
    });
  }

  if (state.medicalHistory.hepaticRenalImpairment) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_HEPATIC_RENAL",
      message: "Hepatic or renal impairment",
      detail: "Consider close monitoring.",
    });
  }

  if (state.medicalHistory.pepticUlcer) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_PUD",
      message: "Peptic ulcer disease",
      detail: "Nicotine may increase gastric acid secretion. Counsel and monitor.",
    });
  }

  if (state.medicalHistory.oralUlcerationOrDentalWork && state.nrtSelection.useOralForm) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_ORAL",
      message: "Oral ulceration or dental work",
      detail: "Nicotine oral products may cause irritation. Consider patches instead, or counsel and review.",
    });
  }

  if (state.medicalHistory.pregnant) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_PREGNANCY",
      message: "Pregnancy: use only if unable to quit without NRT",
      detail: "Benefits must outweigh risks. Document the assessment. Advise the patient to inform their healthcare provider.",
    });
  }

  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_BREASTFEEDING",
      message: "Breastfeeding: nicotine passes into breast milk",
      detail: "Weigh risks and benefits and document the assessment.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: SmokingNRTConsultationState): DoseRecommendation | null {
  if (!state.nrtSelection.usePatches && !state.nrtSelection.useOralForm) return null;

  const components: string[] = [];
  const regimen: string[] = [];
  const cigs = state.assessment.cigarettesPerDay;
  if (state.nrtSelection.usePatches) {
    components.push(`Nicotine 24-hour patch ${state.nrtSelection.patchStrength || "(strength not set)"} (${state.nrtSelection.patchBrand || "brand not recorded"})${state.nrtSelection.patchQuantity ? `, ${state.nrtSelection.patchQuantity} patches` : ""}`);
    regimen.push(
      cigs !== null && cigs <= 10
        ? "Lighter smoker (10 or fewer cigarettes a day): start 14mg/24-hour patch daily, then step down (14mg for 2 weeks, then 7mg for 2 weeks)."
        : "Heavy smoker (more than 10 cigarettes a day): 21mg/24-hour patch daily for 6 to 8 weeks, then 14mg for 2 weeks, then 7mg for 2 weeks."
    );
  }
  if (state.nrtSelection.useOralForm) {
    components.push(`Nicotine ${state.nrtSelection.oralFormType || "lozenge or gum"} ${state.nrtSelection.oralStrength || "(strength not set)"} (${state.nrtSelection.oralBrand || "brand not recorded"})${state.nrtSelection.oralQuantity ? `, ${state.nrtSelection.oralQuantity} pieces` : ""}`);
    regimen.push(
      cigs !== null && cigs > 20
        ? "More than 20 cigarettes a day: 4mg lozenge or gum. Initially 8 to 12 pieces a day, reduce gradually over 8 to 12 weeks."
        : "20 or fewer cigarettes a day: 2mg lozenge or gum. Initially 8 to 12 pieces a day, reduce gradually over 8 to 12 weeks."
    );
  }

  return {
    medicine: components.join(" + "),
    dose: state.nrtSelection.usePatches ? "One patch every 24 hours" : "8 to 12 pieces a day initially",
    frequency: "Daily",
    duration: "8 to 12 weeks total course; review at 2 weeks, 4 weeks, then regularly",
    dosingRegimen:
      regimen.join(" ") +
      (state.nrtSelection.combinationTherapy
        ? " Combination therapy (patch plus short-acting oral product) is more effective than either alone."
        : " Single form: consider combination for better efficacy."),
    reason: "Nicotine replacement for smoking cessation",
  };
}

/** Labels for the time-to-first-cigarette values (Fagerstrom item). */
export const TIME_TO_FIRST_LABELS: Record<string, string> = {
  "under-5min": "Within 5 minutes",
  "5-30min": "5 to 30 minutes",
  "31-60min": "31 to 60 minutes",
  "over-60min": "More than 60 minutes",
};

/** Patch strength the document's dose row directs for a first supply. */
export function startingPatchStrength(cigarettesPerDay: number | null): "21mg" | "14mg" | null {
  if (cigarettesPerDay === null) return null;
  return cigarettesPerDay > 10 ? "21mg" : "14mg";
}

/** Oral strength the document's dose row directs. */
export function oralStrengthFor(cigarettesPerDay: number | null): "2mg" | "4mg" | null {
  if (cigarettesPerDay === null) return null;
  return cigarettesPerDay > 20 ? "4mg" : "2mg";
}

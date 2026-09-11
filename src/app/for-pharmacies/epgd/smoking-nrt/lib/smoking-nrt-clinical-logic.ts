import type { SmokingNRTConsultationState } from "./smoking-nrt-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: SmokingNRTConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops. PGD v002 (11 September 2026): adults aged 18 years and over.
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

  if (state.contraindications.nonSmokerOrOccasional) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_NONSMOKER",
      message: "Non-smoker or occasional smoker",
      detail: "Exclusion under the PGD. NRT is not supplied to non-smokers or occasional smokers.",
    });
  }

  if (state.contraindications.recentCardiacEvent) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_CARDIAC",
      message: "Recent MI/stroke/unstable angina (within 2 weeks)",
      detail: "Patches contraindicated. Patient needs urgent cardiology/GP assessment.",
    });
  }

  if (state.contraindications.pheochromocytoma) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_PHEO",
      message: "Phaeochromocytoma: NRT not supplied under this tool",
      detail: "Nicotine may cause catecholamine release. Refer to specialist.",
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

  // Cautions (PGD v002)
  if (state.medicalHistory.recentMI || state.medicalHistory.unstableAngina || state.medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_CVD",
      message: "Cardiovascular disease: recent MI (within 4 weeks), unstable angina, severe arrhythmias",
      detail: "Assess benefit vs risk. Advise the patient to seek immediate medical attention for chest pain, palpitations or shortness of breath.",
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
    components.push(`Nicotine 24-hour patch ${state.nrtSelection.patchStrength || "(strength not set)"} (e.g. NiQuitin Clear)${state.nrtSelection.patchQuantity ? `, ${state.nrtSelection.patchQuantity} patches` : ""}`);
    regimen.push(
      cigs !== null && cigs <= 10
        ? "Lighter smoker (10 or fewer cigarettes a day): start 14mg/24-hour patch daily, then step down (14mg for 2 weeks, then 7mg for 2 weeks)."
        : "Heavy smoker (more than 10 cigarettes a day): 21mg/24-hour patch daily for 6 to 8 weeks, then 14mg for 2 weeks, then 7mg for 2 weeks."
    );
  }
  if (state.nrtSelection.useOralForm) {
    components.push(`Nicotine ${state.nrtSelection.oralFormType || "lozenge or gum"} ${state.nrtSelection.oralStrength || "(strength not set)"}${state.nrtSelection.oralQuantity ? `, ${state.nrtSelection.oralQuantity} pieces` : ""}`);
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

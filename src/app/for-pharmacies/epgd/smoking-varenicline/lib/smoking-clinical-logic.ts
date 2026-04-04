/**
 * Smoking Cessation ePGD - Clinical Logic & Guidelines
 * Based on Varenicline (Champix) PGD and NICE Guidelines
 */

import {
  SmokingToolFormData,
  ClinicalAlert,
  SmokingAssessment,
  SmokingMedicalHistory,
  SmokingMedications,
} from "./smoking-types";

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const today: Date = new Date();
  const birthDate: Date = new Date(dateOfBirth);
  let age: number = today.getFullYear() - birthDate.getFullYear();
  const monthDiff: number = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Calculate Fagerström Test Score (0-10)
 */
export function calculateFagerstromScore(assessment: SmokingAssessment): number {
  let score: number = 0;

  // Question 1: Time to first cigarette
  if (assessment.timeToFirstCigarette === "within-5") score += 3;
  else if (assessment.timeToFirstCigarette === "6-30") score += 2;
  else if (assessment.timeToFirstCigarette === "31-60") score += 1;
  // >60 = 0

  // Question 2: Difficult to refrain
  if (assessment.difficultToRefrain) score += 1;

  // Question 3: Which cigarette most hate to give up
  if (assessment.whichCigaretteMostHateToGiveUp === "first-morning") score += 1;
  // other = 0

  // Question 4: How many per day
  if (assessment.howManyPerDay === "31+") score += 3;
  else if (assessment.howManyPerDay === "21-30") score += 2;
  else if (assessment.howManyPerDay === "11-20") score += 1;
  // 10-or-less = 0

  // Question 5: Smoke more in morning
  if (assessment.smokeMoreInMorning) score += 1;

  // Question 6: Smoke when ill
  if (assessment.smokeWhenIll) score += 1;

  return Math.min(score, 10);
}

/**
 * Interpret Fagerström score
 */
export function interpretFagerstromScore(
  score: number
): { level: string; category: string; color: string } {
  if (score <= 2) {
    return { level: `${score}/10`, category: "Low dependence", color: "green" };
  } else if (score <= 4) {
    return {
      level: `${score}/10`,
      category: "Low to moderate dependence",
      color: "amber",
    };
  } else if (score <= 6) {
    return {
      level: `${score}/10`,
      category: "Moderate dependence",
      color: "orange",
    };
  } else if (score <= 8) {
    return { level: `${score}/10`, category: "High dependence", color: "red" };
  } else {
    return {
      level: `${score}/10`,
      category: "Very high dependence",
      color: "dark-red",
    };
  }
}

/**
 * Check hard contraindications (absolute exclusions)
 */
export function checkHardContraindications(
  formData: SmokingToolFormData
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age: number | null = calculateAge(formData.dateOfBirth);

  // Age check
  if (age !== null && age < 18) {
    alerts.push({
      severity: "stop",
      code: "AGE_UNDER_18",
      message: "Varenicline is not licensed for patients under 18 years",
      detail:
        "Patient age must be 18 years or over. Refer to suitable alternatives or specialist advice.",
    });
  }

  // Pregnancy
  if (formData.medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Varenicline is contraindicated in pregnancy",
      detail:
        "No data available on use in pregnancy. Recommend non-pharmacological support and refer to smoking cessation specialist. NRT may be considered as safer alternative.",
    });
  }

  // Breastfeeding
  if (formData.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "BREASTFEEDING",
      message: "Varenicline is contraindicated during breastfeeding",
      detail:
        "Varenicline is excreted in breast milk. Recommend non-pharmacological support or consider stopping breastfeeding. Refer to specialist.",
    });
  }

  // Current suicidal ideation
  if (formData.medicalHistory.suicidalIdeation) {
    alerts.push({
      severity: "stop",
      code: "SUICIDAL_IDEATION",
      message: "Active suicidal ideation is an absolute contraindication",
      detail:
        "Patient requires immediate psychological support. DO NOT prescribe varenicline. Refer urgently to mental health services.",
    });
  }

  // Severe hepatic impairment
  if (formData.medicalHistory.hepaticImpairment === "severe") {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC_IMPAIRMENT",
      message: "Varenicline is not recommended in severe hepatic impairment",
      detail:
        "Refer for specialist supervision. Consider alternative pharmacological or non-pharmacological approaches.",
    });
  }

  return alerts;
}

/**
 * Check cautions and warnings
 */
export function checkCautions(
  formData: SmokingToolFormData
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Psychiatric history
  if (formData.medicalHistory.psychiatricHistory) {
    alerts.push({
      severity: "caution",
      code: "PSYCHIATRIC_HISTORY",
      message: "Varenicline requires careful psychiatric monitoring",
      detail: `Patient reports: ${formData.medicalHistory.psychiatricDetails || "psychiatric history"}. Close monitoring for mood changes, depression, and neuropsychiatric symptoms is essential. Discuss risks/benefits with patient.`,
    });
  }

  // Current depression
  if (formData.medicalHistory.currentDepression) {
    alerts.push({
      severity: "caution",
      code: "CURRENT_DEPRESSION",
      message: "Varenicline may affect mood in patients with depression",
      detail:
        "Patient reports current depression. Monitor closely for mood deterioration, suicidal thoughts, and unusual behaviour. Consider liaison with mental health team.",
    });
  }

  // Seizure history
  if (formData.medicalHistory.seizureHistory) {
    alerts.push({
      severity: "caution",
      code: "SEIZURE_HISTORY",
      message: "Varenicline may lower seizure threshold",
      detail:
        "Patient reports seizure history. Monitor closely and ensure seizure management optimised. Discuss risks with patient.",
    });
  }

  // Renal impairment
  if (formData.medicalHistory.renalImpairment === "moderate") {
    alerts.push({
      severity: "caution",
      code: "MODERATE_RENAL_IMPAIRMENT",
      message: "Dose adjustment required for moderate renal impairment",
      detail:
        "Maximum dose: 1mg once daily (instead of 1mg twice daily). Monitor tolerability and renal function.",
    });
  } else if (formData.medicalHistory.renalImpairment === "severe") {
    alerts.push({
      severity: "red-flag",
      code: "SEVERE_RENAL_IMPAIRMENT",
      message: "Severe renal impairment requires specialist supervision",
      detail:
        "Maximum dose: 0.5mg once daily. Refer for specialist pharmacological advice and monitoring.",
    });
  }

  // Hepatic impairment (mild-moderate)
  if (formData.medicalHistory.hepaticImpairment === "mild-moderate") {
    alerts.push({
      severity: "caution",
      code: "HEPATIC_IMPAIRMENT",
      message: "Monitor for tolerability in hepatic impairment",
      detail:
        "Mild-moderate hepatic impairment: standard dosing may be used but monitor closely for adverse effects.",
    });
  }

  // Cardiovascular disease
  if (formData.medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "CARDIOVASCULAR_DISEASE",
      message: "Varenicline generally safe in cardiovascular disease",
      detail:
        "Smoking cessation reduces cardiovascular risk. Monitor for any chest pain or palpitations. Benefits of cessation usually outweigh risks.",
    });
  }

  // Eating disorder
  if (formData.medicalHistory.eatingDisorder) {
    alerts.push({
      severity: "caution",
      code: "EATING_DISORDER",
      message: "Monitor weight changes on varenicline",
      detail:
        "Smoking cessation and varenicline may cause weight gain. Discuss with patient; monitor weight and eating behaviours.",
    });
  }

  // Drug interactions - Warfarin
  if (formData.medications.takesWarfarin) {
    alerts.push({
      severity: "caution",
      code: "WARFARIN_INTERACTION",
      message: "Smoking cessation may increase warfarin effect",
      detail:
        "INR may increase as smoking reduces warfarin metabolism. Recommend INR check 3-5 days after varenicline initiation and weekly thereafter until stable. Dose adjustment may be needed.",
    });
  }

  // Drug interactions - Insulin
  if (formData.medications.takesInsulin) {
    alerts.push({
      severity: "caution",
      code: "INSULIN_INTERACTION",
      message: "Smoking cessation may affect insulin requirement",
      detail:
        "Reduced nicotine may increase insulin absorption. Monitor blood glucose closely and adjust insulin dose if needed in consultation with diabetes team.",
    });
  }

  // Drug interactions - Theophylline
  if (formData.medications.takesTheophylline) {
    alerts.push({
      severity: "caution",
      code: "THEOPHYLLINE_INTERACTION",
      message: "Smoking cessation may affect theophylline levels",
      detail:
        "Smoking induces theophylline metabolism. Levels may increase on cessation. Monitor for toxicity and consider dose adjustment with prescriber.",
    });
  }

  // Drug interactions - Clopidogrel
  if (formData.medications.takesClopidogrel) {
    alerts.push({
      severity: "caution",
      code: "CLOPIDOGREL_INTERACTION",
      message: "Monitor for clopidogrel effectiveness during cessation",
      detail:
        "Smoking may affect clopidogrel metabolism. Discuss with cardiologist regarding monitoring during cessation.",
    });
  }

  // Antipsychotics or antidepressants with psychiatric history
  if (
    (formData.medications.takesAntipsychotics ||
      formData.medications.takesAntidepressants) &&
    formData.medicalHistory.psychiatricHistory
  ) {
    alerts.push({
      severity: "caution",
      code: "PSYCHIATRIC_MEDICATION_COMBO",
      message: "Close monitoring required for psychiatric medications",
      detail:
        "Patient on psychiatric medication with psychiatric history. Varenicline may interact with mood regulation. Close monitoring essential.",
    });
  }

  return alerts;
}

/**
 * Check for red flags (warning signs requiring urgent action)
 */
export function checkRedFlags(
  formData: SmokingToolFormData
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // These are signs that would develop during treatment
  // But we check baseline risk factors here
  if (formData.medicalHistory.suicidalIdeation) {
    alerts.push({
      severity: "red-flag",
      code: "BASELINE_SUICIDAL_RISK",
      message: "Baseline suicidal ideation present",
      detail:
        "This is a hard contraindication. Patient requires psychological assessment before any pharmacological intervention.",
    });
  }

  if (
    formData.medicalHistory.psychiatricHistory &&
    formData.medicalHistory.psychiatricDetails.toLowerCase().includes("bipolar")
  ) {
    alerts.push({
      severity: "red-flag",
      code: "BIPOLAR_DISORDER",
      message: "Bipolar disorder requires specialist consultation",
      detail:
        "Varenicline may destabilise mood in bipolar disorder. Recommend joint consultation with psychiatry before proceeding.",
    });
  }

  return alerts;
}

/**
 * Determine appropriate dose titration plan
 */
export function calculateDosePlan(
  formData: SmokingToolFormData
): { phase: string; currentDose: string; schedule: string } {
  const renalImpairment: string = formData.medicalHistory.renalImpairment;

  if (renalImpairment === "severe") {
    return {
      phase: "titration",
      currentDose: "0.5mg OD",
      schedule:
        "Varenicline 0.5mg once daily for full 12 weeks. No escalation due to severe renal impairment.",
    };
  } else if (renalImpairment === "moderate") {
    return {
      phase: "titration",
      currentDose: "0.5mg BD then 1mg OD",
      schedule:
        "Days 1-7: Varenicline 0.5mg once daily. Days 8-12: Varenicline 0.5mg twice daily. Week 2 onwards: Varenicline 1mg once daily maximum.",
    };
  } else {
    // Normal renal function
    return {
      phase: "titration",
      currentDose: "0.5mg OD → 0.5mg BD → 1mg BD",
      schedule:
        "Days 1-3: Varenicline 0.5mg once daily. Days 4-7: Varenicline 0.5mg twice daily. Week 2-12: Varenicline 1mg twice daily (maintenance).",
    };
  }
}

/**
 * Calculate required tablet quantities
 */
export function calculateQuantities(treatmentDuration: string): number {
  // Assuming standard dosing (not renal impairment)
  // Starter pack: Days 1-7
  // Week 1: 7 x 0.5mg OD = 7 tablets
  // Week 1: 4 x 0.5mg BD = 8 tablets (from day 4)
  // Total week 1-2: ~11 x 0.5mg + 14 x 1mg tablets

  if (treatmentDuration === "12-weeks") {
    // Standard 12-week course
    // Weeks 1-2: Titration (starter pack equivalent) = ~25 tablets
    // Weeks 2-12 (11 weeks): Maintenance 1mg BD = 11 x 7 x 2 = 154 tablets
    // Total: ~179 tablets, typically dispensed as:
    // - Starter pack (2 weeks) + 2 x Continuation packs (4 weeks each)
    return 56; // Return per standard pack quantity
  } else {
    // 24-week extended course (e.g., for extended support)
    // Would need 24 weeks maintenance = more packs
    return 112;
  }
}

/**
 * Main validation function - check all alerts
 */
export function getAllClinicalAlerts(
  formData: SmokingToolFormData
): { hardStops: ClinicalAlert[]; cautions: ClinicalAlert[]; redFlags: ClinicalAlert[] } {
  const hardStops: ClinicalAlert[] = checkHardContraindications(formData);
  const cautions: ClinicalAlert[] = checkCautions(formData);
  const redFlags: ClinicalAlert[] = checkRedFlags(formData);

  return { hardStops, cautions, redFlags };
}

/**
 * Determine if patient is suitable for varenicline (ignoring cautions, just hard stops)
 */
export function isSuitableForVarenicline(formData: SmokingToolFormData): boolean {
  const { hardStops } = getAllClinicalAlerts(formData);
  return hardStops.length === 0;
}

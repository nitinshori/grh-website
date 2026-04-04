// ─── Sore Throat Clinical Logic ───

import type { ClinicalAlert } from "../../shared/types";
import type {
  SoreThroatSymptoms,
  FeverPAINScore,
  SoreThroatExamination,
  SoreThroatHistory,
  SoreThroatMedicine,
  SoreThroatCounselling,
} from "./sore-throat-types";

// ─── Alert Generation ───

export function generateExclusionAlerts(
  age: number | null,
  symptoms: SoreThroatSymptoms,
  history: SoreThroatHistory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age exclusion: <5 years
  if (age !== null && age < 5) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient is under 5 years old",
      detail: "This PGD applies to patients aged 5 years and older. Refer to GP.",
    });
  }

  // Stridor or respiratory distress (drooling + inability to swallow)
  if (symptoms.drooling && symptoms.dysphagia) {
    alerts.push({
      severity: "stop",
      code: "RESPIRATORY_DISTRESS",
      message: "Signs of respiratory distress or severe difficulty swallowing",
      detail:
        "Patient has drooling and inability to swallow. Urgent referral to GP or A&E required.",
    });
  }

  // Suspected peritonsillar abscess/quinsy
  if (symptoms.trismus && symptoms.unilateralSwelling && symptoms.muffledVoice) {
    alerts.push({
      severity: "stop",
      code: "SUSPECTED_QUINSY",
      message: "Suspected peritonsillar abscess (quinsy)",
      detail:
        "Patient has trismus, unilateral swelling, and muffled voice. Urgent referral to GP or ENT required.",
    });
  }

  // Immunosuppression
  if (history.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail: "This PGD is not suitable for immunosuppressed patients. Refer to GP.",
    });
  }

  // Symptoms >7 days without improvement
  if (symptoms.duration === ">7 days") {
    alerts.push({
      severity: "stop",
      code: "SYMPTOMS_PROLONGED",
      message: "Symptoms persisting for over 7 days",
      detail:
        "Long-standing sore throat requires investigation. Refer to GP for assessment.",
    });
  }

  return alerts;
}

export function generateCautionAlerts(
  symptoms: SoreThroatSymptoms,
  history: SoreThroatHistory,
  examination: SoreThroatExamination
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Penicillin allergy
  if (history.penicillinAllergy) {
    alerts.push({
      severity: "caution",
      code: "PENICILLIN_ALLERGY",
      message: "Patient has penicillin allergy",
      detail: "Use clarithromycin instead of phenoxymethylpenicillin.",
    });
  }

  // Recurrent tonsillitis
  if (history.recurrentTonsillitis) {
    alerts.push({
      severity: "caution",
      code: "RECURRENT_TONSILLITIS",
      message: "Patient has history of recurrent tonsillitis",
      detail:
        "May benefit from ENT referral for assessment of need for tonsillectomy.",
    });
  }

  // Rheumatic fever history
  if (history.rheumaticFeverHistory) {
    alerts.push({
      severity: "caution",
      code: "RHEUMATIC_FEVER_HISTORY",
      message: "Patient has history of acute rheumatic fever",
      detail: "Lower threshold for antibiotic use. Consider immediate antibiotic.",
    });
  }

  // Suspected quinsy symptoms (red flag, not exclusion)
  if (symptoms.trismus || symptoms.unilateralSwelling || symptoms.muffledVoice) {
    alerts.push({
      severity: "red-flag",
      code: "QUINSY_SYMPTOMS",
      message: "Symptoms suggestive of peritonsillar abscess",
      detail:
        "Consider referral to GP or ENT. May require drainage or IV antibiotics.",
    });
  }

  // Severe tonsillar appearance
  if (examination.tonsillarAppearance === "abscess") {
    alerts.push({
      severity: "red-flag",
      code: "ABSCESS_PRESENT",
      message: "Evidence of tonsillar abscess on examination",
      detail: "Consider referral to GP or ENT for further assessment.",
    });
  }

  // High fever
  if (examination.temperature !== null && examination.temperature >= 39) {
    alerts.push({
      severity: "caution",
      code: "HIGH_FEVER",
      message: "Patient has high fever (>=39°C)",
      detail:
        "Consider investigations and urgent referral if symptoms do not improve.",
    });
  }

  return alerts;
}

// ─── FeverPAIN Score Calculation ───

export function calculateFeverPAINScore(
  fever: boolean,
  purulence: boolean,
  attendRapidly: boolean,
  inflamedTonsils: boolean,
  noCoughCoryza: boolean
): number {
  let score = 0;
  if (fever) score++;
  if (purulence) score++;
  if (attendRapidly) score++;
  if (inflamedTonsils) score++;
  if (noCoughCoryza) score++;
  return score;
}

export function interpretFeverPAINScore(
  score: number,
  rapidStrepAResult: string
): {
  riskLevel: "very-low" | "moderate" | "high";
  label: string;
  recommendation: string;
} {
  // If Rapid Strep A positive: antibiotic regardless of score
  if (rapidStrepAResult === "positive") {
    return {
      riskLevel: "high",
      label: "Rapid Strep A Positive",
      recommendation:
        "Antibiotic indicated. Consider immediate antibiotic prescription.",
    };
  }

  // If Rapid Strep A negative: self-care regardless of score
  if (rapidStrepAResult === "negative") {
    return {
      riskLevel: "very-low",
      label: "Rapid Strep A Negative",
      recommendation:
        "Antibiotics not indicated. Recommend self-care advice only.",
    };
  }

  // FeverPAIN interpretation if Strep A not performed
  if (score <= 1) {
    return {
      riskLevel: "very-low",
      label: "Low Risk (FeverPAIN 0-1)",
      recommendation:
        "Very unlikely strep throat. Self-care advice only, no antibiotic.",
    };
  }

  if (score === 2 || score === 3) {
    return {
      riskLevel: "moderate",
      label: "Moderate Risk (FeverPAIN 2-3)",
      recommendation:
        "Consider delayed/back-up antibiotic prescription. Self-care initially.",
    };
  }

  return {
    riskLevel: "high",
    label: "High Risk (FeverPAIN 4-5)",
    recommendation:
      "Likely strep throat. Consider immediate antibiotic prescription.",
  };
}

// ─── Medicine Recommendations ───

export function recommendMedicine(
  feverPainScore: number,
  rapidStrepAResult: string,
  age: number | null,
  penicillinAllergy: boolean,
  rheumaticFeverHistory: boolean
): {
  shouldPrescribe: boolean;
  recommendation: string;
  medicine: "phenoxymethylpenicillin" | "clarithromycin" | "none";
  dose: string;
  frequency: string;
  duration: string;
} {
  // Determine if antibiotic is indicated
  let shouldPrescribe = false;

  if (rapidStrepAResult === "positive") {
    shouldPrescribe = true;
  } else if (rapidStrepAResult === "negative") {
    shouldPrescribe = false;
  } else if (rheumaticFeverHistory) {
    // Lower threshold for rheumatic fever history
    shouldPrescribe = feverPainScore >= 2;
  } else {
    shouldPrescribe = feverPainScore >= 4;
  }

  if (!shouldPrescribe) {
    return {
      shouldPrescribe: false,
      recommendation: "No antibiotic recommended. Advise self-care.",
      medicine: "none",
      dose: "",
      frequency: "",
      duration: "",
    };
  }

  // Select medicine based on allergy
  const medicine = penicillinAllergy ? "clarithromycin" : "phenoxymethylpenicillin";

  if (medicine === "clarithromycin") {
    return {
      shouldPrescribe: true,
      recommendation:
        "Patient has penicillin allergy. Use clarithromycin instead.",
      medicine: "clarithromycin",
      dose: age && age < 12 ? "7.5 mg/kg" : "250 mg",
      frequency: "twice daily",
      duration: "5 days",
    };
  }

  // Phenoxymethylpenicillin (Pen V)
  return {
    shouldPrescribe: true,
    recommendation: "Phenoxymethylpenicillin (Pen V) recommended.",
    medicine: "phenoxymethylpenicillin",
    dose: age && age < 12 ? "250 mg" : "500 mg",
    frequency: "four times daily",
    duration: "5-10 days",
  };
}

// ─── Validation ───

export function validateSymptomStep(symptoms: SoreThroatSymptoms): string | null {
  if (!symptoms.duration) return "Duration of symptoms is required";
  if (!symptoms.soreThroatSeverity) return "Severity of sore throat is required";
  return null;
}

export function validateFeverPAINStep(
  feverPain: FeverPAINScore
): string | null {
  // At least one field should be checked for FeverPAIN to be valid
  // No specific validation - it auto-calculates
  return null;
}

export function validateExaminationStep(
  examination: SoreThroatExamination
): string | null {
  if (!examination.rapidStrepAResult)
    return "Rapid Strep A test result is required";
  if (!examination.tonsillarAppearance)
    return "Tonsillar appearance assessment is required";
  return null;
}

export function validateHistoryStep(history: SoreThroatHistory): string | null {
  // All fields are optional, validation can be custom based on logic
  return null;
}

export function validateMedicineStep(medicine: SoreThroatMedicine): string | null {
  if (!medicine.medicine) return "Medicine selection is required";
  if (medicine.medicine !== "none") {
    if (!medicine.dose) return "Dose is required";
    if (!medicine.frequency) return "Frequency is required";
    if (!medicine.duration) return "Duration is required";
    if (!medicine.quantity) return "Quantity is required";
  }
  return null;
}

export function validateCounsellingStep(
  counselling: SoreThroatCounselling
): string | null {
  // All counselling points are checkboxes - validation can be custom
  return null;
}

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
  history: SoreThroatHistory,
  examination?: SoreThroatExamination
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age exclusion: under 18 years (PGD v003: adults aged 18 years and over)
  if (age !== null && age < 18) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient is under 18 years old",
      detail: "This PGD applies to adults aged 18 years and over. Refer to GP.",
    });
  }

  // Airway compromise, suspected quinsy or epiglottitis: any one red flag excludes
  const airwayRedFlags: string[] = [];
  if (symptoms.stridor) airwayRedFlags.push("stridor");
  if (symptoms.difficultyBreathing) airwayRedFlags.push("difficulty breathing");
  if (symptoms.drooling) airwayRedFlags.push("drooling");
  if (symptoms.unableToSwallowSaliva) airwayRedFlags.push("inability to swallow saliva");
  if (symptoms.trismus) airwayRedFlags.push("trismus");
  if (symptoms.muffledVoice) airwayRedFlags.push("muffled 'hot potato' voice");
  if (symptoms.unilateralSwelling) airwayRedFlags.push("unilateral peritonsillar swelling");
  if (symptoms.uvulaDeviation) airwayRedFlags.push("deviation of the uvula");
  if (examination && examination.tonsillarAppearance === "abscess")
    airwayRedFlags.push("peritonsillar abscess on examination");
  if (airwayRedFlags.length > 0) {
    alerts.push({
      severity: "stop",
      code: "AIRWAY_QUINSY_EPIGLOTTITIS",
      message: "Suspected quinsy, epiglottitis or airway compromise",
      detail:
        "Present: " + airwayRedFlags.join(", ") + ". Emergency referral, 999 or A&E. Do not examine the throat with a tongue depressor where epiglottitis is possible.",
    });
  }

  // Legacy combined check retained (drooling and dysphagia); drooling alone now excludes above
  if (symptoms.drooling && symptoms.dysphagia && airwayRedFlags.length === 0) {
    alerts.push({
      severity: "stop",
      code: "RESPIRATORY_DISTRESS",
      message: "Signs of respiratory distress or severe difficulty swallowing",
      detail:
        "Patient has drooling and inability to swallow. Emergency referral, 999 or A&E.",
    });
  }

  // Sepsis or systemic illness: temperature 38 or above together with any one marker
  if (examination && examination.temperature !== null && examination.temperature >= 38) {
    const sepsisMarkers: string[] = [];
    if (examination.heartRate !== null && examination.heartRate > 90)
      sepsisMarkers.push("heart rate above 90");
    if (examination.respiratoryRate !== null && examination.respiratoryRate >= 20)
      sepsisMarkers.push("respiratory rate 20 or above");
    if (examination.systolicBP !== null && examination.systolicBP < 100)
      sepsisMarkers.push("systolic blood pressure below 100");
    if (examination.newConfusion) sepsisMarkers.push("new confusion");
    if (examination.looksUnwell) sepsisMarkers.push("patient looks unwell");
    if (sepsisMarkers.length > 0) {
      alerts.push({
        severity: "stop",
        code: "SEPSIS_SYSTEMIC_ILLNESS",
        message: "Signs of sepsis or systemic illness",
        detail:
          "Temperature 38°C or above together with " + sepsisMarkers.join(", ") + ". Emergency referral.",
      });
    }
  }

  // Immunosuppression, or a medicine that can cause neutropenia
  if (history.immunosuppressed || history.neutropeniaRiskMedicine) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: history.immunosuppressed
        ? "Patient is immunosuppressed"
        : "Patient takes a medicine that can cause neutropenia",
      detail:
        "Immunosuppression, or a medicine that can cause neutropenia (chemotherapy, carbimazole, clozapine, methotrexate or other DMARDs): refer for a same-day full blood count and clinical assessment.",
    });
  }

  // Symptoms >7 days without improvement (tool threshold; PGD excludes symptoms over 2 weeks)
  if (symptoms.duration === ">7 days") {
    alerts.push({
      severity: "stop",
      code: "SYMPTOMS_PROLONGED",
      message: "Symptoms persisting for over 7 days",
      detail:
        "Long-standing sore throat requires investigation. Refer to GP for assessment.",
    });
  }

  // Possible malignancy pathway
  if (symptoms.persistentNeckLumpOrHoarseness) {
    alerts.push({
      severity: "stop",
      code: "POSSIBLE_MALIGNANCY",
      message: "Persistent unilateral neck lump, unilateral tonsillar enlargement or hoarseness for more than 3 weeks",
      detail: "Refer to the GP (possible malignancy pathway).",
    });
  }

  // Recent antibiotic use for this illness (inclusion: no recent antibiotic use)
  if (history.recentAntibioticForThisIllness) {
    alerts.push({
      severity: "stop",
      code: "RECENT_ANTIBIOTIC",
      message: "Recent antibiotic use for this illness",
      detail:
        "This PGD requires no recent antibiotic use for this illness. Refer to GP.",
    });
  }

  // Severe hepatic or renal dysfunction (both arms)
  if (history.severeHepaticOrRenalDysfunction) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC_RENAL",
      message: "Severe hepatic or renal dysfunction",
      detail: "Excluded from this PGD. Refer to GP.",
    });
  }

  // Clarithromycin arm exclusions: apply when penicillin allergic (no alternative arm)
  if (history.penicillinAllergy) {
    const clariExclusions: string[] = [];
    if (history.macrolideAllergy)
      clariExclusions.push("known hypersensitivity to macrolides (clarithromycin, erythromycin, azithromycin)");
    if (history.ergotamineUse)
      clariExclusions.push("concurrent ergotamine or dihydroergotamine (risk of ergot toxicity)");
    if (history.simvastatinLovastatinUse)
      clariExclusions.push("concurrent simvastatin or lovastatin (increased statin levels)");
    if (history.qtProlongationRisk)
      clariExclusions.push("QT prolongation or risk factors (hypokalaemia, hypomagnesaemia, cardiac arrhythmia history)");
    if (history.clarithromycinInteractingMedicine)
      clariExclusions.push("concurrent colchicine, ticagrelor, ranolazine, ivabradine, domperidone, pimozide, astemizole, cisapride, terfenadine, oral midazolam or lomitapide");
    if (history.severeHepaticImpairment)
      clariExclusions.push("severe hepatic impairment, or severe hepatic failure in combination with renal impairment");
    if (history.myastheniaGravis)
      clariExclusions.push("myasthenia gravis (macrolides can worsen muscle weakness)");
    if (clariExclusions.length > 0) {
      alerts.push({
        severity: "stop",
        code: "CLARITHROMYCIN_EXCLUDED",
        message: "Penicillin allergy with a clarithromycin exclusion",
        detail:
          "Clarithromycin is excluded: " + clariExclusions.join("; ") + ". No PGD antibiotic is available. Refer to GP.",
      });
    }
  }

  return alerts;
}

export function generateCautionAlerts(
  symptoms: SoreThroatSymptoms,
  history: SoreThroatHistory,
  examination: SoreThroatExamination
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Penicillin or beta-lactam allergy
  if (history.penicillinAllergy) {
    alerts.push({
      severity: "caution",
      code: "PENICILLIN_ALLERGY",
      message: "Patient has penicillin or beta-lactam allergy",
      detail:
        "Use clarithromycin instead of phenoxymethylpenicillin. Check every current medicine against the clarithromycin SmPC before supply.",
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

  // Rheumatic fever history (the PGD criteria still apply: FeverPAIN 4 or more, or positive RAST)
  if (history.rheumaticFeverHistory) {
    alerts.push({
      severity: "caution",
      code: "RHEUMATIC_FEVER_HISTORY",
      message: "Patient has history of acute rheumatic fever",
      detail:
        "The PGD criteria still apply (FeverPAIN 4 or more, or positive RAST). If not met, refer to GP for consideration of antibiotics.",
    });
  }

  // Pregnancy and breastfeeding (caution, both arms)
  if (history.pregnantOrBreastfeeding) {
    alerts.push({
      severity: "caution",
      code: "PREGNANCY_BREASTFEEDING",
      message: "Patient is pregnant or breastfeeding",
      detail: history.penicillinAllergy
        ? "Clarithromycin: relatively safe but ensure informed consent; a small amount passes to breast milk."
        : "Penicillin V is generally safe; ensure informed consent.",
    });
  }

  // Mononucleosis (glandular fever)
  if (history.suspectedMononucleosis) {
    alerts.push({
      severity: "caution",
      code: "MONONUCLEOSIS",
      message: "Possible mononucleosis (glandular fever)",
      detail:
        "Avoid phenoxymethylpenicillin due to risk of rash. If uncertain of diagnosis, clarify before supply.",
    });
  }

  // Oral contraceptives
  if (history.oralContraceptive) {
    alerts.push({
      severity: "caution",
      code: "ORAL_CONTRACEPTIVE",
      message: "Patient uses oral contraception",
      detail:
        "Antibiotics may reduce efficacy of oral contraceptives; advise additional contraception during the course and for 7 days afterwards.",
    });
  }

  // Clarithromycin arm cautions
  if (history.penicillinAllergy && history.renalImpairmentEgfrUnder30) {
    alerts.push({
      severity: "caution",
      code: "CLARI_RENAL",
      message: "Renal impairment (eGFR below 30 mL/min/1.73m2)",
      detail:
        "Clarithromycin: dose adjustment or alternative needed. Consider referral to GP.",
    });
  }
  if (history.penicillinAllergy && history.warfarin) {
    alerts.push({
      severity: "caution",
      code: "CLARI_WARFARIN",
      message: "Patient takes warfarin",
      detail:
        "Clarithromycin: possible increased anticoagulant effect; monitor INR.",
    });
  }

  // Sepsis markers without a documented fever of 38 or above: warn
  const markersPresent =
    (examination.heartRate !== null && examination.heartRate > 90) ||
    (examination.respiratoryRate !== null && examination.respiratoryRate >= 20) ||
    (examination.systolicBP !== null && examination.systolicBP < 100) ||
    examination.newConfusion ||
    examination.looksUnwell;
  if (
    markersPresent &&
    !(examination.temperature !== null && examination.temperature >= 38)
  ) {
    alerts.push({
      severity: "red-flag",
      code: "SEPSIS_MARKER",
      message: "Systemic illness marker present",
      detail:
        "Record the temperature. With a temperature of 38°C or above this is a sepsis exclusion (emergency referral). Use clinical judgement and refer if the patient looks unwell.",
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
  // If Rapid Strep A positive: antibiotic indicated regardless of score
  if (rapidStrepAResult === "positive") {
    return {
      riskLevel: "high",
      label: "Rapid Strep A Positive",
      recommendation:
        "Antibiotic indicated under this PGD (positive rapid antigen test for Group A Streptococcus).",
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
      label: "FeverPAIN 2-3",
      recommendation:
        "Antibiotics not indicated under this PGD without a positive RAST (NICE: do not offer antibiotics for FeverPAIN 0-3 without test). Advise supportive care.",
    };
  }

  return {
    riskLevel: "high",
    label: "FeverPAIN 4-5",
    recommendation:
      "Likely strep throat. Antibiotic indicated under this PGD (FeverPAIN 4 or more).",
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

  // PGD v003 inclusion: FeverPAIN 4 or more, OR positive RAST. A history of
  // rheumatic fever does not lower the threshold under this PGD.
  void rheumaticFeverHistory;
  void age;
  if (rapidStrepAResult === "positive") {
    shouldPrescribe = true;
  } else if (rapidStrepAResult === "negative") {
    shouldPrescribe = false;
  } else {
    shouldPrescribe = feverPainScore >= 4;
  }

  if (!shouldPrescribe) {
    return {
      shouldPrescribe: false,
      recommendation: "No antibiotic under this PGD. Advise self-care.",
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
        "Patient has penicillin allergy. Clarithromycin 250mg tablets, one tablet twice daily for 5 days (10 tablets).",
      medicine: "clarithromycin",
      dose: "250 mg",
      frequency: "twice daily",
      duration: "5 days",
    };
  }

  // Phenoxymethylpenicillin (Pen V)
  return {
    shouldPrescribe: true,
    recommendation:
      "Phenoxymethylpenicillin 500mg tablets, one tablet four times daily on an empty stomach for 5-10 days (20-40 tablets).",
    medicine: "phenoxymethylpenicillin",
    dose: "500 mg",
    frequency: "four times daily",
    duration: "5-10 days",
  };
}

// ─── Fixed regimens (PGD v003) ───

export const PEN_V_DURATIONS = ["5 days", "6 days", "7 days", "8 days", "9 days", "10 days"] as const;
export const CLARI_DURATIONS = ["5 days"] as const;

export function expectedQuantity(
  medicine: SoreThroatMedicine["medicine"],
  duration: string
): number | null {
  const days = parseInt(duration, 10);
  if (isNaN(days)) return null;
  if (medicine === "phenoxymethylpenicillin") return days * 4;
  if (medicine === "clarithromycin") return days * 2;
  return null;
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
  if (examination.temperature === null)
    return "Temperature is required for the sepsis screen";
  return null;
}

export function validateHistoryStep(history: SoreThroatHistory): string | null {
  if (!history.ableToTakeOralMedication)
    return "Confirm the patient is able to take oral medication";
  return null;
}

export function validateMedicineStep(
  medicine: SoreThroatMedicine,
  opts?: { shouldPrescribe: boolean; penicillinAllergy: boolean }
): string | null {
  if (!medicine.medicine) return "Medicine selection is required";
  if (medicine.medicine !== "none") {
    if (opts && !opts.shouldPrescribe)
      return "Antibiotics may only be supplied under this PGD with FeverPAIN 4 or more, or a positive RAST";
    if (opts && opts.penicillinAllergy && medicine.medicine === "phenoxymethylpenicillin")
      return "Phenoxymethylpenicillin is excluded in penicillin or beta-lactam allergy; select clarithromycin";
    if (opts && !opts.penicillinAllergy && medicine.medicine === "clarithromycin")
      return "Clarithromycin under this PGD requires a documented penicillin allergy or intolerance";
    if (!medicine.dose) return "Dose is required";
    if (!medicine.frequency) return "Frequency is required";
    if (!medicine.duration) return "Duration is required";
    if (!medicine.quantity) return "Quantity is required";
    const expected = expectedQuantity(medicine.medicine, medicine.duration);
    if (expected !== null && medicine.quantity !== expected)
      return `Quantity must be ${expected} tablets for a ${medicine.duration} course`;
  }
  return null;
}

export function validateCounsellingStep(
  counselling: SoreThroatCounselling
): string | null {
  // All counselling points are checkboxes - validation can be custom
  return null;
}

// ─── Wegovy Clinical Decision Logic ───

import type {
  WegovyConsultationState,
  ClinicalAlert,
  DoseRecommendation,
} from "./wegovy-types";

// ─── Calculate BMI ───

export function calculateBMI(heightCm: number | null, weightKg: number | null): number | null {
  if (heightCm === null || weightKg === null || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// ─── BMI Category ───

export function getBMICategory(
  bmi: number | null
): "underweight" | "normal" | "overweight" | "obese-i" | "obese-ii" | "obese-iii" | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obese-i";
  if (bmi < 40) return "obese-ii";
  return "obese-iii";
}

// ─── Hard Stop Exclusions ───

function getHardStopAlerts(state: WegovyConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age <18
  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient is under 18 years old",
      detail: "Wegovy is only indicated for patients aged 18 and over.",
    });
  }

  // BMI eligibility
  const bmi = state.weightAssessment.bmi;
  if (bmi !== null) {
    if (bmi < 27) {
      alerts.push({
        severity: "stop",
        code: "BMI_TOO_LOW",
        message: "BMI is below 27 kg/m²",
        detail:
          "Wegovy is indicated for BMI ≥30, or BMI ≥27 with weight-related comorbidities.",
      });
    } else if (bmi >= 27 && bmi < 30) {
      // BMI 27-29.9: needs comorbidity
      if (state.weightAssessment.weightRelatedComorbidities.length === 0) {
        alerts.push({
          severity: "stop",
          code: "BMI_27_NO_COMORBIDITY",
          message: "BMI 27-29.9 without documented weight-related comorbidity",
          detail:
            "For BMI 27-29.9, at least one weight-related comorbidity (hypertension, type 2 diabetes, sleep apnoea, osteoarthritis, PCOS, or dyslipidaemia) must be present.",
        });
      }
    }
  }

  // MTC history (personal or family)
  if (state.medicalHistory.personalMTCHistory) {
    alerts.push({
      severity: "stop",
      code: "PERSONAL_MTC",
      message: "Personal history of medullary thyroid carcinoma",
      detail:
        "GLP-1 agonists are contraindicated in patients with personal MTC history due to risk of thyroid carcinoma progression.",
    });
  }

  if (state.medicalHistory.familyMTCHistory) {
    alerts.push({
      severity: "stop",
      code: "FAMILY_MTC",
      message: "Family history of medullary thyroid carcinoma",
      detail:
        "GLP-1 agonists are contraindicated due to risk of MTC in genetically predisposed individuals.",
    });
  }

  // MEN2
  if (state.medicalHistory.men2) {
    alerts.push({
      severity: "stop",
      code: "MEN2",
      message: "Multiple endocrine neoplasia type 2",
      detail:
        "GLP-1 agonists are contraindicated in MEN2 syndrome due to increased thyroid carcinoma risk.",
    });
  }

  // Pregnancy / breastfeeding / planning pregnancy
  if (state.medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANT",
      message: "Patient is currently pregnant",
      detail: "Wegovy is contraindicated in pregnancy.",
    });
  }

  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "BREASTFEEDING",
      message: "Patient is currently breastfeeding",
      detail: "Wegovy is contraindicated during breastfeeding.",
    });
  }

  if (state.medicalHistory.planningPregnancy) {
    alerts.push({
      severity: "stop",
      code: "PLANNING_PREGNANCY",
      message: "Patient is planning pregnancy within 2 months",
      detail:
        "Wegovy should not be started if pregnancy is planned within the next 2 months.",
    });
  }

  // Severe GI disease
  if (state.medicalHistory.severeGIDisease) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_GI",
      message: "Severe gastrointestinal disease present",
      detail:
        "GLP-1 agonists are contraindicated in severe GI disease (gastroparesis, inflammatory bowel disease) due to GI slowing and increased adverse effects.",
    });
  }

  // Active eating disorder
  if (state.medicalHistory.eatingDisorder) {
    alerts.push({
      severity: "stop",
      code: "EATING_DISORDER",
      message: "Active eating disorder",
      detail:
        "GLP-1 agonists should not be used in patients with active eating disorders due to risk of harm.",
    });
  }

  // Severe hepatic impairment
  if (state.medicalHistory.severeHepatic) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment",
      detail: "GLP-1 agonists are contraindicated in severe hepatic disease.",
    });
  }

  // Current suicidal ideation
  if (state.medicalHistory.suicidalIdeation) {
    alerts.push({
      severity: "stop",
      code: "SUICIDAL_IDEATION",
      message: "Active suicidal ideation reported",
      detail:
        "Do not initiate Wegovy. Refer patient urgently to mental health services. GLP-1 use requires close psychiatric monitoring and should only be considered with specialist input.",
    });
  }

  // Already on another GLP-1 agonist
  if (state.medications.currentGLP1) {
    alerts.push({
      severity: "stop",
      code: "ALREADY_ON_GLP1",
      message: "Patient already taking another GLP-1 agonist",
      detail: "Concurrent GLP-1 agonists are not recommended. Clarify current therapy.",
    });
  }

  return alerts;
}

// ─── Caution Alerts ───

function getCautionAlerts(state: WegovyConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Pancreatitis history
  if (state.medicalHistory.pancreatitisHistory) {
    alerts.push({
      severity: "caution",
      code: "PANCREATITIS_HISTORY",
      message: "History of pancreatitis",
      detail:
        "Close monitoring required. GLP-1 agonists increase pancreatitis risk. Advise on warning signs (severe abdominal pain). Monitor amylase if symptoms develop.",
    });
  }

  // Gallbladder disease
  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "caution",
      code: "GALLBLADDER_DISEASE",
      message: "History of gallbladder disease",
      detail:
        "GLP-1 agonists increase cholelithiasis risk. Monitor for symptoms (upper right quadrant pain). Consider ultrasound baseline.",
    });
  }

  // Diabetic retinopathy
  if (state.medicalHistory.diabeticRetinopathy) {
    alerts.push({
      severity: "caution",
      code: "DIABETIC_RETINOPATHY",
      message: "Diabetic retinopathy present",
      detail:
        "Rapid weight loss may transiently worsen retinopathy. Baseline ophthalmology review recommended. Monitor closely.",
    });
  }

  // Depression
  if (state.medicalHistory.depression) {
    alerts.push({
      severity: "caution",
      code: "DEPRESSION",
      message: "History of depression",
      detail:
        "Monitor mood closely throughout treatment. GLP-1 use requires baseline and ongoing psychiatric assessment, especially given suicide risk signal in trials.",
    });
  }

  // Taking insulin
  if (state.medications.takesInsulin) {
    alerts.push({
      severity: "caution",
      code: "INSULIN_INTERACTION",
      message: "Patient currently taking insulin",
      detail:
        "Risk of hypoglycaemia. Reduce insulin dose by approximately 20% and monitor blood glucose closely. Educate on hypoglycaemic symptoms.",
    });
  }

  // Taking sulphonylureas
  if (state.medications.takesSulphonylureas) {
    alerts.push({
      severity: "caution",
      code: "SU_INTERACTION",
      message: "Patient taking sulphonylureas",
      detail:
        "Risk of hypoglycaemia. Consider dose reduction or switching to alternative. Monitor blood glucose closely.",
    });
  }

  // Thyroid disease
  if (state.medicalHistory.thyroidDisease) {
    alerts.push({
      severity: "caution",
      code: "THYROID_DISEASE",
      message: "Thyroid disease present",
      detail:
        "Monitor thyroid function. Advise on warning signs of thyroid tumour (neck mass, dysphagia, hoarseness, persistent cough).",
    });
  }

  // Severe renal impairment
  if (state.medicalHistory.severeRenal) {
    alerts.push({
      severity: "caution",
      code: "RENAL_IMPAIRMENT",
      message: "Severe renal impairment",
      detail:
        "Not contraindicated but requires monitoring. Risk of dehydration and acute kidney injury, especially with GI side effects. Monitor renal function.",
    });
  }

  // Oral contraceptives
  if (state.medications.takesOralContraceptives) {
    alerts.push({
      severity: "caution",
      code: "OCP_EFFICACY",
      message: "Patient taking oral contraceptives",
      detail:
        "GLP-1 agonists may reduce OCP efficacy due to GI motility changes. Advise backup contraception and consider alternative methods.",
    });
  }

  return alerts;
}

// ─── Red Flag Alerts ───

function getRedFlagAlerts(state: WegovyConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Suicidal thoughts or severe depression
  if (state.medicalHistory.depression || state.medicalHistory.suicidalIdeation) {
    if (state.medicalHistory.suicidalIdeation) {
      alerts.push({
        severity: "red-flag",
        code: "SUICIDE_RISK",
        message: "Acute suicide risk",
        detail:
          "URGENT: Do not supply. Refer to emergency mental health services immediately.",
      });
    } else {
      alerts.push({
        severity: "red-flag",
        code: "DEPRESSION_RED_FLAG",
        message: "Depression with elevated suicide risk",
        detail:
          "Baseline psychiatric assessment mandatory before starting. Enhanced monitoring throughout treatment.",
      });
    }
  }

  return alerts;
}

// ─── Get All Alerts ───

export function getAllAlerts(state: WegovyConsultationState): ClinicalAlert[] {
  const hardStops = getHardStopAlerts(state);
  const cautions = getCautionAlerts(state);
  const redFlags = getRedFlagAlerts(state);

  // If hard stops exist, don't show other alerts yet
  if (hardStops.length > 0) {
    return hardStops;
  }

  return [...redFlags, ...cautions];
}

// ─── Has Hard Stops ───

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

// ─── Dose Recommendation ───

export function calculateDoseRecommendation(
  state: WegovyConsultationState
): DoseRecommendation | null {
  // If patient is already on a dose, continue with current stage
  if (state.doseSelection.currentDoseStage) {
    return {
      stage: state.doseSelection.currentDoseStage as "initiation" | "escalation" | "maintenance",
      dose: state.doseSelection.dose,
      reason: "Continuing with current dose stage",
      titrationSchedule:
        "Follow standard 4-week escalation intervals. Each step = 1 month supply (4 pens).",
    };
  }

  // New patient: start with initiation dose (0.25mg)
  return {
    stage: "initiation",
    dose: "0.25mg",
    reason: "Standard initiation dose for new patients (weeks 1-4)",
    titrationSchedule:
      "Weeks 1-4: 0.25mg, Weeks 5-8: 0.5mg, Weeks 9-12: 1mg, Weeks 13-16: 1.7mg, Week 17+: 2.4mg. Each step = 4 pens (1 month supply).",
  };
}

// ─── Validation ===

export function validatePatientStep(state: WegovyConsultationState): string | null {
  if (!state.patient.firstName.trim()) return "Patient first name is required";
  if (!state.patient.lastName.trim()) return "Patient last name is required";
  if (!state.patient.dateOfBirth) return "Date of birth is required";
  if (state.patient.age === null) return "Unable to calculate age";
  if (state.patient.age < 18) return "Patient must be 18 years or older";
  return null;
}

export function validateConsentStep(state: WegovyConsultationState): string | null {
  if (!state.consent.informedConsentGiven) return "Informed consent must be obtained";
  if (!state.consent.idVerified) return "ID verification is required";
  if (!state.consent.patientAwarePrivateService)
    return "Patient must be aware this is a private service";
  return null;
}

export function validateWeightAssessmentStep(state: WegovyConsultationState): string | null {
  if (state.weightAssessment.height === null) return "Height is required";
  if (state.weightAssessment.weight === null) return "Weight is required";
  if (state.weightAssessment.bmi === null) return "BMI could not be calculated";

  // Check eligibility
  const bmi = state.weightAssessment.bmi;
  if (bmi < 27) {
    return "BMI must be ≥27 (≥30 preferred)";
  }
  if (bmi >= 27 && bmi < 30) {
    if (state.weightAssessment.weightRelatedComorbidities.length === 0) {
      return "For BMI 27-29.9, at least one weight-related comorbidity must be documented";
    }
  }

  return null;
}

export function validateMedicalHistoryStep(state: WegovyConsultationState): string | null {
  // No required fields in medical history (all flags)
  return null;
}

export function validateMedicationsStep(state: WegovyConsultationState): string | null {
  if (state.medications.takesInsulin && !state.medications.insulinDetails.trim()) {
    return "Please specify insulin details";
  }
  if (state.medications.takesSulphonylureas && !state.medications.sulphonylureDetails.trim()) {
    return "Please specify sulphonylurea details";
  }
  return null;
}

export function validateObservationsStep(state: WegovyConsultationState): string | null {
  if (
    state.observations.systolicBP === null ||
    state.observations.diastolicBP === null ||
    state.observations.heartRate === null
  ) {
    return "Blood pressure and heart rate are required";
  }
  return null;
}

export function validateContraindicationsStep(state: WegovyConsultationState): string | null {
  const alerts = getAllAlerts(state);
  const hardStops = alerts.filter((a) => a.severity === "stop");
  if (hardStops.length > 0) {
    return "Hard stop contraindications present — cannot proceed";
  }
  return null;
}

export function validateDoseSelectionStep(state: WegovyConsultationState): string | null {
  if (!state.doseSelection.currentDoseStage) return "Current dose stage must be selected";
  if (!state.doseSelection.dose) return "Dose must be selected";
  if (
    state.doseSelection.pharmacistOverride &&
    !state.doseSelection.overrideReason.trim()
  ) {
    return "Override reason is required";
  }
  return null;
}

export function validateCounsellingStep(state: WegovyConsultationState): string | null {
  // All counselling points should be checked
  const allChecked =
    state.counselling.injectionTechnique &&
    state.counselling.storageFridge &&
    state.counselling.missedDose &&
    state.counselling.giSideEffects &&
    state.counselling.pancreatitisWarning &&
    state.counselling.gallbladderWarning &&
    state.counselling.suicidalIdeationWarning &&
    state.counselling.contraceptionAdvice &&
    state.counselling.dietExerciseAdvice &&
    state.counselling.followUpSchedule;

  // Hypoglycaemia warning only required if on insulin/SU
  if (state.medications.takesInsulin || state.medications.takesSulphonylureas) {
    return allChecked && state.counselling.hypoglycaemiaRisk
      ? null
      : "All counselling points must be confirmed";
  }

  return allChecked ? null : "All counselling points must be confirmed";
}

export function validateSummaryStep(state: WegovyConsultationState): string | null {
  if (!state.summary.pharmacistName.trim()) return "Pharmacist name is required";
  if (!state.summary.pharmacistGPhC.trim()) return "GPhC registration number is required";
  return null;
}

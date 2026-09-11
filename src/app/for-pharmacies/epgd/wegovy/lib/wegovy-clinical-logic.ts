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
      detail: "This PGD covers adults aged 18 to 75 years (inclusive).",
    });
  }

  // Age over 75 (PGD v007 upper age limit)
  if (state.patient.age !== null && state.patient.age > 75) {
    alerts.push({
      severity: "stop",
      code: "AGE_OVER_75",
      message: "Patient is over 75 years old",
      detail:
        "Adults aged over 75 years are excluded (upper age limit under this PGD). Refer to a specialist if treatment is being considered.",
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
          "BMI below the PGD inclusion threshold. Wegovy is indicated for BMI 30 kg/m² or above, or BMI 27 kg/m² or above with at least one weight-related comorbidity.",
      });
    } else if (bmi >= 27 && bmi < 30) {
      // BMI 27-29.9: needs comorbidity
      if (state.weightAssessment.weightRelatedComorbidities.length === 0) {
        alerts.push({
          severity: "stop",
          code: "BMI_27_NO_COMORBIDITY",
          message: "BMI 27 to below 30 without a documented weight-related comorbidity",
          detail:
            "For BMI 27 to below 30 kg/m², at least one weight-related comorbidity (for example hypertension, type 2 diabetes, dyslipidaemia, obstructive sleep apnoea or established cardiovascular disease) must be present.",
        });
      }
    }
  }

  // Known hypersensitivity to semaglutide or any excipient
  if (state.medicalHistory.semaglutideHypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY",
      message: "Known hypersensitivity to semaglutide or to any of the excipients",
      detail: "Contraindicated. Do not supply.",
    });
  }

  // Obesity caused by an endocrinological disorder
  if (state.medicalHistory.endocrineObesity) {
    alerts.push({
      severity: "stop",
      code: "ENDOCRINE_OBESITY",
      message: "Obesity caused by an endocrinological disorder",
      detail:
        "Excluded under this PGD. If the patient was already overweight prior to that diagnosis this exclusion may not apply; untick and document the reasoning if so. Otherwise refer to the GP.",
    });
  }

  // Type 1 diabetes
  if (state.medicalHistory.type1Diabetes) {
    alerts.push({
      severity: "stop",
      code: "TYPE_1_DIABETES",
      message: "Type 1 diabetes mellitus",
      detail: "Excluded under this PGD. Semaglutide must not be used as a substitute for insulin.",
    });
  }

  // Clinical judgement
  if (state.medicalHistory.clinicalJudgementUnsuitable) {
    alerts.push({
      severity: "stop",
      code: "CLINICAL_JUDGEMENT",
      message: "Not suitable in the clinical judgement of the healthcare professional",
      detail:
        "Discuss the reason with the patient, advise on alternative options (GP, specialist weight management service, lifestyle programmes) and document the decision.",
    });
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
      message: "Patient is planning pregnancy",
      detail:
        "Pregnancy, breastfeeding or planning pregnancy is an exclusion. Effective contraception is required; advise discontinuation of semaglutide at least 2 months before planned conception.",
    });
  }

  // Severe GI disease
  if (state.medicalHistory.severeGIDisease) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_GI",
      message: "Severe gastrointestinal disease present",
      detail:
        "Severe gastrointestinal disease, including gastroparesis or a severe persistent gastrointestinal disorder, is an exclusion under this PGD.",
    });
  }

  // History of pancreatitis (acute or chronic): exclusion under PGD v007
  if (state.medicalHistory.pancreatitisHistory) {
    alerts.push({
      severity: "stop",
      code: "PANCREATITIS_HISTORY",
      message: "History of pancreatitis, acute or chronic",
      detail:
        "Excluded under this PGD. Acute pancreatitis, including necrotising pancreatitis with fatal outcomes, has been reported with GLP-1 receptor agonists.",
    });
  }

  // Current gallstones or cholecystitis: exclusion under PGD v007
  if (state.medicalHistory.gallbladderDisease) {
    alerts.push({
      severity: "stop",
      code: "GALLBLADDER_DISEASE",
      message: "Current cholelithiasis (gallstones) or cholecystitis",
      detail: "Excluded under this PGD. Refer to the GP for management before weight management therapy is considered.",
    });
  }

  // Cholecystectomy within the last 3 months: exclusion under PGD v007
  if (state.medicalHistory.recentCholecystectomy) {
    alerts.push({
      severity: "stop",
      code: "RECENT_CHOLECYSTECTOMY",
      message: "Cholecystectomy within the last 3 months",
      detail: "Excluded under this PGD. Reassess once more than 3 months have passed since surgery.",
    });
  }

  // Diabetic retinopathy: exclusion under PGD v007
  if (state.medicalHistory.diabeticRetinopathy) {
    alerts.push({
      severity: "stop",
      code: "DIABETIC_RETINOPATHY",
      message: "Diabetic retinopathy",
      detail: "Treatment may worsen retinopathy; defer or refer to a specialist.",
    });
  }

  // Severe renal impairment or end-stage renal disease: exclusion under PGD v007
  if (state.medicalHistory.severeRenal) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_RENAL",
      message: "Severe renal impairment (eGFR below 30 mL/min/1.73 m²) or end-stage renal disease",
      detail: "Excluded under this PGD. Refer to the GP.",
    });
  }

  // Active eating disorder
  if (state.medicalHistory.eatingDisorder) {
    alerts.push({
      severity: "stop",
      code: "EATING_DISORDER",
      message: "Active eating disorder",
      detail:
        "Active eating disorder (anorexia nervosa, bulimia, or binge-eating disorder under specialist care) is an exclusion under this PGD.",
    });
  }

  // Severe hepatic impairment
  if (state.medicalHistory.severeHepatic) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC",
      message: "Severe hepatic impairment",
      detail: "Severe hepatic impairment is an exclusion under this PGD.",
    });
  }

  // Current suicidal ideation (tool stop; the PGD carries history of suicidal
  // ideation as a caution, so this is stricter than the document)
  if (state.medicalHistory.suicidalIdeation) {
    alerts.push({
      severity: "stop",
      code: "SUICIDAL_IDEATION",
      message: "Active suicidal ideation reported",
      detail:
        "Do not supply. Refer patient urgently to mental health services. The PGD requires appropriate psychiatric oversight to be in place and no current concern before supply.",
    });
  }

  // History of suicidal ideation or active severe mental illness where
  // oversight is absent and concern exists: do not supply (PGD v007 caution wording)
  if (
    state.medicalHistory.depression &&
    state.medicalHistory.mentalHealthConcern &&
    !state.medicalHistory.psychiatricOversightInPlace
  ) {
    alerts.push({
      severity: "stop",
      code: "MENTAL_HEALTH_NO_OVERSIGHT",
      message: "Mental health concern without psychiatric oversight",
      detail:
        "History of suicidal ideation or active severe mental illness: do not supply where oversight is absent and concern exists. Refer.",
    });
  }

  // Already on another GLP-1 agonist or insulin secretagogue, any indication
  if (state.medications.currentGLP1) {
    alerts.push({
      severity: "stop",
      code: "ALREADY_ON_GLP1",
      message: "Patient already taking another GLP-1 receptor agonist or insulin secretagogue, for any indication",
      detail:
        "Excluded: oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide, dulaglutide, exenatide, and the sulfonylureas and meglitinides, for any indication including diabetes.",
    });
  }

  // Sulfonylurea or meglitinide: exclusion under PGD v007 (no GP-monitored route)
  if (state.medications.takesSulphonylureas) {
    alerts.push({
      severity: "stop",
      code: "SULFONYLUREA",
      message: "Patient taking a sulfonylurea or meglitinide",
      detail:
        "Any sulfonylurea, meglitinide or insulin EXCLUDES; there is no GP-monitored route for those patients under this PGD.",
    });
  }

  // Insulin-treated diabetes: exclusion under PGD v007
  if (state.medications.takesInsulin) {
    alerts.push({
      severity: "stop",
      code: "INSULIN_TREATED",
      message: "Insulin-treated diabetes",
      detail:
        "Refer: a pharmacy weight-management service cannot manage insulin dose reduction.",
    });
  }

  // Maximum treatment period: 2 years of continuous treatment under this PGD
  const monthsOnTreatment = getMonthsOnTreatment(state);
  if (monthsOnTreatment !== null && monthsOnTreatment >= 24) {
    alerts.push({
      severity: "stop",
      code: "MAX_TREATMENT_PERIOD",
      message: "Maximum treatment period reached (2 years)",
      detail:
        "Maximum treatment period under this PGD is 2 years of continuous treatment, in line with NICE TA875. Refer to the GP or a specialist prescriber for a decision on continuation.",
    });
  }

  return alerts;
}

// ─── Treatment duration helpers (PGD v007 maximum treatment period and 5% rule) ───

export function getMonthsOnTreatment(state: WegovyConsultationState): number | null {
  const start = state.doseSelection.treatmentStartDate;
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;
  const now = new Date();
  const months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth()) -
    (now.getDate() < startDate.getDate() ? 1 : 0);
  return months < 0 ? 0 : months;
}

export function getPercentWeightLost(state: WegovyConsultationState): number | null {
  const initial = state.doseSelection.initialWeight;
  const current = state.observations.weight ?? state.weightAssessment.weight;
  if (initial === null || current === null || initial <= 0) return null;
  return ((initial - current) / initial) * 100;
}

// ─── Caution Alerts ───

function getCautionAlerts(state: WegovyConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Heart failure with reduced ejection fraction: EXCLUSION
  if (state.medicalHistory.heartFailureReducedEF) {
    alerts.push({
      severity: "stop",
      code: "HFREF",
      message: "Heart failure with reduced ejection fraction (HFrEF)",
      detail:
        "Excluded under this PGD where there is a known diagnosis of heart failure with reduced ejection fraction below 40%. Semaglutide has shown benefit in HFpEF (preserved EF, STEP-HFpEF trial) but benefit is NOT established in HFrEF. Refer to GP. If EF is unknown but patient is under cardiology review for 'heart failure', refer to GP to confirm.",
    });
  }

  // Weight gain caused by a prescribed medicine (initial assessment)
  if (state.weightAssessment.medicationInducedWeightGain) {
    alerts.push({
      severity: "caution",
      code: "MEDICATION_WEIGHT_GAIN",
      message: "Prescribed medication may be causing the weight gain",
      detail: "Refer the patient to their GP if prescribed medication is causing weight gain.",
    });
  }

  // History of suicidal ideation, or active severe mental illness (PGD v007 caution)
  if (state.medicalHistory.depression) {
    alerts.push({
      severity: "caution",
      code: "MENTAL_HEALTH",
      message: "History of suicidal ideation, or active severe mental illness",
      detail:
        "Ensure appropriate psychiatric oversight is in place, monitor mood at review, and refer if there is any concern. Do not supply where oversight is absent and concern exists.",
    });
  }

  // Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only
  if (state.medications.takesOtherDiabetesMeds) {
    alerts.push({
      severity: "caution",
      code: "T2DM_OTHER_MEDS",
      message: "Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only",
      detail:
        "No dose adjustment is needed, but inform the GP. Any sulfonylurea, meglitinide or insulin EXCLUDES.",
    });
  }

  // Warfarin, other coumarins, or narrow therapeutic index oral medicines
  if (state.medications.takesWarfarinOrNTI) {
    alerts.push({
      severity: "caution",
      code: "WARFARIN_NTI",
      message: "Warfarin, another coumarin, or an oral medicine with a narrow therapeutic index",
      detail:
        "Semaglutide delays gastric emptying and may reduce the absorption of oral medicines, especially those with a narrow therapeutic index. Counsel accordingly. Upon initiation in patients on warfarin, frequent monitoring of INR is recommended.",
    });
  }

  // HRT
  if (state.medications.takesHRT) {
    alerts.push({
      severity: "caution",
      code: "HRT",
      message: "Patient takes HRT",
      detail:
        "Due to the lack of data regarding absorption, non-oral products (for example patch, gel, or levonorgestrel intrauterine device) may be considered.",
    });
  }

  // Planned general anaesthesia or deep sedation
  if (state.medicalHistory.plannedAnaesthesia) {
    alerts.push({
      severity: "caution",
      code: "ANAESTHESIA_ASPIRATION",
      message: "Procedure under general anaesthesia or deep sedation planned",
      detail:
        "Cases of pulmonary aspiration have been reported in patients receiving GLP-1 receptor agonists undergoing general anaesthesia or deep sedation. The increased risk of residual gastric content due to delayed gastric emptying should be considered before the procedure.",
    });
  }

  // Pre-existing increased heart rate (tool threshold: resting rate above 100 bpm)
  if (state.observations.heartRate !== null && state.observations.heartRate > 100) {
    alerts.push({
      severity: "caution",
      code: "TACHYCARDIA",
      message: "Pre-existing increased resting heart rate",
      detail:
        "Cases of tachycardia have been reported. In patients with a pre-existing increased heart rate, use with caution and seek specialist advice before use. If a clinically relevant sustained increase in resting heart rate occurs during treatment, discontinue and seek advice.",
    });
  }

  // Thyroid disease (document silent; tool caution retained)
  if (state.medicalHistory.thyroidDisease) {
    alerts.push({
      severity: "caution",
      code: "THYROID_DISEASE",
      message: "Thyroid disease present",
      detail:
        "Monitor thyroid function. Advise on warning signs of thyroid tumour (neck mass, dysphagia, hoarseness, persistent cough).",
    });
  }

  // Mild to moderate renal impairment
  if (state.medicalHistory.mildModerateRenal) {
    alerts.push({
      severity: "caution",
      code: "RENAL_IMPAIRMENT",
      message: "Mild to moderate renal impairment",
      detail: "Monitor for dehydration secondary to gastrointestinal side effects.",
    });
  }

  // Recommencing after a break
  if (state.doseSelection.recommencingAfterBreak) {
    alerts.push({
      severity: "caution",
      code: "RECOMMENCING",
      message: "Recommencing Wegovy after previous use",
      detail:
        "The dose must be titrated again from the lowest dose (0.25 mg). The BMI inclusion criteria for initiation must be reapplied if more than 2 months have passed since discontinuing treatment.",
    });
  }

  // 5% rule: less than 5% of initial body weight lost after 6 months
  const months = getMonthsOnTreatment(state);
  const lost = getPercentWeightLost(state);
  if (months !== null && months >= 6 && lost !== null && lost < 5) {
    alerts.push({
      severity: "caution",
      code: "LESS_THAN_5_PERCENT",
      message: "Less than 5% of initial body weight lost after 6 months",
      detail:
        "Reassess the benefit-risk balance. Under this PGD treatment is stopped where less than 5% of initial body weight has been lost after 6 months on the maximum tolerated dose; a decision on continuation is required and must be documented.",
    });
  }

  return alerts;
}

// ─── Red Flag Alerts ───

function getRedFlagAlerts(state: WegovyConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Current suicidal ideation (tool red flag, stricter than the PGD caution)
  if (state.medicalHistory.suicidalIdeation) {
    alerts.push({
      severity: "red-flag",
      code: "SUICIDE_RISK",
      message: "Acute suicide risk",
      detail:
        "URGENT: Do not supply. Refer to emergency mental health services immediately.",
    });
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
        "Follow the 4-week escalation steps. Each step = one month of treatment (one pen of 4 doses, or four 7.2 mg single use pens). If more than 2 doses are missed, reduce and re-escalate the dose.",
    };
  }

  // New patient: start with initiation dose (0.25mg)
  return {
    stage: "initiation",
    dose: "0.25mg",
    reason: "Standard initiation dose for new patients (weeks 1 to 4)",
    titrationSchedule:
      "Weeks 1 to 4: 0.25 mg, weeks 5 to 8: 0.5 mg, weeks 9 to 12: 1.0 mg, weeks 13 to 16: 1.7 mg, week 17 onwards: 2.4 mg once weekly. If needed, 7.2 mg once weekly after a minimum of 4 weeks on 2.4 mg, only where the starting BMI was 30 or above. Each step = one month of treatment (4 doses).",
  };
}

// ─── Validation ===

export function validatePatientStep(state: WegovyConsultationState): string | null {
  if (!state.patient.firstName.trim()) return "Patient first name is required";
  if (!state.patient.lastName.trim()) return "Patient last name is required";
  if (!state.patient.dateOfBirth) return "Date of birth is required";
  if (state.patient.age === null) return "Unable to calculate age";
  if (state.patient.age < 18) return "Patient must be 18 years or older";
  if (state.patient.age > 75)
    return "Patient must be 75 years or younger (upper age limit under this PGD; refer to a specialist)";
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
    return "BMI is below the PGD inclusion threshold (30 or above, or 27 or above with a weight-related comorbidity)";
  }
  if (bmi >= 27 && bmi < 30) {
    if (state.weightAssessment.weightRelatedComorbidities.length === 0) {
      return "For BMI 27 to below 30, at least one weight-related comorbidity must be documented";
    }
  }
  if (!state.weightAssessment.initialAssessmentCompleted) {
    return "Initial face-to-face assessment must be completed and documented";
  }
  if (!state.weightAssessment.lifestylePlanAgreed) {
    return "Patient must be willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan";
  }
  if (!state.weightAssessment.targetWeightLoss.trim()) {
    return "A realistic target weight must be agreed and recorded";
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
    return "Please specify sulfonylurea or meglitinide details";
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
    return "Hard stop contraindications present, cannot proceed";
  }
  return null;
}

export function validateDoseSelectionStep(state: WegovyConsultationState): string | null {
  const ds = state.doseSelection;
  if (!ds.currentDoseStage) return "Current dose stage must be selected";
  if (!ds.dose) return "Dose must be selected";
  if (!ds.injectionSite) return "Injection site must be selected";
  if (!ds.batchNumber.trim()) return "Batch number of the product supplied is required";

  // Continuing patients: treatment start date and initial weight are needed
  // for the 2-year maximum and the 5% rule.
  const isContinuing = ds.previousDose !== "" || ds.recommencingAfterBreak;
  if (isContinuing && !ds.treatmentStartDate) {
    return "Treatment start date is required for a patient already on treatment";
  }
  if (isContinuing && ds.initialWeight === null) {
    return "Weight at initiation is required for a patient already on treatment";
  }

  // Maximum treatment period: 2 years of continuous treatment under this PGD
  const months = getMonthsOnTreatment(state);
  if (months !== null && months >= 24) {
    return "Maximum treatment period under this PGD is 2 years of continuous treatment. Refer to the GP or a specialist prescriber.";
  }

  // Recommencing after a break: titrate again from the lowest dose
  if (ds.recommencingAfterBreak && ds.dose !== "0.25mg") {
    return "A patient recommencing Wegovy must be titrated again from the lowest dose (0.25 mg)";
  }

  // 7.2 mg gate (PGD v007)
  if (ds.dose === "7.2mg") {
    if (ds.startingBMI === null) {
      return "Starting BMI (at initiation of treatment) is required before 7.2 mg can be supplied";
    }
    if (ds.startingBMI < 30) {
      return "7.2 mg is permitted only where the starting BMI was 30 kg/m² or above; patients who started at BMI 27 to below 30 remain at a maximum of 2.4 mg";
    }
    const continuing72 = ds.previousDose === "7.2mg";
    const escalatingFrom24 =
      ds.previousDose === "2.4mg" &&
      ds.weeksAtCurrentDose !== null &&
      ds.weeksAtCurrentDose >= 4;
    if (!continuing72 && !escalatingFrom24) {
      return "7.2 mg may only be given after a minimum of 4 weeks on 2.4 mg (select previous dose 2.4 mg and record at least 4 weeks on it)";
    }
  }

  if (ds.pharmacistOverride && !ds.overrideReason.trim()) {
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
    state.counselling.followUpSchedule &&
    state.counselling.urgentWarningSymptoms &&
    state.counselling.writtenInformationGiven &&
    state.counselling.nhsRouteExplained &&
    state.counselling.gpInformed;

  // Hypoglycaemia warning only required if on other diabetes medicines
  // (insulin and sulfonylureas are exclusions, so cannot reach this step)
  if (state.medications.takesOtherDiabetesMeds) {
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

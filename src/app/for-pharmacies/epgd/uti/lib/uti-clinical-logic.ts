import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type {
  UTIPatientDetails,
  UTISymptoms,
  UTIMedicalHistory,
  UTIObservations,
  UTIMedicineSelection,
} from "./uti-types";

// ─── Clinical Logic for UTI Consultation ───

export function getUTIClinicalAlerts(
  patient: UTIPatientDetails,
  symptoms: UTISymptoms,
  medicalHistory: UTIMedicalHistory,
  observations: UTIObservations,
  medicineSelection: UTIMedicineSelection
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ─── EXCLUSION CRITERIA (STOP) ───

  if (!patient.femaleConfirmed) {
    alerts.push({
      severity: "stop",
      code: "MALE_PATIENT",
      message: "Patient gender not confirmed as female",
      detail: "UTI PGD is for females aged 16-64 only. Male patients must be referred to GP for assessment.",
    });
  }

  if (patient.age !== null && patient.age < 16) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient is under 16 years of age",
      detail: "This PGD is for patients aged 16-64. Refer to GP.",
    });
  }

  if (patient.age !== null && patient.age > 64) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_OLD",
      message: "Patient is over 64 years of age",
      detail: "This PGD is for patients aged 16-64. Refer to GP.",
    });
  }

  if (medicalHistory.pregnant) {
    alerts.push({
      severity: "stop",
      code: "PREGNANT",
      message: "Patient is pregnant",
      detail: "Nitrofurantoin and trimethoprim are contraindicated in pregnancy. Refer to GP.",
    });
  }

  if (medicalHistory.pregnancyPossible) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY_POSSIBLE",
      message: "Pregnancy is possible",
      detail: "Confirm pregnancy status before proceeding. If pregnancy cannot be ruled out, refer to GP.",
    });
  }

  if (medicalHistory.catheterised) {
    alerts.push({
      severity: "stop",
      code: "CATHETERISED",
      message: "Patient is catheterised",
      detail: "Catheterised UTI management requires specialist assessment. Refer to GP.",
    });
  }

  if (medicalHistory.recurrentUTI) {
    alerts.push({
      severity: "stop",
      code: "RECURRENT_UTI",
      message: "Patient has recurrent UTI (3+ in 12 months)",
      detail: "Recurrent UTI requires specialist investigation and management. Refer to GP.",
    });
  }

  if (medicalHistory.previousUTIWithin4Weeks) {
    alerts.push({
      severity: "stop",
      code: "UTI_WITHIN_4_WEEKS",
      message: "Previous UTI within last 4 weeks",
      detail: "Risk of treatment failure and resistance. Refer to GP for further investigation.",
    });
  }

  if (symptoms.haematuria && !(symptoms.dysuria || symptoms.frequency || symptoms.urgency)) {
    alerts.push({
      severity: "stop",
      code: "VISIBLE_HAEMATURIA_ALONE",
      message: "Visible haematuria without typical UTI symptoms",
      detail: "This may indicate urological pathology. Urgent GP referral needed.",
    });
  }

  if (observations.temperature !== null && observations.temperature >= 38) {
    alerts.push({
      severity: "stop",
      code: "HIGH_FEVER",
      message: "Temperature ≥38°C (suspected pyelonephritis)",
      detail: "Fever suggests upper urinary tract involvement. Refer to GP or consider urgent care.",
    });
  }

  if (medicalHistory.knownAbnormalUrinaryTract) {
    alerts.push({
      severity: "stop",
      code: "ABNORMAL_URINARY_TRACT",
      message: "Known abnormal urinary tract anatomy",
      detail: "Refer to GP for assessment and appropriate management.",
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail: "Immunocompromised patients require specialist management. Refer to GP.",
    });
  }

  // ─── CAUTIONS ───

  if (medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail: "Trimethoprim preferred over nitrofurantoin. Small amounts pass into breast milk.",
    });
  }

  if (medicalHistory.diabetesUncontrolled) {
    alerts.push({
      severity: "caution",
      code: "UNCONTROLLED_DIABETES",
      message: "Uncontrolled diabetes",
      detail: "Monitor carefully. Diabetes increases risk of complications. Consider GP involvement.",
    });
  }

  if (medicalHistory.kidneyDisease) {
    alerts.push({
      severity: "caution",
      code: "KIDNEY_DISEASE",
      message: "Known kidney disease",
      detail: "Renal function should be considered in dosing decisions.",
    });
  }

  if (medicalHistory.renalImpairment === "moderate") {
    alerts.push({
      severity: "caution",
      code: "MODERATE_RENAL_IMPAIRMENT",
      message: "Moderate renal impairment (eGFR 30-44)",
      detail: "Avoid nitrofurantoin. Use trimethoprim if appropriate. Monitor renal function.",
    });
  }

  if (medicalHistory.renalImpairment === "severe") {
    alerts.push({
      severity: "stop",
      code: "SEVERE_RENAL_IMPAIRMENT",
      message: "Severe renal impairment (eGFR <30)",
      detail: "This PGD is unsuitable. Refer to GP for specialist management.",
    });
  }

  // ─── RED FLAGS ───

  if (symptoms.vaginalDischarge && (symptoms.dysuria || symptoms.frequency)) {
    alerts.push({
      severity: "red-flag",
      code: "VAGINAL_DISCHARGE",
      message: "Significant vaginal discharge present",
      detail: "May suggest STI rather than simple UTI. Consider need for STI testing before treatment.",
    });
  }

  if (symptoms.suprapubicPain) {
    alerts.push({
      severity: "red-flag",
      code: "LOIN_FLANK_PAIN_RISK",
      message: "Suprapubic/lower abdominal pain present",
      detail: "While consistent with UTI, severe pain may suggest pyelonephritis. Assess severity.",
    });
  }

  return alerts;
}

export function hasExclusionCriteria(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function getDoseRecommendation(
  medicalHistory: UTIMedicalHistory,
  allergies: string
): DoseRecommendation {
  // Default: Nitrofurantoin
  if (!allergies.toLowerCase().includes("nitrofurantoin")) {
    if (medicalHistory.renalImpairment === "none") {
      return {
        medicine: "Nitrofurantoin 100mg MR",
        dose: "100mg",
        frequency: "Twice daily",
        duration: "3 days",
        dosingRegimen: "Nitrofurantoin 100mg MR, twice daily for 3 days (6 capsules total)",
        reason: "First-line for uncomplicated UTI in non-pregnant women with normal renal function",
      };
    }
  }

  // Trimethoprim (if nitrofurantoin contraindicated)
  return {
    medicine: "Trimethoprim 200mg",
    dose: "200mg",
    frequency: "Twice daily",
    duration: "3 days",
    dosingRegimen: "Trimethoprim 200mg, twice daily for 3 days (6 tablets total)",
    reason: "Alternative for renal impairment, allergy, or breastfeeding",
  };
}

export function getMedicineQuantity(medicine: string, duration: string): number {
  // Standard 3-day course
  if (duration === "3 days") {
    return 6; // twice daily for 3 days = 6 doses
  }
  if (duration === "7 days") {
    return 14; // twice daily for 7 days = 14 doses
  }
  return 6; // default
}

export function validateMedicineSelection(
  medicine: string,
  dose: string,
  medicalHistory: UTIMedicalHistory
): string | null {
  if (!medicine) {
    return "Please select a medicine";
  }

  if (medicine === "nitrofurantoin" && medicalHistory.renalImpairment === "moderate") {
    return "Nitrofurantoin should not be used in moderate renal impairment (eGFR <45). Use trimethoprim instead.";
  }

  if (!dose) {
    return "Please select a dose";
  }

  return null;
}

export function getCounsellingRequired(medicalHistory: UTIMedicalHistory): {
  label: string;
  required: boolean;
}[] {
  return [
    { label: "Complete the full course (6 doses over 3 days)", required: true },
    { label: "Drink plenty of water and other fluids", required: true },
    {
      label: "Return to GP if symptoms not improving within 48 hours",
      required: true,
    },
    {
      label: "Cranberry products are not evidence-based for treatment",
      required: false,
    },
    {
      label: "Paracetamol can be used for discomfort/pain relief",
      required: false,
    },
    {
      label: "Alkalinising agents (e.g., sodium bicarbonate) may help symptoms",
      required: false,
    },
    {
      label: "Avoid sexual activity until symptoms resolve",
      required: false,
    },
    medicalHistory.pregnancyPossible
      ? {
          label: "Discuss contraception options — confirm not at risk of pregnancy",
          required: true,
        }
      : { label: "", required: false },
  ].filter((item) => item.label !== "");
}

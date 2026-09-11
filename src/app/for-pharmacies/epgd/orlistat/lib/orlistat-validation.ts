import type { OrlistatConsultationState } from "./orlistat-types";
import { ORLISTAT_MAX_QUANTITY } from "./orlistat-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(step: number, state: OrlistatConsultationState): string | null {
  switch (step) {
    case 0:
      // PGD v004: age 18 years and over and under 75 years.
      return validatePatientStep(state.patient, { minAge: 18, maxAge: 74 });
    case 1:
      return validateConsentStep(state.consent);
    case 2: {
      const w = state.weightAssessment;
      if (!w.visitType) return "Select the type of visit (first supply, or continuation)";
      if (w.height === null) return "Height is required";
      if (w.weight === null) return "Weight is required";
      if (w.bmi === null) return "BMI must be calculated";
      if (w.visitType === "continuation") {
        if (!w.treatmentStartDate) return "Treatment start date (first orlistat supply) is required for a continuation";
        if (w.treatmentStartDate > new Date().toISOString().split("T")[0]) return "Treatment start date cannot be in the future";
        if (w.baselineWeight === null) return "Baseline weight at the start of treatment is required for a continuation";
      }
      if (w.waistCircumference === null)
        return "Baseline waist circumference must be documented";
      // Inclusion BMI is applied at initiation; on a continuation the
      // patient is expected to have lost weight, so the 12 week rule
      // (clinical logic) governs instead.
      const bmiForInclusion =
        w.visitType === "continuation" && w.baselineWeight !== null && w.height
          ? Math.round((w.baselineWeight / Math.pow(w.height / 100, 2)) * 10) / 10
          : w.bmi;
      const meetsWeightCriteria =
        bmiForInclusion >= 30 ||
        (bmiForInclusion >= 28 && state.weightAssessment.comorbidities.length > 0);
      if (!meetsWeightCriteria)
        return `Patient must have ${w.visitType === "continuation" ? "baseline " : ""}BMI 30 or more, or BMI 28 or more with at least one obesity-related comorbidity`;
      if (!state.weightAssessment.motivatedStructuredDiet)
        return "Confirm the patient is motivated and committed to weight loss with a structured reduced-calorie diet";
      return null;
    }
    case 3:
      return null;
    case 4:
      if (!state.medications.allergies.trim() && !state.medications.nkda)
        return "Record the patient's drug allergies, or confirm no known drug allergies";
      return null;
    case 5:
      return null;
    case 6:
      if (!state.medicineSupply.quantity || state.medicineSupply.quantity <= 0)
        return "Quantity must be specified";
      if (state.medicineSupply.quantity > ORLISTAT_MAX_QUANTITY)
        return `Maximum supply under this PGD is ${ORLISTAT_MAX_QUANTITY} capsules (28-day supply)`;
      if (!state.medicineSupply.brand.trim())
        return "Record the brand of orlistat supplied";
      return null;
    case 7: {
      const c = state.counselling;
      if (!c.pilSupplied) return "Confirm the Patient Information Leaflet has been supplied";
      if (!c.dietaryAdvice) return "Confirm reduced-calorie, low-fat diet advice has been given";
      if (!c.multivitamin) return "Confirm multivitamin advice (at least 2 hours apart from orlistat) has been given";
      if (!c.missedMealAdvice) return "Confirm advice to omit the dose if a meal is missed or contains no fat";
      if (state.medications.takesLevothyroxine && !c.separationAdvice)
        return "Confirm levothyroxine timing advice (at least 4 hours before orlistat) has been given";
      if (!c.redFlagSymptoms) return "Confirm the patient knows which symptoms to report to the GP immediately";
      if (!c.expectedWeightLoss) return "Confirm expected weight loss has been discussed";
      if (state.weightAssessment.comorbidities.includes("type2diabetes") && !c.diabetesMedicationAdvice)
        return "Confirm the patient has been advised to inform the GP about diabetes medication adjustment";
      if (state.medications.takesOtherAnticoagulant && !c.anticoagulantAdvice)
        return "Confirm anticoagulant advice (GP aware, INR monitored as appropriate) has been given";
      if (!c.reviewSchedule) return "Confirm the 12-week follow-up review has been arranged";
      if (!c.weightLossTarget) return "Confirm the 5% weight loss target has been discussed";
      if (!c.yellowCard) return "Confirm Yellow Card reporting advice has been given";
      return null;
    }
    case 8:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}

export function calculateBMI(height: number | null, weight: number | null): number | null {
  if (height === null || weight === null || height <= 0 || weight <= 0) return null;
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

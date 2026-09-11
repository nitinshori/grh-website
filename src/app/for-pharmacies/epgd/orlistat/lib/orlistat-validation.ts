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
      if (w.height === null) return "Height (cm) is required";
      if (w.weight === null) return `${w.visitType === "continuation" ? "Weight today" : "Baseline weight"} (kg) is required`;
      if (w.bmi === null) return "BMI could not be calculated: check Height (cm) and weight (kg)";
      if (w.visitType === "continuation") {
        if (!w.treatmentStartDate) return "Treatment start date (first orlistat supply) is required for a continuation";
        if (w.treatmentStartDate > new Date().toISOString().split("T")[0]) return "Treatment start date cannot be in the future";
        if (w.baselineWeight === null) return "Baseline weight at start of treatment (kg) is required for a continuation";
      }
      if (w.waistCircumference === null)
        return "Waist circumference (cm) is required";
      // Inclusion BMI is applied at initiation; on a continuation the
      // patient is expected to have lost weight, so the 12 week rule
      // (clinical logic) governs instead.
      const bmiForInclusion =
        w.visitType === "continuation" && w.baselineWeight !== null && w.height
          ? Math.round((w.baselineWeight / Math.pow(w.height / 100, 2)) * 10) / 10
          : w.bmi;
      const which = w.visitType === "continuation" ? "Baseline BMI" : "BMI";
      if (bmiForInclusion < 28)
        return `${which} ${bmiForInclusion} does not meet the inclusion criteria (BMI 30 or more, or BMI 28 or more with at least one obesity-related comorbidity)`;
      if (bmiForInclusion < 30) {
        // 28 to 29.9: the comorbidity question must be answered. Blank is
        // "not yet answered", never a stop (stop audit, 11 Sep 2026).
        const answer = state.weightAssessment.hasComorbidity;
        if (answer === "")
          return "Answer \"Does the patient have at least one obesity-related comorbidity?\" (Yes or No)";
        if (answer === "no")
          return `${which} ${bmiForInclusion} is between 28 and 29.9 with no obesity-related comorbidity: not eligible (BMI 30 or more, or BMI 28 or more with at least one obesity-related comorbidity)`;
        if (state.weightAssessment.comorbidities.length === 0)
          return "Tick the obesity-related comorbidity (or comorbidities) the patient has under \"Weight-Related Comorbidities\"";
      }
      if (!state.weightAssessment.motivatedStructuredDiet)
        return "Tick \"Patient is motivated and committed to weight loss with a structured reduced-calorie diet\" (inclusion criterion)";
      return null;
    }
    case 3:
      return null;
    case 4:
      if (!state.medications.allergies.trim() && !state.medications.nkda)
        return "Drug allergies: name the medicine and the reaction, or tick \"No known drug allergies (confirmed with the patient)\"";
      return null;
    case 5:
      return null;
    case 6:
      if (!state.medicineSupply.quantity || state.medicineSupply.quantity <= 0)
        return "Quantity to supply (capsules) is required";
      if (state.medicineSupply.quantity > ORLISTAT_MAX_QUANTITY)
        return `Maximum supply under this PGD is ${ORLISTAT_MAX_QUANTITY} capsules (28-day supply)`;
      if (!state.medicineSupply.brand.trim())
        return "Brand of orlistat supplied is required";
      return null;
    case 7: {
      const c = state.counselling;
      if (!c.pilSupplied) return "Tick \"Patient Information Leaflet (PIL) supplied\" once supplied";
      if (!c.dietaryAdvice) return "Tick \"Reduced-calorie, low-fat diet explained\" once discussed";
      if (!c.multivitamin) return "Tick \"Multivitamin supplement ... taken at least 2 hours apart from orlistat\" once advised";
      if (!c.missedMealAdvice) return "Tick \"Do not take orlistat if a meal is missed or contains no fat\" once advised";
      if (state.medications.takesLevothyroxine && !c.separationAdvice)
        return "Patient takes levothyroxine: tick \"If taking levothyroxine, administer at least 4 hours before orlistat\" once advised";
      if (!c.redFlagSymptoms) return "Tick \"Report any jaundice, persistent abdominal pain ... to the GP immediately\" once advised";
      if (!c.expectedWeightLoss) return "Tick \"Expect weight loss to be gradual\" once discussed";
      if (state.weightAssessment.comorbidities.includes("type2diabetes") && !c.diabetesMedicationAdvice)
        return "Type 2 diabetes recorded: tick \"If diabetes medications are being taken, inform the GP\" once advised";
      if (state.medications.takesOtherAnticoagulant && !c.anticoagulantAdvice)
        return "Patient takes an anticoagulant: tick \"If on an anticoagulant, ensure GP is aware and INR is monitored\" once advised";
      if (!c.reviewSchedule) return "Tick \"Follow-up appointment at 12 weeks (3 months) arranged\" once arranged";
      if (!c.weightLossTarget) return "Tick \"Weight loss target discussed\" once discussed";
      if (!c.yellowCard) return "Tick \"Report any suspected adverse drug reactions ... Yellow Card scheme\" once advised";
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

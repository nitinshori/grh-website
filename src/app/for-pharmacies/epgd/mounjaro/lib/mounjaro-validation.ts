import type { MounjaroConsultationState } from "./mounjaro-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(step: number, state: MounjaroConsultationState): string | null {
  switch (step) {
    case 0: // Patient Details (PGD v007: adults aged 18 to 75 years inclusive)
      return validatePatientStep(state.patient, { minAge: 18, maxAge: 75 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Weight Assessment
      if (state.weightAssessment.height === null) return "Height is required";
      if (state.weightAssessment.weight === null) return "Weight is required";
      if (state.weightAssessment.bmi === null) return "BMI must be calculated";
      // Must meet BMI criteria: >= 30 OR (>= 27 AND has comorbidity)
      const meetsWeightCriteria =
        state.weightAssessment.bmi >= 30 ||
        (state.weightAssessment.bmi >= 27 && state.weightAssessment.comorbidities.length > 0);
      if (!meetsWeightCriteria)
        return "Excluded: BMI below the PGD inclusion threshold. Patient must have BMI 30 or above, or 27 or above with at least one weight-related comorbidity (hypertension, type 2 diabetes, pre-diabetes, dyslipidaemia, OSA, established cardiovascular disease)";
      if (state.weightAssessment.targetWeight === null)
        return "A realistic target weight must be agreed and recorded";
      if (!state.weightAssessment.initialAssessmentCompleted)
        return "The face to face initial assessment must be completed and documented before supply";
      if (!state.weightAssessment.lifestylePlanAgreed)
        return "Patient must be willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan";
      return null;

    case 3: // Medical History
      return null; // Exclusions are enforced through the stop alerts

    case 4: // Current Medications
      if (state.medications.takesInsulin && !state.medications.insulinDetails.trim())
        return "Insulin details are required";
      if (state.medications.currentGLP1 && !state.medications.otherGLP1Details.trim())
        return "Details of the current GLP-1 agonist or insulin secretagogue are required";
      return null;

    case 5: // Contraindications Review
      return null; // Review only

    case 6: // Dose Selection
      if (!state.doseSelection.dose) return "Dose selection is required";
      if (!state.doseSelection.supplyType) return "Select the nature of today's supply";
      if (
        (state.doseSelection.supplyType === "new-start" || state.doseSelection.supplyType === "restart") &&
        state.doseSelection.currentDoseStage !== "init"
      )
        return "New starts and restarts must begin at 2.5 mg once weekly for 4 weeks (titration dose)";
      if (state.doseSelection.supplyType === "escalate") {
        if (state.doseSelection.currentDoseStage === "init")
          return "2.5 mg is the starting dose; select the dose being escalated to";
        if (state.doseSelection.weeksAtCurrentDose === null)
          return "Record the number of weeks the patient has been on the previous dose";
        if (state.doseSelection.weeksAtCurrentDose < 4)
          return "Dose increases require a minimum of 4 weeks on the current dose";
      }
      if (state.doseSelection.supplyType === "reduce" && state.doseSelection.currentDoseStage === "5")
        return "15 mg is the maximum dose and cannot be a reduction; select the previous dose";
      if (!state.doseSelection.batchNumber.trim()) return "Batch number is required";
      if (state.doseSelection.pharmacistOverride && !state.doseSelection.overrideReason.trim())
        return "Reason for override is required";
      return null;

    case 7: // Counselling (PGD v007 follow-up advice and written information rows)
      if (!state.counselling.giSideEffects)
        return "Gastrointestinal side effects, their management and adequate fluid intake must be discussed";
      if (!state.counselling.warningSymptoms)
        return "Warning symptoms needing urgent attention must be explained";
      if (!state.counselling.followUpSchedule)
        return "Advise when to return for review and that treatment is reassessed at 6 months";
      if (!state.counselling.writtenInfoProvided)
        return "The PIL, written lifestyle advice and the agreed target weight must be given to the patient";
      if (state.medications.t2dmOralAgents && !state.counselling.gpInformed)
        return "The GP must be informed where the patient has type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor";
      return null;

    case 8: // Summary
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

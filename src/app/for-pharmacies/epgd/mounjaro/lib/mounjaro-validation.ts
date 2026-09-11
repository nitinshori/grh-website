import type { MounjaroConsultationState } from "./mounjaro-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { bmiGateAppliesToday, isContinuingSupply, getAllowedStages, fivePercentRuleApplies } from "./mounjaro-clinical-logic";

export function validateStep(step: number, state: MounjaroConsultationState): string | null {
  switch (step) {
    case 0: { // Patient Details (PGD v008: adults aged 18 to 75 years inclusive)
      const base = validatePatientStep(state.patient, { minAge: 18, maxAge: 75 });
      if (base) return base;
      // Records row: name, address, date of birth and GP
      if (!state.patient.address.trim()) return "Patient address is required (PGD records row)";
      if (!state.patient.gpName.trim() && !state.patient.gpPractice.trim())
        return "Record the GP or practice with whom the patient is registered";
      return null;
    }

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: { // Weight Assessment
      if (!state.doseSelection.supplyType) return "Select the nature of today's supply (new start, continuing, escalating, reducing or restart)";
      if (state.weightAssessment.height === null) return "Height is required";
      if (state.weightAssessment.weight === null) return "Weight is required";
      if (state.weightAssessment.bmi === null) return "BMI must be calculated";
      // The document's inclusion is an INITIAL BMI, reapplied only after a
      // break of more than 2 months. A continuing patient who has reached
      // BMI 26 is the licence's weight-maintenance use, not an exclusion
      // (adversarial review, 11 Sep 2026).
      const gateToday = bmiGateAppliesToday(state);
      if (!gateToday && state.weightAssessment.startingBMI === null)
        return "Record the patient's BMI at the start of treatment: eligibility for a continuing patient is judged on the starting BMI";
      const gatingBmi = gateToday ? state.weightAssessment.bmi : state.weightAssessment.startingBMI;
      const meetsWeightCriteria =
        gatingBmi !== null &&
        (gatingBmi >= 30 || (gatingBmi >= 27 && state.weightAssessment.comorbidities.length > 0));
      if (!meetsWeightCriteria)
        return `Excluded: ${gateToday ? "BMI" : "starting BMI"} below the PGD inclusion threshold. Patient must have BMI 30 or above, or 27 or above with at least one weight-related comorbidity (hypertension, type 2 diabetes, pre-diabetes, dyslipidaemia, OSA, established cardiovascular disease)`;
      if (state.weightAssessment.targetWeight === null)
        return "A realistic target weight must be agreed and recorded";
      if (!state.weightAssessment.initialAssessmentCompleted)
        return "The face to face initial assessment must be completed and documented before supply";
      if (!state.weightAssessment.lifestylePlanAgreed)
        return "Patient must be willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan";
      return null;
    }

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

    case 6: { // Dose Selection
      const ds = state.doseSelection;
      if (!ds.supplyType) return "Select the nature of today's supply";
      if (isContinuingSupply(state)) {
        if (!ds.previousDose) return "Record the dose the patient has been on";
        if (ds.weeksAtCurrentDose === null || ds.weeksAtCurrentDose < 0)
          return "Record the number of weeks the patient has been on that dose";
        if (ds.initialWeight === null) return "Record the weight at initiation, for the 5% rule";
        if (!ds.treatmentStartDate) return "Record the treatment start date";
        if (ds.monthsOnMaxToleratedDose === null || ds.monthsOnMaxToleratedDose < 0)
          return "Record how many months the patient has been on the maximum tolerated dose (0 if still titrating)";
      }
      if (!ds.currentDoseStage || !ds.dose) return "Dose selection is required";
      const allowed = getAllowedStages(state);
      if (!allowed.includes(ds.currentDoseStage)) {
        if (ds.supplyType === "new-start" || ds.supplyType === "restart")
          return "New starts and restarts must begin at 2.5 mg once weekly for 4 weeks (titration dose)";
        if (ds.supplyType === "continue") return "Continuing the same dose: select the dose the patient has been on";
        if (ds.supplyType === "escalate") {
          if (ds.previousDose === "5") return "15 mg is the maximum dose; there is no further escalation";
          if (ds.weeksAtCurrentDose !== null && ds.weeksAtCurrentDose < 4)
            return "Dose increases require a minimum of 4 weeks on the current dose";
          return "Escalation is by 2.5 mg only: select the next dose up from the one the patient has been on";
        }
        if (ds.supplyType === "reduce") {
          if (ds.previousDose === "init") return "2.5 mg is the lowest dose and cannot be reduced";
          return "Reduction must be to a dose below the one the patient has been on";
        }
        return "The selected dose is not permitted by the schedule for this patient";
      }
      if (fivePercentRuleApplies(state) && !ds.continuationDecision.trim())
        return "Less than 5% of initial body weight lost after 6 months on the maximum tolerated dose: record the decision on continuation and the reasoning";
      if (!ds.batchNumber.trim()) return "Batch number is required";
      return null;
    }

    case 7: { // Counselling (PGD v008 cautions, follow-up advice and written information rows)
      const c = state.counselling;
      // Every item that maps to a document row is required; a first
      // injectable supply could be recorded with no injection training
      // (adversarial review, 11 Sep 2026).
      const required: [boolean, string][] = [
        [c.injectionTechnique, "injection technique"],
        [c.injectionSiteRotation, "injection site rotation"],
        [c.penDeviceUse, "pen device use"],
        [c.storageRefrigeration, "storage"],
        [c.missedDoseProtocol, "missed dose protocol"],
        [c.giSideEffects, "gastrointestinal side effects and fluid intake"],
        [c.pancreatitisWarning, "signs and symptoms of pancreatitis"],
        [c.gallbladderWarning, "gallbladder disease symptoms"],
        [c.warningSymptoms, "warning symptoms needing urgent attention"],
        [c.oralMedicationAbsorption, "reduced absorption of oral medicines, contraceptives and HRT"],
        [c.anaesthesiaWarning, "general anaesthesia or deep sedation"],
        [c.dietExerciseAdvice, "diet and exercise"],
        [c.followUpSchedule, "review and the 6-month reassessment"],
        [c.writtenInfoProvided, "PIL, written lifestyle advice and the agreed target weight"],
      ];
      const missing = required.filter(([done]) => !done).map(([, label]) => label);
      if (missing.length > 0) return `Confirm the remaining counselling items: ${missing.join(", ")}`;
      if (state.weightAssessment.comorbidities.includes("type2diabetes") && !c.retinopathyWarning)
        return "Retinopathy monitoring must be discussed with a patient who has type 2 diabetes";
      if (state.medications.t2dmOralAgents && !c.gpInformed)
        return "The GP must be informed where the patient has type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor";
      return null;
    }

    case 8: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}

export function calculateBMI(height: number | null, weight: number | null): number | null {
  if (height === null || weight === null || height <= 0 || weight <= 0) return null;
  const heightM = height / 100;
  // Unrounded: 26.99 must not pass a 27 gate by rounding. Round for display.
  return weight / (heightM * heightM);
}

import type { MounjaroConsultationState } from "./mounjaro-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { bmiGateAppliesToday, isContinuingSupply, getAllowedStages, fivePercentRuleApplies } from "./mounjaro-clinical-logic";

export function validateStep(step: number, state: MounjaroConsultationState): string | null {
  switch (step) {
    case 0: { // Patient Details (PGD v009: adults aged 18 to 75 years inclusive)
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
      if (state.weightAssessment.height === null) return "Enter the Height";
      if (state.weightAssessment.weight === null) return "Enter the Weight";
      if (state.weightAssessment.bmi === null) return "BMI could not be calculated: check the Height and Weight";
      // The document's inclusion is an INITIAL BMI, reapplied only after a
      // break of more than 2 months. A continuing patient who has reached
      // BMI 26 is the licence's weight-maintenance use, not an exclusion
      // (adversarial review, 11 Sep 2026).
      const gateToday = bmiGateAppliesToday(state);
      if (!gateToday && state.weightAssessment.startingBMI === null)
        return "Record the patient's BMI at the start of treatment: eligibility for a continuing patient is judged on the starting BMI";
      const gatingBmi = gateToday ? state.weightAssessment.bmi : state.weightAssessment.startingBMI;
      if (gatingBmi === null || gatingBmi < 27)
        return `Excluded: ${gateToday ? "BMI" : "starting BMI"} below the PGD inclusion threshold (30 or above, or 27 or above with at least one weight-related comorbidity). Save as not supplied and refer`;
      if (gatingBmi < 30) {
        // 27 to below 30: the comorbidity question must be answered. Blank is
        // "not yet answered", never a stop (stop audit, 11 Sep 2026).
        const answer = state.weightAssessment.hasComorbidity;
        if (answer === "")
          return "Answer \"Does the patient have at least one weight-related comorbidity?\" (Yes or No)";
        if (answer === "no")
          return `Excluded: ${gateToday ? "BMI" : "starting BMI"} 27 to below 30 with no weight-related comorbidity. Save as not supplied and refer`;
        if (state.weightAssessment.comorbidities.length === 0)
          return "Tick the weight-related comorbidity (or comorbidities) the patient has";
      }
      if (state.weightAssessment.targetWeight === null)
        return "Enter the Target weight agreed";
      if (!state.weightAssessment.initialAssessmentCompleted)
        return "Tick \"Face to face initial assessment completed and documented\"";
      if (!state.weightAssessment.lifestylePlanAgreed)
        return "Tick \"Patient is willing to follow a reduced-calorie diet and increase physical activity in line with the agreed lifestyle plan\"";
      return null;
    }

    case 3: // Medical History
      return null; // Exclusions are enforced through the stop alerts

    case 4: // Current Medications
      if (state.medications.takesInsulin && !state.medications.insulinDetails.trim())
        return "Enter the Insulin details (type and dose)";
      if (state.medications.currentGLP1 && !state.medications.otherGLP1Details.trim())
        return "Enter the Details of current GLP-1 agonist or insulin secretagogue";
      return null;

    case 5: // Contraindications Review
      return null; // Review only

    case 6: { // Dose Selection
      const ds = state.doseSelection;
      if (!ds.supplyType) return "Select the nature of today's supply";
      if (isContinuingSupply(state)) {
        if (!ds.previousDose) return "Select the Dose the patient has been on";
        if (ds.weeksAtCurrentDose === null || ds.weeksAtCurrentDose < 0)
          return "Enter Weeks on that dose";
        if (ds.initialWeight === null) return "Enter the Weight at initiation (for the 5% rule)";
        if (!ds.treatmentStartDate) return "Enter the Treatment start date";
        if (ds.treatmentStartDate > new Date().toISOString().slice(0, 10))
          return "The Treatment start date is in the future";
        if (ds.monthsOnMaxToleratedDose === null || ds.monthsOnMaxToleratedDose < 0)
          return "Enter Months on the maximum tolerated dose (0 if still titrating)";
      }
      if (!ds.currentDoseStage || !ds.dose) return "Select the Dose to supply (KwikPen strength)";
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
      if (!ds.batchNumber.trim()) return "Enter the Batch number";
      if (ds.expiryDate && ds.expiryDate < new Date().toISOString().slice(0, 10))
        return "The Expiry date is in the past: this pen must not be supplied. Select another pen and enter its batch number and expiry date";
      return null;
    }

    case 7: { // Counselling (PGD v009 cautions, follow-up advice and written information rows)
      const c = state.counselling;
      // Every item that maps to a document row is required; a first
      // injectable supply could be recorded with no injection training
      // (adversarial review, 11 Sep 2026).
      // Named in the words of each label, so the pharmacist knows which box.
      const required: [boolean, string][] = [
        [c.injectionTechnique, "Injection technique explained"],
        [c.injectionSiteRotation, "Injection site rotation explained"],
        [c.storageRefrigeration, "Storage instructions provided"],
        [c.missedDoseProtocol, "Missed dose protocol explained"],
        [c.giSideEffects, "GI side effects, their management and adequate fluid intake discussed"],
        [c.warningSymptoms, "Warning symptoms needing urgent attention explained"],
        [c.pancreatitisWarning, "Pancreatitis warning signs explained"],
        [c.gallbladderWarning, "Gallbladder disease symptoms discussed"],
      ];
      if (state.weightAssessment.comorbidities.includes("type2diabetes")) {
        required.push([c.retinopathyWarning, "Retinopathy monitoring discussed"]);
      }
      required.push(
        [c.oralMedicationAbsorption, "Reduced absorption of oral medicines, oral contraceptives and HRT discussed"],
        [c.anaesthesiaWarning, "General anaesthesia or deep sedation advice given"],
        [c.penDeviceUse, "Pen device use explained"],
        [c.dietExerciseAdvice, "Diet and exercise advice provided"],
        [c.followUpSchedule, "Follow-up schedule arranged"],
        [c.writtenInfoProvided, "Written information given"],
      );
      if (state.medications.t2dmOralAgents) {
        required.push([c.gpInformed, "GP informed"]);
      }
      const missing = required.find(([done]) => !done);
      if (missing) return `Tick "${missing[1]}" once done. Every point is required except where its label says otherwise`;
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

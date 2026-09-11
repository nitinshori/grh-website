import type { PeriodDelayConsultationState } from "./period-delay-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { MAX_TREATMENT_DAYS, parseUkDate, daysFromToday, getPregnancyExclusionError } from "./period-delay-clinical-logic";
import type { Appendix1Key } from "./period-delay-types";

export function validateStep(step: number, state: PeriodDelayConsultationState): string | null {
  switch (step) {
    case 0: {
      // PGD v009: women aged 16 years and over.
      const base = validatePatientStep(state.patient, { minAge: 16 });
      if (base) return base;
      if (state.medicalHistory.femaleConfirmed === null) return "Answer \"Patient is female\" (Yes or No)";
      if (state.medicalHistory.femaleConfirmed === false) return "The patient is not female: this PGD covers women only. Save as not supplied and refer";
      return null;
    }
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      if (!state.assessment.reasonForDelay) return "Select the Reason for period delay";
      if (!state.assessment.datesNeededFor.trim()) return "Enter the Dates the delay is needed for";
      if (!state.assessment.lastPeriodDate) return "Enter the Date of last menstrual period (first day)";
      {
        const lmp = parseUkDate(state.assessment.lastPeriodDate);
        if (!lmp) return "Enter the date of the last period as DD/MM/YYYY";
        if (daysFromToday(lmp) > 0) return "The date of the last period is in the future";
      }
      // The date the next period is due sets the start date, which is the
      // one thing that decides whether the course will work at all.
      if (state.assessment.cycleRegular === null) return "Answer \"Patient has a regular, predictable menstrual cycle\" (Yes or No)";
      if (!state.assessment.expectedPeriodDate) return "Enter When is the next period due? (first day)";
      if (state.assessment.daysUntilExpected === null) return "Enter the date the next period is due as DD/MM/YYYY";
      if (!state.assessment.previousSuppliesLast6Months) return "Select Previous supplies of norethisterone for period delay in the last 6 months";
      if (
        state.assessment.previousSuppliesLast6Months !== "0" &&
        state.assessment.daysSuppliedLast6Months === null
      )
        return "Enter Days of norethisterone supplied in the last 6 months";
      return getPregnancyExclusionError(state);
    case 3: {
      // Appendix 1: ask all eight; record the answers, not only the outcome.
      // An unanswered question is not a "no".
      const a = state.medicalHistory.appendix1;
      const required: [Appendix1Key, string][] = [
        ["q1Dvt", "1. deep vein thrombosis"],
        ["q1Pe", "1. pulmonary embolism"],
        ["q1Stroke", "1. stroke or TIA"],
        ["q1Arterial", "1. heart attack or arterial disease"],
        ["q2Thrombophilia", "2. thrombophilia or family clot under 45"],
        ["q3CurrentSmoker", "3. current smoker"],
        ["q5LongJourney", "5. journey of 4 hours or more"],
        ["q6Surgery", "6. surgery"],
        ["q7Immobility", "7. immobility"],
        ["q8Cancer", "8. cancer"],
      ];
      for (const [key, label] of required) {
        if (a[key] === null) return `Appendix 1 question ${label}: ask and record the answer (yes or no)`;
      }
      if (a.q3CurrentSmoker === false && a.q3StoppedUnderOneYear === null)
        return "Appendix 1 question 3: ask whether she stopped smoking less than a year ago and record the answer";
      // PGD v009: measure or ask for height and weight; do not estimate.
      if (state.medicalHistory.heightCm === null || state.medicalHistory.weightKg === null)
        return "Appendix 1 question 4: height and weight are required so that BMI can be calculated and recorded";
      // A blood pressure of 140/90 or above measured today is an exclusion.
      if (state.medicalHistory.systolicBP === null || state.medicalHistory.diastolicBP === null)
        return "Enter today's blood pressure (Systolic and Diastolic)";
      // 16 and 17 year olds: the competence and safeguarding assessment must be
      // recorded in full before supply. Not an exclusion, so a validator, not a stop.
      const age = state.patient.age;
      if (age !== null && age >= 16 && age < 18) {
        if (!state.medicalHistory.under18AssessmentDone)
          return "Patient is 16 or 17: tick \"Competence assessed and satisfied, and reason for the request explored with the patient alone\"";
        if (state.medicalHistory.under18AssessmentNotes.trim() === "")
          return "Patient is 16 or 17: write the Competence assessment and safeguarding consideration, in full";
      }
      return null;
    }
    case 4:
      return null;
    case 5:
      if (state.medicineSelection.daysToDelay === null || state.medicineSelection.daysToDelay < 1)
        return "Enter the number of days of treatment needed";
      if (state.medicineSelection.daysToDelay > MAX_TREATMENT_DAYS)
        return "Maximum treatment period is 14 days (42 tablets). No extension under this PGD";
      if (!state.medicineSelection.startDate) return "The start date could not be derived: check the date the next period is due on the Assessment step";
      if (!state.medicineSelection.confirmed) return "Tick \"I confirm this treatment is appropriate for this patient\"";
      return null;
    case 6: {
      const c = state.counselling;
      const points: [boolean, string][] = [
        [c.howToTake, "Take one tablet three times a day"],
        [c.startThreeDaysBefore, "Start 3 days before your period is due"],
        [c.maxDuration, "Maximum duration is 14 days and maximum quantity is 42 tablets"],
        [c.periodReturnsAfter, "Your period will usually start 2 to 3 days after you take the last tablet"],
        [c.notContraceptive, "THIS IS NOT CONTRACEPTION"],
        [c.pregnancyTestIfNoPeriod, "If your period does not come within a few days of finishing, do a pregnancy test"],
        [c.mobilityAndHydration, "Move around and keep well hydrated"],
        [c.sideEffects, "Some nausea, headache, breast tenderness, mood change or spotting is common"],
        [c.moodMonitoring, "Mood change is a recognised effect"],
        [c.seekHelpIfUnwell, "Stop the tablets and get medical help the same day for"],
      ];
      const missing = points.find(([done]) => !done);
      if (missing) return `Tick "${missing[1]}" once it has been given. Every point on this step is required`;
      return null;
    }
    case 7:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}
